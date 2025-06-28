import { useState, useEffect } from 'react';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobileRegex = /android|blackberry|iemobile|ipad|iphone|ipod|opera mini|webos/i;
      const screenWidth = window.innerWidth <= 768;
      
      setIsMobile(mobileRegex.test(userAgent.toLowerCase()) || screenWidth);
    };

    checkMobile();
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isMobile;
};

export default useIsMobile; 