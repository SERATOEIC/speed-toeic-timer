import React, { useState } from 'react';
import {
  ShieldAlert,
  Move,
  RotateCcw,
  Sliders,
  LogOut,
  HelpCircle,
  Type,
  LayoutGrid,
  Clock,
} from 'lucide-react';

interface AdminWysiwygToolbarProps {
  isAdminLoggedIn: boolean;
  isBlockEditMode: boolean;
  onToggleBlockEditMode: (active: boolean) => void;
  onOpenAdminPanel: (tab?: 'text_management' | 'layout_blocks' | 'naming_design' | 'timers') => void;
  onResetBlockOrder: () => void;
  onLogout: () => void;
}

export const AdminWysiwygToolbar: React.FC<AdminWysiwygToolbarProps> = ({
  isAdminLoggedIn,
  isBlockEditMode,
  onToggleBlockEditMode,
  onOpenAdminPanel,
  onResetBlockOrder,
  onLogout,
}) => {
  const [showHelp, setShowHelp] = useState(false);

  if (!isAdminLoggedIn) return null;

  return (
    <aside
      aria-label="관리자 제어 툴바"
      className="relative z-30 bg-gradient-to-r from-blue-950/95 via-slate-900/95 to-indigo-950/95 border-b border-blue-500/40 text-slate-100 px-3 sm:px-5 py-2 text-xs shadow-lg backdrop-blur-md"
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left: Mode Badge & Block Edit Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/20 text-sky-300 font-black border border-blue-400/40 shadow-sm text-[11px] shrink-0">
            <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
            관리자 모드
          </span>

          {/* Block Reorder Mode Toggle (핵심 요구사항 4) */}
          <button
            type="button"
            onClick={() => onToggleBlockEditMode(!isBlockEditMode)}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 border transition-all cursor-pointer shadow-sm shrink-0 ${
              isBlockEditMode
                ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 ring-2 ring-amber-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="메인 화면 블록 위치 제어(드래그 앤 드롭 및 위/아래 이동) 켜기/끄기"
          >
            <Move className="w-3.5 h-3.5 text-amber-400" />
            <span>블록 위치 제어: {isBlockEditMode ? 'ON (수정 중)' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            title="블록 순서 및 텍스트 수정 안내"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Quick Text Menu, Timer Settings Menu, Layout Reset, Admin Center, Logout */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 self-end sm:self-auto shrink-0">
          {/* Quick open Timer Management in Admin Panel */}
          <button
            type="button"
            onClick={() => onOpenAdminPanel('timers')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="실전 고사장 타이머 설정 (제한 시간, 파트 분류, 마킹 포함 여부, 추가/수정/삭제)"
          >
            <Clock className="w-3 h-3 text-amber-400" />
            <span>타이머 설정 관리</span>
          </button>

          {/* Quick open Text Management in Admin Panel */}
          <button
            type="button"
            onClick={() => onOpenAdminPanel('text_management')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="모든 메인 텍스트 및 문구 관리 (어플 명칭, 배너 슬로건, 소제목 등)"
          >
            <Type className="w-3 h-3 text-sky-400" />
            <span>텍스트/문구 관리</span>
          </button>

          {/* Reset Block Order */}
          <button
            type="button"
            onClick={onResetBlockOrder}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-medium text-[11px] flex items-center gap-1 cursor-pointer"
            title="블록 배치 순서를 기본값으로 복원"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">기본 순서 복원</span>
          </button>

          {/* Admin Control Center Open */}
          <button
            type="button"
            onClick={() => onOpenAdminPanel()}
            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Sliders className="w-3 h-3" />
            <span>관리자 제어 센터</span>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            title="관리자 로그아웃"
          >
            <LogOut className="w-3 h-3" />
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      {/* Help tooltip banner */}
      {showHelp && (
        <div className="max-w-6xl mx-auto mt-2 p-3 rounded-xl bg-slate-900 border border-blue-500/40 text-[11.5px] text-slate-300 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="space-y-1">
            <strong className="text-white block font-bold">
              💡 블록 위치 제어 및 텍스트 관리 가이드:
            </strong>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300">
              <li>
                <strong>화면 블록 순서 변경</strong>: [블록 위치 제어: ON] 상태에서 각 블록 상단의{' '}
                <span className="text-amber-300 font-bold">[▲ 위로] [▼ 아래로]</span> 버튼을 누르거나,{' '}
                <span className="text-amber-300 font-bold">드래그 앤 드롭</span>으로 원하는 위치로 손쉽게 이동할 수 있습니다.
              </li>
              <li>
                <strong>글자 및 문구 수정</strong>: 화면을 클릭해 직접 수정하는 방식 대신, 우측 상단{' '}
                <span className="text-sky-300 font-bold">[텍스트/문구 관리]</span> 또는 [관리자 제어 센터]에서 안전하게 수정 및 숨김/표시를 설정합니다.
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className="text-slate-400 hover:text-white px-2 py-1 text-xs"
          >
            닫기
          </button>
        </div>
      )}
    </aside>
  );
};
