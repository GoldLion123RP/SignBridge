import React, { memo } from 'react';
import CameraCapture from './CameraCapture';
import { Camera, Maximize2, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  onFrame: (frame: ImageData) => void;
  connected: boolean;
  landmarks: any;
  prediction: any;
}

export const LiveVideoContainer = memo(({ onFrame, connected, landmarks, prediction }: Props) => {
  return (
    <div className="w-full h-full min-h-[400px] lg:min-h-[500px] bg-black/40 rounded-[48px] border border-white/5 shadow-2xl relative overflow-hidden group">
      
      {/* Visual Accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 border-[12px] border-white/5 rounded-[48px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-2 h-2 bg-red-500 rounded-full animate-ping z-20" />
      
      {/* Status Badges Overlay */}
      <div className="absolute top-8 right-8 z-30 flex gap-3">
         <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#00FF66]" />
            <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Neural Secure</span>
         </div>
         <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
            <Zap size={14} className="text-[#00FF66]" />
            <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">ISL v2.0</span>
         </div>
      </div>

      {/* Main Video Viewport */}
      <div className="w-full h-full relative z-0">
        <CameraCapture 
          onFrame={onFrame} 
          enabled={connected} 
          landmarks={landmarks} 
        />
        
        {/* Placeholder when disconnected */}
        {!connected && (
          <div className="absolute inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center gap-6 z-40">
            <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center border border-white/10">
               <Camera size={32} className="text-white/20" />
            </div>
            <p className="text-white/20 font-black uppercase tracking-[0.4em] text-xs">Waiting for Engine Link</p>
          </div>
        )}
      </div>

      {/* Corner Brackets */}
      <div className="absolute bottom-12 right-12 z-30 opacity-40 group-hover:opacity-100 transition-opacity">
         <button className="w-12 h-12 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center transition-all">
            <Maximize2 size={20} />
         </button>
      </div>

      {/* Dynamic Overlay for Gestures */}
      <div className="absolute bottom-12 left-12 z-30 pointer-events-none flex flex-col gap-2">
         {prediction?.gesture && (
            <div className="bg-[#00FF66] text-black px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,102,0.4)] animate-in zoom-in duration-300">
               Detected: {prediction.gesture}
            </div>
         )}
         <div className="bg-black/40 backdrop-blur-md px-5 py-2 rounded-xl border border-white/5 flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#00FF66]' : 'bg-red-500'}`} />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
               {connected ? 'Streaming Active' : 'Link Terminated'}
            </span>
         </div>
      </div>
    </div>
  );
});
