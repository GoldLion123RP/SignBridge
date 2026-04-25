import asyncio
import websockets
import json

async def test_ws():
    uri = "ws://127.0.0.1:8000/ws/video"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WS")
            await websocket.send(json.dumps({"frame": "", "timestamp": 0}))
            response = await websocket.recv()
            print(f"Received: {response[:100]}...")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())
