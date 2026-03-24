import React, { useState } from 'react';
import api from '../api';

function CreateProduct({ onProductCreated }) {
  const [form, setForm] = useState({ title: '', category: '', description: '', price: '', imageUrl: '' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/products', {
        ...form,
        price: parseFloat(form.price)
      });
      setMessage({ type: 'success', text: 'Товар добавлен' });
      setForm({ title: '', category: '', description: '', price: '', imageUrl: '' });
      onProductCreated();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Ошибка' });
    }
  };

  return (
    <div>
      <h3>Добавить товар</h3>
      <form onSubmit={handleSubmit}>
        <input type="text" name="title" placeholder="Название" value={form.title} onChange={handleChange} required />
        <input type="text" name="category" placeholder="Категория" value={form.category} onChange={handleChange} required />
        <textarea name="description" placeholder="Описание" value={form.description} onChange={handleChange} required />
        <input type="number" step="0.01" name="price" placeholder="Цена" value={form.price} onChange={handleChange} required />
        <input type="text" name="imageUrl" placeholder="URL картинки (опционально)" value={form.imageUrl} onChange={handleChange} />
        <button type="submit">Добавить</button>
      </form>
      {message && <div className={`message ${message.type}`}>{message.text}</div>}
    </div>
  );
}

export default CreateProduct;