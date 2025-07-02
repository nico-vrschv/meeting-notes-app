
// Script de contenu pour Google Meet
let isTranscribing = false;
let recognition = null;
let transcript = '';

// Initialiser la reconnaissance vocale
function initSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window)) {
    console.error('Speech Recognition non supporté');
    return null;
  }

  const SpeechRecognition = window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'fr-FR';

  recognition.onresult = function(event) {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    // Envoyer la transcription à l'application
    sendTranscriptToApp(finalTranscript, interimTranscript);
  };

  recognition.onerror = function(event) {
    console.error('Erreur de reconnaissance:', event.error);
    chrome.runtime.sendMessage({
      type: 'SPEECH_ERROR',
      error: event.error
    });
  };

  recognition.onend = function() {
    isTranscribing = false;
    updateUIState();
  };

  return recognition;
}

// Envoyer la transcription à l'application principale
function sendTranscriptToApp(finalText, interimText) {
  transcript += finalText;
  
  // Stocker dans le storage Chrome pour récupération par l'app
  chrome.storage.local.set({
    transcript: transcript,
    lastUpdate: Date.now()
  });

  // Envoyer message au popup
  chrome.runtime.sendMessage({
    type: 'TRANSCRIPT_UPDATE',
    transcript: transcript,
    interim: interimText
  });
}

// Créer l'interface utilisateur dans Google Meet
function createMeetUI() {
  // Vérifier si l'UI existe déjà
  if (document.getElementById('meeting-transcription-ui')) {
    return;
  }

  const ui = document.createElement('div');
  ui.id = 'meeting-transcription-ui';
  ui.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    padding: 16px;
    min-width: 280px;
    font-family: Arial, sans-serif;
  `;

  ui.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
      <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: #333;">
        📝 Transcription
      </h3>
      <button id="toggle-transcription" style="
        background: #4285f4;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        font-size: 12px;
        cursor: pointer;
      ">
        Démarrer
      </button>
    </div>
    <div id="transcription-status" style="
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
    ">
      Prêt à transcrire
    </div>
    <div id="live-transcript" style="
      max-height: 150px;
      overflow-y: auto;
      font-size: 12px;
      line-height: 1.4;
      background: #f5f5f5;
      padding: 8px;
      border-radius: 4px;
      min-height: 40px;
    ">
      La transcription apparaîtra ici...
    </div>
    <button id="export-transcript" style="
      width: 100%;
      margin-top: 8px;
      background: #34a853;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px;
      font-size: 12px;
      cursor: pointer;
    ">
      Exporter vers l'app
    </button>
  `;

  document.body.appendChild(ui);

  // Gestionnaires d'événements
  const toggleBtn = document.getElementById('toggle-transcription');
  const exportBtn = document.getElementById('export-transcript');

  toggleBtn.addEventListener('click', toggleTranscription);
  exportBtn.addEventListener('click', exportToApp);

  updateUIState();
}

// Basculer la transcription
function toggleTranscription() {
  if (!recognition) {
    recognition = initSpeechRecognition();
    if (!recognition) return;
  }

  if (isTranscribing) {
    recognition.stop();
    isTranscribing = false;
  } else {
    transcript = ''; // Réinitialiser
    recognition.start();
    isTranscribing = true;
  }

  updateUIState();
}

// Mettre à jour l'interface utilisateur
function updateUIState() {
  const toggleBtn = document.getElementById('toggle-transcription');
  const statusEl = document.getElementById('transcription-status');
  const transcriptEl = document.getElementById('live-transcript');

  if (toggleBtn) {
    toggleBtn.textContent = isTranscribing ? 'Arrêter' : 'Démarrer';
    toggleBtn.style.background = isTranscribing ? '#ea4335' : '#4285f4';
  }

  if (statusEl) {
    statusEl.textContent = isTranscribing ? '🔴 Transcription en cours...' : '⏸️ Transcription arrêtée';
  }

  if (transcriptEl && transcript) {
    transcriptEl.textContent = transcript || 'La transcription apparaîtra ici...';
    transcriptEl.scrollTop = transcriptEl.scrollHeight;
  }
}

// Exporter vers l'application principale
function exportToApp() {
  if (transcript) {
    // Ouvrir l'application avec la transcription
    const appUrl = `http://localhost:8080?transcript=${encodeURIComponent(transcript)}`;
    window.open(appUrl, '_blank');
  }
}

// Écouter les messages du background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRANSCRIPT_UPDATE') {
    const transcriptEl = document.getElementById('live-transcript');
    if (transcriptEl) {
      transcriptEl.textContent = message.transcript + (message.interim || '');
      transcriptEl.scrollTop = transcriptEl.scrollHeight;
    }
  }
});

// Initialiser quand Google Meet est chargé
function initWhenReady() {
  // Attendre que la page soit complètement chargée
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createMeetUI);
  } else {
    createMeetUI();
  }
}

// Démarrer l'initialisation
initWhenReady();

console.log('Extension Notes de Réunion chargée sur Google Meet');
