
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Message, Role } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ArticleModal } from './components/ArticleModal';
import { MODEL_FLASH, MODEL_PRO, SYSTEM_INSTRUCTION, legalDefinitions } from './constants';

const ApiKeyErrorScreen = () => (
  <div className="flex flex-col h-screen font-sans bg-gray-100 dark:bg-gray-900">
    <header className="bg-white dark:bg-gray-800 shadow-md p-4">
      <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white">
        Consultor Jurídico Imobiliário AI
      </h1>
    </header>
    <main className="flex-grow flex items-center justify-center">
      <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg shadow-lg max-w-3xl mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-2xl font-bold mb-2">Erro de Configuração: Chave de API Não Encontrada</h2>
        <p className="max-w-2xl mb-6">
          Para que a aplicação funcione, a chave de API precisa ser exposta ao navegador com um prefixo especial por motivos de segurança.
        </p>
        <div className="text-left bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="font-bold mb-3 text-gray-800 dark:text-white">Para corrigir, siga estes passos na Vercel:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Acesse as configurações do seu projeto na Vercel.</li>
            <li>Vá em <strong>Settings &rarr; Environment Variables</strong>.</li>
            <li className="font-bold text-red-600 dark:text-red-400">
              Renomeie a variável de <code>API_KEY</code> para <code>VITE_API_KEY</code>.
            </li>
            <li>Certifique-se de que a caixa de seleção <strong>"Production"</strong> está marcada para esta variável.</li>
            <li>Salve as alterações e faça o "Redeploy" da sua aplicação.</li>
          </ol>
        </div>
      </div>
    </main>
  </div>
);


const App: React.FC = () => {
  // Use `import.meta.env.VITE_API_KEY` which is the standard way for Vite-based projects
  // to expose environment variables to the client-side code.
  const apiKey = import.meta.env.VITE_API_KEY;
  const isApiKeyMissing = !apiKey;

  const [messages, setMessages] = useState<Message[]>([
      {
          role: Role.MODEL,
          text: 'Olá! Sou seu assistente jurídico especializado na Lei do Inquilinato. Como posso ajudar sua imobiliária hoje?',
      },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalArticle, setModalArticle] = useState<{ title: string; content: string } | null>(null);
  const chatRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const initializeChat = useCallback(async () => {
    if (isApiKeyMissing) {
        return;
    }
    try {
        const ai = new GoogleGenAI({ apiKey });
        const model = isThinkingMode ? MODEL_PRO : MODEL_FLASH;
        const config = {
            systemInstruction: SYSTEM_INSTRUCTION,
            ...(isThinkingMode && { thinkingConfig: { thinkingBudget: 32768 } })
        };
        
        chatRef.current = ai.chats.create({
            model: model,
            config: config
        });
        setError(null);
    } catch (e) {
        console.error(e);
        setError("Falha ao inicializar o chat. Verifique a chave de API e as configurações.");
    }
  }, [isThinkingMode, isApiKeyMissing, apiKey]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);


  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleToggleThinkingMode = () => {
    if (isApiKeyMissing) return;
    setIsThinkingMode(prev => !prev);
  };

  const handleShowArticle = (articleKey: string) => {
    const definition = legalDefinitions[articleKey];
    if (definition) {
      const formattedTitle = articleKey.replace('art. ', 'Artigo ').replace('º','');
      setModalArticle({ title: formattedTitle.toUpperCase(), content: definition });
    }
  };

  const handleCloseModal = () => {
    setModalArticle(null);
  };


  const handleSendMessage = async (userInput: string) => {
    if (isApiKeyMissing) return;

    setIsLoading(true);
    setError(null);
    const userMessage: Message = { role: Role.USER, text: userInput };
    setMessages(prev => [...prev, userMessage]);

    try {
        if (!chatRef.current) {
            await initializeChat();
            if (!chatRef.current) {
                throw new Error("O chat não foi inicializado corretamente.");
            }
        }

        const stream = await chatRef.current.sendMessageStream({ message: userInput });

        let modelResponse = '';
        setMessages(prev => [...prev, { role: Role.MODEL, text: '...' }]);

        for await (const chunk of stream) {
            modelResponse += chunk.text;
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].text = modelResponse;
                return newMessages;
            });
        }
    } catch (e: any) {
        console.error(e);
        const errorMessage = `Ocorreu um erro: ${e.message || 'Tente novamente.'}`;
        setError(errorMessage);
        setMessages(prev => [...prev, { role: Role.MODEL, text: errorMessage }]);
    } finally {
        setIsLoading(false);
    }
  };

  if (isApiKeyMissing) {
    return <ApiKeyErrorScreen />;
  }

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-md p-4">
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white">
          Consultor Jurídico Imobiliário AI
        </h1>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Potencializado por Gemini
        </p>
      </header>
      
      <main ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
            {messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} onShowArticle={handleShowArticle} />
            ))}
            {isLoading && messages[messages.length - 1].role === Role.USER && (
                 <div className="flex items-start gap-3 my-4 justify-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M11.9999 1.5C10.025 1.5 8.05 1.5 6.075 1.5C3.825 1.5 2.25 3.075 2.25 5.325V13.2C2.25 15.45 3.825 17.025 6.075 17.025H7.72485V19.95C7.72485 21.3 8.775 22.35 10.125 22.35C10.575 22.35 11.025 22.2 11.4 21.975L15.3 19.35H17.925C20.175 19.35 21.75 17.775 21.75 15.525V7.65C21.75 5.4 20.175 3.825 17.925 3.825H11.9999V1.5Z" /><path d="M12 1.5H17.925C20.175 1.5 21.75 3.075 21.75 5.325V7.65H12V1.5Z" opacity="0.4" /></svg>
                    </div>
                    <div className="p-4 max-w-lg shadow-md bg-white dark:bg-gray-700 dark:text-gray-200 text-gray-800 rounded-r-xl rounded-t-xl">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-75"></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150"></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-300"></div>
                        </div>
                    </div>
                 </div>
            )}
        </div>
      </main>

      <footer className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700">
        <ChatInput 
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            isThinkingMode={isThinkingMode}
            onToggleThinkingMode={handleToggleThinkingMode}
            disabled={isApiKeyMissing}
        />
      </footer>

      <ArticleModal 
        isOpen={!!modalArticle}
        onClose={handleCloseModal}
        title={modalArticle?.title ?? ''}
        content={modalArticle?.content ?? ''}
      />
    </div>
  );
};

export default App;
