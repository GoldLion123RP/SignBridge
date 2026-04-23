import React from 'react';
import { Zap, Sliders, AlertCircle } from 'lucide-react';
import CameraCapture from './CameraCapture';

interface VideoViewProps {
  processing: boolean;
  connected: boolean;
  landmarks: any;
  handleFrame: (frame: ImageData) => void;
}

const VideoView: React.FC<VideoViewProps> = ({ processing, connected, landmarks, handleFrame }) => {
  const handsDetected = landmarks?.hands_detected > 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#DADCE0] shadow-sm overflow-hidden group relative">
        <div className="aspect-video w-full bg-[#202124] relative">
          <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#DADCE0] flex items-center space-x-2 shadow-md">
              <Zap size={14} className={processing ? "text-[#FBBC04]" : "text-[#1E8E3E]"} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">
                {processing ? 'Analyzing...' : 'Ready'}
              </span>
            </div>
          </div>

          {/* Hand-Out-of-Frame Alert */}
          {!handsDetected && connected && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none transition-all duration-300">
              <div className="bg-white/90 px-6 py-4 rounded-2xl border-2 border-[#D93025] flex flex-col items-center space-y-2 shadow-2xl animate-pulse">
                <AlertCircle size={32} className="text-[#D93025]" />
                <span className="text-sm font-bold text-[#D93025] uppercase tracking-wider">Hand Out of Frame</span>
                <span className="text-[10px] text-gray-600 font-medium">Please position your hands clearly</span>
              </div>
            </div>
          )}

          <CameraCapture onFrame={handleFrame} enabled={connected} landmarks={landmarks} />
        </div>

        <div className="p-4 flex items-center justify-between border-t border-[#DADCE0]">
          <div className="flex items-center space-x-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-[#70757A] tracking-wider">Engine</span>
              <span className="text-sm font-medium text-[#1A73E8]">MediaPipe Dual-Mode Tracker</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Sliders size={14} className="text-gray-400" />
            <span className="text-xs text-[#70757A]">Threshold: 0.30</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoView;
