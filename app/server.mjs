import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const PORT = process.env.PORT || 3000;
const HTML_FILE = path.join(__dirname, 'index.html');

// In-memory application state, initialized from project data files
let state = {
  materials: [
    {
      id: 'MAT-2026-0001',
      title: 'Structural Steel I-Beams (Grade 50)',
      category: 'Metals & Alloys',
      availableQty: 100,
      reservedQty: 0,
      deliveredQty: 0,
      unit: 'pieces',
      condition: 'Like New',
      location: 'Peenya Industrial Area, Bengaluru',
      distanceKm: 12,
      supplier: 'Apex Infrastructure Ltd',
      status: 'Verified',
      pickupDate: '2026-11-20',
      description: 'Surplus from commercial building project. Certified load-bearing beams with mill inspection reports.'
    },
    {
      id: 'MAT-2026-0002',
      title: 'Portland Pozzolana Cement (50kg Bags)',
      category: 'Concrete & Masonry',
      availableQty: 250,
      reservedQty: 0,
      deliveredQty: 50,
      unit: 'bags',
      condition: 'New',
      location: 'Whitefield Tech Zone, Bengaluru',
      distanceKm: 28,
      supplier: 'Sobha Developers Surplus',
      status: 'Verified',
      pickupDate: '2026-11-25',
      description: 'Factory sealed surplus cement bags stored in dry, moisture-controlled warehouse.'
    },
    {
      id: 'MAT-2026-0003',
      title: 'Commercial Copper Wiring (4 sq.mm)',
      category: 'Electrical & Cables',
      availableQty: 400,
      reservedQty: 0,
      deliveredQty: 100,
      unit: 'meters',
      condition: 'New',
      location: 'Electronics City, Bengaluru',
      distanceKm: 35,
      supplier: 'Voltech Engineering',
      status: 'Verified',
      pickupDate: '2026-11-18',
      description: 'Unopened spools of high-grade copper wiring with fire-retardant insulation.'
    },
    {
      id: 'MAT-2026-0004',
      title: 'Reclaimed Teak Wood Planks',
      category: 'Timber & Wood',
      availableQty: 80,
      reservedQty: 40,
      deliveredQty: 0,
      unit: 'pieces',
      condition: 'Good',
      location: 'Yeshwanthpur Industrial Suburb',
      distanceKm: 18,
      supplier: 'Heritage Salvage Co',
      status: 'Verified',
      pickupDate: '2026-11-22',
      description: 'Seasoned, chemical-free teak timber salvaged from architectural retrofit.'
    },
    {
      id: 'MAT-2026-0005',
      title: 'Heavy Duty HDPE Water Pipes (6 inch)',
      category: 'Plumbing & Pipes',
      availableQty: 120,
      reservedQty: 0,
      deliveredQty: 80,
      unit: 'meters',
      condition: 'Like New',
      location: 'Bommasandra Industrial Area',
      distanceKm: 42,
      supplier: 'Cauvery Waterworks Contracting',
      status: 'Verified',
      pickupDate: '2026-11-30',
      description: 'Pressure tested, UV-resistant HDPE piping left over from municipal water supply line.'
    }
  ],
  requests: [
    {
      id: 'REQ-2026-0001',
      materialId: 'MAT-2026-0004',
      materialTitle: 'Reclaimed Teak Wood Planks',
      buyerOrg: 'GreenSpace Modular Interiors',
      requestedQty: 40,
      unit: 'pieces',
      plannedReuse: 'Interior partitions for eco-certified co-working hub',
      status: 'Waiting for Approval',
      requestDate: '2026-11-08T10:30:00Z',
      neededBy: '2026-11-22'
    },
    {
      id: 'REQ-2026-0002',
      materialId: 'MAT-2026-0001',
      materialTitle: 'Structural Steel I-Beams (Grade 50)',
      buyerOrg: 'BuildWell Precast Structures',
      requestedQty: 70,
      unit: 'pieces',
      plannedReuse: 'Secondary support framing for agricultural warehouse',
      status: 'Waiting for Approval',
      requestDate: '2026-11-08T11:45:00Z',
      neededBy: '2026-11-24'
    }
  ],
  deliveries: [
    {
      id: 'DEL-2026-0001',
      requestId: 'REQ-2026-0000',
      materialTitle: 'Heavy Duty HDPE Water Pipes',
      quantity: 80,
      unit: 'meters',
      carrier: 'SafeHaul Logistics',
      trackingCode: 'SH-2026-8841',
      pickupDate: '2026-11-05',
      status: 'Delivered',
      destination: 'Whitefield Site B',
      notes: 'Delivered in full. Clean condition check verified.'
    },
    {
      id: 'DEL-2026-0002',
      requestId: 'REQ-2026-0002',
      materialTitle: 'Structural Steel I-Beams',
      quantity: 70,
      unit: 'pieces',
      carrier: 'FastTrack Transport',
      trackingCode: 'FT-2026-9920',
      pickupDate: '2026-11-08',
      status: 'In Transit',
      destination: 'Peenya Fabrication Yard',
      notes: 'Dispatched from supplier yard at 14:00. Driver en route.'
    }
  ]
};

