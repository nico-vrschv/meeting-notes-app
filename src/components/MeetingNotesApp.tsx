
import React, { useState } from 'react';
import { Calendar, Users, Clock, FileText, Download, Mic, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
  const [isRecording, setIsRecording] = useState(false);

  const addParticipant = () => {
    if (participantInput.trim() && !currentNote.participants?.includes(participantInput.trim())) {
      setCurrentNote({
        ...currentNote,
        participants: [...(currentNote.participants || []), participantInput.trim()]
      });
      setParticipantInput('');
    }
  };

  const removeParticipant = (participant: string) => {
    setCurrentNote({
      ...currentNote,
      participants: currentNote.participants?.filter(p => p !== participant) || []
    });
  };

  const addActionItem = () => {
    if (actionItemInput.trim()) {
      setCurrentNote({
        ...currentNote,
        actionItems: [...(currentNote.actionItems || []), actionItemInput.trim()]
      });
      setActionItemInput('');
    }
  };

  const removeActionItem = (index: number) => {
    setCurrentNote({
      ...currentNote,
      actionItems: currentNote.actionItems?.filter((_, i) => i !== index) || []
    });
  };

  const generateSummary = () => {
    const notes = currentNote.notes || '';
    
    // Simulation de génération de résumé basique
    const sentences = notes.split('.').filter(s => s.trim().length > 10);
    const summary = sentences.slice(0, Math.min(3, sentences.length)).join('. ') + (sentences.length > 0 ? '.' : '');
    
    setCurrentNote({
      ...currentNote,
      summary: summary || 'Aucun contenu suffisant pour générer un résumé.'
    });
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
                      onChange={(e) => setCurrentNote({...currentNote, title: e.target.value})}
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
                      onChange={(e) => setCurrentNote({...currentNote, date: e.target.value})}
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
                    onChange={(e) => setCurrentNote({...currentNote, duration: e.target.value})}
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

            {/* Zone de saisie des notes */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notes de Réunion
                  <div className="ml-auto flex gap-2">
                    <Button 
                      size="sm" 
                      variant={isRecording ? "destructive" : "secondary"}
                      onClick={() => setIsRecording(!isRecording)}
                      className="text-xs"
                    >
                      <Mic className="w-4 h-4 mr-1" />
                      {isRecording ? 'Arrêter' : 'Enregistrer'}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isRecording && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      Enregistrement en cours... (Fonctionnalité en développement)
                    </div>
                  </div>
                )}
                <Textarea
                  placeholder="Saisissez vos notes ici...&#10;&#10;Conseils :&#10;- Notez les points clés de discussion&#10;- Mentionnez les décisions prises&#10;- Listez les actions à effectuer&#10;- Incluez les échéances importantes"
                  value={currentNote.notes || ''}
                  onChange={(e) => setCurrentNote({...currentNote, notes: e.target.value})}
                  className="min-h-[300px] border-slate-300 focus:border-green-500 resize-none"
                />
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
                <Separator />
                <div className="text-center">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    <Chrome className="w-3 h-3 mr-1" />
                    Extension Chrome bientôt disponible
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Résumé généré */}
            {currentNote.summary && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-t-lg">
                  <CardTitle className="text-lg">Résumé Exécutif</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {currentNote.summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Actions à effectuer */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-t-lg">
                <CardTitle className="text-lg">Actions à Effectuer</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nouvelle action..."
                    value={actionItemInput}
                    onChange={(e) => setActionItemInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addActionItem()}
                    className="text-sm border-orange-300 focus:border-orange-500"
                  />
                  <Button 
                    onClick={addActionItem} 
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    +
                  </Button>
                </div>
                <div className="space-y-2">
                  {currentNote.actionItems?.map((item, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-200"
                    >
                      <span className="text-sm text-slate-700 flex-1">{item}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeActionItem(index)}
                        className="text-orange-600 hover:text-orange-800 hover:bg-orange-100 h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingNotesApp;
