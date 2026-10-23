import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  AdminSettings,
  Student,
  Notice,
  PresetTimer,
  UICardStyle,
  UIFontSize,
  UITextColor,
  UIAccentColor,
  DashboardBlockId,
  AppBackupData,
  FirebaseSyncConfig,
  SyncStatus,
} from '../types';
import {
  formatSecondsToKorean,
  getFullAppBackupData,
  downloadAppDataAsJson,
  importAppData,
  loadFirebaseSyncConfig,
  saveFirebaseSyncConfig,
  saveAdminSessionPassword,
  getAdminSessionPassword,
} from '../utils/storage';
import {
  testFirebaseConnection,
  pushDataToFirebase,
  pullDataFromFirebase,
  sanitizeDatabaseUrl,
  uploadImageToServer,
  compressImageDataUrl,
} from '../utils/firebaseSync';
import {
  Settings,
  Image as ImageIcon,
  UserCheck,
  Trophy,
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  Check,
  Edit2,
  Upload,
  Download,
  ShieldCheck,
  Sliders,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  Palette,
  Type,
  Layers,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Move,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  X,
  Database,
  Cloud,
  CloudOff,
  Share2,
  Smartphone,
  Laptop,
  FileJson,
  Copy,
  ArrowRightLeft,
  Info,
} from 'lucide-react';

interface AdminPanelProps {
  settings: AdminSettings;
  students: Student[];
  notices: Notice[];
  presets: PresetTimer[];
  syncConfig?: FirebaseSyncConfig;
  syncStatus?: SyncStatus;
  syncStatusMsg?: string | null;
  onUpdateSyncConfig?: (newConfig: FirebaseSyncConfig) => void;
  initialTab?:
    | 'text_management'
    | 'layout_blocks'
    | 'naming_design'
    | 'approvals'
    | 'full_ranking'
    | 'timers'
    | 'notices'
    | 'password'
    | 'data_sync';
  onUpdateSettings: (newSettings: AdminSettings) => void;
  onUpdateStudents: (newStudents: Student[]) => void;
  onUpdateNotices: (newNotices: Notice[]) => void;
  onUpdatePresets: (newPresets: PresetTimer[]) => void;
  onImportData?: (newBackup: AppBackupData) => void;
  onClose: () => void;
  onLogout?: () => void;
}

const BLOCK_META: Record<
  DashboardBlockId,
  { label: string; desc: string; icon: string }
> = {
  banner: {
    label: '동기부여 배너',
    desc: '실전은 스피드다! 강조 슬로건, MOTIVATION 태그, 최신 공지 뱃지',
    icon: '🔥',
  },
  podium: {
    label: '명예의 전당 (TOP 3)',
    desc: '누적 순공 상위 1위(챔피언 골드), 2위(실버), 3위(브론즈) 포디엄 랭킹',
    icon: '🏆',
  },
  preset_timers: {
    label: '실전 고사장 타이머 선택',
    desc: 'RC 75분, LC+RC 120분, Part별 집중 타임어택 고정 프리셋 카드 그리드',
    icon: '⏱️',
  },
  custom_timer: {
    label: '사용자 직접 시간 지정 영역',
    desc: '원하는 분(min)을 직접 입력하여 아날로그 시계 타이머를 시작하는 바 형태 UI',
    icon: '⚙️',
  },
  notices: {
    label: '학원 최신 공지 & 꿀팁 섹션',
    desc: '학원 실전 시험 공지, 특강 일정 및 토익 실전 꿀팁 카드 목록',
    icon: '📢',
  },
};

