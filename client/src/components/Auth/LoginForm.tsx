import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: { theme: string; size: string; text: string; width: number }
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function LoginForm() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup, googleLogin } = useAuth();

  useEffect(() => {
    if (GOOGLE_CLIENT_ID && window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse
      });

      const googleButton = document.getElementById('google-signin-button');
      if (googleButton) {
        window.google.accounts.id.renderButton(googleButton, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          width: 300
        });
      }
    }
  }, []);

  const handleGoogleResponse = async (response: { credential: string }) => {
    setError('');
    setIsLoading(true);
    try {
      await googleLogin(response.credential);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות עם Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignup) {
        await signup({ email, password, fullName });
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError('');
    setEmail('');
    setPassword('');
    setFullName('');
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h1>מנהל משימות טיפול בבעלי חיים</h1>
        <h2>{isSignup ? 'הרשמה' : 'התחברות'}</h2>

        {error && <div className="error-message">{error}</div>}

        {isSignup && (
          <div className="form-group">
            <label htmlFor="fullName">שם מלא</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">אימייל</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">סיסמה</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            minLength={6}
          />
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary" style={{ width: '100%' }}>
          {isLoading ? 'טוען...' : isSignup ? 'הרשמה' : 'התחברות'}
        </button>

        {GOOGLE_CLIENT_ID && (
          <>
            <div className="auth-divider">
              <span>או</span>
            </div>
            <div id="google-signin-button" className="google-button-container"></div>
          </>
        )}

        <div className="auth-toggle">
          <span>{isSignup ? 'כבר יש לך חשבון?' : 'אין לך חשבון?'}</span>
          <button type="button" onClick={toggleMode} className="btn-link">
            {isSignup ? 'התחברות' : 'הרשמה'}
          </button>
        </div>
      </form>
    </div>
  );
}
