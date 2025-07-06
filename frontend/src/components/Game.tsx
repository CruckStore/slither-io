import React from "react";
import { useGameState } from "../hooks/useGame";
import { CanvasRenderer } from "./CanvasRenderer";

export default function Game({ username }: { username: string }) {
  const { socketRef, stateRef, pidRef } = useGameState(username);

  return (
    <CanvasRenderer socketRef={socketRef} stateRef={stateRef} pidRef={pidRef} />
  );
}
