import { useEffect, useRef } from 'react';

const MAX_PARTICLES = 260;
const FRAME_INTERVAL = 1000 / 30;

function random(min, max) {
  return min + Math.random() * (max - min);
}

function createFlame(side, width, height, initial = false) {
  const band = Math.min(Math.max(width * 0.22, 120), 290);
  return {
    side,
    x: random(0, band),
    y: initial ? random(height * 0.58, height + 60) : height + random(0, 70),
    height: random(65, 205),
    width: random(9, 29),
    speed: random(75, 175),
    drift: random(-20, 20),
    age: initial ? random(0, 1.2) : 0,
    lifetime: random(1.15, 2.35),
    bend: random(-22, 22),
  };
}

function drawTongue(context, flame, width, height, side, core = false) {
  const x = flame.x + (core ? 0 : 0);
  const y = flame.y;
  const tongueHeight = flame.height * (core ? 0.58 : 1);
  const tongueWidth = flame.width * (core ? 0.44 : 1);
  const tipX = x + flame.bend * (1 - flame.age / flame.lifetime);
  const band = Math.min(Math.max(width * 0.22, 120), 290);
  const horizontalFade = Math.max(0, 1 - x / band);
  const verticalFade = Math.max(0, Math.min(1, (height - y + tongueHeight) / (tongueHeight * 0.8)));
  const lifeFade = Math.sin(Math.PI * Math.min(1, flame.age / flame.lifetime));
  const alpha = (core ? 0.86 : 0.8) * horizontalFade * verticalFade * Math.max(0.14, lifeFade);
  if (alpha <= 0.01) return;

  context.save();
  context.globalAlpha = alpha;
  context.translate(side === 'right' ? width : 0, 0);
  context.scale(side === 'right' ? -1 : 1, 1);
  context.beginPath();
  context.moveTo(x, y);
  context.bezierCurveTo(
    x - tongueWidth * 0.9, y - tongueHeight * 0.24,
    tipX - tongueWidth * 0.2, y - tongueHeight * 0.68,
    tipX + random(-tongueWidth * 0.15, tongueWidth * 0.15), y - tongueHeight
  );
  context.bezierCurveTo(
    tipX + tongueWidth * 0.7, y - tongueHeight * 0.69,
    x + tongueWidth * 1.1, y - tongueHeight * 0.24,
    x + tongueWidth * 0.58, y
  );
  context.closePath();

  const gradient = context.createLinearGradient(x, y - tongueHeight, x, y);
  if (core) {
    gradient.addColorStop(0, 'rgba(255, 255, 196, 0.95)');
    gradient.addColorStop(0.2, 'rgba(255, 224, 91, 0.95)');
    gradient.addColorStop(0.68, 'rgba(255, 137, 22, 0.9)');
    gradient.addColorStop(1, 'rgba(255, 85, 8, 0)');
  } else {
    gradient.addColorStop(0, 'rgba(255, 205, 75, 0.92)');
    gradient.addColorStop(0.28, 'rgba(255, 105, 15, 0.84)');
    gradient.addColorStop(0.72, 'rgba(225, 36, 5, 0.74)');
    gradient.addColorStop(1, 'rgba(104, 12, 4, 0)');
  }
  context.fillStyle = gradient;
  context.fill();
  context.restore();
}

function createEmber(width, height, initial = false) {
  const band = Math.min(Math.max(width * 0.2, 100), 265);
  return {
    side: Math.random() < 0.5 ? 'left' : 'right',
    x: random(0, band),
    y: initial ? random(height * 0.28, height) : height + 4,
    size: random(0.8, 2.4),
    speed: random(35, 110),
    drift: random(-28, 28),
    age: initial ? random(0, 1.5) : 0,
    lifetime: random(1.4, 3),
  };
}

export default function FlameBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const particles = [];
    let width = window.innerWidth;
    let height = window.innerHeight;
    let pixelRatio = 1;
    let frame = 0;
    let lastFrame = 0;
    let previousTime = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resize();
    for (let i = 0; i < 115; i += 1) {
      particles.push(createFlame('left', width, height, true));
      particles.push(createFlame('right', width, height, true));
    }
    for (let i = 0; i < 34; i += 1) particles.push(createEmber(width, height, true));

    const render = (time) => {
      if (!reducedMotion && time - lastFrame < FRAME_INTERVAL) {
        frame = window.requestAnimationFrame(render);
        return;
      }

      const delta = reducedMotion ? 0 : Math.min((time - (previousTime || time)) / 1000, 0.05);
      previousTime = time;
      lastFrame = time;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);

      for (const side of ['left', 'right']) {
        const band = Math.min(Math.max(width * 0.22, 120), 290);
        const glow = context.createRadialGradient(
          side === 'left' ? band * 0.12 : width - band * 0.12,
          height * 0.94,
          0,
          side === 'left' ? band * 0.12 : width - band * 0.12,
          height * 0.94,
          band * 1.35
        );
        glow.addColorStop(0, 'rgba(255, 65, 8, 0.24)');
        glow.addColorStop(0.42, 'rgba(205, 41, 7, 0.11)');
        glow.addColorStop(1, 'rgba(120, 20, 3, 0)');
        context.fillStyle = glow;
        context.fillRect(side === 'left' ? 0 : width - band * 1.5, height * 0.23, band * 1.5, height * 0.77);
      }

      const flames = particles.filter((particle) => 'height' in particle);
      const embers = particles.filter((particle) => !('height' in particle));

      for (const flame of flames) {
        drawTongue(context, flame, width, height, flame.side);
        drawTongue(context, flame, width, height, flame.side, true);
        flame.y -= flame.speed * delta;
        flame.x += flame.drift * delta;
        flame.age += delta;
      }
      for (const ember of embers) {
        const band = Math.min(Math.max(width * 0.2, 100), 265);
        const alpha = Math.max(0, 1 - ember.age / ember.lifetime);
        context.save();
        context.globalAlpha = alpha * (0.58 + Math.sin(time / 110 + ember.x) * 0.32);
        context.translate(ember.side === 'right' ? width : 0, 0);
        context.scale(ember.side === 'right' ? -1 : 1, 1);
        context.shadowBlur = 12;
        context.shadowColor = '#ff6717';
        context.fillStyle = '#ffd178';
        context.beginPath();
        context.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
        context.fill();
        context.restore();
        ember.y -= ember.speed * delta;
        ember.x += ember.drift * delta;
        ember.age += delta;
      }

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        if (particles[i].age >= particles[i].lifetime || particles[i].y < -220) particles.splice(i, 1);
      }
      while (particles.filter((particle) => 'height' in particle).length < 230) {
        particles.push(createFlame(Math.random() < 0.5 ? 'left' : 'right', width, height));
      }
      while (particles.filter((particle) => !('height' in particle)).length < 38 && particles.length < MAX_PARTICLES) {
        particles.push(createEmber(width, height));
      }

      frame = reducedMotion ? 0 : window.requestAnimationFrame(render);
    };

    window.addEventListener('resize', resize);
    if (reducedMotion) {
      for (const flame of particles.filter((particle) => 'height' in particle)) {
        flame.y = Math.max(flame.y, height - flame.height);
      }
      render(1);
    } else {
      frame = window.requestAnimationFrame(render);
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className="flame-background" aria-hidden="true" />;
}
