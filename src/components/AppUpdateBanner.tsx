import React from 'react';
import { Sparkles, RefreshCw, X, ArrowUpRight } from 'lucide-react';

interface AppUpdateBannerProps {
  isUpdateAvailable: boolean;
  serverVersion: string;
  isUpdating: boolean;
  onApplyUpdate: () => void;
  onDismiss: () => void;
}

export const AppUpdateBanner: React.FC<AppUpdateBannerProps> = ({
  isUpdateAvailable,
  serverVersion,
  isUpdating,
  onApplyUpdate,
  onDismiss,
}) => {
  if (!isUpdateAvailable) return null;

  return (
    <aside
      aria-label="앱 업데이트 알림"
      className="sticky top-0 z-50 w-full bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white shadow-xl border-b border-sky-400/30 animate-in slide-in-from-top duration-300"
    >
      <div className="max-w-6xl mx-auto px-4 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-300/30 shrink-0">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div className="text-xs sm:text-sm font-semibold truncate">
            <span className="font-extrabold text-amber-200">🚀 새 버전({serverVersion})</span>이 배포되었습니다! 최신 기능과 개선 사항을 적용하세요.
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            type="button"
            disabled={isUpdating}
            onClick={onApplyUpdate}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-blue-900 font-extrabold text-xs shadow-md flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer disabled:opacity-60"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-700" />
                <span>업데이트 적용 중...</span>
              </>
            ) : (
              <>
                <ArrowUpRight className="w-3.5 h-3.5 text-blue-700" />
                <span>지금 업데이트 적용</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-lg bg-blue-800/60 hover:bg-blue-800 text-sky-200 hover:text-white transition-colors cursor-pointer"
            title="나중에 업데이트"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
