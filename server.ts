import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Persistent App State Storage in data/app_state.json and uploads in data/uploads
const DATA_DIR = path.resolve(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'app_state.json');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('[Server] Could not create data directory:', err);
  }
}

if (!fs.existsSync(UPLOAD_DIR)) {
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    console.warn('[Server] Could not create uploads directory:', err);
  }
}

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOAD_DIR));

// Initial seed state to ensure mobile / fresh devices always get complete state immediately
const DEFAULT_INITIAL_STATE = {
  version: 1,
  exportedAt: new Date().toISOString(),
  pushedAt: 1,
  sourceDevice: '시스템 서버 초기값',
  students: [
    {
      id: 'stu_1',
      name: '김태완',
      registeredAt: '2026-10-01T09:00:00Z',
      status: 'approved',
      totalStudySeconds: 174330,
      todayStudySeconds: 12600,
      lastStudiedAt: '2026-10-17T08:30:00Z',
    },
    {
      id: 'stu_2',
      name: '이지은',
      registeredAt: '2026-10-03T11:20:00Z',
      status: 'approved',
      totalStudySeconds: 141130,
      todayStudySeconds: 9800,
      lastStudiedAt: '2026-10-17T07:45:00Z',
    },
    {
      id: 'stu_3',
      name: '박민우',
      registeredAt: '2026-10-05T14:10:00Z',
      status: 'approved',
      totalStudySeconds: 114300,
      todayStudySeconds: 7200,
      lastStudiedAt: '2026-10-16T22:10:00Z',
    },
    {
      id: 'stu_4',
      name: '최소연',
      registeredAt: '2026-10-08T16:00:00Z',
      status: 'approved',
      totalStudySeconds: 87020,
      todayStudySeconds: 5400,
      lastStudiedAt: '2026-10-16T19:00:00Z',
    },
    {
      id: 'stu_5',
      name: '윤성호',
      registeredAt: '2026-10-10T10:30:00Z',
      status: 'approved',
      totalStudySeconds: 67800,
      todayStudySeconds: 3600,
      lastStudiedAt: '2026-10-15T21:00:00Z',
    },
    {
      id: 'stu_pending_1',
      name: '한정민',
      registeredAt: '2026-10-17T08:15:00Z',
      status: 'pending',
      totalStudySeconds: 0,
      todayStudySeconds: 0,
    },
  ],
  adminSettings: {
    appKoreanName: '스피드토익 수강생 전용 타이머',
    appEnglishName: 'SPEED TOEIC TIMER',
    showAppBadge: false,
    headerSubtitle: '토익 고사장 아날로그 시계 체화 & 실시간 누적 순공 관리',
    showSubtitle: true,
    bannerTag: 'SPEED TOEIC MOTIVATION',
    showBannerTag: true,
    homeGreetingQuote: '실전은 스피드다!',
    showHomeGreeting: true,
    homeSubQuote: '시험장 아날로그 시계와 동일한 시각적 훈련으로 마킹까지 완벽 대비',
    showHomeSubQuote: true,
    appLogoUrl: '',
    clockCenterLogoUrl: '',
    backgroundImageUrl: '',
    backgroundOverlayOpacity: 0.8,
    adminPasswordHash: 'admin1234',
    uiCardStyle: 'slate',
    uiFontSize: 'normal',
    uiTextColor: 'pure_white',
    uiAccentColor: 'blue',
    blockOrder: ['banner', 'podium', 'preset_timers', 'custom_timer', 'notices'],
  },
  presetTimers: [
    {
      id: 'pre_rc_marking',
      name: 'RC 75분 실전 (마킹 포함)',
      description: 'Part 5, 6, 7 풀이 + OMR 마킹 5분 포함 표준 시험 배분',
      durationMinutes: 75,
      category: 'RC',
      includeMarking: true,
    },
    {
      id: 'pre_rc_nomarking',
      name: 'RC 70분 타이트 (마킹 미포함)',
      description: '순수 문제 풀이만 70분 이내에 끝내는 고득점 타이트 훈련',
      durationMinutes: 70,
      category: 'RC',
      includeMarking: false,
    },
    {
      id: 'pre_full_marking',
      name: 'LC + RC 120분 전과목 풀세트 (마킹 포함)',
      description: 'LC 45분 + RC 75분 총 200문항 풀세트 실전 고사장 시뮬레이션',
      durationMinutes: 120,
      category: 'LC+RC',
      includeMarking: true,
    },
    {
      id: 'pre_full_nomarking',
      name: 'LC + RC 115분 전과목 (마킹 미포함)',
      description: '마킹 시간 제외 115분 내 전 문항 완벽 격파 연습',
      durationMinutes: 115,
      category: 'LC+RC',
      includeMarking: false,
    },
    {
      id: 'pre_part56',
      name: 'Part 5 & 6 스피드 20분',
      description: '문법 어휘 46문항을 20분(문항당 20~25초) 안에 주파',
      durationMinutes: 20,
      category: 'PART',
      includeMarking: false,
    },
    {
      id: 'pre_part7',
      name: 'Part 7 독해 집중 55분',
      description: '단일지문 + 이중지문 + 삼중지문 54문항 집중 타임어택',
      durationMinutes: 55,
      category: 'PART',
      includeMarking: true,
    },
  ],
  notices: [
    {
      id: 'not_1',
      title: '📢 10월 정기 토익 시험 대비 실전 아날로그 타이머 훈련 안내',
      content: '실제 토익 고사장은 디지털 시계 반입이 금지되어 있습니다. 스토 타이머의 아날로그 시계 시침/분침 감각으로 15분 단위(Part 5,6 20분컷, Part 7 55분컷)를 체화하세요.',
      category: '필독',
      createdAt: '2026-10-15',
      isPinned: true,
    },
    {
      id: 'not_2',
      title: '⏱️ 화면 이탈 감지 기능 탑재 안내 (딴짓 방지)',
      content: '공부 중 브라우저 탭을 전환하거나 다른 앱을 열면 타이머가 자동으로 일시정지됩니다. 정직하고 온전한 순공 시간을 측정해보세요.',
      category: '공지',
      createdAt: '2026-10-16',
      isPinned: true,
    },
    {
      id: 'not_3',
      title: '🏆 주간 누적 순공 시간 TOP 3 장학 혜택 이벤트',
      content: '이번 주 일요일 자정 기준 TOP 3에 랭크된 수강생 전원에게 모의고사 해설 특강 무료 수강권과 토익 보카 시크릿 노트를 증정합니다.',
      category: '이벤트',
      createdAt: '2026-10-17',
      isPinned: false,
    },
  ],
  studentSettings: {
    showSecondHand: true,
    clockStyle: 'classic',
    themeColor: 'blue',
  },
};

