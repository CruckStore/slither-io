import React, { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import type { State, Point } from "../hooks/useGame";
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
  const mouseRef = useRef<Point>({ x: 0, y: 0 });
  const [isDead, setIsDead] = useState(false);

  const MAP_SIZE = 2000;
  const HALF_MAP = MAP_SIZE / 2;
  const MINIMAP_SIZE = 150;
  const MINIMAP_MARGIN = 10;

  useEffect(() => {
    const sock = socketRef.current;
    if (!sock) return;
    const onDead = () => setIsDead(true);
    sock.on("dead", onDead);
    return () => {
      sock.off("dead", onDead);
    };
  }, [socketRef]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const RADIUS = 50;
    const SPACING_X = RADIUS * 1.5;
    const SPACING_Y = Math.sqrt(3) * RADIUS * 0.75;

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

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      if (!isDead) {
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

        const gridOffsetX = ((ox % SPACING_X) + SPACING_X) % SPACING_X;
        const gridOffsetY = ((oy % SPACING_Y) + SPACING_Y) % SPACING_Y;
        ctx.save();
        ctx.translate(gridOffsetX - SPACING_X, gridOffsetY - SPACING_Y);
        drawHexGrid(ctx, w + SPACING_X * 2, h + SPACING_Y * 2, RADIUS);
        ctx.restore();

        ctx.save();
        ctx.translate(ox, oy);
        drawOrbs(ctx, state.orbs, 0, 0);
        drawSnakes(ctx, state.players, 0, 0);

        state.players.forEach((p) => {
          const hx = p.snake[0].x,
            hy = p.snake[0].y;
          ctx.beginPath();
          ctx.arc(hx, hy, 8, 0, 2 * Math.PI);
          ctx.fillStyle = p.color;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#FFF";
          ctx.stroke();
        });
        ctx.restore();

        const sorted = [...state.players]
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
        ctx.fillStyle = "#FFF";
        ctx.font = "16px sans-serif";
        sorted.forEach((p, i) => {
          ctx.fillText(`${p.username}: ${p.score}`, 10, 20 + i * 20);
        });

        const mapX = w - MINIMAP_SIZE - MINIMAP_MARGIN;
        const mapY = h - MINIMAP_SIZE - MINIMAP_MARGIN;

        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(mapX, mapY, MINIMAP_SIZE, MINIMAP_SIZE);

        ctx.strokeStyle = "#FFF";
        ctx.strokeRect(mapX, mapY, MINIMAP_SIZE, MINIMAP_SIZE);

        const scale = MINIMAP_SIZE / MAP_SIZE;

        state.orbs.forEach((o) => {
          const mx = mapX + (o.x + HALF_MAP) * scale;
          const my = mapY + (o.y + HALF_MAP) * scale;
          ctx.beginPath();
          ctx.arc(mx, my, Math.max(2, o.radius * scale), 0, 2 * Math.PI);
          ctx.fillStyle = o.color;
          ctx.fill();
        });

        state.players.forEach((p) => {
          ctx.beginPath();
          p.snake.forEach((pt, i) => {
            const mx = mapX + (pt.x + HALF_MAP) * scale;
            const my = mapY + (pt.y + HALF_MAP) * scale;
            i === 0 ? ctx.moveTo(mx, my) : ctx.lineTo(mx, my);
          });
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        });

        if (me) {
          const hx = mapX + (me.snake[0].x + HALF_MAP) * scale;
          const hy = mapY + (me.snake[0].y + HALF_MAP) * scale;
          ctx.beginPath();
          ctx.arc(hx, hy, 5, 0, 2 * Math.PI);
          ctx.fillStyle = me.color;
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = "#FFF";
          ctx.stroke();
        }

        if (me) {
          ctx.fillStyle = "#FFF";
          ctx.font = "24px sans-serif";
          ctx.fillText(`Score: ${me.score}`, 10, h - 60);
          ctx.fillText(`Taille: ${me.snake.length}`, 10, h - 30);
        }
      }

      rafId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousemove", onMouseMove);
    };
  }, [socketRef, stateRef, pidRef, isDead]);

  const handleReplay = () => setIsDead(false);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
      {isDead && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            color: "#fff",
          }}
        >
          <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>
            Vous êtes mort 😢
          </p>
          <button
            onClick={handleReplay}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Rejouer
          </button>
        </div>
      )}
    </div>
  );
};
