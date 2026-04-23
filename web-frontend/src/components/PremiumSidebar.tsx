import React from 'react';
import { Video, History, GraduationCap, Settings, LogOut } from 'lucide-react';

interface Props {
  user: { name: string, plan: string };
  connected: boolean;
}

export const PremiumSidebar = ({ user, connected }: Props) => {
  return (
    <aside className="hidden md:flex flex-col h-screen w-64 border-r fixed left-0 top-0 bg-[#F8F9FA] border-gray-200 z-50">
      <div className="flex flex-col p-6 h-full">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-outline/5 overflow-hidden">
            <img src="/logo.png" alt="SignBridge Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-primary font-bold text-xl tracking-tight">SignBridge AI</h1>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest">ISL Interpreter</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem icon={<Video size={20} />} label="Translate" active />
          <NavItem icon={<History size={20} />} label="History" />
          <NavItem icon={<GraduationCap size={20} />} label="Learn ISL" />
          <NavItem icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100 flex items-center gap-3 px-2">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold border-2 border-primary-container/20">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${connected ? 'bg-secondary' : 'bg-error'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-on-surface truncate">{user.name}</p>
            <p className="text-[10px] text-outline">{user.plan}</p>
          </div>
          <button className="p-2 hover:bg-red-50 text-error rounded-lg transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
    active 
      ? 'bg-primary-container/10 text-primary shadow-sm' 
      : 'text-outline hover:bg-surface-container hover:text-on-surface'
  }`}>
    {icon}
    {label}
  </button>
);
