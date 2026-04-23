import React from 'react';
import { Activity, Info } from 'lucide-react';

interface SidebarProps {
  prediction: any;
  landmarks: any;
}

const Sidebar: React.FC<SidebarProps> = ({ prediction, landmarks }) => {
  return (
    <div className="bg-white rounded-2xl border border-[#DADCE0] shadow-sm p-6 flex flex-col min-h-[520px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[#202124] font-semibold flex items-center">
          <Activity size={18} className="text-[#1A73E8] mr-2" />
          Live Analysis
        </h2>
        <Info size={16} className="text-[#BDC1C6]" />
      </div>

      {prediction ? (
        <div className="flex-grow space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center py-8 px-4 bg-[#F8F9FA] rounded-3xl border border-[#DADCE0] relative overflow-hidden shadow-inner">
            <div 
              className="absolute top-0 left-0 h-1.5 bg-[#1A73E8] transition-all duration-700" 
              style={{ width: `${(prediction.confidence || 0) * 100}%` }} 
            />
            <p className="text-[10px] font-bold text-[#1A73E8] uppercase tracking-[0.2em] mb-2">Detected Gesture</p>
            <p className="text-6xl font-black text-[#202124] tracking-tight" aria-live="polite">
              {prediction.gesture}
            </p>
            <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase">
              Match Score: {((prediction.confidence || 0) * 100).toFixed(0)}%
            </p>
          </div>

          {prediction.sentence && (
            <div className="bg-[#E8F0FE] p-6 rounded-3xl border border-[#D2E3FC] shadow-sm" aria-live="assertive">
              <p className="text-[10px] font-bold text-[#1967D2] uppercase tracking-wider mb-2">Smart Translation</p>
              <p className="text-xl font-medium text-[#174EA6] leading-relaxed italic">"{prediction.sentence}"</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-16 bg-[#F1F3F4] rounded-full flex items-center justify-center mb-4">
            <Activity size={32} className="text-[#BDC1C6]" />
          </div>
          <p className="text-sm font-medium text-[#5F6368]">Awaiting Interaction</p>
          <p className="text-[11px] text-[#9AA0A6] mt-2 italic leading-relaxed">
            Position your upper body and hands clearly within the camera frame
          </p>
        </div>
      )}

      <div className="mt-auto pt-6 border-t border-[#DADCE0] grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center p-2 rounded-xl bg-gray-50 border border-gray-100">
          <span className="text-[8px] font-bold text-[#70757A] uppercase mb-1">Hands</span>
          <span className={`text-sm font-black ${landmarks?.hands_detected ? 'text-[#1E8E3E]' : 'text-gray-300'}`}>
            {landmarks?.hands_detected || 0}
          </span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-xl bg-gray-50 border border-gray-100">
          <span className="text-[8px] font-bold text-[#70757A] uppercase mb-1">Face</span>
          <span className={`text-sm font-black ${landmarks?.face_detected ? 'text-[#1A73E8]' : 'text-gray-300'}`}>
            {landmarks?.face_detected ? 'YES' : 'NO'}
          </span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-xl bg-gray-50 border border-gray-100">
          <span className="text-[8px] font-bold text-[#70757A] uppercase mb-1">Body</span>
          <span className={`text-sm font-black ${landmarks?.pose_detected ? 'text-[#D93025]' : 'text-gray-300'}`}>
            {landmarks?.pose_detected ? 'YES' : 'NO'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
