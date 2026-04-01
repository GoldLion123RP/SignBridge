import React, { useState, useEffect, useRef } from 'react';

interface CameraCaptureProps {
  width?: number;
  height?: number;
  onFrame?: (frame: ImageData) => void;
  facingMode?: 'user' | 'environment';
  enabled?: boolean;
  landmarks?: any;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  width = 640,
  height = 480,
  onFrame,
  facingMode = 'user',
  enabled = true,
  landmarks
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [enabled, facingMode]);

  useEffect(() => {
    if (!videoRef.current || !stream) return;

    const video = videoRef.current;
    
    // Attach stream to video element so it actually displays
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    let animationFrameId: number;

    const processFrame = () => {
      if (!isActive || !onFrame || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
        // Ensure canvas dimensions match video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        onFrame(imageData);
      }

      animationFrameId = requestAnimationFrame(processFrame);
    };

    video.onloadedmetadata = () => {
      // Start processing when video is ready
      setIsActive(true);
      processFrame();
    };

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [stream, isActive, onFrame]);

  useEffect(() => {
    if (!landmarkCanvasRef.current || !videoRef.current) return;
    const canvas = landmarkCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!landmarks) return;
    
    if (landmarks.hands) {
      ctx.fillStyle = '#22c55e';
      for (const hand of landmarks.hands) {
        if (hand.fingertips) {
          for (const tip of hand.fingertips) {
            const x = tip.x * canvas.width;
            const y = tip.y * canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      }
    }
    
    if (landmarks.face) {
      ctx.fillStyle = '#3b82f6';
      for (const point of landmarks.face) {
        const x = point.x * canvas.width;
        const y = point.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    
    if (landmarks.pose && landmarks.pose.length > 0) {
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      
      const posePoints = landmarks.pose.map((p: any) => ({
        x: p.x * canvas.width,
        y: p.y * canvas.height
      }));
      
      for (const point of posePoints) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      const connections = [[0,2], [2,4], [1,3], [3,5], [0,1]];
      for (const [a, b] of connections) {
        if (posePoints[a] && posePoints[b]) {
          ctx.beginPath();
          ctx.moveTo(posePoints[a].x, posePoints[a].y);
          ctx.lineTo(posePoints[b].x, posePoints[b].y);
          ctx.stroke();
        }
      }
    }
  }, [landmarks]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width,
          height,
          facingMode
        },
        audio: false
      });

      setStream(mediaStream);
      setError(null);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Failed to access camera: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsActive(false);
    }
  };

  const takeSnapshot = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm bg-black border border-white/10 dark:border-white/5 w-full h-[480px]">
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-red-900/90 backdrop-blur-sm text-white p-4">
          <p className="text-center font-medium">{error}</p>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain"
      />

      <canvas
        ref={canvasRef}
        className="hidden"
      />

      <canvas
        ref={landmarkCanvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />

      {!stream && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-md text-white">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <p className="font-medium tracking-wide">Initializing camera...</p>
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 z-20">
        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider flex items-center space-x-2 shadow-lg backdrop-blur-md ${isActive ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></div>
          <span>{isActive ? 'RECORDING' : 'OFF'}</span>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
export { CameraCapture };
