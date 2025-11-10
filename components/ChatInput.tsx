import React, { useState, useRef, useEffect } from 'react';

// Declaração para a API de Reconhecimento de Fala do navegador
// Fix: Add type definitions for the Web Speech API to resolve 'Cannot find name SpeechRecognition' error.
interface SpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (event: any) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isThinkingMode: boolean;
  onToggleThinkingMode: () => void;
  disabled?: boolean;
  onShowToast: (message: string) => void;
}

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
);

const MicrophoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
        <path d="M6 10.5a.75.75 0 0 1 .75.75v.75a4.5 4.5 0 0 0 9 0v-.75a.75.75 0 0 1 1.5 0v.75a6 6 0 1 1-12 0v-.75a.75.75 0 0 1 .75-.75Z" />
    </svg>
);


const Toggle = ({ checked, onChange, disabled }: {checked: boolean, onChange: () => void, disabled?: boolean}) => (
    <label htmlFor="thinking-mode-toggle" className={`flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <div className="relative">
        <input type="checkbox" id="thinking-mode-toggle" className="sr-only" checked={checked} onChange={onChange} disabled={disabled} />
        <div className={`block w-14 h-8 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'transform translate-x-6' : ''}`}></div>
      </div>
    </label>
);


export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, isThinkingMode, onToggleThinkingMode, disabled, onShowToast }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Garante que a gravação pare se o componente for desmontado
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleMicClick = async () => {
    if (isLoading || disabled) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      onShowToast('Seu navegador não suporta a API de Reconhecimento de Fala.');
      return;
    }
    
    const permissionDeniedMessage = 'Permissão do microfone negada. Habilite o acesso nas configurações do seu navegador (geralmente no ícone de cadeado na barra de endereço).';


    try {
      // Proactively check for permission.
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (permissionStatus.state === 'denied') {
        onShowToast(permissionDeniedMessage);
        return;
      }
    } catch (e) {
      console.warn("Permissions API not fully supported or failed, proceeding with standard request.", e);
      // If Permissions API fails (e.g., in some browsers), we'll let the standard flow handle it.
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    recognition.lang = 'pt-BR';
    recognition.interimResults = true; // Mostra resultados enquanto fala
    recognition.continuous = false; // Para após uma pausa

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setInput(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
            onShowToast(permissionDeniedMessage);
        } else if (event.error === 'no-speech') {
            onShowToast('Nenhuma fala foi detectada. Tente novamente.');
        } else if (event.error === 'network') {
            onShowToast('Erro de rede. Verifique sua conexão.');
        } else {
            onShowToast('Ocorreu um erro ao gravar o áudio.');
        }
        setIsRecording(false);
    };

    recognition.onend = () => {
        setIsRecording(false);
    };
    
    recognition.start();
    setIsRecording(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 shadow-inner">
      <div className="flex items-center justify-center gap-4 mb-3">
         <span className={`text-sm font-medium ${!isThinkingMode ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>Resposta Rápida</span>
         <Toggle checked={isThinkingMode} onChange={onToggleThinkingMode} disabled={disabled} />
         <span className={`text-sm font-medium ${isThinkingMode ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>Análise Profunda</span>
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2 md:gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isRecording ? "Ouvindo..." : disabled ? "Configure a chave de API para começar" : "Digite sua dúvida aqui..."}
          className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          disabled={isLoading || disabled || isRecording}
        />
        <button
          type="button"
          onClick={handleMicClick}
          disabled={isLoading || disabled}
          className={`flex-shrink-0 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-blue-500 disabled:cursor-not-allowed transition-colors ${
            isRecording 
            ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' 
            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
          }`}
          aria-label={isRecording ? "Parar gravação" : "Gravar áudio"}
        >
          <MicrophoneIcon />
        </button>
        <button
          type="submit"
          disabled={isLoading || disabled || !input.trim()}
          className="flex-shrink-0 bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
        >
            <SendIcon />
        </button>
      </form>
    </div>
  );
};
