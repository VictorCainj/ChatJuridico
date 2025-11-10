
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Message, Role } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ArticleModal } from './components/ArticleModal';
import { MODEL_FLASH, MODEL_PRO, SYSTEM_INSTRUCTION, legalDefinitions } from './constants';

const App: React.FC = () => {
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
    try {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  }, [isThinkingMode]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);


  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleToggleThinkingMode = () => {
    setIsThinkingMode(prev => !prev);
    // The useEffect hook with `initializeChat` will handle re-initialization
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
    setIsLoading(true);
    setError(null);
    const userMessage: Message = { role: Role.USER, text: userInput };
    setMessages(prev => [...prev, userMessage]);

    try {
        if (!chatRef.current) {
            await initializeChat();
            if (!chatRef.current) {
                throw new Error("Chat not initialized after attempt.");
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
