import React, { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  username: string;
  snake: { x: number; y: number }[];
  color: string;
}
interface Orb { x: number; y: number; color: string; }
interface State { players: Player[]; orbs: Orb[]; }

export default function Game({ username }: { username: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket>();
  const stateRef = useRef<State>({ players: [], orbs: [] });
  const pidRef = useRef<string>('');

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const socket = io('http://localhost:3001');
    socketRef.current = socket;

    socket.on('connect', () => {
      pidRef.current = socket.id;
      socket.emit('join', { username });
    });
    socket.on('state', (st: State) => stateRef.current = st);

    const onKey = (e: KeyboardEvent) => {
      const angle = e.key === 'ArrowLeft' ? -1
                   : e.key === 'ArrowRight' ? 1
                   : 0;
      if (angle) socket.emit('steer', { angle });
    };
    window.addEventListener('keydown', onKey);

    const render = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const { players, orbs } = stateRef.current;
      const me = players.find(p => p.id === pidRef.current);
      let ox = 0, oy = 0;
      if (me) {
        ox = canvas.width/2 - me.snake[0].x;
        oy = canvas.height/2 - me.snake[0].y;
      }
      // orbs
      orbs.forEach(o => {
        ctx.beginPath();
        ctx.arc(o.x+ox, o.y+oy, 5, 0, 2*Math.PI);
        ctx.fillStyle = o.color;
        ctx.fill();
      });
      // snakes
      players.forEach(p => {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 10;
        ctx.beginPath();
        p.snake.forEach((pt, i) => {
          const x = pt.x+ox, y = pt.y+oy;
          i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        });
        ctx.stroke();
      });
      requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('keydown', onKey);
      socket.disconnect();
    };
  }, [username]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
}