const DEFAULT_BLOCKS: DashboardBlockId[] = [
  'banner',
  'podium',
  'preset_timers',
  'custom_timer',
  'notices',
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  settings,
  students,
  notices,
  presets,
  syncConfig: initialSyncConfigProp,
  syncStatus: syncStatusProp,
  syncStatusMsg: syncStatusMsgProp,
  onUpdateSyncConfig,
  initialTab = 'text_management',
  onUpdateSettings,
  onUpdateStudents,
  onUpdateNotices,
  onUpdatePresets,
  onImportData,
  onClose,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'text_management'
    | 'layout_blocks'
    | 'naming_design'
    | 'approvals'
    | 'full_ranking'
    | 'timers'
    | 'notices'
    | 'password'
    | 'data_sync'
  >(initialTab);

  // Form states for text & design settings
  const [appKoreanName, setAppKoreanName] = useState(settings.appKoreanName);
  const [appEnglishName, setAppEnglishName] = useState(settings.appEnglishName);
  const [showAppBadge, setShowAppBadge] = useState<boolean>(settings.showAppBadge ?? false);
  const [headerSubtitle, setHeaderSubtitle] = useState(
    settings.headerSubtitle || '토익 고사장 아날로그 시계 체화 & 실시간 누적 순공 관리'
  );
  const [showSubtitle, setShowSubtitle] = useState<boolean>(settings.showSubtitle ?? true);
  const [bannerTag, setBannerTag] = useState(settings.bannerTag || 'SPEED TOEIC MOTIVATION');
  const [showBannerTag, setShowBannerTag] = useState<boolean>(settings.showBannerTag ?? true);
  const [homeGreetingQuote, setHomeGreetingQuote] = useState(settings.homeGreetingQuote);
  const [showHomeGreeting, setShowHomeGreeting] = useState<boolean>(settings.showHomeGreeting ?? true);
  const [homeSubQuote, setHomeSubQuote] = useState(settings.homeSubQuote);
  const [showHomeSubQuote, setShowHomeSubQuote] = useState<boolean>(settings.showHomeSubQuote ?? true);

  // Design form states
  const [appLogoUrl, setAppLogoUrl] = useState(settings.appLogoUrl);
  const [clockCenterLogoUrl, setClockCenterLogoUrl] = useState(settings.clockCenterLogoUrl);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(settings.backgroundImageUrl);
  const [backgroundOverlayOpacity, setBackgroundOverlayOpacity] = useState(
    settings.backgroundOverlayOpacity || 0.8
  );
  const [uiCardStyle, setUiCardStyle] = useState<UICardStyle>(settings.uiCardStyle || 'slate');
  const [uiFontSize, setUiFontSize] = useState<UIFontSize>(settings.uiFontSize || 'normal');
  const [uiTextColor, setUiTextColor] = useState<UITextColor>(settings.uiTextColor || 'pure_white');
  const [uiAccentColor, setUiAccentColor] = useState<UIAccentColor>(settings.uiAccentColor || 'blue');

  // Block layout order state
  const [currentBlockOrder, setCurrentBlockOrder] = useState<DashboardBlockId[]>(() => {
    const saved = settings.blockOrder || DEFAULT_BLOCKS;
    const res = [...saved];
    for (const b of DEFAULT_BLOCKS) {
      if (!res.includes(b)) res.push(b);
    }
    return res;
  });

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Student filter & search for ranking
  const [rankingSearch, setRankingSearch] = useState('');

  // New student direct creation form state
  const [manualStudentName, setManualStudentName] = useState('');
  const [manualStudentTarget, setManualStudentTarget] = useState('목표 900+');

  // Notice form state
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeCategory, setNewNoticeCategory] = useState<'공지' | '필독' | '이벤트' | '특강'>('공지');
  const [newNoticePinned, setNewNoticePinned] = useState(false);

  // Preset form state
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetMinutes, setNewPresetMinutes] = useState(60);
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [newPresetCategory, setNewPresetCategory] = useState<'RC' | 'LC+RC' | 'PART' | 'CUSTOM'>('RC');
  const [newPresetMarking, setNewPresetMarking] = useState(true);

  // Password management states
  const [currentPwInput, setCurrentPwInput] = useState('');
  const [newPwInput, setNewPwInput] = useState('');
  const [confirmPwInput, setConfirmPwInput] = useState('');
  const [pwErrorMsg, setPwErrorMsg] = useState<string | null>(null);
  const [pwSuccessMsg, setPwSuccessMsg] = useState<string | null>(null);

  // Data Sync & Backup States
  const [syncConfig, setSyncConfig] = useState<FirebaseSyncConfig>(() => initialSyncConfigProp || loadFirebaseSyncConfig());
  const [fbEnabled, setFbEnabled] = useState<boolean>(syncConfig.enabled);
  const [fbApiKey, setFbApiKey] = useState<string>(syncConfig.apiKey || '');
  const [fbDatabaseUrl, setFbDatabaseUrl] = useState<string>(syncConfig.databaseURL || '');
  const [fbProjectId, setFbProjectId] = useState<string>(syncConfig.projectId || '');
  const [fbAuthDomain, setFbAuthDomain] = useState<string>(syncConfig.authDomain || '');
  const [fbAppId, setFbAppId] = useState<string>(syncConfig.appId || '');
  const [fbSyncRoomId, setFbSyncRoomId] = useState<string>(syncConfig.syncRoomId || 'SPEED_TOEIC_ROOM_1');
  const [fbAutoSync, setFbAutoSync] = useState<boolean>(syncConfig.autoSync ?? true);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    syncStatusProp !== undefined ? syncStatusProp : syncConfig.enabled ? syncConfig.lastSyncStatus || 'disconnected' : 'disconnected'
  );
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(
    syncStatusMsgProp || syncConfig.lastErrorMessage || null
  );

  // Sync state if props change from parent App
  React.useEffect(() => {
    if (initialSyncConfigProp) {
      setSyncConfig(initialSyncConfigProp);
      setFbEnabled(initialSyncConfigProp.enabled);
      setFbApiKey(initialSyncConfigProp.apiKey || '');
      setFbDatabaseUrl(initialSyncConfigProp.databaseURL || '');
      setFbProjectId(initialSyncConfigProp.projectId || '');
      setFbAuthDomain(initialSyncConfigProp.authDomain || '');
      setFbAppId(initialSyncConfigProp.appId || '');
      setFbSyncRoomId(initialSyncConfigProp.syncRoomId || 'SPEED_TOEIC_ROOM_1');
      setFbAutoSync(initialSyncConfigProp.autoSync ?? true);
    }
  }, [initialSyncConfigProp]);

  React.useEffect(() => {
    if (syncStatusProp !== undefined) {
      setSyncStatus(syncStatusProp);
    }
  }, [syncStatusProp]);

  React.useEffect(() => {
    if (syncStatusMsgProp !== undefined) {
      setSyncStatusMsg(syncStatusMsgProp);
    }
  }, [syncStatusMsgProp]);

  // Synchronize internal form states when settings change from remote server updates
  React.useEffect(() => {
    setAppKoreanName(settings.appKoreanName);
    setAppEnglishName(settings.appEnglishName);
    setShowAppBadge(settings.showAppBadge ?? false);
    setHeaderSubtitle(settings.headerSubtitle || '토익 고사장 아날로그 시계 체화 & 실시간 누적 순공 관리');
    setShowSubtitle(settings.showSubtitle ?? true);
    setBannerTag(settings.bannerTag || 'SPEED TOEIC MOTIVATION');
    setShowBannerTag(settings.showBannerTag ?? true);
    setHomeGreetingQuote(settings.homeGreetingQuote);
    setShowHomeGreeting(settings.showHomeGreeting ?? true);
    setHomeSubQuote(settings.homeSubQuote);
    setShowHomeSubQuote(settings.showHomeSubQuote ?? true);
    setAppLogoUrl(settings.appLogoUrl || '');
    setClockCenterLogoUrl(settings.clockCenterLogoUrl || '');
    setBackgroundImageUrl(settings.backgroundImageUrl || '');
    setBackgroundOverlayOpacity(settings.backgroundOverlayOpacity || 0.8);
    setUiCardStyle(settings.uiCardStyle || 'slate');
    setUiFontSize(settings.uiFontSize || 'normal');
    setUiTextColor(settings.uiTextColor || 'pure_white');
    setUiAccentColor(settings.uiAccentColor || 'blue');
    if (settings.blockOrder) {
      setCurrentBlockOrder(settings.blockOrder);
    }
  }, [settings]);

  const [isSyncTesting, setIsSyncTesting] = useState(false);
  const [isSyncPushing, setIsSyncPushing] = useState(false);
  const [isSyncPulling, setIsSyncPulling] = useState(false);
  const [syncActionFeedback, setSyncActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [copyJsonFeedback, setCopyJsonFeedback] = useState(false);
  const [copyRoomFeedback, setCopyRoomFeedback] = useState(false);
  const [showRawJsonModal, setShowRawJsonModal] = useState(false);
  const [rawJsonInput, setRawJsonInput] = useState('');
  const [importConfirmData, setImportConfirmData] = useState<AppBackupData | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Flash message
  const triggerSaveMsg = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Trigger JSON Export Download
  const handleExportJson = () => {
    try {
      const filename = downloadAppDataAsJson();
      triggerSaveMsg(`[${filename}] 백업 파일이 다운로드되었습니다.`);
    } catch (err: any) {
      alert('백업 파일 다운로드 중 오류가 발생했습니다: ' + err.message);
    }
  };

  // Trigger File Import via file picker
  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const res = importAppData(text);
        if (res.success && res.data) {
          setImportConfirmData(res.data);
        } else {
          alert(`백업 파일 오류: ${res.message}`);
        }
      } catch (err: any) {
        alert('백업 파일을 파싱하는 데 실패했습니다: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Confirm and Apply Imported Data
  const handleApplyImportedData = () => {
    if (!importConfirmData) return;

    if (onImportData) {
      onImportData(importConfirmData);
    } else {
      // Fallback
      if (importConfirmData.students) onUpdateStudents(importConfirmData.students);
      if (importConfirmData.adminSettings) onUpdateSettings(importConfirmData.adminSettings);
      if (importConfirmData.notices) onUpdateNotices(importConfirmData.notices);
      if (importConfirmData.presetTimers) onUpdatePresets(importConfirmData.presetTimers);
    }

    // Sync local form states
    if (importConfirmData.adminSettings) {
      setAppKoreanName(importConfirmData.adminSettings.appKoreanName);
      setAppEnglishName(importConfirmData.adminSettings.appEnglishName);
      setShowAppBadge(importConfirmData.adminSettings.showAppBadge ?? false);
      setHeaderSubtitle(importConfirmData.adminSettings.headerSubtitle || '');
      setShowSubtitle(importConfirmData.adminSettings.showSubtitle ?? true);
      setBannerTag(importConfirmData.adminSettings.bannerTag || '');
      setShowBannerTag(importConfirmData.adminSettings.showBannerTag ?? true);
      setHomeGreetingQuote(importConfirmData.adminSettings.homeGreetingQuote || '');
      setShowHomeGreeting(importConfirmData.adminSettings.showHomeGreeting ?? true);
      setHomeSubQuote(importConfirmData.adminSettings.homeSubQuote || '');
      setShowHomeSubQuote(importConfirmData.adminSettings.showHomeSubQuote ?? true);
      setAppLogoUrl(importConfirmData.adminSettings.appLogoUrl || '');
      setClockCenterLogoUrl(importConfirmData.adminSettings.clockCenterLogoUrl || '');
      setBackgroundImageUrl(importConfirmData.adminSettings.backgroundImageUrl || '');
      setBackgroundOverlayOpacity(importConfirmData.adminSettings.backgroundOverlayOpacity || 0.8);
      setUiCardStyle(importConfirmData.adminSettings.uiCardStyle || 'slate');
      setUiFontSize(importConfirmData.adminSettings.uiFontSize || 'normal');
      setUiTextColor(importConfirmData.adminSettings.uiTextColor || 'pure_white');
      setUiAccentColor(importConfirmData.adminSettings.uiAccentColor || 'blue');
      if (importConfirmData.adminSettings.blockOrder) {
        setCurrentBlockOrder(importConfirmData.adminSettings.blockOrder);
      }
    }

    setImportConfirmData(null);
    triggerSaveMsg('불러온 데이터가 성공적으로 전체 시스템에 적용되었습니다!');
  };

  // Copy JSON string to clipboard
  const handleCopyJsonToClipboard = () => {
    try {
      const data = getFullAppBackupData();
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopyJsonFeedback(true);
      setTimeout(() => setCopyJsonFeedback(false), 2500);
      triggerSaveMsg('클립보드에 전체 백업 JSON 데이터가 복사되었습니다.');
    } catch {
      alert('클립보드 복사 권한이 거부되었습니다.');
    }
  };

  // Import from Raw Textarea
  const handleImportRawJsonText = () => {
    if (!rawJsonInput.trim()) {
      alert('JSON 텍스트를 입력해 주세요.');
      return;
    }
    const res = importAppData(rawJsonInput.trim());
    if (res.success && res.data) {
      setImportConfirmData(res.data);
      setShowRawJsonModal(false);
      setRawJsonInput('');
    } else {
      alert(`JSON 텍스트 오류: ${res.message}`);
    }
  };

  // Generate random room code
  const handleGenerateRoomCode = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newRoom = `SPEED_TOEIC_${randomSuffix}`;
    setFbSyncRoomId(newRoom);
    triggerSaveMsg(`새 룸 코드 [${newRoom}] 가 생성되었습니다. [설정 저장 및 연결 테스트]를 누르면 즉시 적용됩니다.`);
  };

  // Copy room code to clipboard
  const handleCopyRoomCode = () => {
    if (!fbSyncRoomId) return;
    try {
      navigator.clipboard.writeText(fbSyncRoomId.trim());
      setCopyRoomFeedback(true);
      setTimeout(() => setCopyRoomFeedback(false), 2500);
      triggerSaveMsg(`룸 코드 [${fbSyncRoomId.trim()}] 가 클립보드에 복사되었습니다.`);
    } catch {
      alert('클립보드 복사 권한이 거부되었습니다.');
    }
  };

  // Auto-fill Database URL if Project ID is typed
  const handleProjectIdChange = (val: string) => {
    setFbProjectId(val);
    if (!fbDatabaseUrl || fbDatabaseUrl.includes('-default-rtdb.firebaseio.com')) {
      const trimmed = val.trim();
      if (trimmed) {
        setFbDatabaseUrl(`https://${trimmed}-default-rtdb.firebaseio.com`);
      }
    }
  };

  // Save Firebase Sync Config & Test Connection
  const handleSaveAndConnectFirebase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncTesting(true);
    setSyncActionFeedback(null);

    const cleanDbUrl = sanitizeDatabaseUrl(fbDatabaseUrl, fbProjectId);

    const newConfig: FirebaseSyncConfig = {
      enabled: fbEnabled,
      apiKey: fbApiKey.trim(),
      authDomain: fbAuthDomain.trim() || (fbProjectId.trim() ? `${fbProjectId.trim()}.firebaseapp.com` : ''),
      databaseURL: cleanDbUrl,
      projectId: fbProjectId.trim(),
      appId: fbAppId.trim(),
      syncRoomId: fbSyncRoomId.trim() || 'SPEED_TOEIC_ROOM_1',
      autoSync: fbAutoSync,
      lastSyncStatus: 'connecting',
    };

    saveFirebaseSyncConfig(newConfig);
    setSyncConfig(newConfig);
    if (onUpdateSyncConfig) {
      onUpdateSyncConfig(newConfig);
    }

    if (!fbEnabled) {
      setIsSyncTesting(false);
      setSyncStatus('disconnected');
      setSyncActionFeedback({
        type: 'success',
        message: '실시간 동기화가 비활성화(오프라인 모드)되었습니다.',
      });
      triggerSaveMsg('실시간 동기화 설정이 저장되었습니다.');
      return;
    }

    const testRes = await testFirebaseConnection(newConfig);
    setIsSyncTesting(false);

    if (testRes.success) {
      setSyncStatus('connected');
      setSyncStatusMsg('연결 성공: 실시간 동기화 활성화됨');
      setSyncActionFeedback({ type: 'success', message: testRes.message });
      triggerSaveMsg('Firebase Realtime Database에 성공적으로 연결되었습니다!');
    } else {
      setSyncStatus('error');
      setSyncStatusMsg(testRes.message);
      setSyncActionFeedback({ type: 'error', message: testRes.message });
    }
  };

  // Push local data to Firebase RTDB
  const handlePushToFirebase = async () => {
    setIsSyncPushing(true);
    setSyncActionFeedback(null);
    const activeConfig: FirebaseSyncConfig = {
      ...syncConfig,
      enabled: fbEnabled,
      apiKey: fbApiKey.trim(),
      authDomain: fbAuthDomain.trim() || (fbProjectId.trim() ? `${fbProjectId.trim()}.firebaseapp.com` : ''),
      databaseURL: sanitizeDatabaseUrl(fbDatabaseUrl, fbProjectId),
      projectId: fbProjectId.trim(),
      appId: fbAppId.trim(),
      syncRoomId: fbSyncRoomId.trim() || 'SPEED_TOEIC_ROOM_1',
      autoSync: fbAutoSync,
    };
    const res = await pushDataToFirebase(activeConfig);
    setIsSyncPushing(false);

    if (res.success) {
      setSyncStatus('connected');
      setSyncActionFeedback({ type: 'success', message: res.message });
      triggerSaveMsg(res.message);
    } else {
      setSyncActionFeedback({ type: 'error', message: res.message });
    }
  };

  // Pull remote data from Firebase RTDB
  const handlePullFromFirebase = async () => {
    setIsSyncPulling(true);
    setSyncActionFeedback(null);
    const activeConfig: FirebaseSyncConfig = {
      ...syncConfig,
      enabled: fbEnabled,
      apiKey: fbApiKey.trim(),
      authDomain: fbAuthDomain.trim() || (fbProjectId.trim() ? `${fbProjectId.trim()}.firebaseapp.com` : ''),
      databaseURL: sanitizeDatabaseUrl(fbDatabaseUrl, fbProjectId),
      projectId: fbProjectId.trim(),
      appId: fbAppId.trim(),
      syncRoomId: fbSyncRoomId.trim() || 'SPEED_TOEIC_ROOM_1',
      autoSync: fbAutoSync,
    };
    const res = await pullDataFromFirebase(activeConfig);
    setIsSyncPulling(false);

    if (res.success && res.data) {
      setImportConfirmData(res.data);
      setSyncStatus('connected');
      setSyncActionFeedback({
        type: 'success',
        message: '클라우드로부터 최신 데이터를 수신했습니다. 내용 확인 후 적용해 주세요.',
      });
    } else {
      setSyncActionFeedback({ type: 'error', message: res.message });
    }
  };

  // Image file upload helper (uploads to server for cross-device sync fidelity, with safe compression fallback)
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    fieldLabel: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('이미지 파일 크기는 10MB 이하만 가능합니다.');
        return;
      }
      triggerSaveMsg(`${fieldLabel} 이미지 처리 중...`);
      const reader = new FileReader();
      reader.onload = async () => {
        const rawDataUrl = reader.result as string;
        try {
          const res = await uploadImageToServer(rawDataUrl, fieldLabel);
          if (res.success && res.url) {
            setter(res.url);
            triggerSaveMsg(`${fieldLabel} 이미지가 서버에 저장되었습니다. [디자인 저장하기]를 누르면 모바일과 PC에 즉시 동기화됩니다.`);
            return;
          }
        } catch {}

        // Fallback: lightweight canvas compression to prevent localStorage QuotaExceededError and EventSource truncation
        const compressed = await compressImageDataUrl(rawDataUrl, 400, 0.85);
        setter(compressed);
        triggerSaveMsg(`${fieldLabel} 이미지가 적용되었습니다. [디자인 저장하기]를 누르면 저장됩니다.`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Curated Preset Backgrounds
  const backgroundPresets = [
    {
      title: '모던 스터디 카페',
      url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1920&q=80',
    },
    {
      title: '실전 고사장 교실',
      url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1920&q=80',
    },
    {
      title: '다크 서재 스튜디오',
      url: 'https://images.unsplash.com/photo-1507842229451-7f01be8510ab?auto=format&fit=crop&w=1920&q=80',
    },
  ];

  // Save Text & Design Settings
  const handleSaveTextAndDesign = () => {
    const updated: AdminSettings = {
      ...settings,
      appKoreanName: appKoreanName.trim() || '스피드토익 수강생 전용 타이머',
      appEnglishName: appEnglishName.trim() || 'SPEED TOEIC TIMER',
      showAppBadge,
      headerSubtitle: headerSubtitle.trim(),
      showSubtitle,
      bannerTag: bannerTag.trim(),
      showBannerTag,
      homeGreetingQuote,
      showHomeGreeting,
      homeSubQuote,
      showHomeSubQuote,
      appLogoUrl,
      clockCenterLogoUrl,
      backgroundImageUrl,
      backgroundOverlayOpacity,
      uiCardStyle,
      uiFontSize,
      uiTextColor,
      uiAccentColor,
      blockOrder: currentBlockOrder,
    };
    onUpdateSettings(updated);
    triggerSaveMsg('설정이 성공적으로 저장되었습니다! 메인 화면에 즉시 적용됩니다.');
  };

  // Block Order Movement Handlers
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentBlockOrder.length) return;

    const newOrder = [...currentBlockOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    setCurrentBlockOrder(newOrder);
    const updated: AdminSettings = {
      ...settings,
      blockOrder: newOrder,
    };
    onUpdateSettings(updated);
    triggerSaveMsg(`[${BLOCK_META[moved].label}] 블록 순서가 이동되었습니다.`);
  };

  const handleResetBlockOrder = () => {
    setCurrentBlockOrder(DEFAULT_BLOCKS);
    const updated: AdminSettings = {
      ...settings,
      blockOrder: DEFAULT_BLOCKS,
    };
    onUpdateSettings(updated);
    triggerSaveMsg('블록 레이아웃이 기본 순서로 복원되었습니다.');
  };

  // Student Approvals & Actions
  const handleApproveStudent = (id: string) => {
    const next = students.map((s) => (s.id === id ? { ...s, status: 'approved' as const } : s));
    onUpdateStudents(next);
    triggerSaveMsg('수강생 가입 신청이 승인되었습니다. 이제 타이머를 시작할 수 있습니다.');
  };

  const handleRejectStudent = (id: string) => {
    const next = students.map((s) => (s.id === id ? { ...s, status: 'rejected' as const } : s));
    onUpdateStudents(next);
    triggerSaveMsg('수강생 가입이 거절 처리되었습니다.');
  };

  const handleDeleteStudent = (id: string) => {
    if (window.confirm('정말 이 수강생을 삭제하시겠습니까? 누적 순공 기록이 영구 삭제됩니다.')) {
      const next = students.filter((s) => s.id !== id);
      onUpdateStudents(next);
      triggerSaveMsg('수강생 정보가 삭제되었습니다.');
    }
  };

  const handleResetStudyTime = (id: string) => {
    if (window.confirm('해당 수강생의 공부 시간을 0초로 초기화하시겠습니까?')) {
      const next = students.map((s) =>
        s.id === id ? { ...s, totalStudySeconds: 0, todayStudySeconds: 0 } : s
      );
      onUpdateStudents(next);
      triggerSaveMsg('수강생 공부 시간이 초기화되었습니다.');
    }
  };

  const handleDirectAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualStudentName.trim();
    if (!trimmed) return;

    if (students.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('이미 동일한 이름의 수강생이 존재합니다.');
      return;
    }

    const newStudent: Student = {
      id: 'stu_' + Date.now(),
      name: trimmed,
      registeredAt: new Date().toISOString(),
      status: 'approved', // Admin direct add is pre-approved
      totalStudySeconds: 0,
      todayStudySeconds: 0,
      targetScore: manualStudentTarget.trim() || '목표 900+',
      notes: '관리자 직접 등록 (즉시 승인)',
    };

    onUpdateStudents([...students, newStudent]);
    setManualStudentName('');
    triggerSaveMsg(`[${trimmed}] 수강생이 즉시 등록 및 승인되었습니다.`);
  };

  // Notice Handlers
  const handleAddNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) return;

    const notice: Notice = {
      id: 'not_' + Date.now(),
      title: newNoticeTitle.trim(),
      content: newNoticeContent.trim(),
      category: newNoticeCategory,
      createdAt: new Date().toLocaleDateString('ko-KR', {
        month: 'numeric',
        day: 'numeric',
      }),
      isPinned: newNoticePinned,
    };

    onUpdateNotices([notice, ...notices]);
    setNewNoticeTitle('');
    setNewNoticeContent('');
    setNewNoticePinned(false);
    triggerSaveMsg('새 공지사항이 등록되었습니다.');
  };

  const handleDeleteNotice = (id: string) => {
    const next = notices.filter((n) => n.id !== id);
    onUpdateNotices(next);
    triggerSaveMsg('공지사항이 삭제되었습니다.');
  };

  // Preset Handlers
  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim() || newPresetMinutes <= 0) return;

    const preset: PresetTimer = {
      id: 'pre_' + Date.now(),
      name: newPresetName.trim(),
      durationMinutes: newPresetMinutes,
      category: newPresetCategory,
      description: newPresetDesc.trim() || '관리자 커스텀 실전 타이머',
      includeMarking: newPresetMarking,
    };

    onUpdatePresets([...presets, preset]);
    setNewPresetName('');
    setNewPresetMinutes(60);
    setNewPresetDesc('');
    triggerSaveMsg('새 고정 타이머가 추가되었습니다.');
  };

  const handleDeletePreset = (id: string) => {
    const next = presets.filter((p) => p.id !== id);
    onUpdatePresets(next);
    triggerSaveMsg('고정 타이머가 삭제되었습니다.');
  };

  // Preset Edit & Reorder Handlers
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editPresetName, setEditPresetName] = useState('');
  const [editPresetMinutes, setEditPresetMinutes] = useState(60);
  const [editPresetCategory, setEditPresetCategory] = useState<'RC' | 'LC+RC' | 'PART' | 'CUSTOM'>('RC');
  const [editPresetDesc, setEditPresetDesc] = useState('');
  const [editPresetMarking, setEditPresetMarking] = useState(true);

  const handleStartEditPreset = (p: PresetTimer) => {
    setEditingPresetId(p.id);
    setEditPresetName(p.name);
    setEditPresetMinutes(p.durationMinutes);
    setEditPresetCategory(p.category);
    setEditPresetDesc(p.description);
    setEditPresetMarking(p.includeMarking);
  };

  const handleCancelEditPreset = () => {
    setEditingPresetId(null);
  };

  const handleSaveEditPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPresetId || !editPresetName.trim() || editPresetMinutes <= 0) return;

    const next = presets.map((p) =>
      p.id === editingPresetId
        ? {
            ...p,
            name: editPresetName.trim(),
            durationMinutes: editPresetMinutes,
            category: editPresetCategory,
            description: editPresetDesc.trim(),
            includeMarking: editPresetMarking,
          }
        : p
    );

    onUpdatePresets(next);
    setEditingPresetId(null);
    triggerSaveMsg('타이머 설정이 성공적으로 수정되어 모든 접속자 기기에 실시간 반영되었습니다.');
  };

  const handleMovePreset = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= presets.length) return;
    const next = [...presets];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    onUpdatePresets(next);
    triggerSaveMsg(`[${moved.name}] 타이머 순서가 변경되어 모든 기기에 저장되었습니다.`);
  };

  const handleDuplicatePreset = (preset: PresetTimer) => {
    const duplicated: PresetTimer = {
      ...preset,
      id: 'pre_' + Date.now(),
      name: `${preset.name} (복사본)`,
    };
    onUpdatePresets([...presets, duplicated]);
    triggerSaveMsg(`[${preset.name}] 타이머가 복제되었습니다.`);
  };

  // Password Management
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErrorMsg(null);
    setPwSuccessMsg(null);

    const validCurrent = settings.adminPasswordHash || 'admin1234';
    if (currentPwInput !== validCurrent) {
      setPwErrorMsg('현재 비밀번호가 일치하지 않습니다.');
      return;
    }

    const trimmedNew = newPwInput.trim();
    if (trimmedNew.length < 4) {
      setPwErrorMsg('새 비밀번호는 최소 4자 이상 입력해 주세요.');
      return;
    }

    if (trimmedNew !== confirmPwInput.trim()) {
      setPwErrorMsg('새 비밀번호와 확인 입력이 일치하지 않습니다.');
      return;
    }

    // Call server change-password endpoint
    try {
      await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': currentPwInput,
        },
        body: JSON.stringify({ newPassword: trimmedNew }),
      });
    } catch {}

    saveAdminSessionPassword(trimmedNew);

    const updated: AdminSettings = {
      ...settings,
      adminPasswordHash: trimmedNew,
    };
    onUpdateSettings(updated);
    setPwSuccessMsg('관리자 비밀번호가 성공적으로 변경되었습니다!');
    setCurrentPwInput('');
    setNewPwInput('');
    setConfirmPwInput('');
    triggerSaveMsg('관리자 비밀번호가 변경되었습니다. 다음 로그인부터 적용됩니다.');
  };

  const handleResetPasswordDefault = async () => {
    if (window.confirm('관리자 비밀번호를 초기 기본값 [admin1234] 로 재설정하시겠습니까?')) {
      const currentPass = settings.adminPasswordHash || getAdminSessionPassword() || 'admin1234';
      try {
        await fetch('/api/admin/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': currentPass,
          },
          body: JSON.stringify({ newPassword: 'admin1234' }),
        });
      } catch {}

      saveAdminSessionPassword('admin1234');

      const updated: AdminSettings = {
        ...settings,
        adminPasswordHash: 'admin1234',
      };
      onUpdateSettings(updated);
      setPwSuccessMsg('비밀번호가 초기 기본값(admin1234)으로 초기화되었습니다.');
      triggerSaveMsg('비밀번호가 초기 기본값(admin1234)으로 재설정되었습니다.');
    }
  };

  const pendingStudents = students.filter((s) => s.status === 'pending');
  const approvedStudents = students
    .filter((s) => s.status === 'approved')
    .sort((a, b) => b.totalStudySeconds - a.totalStudySeconds);

  const filteredRankings = approvedStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(rankingSearch.toLowerCase()) ||
      (s.targetScore && s.targetScore.toLowerCase().includes(rankingSearch.toLowerCase()))
  );

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl h-full max-h-[96vh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header (Completely Non-Overlapping Mobile Header) */}
        <div className="px-3.5 sm:px-6 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-lg font-black text-white tracking-tight truncate">
                  관리자 제어 센터
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-sky-300 font-bold border border-blue-400/30 whitespace-nowrap shrink-0">
                  전체 관리
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden md:block">
                텍스트/문구 관리, 블록 레이아웃 위치 제어, 디자인 & 배경, 수강생 승인 관리
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick JSON Export Button */}
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/60 text-[11px] font-bold transition-all shadow-sm cursor-pointer shrink-0"
              title="현재 데이터 즉시 백업 (.json 파일로 저장/다운로드)"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>데이터 내보내기</span>
            </button>

            {/* Quick JSON Import Button */}
            <button
              type="button"
              onClick={handleTriggerFileInput}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-700/60 text-[11px] font-bold transition-all shadow-sm cursor-pointer shrink-0"
              title="PC/모바일 백업 파일 불러오기 (.json 파일 업로드)"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>데이터 불러오기</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                title="관리자 로그아웃"
              >
                로그아웃
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1"
            >
              <X className="w-4 h-4 sm:hidden" />
              <span className="hidden sm:inline">닫기</span>
            </button>
          </div>
        </div>

        {/* Hidden File Input for JSON Backup Import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-4 sm:px-6 py-2 text-xs text-emerald-300 flex items-center gap-2 font-bold animate-in fade-in shrink-0">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Tab Navigation (Clean Horizontal Scroll on Mobile, No Broken Line Wraps) */}
        <div className="px-2.5 sm:px-6 py-2 bg-slate-950 border-b border-slate-800 shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
            {/* TAB 1: 텍스트/문구 관리 (핵심 요구사항 4) */}
            <button
              type="button"
              onClick={() => setActiveTab('text_management')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'text_management'
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-md ring-1 ring-blue-500/40'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Type className="w-4 h-4 text-sky-400 shrink-0" />
              <span>텍스트/문구 관리</span>
            </button>

            {/* TAB 2: 블록 레이아웃 위치 제어 (핵심 요구사항 4) */}
            <button
              type="button"
              onClick={() => setActiveTab('layout_blocks')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'layout_blocks'
                  ? 'bg-amber-500/25 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/40'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Move className="w-4 h-4 text-amber-400 shrink-0" />
              <span>블록 위치 제어</span>
            </button>

            {/* TAB 3: 디자인 & 배경 커스텀 */}
            <button
              type="button"
              onClick={() => setActiveTab('naming_design')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'naming_design'
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-md ring-1 ring-blue-500/40'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Palette className="w-4 h-4 text-purple-400 shrink-0" />
              <span>디자인 & 배경</span>
            </button>

            {/* TAB 4: 수강생 승인 관리 */}
            <button
              type="button"
              onClick={() => setActiveTab('approvals')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'approvals'
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-md ring-1 ring-blue-500/40'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>수강생 승인</span>
              {pendingStudents.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse">
                  {pendingStudents.length}
                </span>
              )}
            </button>

            {/* TAB 5: 수강생 전체 순위 */}
            <button
              type="button"
              onClick={() => setActiveTab('full_ranking')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'full_ranking'
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-md ring-1 ring-blue-500/40'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <span>전체 순위</span>
            </button>

            {/* TAB 6: 고정 타이머 설정 */}
            <button
              type="button"
              onClick={() => setActiveTab('timers')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'timers'
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-md ring-1 ring-blue-500/40'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Clock className="w-4 h-4 text-sky-400 shrink-0" />
              <span>고정 타이머</span>
            </button>

            {/* TAB 7: 공지 관리 */}
            <button
              type="button"
              onClick={() => setActiveTab('notices')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'notices'
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-md ring-1 ring-blue-500/40'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Bell className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>공지사항</span>
            </button>

            {/* TAB 8: 비밀번호 관리 */}
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'password'
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-md ring-1 ring-blue-500/40'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-rose-300 hover:border-slate-700'
              }`}
            >
              <KeyRound className="w-4 h-4 text-rose-400 shrink-0" />
              <span>비밀번호 관리</span>
            </button>

            {/* TAB 9: 데이터 동기화 & 백업 (PC ⇄ 모바일 실시간 연동) */}
            <button
              type="button"
              onClick={() => setActiveTab('data_sync')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'data_sync'
                  ? 'bg-cyan-600/35 border-cyan-400 text-cyan-200 shadow-lg ring-2 ring-cyan-500/50'
                  : 'bg-slate-900/80 border-cyan-800/50 text-cyan-300 hover:text-white hover:border-cyan-600'
              }`}
            >
              <Database className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>데이터 동기화 & 백업</span>
              <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/25 text-cyan-300 text-[10px] font-black border border-cyan-400/40">
                PC ⇄ 모바일 실시간
              </span>
              {syncStatus === 'connected' ? (
                <span className="flex h-2 w-2 relative ml-0.5" title="실시간 클라우드 연결됨">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              ) : syncStatus === 'connecting' ? (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-spin ml-0.5" title="연결 확인 중" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-rose-500 ml-0.5" title="연결 끊김" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ========================================================= */}
          {/* TAB 1: 텍스트 / 문구 통합 관리 (요구사항 4) */}
          {/* ========================================================= */}
          {activeTab === 'text_management' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-start gap-3">
                <Type className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    메인 화면 텍스트 / 문구 일괄 관리
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    메인 화면 요소를 직접 눌러 수정하는 방식 대신, 이 메뉴에서 안전하게 모든 문구(타이틀, 배너 슬로건, 소제목 등)를 수정하고 숨김/표시를 제어합니다.
                  </p>
                </div>
              </div>

              {/* 1. App Title & Badge */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  1. 어플 상단 헤더 타이틀 및 영문 뱃지
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      어플 기본 명칭 (한글 메인 타이틀)
                    </label>
                    <input
                      type="text"
                      value={appKoreanName}
                      onChange={(e) => setAppKoreanName(e.target.value)}
                      placeholder="스피드토익 수강생 전용 타이머"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      메인 브랜드 명칭 (영문)
                    </label>
                    <input
                      type="text"
                      value={appEnglishName}
                      onChange={(e) => setAppEnglishName(e.target.value)}
                      placeholder="SPEED TOEIC TIMER"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Badge Show/Hide */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      타이틀 우측 영문 뱃지 (<code className="text-sky-300">{appEnglishName}</code>) 노출 여부
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {showAppBadge ? '현재 메인 타이틀 우측에 파란색 뱃지가 표시됩니다.' : '현재 숨김 상태입니다 (기본값).'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAppBadge(!showAppBadge)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      showAppBadge
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {showAppBadge ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{showAppBadge ? '화면 표시' : '숨김'}</span>
                  </button>
                </div>

                {/* Subtitle */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white block">
                      상단 헤더 소제목 문구
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSubtitle(!showSubtitle)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                        showSubtitle
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {showSubtitle ? '소제목 표시' : '소제목 숨김'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={headerSubtitle}
                    onChange={(e) => setHeaderSubtitle(e.target.value)}
                    placeholder="토익 고사장 아날로그 시계 체화 & 실시간 누적 순공 관리"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 2. Banner Slogans & Tag */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  2. 동기부여 배너 문구 및 슬로건
                </h3>

                {/* Banner Tag */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white block">
                      배너 상단 뱃지 태그
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowBannerTag(!showBannerTag)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                        showBannerTag
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {showBannerTag ? '태그 표시' : '태그 숨김'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={bannerTag}
                    onChange={(e) => setBannerTag(e.target.value)}
                    placeholder="SPEED TOEIC MOTIVATION"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Main Greeting Quote */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white block">
                      배너 메인 강조 슬로건
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowHomeGreeting(!showHomeGreeting)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                        showHomeGreeting
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {showHomeGreeting ? '슬로건 표시' : '슬로건 숨김'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={homeGreetingQuote}
                    onChange={(e) => setHomeGreetingQuote(e.target.value)}
                    placeholder="실전은 스피드다!"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Sub Quote */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white block">
                      배너 서브 설명 문구
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowHomeSubQuote(!showHomeSubQuote)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                        showHomeSubQuote
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {showHomeSubQuote ? '설명문 표시' : '설명문 숨김'}
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={homeSubQuote}
                    onChange={(e) => setHomeSubQuote(e.target.value)}
                    placeholder="시험장 아날로그 시계와 동일한 시각적 훈련으로 마킹까지 완벽 대비"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs leading-relaxed focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Sticky bottom save bar */}
              <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 shadow-2xl z-20">
                <span className="text-xs text-slate-400 hidden sm:inline">
                  문구 수정 후 [텍스트 저장하기]를 누르면 메인 화면에 즉시 적용됩니다.
                </span>
                <button
                  type="button"
                  onClick={handleSaveTextAndDesign}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  텍스트 저장하기
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: 화면 블록 레이아웃 위치 제어 (핵심 요구사항 4) */}
          {/* ========================================================= */}
          {activeTab === 'layout_blocks' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-3">
                <Move className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    메인 화면 블록 배치 순서 제어 (위/아래 이동 및 드래그)
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    메인 화면의 주요 섹션 순서를 자유롭게 조정할 수 있습니다. 아래의 [▲ 위로] [▼ 아래로] 버튼을 누르면 순서가 즉시 변경되며, 메인 화면에서도 [블록 위치 제어: ON]을 켜고 마우스/터치 드래그로 위치를 바꿀 수 있습니다.
                  </p>
                </div>
              </div>

              {/* Block List */}
              <div className="space-y-3">
                {currentBlockOrder.map((blockId, index) => {
                  const meta = BLOCK_META[blockId] || {
                    label: blockId,
                    desc: '',
                    icon: '🧱',
                  };
                  return (
                    <div
                      key={blockId}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-colors shadow-md"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-lg shrink-0">
                          {meta.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black px-2 py-0.5 rounded bg-blue-500/20 text-sky-300 border border-blue-400/30">
                              위치 {index + 1}
                            </span>
                            <h4 className="font-bold text-white text-sm truncate">
                              {meta.label}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {meta.desc}
                          </p>
                        </div>
                      </div>

                      {/* Move controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveBlock(index, 'up')}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                          title="위로 이동"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={index === currentBlockOrder.length - 1}
                          onClick={() => handleMoveBlock(index, 'down')}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                          title="아래로 이동"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reset to Default */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResetBlockOrder}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  기본 블록 순서 복원
                </button>

                <button
                  type="button"
                  onClick={handleSaveTextAndDesign}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  현재 블록 순서 저장
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: 디자인 & 배경 커스텀 */}
          {/* ========================================================= */}
          {activeTab === 'naming_design' && (
            <div className="space-y-6">
              {/* Background Image & Overlay Opacity Slider */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  배경 이미지 & 어두운 다크 오버레이 투명도 조절
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  원하는 배경 사진을 등록하고, 다크 오버레이를 조절하여 글자와 시계의 가독성을 최상으로 맞출 수 있습니다.
                </p>

                {/* Preset background selector buttons */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    추천 테마 프리셋 배경 원클릭 적용
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {backgroundPresets.map((bg) => (
                      <button
                        key={bg.title}
                        type="button"
                        onClick={() => setBackgroundImageUrl(bg.url)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          backgroundImageUrl === bg.url
                            ? 'bg-blue-600/30 border-blue-400 text-white ring-2 ring-blue-500/50'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-lg bg-cover bg-center shrink-0 border border-slate-700"
                          style={{ backgroundImage: `url(${bg.url})` }}
                        />
                        <span className="text-xs font-bold truncate">{bg.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom URL or Direct File Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      배경 이미지 직접 URL 입력
                    </label>
                    <input
                      type="url"
                      value={backgroundImageUrl}
                      onChange={(e) => setBackgroundImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      내 컴퓨터 / 모바일 사진 파일 직접 업로드
                    </label>
                    <label className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-600 text-slate-300 text-xs font-semibold cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-sky-400" />
                      <span>이미지 파일 선택 (최대 5MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setBackgroundImageUrl, '배경')}
                      />
                    </label>
                  </div>
                </div>

                {/* Clear Background button */}
                {backgroundImageUrl && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setBackgroundImageUrl('')}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      배경 제거하고 기본 다크 네이비로 복원
                    </button>
                  </div>
                )}

                {/* Background Dark Overlay Opacity Slider */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-sky-400" />
                      다크 오버레이 투명도 (Dark Overlay Opacity)
                    </label>
                    <span className="font-mono-numbers font-extrabold text-sky-400 text-sm">
                      {Math.round(backgroundOverlayOpacity * 100)}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0.10"
                    max="0.95"
                    step="0.05"
                    value={backgroundOverlayOpacity}
                    onChange={(e) => setBackgroundOverlayOpacity(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>10% (배경이 훤히 비침)</span>
                    <span>80% (표준 권장)</span>
                    <span>95% (완전한 딥 다크)</span>
                  </div>
                </div>
              </div>

              {/* Logo & Clock Emblem */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  어플 로고 & 아날로그 시계 중앙 엠블럼
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* App Logo */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <label className="block text-xs font-bold text-white">
                      어플 좌측 상단 로고 이미지
                    </label>
                    <input
                      type="url"
                      value={appLogoUrl}
                      onChange={(e) => setAppLogoUrl(e.target.value)}
                      placeholder="로고 이미지 URL"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                    />
                    <label className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>로고 파일 직접 업로드</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setAppLogoUrl, '로고')}
                      />
                    </label>
                  </div>

                  {/* Clock Center Emblem */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <label className="block text-xs font-bold text-white">
                      아날로그 시계 정중앙 엠블럼 로고
                    </label>
                    <input
                      type="url"
                      value={clockCenterLogoUrl}
                      onChange={(e) => setClockCenterLogoUrl(e.target.value)}
                      placeholder="엠블럼 이미지 URL"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                    />
                    <label className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>엠블럼 파일 직접 업로드</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setClockCenterLogoUrl, '엠블럼')}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* UI Detail Styles (Card, Font size, Colors) */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-400" />
                  UI 카드 스타일, 폰트 크기 및 텍스트 색상 테마
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card style */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      카드 배경 스타일
                    </label>
                    <select
                      value={uiCardStyle}
                      onChange={(e) => setUiCardStyle(e.target.value as UICardStyle)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs cursor-pointer"
                    >
                      <option value="slate">슬레이트 다크 (기본 표준)</option>
                      <option value="midnight">미드나잇 인디고</option>
                      <option value="pitch">피치 올블랙 (배터리 절약)</option>
                      <option value="charcoal">차콜 흑연</option>
                    </select>
                  </div>

                  {/* Font scale */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      전체 폰트 크기 비율
                    </label>
                    <select
                      value={uiFontSize}
                      onChange={(e) => setUiFontSize(e.target.value as UIFontSize)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs cursor-pointer"
                    >
                      <option value="normal">표준 크기 (15px)</option>
                      <option value="large">크게 확대 (16.5px 고시인성)</option>
                      <option value="compact">컴팩트 (14px 소형)</option>
                    </select>
                  </div>

                  {/* Text Color */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      제목 텍스트 포인트 톤
                    </label>
                    <select
                      value={uiTextColor}
                      onChange={(e) => setUiTextColor(e.target.value as UITextColor)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs cursor-pointer"
                    >
                      <option value="pure_white">퓨어 화이트 (선명함)</option>
                      <option value="sky_accent">스카이 블루 포인트</option>
                      <option value="gold_accent">골드 앰버 포인트</option>
                      <option value="slate">부드러운 슬레이트</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sticky bottom save bar */}
              <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 shadow-2xl z-20">
                <span className="text-xs text-slate-400 hidden sm:inline">
                  디자인 변경 사항을 저장하려면 [디자인 저장하기]를 누르세요.
                </span>
                <button
                  type="button"
                  onClick={handleSaveTextAndDesign}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  디자인 저장하기
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: 수강생 승인 관리 */}
          {/* ========================================================= */}
          {activeTab === 'approvals' && (
            <div className="space-y-6">
              {/* Pending list */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-amber-400" />
                    수강생 가입 승인 대기자 ({pendingStudents.length}명)
                  </h3>
                </div>

                {pendingStudents.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 text-center text-slate-500 text-xs">
                    현재 승인 대기 중인 수강생 신청이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pendingStudents.map((s) => (
                      <div
                        key={s.id}
                        className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{s.name}</span>
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                              승인 대기
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            신청 일시: {new Date(s.registeredAt).toLocaleString('ko-KR')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApproveStudent(s.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            승인하기
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectStudent(s.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-semibold cursor-pointer"
                          >
                            거절
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Direct Add Student Form */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-sky-400" />
                  관리자 직접 수강생 등록 (즉시 승인)
                </h3>
                <p className="text-xs text-slate-400">
                  학원 현장에서 직접 학생을 등록하면 승인 절차 없이 즉시 이용 가능합니다.
                </p>

                <form onSubmit={handleDirectAddStudent} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    required
                    value={manualStudentName}
                    onChange={(e) => setManualStudentName(e.target.value)}
                    placeholder="수강생 이름 (예: 박준형)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={manualStudentTarget}
                    onChange={(e) => setManualStudentTarget(e.target.value)}
                    placeholder="목표 점수 (예: 목표 950+)"
                    className="w-full sm:w-44 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    수강생 등록
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: 전체 랭킹 조회 및 관리 */}
          {/* ========================================================= */}
          {activeTab === 'full_ranking' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    수강생 전체 순위 및 순공 시간 조회
                  </h3>
                  <p className="text-xs text-slate-400">
                    전체 수강생 누적 순공 시간 및 당일 공부 기록을 조회/관리합니다.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={rankingSearch}
                    onChange={(e) => setRankingSearch(e.target.value)}
                    placeholder="수강생 이름 검색..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none bg-slate-950 shadow-md">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-center w-14">순위</th>
                      <th className="px-4 py-3">수강생 이름</th>
                      <th className="px-4 py-3">목표</th>
                      <th className="px-4 py-3">누적 순공</th>
                      <th className="px-4 py-3">오늘 공부</th>
                      <th className="px-4 py-3 text-right">제어</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredRankings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          검색 조건에 맞는 수강생이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredRankings.map((stu, index) => (
                        <tr key={stu.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="px-4 py-3 text-center font-mono-numbers font-black">
                            {index === 0 ? (
                              <span className="text-amber-400">🥇 1</span>
                            ) : index === 1 ? (
                              <span className="text-slate-300">🥈 2</span>
                            ) : index === 2 ? (
                              <span className="text-amber-600">🥉 3</span>
                            ) : (
                              <span className="text-slate-500">{index + 1}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold text-white">{stu.name}</td>
                          <td className="px-4 py-3 text-slate-400">{stu.targetScore || '-'}</td>
                          <td className="px-4 py-3 text-sky-400 font-mono-numbers font-bold">
                            {formatSecondsToKorean(stu.totalStudySeconds)}
                          </td>
                          <td className="px-4 py-3 text-slate-300 font-mono-numbers">
                            {formatSecondsToKorean(stu.todayStudySeconds || 0)}
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => handleResetStudyTime(stu.id)}
                              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-[10px]"
                              title="공부 시간 0으로 초기화"
                            >
                              시간 초기화
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStudent(stu.id)}
                              className="px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-[10px]"
                              title="수강생 삭제"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: 고정 타이머 프리셋 관리 */}
          {/* ========================================================= */}
          {activeTab === 'timers' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-sky-400" />
                  새 고정 실전 타이머 추가
                </h3>

                <form onSubmit={handleAddPreset} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        타이머 명칭
                      </label>
                      <input
                        type="text"
                        required
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        placeholder="예: LC 45분 실전"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        제한 시간 (분)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="240"
                        value={newPresetMinutes}
                        onChange={(e) => setNewPresetMinutes(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono-numbers"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        분류
                      </label>
                      <select
                        value={newPresetCategory}
                        onChange={(e) => setNewPresetCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                      >
                        <option value="RC">RC 전용</option>
                        <option value="LC+RC">LC + RC 전체</option>
                        <option value="PART">파트별 집중</option>
                        <option value="CUSTOM">사용자 정의</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      설명 문구
                    </label>
                    <input
                      type="text"
                      value={newPresetDesc}
                      onChange={(e) => setNewPresetDesc(e.target.value)}
                      placeholder="예: OMR 마킹 포함 시험장 표준 시간 배분"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPresetMarking}
                        onChange={(e) => setNewPresetMarking(e.target.checked)}
                        className="rounded accent-blue-500"
                      />
                      OMR 마킹 시간 포함
                    </label>

                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                    >
                      타이머 추가하기
                    </button>
                  </div>
                </form>
              </div>

              {/* Presets List */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-300">
                  등록된 타이머 목록 ({presets.length}개)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {presets.map((p, pIndex) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 transition-all hover:border-slate-700 shadow-md"
                    >
                      {editingPresetId === p.id ? (
                        /* INLINE EDIT FORM */
                        <form onSubmit={handleSaveEditPreset} className="space-y-3 animate-in fade-in">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                              <Edit2 className="w-3.5 h-3.5" />
                              타이머 설정 수정
                            </span>
                            <span className="text-[10px] text-slate-500">
                              (저장 시 모든 기기에 즉시 반영)
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                타이머 명칭
                              </label>
                              <input
                                type="text"
                                required
                                value={editPresetName}
                                onChange={(e) => setEditPresetName(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                제한 시간 (분)
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="240"
                                required
                                value={editPresetMinutes}
                                onChange={(e) => setEditPresetMinutes(parseInt(e.target.value) || 1)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono-numbers"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                파트 분류
                              </label>
                              <select
                                value={editPresetCategory}
                                onChange={(e) => setEditPresetCategory(e.target.value as any)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                              >
                                <option value="RC">RC 전용</option>
                                <option value="LC+RC">LC + RC 전체</option>
                                <option value="PART">파트별 집중</option>
                                <option value="CUSTOM">사용자 정의</option>
                              </select>
                            </div>
                            <div className="flex items-center pt-5">
                              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editPresetMarking}
                                  onChange={(e) => setEditPresetMarking(e.target.checked)}
                                  className="rounded accent-blue-500"
                                />
                                OMR 마킹 시간 포함
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              설명 문구
                            </label>
                            <input
                              type="text"
                              value={editPresetDesc}
                              onChange={(e) => setEditPresetDesc(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                            <button
                              type="button"
                              onClick={handleCancelEditPreset}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                            >
                              취소
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              저장 및 실시간 반영
                            </button>
                          </div>
                        </form>
                      ) : (
                        /* NORMAL DISPLAY CARD */
                        <div className="flex flex-col justify-between h-full gap-3">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-sky-300">
                                  {p.category}
                                </span>
                                <span className="font-bold text-white text-xs">{p.name}</span>
                              </div>
                              <span className="text-sky-400 font-mono-numbers font-extrabold text-xs">
                                {p.durationMinutes}분
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">{p.description}</p>
                            <span className="text-[10px] text-slate-500 block mt-1">
                              {p.includeMarking ? '✅ OMR 마킹 포함' : '⚡ 마킹 미포함 순수 풀이'}
                            </span>
                          </div>

                          {/* Control Action Buttons */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              {/* Reorder Up */}
                              <button
                                type="button"
                                disabled={pIndex === 0}
                                onClick={() => handleMovePreset(pIndex, 'up')}
                                className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 disabled:opacity-25 transition-colors cursor-pointer"
                                title="위로 이동"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              {/* Reorder Down */}
                              <button
                                type="button"
                                disabled={pIndex === presets.length - 1}
                                onClick={() => handleMovePreset(pIndex, 'down')}
                                className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 disabled:opacity-25 transition-colors cursor-pointer"
                                title="아래로 이동"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              {/* Duplicate */}
                              <button
                                type="button"
                                onClick={() => handleDuplicatePreset(p)}
                                className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                                title="복제"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => handleStartEditPreset(p)}
                                className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-sky-300 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                title="시간/명칭/옵션 수정"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>수정</span>
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => handleDeletePreset(p.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                                title="삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: 공지사항 관리 */}
          {/* ========================================================= */}
          {activeTab === 'notices' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-sky-400" />새 공지 등록
                </h3>

                <form onSubmit={handleAddNotice} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        required
                        value={newNoticeTitle}
                        onChange={(e) => setNewNoticeTitle(e.target.value)}
                        placeholder="공지 제목 입력"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                      />
                    </div>
                    <div>
                      <select
                        value={newNoticeCategory}
                        onChange={(e) => setNewNoticeCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                      >
                        <option value="공지">일반 공지</option>
                        <option value="필독">🚨 필독 공지</option>
                        <option value="이벤트">🎁 이벤트</option>
                        <option value="특강">🎯 특강 안내</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    required
                    value={newNoticeContent}
                    onChange={(e) => setNewNoticeContent(e.target.value)}
                    placeholder="공지 상세 내용 작성..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs leading-relaxed"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newNoticePinned}
                        onChange={(e) => setNewNoticePinned(e.target.checked)}
                        className="rounded accent-blue-500"
                      />
                      상단 고정 (📌 필독)
                    </label>

                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                    >
                      공지 등록하기
                    </button>
                  </div>
                </form>
              </div>

              {/* Notice List */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-300">
                  등록된 공지 목록 ({notices.length}개)
                </h4>
                {notices.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-sky-300">
                          {n.category}
                        </span>
                        {n.isPinned && (
                          <span className="text-[10px] text-amber-400 font-bold">📌 상단고정</span>
                        )}
                        <h5 className="font-bold text-white text-xs">{n.title}</h5>
                      </div>
                      <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed mt-1">
                        {n.content}
                      </p>
                      <span className="text-[10px] text-slate-500 block mt-2">{n.createdAt}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteNotice(n.id)}
                      className="p-1.5 rounded text-slate-500 hover:text-rose-400 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 8: 비밀번호 관리 */}
          {/* ========================================================= */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-rose-400" />
                  관리자 비밀번호 변경
                </h3>
                <p className="text-xs text-slate-400">
                  관리자 제어 센터 접근에 사용되는 비밀번호를 안전하게 변경합니다.
                </p>

                {pwErrorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    {pwErrorMsg}
                  </div>
                )}

                {pwSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    {pwSuccessMsg}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      현재 비밀번호 *
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPwInput}
                      onChange={(e) => setCurrentPwInput(e.target.value)}
                      placeholder="현재 관리자 비밀번호"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      새 비밀번호 * (최소 4자 이상)
                    </label>
                    <input
                      type="password"
                      required
                      value={newPwInput}
                      onChange={(e) => setNewPwInput(e.target.value)}
                      placeholder="새 비밀번호"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      새 비밀번호 확인 *
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPwInput}
                      onChange={(e) => setConfirmPwInput(e.target.value)}
                      placeholder="새 비밀번호 다시 입력"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleResetPasswordDefault}
                      className="text-xs text-slate-400 hover:text-rose-300 underline cursor-pointer"
                    >
                      기본값(admin1234)으로 초기화
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md cursor-pointer"
                    >
                      비밀번호 변경 완료
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 9: 데이터 동기화 & 백업 (PC ⇄ 모바일 실시간 연동) */}
          {/* ========================================================= */}
          {activeTab === 'data_sync' && (
            <div className="space-y-6">
              {/* Header Info Banner with Prominent Realtime Status */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 shrink-0 mt-0.5">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-black text-white">
                        데이터 동기화 & 백업 관리
                      </h4>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold border border-cyan-400/40 shadow-sm">
                        PC ⇄ 모바일 실시간 연동
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      PC에서 변경한 <strong>타이머 상태, 수강생 명단, 공지사항</strong>이 스마트폰에 네트워크를 통해 즉시 실시간으로 반영됩니다.
                    </p>
                  </div>
                </div>

                {/* Primary Live Connection Status Badge */}
                <div className="shrink-0 flex items-center">
                  {syncStatus === 'connected' ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-black shadow-lg">
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span>🟢 연결됨 (실시간 양방향 동기화 활성)</span>
                    </div>
                  ) : syncStatus === 'connecting' ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-black shadow-lg">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>🟡 연결 확인 중... (Firebase 접속 시도)</span>
                    </div>
                  ) : syncStatus === 'syncing' ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-950/80 border border-blue-500/50 text-sky-300 text-xs font-black shadow-lg">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                      <span>🔵 동기화 진행 중... (데이터 교환)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-black shadow-lg">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span>🔴 연결 끊김 (오프라인 / 설정 미입력)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 1: Firebase Realtime Database 실시간 클라우드 자동 동기화 & 룸 코드 */}
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <Cloud className="w-5 h-5 text-sky-400" />
                      1. 실시간 클라우드 양방향 연동 & 동기화 룸 코드 설정
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      동일한 룸 코드를 입력한 PC와 모바일 간에 타이머 상태, 수강생 명단, 공지사항이 네트워크를 통해 실시간으로 자동 동기화됩니다.
                    </p>
                  </div>

                  {/* Room status tag */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
                    <span>룸: <code className="text-sky-300 font-bold font-mono">{fbSyncRoomId || '미지정'}</code></span>
                  </div>
                </div>

                {/* Feedback message banner */}
                {syncActionFeedback && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in ${
                      syncActionFeedback.type === 'success'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {syncActionFeedback.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{syncActionFeedback.message}</span>
                  </div>
                )}

                {/* Main Configuration Form */}
                <form onSubmit={handleSaveAndConnectFirebase} className="space-y-4">
                  {/* Enable Switch Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="space-y-0.5">
                      <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                        <span>실시간 양방향 자동 동기화 기능 활성화</span>
                        {fbEnabled ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30">
                            ON (활성화됨)
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold border border-slate-700">
                            OFF (로컬 단독 모드)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-400">
                        켜두면 PC에서 수강생 승인/삭제, 공지사항 등록, 타이머 설정을 변경할 때마다 스마트폰에 즉각 자동 반영됩니다.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                      <input
                        type="checkbox"
                        checked={fbEnabled}
                        onChange={(e) => setFbEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6.5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-sky-500" />
                    </label>
                  </div>

                  {/* ROOM ID INPUT UI with Generator & Copy Buttons (요구사항 2) */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/30 to-slate-950 border border-sky-600/30 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs sm:text-sm font-black text-sky-200 flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-sky-400" />
                        <span>동기화 룸 코드 (Sync Room ID) *</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyRoomCode}
                          className="px-2.5 py-1 rounded-lg bg-sky-900/60 hover:bg-sky-800 text-sky-300 text-xs font-bold border border-sky-600/40 flex items-center gap-1 transition-colors cursor-pointer"
                          title="룸 코드를 복사하여 스마트폰으로 전송"
                        >
                          {copyRoomFeedback ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">복사됨!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-sky-400" />
                              <span>룸 코드 복사</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleGenerateRoomCode}
                          className="px-2.5 py-1 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 text-xs font-bold border border-indigo-600/40 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>룸 코드 자동 생성</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required={fbEnabled}
                        value={fbSyncRoomId}
                        onChange={(e) => setFbSyncRoomId(e.target.value)}
                        placeholder="예: SPEED_TOEIC_7721"
                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sky-300 text-sm font-black tracking-wider focus:outline-none focus:border-sky-400 font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      💡 <strong>PC와 모바일 양쪽 기기</strong>의 관리자 제어 센터에서 <strong>동일한 룸 코드</strong>를 입력해 두면 서로 실시간으로 연결됩니다.
                    </p>
                  </div>

                  {/* FIREBASE CONFIGURATION INPUTS (요구사항 2) */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-cyan-400" />
                      <span>Firebase Realtime Database 연동 설정값</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* API Key */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Firebase API Key *
                        </label>
                        <input
                          type="text"
                          required={fbEnabled}
                          value={fbApiKey}
                          onChange={(e) => setFbApiKey(e.target.value)}
                          placeholder="AIzaSy..."
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-500 font-mono"
                        />
                      </div>

                      {/* Project ID */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Firebase Project ID *
                        </label>
                        <input
                          type="text"
                          required={fbEnabled}
                          value={fbProjectId}
                          onChange={(e) => handleProjectIdChange(e.target.value)}
                          placeholder="예: speed-toeic-timer"
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-500 font-mono"
                        />
                      </div>

                      {/* Realtime Database URL */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Firebase Realtime Database URL *
                        </label>
                        <input
                          type="url"
                          required={fbEnabled}
                          value={fbDatabaseUrl}
                          onChange={(e) => setFbDatabaseUrl(e.target.value)}
                          placeholder="https://your-project-default-rtdb.firebaseio.com"
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-500 font-mono"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                          Firebase 콘솔 &gt; Realtime Database 상단에 표시되는 데이터베이스 URL입니다.
                        </p>
                      </div>

                      {/* Auth Domain (선택) */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Auth Domain (선택)
                        </label>
                        <input
                          type="text"
                          value={fbAuthDomain}
                          onChange={(e) => setFbAuthDomain(e.target.value)}
                          placeholder="your-project.firebaseapp.com"
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-500 font-mono"
                        />
                      </div>

                      {/* App ID (선택) */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          App ID (선택)
                        </label>
                        <input
                          type="text"
                          value={fbAppId}
                          onChange={(e) => setFbAppId(e.target.value)}
                          placeholder="1:123456789:web:abcdef..."
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Auto-Sync Toggle */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                      <input
                        type="checkbox"
                        id="fbAutoSync"
                        checked={fbAutoSync}
                        onChange={(e) => setFbAutoSync(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="fbAutoSync" className="text-xs text-slate-300 font-medium cursor-pointer">
                        실시간 양방향 자동 반영 활성화 (수강생 관리, 공지사항 추가/수정, 타이머 설정 변경 시 즉시 네트워크 자동 푸시)
                      </label>
                    </div>
                  </div>

                  {/* Actions & Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
                    <button
                      type="submit"
                      disabled={isSyncTesting}
                      className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
                    >
                      {isSyncTesting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>연결 및 권한 확인 중...</span>
                        </>
                      ) : (
                        <>
                          <Cloud className="w-4 h-4" />
                          <span>설정 저장 및 실시간 연결 테스트</span>
                        </>
                      )}
                    </button>

                    {/* Manual Force Push / Pull Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isSyncPushing || !fbEnabled}
                        onClick={handlePushToFirebase}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                        title="현재 기기의 데이터를 클라우드로 즉시 업로드"
                      >
                        {isSyncPushing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-sky-400" />
                        )}
                        <span>클라우드로 내보내기 (Push)</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSyncPulling || !fbEnabled}
                        onClick={handlePullFromFirebase}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                        title="클라우드에 저장된 데이터를 가져와 로컬에 반영"
                      >
                        {isSyncPulling ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>클라우드에서 가져오기 (Pull)</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Helpful Guide Accordion */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-sky-400" />
                    <span>Firebase 무료 실시간 데이터베이스 연동 안내 (3분 소요)</span>
                  </h4>
                  <ol className="text-[11px] text-slate-400 space-y-1 list-decimal list-inside leading-relaxed pl-1">
                    <li>
                      <a
                        href="https://console.firebase.google.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 hover:underline font-bold"
                      >
                        Firebase 콘솔 (console.firebase.google.com)
                      </a>
                      에서 무료 새 프로젝트를 생성합니다.
                    </li>
                    <li>
                      프로젝트 개요에서 <strong>웹 앱(&lt;/&gt;)</strong>을 추가하고 표시되는 <code>apiKey</code>와 <code>projectId</code>를 복사하여 위 칸에 붙여넣습니다.
                    </li>
                    <li>
                      좌측 메뉴의 <strong>Build &gt; Realtime Database</strong>에서 데이터베이스를 생성하고 상단의 DB URL을 복사하여 위 칸에 붙여넣습니다.
                    </li>
                    <li>
                      Realtime Database의 <strong>규칙(Rules)</strong> 탭에서 읽기/쓰기를 허용하도록 아래와 같이 설정하고 게시(Publish)합니다:
                      <pre className="mt-1 p-2 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-[10px]">
{`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}
                      </pre>
                    </li>
                    <li>
                      PC와 스마트폰의 관리자 설정에 <strong>동일한 동기화 룸 코드</strong>를 입력해 두면 두 기기가 실시간으로 자동 동기화됩니다!
                    </li>
                  </ol>
                </div>
              </div>

              {/* SECTION 2: 수동 JSON 파일 백업 및 복원 (오프라인 파일 방식) */}
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <FileJson className="w-5 h-5 text-cyan-400" />
                      2. 수동 파일 백업 & 복원 (.json Export / Import)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      클라우드 연동 없이 파일 형태로 데이터를 백업하거나 보관하고자 할 때 사용합니다.
                    </p>
                  </div>

                  {/* Current Snapshot Stats */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-300 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
                    <span>수강생 <strong className="text-cyan-400">{students.length}명</strong></span>
                    <span className="text-slate-600">•</span>
                    <span>타이머 <strong className="text-cyan-400">{presets.length}개</strong></span>
                    <span className="text-slate-600">•</span>
                    <span>공지 <strong className="text-cyan-400">{notices.length}건</strong></span>
                  </div>
                </div>

                {/* Two Main Cards: Export & Import */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CARD 1: 데이터 내보내기 */}
                  <div className="p-4 rounded-xl bg-gradient-to-b from-cyan-950/20 to-slate-950 border border-cyan-800/40 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 shrink-0">
                          <Download className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">데이터 내보내기 (Export)</h4>
                          <span className="text-[10px] text-cyan-400 font-semibold">
                            현재 데이터 전체를 .json 파일로 저장
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        현재 설정된 <strong>타이머 목록</strong>, <strong>수강생 명단 및 누적 순공 시간</strong>,{' '}
                        <strong>타이머 블록 구조</strong>, <strong>학원 브랜드 및 디자인 설정</strong> 전체를 안전하게 파일로
                        다운로드합니다.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleExportJson}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <Download className="w-4 h-4" />
                        <span>데이터 내보내기 (.json 파일 다운로드)</span>
                      </button>
                    </div>
                  </div>

                  {/* CARD 2: 데이터 불러오기 */}
                  <div className="p-4 rounded-xl bg-gradient-to-b from-amber-950/20 to-slate-950 border border-amber-800/40 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-300 shrink-0">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">데이터 불러오기 (Import)</h4>
                          <span className="text-[10px] text-amber-400 font-semibold">
                            백업 .json 파일을 업로드하여 즉시 반영
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        PC나 모바일에서 저장해둔 <strong>.json 백업 파일</strong>을 선택하면 파일 내의 타이머, 수강생,
                        설정이 검증된 후 기존 데이터를 즉시 갱신하여 시스템에 반영합니다.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleTriggerFileInput}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <Upload className="w-4 h-4" />
                        <span>데이터 불러오기 (.json 파일 선택)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Quick Utility: Copy / Paste JSON Text */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>모바일 메신저(카카오톡, 메모장)로 간편하게 텍스트를 복사해 이동할 수도 있습니다.</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyJsonToClipboard}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copyJsonFeedback ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">복사 완료!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>클립보드로 JSON 복사</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowRawJsonModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                      <span>JSON 텍스트 직접 입력</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* IMPORT PREVIEW & CONFIRMATION MODAL */}
      {importConfirmData && (
        <div className="fixed inset-0 z-[100000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">백업 데이터 불러오기 확인</h3>
                <p className="text-xs text-slate-400">파일의 데이터를 브라우저에 즉시 적용합니다.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">앱 명칭:</span>
                <span className="font-bold text-white">
                  {importConfirmData.adminSettings?.appKoreanName || '스피드토익 타이머'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">수강생 명단:</span>
                <span className="font-bold text-cyan-300">
                  {importConfirmData.students?.length || 0}명 (누적 순공 기록 포함)
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">고정 타이머:</span>
                <span className="font-bold text-sky-300">
                  {importConfirmData.presetTimers?.length || 0}개
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">공지사항:</span>
                <span className="font-bold text-indigo-300">
                  {importConfirmData.notices?.length || 0}건
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">백업 일시:</span>
                <span className="text-slate-300">
                  {importConfirmData.exportedAt
                    ? new Date(importConfirmData.exportedAt).toLocaleString('ko-KR')
                    : '정보 없음'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
              ⚠️ 주의: 백업 파일의 내용으로 현재 기기의 학생 목록 및 타이머 설정이 갱신됩니다. 계속 진행하시겠습니까?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setImportConfirmData(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleApplyImportedData}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>확인 및 즉시 반영</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RAW JSON TEXT IMPORT MODAL */}
      {showRawJsonModal && (
        <div className="fixed inset-0 z-[100000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileJson className="w-5 h-5 text-amber-400" />
                <span>JSON 백업 텍스트 직접 붙여넣기</span>
              </h3>
              <button
                onClick={() => setShowRawJsonModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              메신저나 메모장 등에서 복사한 JSON 백업 텍스트를 아래 입력창에 붙여넣어 복원합니다.
            </p>

            <textarea
              rows={8}
              value={rawJsonInput}
              onChange={(e) => setRawJsonInput(e.target.value)}
              placeholder="여기에 복사한 JSON 텍스트를 붙여넣으세요..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRawJsonModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleImportRawJsonText}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>텍스트 검증 및 불러오기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
