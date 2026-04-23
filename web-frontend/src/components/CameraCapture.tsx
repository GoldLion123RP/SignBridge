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
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastFrameTime = useRef<number>(0);

  // Initialize capture canvas once
  useEffect(() => {
    if (!captureCanvasRef.current) {
      captureCanvasRef.current = document.createElement('canvas');
    }
  }, []);

  // 1. Optimized Camera Setup
  useEffect(() => {
    if (enabled) {
      navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, frameRate: { ideal: 20 } }, 
        audio: false 
      }).then(s => {
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      }).catch(e => console.error('[Camera] Error:', e));
    }
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [enabled]);

  // 2. Throttled Frame Processing (15 FPS target)
  useEffect(() => {
    let frameId: number;
    const process = (time: number) => {
      const v = videoRef.current;
      const c = captureCanvasRef.current;
      
      // Only process if enough time has passed (~66ms = 15fps)
      if (v && c && v.readyState === 4 && (time - lastFrameTime.current > 66)) {
        lastFrameTime.current = time;
        
        if (c.width !== v.videoWidth || c.height !== v.videoHeight) {
          c.width = v.videoWidth;
          c.height = v.videoHeight;
        }

        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(v, 0, 0);
          onFrame(ctx.getImageData(0, 0, c.width, c.height));
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

  useEffect(() => {
    const v = videoRef.current;
    const o = overlayRef.current;
    if (!v || !o) return;
    
    o.width = v.clientWidth;
    o.height = v.clientHeight;
    const ctx = o.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, o.width, o.height);

    if (!landmarks) return;

    // --- DRAW POSE (Blue) ---
    if (landmarks.pose) {
      const pts = landmarks.pose.map((p: any) => ({ x: p.x * o.width, y: p.y * o.height }));
      ctx.strokeStyle = '#1A73E8'; // Blue
      ctx.lineWidth = 3;
      const poseLinks = [
        [11,12,24,23,11], [11,13,15], [12,14,16], // Upper body
        [23,25,27], [24,26,28] // Legs
      ];
      poseLinks.forEach(path => {
        ctx.beginPath();
        if (pts[path[0]]) {
          ctx.moveTo(pts[path[0]].x, pts[path[0]].y);
          path.slice(1).forEach(i => pts[i] && ctx.lineTo(pts[i].x, pts[i].y));
          ctx.stroke();
        }
      });
    }

    // --- DRAW FACE (Yellow) ---
    if (landmarks.face) {
      ctx.fillStyle = '#FFEA00'; // Yellow
      landmarks.face.forEach((p: any) => {
        ctx.beginPath();
        ctx.arc(p.x * o.width, p.y * o.height, 1.5, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // --- DRAW HANDS (Red/Green) ---
    if (landmarks.hands) {
      landmarks.hands.forEach((hand: any) => {
        const isLeft = hand.hand_label === 'Left';
        const pts = hand.landmarks.map((p: any) => ({ x: p.x * o.width, y: p.y * o.height }));
        
        ctx.strokeStyle = isLeft ? '#FF3D00' : '#00E676'; // Red for Left, Green for Right
        ctx.lineWidth = 4;
        const links = [[0,1,2,3,4], [0,5,6,7,8], [0,17,18,19,20], [5,9,13,17], [9,10,11,12], [13,14,15,16]];
        links.forEach(path => {
          ctx.beginPath();
          ctx.moveTo(pts[path[0]].x, pts[path[0]].y);
          path.slice(1).forEach(i => ctx.lineTo(pts[i].x, pts[i].y));
          ctx.stroke();
        });

        // Joints
        ctx.fillStyle = '#FFFFFF';
        pts.forEach((p: any) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
          ctx.fill();
        });
      });
    }
  }, [landmarks]);

  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden rounded-2xl shadow-2xl border-4 border-gray-800">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain mirror" />
      <canvas ref={overlayRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
      
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
