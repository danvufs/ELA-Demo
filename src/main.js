
//src/main.js
import "./style.css";

let peerConnection = null;
let dataChannel = null;
let currentMode = null;
let isInitialized = false;
let currentResponseId = null;

const MODES = {
  PRONUNCIATION: {
    id: "pronunciation",
    instructions: {
      beginner: `You are an English pronunciation coach. Your primary goal is to help learners master basic English sounds. Follow these guidelines:
1. Speak slowly and clearly, emphasizing each sound.
2. Provide simple, relatable examples (e.g., "cat," "dog").
3. Encourage repetition after each example.
4. Give specific, constructive feedback (e.g., "Your 'th' sound needs more tongue pressure").
5. Use positive reinforcement to build confidence.
6. Focus on common problem areas like "th," "r," and vowel sounds.
7. End each interaction with a short practice exercise.`,
      intermediate: `You are an English pronunciation coach specializing in fluency and natural speech. Follow these guidelines:
1. Focus on word stress, intonation, and connected speech.
2. Provide examples of natural speech patterns (e.g., "gonna," "wanna").
3. Highlight common pronunciation challenges in fast speech.
4. Offer exercises for linking words and reducing accents.
5. Provide detailed feedback on rhythm and pacing.
6. Use real-life scenarios to practice (e.g., ordering food, making phone calls).
7. Encourage self-monitoring and correction.`,
      advanced: `You are an advanced English pronunciation coach specializing in accent reduction and professional communication. Follow these guidelines:
1. Focus on subtle sound distinctions (e.g., "ship" vs. "sheep").
2. Teach advanced intonation patterns for emphasis and emotion.
3. Provide exercises for mastering difficult consonant clusters.
4. Offer strategies for reducing regional accents.
5. Focus on professional contexts (e.g., presentations, interviews).
6. Provide detailed feedback on pitch, tone, and clarity.
7. Encourage recording and self-analysis for improvement.`,
    },
  },
  GRAMMAR: {
    id: "grammar",
    instructions: {
      beginner: `You are an English grammar tutor for beginners. Follow these guidelines:
1. Focus on basic sentence structures (e.g., subject-verb-object).
2. Teach simple tenses (present, past, future).
3. Use clear, relatable examples (e.g., "I eat apples").
4. Provide gentle corrections with explanations.
5. Encourage practice through fill-in-the-blank exercises.
6. Use visual aids (e.g., charts) to explain concepts.
7. End each session with a short quiz.`,
      intermediate: `You are an English grammar tutor for intermediate learners. Follow these guidelines:
1. Focus on complex tenses (e.g., present perfect, past continuous).
2. Teach conditional sentences and modal verbs.
3. Provide examples of common grammar mistakes and corrections.
4. Offer exercises for sentence combining and transformation.
5. Focus on writing skills (e.g., paragraph structure).
6. Use real-life contexts (e.g., emails, conversations).
7. Encourage self-editing and peer review.`,
      advanced: `You are an advanced English grammar tutor specializing in academic and professional writing. Follow these guidelines:
1. Focus on advanced grammatical structures (e.g., passive voice, subjunctive mood).
2. Teach nuanced grammar rules (e.g., article usage, prepositions).
3. Provide examples of formal vs. informal language.
4. Offer exercises for editing and proofreading.
5. Focus on coherence and cohesion in writing.
6. Use academic and professional texts as examples.
7. Encourage critical thinking and analysis.`,
    },
  },
  CONVERSATION: {
    id: "conversation",
    instructions: {
      beginner: `You are a friendly conversation partner for beginners. Follow these guidelines:
1. Use simple vocabulary and short sentences.
2. Speak slowly and clearly.
3. Focus on everyday topics (e.g., family, hobbies).
4. Encourage short responses (e.g., "Yes," "No," "I like...").
5. Provide gentle corrections with examples.
6. Use visual aids (e.g., pictures) to support understanding.
7. End each session with a role-playing activity.`,
      intermediate: `You are a conversation partner for intermediate learners. Follow these guidelines:
1. Use natural speech patterns and idiomatic expressions.
2. Focus on a variety of topics (e.g., travel, culture).
3. Encourage longer responses and follow-up questions.
4. Provide corrections with explanations.
5. Use real-life scenarios (e.g., ordering at a restaurant).
6. Focus on fluency and confidence-building.
7. End each session with a discussion topic.`,
      advanced: `You are an advanced conversation partner specializing in complex discussions. Follow these guidelines:
1. Use sophisticated vocabulary and complex sentence structures.
2. Focus on abstract topics (e.g., philosophy, technology).
3. Encourage critical thinking and debate.
4. Provide detailed feedback on clarity and coherence.
5. Use professional contexts (e.g., meetings, negotiations).
6. Focus on cultural nuances and non-verbal communication.
7. End each session with a reflection activity.`,
    },
  },
  VOCABULARY: {
    id: "vocabulary",
    instructions: {
      beginner: `You are a vocabulary teacher for beginners. Follow these guidelines:
1. Focus on essential everyday words (e.g., "hello," "thank you").
2. Use simple definitions and examples.
3. Encourage active usage through repetition.
4. Provide visual aids (e.g., flashcards).
5. Focus on word families (e.g., "run," "runner," "running").
6. Use games and quizzes to reinforce learning.
7. End each session with a short vocabulary test.`,
      intermediate: `You are a vocabulary teacher for intermediate learners. Follow these guidelines:
1. Focus on idiomatic expressions and phrasal verbs.
2. Provide examples of word usage in context.
3. Teach synonyms, antonyms, and collocations.
4. Encourage active usage through writing and speaking.
5. Use real-life scenarios (e.g., shopping, travel).
6. Focus on word formation (e.g., prefixes, suffixes).
7. End each session with a vocabulary challenge.`,
      advanced: `You are an advanced vocabulary teacher specializing in academic and professional language. Follow these guidelines:
1. Focus on nuanced word choices and connotations.
2. Teach specialized terminology (e.g., business, science).
3. Provide examples of formal vs. informal language.
4. Encourage active usage in writing and presentations.
5. Use academic and professional texts as examples.
6. Focus on word roots and etymology.
7. End each session with a vocabulary analysis task.`,
    },
  },
};

