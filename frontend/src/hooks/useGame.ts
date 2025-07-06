import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export interface Point {
  x: number;
  y: number;
}
export interface Player {
  id: string;
  username: string;
  snake: Point[];
  color: string;
}
export interface Orb {
  x: number;
  y: number;
  color: string;
}
export interface State {
  players: Player[];
  orbs: Orb[];
}

export function useGameState(username: string) {
  const socketRef = useRef<Socket | null>(null);
  const stateRef = useRef<State>({ players: [], orbs: [] });
  const pidRef = useRef<string>("");

  useEffect(() => {
    const socket = io("http://localhost:3001");
    socketRef.current = socket;

    socket.on("connect", () => {
      pidRef.current = socket.id!;
      socket.emit("join", { username });
    });
    socket.on("state", (st: State) => {
      stateRef.current = st;
    });

    return () => {
      socket.disconnect();
    };
  }, [username]);

  return { socketRef, stateRef, pidRef };
}
