import type { Point, Player, Orb } from "../hooks/useGame";

export function drawHexGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number
) {
  const hexH = Math.sqrt(3) * radius;
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 1;

  for (let row = -1; row < height / (hexH * 0.75) + 2; row++) {
    for (let col = -1; col < width / (radius * 1.5) + 2; col++) {
      const x = col * radius * 1.5 + (row % 2 ? radius * 0.75 : 0);
      const y = row * hexH * 0.75;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI / 3) * i;
        const px = x + radius * Math.cos(ang);
        const py = y + radius * Math.sin(ang);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
}

export function drawOrbs(
  ctx: CanvasRenderingContext2D,
  orbs: Orb[],
  offsetX: number,
  offsetY: number
) {
  orbs.forEach((o) => {
    const cx = o.x + offsetX;
    const cy = o.y + offsetY;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, o.radius);
    grad.addColorStop(0, o.color);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, o.radius, 0, 2 * Math.PI);
    ctx.fill();
  });
}

export function drawSnakes(
  ctx: CanvasRenderingContext2D,
  players: Player[],
  offsetX: number,
  offsetY: number
) {
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
}
