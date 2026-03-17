import React, { useState, useEffect } from 'react';
import api from '../api';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState('');

  const loadUsers = async () => {
    try {
      const res = await api.get('/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Ошибка загрузки пользователей', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Заблокировать пользователя?')) {
      try {
        await api.delete(`/api/users/${id}`);
        loadUsers();
      } catch (err) {
        alert('Ошибка блокировки');
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser({ ...user });
  };

  const handleUpdate = async (updatedUser) => {
    try {
      await api.put(`/api/users/${updatedUser.id}`, updatedUser);
      setEditingUser(null);
      loadUsers();
      setMessage({ type: 'success', text: 'Пользователь обновлён' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Ошибка обновления' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditingUser({ ...editingUser, [name]: value });
  };

  if (loading) return <p>Загрузка пользователей...</p>;

  return (
    <div className="card">
      <h2><i className="fas fa-users"></i> Управление пользователями</h2>
      {message && <div className={`message ${message.type}`}>{message.text}</div>}

      {editingUser ? (
        <div>
          <h3>Редактировать пользователя</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleUpdate(editingUser);
          }}>
            <div className="form-group">
              <label>Имя</label>
              <input type="text" name="first_name" value={editingUser.first_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Фамилия</label>
              <input type="text" name="last_name" value={editingUser.last_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={editingUser.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Роль</label>
              <select name="role" value={editingUser.role} onChange={handleChange}>
                <option value="user">Пользователь</option>
                <option value="seller">Продавец</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <button type="submit">Сохранить</button>
            <button type="button" onClick={() => setEditingUser(null)}>Отмена</button>
          </form>
        </div>
      ) : (
        <div className="user-list">
          {users.length === 0 ? (
            <p>Нет пользователей</p>
          ) : (
            users.map(u => (
              <div key={u.id} className="user-item">
                <p><strong>{u.first_name} {u.last_name}</strong> ({u.email})</p>
                <p>Роль: {u.role} | Активен: {u.active ? 'Да' : 'Нет'}</p>
                <div className="user-actions">
                  <button onClick={() => handleEdit(u)}>Редактировать</button>
                  {u.active && <button onClick={() => handleDelete(u.id)}>Заблокировать</button>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Users;