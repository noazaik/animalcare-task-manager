import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { Header } from './components/Layout/Header';
import { BottomNav } from './components/Layout/BottomNav';
import { TaskList } from './components/Tasks/TaskList';
import { UserList } from './components/Settings/UserList';

type Page = 'tasks' | 'settings';

function App() {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('tasks');

  if (isLoading) {
    return (
      <div className="login-container">
        <div className="loading">טוען...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const isAdmin = user.role === 'ADMIN';

  return (
    <div className={`app-container ${isAdmin ? 'has-bottom-nav' : ''}`}>
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="main-content">
        {currentPage === 'tasks' && <TaskList />}
        {currentPage === 'settings' && isAdmin && <UserList />}
      </main>
      <BottomNav
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isAdmin={isAdmin}
      />
    </div>
  );
}

export default App;
