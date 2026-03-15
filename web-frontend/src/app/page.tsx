'use client';

import React, { useState, useEffect, useRef } from 'react';
import WebSocketClient from '@/components/WebSocketClient';
import CameraCapture from '@/components/CameraCapture';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface Prediction {
  gesture: string;
  confidence: number;
  sentence: string;
  audio: string;
}

const Page: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [history, setHistory] = useState<Prediction[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const wsClient = useRef<ReturnType<typeof WebSocketClient>>(null);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    try {
      const data = message.data;

      if (data.status === 'received') {
        const gesture = data.gesture || 'unknown';
        const confidence = data.confidence || 0;
        const sentence = data.sentence || '';
        const audio = data.audio || '';

        const prediction: Prediction = {
          gesture,
          confidence,
          sentence,
          audio
        };

        setPrediction(prediction);
        setHistory(prev => [prediction, ...prev.slice(0, 9)]);

        // Play audio if available
        if (audio && !audioPlaying) {
          playAudio(audio);
        }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  };

  const playAudio = (base64Audio: string) => {
    if (audioRef.current) {
      setAudioPlaying(true);

      const audioBlob = base64ToBlob(base64Audio, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);

      audioRef.current.src = audioUrl;
      audioRef.current.play().then(() => {
        audioRef.current.onended = () => {
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

  const sendMessage = (data: any) => {
    wsClient.current?.sendMessage(data);
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

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-600';
      case 'disconnected':
        return 'bg-red-600';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SignBridge AI</h1>
              <p className="text-gray-600 mt-1">Real-time sign language translation</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full animate-pulse {getStatusClass(connected ? 'connected' : 'disconnected')}"></div>
                <span className="text-sm font-medium text-gray-700">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {error && (
                <div className="flex items-center space-x-1">
                  <span className="text-red-600 text-sm">!</span>
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Camera Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Camera Feed</h2>

                <div className="relative mb-4">
                  <CameraCapture
                    width={640}
                    height={480}
                    onFrame={sendFrame}
                    enabled={connected && !processing}
                  />

                  {processing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="bg-white p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                          <span className="text-white">Processing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => sendMessage({ reset: true })}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    disabled={!connected}
                  >
                    Reset
                  </button>

                  <button
                    onClick={clearHistory}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Clear History
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Translation Panel */}
          <div>
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Translation</h2>

                {/* Current Prediction */}
                {prediction && (
                  <div className="mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-blue-800 font-semibold">Translation</h3>
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-blue-600">Confidence: {Math.round(prediction.confidence * 100)}%</span>
                        </div>
                      </div>
                      <p className="text-lg text-blue-700 font-medium">
                        {prediction.sentence || 'Processing...'}
                      </p>
                    </div>

                    {prediction.audio && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Audio available</span>
                          <button
                            onClick={() => playAudio(prediction.audio)}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Play Audio
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* History */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Translation History</h3>

                  {history.length === 0 ? (
                    <div className="bg-gray-100 rounded-lg p-4 text-gray-500 text-sm">
                      No translations yet. Start signing to see results.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {history.map((item, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{item.sentence}</span>
                            <span className="text-xs text-gray-500">{Math.round(item.confidence * 100)}%</span>
                          </div>
                          <p className="text-xs text-gray-600">{item.gesture}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Indicators */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">WebSocket</span>
                      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-600' : 'bg-red-600'}`}></div>
                    </div>
                    <span className="text-xs text-gray-500">{connected ? 'Connected' : 'Disconnected'}</span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Processing</span>
                      <div className={`w-2 h-2 rounded-full ${processing ? 'bg-yellow-600' : 'bg-gray-600'}`}></div>
                    </div>
                    <span className="text-xs text-gray-500">{processing ? 'Active' : 'Idle'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Player */}
        {audioPlaying && prediction && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-full p-4 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="animate-pulse rounded-full h-3 w-3 bg-blue-600"></div>
                  <span className="text-sm text-gray-700">Playing audio...</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      {/* Audio Element */}
      <audio ref={audioRef} preload="auto" />

      {/* WebSocket Client */}
      <WebSocketClient
        url="ws://localhost:8000/ws/video"
        onMessage={handleWebSocketMessage}
        onOpen={handleWebSocketOpen}
        onClose={handleWebSocketClose}
        onError={handleWebSocketError}
        ref={wsClient as any}
      />
    </div>
  );
};

export default Page;
