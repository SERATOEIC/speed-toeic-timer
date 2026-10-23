import { initializeApp, getApps } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  Unsubscribe,
} from 'firebase/database';
import {
  AppBackupData,
  FirebaseSyncConfig,
  SyncStatus,
  AdminSettings,
  PresetTimer,
  Notice,
  Student,
} from '../types';
import {
  getFullAppBackupData,
  importAppData,
  saveFirebaseSyncConfig,
  getAdminSessionPassword,
} from './storage';

let activeCdnUnsubscribe: (() => void) | null = null;
let activeModularUnsubscribe: Unsubscribe | null = null;
let activeConnectedUnsubscribe: (() => void) | null = null;
let activeEventSource: EventSource | null = null;
let serverReconnectTimer: any = null;
let serverPollingTimer: any = null;
let localBroadcastChannel: BroadcastChannel | null = null;
let lastAppliedTimestamp = 0;

/**
 * Upload an image (dataUrl) to server /api/sync/upload
 * Returns static lightweight URL /uploads/img_xxx.png for cross-device fidelity
 */
export async function uploadImageToServer(
  dataUrl: string,
  filename?: string
): Promise<{ success: boolean; url?: string; message?: string }> {
  try {
    const adminPass = getAdminSessionPassword();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (adminPass) {
      headers['x-admin-password'] = adminPass;
    }
    const res = await fetch('/api/sync/upload', {
      method: 'POST',
      headers,
      body: JSON.stringify({ dataUrl, filename }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.url) {
        return { success: true, url: json.url };
      }
    }
    const errJson = await res.json().catch(() => ({}));
    return { success: false, message: errJson.message || '서버 업로드 실패' };
  } catch (err: any) {
    return { success: false, message: err?.message || '네트워크 오류' };
  }
}

/**
 * Unconditionally save Admin Settings to the central shared server
 * and broadcast to all connected devices in real time.
 */
export async function saveAdminSettingsToServer(
  adminSettings: AdminSettings
): Promise<{ success: boolean; message: string; timestamp?: number; data?: any }> {
  const adminPass = getAdminSessionPassword();
  const clientId = getClientId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (adminPass) {
    headers['x-admin-password'] = adminPass;
  }

  const payload = {
    adminSettings,
    adminPassword: adminPass,
    clientId,
    sourceDevice:
      typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile')
        ? '모바일 관리자 (설정 변경)'
        : 'PC 관리자 (설정 변경)',
  };

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      lastAppliedTimestamp = json.timestamp || Date.now();
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('stoeic_local_sync');
          bc.postMessage(json.data || { adminSettings, pushedAt: lastAppliedTimestamp });
          setTimeout(() => bc.close(), 100);
        }
      } catch {}

      return {
        success: true,
        message: '타이머 설정이 서버에 저장되고 모든 기기에 실시간 반영되었습니다.',
        timestamp: lastAppliedTimestamp,
        data: json.data,
      };
    } else {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        message: err.message || `서버 설정 저장 실패 (${res.status})`,
      };
    }
  } catch (err: any) {
    return { success: false, message: err?.message || '네트워크 오류로 서버 저장 실패' };
  }
}

/**
 * Unconditionally save Preset Timers to the central shared server
 * and broadcast to all connected devices in real time.
 */
export async function savePresetTimersToServer(
  presetTimers: PresetTimer[]
): Promise<{ success: boolean; message: string; timestamp?: number; data?: any }> {
  const adminPass = getAdminSessionPassword();
  const clientId = getClientId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (adminPass) {
    headers['x-admin-password'] = adminPass;
  }

  const payload = {
    presetTimers,
    adminPassword: adminPass,
    clientId,
    sourceDevice:
      typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile')
        ? '모바일 관리자 (타이머 변경)'
        : 'PC 관리자 (타이머 변경)',
  };

  try {
    const res = await fetch('/api/admin/presets', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      lastAppliedTimestamp = json.timestamp || Date.now();
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('stoeic_local_sync');
          bc.postMessage(json.data || { presetTimers, pushedAt: lastAppliedTimestamp });
          setTimeout(() => bc.close(), 100);
        }
      } catch {}

      return {
        success: true,
        message: '타이머 목록이 서버에 저장되고 모든 기기에 실시간 반영되었습니다.',
        timestamp: lastAppliedTimestamp,
        data: json.data,
      };
    } else {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        message: err.message || `타이머 서버 저장 실패 (${res.status})`,
      };
    }
  } catch (err: any) {
    return { success: false, message: err?.message || '네트워크 오류로 서버 저장 실패' };
  }
}

