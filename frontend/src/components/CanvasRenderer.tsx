// src/components/CanvasRenderer.tsx
import React, { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import type { State } from '../hooks/useGame';
import {
  drawHexGrid,
  drawOrbs,
  drawSnakes
} from '../utils/draw';

interface Props {
  socketRef:    React.RefObject<Socket | null>;
  stateRef:     React.MutableRefObject<State>;
  pidRef:       React.RefObject<string>;
}

export const CanvasRenderer: React.FC<Props> = ({
  socketRef, stateRef, pidRef
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef  = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;

    const onResize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    onResize();

    canvas.addEventListener('mousemove', e => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    });

    function render() {
      const { players, orbs } = stateRef.current;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawHexGrid(ctx, canvas.width, canvas.height, 50);

      const me = players.find(p => p.id === pidRef.current);
      let ox = 0, oy = 0;
      if (me) {
        ox = canvas.width/2  - me.snake[0].x;
        oy = canvas.height/2 - me.snake[0].y;
        const mx    = mouseRef.current.x - canvas.width/2;
        const my    = mouseRef.current.y - canvas.height/2;
        const angle = Math.atan2(my, mx);
        socketRef.current?.emit('steer', { angle });
      }

      drawOrbs(ctx, orbs, ox, oy);
      drawSnakes(ctx, players, ox, oy);

      requestAnimationFrame(render);
    }
    render();

    return () => {
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('mousemove', () => {});
    };
  }, [socketRef, stateRef, pidRef]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
};
