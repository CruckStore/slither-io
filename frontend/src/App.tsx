import React, { useState, useEffect } from "react";
import Game from "./components/Game";

export default function App() {
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    console.log("App mounted");
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) setJoined(true);
  };

  return joined ? (
    <Game username={username} />
  ) : (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        color: "#fff",
      }}
    >
      <h1>Slither Clone</h1>
      <input
        style={{ padding: "0.5rem", margin: "0.5rem" }}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Votre pseudo"
      />
      <button type="submit" style={{ padding: "0.5rem 1rem" }}>
        Jouer
      </button>
    </form>
  );
}
