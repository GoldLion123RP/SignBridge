'use client';

import React, { memo } from 'react';
import { History as HistoryIcon, ChevronRight } from 'lucide-react';

interface HistoryItem {
  text: string;
  time: string;
  confidence: number;
}

interface Props {
  history: HistoryItem[];
  onClear: () => void;
}

export const HistoryList = memo(({ history, onClear }: Props) => (
  <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-white mb-2">Translation History</h2>
        <p className="text-white/40 text-xs font-medium uppercase tracking-[0.2em]">Archived Session Data</p>
      </div>
      <button 
        onClick={onClear}
        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
      >
        <HistoryIcon size={14} /> Clear All
      </button>
    </div>

    {history.length === 0 ? (
      <div className="flex flex-col items-center justify-center h-[400px] bg-white/5 rounded-[40px] border border-white/5 border-dashed relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
          <HistoryIcon size={24} className="text-white/20" />
        </div>
        <p className="text-white/40 font-medium tracking-wide">No translation records found in current session.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-4">
        {history.map((item, i) => (
          <div key={i} className="group bg-white/5 hover:bg-white/[0.08] p-6 rounded-[32px] border border-white/5 hover:border-[#00FF66]/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-500">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 bg-black/40 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-[#00FF66]/30 transition-all">
                <span className="text-white/20 font-black text-xl italic group-hover:text-[#00FF66]/40">#{(history.length - i).toString().padStart(2, '0')}</span>
              </div>
              <div>
                <p className="text-xl font-bold text-white/90 mb-1 group-hover:translate-x-1 transition-transform">"{item.text}"</p>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded uppercase tracking-widest">ISL → ENG</span>
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em]">{item.time}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
              <div className="flex flex-col items-end gap-1">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">AI Confidence</p>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                    <div className="h-full bg-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.4)]" style={{ width: `${item.confidence * 100}%` }} />
                  </div>
                  <span className="text-sm font-black text-[#00FF66]">{(item.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              <button className="w-10 h-10 bg-white/5 hover:bg-[#00FF66] hover:text-black rounded-full flex items-center justify-center transition-all border border-white/10 hover:border-transparent">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
));

HistoryList.displayName = 'HistoryList';
