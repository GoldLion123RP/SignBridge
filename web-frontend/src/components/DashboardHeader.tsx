'use client';

import React, { memo } from 'react';
import { Wifi, WifiOff, Globe, LayoutDashboard, Menu } from 'lucide-react';

interface Props {
  title: string;
  connected: boolean;
  onMenuClick: () => void;
}

export const DashboardHeader = memo(({ title, connected, onMenuClick }: Props) => (
  <header className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 md:px-8 py-6 border-b border-white/5 bg-black/20 backdrop-blur-2xl sticky top-0 z-40 transition-all">
    <div className="flex items-center gap-4 mb-4 md:mb-0">
      <button 
        onClick={onMenuClick}
        className="p-2 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors mr-2"
      >
        <Menu size={20} className="text-[#00FF66]" />
      </button>
      <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.4)] animate-pulse' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]'}`} />
      <div className="flex flex-col">
        <h2 className="text-white font-bold text-lg flex items-center gap-2 uppercase tracking-widest text-[11px] opacity-60">
          <LayoutDashboard size={14} />
          {title}
          
        </h2>
        <p className="text-white/40 text-[10px] font-medium tracking-[0.1em] mt-0.5">SIGNBRIDGE INTELLIGENT ENGINE v2.0</p>
      </div>
    </div>
    
    <div className="flex items-center gap-3">
       <div className={`hidden sm:flex items-center gap-2.5 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] border transition-all ${
         connected ? 'bg-[#00FF66]/5 border-[#00FF66]/20 text-[#00FF66]' : 'bg-red-500/5 border-red-500/20 text-red-500'
       }`}>
         {connected ? <Wifi size={14} className="animate-bounce" /> : <WifiOff size={14} />}
         {connected ? 'Real-time Link Active' : 'Link Offline'}
       </div>
       <div className="h-8 w-[1px] bg-white/10 hidden sm:block mx-1" />
       <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest px-3 py-2 bg-white/5 rounded-lg border border-white/5">
          <Globe size={14} />
          Global
       </div>
    </div>
  </header>
));

DashboardHeader.displayName = 'DashboardHeader';