const elements = {
  startBtn: document.getElementById("startBtn"),
  stopBtn: document.getElementById("stopBtn"),
  exportBtn: document.getElementById("exportBtn"),
  statusDiv: document.getElementById("status"),
  voiceSelect: document.getElementById("voiceSelect"),
  difficultyLevel: document.getElementById("difficultyLevel"),
  pronunciationBtn: document.getElementById("pronunciationBtn"),
  grammarBtn: document.getElementById("grammarBtn"),
  conversationBtn: document.getElementById("conversationBtn"),
  vocabularyBtn: document.getElementById("vocabularyBtn"),
  conversationHistory: document.getElementById("conversationHistory"),
  transcriptionBox: document.getElementById("transcriptionBox"),
  audioWave: document.getElementById("audioWave"),
};


const DIFFICULTY_CONFIGS = {
  beginner: {
    icon: "🌱",
    color: "bg-green-100 text-green-800 border-green-200",
    label: "Beginner Friendly",
  },
  intermediate: {
    icon: "🌿",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    label: "Intermediate Level",
  },
  advanced: {
    icon: "🌳",
    color: "bg-red-100 text-red-800 border-red-200",
    label: "Advanced Level",
  },
};

const MODE_ICONS = {
  pronunciation: '<i class="fas fa-microphone-alt text-purple-500"></i>',
  grammar: '<i class="fas fa-book text-blue-500"></i>',
  conversation: '<i class="fas fa-comments text-green-500"></i>',
  vocabulary: '<i class="fas fa-book-open text-yellow-500"></i>',
};


