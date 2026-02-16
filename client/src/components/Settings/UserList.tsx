import { useState, useEffect } from 'react';
import { getUsers } from '../../services/api';
import { UserListItem } from '../../types';

export function UserList() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה בטעינת משתמשים');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  if (loading) {
    return <div className="loading">טוען משתמשים...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const getRoleLabel = (role: string) => {
    return role === 'ADMIN' ? 'מנהל' : 'משתמש';
  };

  return (
    <div className="settings-container">
      <h2 className="settings-title">ניהול משתמשים</h2>

      <div className="user-list">
        {users.length === 0 ? (
          <div className="empty-state">אין משתמשים להצגה</div>
        ) : (
          users.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-card-header">
                <span className="user-card-name">{user.fullName}</span>
                <span className={`role-badge ${user.role.toLowerCase()}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
              <div className="user-card-email">
                {user.email || 'אין כתובת אימייל'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
