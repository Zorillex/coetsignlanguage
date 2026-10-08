/**
 * SignWave - Sign Language to Text Converter Main Application Controller
 * Optimized for production deployment on Netlify, GitHub Pages, and localhost.
 */

class SignLanguageApp {
  constructor() {
    // Core components
    this.recognizer = new SignGestureRecognizer();
    this.hands = null;
    this.isMediaPipeReady = false;
    this.stream = null;

    // DOM Elements
    this.videoElement = document.getElementById('webcam-video');
    this.canvasElement = document.getElementById('output-canvas');
    this.canvasCtx = this.canvasElement ? this.canvasElement.getContext('2d') : null;

    // State
    this.isCameraRunning = false;
    this.isMirrored = true;
    this.showSkeleton = true;
    this.activeTab = 'converter'; // 'converter' | 'practice' | 'dictionary'

    // Hold-to-confirm detection state
    this.currentCandidate = null;
    this.holdStartTime = null;
    this.holdDurationMs = 700; // Hold time required to commit
    this.lastCommittedSign = null;
    this.lastCommitTime = 0;
    this.refractoryPeriodMs = 500; // Cooldown after commit before accepting same sign

    // Converted text state
    this.transcript = "";
    this.autoSpeakWord = false;
    this.ttsPitch = 1.0;
    this.ttsRate = 1.0;
    this.selectedVoice = null;

    // Practice Mode state
    this.practiceTarget = 'A';
    this.practiceScore = 0;
    this.practiceStreak = 0;
    this.practiceLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'O', 'P', 'R', 'S', 'U', 'V', 'W', 'Y', 'I LOVE YOU', 'GOOD'];

    // Audio context for sound effects
    this.audioCtx = null;

    // Performance tracking
    this.fps = 0;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;