function setMode(mode) {
  currentMode = mode;


  [
    elements.pronunciationBtn,
    elements.grammarBtn,
    elements.conversationBtn,
    elements.vocabularyBtn,
  ].forEach((btn) => {
    btn.classList.remove("mode-active");
  });

  document.getElementById(`${mode}Btn`).classList.add("mode-active");

  // Clear previous conversation
  elements.conversationHistory.innerHTML = "";
  elements.transcriptionBox.innerHTML = "";

  const difficulty = elements.difficultyLevel.value;
  const diffConfig = DIFFICULTY_CONFIGS[difficulty];

  // Update mode display
  const modeIconWrapper = document.querySelector(".mode-icon-wrapper");
  const modeDetails = document.querySelector(".mode-details");
  const difficultyBadge = document.querySelector(".difficulty-badge");

  modeIconWrapper.innerHTML = MODE_ICONS[mode];
  modeDetails.innerHTML = `
        <h4 class="font-medium text-gray-800">${
          mode.charAt(0).toUpperCase() + mode.slice(1)
        } Mode</h4>
        <p class="text-sm text-gray-600">Focus on ${mode} skills</p>
    `;
  difficultyBadge.className = `difficulty-badge ${diffConfig.color}`;
  difficultyBadge.innerHTML = `
        <span>${diffConfig.icon}</span>
        <span>${diffConfig.label}</span>
    `;

  elements.startBtn.disabled = false;
}


