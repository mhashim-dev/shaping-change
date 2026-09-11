'use client';

import { useEffect, useRef } from 'react';
import { createTreeEngine } from '@/lib/tree-engine';

export default function TreeStage({ onEngine, getReserve, sideWidth = 0, landing = false, apiRef, onCanvasPointer, ariaLabel }) {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const onEngineRef = useRef(onEngine);
  const getReserveRef = useRef(getReserve);
  const sideWidthRef = useRef(sideWidth);
  const landingRef = useRef(landing);
  const onPointerRef = useRef(onCanvasPointer);
  onEngineRef.current = onEngine;
  getReserveRef.current = getReserve;
  sideWidthRef.current = sideWidth;
  landingRef.current = landing;
  onPointerRef.current = onCanvasPointer;

  useEffect(() => {
    const engine = createTreeEngine(canvasRef.current);
    if (onEngineRef.current) onEngineRef.current(engine);

    // Client coords -> the engine's logical 1600x900 space. getBoundingClientRect()
    // already accounts for the CSS transform the stage is scaled with.
    const partAt = (clientX, clientY) => {
      const cv = canvasRef.current;
      if (!cv || !engine.hitPart) return null;
      const r = cv.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      const x = (clientX - r.left) * (1600 / r.width);
      const y = (clientY - r.top) * (900 / r.height);
      if (x < 0 || y < 0 || x > 1600 || y > 900) return null;
      return engine.hitPart(x, y);
    };
    if (apiRef) apiRef.current = { partAt };

    const fire = (type) => (ev) => {
      const cb = onPointerRef.current;
      if (!cb) return;
      cb(type, type === 'leave' ? null : partAt(ev.clientX, ev.clientY), ev);
    };
    const cv = canvasRef.current;
    const onMove = fire('move'), onDown = fire('down'), onLeave = fire('leave');
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointerleave', onLeave);

    const fit = () => {
      const el = stageRef.current;
      if (!el) return;
      const sw = sideWidthRef.current;
      if (sw > 0 || landingRef.current) {
        // the scene fills the whole window (team feedback); the panel floats top-right over it.
        // The centred landing card also wants a full-bleed backdrop, even on mobile (sw === 0).
        const s = Math.max(window.innerWidth / 1600, window.innerHeight / 900);
        el.style.left = '50%';
        el.style.top = '50%';
        el.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
      } else if (window.innerHeight >= window.innerWidth) {
        // PORTRAIT mobile: a FIXED scene banner across the top — same size & position on every
        // screen (was scaled to the varying panel height, which made it jump). Panel owns a fixed
        // band below (see fitPanel + CSS).
        const bandH = window.innerHeight * 0.40;
        const s = Math.max(window.innerWidth / 1600, bandH / 900);
        el.style.left = '50%';
        el.style.top = Math.round(bandH / 2) + 'px';
        el.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
      } else {
        // LANDSCAPE mobile: very short — keep the adaptive fit
        const reserve = getReserveRef.current ? getReserveRef.current() : 110;
        const avail = window.innerHeight - reserve - 16;
        const s = Math.min((window.innerWidth - 24) / 1600, avail / 900);
        el.style.left = '50%';
        el.style.top = (8 + avail / 2) + 'px';
        el.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
      }
    };
    fit();
    window.addEventListener('resize', fit);
    const refit = setInterval(fit, 400); // control surface height can change

    return () => {
      window.removeEventListener('resize', fit);
      clearInterval(refit);
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('pointerleave', onLeave);
      if (apiRef) apiRef.current = null;
      engine.destroy();
    };
  }, []);

  return (
    <div className="stage" ref={stageRef}>
      <canvas ref={canvasRef} width={1600} height={900} role="img" aria-label={ariaLabel || 'Illustration of a tree that reflects the story'}></canvas>
    </div>
  );
}
