import React, { useEffect, useState } from 'react';

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [rating, setRating] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initialProduct) {
      setName(initialProduct.name || '');
      setCategory(initialProduct.category || '');
      setDescription(initialProduct.description || '');
      setPrice(initialProduct.price?.toString() || '');
      setStock(initialProduct.stock?.toString() || '');
      setRating(initialProduct.rating?.toString() || '');
      setImage(initialProduct.image || '');
    } else {
      setName('');
      setCategory('');
      setDescription('');
      setPrice('');
      setStock('');
      setRating('');
      setImage('');
    }
  }, [open, initialProduct]);

  if (!open) return null;

  const title = mode === 'edit' ? 'Редактирование товара' : 'Создание товара';

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const trimmedDesc = description.trim();
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    const parsedRating = rating ? Number(rating) : null;

    if (!trimmedName || !trimmedCategory || !trimmedDesc) {
      alert('Заполните название, категорию и описание');
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      alert('Введите корректную цену (больше 0)');
      return;
    }
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      alert('Введите корректное количество (целое неотрицательное число)');
      return;
    }
    if (parsedRating !== null && (parsedRating < 0 || parsedRating > 5)) {
      alert('Рейтинг должен быть от 0 до 5');
      return;
    }

    onSubmit({
      id: initialProduct?.id,
      name: trimmedName,
      category: trimmedCategory,
      description: trimmedDesc,
      price: parsedPrice,
      stock: parsedStock,
      rating: parsedRating,
      image: image.trim() || null,
    });
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__header">
          <div className="modal__title">{title}</div>
          <button className="iconBtn" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название *
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Ноутбук"
              autoFocus
            />
          </label>
          <label className="label">
            Категория *
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Электроника"
            />
          </label>
          <label className="label">
            Описание *
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание"
              rows="2"
            />
          </label>
          <label className="label">
            Цена (₽) *
            <input
              className="input"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="1200"
              min="0.01"
              step="0.01"
            />
          </label>
          <label className="label">
            Количество на складе *
            <input
              className="input"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="10"
              min="0"
              step="1"
            />
          </label>
          <label className="label">
            Рейтинг (0–5)
            <input
              className="input"
              type="number"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="4.5"
              min="0"
              max="5"
              step="0.1"
            />
          </label>
          <label className="label">
            URL фото
            <input
              className="input"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </label>
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn--primary">
              {mode === 'edit' ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}