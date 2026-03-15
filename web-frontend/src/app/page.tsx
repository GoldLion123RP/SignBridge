import React, { useState, useEffect, useRef } from 'react';
import { useWebSocketClient } from '@/components/WebSocketClient';
import CameraCapture from '@/components/CameraCapture';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { 
  XMarkIcon, 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon 
} from '@heroicons/react/24/outline';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface WebSocketClientInstance {
  connected: boolean;
  messages: WebSocketMessage[];
  sendMessage: (data: any) => void;
  closeConnection: () => void;
  setConnected: (value: boolean) => void;
  setMessages: (value: WebSocketMessage[] | ((prev: WebSocketMessage[]) => WebSocketMessage[])) => void;
}

interface Prediction {
  gesture: string;
  confidence: number;
  sentence: string;
  audio: string;
}

// Theme Toggle Component
const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />; // Placeholder to avoid layout shift
  }

  return (
    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        title="Light Mode"
      >
        <SunIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-md transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        title="System Theme"
      >
        <ComputerDesktopIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-slate-700 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        title="Dark Mode"
      >
        <MoonIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default function Page() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [history, setHistory] = useState<Prediction[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // WebSocket event handlers - must be defined before useWebSocketClient
  const handleWebSocketOpen = () => {
    setConnected(true);
    setError(null);
  };

  const handleWebSocketClose = () => {
    setConnected(false);
    setError('WebSocket connection closed');
  };

  const handleWebSocketError = (error: Event) => {
    setError('WebSocket connection error: ' + error.toString());
  };

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    try {
      const data = message.data;

      if (data.status === 'received') {
        const gesture = data.gesture;
        const confidence = data.confidence || 0;
        const sentence = data.sentence;
        const audio = data.audio;

        // ONLY update UI if there is a valid gesture or sentence.
        // Ignore empty 'heartbeats' where both gesture and sentence are null so the UI doesn't get overridden constantly.
        if (gesture || sentence) {
          const newPrediction: Prediction = {
            gesture: gesture || 'unknown',
            confidence,
            sentence: sentence || '',
            audio: audio || ''
          };

          setPrediction(prev => {
             // If we just got a gesture but no sentence, preserve the previous sentence so it doesn't disappear.
             if (gesture && !sentence && prev) {
                 return { ...newPrediction, sentence: prev.sentence, audio: prev.audio };
             }
             return newPrediction;
          });

          // Only add to history if a FULL sentence was recognized
          if (sentence) {
             setHistory(prev => [newPrediction, ...prev.slice(0, 9)]);
          }

          // Play audio if available
          if (audio && !audioPlaying) {
            playAudio(audio);
          }
        }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  };

  // Initialize WebSocket client
  const wsClient = useWebSocketClient({
    url: "ws://localhost:8000/ws/video",
    onMessage: handleWebSocketMessage,
    onOpen: handleWebSocketOpen,
    onClose: handleWebSocketClose,
    onError: handleWebSocketError
  });

  const playAudio = (base64Audio: string) => {
    if (audioRef.current) {
      setAudioPlaying(true);

      const audioBlob = base64ToBlob(base64Audio, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioElement = audioRef.current;

      audioElement.src = audioUrl;
      audioElement.play().then(() => {
        audioElement.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setAudioPlaying(false);
        };
      }).catch(() => {
        URL.revokeObjectURL(audioUrl);
        setAudioPlaying(false);
      });
    }
  };

  const base64ToBlob = (base64: string, contentType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 4096) {
      const slice = byteCharacters.slice(offset, offset + 4096);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  };

  const sendMessage = (data: any) => {
    wsClient.sendMessage(data);
  };

  const sendFrame = (frame: ImageData) => {
    if (connected && !processing) {
      setProcessing(true);

      const canvas = document.createElement('canvas');
      canvas.width = frame.width;
      canvas.height = frame.height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(frame, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (reader.result) {
                sendMessage({
                  frame: reader.result.toString().split(',')[1], // base64 data
                  timestamp: Date.now()
                });
              }
            };
            reader.readAsDataURL(blob);
          }
        }, 'image/jpeg', 0.7); // 70% quality
      }

      // Reset processing after a short delay to avoid blocking
      setTimeout(() => setProcessing(false), 100);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    setPrediction(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Header - Glassmorphism */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                SignBridge AI
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-medium">Real-time sign language translation</p>
            </div>
            
            <div className="flex items-center space-x-6">
              <ThemeToggle />
              
              <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-lg flex items-center space-x-2">
              <span className="font-bold">!</span>
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Camera Feed Context */}
          <div className="lg:col-span-2">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-white/5 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Camera Feed</h2>
                  <div className={`text-xs font-semibold px-2 py-1 rounded-md ${processing ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    {processing ? 'Processing frame...' : 'Waiting...'}
                  </div>
                </div>

                <div className="relative mb-6 rounded-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                  <CameraCapture
                    width={640}
                    height={480}
                    onFrame={sendFrame}
                    enabled={connected && !processing}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => sendMessage({ reset: true })}
                    className="w-full bg-rose-600 hover:bg-rose-500 dark:bg-rose-700 dark:hover:bg-rose-600 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!connected}
                  >
                    Reset Connection
                  </button>

                  <button
                    onClick={clearHistory}
                    className="w-full bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    Clear History
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Translation Panel */}
          <div>
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-white/5 overflow-hidden flex flex-col h-full">
              <div className="p-6 flex-grow flex flex-col">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">Live Translation</h2>

                {/* Current Prediction Component */}
                <div className="mb-6 flex-shrink-0">
                  {prediction ? (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-5 shadow-inner">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-blue-800 dark:text-blue-300 font-bold uppercase tracking-wider text-xs">Current Detection</h3>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-semibold px-2 py-1 bg-white/50 dark:bg-black/20 rounded-md text-blue-700 dark:text-blue-300">
                            Confidence: {Math.round(prediction.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-2xl text-blue-900 dark:text-blue-100 font-semibold leading-tight min-h-[3rem]">
                        {prediction.sentence ? `"${prediction.sentence}"` : (prediction.gesture !== 'unknown' ? `[Signing: ${prediction.gesture}]` : 'Waiting for gesture...')}
                      </p>
                      
                      {prediction.audio && (
                        <div className="mt-4 pt-3 border-t border-blue-200/50 dark:border-blue-800/30 flex justify-end">
                           <button
                              onClick={() => playAudio(prediction.audio)}
                              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-semibold transition-colors"
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                ▶
                              </div>
                              <span>Play Audio</span>
                            </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-100 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                       <span className="text-4xl mb-3">👋</span>
                       <p className="text-slate-500 dark:text-slate-400 font-medium">Start signing to see translations</p>
                    </div>
                  )}
                </div>

                {/* History */}
                <div className="flex-grow flex flex-col min-h-0">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wider">Translation History</h3>
                  
                  <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 flex-grow overflow-hidden flex flex-col">
                    {history.length === 0 ? (
                      <div className="flex-grow flex items-center justify-center p-6 text-slate-400 text-sm font-medium text-center">
                        Your translation history will appear here.
                      </div>
                    ) : (
                      <div className="p-3 space-y-2 overflow-y-auto max-h-[400px]">
                        {history.map((item, index) => (
                          <div
                            key={index}
                            className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700/50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-slate-800 dark:text-slate-100 font-bold leading-snug">"{item.sentence}"</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">{item.gesture}</span>
                              <span className="text-slate-400 font-medium">{Math.round(item.confidence * 100)}% Match</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Audio Player Overlay */}
        <AnimatePresence>
          {audioPlaying && prediction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-slate-900/90 dark:bg-slate-100/90 backdrop-blur-md rounded-full px-6 py-3 shadow-2xl border border-white/10 dark:border-black/10 flex items-center space-x-4">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-4 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
                  <div className="w-1.5 h-6 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
                  <div className="w-1.5 h-3 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
                </div>
                <span className="text-sm font-bold text-white dark:text-slate-900 tracking-wide">Playing Output Audio...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} preload="auto" />
    </div>
  );
}
