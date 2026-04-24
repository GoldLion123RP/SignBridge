import React, { useState, useEffect } from 'react';
import { Activity, Info, Volume2, Copy, History as HistoryIcon, Sparkles, MessageSquare } from 'lucide-react';

interface Props {
  prediction: any;
}

export const TranslationPanel = ({ prediction }: Props) => {
  const [history, setHistory] = useState<{ text: string, time: string }[]>([]);

  useEffect(() => {
    if (prediction?.sentence) {
      const lastInHistory = history[0]?.text;
      if (prediction.sentence !== lastInHistory) {
        setHistory(prev => [
          { 
            text: prediction.sentence, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }, 
          ...prev.slice(0, 4) // Keep fewer on main panel for cleaner look
        ]);
      }
    }
  }, [prediction?.sentence]);

  const handlePlayAudio = () => {
    if (prediction?.audio) {
      const audio = new Audio(`data:audio/mp3;base64,${prediction.audio}`);
      audio.play().catch(e => console.error("[Audio] Replay error:", e));
    }
  };

  const handleCopy = () => {
    if (prediction?.sentence) {
      navigator.clipboard.writeText(prediction.sentence);
    }
  };

  return (
    <aside className="w-full h-full flex flex-col gap-6 overflow-hidden">
      
      {/* --- Primary Translation Output --- */}
      <div className="bg-white/5 rounded-[40px] p-8 md:p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00FF66]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-[#00FF66]/10 rounded-xl flex items-center justify-center border border-[#00FF66]/20">
                <Sparkles size={16} className="text-[#00FF66]" />
             </div>
             <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Neural Output</span>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handlePlayAudio}
              disabled={!prediction?.audio}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${prediction?.audio ? 'bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20 hover:bg-[#00FF66]/20' : 'bg-white/5 text-white/10 border border-white/5'}`}
            >
              <Volume2 size={18}/>
            </button>
            <button 
              onClick={handleCopy}
              disabled={!prediction?.sentence}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${prediction?.sentence ? 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white' : 'bg-white/5 text-white/10 border border-white/5'}`}
            >
              <Copy size={18}/>
            </button>
          </div>
        </div>

        <div className="min-h-[160px] flex items-center relative z-10">
          {prediction?.sentence ? (
            <div className="space-y-4 w-full">
               <p className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tighter italic animate-in fade-in slide-in-from-bottom-4 duration-700">
                "{prediction.sentence}"
               </p>
               <div className="flex items-center gap-2 text-[#00FF66]/60 text-[10px] font-black uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
                  Translated via ISL Engine v2.0
               </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 w-full">
              <div className="space-y-2">
                <p className="text-2xl font-bold text-white/20 tracking-tight italic">
                  Waiting for gestures...
                </p>
                <p className="text-[10px] text-white/10 font-black uppercase tracking-[0.3em]">System Standby</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {['Hello', 'Thank You', 'Yes', 'No'].map(s => (
                  <span key={s} className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl text-[11px] font-bold text-white/30 border border-white/5 transition-colors">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Intelligent History Stream --- */}
      <div className="flex-1 bg-white/5 rounded-[40px] flex flex-col overflow-hidden border border-white/5 backdrop-blur-md">
        <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                <MessageSquare size={16} className="text-blue-400" />
             </div>
             <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Live Stream</h3>
          </div>
          <div className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar">
          {history.length > 0 ? (
            history.map((item, i) => (
              <div 
                key={i} 
                className={`bg-white/[0.03] hover:bg-white/[0.06] p-5 rounded-[24px] border border-white/5 flex flex-col gap-2 transition-all duration-500 cursor-default group ${i === 0 ? "border-[#00FF66]/20 bg-[#00FF66]/5" : "opacity-40 hover:opacity-100"}`}
              >
                <div className="flex justify-between items-center">
                   <p className="text-sm font-bold text-white group-hover:text-[#00FF66] transition-colors">{item.text}</p>
                   <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{item.time}</span>
                </div>
                <div className="h-[1px] w-full bg-white/5" />
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-[#00FF66] transition-colors" />
                   <span className="text-[8px] font-black text-white/10 group-hover:text-white/30 uppercase tracking-[0.2em] transition-colors">Neural Sync Active</span>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-10">
              <MessageSquare size={48} strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Empty Stream</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
