'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '@/components/WebSocketClient';
import { PremiumSidebar } from '@/components/PremiumSidebar';
import { LiveVideoContainer } from '@/components/LiveVideoContainer';
import { TranslationPanel } from '@/components/TranslationPanel';
import { SystemAnalytics } from '@/components/SystemAnalytics';
import { Wifi, WifiOff, Video, History, Settings } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [landmarks, setLandmarks] = useState<any>(null);
  const [latency, setLatency] = useState(0);
  const [user] = useState({ name: 'Rahul Pal', plan: 'Pro Plan' });
  const processingRef = useRef(false);
  const conversionCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const onMessage = useCallback((data: any) => {
    processingRef.current = false;
    if (data.landmarks) setLandmarks(data.landmarks);
    if (data.gesture || data.sentence) setPrediction(data);
    if (data.timestamp) {
      setLatency(Date.now() - data.timestamp);
    }
  }, []);

  const { connected, sendMessage } = useWebSocket("ws://127.0.0.1:8000/ws/video", onMessage);

  const handleFrame = useCallback((frame: ImageData) => {
    if (connected && !processingRef.current) {
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
        // Higher quality (0.7) for better finger tracking
        const b64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
        sendMessage({ frame: b64, timestamp: Date.now() });
        
        // Timeout to prevent queue buildup
        setTimeout(() => { processingRef.current = false; }, 500);
      }
    }
  }, [connected, sendMessage]);

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen bg-surface font-inter text-on-surface overflow-hidden">
      {/* Sidebar Navigation */}
      <PremiumSidebar user={user} connected={connected} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:ml-64 h-screen w-full overflow-hidden">
        
        {/* Modern Desktop Header */}
        <header className="hidden md:flex justify-between items-center px-8 py-4 border-b border-outline/5 bg-white/50 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-secondary animate-pulse shadow-[0_0_10px_rgba(0,110,42,0.5)]' : 'bg-error shadow-[0_0_10px_rgba(186,26,26,0.5)]'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-outline">
              Live Translation Session
            </span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            connected ? 'bg-secondary-container/20 text-on-secondary-container' : 'bg-error/10 text-error'
          }`}>
            {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {connected ? 'Cloud Engine Online' : 'Cloud Disconnected'}
          </div>
        </header>

        {/* Dashboard Workspace */}
        <div className="flex-1 p-8 flex flex-col lg:flex-row gap-8 overflow-hidden h-full max-w-[1600px] mx-auto w-full">
          
          {/* Main Video Viewport */}
          <LiveVideoContainer 
            onFrame={handleFrame} 
            connected={connected} 
            landmarks={landmarks} 
          />

          {/* Right Sidebar - Output & Analytics */}
          <div className="flex-1 flex flex-col gap-8 h-full">
            <TranslationPanel prediction={prediction} />
            <SystemAnalytics prediction={prediction} latency={latency} />
          </div>

        </div>
      </main>

      {/* Mobile Nav Overlay (Fallback) */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
         <div className="bg-white/80 backdrop-blur-2xl border border-outline/10 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-8">
            <Video className="text-primary" size={24} />
            <History className="text-outline" size={24} />
            <Settings className="text-outline" size={24} />
         </div>
      </div>
    </div>
  );
}
