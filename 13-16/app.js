// ------------------- Глобальные переменные -------------------
const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');
const enablePushBtn = document.getElementById('enable-push');
const disablePushBtn = document.getElementById('disable-push');

let socket = null;
let currentPage = 'home';

// VAPID публичный ключ (скопируйте сгенерированный)
const VAPID_PUBLIC_KEY = 'BFCLwawGwhLMs4t5f-sPxXQxjLeYe1jX9_JYB5oYyGYCu8zk4RlmhYhWJ4UJnLMfxIFQl9fA8KLCOUR72Bs2zas';

// ------------------- Навигация (App Shell) -------------------
function setActiveButton(activeId) {
  [homeBtn, aboutBtn].forEach(btn => btn.classList.remove('active'));
  document.getElementById(activeId).classList.add('active');
}

async function loadContent(page) {
  try {
    const response = await fetch(`content/${page}.html`);
    const html = await response.text();
    contentDiv.innerHTML = html;
    currentPage = page;
    if (page === 'home') {
      initNotes();      // инициализируем форму и список заметок
    }
  } catch (err) {
    contentDiv.innerHTML = '<p class="is-center text-error">Ошибка загрузки страницы.</p>';
    console.error(err);
  }
}

homeBtn.addEventListener('click', () => {
  setActiveButton('home-btn');
  loadContent('home');
});
aboutBtn.addEventListener('click', () => {
  setActiveButton('about-btn');
  loadContent('about');
});

// ------------------- Работа с заметками (localStorage) -------------------
function loadNotes() {
  const notes = JSON.parse(localStorage.getItem('notes') || '[]');
  const notesList = document.getElementById('notes-list');
  if (notesList) {
    notesList.innerHTML = notes.map(note => {
      let reminderInfo = '';
      if (note.reminder) {
        const date = new Date(note.reminder);
        reminderInfo = `<br><small style="color: #e67e22;">⏰ Напоминание: ${date.toLocaleString()}</small>`;
      }
      return `<li style="margin-bottom: 0.5rem; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                ${note.text} <small>${note.datetime || ''}</small>
                ${reminderInfo}
              </li>`;
    }).join('');
  }
}

function saveNoteToLocalStorage(note) {
  const notes = JSON.parse(localStorage.getItem('notes') || '[]');
  notes.push(note);
  localStorage.setItem('notes', JSON.stringify(notes));
  loadNotes();
}

function addNote(text, reminder = null) {
  const newNote = {
    id: Date.now(),
    text: text,
    datetime: new Date().toLocaleString(),
    reminder: reminder  // timestamp или null
  };
  saveNoteToLocalStorage(newNote);

  // Отправляем событие через WebSocket для синхронизации
  if (socket && socket.connected) {
    socket.emit('newTask', newNote);
  }
}

function addReminderNote(text, reminderTimestamp) {
  const newNote = {
    id: Date.now(),
    text: text,
    datetime: new Date().toLocaleString(),
    reminder: reminderTimestamp
  };
  saveNoteToLocalStorage(newNote);

  // Отправляем задачу для синхронизации
  if (socket && socket.connected) {
    socket.emit('newTask', newNote);
    // Отдельное событие для планирования push-уведомления на сервере
    socket.emit('newReminder', {
      id: newNote.id,
      text: text,
      reminderTime: reminderTimestamp
    });
  }
}

function initNotes() {
  const form = document.getElementById('note-form');
  const input = document.getElementById('note-input');
  const reminderForm = document.getElementById('reminder-form');
  const reminderText = document.getElementById('reminder-text');
  const reminderTime = document.getElementById('reminder-time');
  
  if (!form) return;
  
  loadNotes();
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
      addNote(text);
      input.value = '';
    }
  });
  
  if (reminderForm) {
    reminderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = reminderText.value.trim();
      const timeValue = reminderTime.value;
      if (text && timeValue) {
        const timestamp = new Date(timeValue).getTime();
        if (timestamp > Date.now()) {
          addReminderNote(text, timestamp);
          reminderText.value = '';
          reminderTime.value = '';
        } else {
          alert('Дата и время напоминания должны быть в будущем');
        }
      }
    });
  }
}

// ------------------- WebSocket (Socket.IO) -------------------
function initWebSocket() {
  socket = io('http://localhost:3001');
  socket.on('connect', () => console.log('WebSocket подключён'));
  socket.on('taskAdded', (task) => {
    console.log('Новая задача от другого клиента:', task);
    // Сохраняем полученную заметку в localStorage
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    // Проверяем, нет ли уже такой заметки по id
    if (!notes.some(n => n.id === task.id)) {
      notes.push(task);
      localStorage.setItem('notes', JSON.stringify(notes));
      loadNotes();
    }
    // Показываем всплывающее сообщение
    const notificationDiv = document.createElement('div');
    notificationDiv.textContent = `📌 Новая заметка: ${task.text}`;
    notificationDiv.style.cssText = `
      position: fixed; top: 10px; right: 10px; background: #4285f4;
      color: white; padding: 1rem; border-radius: 5px; z-index: 1000;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(notificationDiv);
    setTimeout(() => notificationDiv.remove(), 3000);
  });
}

// ------------------- Push-уведомления -------------------
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Push не поддерживается');
    return;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    await fetch('http://localhost:3001/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    console.log('Подписка на push отправлена');
  } catch (err) {
    console.error('Ошибка подписки на push:', err);
  }
}

async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await fetch('http://localhost:3001/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint })
    });
    await subscription.unsubscribe();
    console.log('Отписка выполнена');
  }
}

// ------------------- Регистрация Service Worker и управление кнопками Push -------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker зарегистрирован:', registration.scope);

      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        enablePushBtn.style.display = 'none';
        disablePushBtn.style.display = 'inline-block';
      } else {
        enablePushBtn.style.display = 'inline-block';
        disablePushBtn.style.display = 'none';
      }

      enablePushBtn.addEventListener('click', async () => {
        if (Notification.permission === 'denied') {
          alert('Уведомления запрещены. Разрешите их в настройках браузера.');
          return;
        }
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            alert('Необходимо разрешить уведомления.');
            return;
          }
        }
        await subscribeToPush();
        enablePushBtn.style.display = 'none';
        disablePushBtn.style.display = 'inline-block';
      });

      disablePushBtn.addEventListener('click', async () => {
        await unsubscribeFromPush();
        disablePushBtn.style.display = 'none';
        enablePushBtn.style.display = 'inline-block';
      });

    } catch (err) {
      console.error('Ошибка регистрации SW:', err);
    }
  });
}

// ------------------- Инициализация приложения -------------------
loadContent('home');
initWebSocket();