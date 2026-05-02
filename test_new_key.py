import os
from dotenv import load_dotenv
from google import genai

load_dotenv(".env.local")
api_key = os.getenv("GEMINI_API_KEY")

def test_gemini():
    if not api_key:
        print("API Key missing in .env.local")
        return
    
    print(f"Testing with key starting with: {api_key[:5]}...")
    try:
        client = genai.Client(api_key=api_key)
        # Using model='gemini-1.5-flash' explicitly
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents="Say 'Hello SignBridge! The new key works.'"
        )
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_gemini()
