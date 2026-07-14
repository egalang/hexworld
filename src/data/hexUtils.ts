import Phaser from 'phaser';
import { WorldTile } from './worldMap';

const SQRT3 = Math.sqrt(3);

export function axialToPixel(q: number, r: number, size: number): { x: number; y: number } {
  const x = size * SQRT3 * (q + (r % 2) * 0.5);
  const y = size * 1.5 * r;
  return { x, y };
}

export function hexCorners(center: { x: number; y: number }, size: number): { x: number; y: number }[] {
  const corners: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    corners.push({
      x: center.x + size * Math.cos(angle),
      y: center.y + size * Math.sin(angle),
    });
  }
  return corners;
}

export function drawHex(
  graphics: Phaser.GameObjects.Graphics,
  center: { x: number; y: number },
  size: number,
  fillColor: number,
  strokeColor: number,
  strokeWidth = 2,
): void {
  const corners = hexCorners(center, size);
  const points = corners.map((c) => new Phaser.Math.Vector2(c.x, c.y));

  graphics.fillStyle(fillColor, 1);
  graphics.lineStyle(strokeWidth, strokeColor, 1);
  graphics.beginPath();
  graphics.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    graphics.lineTo(points[i].x, points[i].y);
  }
  graphics.closePath();
  graphics.fillPath();
  graphics.strokePath();
}

export function computeMapBounds(
  tiles: { q: number; r: number }[],
  size: number,
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const tile of tiles) {
    const p = axialToPixel(tile.q, tile.r, size);
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  return { minX, minY, maxX, maxY };
}
