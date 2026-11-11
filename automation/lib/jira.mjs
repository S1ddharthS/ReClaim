const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class JiraError extends Error {
  constructor(method, path, status, body) {
    const detail =
      body && typeof body === 'object'
        ? JSON.stringify(body.errorMessages || body.errors || body, null, 2)
        : String(body || '');
    super(`Jira ${method} ${path} failed with HTTP ${status}${detail ? `\n${detail}` : ''}`);
    this.name = 'JiraError';
    this.status = status;
    this.body = body;
    this.path = path;
  }
}

export class JiraClient {
  constructor({ baseUrl, email, token, cookie, xsrfToken }) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.email = email;
    this.token = token;
    this.cookie = cookie || '';
    this.auth = token ? Buffer.from(`${email}:${token}`, 'utf8').toString('base64') : '';
    this.xsrfToken = xsrfToken || this.extractXsrf(cookie);
    this.requestCount = 0;
  }

  extractXsrf(cookie) {
    if (!cookie) return '';
    const match = cookie.match(/(?:^|;\s*)atlassian\.xsrf\.token=([^;]+)/);
    return match ? match[1] : '';
  }

  authHeaders(method) {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Atlassian-Token': 'no-check',
    };
    if (this.cookie) {
      headers.Cookie = this.cookie;
      headers.Origin = this.baseUrl;
      if (method !== 'GET' && this.xsrfToken) {
        headers['X-XSRF-TOKEN'] = this.xsrfToken;
      }
    } else {
      headers.Authorization = `Basic ${this.auth}`;
    }
    return headers;
  }

  url(pathname, query) {
    const url = new URL(this.baseUrl + pathname);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === '') continue;
        url.searchParams.set(key, String(value));
      }
    }
    return url;
  }

  async request(method, pathname, { body, query, retries = 4 } = {}) {
    let attempt = 0;
    while (true) {
      attempt += 1;
      const url = this.url(pathname, query);
      let response;
      try {
        response = await fetch(url, {
          method,
          headers: this.authHeaders(method),
          body: body === undefined ? undefined : JSON.stringify(body),
        });
      } catch (error) {
        if (attempt <= retries) {
          await sleep(800 * attempt);
          continue;
        }
        throw new Error(`Network error calling ${method} ${pathname}: ${error.message}`);
      }
      this.requestCount += 1;
      const text = await response.text();
      let parsed = null;
      if (text) {
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
      }
      if (response.ok) return parsed;

      if ([401, 403].includes(response.status) && this.cookie) {
        throw new JiraError(
          method,
          pathname,
          response.status,
          'Browser session cookie was rejected. Re-run `node automation/export-cookies.mjs` to refresh it.'
        );
      }

      const retryAfter = Number(response.headers.get('retry-after') || 0);
      const transient =
        response.status === 429 ||
        (method === 'GET' && [502, 503, 504].includes(response.status));
      if (transient && attempt <= retries) {
        await sleep(retryAfter > 0 ? retryAfter * 1000 : 1000 * attempt);
        continue;
      }
      throw new JiraError(method, pathname, response.status, parsed);
    }
  }

  get(pathname, options = {}) {
    return this.request('GET', pathname, options);
  }

  post(pathname, body, options = {}) {
    return this.request('POST', pathname, { ...options, body });
  }

  put(pathname, body, options = {}) {
    return this.request('PUT', pathname, { ...options, body });
  }

  delete(pathname, options = {}) {
    return this.request('DELETE', pathname, options);
  }

  async myself() {
    return this.get('/rest/api/3/myself');
  }

  async getProject(key) {
    try {
      return await this.get(`/rest/api/3/project/${encodeURIComponent(key)}`);
    } catch (error) {
      if (error instanceof JiraError && error.status === 404) return null;
      throw error;
    }
  }

  async search(jql, fields = ['summary'], maxResults = 100) {
    const issues = [];
    let nextPageToken;
    do {
      const result = await this.get('/rest/api/3/search/jql', {
        query: {
          jql,
          fields: fields.join(','),
          maxResults,
          nextPageToken,
        },
      });
      issues.push(...(result.issues || []));
      nextPageToken = result.nextPageToken;
      if (!result.isLast && !nextPageToken) break;
    } while (nextPageToken);
    return issues;
  }

  async addComment(issueKey, text) {
    const existing = await this.get(`/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`, {
      query: { maxResults: 100 },
    });
    const already = (existing.comments || []).some((comment) => {
      const content = comment.body?.content || [];
      const flat = JSON.stringify(content);
      return flat.includes(text.slice(0, 80));
    });
    if (already) return { skipped: true };
    const body = {
      body: {
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
      },
    };
    return this.post(`/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`, body);
  }
}
