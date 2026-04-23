import React from 'react';
import CameraCapture from './CameraCapture';
import { ShieldCheck, Sun, Eye, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onFrame: (frame: ImageData) => void;
  connected: boolean;
  landmarks: any;
  prediction: any;
}

export const LiveVideoContainer = ({ onFrame, connected, landmarks, prediction }: Props) => {
  const handsDetected = (landmarks?.hands_detected || 0) > 0;
  
  return (
    <section className="flex-[2.5] relative rounded-3xl overflow-hidden shadow-2xl border border-outline/10 bg-black isolate group min-h-[500px]">
      {/* Video Feed */}
      <div className="absolute inset-0 z-0">
        <CameraCapture onFrame={onFrame} enabled={connected} landmarks={landmarks} prediction={prediction} />
      </div>

      {/* Ambient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none z-10" />

      {/* Status Pills */}
      <div className="absolute top-6 left-6 flex gap-3 z-20">
        <AnimatePresence>
          {handsDetected ? (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-secondary px-4 py-2 rounded-full flex items-center gap-2 shadow-lg"
            >
              <ShieldCheck size={16} className="text-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Hands in frame</span>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-error px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-pulse"
            >
              <AlertCircle size={16} className="text-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Move hands into view</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border border-white/20">
          <Sun size={16} className="text-primary-container" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">Optimal Lighting</span>
        </div>
      </div>

      {/* Safe Zone Overlay - Forced 4:3 to match camera */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 p-8">
        <div className={`aspect-[4/3] h-full max-w-full border-4 border-dashed rounded-3xl transition-all duration-700 relative ${
          handsDetected ? 'animate-pulse-safe-zone border-secondary' : 'border-white/20'
        }`}>
          {/* Reticles */}
          <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-inherit" />
          <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-inherit" />
          <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-inherit" />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-inherit" />
        </div>
      </div>

      {/* Center Prompt */}
      <AnimatePresence>
        {!connected && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="text-center p-8">
              <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <WifiOff className="text-white" size={32} />
              </div>
              <h3 className="text-white font-black text-2xl mb-2">System Offline</h3>
              <p className="text-white/60 text-sm">Attempting to reconnect to cloud engine...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const WifiOff = ({ className, size }: { className?: string, size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);
