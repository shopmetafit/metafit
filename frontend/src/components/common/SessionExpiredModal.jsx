import { useEffect, useState } from 'react';
import { AlertTriangle, LogIn } from 'lucide-react';

const SessionExpiredModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      setIsOpen(true);
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, []);

  const handleLogin = () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '/login';
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
        <div 
          className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl transition-all border border-slate-100 flex flex-col"
          style={{ animation: 'slideUp 0.3s ease-out' }}
        >
          <div className="p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 mb-4">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Session Expired</h2>
            <p className="text-slate-500 mb-6">
              Your session has expired or the token failed. Please re-login in MWelnessBazaar to continue.
            </p>
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-700 active:scale-[0.98]"
            >
              <LogIn size={18} />
              Go to Login
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default SessionExpiredModal;
