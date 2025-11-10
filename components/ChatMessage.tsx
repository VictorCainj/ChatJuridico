
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Message, Role } from '../types';
import { legalDefinitions } from '../constants';

// These libraries are imported via <script> tags in index.html
declare const marked: { parse: (markdown: string) => string };
declare const DOMPurify: { sanitize: (html: string) => string };

interface ChatMessageProps {
  message: Message;
  onShowArticle: (articleKey: string) => void;
  onSaveDraft: (text: string) => void;
}

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-white"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      clipRule="evenodd"
    />
  </svg>
);

const BotIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-white"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M11.9999 1.5C10.025 1.5 8.05 1.5 6.075 1.5C3.825 1.5 2.25 3.075 2.25 5.325V13.2C2.25 15.45 3.825 17.025 6.075 17.025H7.72485V19.95C7.72485 21.3 8.775 22.35 10.125 22.35C10.575 22.35 11.025 22.2 11.4 21.975L15.3 19.35H17.925C20.175 19.35 21.75 17.775 21.75 15.525V7.65C21.75 5.4 20.175 3.825 17.925 3.825H11.9999V1.5Z" />
    <path d="M12 1.5H17.925C20.175 1.5 21.75 3.075 21.75 5.325V7.65H12V1.5Z" opacity="0.4" />
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// List of terms to highlight
const legalTerms = Object.keys(legalDefinitions).concat([
  'Lei do Inquilinato', 'sublocação', 'revisional de aluguel', 'ação de despejo', 'contrato de locação', 'notificação premonitória', 'jurisprudência', 'aditivo contratual', 'rescisão de contrato', 'multa contratual', 'garantia locatícia', 'seguro-fiança', 'purgação da mora', 'liminar de despejo', 'alienação do imóvel', 'prazo determinado', 'prazo indeterminado', 'reajuste do aluguel', 'índice de reajuste', 'obrigações do locador', 'obrigações do locatário', 'vistoria', 'cláusula penal', 'renovatória de aluguel', 'imóvel residencial', 'imóvel não residencial', 'locação por temporada'
]);

// Create a unique set of terms to avoid duplicates in the regex
const uniqueLegalTerms = [...new Set(legalTerms)];

const highlightPattern = new RegExp(
  `\\b(${uniqueLegalTerms.join('|')})\\b|(Art\\.|Artigo|arts\\.)\\s*\\d+[º°]?`,
  'gi'
);

const highlightLegalTerms = (html: string): string => {
  if (typeof document === 'undefined') {
    return html; 
  }
  
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;

  const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_TEXT);
  const nodesToModify: { oldNode: Node; newNode: DocumentFragment }[] = [];

  let currentNode;
  while ((currentNode = walker.nextNode())) {
    const text = currentNode.textContent;
    if (text && highlightPattern.test(text)) {
      if (['A', 'CODE', 'PRE', 'STRONG', 'B', 'I', 'EM'].includes(currentNode.parentElement?.tagName ?? '')) {
        continue;
      }
      
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      
      text.replace(highlightPattern, (match, ...args) => {
        const offset = args[args.length - 2]; 
        
        if (offset > lastIndex) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex, offset)));
        }
        
        const normalizedMatch = match.toLowerCase().replace('artigo ', 'art. ').replace('º','');
        const definition = legalDefinitions[normalizedMatch];
        const isArticle = normalizedMatch.startsWith('art.') || normalizedMatch.startsWith('lei');
        
        if (definition) {
          const tooltipWrapper = document.createElement('span');
          tooltipWrapper.className = 'relative group';

          const termStrong = document.createElement('strong');
          termStrong.className = 'font-semibold text-blue-600 dark:text-blue-400 cursor-pointer underline decoration-dotted decoration-blue-600/50 dark:decoration-blue-400/50';
          termStrong.textContent = match;

          const tooltip = document.createElement('span');
          tooltip.className = 'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-lg p-3 text-sm font-normal text-white bg-gray-800 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none whitespace-pre-line';
          
          const tooltipContent = (typeof definition === 'object' && 'summary' in definition) ? definition.summary : String(definition);
          tooltip.textContent = tooltipContent;

          if (isArticle) {
            const linksContainer = document.createElement('div');
            linksContainer.className = 'mt-2 flex items-center gap-2 pointer-events-auto';

            const modalLink = document.createElement('a');
            modalLink.href = '#';
            modalLink.textContent = 'Ver texto completo';
            modalLink.className = 'font-medium text-blue-400 hover:underline cursor-pointer';
            modalLink.dataset.articleKey = normalizedMatch;
            linksContainer.appendChild(modalLink);
            
            const separator = document.createElement('span');
            separator.className = 'text-gray-500';
            separator.textContent = '|';
            linksContainer.appendChild(separator);

            const googleLink = document.createElement('a');
            const query = `Lei do Inquilinato ${normalizedMatch.replace('art. ', 'Artigo ')}`;
            googleLink.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            googleLink.target = '_blank';
            googleLink.rel = 'noopener noreferrer';
            googleLink.textContent = 'Buscar fonte';
            googleLink.className = 'font-medium text-blue-400 hover:underline cursor-pointer';
            linksContainer.appendChild(googleLink);

            tooltip.appendChild(linksContainer);
          }

          tooltipWrapper.appendChild(termStrong);
          tooltipWrapper.appendChild(tooltip);
          fragment.appendChild(tooltipWrapper);

        } else {
          const strong = document.createElement('strong');
          strong.className = 'font-semibold text-blue-600 dark:text-blue-400';
          strong.textContent = match;
          fragment.appendChild(strong);
        }
        
        lastIndex = offset + match.length;
        return match;
      });

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
      }
      
      if (fragment.hasChildNodes()) {
          nodesToModify.push({ oldNode: currentNode, newNode: fragment });
      }
    }
  }

  nodesToModify.forEach(({ oldNode, newNode }) => {
    oldNode.parentNode?.replaceChild(newNode, oldNode);
  });

  return wrapper.innerHTML;
};


