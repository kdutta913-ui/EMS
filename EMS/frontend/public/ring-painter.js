/**
 * Houdini CSS Paint Worklet — ring-painter
 * Draws animated concentric particle rings.
 * Registered via CSS.paintWorklet.addModule() in Feature.js
 */
registerPaint('ring-painter', class {
  static get inputProperties() {
    return [
      '--ring-count',
      '--ring-color-1',
      '--ring-color-2',
      '--ring-progress',
    ];
  }

  paint(ctx, size, props) {
    const ringCount  = parseInt(props.get('--ring-count'))       || 5;
    const color1     = props.get('--ring-color-1').toString().trim() || 'rgba(0,119,182,0.15)';
    const color2     = props.get('--ring-color-2').toString().trim() || 'rgba(99,102,241,0.10)';
    const progress   = parseFloat(props.get('--ring-progress'))   || 0;

    const cx = size.width  / 2;
    const cy = size.height / 2;
    const maxR = Math.hypot(cx, cy) * 1.1;

    ctx.clearRect(0, 0, size.width, size.height);

    for (let i = 0; i < ringCount; i++) {
      const t      = i / ringCount;
      // Each ring expands & rotates based on --ring-progress
      const radius = maxR * (0.15 + t * 0.75 + (progress * 0.06));
      const alpha  = 0.55 - t * 0.38;

      // Interpolate colour
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius);
      grad.addColorStop(0, color1.replace(/[\d.]+\)$/, `${alpha})`));
      grad.addColorStop(1, color2.replace(/[\d.]+\)$/, '0)'));

      // Particle dots around the ring circumference
      const dotCount = 24 + i * 8;
      for (let d = 0; d < dotCount; d++) {
        const angle   = (d / dotCount) * Math.PI * 2
                      + (progress * 0.4 * (i % 2 === 0 ? 1 : -1));
        const jitter  = Math.sin(d * 2.7 + progress * 1.5) * radius * 0.04;
        const r       = radius + jitter;
        const x       = cx + Math.cos(angle) * r;
        const y       = cy + Math.sin(angle) * r;
        const dotR    = 1.2 + Math.sin(d + progress) * 0.8;

        ctx.beginPath();
        ctx.arc(x, y, Math.max(dotR, 0.5), 0, Math.PI * 2);
        ctx.fillStyle = color1.replace(/[\d.]+\)$/, `${alpha * 0.9})`);
        ctx.fill();
      }

      // Ring arc
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = color1.replace(/[\d.]+\)$/, `${alpha * 0.4})`);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
});