let currentAppState: any = null;

if (fs.existsSync(STATE_FILE)) {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    currentAppState = JSON.parse(raw);
    console.log('[Server] Loaded persisted app state from file');
  } catch (err) {
    console.warn('[Server] Failed to read app_state.json:', err);
    currentAppState = DEFAULT_INITIAL_STATE;
  }
} else {
  currentAppState = DEFAULT_INITIAL_STATE;
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(DEFAULT_INITIAL_STATE, null, 2), 'utf-8');
    console.log('[Server] Initialized default app state file');
  } catch (err) {
    console.warn('[Server] Could not write initial app state:', err);
  }
}

// SSE (Server-Sent Events) clients registry for cross-device real-time sync
interface SSEClient {
  id: string;
  res: express.Response;
}

let sseClients: SSEClient[] = [];

// Send keep-alive comments every 15 seconds to prevent mobile carrier / proxy timeout
setInterval(() => {
  const comment = ': keep-alive\n\n';
  sseClients = sseClients.filter((client) => {
    try {
      client.res.write(comment);
      if (typeof (client.res as any).flush === 'function') {
        (client.res as any).flush();
      }
      return true;
    } catch {
      return false;
    }
  });
}, 15000);

// SSE stream endpoint
app.get('/api/sync/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
  });
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  // Send immediate comment to satisfy browser connection and fire onopen instantly
  res.write(': connected\n\n');
  if (typeof (res as any).flush === 'function') {
    (res as any).flush();
  }

  const clientId = (req.query.clientId as string) || `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newClient: SSEClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send current state immediately on connect
  if (currentAppState) {
    try {
      const isAdmin = checkAdminAuth(req);
      const payload = sanitizeStateForClient(currentAppState, isAdmin);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    } catch {}
  }

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c !== newClient);
  });
  res.on('error', () => {
    sseClients = sseClients.filter((c) => c !== newClient);
  });
});

const APP_VERSION = '2.1.0';
const APP_BUILD_TIME = Date.now();

// Helper to persist app state safely to disk
function persistAppState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(currentAppState, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server] Failed to persist sync state to file:', err);
  }
}

// Helper to sanitize state for unauthenticated or student clients
function sanitizeStateForClient(state: any, isAdmin: boolean) {
  if (!state) return state;
  if (isAdmin) return state;
  return {
    ...state,
    adminSettings: state.adminSettings
      ? {
          ...state.adminSettings,
          adminPasswordHash: '***PROTECTED***',
        }
      : state.adminSettings,
  };
}

// Broadcast message to all connected SSE clients (optionally excluding sender)
function broadcastToClients(data: any, excludeClientId?: string): number {
  let count = 0;
  sseClients = sseClients.filter((client) => {
    if (excludeClientId && client.id === excludeClientId) {
      return true; // Keep client in array, just don't send self-echo
    }
    try {
      const payload = sanitizeStateForClient(data, false);
      const message = `data: ${JSON.stringify(payload)}\n\n`;
      client.res.write(message);
      if (typeof (client.res as any).flush === 'function') {
        (client.res as any).flush();
      }
      count++;
      return true;
    } catch (err) {
      console.warn('[Server] Dead client removed during broadcast:', client.id);
      return false;
    }
  });
  return count;
}

// Check admin credentials from headers, body, or query
function checkAdminAuth(req: express.Request): boolean {
  const currentPassword = currentAppState?.adminSettings?.adminPasswordHash || 'admin1234';
  const headerPw = req.headers['x-admin-password'];
  const bodyPw = req.body?.adminPassword;
  const authHeader = req.headers['authorization'];
  let bearerToken = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.substring(7).trim();
  }
  const queryPw = req.query?.adminPass as string | undefined;

  return (
    (typeof headerPw === 'string' && headerPw.trim() === currentPassword) ||
    (typeof bodyPw === 'string' && bodyPw.trim() === currentPassword) ||
    (bearerToken === currentPassword) ||
    (typeof queryPw === 'string' && queryPw.trim() === currentPassword)
  );
}

// GET App Version & Build info for client update detection
app.get('/api/version', (req, res) => {
  res.json({
    success: true,
    version: APP_VERSION,
    buildTime: APP_BUILD_TIME,
    serverTime: Date.now(),
    pushedAt: currentAppState?.pushedAt || null,
  });
});

// POST Admin Login / Verification endpoint
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  const currentPassword = currentAppState?.adminSettings?.adminPasswordHash || 'admin1234';
  if (password === currentPassword) {
    return res.json({
      success: true,
      message: '관리자 인증에 성공했습니다.',
      token: currentPassword,
    });
  }
  return res.status(401).json({
    success: false,
    message: '관리자 비밀번호가 일치하지 않습니다.',
  });
});

// POST Admin Change Password endpoint
app.post('/api/admin/change-password', (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(403).json({
      success: false,
      message: '현재 관리자 권한 인증이 필요합니다. 비밀번호를 확인해주세요.',
    });
  }
  const { newPassword } = req.body || {};
  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
    return res.status(400).json({
      success: false,
      message: '새 비밀번호는 최소 4자리 이상이어야 합니다.',
    });
  }

  currentAppState.adminSettings.adminPasswordHash = newPassword.trim();
  currentAppState.pushedAt = Date.now();
  currentAppState.sourceDevice = 'PC 관리자 (비밀번호 변경)';
  persistAppState();
  broadcastToClients(currentAppState);

  return res.json({
    success: true,
    message: '관리자 비밀번호가 성공적으로 변경되었습니다.',
  });
});

// POST Student Self-Registration endpoint
app.post('/api/students/register', (req, res) => {
  const { name } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, message: '수강생 이름을 입력해주세요.' });
  }

  const trimmedName = name.trim();
  const newStudent = {
    id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: trimmedName,
    registeredAt: new Date().toISOString(),
    status: 'pending',
    totalStudySeconds: 0,
    todayStudySeconds: 0,
  };

  currentAppState.students = [...(currentAppState.students || []), newStudent];
  currentAppState.pushedAt = Date.now();
  currentAppState.sourceDevice = `수강생 등록 (${trimmedName})`;
  persistAppState();
  broadcastToClients(currentAppState);

  return res.json({
    success: true,
    student: newStudent,
    message: '수강생 등록 신청이 완료되었습니다. 관리자 승인 후 타이머 이용이 가능합니다.',
  });
});

// POST Student Study Time Record endpoint (Increments pure study seconds)
app.post('/api/students/study-time', (req, res) => {
  const { studentId, elapsedSeconds } = req.body || {};
  if (!studentId || typeof elapsedSeconds !== 'number' || elapsedSeconds <= 0) {
    return res.status(400).json({ success: false, message: '유효한 수강생 ID와 공부 시간을 전달해주세요.' });
  }

  const students: any[] = currentAppState.students || [];
  const targetStudent = students.find((s) => s.id === studentId);
  if (!targetStudent) {
    return res.status(404).json({ success: false, message: '등록된 수강생을 찾을 수 없습니다.' });
  }
  if (targetStudent.status !== 'approved') {
    return res.status(403).json({ success: false, message: '승인된 수강생만 순공 시간을 기록할 수 있습니다.' });
  }

  targetStudent.totalStudySeconds = (targetStudent.totalStudySeconds || 0) + elapsedSeconds;
  targetStudent.todayStudySeconds = (targetStudent.todayStudySeconds || 0) + elapsedSeconds;
  targetStudent.lastStudiedAt = new Date().toISOString();

  currentAppState.pushedAt = Date.now();
  currentAppState.sourceDevice = `수강생 순공 (${targetStudent.name} +${elapsedSeconds}초)`;
  persistAppState();
  broadcastToClients(currentAppState);

  return res.json({
    success: true,
    student: targetStudent,
    message: '순공 시간이 성공적으로 기록되었습니다.',
  });
});

// GET current synchronized state
app.get('/api/sync/state', (req, res) => {
  const isAdmin = checkAdminAuth(req);
  let stateToSend = currentAppState;

  // Protect admin password from unauthenticated clients
  if (!isAdmin && stateToSend?.adminSettings) {
    stateToSend = {
      ...stateToSend,
      adminSettings: {
        ...stateToSend.adminSettings,
        adminPasswordHash: '***PROTECTED***',
      },
    };
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  res.json({
    success: true,
    data: stateToSend,
    serverTime: Date.now(),
    version: APP_VERSION,
    connectedClients: sseClients.length,
  });
});

// Image upload endpoint: saves image to data/uploads and returns lightweight URL (/uploads/...)
app.post('/api/sync/upload', (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(403).json({
      success: false,
      message: '이미지 업로드는 관리자 권한이 필요합니다.',
    });
  }

  try {
    const { dataUrl, filename } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      return res.status(400).json({ success: false, message: '유효한 이미지 데이터가 아닙니다.' });
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, message: '올바른 base64 이미지 형식이 아닙니다.' });
    }

    const mime = matches[1].toLowerCase();
    let ext = 'png';
    if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('svg')) ext = 'svg';
    else if (mime.includes('gif')) ext = 'gif';

    const safePrefix = (filename || 'img').replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 20);
    const safeName = `${safePrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, safeName);

    const buffer = Buffer.from(matches[2], 'base64');
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${safeName}`;
    return res.json({
      success: true,
      url: fileUrl,
      size: buffer.length,
      message: '이미지가 서버에 성공적으로 저장되었습니다.',
    });
  } catch (err: any) {
    console.error('[Server] Upload error:', err);
    return res.status(500).json({ success: false, message: err?.message || '이미지 저장 실패' });
  }
});

// Smart merge helper: merges incoming client state with server state with role-based checks
function mergeAppState(existing: any, incoming: any, isAdmin: boolean) {
  if (!existing) return incoming;
  const merged = { ...existing };

  // 1. Merge Students
  if (Array.isArray(incoming.students)) {
    const existingStudentsMap = new Map((existing.students || []).map((s: any) => [s.id, s]));

    if (isAdmin) {
      // Admin can approve, reject, edit names, reset study times, or delete students
      merged.students = incoming.students;
    } else {
      // Non-admin can only increment study seconds for existing approved students or append new pending students
      const mergedStudents = incoming.students.map((incStudent: any) => {
        const exStudent: any = existingStudentsMap.get(incStudent.id);
        if (!exStudent) {
          // If new student from non-admin, force status to pending
          return {
            ...incStudent,
            status: 'pending',
            totalStudySeconds: 0,
            todayStudySeconds: 0,
          };
        }

        // Keep existing status & name (cannot be altered by non-admin)
        const maxTotal = Math.max(incStudent.totalStudySeconds || 0, exStudent.totalStudySeconds || 0);
        const maxToday = Math.max(incStudent.todayStudySeconds || 0, exStudent.todayStudySeconds || 0);
        const lastStudied =
          exStudent.lastStudiedAt && (!incStudent.lastStudiedAt || exStudent.lastStudiedAt > incStudent.lastStudiedAt)
            ? exStudent.lastStudiedAt
            : incStudent.lastStudiedAt;

        return {
          ...exStudent,
          totalStudySeconds: maxTotal,
          todayStudySeconds: maxToday,
          lastStudiedAt: lastStudied,
        };
      });

      // Retain any existing students not in incoming (prevents non-admin deleting students)
      for (const [id, exStudent] of existingStudentsMap.entries()) {
        if (!mergedStudents.some((s: any) => s.id === id)) {
          mergedStudents.push(exStudent);
        }
      }
      merged.students = mergedStudents;
    }
  }

  // 2. Admin Settings (Admin only)
  if (incoming.adminSettings && typeof incoming.adminSettings === 'object' && isAdmin) {
    const existingPw = existing.adminSettings?.adminPasswordHash || 'admin1234';
    const incPw = incoming.adminSettings.adminPasswordHash;
    const isRealPw =
      typeof incPw === 'string' && incPw.trim().length >= 4 && incPw !== '***PROTECTED***';

    merged.adminSettings = {
      ...(existing.adminSettings || {}),
      ...incoming.adminSettings,
      adminPasswordHash: isRealPw ? incPw.trim() : existingPw,
    };
  }

  // 3. Preset Timers (Admin only)
  if (Array.isArray(incoming.presetTimers) && isAdmin) {
    merged.presetTimers = incoming.presetTimers;
  }

  // 4. Notices (Admin only)
  if (Array.isArray(incoming.notices) && isAdmin) {
    merged.notices = incoming.notices;
  }

  // 5. Live Timer (broadcast session state)
  if (incoming.liveTimer) {
    merged.liveTimer = incoming.liveTimer;
  }

  // Strictly monotonic server-authoritative timestamp to ensure all clients detect the update
  merged.pushedAt = Math.max(Date.now(), (existing.pushedAt || 0) + 1);
  merged.pushedByClientId = incoming.pushedByClientId || existing.pushedByClientId;
  merged.sourceDevice = incoming.sourceDevice || existing.sourceDevice;

  return merged;
}

// POST state update from PC or Mobile
app.post('/api/sync/update', (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ success: false, message: 'Invalid payload' });
  }

  const isAdmin = checkAdminAuth(req);

  // Check if non-admin is trying to modify admin-only data
  const touchesAdminSettings = payload.adminSettings !== undefined;
  const touchesPresetTimers = payload.presetTimers !== undefined;
  const touchesNotices = payload.notices !== undefined;

  let touchesAdminStudentActions = false;
  if (Array.isArray(payload.students) && currentAppState?.students) {
    const existingMap = new Map(currentAppState.students.map((s: any) => [s.id, s]));
    if (payload.students.length < currentAppState.students.length) {
      touchesAdminStudentActions = true;
    }
    for (const inc of payload.students) {
      const ex: any = existingMap.get(inc.id);
      if (ex) {
        if (ex.status !== inc.status || ex.name !== inc.name) {
          touchesAdminStudentActions = true;
          break;
        }
      }
    }
  }

  if ((touchesAdminSettings || touchesPresetTimers || touchesNotices || touchesAdminStudentActions) && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다. 관리자 비밀번호를 확인해주세요.',
    });
  }

  const mergedState = mergeAppState(currentAppState, payload, isAdmin);
  currentAppState = mergedState;

  // Persist to file
  persistAppState();

  // Broadcast to all other connected SSE clients across all networks
  const broadcastCount = broadcastToClients(mergedState, payload.pushedByClientId);

  return res.json({
    success: true,
    message: 'Server updated and broadcasted successfully',
    broadcastCount,
    timestamp: mergedState.pushedAt,
    data: sanitizeStateForClient(mergedState, isAdmin),
  });
});

// Dedicated POST endpoint for Admin Settings (Title, Quotes, Design, Block Order)
app.post('/api/admin/settings', (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다. 관리자 비밀번호를 확인해주세요.',
    });
  }

  const incomingSettings = req.body?.adminSettings || req.body;
  if (!incomingSettings || typeof incomingSettings !== 'object') {
    return res.status(400).json({ success: false, message: '설정 데이터가 유효하지 않습니다.' });
  }

  const existingPw = currentAppState?.adminSettings?.adminPasswordHash || 'admin1234';
  const incPw = incomingSettings.adminPasswordHash;
  const isRealPw =
    typeof incPw === 'string' && incPw.trim().length >= 4 && incPw !== '***PROTECTED***';

  currentAppState.adminSettings = {
    ...(currentAppState.adminSettings || {}),
    ...incomingSettings,
    adminPasswordHash: isRealPw ? incPw.trim() : existingPw,
  };

  currentAppState.pushedAt = Math.max(Date.now(), (currentAppState.pushedAt || 0) + 1);
  currentAppState.sourceDevice = req.body?.sourceDevice || '관리자 기기 (타이머 설정 변경)';
  currentAppState.pushedByClientId = req.body?.clientId || req.body?.pushedByClientId;

  persistAppState();
  const broadcastCount = broadcastToClients(currentAppState, currentAppState.pushedByClientId);

  return res.json({
    success: true,
    message: '관리자 타이머 설정이 저장되고 모든 기기에 실시간 반영되었습니다.',
    broadcastCount,
    timestamp: currentAppState.pushedAt,
    data: sanitizeStateForClient(currentAppState, true),
  });
});

// Dedicated POST endpoint for Admin Preset Timers
app.post('/api/admin/presets', (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다. 관리자 비밀번호를 확인해주세요.',
    });
  }

  const presets = req.body?.presetTimers || req.body;
  if (!Array.isArray(presets)) {
    return res.status(400).json({ success: false, message: '프리셋 목록이 유효하지 않습니다.' });
  }

  currentAppState.presetTimers = presets;
  currentAppState.pushedAt = Math.max(Date.now(), (currentAppState.pushedAt || 0) + 1);
  currentAppState.sourceDevice = req.body?.sourceDevice || '관리자 기기 (타이머 프리셋 변경)';
  currentAppState.pushedByClientId = req.body?.clientId || req.body?.pushedByClientId;

  persistAppState();
  const broadcastCount = broadcastToClients(currentAppState, currentAppState.pushedByClientId);

  return res.json({
    success: true,
    message: '타이머 프리셋 설정이 저장되고 모든 기기에 실시간 반영되었습니다.',
    broadcastCount,
    timestamp: currentAppState.pushedAt,
    data: sanitizeStateForClient(currentAppState, true),
  });
});

// Health check endpoint
app.get('/api/sync/ping', (req, res) => {
  res.json({
    status: 'ok',
    version: APP_VERSION,
    uptime: process.uptime(),
    activeClients: sseClients.length,
    hasPersistedState: !!currentAppState,
    lastUpdate: currentAppState?.pushedAt || null,
  });
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  const httpServer = http.createServer(app);

  if (isDev) {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Realtime Sync Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start server:', err);
  process.exit(1);
});