export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onShowArticle, onSaveDraft }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const isUser = message.role === Role.USER;

  useEffect(() => {
    const container = messageContainerRef.current;
    if (!container) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'A' && target.dataset.articleKey) {
        event.preventDefault();
        onShowArticle(target.dataset.articleKey);
      }
    };

    container.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, [onShowArticle]);

  const messageClasses = isUser
    ? 'bg-blue-600 text-white rounded-l-xl rounded-t-xl'
    : 'bg-white dark:bg-gray-700 rounded-r-xl rounded-t-xl';
  
  const containerClasses = isUser ? 'justify-end' : 'justify-start';
  const iconClasses = isUser ? 'bg-blue-600' : 'bg-gray-500';

  const handleCopy = () => {
    if (isCopied) return;
    navigator.clipboard.writeText(message.text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handleSaveDraft = () => {
    if (isSaved) return;
    onSaveDraft(message.text);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };


  const markup = useMemo(() => {
    if (!isUser && typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
      const rawHtml = marked.parse(message.text);
      const sanitizedHtml = DOMPurify.sanitize(rawHtml);
      const highlightedHtml = highlightLegalTerms(sanitizedHtml);
      return { __html: highlightedHtml };
    }
    return null;
  }, [message.text, isUser]);

  useEffect(() => {
    if (isUser || !messageContainerRef.current) {
        return;
    }

    const preElements = messageContainerRef.current.querySelectorAll('.prose pre');

    preElements.forEach((pre) => {
        if (pre.parentElement?.classList.contains('group/code-block')) {
            return; // Already has a copy button
        }
        
        const wrapper = document.createElement('div');
        wrapper.className = 'relative group/code-block';

        const copyButton = document.createElement('button');
        copyButton.className = 'absolute top-2 right-2 p-1.5 rounded-md bg-gray-800/60 text-gray-200 opacity-0 group-hover/code-block:opacity-100 transition-opacity hover:bg-gray-700/80 focus:outline-none focus:ring-2 focus:ring-blue-400';
        copyButton.title = 'Copiar código';
        copyButton.ariaLabel = 'Copiar código';

        const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>`;
        const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`;

        copyButton.innerHTML = copyIcon;

        copyButton.onclick = () => {
            // Fix: Cast the result of querySelector to HTMLElement to access innerText.
            const code = (pre.querySelector('code') as HTMLElement)?.innerText ?? pre.innerText;
            navigator.clipboard.writeText(code).then(() => {
                copyButton.innerHTML = checkIcon;
                setTimeout(() => {
                    copyButton.innerHTML = copyIcon;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy code: ', err);
            });
        };

        pre.parentNode?.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
        wrapper.appendChild(copyButton);
    });
  }, [markup, isUser]);
  
  return (
    <div className={`flex items-start gap-3 my-4 ${containerClasses}`}>
      {!isUser && (
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconClasses}`}>
          <BotIcon />
        </div>
      )}
      <div ref={messageContainerRef} className={`relative group/message p-4 max-w-lg shadow-md ${messageClasses}`}>
         {!isUser && (
           <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity duration-300">
             <button
                onClick={handleSaveDraft}
                className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10"
                aria-label="Salvar Rascunho"
                title="Salvar Rascunho"
            >
                {isSaved ? <CheckIcon /> : <SaveIcon />}
            </button>
            <button
                onClick={handleCopy}
                className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10"
                aria-label="Copiar mensagem"
                title="Copiar mensagem"
            >
                {isCopied ? <CheckIcon /> : <CopyIcon />}
            </button>
           </div>
        )}
        {markup ? (
            <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={markup}
            />
            ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm">{message.text}</pre>
            )}
      </div>
       {isUser && (
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconClasses}`}>
          <UserIcon />
        </div>
      )}
    </div>
  );
};
