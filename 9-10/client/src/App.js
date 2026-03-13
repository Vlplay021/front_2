import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Products from './components/Products';
import LogoutButton from './components/LogoutButton';
import api from './api';
import './styles.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // При загрузке проверяем, есть ли accessToken, и получаем данные пользователя
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
  };

  if (loading) return <div className="container">Загрузка...</div>;

  return (
    <div className="container">
      <h1>
        <i className="fas fa-store"></i> Магазин с JWT + refresh
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
            </p>
            <LogoutButton onLogout={handleLogout} />
          </div>
          <Products />
        </>
      )}
    </div>
  );
}

export default App;