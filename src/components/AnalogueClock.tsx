import React from 'react';
import { ClockStyle, ClockThemeColor } from '../types';

interface AnalogueClockProps {
  elapsedSeconds: number;
  totalTargetSeconds?: number; // 0 or undefined for stopwatch
  centerLogoUrl?: string;
  isPaused: boolean;
  size?: number; // default 460
  onTogglePause?: () => void;
  showSecondHand?: boolean; // Toggle second hand visibility
  styleType?: ClockStyle; // 'classic' | 'minimal' | 'modern' | 'roman'
  themeColor?: ClockThemeColor; // 'blue' | 'dark' | 'midnight' | 'emerald' | 'amber'
}

export const AnalogueClock: React.FC<AnalogueClockProps> = ({
  elapsedSeconds,
  totalTargetSeconds = 0,
  centerLogoUrl,
  isPaused,
  size = 460,
  onTogglePause,
  showSecondHand = true,
  styleType = 'classic',
  themeColor = 'blue',
}) => {
  // Hand degree calculations:
  // Hour hand: 360 deg over 12 hours (43200s) -> 30 deg/hr + 0.5 deg/min
  // Minute hand: 360 deg over 60 minutes (3600s) -> 6 deg/min + 0.1 deg/sec
  // Second hand: 360 deg over 60 seconds (60s) -> 6 deg/sec
  const seconds = elapsedSeconds % 60;
  const minutes = (elapsedSeconds / 60) % 60;
  const hours = (elapsedSeconds / 3600) % 12;

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  // Target countdown progress ring
  const progressRatio =
    totalTargetSeconds > 0
      ? Math.min(1, Math.max(0, elapsedSeconds / totalTargetSeconds))
      : null;

  const progressRadius = 172;
  const circumference = 2 * Math.PI * progressRadius;
  const strokeDashoffset =
    progressRatio !== null ? circumference * (1 - progressRatio) : 0;

  // Theme-specific color palettes
  const themePalettes: Record<
    ClockThemeColor,
    {
      faceGradient: [string, string, string];
      rimGradient: [string, string, string, string];
      centerBezel: [string, string, string];
      progressRing: [string, string];
      accentColor: string;
      cardinalColor: string;
      subColor: string;
      tickMajor: string;
      tickMinor: string;
      ambientGlow: string;
      centerBorderClass: string;
      secondHandColor: string;
    }
  > = {
    blue: {
      faceGradient: ['#0b1633', '#060d21', '#020510'],
      rimGradient: ['#38bdf8', '#1e293b', '#64748b', '#2563eb'],
      centerBezel: ['#fbbf24', '#38bdf8', '#f59e0b'],
      progressRing: ['#38bdf8', '#6366f1'],
      accentColor: '#38bdf8',
      cardinalColor: '#38bdf8',
      subColor: '#94a3b8',
      tickMajor: '#38bdf8',
      tickMinor: '#1e293b',
      ambientGlow: 'bg-blue-500/15 shadow-[0_0_80px_rgba(59,130,246,0.35)]',
      centerBorderClass: 'border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.3)]',
      secondHandColor: '#ef4444',
    },
    dark: {
      faceGradient: ['#121215', '#09090b', '#000000'],
      rimGradient: ['#71717a', '#27272a', '#3f3f46', '#18181b'],
      centerBezel: ['#a1a1aa', '#52525b', '#e4e4e7'],
      progressRing: ['#e4e4e7', '#71717a'],
      accentColor: '#f4f4f5',
      cardinalColor: '#ffffff',
      subColor: '#a1a1aa',
      tickMajor: '#d4d4d8',
      tickMinor: '#27272a',
      ambientGlow: 'bg-zinc-600/15 shadow-[0_0_80px_rgba(161,161,170,0.25)]',
      centerBorderClass: 'border-zinc-500/80 shadow-[0_0_25px_rgba(255,255,255,0.15)]',
      secondHandColor: '#f43f5e',
    },
    midnight: {
      faceGradient: ['#140d33', '#0c0724', '#050212'],
      rimGradient: ['#818cf8', '#312e81', '#6366f1', '#4338ca'],
      centerBezel: ['#c084fc', '#818cf8', '#a855f7'],
      progressRing: ['#a78bfa', '#6366f1'],
      accentColor: '#c084fc',
      cardinalColor: '#a78bfa',
      subColor: '#cbd5e1',
      tickMajor: '#a78bfa',
      tickMinor: '#312e81',
      ambientGlow: 'bg-indigo-600/20 shadow-[0_0_80px_rgba(129,140,248,0.35)]',
      centerBorderClass: 'border-purple-400/80 shadow-[0_0_25px_rgba(192,132,252,0.35)]',
      secondHandColor: '#f43f5e',
    },
    emerald: {
      faceGradient: ['#04251c', '#021611', '#010c09'],
      rimGradient: ['#34d399', '#064e3b', '#10b981', '#047857'],
      centerBezel: ['#fbbf24', '#34d399', '#059669'],
      progressRing: ['#34d399', '#10b981'],
      accentColor: '#34d399',
      cardinalColor: '#34d399',
      subColor: '#a7f3d0',
      tickMajor: '#34d399',
      tickMinor: '#064e3b',
      ambientGlow: 'bg-emerald-600/15 shadow-[0_0_80px_rgba(16,185,129,0.35)]',
      centerBorderClass: 'border-emerald-400/80 shadow-[0_0_25px_rgba(52,211,153,0.35)]',
      secondHandColor: '#fb923c',
    },
    amber: {
      faceGradient: ['#231707', '#150c03', '#080501'],
      rimGradient: ['#fbbf24', '#78350f', '#f59e0b', '#b45309'],
      centerBezel: ['#fef08a', '#fbbf24', '#f59e0b'],
      progressRing: ['#fbbf24', '#ea580c'],
      accentColor: '#fbbf24',
      cardinalColor: '#fde047',
      subColor: '#fed7aa',
      tickMajor: '#fbbf24',
      tickMinor: '#78350f',
      ambientGlow: 'bg-amber-600/20 shadow-[0_0_80px_rgba(245,158,11,0.35)]',
      centerBorderClass: 'border-amber-400/90 shadow-[0_0_25px_rgba(251,191,36,0.4)]',
      secondHandColor: '#ef4444',
    },
  };

  const currentTheme = themePalettes[themeColor] || themePalettes.blue;

  // 60 Minute / Second dial ticks (configured per style)
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const isQuarter = i % 15 === 0;
    const isMajor = i % 5 === 0;
    const angle = i * 6;

    if (styleType === 'minimal') {
      return {
        index: i,
        angle,
        isMajor,
        isQuarter,
        show: isMajor, // Only 12 marks in minimal
        length: isQuarter ? 10 : 6,
        strokeWidth: isQuarter ? 2.5 : 1.5,
        color: isQuarter ? currentTheme.accentColor : currentTheme.subColor,
      };
    }

    if (styleType === 'modern') {
      return {
        index: i,
        angle,
        isMajor,
        isQuarter,
        show: true,
        length: isQuarter ? 14 : isMajor ? 10 : 4,
        strokeWidth: isQuarter ? 3 : isMajor ? 2 : 1,
        color: isQuarter
          ? currentTheme.cardinalColor
          : isMajor
          ? currentTheme.accentColor
          : currentTheme.tickMinor,
      };
    }

    // Classic & Roman
    return {
      index: i,
      angle,
      isMajor,
      isQuarter,
      show: true,
      length: isQuarter ? 13 : isMajor ? 9 : 5,
      strokeWidth: isQuarter ? 2.5 : isMajor ? 2 : 1,
      color: isQuarter
        ? currentTheme.cardinalColor
        : isMajor
        ? currentTheme.tickMajor
        : currentTheme.tickMinor,
    };
  });

  // Numbers definition according to clock style
  const getNumeral = (num: number): string => {
    if (styleType === 'roman') {
      const romanMap: Record<number, string> = {
        12: 'XII',
        1: 'I',
        2: 'II',
        3: 'III',
        4: 'IV',
        5: 'V',
        6: 'VI',
        7: 'VII',
        8: 'VIII',
        9: 'IX',
        10: 'X',
        11: 'XI',
      };
      return romanMap[num] || String(num);
    }
    return String(num);
  };

  const getVisibleNumbers = (): number[] => {
    if (styleType === 'minimal') {
      return [12, 3, 6, 9];
    }
    return [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  };

  const visibleNumbers = getVisibleNumbers();

  return (
    <div
      onClick={onTogglePause}
      className="relative select-none flex items-center justify-center cursor-pointer group transition-transform active:scale-[0.99]"
      style={{ width: size, height: size }}
      title={
        onTogglePause
          ? isPaused
            ? '터치/클릭하여 계속하기 (Space)'
            : '터치/클릭하여 일시정지 (Space)'
          : undefined
      }
    >
      {/* Outer ambient aura glow */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-700 pointer-events-none ${
          isPaused
            ? 'bg-amber-500/15 shadow-[0_0_80px_rgba(245,158,11,0.3)]'
            : currentTheme.ambientGlow
        }`}
      />

      <svg
        viewBox="0 0 400 400"
        className="w-full h-full drop-shadow-2xl overflow-visible"
      >
        <defs>
          {/* Radial gradient for clock face */}
          <radialGradient id={`clockFaceGrad_${themeColor}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={currentTheme.faceGradient[0]} />
            <stop offset="65%" stopColor={currentTheme.faceGradient[1]} />
            <stop offset="100%" stopColor={currentTheme.faceGradient[2]} />
          </radialGradient>

          {/* Outer rim metallic gradient */}
          <linearGradient id={`rimGrad_${themeColor}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={currentTheme.rimGradient[0]} />
            <stop offset="35%" stopColor={currentTheme.rimGradient[1]} />
            <stop offset="70%" stopColor={currentTheme.rimGradient[2]} />
            <stop offset="100%" stopColor={currentTheme.rimGradient[3]} />
          </linearGradient>

          {/* Center frame rim gradient (Luxury Metallic) */}
          <linearGradient id={`centerBezelGrad_${themeColor}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={currentTheme.centerBezel[0]} />
            <stop offset="50%" stopColor={currentTheme.centerBezel[1]} />
            <stop offset="100%" stopColor={currentTheme.centerBezel[2]} />
          </linearGradient>

          {/* Progress ring gradient */}
          <linearGradient id={`progressGrad_${themeColor}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={currentTheme.progressRing[0]} />
            <stop offset="100%" stopColor={currentTheme.progressRing[1]} />
          </linearGradient>

          {/* Filter for shadows */}
          <filter id="handShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.85" />
          </filter>
        </defs>

        {/* Outer Bezel (Double metallic rings) */}
        <circle
          cx="200"
          cy="200"
          r="194"
          fill="none"
          stroke={`url(#rimGrad_${themeColor})`}
          strokeWidth="3.5"
          className="opacity-80"
        />
        <circle
          cx="200"
          cy="200"
          r="188"
          fill="none"
          stroke="#1e293b"
          strokeWidth="4.5"
        />

        {/* Dial Face Background */}
        <circle
          cx="200"
          cy="200"
          r="185"
          fill={`url(#clockFaceGrad_${themeColor})`}
        />

        {/* Target Countdown Progress Arc */}
        {progressRatio !== null && (
          <circle
            cx="200"
            cy="200"
            r={progressRadius}
            fill="none"
            stroke={`url(#progressGrad_${themeColor})`}
            strokeWidth="5.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 200 200)"
            className="transition-[stroke-dashoffset] duration-300"
          />
        )}

        {/* Dial Ticks */}
        {ticks.map((tick) => {
          if (!tick.show) return null;
          const rad = (tick.angle * Math.PI) / 180;
          const outerR = 178;
          const innerR = outerR - tick.length;
          const x1 = 200 + outerR * Math.sin(rad);
          const y1 = 200 - outerR * Math.cos(rad);
          const x2 = 200 + innerR * Math.sin(rad);
          const y2 = 200 - innerR * Math.cos(rad);

          return (
            <line
              key={tick.index}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={tick.color}
              strokeWidth={tick.strokeWidth}
              strokeLinecap="round"
            />
          );
        })}

        {/* Hour Numerals */}
        {visibleNumbers.map((num) => {
          const angle = num * 30;
          const rad = (angle * Math.PI) / 180;
          // Position numbers clearly between tick marks (178) and enlarged center frame (96)
          const numR = styleType === 'roman' ? 146 : 148;
          const x = 200 + numR * Math.sin(rad);
          const y = 200 - numR * Math.cos(rad);
          const isCardinal = num === 12 || num === 3 || num === 6 || num === 9;

          return (
            <text
              key={num}
              x={x}
              y={y + (styleType === 'roman' ? 5 : 6)}
              textAnchor="middle"
              className={`select-none ${
                styleType === 'roman'
                  ? 'font-serif font-bold text-[14px]'
                  : 'font-mono-numbers font-black'
              } ${
                isCardinal
                  ? styleType === 'minimal'
                    ? 'text-[22px]'
                    : 'text-[18px]'
                  : 'text-[14px]'
              }`}
              style={{
                fill: isCardinal ? currentTheme.cardinalColor : currentTheme.subColor,
              }}
            >
              {getNumeral(num)}
            </text>
          );
        })}

        {/* Subtitle Branding text under 12 */}
        <text
          x="200"
          y="118"
          textAnchor="middle"
          className="text-[8.5px] font-bold tracking-widest uppercase select-none"
          style={{ fill: currentTheme.accentColor, opacity: 0.85 }}
        >
          SPEED TOEIC TIMER
        </text>

        {/* ------------------------------------------------------------- */}
        {/* ENLARGED CENTER FRAME DISK (지름 약 48% 확대: r=96 in 400 viewBox) */}
        {/* 관리자 등록 중앙 대표 이미지가 시원시원하고 웅장하게 보이도록 대폭 확대 */}
        {/* ------------------------------------------------------------- */}
        <circle
          cx="200"
          cy="200"
          r="97"
          fill="none"
          stroke={`url(#centerBezelGrad_${themeColor})`}
          strokeWidth="3.5"
          className="shadow-2xl"
        />
        <circle
          cx="200"
          cy="200"
          r="95"
          fill="#020617"
        />

        {/* ------------------------------------------------------------- */}
        {/* CLOCK HANDS */}
        {/* Designed to gracefully extend beyond the enlarged center disk */}
        {/* ------------------------------------------------------------- */}
        {/* 1. Hour Hand (reaches beyond radius 96 to radius 132) */}
        <g transform={`rotate(${hourDeg} 200 200)`} filter="url(#handShadow)">
          {/* Main Hour needle body */}
          <polygon
            points="195,200 205,200 202.5,108 197.5,108"
            fill="#f8fafc"
          />
          {/* Hour Tip Accent */}
          <polygon
            points="197.5,108 202.5,108 200,94"
            fill={currentTheme.accentColor}
          />
        </g>

        {/* 2. Minute Hand (reaches past radius 96 out to radius 168) */}
        <g transform={`rotate(${minuteDeg} 200 200)`} filter="url(#handShadow)">
          {/* Main Minute needle body */}
          <polygon
            points="196.5,200 203.5,200 201.5,50 198.5,50"
            fill="#ffffff"
          />
          {/* Minute Arrow Tip */}
          <polygon
            points="198.5,50 201.5,50 200,36"
            fill={currentTheme.cardinalColor}
          />
        </g>

        {/* 3. Second Hand (Smooth Sweeping Needle) - Conditionally Rendered */}
        {showSecondHand && (
          <g transform={`rotate(${secondDeg} 200 200)`}>
            {/* Counterbalance tail */}
            <line
              x1="200"
              y1="200"
              x2="200"
              y2="230"
              stroke={currentTheme.secondHandColor}
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Long second needle extending to dial ticks */}
            <line
              x1="200"
              y1="200"
              x2="200"
              y2="30"
              stroke={currentTheme.secondHandColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Arrow tip point */}
            <polygon
              points="197,36 203,36 200,24"
              fill={currentTheme.secondHandColor}
            />
          </g>
        )}

        {/* Center Pivot Pin (Always rendered for realistic mechanical look) */}
        <circle
          cx="200"
          cy="200"
          r="5.5"
          fill={showSecondHand ? currentTheme.secondHandColor : currentTheme.accentColor}
          stroke="#ffffff"
          strokeWidth="1.5"
        />
      </svg>

      {/* ------------------------------------------------------------- */}
      {/* HTML OVERLAY FOR ENLARGED CENTER FRAME IMAGE */}
      {/* Diameter is 47.5% of total size: e.g. 218px in 460px clock! */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`absolute rounded-full overflow-hidden flex items-center justify-center pointer-events-none z-10 border-2 bg-slate-950 transition-all ${currentTheme.centerBorderClass}`}
        style={{
          width: size * 0.475,
          height: size * 0.475,
        }}
      >
        {centerLogoUrl ? (
          <img
            src={centerLogoUrl}
            alt="Clock Center Emblem"
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          /* Default Premium Instructor / Academy Crest Graphic */
          <div className="w-full h-full bg-gradient-to-b from-[#0a1630] via-[#050c1c] to-[#02050f] flex flex-col items-center justify-center p-3 text-center select-none relative overflow-hidden">
            {/* Ambient gold star/crown accent */}
            <div className="text-amber-400 text-xs sm:text-sm leading-none mb-0.5">★</div>
            <div className="flex flex-col items-center">
              <span className="text-xs sm:text-base font-black tracking-tight text-white leading-none">
                SPEED
              </span>
              <span
                className="text-[11px] sm:text-sm font-extrabold tracking-widest leading-tight"
                style={{ color: currentTheme.accentColor }}
              >
                TOEIC
              </span>
              <span className="mt-1 text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                실전 고사장
              </span>
            </div>
            <span className="text-[7px] sm:text-[8px] text-slate-400 mt-1 font-mono tracking-tighter">
              1초 정답 도출 훈련
            </span>
          </div>
        )}
      </div>

      {/* Pause Watermark / Pulsing Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-slate-950/75 rounded-full flex flex-col items-center justify-center backdrop-blur-[2.5px] transition-all z-20">
          <div className="px-5 py-2.5 rounded-full bg-amber-500/20 border border-amber-500/60 text-amber-300 font-extrabold text-sm sm:text-base tracking-wider uppercase flex items-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.35)] animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            일시정지 중
          </div>
          <span className="text-xs text-slate-200 mt-2.5 font-medium bg-slate-900/90 px-3.5 py-1 rounded-full border border-slate-700 shadow">
            시계를 다시 클릭하거나 Space를 누르면 재개됩니다
          </span>
        </div>
      )}
    </div>
  );
};
