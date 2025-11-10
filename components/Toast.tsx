
import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2800); // Should be slightly less than the parent timeout
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div
      className={`
        fixed bottom-5 left-1/2 -translate-x-1/2 
        bg-gray-800 text-white text-sm font-semibold 
        py-2 px-4 rounded-full shadow-lg
        transition-all duration-300 ease-in-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        z-50
      `}
      role="alert"
      aria-live="assertive"
    >
      {message}
    </div>
  );
};
