import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Products from './components/Products';
import Users from './components/Users';
import LogoutButton from './components/LogoutButton';
import api from './api';
import './styles.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUsers, setShowUsers] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.get('/api/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setShowUsers(false);
  };

  if (loading) return <div className="container">Загрузка...</div>;

  return (
    <div className="container">
      <h1>
        <i className="fas fa-store"></i> Магазин с JWT + refresh + RBAC
      </h1>

      {!user ? (
        <>
          <div className="grid">
            <Register />
            <Login onLogin={handleLogin} />
          </div>
        </>
      ) : (
        <>
          <div className="user-info">
            <p>
              <strong>Пользователь:</strong> {user.first_name} {user.last_name} ({user.email}) 
              <span className="user-role"> Роль: {user.role}</span>
            </p>
            <LogoutButton onLogout={handleLogout} />
          </div>
          {user.role === 'admin' && (
            <div style={{ marginBottom: '1rem' }}>
              <button onClick={() => setShowUsers(!showUsers)}>
                {showUsers ? 'Скрыть пользователей' : 'Управление пользователями'}
              </button>
            </div>
          )}
          {showUsers && user.role === 'admin' ? (
            <Users />
          ) : (
            <Products role={user.role} />
          )}
        </>
      )}
    </div>
  );
}

export default App;