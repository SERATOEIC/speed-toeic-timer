import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Edit3, EyeOff, Eye, Check, X, Trash2, RotateCcw } from 'lucide-react';

interface InlineTextControlProps {
  isAdmin: boolean;
  isInlineEditActive?: boolean;
  label: string;
  value: string;
  isVisible: boolean;
  onSave: (newValue: string) => void;
  onToggleVisibility: (visible: boolean) => void;
  onReset?: () => void;
  isMultiline?: boolean;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  children?: React.ReactNode;
}

export const InlineTextControl: React.FC<InlineTextControlProps> = ({
  isAdmin,
  isInlineEditActive = true,
  label,
  value,
  isVisible,
  onSave,
  onToggleVisibility,
  onReset,
  isMultiline = false,
  className = '',
  tag: Tag = 'span',
  children,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [tempVisible, setTempVisible] = useState(isVisible);
  const [isPressing, setIsPressing] = useState(false);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pressStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Sync internal state with props when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setTempValue(value);
      setTempVisible(isVisible);
    }
  }, [isModalOpen, value, isVisible]);

  const openEditor = () => {
    if (!isAdmin) return;
    setIsPressing(false);
    setIsModalOpen(true);
  };

  // Long press detection for touch and mouse
  const handleStartPress = (clientX: number, clientY: number) => {
    if (!isAdmin) return;
    pressStartPosRef.current = { x: clientX, y: clientY };
    setIsPressing(true);

    longPressTimerRef.current = setTimeout(() => {
      openEditor();
    }, 450); // 450ms long-press threshold
  };

  const handleCancelPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsPressing(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pressStartPosRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - pressStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - pressStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      handleCancelPress(); // Moved finger, cancel long press
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isAdmin) {
      e.preventDefault();
      e.stopPropagation();
      openEditor();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isAdmin && isInlineEditActive) {
      e.preventDefault();
      e.stopPropagation();
      openEditor();
    }
  };

  const handleSaveAndClose = () => {
    onSave(tempValue.trim() || value);
    if (tempVisible !== isVisible) {
      onToggleVisibility(tempVisible);
    }
    setIsModalOpen(false);
  };

  const handleHideAndClose = () => {
    onToggleVisibility(false);
    setIsModalOpen(false);
  };

  // If item is hidden:
  if (!isVisible) {
    // If not admin, hide completely
    if (!isAdmin) return null;

    // If admin, show a subtle ghost button so admin knows it's hidden and can click to restore/edit
    return (
      <>
        <button
          type="button"
          onClick={openEditor}
          onContextMenu={handleContextMenu}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition-all cursor-pointer group animate-in fade-in"
          title={`[숨김 상태] 우클릭 또는 클릭하여 '${label}' 다시 표시`}
        >
          <EyeOff className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>[숨김 해제: {label}]</span>
        </button>

        {isModalOpen && renderModal()}
      </>
    );
  }

  function renderModal() {
    return createPortal(
      <div
        className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsModalOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsModalOpen(false);
        }}
      >
        <div
          className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150 text-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {label} 직접 편집
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-sky-300 border border-blue-400/30">
                    관리자 인라인
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  문구를 수정하거나 화면에서 숨김/표시 처리할 수 있습니다.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                텍스트 내용
              </label>
              {isMultiline ? (
                <textarea
                  rows={3}
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 leading-relaxed"
                  placeholder="텍스트를 입력하세요"
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveAndClose();
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="텍스트를 입력하세요"
                  autoFocus
                />
              )}
            </div>

            {/* Visibility toggle button */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  화면 노출 상태 제어
                </span>
                <span className="text-[11px] text-slate-400">
                  {tempVisible
                    ? '현재 화면에 정상적으로 표시되고 있습니다.'
                    : '현재 화면에서 숨김(삭제) 처리된 상태입니다.'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setTempVisible(!tempVisible)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  tempVisible
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                    : 'bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30'
                }`}
              >
                {tempVisible ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    화면 표시 중
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                    숨김(삭제됨)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleHideAndClose}
                className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="화면에서 즉시 숨기기/삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
                화면에서 숨기기
              </button>

              {onReset && (
                <button
                  type="button"
                  onClick={() => {
                    onReset();
                    setIsModalOpen(false);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="기본값으로 되돌리기"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  기본값 복원
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveAndClose}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                적용 및 저장
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Active item rendering
  return (
    <>
      <Tag
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onTouchStart={(e) => handleStartPress(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleCancelPress}
        onTouchMove={handleTouchMove}
        onMouseDown={(e) => handleStartPress(e.clientX, e.clientY)}
        onMouseUp={handleCancelPress}
        onMouseLeave={handleCancelPress}
        className={`${className} ${
          isAdmin
            ? `relative cursor-pointer transition-all ${
                isInlineEditActive
                  ? 'hover:outline-dashed hover:outline-2 hover:outline-blue-400/80 hover:bg-blue-500/10 rounded px-1'
                  : ''
              } ${isPressing ? 'scale-[0.98] ring-2 ring-sky-400' : ''}`
            : ''
        }`}
        title={
          isAdmin
            ? `[관리자] 클릭, 우클릭 또는 꾹 눌러 '${label}' 직접 편집 / 숨김`
            : undefined
        }
      >
        {children || value}
        {isAdmin && isInlineEditActive && (
          <span className="hidden group-hover:inline-block ml-1 opacity-60 text-sky-400 text-[10px]">
            ✏️
          </span>
        )}
      </Tag>

      {isModalOpen && renderModal()}
    </>
  );
};
