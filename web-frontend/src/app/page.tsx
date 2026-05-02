'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useWebSocket } from '@/components/WebSocketClient';
import { PremiumSidebar } from '@/components/PremiumSidebar';
import { LiveVideoContainer } from '@/components/LiveVideoContainer';
import { TranslationPanel } from '@/components/TranslationPanel';
import { SystemAnalytics } from '@/components/SystemAnalytics';
import { DashboardHeader } from '@/components/DashboardHeader';
import { HistoryList } from '@/components/HistoryList';
import { BookOpen, Settings as SettingsIcon, ChevronRight, X, LayoutDashboard } from 'lucide-react';

// --- Sub-components for Settings & Learn (Decomposed for cleaner Home) ---

const LearnGrid = () => (
  <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="mb-12">
      <h2 className="text-3xl font-black tracking-tight text-white mb-2">Lexicon Library</h2>
      <p className="text-white/40 text-xs font-medium uppercase tracking-[0.2em]">Supported ISL Gesture Repository</p>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {['Hello', 'Thank You', 'Yes', 'No', 'Help', 'Please', 'Sorry', 'More'].map((sign, i) => (
        <div key={sign} className="group bg-white/5 hover:bg-white/[0.08] rounded-[40px] p-6 border border-white/5 hover:border-[#00FF66]/20 transition-all duration-500 cursor-pointer overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00FF66]/5 rounded-full blur-2xl -translate-y-12 translate-x-12 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="aspect-[4/5] bg-black/40 rounded-[32px] mb-6 flex flex-col items-center justify-center border border-white/5 group-hover:border-[#00FF66]/10 transition-all relative overflow-hidden">
             <BookOpen size={48} className="text-white/5 group-hover:text-[#00FF66]/10 group-hover:scale-110 transition-all duration-700" />
             <span className="absolute bottom-4 text-[10px] font-black text-white/20 uppercase tracking-widest group-hover:text-[#00FF66]/40 transition-colors">Gesture Model v1.{i}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white/90 group-hover:text-white transition-colors">{sign}</h3>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Core Gesture</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-[#00FF66] group-hover:text-black transition-all">
              <ChevronRight size={14} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SettingsPanel = () => (
  <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="mb-12">
      <h2 className="text-3xl font-black tracking-tight text-white mb-2">Engine Settings</h2>
      <p className="text-white/40 text-xs font-medium uppercase tracking-[0.2em]">Neural Network Configuration</p>
    </div>

    <div className="bg-white/5 rounded-[48px] border border-white/5 divide-y divide-white/5 overflow-hidden backdrop-blur-md relative">
      <div className="p-8 md:p-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-[#00FF66]/10 rounded-2xl flex items-center justify-center border border-[#00FF66]/20">
            <SettingsIcon size={20} className="text-[#00FF66]" />
          </div>
          <div>
            <p className="font-bold text-lg text-white/90">Neural Audio Engine</p>
            <p className="text-xs text-white/40 font-medium tracking-wide mt-0.5">Automated Text-to-Speech synthesis for translations.</p>
          </div>
        </div>
        <div className="w-14 h-7 bg-[#00FF66] rounded-full relative shadow-[0_0_15px_rgba(0,255,102,0.3)] cursor-pointer">
          <div className="absolute right-1 top-1 w-5 h-5 bg-black rounded-full shadow-lg" />
        </div>
      </div>

      <div className="p-8 md:p-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
            <LayoutDashboard size={20} className="text-blue-400" />
          </div>
          <div>
            <p className="font-bold text-lg text-white/90">Processing Precision</p>
            <p className="text-xs text-white/40 font-medium tracking-wide mt-0.5">Balance between latency and recognition depth.</p>
          </div>
        </div>
        <select className="bg-black/40 px-5 py-3 rounded-2xl text-xs font-bold border border-white/10 text-white/80 focus:border-[#00FF66]/50 outline-none cursor-pointer">
          <option>High Speed (320px)</option>
          <option>High Quality (640px)</option>
          <option>Deep Neural (Full)</option>
        </select>
      </div>

      <div className="p-8 md:p-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 hover:bg-white/[0.02] transition-colors group">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 group-hover:bg-red-500/20 transition-colors">
            <X size={20} className="text-red-400" />
          </div>
          <div>
            <p className="font-bold text-lg text-red-400">Purge Session History</p>
            <p className="text-xs text-white/30 font-medium tracking-wide mt-0.5">Instantly clear all session logs and neural cache.</p>
          </div>
        </div>
        <button className="px-6 py-3 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-2xl text-xs font-black transition-all text-red-400 uppercase tracking-widest">
          Purge Now
        </button>
      </div>
    </div>
  </div>
);

// --- Main Application ---

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('translate');
  const [history, setHistory] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [landmarks, setLandmarks] = useState<any>(null);
  const [latency, setLatency] = useState(0);
  const [displayLatency, setDisplayLatency] = useState(0);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || 'dummy-token' : '';

  useEffect(() => { setMounted(true); }, []);

  // Throttle analytics updates to 2Hz to reduce re-renders of heavy components
  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayLatency(prev => {
        if (Math.abs(prev - latency) > 10) return latency;
        return prev;
      });
    }, 500);
    return () => clearInterval(timer);
  }, [latency]);

  const onMessage = useCallback((data: any) => {
    if (data.landmarks) setLandmarks(data.landmarks);
    
    if (data.gesture || data.sentence) {
      setPrediction((prev: any) => ({
        ...prev,
        ...data,
        sentence: data.sentence || prev?.sentence 
      }));

      if (data.sentence && data.status !== 'received') {
        setHistory(prev => [{ 
          text: data.sentence, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          confidence: data.confidence || 0.95
        }, ...prev].slice(0, 50));
      }
    }

    if (data.audio) {
      const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
      audio.play().catch(e => console.error("[Audio] Playback error:", e));
    }

    if (data.timestamp) {
      setLatency(Date.now() - data.timestamp);
    }
  }, []);

  const baseUrl = "wss://signbridge-backend.onrender.com/ws/video";
  const wsUrl = useMemo(() => token ? `${baseUrl}?token=${token}` : "", [token]);
  const { connected, sendMessage } = useWebSocket(wsUrl, onMessage);

  const handleFrame = useCallback((b64: string) => {
    if (connected && cameraEnabled) {
      sendMessage({ frame: b64, timestamp: Date.now() });
    }
  }, [connected, cameraEnabled, sendMessage]);

  const toggleCamera = useCallback(() => setCameraEnabled(prev => !prev), []);
  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);
  const clearHistory = useCallback(() => setHistory([]), []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0A0A0A] font-inter text-white selection:bg-[#00FF66]/30 overflow-hidden">
      
      {/* Sidebar - Memoized via Props */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 md:relative transition-all duration-500 ease-in-out ${
          isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0'
        }`}
      >
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-md md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} 
          onClick={() => setIsSidebarOpen(false)} 
        />
        <div className="h-full overflow-hidden">
           <PremiumSidebar 
            user={{ name: 'Rahul Pal', plan: 'Pro Plan' }} 
            connected={connected} 
            cameraEnabled={cameraEnabled} 
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }}
            onCameraToggle={toggleCamera} 
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <DashboardHeader 
          title={activeTab === 'translate' ? 'Real-time Translation' : activeTab} 
          connected={connected} 
          onMenuClick={toggleSidebar}
        />

        <div className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden custom-scrollbar">
          
          {activeTab === 'translate' && (
            <div className="flex flex-col xl:flex-row gap-6 md:gap-8 max-w-[1800px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              <div className="flex-1 flex flex-col gap-6">
                <LiveVideoContainer 
                  onFrame={handleFrame} 
                  connected={connected} 
                  cameraEnabled={cameraEnabled}
                  onCameraToggle={toggleCamera}
                  landmarks={landmarks} 
                  prediction={prediction}
                />
                
                <div className="xl:hidden flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.4)]" />
                      <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Active Stream</span>
                   </div>
                   <div className="text-[10px] font-mono text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded">
                     {displayLatency}MS LATENCY
                   </div>
                </div>
              </div>

              <div className="w-full xl:w-[350px] 2xl:w-[450px] flex flex-col gap-6 md:gap-8">
                <TranslationPanel prediction={prediction} history={history} />
                <SystemAnalytics prediction={prediction} latency={displayLatency} />
              </div>
            </div>
          )}

          {activeTab === 'history' && <HistoryList history={history} onClear={clearHistory} />}
          {activeTab === 'learn' && <LearnGrid />}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 255, 102, 0.2); }
      `}</style>
    </div>
  );
}
