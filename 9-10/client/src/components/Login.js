import React, { useState } from 'react';
import api from '../api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { accessToken, refreshToken } = response.data;

      // Получаем информацию о пользователе
      const userRes = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      onLogin(userRes.data, accessToken, refreshToken);
      setMessage({ type: 'success', text: 'Вход выполнен' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Ошибка входа' });
    }
  };

  return (
    <div className="card">
      <h2><i className="fas fa-sign-in-alt"></i> Вход</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Пароль</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit">Войти</button>
        {message && <div className={`message ${message.type}`}>{message.text}</div>}
      </form>
    </div>
  );
}

export default Login;