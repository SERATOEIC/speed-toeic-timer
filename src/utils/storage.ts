import {
  Student,
  Notice,
  PresetTimer,
  AdminSettings,
  StudentCustomSettings,
  AppBackupData,
  FirebaseSyncConfig,
} from '../types';

const STORAGE_KEYS = {
  STUDENTS: 'stoeic_students_v1',
  ACTIVE_STUDENT_ID: 'stoeic_active_student_id_v1',
  ADMIN_SETTINGS: 'stoeic_admin_settings_v1',
  NOTICES: 'stoeic_notices_v1',
  PRESET_TIMERS: 'stoeic_preset_timers_v1',
  ADMIN_IS_LOGGED_IN: 'stoeic_admin_logged_in_v1',
  STUDENT_SETTINGS: 'stoeic_student_custom_settings_v1',
  FIREBASE_SYNC_CONFIG: 'stoeic_firebase_sync_config_v1',
};

export const DEFAULT_STUDENT_SETTINGS = {
  showSecondHand: true,
  clockStyle: 'classic' as const,
  themeColor: 'blue' as const,
};

// Initial realistic seed students (goals and class info removed)
const INITIAL_STUDENTS: Student[] = [
  {
    id: 'stu_1',
    name: '김태완',
    registeredAt: '2026-10-01T09:00:00Z',
    status: 'approved',
    totalStudySeconds: 174330, // ~48h 25m 30s
    todayStudySeconds: 12600,
    lastStudiedAt: '2026-10-17T08:30:00Z',
  },
  {
    id: 'stu_2',
    name: '이지은',
    registeredAt: '2026-10-03T11:20:00Z',
    status: 'approved',
    totalStudySeconds: 141130, // ~39h 12m 10s
    todayStudySeconds: 9800,
    lastStudiedAt: '2026-10-17T07:45:00Z',
  },
  {
    id: 'stu_3',
    name: '박민우',
    registeredAt: '2026-10-05T14:10:00Z',
    status: 'approved',
    totalStudySeconds: 114300, // ~31h 45m 00s
    todayStudySeconds: 7200,
    lastStudiedAt: '2026-10-16T22:10:00Z',
  },
  {
    id: 'stu_4',
    name: '최소연',
    registeredAt: '2026-10-08T16:00:00Z',
    status: 'approved',
    totalStudySeconds: 87020, // ~24h 10m 20s
    todayStudySeconds: 5400,
    lastStudiedAt: '2026-10-16T19:00:00Z',
  },
  {
    id: 'stu_5',
    name: '윤성호',
    registeredAt: '2026-10-10T10:30:00Z',
    status: 'approved',
    totalStudySeconds: 67800, // ~18h 50m
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
];

const INITIAL_SETTINGS: AdminSettings = {
  appKoreanName: '스피드토익 수강생 전용 타이머',
  appEnglishName: 'SPEED TOEIC TIMER',
  showAppBadge: false, // 기본적으로 제거됨 (관리자가 필요시 언제든 켜고 끌 수 있음)
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
  backgroundOverlayOpacity: 0.80,
  adminPasswordHash: 'admin1234',
  uiCardStyle: 'slate',
  uiFontSize: 'normal',
  uiTextColor: 'pure_white',
  uiAccentColor: 'blue',
  blockOrder: ['banner', 'podium', 'preset_timers', 'custom_timer', 'notices'],
};

const INITIAL_NOTICES: Notice[] = [
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
];

const INITIAL_PRESET_TIMERS: PresetTimer[] = [
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
];

// Helper functions for storage
export function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_STUDENTS;
    // Cleanse any legacy targetScore or class note fields from stored data
    const cleansed: Student[] = parsed.map((s: any) => {
      const { targetScore, ...rest } = s;
      if (rest.notes && (rest.notes.includes('반') || rest.notes.includes('트레이닝') || rest.notes.includes('목표'))) {
        rest.notes = undefined;
      }
      return rest as Student;
    });
    return cleansed;
  } catch {
    return INITIAL_STUDENTS;
  }
}

export function saveStudents(students: Student[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.error('Failed to save students to localStorage', e);
  }
}

export function loadActiveStudentId(): string | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_STUDENT_ID);
    if (saved) {
      const students = loadStudents();
      if (students.some((s) => s.id === saved)) {
        return saved;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function saveActiveStudentId(id: string | null) {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_STUDENT_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_STUDENT_ID);
    }
  } catch {}
}