/**
 * Unconditionally save Notices to the central shared server
 */
export async function saveNoticesToServer(
  notices: Notice[]
): Promise<{ success: boolean; message: string; timestamp?: number; data?: any }> {
  const adminPass = getAdminSessionPassword();
  const clientId = getClientId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (adminPass) {
    headers['x-admin-password'] = adminPass;
  }

  const payload = {
    notices,
    adminPassword: adminPass,
    clientId,
    sourceDevice:
      typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile')
        ? '모바일 관리자 (공지 변경)'
        : 'PC 관리자 (공지 변경)',
  };

  try {
    const res = await fetch('/api/sync/update', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      lastAppliedTimestamp = json.timestamp || Date.now();
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('stoeic_local_sync');
          bc.postMessage(json.data || { notices, pushedAt: lastAppliedTimestamp });
          setTimeout(() => bc.close(), 100);
        }
      } catch {}

      return {
        success: true,
        message: '공지사항이 서버에 저장되었습니다.',
        timestamp: lastAppliedTimestamp,
        data: json.data,
      };
    } else {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        message: err.message || `공지사항 서버 저장 실패 (${res.status})`,
      };
    }
  } catch (err: any) {
    return { success: false, message: err?.message || '네트워크 오류로 서버 저장 실패' };
  }
}

/**
 * Save Student list to the central shared server
 */
