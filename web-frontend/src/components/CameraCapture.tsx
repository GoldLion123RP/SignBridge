import React, { useState, useEffect, useRef } from 'react';

interface CameraCaptureProps {
  width?: number;
  height?: number;
  onFrame?: (frame: ImageData) => void;
  facingMode?: 'user' | 'environment';
  enabled?: boolean;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  width = 640,
  height = 480,
  onFrame,
  facingMode = 'user',
  enabled = true
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const processFrame = () => {
      if (!isActive || !onFrame || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        onFrame(imageData);
      }

      requestAnimationFrame(processFrame);
    };

    video.onloadedmetadata = () => {
      setIsActive(true);
      processFrame();
    };
  }, [stream, isActive, onFrame]);

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
    <div className="relative bg-black rounded-lg overflow-hidden">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 text-white p-4">
          <p className="text-center">{error}</p>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ width, height }}
      />

      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {!stream && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
          <p>Loading camera...</p>
        </div>
      )}

      <div className="absolute bottom-2 right-2">
        <div className={`px-2 py-1 rounded text-xs ${isActive ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {isActive ? '● Recording' : '○ Off'}
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
export { CameraCapture };
