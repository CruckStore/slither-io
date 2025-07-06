import React, { useState } from 'react';
import Game from './components/Game';

export default function App() {
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) setJoined(true);
  };

  return joined ? (
    <Game username={name} />
  ) : (
    <form onSubmit={submit} className="login-form">
      <h1>Slither Clone</h1>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Votre pseudo"
      />
      <button type="submit">Jouer</button>
    </form>
  );
}
