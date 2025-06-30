
import React, { useState } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ElevenLabsTTSProps {
  text: string;
  voiceId?: string;
  model?: string;
}

export const ElevenLabsTTS: React.FC<ElevenLabsTTSProps> = ({
  text,
  voiceId = '9BWtsMINqrJLrRacOk9x', // Aria voice
  model = 'eleven_multilingual_v2'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('elevenLabsApiKey') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(!apiKey);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const saveApiKey = () => {
    localStorage.setItem('elevenLabsApiKey', apiKey);
    setShowApiKeyInput(false);
  };

  const convertTextToSpeech = async () => {
    if (!apiKey.trim()) {
      setShowApiKeyInput(true);
      return;
    }

    if (!text.trim()) {
      return;
    }

    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: model,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
        console.error('Erreur lors de la lecture audio');
      };

      setCurrentAudio(audio);
      audio.play();
      
    } catch (error) {
      console.error('Erreur lors de la conversion text-to-speech:', error);
      alert('Erreur lors de la conversion. Vérifiez votre clé API.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showApiKeyInput) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">Configuration ElevenLabs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Button onClick={saveApiKey} className="flex-1">
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
              className="text-blue-600 hover:underline"
            >
              elevenlabs.io
            </a>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={convertTextToSpeech}
      disabled={isLoading || !text.trim()}
      className="h-8 w-8 p-0"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
};
