import React, { useState, useEffect, useRef } from 'react';

interface Props {
  onFrame: (frame: ImageData) => void;
  landmarks: any;
  prediction: any;
  enabled: boolean;
}

const CameraCapture: React.FC<Props> = ({ onFrame, landmarks, prediction, enabled }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastFrameTime = useRef<number>(0);

  // 1. Optimized Camera Setup
  useEffect(() => {
    let active = true;
    const startCamera = async () => {
      // Release any existing stream first
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
              aspectRatio: 1.777777778,
              frameRate: { ideal: 60, min: 20 } 
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
          console.error('[Camera] Error:', e.name, e.message);
          if (e.name === 'NotReadableError') {
            alert("Camera is locked by another app or tab. Please close other apps using the camera and refresh.");
          }
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
  // 2. High-Speed Frame Processing (60 FPS target)
  useEffect(() => {
    let frameId: number;
    const process = (time: number) => {
      const v = videoRef.current;
      
      if (!captureCanvasRef.current && typeof document !== 'undefined') {
        captureCanvasRef.current = document.createElement('canvas');
      }
      const c = captureCanvasRef.current;
      
      // Process as fast as possible for 60 FPS target
      if (v && c && v.readyState === 4) {
        lastFrameTime.current = time;
        
        const targetWidth = 640;
        const targetHeight = 360; // 16:9
        
        if (c.width !== targetWidth || c.height !== targetHeight) {
          c.width = targetWidth;
          c.height = targetHeight;
        }

        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(v, 0, 0, targetWidth, targetHeight);
          onFrame(ctx.getImageData(0, 0, targetWidth, targetHeight));
        }
      }
      frameId = requestAnimationFrame(process);
    };
    frameId = requestAnimationFrame(process);
    return () => cancelAnimationFrame(frameId);
  }, [onFrame]);

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
        x: 40 + Math.random() * 20, // Randomish center
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
    updateSize(); // Initial call
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

    // --- DRAW POSE (Blue) ---
    if (landmarks.pose) {
      const pts = landmarks.pose.map((p: any) => ({ x: p.x * o.width, y: p.y * o.height }));
      ctx.strokeStyle = '#1A73E8'; // Blue
      ctx.lineWidth = 3;
      ctx.beginPath();
      const poseLinks = [
        [11,12,24,23,11], [11,13,15], [12,14,16], // Upper body
        [23,25,27], [24,26,28] // Legs
      ];
      poseLinks.forEach(path => {
        if (pts[path[0]]) {
          ctx.moveTo(pts[path[0]].x, pts[path[0]].y);
          path.slice(1).forEach(i => pts[i] && ctx.lineTo(pts[i].x, pts[i].y));
        }
      });
      ctx.stroke();
    }

    // --- DRAW FACE (Yellow) ---
    if (landmarks.face) {
      ctx.fillStyle = '#FFEA00'; // Yellow
      ctx.beginPath();
      landmarks.face.forEach((p: any) => {
        ctx.moveTo(p.x * o.width, p.y * o.height);
        ctx.arc(p.x * o.width, p.y * o.height, 1, 0, 2 * Math.PI);
      });
      ctx.fill();
    }

    // --- DRAW HANDS (Red/Green) ---
    if (landmarks.hands) {
      landmarks.hands.forEach((hand: any) => {
        const isLeft = hand.hand_label === 'Left';
        const pts = hand.landmarks.map((p: any) => ({ x: p.x * o.width, y: p.y * o.height }));
        
        ctx.strokeStyle = isLeft ? '#FF3D00' : '#00E676'; // Red for Left, Green for Right
        ctx.lineWidth = 4;
        ctx.beginPath();
        const links = [[0,1,2,3,4], [0,5,6,7,8], [0,17,18,19,20], [5,9,13,17], [9,10,11,12], [13,14,15,16]];
        links.forEach(path => {
          ctx.moveTo(pts[path[0]].x, pts[path[0]].y);
          path.slice(1).forEach(i => ctx.lineTo(pts[i].x, pts[i].y));
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
