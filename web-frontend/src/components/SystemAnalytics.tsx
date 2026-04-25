import React, { memo } from 'react';
import { Activity, Cpu, Database, Gauge, Timer } from 'lucide-react';

interface Props {
  prediction: any;
  latency: number;
}

export const SystemAnalytics = memo(({ prediction, latency }: Props) => {
  const confidence = prediction?.confidence || 0;
  
  return (
    <div className="w-full bg-white/5 rounded-[40px] p-8 md:p-10 border border-white/5 backdrop-blur-md relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FF66]/5 rounded-full blur-3xl -translate-y-16 translate-x-16" />
      
      <div className="flex items-center gap-3 mb-10">
         <div className="w-8 h-8 bg-teal-500/10 rounded-xl flex items-center justify-center border border-teal-500/20">
            <Gauge size={16} className="text-teal-400" />         </div>
         <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Neural Analytics</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
        {/* Confidence Analytics */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
               <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Model Precision</p>
               <h4 className="text-3xl font-black text-white italic">{(confidence * 100).toFixed(0)}%</h4>
            </div>
            <Activity className="text-[#00FF66] mb-1" size={20} />
          </div>
          
          <div className="w-full h-3 bg-white/5 rounded-full p-[3px] border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-[#00FF66]/40 to-[#00FF66] rounded-full shadow-[0_0_12px_rgba(0,255,102,0.3)] transition-all duration-700 ease-out"
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
          
          <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Weighted Neural Score</p>
        </div>

        {/* Latency Analytics */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
               <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Link Latency</p>
               <h4 className="text-3xl font-black text-white italic">{latency}ms</h4>
            </div>
            <Timer className="text-blue-400 mb-1" size={20} />
          </div>

          <div className="w-full h-3 bg-white/5 rounded-full p-[3px] border border-white/5">
            <div 
              className={`h-full rounded-full shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all duration-500 ${
                latency < 50 ? 'bg-blue-500 w-[20%]' : 
                latency < 150 ? 'bg-blue-400 w-[45%]' : 
                latency < 500 ? 'bg-orange-400 w-[75%]' : 'bg-red-500 w-[95%]'
              }`}
            />
          </div>

          <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Socket Round-trip</p>
        </div>
      </div>

      {/* Micro-stats Footer */}
      <div className="mt-12 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
         <div className="flex items-center gap-3">
            <Database size={14} className="text-white/20" />
            <div className="flex flex-col">
               <span className="text-[9px] font-black text-white/20 uppercase">Core Load</span>
               <span className="text-xs font-bold text-white/60">Optimized</span>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <Cpu size={14} className="text-white/20" />
            <div className="flex flex-col">
               <span className="text-[9px] font-black text-white/20 uppercase">Neural Unit</span>
               <span className="text-xs font-bold text-white/60">Active</span>
            </div>
         </div>
      </div>
    </div>
  );
});
