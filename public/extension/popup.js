
// Script pour le popup de l'extension
document.addEventListener('DOMContentLoaded', function() {
  const openAppBtn = document.getElementById('openApp');
  const exportBtn = document.getElementById('exportTranscript');
  const closeBtn = document.getElementById('closePopup');
  const statusEl = document.getElementById('status');
  const transcriptPreview = document.getElementById('transcriptPreview');
  const transcriptText = document.getElementById('transcriptText');

  // Fermer la popup
  closeBtn.addEventListener('click', function() {
    window.close();
  });

  // Ouvrir l'application principale
  openAppBtn.addEventListener('click', function() {
    chrome.tabs.create({
      url: 'http://localhost:8080'
    });
    window.close();
  });

  // Exporter la transcription
  exportBtn.addEventListener('click', function() {
    chrome.storage.local.get(['transcript'], function(result) {
      if (result.transcript) {
        const appUrl = `http://localhost:8080?transcript=${encodeURIComponent(result.transcript)}`;
        chrome.tabs.create({ url: appUrl });
      }
    });
  });

  // Vérifier le statut et charger la transcription
  function updateStatus() {
    chrome.storage.local.get(['transcript', 'lastUpdate'], function(result) {
      const now = Date.now();
      const lastUpdate = result.lastUpdate || 0;
      const isRecent = (now - lastUpdate) < 60000; // Moins d'1 minute

      if (result.transcript && isRecent) {
        statusEl.textContent = '🔴 Transcription active';
        statusEl.className = 'status active';
        
        transcriptText.textContent = result.transcript.substring(0, 200) + 
          (result.transcript.length > 200 ? '...' : '');
        transcriptPreview.style.display = 'block';
        exportBtn.style.display = 'block';
      } else if (result.transcript) {
        statusEl.textContent = '⏸️ Transcription disponible';
        statusEl.className = 'status inactive';
        
        transcriptText.textContent = result.transcript.substring(0, 200) + 
          (result.transcript.length > 200 ? '...' : '');
        transcriptPreview.style.display = 'block';
        exportBtn.style.display = 'block';
      } else {
        statusEl.textContent = 'Extension prête';
        statusEl.className = 'status inactive';
        transcriptPreview.style.display = 'none';
        exportBtn.style.display = 'none';
      }
    });
  }

  // Vérifier l'onglet actuel
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    if (currentTab.url && currentTab.url.includes('meet.google.com')) {
      statusEl.textContent = '✅ Sur Google Meet';
      statusEl.className = 'status active';
    }
  });

  // Mettre à jour le statut au chargement
  updateStatus();

  // Mettre à jour périodiquement
  setInterval(updateStatus, 2000);
});
