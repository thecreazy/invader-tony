/**
 * CageTexture — generates a Canvas 2D CanvasTexture of Nicolas Cage's face.
 * Drawn once and shared across all invaders for performance.
 */

import * as THREE from 'three';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Draw a rounded-rectangle path (no fill/stroke — caller does that). */
function roundedRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}

// ── Core draw ─────────────────────────────────────────────────────────────────

function drawFace(ctx, s) {
  // ── BACKGROUND ─────────────────────────────────────────────────────────────
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, s, s);

  // ── SKIN BASE — warm tan oval ──────────────────────────────────────────────
  ctx.fillStyle = '#C68642';
  ctx.beginPath();
  ctx.ellipse(s * 0.5, s * 0.52, s * 0.38, s * 0.46, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── FOREHEAD HIGHLIGHT ─────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(210,160,90,0.4)';
  ctx.beginPath();
  ctx.ellipse(s * 0.5, s * 0.28, s * 0.22, s * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── HAIR ───────────────────────────────────────────────────────────────────
  // Dark dome across the top
  ctx.fillStyle = '#1a0a00';
  ctx.beginPath();
  ctx.arc(s * 0.5, s * 0.35, s * 0.37, Math.PI, 0);
  ctx.closePath();
  ctx.fill();

  // Side hair strips (the bit that's left)
  ctx.fillRect(s * 0.10, s * 0.22, s * 0.08, s * 0.28);
  ctx.fillRect(s * 0.82, s * 0.22, s * 0.08, s * 0.28);

  // Receding bald-spot: punch skin color back over top-center
  ctx.fillStyle = '#C68642';
  ctx.beginPath();
  ctx.ellipse(s * 0.5, s * 0.18, s * 0.16, s * 0.10, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── EYEBROWS — thick, dark, angled inward ─────────────────────────────────
  const browW = s * 0.28;
  const browH = s * 0.07;
  const browR = s * 0.02;
  const browY = s * 0.36;

  // Left brow
  ctx.save();
  ctx.translate(s * 0.14 + browW * 0.5, browY + browH * 0.5);
  ctx.rotate(-0.15);
  ctx.fillStyle = '#0d0500';
  roundedRect(ctx, -browW * 0.5, -browH * 0.5, browW, browH, browR);
  ctx.fill();
  ctx.restore();

  // Right brow
  ctx.save();
  ctx.translate(s * 0.58 + browW * 0.5, browY + browH * 0.5);
  ctx.rotate(0.15);
  ctx.fillStyle = '#0d0500';
  roundedRect(ctx, -browW * 0.5, -browH * 0.5, browW, browH, browR);
  ctx.fill();
  ctx.restore();

  // ── EYES ───────────────────────────────────────────────────────────────────
  const eyeData = [
    { cx: s * 0.30, hx: s * 0.31, px: s * 0.315, hlx: s * 0.325, lidX: s * 0.20 },
    { cx: s * 0.70, hx: s * 0.69, px: s * 0.685, hlx: s * 0.675, lidX: s * 0.60 },
  ];
  const eyeY = s * 0.47;

  for (const e of eyeData) {
    // Sclera (white of eye)
    ctx.fillStyle = '#f5f0e8';
    ctx.beginPath();
    ctx.ellipse(e.cx, eyeY, s * 0.10, s * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris
    ctx.fillStyle = '#2d1a00';
    ctx.beginPath();
    ctx.arc(e.hx, eyeY, s * 0.045, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(e.px, s * 0.465, s * 0.022, 0, Math.PI * 2);
    ctx.fill();

    // Catchlight
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(e.hlx, s * 0.455, s * 0.012, 0, Math.PI * 2);
    ctx.fill();

    // Heavy upper eyelid shadow
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fillRect(e.lidX, s * 0.40, s * 0.20, s * 0.042);
  }

  // ── NOSE ───────────────────────────────────────────────────────────────────
  // Bridge
  ctx.fillStyle = '#b5753a';
  roundedRect(ctx, s * 0.47, s * 0.43, s * 0.06, s * 0.18, s * 0.01);
  ctx.fill();

  // Bulbous tip
  ctx.beginPath();
  ctx.ellipse(s * 0.5, s * 0.63, s * 0.10, s * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();

  // Left nostril
  ctx.fillStyle = '#7a4010';
  ctx.beginPath();
  ctx.ellipse(s * 0.42, s * 0.64, s * 0.04, s * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();

  // Right nostril
  ctx.beginPath();
  ctx.ellipse(s * 0.58, s * 0.64, s * 0.04, s * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose highlight
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.arc(s * 0.5, s * 0.60, s * 0.015, 0, Math.PI * 2);
  ctx.fill();

  // ── CHEEK SHADOWS ──────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(180,80,40,0.25)';
  ctx.beginPath();
  ctx.ellipse(s * 0.20, s * 0.58, s * 0.09, s * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(s * 0.80, s * 0.58, s * 0.09, s * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── MOUTH ──────────────────────────────────────────────────────────────────
  // Dark mouth interior / outer lips
  ctx.fillStyle = '#7a2010';
  roundedRect(ctx, s * 0.28, s * 0.70, s * 0.44, s * 0.12, s * 0.03);
  ctx.fill();

  // Upper lip
  ctx.fillStyle = '#8b2510';
  roundedRect(ctx, s * 0.30, s * 0.70, s * 0.40, s * 0.05, s * 0.02);
  ctx.fill();

  // Teeth
  ctx.fillStyle = '#f0f0e8';
  ctx.fillRect(s * 0.31, s * 0.73, s * 0.38, s * 0.05);

  // Tooth dividers
  ctx.strokeStyle = '#bbb';
  ctx.lineWidth = Math.max(1, s * 0.008);
  ctx.beginPath();
  ctx.moveTo(s * 0.40, s * 0.73); ctx.lineTo(s * 0.40, s * 0.78);
  ctx.moveTo(s * 0.50, s * 0.73); ctx.lineTo(s * 0.50, s * 0.78);
  ctx.moveTo(s * 0.60, s * 0.73); ctx.lineTo(s * 0.60, s * 0.78);
  ctx.stroke();

  // Lower lip
  ctx.fillStyle = '#8b2510';
  roundedRect(ctx, s * 0.30, s * 0.77, s * 0.40, s * 0.05, s * 0.02);
  ctx.fill();

  // ── CHIN SHADOW ────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(100,50,10,0.3)';
  ctx.beginPath();
  ctx.ellipse(s * 0.5, s * 0.87, s * 0.18, s * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── JAW LINE SHADOWS ───────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(s * 0.20, s * 0.78, s * 0.06, s * 0.10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(s * 0.80, s * 0.78, s * 0.06, s * 0.10, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── CRT SCANLINE OVERLAY ───────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let scanY = 0; scanY < s; scanY += 4) {
    ctx.fillRect(0, scanY, s, 1);
  }

  // ── FACE OVAL OUTLINE ──────────────────────────────────────────────────────
  ctx.strokeStyle = '#000';
  ctx.lineWidth = Math.max(2, s * 0.025);
  ctx.beginPath();
  ctx.ellipse(s * 0.5, s * 0.52, s * 0.38, s * 0.46, 0, 0, Math.PI * 2);
  ctx.stroke();
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Generate a fresh Cage face CanvasTexture at given pixel size. */
export function generateCageTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width  = size;
  canvas.height = size;
  drawFace(canvas.getContext('2d'), size);
  return new THREE.CanvasTexture(canvas);
}

/**
 * Generate a Cage face with a VHS RGB-split glitch effect.
 * Used for boss phase 2.
 */
export function generateCageTextureGlitch(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  drawFace(ctx, size);

  // RGB channel split: shift red left 3px, blue right 3px
  const shift = Math.max(2, Math.round(size / 42));
  const imageData = ctx.getImageData(0, 0, size, size);
  const src  = new Uint8ClampedArray(imageData.data);
  const dst  = imageData.data;

  for (let row = 0; row < size; row++) {
    for (let x = 0; x < size; x++) {
      const i = (row * size + x) * 4;
      // Red from x+shift
      const rSrc = Math.min(x + shift, size - 1);
      dst[i]     = src[(row * size + rSrc) * 4];
      // Green unchanged
      dst[i + 1] = src[i + 1];
      // Blue from x-shift
      const bSrc = Math.max(x - shift, 0);
      dst[i + 2] = src[(row * size + bSrc) * 4 + 2];
      dst[i + 3] = src[i + 3];
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return new THREE.CanvasTexture(canvas);
}
