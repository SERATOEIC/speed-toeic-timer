export type ClockStyle = 'classic' | 'minimal' | 'modern' | 'roman';
export type ClockThemeColor = 'blue' | 'dark' | 'midnight' | 'emerald' | 'amber';

export interface StudentCustomSettings {
  showSecondHand: boolean; // toggle second hand visibility to reduce distraction
  clockStyle: ClockStyle; // classic, minimal, modern, roman
  themeColor: ClockThemeColor; // blue, dark, midnight, emerald, amber
}

export interface Student {
  id: string;
  name: string; // Cannot be changed once registered without admin
  registeredAt: string;
  status: 'approved' | 'pending' | 'rejected';
  totalStudySeconds: number; // Cumulative study time in seconds
  todayStudySeconds: number;
  lastStudiedAt?: string;
  targetScore?: string;
  notes?: string;
  customSettings?: StudentCustomSettings;
}


export interface Notice {
  id: string;
  title: string;
  content: string;
  category: '공지' | '필독' | '이벤트' | '특강';
  createdAt: string;
  isPinned?: boolean;
}

export interface PresetTimer {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  category: 'RC' | 'LC+RC' | 'PART' | 'CUSTOM';
  includeMarking: boolean;
}

export type UICardStyle = 'slate' | 'midnight' | 'pitch' | 'charcoal';
export type UIFontSize = 'normal' | 'large' | 'compact';
export type UITextColor = 'slate' | 'pure_white' | 'gold_accent' | 'sky_accent';
export type UIAccentColor = 'blue' | 'sky' | 'indigo' | 'emerald' | 'amber';

export type DashboardBlockId =
  | 'banner'
  | 'podium'
  | 'preset_timers'
  | 'custom_timer'
  | 'notices';

export interface AdminSettings {
  appKoreanName: string;
  appEnglishName: string;
  showAppBadge?: boolean; // false by default (메인 타이틀 우측 뱃지 제거/표시 제어)
  headerSubtitle?: string; // 상단 헤더 소제목
  showSubtitle?: boolean; // 상단 헤더 소제목 표시 여부
  bannerTag?: string; // 배너 상단 태그
  showBannerTag?: boolean; // 배너 상단 태그 표시 여부
  homeGreetingQuote: string; // 배너 메인 문구
  showHomeGreeting?: boolean; // 배너 메인 문구 표시 여부
  homeSubQuote: string; // 배너 서브 문구
  showHomeSubQuote?: boolean; // 배너 서브 문구 표시 여부
  appLogoUrl: string; // image url or data url
  clockCenterLogoUrl: string; // center emblem
  backgroundImageUrl: string; // custom background
  backgroundOverlayOpacity: number; // 0.1 ~ 0.95
  adminPasswordHash: string; // default admin1234
  // Detailed styling controls
  uiCardStyle?: UICardStyle;
  uiFontSize?: UIFontSize;
  uiTextColor?: UITextColor;
  uiAccentColor?: UIAccentColor;
  // Dashboard block order
  blockOrder?: DashboardBlockId[];
}

export type TimerMode = 'preset' | 'custom' | 'stopwatch';

export interface ActiveSession {
  mode: TimerMode;
  timerName: string;
  targetSeconds: number; // 0 for stopwatch
  elapsedSeconds: number;
  isRunning: boolean;
  startedAt: number; // timestamp
}

export interface LiveTimerState {
  isActive: boolean;
  timerName: string;
  targetSeconds: number;
  activeStudentName?: string;
  startedAt?: number;
  updatedAt?: number;
}

export interface AppBackupData {
  version: number;
  exportedAt: string;
  sourceDevice?: string;
  pushedByClientId?: string;
  pushedAt?: number;
  students: Student[];
  adminSettings: AdminSettings;
  presetTimers: PresetTimer[];
  notices: Notice[];
  studentSettings?: StudentCustomSettings;
  liveTimer?: LiveTimerState;
  metadata?: {
    totalStudents: number;
    totalPresets: number;
    appName: string;
    totalStudyHours: number;
  };
}

export type SyncStatus = 'connected' | 'connecting' | 'disconnected' | 'syncing' | 'error';

export interface FirebaseSyncConfig {
  enabled: boolean;
  apiKey: string;
  authDomain?: string;
  databaseURL: string;
  projectId: string;
  appId?: string;
  syncRoomId: string;
  autoSync: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: SyncStatus;
  lastErrorMessage?: string;
}

