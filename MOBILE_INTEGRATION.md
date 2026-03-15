# Mobile Integration Guide (Flutter)

This guide walks through connecting a Flutter mobile app to the SignBridge AI backend.

## Architecture Overview

```
┌─────────────┐     HTTP/WebSocket    ┌─────────────┐
│   Flutter   │ ◄───────────────────► │  FastAPI    │
│    App      │   REST + WS JSON      │  Backend    │
│             │                       │             │
│ Camera  ──►│   Base64 frames      ├─────────────┤
│  (camera)  │                       │  Services   │
│             │                       │  (Python)   │
│  Audio ◄───│   Base64 MP3         │             │
└─────────────┘                       └─────────────┘
```

## Prerequisites

- Flutter SDK 3.19+
- Android/iOS development environment set up
- Backend server running (see main README.md)
- Gemini API key configured in backend

## Dependencies

Add to `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  web_socket_channel: ^2.4.0
  http: ^1.2.0
  camera: ^0.10.6+1
  permission_handler: ^11.2.0
  webview_flutter: ^4.6.0  # Optional: for debug web dashboard
  flutter_dotenv: ^5.1.0   # For environment variables
```

Run:
```bash
flutter pub get
```

## Configuration

Create `.env` file in Flutter project root:

```env
BACKEND_URL=http://192.168.1.100:8000
# Use your machine's local IP address, not localhost
```

## WebSocket API Usage

### 1. Connect to WebSocket

```dart
import 'package:web_socket_channel/web_socket_channel.dart';

class SignBridgeClient {
  final String backendUrl;
  WebSocketChannel? _channel;

  SignBridgeClient({required this.backendUrl});

  Future<void> connect() async {
    final wsUrl = Uri.parse('$backendUrl/ws/video');
    _channel = WebSocketChannel.connect(wsUrl);

    _channel!.stream.listen(
      (data) => _handleMessage(jsonDecode(data)),
      onError: (error) => print('WS Error: $error'),
      onDone: () => print('WS closed'),
    );
  }

  void sendFrame(String base64Image) {
    _channel?.sink.add(jsonEncode({
      'frame': base64Image,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    }));
  }

  void disconnect() {
    _channel?.sink.close();
  }

  void _handleMessage(Map<String, dynamic> data) {
    final gesture = data['gesture'];
    final sentence = data['sentence'];
    final audio = data['audio']; // base64 MP3

    if (audio != null) {
      _playAudio(base64Decode(audio));
    }
  }
}
```

### 2. Camera Integration

```dart
import 'package:camera/camera.dart';

class CameraService {
  CameraController? _controller;
  List<CameraDescription>? _cameras;

  Future<void> initialize() async {
    // Request camera permission
    final status = await Permission.camera.request();
    if (!status.isGranted) throw Exception('Camera permission denied');

    _cameras = await availableCameras();
    final frontCamera = _cameras!.firstWhere(
      (cam) => cam.lensDirection == CameraLensDirection.front
    );

    _controller = CameraController(
      frontCamera,
      ResolutionPreset.medium, // Lower for performance
      enableAudio: false,
    );

    await _controller!.initialize();
  }

  Future<String> captureFrame() async {
    if (_controller == null || !_controller!.value.isInitialized) {
      throw Exception('Camera not initialized');
    }

    final image = await _controller!.takePicture();
    final bytes = await File(image.path).readAsBytes();
    return base64Encode(bytes);
  }

  void dispose() {
    _controller?.dispose();
  }
}
```

### 3. Integration Loop

```dart
class SignBridgeScreen extends StatefulWidget {
  @override
  State<SignBridgeScreen> createState() => _SignBridgeScreenState();
}

class _SignBridgeScreenState extends State<SignBridgeScreen> {
  final SignBridgeClient _client = SignBridgeClient(
    backendUrl: const String.fromEnvironment('BACKEND_URL', defaultValue: 'http://10.0.2.2:8000')
  );
  final CameraService _camera = CameraService();

  bool _connected = false;
  bool _processing = false;
  String _currentSentence = '';

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    await _camera.initialize();
    await _client.connect();
    setState(() => _connected = true);

    _startFrameStream();
  }

  void _startFrameStream() async {
    while (_connected) {
      try {
        final frame = await _camera.captureFrame();
        _client.sendFrame(frame);
        await Future.delayed(Duration(milliseconds: 33)); // ~30fps
      } catch (e) {
        print('Frame stream error: $e');
        break;
      }
    }
  }

  void _handleResult(Map<String, dynamic> result) {
    setState(() {
      _currentSentence = result['sentence'] ?? '';
    });

    // Play audio if available
    if (result['audio'] != null) {
      _playAudio(base64Decode(result['audio']));
    }
  }

  @override
  void dispose() {
    _client.disconnect();
    _camera.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          CameraPreview(_camera._controller!),
          if (_currentSentence.isNotEmpty)
            Positioned(
              bottom: 100,
              left: 20,
              right: 20,
              child: Container(
                padding: EdgeInsets.all(16),
                color: Colors.black54,
                child: Text(
                  _currentSentence,
                  style: TextStyle(fontSize: 24, color: Colors.white),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
```

## Android Specific Setup

### `android/app/src/main/AndroidManifest.xml`

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="true" />
<uses-feature android:name="android.hardware.camera.autofocus" />
```

### Network Security Config

For localhost access during development, use `10.0.2.2` for Android emulator or your machine's IP for physical device.

## iOS Specific Setup

### `ios/Runner/Info.plist`

```xml
<key>NSCameraUsageDescription</key>
<string>SignBridge needs camera access to detect sign language</string>
<key>NSMicrophoneUsageDescription</key>
<string>SignBridge needs microphone access (optional)</string>
```

### App Transport Security

If using HTTP (dev only), add to `Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>
```

## Performance Optimization for Mobile

1. **Reduce camera resolution** - Use `ResolutionPreset.low` on low-end devices
2. **Lower frame rate** - Send frames every 2-3rd frame instead of every frame
3. **Compress frames** - JPEG quality 70% before base64 encoding
4. **Background isolate** - Run WebSocket on separate isolate
5. **Battery** - Add "Stop translation" button to completely disconnect

## Testing Without Sign Language

Test the connection with mock data:

```dart
void _testConnection() async {
  final testFrame = await _camera.captureFrame();
  _client.sendFrame(testFrame);

  // Expect response in _handleResult
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Connection refused" | Check backend IP, firewall, port 8000 |
| Camera black screen | Check permissions, ensure not used by another app |
| High battery drain | Lower camera resolution, reduce frame rate |
| Laggy detection | Use Wi-Fi (not mobile data), lower quality |
| WebSocket disconnect | Implement reconnection with exponential backoff |

## Production Considerations

- **Backend URL**: Switch to HTTPS with proper SSL in production
- **API Key**: Never hardcode GEMINI_API_KEY in Flutter app
- **Authentication**: Add JWT token authentication for production
- **Offline Mode**: Cache translations locally (hive/sqflite)
- **Analytics**: Track usage with Firebase Analytics

## Support

For issues:
1. Check backend logs: `python backend/main.py`
2. Test WebSocket manually: `wscat -c ws://<ip>:8000/ws/video`
3. Verify camera works: Use Flutter's CameraExample app
