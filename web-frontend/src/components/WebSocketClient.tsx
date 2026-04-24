import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket(url: string, onMessage: (data: any) => void) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!url || typeof window === 'undefined') return;

    let cleanup = false;
    const connect = () => {
      if (cleanup) return;
      
      // Cleanup existing
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Force 127.0.0.1 for local development to avoid DNS issues with 'localhost'
      const targetUrl = url.includes('localhost') ? url.replace('localhost', '127.0.0.1') : url;
      console.log(`[WebSocket] 🛰️ Neural Link: Initiating connection to ${targetUrl}...`);
      
      try {
        const ws = new WebSocket(targetUrl);
        wsRef.current = ws;

        const connectionTimeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            console.warn('[WebSocket] ⏳ Connection timeout. Retrying...');
            ws.close();
          }
        }, 5000);

        ws.onopen = () => {
          clearTimeout(connectionTimeout);
          if (cleanup) { ws.close(); return; }
          setConnected(true);
          setError(null);
          console.log('[WebSocket] ✅ Neural Link: Connection active.');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            onMessageRef.current(data);
          } catch (e) {
            console.error('[WebSocket] ❌ Neural Link: Payload parse error.', e);
          }
        };

        ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          setConnected(false);
          console.log(`[WebSocket] 🔌 Neural Link: Disconnected (Code: ${event.code})`);
          
          if (!cleanup) {
            const delay = 3000;
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = setTimeout(connect, delay);
          }
        };

        ws.onerror = (err) => {
          clearTimeout(connectionTimeout);
          // err is an Event, not an Error object, so it won't show useful info in console.error directly
          setError(`Link failure. Ensure SignBridge Engine is running at ${targetUrl}`);
          console.error('[WebSocket] ⚠️ Neural Link: Interface error detected.');
        };
      } catch (e) {
        console.error('[WebSocket] 💥 Neural Link: Critical failure.', e);
        if (!cleanup) setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      cleanup = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
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
