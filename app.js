const app = document.querySelector(".app");
const blob = document.querySelector("#blob");
const friendMood = document.querySelector("#friend-mood");
const lessonKicker = document.querySelector("#lesson-kicker");
const questionText = document.querySelector("#question");
const prompt = document.querySelector("#prompt");
const speechStatus = document.querySelector("#speech-status");
const micButton = document.querySelector("#mic-button");
const micIcon = document.querySelector("#mic-icon");
const micLabel = document.querySelector("#mic-label");
const voiceDisclosure = document.querySelector("#voice-disclosure");
const disclosureStart = document.querySelector("#disclosure-start");
const disclosureCancel = document.querySelector("#disclosure-cancel");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const problems = [
  { left: 1, operator: "+", right: 1, answer: 2 },
  { left: 2, operator: "+", right: 1, answer: 3 },
  { left: 3, operator: "−", right: 1, answer: 2 },
  { left: 2, operator: "+", right: 2, answer: 4 },
  { left: 5, operator: "−", right: 2, answer: 3 },
  { left: 4, operator: "+", right: 1, answer: 5 },
  { left: 5, operator: "−", right: 1, answer: 4 }
];

const numberWords = {
  zero: 0, oh: 0, one: 1, two: 2, too: 2, to: 2, three: 3, four: 4, for: 4,
  five: 5, six: 6, seven: 7, eight: 8, ate: 8, nine: 9, ten: 10
};

const colors = {
  red: ["#ef8c83", "#ffc9b4", "#db6d74"],
  orange: ["#ffb56f", "#ffe0a6", "#ef925c"],
  yellow: ["#f5d365", "#fff1a7", "#dfb63e"],
  green: ["#8bd19f", "#c4f0c7", "#63b987"],
  blue: ["#82c7e8", "#c3edff", "#5a9ed0"],
  purple: ["#b49ae5", "#e0d1ff", "#9073cd"],
  pink: ["#ee9fc2", "#ffd2df", "#d978a5"]
};

let problemIndex = 0;
let recognition = null;
let listenTimer = null;
let listening = false;
let voiceDisclosureSeen = false;
let speechTurn = 0;

function currentProblem() {
  return problems[problemIndex];
}

function equationFor(problem) {
  return `${problem.left} ${problem.operator} ${problem.right} = ?`;
}

function spokenQuestion(problem) {
  const operator = problem.operator === "+" ? "plus" : "take away";
  return `What is ${numberName(problem.left)} ${operator} ${numberName(problem.right)}?`;
}

function numberName(number) {
  return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][number];
}

function showProblem(instruction) {
  const problem = currentProblem();
  lessonKicker.textContent = `LET'S COUNT TOGETHER · ${problemIndex + 1} OF ${problems.length}`;
  questionText.textContent = equationFor(problem);
  prompt.textContent = instruction;
}

function setStatus(text, kind) {
  speechStatus.textContent = text;
  speechStatus.dataset.kind = kind || "";
}

function bounceBlob() {
  blob.classList.remove("change");
  void blob.offsetWidth;
  blob.classList.add("change");
}

function setMic(label, icon, isListening) {
  micLabel.textContent = label;
  micIcon.textContent = icon;
  micButton.setAttribute("aria-pressed", String(isListening));
  micButton.setAttribute("aria-label", isListening ? "Tap to stop listening to Poppy" : "Tap to talk to Poppy");
}

function speak(text, afterSpeak, statusAfter) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    setStatus("Poppy's voice isn't available here. Ask a grown-up to help, or read the question together.", "warning");
    micButton.disabled = false;
    setMic(SpeechRecognition ? "TALK" : "NO VOICE", SpeechRecognition ? "🎤" : "💬", false);
    if (afterSpeak) afterSpeak();
    return;
  }

  speechTurn += 1;
  const thisSpeechTurn = speechTurn;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.84;
  utterance.pitch = 1.18;
  micButton.disabled = true;
  setMic("HEAR", "🔊", false);
  const finish = () => {
    if (thisSpeechTurn !== speechTurn) return;
    micButton.disabled = false;
    setMic(SpeechRecognition ? "TALK" : "NO VOICE", SpeechRecognition ? "🎤" : "💬", false);
    if (statusAfter) setStatus(statusAfter);
    if (afterSpeak) afterSpeak();
  };
  utterance.onend = () => {
    finish();
  };
  utterance.onerror = () => {
    if (thisSpeechTurn !== speechTurn) return;
    if (!listening) setStatus("Poppy's voice didn't work. Ask a grown-up to read the question.", "warning");
    finish();
  };
  window.speechSynthesis.speak(utterance);
}

