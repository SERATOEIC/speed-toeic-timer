import React, { useState } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall';
import {
  Download,
  Check,
  Share,
  PlusSquare,
  X,
  Smartphone,
  Sparkles,
  ExternalLink,
  Copy,
  Info,
} from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  showBadge?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  showBadge = true,
}) => {
  const { isInstalled, isIOS, isInAppBrowser, isInIframe, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideType, setGuideType] = useState<'ios' | 'in_app' | 'iframe' | 'fallback'>('ios');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleClick = async () => {
    // If already installed, do not trigger duplicate installation
    if (isInstalled) return;

    // 1. iPhone / iPad Safari: manual instructions (Safari doesn't support beforeinstallprompt)
    if (isIOS) {
      setGuideType('ios');
      setShowGuideModal(true);
      return;
    }

    // 2. In-App browser (KakaoTalk, Naver, etc.)
    if (isInAppBrowser) {
      setGuideType('in_app');
      setShowGuideModal(true);
      return;
    }

    // 3. AI Studio preview iframe: browser blocks prompt inside iframe
    if (isInIframe) {
      setGuideType('iframe');
      setShowGuideModal(true);
      return;
    }

    // 4. Android Chrome / Desktop: triggers the native beforeinstallprompt dialog directly!
    const result = await install();

    if (result.outcome === 'ios_manual_needed') {
      setGuideType('ios');
      setShowGuideModal(true);
    } else if (result.outcome === 'in_app_browser') {
      setGuideType('in_app');
      setShowGuideModal(true);
    } else if (result.outcome === 'iframe_blocked') {
      setGuideType('iframe');
      setShowGuideModal(true);
    } else if (result.outcome === 'unsupported' && !isInstalled) {
      setGuideType('fallback');
      setShowGuideModal(true);
    }
    // If 'accepted' or 'dismissed', the browser's native popup already completed, no extra modal needed.
  };

  const handleCopyCurrentUrl = async () => {
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(window.location.href);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch {}
  };

  const handleOpenTopWindow = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`group relative inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-2xl font-bold text-xs transition-all duration-200 shadow-md overflow-hidden ${
          isInstalled
            ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 cursor-default'
            : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25 ring-1 ring-emerald-400/50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
        } ${className}`}
        title={isInstalled ? '앱 설치 완료 (단독 어플리케이션 실행 중)' : '스마트폰 단독 어플리케이션(PWA) 바로 설치'}
      >
        <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        {isInstalled ? (
          <>
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-extrabold tracking-tight">앱 설치 완료</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4 text-emerald-200 group-hover:animate-bounce shrink-0" />
            <span className="font-extrabold tracking-tight">앱 다운로드</span>
            {showBadge && (
              <span className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded-full bg-black/30 text-emerald-200 font-medium ml-0.5">
                단독 어플
              </span>
            )}
          </>
        )}
      </button>

      {/* Guide Modal only shown when native prompt cannot be executed directly */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl text-slate-100 space-y-4">
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-1.5">
                  <span>앱 설치 안내</span>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </h3>
                <p className="text-xs text-slate-400">
                  {guideType === 'ios'
                    ? '아이폰/아이패드 Safari 설치'
                    : guideType === 'in_app'
                    ? '인앱 브라우저 안내'
                    : guideType === 'iframe'
                    ? '미리보기 환경 안내'
                    : '브라우저 메뉴에서 설치'}
                </p>
              </div>
            </div>

            {/* iOS Safari Guide */}
            {guideType === 'ios' && (
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-slate-800 text-sky-400 shrink-0 mt-0.5">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <strong>1단계:</strong> 사파리(Safari) 하단 툴바의 <span className="text-sky-300 font-bold">[공유]</span> 버튼을 누릅니다.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-slate-800 text-emerald-400 shrink-0 mt-0.5">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <strong>2단계:</strong> 메뉴 목록을 스크롤하여 <span className="text-emerald-300 font-bold">[홈 화면에 추가]</span>를 선택합니다.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-slate-800 text-amber-400 shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <strong>3단계:</strong> 우측 상단의 <span className="text-amber-300 font-bold">[추가]</span>를 누르면 홈 화면에 전용 앱으로 설치됩니다!
                  </div>
                </div>
              </div>
            )}

            {/* In-app Browser Guide (Kakao, Naver) */}
            {guideType === 'in_app' && (
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
                <div className="flex items-start gap-2 text-amber-300 font-medium">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>카카오톡/네이버 인앱 브라우저에서는 단독 앱 설치가 차단되어 있습니다.</span>
                </div>
                <p className="leading-relaxed text-slate-300">
                  우측 상단 또는 하단 더보기(<strong>⋮</strong> 또는 <strong>⋯</strong>) 메뉴를 누른 후 <strong className="text-white underline">[다른 브라우저로 열기]</strong> (Chrome 또는 Safari)를 선택하시면 바로 설치 팝업이 작동합니다.
                </p>
                <button
                  type="button"
                  onClick={handleCopyCurrentUrl}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copySuccess ? '주소 복사 완료!' : '현재 앱 주소 복사하기'}
                </button>
              </div>
            )}

            {/* Iframe Preview Guide */}
            {guideType === 'iframe' && (
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
                <p className="leading-relaxed">
                  현재 Google AI Studio 미리보기(iFrame) 창에서 실행 중입니다. 브라우저 보안 규정상 iFrame 내부에서는 PWA 설치 팝업이 차단됩니다.
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleOpenTopWindow}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    새 브라우저 창에서 열기
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyCurrentUrl}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copySuccess ? 'URL 복사 완료!' : '앱 접속 주소 복사'}
                  </button>
                </div>
              </div>
            )}

            {/* Android / Desktop Fallback Guide */}
            {guideType === 'fallback' && (
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
                <p className="leading-relaxed">
                  브라우저 상단 주소창 우측의 <strong>[앱 설치]</strong> 아이콘(⊕)을 누르거나, 브라우저 메뉴(<strong>⋮</strong>)에서 <strong>'앱으로 설치'</strong> 또는 <strong>'홈 화면에 추가'</strong>를 선택해 주세요.
                </p>
                <p className="text-[11px] text-slate-400">
                  설치 시 독립 실행형 창으로 전체화면 아날로그 타이머를 더욱 몰입감 있게 이용할 수 있습니다.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
};
