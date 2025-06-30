
import React, { useEffect } from 'react';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Trash2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SpeechTranscriptionProps {
  onTranscriptUpdate: (transcript: string) => void;
}

const SpeechTranscription: React.FC<SpeechTranscriptionProps> = ({ onTranscriptUpdate }) => {
  const { transcript, isListening, startListening, stopListening, clearTranscript, error } = useSpeechToText();
  const { toast } = useToast();

  useEffect(() => {
    onTranscriptUpdate(transcript);
  }, [transcript, onTranscriptUpdate]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      toast({
        title: "Copié !",
        description: "La transcription a été copiée dans le presse-papiers",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de copier la transcription",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Transcription en Temps Réel
          </span>
          <div className="flex items-center gap-2">
            {isListening && (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                En cours
              </Badge>
            )}
            <Button
              size="sm"
              variant={isListening ? "destructive" : "secondary"}
              onClick={isListening ? stopListening : startListening}
              className="text-xs"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            onClick={isListening ? stopListening : startListening}
            className={`flex-1 ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Arrêter l'écoute
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Commencer l'écoute
              </>
            )}
          </Button>
          <Button variant="outline" onClick={clearTranscript} disabled={!transcript}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={copyToClipboard} disabled={!transcript}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>

        <div className="border rounded-lg p-4 min-h-[200px] bg-slate-50">
          <h4 className="font-medium text-slate-700 mb-2">Transcription :</h4>
          <div className="text-sm text-slate-600 leading-relaxed">
            {transcript || (
              <span className="italic text-slate-400">
                {isListening 
                  ? "Parlez maintenant... La transcription apparaîtra ici." 
                  : "Cliquez sur 'Commencer l'écoute' pour débuter la transcription."
                }
              </span>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-500 bg-blue-50 p-3 rounded-lg">
          <strong>Astuce :</strong> Cette fonctionnalité utilise l'API Web Speech Recognition intégrée à Chrome. 
          Pour une meilleure précision, parlez clairement et assurez-vous d'avoir une bonne connexion internet.
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeechTranscription;
