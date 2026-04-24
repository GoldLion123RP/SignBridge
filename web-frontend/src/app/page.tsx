'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '@/components/WebSocketClient';
import { PremiumSidebar } from '@/components/PremiumSidebar';
import { LiveVideoContainer } from '@/components/LiveVideoContainer';
import { TranslationPanel } from '@/components/TranslationPanel';
import { SystemAnalytics } from '@/components/SystemAnalytics';
import { Wifi, WifiOff, Globe, BookOpen, Settings as SettingsIcon, History as HistoryIcon, LayoutDashboard, ChevronRight, Menu, X } from 'lucide-react';

// --- Sub-components for modern look ---

const ViewHeader = ({ title, connected, onMenuClick }: { title: string, connected: boolean, onMenuClick: () => void }) => (
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
        <h2 className="text-white font-bold text-lg tracking-tight flex items-center gap-2 uppercase tracking-widest text-[11px] opacity-60">
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
);

// --- Main Application ---

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('translate');
  const [history, setHistory] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [landmarks, setLandmarks] = useState<any>(null);
  const [latency, setLatency] = useState(0);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default to open on desktop
  const [user] = useState({ name: 'Rahul Pal', plan: 'Pro Plan' });
  
  const processingRef = useRef(false);
  const conversionCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const onMessage = useCallback((data: any) => {
    processingRef.current = false;
    if (data.landmarks) setLandmarks(data.landmarks);
    
    if (data.gesture || data.sentence) {
      setPrediction((prev: any) => ({
        ...prev,
        ...data,
        sentence: data.sentence || prev?.sentence 
      }));

      if (data.sentence) {
        setHistory(prev => [{ 
          text: data.sentence, 
          time: new Date().toLocaleTimeString(),
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

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000/ws/video";
  const { connected, sendMessage } = useWebSocket(wsUrl, onMessage);

  const handleFrame = useCallback((frame: ImageData) => {
    if (connected && cameraEnabled && !processingRef.current) {
      processingRef.current = true;
      
      if (!conversionCanvasRef.current) {
        conversionCanvasRef.current = document.createElement('canvas');
      }
      const canvas = conversionCanvasRef.current;
      canvas.width = frame.width;
      canvas.height = frame.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(frame, 0, 0);
        const b64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
        sendMessage({ frame: b64, timestamp: Date.now() });
      }
    }
  }, [connected, cameraEnabled, sendMessage]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0A0A0A] font-inter text-white selection:bg-[#00FF66]/30 overflow-hidden">
      
      {/* --- Responsive Sidebar --- */}
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
            user={user} 
            connected={connected} 
            cameraEnabled={cameraEnabled} 
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }}
            onCameraToggle={() => setCameraEnabled(!cameraEnabled)} 
          />
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Background Ambient Glow */}
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#00FF66]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-[#00FF66]/3 rounded-full blur-[100px] pointer-events-none" />

        <ViewHeader 
          title={activeTab === 'translate' ? 'Real-time Translation' : activeTab} 
          connected={connected} 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Dashboard Content Container */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden custom-scrollbar">
          
          {activeTab === 'translate' && (
            <div className="flex flex-col xl:flex-row gap-6 md:gap-8 max-w-[1800px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* Left Column: Video Viewport */}
              <div className="flex-1 flex flex-col gap-6">
                <LiveVideoContainer 
                  onFrame={handleFrame} 
                  connected={connected} 
                  cameraEnabled={cameraEnabled}
                  onCameraToggle={() => setCameraEnabled(!cameraEnabled)}
                  landmarks={landmarks} 
                  prediction={prediction}
                />
                
                {/* Mobile-friendly status bar below video */}
                <div className="xl:hidden flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.4)]" />
                      <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Active Stream</span>
                   </div>
                   <div className="text-[10px] font-mono text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded">
                     {latency}MS LATENCY
                   </div>
                </div>
              </div>

              {/* Right Column: Output & Intelligence */}
              <div className="w-full xl:w-[350px] 2xl:w-[450px] flex flex-col gap-6 md:gap-8">
                <TranslationPanel prediction={prediction} />
                <SystemAnalytics prediction={prediction} latency={latency} />
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-white mb-2">Translation History</h2>
                  <p className="text-white/40 text-xs font-medium uppercase tracking-[0.2em]">Archived Session Data</p>
                </div>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                  <HistoryIcon size={14} /> Clear All
                </button>
              </div>

              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] bg-white/5 rounded-[40px] border border-white/5 border-dashed relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                    <HistoryIcon size={24} className="text-white/20" />
                  </div>
                  <p className="text-white/40 font-medium tracking-wide">No translation records found in current session.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {history.map((item, i) => (
                    <div key={i} className="group bg-white/5 hover:bg-white/[0.08] p-6 rounded-[32px] border border-white/5 hover:border-[#00FF66]/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-500">
                      <div className="flex items-start gap-5">
                        <div className="w-12 h-12 bg-black/40 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-[#00FF66]/30 transition-all">
                          <span className="text-white/20 font-black text-xl italic group-hover:text-[#00FF66]/40">#{(history.length - i).toString().padStart(2, '0')}</span>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-white/90 mb-1 group-hover:translate-x-1 transition-transform">"{item.text}"</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded uppercase tracking-widest">ISL → ENG</span>
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em]">{item.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                        <div className="flex flex-col items-end gap-1">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">AI Confidence</p>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                              <div className="h-full bg-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.4)]" style={{ width: `${item.confidence * 100}%` }} />
                            </div>
                            <span className="text-sm font-black text-[#00FF66]">{(item.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        <button className="w-10 h-10 bg-white/5 hover:bg-[#00FF66] hover:text-black rounded-full flex items-center justify-center transition-all border border-white/10 hover:border-transparent">
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'learn' && (
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
          )}

          {activeTab === 'settings' && (
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
              
              <div className="mt-8 text-center">
                 <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">SignBridge Intelligent Systems — Version 2.0.4 build-882</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- Responsive Styles --- */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 102, 0.2);
        }
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
