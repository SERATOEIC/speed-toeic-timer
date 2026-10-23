import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FirebaseSyncConfig, SyncStatus, AppBackupData } from '../types';
import {
  testFirebaseConnection,
  pushDataToFirebase,
  pullDataFromFirebase,
  sanitizeRoomId,
} from '../utils/firebaseSync';
import {
  X,
  Share2,
  Copy,
  Check,
  Sparkles,
  Cloud,
  Database,
  Upload,
  Download,
  RefreshCw,
  Smartphone,
  Laptop,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
} from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  config: FirebaseSyncConfig;
  status: SyncStatus;
  statusMsg?: string | null;
  onUpdateConfig: (newConfig: FirebaseSyncConfig) => void;
  onImportData: (data: AppBackupData) => void;
  onClose: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  config,
  status,
  statusMsg,
  onUpdateConfig,
  onImportData,
  onClose,
}) => {
  const [roomId, setRoomId] = useState(config.syncRoomId || 'SPEED_TOEIC_ROOM_1');
  const [enabled, setEnabled] = useState(config.enabled ?? true);
  const [autoSync, setAutoSync] = useState(config.autoSync ?? true);

  // Advanced Firebase settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [projectId, setProjectId] = useState(config.projectId || '');
  const [databaseURL, setDatabaseURL] = useState(config.databaseURL || '');

  // Action states
  const [isTesting, setIsTesting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSaveAndApply = async (newRoom = roomId) => {
    const cleanRoom = sanitizeRoomId(newRoom);
    const updated: FirebaseSyncConfig = {
      ...config,
      enabled,
      autoSync,
      syncRoomId: cleanRoom,
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      databaseURL: databaseURL.trim(),
    };
    onUpdateConfig(updated);

    setIsTesting(true);
    setFeedback(null);
    const res = await testFirebaseConnection(updated);
    setIsTesting(false);

    if (res.success) {
      setFeedback({ type: 'success', msg: res.message });
    } else {
      setFeedback({ type: 'error', msg: res.message });
    }
  };

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopyCodeSuccess(true);
      setTimeout(() => setCopyCodeSuccess(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopySyncLink = async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const syncUrl = `${origin}${pathname}?room=${encodeURIComponent(roomId)}`;
      await navigator.clipboard.writeText(syncUrl);
      setCopyLinkSuccess(true);
      setTimeout(() => setCopyLinkSuccess(false), 2500);
    } catch {}
  };

  const handleGenerateRoomCode = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newCode = `SPEED_TOEIC_${randomSuffix}`;
    setRoomId(newCode);
    handleSaveAndApply(newCode);
  };

  const handlePush = async () => {
    setIsPushing(true);
    setFeedback(null);
    const res = await pushDataToFirebase({
      ...config,
      syncRoomId: roomId,
      enabled: true,
    });
    setIsPushing(false);
    if (res.success) {
      setFeedback({
        type: 'success',
        msg: `클라우드 동기화 성공! PC에서 변경된 데이터가 rooms/${roomId} 경로로 즉시 업로드되었습니다.`,
      });
    } else {
      setFeedback({ type: 'error', msg: res.message });
    }
  };

  const handlePull = async () => {
    setIsPulling(true);
    setFeedback(null);
    const res = await pullDataFromFirebase({
      ...config,
      syncRoomId: roomId,
      enabled: true,
    });
    setIsPulling(false);
    if (res.success && res.data) {
      onImportData(res.data);
      setFeedback({
        type: 'success',
        msg: `클라우드로부터 최신 데이터를 수신하여 화면에 반영했습니다!`,
      });
    } else {
      setFeedback({ type: 'error', msg: res.message });
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-cyan-500/40 p-6 sm:p-7 shadow-2xl text-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="p-3 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white">
                전체 사용자 실시간 데이터 동기화
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-400/40">
                중앙 실시간 서버 연동
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              관리자가 변경한 타이머 설정, 공지, 디자인, 수강생 승인 상태가 서버를 통해 <strong>모든 사용자의 PC 및 모바일 화면에 실시간으로 자동 반영</strong>됩니다.
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
            <span>실시간 연결 상태:</span>
          </span>
          <div>
            {status === 'connected' ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-black">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>🟢 실시간 양방향 연결됨</span>
              </span>
            ) : status === 'connecting' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>🟡 연결 중...</span>
              </span>
            ) : status === 'syncing' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/50 text-sky-300 text-xs font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>🔵 동기화 진행 중...</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>🔴 연결 대기 또는 오류</span>
              </span>
            )}
          </div>
        </div>

        {/* Detailed status message if present */}
        {statusMsg && (
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
            <span className="text-sky-400 font-bold shrink-0">ℹ️ 알림:</span>
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Feedback message banner */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Room Code Section */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 to-slate-950 border border-sky-500/30 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs sm:text-sm font-black text-sky-200 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-sky-400" />
              <span>동기화 룸 코드 (Sync Room Code)</span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyRoomCode}
                className="px-2.5 py-1 rounded-lg bg-sky-900/60 hover:bg-sky-800 text-sky-300 text-xs font-bold border border-sky-600/40 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copyCodeSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copyCodeSuccess ? '복사됨!' : '코드 복사'}</span>
              </button>
              <button
                type="button"
                onClick={handleGenerateRoomCode}
                className="px-2.5 py-1 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 text-xs font-bold border border-indigo-600/40 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>새 코드 생성</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="예: SPEED_TOEIC_ROOM_1"
              className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sky-300 text-sm sm:text-base font-black tracking-wider focus:outline-none focus:border-sky-400 font-mono"
            />
            <button
              type="button"
              onClick={() => handleSaveAndApply(roomId)}
              disabled={isTesting}
              className="px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-black text-xs shrink-0 cursor-pointer shadow-md transition-all active:scale-95"
            >
              {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : '연결 적용'}
            </button>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800/80">
            <div className="text-[11px] text-slate-400">
              Firebase 경로: <code className="text-sky-300 font-mono">rooms/{sanitizeRoomId(roomId)}</code>
            </div>

            {/* One-click Mobile Share Link */}
            <button
              type="button"
              onClick={handleCopySyncLink}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold border border-emerald-500/40 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              title="스마트폰에서 링크를 열면 룸 코드가 자동으로 적용되어 즉시 연결됩니다."
            >
              {copyLinkSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-black">모바일 접속 링크 복사 완료!</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>스마트폰 즉시 연동 링크 복사</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Push & Pull Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={isPushing}
            onClick={handlePush}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
          >
            {isPushing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Upload className="w-4 h-4 text-sky-200" />
            )}
            <span>클라우드로 내보내기 (PC → 모바일)</span>
          </button>

          <button
            type="button"
            disabled={isPulling}
            onClick={handlePull}
            className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-100 font-extrabold text-xs flex items-center justify-center gap-2 border border-slate-700 shadow-md cursor-pointer transition-all active:scale-95"
          >
            {isPulling ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Download className="w-4 h-4 text-amber-400" />
            )}
            <span>클라우드 데이터 가져오기 (모바일 ← PC)</span>
          </button>
        </div>

        {/* Auto Sync Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <span className="text-xs font-bold text-white block">
              실시간 자동 양방향 동기화 (Auto Sync)
            </span>
            <span className="text-[11px] text-slate-400">
              PC 또는 모바일에서 변경 사항이 발생할 때마다 자동으로 즉시 전송 및 반영합니다.
            </span>
          </div>
          <input
            type="checkbox"
            checked={autoSync}
            onChange={(e) => {
              setAutoSync(e.target.checked);
              onUpdateConfig({
                ...config,
                autoSync: e.target.checked,
                syncRoomId: roomId,
              });
            }}
            className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 cursor-pointer"
          />
        </div>

        {/* Collapsible Advanced Firebase Settings */}
        <div className="border border-slate-800 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-3.5 bg-slate-950 hover:bg-slate-900 flex items-center justify-between text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              <span>Firebase Realtime Database 상세 접속 설정 (선택 사항)</span>
            </span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="p-4 bg-slate-950/70 space-y-3 border-t border-slate-800 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Firebase Database URL
                </label>
                <input
                  type="text"
                  value={databaseURL}
                  onChange={(e) => setDatabaseURL(e.target.value)}
                  placeholder="https://your-project-default-rtdb.firebaseio.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Firebase Project ID
                  </label>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="speed-toeic-timer"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Firebase API Key
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSaveAndApply(roomId)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer"
              >
                상세 설정 저장 및 재연결
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
