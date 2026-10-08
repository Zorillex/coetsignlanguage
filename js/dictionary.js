// ASL Dictionary, Frequent Words, and Reference Guides
const ASL_DATA = {
  // Common ASL Vocabulary for next-word prediction & autocomplete
  dictionary: [
    "A", "ABOUT", "AFTER", "AGAIN", "ALL", "AND", "ARE", "ASL",
    "BE", "BEAUTIFUL", "BECAUSE", "BEFORE", "BEST", "BIG", "BOY", "BUSY",
    "CAN", "CANNOT", "CHILD", "COME", "COOL", "DAY", "DEAF", "DO",
    "EAT", "ENJOY", "FAMILY", "FAST", "FEEL", "FINE", "FOOD", "FOR", "FRIEND", "FROM",
    "GET", "GIRL", "GIVE", "GO", "GOOD", "GOODBYE", "GREAT",
    "HAPPY", "HAVE", "HE", "HEARING", "HELLO", "HELP", "HER", "HERE", "HIM", "HIS", "HOME", "HOW",
    "I", "IN", "IS", "IT", "KNOW", "LEARN", "LIKE", "LITTLE", "LOOK", "LOVE",
    "MAN", "MAYBE", "ME", "MEET", "MORE", "MORNING", "MOTHER", "MY", "NAME", "NEED", "NICE", "NIGHT", "NO", "NOT", "NOW",
    "OF", "OKAY", "OLD", "ON", "ONE", "OPEN", "OUR",
    "PEACE", "PEOPLE", "PLEASE", "READY", "REALLY", "REMEMBER", "RIGHT",
    "SAD", "SAY", "SCHOOL", "SEE", "SHE", "SIGN", "SLOW", "SMALL", "SOME", "SORRY", "START", "STOP",
    "THANK", "THANKS", "THAT", "THE", "THEIR", "THEM", "THEN", "THERE", "THEY", "THINK", "TIME", "TO", "TODAY", "TOMORROW",
    "UNDERSTAND", "UP", "US", "VERY", "WANT", "WATER", "WE", "WELCOME", "WELL", "WHAT", "WHEN", "WHERE", "WHICH", "WHO", "WHY", "WILL", "WITH", "WOMAN", "WORK", "WORLD",
    "YES", "YESTERDAY", "YOU", "YOUR"
  ],

  // Reference guide data for A-Z and Phrases
  signs: {
    "A": {
      name: "A",
      type: "letter",
      description: "Make a closed fist with your thumb straight up resting tightly against the side of your index finger.",
      tips: "Keep knuckles facing front, thumb pointing upward.",
      difficulty: "Easy"
    },
    "B": {
      name: "B",
      type: "letter",
      description: "Hold your four fingers flat and straight up together, with your thumb tucked across your palm.",
      tips: "Keep all 4 fingers touching closely.",
      difficulty: "Easy"
    },
    "C": {
      name: "C",
      type: "letter",
      description: "Curve all four fingers and thumb together to form the shape of the letter 'C'.",
      tips: "Palm faces outward sideways or toward camera.",
      difficulty: "Easy"
    },
    "D": {
      name: "D",
      type: "letter",
      description: "Point your index finger straight up. Touch your thumb to your middle, ring, and pinky tips to form an 'O'.",
      tips: "Only the index finger stays upright.",
      difficulty: "Medium"
    },
    "E": {
      name: "E",
      type: "letter",
      description: "Curl all fingers down tightly toward the palm, resting the tips of your fingers on your thumb.",
      tips: "Tuck thumb tightly underneath curled fingertips.",
      difficulty: "Medium"
    },
    "F": {
      name: "F",
      type: "letter",
      description: "Touch the tip of your thumb and index finger together in a circle; keep middle, ring, and pinky straight up.",
      tips: "Same as the 'OK' hand gesture.",
      difficulty: "Easy"
    },
    "G": {
      name: "G",
      type: "letter",
      description: "Extend index finger and thumb horizontally parallel, with other fingers curled into palm.",
      tips: "Turn hand sideways so index points forward/left.",
      difficulty: "Medium"
    },
    "H": {
      name: "H",
      type: "letter",
      description: "Extend index and middle fingers together horizontally parallel, thumb resting alongside.",
      tips: "Fingers point sideways together.",
      difficulty: "Medium"
    },
    "I": {
      name: "I",
      type: "letter",
      description: "Hold up only your pinky finger straight; curl index, middle, ring into a fist, thumb over them.",
      tips: "Pinky points straight up to ceiling.",
      difficulty: "Easy"
    },
    "J": {
      name: "J",
      type: "letter",
      description: "Start with 'I' (pinky up) and trace the letter 'J' in the air by curving your pinky downward.",
      tips: "Fluid swooping motion.",
      difficulty: "Medium"
    },
    "K": {
      name: "K",
      type: "letter",
      description: "Extend index finger straight up, middle finger angled slightly forward, with thumb resting between them.",
      tips: "Similar to a peace sign with thumb between fingers.",
      difficulty: "Hard"
    },
    "L": {
      name: "L",
      type: "letter",
      description: "Extend your index finger straight up and thumb straight out horizontally to make an 'L' shape.",
      tips: "90-degree angle between thumb and index.",
      difficulty: "Easy"
    },
    "M": {
      name: "M",
      type: "letter",
      description: "Tuck thumb under index, middle, and ring fingers so three fingers rest over thumb.",
      tips: "Thumb tip shows between ring and pinky.",
      difficulty: "Hard"
    },
    "N": {
      name: "N",
      type: "letter",
      description: "Tuck thumb under index and middle fingers so two fingers rest over thumb.",
      tips: "Thumb tip shows between middle and ring.",
      difficulty: "Hard"
    },
    "O": {
      name: "O",
      type: "letter",
      description: "Curve all four fingers and touch their tips to the thumb tip, forming a complete circle/oval.",
      tips: "Looks like an 'O' from the front.",
      difficulty: "Easy"
    },
    "P": {
      name: "P",
      type: "letter",
      description: "Make a 'K' handshape, but point your wrist and fingers downwards toward the floor.",
      tips: "Index points horizontal/down, middle points straight down.",
      difficulty: "Hard"
    },
    "Q": {
      name: "Q",
      type: "letter",
      description: "Make a 'G' handshape, but point your fingers downward toward the floor.",
      tips: "Index and thumb pointing downward.",
      difficulty: "Hard"
    },
    "R": {
      name: "R",
      type: "letter",
      description: "Extend index and middle fingers straight up and cross middle over index finger.",
      tips: "Like crossing your fingers for good luck.",
      difficulty: "Medium"
    },
    "S": {
      name: "S",
      type: "letter",
      description: "Make a tight fist with thumb crossed directly over the front of the curled fingers.",
      tips: "Thumb wraps across index and middle knuckles.",
      difficulty: "Easy"
    },
    "T": {
      name: "T",
      type: "letter",
      description: "Make a fist with thumb tucked between index and middle fingers.",
      tips: "Thumb tip pokes out between index and middle.",
      difficulty: "Medium"
    },
    "U": {
      name: "U",
      type: "letter",
      description: "Extend index and middle fingers straight up together (touching). Ring, pinky, and thumb curled.",
      tips: "Keep index and middle fingers tightly touching.",
      difficulty: "Easy"
    },
    "V": {
      name: "V",
      type: "letter",
      description: "Extend index and middle fingers straight up spread apart in a 'V' shape (peace sign).",
      tips: "Spread fingers wide apart in a V.",
      difficulty: "Easy"
    },
    "W": {
      name: "W",
      type: "letter",
      description: "Extend index, middle, and ring fingers straight up and spread apart in a 'W' shape.",
      tips: "Pinky is held down by thumb.",
      difficulty: "Easy"
    },
    "X": {
      name: "X",
      type: "letter",
      description: "Extend index finger and bend its first joint to form a hook. Other fingers curled into a fist.",
      tips: "Like Captain Hook's finger.",
      difficulty: "Medium"
    },
    "Y": {
      name: "Y",
      type: "letter",
      description: "Extend thumb and pinky outwards while curling index, middle, and ring into palm.",
      tips: "Also known as the 'Hang Loose' or 'Shaka' sign.",
      difficulty: "Easy"
    },
    "Z": {
      name: "Z",
      type: "letter",
      description: "Extend index finger and trace the letter 'Z' in the air.",
      tips: "Dynamic sign tracing a zigzag.",
      difficulty: "Medium"
    },
    // Common Words & Gestures
    "I LOVE YOU": {
      name: "I LOVE YOU",
      type: "phrase",
      description: "Extend your thumb, index finger, and pinky finger straight out. Curl your middle and ring fingers down.",
      tips: "Combines letters I, L, and Y into one iconic sign.",
      difficulty: "Easy"
    },
    "HELLO": {
      name: "HELLO",
      type: "phrase",
      description: "Open flat hand with all 5 fingers extended, palm facing forward, slight wave.",
      tips: "Friendly open palm raised up.",
      difficulty: "Easy"
    },
    "THANK YOU": {
      name: "THANK YOU",
      type: "phrase",
      description: "Flat hand with fingers together, moving smoothly forward from your chin outward toward the camera.",
      tips: "Palm faces slightly upward/inward.",
      difficulty: "Easy"
    },
    "YES": {
      name: "YES",
      type: "phrase",
      description: "Make an 'S' fist and nod it up and down like a head nodding yes.",
      tips: "Quick nodding fist movement.",
      difficulty: "Easy"
    },
    "NO": {
      name: "NO",
      type: "phrase",
      description: "Snap index and middle fingers down together onto the thumb.",
      tips: "Like a bird's beak snapping shut.",
      difficulty: "Easy"
    },
    "GOOD / THUMBS UP": {
      name: "GOOD / THUMBS UP",
      type: "phrase",
      description: "Closed fist with thumb extended straight upward.",
      tips: "Universal thumbs-up gesture.",
      difficulty: "Easy"
    },
    "PEACE": {
      name: "PEACE",
      type: "phrase",
      description: "Index and middle fingers extended up in a wide 'V' shape.",
      tips: "Iconic peace sign.",
      difficulty: "Easy"
    },
    "HELP": {
      name: "HELP",
      type: "phrase",
      description: "Place a closed fist with thumb up on top of a flat open palm, moving upward together.",
      tips: "Symbolizes lifting someone up.",
      difficulty: "Medium"
    },
    "SPACE": {
      name: "SPACE",
      type: "control",
      description: "Horizontal flat open hand swept rightward across the screen.",
      tips: "Inserts a space between words in the converter.",
      difficulty: "Easy"
    },
    "BACKSPACE": {
      name: "BACKSPACE",
      type: "control",
      description: "Thumb extended pointing left with fist, or quick leftward gesture.",
      tips: "Deletes the last character from your text.",
      difficulty: "Easy"
    }
  }
};

// Autocomplete helper function
function getWordSuggestions(prefix, maxResults = 5) {
  if (!prefix || prefix.length === 0) return [];
  const upper = prefix.toUpperCase();
  const matches = ASL_DATA.dictionary.filter(word => word.startsWith(upper) && word !== upper);
  return matches.slice(0, maxResults);
}
