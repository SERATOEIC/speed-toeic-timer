import React from 'react';
import { Student } from '../types';
import { formatSecondsToKorean } from '../utils/storage';
import { Trophy, Crown, Flame, Award, Clock, Target, Sparkles } from 'lucide-react';

interface Top3PodiumProps {
  students: Student[];
  currentStudentId: string | null;
}

export const Top3Podium: React.FC<Top3PodiumProps> = ({ students, currentStudentId }) => {
  // Filter approved students and sort descending by cumulative study time
  const approvedSorted = [...students]
    .filter((s) => s.status === 'approved')
    .sort((a, b) => b.totalStudySeconds - a.totalStudySeconds);

  const first = approvedSorted[0];
  const second = approvedSorted[1];
  const third = approvedSorted[2];

  // Current logged in student rank
  const myIndex = approvedSorted.findIndex((s) => s.id === currentStudentId);
  const myStudent = currentStudentId ? students.find((s) => s.id === currentStudentId) : null;
  const isMyRankInTop3 = myIndex >= 0 && myIndex < 3;

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-400 shadow-sm">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
              명예의 전당 (TOP 3)
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-sky-400 border border-blue-400/30">
                실시간 누적 순공
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              최고의 몰입과 시간 관리를 보여주는 상위 1~3위 수강생 랭킹
            </p>
          </div>
        </div>
      </div>

      {/* Podium Cards Grid: 2nd (Silver, left), 1st (Gold, center & prominent), 3rd (Bronze, right) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
        {/* 2nd Place: Silver Medalist (Left on desktop) */}
        {second ? (
          <div
            className={`order-2 md:order-1 relative rounded-2xl p-5 border transition-all duration-300 hover:translate-y-[-2px] ${
              second.id === currentStudentId
                ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-sky-400 ring-2 ring-sky-400/30 shadow-lg'
                : 'bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950 border-slate-700/60 shadow-md'
            }`}
          >
            {/* Rank badge */}
            <div className="absolute -top-3.5 left-5 px-3 py-0.5 rounded-full bg-gradient-to-r from-slate-200 to-slate-300 text-slate-900 text-xs font-black shadow flex items-center gap-1.5 border border-slate-100">
              <Award className="w-3.5 h-3.5 text-slate-700" />
              2위 SILVER
            </div>

            <div className="pt-2 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-lg font-bold text-white truncate flex items-center gap-1.5">
                  {second.name}
                  {second.id === currentStudentId && (
                    <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">
                      나
                    </span>
                  )}
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-2 text-sky-400 font-extrabold font-mono-numbers text-xl sm:text-2xl">
                <Clock className="w-4 h-4 text-slate-400 self-center" />
                {formatSecondsToKorean(second.totalStudySeconds)}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                <span>오늘: {formatSecondsToKorean(second.todayStudySeconds || 0)}</span>
                <span className="text-[10px] text-slate-500 font-medium">은빛 질주</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="order-2 md:order-1 p-5 rounded-2xl border border-dashed border-slate-800 text-center text-slate-600 text-xs">
            2위 수강생 대기 중
          </div>
        )}

        {/* 1st Place: Gold Champion (Center & Most Prominent) */}
        {first ? (
          <div
            className={`order-1 md:order-2 relative rounded-2xl p-6 border transition-all duration-300 hover:translate-y-[-4px] md:-mt-5 ${
              first.id === currentStudentId
                ? 'bg-gradient-to-b from-amber-950/70 via-slate-900 to-slate-950 border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_35px_rgba(251,191,36,0.3)]'
                : 'bg-gradient-to-b from-amber-950/50 via-slate-900/95 to-slate-950 border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.22)]'
            }`}
          >
            {/* Champion Gold Crown Badge */}
            <div className="absolute -top-4 left-6 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 text-xs font-black shadow-lg flex items-center gap-1.5 border border-yellow-200 animate-pulse">
              <Crown className="w-4 h-4 fill-current text-slate-950" />
              1위 CHAMPION
            </div>

            <div className="pt-2 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-black text-white truncate flex items-center gap-1.5">
                    {first.name}
                    {first.id === currentStudentId && (
                      <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-black">
                        나
                      </span>
                    )}
                  </span>
                  <Flame className="w-5 h-5 text-amber-400" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2 text-amber-300 font-black font-mono-numbers text-2xl sm:text-3xl tracking-tight">
                <Clock className="w-5 h-5 text-amber-400 self-center" />
                {formatSecondsToKorean(first.totalStudySeconds)}
              </div>

              <div className="flex items-center justify-between text-xs text-amber-200/90 mt-2.5 pt-2 border-t border-amber-500/20">
                <span className="font-semibold">
                  오늘 집중: {formatSecondsToKorean(first.todayStudySeconds || 0)}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-extrabold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  TOP RUNNER
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="order-1 md:order-2 p-6 rounded-2xl border border-dashed border-slate-800 text-center text-slate-600 text-xs">
            1위 챔피언 대기 중
          </div>
        )}

        {/* 3rd Place: Bronze Medalist (Right on desktop) */}
        {third ? (
          <div
            className={`order-3 relative rounded-2xl p-5 border transition-all duration-300 hover:translate-y-[-2px] ${
              third.id === currentStudentId
                ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-sky-400 ring-2 ring-sky-400/30 shadow-lg'
                : 'bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950 border-slate-700/60 shadow-md'
            }`}
          >
            {/* Rank badge */}
            <div className="absolute -top-3.5 left-5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-700 to-amber-800 text-amber-100 text-xs font-black shadow flex items-center gap-1.5 border border-amber-600">
              <Award className="w-3.5 h-3.5 text-amber-200" />
              3위 BRONZE
            </div>

            <div className="pt-2 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-lg font-bold text-white truncate flex items-center gap-1.5">
                  {third.name}
                  {third.id === currentStudentId && (
                    <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">
                      나
                    </span>
                  )}
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-2 text-sky-400 font-extrabold font-mono-numbers text-xl sm:text-2xl">
                <Clock className="w-4 h-4 text-slate-400 self-center" />
                {formatSecondsToKorean(third.totalStudySeconds)}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                <span>오늘: {formatSecondsToKorean(third.todayStudySeconds || 0)}</span>
                <span className="text-[10px] text-slate-500 font-medium">동빛 추격</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="order-3 p-5 rounded-2xl border border-dashed border-slate-800 text-center text-slate-600 text-xs">
            3위 수강생 대기 중
          </div>
        )}
      </div>

      {/* If current logged in student is ranked 4th or below, show motivating personal rank strip */}
      {myStudent && !isMyRankInTop3 && (
        <div className="mt-4 p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-blue-600/40 text-blue-300 font-bold border border-blue-500/40">
              내 현재 순위: {myIndex >= 0 ? `${myIndex + 1}위` : '승인 대기'}
            </span>
            <span className="text-slate-200">
              <strong>{myStudent.name}</strong> 님의 누적 순공:{' '}
              <strong className="text-sky-300 font-mono-numbers">
                {formatSecondsToKorean(myStudent.totalStudySeconds)}
              </strong>
            </span>
          </div>

          {third && myIndex >= 0 && (
            <span className="text-sky-400 font-medium text-xs">
              TOP 3 진입까지{' '}
              <strong className="text-white underline">
                {formatSecondsToKorean(
                  Math.max(0, third.totalStudySeconds - myStudent.totalStudySeconds + 60)
                )}
              </strong>{' '}
              남았습니다! 🔥
            </span>
          )}
        </div>
      )}
    </div>
  );
};
