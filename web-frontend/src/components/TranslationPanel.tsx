import React from 'react';
import { Activity, Info, Volume2, Copy, History as HistoryIcon } from 'lucide-react';

interface Props {
  prediction: any;
}

export const TranslationPanel = ({ prediction }: Props) => {
  return (
    <aside className="flex-1 flex flex-col gap-6 min-w-[320px] max-w-[480px] h-full overflow-hidden">
      {/* Primary Translation Bubble */}
      <div className="bg-white border-l-[6px] border-primary rounded-r-2xl p-6 shadow-md shadow-primary/5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-outline uppercase tracking-widest flex items-center gap-2">
            <Activity size={14} className="text-primary" />
            Live Translation
          </span>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-surface-container rounded-lg text-outline transition-colors"><Volume2 size={18}/></button>
            <button className="p-2 hover:bg-surface-container rounded-lg text-outline transition-colors"><Copy size={18}/></button>
          </div>
        </div>
        <div 
          className="min-h-[120px] flex items-center"
          aria-live="assertive"
        >
          {prediction?.sentence ? (
            <p className="text-4xl font-black text-on-surface leading-tight tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-500 italic">
              "{prediction.sentence}"
            </p>
          ) : (
            <p className="text-xl font-medium text-outline/50 italic">
              Waiting for gestures...
            </p>
          )}
        </div>
      </div>

      {/* Recent Activity Card */}
      <div className="flex-1 bg-surface-container/50 rounded-2xl flex flex-col overflow-hidden border border-outline/10 shadow-inner">
        <div className="p-4 border-b border-outline/5 bg-white/50 backdrop-blur-md flex justify-between items-center">
          <h3 className="font-bold text-on-surface flex items-center gap-2">
            <HistoryIcon size={18} className="text-primary" />
            History
          </h3>
          <Info size={16} className="text-outline/30" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <HistoryItem text="I am doing very well, thank you." time="10:42 AM" />
          <HistoryItem text="Can we schedule a meeting for tomorrow?" time="10:41 AM" />
          <HistoryItem text="Good morning team." time="10:38 AM" />
          <HistoryItem text="Let's begin the presentation." time="10:30 AM" opacity="opacity-40" />
        </div>
      </div>
    </aside>
  );
};

const HistoryItem = ({ text, time, opacity = "opacity-100" }: { text: string, time: string, opacity?: string }) => (
  <div className={`bg-white p-4 rounded-xl shadow-sm border border-outline/5 flex flex-col gap-1 transition-all hover:scale-[1.02] ${opacity}`}>
    <p className="text-sm font-medium text-on-surface">{text}</p>
    <span className="text-[10px] font-bold text-outline uppercase">{time}</span>
  </div>
);