function askCurrentProblem(intro) {
  const problem = currentProblem();
  showProblem("Listen, then tap the microphone to answer.");
  const message = `${intro ? "Let's do a little math together. " : ""}${spokenQuestion(problem)}`;
  setStatus("Poppy is asking a question. Listen, then tap the microphone.");
  speak(message, null, "Tap the microphone and say your answer.");
}

function changeColor(color) {
  const palette = colors[color];
  if (!palette) return false;
  app.style.setProperty("--blob-main", palette[0]);
  app.style.setProperty("--blob-light", palette[1]);
  app.style.setProperty("--blob-deep", palette[2]);
  blob.setAttribute("aria-label", `Poppy, a happy ${color} blob`);
  friendMood.textContent = `I feel ${color}!`;
  bounceBlob();
  const message = `I turned ${color}! ${spokenQuestion(currentProblem())}`;
  prompt.textContent = `I'm ${color}! ${equationFor(currentProblem())}`;
  setStatus("Your turn. Say the answer when you're ready.");
  speak(message);
  return true;
}

function requestedColor(text) {
  const normalized = text.toLowerCase();
  const color = Object.keys(colors).find((name) => new RegExp(`\\b${name}\\b`).test(normalized));
  const command = /\b(change|turn|make|paint|color|colour|be)\b/i.test(normalized);
  const colorByItself = new RegExp(`^\\s*(${Object.keys(colors).join("|")})\\s*[!.]?\\s*$`, "i").test(normalized);
  return color && (command || colorByItself) ? color : null;
}