export async function saveStudentsToServer(
  students: Student[]
): Promise<{ success: boolean; message: string; timestamp?: number; data?: any }> {
  const adminPass = getAdminSessionPassword();
  const clientId = getClientId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (adminPass) {
    headers['x-admin-password'] = adminPass;
  }

  const payload = {
    students,
    adminPassword: adminPass,
    clientId,
    sourceDevice:
      typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile')
        ? '모바일 관리자 (수강생 관리)'
        : 'PC 관리자 (수강생 관리)',
  };

  try {
    const res = await fetch('/api/sync/update', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      lastAppliedTimestamp = json.timestamp || Date.now();
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('stoeic_local_sync');
          bc.postMessage(json.data || { students, pushedAt: lastAppliedTimestamp });
          setTimeout(() => bc.close(), 100);
        }
      } catch {}

      return {
        success: true,
        message: '수강생 정보가 서버에 저장되었습니다.',
        timestamp: lastAppliedTimestamp,
        data: json.data,
      };
    } else {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        message: err.message || `수강생 정보 서버 저장 실패 (${res.status})`,
      };
    }
  } catch (err: any) {
    return { success: false, message: err?.message || '네트워크 오류로 서버 저장 실패' };
  }
}
export async function registerStudentOnServer(
  name: string
): Promise<{ success: boolean; student?: any; message: string }> {
  try {
    const res = await fetch('/api/students/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, message: err?.message || '서버 등록 실패' };
  }
}

/**
 * Report student study time to the central server
 */
export async function reportStudyTimeToServer(
  studentId: string,
  elapsedSeconds: number
): Promise<{ success: boolean; student?: any; message: string }> {
  try {
    const res = await fetch('/api/students/study-time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, elapsedSeconds }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, message: err?.message || '공부 시간 저장 실패' };
  }
}

/**
 * Compress an image data URL via HTML5 canvas to guarantee it stays below ~40KB
 * Prevents localStorage QuotaExceededError and EventSource truncation
 */
export async function compressImageDataUrl(
  dataUrl: string,
  maxDimension = 400,
  quality = 0.85
): Promise<string> {
  if (typeof window === 'undefined' || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxDimension && height <= maxDimension && dataUrl.length < 80000) {
        return resolve(dataUrl);
      }
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Get or generate persistent Client ID to prevent self-echo loops
 */
export function getClientId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let id = sessionStorage.getItem('stoeic_sync_client_id');
    if (!id) {
      id = 'client_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      sessionStorage.setItem('stoeic_sync_client_id', id);
    }
    return id;
  } catch {
    return 'client_' + Math.random().toString(36).substring(2, 9);
  }
}

/**
 * Check if real, valid Firebase credentials have been configured by the user
 */
export function isRealFirebaseConfigured(config?: FirebaseSyncConfig): boolean {
  if (!config) return false;
  const apiKey = (config.apiKey || '').trim();
  const dbUrl = (config.databaseURL || '').trim();
  const projectId = (config.projectId || '').trim();

  // Guard against sample / placeholder keys
  if (!apiKey || apiKey.includes('sampleSpeedToeicKey') || apiKey.length < 15) {
    return false;
  }
  if (!dbUrl && !projectId) {
    return false;
  }
  if (dbUrl.includes('speed-toeic-timer-default-rtdb') && !config.apiKey) {
    return false;
  }
  return true;
}

/**
 * Sanitize Database URL
 */
export function sanitizeDatabaseUrl(url?: string, projectId?: string): string {
  let trimmed = (url || '').trim();
  if (!trimmed && projectId && projectId.trim()) {
    trimmed = `https://${projectId.trim()}-default-rtdb.firebaseio.com`;
  }
  if (!trimmed) {
    return '';
  }
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed.replace(/\/+$/, '');
}

/**
 * Sanitize Room ID for safe path usage: firebase.database().ref('rooms/' + roomCode)
 */
export function sanitizeRoomId(roomId?: string): string {
  const clean = (roomId || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return clean || 'SPEED_TOEIC_ROOM_1';
}

/**
 * Validate Firebase config
 */
export function validateFirebaseConfig(config: FirebaseSyncConfig): {
  valid: boolean;
  error?: string;
} {
  if (!config.syncRoomId?.trim()) {
    return { valid: false, error: '동기화 룸 코드(Room Code)를 입력해 주세요.' };
  }
  if (!config.apiKey?.trim()) {
    return { valid: false, error: 'Firebase API Key를 입력해 주세요.' };
  }
  if (!config.databaseURL?.trim() && !config.projectId?.trim()) {
    return { valid: false, error: 'Firebase Database URL 또는 Project ID를 입력해 주세요.' };
  }
  return { valid: true };
}

/**
 * Returns Firebase SDK instance from CDN (window.firebase) or falls back to bundled modular SDK
 */
function getFirebaseInstance(config: FirebaseSyncConfig) {
  const cleanDbUrl = sanitizeDatabaseUrl(config.databaseURL, config.projectId);
  const projectId = (config.projectId || '').trim();
  const apiKey = (config.apiKey || '').trim();
  const authDomain = (config.authDomain || (projectId ? `${projectId}.firebaseapp.com` : '')).trim();

  const firebaseConfig = {
    apiKey,
    authDomain,
    databaseURL: cleanDbUrl,
    projectId,
    appId: config.appId?.trim() || undefined,
  };

  // 1. Try Firebase CDN SDK (Compat v10: window.firebase)
  if (typeof window !== 'undefined' && (window as any).firebase) {
    const fb = (window as any).firebase;
    let app: any;
    try {
      const existing = fb.apps || [];
      app = existing.find((a: any) => a.name === 'stoeic_cdn_app') || fb.initializeApp(firebaseConfig, 'stoeic_cdn_app');
    } catch {
      app = fb.app('stoeic_cdn_app');
    }

    const db = fb.database(app);
    return {
      type: 'cdn' as const,
      fb,
      app,
      db,
      getRef: (path: string) => db.ref(path),
    };
  }

  // 2. Fallback to bundled modular Firebase SDK
  const appName = 'stoeic_modular_app';
  const existingApps = getApps();
  let app = existingApps.find((a) => a.name === appName);
  if (!app) {
    app = initializeApp(firebaseConfig, appName);
  }
  const db = cleanDbUrl ? getDatabase(app, cleanDbUrl) : getDatabase(app);
  return {
    type: 'modular' as const,
    app,
    db,
    getRef: (path: string) => ref(db, path),
  };
}

/**
 * Stop all active real-time listeners (Server SSE + Firebase RTDB + BroadcastChannel + Polling)
 */
export function stopFirebaseSync() {
  if (activeEventSource) {
    try {
      activeEventSource.close();
    } catch {}
    activeEventSource = null;
  }
  if (serverReconnectTimer) {
    clearTimeout(serverReconnectTimer);
    serverReconnectTimer = null;
  }
  if (serverPollingTimer) {
    clearInterval(serverPollingTimer);
    serverPollingTimer = null;
  }
  if (activeCdnUnsubscribe) {
    try {
      activeCdnUnsubscribe();
    } catch {}
    activeCdnUnsubscribe = null;
  }
  if (activeModularUnsubscribe) {
    try {
      activeModularUnsubscribe();
    } catch {}
    activeModularUnsubscribe = null;
  }
  if (activeConnectedUnsubscribe) {
    try {
      activeConnectedUnsubscribe();
    } catch {}
    activeConnectedUnsubscribe = null;
  }
  if (localBroadcastChannel) {
    try {
      localBroadcastChannel.close();
    } catch {}
    localBroadcastChannel = null;
  }
}

/**
 * Test server & Firebase Realtime Database connection & permissions
 */
export async function testFirebaseConnection(
  config: FirebaseSyncConfig
): Promise<{ success: boolean; message: string }> {
  const roomCode = sanitizeRoomId(config.syncRoomId);

  // 1. First test server sync endpoint
  let serverOk = false;
  try {
    const res = await fetch('/api/sync/ping');
    if (res.ok) {
      serverOk = true;
    }
  } catch {}

  // 2. Test Firebase RTDB if configured
  if (!isRealFirebaseConfigured(config)) {
    if (serverOk) {
      return {
        success: true,
        message: `내장 실시간 동기화 서버 연결 정상! PC-모바일 간 자동 실시간 동기화가 활성화되어 있습니다. (외부 Firebase RTDB를 연동하려면 Firebase Console에서 발급받은 실제 API 키와 Database URL을 입력해 주세요)`,
      };
    }
    return {
      success: false,
      message: '서버 또는 Firebase API Key 및 Database URL 연결 상태를 확인해 주세요.',
    };
  }

  try {
    const fbInst = getFirebaseInstance(config);
    const roomPath = 'rooms/' + roomCode;

    if (fbInst.type === 'cdn') {
      const testRef = fbInst.getRef(`${roomPath}/ping`);
      await testRef.set({
        ping: true,
        timestamp: Date.now(),
        clientId: getClientId(),
        device: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Mobile' : 'PC',
      });
    } else {
      const testRef = fbInst.getRef(`${roomPath}/ping`);
      await set(testRef, {
        ping: true,
        timestamp: Date.now(),
        clientId: getClientId(),
        device: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Mobile' : 'PC',
      });
    }

    return {
      success: true,
      message: `Firebase Realtime Database 및 서버 연결 성공! [rooms/${roomCode}] 양방향 실시간 동기화가 활성화되었습니다.`,
    };
  } catch (err: any) {
    console.error('Firebase test connection failed:', err);
    let msg = err?.message || 'Firebase 연결에 실패했습니다.';
    if (msg.includes('PERMISSION_DENIED') || msg.includes('permission_denied')) {
      msg = '권한 거부(PERMISSION_DENIED): Firebase Console > Realtime Database > 규칙(Rules) 탭에서 { ".read": true, ".write": true } 로 설정하고 [게시]해 주세요.';
    } else if (msg.includes('NETWORK') || msg.includes('network') || msg.includes('failed to fetch')) {
      msg = '네트워크 연결 오류: Database URL 또는 인터넷 상태를 확인해 주세요.';
    }
    return { success: false, message: msg };
  }
}

/**
 * Push local app data to Server and optionally to Firebase RTDB:
 * Ensures PC admin changes are saved and received by mobile across any network!
 */
export async function pushDataToFirebase(
  config: FirebaseSyncConfig,
  customData?: AppBackupData
): Promise<{ success: boolean; message: string; timestamp?: number }> {
  const dataToSend = customData || getFullAppBackupData();
  const now = Date.now();
  const clientId = getClientId();
  const roomCode = sanitizeRoomId(config.syncRoomId);

  const payload: AppBackupData = {
    ...dataToSend,
    pushedAt: now,
    pushedByClientId: clientId,
    sourceDevice:
      typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile')
        ? '스마트폰'
        : 'PC 관리자',
  };

  lastAppliedTimestamp = now;

  // 1. Broadcast locally via BroadcastChannel for instant same-browser cross-tab response
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(`stoeic_room_${roomCode}`);
      bc.postMessage(payload);
      setTimeout(() => bc.close(), 100);
    }
  } catch {}

  let serverSuccess = false;
  let serverErrorMsg: string | undefined = undefined;

  // 2. Push to Server-Side Sync Engine (Persists on Cloud Run server & broadcasts to all mobile/PC clients via SSE)
  try {
    const adminPass = getAdminSessionPassword();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (adminPass) {
      headers['x-admin-password'] = adminPass;
      (payload as any).adminPassword = adminPass;
    }

    const res = await fetch('/api/sync/update', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      serverSuccess = true;
    } else {
      const errJson = await res.json().catch(() => ({}));
      serverErrorMsg = errJson.message || `서버 저장 실패 (${res.status})`;
    }
  } catch (err: any) {
    console.warn('[Sync] Server update push error:', err);
    serverErrorMsg = err?.message;
  }

  // 3. Push to Firebase Realtime Database if real Firebase credentials are provided
  let fbSuccess = false;
  let fbError: string | undefined = undefined;

  if (config.enabled && isRealFirebaseConfigured(config)) {
    try {
      const fbInst = getFirebaseInstance(config);
      const roomPath = 'rooms/' + roomCode;

      if (fbInst.type === 'cdn') {
        const roomRef = fbInst.getRef(roomPath);
        await roomRef.set(payload);
      } else {
        const roomRef = fbInst.getRef(roomPath);
        await set(roomRef, payload);
      }
      fbSuccess = true;
    } catch (err: any) {
      console.warn('[Sync] Firebase RTDB push failed:', err);
      fbError = err?.message;
    }
  }

  if (serverSuccess || fbSuccess) {
    const updatedConfig: FirebaseSyncConfig = {
      ...config,
      lastSyncAt: new Date().toISOString(),
      lastSyncStatus: 'connected',
      lastErrorMessage: undefined,
    };
    saveFirebaseSyncConfig(updatedConfig);

    return {
      success: true,
      message: fbSuccess
        ? `실시간 동기화 성공! (서버 및 Firebase RTDB rooms/${roomCode} 반영)`
        : '실시간 동기화 완료! (서버 및 연결된 모바일에 즉시 전송되었습니다)',
      timestamp: now,
    };
  }

  return {
    success: false,
    message: serverErrorMsg || fbError || '데이터 전송에 실패했습니다. 관리자 권한 또는 네트워크를 확인해 주세요.',
  };
}