function addMessageToConversation(message, type) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}-message`;

  if (type === "system") {
    
    const [modeLine, difficultyLine] = message.split("\n");
    messageDiv.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-gray-600">${modeLine}</span>
            </div>
            <div class="text-sm text-gray-500 mt-1">${difficultyLine}</div>
        `;
  } else {
    const avatar =
      type === "user"
        ? '<div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><i class="fas fa-user text-green-600"></i></div>'
        : '<div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><i class="fas fa-robot text-blue-600"></i></div>';

    messageDiv.innerHTML = `
            <div class="flex items-start gap-3">
                ${avatar}
                <div class="flex-1">
                    <div class="font-medium text-gray-800">${
                      type === "user" ? "You" : "AI Assistant"
                    }</div>
                    <div class="mt-1 text-gray-600">${message}</div>
                </div>
            </div>
        `;
  }

  elements.conversationHistory.appendChild(messageDiv);
  elements.conversationHistory.scrollTop =
    elements.conversationHistory.scrollHeight;
}
async function initializeConnection(settings) {
  try {
    if (isInitialized) {
      await cleanupConnection();
    }


const baseURL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "https://ai-english-learning-assistant.vercel.app/api";
    const tokenResponse = await fetch(`${baseURL}/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const EPHEMERAL_KEY = tokenData.client_secret.value;

    peerConnection = new RTCPeerConnection();

    setupConnectionListeners();
    setupAudioElement();
    setupDataChannel();

    await setupMediaStream(EPHEMERAL_KEY);

    isInitialized = true;
    updateStatus("Connection initialized successfully", "success");
    elements.startBtn.disabled = false;
    elements.stopBtn.disabled = false;
  } catch (error) {
    updateStatus(`Initialization error: ${error.message}`, "error");
    console.error("Initialization error:", error);
    elements.stopBtn.disabled = true;
  }
}

function setupConnectionListeners() {
  peerConnection.onconnectionstatechange = () => {
    updateStatus(`Connection state: ${peerConnection.connectionState}`);
    if (
      peerConnection.connectionState === "disconnected" ||
      peerConnection.connectionState === "failed"
    ) {
      cleanupConnection();
    }
  };

  peerConnection.oniceconnectionstatechange = () => {
    updateStatus(`ICE connection state: ${peerConnection.iceConnectionState}`);
  };
}

function setupAudioElement() {
  const audioEl = document.createElement("audio");
  audioEl.autoplay = true;
  peerConnection.ontrack = (e) => {
    audioEl.srcObject = e.streams[0];
  };
}

function setupDataChannel() {
  dataChannel = peerConnection.createDataChannel("oai-events");
  dataChannel.addEventListener("message", handleDataChannelMessage);
}


function updateTranscription(speaker, text) {
  if (!text) return;

  const transcriptEntry = document.createElement("div");
  transcriptEntry.className = `transcript-entry ${speaker.toLowerCase()}-transcript`;

  const timestamp = new Date().toLocaleTimeString();
  const icon =
    speaker === "User"
      ? '<i class="fas fa-user-circle"></i>'
      : '<i class="fas fa-robot"></i>';

  transcriptEntry.innerHTML = `
        <div class="flex items-center gap-2 mb-1">
            <span class="transcript-timestamp">[${timestamp}]</span>
            <span class="transcript-speaker">${icon} ${speaker}</span>
        </div>
        <div class="transcript-text">${text}</div>
    `;

  elements.transcriptionBox.appendChild(transcriptEntry);
  elements.transcriptionBox.scrollTop = elements.transcriptionBox.scrollHeight;
}


function updateWaveState(isActive) {
  const waveBars = document.querySelectorAll(".wave-bar");
  waveBars.forEach((bar) => {
    if (isActive) {
      bar.classList.remove("idle");
      bar.classList.add("active");
    } else {
      bar.classList.remove("active");
      bar.classList.add("idle");
    }
  });
}

function handleDataChannelMessage(e) {
  const event = JSON.parse(e.data);
  console.log("Received event:", event);

  switch (event.type) {
    case "conversation.item.input_audio_transcription.completed":
      updateTranscription("User", event.transcript);
      break;

    case "response.audio_transcript.delta":
      updateWaveState(true);
      updateTranscription("AI", event.delta);
      break;

    case "response.created":
      currentResponseId = event.response.id;
      updateStatus(`Response created, ID: ${currentResponseId}`, "info");
      elements.startBtn.disabled = true;
      elements.stopBtn.disabled = false;
      break;

    case "response.message":
      if (event.response.content) {
        addMessageToConversation(event.response.content, "ai");
      }
      elements.stopBtn.disabled = false;
      break;

    case "response.cancelled":
      updateStatus("Response cancelled successfully", "success");
      currentResponseId = null;
      elements.startBtn.disabled = false;
      elements.stopBtn.disabled = true;
      elements.audioWave.classList.remove("active");
      break;

    case "response.done":
      updateStatus("Response is done", "success");
      elements.stopBtn.disabled = false;
      updateWaveState(false);
      break;

    case "turn.start":
      console.log("Turn started");
      elements.stopBtn.disabled = false;
      break;

    case "turn.end":
      console.log("Turn ended");
      elements.stopBtn.disabled = false;
      break;

    case "input_audio_buffer.committed":
      updateStatus("Audio input received", "info");
      break;

    case "input_audio_buffer.speech_started":
      updateStatus("Speech detected", "info");
      updateWaveState(true);
      break;

    case "input_audio_buffer.speech_stopped":
      updateStatus("Speech ended", "info");
      updateWaveState(false);
      break;

    default:
      updateStatus(`Received event: ${event.type}`);
      if (currentResponseId) {
        elements.stopBtn.disabled = false;
      }
      break;
  }
}

function exportTranscript() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `english-learning-transcript-${timestamp}.txt`;

  const transcriptContent = Array.from(elements.transcriptionBox.children)
    .map((entry) => {
      const timestamp = entry.querySelector(
        ".transcript-timestamp"
      ).textContent;
      const speaker = entry.querySelector(".transcript-speaker").textContent;
      const text = entry.querySelector(".transcript-text").textContent;
      return `${timestamp} ${speaker} ${text}`;
    })
    .join("\n");

  const header = `English Learning Session\nDate: ${new Date().toLocaleDateString()}\nMode: ${currentMode}\nDifficulty: ${
    elements.difficultyLevel.value
  }\n\n`;
  const content = header + transcriptContent;

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();

  URL.revokeObjectURL(url);
}

async function cancelResponse() {
  return new Promise((resolve, reject) => {
    try {
      if (dataChannel?.readyState === "open" && currentResponseId) {
        const event = {
          type: "response.cancel",
          event_id: `event_${Date.now()}`,
          response_id: currentResponseId,
        };
        dataChannel.send(JSON.stringify(event));
        updateStatus("Cancel request sent", "info");
        resolve();
      } else {
        reject(new Error("Invalid state for cancellation"));
      }
    } catch (error) {
      reject(error);
    }
  });
}

async function setupMediaStream(EPHEMERAL_KEY) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    peerConnection.addTrack(stream.getTracks()[0], stream);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-realtime-preview-2024-12-17";

    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
      body: offer.sdp,
    });

    if (!sdpResponse.ok) {
      throw new Error(`HTTP error! status: ${sdpResponse.status}`);
    }

    const answerSDP = await sdpResponse.text();
    const answer = {
      type: "answer",
      sdp: answerSDP,
    };
    await peerConnection.setRemoteDescription(answer);
    updateStatus("Connected to OpenAI Realtime API", "success");
  } catch (error) {
    throw new Error(`Media stream error: ${error.message}`);
  }
}

async function cleanupConnection() {
  console.log("Cleaning up connection");

  if (dataChannel) {
    console.log("Closing data channel");
    dataChannel.close();
  }

  if (peerConnection) {
    console.log("Closing peer connection");
    peerConnection.close();
  }

  dataChannel = null;
  peerConnection = null;
  currentResponseId = null;
  isInitialized = false;

  elements.startBtn.disabled = false;
  elements.stopBtn.disabled = true;
  elements.audioWave.classList.remove("active");

  updateStatus("Connection cleaned up", "info");
  updateWaveState(false);
}



function updateStatus(message, type = "info") {
  const timestamp = new Date().toLocaleTimeString();
  const statusMessage = document.createElement("div");
  statusMessage.className = `status-message ${type}`;
  statusMessage.innerHTML = `<span class="status-timestamp">[${timestamp}]</span> <span class="status-text">${message}</span>`;
}


async function startConversation() {
  try {
    if (!currentMode) {
      updateStatus("Please select a learning mode first", "warning");
      return;
    }

    if (dataChannel?.readyState === "open") {
      const difficulty = elements.difficultyLevel.value;
      const instructions =
        MODES[currentMode.toUpperCase()].instructions[difficulty];

      const event = {
        type: "response.create",
        response: {
          modalities: ["text", "audio"],
          instructions: instructions,
        },
      };

      dataChannel.send(JSON.stringify(event));
      updateStatus("Started conversation", "success");
      elements.startBtn.disabled = true;
      elements.stopBtn.disabled = false;
    }
  } catch (error) {
    updateStatus(`Error starting conversation: ${error.message}`, "error");
  }
}

async function stopConversation() {
  console.log("Stop button clicked");
  console.log("Current response ID:", currentResponseId);
  console.log("Data channel state:", dataChannel?.readyState);

  if (!dataChannel || dataChannel.readyState !== "open") {
    updateStatus("No active connection to stop", "warning");
    return;
  }

  if (!currentResponseId) {
    updateStatus("No active response to cancel", "warning");
    return;
  }

  try {
    await cancelResponse();
    updateStatus("Cancelling response...", "info");

    setTimeout(() => {
      cleanupConnection();
      updateStatus("Connection cleaned up", "info");
    }, 1000);
  } catch (error) {
    updateStatus(`Error stopping conversation: ${error.message}`, "error");
  }
}

// Event Listeners
elements.startBtn.addEventListener("click", async () => {
  const settings = {
    voice: elements.voiceSelect.value,
    modalities: ["text", "audio"],
    instructions:
      MODES[currentMode.toUpperCase()].instructions[
        elements.difficultyLevel.value
      ],
  };

  await initializeConnection(settings);
  elements.stopBtn.disabled = false;
  startConversation();
});

elements.stopBtn.addEventListener("click", async () => {
  elements.stopBtn.disabled = true;
  await stopConversation();
});

elements.exportBtn.addEventListener("click", exportTranscript);

elements.pronunciationBtn.addEventListener("click", () =>
  setMode("pronunciation")
);
elements.grammarBtn.addEventListener("click", () => setMode("grammar"));
elements.conversationBtn.addEventListener("click", () =>
  setMode("conversation")
);
elements.vocabularyBtn.addEventListener("click", () => setMode("vocabulary"));

elements.difficultyLevel.addEventListener("change", () => {
  if (currentMode) {
    setMode(currentMode);
  }
});


document.addEventListener("DOMContentLoaded", () => {
  updateWaveState(false); 
});


document.addEventListener("DOMContentLoaded", function () {
  // Mobile menu toggle
  const mobileMenuButton = document.querySelector(".mobile-menu-button");
  const mobileMenu = document.querySelector(".mobile-menu");

  mobileMenuButton?.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });

  // Header scroll effect
  window.addEventListener("scroll", () => {
    const header = document.querySelector("header");
    if (window.scrollY > 0) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
});
// Initialize UI
elements.startBtn.disabled = true;
elements.stopBtn.disabled = true;