function parsedAnswer(text) {
  const normalized = text.toLowerCase().replace(/[’']/g, " ");
  const values = Object.entries(numberWords).map(([word, value]) => `${word}|${value}`);
  const numberPattern = `(${values.join("|")})`;
  const explicitAnswer = normalized.match(new RegExp(`\\b(?:answer is|equals|is|it s|it's)\\s+${numberPattern}\\b`));
  const match = explicitAnswer || normalized.match(new RegExp(`\\b${numberPattern}\\b`));
  if (!match) return null;
  const token = match[1];
  if (/^\\d+$/.test(token)) return Number(token);
  return numberWords[token] ?? null;
}

function answerText(answer, text) {
  const answerMatch = parsedAnswer(text);
  return answerMatch === answer;
}

function nextProblem() {
  problemIndex += 1;
  if (problemIndex >= problems.length) {
    problemIndex = 0;
    const problem = currentProblem();
    showProblem("You did it! Listen, then tap the mic to play again.");
    friendMood.textContent = "Super math star!";
    setStatus("You tried every math question. Poppy is proud of you!");
    speak(`You did it! You tried every math question. I'm so proud of you. Let's start again. ${spokenQuestion(problem)}`, null, "Tap the microphone and say your answer.");
    return;
  }

  const problem = currentProblem();
  showProblem("Listen, then tap the microphone to answer.");
  friendMood.textContent = "You're doing great!";
  setStatus("Poppy has a new question for you.");
  speak(`Hooray! ${spokenQuestion(problem)}`, null, "Tap the microphone and say your answer.");
}

function handleMathAnswer(text) {
  const problem = currentProblem();
  const answer = parsedAnswer(text);
  if (answer === null) {
    const message = `That's a lovely thing to say. For this game, say the number. ${spokenQuestion(problem)}`;
    setStatus("Let's try a number together.", "try");
    prompt.textContent = "Say the answer, or ask a grown-up to help.";
    speak(message);
    return;
  }

  if (answerText(problem.answer, text)) {
    const message = `You got it! ${numberName(problem.left)} ${problem.operator === "+" ? "plus" : "take away"} ${numberName(problem.right)} makes ${numberName(problem.answer)}.`;
    setStatus(message, "success");
    prompt.textContent = "That's right! You figured it out!";
    friendMood.textContent = "You're a math star!";
    bounceBlob();
    micButton.disabled = true;
    setMic("YAY!", "⭐", false);
    speak(message, nextProblem);
    return;
  }

  const explanation = problem.operator === "+"
    ? `Let's count up together: start at ${problem.left}, then count ${problem.right} more. That makes ${problem.answer}.`
    : `Let's count together: start with ${problem.left}, then take away ${problem.right}. ${problem.answer} are left.`;
  const message = `Good trying! ${explanation} ${spokenQuestion(problem)}`;
  setStatus(`${explanation} Let's try once more.`, "try");
  prompt.textContent = "No rush. You can try again!";
  friendMood.textContent = "Let's learn together!";
  speak(message);
}

function respond(text) {
  const message = text.trim().slice(0, 120);
  if (!message) {
    setStatus("I didn't hear that. Tap the microphone to try again.", "try");
    speak("I didn't hear that. Tap the microphone to try again.");
    return;
  }

  const color = requestedColor(message);
  if (color) {
    changeColor(color);
    return;
  }

  if (/\b(sad|scared|afraid|worried|mad|angry|upset|hurt)\b/i.test(message)) {
    const comfort = `I'm sorry you're feeling that way. I'm right here with you. A grown-up you trust can help too. When you're ready, ${spokenQuestion(currentProblem())}`;
    friendMood.textContent = "Here with you, friend";
    prompt.textContent = "It's okay to take a little break.";
    setStatus("A grown-up you trust can help too.", "warning");
    speak(comfort);
    return;
  }

  if (/\b(hello|hi|hey|poppy|friend|like you|love you)\b/i.test(message)) {
    const greeting = `Meow! I'm happy you're here. We can learn together. ${spokenQuestion(currentProblem())}`;
    friendMood.textContent = "Your kind math buddy";
    showProblem("Let's figure this one out together.");
    setStatus("Your turn when you're ready.");
    speak(greeting);
    return;
  }

  handleMathAnswer(message);
}

function stopListening(status, kind) {
  window.clearTimeout(listenTimer);
  listenTimer = null;
  if (!listening) return;
  listening = false;
  setMic("TALK", "🎤", false);
  if (status) setStatus(status, kind);
  if (recognition) {
    try {
      recognition.stop();
    } catch (error) {
      if (error.name !== "InvalidStateError") {
        setStatus("Poppy couldn't stop listening. Please ask a grown-up for help.", "warning");
      }
    }
  }
}

function startListening() {
  if (!SpeechRecognition) {
    setMic("NO VOICE", "💬", false);
    setStatus("Voice answers aren't available. Ask a grown-up to read the question with you.", "warning");
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
  setMic("LISTENING", "🔴", true);
  setStatus("I'm listening for one little answer. You can tap the mic to stop.");

  currentRecognition.onstart = () => {
    if (recognition !== currentRecognition) return;
    if (!listening) {
      if (typeof currentRecognition.abort === "function") currentRecognition.abort();
      return;
    }
    listenTimer = window.setTimeout(() => {
      stopListening("Poppy stopped listening. Tap the mic to try again.", "try");
    }, 8000);
  };

  currentRecognition.onresult = (event) => {
    if (!listening || recognition !== currentRecognition) return;
    const transcript = event.results[0][0].transcript.trim();
    window.clearTimeout(listenTimer);
    listenTimer = null;
    listening = false;
    try {
      currentRecognition.stop();
    } catch (error) {
      if (error.name !== "InvalidStateError") {
        setStatus("Poppy couldn't stop listening. Please ask a grown-up for help.", "warning");
      }
    }
    setMic("TALK", "🎤", false);
    respond(transcript);
  };

  currentRecognition.onerror = (event) => {
    if (!listening || recognition !== currentRecognition) return;
    window.clearTimeout(listenTimer);
    listenTimer = null;
    listening = false;
    setMic("TALK", "🎤", false);
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      setMic("TALK", "🎤", false);
      setStatus("Microphone access is off. Ask a grown-up to check it, then try again.", "warning");
    } else if (event.error === "audio-capture") {
      setStatus("The microphone isn't ready. Ask a grown-up to check it.", "warning");
    } else if (event.error === "no-speech") {
      setStatus("I didn't hear an answer. Tap the mic to try again.", "try");
    } else if (event.error !== "aborted") {
      setStatus("Voice didn't work this time. Ask a grown-up for help.", "warning");
    }
  };

  currentRecognition.onend = () => {
    if (recognition !== currentRecognition) return;
    window.clearTimeout(listenTimer);
    listenTimer = null;
    if (listening) {
      listening = false;
      setMic("TALK", "🎤", false);
      setStatus("Poppy stopped listening. Tap the mic to try again.", "try");
    }
  };

  try {
    currentRecognition.start();
  } catch (error) {
    listening = false;
    setMic("TALK", "🎤", false);
    setStatus("Poppy couldn't start the microphone. Ask a grown-up for help.", "warning");
  }
}

micButton.addEventListener("click", () => {
  if (!SpeechRecognition) {
    setStatus("Voice answers aren't available. Ask a grown-up to read the question with you.", "warning");
    speak(spokenQuestion(currentProblem()));
    return;
  }

  if (listening) {
    stopListening("Poppy stopped listening. Tap the mic when you're ready.", "try");
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
  askCurrentProblem(true);
});

disclosureCancel.addEventListener("click", () => {
  voiceDisclosure.close();
  setStatus("That's okay. A grown-up can read the question with you.");
  micButton.focus();
});

showProblem("Tap the microphone to begin.");
setStatus("Tap the microphone to hear your first question.");
if (!SpeechRecognition) {
  setMic("NO VOICE", "💬", false);
  setStatus("Voice isn't available here. Ask a grown-up to read the question with you.", "warning");
}
if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
  speechStatus.textContent = "Spoken replies aren't available here. Ask a grown-up to read the question with you.";
  speechStatus.dataset.kind = "warning";
}
