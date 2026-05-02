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
    let heartbeatInterval: NodeJS.Timeout | null = null;

    const connect = () => {
      if (cleanup) return;
      
      // Cleanup existing
      if (wsRef.current) {
        wsRef.current.close();
      }

      // ... existing URL logic ...
      let targetUrl = url;
      if (typeof window !== 'undefined') {
        const isLocalhost = window.location.hostname === 'localhost';
        const isIP = window.location.hostname === '127.0.0.1';
        
        if (isLocalhost && url.includes('127.0.0.1')) {
          targetUrl = url.replace('127.0.0.1', 'localhost');
        } else if (isIP && url.includes('localhost')) {
          targetUrl = url.replace('localhost', '127.0.0.1');
        }
      }
      
      try {
        const ws = new WebSocket(targetUrl);
        wsRef.current = ws;

        const connectionTimeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.close();
          }
        }, 10000);

        ws.onopen = () => {
          clearTimeout(connectionTimeout);
          if (cleanup) { ws.close(); return; }
          setConnected(true);
          setError(null);
          
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          heartbeatInterval = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'ping' }));
            }
          }, 15000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'pong') return;
            onMessageRef.current(data);
          } catch (e) {
            console.error('[WebSocket] Parse error', e);
          }
        };

        ws.onclose = () => {
          clearTimeout(connectionTimeout);
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          setConnected(false);
          
          if (!cleanup) {
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          clearTimeout(connectionTimeout);
        };
      } catch (e) {
        if (!cleanup) {
           if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
           reconnectTimeoutRef.current = setTimeout(connect, 5000);
        }
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
