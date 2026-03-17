import React, { useState, useEffect } from 'react';
import api from '../api';
import CreateProduct from './CreateProduct';

function Products({ role }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);

  const loadProducts = async () => {
    try {
      const res = await api.get('/api/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Ошибка загрузки товаров', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Удалить товар?')) {
      try {
        await api.delete(`/api/products/${id}`);
        loadProducts();
      } catch (err) {
        alert('Ошибка удаления');
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
  };

  const handleUpdate = async (updatedProduct) => {
    try {
      await api.put(`/api/products/${updatedProduct.id}`, updatedProduct);
      setEditingProduct(null);
      loadProducts();
    } catch (err) {
      alert('Ошибка обновления');
    }
  };

  if (loading) return <p>Загрузка товаров...</p>;

  const canCreate = role === 'seller' || role === 'admin';
  const canEdit = role === 'seller' || role === 'admin';
  const canDelete = role === 'admin';

  return (
    <div className="card">
      <h2><i className="fas fa-cubes"></i> Товары</h2>

      {editingProduct ? (
        <div>
          <h3>Редактировать товар</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleUpdate(editingProduct);
          }}>
            <input
              type="text"
              value={editingProduct.title}
              onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })}
              placeholder="Название"
              required
            />
            <input
              type="text"
              value={editingProduct.category}
              onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
              placeholder="Категория"
              required
            />
            <textarea
              value={editingProduct.description}
              onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
              placeholder="Описание"
              required
            />
            <input
              type="number"
              step="0.01"
              value={editingProduct.price}
              onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
              placeholder="Цена"
              required
            />
            <button type="submit">Сохранить</button>
            <button type="button" onClick={() => setEditingProduct(null)}>Отмена</button>
          </form>
        </div>
      ) : (
        canCreate && <CreateProduct onProductCreated={loadProducts} />
      )}

      <div className="product-list">
        {products.length === 0 ? (
          <p>Товаров пока нет</p>
        ) : (
          products.map(p => (
            <div key={p.id} className="product-item">
              <div className="product-title">
                <span>{p.title}</span>
                <span className="product-price">{p.price} ₽</span>
              </div>
              <div className="product-category">{p.category}</div>
              <div className="product-description">{p.description}</div>
              <div className="product-id">ID: {p.id}</div>
              {(canEdit || canDelete) && (
                <div className="product-actions">
                  {canEdit && <button onClick={() => handleEdit(p)}>Редактировать</button>}
                  {canDelete && <button onClick={() => handleDelete(p.id)}>Удалить</button>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Products;