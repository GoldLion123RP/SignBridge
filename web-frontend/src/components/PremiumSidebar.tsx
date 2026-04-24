import React from 'react';
import { Video, History, GraduationCap, Settings, ChevronRight } from 'lucide-react';

interface Props {
  user: { name: string, plan: string };
  connected: boolean;
  cameraEnabled: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCameraToggle: () => void;
}

export const PremiumSidebar = ({ activeTab, onTabChange }: Props) => {
  const handleHomeClick = () => {
    onTabChange('translate');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <aside className="w-full h-full md:w-72 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex flex-col relative overflow-hidden">
      
      {/* Glossy Overlay */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00FF66]/20 to-transparent" />

      <div className="flex flex-col p-8 h-full">
        {/* Brand Section - Functional Logo */}
        <button 
          onClick={handleHomeClick}
          className="mb-12 flex items-center gap-4 group cursor-pointer text-left outline-none"
        >
          <div className="w-14 h-14 bg-white/5 rounded-[20px] flex items-center justify-center border border-white/10 shadow-2xl group-hover:border-[#00FF66]/40 transition-all duration-500 overflow-hidden relative">
            <div className="absolute inset-0 bg-[#00FF66]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain relative z-10 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-white font-black text-xl tracking-tighter uppercase leading-none">SignBridge</h1>
            <p className="text-[10px] font-black text-[#00FF66] uppercase tracking-[0.3em] mt-1.5 opacity-80">AI PRO ENGINE</p>
          </div>
        </button>

        {/* Navigation Section */}
        <nav className="flex-1 space-y-3">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 ml-4">Main Interface</p>
          
          <NavItem 
            icon={<Video size={20} />} 
            label="Translate" 
            active={activeTab === 'translate'} 
            onClick={() => onTabChange('translate')} 
          />
          
          <div className="h-4" />
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 ml-4">Resources</p>

          <NavItem 
            icon={<History size={20} />} 
            label="History" 
            active={activeTab === 'history'} 
            onClick={() => onTabChange('history')} 
          />
          <NavItem 
            icon={<GraduationCap size={20} />} 
            label="Lexicon" 
            active={activeTab === 'learn'} 
            onClick={() => onTabChange('learn')} 
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="Engine Settings" 
            active={activeTab === 'settings'} 
            onClick={() => onTabChange('settings')} 
          />
        </nav>

        {/* Bottom spacer for balance */}
        <div className="mt-auto opacity-10 text-center">
           <p className="text-[8px] font-black text-white uppercase tracking-[0.5em]">Neural Unit Active</p>
        </div>
      </div>
    </aside>
  );
};

const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl text-[13px] font-bold transition-all duration-500 group relative ${
      active 
        ? 'bg-white/5 text-white shadow-2xl border border-white/10' 
        : 'text-white/40 hover:bg-white/[0.02] hover:text-white border border-transparent'
    }`}
  >
    <div className="flex items-center gap-3 relative z-10">
      <div className={`${active ? 'text-[#00FF66]' : 'text-inherit'} transition-colors`}>
        {icon}
      </div>
      <span className="tracking-tight">{label}</span>
    </div>
    
    {active && (
       <div className="w-1.5 h-1.5 bg-[#00FF66] rounded-full shadow-[0_0_8px_rgba(0,255,102,0.8)]" />
    )}
    
    {!active && (
       <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    )}
  </button>
);
