
import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface ElevenLabsSpeechToTextProps {
  onTranscriptUpdate: (transcript: string) => void;
}

export const ElevenLabsSpeechToText: React.FC<ElevenLabsSpeechToTextProps> = ({
  onTranscriptUpdate
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('elevenLabsApiKey') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(!apiKey);
  const [transcript, setTranscript] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const saveApiKey = () => {
    localStorage.setItem('elevenLabsApiKey', apiKey);
    setShowApiKeyInput(false);
    toast({
      title: "Clé API sauvegardée",
      description: "Votre clé API ElevenLabs a été enregistrée localement.",
    });
  };

  const startRecording = async () => {
    if (!apiKey.trim()) {
      setShowApiKeyInput(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Enregistrement démarré",
        description: "Parlez maintenant, l'audio sera transcrit automatiquement.",
      });
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone. Vérifiez les permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('model', 'eleven_multilingual_v2');

      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const result = await response.json();
      const newTranscript = result.text || '';
      
      if (newTranscript.trim()) {
        const updatedTranscript = transcript + (transcript ? ' ' : '') + newTranscript;
        setTranscript(updatedTranscript);
        onTranscriptUpdate(updatedTranscript);
        
        toast({
          title: "Transcription réussie",
          description: "L'audio a été transcrit avec succès.",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la transcription:', error);
      toast({
        title: "Erreur de transcription",
        description: "Impossible de transcrire l'audio. Vérifiez votre clé API.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    onTranscriptUpdate('');
  };

  if (showApiKeyInput) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
          <CardTitle className="text-lg">Configuration ElevenLabs Speech-to-Text</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Clé API ElevenLabs
            </label>
            <Input
              type="password"
              placeholder="Votre clé API ElevenLabs"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={saveApiKey} className="flex-1 bg-purple-600 hover:bg-purple-700">
              Sauvegarder
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowApiKeyInput(false)}
              className="flex-1"
            >
              Annuler
            </Button>
          </div>
          <p className="text-xs text-slate-600">
            Obtenez votre clé API sur{' '}
            <a 
              href="https://elevenlabs.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline"
            >
              elevenlabs.io
            </a>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Transcription ElevenLabs
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowApiKeyInput(true)}
              className="text-xs"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`flex-1 ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Transcription...
              </>
            ) : isRecording ? (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Arrêter l'enregistrement
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Commencer l'enregistrement
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={clearTranscript} 
            disabled={!transcript || isRecording}
            className="border-purple-600 text-purple-600 hover:bg-purple-50"
          >
            Effacer
          </Button>
        </div>

        <div className="border rounded-lg p-4 min-h-[200px] bg-slate-50">
          <h4 className="font-medium text-slate-700 mb-2">Transcription ElevenLabs :</h4>
          <div className="text-sm text-slate-600 leading-relaxed">
            {transcript || (
              <span className="italic text-slate-400">
                {isRecording 
                  ? "Enregistrement en cours... Parlez maintenant." 
                  : isProcessing
                  ? "Transcription en cours..."
                  : "Cliquez sur 'Commencer l'enregistrement' pour débuter."
                }
              </span>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-500 bg-purple-50 p-3 rounded-lg">
          <strong>ElevenLabs Speech-to-Text :</strong> Cette fonctionnalité utilise l'API ElevenLabs 
          pour une transcription de haute qualité. Chaque enregistrement est envoyé à ElevenLabs pour traitement.
        </div>
      </CardContent>
    </Card>
  );
};
