import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Student } from '../types';
import {
  User,
  UserPlus,
  Shield,
  Lock,
  AlertCircle,
  CheckCircle,
  Clock,
  LogOut,
  SlidersHorizontal,
  X,
  Sparkles,
} from 'lucide-react';
import { formatSecondsToKorean } from '../utils/storage';

interface AuthModalProps {
  isOpen: boolean;
  students: Student[];
  currentStudentId: string | null;
  onSelectStudent: (studentId: string | null) => void;
  onRegisterStudent: (name: string) => void;
  onEnterAdmin: (password: string) => boolean | Promise<boolean>;
  onClose: () => void;
  onOpenStudentSettings?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  students,
  currentStudentId,
  onSelectStudent,
  onRegisterStudent,
  onEnterAdmin,
  onClose,
  onOpenStudentSettings,
}) => {
  const currentStudent = students.find((s) => s.id === currentStudentId) || null;

  // Tabs: 'my_profile' (if logged in) or 'register' (if not) | 'admin_login'
  const [tab, setTab] = useState<'my_profile' | 'register' | 'admin_login'>(() => {
    return currentStudent ? 'my_profile' : 'register';
  });

  // Registration form
  const [registerName, setRegisterName] = useState('');
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  // Admin password
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);

    const trimmed = registerName.trim();
    if (!trimmed) {
      setRegisterError('수강생 실명을 입력해 주세요.');
      return;
    }

    if (students.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setRegisterError('이미 등록된 이름입니다. 본인의 고유 실명을 입력해 주세요.');
      return;
    }

    onRegisterStudent(trimmed);
    setRegisterSuccess(
      `[${trimmed}] 님의 가입 신청이 접수되었습니다! 관리자의 승인 완료 후 타이머 이용이 가능합니다.`
    );
    setRegisterName('');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    const ok = await onEnterAdmin(adminPassword);
    if (!ok) {
      setAdminError('관리자 비밀번호가 일치하지 않습니다.');
    } else {
      onClose();
    }
  };

  const handleLogoutAccount = () => {
    if (window.confirm('현재 기기에서 내 계정 연결을 해제(로그아웃)하시겠습니까?')) {
      onSelectStudent(null);
      setTab('register');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header Tabs (Strictly 2 tabs: My Profile/Register + Admin) */}
        <div className="flex border-b border-slate-800 bg-slate-950">
          {currentStudent ? (
            <button
              onClick={() => {
                setTab('my_profile');
                setRegisterError(null);
              }}
              className={`flex-1 py-3.5 text-xs font-bold text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                tab === 'my_profile'
                  ? 'border-blue-500 text-blue-400 bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              내 프로필 정보
            </button>
          ) : (
            <button
              onClick={() => {
                setTab('register');
                setRegisterError(null);
                setRegisterSuccess(null);
              }}
              className={`flex-1 py-3.5 text-xs font-bold text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                tab === 'register'
                  ? 'border-blue-500 text-blue-400 bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              수강생 가입 신청
            </button>
          )}

          <button
            onClick={() => {
              setTab('admin_login');
              setAdminError(null);
            }}
            className={`flex-1 py-3.5 text-xs font-bold text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              tab === 'admin_login'
                ? 'border-blue-500 text-blue-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            관리자 인증
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6">
          {/* TAB 1: Logged-in Student's Own Profile (NO other students selectable) */}
          {tab === 'my_profile' && currentStudent && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-600/20 text-sky-400 border border-blue-500/30 flex items-center justify-center font-black text-lg">
                      {currentStudent.name.slice(0, 1)}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        {currentStudent.name}
                        {currentStudent.targetScore && (
                          <span className="text-[10px] text-sky-300 font-bold bg-blue-500/20 px-1.5 py-0.2 rounded border border-blue-400/30">
                            {currentStudent.targetScore}
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        {currentStudent.status === 'approved' ? (
                          <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            승인 완료 수강생
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                            승인 대기 중
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">오늘 공부 시간</span>
                    <strong className="text-sky-400 text-xs font-mono-numbers">
                      {formatSecondsToKorean(currentStudent.todayStudySeconds || 0)}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">누적 순공 시간</span>
                    <strong className="text-amber-300 text-xs font-mono-numbers">
                      {formatSecondsToKorean(currentStudent.totalStudySeconds || 0)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Policy note */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                🔒 <strong>보안 규정 안내:</strong> 공정한 순공 랭킹을 위해 다른 수강생 계정으로의 임의 변경 및 전환은 불가하며 본인 계정 기록만 누적됩니다.
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col gap-2">
                {onOpenStudentSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenStudentSettings();
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/35 text-indigo-200 border border-indigo-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                    내 아날로그 시계 맞춤 설정 (초침 숨김 / 테마)
                  </button>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleLogoutAccount}
                    className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="기기 연결 해제"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    계정 연결 해제
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold cursor-pointer"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Register (When not logged in) */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  수강생 가입 신청 (본인 실명 입력)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  이름을 입력하여 가입을 신청합니다. 등록된 이름으로 공부 시간이 자동 기록됩니다.
                  <strong className="text-amber-300 block mt-1 font-semibold">
                    ⚠️ 등록된 이름은 수강생 본인이 임의로 변경할 수 없습니다.
                  </strong>
                </p>
              </div>

              {registerError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  {registerError}
                </div>
              )}

              {registerSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  {registerSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  수강생 성명 (실명 입력) *
                </label>
                <input
                  type="text"
                  required
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  가입 신청서 제출
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Admin Login */}
          {tab === 'admin_login' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  관리자 제어 센터 인증
                </h3>
                <p className="text-xs text-slate-400">
                  앱 명칭, 텍스트/문구 관리, 블록 레이아웃 제어, 수강생 승인 관리를 진행합니다.
                </p>
              </div>

              {adminError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  {adminError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  관리자 비밀번호
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="관리자 비밀번호 입력"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  * 초기 기본 비밀번호: <strong className="text-slate-400">admin1234</strong>
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg cursor-pointer"
                >
                  관리자 패널 접속
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