export function loadAdminLoggedIn(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_IS_LOGGED_IN) === 'true';
  } catch {
    return false;
  }
}

export function saveAdminLoggedIn(isLoggedIn: boolean) {
  try {
    if (isLoggedIn) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_IS_LOGGED_IN, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_IS_LOGGED_IN);
    }
  } catch {}
}

export function getAdminSessionPassword(): string {
  try {
    const saved = sessionStorage.getItem('stoeic_admin_session_pass') || localStorage.getItem('stoeic_admin_session_pass');
    if (saved && saved.trim()) return saved.trim();
    if (loadAdminLoggedIn()) {
      const current = loadAdminSettings();
      const pw = current.adminPasswordHash;
      if (pw && pw !== '***PROTECTED***') {
        return pw;
      }
      return 'admin1234';
    }
    return '';
  } catch {
    return '';
  }
}

export function saveAdminSessionPassword(password: string | null) {
  try {
    if (password) {
      sessionStorage.setItem('stoeic_admin_session_pass', password);
      localStorage.setItem('stoeic_admin_session_pass', password);
    } else {
      sessionStorage.removeItem('stoeic_admin_session_pass');
      localStorage.removeItem('stoeic_admin_session_pass');
    }
  } catch {}
}

export function loadAdminSettings(): AdminSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    const validDefaultBlocks = INITIAL_SETTINGS.blockOrder || [
      'banner',
      'podium',
      'preset_timers',
      'custom_timer',
      'notices',
    ];
    let resolvedBlockOrder = Array.isArray(parsed.blockOrder) ? parsed.blockOrder : validDefaultBlocks;
    // Ensure all 5 blocks exist in order
    for (const b of validDefaultBlocks) {
      if (!resolvedBlockOrder.includes(b)) {
        resolvedBlockOrder.push(b);
      }
    }

    return {
      ...INITIAL_SETTINGS,
      ...parsed,
      showAppBadge: parsed.showAppBadge ?? false,
      showSubtitle: parsed.showSubtitle ?? true,
      showBannerTag: parsed.showBannerTag ?? true,
      showHomeGreeting: parsed.showHomeGreeting ?? true,
      showHomeSubQuote: parsed.showHomeSubQuote ?? true,
      blockOrder: resolvedBlockOrder,
    };
  } catch {
    return INITIAL_SETTINGS;
  }
}

export function saveAdminSettings(settings: AdminSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save admin settings, attempting quota cleanup', e);
    try {
      const stripped = { ...settings };
      if (stripped.appLogoUrl && stripped.appLogoUrl.length > 50000) stripped.appLogoUrl = '';
      if (stripped.clockCenterLogoUrl && stripped.clockCenterLogoUrl.length > 50000) stripped.clockCenterLogoUrl = '';
      if (stripped.backgroundImageUrl && stripped.backgroundImageUrl.length > 50000) stripped.backgroundImageUrl = '';
      localStorage.setItem(STORAGE_KEYS.ADMIN_SETTINGS, JSON.stringify(stripped));
    } catch (err2) {
      console.error('Final fallback failed to save admin settings', err2);
    }
  }
}

export function loadNotices(): Notice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTICES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(INITIAL_NOTICES));
      return INITIAL_NOTICES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTICES;
  }
}

export function saveNotices(notices: Notice[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
  } catch {}
}

export function loadPresetTimers(): PresetTimer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRESET_TIMERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRESET_TIMERS, JSON.stringify(INITIAL_PRESET_TIMERS));
      return INITIAL_PRESET_TIMERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PRESET_TIMERS;
  }
}

export function savePresetTimers(timers: PresetTimer[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PRESET_TIMERS, JSON.stringify(timers));
  } catch {}
}

