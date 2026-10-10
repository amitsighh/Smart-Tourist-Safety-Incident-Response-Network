import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('suraksha_high_contrast') === 'true';
  });

  const [fontSizeScale, setFontSizeScale] = useState(() => {
    return localStorage.getItem('suraksha_font_scale') || 'normal'; // 'normal', 'large', 'xlarge'
  });

  useEffect(() => {
    localStorage.setItem('suraksha_high_contrast', highContrast);
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('suraksha_font_scale', fontSizeScale);
    document.documentElement.classList.remove('text-scale-normal', 'text-scale-large', 'text-scale-xlarge');
    document.documentElement.classList.add(`text-scale-${fontSizeScale}`);
  }, [fontSizeScale]);

  return (
    <AccessibilityContext.Provider value={{
      highContrast,
      toggleHighContrast: () => setHighContrast(prev => !prev),
      fontSizeScale,
      setFontSizeScale
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
