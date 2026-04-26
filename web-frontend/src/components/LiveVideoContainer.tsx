import React, { memo, useRef } from 'react';
import CameraCapture from './CameraCapture';
import { Camera, CameraOff, Maximize2, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  onFrame: (frame: string) => void;
  connected: boolean;
  cameraEnabled: boolean;
  onCameraToggle: () => void;
  landmarks: any;
  prediction: any;
}

export const LiveVideoContainer = memo(({ onFrame, connected, cameraEnabled, onCameraToggle, landmarks, prediction }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4" ref={containerRef}>
      {/* Header/Toggle Row */}
      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${cameraEnabled ? 'bg-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.4)]' : 'bg-red-500'}`} />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
               Hardware {cameraEnabled ? 'Active' : 'Standby'}
            </span>
         </div>
         
         <button 
            onClick={onCameraToggle}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
              cameraEnabled 
                ? 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/20 hover:bg-[#00FF66]/20' 
                : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
            }`}
          >
            {cameraEnabled ? <Camera size={14} /> : <CameraOff size={14} />}
            {cameraEnabled ? 'Disable Engine' : 'Enable Engine'}
          </button>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 bg-black/40 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
        
        {/* Visual Accents */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 border-[1px] border-white/5 rounded-[40px]" />
        
        {/* Status Badges Overlay */}
        <div className="absolute top-6 right-6 z-30 flex gap-2">
           <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
              <ShieldCheck size={12} className="text-[#00FF66]" />
              <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">Neural Link</span>
           </div>
           <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
              <Zap size={12} className="text-[#00FF66]" />
              <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">ISL v2.0</span>
           </div>
        </div>

        {/* Main Video Viewport */}
        <div className="w-full h-full relative z-0">
          <CameraCapture 
            onFrame={onFrame} 
            enabled={cameraEnabled} 
            connected={connected}
            landmarks={landmarks} 
            prediction={prediction}
          />
          
          {/* Placeholder when camera is off */}
          {!cameraEnabled && (
            <div className="absolute inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center gap-6 z-40">
              <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center border border-white/10">
                 <CameraOff size={32} className="text-white/20" />
              </div>
              <div className="text-center space-y-2">
                 <p className="text-white/20 font-black uppercase tracking-[0.4em] text-xs">Engine Interface Locked</p>
                 <p className="text-white/10 text-[9px] font-bold uppercase tracking-widest">Enable hardware to begin translation</p>
              </div>
            </div>
          )}
        </div>

        {/* Corner Brackets */}
        <div className="absolute bottom-8 right-8 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
              onClick={toggleFullScreen}
              className="w-10 h-10 bg-black/60 hover:bg-[#00FF66] hover:text-black backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center transition-all"
           >
              <Maximize2 size={16} />
           </button>
        </div>

        {/* Dynamic Overlay for Gestures */}
        <div className="absolute bottom-8 left-8 z-30 pointer-events-none flex flex-col gap-2">
           {prediction?.gesture && (
              <div className="bg-[#00FF66] text-black px-5 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,102,0.4)] animate-in zoom-in duration-300">
                 Detected: {prediction.gesture}
              </div>
           )}
           <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#00FF66]' : 'bg-red-500'}`} />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                 {connected ? 'Sync Stream' : 'Sync Offline'}
              </span>
           </div>
        </div>
      </div>
    </div>
  );
});
