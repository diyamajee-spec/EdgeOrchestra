/* ──────────────────────────────────────────────────────────
   Audio Synthesizer — Local audio feedback using Web Audio API
   ────────────────────────────────────────────────────────── */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  
  // Resume context if browser suspended it due to user interaction policies
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  
  return audioCtx;
}

/**
 * Sweeping arpeggio boot sound (Cinematic startup)
 */
export function playBootSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    const notes = [110, 164.81, 220, 329.63, 440, 659.25, 880]; // A2, E3, A3, E4, A4, E5, A5
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      // Low pass filter to make it warmer
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(200, now + idx * 0.08);
      filter.frequency.exponentialRampToValueAtTime(3000, now + idx * 0.08 + 0.6);
      
      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.08 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.9);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.0);
    });
  } catch (e) {
    console.warn("[Audio] Boot sound synthesis failed:", e);
  }
}

/**
 * Quick digital click (Tactile UI response)
 */
export function playClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
    
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.05);
  } catch (e) {
    // Fail silently
  }
}

/**
 * Success chord chime (Arpeggio on completion)
 */
export function playSuccessSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    // C major 9 arpeggio: C4, E4, G4, B4, D5
    const notes = [261.63, 329.63, 392.00, 493.88, 587.33];
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      
      gain.gain.setValueAtTime(0, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.06 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.5);
    });
  } catch (e) {
    // Fail silently
  }
}

/**
 * Simulated keyboard typing sound (very quiet, wooden key click)
 */
export function playKeyboardClick() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Low triangle/sine frequency for keycap bottom-out
    osc.type = "triangle";
    osc.frequency.setValueAtTime(80 + Math.random() * 40, now);
    
    // Add high frequency pop
    const pop = ctx.createOscillator();
    const popGain = ctx.createGain();
    pop.type = "sine";
    pop.frequency.setValueAtTime(1400 + Math.random() * 400, now);
    
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    
    popGain.gain.setValueAtTime(0.015, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    pop.connect(popGain);
    popGain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.03);
    
    pop.start(now);
    pop.stop(now + 0.02);
  } catch (e) {
    // Fail silently
  }
}
