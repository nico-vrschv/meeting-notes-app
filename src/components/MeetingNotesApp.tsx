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

  const generateSummary = () => {
    const notes = currentNote.notes || '';
    
    if (!notes.trim()) {
      setCurrentNote(prev => ({
        ...prev,
        summary: 'Aucun contenu suffisant pour générer un résumé.'
      }));
      return;
    }

    // Analyse et structuration professionnelle du contenu
    const lines = notes.split('\n').filter(line => line.trim().length > 0);
    const sentences = notes.split(/[.!?]+/).filter(s => s.trim().length > 15);
    
    // Extraction des éléments clés
    const keyPoints = [];
    const decisions = [];
    const discussions = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim().toLowerCase();
      if (trimmedLine.includes('décision') || trimmedLine.includes('décide') || trimmedLine.includes('convenu')) {
        decisions.push(line.trim());
      } else if (trimmedLine.includes('action') || trimmedLine.includes('faire') || trimmedLine.includes('tâche')) {
        keyPoints.push(line.trim());
      } else if (line.trim().length > 20) {
        discussions.push(line.trim());
      }
    });

    // Construction du résumé professionnel
    let professionalSummary = '';
    
    // Introduction
    professionalSummary += '**RÉSUMÉ EXÉCUTIF**\n\n';
    
    if (sentences.length > 0) {
      const mainContext = sentences.slice(0, 2).join('. ').replace(/^\s*[•\-\*]\s*/, '');
      professionalSummary += `Cette réunion a porté sur ${mainContext.toLowerCase()}.\n\n`;
    }
    
    // Points principaux discutés
    if (discussions.length > 0) {
      professionalSummary += '**POINTS PRINCIPAUX ABORDÉS :**\n';
      discussions.slice(0, 4).forEach((point, index) => {
        const cleanPoint = point.replace(/^\s*[•\-\*]\s*/, '');
        professionalSummary += `• ${cleanPoint}\n`;
      });
      professionalSummary += '\n';
    }
    
    // Décisions prises
    if (decisions.length > 0) {
      professionalSummary += '**DÉCISIONS PRISES :**\n';
      decisions.forEach((decision, index) => {
        const cleanDecision = decision.replace(/^\s*[•\-\*]\s*/, '');
        professionalSummary += `• ${cleanDecision}\n`;
      });
      professionalSummary += '\n';
    }
    
    // Actions identifiées
    if (currentNote.actionItems && currentNote.actionItems.length > 0) {
      professionalSummary += '**ACTIONS À SUIVRE :**\n';
      currentNote.actionItems.forEach((action, index) => {
        professionalSummary += `• ${action}\n`;
      });
      professionalSummary += '\n';
    }
    
    // Conclusion
    if (sentences.length > 2) {
      const conclusion = sentences.slice(-2).join('. ');
      professionalSummary += '**PROCHAINES ÉTAPES :**\n';
      professionalSummary += `Les prochaines actions se concentreront sur la mise en œuvre des décisions prises et le suivi des points évoqués.\n\n`;
    }
    
    professionalSummary += `*Résumé généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}*`;

    setCurrentNote(prev => ({
      ...prev,
      summary: professionalSummary
    }));
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
            {/* Actions rapides */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
                <CardTitle className="text-lg">Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Button 
                  onClick={generateSummary} 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={!currentNote.notes?.trim()}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Générer le Résumé
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
