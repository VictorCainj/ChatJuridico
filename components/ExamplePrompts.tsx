import React from 'react';

interface ExamplePromptsProps {
  onPromptClick: (prompt: string) => void;
}

const prompts = [
  'Qual o prazo mínimo para um contrato de aluguel residencial?',
  'O inquilino pode devolver o imóvel antes do prazo? Qual a multa?',
  'Quem é responsável por pagar o IPTU, o locador ou o locatário?',
  'Como funciona a quebra de contrato por parte do locador?',
];

const PromptIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PromptCard: React.FC<{ text: string; onClick: () => void }> = ({ text, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    aria-label={`Perguntar: ${text}`}
  >
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0">
        <PromptIcon />
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{text}</p>
    </div>
  </button>
);

export const ExamplePrompts: React.FC<ExamplePromptsProps> = ({ onPromptClick }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-2">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 text-center">Experimente perguntar:</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {prompts.map((prompt) => (
          <PromptCard key={prompt} text={prompt} onClick={() => onPromptClick(prompt)} />
        ))}
      </div>
    </div>
  );
};
