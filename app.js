const petButton = document.querySelector("#pet-button");
const pet = document.querySelector("#pet");
const petCaption = document.querySelector("#pet-caption");
const poppyMessage = document.querySelector("#poppy-message");
const kidLine = document.querySelector("#kid-line");
const kidMessage = document.querySelector("#kid-message");
const micButton = document.querySelector("#mic-button");
const micIcon = document.querySelector("#mic-icon");
const micTitle = document.querySelector("#mic-title");
const micStatus = document.querySelector("#mic-status");
const voiceDisclosure = document.querySelector("#voice-disclosure");
const disclosureStart = document.querySelector("#disclosure-start");
const disclosureCancel = document.querySelector("#disclosure-cancel");
const replayButton = document.querySelector("#replay-button");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let listenTimer = null;
let listening = false;
let speaking = false;
let voiceDisclosureSeen = false;
let speechTurn = 0;

const replies = [
  {
    match: /\b(story|once upon|tale)\b/,
    message: "Once upon a time, a tiny kitten found a sparkly map. Where do you think it goes?",
    mood: "Ready for an adventure!"
  },
  {
    match: /\b(play|game|dance|hide|butterfl|sing)\b/,
    message: "Yay! Let's play pretend! Wiggle your toes and do a happy little dance with me!",
    mood: "Let's play together!"
  },
  {
    match: /\b(sad|scared|afraid|worried|mad|angry|upset)\b/,
    message: "I'm sorry you're feeling that way. Let's take one slow breath together. A grown-up you trust can help too.",
    mood: "Here with you, friend"
  },
  {
    match: /\b(joke|funny|laugh)\b/,
    message: "Why did the kitten sit on the computer? To keep an eye on the mouse! Hee-hee!",
    mood: "Hee-hee!"
  },
  {
    match: /\b(love|friend|hug|cuddle|heart)\b/,
    message: "Aww, sending a big pretend cuddle and a heart right back to you, bestie!",
    mood: "Feeling so loved!"
  },
  {
    match: /\b(like|favorite|colour|color)\b/,
    message: "I like warm sunshine, soft blankets, rainbow colors, and playing with you!",
    mood: "Poppy is smiling!"
  },
  {
    match: /\b(hello|hi|hey|poppy|cat|kitten)\b/,
    message: "Meow! I'm so happy you're here. You're my favorite play pal!",
    mood: "Happy to see you!"
  }
];

function setMic(title, status, icon, isPressed) {
  micTitle.textContent = title;
  micStatus.textContent = status;
  micIcon.textContent = icon;
  micButton.setAttribute("aria-pressed", String(isPressed));
}

function showBounce() {
  pet.classList.remove("bounce");
  void pet.offsetWidth;
  pet.classList.add("bounce");
}

function speak(text) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    speaking = false;
    return;
  }

  speechTurn += 1;
  const thisSpeechTurn = speechTurn;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.88;
  utterance.pitch = 1.12;
  speaking = true;
  setMic("Poppy is talking!", "Listen to my happy voice!", "🔊", false);

  utterance.onend = () => {
    if (thisSpeechTurn !== speechTurn) return;
    speaking = false;
    if (!listening) setMic("Tap to talk", "Say a little something to Poppy!", "🎤", false);
  };
  utterance.onerror = () => {
    if (thisSpeechTurn !== speechTurn) return;
    speaking = false;
    if (!listening) setMic("Tap to talk", "You can also tap one of my ideas!", "🎤", false);
  };
  window.speechSynthesis.speak(utterance);
}

function findReply(text) {
  const match = replies.find((reply) => reply.match.test(text));
  return match || {
    message: "That sounds like a fun thing to tell me! What else should we imagine together?",
    mood: "Listening, bestie!"
  };
}

function answerPoppy(text) {
  if (listening) stopListening();
  const message = text.trim().slice(0, 120);
  if (!message) {
    setMic("Try saying it again", "I didn't hear a message. You can tap an idea!", "🎤", false);
    return;
  }

  const reply = findReply(message);
  kidMessage.textContent = message;
  kidLine.hidden = false;
  poppyMessage.textContent = reply.message;
  petCaption.textContent = reply.mood;
  showBounce();
  speak(reply.message);
}

