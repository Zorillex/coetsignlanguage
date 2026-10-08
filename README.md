# SignWave - AI Sign Language to Text & Voice Converter

An intelligent, real-time web application that converts **American Sign Language (ASL)** gestures and fingerspelling into written text and spoken voice. Powered entirely in the browser using **MediaPipe Hands** computer vision, client-side geometric kinematics, and the **Web Speech API**.

---

## 🌟 Key Features

1. **Real-Time Webcam Hand Tracking & Skeletal Mesh**:
   - Detects 21 3D hand landmarks in real time with high frame rates (~60 FPS).
   - Real-time bounding box HUD with live detected sign, confidence match percentage, and skeletal overlay.
   - Flip/Mirror video toggle and custom camera device selector.

2. **Accurate ASL Gesture Recognition**:
   - **Full ASL Alphabet (A-Z)** fingerspelling recognition.
   - **Common Phrases & Words**: `"HELLO"`, `"THANK YOU"`, `"I LOVE YOU"`, `"YES"`, `"NO"`, `"GOOD / THUMBS UP"`, `"PEACE"`, `"HELP"`.
   - **Control Gestures**: Automatic or gestural `"SPACE"` and `"BACKSPACE"`.

3. **Intelligent Hold-to-Confirm Typing**:
   - Prevents accidental twitching and rapid false triggers.
   - Circular/bar visual progress meter fills as you hold a sign (configurable from 0.4s to 1.5s).
   - Audio chime feedback on confirmed character commits.

4. **Smart Sentence Builder & Autocomplete**:
   - Built-in English & ASL vocabulary dictionary for real-time next-word prediction chips.
   - Click any suggestion chip to autocomplete words instantly.
   - Edit, copy to clipboard, or export transcripts as text files (`.txt`).

5. **Text-to-Speech (TTS) Voice Engine**:
   - Speaks cumulative converted text aloud with customizable pitch, speed, and browser voice selection.
   - Optional **"Auto-speak completed words"** mode that speaks each word aloud as soon as a space or phrase is committed.

6. **Interactive ASL Practice Trainer & Quiz**:
   - Gamified trainer prompts a sign (e.g., *"Show me the sign for: 'L'"*).
   - Validates live hand gestures with scoring, streak counters, audio chimes, and confetti animations!
   - Built-in hint helper with step-by-step finger posture instructions.

7. **Searchable ASL Dictionary & Reference Library**:
   - Visual reference cards for letters and words.
   - Detailed guides explaining finger placement, orientation, and pro tips.

8. **Virtual Sign Tester / Simulator**:
   - Test and demonstrate all translation, hold-to-confirm, speech, and autocomplete features even without a webcam!

---

## 🚀 How to Run

### Method 1: Double-Click Launcher (Windows)
Double-click [`start-server.bat`](start-server.bat). It will automatically launch the local HTTP server and open your default browser at `http://localhost:8000`.

### Method 2: PowerShell
In PowerShell, run:
```powershell
cd C:\Users\amani\.gemini\antigravity\scratch\sign-language-converter
.\serve.ps1
```

### Method 3: Any Static File Server
You can also use any HTTP server (e.g. VS Code Live Server, Python, Node, Caddy, etc.):
```bash
npx serve .
# or
python -m http.server 8000
```
Then open `http://localhost:8000` in Google Chrome, Microsoft Edge, or Mozilla Firefox.

---

## 🖐️ Tips for Accurate Sign Recognition

- **Lighting**: Ensure good front-facing lighting so hand landmarks are sharply detected.
- **Hand Distance**: Keep your hand approximately 1.5 to 2.5 feet (45–75 cm) away from the webcam.
- **Camera Orientation**: Center your hand inside the camera frame.
- **Hold Duration**: Hold the desired hand sign steady until the progress bar completes (default: 0.7s). You can adjust the hold speed slider in the toolbar.
