import React, { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface Point {
  x: number;
  y: number;
}
interface Player {
  id: string;
  username: string;
  snake: Point[];
  color: string;
}
interface Orb {
  x: number;
  y: number;
  color: string;
}
interface State {
  players: Player[];
  orbs: Orb[];
}

export default function Game({ username }: { username: string }) {
  const socketRef = useRef<Socket | null>(null);
  const pidRef = useRef<string>("");
  const stateRef = useRef<State>({ players: [], orbs: [] });
  const mouseRef = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    document.body.appendChild(canvas);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    canvas.addEventListener("mousemove", (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    });

    const socket = io("http://localhost:3001");
    socketRef.current = socket;

    socket.on("connect", () => {
      pidRef.current = socket.id!;
      socket.emit("join", { username });
    });
    socket.on("state", (st: State) => {
      stateRef.current = st;
    });

    function drawHexagon(x: number, y: number, r: number) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI / 3) * i;
        const px = x + r * Math.cos(ang);
        const py = y + r * Math.sin(ang);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    const render = () => {
      const { players, orbs } = stateRef.current;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#222";
      ctx.lineWidth = 1;
      const hexR = 50;
      const hexH = Math.sqrt(3) * hexR;
      for (let row = -1; row < canvas.height / (hexH * 0.75) + 2; row++) {
        for (let col = -1; col < canvas.width / (hexR * 1.5) + 2; col++) {
          const x = col * hexR * 1.5 + (row % 2 ? hexR * 0.75 : 0);
          const y = row * hexH * 0.75;
          drawHexagon(x, y, hexR);
        }
      }

      const me = players.find((p) => p.id === pidRef.current);
      let offsetX = 0,
        offsetY = 0;
      if (me) {
        offsetX = canvas.width / 2 - me.snake[0].x;
        offsetY = canvas.height / 2 - me.snake[0].y;

        const mx = mouseRef.current.x - canvas.width / 2;
        const my = mouseRef.current.y - canvas.height / 2;
        const targetAngle = Math.atan2(my, mx);
        socketRef.current?.emit("steer", { angle: targetAngle });
      }

      orbs.forEach((o) => {
        ctx.beginPath();
        ctx.arc(o.x + offsetX, o.y + offsetY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = o.color;
        ctx.fill();
      });

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      players.forEach((p) => {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 10;
        ctx.beginPath();
        p.snake.forEach((pt, i) => {
          const x = pt.x + offsetX;
          const y = pt.y + offsetY;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
      });

      requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", () => {});
      document.body.removeChild(canvas);
      socket.disconnect();
    };
  }, [username]);

  return null;
}
