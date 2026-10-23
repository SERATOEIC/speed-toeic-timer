import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { StudentCustomSettings, ClockStyle, ClockThemeColor } from '../types';
import { AnalogueClock } from './AnalogueClock';
import {
  Sliders,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
  Palette,
  Sparkles,
  Clock,
  X,
} from 'lucide-react';

interface StudentSettingsModalProps {
  isOpen: boolean;
  studentName: string;
  settings: StudentCustomSettings;
  centerLogoUrl?: string;
  onSave: (newSettings: StudentCustomSettings) => void;
  onClose: () => void;
}

export const StudentSettingsModal: React.FC<StudentSettingsModalProps> = ({
  isOpen,
  studentName,
  settings,
  centerLogoUrl,
  onSave,
  onClose,
}) => {
  const [showSecondHand, setShowSecondHand] = useState<boolean>(settings.showSecondHand);
  const [clockStyle, setClockStyle] = useState<ClockStyle>(settings.clockStyle);
  const [themeColor, setThemeColor] = useState<ClockThemeColor>(settings.themeColor);
  const [previewElapsed, setPreviewElapsed] = useState<number>(3672); // ~1h 1m 12s demo

  if (!isOpen) return null;

  const styleOptions: { id: ClockStyle; label: string; desc: string; icon: string }[] = [
    {
      id: 'classic',
      label: '클래식 고사장',
      desc: '1~12 정밀 아라비아 숫자, 실제 토익 시험장 표준 벽시계',
      icon: '⏰',
    },
    {
      id: 'minimal',
      label: '미니멀 포커스',
      desc: '12, 3, 6, 9 핵심 인덱스만 표시하여 시각적 간섭 최소화',
      icon: '✨',
    },
    {
      id: 'modern',
      label: '모던 크로노',
      desc: '굵고 스포티한 레이싱 크로노 인덱스, 직관적 가독성',
      icon: '⚡',
    },
    {
      id: 'roman',
      label: '로만 럭셔리',
      desc: '품격 있는 로마 숫자(XII, III 등), 클래식 워치 감성',
      icon: '🏛️',
    },
  ];

  const themeOptions: {
    id: ClockThemeColor;
    label: string;
    bgClass: string;
    borderClass: string;
    dotClass: string;
    desc: string;
  }[] = [
    {
      id: 'blue',
      label: '스피드 블루',
      bgClass: 'from-blue-600/30 to-slate-900',
      borderClass: 'border-blue-500',
      dotClass: 'bg-sky-400',
      desc: '표준 스피드 토익 대표 시그니처 블루',
    },
    {
      id: 'dark',
      label: '카본 다크',
      bgClass: 'from-zinc-700/30 to-slate-950',
      borderClass: 'border-zinc-400',
      dotClass: 'bg-zinc-200',
      desc: '눈부심을 억제하는 올블랙/차콜 스텔스',
    },
    {
      id: 'midnight',
      label: '미드나잇 퍼플',
      bgClass: 'from-purple-900/30 to-slate-950',
      borderClass: 'border-purple-500',
      dotClass: 'bg-purple-400',
      desc: '깊은 밤 심해처럼 고요한 인디고 감성',
    },
    {
      id: 'emerald',
      label: '포커스 에메랄드',
      bgClass: 'from-emerald-800/30 to-slate-950',
      borderClass: 'border-emerald-500',
      dotClass: 'bg-emerald-400',
      desc: '눈의 피로를 덜어주고 심리적 안정을 주는 민트 그린',
    },
    {
      id: 'amber',
      label: '럭셔리 앰버 골드',
      bgClass: 'from-amber-800/30 to-slate-950',
      borderClass: 'border-amber-500',
      dotClass: 'bg-amber-400',
      desc: '따뜻한 샴페인 골드 & 고급스러운 크로노 톤',
    },
  ];

  const handleSave = () => {
    onSave({
      showSecondHand,
      clockStyle,
      themeColor,
    });
    onClose();
  };

  const handleResetDefaults = () => {
    setShowSecondHand(true);
    setClockStyle('classic');
    setThemeColor('blue');
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-sky-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                학생 맞춤 설정 (마이 페이지)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-sky-300 font-semibold border border-blue-400/30">
                  {studentName} 님
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                초침 숨기기/보이기, 아날로그 시계 디자인 및 테마 색상을 원하는 대로 커스텀하세요.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split 2 columns (Left: Settings controls, Right: Live Interactive Clock Preview) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. 초침 숨기기/보이기 토글 (핵심 요구사항) */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {showSecondHand ? (
                      <Eye className="w-4 h-4 text-sky-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-amber-400" />
                    )}
                    초침 숨기기 / 보이기 토글
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    시계 구동 시 초침의 1초 단위 움직임이 산만하거나 긴장될 경우, 초침을 숨겨
                    온전히 시험 문제에만 몰입할 수 있습니다.
                  </p>
                </div>
              </div>

              {/* 2 Big Toggle Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSecondHand(true)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    showSecondHand
                      ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500/40 shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      초침 표시 (표준)
                    </span>
                    {showSecondHand && <Check className="w-4 h-4 text-sky-400" />}
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    초 단위 침이 회전하여 실전 긴장감 유지
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSecondHand(false)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    !showSecondHand
                      ? 'bg-amber-500/20 border-amber-500 text-white ring-1 ring-amber-500/40 shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <EyeOff className="w-3.5 h-3.5" />
                      초침 숨김 (집중)
                    </span>
                    {!showSecondHand && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    초침을 숨겨 시각적 산만함 원천 차단
                  </span>
                </button>
              </div>
            </div>

            {/* 2. 시계 디자인 스타일 선택 (4가지) */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                아날로그 시계 디자인 스타일
              </h3>
              <p className="text-xs text-slate-400">
                시험장 환경에 맞춘 다양한 아날로그 시계 다이얼 스타일을 선택할 수 있습니다.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {styleOptions.map((opt) => {
                  const isSelected = clockStyle === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setClockStyle(opt.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/30'
                          : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          <span>{opt.icon}</span>
                          {opt.label}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                      <span className="text-[11px] text-slate-400 block leading-tight">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. 테마 색상 선택 (5가지) */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-sky-400" />
                시계 베젤 & 테마 색상 선택
              </h3>
              <p className="text-xs text-slate-400">
                몰입도를 극대화하는 5가지 프리미엄 컬러 테마입니다.
              </p>

              <div className="space-y-2 pt-1">
                {themeOptions.map((thm) => {
                  const isSelected = themeColor === thm.id;
                  return (
                    <button
                      key={thm.id}
                      type="button"
                      onClick={() => setThemeColor(thm.id)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? `bg-gradient-to-r ${thm.bgClass} ${thm.borderClass} text-white ring-1 ring-white/20 shadow`
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3.5 h-3.5 rounded-full ${thm.dotClass} shadow-sm shrink-0`} />
                        <div>
                          <span className="text-xs font-bold block">{thm.label}</span>
                          <span className="text-[11px] text-slate-400">{thm.desc}</span>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-white/20 text-white font-black">
                          선택됨
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">선택</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  실시간 맞춤 시계 미리보기
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-sky-300 border border-blue-400/30 font-bold">
                  {showSecondHand ? '초침 켜짐' : '초침 숨김'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-4">
                선택한 스타일과 색상이 타이머 구동 시 아래와 같이 큼직하게 렌더링됩니다.
              </p>

              {/* Centered preview clock */}
              <div className="flex items-center justify-center py-4 bg-slate-900/50 rounded-2xl border border-slate-800/80">
                <AnalogueClock
                  elapsedSeconds={previewElapsed}
                  totalTargetSeconds={4500} // 75min
                  centerLogoUrl={centerLogoUrl}
                  isPaused={false}
                  size={260}
                  showSecondHand={showSecondHand}
                  styleType={clockStyle}
                  themeColor={themeColor}
                />
              </div>

              {/* Status summary pill */}
              <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">적용 스타일:</span>
                  <strong className="text-white">
                    {styleOptions.find((s) => s.id === clockStyle)?.label}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">테마 색상:</span>
                  <strong className="text-white">
                    {themeOptions.find((t) => t.id === themeColor)?.label}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">초침 움직임:</span>
                  <strong className={showSecondHand ? 'text-sky-400' : 'text-amber-400'}>
                    {showSecondHand ? '표시 (매초 회전)' : '숨김 (산만함 차단)'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="기본값 복원"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                기본값
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  맞춤 설정 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
