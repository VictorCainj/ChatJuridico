
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Message, Role, Draft, ChatHistoryItem } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ArticleModal } from './components/ArticleModal';
import { MODEL_FLASH, MODEL_PRO, SYSTEM_INSTRUCTION, legalDefinitions } from './constants';
import { ArticleSearch } from './components/ArticleSearch';
import { ExamplePrompts } from './components/ExamplePrompts';
import { Sidebar } from './components/Sidebar';
import { Toast } from './components/Toast';

// Fix: Updated the API key error screen to remove instructions for the user on how to set the API key, per coding guidelines.
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
          A aplicação não pode ser inicializada. A chave de API não está configurada.
        </p>
      </div>
    </main>
  </div>
);

const EnterFocusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 1v-4m0 0h-4m4 0l-5 5" />
  </svg>
);

const ExitFocusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 4H4m0 0v4m0-4l5 5m1-5h4m0 0v4m0-4l-5 5M8 20H4m0 0v-4m0 4l5-5m1 5h4m0 0v-4m0 4l-5-5" />
  </svg>
);


const App: React.FC = () => {
  const apiKey = process.env.API_KEY;
  const isApiKeyMissing = !apiKey;

  const initialMessages: Message[] = [
    {
      role: Role.MODEL,
      text: 'Olá! Sou seu assistente jurídico especializado na Lei do Inquilinato. Como posso ajudar sua imobiliária hoje?',
    },
  ];

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalArticle, setModalArticle] = useState<{ title: string; content: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [savedDrafts, setSavedDrafts] = useState<Draft[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const chatRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // --- LOCAL STORAGE & DATA MANAGEMENT ---
  useEffect(() => {
    try {
      const drafts = JSON.parse(localStorage.getItem('chat_drafts') || '[]');
      const history = JSON.parse(localStorage.getItem('chat_history') || '[]');
      setSavedDrafts(drafts);
      setChatHistory(history);
    } catch (e) {
      console.error('Failed to load data from localStorage', e);
    }
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveDraft = (text: string) => {
    const newDraft: Draft = { id: Date.now().toString(), text };
    const updatedDrafts = [...savedDrafts, newDraft];
    setSavedDrafts(updatedDrafts);
    localStorage.setItem('chat_drafts', JSON.stringify(updatedDrafts));
    showToast('Rascunho salvo!');
  };

  const handleDeleteDraft = (id: string) => {
    const updatedDrafts = savedDrafts.filter(d => d.id !== id);
    setSavedDrafts(updatedDrafts);
    localStorage.setItem('chat_drafts', JSON.stringify(updatedDrafts));
    showToast('Rascunho excluído.');
  };

  const handleSaveChat = () => {
    if (messages.length <= 1) {
        showToast('A conversa está muito curta para ser salva.');
        return;
    }
    const title = prompt('Dê um nome para esta conversa:', 'Nova Conversa');
    if (title) {
        const newHistoryItem: ChatHistoryItem = { id: Date.now().toString(), title, messages };
        const updatedHistory = [...chatHistory, newHistoryItem];
        setChatHistory(updatedHistory);
        localStorage.setItem('chat_history', JSON.stringify(updatedHistory));
        setActiveChatId(newHistoryItem.id);
        showToast('Conversa salva!');
    }
  };

  const handleLoadChat = (id: string) => {
    const chatToLoad = chatHistory.find(c => c.id === id);
    if (chatToLoad) {
      if (window.confirm('Tem certeza de que deseja carregar esta conversa? A conversa atual será perdida se não for salva.')) {
        setMessages(chatToLoad.messages);
        setActiveChatId(id);
        showToast('Conversa carregada.');
        if (window.innerWidth < 768) setIsSidebarOpen(false); // Close sidebar on mobile after loading
      }
    }
  };

  const handleDeleteChat = (id: string) => {
     if (window.confirm('Tem certeza de que deseja excluir esta conversa?')) {
        const updatedHistory = chatHistory.filter(c => c.id !== id);
        setChatHistory(updatedHistory);
        localStorage.setItem('chat_history', JSON.stringify(updatedHistory));
        if (activeChatId === id) {
            handleNewChat();
        }
        showToast('Conversa excluída.');
    }
  };

  const handleNewChat = () => {
    setMessages(initialMessages);
    setActiveChatId(null);
    chatRef.current = null; // Reset chat instance
    initializeChat();
  };
  
  // --- CHAT INITIALIZATION & LOGIC ---
  const initializeChat = useCallback(async () => {
    if (isApiKeyMissing || chatRef.current) {
        return;
    }
    try {
        const ai = new GoogleGenAI({ apiKey });
        const model = isThinkingMode ? MODEL_PRO : MODEL_FLASH;
        const config = {
            systemInstruction: SYSTEM_INSTRUCTION,
            ...(isThinkingMode && { thinkingConfig: { thinkingBudget: 32768 } })
        };
        
        const history = activeChatId ? chatHistory.find(c => c.id === activeChatId)?.messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })) ?? [] : [];

        chatRef.current = ai.chats.create({
            model: model,
            config: config,
            history: history.slice(1, -1) // Gemeni format
        });

        setError(null);
    } catch (e) {
        console.error(e);
        setError("Falha ao inicializar o chat. Verifique a chave de API e as configurações.");
    }
  }, [isThinkingMode, isApiKeyMissing, apiKey, activeChatId, chatHistory]);

  useEffect(() => {
    // Reset and re-initialize chat when thinking mode changes or a new chat starts
    chatRef.current = null;
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
      const content = (typeof definition === 'object' && 'fullText' in definition) ? definition.fullText : String(definition);
      setModalArticle({ title: formattedTitle.toUpperCase(), content: content });
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
  
  const handleToggleFocusMode = () => setIsFocusMode(prev => !prev);


  if (isApiKeyMissing) {
    return <ApiKeyErrorScreen />;
  }

  return (
    <div className="flex h-screen font-sans bg-gray-100 dark:bg-gray-900">
      {!isFocusMode && <Sidebar 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        drafts={savedDrafts}
        history={chatHistory}
        onDeleteDraft={handleDeleteDraft}
        onLoadChat={handleLoadChat}
        onDeleteChat={handleDeleteChat}
        onNewChat={handleNewChat}
        onShowToast={showToast}
        activeChatId={activeChatId}
      />}

      <div className="flex-1 flex flex-col transition-all duration-300">
        <header className="bg-white dark:bg-gray-800 shadow-md p-4 z-10">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
                {!isFocusMode && <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 md:hidden"
                    aria-label="Toggle Sidebar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>}
                 {isFocusMode && <div className="w-8 md:hidden" />}

                <div className="flex-1 text-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Consultor Jurídico Imobiliário AI
                    </h1>
                     {!isFocusMode && <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        Potencializado por Gemini
                    </p>}
                </div>
                 <div className="flex items-center gap-2">
                     {!isFocusMode && <button 
                      onClick={handleSaveChat}
                      className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" 
                      title="Salvar Conversa Atual"
                      aria-label="Salvar Conversa Atual"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                     </button>}
                      <button
                        onClick={handleToggleFocusMode}
                        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                        title={isFocusMode ? "Sair do Modo Foco" : "Entrar no Modo Foco"}
                        aria-label={isFocusMode ? "Sair do Modo Foco" : "Entrar no Modo Foco"}
                      >
                          {isFocusMode ? <ExitFocusIcon /> : <EnterFocusIcon />}
                      </button>
                 </div>
            </div>
            {!isFocusMode && <ArticleSearch onShowArticle={handleShowArticle} />}
          </div>
        </header>
        
        <main ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
              {messages.map((msg, index) => (
                  <ChatMessage key={index} message={msg} onShowArticle={handleShowArticle} onSaveDraft={handleSaveDraft} />
              ))}
              {!isFocusMode && messages.length === 1 && !isLoading && <ExamplePrompts onPromptClick={handleSendMessage} />}
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
        <Toast message={toastMessage} />
      </div>
    </div>
  );
};

export default App;