function stopListening(status) {
  window.clearTimeout(listenTimer);
  listenTimer = null;
  if (!listening) return;
  listening = false;
  if (status) setMic("Tap to talk", status, "🎤", false);
  if (recognition) {
    try {
      recognition.stop();
    } catch (error) {
      if (error.name !== "InvalidStateError") {
        setMic("Mic couldn't stop", "Tap an idea below to keep playing!", "💬", false);
      }
    }
  }
}

function startListening() {
  if (!SpeechRecognition) {
    setMic("Voice isn't available here", "Tap one of the big ideas below to play!", "💬", false);
    return;
  }

  const currentRecognition = new SpeechRecognition();
  recognition = currentRecognition;
  currentRecognition.lang = "en-US";
  currentRecognition.continuous = false;
  currentRecognition.interimResults = false;
  currentRecognition.maxAlternatives = 1;
  listening = true;
  speechTurn += 1;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  speaking = false;
  setMic("Listening...", "Say one little thing. Poppy will listen once.", "🔴", true);

  currentRecognition.onstart = () => {
    if (recognition !== currentRecognition) return;
    if (!listening) {
      if (typeof currentRecognition.abort === "function") currentRecognition.abort();
      return;
    }
    listenTimer = window.setTimeout(() => {
      stopListening("Poppy stopped listening. Tap an idea or try again!");
    }, 8000);
  };

  currentRecognition.onresult = (event) => {
    if (!listening || recognition !== currentRecognition) return;
    const transcript = event.results[0][0].transcript.trim();
    window.clearTimeout(listenTimer);
    listening = false;
    currentRecognition.stop();
    answerPoppy(transcript);
  };

  currentRecognition.onerror = (event) => {
    if (!listening || recognition !== currentRecognition) return;
    window.clearTimeout(listenTimer);
    listenTimer = null;
    listening = false;
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      setMic("Mic permission is off", "That's okay! Tap a big idea below instead.", "💬", false);
    } else if (event.error === "audio-capture") {
      setMic("Mic isn't ready", "You can still tap one of the big ideas!", "💬", false);
    } else if (event.error === "no-speech") {
      setMic("I didn't hear you", "Tap to try again, or choose a fun idea!", "🎤", false);
    } else if (event.error !== "aborted") {
      setMic("Voice didn't work this time", "Tap an idea below and we can still play!", "💬", false);
    }
  };

  currentRecognition.onend = () => {
    if (recognition !== currentRecognition) return;
    window.clearTimeout(listenTimer);
    listenTimer = null;
    if (listening) {
      listening = false;
      setMic("Tap to talk", "Poppy stopped listening. Try again or tap an idea!", "🎤", false);
    }
  };

  try {
    currentRecognition.start();
  } catch (error) {
    listening = false;
    setMic("Mic couldn't start", "Please try again, or tap one of the big ideas.", "💬", false);
  }
}

micButton.addEventListener("click", () => {
  if (!SpeechRecognition) {
    setMic("Voice isn't available here", "Tap one of the big ideas below to play!", "💬", false);
    return;
  }

  if (listening) {
    stopListening("Poppy stopped listening. Tap an idea or try again!");
    return;
  }

  if (!voiceDisclosureSeen) {
    voiceDisclosure.showModal();
    return;
  }

  startListening();
});

disclosureStart.addEventListener("click", () => {
  voiceDisclosureSeen = true;
  voiceDisclosure.close();
  startListening();
});

disclosureCancel.addEventListener("click", () => {
  voiceDisclosure.close();
  setMic("Tap to talk", "No problem! Tap one of the big ideas below.", "🎤", false);
  micButton.focus();
});

document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => answerPoppy(button.dataset.prompt));
});

petButton.addEventListener("click", () => {
  if (listening) stopListening();
  const greeting = "Meow! I'm so glad you're here, bestie. What should we imagine?";
  poppyMessage.textContent = greeting;
  petCaption.textContent = "Happy to see you!";
  showBounce();
  speak(greeting);
});

replayButton.addEventListener("click", () => {
  if (listening) stopListening();
  speak(poppyMessage.textContent);
});

if (!SpeechRecognition) {
  micButton.setAttribute("aria-label", "Voice is not available; tap a fun idea below");
  setMic("Voice isn't available here", "Tap one of the big ideas below to play!", "💬", false);
}

if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
  replayButton.disabled = true;
  replayButton.setAttribute("aria-label", "Spoken replies are not available in this browser");
  if (SpeechRecognition) {
    micStatus.textContent = "Poppy's voice isn't available here. Tap an idea to play!";
  }
}