/**
 * Pull latest data once from Server or Firebase RTDB
 */
export async function pullDataFromFirebase(
  config: FirebaseSyncConfig
): Promise<{ success: boolean; message: string; data?: AppBackupData }> {
  // 1. Try Server API first
  try {
    const res = await fetch('/api/sync/state');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const importRes = importAppData(json.data);
        if (importRes.success && importRes.data) {
          lastAppliedTimestamp = json.data.pushedAt || Date.now();
          return {
            success: true,
            message: `서버로부터 최신 데이터를 불러왔습니다! (${importRes.message})`,
            data: importRes.data,
          };
        }
      }
    }
  } catch (err) {
    console.warn('[Sync] Pull from server error:', err);
  }

  // 2. Try Firebase RTDB if configured
  if (isRealFirebaseConfigured(config)) {
    const roomCode = sanitizeRoomId(config.syncRoomId);
    const roomPath = 'rooms/' + roomCode;

    try {
      const fbInst = getFirebaseInstance(config);
      let val: any = null;

      if (fbInst.type === 'cdn') {
        const snap = await fbInst.getRef(roomPath).once('value');
        if (snap.exists()) {
          val = snap.val();
        }
      } else {
        const snap = await get(fbInst.getRef(roomPath));
        if (snap.exists()) {
          val = snap.val();
        }
      }

      if (val) {
        const importRes = importAppData(val);
        if (importRes.success && importRes.data) {
          lastAppliedTimestamp = val.pushedAt || Date.now();
          return {
            success: true,
            message: `Firebase로부터 최신 데이터를 성공적으로 불러왔습니다! (${importRes.message})`,
            data: importRes.data,
          };
        }
      }
    } catch (err: any) {
      console.warn('[Sync] Pull from Firebase failed:', err);
    }
  }

  return {
    success: false,
    message: '동기화된 원격 데이터가 없습니다. PC 관리자 화면에서 설정을 변경하거나 [클라우드로 내보내기]를 실행해 주세요.',
  };
}

