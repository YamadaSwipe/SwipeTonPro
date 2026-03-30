import { useState, useEffect } from 'react';

export const useServerTime = () => {
  const [serverTime, setServerTime] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Générer le temps une seule fois au montage
    setServerTime(new Date().toLocaleTimeString('fr-FR'));
  }, []);

  return {
    serverTime: isClient ? serverTime : '---',
    isClient
  };
};

export const useStaticDate = () => {
  const [staticDate, setStaticDate] = useState<Date | null>(null);

  useEffect(() => {
    setStaticDate(new Date());
  }, []);

  return staticDate;
};
