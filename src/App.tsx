```tsx
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, update, push, remove } from 'firebase/database';
import confetti from 'canvas-confetti';

const firebaseConfig = {
  apiKey: "AIzaSyAHK4gNwWNDCZi0usmTyAIutisoH35Mevc",
  authDomain: "speed-toeic-timer.firebaseapp.com",
  projectId: "speed-toeic-timer",
  storageBucket: "speed-toeic-timer.firebasestorage.app",
  messagingSenderId: "829240884650",
  appId: "1:829240884650:web:527b477a0d05749a623fd3",
  measurementId: "G-0KBXHSFDVF"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const APK_DOWNLOAD_URL =
  'https://github.com/SERATOEIC/speed-toeic-timer/releases/latest/download/app-debug.apk';

export default function App() {
  const [roomId, setRoomId] = useState('speed-toeic-room');
  const [isAdmin, setIsAdmin] = useState(false);
  const [timeLeft, setTimeLeft] = useState(4500);
  const [isRunning, setIsRunning] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [announcement, setAnnouncement] = useState(
    'SPEED TOEIC 실시간 타이머에 오신 것을 환영합니다.'
  );
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    const roomRef = ref(db, `rooms/${roomId}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        if (data.timer) {
          setTimeLeft(data.timer.timeLeft ?? 4500);
          setIsRunning(data.timer.isRunning ?? false);
        }

        if (data.announcement !== undefined) {
          setAnnouncement(data.announcement);
        }

        if (data.students) {
          setStudents(
            Object.entries(data.students).map(
              ([id, val]: [string, any]) => ({ id, ...val })
            )
          );
        } else {
          setStudents([]);
        }
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            confetti();
            return 0;
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const handleTimerControl = (newRunning: boolean, newTime?: number) => {
    if (!isAdmin) return;

    update(ref(db, `rooms/${roomId}/timer`), {
      isRunning: newRunning,
      timeLeft: newTime !== undefined ? newTime : timeLeft,
    });
  };

  const handleAnnouncementChange = (newText: string) => {
    if (!isAdmin) return;

    update(ref(db, `rooms/${roomId}`), {
      announcement: newText,
    });
  };

  const handleJoinClass = (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentName.trim()) return;

    const studentsRef = ref(db, `rooms/${roomId}/students`);
    push(studentsRef, {
      name: studentName,
      approved: false,
    });

    setStudentName('');
    alert('수강 승인 요청이 전송되었습니다.');
  };

  const handleApproveStudent = (
    studentId: string,
    currentStatus: boolean
  ) => {
    if (!isAdmin) return;

    update(ref(db, `rooms/${roomId}/students/${studentId}`), {
      approved: !currentStatus,
    });
  };

  const handleDeleteStudent = (studentId: string) => {
    if (!isAdmin) return;

    remove(ref(db, `rooms/${roomId}/students/${studentId}`));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center">
      <div className="max-w-xl w-full bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold tracking-tight text-blue-400">
            SPEED TOEIC TIMER
          </h1>

          <div className="flex gap-2">
            <a
              href={APK_DOWNLOAD_URL}
              download
              className="text-xs px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 rounded transition font-medium text-white"
            >
              앱 다운로드
            </a>

            <button
              onClick={() => setIsAdmin(!isAdmin)}
              className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded transition font-medium"
            >
              {isAdmin ? '관리자 모드 (ON)' : '수강생 모드'}
            </button>
          </div>
        </div>

        <div className="mb-6 bg-gray-900 p-3.5 rounded-xl border border-gray-700/50 text-sm text-yellow-400 text-center font-medium">
          📢 {announcement}
        </div>

        <div className="text-7xl font-mono font-black text-center my-10 tracking-widest text-emerald-400">
          {formatTime(timeLeft)}
        </div>

        {isAdmin ? (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => handleTimerControl(!isRunning)}
                className={`px-5 py-2.5 rounded-lg font-bold transition ${
                  isRunning
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {isRunning ? '일시정지' : '시작'}
              </button>

              <button
                onClick={() => handleTimerControl(false, 2700)}
                className="px-3.5 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
              >
                LC (45분)
              </button>

              <button
                onClick={() => handleTimerControl(false, 4500)}
                className="px-3.5 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
              >
                RC (75분)
              </button>

              <button
                onClick={() => handleTimerControl(false, 7200)}
                className="px-3.5 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
              >
                LC+RC (120분)
              </button>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <label className="text-xs text-gray-400 block mb-1">
                실시간 공지사항 수정
              </label>

              <input
                type="text"
                defaultValue={announcement}
                onBlur={(e) => handleAnnouncementChange(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="엔터 또는 다른 곳 클릭 시 변경 적용"
              />
            </div>

            <div className="pt-4 border-t border-gray-700">
              <h2 className="text-sm font-semibold mb-3 text-gray-300">
                수강생 승인 및 접속 관리
              </h2>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {students.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    접속 신청한 수강생이 없습니다.
                  </p>
                )}

                {students.map((st) => (
                  <div
                    key={st.id}
                    className="flex justify-between items-center bg-gray-900 p-2.5 rounded-lg text-sm border border-gray-700/50"
                  >
                    <span>
                      {st.name}{' '}
                      <span
                        className={`text-xs ml-2 px-1.5 py-0.5 rounded ${
                          st.approved
                            ? 'bg-emerald-900/60 text-emerald-400'
                            : 'bg-amber-900/60 text-amber-400'
                        }`}
                      >
                        {st.approved ? '승인됨' : '대기중'}
                      </span>
                    </span>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() =>
                          handleApproveStudent(st.id, st.approved)
                        }
                        className={`px-2.5 py-1 rounded text-xs font-semibold ${
                          st.approved
                            ? 'bg-amber-700 hover:bg-amber-600'
                            : 'bg-blue-600 hover:bg-blue-500'
                        }`}
                      >
                        {st.approved ? '취소' : '승인'}
                      </button>

                      <button
                        onClick={() => handleDeleteStudent(st.id)}
                        className="px-2.5 py-1 bg-red-800 hover:bg-red-700 rounded text-xs font-semibold"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleJoinClass}
            className="flex gap-2 pt-4 border-t border-gray-700"
          >
            <input
              type="text"
              placeholder="이름을 입력하세요"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition"
            >
              입실 신청
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
```
