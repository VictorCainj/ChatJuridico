
import React, { useState } from 'react';
import { Draft, ChatHistoryItem } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  drafts: Draft[];
  history: ChatHistoryItem[];
  onDeleteDraft: (id: string) => void;
  onLoadChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onNewChat: () => void;
  onShowToast: (message: string) => void;
  activeChatId: string | null;
}

type ActiveTab = 'history' | 'drafts';

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);


export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, drafts, history, onDeleteDraft, onLoadChat, onDeleteChat, onNewChat, onShowToast, activeChatId }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('history');

  const handleCopyDraft = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        onShowToast('Rascunho copiado para a área de transferência!');
    }).catch(err => {
        console.error('Failed to copy draft: ', err);
        onShowToast('Falha ao copiar rascunho.');
    });
  };

  return (
    <div className={`
        fixed inset-y-0 left-0 z-30
        md:relative md:translate-x-0
        w-72 bg-gray-50 dark:bg-gray-800 
        border-r border-gray-200 dark:border-gray-700
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Gerenciador</h2>
            <button onClick={onToggle} className="md:hidden p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        
        <div className="p-2">
           <button onClick={onNewChat} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
             Nova Conversa
           </button>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
                <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 px-1 text-center border-b-2 text-sm font-medium ${activeTab === 'history' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    Histórico ({history.length})
                </button>
                <button onClick={() => setActiveTab('drafts')} className={`flex-1 py-3 px-1 text-center border-b-2 text-sm font-medium ${activeTab === 'drafts' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    Rascunhos ({drafts.length})
                </button>
            </nav>
        </div>

        <div className="flex-grow overflow-y-auto p-2 space-y-2">
            {activeTab === 'history' && (
                history.length > 0 ? history.map(item => (
                    <div key={item.id} className={`group flex items-center justify-between p-2 rounded-md cursor-pointer ${activeChatId === item.id ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                        <span onClick={() => onLoadChat(item.id)} className="flex-1 truncate text-sm text-gray-800 dark:text-gray-200">{item.title}</span>
                        <button onClick={() => onDeleteChat(item.id)} className="ml-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TrashIcon />
                        </button>
                    </div>
                )) : <p className="text-center text-sm text-gray-500 p-4">Nenhuma conversa salva.</p>
            )}

            {activeTab === 'drafts' && (
                drafts.length > 0 ? drafts.map(draft => (
                    <div key={draft.id} className="group flex items-center justify-between p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                         <p className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{draft.text}</p>
                         <div className="ml-2 flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleCopyDraft(draft.text)} className="p-1 text-gray-400 hover:text-blue-500">
                              <CopyIcon />
                            </button>
                            <button onClick={() => onDeleteDraft(draft.id)} className="p-1 text-gray-400 hover:text-red-500">
                               <TrashIcon />
                            </button>
                         </div>
                    </div>
                )) : <p className="text-center text-sm text-gray-500 p-4">Nenhum rascunho salvo.</p>
            )}
        </div>
    </div>
  );
};