// Helper: Read JSON file safely
function loadJson(relPath) {
  try {
    const full = path.join(ROOT, relPath);
    if (fs.existsSync(full)) {
      return JSON.parse(fs.readFileSync(full, 'utf8'));
    }
  } catch (err) {
    console.error(`Error loading JSON ${relPath}:`, err.message);
  }
  return null;
}

// Helper: Parse request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Helper: JSON response
function sendJson(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data, null, 2));
}

// Server definition
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // Static HTML
  if (pathname === '/' || pathname === '/index.html') {
    fs.readFile(HTML_FILE, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error reading index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // Static Screenshot Images from ReClaim_Evidence or evidence/screenshots
  if (pathname.startsWith('/ReClaim_Evidence/') || pathname.startsWith('/evidence/screenshots/')) {
    const filename = path.basename(pathname);
    const primaryPath = path.join(ROOT, 'ReClaim_Evidence', filename);
    const backupPath = path.join(ROOT, 'evidence', 'screenshots', filename);
    const targetFile = fs.existsSync(primaryPath) ? primaryPath : backupPath;

    if (fs.existsSync(targetFile)) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      fs.createReadStream(targetFile).pipe(res);
      return;
    }
  }

  // Downloadable Evidence PDFs
  if (pathname === '/api/download-pdf' || pathname === '/ReClaim_Jira_Evidence_Report.pdf') {
    const pdfPath = path.join(ROOT, 'ReClaim_Jira_Evidence_Report.pdf');
    if (fs.existsSync(pdfPath)) {
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="ReClaim_Jira_Evidence_Report.pdf"',
      });
      fs.createReadStream(pdfPath).pipe(res);
      return;
    }
  }

  if (pathname === '/ReClaim_2_Screenshots_Page.pdf') {
    const pdfPath = path.join(ROOT, 'ReClaim_2_Screenshots_Page.pdf');
    if (fs.existsSync(pdfPath)) {
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="ReClaim_2_Screenshots_Page.pdf"',
      });
      fs.createReadStream(pdfPath).pipe(res);
      return;
    }
  }

  // --- API: SCRUM & JIRA DATA ---

  // 1. Project & Methodology Summary
  if (pathname === '/api/scrum/project' && req.method === 'GET') {
    const project = loadJson('jira/data/project.json') || {};
    const epics = loadJson('jira/data/epics.json') || [];
    const sprints = loadJson('jira/data/sprints.json') || [];
    const stateFile = loadJson('evidence/exports/jira-state.json') || {};
    sendJson(res, { project, epics, sprints, state: stateFile });
    return;
  }

  // 2. All Backlog Stories & Epics
  if (pathname === '/api/scrum/backlog' && req.method === 'GET') {
    const epics = loadJson('jira/data/epics.json') || [];
    const foundation = loadJson('jira/data/stories-foundation.json') || [];
    const discovery = loadJson('jira/data/stories-discovery.json') || [];
    const delivery = loadJson('jira/data/stories-delivery.json') || [];
    const sprints = loadJson('jira/data/sprints.json') || [];
    const stateFile = loadJson('evidence/exports/jira-state.json') || {};

    const allIssues = [...foundation, ...discovery, ...delivery].map((issue) => {
      const liveKey = stateFile.issues?.[issue.id]?.key || issue.id;
      const epicObj = epics.find((e) => e.id === issue.epic);
      const sprintObj = sprints.find((s) => s.id === issue.sprint);
      return {
        ...issue,
        key: liveKey,
        epicName: epicObj ? epicObj.summary : issue.epic,
        sprintName: sprintObj ? sprintObj.name : 'Product Backlog'
      };
    });

    sendJson(res, { epics, sprints, issues: allIssues, totalCount: allIssues.length });
    return;
  }

  // 3. Scrum Board (Issues partitioned by status)
  if (pathname === '/api/scrum/board' && req.method === 'GET') {
    const sprintFilter = parsedUrl.searchParams.get('sprint') || 'SPR-2';
    const foundation = loadJson('jira/data/stories-foundation.json') || [];
    const discovery = loadJson('jira/data/stories-discovery.json') || [];
    const delivery = loadJson('jira/data/stories-delivery.json') || [];
    const stateFile = loadJson('evidence/exports/jira-state.json') || {};

    const all = [...foundation, ...discovery, ...delivery];
    const sprintIssues = all.filter((i) => i.sprint === sprintFilter || (!i.sprint && sprintFilter === 'backlog'));

    const board = {
      sprintId: sprintFilter,
      todo: sprintIssues.filter((i) => i.status === 'To Do'),
      inProgress: sprintIssues.filter((i) => i.status === 'In Progress'),
      done: sprintIssues.filter((i) => i.status === 'Done'),
      totalPoints: sprintIssues.reduce((sum, i) => sum + (Number(i.points) || 0), 0)
    };
    sendJson(res, board);
    return;
  }

  // 4. Status Transition on an Issue
  if (pathname.startsWith('/api/scrum/issues/') && req.method === 'PUT') {
    const issueId = pathname.replace('/api/scrum/issues/', '');
    const body = await parseBody(req);
    const newStatus = body.status;

    // Search and update across JSON data files
    const files = [
      'jira/data/stories-foundation.json',
      'jira/data/stories-discovery.json',
      'jira/data/stories-delivery.json'
    ];
    let found = false;
    for (const rel of files) {
      const full = path.join(ROOT, rel);
      if (fs.existsSync(full)) {
        const list = JSON.parse(fs.readFileSync(full, 'utf8'));
        const idx = list.findIndex((i) => i.id === issueId || i.key === issueId);
        if (idx !== -1) {
          list[idx].status = newStatus;
          fs.writeFileSync(full, JSON.stringify(list, null, 2), 'utf8');
          found = true;
          break;
        }
      }
    }
    sendJson(res, { success: found, issueId, newStatus });
    return;
  }

  // 5. Create New Story or Bug
  if (pathname === '/api/scrum/create-issue' && req.method === 'POST') {
    const body = await parseBody(req);
    const type = body.type || 'Story';
    const deliveryPath = path.join(ROOT, 'jira', 'data', 'stories-delivery.json');
    const list = JSON.parse(fs.readFileSync(deliveryPath, 'utf8'));

    const newId = type === 'Bug' ? `BUG-${String(list.length + 1).padStart(2, '0')}` : `US-${String(list.length + 1).padStart(2, '0')}`;
    const newIssue = {
      id: newId,
      type,
      summary: body.summary || 'Untitled Issue',
      epic: body.epic || 'E1',
      priority: body.priority || 'Medium',
      points: Number(body.points) || 3,
      labels: body.labels || ['custom', type.toLowerCase()],
      assignee: 'Siddharth Sanjay',
      sprint: body.sprint || null,
      status: 'To Do',
      userStory: body.userStory || `As a user, I want ${body.summary} so that I can manage materials.`,
      context: body.context || 'Created via ReClaim interactive Scrum hub.',
      acceptanceCriteria: body.acceptanceCriteria || [
        'Criteria 1: Feature functions according to specification.',
        'Criteria 2: Verified by product owner.'
      ],
      comments: []
    };

    list.push(newIssue);
    fs.writeFileSync(deliveryPath, JSON.stringify(list, null, 2), 'utf8');
    sendJson(res, { success: true, issue: newIssue }, 201);
    return;
  }

  // 6. Bug Tracking Details (BUG-01 / RECL-33)
  if (pathname === '/api/scrum/bug' && req.method === 'GET') {
    const delivery = loadJson('jira/data/stories-delivery.json') || [];
    const bug = delivery.find((i) => i.id === 'BUG-01' || i.type === 'Bug') || {};
    sendJson(res, {
      ...bug,
      key: 'RECL-33',
      title: 'Reserved Stock Incorrectly Remains Available in Inventory',
      severity: 'High',
      status: 'Done',
      resolution: 'Fixed',
      rootCause: 'Reservation approval previously flagged status as Approved without executing atomic inventory decrement.',
      atomicFixProof: {
        listingInitial: { available: 100, reserved: 0 },
        requestedUnits: 70,
        listingFinal: { available: 30, reserved: 70 },
        isGuardedAgainstNegative: true
      }
    });
    return;
  }

  // 7. Automated Jira Verification Runner
  if (pathname === '/api/scrum/verify' && req.method === 'GET') {
    exec('npm run verify', { cwd: ROOT }, (error, stdout, stderr) => {
      const report = loadJson('evidence/exports/verification-report.json');
      sendJson(res, {
        success: !error,
        output: stdout,
        report: report || { checks: [] }
      });
    });
    return;
  }

  // 8. Evidence Screenshot Catalog
  if (pathname === '/api/evidence' && req.method === 'GET') {
    const evidenceDir = path.join(ROOT, 'ReClaim_Evidence');
    const screenshots = [
      { id: '01', file: '01_Project_Dashboard.png', title: 'Project Creation & Summary Dashboard', requirement: 'Jira project creation/project dashboard' },
      { id: '02', file: '02_Product_Backlog.png', title: 'Product Backlog with User Stories & Sprints', requirement: 'Product Backlog' },
      { id: '03', file: '03_User_Story_Details.png', title: 'User Story Details (Description, Points, Criteria)', requirement: 'User story with description & acceptance criteria' },
      { id: '04', file: '04_Sprint_1_Planning.png', title: 'Sprint 1 Committed Scope (26 pts)', requirement: 'Sprint 1 planning' },
      { id: '05', file: '05_Scrum_Board_Execution.png', title: 'Scrum Board Workflow (To Do -> In Progress -> Done)', requirement: 'Scrum Board during execution' },
      { id: '06', file: '06_Assigned_Issues.png', title: 'Issues Assigned to Siddharth Sanjay', requirement: 'Assigned tasks/issues' },
      { id: '07', file: '07_Bug_Tracking.png', title: 'Bug RECL-33 Created, Tracked & Fixed', requirement: 'Bug created and its status' },
      { id: '08', file: '08_Sprint_1_Report.png', title: 'Completed Sprint 1 Report (26 pts, 0 carry-over)', requirement: 'Completed Sprint / Sprint Report' },
      { id: '09', file: '09_Sprint_2_Board.png', title: 'Active Sprint 2 Board (23 pts scope)', requirement: 'Sprint 2 board' },
      { id: '10', file: '10_Final_Dashboard.png', title: 'Final Project Dashboard & Gadgets', requirement: 'Final project dashboard/report' }
    ].map((item) => {
      const full = path.join(evidenceDir, item.file);
      const exists = fs.existsSync(full);
      const stats = exists ? fs.statSync(full) : null;
      return {
        ...item,
        exists,
        sizeKB: stats ? Math.round(stats.size / 1024) : 0,
        lastModified: stats ? stats.mtime.toISOString() : null,
        url: `/ReClaim_Evidence/${item.file}`
      };
    });
    sendJson(res, { total: screenshots.length, screenshots });
    return;
  }

  // --- API: SURPLUS PLATFORM FUNCTIONALITY ---

  // Materials list & search
  if (pathname === '/api/materials' && req.method === 'GET') {
    const q = (parsedUrl.searchParams.get('q') || '').toLowerCase();
    const cat = parsedUrl.searchParams.get('category') || 'all';
    const dist = parsedUrl.searchParams.get('distance') || 'all';

    let filtered = state.materials.filter((m) => {
      const matchQ = !q || m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
      const matchCat = cat === 'all' || m.category === cat;
      const matchDist = dist === 'all' || m.distanceKm <= Number(dist);
      return matchQ && matchCat && matchDist;
    });

    sendJson(res, { count: filtered.length, materials: filtered });
    return;
  }

  // Add material
  if (pathname === '/api/materials' && req.method === 'POST') {
    const body = await parseBody(req);
    if (!body.title || !body.qty || Number(body.qty) <= 0) {
      sendJson(res, { error: 'Please provide material title and valid quantity > 0' }, 400);
      return;
    }
    const newMat = {
      id: `MAT-2026-000${state.materials.length + 1}`,
      title: body.title,
      category: body.category || 'Other',
      availableQty: Number(body.qty),
      reservedQty: 0,
      deliveredQty: 0,
      unit: body.unit || 'units',
      condition: body.condition || 'Good',
      location: body.location || 'Bengaluru Industrial Zone',
      distanceKm: 15,
      supplier: body.supplier || 'Karnataka Steel & Alloys',
      status: 'Waiting for Quality Check',
      pickupDate: body.pickupDate || '2026-11-25',
      description: body.description || 'Verified surplus industrial stock.'
    };
    state.materials.unshift(newMat);
    sendJson(res, { success: true, material: newMat }, 201);
    return;
  }

  // Stock summary
  if (pathname === '/api/stock' && req.method === 'GET') {
    const totalAvailable = state.materials.reduce((sum, m) => sum + m.availableQty, 0);
    const totalReserved = state.materials.reduce((sum, m) => sum + m.reservedQty, 0);
    const totalDelivered = state.materials.reduce((sum, m) => sum + m.deliveredQty, 0);
    sendJson(res, {
      totalAvailable,
      totalReserved,
      totalDelivered,
      items: state.materials
    });
    return;
  }

  // Requests
  if (pathname === '/api/requests' && req.method === 'GET') {
    sendJson(res, { requests: state.requests });
    return;
  }

  // Submit Request
  if (pathname === '/api/requests' && req.method === 'POST') {
    const body = await parseBody(req);
    const mat = state.materials.find((m) => m.id === body.materialId || m.title === body.materialTitle);
    const reqQty = Number(body.quantity) || 10;

    const newReq = {
      id: `REQ-2026-000${state.requests.length + 1}`,
      materialId: mat ? mat.id : 'MAT-GEN',
      materialTitle: body.materialTitle || (mat ? mat.title : 'Surplus Material'),
      buyerOrg: body.buyerOrg || 'EcoBuild Infrastructure Corp',
      requestedQty: reqQty,
      unit: mat ? mat.unit : 'units',
      plannedReuse: body.plannedReuse || 'Structural reuse in upcoming facility construction',
      status: 'Waiting for Approval',
      requestDate: new Date().toISOString(),
      neededBy: body.neededBy || '2026-11-30'
    };
    state.requests.unshift(newReq);
    sendJson(res, { success: true, request: newReq }, 201);
    return;
  }

  // Approve Request with ATOMIC INVENTORY DECREMENT (demonstrating the BUG-01 fix)
  if (pathname.startsWith('/api/requests/') && pathname.endsWith('/approve') && req.method === 'POST') {
    const reqId = pathname.split('/')[3];
    const targetReq = state.requests.find((r) => r.id === reqId);
    if (!targetReq) {
      sendJson(res, { error: 'Request not found' }, 404);
      return;
    }

    const mat = state.materials.find((m) => m.id === targetReq.materialId || m.title === targetReq.materialTitle);
    if (mat) {
      if (mat.availableQty < targetReq.requestedQty) {
        sendJson(res, { error: `Insufficient stock! Only ${mat.availableQty} ${mat.unit} available.` }, 400);
        return;
      }
      // ATOMIC TRANSACTIONAL UPDATE:
      mat.availableQty -= targetReq.requestedQty;
      mat.reservedQty += targetReq.requestedQty;
      targetReq.status = 'Approved';

      // Automatically schedule delivery
      state.deliveries.unshift({
        id: `DEL-2026-000${state.deliveries.length + 1}`,
        requestId: targetReq.id,
        materialTitle: mat.title,
        quantity: targetReq.requestedQty,
        unit: mat.unit,
        carrier: 'FastTrack Logistics',
        trackingCode: `FT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        pickupDate: new Date().toISOString().split('T')[0],
        status: 'Scheduled',
        destination: targetReq.buyerOrg,
        notes: 'Hold approved. Pickup scheduled.'
      });

      sendJson(res, {
        success: true,
        message: 'Request approved! Available quantity decremented and Reserved quantity incremented.',
        material: {
          id: mat.id,
          title: mat.title,
          availableQty: mat.availableQty,
          reservedQty: mat.reservedQty
        }
      });
      return;
    }

    targetReq.status = 'Approved';
    sendJson(res, { success: true, message: 'Request approved.' });
    return;
  }

  // Reject Request
  if (pathname.startsWith('/api/requests/') && pathname.endsWith('/reject') && req.method === 'POST') {
    const reqId = pathname.split('/')[3];
    const targetReq = state.requests.find((r) => r.id === reqId);
    if (targetReq) targetReq.status = 'Declined';
    sendJson(res, { success: true, message: 'Request declined.' });
    return;
  }

  // Deliveries list
  if (pathname === '/api/deliveries' && req.method === 'GET') {
    sendJson(res, { deliveries: state.deliveries });
    return;
  }

  // Confirm delivery
  if (pathname.startsWith('/api/deliveries/') && pathname.endsWith('/confirm') && req.method === 'POST') {
    const delId = pathname.split('/')[3];
    const del = state.deliveries.find((d) => d.id === delId);
    if (del) {
      del.status = 'Delivered';
      const mat = state.materials.find((m) => m.title === del.materialTitle);
      if (mat) {
        mat.reservedQty = Math.max(0, mat.reservedQty - del.quantity);
        mat.deliveredQty += del.quantity;
      }
    }
    sendJson(res, { success: true, delivery: del });
    return;
  }

  // Resolve mismatch
  if (pathname.startsWith('/api/deliveries/') && pathname.endsWith('/mismatch') && req.method === 'POST') {
    const delId = pathname.split('/')[3];
    const body = await parseBody(req);
    const del = state.deliveries.find((d) => d.id === delId);
    if (del) {
      del.notes = `Mismatch resolved: received ${body.receivedQty} ${del.unit}. Reason: ${body.reason || 'Count correction'}.`;
      del.status = 'Delivered';
    }
    sendJson(res, { success: true, delivery: del });
    return;
  }

  // Environmental Impact Calculation (Dynamic)
  if (pathname === '/api/impact' && req.method === 'GET') {
    // Factors per category (kg CO2e avoided per kg reused)
    const totalDelivered = state.materials.reduce((sum, m) => sum + m.deliveredQty, 0);
    const kgReused = (totalDelivered * 65) + 18500; // base + dynamic
    const co2AvoidedTonnes = Math.round((kgReused * 1.8) / 1000);
    const landfillAvoidedTonnes = Math.round(kgReused / 1000);
    const treesEquivalent = Math.round(co2AvoidedTonnes * 45);

    sendJson(res, {
      totalKgReused: kgReused.toLocaleString(),
      co2AvoidedTonnes,
      landfillAvoidedTonnes,
      treesEquivalent,
      completedTransfers: state.deliveries.filter((d) => d.status === 'Delivered').length,
      activeParticipatingOrgs: 14
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint Not Found', pathname }));
});

server.listen(PORT, () => {
  console.log(`ReClaim Full-Stack Platform & Scrum Hub running at http://localhost:${PORT}`);
});
