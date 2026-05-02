import os
import cv2
import numpy as np
import yt_dlp
import sys
import time
import shutil
from typing import List, Dict, Optional

# Add backend to path for services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.holistic_tracker import HolisticTracker
from config import config

class YouTubeDataMiner:
    def __init__(self, output_dir: str = "backend/data"):
        self.output_dir = output_dir
        self.tracker = HolisticTracker()
        self.temp_video_path = "temp_video.mp4"
        
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)

    def download_video(self, url: str) -> bool:
        """Download a YouTube video at low resolution."""
        print(f"[Miner] Downloading {url}...")
        ydl_opts = {
            'format': 'best[height<=360]', # Low res for faster processing
            'outtmpl': self.temp_video_path,
            'quiet': True,
            'no_warnings': True
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            return True
        except Exception as e:
            print(f"[Miner Error] Download failed: {e}")
            return False

    def process_video(self, label: str, sequence_length: int = 30) -> int:
        """Extract landmark sequences from the downloaded video."""
        if not os.path.exists(self.temp_video_path):
            return 0

        cap = cv2.VideoCapture(self.temp_video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        print(f"[Miner] Processing video ({int(fps)} FPS)...")

        label_dir = os.path.join(self.output_dir, label)
        if not os.path.exists(label_dir):
            os.makedirs(label_dir)

        sequences = []
        current_sequence = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Resize to internal pipeline dimensions
            frame = cv2.resize(frame, (320, 240))
            
            # Extract landmarks
            res = self.tracker.process_frame(frame)
            if res and res.get("hands_detected", 0) > 0:
                features = self.tracker.extract_features(res)
                current_sequence.append(features)
                
                # If we have a full sequence, save it
                if len(current_sequence) == sequence_length:
                    sequences.append(np.array(current_sequence))
                    # Sliding window or reset? For mining, reset with slight overlap is usually better
                    current_sequence = current_sequence[15:] # 50% overlap
            else:
                # If hands disappear, reset current sequence
                current_sequence = []

        cap.release()
        
        # Save sequences
        count = 0
        existing_files = len(os.listdir(label_dir))
        for i, seq in enumerate(sequences):
            filename = f"{label}_{existing_files + i}.npy"
            np.save(os.path.join(label_dir, filename), seq)
            count += 1

        print(f"[Miner] Extracted {count} sequences for label '{label}'")
        return count

    def cleanup(self):
        """Delete temporary files."""
        if os.path.exists(self.temp_video_path):
            os.remove(self.temp_video_path)

    def mine_sign(self, label: str, urls: List[str]):
        """Complete workflow for a single sign."""
        total_extracted = 0
        for url in urls:
            if self.download_video(url):
                total_extracted += self.process_video(label)
                self.cleanup()
        return total_extracted

def main():
    # Example usage for verification
    miner = YouTubeDataMiner()
    
    # Target vocabulary from ISL_RULES.md
    # In a real run, we would iterate through all 80+ signs.
    # For now, let's target HELLO as a proof of concept.
    target_signs = {
        "HELLO": ["https://www.youtube.com/watch?v=kYI9C-1Wc_4"], # Example ISL Hello video
        "WATER": ["https://www.youtube.com/watch?v=J_6l609p2_Y"]
    }
    
    print("="*40)
    print(" SIGNBRIDGE DATA MINER - STARTING ")
    print("="*40)

    for sign, urls in target_signs.items():
        count = miner.mine_sign(sign, urls)
        print(f"[*] Completed '{sign}': {count} sequences saved.")

    print("\n[✔] Data mining complete.")

if __name__ == "__main__":
    main()
