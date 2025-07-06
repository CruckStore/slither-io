import React, { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import type { State } from "../hooks/useGame";
import { drawHexGrid, drawOrbs, drawSnakes } from "../utils/draw";

interface Props {
  socketRef: React.RefObject<Socket | null>;
  stateRef: React.MutableRefObject<State>;
  pidRef: React.RefObject<string>;
}

export const CanvasRenderer: React.FC<Props> = ({
  socketRef,
  stateRef,
  pidRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const RADIUS = 50;
    const HEX_H = Math.sqrt(3) * RADIUS;
    const SPACING_X = RADIUS * 1.5;
    const SPACING_Y = HEX_H * 0.75;

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    onResize();

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    canvas.addEventListener("mousemove", onMouseMove);

    let rafId: number;
    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      const state = stateRef.current;
      const me = state.players.find((p) => p.id === pidRef.current);

      let ox = 0,
        oy = 0;
      if (me) {
        ox = w / 2 - me.snake[0].x;
        oy = h / 2 - me.snake[0].y;
        const mx = mouseRef.current.x - w / 2;
        const my = mouseRef.current.y - h / 2;
        const angle = Math.atan2(my, mx);
        socketRef.current?.emit("steer", { angle });
      }

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      const gridOffsetX = ox % SPACING_X;
      const gridOffsetY = oy % SPACING_Y;
      ctx.save();
      ctx.translate(gridOffsetX, gridOffsetY);

      drawHexGrid(ctx, w + SPACING_X, h + SPACING_Y, RADIUS);
      ctx.restore();

      ctx.save();
      ctx.translate(ox, oy);
      drawOrbs(ctx, state.orbs, 0, 0);
      drawSnakes(ctx, state.players, 0, 0);
      ctx.restore();

      if (me) {
        ctx.fillStyle = "#FFF";
        ctx.font = "24px sans-serif";
        ctx.fillText(`Score: ${me.score}`, 20, 30);
        ctx.fillText(`Taille: ${me.snake.length}`, 20, 60);
      }

      rafId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousemove", onMouseMove);
    };
  }, [socketRef, stateRef, pidRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
};
