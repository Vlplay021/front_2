import React from 'react';

function LogoutButton({ onLogout }) {
  return (
    <button className="logout-btn" onClick={onLogout}>
      <i className="fas fa-sign-out-alt"></i> Выйти
    </button>
  );
}

export default LogoutButton;