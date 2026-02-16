interface BottomNavProps {
  currentPage: 'tasks' | 'settings';
  onNavigate: (page: 'tasks' | 'settings') => void;
  isAdmin: boolean;
}

export function BottomNav({ currentPage, onNavigate, isAdmin }: BottomNavProps) {
  if (!isAdmin) {
    return null;
  }

  return (
    <nav className="bottom-nav">
      <button
        className={`bottom-nav-item ${currentPage === 'tasks' ? 'active' : ''}`}
        onClick={() => onNavigate('tasks')}
      >
        <span className="bottom-nav-icon">&#128203;</span>
        <span className="bottom-nav-label">משימות</span>
      </button>
      <button
        className={`bottom-nav-item ${currentPage === 'settings' ? 'active' : ''}`}
        onClick={() => onNavigate('settings')}
      >
        <span className="bottom-nav-icon">&#9881;</span>
        <span className="bottom-nav-label">הגדרות</span>
      </button>
    </nav>
  );
}
