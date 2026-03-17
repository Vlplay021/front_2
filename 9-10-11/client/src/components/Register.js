import React, { useState } from 'react';
import api from '../api';

function Register() {
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', password: '' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/auth/register', form);
      setMessage({ type: 'success', text: 'Регистрация успешна! Теперь можно войти.' });
      setForm({ email: '', first_name: '', last_name: '', password: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Ошибка регистрации' });
    }
  };

  return (
    <div className="card">
      <h2><i className="fas fa-user-plus"></i> Регистрация</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Имя</label>
          <input type="text" name="first_name" value={form.first_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Фамилия</label>
          <input type="text" name="last_name" value={form.last_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Пароль</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required />
        </div>
        <button type="submit">Зарегистрироваться</button>
        {message && <div className={`message ${message.type}`}>{message.text}</div>}
      </form>
    </div>
  );
}

export default Register;