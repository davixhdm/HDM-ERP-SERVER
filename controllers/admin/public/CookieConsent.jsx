import { useState } from 'react';
import Button from '../ui/Button';

const CookieConsent = () => {
  const [hidden, setHidden] = useState(localStorage.getItem('cookieConsent') === 'true');

  const accept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setHidden(true);
  };

  if (hidden) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 dark:bg-gray-800 text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-50">
      <p className="text-sm">We use cookies to improve your experience. By continuing, you agree to our <a href="/legal/cookies" className="underline text-primary-400">Cookie Policy</a>.</p>
      <Button variant="primary" size="sm" onClick={accept}>Accept</Button>
    </div>
  );
};
export default CookieConsent;