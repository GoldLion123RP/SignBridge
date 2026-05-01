import React, { useState, useEffect, useRef, memo } from 'react';

interface Props {
  onFrame: (frame: string) => void;
  landmarks: any;
  prediction: any;
  enabled: boolean;
  connected: boolean;
}

const CameraCapture: React.FC<Props> = memo(({ onFrame, landmarks, prediction, enabled, connected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processingRef = useRef<boolean>(false);
  const lastCaptureTime = useRef<number>(0);

  // 1. Optimized Camera Setup (720p source for quality overlay, but processed at low res)
  useEffect(() => {
    let active = true;
    const startCamera = async () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      if (enabled) {
        try {
          const constraints = {
            video: { 
              width: { ideal: 1280 }, 
              height: { ideal: 720 }, 
              frameRate: { ideal: 30 } 
            }, 
            audio: false 
          };

          const s = await navigator.mediaDevices.getUserMedia(constraints);
          if (!active) {
            s.getTracks().forEach(t => t.stop());
            return;
          }

          streamRef.current = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        } catch (e: any) {
          console.error('[Camera] Error:', e);
        }
      }
    };

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [enabled]);

  // 2. High-Speed Frame Processing with Throttling (20 FPS target)
  useEffect(() => {
    let frameId: number;
    const process = (time: number) => {
      const v = videoRef.current;
      
      if (!captureCanvasRef.current && typeof document !== 'undefined') {
        captureCanvasRef.current = document.createElement('canvas');
      }
      const c = captureCanvasRef.current;
      
      // Throttle to 20 FPS (50ms)
      if (v && c && v.readyState === 4 && time - lastCaptureTime.current > 50) {
        // IMPORTANT: Only send if not currently processing to avoid queue buildup
        if (connected && !processingRef.current) {
          processingRef.current = true; // Lock processing
          lastCaptureTime.current = time;
          
          // Target resolution 320x180 (Optimized for i5-4440)
          const targetWidth = 320;
          const targetHeight = 180;
          
          if (c.width !== targetWidth || c.height !== targetHeight) {
            c.width = targetWidth;
            c.height = targetHeight;
          }

          const ctx = c.getContext('2d', { alpha: false });
          if (ctx) {
            ctx.drawImage(v, 0, 0, targetWidth, targetHeight);
            const b64 = c.toDataURL('image/jpeg', 0.6).split(',')[1];
            onFrame(b64);
          }
        }
      }
      frameId = requestAnimationFrame(process);
    };
    frameId = requestAnimationFrame(process);
    return () => cancelAnimationFrame(frameId);
  }, [onFrame, connected]);

  // Reset processing lock when prediction updates (meaning backend responded)
  useEffect(() => {
    processingRef.current = false;
  }, [prediction, landmarks]);

  // 3. Landmark Drawing & Floating Words
  const [floatingWords, setFloatingWords] = useState<{id: number, text: string, x: number, y: number}[]>([]);
  const lastGestureRef = useRef<string | null>(null);

  useEffect(() => {
    if (prediction?.gesture && prediction.gesture !== lastGestureRef.current) {
      lastGestureRef.current = prediction.gesture;
      const id = Date.now();
      setFloatingWords(prev => [...prev, { 
        id, 
        text: prediction.gesture, 
        x: 40 + Math.random() * 20, 
        y: 60 
      }]);
      setTimeout(() => {
        setFloatingWords(prev => prev.filter(w => w.id !== id));
      }, 2000);
    }
  }, [prediction?.gesture]);

  // Handle Resize for Overlay
  useEffect(() => {
    const updateSize = () => {
      const v = videoRef.current;
      const o = overlayRef.current;
      if (v && o) {
        o.width = v.clientWidth;
        o.height = v.clientHeight;
      }
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    const o = overlayRef.current;
    if (!v || !o) return;
    
    const ctx = o.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, o.width, o.height);

    if (!landmarks) return;

    // Calculate actual video render dimensions inside the object-contain container
    const videoRatio = v.videoWidth / v.videoHeight;
    const containerRatio = o.width / o.height;
    let drawWidth = o.width;
    let drawHeight = o.height;
    let offsetX = 0;
    let offsetY = 0;
    
    if (v.videoWidth === 0 || v.videoHeight === 0) return;

    if (videoRatio > containerRatio) {
      drawHeight = o.width / videoRatio;
      offsetY = (o.height - drawHeight) / 2;
    } else {
      drawWidth = o.height * videoRatio;
      offsetX = (o.width - drawWidth) / 2;
    }

    // --- DRAW HANDS (Red/Green) ---
    if (landmarks.hands) {
      landmarks.hands.forEach((hand: any) => {
        const isLeft = hand.hand_label === 'Left';
        // Landmark points are normalized 0.0 - 1.0
        const pts = hand.landmarks.map((p: any) => ({ 
          x: (p.x * drawWidth) + offsetX, 
          y: (p.y * drawHeight) + offsetY 
        }));
        
        ctx.strokeStyle = isLeft ? '#FF3D00' : '#00E676';
        ctx.lineWidth = 4;
        ctx.beginPath();
        const links = [[0,1,2,3,4], [0,5,6,7,8], [0,17,18,19,20], [5,9,13,17], [9,10,11,12], [13,14,15,16]];
        links.forEach(path => {
          if (pts[path[0]]) {
            ctx.moveTo(pts[path[0]].x, pts[path[0]].y);
            path.slice(1).forEach(i => pts[i] && ctx.lineTo(pts[i].x, pts[i].y));
          }
        });
        ctx.stroke();

        // Joints
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        pts.forEach((p: any) => {
          ctx.moveTo(p.x, p.y);
          ctx.arc(p.x, p.y, 2.5, 0, 2 * Math.PI);
        });
        ctx.fill();
      });
    }
  }, [landmarks]);

  return (
    <div className="relative w-full h-full bg-[#050505] overflow-hidden rounded-[32px] border border-white/5 flex items-center justify-center">
      <video ref={videoRef} autoPlay playsInline muted className="max-w-full max-h-full object-contain mirror" />
      <canvas ref={overlayRef} className="absolute top-0 left-0 w-full h-full pointer-events-none mirror" />
      
      {/* Safe Zone Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
        <div className="w-[85%] h-[85%] border-2 border-[#00FF66]/10 rounded-[40px] flex items-center justify-center relative animate-pulse-safe-zone">
          {/* Corner Brackets */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#00FF66] rounded-tl-2xl shadow-[0_0_15px_rgba(0,255,102,0.4)]" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#00FF66] rounded-tr-2xl shadow-[0_0_15px_rgba(0,255,102,0.4)]" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#00FF66] rounded-bl-2xl shadow-[0_0_15px_rgba(0,255,102,0.4)]" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#00FF66] rounded-br-2xl shadow-[0_0_15px_rgba(0,255,102,0.4)]" />
          
          {/* Center Guide Label */}
          <div className="absolute top-10 bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
            <span className="text-[#00FF66] text-[10px] font-black uppercase tracking-[0.3em] drop-shadow-[0_0_10px_rgba(0,255,102,0.5)]">
              Optical Safe Zone
            </span>
          </div>
          
          {/* Subtle Scanning Line Effect */}
          <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00FF66]/20 to-transparent top-1/2 -translate-y-1/2 animate-scan" />
        </div>
      </div>

      {/* Floating Words Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingWords.map(word => (
          <div 
            key={word.id}
            className="absolute text-white font-black text-4xl drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] animate-float-up whitespace-nowrap"
            style={{ 
              left: `${word.x}%`, 
              top: `${word.y}%`,
              textShadow: '0 0 20px rgba(26,115,232,0.8)'
            }}
          >
            {word.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CameraCapture;
