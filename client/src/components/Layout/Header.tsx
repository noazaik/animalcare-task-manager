import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  currentPage?: 'tasks' | 'settings';
  onNavigate?: (page: 'tasks' | 'settings') => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-right">
          <h1>מנהל משימות טיפול בבעלי חיים</h1>
          {isAdmin && onNavigate && (
            <nav className="header-nav">
              <button
                className={`header-nav-item ${currentPage === 'tasks' ? 'active' : ''}`}
                onClick={() => onNavigate('tasks')}
              >
                משימות
              </button>
              <button
                className={`header-nav-item ${currentPage === 'settings' ? 'active' : ''}`}
                onClick={() => onNavigate('settings')}
              >
                הגדרות
              </button>
            </nav>
          )}
        </div>
        <div className="user-info">
          <span className="user-name">
            {user?.username}
            {isAdmin && <span className="admin-badge">מנהל</span>}
          </span>
          <button onClick={logout} className="btn-logout">
            התנתק
          </button>
        </div>
      </div>
    </header>
  );
}
