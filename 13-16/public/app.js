// ---------- App Shell навигация ----------
const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');

function setActiveButton(activeId) {
  [homeBtn, aboutBtn].forEach(btn => btn.classList.remove('active'));
  document.getElementById(activeId).classList.add('active');
}

async function loadContent(page) {
  try {
    const response = await fetch(`/content/${page}.html`);
    const html = await response.text();
    contentDiv.innerHTML = html;
    if (page === 'home') initNotes();
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

// Загружаем начальную страницу
loadContent('home');

// ---------- Работа с заметками (localStorage) ----------
function loadNotes() {
  const notes = JSON.parse(localStorage.getItem('notes') || '[]');
  const list = document.getElementById('notes-list');
  if (list) {
    list.innerHTML = notes.map(note => `<li>${note.text} <small>${note.datetime || ''}</small></li>`).join('');
  }
}

function addNote(text, datetime) {
  const notes = JSON.parse(localStorage.getItem('notes') || '[]');
  const newNote = { id: Date.now(), text, datetime: datetime || new Date().toLocaleString() };
  notes.push(newNote);
  localStorage.setItem('notes', JSON.stringify(notes));
  loadNotes();

  // Отправляем событие через WebSocket
  socket.emit('newTask', { text, datetime: newNote.datetime });
}

function initNotes() {
  const form = document.getElementById('note-form');
  const input = document.getElementById('note-input');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
      addNote(text, '');
      input.value = '';
    }
  });
  loadNotes();
}

// ---------- WebSocket (Socket.IO) ----------
const socket = io('https://localhost:3001'); // или wss://localhost:3001

socket.on('taskAdded', (task) => {
  console.log('Новая задача от другого клиента:', task);
  // Всплывающее сообщение на странице
  const notification = document.createElement('div');
  notification.textContent = `Новая задача: ${task.text}`;
  notification.style.cssText = `
    position: fixed; top: 10px; right: 10px;
    background: #4285f4; color: white; padding: 1rem;
    border-radius: 5px; z-index: 1000;
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
});

// ---------- Push-уведомления (VAPID) ----------
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
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array('ВАШ_ПУБЛИЧНЫЙ_VAPID_КЛЮЧ')
    });
    await fetch('https://localhost:3001/subscribe', {
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
    await fetch('https://localhost:3001/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint })
    });
    await subscription.unsubscribe();
    console.log('Отписка выполнена');
  }
}

// Регистрация Service Worker и управление кнопками push
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered', reg);

      const enableBtn = document.getElementById('enable-push');
      const disableBtn = document.getElementById('disable-push');

      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        enableBtn.style.display = 'none';
        disableBtn.style.display = 'inline-block';
      } else {
        enableBtn.style.display = 'inline-block';
        disableBtn.style.display = 'none';
      }

      enableBtn.addEventListener('click', async () => {
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
        enableBtn.style.display = 'none';
        disableBtn.style.display = 'inline-block';
      });

      disableBtn.addEventListener('click', async () => {
        await unsubscribeFromPush();
        disableBtn.style.display = 'none';
        enableBtn.style.display = 'inline-block';
      });
    } catch (err) {
      console.log('SW registration failed:', err);
    }
  });
}