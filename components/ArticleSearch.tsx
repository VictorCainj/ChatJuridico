import React, { useState, useMemo, useCallback } from 'react';
import { legalDefinitions } from '../constants';

interface ArticleSearchProps {
  onShowArticle: (articleKey: string) => void;
}

// Levenshtein distance function for fuzzy matching
const levenshtein = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // Deletion
        matrix[i][j - 1] + 1,      // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return matrix[a.length][b.length];
};

export const ArticleSearch: React.FC<ArticleSearchProps> = ({ onShowArticle }) => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const results = useMemo(() => {
        const lowerCaseQuery = query.toLowerCase().trim();
        if (lowerCaseQuery.length < 3) return [];

        // Threshold for fuzzy matching in content. More lenient for longer queries.
        const contentThreshold = lowerCaseQuery.length > 5 ? 2 : 1;

        const searchResults = Object.entries(legalDefinitions)
            .map(([key, value]) => {
                const title = key;
                const content = typeof value === 'string' ? value : `${value.summary || ''} ${value.fullText || ''}`;
                
                const lowerCaseTitle = title.toLowerCase();
                const lowerCaseContent = content.toLowerCase();

                // Score for title match (fuzzy) - high weight
                let titleScore = 0;
                const titleThreshold = Math.max(1, Math.floor(lowerCaseQuery.length / 5));
                const titleDistance = levenshtein(lowerCaseQuery, lowerCaseTitle);
                if (titleDistance <= titleThreshold) {
                    titleScore = 10 * (1 - (titleDistance / lowerCaseTitle.length));
                }

                // Score for content match (substring and fuzzy) - lower weight
                let contentScore = 0;
                
                // 1. Prioritize exact substring match in content
                if (lowerCaseContent.includes(lowerCaseQuery)) {
                    contentScore = 3;
                }

                // 2. Fuzzy word match in content
                const contentWords = lowerCaseContent.split(/[\s,.;\-()]+/);
                let bestContentWordDistance = Infinity;

                for (const word of contentWords) {
                    // Optimization: if word length difference is too big, it's not a match
                    if (Math.abs(word.length - lowerCaseQuery.length) > contentThreshold) {
                        continue;
                    }
                    const distance = levenshtein(lowerCaseQuery, word);
                    if (distance < bestContentWordDistance) {
                        bestContentWordDistance = distance;
                    }
                    if (bestContentWordDistance === 0) break; // Perfect match found
                }
                
                if (bestContentWordDistance <= contentThreshold) {
                    const fuzzyScore = 2 * (1 - (bestContentWordDistance / lowerCaseQuery.length));
                    // Use the higher score between substring and fuzzy match
                    contentScore = Math.max(contentScore, fuzzyScore);
                }
                
                const totalScore = titleScore + contentScore;

                return { 
                    key, 
                    title: key.replace(/art\. /g, 'Artigo ').replace(/º/g, '').toUpperCase(), 
                    content: typeof value === 'string' ? value : value.summary,
                    score: totalScore 
                };
            })
            .filter(result => result.score > 1.5) // Stricter filter for more relevant results
            .sort((a, b) => b.score - a.score)
            .slice(0, 7);

        return searchResults;
    }, [query]);
    
    const handleResultClick = useCallback((key: string) => {
        onShowArticle(key);
        setQuery('');
        setIsFocused(false);
    }, [onShowArticle]);

    return (
        <div className="relative max-w-md mx-auto">
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                        <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                </span>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    placeholder="Pesquisar artigos e termos jurídicos..."
                    className="w-full py-2 pl-10 pr-4 text-gray-700 bg-white border border-gray-300 rounded-full dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Pesquisar artigos e termos jurídicos"
                />
            </div>
            {isFocused && query.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-80 overflow-y-auto">
                    {results.length > 0 ? (
                        <ul>
                            {results.map(({ key, title, content }) => (
                                <li 
                                    key={key} 
                                    onMouseDown={() => handleResultClick(key)}
                                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                                >
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{title}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{content}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            Nenhum resultado encontrado.
                         </div>
                    )}
                </div>
            )}
        </div>
    );
};