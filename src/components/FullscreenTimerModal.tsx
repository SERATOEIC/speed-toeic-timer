import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnalogueClock } from './AnalogueClock';
import { soundSynth } from '../utils/audio';
import { formatSecondsDigital, formatSecondsToKorean } from '../utils/storage';
import { Volume2, VolumeX, Pause, Play, EyeOff, Eye, Maximize, Minimize, X, Palette } from 'lucide-react';
import confetti from 'canvas-confetti';

import { StudentCustomSettings, ClockStyle, ClockThemeColor } from '../types';

interface FullscreenTimerModalProps {
  isOpen: boolean;
  timerName: string;
  targetSeconds: number; // 0 for stopwatch
  centerLogoUrl?: string;
  studentName: string;
  studentSettings?: StudentCustomSettings;
  onUpdateStudentSettings?: (newSettings: StudentCustomSettings) => void;
  onFinishSession: (elapsedSeconds: number) => void;
  onCancel: () => void;
}


export const FullscreenTimerModal: React.FC<FullscreenTimerModalProps> = ({
  isOpen,
  timerName,
  targetSeconds,
  centerLogoUrl,
  studentName,
  studentSettings,
  onUpdateStudentSettings,
  onFinishSession,
  onCancel,
}) => {
  // Use Refs for bulletproof pause/resume math without stale closures
  const accumulatedMsRef = useRef<number>(0);
  const lastResumedAtRef = useRef<number | null>(null);

  // States for UI rendering
  const [currentElapsedSeconds, setCurrentElapsedSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [departureWarning, setDepartureWarning] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // In-session student clock customization
  const [showSecondHand, setShowSecondHand] = useState<boolean>(
    studentSettings?.showSecondHand ?? true
  );
  const [clockStyle, setClockStyle] = useState<ClockStyle>(
    studentSettings?.clockStyle ?? 'classic'
  );
  const [themeColor, setThemeColor] = useState<ClockThemeColor>(
    studentSettings?.themeColor ?? 'blue'
  );
  const [clockSize, setClockSize] = useState<number>(460);
  const [isQuickThemeMenuOpen, setIsQuickThemeMenuOpen] = useState<boolean>(false);

  // Responsive enlarged clock size calculation
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const computed = Math.min(
          550,
          Math.min(window.innerWidth - 32, window.innerHeight - 230)
        );
        setClockSize(Math.max(310, computed));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Sync when studentSettings change
  useEffect(() => {
    if (studentSettings) {
      setShowSecondHand(studentSettings.showSecondHand);
      setClockStyle(studentSettings.clockStyle);
      setThemeColor(studentSettings.themeColor);
    }
  }, [studentSettings]);

  const handleToggleSecondHand = () => {
    const nextVal = !showSecondHand;
    setShowSecondHand(nextVal);
    if (onUpdateStudentSettings) {
      onUpdateStudentSettings({
        showSecondHand: nextVal,
        clockStyle,
        themeColor,
      });
    }
  };

  const handleChangeTheme = (newTheme: ClockThemeColor) => {
    setThemeColor(newTheme);
    if (onUpdateStudentSettings) {
      onUpdateStudentSettings({
        showSecondHand,
        clockStyle,
        themeColor: newTheme,
      });
    }
    setIsQuickThemeMenuOpen(false);
  };


  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sound sync
  useEffect(() => {
    soundSynth.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // Compute exact elapsed milliseconds at any given moment
  const getElapsedMs = useCallback(() => {
    const accumulated = accumulatedMsRef.current;
    const lastResumed = lastResumedAtRef.current;
    if (!lastResumed) {
      return accumulated;
    }
    return accumulated + (Date.now() - lastResumed);
  }, []);

  // Initialize or reset session when modal opens
  useEffect(() => {
    if (isOpen) {
      accumulatedMsRef.current = 0;
      lastResumedAtRef.current = Date.now();
      setCurrentElapsedSeconds(0);
      setIsPaused(false);
      setDepartureWarning(false);

      // Try browser fullscreen if available
      try {
        if (!document.fullscreenElement && containerRef.current?.requestFullscreen) {
          containerRef.current.requestFullscreen().catch(() => {});
        }
      } catch {}
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [isOpen]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Main high-precision animation loop
  useEffect(() => {
    if (!isOpen || isPaused) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTickSecond = Math.floor(getElapsedMs() / 1000);

    const tick = () => {
      const elapsed = getElapsedMs();
      const sec = Math.floor(elapsed / 1000);
      setCurrentElapsedSeconds(sec);

      // Play audio tick on second boundary
      if (sec !== lastTickSecond) {
        lastTickSecond = sec;
        soundSynth.playTick();
      }

      // Check countdown finish
      if (targetSeconds > 0 && sec >= targetSeconds) {
        soundSynth.playFinishChime();
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.5 },
          });
        } catch {}
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, isPaused, getElapsedMs, targetSeconds]);

  /**
   * Pause / Resume Handler (핵심 버그 방지)
   * Freezes accumulatedMs instantly without losing milliseconds or drifting.
   */
  const handleTogglePause = useCallback(() => {
    if (isPaused) {
      // RESUME: mark resumption point
      lastResumedAtRef.current = Date.now();
      setIsPaused(false);
      soundSynth.playStateBeep(true);
    } else {
      // PAUSE: commit elapsed slice to accumulatedMsRef
      if (lastResumedAtRef.current) {
        accumulatedMsRef.current += (Date.now() - lastResumedAtRef.current);
      }
      lastResumedAtRef.current = null;
      setIsPaused(true);
      soundSynth.playStateBeep(false);
    }
  }, [isPaused]);

  /**
   * Page Visibility API: Screen departure detection
   * Automatically freezes timer if user changes tabs or minimizes
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleVisibility = () => {
      if (document.hidden) {
        if (!isPaused && lastResumedAtRef.current) {
          accumulatedMsRef.current += (Date.now() - lastResumedAtRef.current);
          lastResumedAtRef.current = null;
          setIsPaused(true);
          setDepartureWarning(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isOpen, isPaused]);

  // Spacebar toggle pause/resume
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        handleTogglePause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleTogglePause]);

  /**
   * [종료] 빨간색 버튼 작동:
   * 클릭 시 정확히 측정된 공부 시간을 사용자 누적 기록에 저장하고 메인 화면으로 복귀
   */
  const handleFinishAndSave = () => {
    const finalElapsedMs = getElapsedMs();
    const finalSeconds = Math.max(1, Math.floor(finalElapsedMs / 1000));

    soundSynth.playFinishChime();
    try {
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.5 },
      });
    } catch {}

    onFinishSession(finalSeconds);
  };

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (!isOpen) return null;

  const isCountdown = targetSeconds > 0;
  const remainingSeconds = isCountdown
    ? Math.max(0, targetSeconds - currentElapsedSeconds)
    : currentElapsedSeconds;

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[99999] bg-slate-950 text-white flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden select-none"
    >
      {/* Background ambient radial aura */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.8)_0%,rgba(2,6,23,0.95)_70%,rgba(0,0,0,1)_100%)] pointer-events-none" />

      {/* Top Header Bar: Clean, minimal distraction */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="px-3.5 py-1.5 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
            {timerName}
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline font-medium">
            수강생: <strong className="text-slate-200">{studentName}</strong>
          </span>
        </div>

        {/* Header utilities (second hand toggle, quick theme, sound, fullscreen, cancel) */}
        <div className="flex items-center gap-2">
          {/* Second Hand On/Off Quick Toggle (초침 숨기기/보이기) */}
          <button
            onClick={handleToggleSecondHand}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              showSecondHand
                ? 'bg-slate-900/90 border-slate-700/80 text-slate-200 hover:text-white hover:border-slate-500'
                : 'bg-amber-500/20 border-amber-500/60 text-amber-300 ring-1 ring-amber-500/30'
            }`}
            title={showSecondHand ? '초침 숨기기 (산만함 방지/집중 모드)' : '초침 다시 표시하기'}
          >
            {showSecondHand ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-ping" />
                <span className="hidden sm:inline">초침</span> ON
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">초침</span> 숨김
              </>
            )}
          </button>

          {/* Quick Theme Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setIsQuickThemeMenuOpen(!isQuickThemeMenuOpen)}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-800 cursor-pointer"
              title="시계 테마 색상 빠른 변경"
            >
              <Palette className="w-4 h-4 text-sky-400" />
            </button>

            {isQuickThemeMenuOpen && (
              <div className="absolute right-0 top-11 z-30 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl flex flex-col gap-1 w-36 animate-in fade-in zoom-in-95">
                <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5">테마 색상</span>
                {(
                  [
                    { id: 'blue', label: '스피드 블루', color: 'bg-sky-400' },
                    { id: 'dark', label: '카본 다크', color: 'bg-zinc-300' },
                    { id: 'midnight', label: '미드나잇', color: 'bg-purple-400' },
                    { id: 'emerald', label: '에메랄드', color: 'bg-emerald-400' },
                    { id: 'amber', label: '앰버 골드', color: 'bg-amber-400' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleChangeTheme(t.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      themeColor === t.id
                        ? 'bg-blue-600/30 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${t.color}`} />
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-800 cursor-pointer"
            title={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-sky-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          <button
            onClick={toggleBrowserFullscreen}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-800 hidden sm:block cursor-pointer"
            title={isFullscreen ? '전체화면 축소' : '브라우저 전체화면'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors border border-slate-800 cursor-pointer"
            title="저장 없이 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Focus Area: The Large Analogue Clock & Digital Time Display */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full my-auto py-2">
        {/* Large Analogue Clock with enlarged center frame image */}
        <div className="transition-transform duration-300">
          <AnalogueClock
            elapsedSeconds={currentElapsedSeconds}
            totalTargetSeconds={targetSeconds}
            centerLogoUrl={centerLogoUrl}
            isPaused={isPaused}
            size={clockSize}
            showSecondHand={showSecondHand}
            styleType={clockStyle}
            themeColor={themeColor}
            onTogglePause={handleTogglePause}
          />
        </div>


        {/* Digital Time & Pause Indicator */}
        <div className="mt-5 flex flex-col items-center gap-1.5">
          <div className="text-4xl sm:text-5xl font-extrabold font-mono-numbers tracking-tight text-white drop-shadow-[0_0_15px_rgba(56,189,248,0.25)]">
            {formatSecondsDigital(isCountdown ? remainingSeconds : currentElapsedSeconds)}
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
            <span>
              {isCountdown
                ? `남은 시간 (총 ${targetSeconds / 60}분)`
                : '실전 누적 공부 시간'}
            </span>
            <span className="text-slate-600">•</span>
            <button
              onClick={handleTogglePause}
              className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 underline underline-offset-4 cursor-pointer"
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  클릭하여 재개 (Space)
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  클릭하여 일시정지 (Space)
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Area: Prominent Red [종료] Button */}
      <div className="relative z-10 w-full max-w-md pb-4 pt-2 flex flex-col items-center gap-2">
        <button
          onClick={handleFinishAndSave}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 active:scale-[0.98] text-white font-black text-lg sm:text-xl shadow-[0_0_35px_rgba(239,68,68,0.55)] border border-red-400/50 transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <span className="w-3 h-3 rounded-full bg-white animate-pulse"></span>
          [종료] 실전 종료 및 공부 시간 저장
        </button>

        <p className="text-[11px] sm:text-xs text-slate-400 text-center">
          클릭 시 현재까지 측정한{' '}
          <strong className="text-white font-bold">
            {formatSecondsToKorean(currentElapsedSeconds)}
          </strong>
          이 <strong className="text-sky-300">{studentName}</strong> 님의 누적 순공 랭킹에 즉시
          저장됩니다.
        </p>
      </div>

      {/* Screen departure protection modal */}
      {departureWarning && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 max-w-sm w-full text-center shadow-[0_0_50px_rgba(245,158,11,0.3)] animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
              <EyeOff className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              화면 이탈 감지 (집중 보호 모드)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
              시험 화면을 벗어나거나 창을 최소화하여{' '}
              <strong className="text-amber-400">타이머가 일시정지</strong>되었습니다.
              <br />
              정직한 순공 기록을 위해 복귀 후 재개해 주세요.
            </p>
            <button
              onClick={() => {
                setDepartureWarning(false);
                handleTogglePause(); // Resume
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg transition-transform active:scale-95"
            >
              학습 계속하기 (재개)
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
