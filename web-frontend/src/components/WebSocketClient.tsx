import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket(url: string, onMessage: (data: any) => void) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!url || typeof window === 'undefined') return;

    let cleanup = false;
    const connect = () => {
      if (cleanup) return;
      
      // Force 127.0.0.1 for local development to avoid DNS issues with 'localhost'
      const targetUrl = url.includes('localhost') ? url.replace('localhost', '127.0.0.1') : url;
      console.log(`[WebSocket] 🛰️ Connecting to ${targetUrl}...`);
      
      const ws = new WebSocket(targetUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cleanup) { ws.close(); return; }
        setConnected(true);
        setError(null);
        console.log('[WebSocket] ✅ Connection established!');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current(data);
        } catch (e) {
          console.error('[WebSocket] ❌ Parse error:', e);
        }
      };

      ws.onclose = (event) => {
        setConnected(false);
        console.log(`[WebSocket] 🔌 Closed (Code: ${event.code}, Clean: ${event.wasClean})`);
        if (!cleanup) {
          const delay = 3000;
          console.log(`[WebSocket] 🔄 Reconnecting in ${delay/1000}s...`);
          setTimeout(connect, delay);
        }
      };

      ws.onerror = (err) => {
        setError(`Connection failed to ${targetUrl}. Ensure backend is running.`);
        console.error('[WebSocket] ⚠️ Error Event:', err);
        ws.close();
      };
    };

    connect();

    return () => {
      cleanup = true;
      if (wsRef.current) {
        console.log('[WebSocket] 🧹 Cleaning up connection...');
        wsRef.current.close();
      }
    };
  }, [url]);

  const sendMessage = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  return { connected, sendMessage, error };
}