export function loadStudentSettings(studentId?: string | null): StudentCustomSettings {
  try {
    const key = studentId
      ? `${STORAGE_KEYS.STUDENT_SETTINGS}_${studentId}`
      : STORAGE_KEYS.STUDENT_SETTINGS;
    const raw = localStorage.getItem(key);
    if (!raw) {
      // fallback to global student settings if student-specific not found
      if (studentId) {
        const globalRaw = localStorage.getItem(STORAGE_KEYS.STUDENT_SETTINGS);
        if (globalRaw) return { ...DEFAULT_STUDENT_SETTINGS, ...JSON.parse(globalRaw) };
      }
      return DEFAULT_STUDENT_SETTINGS;
    }
    return { ...DEFAULT_STUDENT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STUDENT_SETTINGS;
  }
}

export function saveStudentSettings(settings: StudentCustomSettings, studentId?: string | null) {
  try {
    const key = studentId
      ? `${STORAGE_KEYS.STUDENT_SETTINGS}_${studentId}`
      : STORAGE_KEYS.STUDENT_SETTINGS;
    localStorage.setItem(key, JSON.stringify(settings));
    // also save to global default for seamless experience
    localStorage.setItem(STORAGE_KEYS.STUDENT_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save student settings', e);
  }
}

// Formatters
export function formatSecondsToKorean(seconds: number): string {
  if (!seconds || seconds <= 0) return '0초';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (hrs > 0) parts.push(`${hrs}시간`);
  if (mins > 0) parts.push(`${mins}분`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}초`);

  return parts.join(' ');
}

export function formatSecondsDigital(seconds: number): string {
  const isNegative = seconds < 0;
  const absSec = Math.abs(Math.floor(seconds));
  const hrs = Math.floor(absSec / 3600);
  const mins = Math.floor((absSec % 3600) / 60);
  const secs = absSec % 60;

  const hStr = hrs > 0 ? `${hrs.toString().padStart(2, '0')}:` : '';
  const mStr = mins.toString().padStart(2, '0');
  const sStr = secs.toString().padStart(2, '0');

  return `${isNegative ? '-' : ''}${hStr}${mStr}:${sStr}`;
}

// -------------------------------------------------------------
// Backup & Restore (JSON Export / Import)
// -------------------------------------------------------------
export const DEFAULT_FIREBASE_SYNC_CONFIG: FirebaseSyncConfig = {
  enabled: true,
  apiKey: '',
  authDomain: '',
  databaseURL: '',
  projectId: '',
  appId: '',
  syncRoomId: 'SPEED_TOEIC_ROOM_1',
  autoSync: true,
  lastSyncStatus: 'disconnected',
};

export function loadFirebaseSyncConfig(): FirebaseSyncConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FIREBASE_SYNC_CONFIG);
    if (!raw) return DEFAULT_FIREBASE_SYNC_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_FIREBASE_SYNC_CONFIG,
      ...parsed,
      enabled: parsed.enabled !== undefined ? parsed.enabled : true,
      syncRoomId: parsed.syncRoomId || 'SPEED_TOEIC_ROOM_1',
    };
  } catch {
    return DEFAULT_FIREBASE_SYNC_CONFIG;
  }
}

export function saveFirebaseSyncConfig(config: FirebaseSyncConfig) {
  try {
    localStorage.setItem(STORAGE_KEYS.FIREBASE_SYNC_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save firebase sync config', e);
  }
}

export function getFullAppBackupData(): AppBackupData {
  const students = loadStudents();
  const adminSettings = loadAdminSettings();
  const presetTimers = loadPresetTimers();
  const notices = loadNotices();
  const studentSettings = loadStudentSettings();

  const totalStudySeconds = students.reduce((acc, s) => acc + (s.totalStudySeconds || 0), 0);
  const totalStudyHours = Math.round((totalStudySeconds / 3600) * 10) / 10;

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    sourceDevice: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop PC',
    students,
    adminSettings,
    presetTimers,
    notices,
    studentSettings,
    metadata: {
      totalStudents: students.length,
      totalPresets: presetTimers.length,
      appName: adminSettings.appKoreanName || '스토 타이머',
      totalStudyHours,
    },
  };
}

export function downloadAppDataAsJson(customFilename?: string): string {
  const backupData = getFullAppBackupData();
  const jsonStr = JSON.stringify(backupData, null, 2);

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const filename = customFilename || `speed-toeic-backup_${dateStr}.json`;

  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}

export function importAppData(
  raw: unknown,
  options: { importPersonalSettings?: boolean } = { importPersonalSettings: false }
): {
  success: boolean;
  message: string;
  data?: AppBackupData;
} {
  try {
    let parsed: any;
    if (typeof raw === 'string') {
      parsed = JSON.parse(raw);
    } else if (raw && typeof raw === 'object') {
      parsed = raw;
    } else {
      return { success: false, message: '유효한 JSON 형식이 아닙니다.' };
    }

    if (!parsed || typeof parsed !== 'object') {
      return { success: false, message: '데이터 파일 내용이 비어있거나 올바르지 않습니다.' };
    }

    // Validation: at least one core section should exist
    const hasStudents = Array.isArray(parsed.students);
    const hasTimers = Array.isArray(parsed.presetTimers);
    const hasSettings = parsed.adminSettings && typeof parsed.adminSettings === 'object';
    const hasNotices = Array.isArray(parsed.notices);

    if (!hasStudents && !hasTimers && !hasSettings && !hasNotices) {
      return {
        success: false,
        message: '스토 타이머의 백업 데이터 형식이 아닙니다. (students, presetTimers, adminSettings 누락)',
      };
    }

    // Validate and save students
    let appliedStudents: Student[] = loadStudents();
    if (hasStudents) {
      const currentStudents = loadStudents();
      const currentMap = new Map(currentStudents.map((s) => [s.id, s]));

      appliedStudents = parsed.students
        .filter((s: any) => s && typeof s.id === 'string' && typeof s.name === 'string')
        .map((incoming: Student) => {
          const local = currentMap.get(incoming.id);
          if (!local) return incoming;

          // Preserve the higher cumulative study time between devices
          const maxTotal = Math.max(incoming.totalStudySeconds || 0, local.totalStudySeconds || 0);
          const maxToday = Math.max(incoming.todayStudySeconds || 0, local.todayStudySeconds || 0);

          return {
            ...incoming,
            totalStudySeconds: maxTotal,
            todayStudySeconds: maxToday,
            lastStudiedAt:
              local.lastStudiedAt && (!incoming.lastStudiedAt || local.lastStudiedAt > incoming.lastStudiedAt)
                ? local.lastStudiedAt
                : incoming.lastStudiedAt,
          };
        });

      // Retain any local students that do not exist yet in incoming remote data
      for (const [id, localStudent] of currentMap.entries()) {
        if (!appliedStudents.some((s) => s.id === id)) {
          appliedStudents.push(localStudent);
        }
      }

      saveStudents(appliedStudents);
    }

    // Validate and save settings
    let appliedSettings: AdminSettings = loadAdminSettings();
    if (hasSettings) {
      const existingSettings = loadAdminSettings();
      const rawIncoming = parsed.adminSettings;
      const validPw =
        rawIncoming.adminPasswordHash && rawIncoming.adminPasswordHash !== '***PROTECTED***'
          ? rawIncoming.adminPasswordHash
          : existingSettings.adminPasswordHash || 'admin1234';

      appliedSettings = {
        ...existingSettings,
        ...rawIncoming,
        adminPasswordHash: validPw,
      };
      saveAdminSettings(appliedSettings);
    }

    // Validate and save presets
    let appliedPresets: PresetTimer[] = loadPresetTimers();
    if (hasTimers) {
      appliedPresets = parsed.presetTimers.filter(
        (t: any) => t && typeof t.id === 'string' && typeof t.name === 'string'
      );
      savePresetTimers(appliedPresets);
    }

    // Validate and save notices
    let appliedNotices: Notice[] = loadNotices();
    if (hasNotices) {
      appliedNotices = parsed.notices.filter(
        (n: any) => n && typeof n.id === 'string' && typeof n.title === 'string'
      );
      saveNotices(appliedNotices);
    }

    // Validate and save student settings ONLY if explicitly requested (e.g. manual full backup restore)
    // Server synchronization MUST NOT overwrite user's local personal clock/theme settings!
    let appliedStudentSettings = loadStudentSettings();
    if (options?.importPersonalSettings && parsed.studentSettings && typeof parsed.studentSettings === 'object') {
      appliedStudentSettings = {
        ...DEFAULT_STUDENT_SETTINGS,
        ...parsed.studentSettings,
      };
      saveStudentSettings(appliedStudentSettings);
    }

    const fullData: AppBackupData = {
      version: parsed.version || 1,
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      sourceDevice: parsed.sourceDevice,
      students: appliedStudents,
      adminSettings: appliedSettings,
      presetTimers: appliedPresets,
      notices: appliedNotices,
      studentSettings: appliedStudentSettings,
      metadata: {
        totalStudents: appliedStudents.length,
        totalPresets: appliedPresets.length,
        appName: appliedSettings.appKoreanName,
        totalStudyHours: Math.round(
          (appliedStudents.reduce((acc, s) => acc + (s.totalStudySeconds || 0), 0) / 3600) * 10
        ) / 10,
      },
    };

    return {
      success: true,
      message: `성공적으로 데이터를 불러왔습니다! (수강생 ${appliedStudents.length}명, 타이머 ${appliedPresets.length}개, 공지 ${appliedNotices.length}개)`,
      data: fullData,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `데이터 파싱 중 오류가 발생했습니다: ${err?.message || '알 수 없는 오류'}`,
    };
  }
}
