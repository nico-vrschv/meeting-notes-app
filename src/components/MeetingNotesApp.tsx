import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, FileText, Download, Mic, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ElevenLabsSpeechToText } from './ElevenLabsSpeechToText';

interface MeetingNote {
  id: string;
  title: string;
  date: string;
  participants: string[];
  duration: string;
  notes: string;
  summary: string;
  actionItems: string[];
}

const MeetingNotesApp = () => {
  const [currentNote, setCurrentNote] = useState<Partial<MeetingNote>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    participants: [],
    duration: '',
    notes: '',
    summary: '',
    actionItems: []
  });

  const [participantInput, setParticipantInput] = useState('');
  const [actionItemInput, setActionItemInput] = useState('');
  const [aiApiKey, setAiApiKey] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Vérifier s'il y a une transcription dans l'URL (venant de l'extension)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const transcriptParam = urlParams.get('transcript');
    if (transcriptParam) {
      const decodedTranscript = decodeURIComponent(transcriptParam);
      setCurrentNote(prev => ({
        ...prev,
        notes: prev.notes ? prev.notes + '\n\n--- Transcription Google Meet ---\n' + decodedTranscript : decodedTranscript
      }));
      
      // Nettoyer l'URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const handleTranscriptUpdate = (transcript: string) => {
    setCurrentNote(prev => ({
      ...prev,
      notes: transcript
    }));
  };

  const handleNotesChange = (value: string) => {
    setCurrentNote(prev => ({
      ...prev,
      notes: value
    }));
  };

  const addParticipant = () => {
    if (participantInput.trim() && !currentNote.participants?.includes(participantInput.trim())) {
      setCurrentNote(prev => ({
        ...prev,
        participants: [...(prev.participants || []), participantInput.trim()]
      }));
      setParticipantInput('');
    }
  };

  const removeParticipant = (participant: string) => {
    setCurrentNote(prev => ({
      ...prev,
      participants: prev.participants?.filter(p => p !== participant) || []
    }));
  };

  const addActionItem = () => {
    if (actionItemInput.trim()) {
      setCurrentNote(prev => ({
        ...prev,
        actionItems: [...(prev.actionItems || []), actionItemInput.trim()]
      }));
      setActionItemInput('');
    }
  };

  const removeActionItem = (index: number) => {
    setCurrentNote(prev => ({
      ...prev,
      actionItems: prev.actionItems?.filter((_, i) => i !== index) || []
    }));
  };

  const generateSummary = async () => {
    const notes = currentNote.notes || '';
    
    if (!notes.trim()) {
      setCurrentNote(prev => ({
        ...prev,
        summary: 'Aucun contenu suffisant pour générer un résumé.'
      }));
      return;
    }

    if (!aiApiKey.trim()) {
      setCurrentNote(prev => ({
        ...prev,
        summary: 'Veuillez saisir votre clé API Gemini dans le panneau latéral.'
      }));
      return;
    }

    setIsGeneratingSummary(true);

    try {
      const meetingContext = {
        title: currentNote.title || 'Réunion',
        date: currentNote.date,
        participants: currentNote.participants?.join(', ') || 'Non spécifiés',
        duration: currentNote.duration || 'Non spécifiée',
        actionItems: currentNote.actionItems || []
      };

      const prompt = `Tu es un assistant professionnel chargé de rédiger des comptes rendus de réunion formels. 

Contexte de la réunion :
- Titre : ${meetingContext.title}
- Date : ${meetingContext.date}
- Participants : ${meetingContext.participants}
- Durée : ${meetingContext.duration}
- Actions identifiées : ${meetingContext.actionItems.join('; ')}

Notes brutes de la réunion :
"""
${notes}
"""

Consignes :
1. Reformule ces notes en un compte rendu professionnel et formel
2. Structure le contenu avec les sections suivantes :
   - CONTEXTE ET OBJECTIF
   - POINTS PRINCIPAUX ABORDÉS
   - DÉCISIONS PRISES
   - ACTIONS À SUIVRE (inclure les actions déjà listées + celles identifiées dans les notes)
   - PROCHAINES ÉTAPES

3. Utilise un langage soutenu et professionnel
4. Assure-toi que le contenu soit clair, structuré et exploitable
5. Corrige les éventuelles erreurs de transcription
6. Synthétise les informations redondantes
7. Mets en valeur les éléments importants

Réponds uniquement avec le compte rendu reformulé, sans préambule.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${aiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
            topP: 0.9,
            topK: 40
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erreur API: ${response.status}`);
      }

      const data = await response.json();
      const aiSummary = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Erreur lors de la génération du résumé.';

      setCurrentNote(prev => ({
        ...prev,
        summary: aiSummary + `\n\n*Résumé généré par IA le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}*`
      }));

    } catch (error) {
      console.error('Erreur lors de la génération du résumé:', error);
      setCurrentNote(prev => ({
        ...prev,
        summary: `Erreur lors de la génération du résumé: ${error instanceof Error ? error.message : 'Erreur inconnue'}\n\nVérifiez votre clé API et votre connexion internet.`
      }));
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const exportReport = () => {
    const report = `
COMPTE RENDU DE RÉUNION
=======================

Titre: ${currentNote.title}
Date: ${currentNote.date}
Durée: ${currentNote.duration}
Participants: ${currentNote.participants?.join(', ')}

NOTES DE RÉUNION
----------------
${currentNote.notes}

RÉSUMÉ EXÉCUTIF
---------------
${currentNote.summary}

ACTIONS À EFFECTUER
-------------------
${currentNote.actionItems?.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Généré le ${new Date().toLocaleString('fr-FR')}
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CR_${currentNote.title?.replace(/\s+/g, '_') || 'reunion'}_${currentNote.date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Notes de Réunion Intelligentes
          </h1>
          <p className="text-slate-600 text-lg">
            Capturez, organisez et générez des comptes rendus professionnels
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panneau principal de saisie */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations de la réunion */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Informations de la Réunion
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Titre de la réunion
                    </label>
                    <Input
                      placeholder="Ex: Réunion équipe projet X"
                      value={currentNote.title || ''}
                      onChange={(e) => setCurrentNote(prev => ({...prev, title: e.target.value}))}
                      className="border-slate-300 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={currentNote.date || ''}
                      onChange={(e) => setCurrentNote(prev => ({...prev, date: e.target.value}))}
                      className="border-slate-300 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Durée (optionnel)
                  </label>
                  <Input
                    placeholder="Ex: 1h30, 45min"
                    value={currentNote.duration || ''}
                    onChange={(e) => setCurrentNote(prev => ({...prev, duration: e.target.value}))}
                    className="border-slate-300 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Participants
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Nom du participant"
                      value={participantInput}
                      onChange={(e) => setParticipantInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                      className="border-slate-300 focus:border-blue-500"
                    />
                    <Button onClick={addParticipant} className="bg-blue-600 hover:bg-blue-700">
                      <Users className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentNote.participants?.map((participant, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                        onClick={() => removeParticipant(participant)}
                      >
                        {participant} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Zone de transcription ElevenLabs */}
            <ElevenLabsSpeechToText onTranscriptUpdate={handleTranscriptUpdate} />

            {/* Zone de saisie des notes */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notes de Réunion
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Textarea
                  placeholder="Saisissez vos notes ici ou utilisez la transcription automatique ci-dessus...&#10;&#10;Conseils :&#10;- Notez les points clés de discussion&#10;- Mentionnez les décisions prises&#10;- Listez les actions à effectuer&#10;- Incluez les échéances importantes"
                  value={currentNote.notes || ''}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  className="min-h-[300px] border-slate-300 focus:border-green-500 resize-none"
                />
                
                {/* Actions à effectuer intégrées */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Actions à Effectuer
                  </h4>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Nouvelle action..."
                      value={actionItemInput}
                      onChange={(e) => setActionItemInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addActionItem()}
                      className="text-sm border-slate-300 focus:border-green-500"
                    />
                    <Button 
                      onClick={addActionItem} 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      +
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {currentNote.actionItems?.map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200"
                      >
                        <span className="text-sm text-slate-700 flex-1">{item}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeActionItem(index)}
                          className="text-green-600 hover:text-green-800 hover:bg-green-100 h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panneau latéral */}
          <div className="space-y-6">
            {/* Configuration IA */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-t-lg">
                <CardTitle className="text-lg">Configuration IA</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Clé API Gemini
                  </label>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="AIza..."
                      value={aiApiKey}
                      onChange={(e) => {
                        console.log('Tentative de saisie clé API:', e.target.value);
                        setAiApiKey(e.target.value);
                      }}
                      className="text-sm border-slate-300 focus:border-orange-500"
                    />
                    <Button 
                      onClick={() => {
                        localStorage.setItem('gemini-api-key', aiApiKey);
                        console.log('Clé API sauvegardée:', aiApiKey);
                      }}
                      size="sm"
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      disabled={!aiApiKey.trim()}
                    >
                      Enregistrer la clé
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Nécessaire pour la reformulation IA du résumé
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
                <CardTitle className="text-lg">Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Button 
                  onClick={generateSummary} 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={!currentNote.notes?.trim() || isGeneratingSummary}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {isGeneratingSummary ? 'Génération...' : 'Générer le Résumé IA'}
                </Button>
                <Button 
                  onClick={exportReport} 
                  variant="outline" 
                  className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
                  disabled={!currentNote.title?.trim()}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter le CR
                </Button>
              </CardContent>
            </Card>

            {/* Résumé généré */}
            {currentNote.summary && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-t-lg">
                  <CardTitle className="text-lg">
                    Résumé Exécutif
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {currentNote.summary}
                  </p>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingNotesApp;