    this.init();
  }

  async init() {
    this.initAudio();
    this.initDOM();
    this.initTTS();
    this.setupEventListeners();
    this.renderDictionaryGrid();
    this.startNewPracticeRound();

    // Asynchronously load & initialize MediaPipe Hands
    this.initMediaPipe();
  }

  // Initialize Web Audio API for interactive feedback
  initAudio() {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    } catch (e) {
      console.warn("AudioContext not supported:", e);
    }
  }

  playChime(type = 'commit') {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'commit') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      // Audio playback errors are non-fatal
    }
  }

  initDOM() {
    this.dom = {
      // Overlays & Status
      cameraOverlay: document.getElementById('camera-overlay'),
      btnStartOverlay: document.getElementById('btn-start-camera-overlay'),
      cameraErrorMsg: document.getElementById('camera-error-msg'),
      aiModelPill: document.getElementById('ai-model-pill'),
      statusPill: document.getElementById('camera-status-pill'),
      fpsDisplay: document.getElementById('fps-counter'),
      liveSignBadge: document.getElementById('live-sign-badge'),
      confidenceBadge: document.getElementById('confidence-badge'),
      holdProgressBar: document.getElementById('hold-progress-fill'),
      holdProgressText: document.getElementById('hold-progress-text'),
      
      // Controls
      btnToggleCam: document.getElementById('btn-toggle-cam'),
      btnFlipCam: document.getElementById('btn-flip-cam'),
      btnSkeleton: document.getElementById('btn-skeleton'),
      selectCamera: document.getElementById('camera-select'),
      holdSpeedSlider: document.getElementById('hold-speed-slider'),
      holdSpeedLabel: document.getElementById('hold-speed-label'),

      // Text Editor
      textOutput: document.getElementById('converted-text'),
      suggestionsContainer: document.getElementById('suggestions-container'),
      btnSpeak: document.getElementById('btn-speak'),
      btnSpace: document.getElementById('btn-space'),
      btnBackspace: document.getElementById('btn-backspace'),
      btnClear: document.getElementById('btn-clear'),
      btnCopy: document.getElementById('btn-copy'),
      btnDownload: document.getElementById('btn-download'),
      autoSpeakToggle: document.getElementById('auto-speak-toggle'),
      voiceSelect: document.getElementById('voice-select'),
      pitchSlider: document.getElementById('pitch-slider'),
      rateSlider: document.getElementById('rate-slider'),

      // Mode Switcher Tabs
      tabConverter: document.getElementById('tab-btn-converter'),
      tabPractice: document.getElementById('tab-btn-practice'),
      tabDictionary: document.getElementById('tab-btn-dictionary'),
      viewConverter: document.getElementById('view-converter'),
      viewPractice: document.getElementById('view-practice'),
      viewDictionary: document.getElementById('view-dictionary'),

      // Practice elements
      targetSignDisplay: document.getElementById('practice-target-sign'),
      practiceScoreDisplay: document.getElementById('practice-score'),
      practiceStreakDisplay: document.getElementById('practice-streak'),
      practiceHintBtn: document.getElementById('practice-hint-btn'),
      practiceHintBox: document.getElementById('practice-hint-box'),
      practiceNextBtn: document.getElementById('practice-next-btn'),

      // Dictionary elements
      dictSearch: document.getElementById('dict-search-input'),
      dictFilter: document.getElementById('dict-filter-select'),
      dictGrid: document.getElementById('dict-cards-grid'),
      dictModal: document.getElementById('dict-detail-modal'),
      dictModalContent: document.getElementById('dict-modal-content'),
      dictModalClose: document.getElementById('dict-modal-close'),

      // Virtual Tester
      virtualGrid: document.getElementById('virtual-keys-grid')
    };

    if (this.dom.holdSpeedSlider) {
      this.dom.holdSpeedSlider.value = this.holdDurationMs;
    }
  }

  // Setup Text to Speech
  initTTS() {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!this.dom.voiceSelect) return;
      this.dom.voiceSelect.innerHTML = '';
      
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));
      const list = englishVoices.length > 0 ? englishVoices : voices;

      list.forEach((voice, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = `${voice.name} (${voice.lang})`;
        if (voice.default || voice.lang === 'en-US') {
          opt.selected = true;
          this.selectedVoice = voice;
        }
        this.dom.voiceSelect.appendChild(opt);
      });

      if (!this.selectedVoice && list.length > 0) {
        this.selectedVoice = list[0];
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  speak(text) {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.trim());
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.pitch = this.ttsPitch;
    utterance.rate = this.ttsRate;
    window.speechSynthesis.speak(utterance);
  }

  // Robust Async Initialization for MediaPipe Hands
  async initMediaPipe() {
    // Poll for the global Hands constructor from CDN
    let attempts = 0;
    while (typeof Hands === 'undefined' && attempts < 80) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }

    if (typeof Hands === 'undefined') {
      console.error("MediaPipe Hands library could not be loaded from CDN.");
      if (this.dom.aiModelPill) {
        this.dom.aiModelPill.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-rose-500"></span>
          <span class="text-rose-400">CDN Blocked</span>
        `;
      }
      return false;
    }

    try {
      this.hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
        }
      });

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.60,
        minTrackingConfidence: 0.55
      });

      this.hands.onResults((results) => this.onHandResults(results));
      this.isMediaPipeReady = true;

      if (this.dom.aiModelPill) {
        this.dom.aiModelPill.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span class="text-emerald-300">AI Model Ready</span>
        `;
        this.dom.aiModelPill.className = "text-xs px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 flex items-center gap-1.5";
      }

      console.log("MediaPipe Hands initialized and ready.");
      return true;
    } catch (err) {
      console.error("Error creating MediaPipe Hands instance:", err);
      return false;
    }
  }

  // Camera handling with multi-tiered fallback
  async populateCameraDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      if (this.dom.selectCamera) {
        this.dom.selectCamera.innerHTML = '';
        videoInputs.forEach((device, idx) => {
          const opt = document.createElement('option');
          opt.value = device.deviceId;
          opt.textContent = device.label || `Camera ${idx + 1}`;
          this.dom.selectCamera.appendChild(opt);
        });
      }
    } catch (e) {
      console.warn("Could not list video devices:", e);
    }
  }

  async toggleCamera() {
    if (this.isCameraRunning) {
      this.stopCamera();
    } else {
      await this.startCamera();
    }
  }

  async startCamera() {
    if (this.dom.cameraErrorMsg) {
      this.dom.cameraErrorMsg.classList.add('hidden');
    }

    if (this.dom.statusPill) {
      this.dom.statusPill.textContent = "Connecting Camera...";
      this.dom.statusPill.className = "px-3 py-1 text-xs font-semibold rounded-full bg-amber-900/50 text-amber-300 border border-amber-700 animate-pulse";
    }

    // Ensure AI model is ready
    if (!this.isMediaPipeReady) {
      await this.initMediaPipe();
    }

    try {
      // Set video element flags needed for iOS Safari & Android Chrome
      this.videoElement.setAttribute('autoplay', '');
      this.videoElement.setAttribute('playsinline', '');
      this.videoElement.setAttribute('muted', '');
      this.videoElement.muted = true;
      this.videoElement.playsInline = true;

      const deviceId = this.dom.selectCamera ? this.dom.selectCamera.value : undefined;
      
      let stream = null;
      try {
        // Preferred high-resolution user-facing constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (e1) {
        // Secondary fallback constraints (simple video)
        console.warn("High-res constraints failed, falling back to basic video:", e1);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      this.stream = stream;
      this.videoElement.srcObject = stream;
      await this.videoElement.play();

      this.isCameraRunning = true;

      // Hide start overlay
      if (this.dom.cameraOverlay) {
        this.dom.cameraOverlay.classList.add('hidden');
      }

      if (this.dom.statusPill) {
        this.dom.statusPill.textContent = "Camera Live";
        this.dom.statusPill.className = "px-3 py-1 text-xs font-semibold rounded-full bg-emerald-900/50 text-emerald-300 border border-emerald-700 flex items-center gap-1.5";
      }

      if (this.dom.btnToggleCam) {
        this.dom.btnToggleCam.innerHTML = `<i class="fa-solid fa-video-slash mr-2"></i> Stop Camera`;
        this.dom.btnToggleCam.classList.remove('bg-indigo-600', 'hover:bg-indigo-500');
        this.dom.btnToggleCam.classList.add('bg-rose-600', 'hover:bg-rose-500');
      }

      await this.populateCameraDevices();
      this.startProcessingLoop();
    } catch (err) {
      console.error("Camera access error:", err);

      if (this.dom.statusPill) {
        this.dom.statusPill.textContent = "Camera Blocked";
        this.dom.statusPill.className = "px-3 py-1 text-xs font-semibold rounded-full bg-rose-900/50 text-rose-300 border border-rose-700";
      }

      if (this.dom.cameraOverlay) {
        this.dom.cameraOverlay.classList.remove('hidden');
      }

      if (this.dom.cameraErrorMsg) {
        this.dom.cameraErrorMsg.innerHTML = `
          <div class="font-bold flex items-center gap-1.5 mb-1 text-rose-200">
            <i class="fa-solid fa-triangle-exclamation"></i> Camera Access Blocked
          </div>
          <div>Please allow camera permission in your browser:</div>
          <ol class="list-decimal list-inside mt-1 space-y-0.5 text-[11px] text-slate-300">
            <li>Click the <strong>lock / camera icon</strong> on the left of your browser address bar.</li>
            <li>Switch <strong>Camera</strong> from "Block" to <strong>"Allow"</strong>.</li>
            <li>Click <strong>"Turn On Camera Now"</strong> again or refresh the page.</li>
          </ol>
        `;
        this.dom.cameraErrorMsg.classList.remove('hidden');
      }
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isCameraRunning = false;

    if (this.dom.cameraOverlay) {
      this.dom.cameraOverlay.classList.remove('hidden');
    }

    if (this.dom.statusPill) {
      this.dom.statusPill.textContent = "Camera Off";
      this.dom.statusPill.className = "px-3 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700";
    }

    if (this.dom.btnToggleCam) {
      this.dom.btnToggleCam.innerHTML = `<i class="fa-solid fa-video mr-2"></i> Start Camera`;
      this.dom.btnToggleCam.classList.remove('bg-rose-600', 'hover:bg-rose-500');
      this.dom.btnToggleCam.classList.add('bg-indigo-600', 'hover:bg-indigo-500');
    }

    if (this.canvasCtx && this.canvasElement) {
      this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }
    this.resetHoldState();
  }

  // Frame processing loop using requestVideoFrameCallback or requestAnimationFrame
  startProcessingLoop() {
    const processFrame = async () => {
      if (!this.isCameraRunning) return;

      if (this.videoElement && this.videoElement.readyState >= 2 && this.hands) {
        try {
          await this.hands.send({ image: this.videoElement });
        } catch (e) {
          // Catch any individual frame exception so loop never terminates
        }
      }

      // FPS Calculation
      const now = performance.now();
      this.frameCount++;
      if (now - this.lastFrameTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
        this.frameCount = 0;
        this.lastFrameTime = now;
        if (this.dom.fpsDisplay) {
          this.dom.fpsDisplay.textContent = `${this.fps} FPS`;
        }
      }

      if ('requestVideoFrameCallback' in this.videoElement) {
        this.videoElement.requestVideoFrameCallback(processFrame);
      } else {
        requestAnimationFrame(processFrame);
      }
    };

    if ('requestVideoFrameCallback' in this.videoElement) {
      this.videoElement.requestVideoFrameCallback(processFrame);
    } else {
      requestAnimationFrame(processFrame);
    }
  }

  // Custom independent Hand Skeleton Renderer (no external dependencies needed)
  drawCustomSkeleton(ctx, landmarks) {
    const pairs = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],       // Index
      [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
      [9, 13], [13, 14], [14, 15], [15, 16],// Ring
      [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
      [0, 17]                               // Palm base
    ];

    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Draw skeletal bones
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8';
    for (const [i, j] of pairs) {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      ctx.beginPath();
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();
    }

    // Draw landmark joints
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      const isTip = (i === 4 || i === 8 || i === 12 || i === 16 || i === 20);
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, isTip ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isTip ? '#ec4899' : '#a855f7';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // MediaPipe Results Handler
  onHandResults(results) {
    if (!this.canvasCtx || !this.canvasElement) return;

    const width = this.canvasElement.width = this.videoElement.videoWidth || 640;
    const height = this.canvasElement.height = this.videoElement.videoHeight || 480;

    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, width, height);

    // Apply mirror flip
    if (this.isMirrored) {
      this.canvasCtx.translate(width, 0);
      this.canvasCtx.scale(-1, 1);
    }

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      const handedness = (results.multiHandedness && results.multiHandedness[0] && results.multiHandedness[0].label) || 'Right';

      // 1. Draw Skeleton
      if (this.showSkeleton) {
        this.drawCustomSkeleton(this.canvasCtx, landmarks);
      }

      // 2. Classify gesture
      const prediction = this.recognizer.classify(landmarks, handedness);

      // 3. Process candidate and hold-to-confirm
      if (prediction) {
        this.handlePrediction(prediction, landmarks, width, height);
      } else {
        this.resetHoldState();
      }
    } else {
      this.resetHoldState();
    }

    this.canvasCtx.restore();
  }

  // Handle detected gesture & hold progress
  handlePrediction(prediction, landmarks, width, height) {
    const { sign, confidence, type } = prediction;
    const now = performance.now();

    // Visual HUD overlay on canvas
    this.drawHandHUD(landmarks, sign, confidence, width, height);

    // Update HUD Badges in DOM
    if (this.dom.liveSignBadge) {
      this.dom.liveSignBadge.textContent = sign;
      this.dom.liveSignBadge.className = "text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-cyan-300 tracking-wider";
    }
    if (this.dom.confidenceBadge) {
      this.dom.confidenceBadge.textContent = `${Math.round(confidence * 100)}% Match`;
    }

    // Practice Mode validation check
    if (this.activeTab === 'practice') {
      if (sign.toUpperCase() === this.practiceTarget.toUpperCase()) {
        this.updateHoldProgress(sign, now, () => {
          this.handlePracticeSuccess();
        });
      } else {
        this.resetHoldState();
      }
      return;
    }

    // Converter Mode validation
    if (sign === this.lastCommittedSign && (now - this.lastCommitTime) < this.refractoryPeriodMs) {
      return;
    }

    this.updateHoldProgress(sign, now, () => {
      this.commitSign(sign, type);
    });
  }

  // Draw Head-Up Display (HUD) on Hand Bounding Box
  drawHandHUD(landmarks, sign, confidence, width, height) {
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    for (const p of landmarks) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const pad = 24;
    const boxX = Math.max(0, minX * width - pad);
    const boxY = Math.max(0, minY * height - pad);
    const boxW = Math.min(width - boxX, (maxX - minX) * width + pad * 2);
    const boxH = Math.min(height - boxY, (maxY - minY) * height + pad * 2);

    // Glowing Bounding Box
    this.canvasCtx.save();
    this.canvasCtx.strokeStyle = 'rgba(168, 85, 247, 0.75)';
    this.canvasCtx.lineWidth = 2;
    this.canvasCtx.strokeRect(boxX, boxY, boxW, boxH);

    // Label Tag
    this.canvasCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    const tagWidth = 110;
    const tagHeight = 28;
    this.canvasCtx.fillRect(boxX, Math.max(0, boxY - tagHeight), tagWidth, tagHeight);

    this.canvasCtx.fillStyle = '#38bdf8';
    this.canvasCtx.font = 'bold 15px system-ui, sans-serif';
    this.canvasCtx.fillText(`${sign} (${Math.round(confidence * 100)}%)`, boxX + 8, Math.max(18, boxY - 8));
    this.canvasCtx.restore();
  }

  // Update temporal hold-to-confirm progress
  updateHoldProgress(sign, now, onConfirmed) {
    if (this.currentCandidate !== sign) {
      this.currentCandidate = sign;
      this.holdStartTime = now;
    }

    const elapsed = now - this.holdStartTime;
    const progress = Math.min(1.0, elapsed / this.holdDurationMs);

    if (this.dom.holdProgressBar) {
      this.dom.holdProgressBar.style.width = `${progress * 100}%`;
    }
    if (this.dom.holdProgressText) {
      this.dom.holdProgressText.textContent = `${Math.round(progress * 100)}% Hold`;
    }

    if (progress >= 1.0) {
      onConfirmed();
      this.resetHoldState();
      this.lastCommittedSign = sign;
      this.lastCommitTime = now;
    }
  }

  resetHoldState() {
    this.currentCandidate = null;
    this.holdStartTime = null;
    if (this.dom.holdProgressBar) {
      this.dom.holdProgressBar.style.width = '0%';
    }
    if (this.dom.holdProgressText) {
      this.dom.holdProgressText.textContent = 'Ready';
    }
  }

  // Commit typed sign into output transcript
  commitSign(sign, type) {
    this.playChime('commit');

    if (sign === 'SPACE') {
      this.addSpace();
      return;
    }

    if (sign === 'BACKSPACE') {
      this.backspace();
      return;
    }

    if (type === 'phrase') {
      const endsWithSpace = this.transcript.endsWith(' ') || this.transcript.length === 0;
      this.transcript += (endsWithSpace ? '' : ' ') + sign + ' ';
    } else {
      this.transcript += sign;
    }

    this.updateTextDisplay();
    this.triggerCommitVisualPulse();

    if (this.autoSpeakWord) {
      if (type === 'phrase') {
        this.speak(sign);
      }
    }
  }

  triggerCommitVisualPulse() {
    if (this.dom.liveSignBadge) {
      this.dom.liveSignBadge.classList.add('scale-125', 'transition-transform');
      setTimeout(() => {
        this.dom.liveSignBadge.classList.remove('scale-125');
      }, 200);
    }
  }

  addSpace() {
    if (this.transcript.length > 0 && !this.transcript.endsWith(' ')) {
      if (this.autoSpeakWord) {
        const words = this.transcript.trim().split(/\s+/);
        if (words.length > 0) {
          const lastWord = words[words.length - 1];
          this.speak(lastWord);
        }
      }
      this.transcript += ' ';
      this.updateTextDisplay();
    }
  }

  backspace() {
    if (this.transcript.length > 0) {
      this.transcript = this.transcript.slice(0, -1);
      this.updateTextDisplay();
    }
  }

  clearText() {
    this.transcript = '';
    this.updateTextDisplay();
  }

  updateTextDisplay() {
    if (this.dom.textOutput) {
      this.dom.textOutput.value = this.transcript;
      this.dom.textOutput.scrollTop = this.dom.textOutput.scrollHeight;
    }
    this.updateSuggestions();
  }

  // Word autocomplete suggestions
  updateSuggestions() {
    if (!this.dom.suggestionsContainer) return;
    this.dom.suggestionsContainer.innerHTML = '';

    const words = this.transcript.split(/\s+/);
    const currentWord = words[words.length - 1] || '';

    if (currentWord.length >= 1) {
      const suggestions = getWordSuggestions(currentWord, 6);
      if (suggestions.length > 0) {
        suggestions.forEach(word => {
          const btn = document.createElement('button');
          btn.className = "px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-900/60 hover:bg-indigo-600 text-indigo-200 border border-indigo-700/60 transition shadow-sm hover:scale-105";
          btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles mr-1 text-amber-300"></i> ${word}`;
          btn.onclick = () => this.applySuggestion(word);
          this.dom.suggestionsContainer.appendChild(btn);
        });
        return;
      }
    }

    const defaultChips = ["HELLO", "THANK YOU", "YES", "NO", "PLEASE", "HELP"];
    defaultChips.forEach(chip => {
      const btn = document.createElement('button');
      btn.className = "px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition";
      btn.textContent = chip;
      btn.onclick = () => this.commitSign(chip, 'phrase');
      this.dom.suggestionsContainer.appendChild(btn);
    });
  }

  applySuggestion(word) {
    const words = this.transcript.split(/\s+/);
    words.pop();
    words.push(word);
    this.transcript = words.join(' ') + ' ';
    this.updateTextDisplay();
    if (this.autoSpeakWord) {
      this.speak(word);
    }
  }

  // ==========================================
  // PRACTICE TRAINER MODE
  // ==========================================
  startNewPracticeRound() {
    const list = this.practiceLetters;
    const randomTarget = list[Math.floor(Math.random() * list.length)];
    this.practiceTarget = randomTarget;

    if (this.dom.targetSignDisplay) {
      this.dom.targetSignDisplay.textContent = this.practiceTarget;
    }
    if (this.dom.practiceHintBox) {
      this.dom.practiceHintBox.classList.add('hidden');
    }
    this.updatePracticeHintContent();
  }

  updatePracticeHintContent() {
    const info = ASL_DATA.signs[this.practiceTarget];
    if (info && this.dom.practiceHintBox) {
      this.dom.practiceHintBox.innerHTML = `
        <div class="p-4 rounded-xl bg-slate-800/80 border border-indigo-500/40 text-sm space-y-1">
          <div class="font-bold text-indigo-300 flex items-center gap-2">
            <i class="fa-solid fa-lightbulb text-amber-400"></i> How to sign "${this.practiceTarget}":
          </div>
          <p class="text-slate-300">${info.description}</p>
          <p class="text-xs text-amber-300/90 font-medium">Tip: ${info.tips}</p>
        </div>
      `;
    }
  }

  handlePracticeSuccess() {
    this.playChime('success');
    this.practiceScore += 10;
    this.practiceStreak += 1;

    if (this.dom.practiceScoreDisplay) {
      this.dom.practiceScoreDisplay.textContent = this.practiceScore;
    }
    if (this.dom.practiceStreakDisplay) {
      this.dom.practiceStreakDisplay.textContent = this.practiceStreak;
    }

    if (typeof confetti === 'function') {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    }

    if (this.dom.targetSignDisplay) {
      this.dom.targetSignDisplay.classList.add('text-emerald-400', 'scale-110');
      setTimeout(() => {
        this.dom.targetSignDisplay.classList.remove('text-emerald-400', 'scale-110');
        this.startNewPracticeRound();
      }, 900);
    }
  }

  // ==========================================
  // ASL DICTIONARY & VISUAL REFERENCE
  // ==========================================
  renderDictionaryGrid(searchTerm = '', filter = 'all') {
    if (!this.dom.dictGrid) return;
    this.dom.dictGrid.innerHTML = '';

    const entries = Object.entries(ASL_DATA.signs);
    const filtered = entries.filter(([key, item]) => {
      const matchSearch = key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = filter === 'all' || item.type === filter;
      return matchSearch && matchFilter;
    });

    if (filtered.length === 0) {
      this.dom.dictGrid.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-400">
          <i class="fa-solid fa-magnifying-glass text-4xl mb-3 text-slate-600"></i>
          <p>No matching signs found.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(([key, item]) => {
      const card = document.createElement('div');
      card.className = "bg-slate-900/70 border border-slate-800 hover:border-indigo-500/60 rounded-2xl p-4 transition duration-200 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer flex flex-col justify-between group";
      
      const badgeColor = item.type === 'letter' ? 'bg-cyan-950 text-cyan-400 border-cyan-800' :
                         item.type === 'phrase' ? 'bg-purple-950 text-purple-400 border-purple-800' : 'bg-slate-800 text-slate-300 border-slate-700';

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="text-2xl font-black text-white group-hover:text-indigo-400 transition">${item.name}</span>
            <span class="px-2 py-0.5 text-xs font-semibold rounded-full border ${badgeColor}">${item.type.toUpperCase()}</span>
          </div>
          <p class="text-xs text-slate-300 line-clamp-3 mb-3">${item.description}</p>
        </div>
        <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-semibold">
          <span>View Details</span>
          <i class="fa-solid fa-arrow-right group-hover:translate-x-1 transition"></i>
        </div>
      `;

      card.onclick = () => this.openSignModal(item);
      this.dom.dictGrid.appendChild(card);
    });
  }

  openSignModal(item) {
    if (!this.dom.dictModal || !this.dom.dictModalContent) return;
    this.dom.dictModalContent.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-4xl font-extrabold text-white">${item.name}</h3>
          <span class="px-3 py-1 text-xs font-bold rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700">${item.type.toUpperCase()}</span>
        </div>
        <div class="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
          <div class="text-xs uppercase font-bold text-slate-400 tracking-wider">How to form this sign:</div>
          <p class="text-slate-200 text-sm leading-relaxed">${item.description}</p>
        </div>
        <div class="p-4 rounded-xl bg-amber-950/40 border border-amber-800/50 space-y-1">
          <div class="text-xs uppercase font-bold text-amber-300 flex items-center gap-1.5">
            <i class="fa-solid fa-lightbulb"></i> Essential Pro Tip:
          </div>
          <p class="text-slate-300 text-sm">${item.tips}</p>
        </div>
        <div class="flex gap-3 pt-2">
          <button id="modal-practice-btn" class="flex-1 py-2.5 px-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2">
            <i class="fa-solid fa-dumbbell"></i> Practice This Sign Now
          </button>
        </div>
      </div>
    `;

    const practiceBtn = document.getElementById('modal-practice-btn');
    if (practiceBtn) {
      practiceBtn.onclick = () => {
        this.dom.dictModal.classList.add('hidden');
        this.switchTab('practice');
        this.practiceTarget = item.name;
        if (this.dom.targetSignDisplay) this.dom.targetSignDisplay.textContent = item.name;
        this.updatePracticeHintContent();
      };
    }

    this.dom.dictModal.classList.remove('hidden');
  }

  // Virtual Tester: Click buttons to inject simulated gestures
  simulateSign(sign, type = 'letter') {
    this.currentCandidate = sign;
    if (this.dom.liveSignBadge) {
      this.dom.liveSignBadge.textContent = sign;
    }
    if (this.dom.confidenceBadge) {
      this.dom.confidenceBadge.textContent = "98% (Virtual)";
    }
    this.commitSign(sign, type);
  }

  // Switch App Views / Tabs
  switchTab(tab) {
    this.activeTab = tab;
    const tabs = [
      { id: 'converter', btn: this.dom.tabConverter, view: this.dom.viewConverter },
      { id: 'practice', btn: this.dom.tabPractice, view: this.dom.viewPractice },
      { id: 'dictionary', btn: this.dom.tabDictionary, view: this.dom.viewDictionary }
    ];

    tabs.forEach(t => {
      if (t.id === tab) {
        t.btn.classList.add('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-600/30');
        t.btn.classList.remove('text-slate-400', 'hover:text-white', 'bg-transparent');
        t.view.classList.remove('hidden');
      } else {
        t.btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-600/30');
        t.btn.classList.add('text-slate-400', 'hover:text-white', 'bg-transparent');
        t.view.classList.add('hidden');
      }
    });
  }

  // Event Listeners Setup
  setupEventListeners() {
    // Camera start buttons
    if (this.dom.btnStartOverlay) {
      this.dom.btnStartOverlay.onclick = () => this.startCamera();
    }
    if (this.dom.btnToggleCam) {
      this.dom.btnToggleCam.onclick = () => this.toggleCamera();
    }
    if (this.dom.btnFlipCam) {
      this.dom.btnFlipCam.onclick = () => {
        this.isMirrored = !this.isMirrored;
        if (this.dom.btnFlipCam) {
          this.dom.btnFlipCam.classList.toggle('text-indigo-400', this.isMirrored);
        }
      };
    }
    if (this.dom.btnSkeleton) {
      this.dom.btnSkeleton.onclick = () => {
        this.showSkeleton = !this.showSkeleton;
        if (this.dom.btnSkeleton) {
          this.dom.btnSkeleton.classList.toggle('text-indigo-400', this.showSkeleton);
        }
      };
    }
    if (this.dom.selectCamera) {
      this.dom.selectCamera.onchange = () => {
        if (this.isCameraRunning) {
          this.startCamera();
        }
      };
    }

    // Hold speed slider
    if (this.dom.holdSpeedSlider) {
      this.dom.holdSpeedSlider.oninput = (e) => {
        this.holdDurationMs = parseInt(e.target.value);
        if (this.dom.holdSpeedLabel) {
          this.dom.holdSpeedLabel.textContent = `${(this.holdDurationMs / 1000).toFixed(1)}s`;
        }
      };
    }

    // Text Editor controls
    if (this.dom.btnSpeak) {
      this.dom.btnSpeak.onclick = () => this.speak(this.transcript);
    }
    if (this.dom.btnSpace) {
      this.dom.btnSpace.onclick = () => this.addSpace();
    }
    if (this.dom.btnBackspace) {
      this.dom.btnBackspace.onclick = () => this.backspace();
    }
    if (this.dom.btnClear) {
      this.dom.btnClear.onclick = () => this.clearText();
    }
    if (this.dom.btnCopy) {
      this.dom.btnCopy.onclick = async () => {
        if (!this.transcript) return;
        try {
          await navigator.clipboard.writeText(this.transcript);
          const original = this.dom.btnCopy.innerHTML;
          this.dom.btnCopy.innerHTML = `<i class="fa-solid fa-check text-emerald-400"></i> Copied!`;
          setTimeout(() => this.dom.btnCopy.innerHTML = original, 1500);
        } catch (e) {
          console.warn("Clipboard write failed:", e);
        }
      };
    }
    if (this.dom.btnDownload) {
      this.dom.btnDownload.onclick = () => {
        if (!this.transcript) return;
        const blob = new Blob([this.transcript], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sign-transcript-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      };
    }
    if (this.dom.textOutput) {
      this.dom.textOutput.oninput = (e) => {
        this.transcript = e.target.value;
        this.updateSuggestions();
      };
    }

    // Speech synthesis controls
    if (this.dom.autoSpeakToggle) {
      this.dom.autoSpeakToggle.onchange = (e) => {
        this.autoSpeakWord = e.target.checked;
      };
    }
    if (this.dom.voiceSelect) {
      this.dom.voiceSelect.onchange = (e) => {
        const voices = window.speechSynthesis.getVoices();
        this.selectedVoice = voices[parseInt(e.target.value)] || null;
      };
    }
    if (this.dom.pitchSlider) {
      this.dom.pitchSlider.oninput = (e) => {
        this.ttsPitch = parseFloat(e.target.value);
      };
    }
    if (this.dom.rateSlider) {
      this.dom.rateSlider.oninput = (e) => {
        this.ttsRate = parseFloat(e.target.value);
      };
    }

    // Tabs
    if (this.dom.tabConverter) this.dom.tabConverter.onclick = () => this.switchTab('converter');
    if (this.dom.tabPractice) this.dom.tabPractice.onclick = () => this.switchTab('practice');
    if (this.dom.tabDictionary) this.dom.tabDictionary.onclick = () => this.switchTab('dictionary');

    // Practice Mode
    if (this.dom.practiceNextBtn) {
      this.dom.practiceNextBtn.onclick = () => this.startNewPracticeRound();
    }
    if (this.dom.practiceHintBtn) {
      this.dom.practiceHintBtn.onclick = () => {
        if (this.dom.practiceHintBox) {
          this.dom.practiceHintBox.classList.toggle('hidden');
        }
      };
    }

    // Dictionary Search & Filters
    if (this.dom.dictSearch) {
      this.dom.dictSearch.oninput = (e) => {
        const val = e.target.value;
        const filter = this.dom.dictFilter ? this.dom.dictFilter.value : 'all';
        this.renderDictionaryGrid(val, filter);
      };
    }
    if (this.dom.dictFilter) {
      this.dom.dictFilter.onchange = (e) => {
        const filter = e.target.value;
        const search = this.dom.dictSearch ? this.dom.dictSearch.value : '';
        this.renderDictionaryGrid(search, filter);
      };
    }
    if (this.dom.dictModalClose) {
      this.dom.dictModalClose.onclick = () => {
        if (this.dom.dictModal) this.dom.dictModal.classList.add('hidden');
      };
    }

    // Populate Virtual Test buttons
    if (this.dom.virtualGrid) {
      const keys = [
        ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
        'I LOVE YOU', 'GOOD', 'HELLO', 'SPACE', 'BACKSPACE'
      ];
      this.dom.virtualGrid.innerHTML = '';
      keys.forEach(k => {
        const btn = document.createElement('button');
        const isControl = k === 'SPACE' || k === 'BACKSPACE';
        const isPhrase = k.length > 1 && !isControl;
        btn.className = `p-2 text-xs font-bold rounded-lg transition border ${
          isControl ? 'bg-amber-950/60 hover:bg-amber-600 text-amber-200 border-amber-800' :
          isPhrase ? 'bg-purple-950/60 hover:bg-purple-600 text-purple-200 border-purple-800' :
          'bg-slate-800/80 hover:bg-indigo-600 text-slate-200 border-slate-700 hover:border-indigo-500'
        }`;
        btn.textContent = k;
        btn.onclick = () => {
          const type = isControl ? 'control' : (isPhrase ? 'phrase' : 'letter');
          this.simulateSign(k, type);
        };
        this.dom.virtualGrid.appendChild(btn);
      });
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (document.activeElement === this.dom.textOutput) return;
      if (e.key === ' ' && !e.repeat) {
        this.addSpace();
      } else if (e.key === 'Backspace' && !e.repeat) {
        this.backspace();
      }
    });
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new SignLanguageApp();
});
