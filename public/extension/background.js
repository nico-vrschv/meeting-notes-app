
// Background script pour l'extension Chrome
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension Notes de Réunion installée');
});

// Gérer les messages du content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'TRANSCRIPT_UPDATE':
      // Stocker la transcription
      chrome.storage.local.set({
        transcript: message.transcript,
        lastUpdate: Date.now()
      });
      break;
      
    case 'SPEECH_ERROR':
      console.error('Erreur de reconnaissance vocale:', message.error);
      break;
  }
});

// Gérer les changements d'onglets pour détecter Google Meet
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('meet.google.com')) {
    // Injecter le content script si nécessaire
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(err => {
      // Script déjà injecté ou erreur
      console.log('Script déjà présent ou erreur d\'injection');
    });
  }
});