/**
 * Start real-time sync listener:
 * 1. Server SSE (/api/sync/events): Instant cross-device & cross-network sync between PC and mobile.
 * 2. Background Polling Fallback (every 10s): Guarantees data sync even if mobile carriers drop long-lived SSE connections.
 * 3. Visibility Change Reconnection: Instantly pulls latest data when smartphone screen turns back on.
 * 4. BroadcastChannel: Instant cross-tab sync in the same browser.
 * 5. Firebase RTDB (if configured): Optional external cloud sync.
 */
export function startFirebaseRealtimeListener(
  config: FirebaseSyncConfig,
  onRemoteData: (data: AppBackupData) => void,
  onStatusChange: (status: SyncStatus, msg?: string) => void
): () => void {
  stopFirebaseSync();

  const myClientId = getClientId();
  const roomCode = sanitizeRoomId(config.syncRoomId);
  const roomPath = 'rooms/' + roomCode;

  let isCancelled = false;

  const applyRemotePayload = (payload: AppBackupData, source: string) => {
    if (isCancelled || !payload) return;

    // Strict self-echo suppression
    if (payload.pushedByClientId && payload.pushedByClientId === myClientId) {
      return;
    }

    // Version/timestamp check to prevent applying older or duplicate data
    if (payload.pushedAt && payload.pushedAt <= lastAppliedTimestamp) {
      return;
    }

    if (payload.pushedAt) {
      lastAppliedTimestamp = payload.pushedAt;
    }

    onStatusChange('syncing', `${payload.sourceDevice || source} 변경 사항 반영 중...`);
    const importRes = importAppData(payload, { importPersonalSettings: false });

    if (importRes.success && importRes.data) {
      onRemoteData(importRes.data);
      onStatusChange(
        'connected',
        `실시간 동기화 완료 (${new Date().toLocaleTimeString('ko-KR')}, ${payload.sourceDevice || source} 반영됨)`
      );
    } else {
      onStatusChange('connected', '동기화 상태 정상 유지 중');
    }
  };

  // 1. Cross-tab instant local channel
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const bc = new BroadcastChannel(`stoeic_room_${roomCode}`);
      bc.onmessage = (event) => {
        const payload = event.data;
        if (payload && payload.pushedByClientId && payload.pushedByClientId !== myClientId) {
          applyRemotePayload(payload, '로컬 탭');
        }
      };
      localBroadcastChannel = bc;

      const bcLocal = new BroadcastChannel('stoeic_local_sync');
      bcLocal.onmessage = (event) => {
        const payload = event.data;
        if (payload && (!payload.pushedByClientId || payload.pushedByClientId !== myClientId)) {
          applyRemotePayload(payload, '로컬 탭');
        }
      };
    } catch {}
  }

  // 2. Fetch from server helper
  const pullServerState = async (reason = '서버') => {
    if (isCancelled) return;
    try {
      const res = await fetch(`/api/sync/state?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
      });
      if (res.ok) {
        const json = await res.json();
        if (!isCancelled && json?.success && json?.data) {
          applyRemotePayload(json.data, reason);
          return true;
        }
      }
    } catch (err) {
      console.warn('[Sync] Pull error:', err);
    }
    return false;
  };

  // Initial fetch immediately
  pullServerState('서버');

  // 3. Connect to Server-Side Realtime Event Stream (SSE)
  const connectServerSSE = () => {
    if (isCancelled) return;

    try {
      onStatusChange('connecting', '실시간 동기화 서버 연결 중...');
      const es = new EventSource(`/api/sync/events?clientId=${encodeURIComponent(myClientId)}`);
      activeEventSource = es;

      es.onopen = () => {
        if (isCancelled) return;
        const isFbActive = isRealFirebaseConfigured(config);
        onStatusChange(
          'connected',
          isFbActive
            ? `실시간 연동 활성 (서버 및 Firebase RTDB 연결)`
            : `실시간 연동 활성 (PC ⇄ 모바일 자동 동기화)`
        );
      };

      es.onmessage = (event) => {
        if (isCancelled || !event.data) return;
        try {
          const data = JSON.parse(event.data);
          if (data && typeof data === 'object') {
            applyRemotePayload(data, '원격 기기');
          }
        } catch (err) {
          console.warn('[Sync] Failed to parse SSE event data:', err);
        }
      };

      es.onerror = () => {
        if (isCancelled) return;
        try {
          es.close();
        } catch {}
        activeEventSource = null;

        // Reconnect with backoff
        if (!serverReconnectTimer) {
          serverReconnectTimer = setTimeout(() => {
            serverReconnectTimer = null;
            if (!isCancelled) {
              connectServerSSE();
            }
          }, 3000);
        }
      };
    } catch (err) {
      console.warn('[Sync] Could not establish SSE connection:', err);
      onStatusChange('error', '동기화 서버 연결 실패. 네트워크 상태를 확인해 주세요.');
    }
  };

  if (typeof window !== 'undefined' && 'EventSource' in window) {
    connectServerSSE();
  }

  // 4. Reliable Polling Fallback (every 3.5 seconds) - guarantees cross-device sync even on cellular or proxy
  serverPollingTimer = setInterval(() => {
    if (!isCancelled) {
      pullServerState('서버 자동 확인');
      // If SSE disconnected, attempt reconnect
      if (!activeEventSource && !serverReconnectTimer) {
        connectServerSSE();
      }
    }
  }, 3500);

  // 5. Visibility Change Handler - when mobile browser tab resumes from background
  const handleVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible' && !isCancelled) {
      pullServerState('화면 복귀 최신 갱신');
      if (!activeEventSource) {
        connectServerSSE();
      }
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  // 6. Optional Firebase Realtime Database Listener (if user configured real Firebase)
  if (config.enabled && isRealFirebaseConfigured(config)) {
    (async () => {
      try {
        const fbInst = getFirebaseInstance(config);
        if (isCancelled) return;

        if (fbInst.type === 'cdn') {
          const db = fbInst.db;
          const roomRef = db.ref(roomPath);

          const onRoomVal = (snapshot: any) => {
            if (isCancelled || !snapshot.exists()) return;
            const remoteVal = snapshot.val() as AppBackupData;
            applyRemotePayload(remoteVal, 'Firebase RTDB');
          };

          roomRef.on('value', onRoomVal);
          activeCdnUnsubscribe = () => {
            try {
              roomRef.off('value', onRoomVal);
            } catch {}
          };
        } else {
          const db = fbInst.db;
          const roomRef = ref(db, roomPath);

          activeModularUnsubscribe = onValue(roomRef, (snapshot) => {
            if (isCancelled || !snapshot.exists()) return;
            const remoteVal = snapshot.val() as AppBackupData;
            applyRemotePayload(remoteVal, 'Firebase RTDB');
          });
        }
      } catch (err: any) {
        console.warn('[Sync] Firebase RTDB listener setup failed:', err);
      }
    })();
  }

  return () => {
    isCancelled = true;
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
    stopFirebaseSync();
  };
}

