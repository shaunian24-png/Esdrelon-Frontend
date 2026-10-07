import { useEffect, useState } from 'react';
import { AuthAPI, clearSession, loadSession, saveSession } from './api.js';
import FlameBackground from './components/FlameBackground.jsx';
import AuthPage from './components/AuthPage.jsx';
import ProductsPage from './components/ProductsPage.jsx';

export default function App() {
  const [session, setSession] = useState(() => loadSession());

  // The axios interceptor fires this when the refresh token is no longer valid.
  useEffect(() => {
    const onForcedLogout = () => setSession(null);
    window.addEventListener('auth:logout', onForcedLogout);
    return () => window.removeEventListener('auth:logout', onForcedLogout);
  }, []);

  const handleLoggedIn = (data) => {
    const next = { user: data.user, tokens: data.tokens };
    saveSession(next);
    setSession(next);
  };

  const handleLogout = async () => {
    const refreshToken = session?.tokens?.refresh_token;
    try {
      if (refreshToken) await AuthAPI.logout(refreshToken); // revoke it on the server
    } catch {
      /* even if the server is unreachable we still log out locally */
    }
    clearSession();
    setSession(null);
  };

  return (
    <div className="app-shell">
      <FlameBackground />
      <div className="app-content">
        {session ? (
          <ProductsPage user={session.user} onLogout={handleLogout} />
        ) : (
          <AuthPage onLoggedIn={handleLoggedIn} />
        )}
      </div>
    </div>
  );
}
