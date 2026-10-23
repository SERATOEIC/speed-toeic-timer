import React from 'react';
import { createPortal } from 'react-dom';
import { Notice } from '../types';
import { Bell, Pin, Calendar, X } from 'lucide-react';

interface NoticesModalProps {
  isOpen: boolean;
  notices: Notice[];
  onClose: () => void;
}

export const NoticesModal: React.FC<NoticesModalProps> = ({ isOpen, notices, onClose }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">스터디 공지사항</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notices Content List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {notices.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all ${
                n.isPinned
                  ? 'bg-slate-950/80 border-amber-500/40 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    n.category === '필독'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : n.category === '이벤트'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {n.category}
                </span>

                {n.isPinned && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                    <Pin className="w-3 h-3 fill-current" />
                    상단 고정
                  </span>
                )}

                <h4 className="text-sm font-bold text-white flex-1">{n.title}</h4>
              </div>

              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {n.content}
              </p>

              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                <Calendar className="w-3 h-3" />
                <span>{n.createdAt}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
