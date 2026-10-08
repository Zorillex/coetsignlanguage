/**
 * SignGestureRecognizer
 * Advanced Geometric & Kinematic Classifier for American Sign Language (ASL)
 * Converts 21 MediaPipe hand landmarks into ASL letters, words, and control gestures.
 */

class SignGestureRecognizer {
  constructor() {
    // MediaPipe 21 Landmark index constants
    this.LM = {
      WRIST: 0,
      THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
      INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
      MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
      RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
      PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20
    };

    // Mode filter: 'all' | 'alphabet' | 'words'
    this.mode = 'all';
  }

  setMode(mode) {
    this.mode = mode;
  }

  // Calculate Euclidean distance between two 3D landmarks
  distance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // 2D distance on XY plane
  distance2D(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Angle in degrees between three points (A -> B -> C, vertex at B)
  angle(a, b, c) {
    const v1 = { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
    const v2 = { x: c.x - b.x, y: c.y - b.y, z: (c.z || 0) - (b.z || 0) };
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
    if (mag1 * mag2 === 0) return 0;
    const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    return (Math.acos(cosAngle) * 180) / Math.PI;
  }

  /**
   * Extract scale-invariant features from 21 landmarks
   */
  extractFeatures(landmarks, handedness = 'Right') {
    const lm = landmarks;
    const LM = this.LM;

    // Hand scale: distance between Wrist (0) and Middle MCP (9)
    const scale = this.distance(lm[LM.WRIST], lm[LM.MIDDLE_MCP]) || 0.15;
    const normDist = (i, j) => this.distance(lm[i], lm[j]) / scale;
    const normDist2D = (i, j) => this.distance2D(lm[i], lm[j]) / scale;

    // Finger joint angles (higher = straighter, ~180° = straight)
    const indexAngle = this.angle(lm[LM.INDEX_MCP], lm[LM.INDEX_PIP], lm[LM.INDEX_TIP]);
    const middleAngle = this.angle(lm[LM.MIDDLE_MCP], lm[LM.MIDDLE_PIP], lm[LM.MIDDLE_TIP]);
    const ringAngle = this.angle(lm[LM.RING_MCP], lm[LM.RING_PIP], lm[LM.RING_TIP]);
    const pinkyAngle = this.angle(lm[LM.PINKY_MCP], lm[LM.PINKY_PIP], lm[LM.PINKY_TIP]);
    const thumbAngle = this.angle(lm[LM.THUMB_CMC], lm[LM.THUMB_MCP], lm[LM.THUMB_TIP]);

    // Finger Extension: tip distance from wrist vs pip distance from wrist
    const isIndexExtended = normDist(LM.INDEX_TIP, LM.WRIST) > normDist(LM.INDEX_PIP, LM.WRIST) * 1.15 &&
      normDist(LM.INDEX_TIP, LM.INDEX_MCP) > 0.65 && indexAngle > 130;

    const isMiddleExtended = normDist(LM.MIDDLE_TIP, LM.WRIST) > normDist(LM.MIDDLE_PIP, LM.WRIST) * 1.15 &&
      normDist(LM.MIDDLE_TIP, LM.MIDDLE_MCP) > 0.65 && middleAngle > 130;

    const isRingExtended = normDist(LM.RING_TIP, LM.WRIST) > normDist(LM.RING_PIP, LM.WRIST) * 1.15 &&
      normDist(LM.RING_TIP, LM.RING_MCP) > 0.60 && ringAngle > 130;

    const isPinkyExtended = normDist(LM.PINKY_TIP, LM.WRIST) > normDist(LM.PINKY_PIP, LM.WRIST) * 1.15 &&
      normDist(LM.PINKY_TIP, LM.PINKY_MCP) > 0.55 && pinkyAngle > 125;

    // Finger Curl: tip is close to palm/MCP and joint angle is sharp
    const isIndexCurled = (normDist(LM.INDEX_TIP, LM.INDEX_MCP) < 0.55 || normDist(LM.INDEX_TIP, LM.WRIST) <= normDist(LM.INDEX_PIP, LM.WRIST)) && indexAngle < 120;
    const isMiddleCurled = (normDist(LM.MIDDLE_TIP, LM.MIDDLE_MCP) < 0.55 || normDist(LM.MIDDLE_TIP, LM.WRIST) <= normDist(LM.MIDDLE_PIP, LM.WRIST)) && middleAngle < 120;
    const isRingCurled = (normDist(LM.RING_TIP, LM.RING_MCP) < 0.55 || normDist(LM.RING_TIP, LM.WRIST) <= normDist(LM.RING_PIP, LM.WRIST)) && ringAngle < 120;
    const isPinkyCurled = (normDist(LM.PINKY_TIP, LM.PINKY_MCP) < 0.55 || normDist(LM.PINKY_TIP, LM.WRIST) <= normDist(LM.PINKY_PIP, LM.WRIST)) && pinkyAngle < 120;

    // Thumb states
    const thumbDistToPinkyMCP = normDist(LM.THUMB_TIP, LM.PINKY_MCP);
    const thumbDistToIndexMCP = normDist(LM.THUMB_TIP, LM.INDEX_MCP);
    const isThumbExtended = thumbDistToPinkyMCP > 0.75 && normDist(LM.THUMB_TIP, LM.THUMB_MCP) > 0.45;
    const isThumbUp = (lm[LM.THUMB_TIP].y < lm[LM.THUMB_IP].y) && (lm[LM.THUMB_IP].y < lm[LM.THUMB_MCP].y + 0.05);
    const isThumbFoldedAcross = thumbDistToPinkyMCP < 0.55 || normDist(LM.THUMB_TIP, LM.MIDDLE_MCP) < 0.45;

    // Pinch / Finger touch distances
    const pinchThumbIndex = normDist(LM.THUMB_TIP, LM.INDEX_TIP);
    const pinchThumbMiddle = normDist(LM.THUMB_TIP, LM.MIDDLE_TIP);
    const pinchThumbRing = normDist(LM.THUMB_TIP, LM.RING_TIP);
    const pinchThumbPinky = normDist(LM.THUMB_TIP, LM.PINKY_TIP);

    // Spacing between extended fingertips
    const indexMiddleDist = normDist(LM.INDEX_TIP, LM.MIDDLE_TIP);
    const middleRingDist = normDist(LM.MIDDLE_TIP, LM.RING_TIP);
    const ringPinkyDist = normDist(LM.RING_TIP, LM.PINKY_TIP);

    // Crossed index and middle (for ASL 'R')
    const indexMCPtoMiddleMCPX = lm[LM.INDEX_MCP].x - lm[LM.MIDDLE_MCP].x;
    const indexTiptoMiddleTipX = lm[LM.INDEX_TIP].x - lm[LM.MIDDLE_TIP].x;
    const isIndexCrossedOverMiddle = (indexMCPtoMiddleMCPX * indexTiptoMiddleTipX < 0) && (indexMiddleDist < 0.28);

    // Hand orientation (vector from Wrist to Middle MCP)
    const handDirX = lm[LM.MIDDLE_MCP].x - lm[LM.WRIST].x;
    const handDirY = lm[LM.MIDDLE_MCP].y - lm[LM.WRIST].y;
    const isHandPointingUp = handDirY < -0.3;
    const isHandPointingDown = handDirY > 0.3;
    const isHandHorizontal = Math.abs(handDirX) > Math.abs(handDirY) * 1.2;

    // Hooked index (for 'X')
    const isIndexHooked = !isIndexExtended && !isIndexCurled && (indexAngle > 60 && indexAngle < 125) && (lm[LM.INDEX_TIP].y > lm[LM.INDEX_PIP].y - 0.05);

    // Curved fingers (for 'C' and 'O')
    const allFingersCurved = (indexAngle >= 80 && indexAngle <= 140) &&
      (middleAngle >= 80 && middleAngle <= 140) &&
      (ringAngle >= 80 && ringAngle <= 140) &&
      (pinkyAngle >= 80 && pinkyAngle <= 140);

    return {
      scale,
      normDist,
      normDist2D,
      // States
      isIndexExtended, isMiddleExtended, isRingExtended, isPinkyExtended,
      isIndexCurled, isMiddleCurled, isRingCurled, isPinkyCurled,
      isThumbExtended, isThumbUp, isThumbFoldedAcross,
      // Pinches
      pinchThumbIndex, pinchThumbMiddle, pinchThumbRing, pinchThumbPinky,
      // Spacings
      indexMiddleDist, middleRingDist, ringPinkyDist,
      isIndexCrossedOverMiddle,
      // Orientations
      isHandPointingUp, isHandPointingDown, isHandHorizontal,
      handDirX, handDirY,
      isIndexHooked, allFingersCurved,
      // Angles
      angles: { thumbAngle, indexAngle, middleAngle, ringAngle, pinkyAngle },
      handedness
    };
  }

  /**
   * Classify hand landmarks into candidate signs with confidence scores
   */
  classify(landmarks, handedness = 'Right') {
    if (!landmarks || landmarks.length < 21) {
      return null;
    }

    const f = this.extractFeatures(landmarks, handedness);
    const candidates = [];

    const add = (sign, confidence, type = 'letter') => {
      if (confidence > 0.45) {
        if (this.mode === 'alphabet' && type !== 'letter') return;
        if (this.mode === 'words' && (type === 'letter' && sign.length === 1)) return;
        candidates.push({ sign, confidence: Math.min(0.99, Math.round(confidence * 100) / 100), type });
      }
    };

    // ==========================================
    // 1. PHRASES & SPECIAL GESTURES
    // ==========================================

    // "I LOVE YOU" (ILY): Thumb + Index + Pinky extended, Middle + Ring curled
    if (f.isThumbExtended && f.isIndexExtended && f.isPinkyExtended && f.isMiddleCurled && f.isRingCurled) {
      let score = 0.88;
      if (f.angles.indexAngle > 140 && f.angles.pinkyAngle > 140) score += 0.08;
      add("I LOVE YOU", score, 'phrase');
    }

    // "THUMBS UP / GOOD": Fist with thumb pointing straight up
    if (f.isThumbUp && f.isIndexCurled && f.isMiddleCurled && f.isRingCurled && f.isPinkyCurled && !f.isThumbFoldedAcross) {
      let score = 0.85;
      if (f.normDist(this.LM.THUMB_TIP, this.LM.INDEX_MCP) > 0.4) score += 0.10;
      add("GOOD", score, 'phrase');
    }

    // "PEACE": Peace sign ('V')
    if (f.isIndexExtended && f.isMiddleExtended && f.indexMiddleDist > 0.35 && f.isRingCurled && f.isPinkyCurled) {
      add("PEACE", 0.90, 'phrase');
    }

    // "HELLO": Open palm waving high, all 5 fingers extended and spread
    if (f.isIndexExtended && f.isMiddleExtended && f.isRingExtended && f.isPinkyExtended && f.isThumbExtended &&
        f.indexMiddleDist > 0.20 && f.middleRingDist > 0.20) {
      add("HELLO", 0.86, 'phrase');
    }

    // "SPACE": Flat horizontal hand
    if (f.isHandHorizontal && f.isIndexExtended && f.isMiddleExtended && f.isRingExtended && f.isPinkyExtended) {
      add("SPACE", 0.82, 'control');
    }

    // "BACKSPACE": Fist with thumb pointing horizontally backwards
    if (f.isHandHorizontal && f.isIndexCurled && f.isMiddleCurled && f.isRingCurled && f.isPinkyCurled && f.isThumbExtended) {
      add("BACKSPACE", 0.80, 'control');
    }

    // ==========================================
    // 2. ALPHABET: A to Z
    // ==========================================

    // Letter 'A': Fist with thumb resting alongside index finger pointing UP
    if (f.isIndexCurled && f.isMiddleCurled && f.isRingCurled && f.isPinkyCurled) {
      if (f.isThumbUp && !f.isThumbFoldedAcross && f.normDist(this.LM.THUMB_TIP, this.LM.INDEX_MCP) < 0.45) {
        add("A", 0.90, 'letter');
      }
    }

    // Letter 'B': Flat 4 fingers together pointing up, thumb folded across palm
    if (f.isIndexExtended && f.isMiddleExtended && f.isRingExtended && f.isPinkyExtended) {
      if (f.isThumbFoldedAcross && f.indexMiddleDist < 0.26 && f.middleRingDist < 0.26) {
        let score = 0.88;
        if (!f.isThumbExtended) score += 0.08;
        add("B", score, 'letter');
      }
    }

    // Letter 'C': Curved fingers forming a 'C'
    if (f.allFingersCurved && !f.isIndexCurled && !f.isIndexExtended) {
      const thumbToIndexGap = f.normDist(this.LM.THUMB_TIP, this.LM.INDEX_TIP);
      if (thumbToIndexGap > 0.35 && thumbToIndexGap < 0.85) {
        add("C", 0.86, 'letter');
      }
    }

    // Letter 'D': Index straight up, thumb touches middle & ring fingertips
    if (f.isIndexExtended && f.isPinkyCurled) {
      if ((f.pinchThumbMiddle < 0.35 || f.pinchThumbRing < 0.35) && !f.isMiddleExtended) {
        add("D", 0.89, 'letter');
      }
    }

    // Letter 'E': All fingers tightly curled with fingertips touching the thumb
    if (f.isIndexCurled && f.isMiddleCurled && f.isRingCurled && f.isPinkyCurled) {
      const tipsToThumb = (f.normDist(this.LM.INDEX_TIP, this.LM.THUMB_TIP) + f.normDist(this.LM.MIDDLE_TIP, this.LM.THUMB_TIP)) / 2;
      if (tipsToThumb < 0.38 && !f.isThumbUp) {
        add("E", 0.85, 'letter');
      }
    }

    // Letter 'F': Thumb and index form circle, middle, ring, pinky extended straight up
    if (f.pinchThumbIndex < 0.28 && f.isMiddleExtended && f.isRingExtended && f.isPinkyExtended) {
      let score = 0.92;
      add("F", score, 'letter');
    }

    // Letter 'G': Index extended horizontally, thumb parallel, others curled
    if (f.isHandHorizontal && f.isIndexExtended && f.isThumbExtended && f.isMiddleCurled && f.isRingCurled && f.isPinkyCurled) {
      add("G", 0.88, 'letter');
    }

    // Letter 'H': Index & Middle extended horizontally together, others curled
    if (f.isHandHorizontal && f.isIndexExtended && f.isMiddleExtended && f.indexMiddleDist < 0.25 && f.isRingCurled && f.isPinkyCurled) {
      add("H", 0.88, 'letter');
    }

    // Letter 'I': Pinky straight up, index, middle, ring curled, thumb folded
    if (f.isPinkyExtended && f.isIndexCurled && f.isMiddleCurled && f.isRingCurled && !f.isThumbExtended) {
      let score = 0.91;
      add("I", score, 'letter');
    }

    // Letter 'K': Index up, middle tilted forward, thumb placed between them
    if (f.isIndexExtended && f.isMiddleExtended && f.isRingCurled && f.isPinkyCurled) {
      if (f.normDist(this.LM.THUMB_TIP, this.LM.INDEX_MCP) < 0.45 && f.indexMiddleDist > 0.22 && f.indexMiddleDist < 0.45) {
        add("K", 0.82, 'letter');
      }
    }

    // Letter 'L': Index up, thumb extended sideways (90-degree 'L' shape)
    if (f.isIndexExtended && f.isThumbExtended && f.isMiddleCurled && f.isRingCurled && f.isPinkyCurled) {
      const thumbIndexAngle = this.angle(landmarks[this.LM.THUMB_TIP], landmarks[this.LM.THUMB_MCP], landmarks[this.LM.INDEX_TIP]);
      if (thumbIndexAngle > 40 && thumbIndexAngle < 140) {
        let score = 0.94;
        add("L", score, 'letter');
      }
    }

    // Letter 'O': All 4 fingertips touching thumb tip forming closed ring
    if (f.pinchThumbIndex < 0.32 && f.pinchThumbMiddle < 0.35 && f.pinchThumbRing < 0.40) {
      if (!f.isMiddleExtended && !f.isRingExtended && !f.isPinkyExtended) {
        add("O", 0.88, 'letter');
      }
    }

    // Letter 'P': Downward pointing 'K'
    if (f.isHandPointingDown && f.isIndexExtended && f.isMiddleExtended && f.isRingCurled && f.isPinkyCurled) {
      add("P", 0.84, 'letter');
    }

    // Letter 'Q': Downward pointing 'G'
    if (f.isHandPointingDown && f.isIndexExtended && f.isThumbExtended && f.isMiddleCurled && f.isPinkyCurled) {
      add("Q", 0.84, 'letter');
    }

    // Letter 'R': Index and Middle extended and crossed
    if (f.isIndexExtended && f.isMiddleExtended && f.isIndexCrossedOverMiddle && f.isRingCurled && f.isPinkyCurled) {
      add("R", 0.92, 'letter');
    }

    // Letter 'S': Fist with thumb wrapped across in front of fingers
    if (f.isIndexCurled && f.isMiddleCurled && f.isRingCurled && f.isPinkyCurled) {
      if (f.isThumbFoldedAcross && f.normDist(this.LM.THUMB_TIP, this.LM.MIDDLE_PIP) < 0.40 && !f.isThumbUp) {
        add("S", 0.87, 'letter');
      }
    }

    // Letter 'T': Fist with thumb tucked between index and middle
    if (f.isIndexCurled && f.isMiddleCurled && f.isRingCurled && f.isPinkyCurled) {
      const thumbToIndexPIP = f.normDist(this.LM.THUMB_TIP, this.LM.INDEX_PIP);
      if (thumbToIndexPIP < 0.32 && !f.isThumbUp && !f.isThumbFoldedAcross) {
        add("T", 0.80, 'letter');
      }
    }

    // Letter 'U': Index and Middle straight up, held touching together
    if (f.isIndexExtended && f.isMiddleExtended && f.indexMiddleDist <= 0.22 && f.isRingCurled && f.isPinkyCurled && !f.isIndexCrossedOverMiddle) {
      add("U", 0.89, 'letter');
    }

    // Letter 'V': Index and Middle straight up, spread apart in 'V'
    if (f.isIndexExtended && f.isMiddleExtended && f.indexMiddleDist > 0.28 && f.isRingCurled && f.isPinkyCurled) {
      add("V", 0.91, 'letter');
    }

    // Letter 'W': Index, Middle, Ring straight up and spread, Pinky curled
    if (f.isIndexExtended && f.isMiddleExtended && f.isRingExtended && f.isPinkyCurled) {
      add("W", 0.92, 'letter');
    }

    // Letter 'X': Index hooked, other fingers curled
    if (f.isIndexHooked && f.isMiddleCurled && f.isRingCurled && f.isPinkyCurled) {
      add("X", 0.84, 'letter');
    }

    // Letter 'Y': Thumb and Pinky extended outward, Middle 3 curled ("hang loose")
    if (f.isThumbExtended && f.isPinkyExtended && f.isIndexCurled && f.isMiddleCurled && f.isRingCurled) {
      add("Y", 0.93, 'letter');
    }

    // Letter 'M': Thumb tucked under 3 fingers
    if (f.isIndexCurled && f.isMiddleCurled && f.isRingCurled && f.isPinkyCurled) {
      if (f.normDist(this.LM.THUMB_TIP, this.LM.PINKY_MCP) < 0.38) {
        add("M", 0.78, 'letter');
      }
    }

    // Letter 'N': Thumb tucked under 2 fingers
    if (f.isIndexCurled && f.isMiddleCurled && f.isRingCurled && f.isPinkyCurled) {
      if (f.normDist(this.LM.THUMB_TIP, this.LM.RING_MCP) < 0.38 && f.normDist(this.LM.THUMB_TIP, this.LM.PINKY_MCP) >= 0.38) {
        add("N", 0.78, 'letter');
      }
    }

    // Sort candidates by confidence descending
    candidates.sort((a, b) => b.confidence - a.confidence);

    if (candidates.length === 0) {
      return null;
    }

    const top = candidates[0];
    return {
      sign: top.sign,
      confidence: top.confidence,
      type: top.type,
      candidates: candidates.slice(0, 3),
      features: f
    };
  }
}
