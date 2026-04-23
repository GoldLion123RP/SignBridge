import React from 'react';
import { Target, Zap, Wifi, WifiOff } from 'lucide-react';

interface Props {
  prediction: any;
  latency: number;
}

export const SystemAnalytics = ({ prediction, latency }: Props) => {
  const confidence = prediction?.confidence ? Math.round(prediction.confidence * 100) : 0;
  
  return (
    <div className="bg-white rounded-2xl p-6 flex gap-8 shadow-sm border border-outline/10 mt-auto">
      <div className="flex-1 flex flex-col gap-2">
        <span className="text-[10px] font-bold text-outline uppercase tracking-widest flex items-center gap-2">
          <Target size={14} />
          AI Confidence
        </span>
        <div className="flex items-end gap-1">
          <span className="text-4xl font-black text-secondary">{confidence}</span>
          <span className="text-lg font-bold text-secondary mb-1">%</span>
        </div>
        <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
          <div 
            className="bg-secondary h-full rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
      
      <div className="w-[1px] bg-outline/10 self-stretch" />
      
      <div className="flex-1 flex flex-col gap-2">
        <span className="text-[10px] font-bold text-outline uppercase tracking-widest flex items-center gap-2">
          <Zap size={14} />
          Processing
        </span>
        <div className="flex items-end gap-1">
          <span className="text-4xl font-black text-on-surface">{latency || 0}</span>
          <span className="text-lg font-bold text-outline mb-1">ms</span>
        </div>
        <span className={`text-[10px] font-bold flex items-center gap-1.5 px-2 py-1 rounded-full w-fit ${
          latency < 50 ? 'bg-secondary-container/20 text-secondary' : 'bg-primary-container/10 text-primary'
        }`}>
          {latency > 0 ? <Wifi size={12} /> : <WifiOff size={12} />}
          {latency < 50 && latency > 0 ? 'SYSTEM OPTIMIZED' : 'LOCAL ENGINE'}
        </span>
      </div>
    </div>
  );
};
