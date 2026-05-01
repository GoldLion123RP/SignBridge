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

      // Use current window host if url is relative or if we want to match the page origin's interface
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
      
      console.log(`[WebSocket] 🛰️ Neural Link: Initiating connection to ${targetUrl}...`);
      
      try {
        const ws = new WebSocket(targetUrl);
        wsRef.current = ws;
        let heartbeatInterval: NodeJS.Timeout | null = null;

        const connectionTimeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            console.warn('[WebSocket] ⏳ Connection timeout. Re-evaluating link...');
            ws.close();
          }
        }, 15000); // 15s for heavy model load cold starts

        ws.onopen = () => {
          clearTimeout(connectionTimeout);
          if (cleanup) { ws.close(); return; }
          setConnected(true);
          setError(null);
          console.log('[WebSocket] ✅ Neural Link: Connection active.');
          
          // Start heartbeat
          heartbeatInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 10000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'pong') return; // Heartbeat response
            onMessageRef.current(data);
          } catch (e) {
            console.error('[WebSocket] ❌ Neural Link: Payload parse error.', e);
          }
        };

        ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          setConnected(false);
          const reason = event.wasClean ? 'Normal' : 'Abnormal';
          console.log(`[WebSocket] 🔌 Neural Link: Disconnected (${reason}, Code: ${event.code})`);
          
          if (!cleanup) {
            const delay = 3000;
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = setTimeout(connect, delay);
          }
        };

        ws.onerror = (err) => {
          clearTimeout(connectionTimeout);
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          // Detailed logging for connection failure
          console.error('[WebSocket] ⚠️ Neural Link: Interface error detected.', {
            url: targetUrl,
            readyState: ws.readyState,
            protocol: ws.protocol,
            timestamp: new Date().toISOString()
          });
          setError(`Link failure. Ensure SignBridge Engine is reachable at ${targetUrl}`);
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
