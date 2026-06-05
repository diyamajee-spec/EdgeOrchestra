import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu } from "lucide-react";

const BOOT_STEPS = [
  "KERNEL_INIT: EdgeOrchestra v0.1.0-nightly (aarch64/x86_64)",
  "SYS_ALLOC: Reserving 4096MB VRAM for native LLM inference...",
  "FS_MOUNT: Initializing Loro CRDT append-only memory logs...",
  "WASM_JIT: Compiling isolated agent plugin sandboxes...",
  "IPC_BIND: Establishing zero-copy Tauri message queues...",
  "NEURAL_LINK: Agent router matrix online. Yielding control."
];

export function IntroSequence() {
  const [step, setStep] = useState(0);
  const [hexData, setHexData] = useState("");
  const [syslog, setSyslog] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // --- Matrix Code Rain Effect ---
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "01011001 01101111 01110101 01110010 00100000 01100111 01110101 01101001 01100100 01100101 {} [] => fn async await void * & ^ % $ # @ ! ~ | < > ? /".split(" ");
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = Array(Math.floor(columns)).fill(1);

    const drawMatrix = () => {
      // Fade the previous frame to create trails
      ctx.fillStyle = "rgba(2, 2, 4, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(6, 182, 212, 0.3)"; // Dim cyan code
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };
    
    const matrixInterval = setInterval(drawMatrix, 35);

    // --- End Matrix Effect ---

    // Generate random hex data stream
    const hexInterval = setInterval(() => {
      const arr = Array.from({ length: 8 }, () => 
        Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0')
      );
      setHexData(arr.join(" "));
    }, 80);

    // Generate rapid syslog scrolling text
    const logInterval = setInterval(() => {
      const addr = "0x" + Math.floor(Math.random() * 0xFFFFFFFFF).toString(16).padStart(9, '0').toUpperCase();
      const ops = ["JMP_REL", "MOV_RSI", "CMP_RAX", "SYS_ALLOC", "PAGE_FAULT", "MUTEX_LOCK", "WASM_CALL"];
      const op = ops[Math.floor(Math.random() * ops.length)];
      const newLog = `[${addr}] ${op} THREAD_${Math.floor(Math.random() * 16).toString().padStart(2, '0')} -> OK`;
      setSyslog(prev => [...prev.slice(-25), newLog]); // Keep last 25 lines
    }, 40);

    const stepInterval = setInterval(() => {
      setStep((s) => (s < BOOT_STEPS.length ? s + 1 : s));
    }, 450);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(matrixInterval);
      clearInterval(hexInterval);
      clearInterval(logInterval);
      clearInterval(stepInterval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const progress = Math.min((step / BOOT_STEPS.length) * 100, 100);

  return (
    <motion.div 
      className="fixed inset-0 z-[9999] bg-[#020204] flex flex-col items-center justify-center font-mono overflow-hidden selection:bg-cyan-500/30"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
    >
      {/* Matrix Code Rain Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
      />

      {/* Hi-Fi Tech Grid Background */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
          backgroundPosition: 'center center'
        }}
      />

      {/* Rapid Syslog (Left Side) */}
      <div className="absolute top-0 left-4 bottom-0 w-64 overflow-hidden text-[8px] text-cyan-500/20 font-mono flex flex-col justify-end pb-8 pointer-events-none opacity-50">
        {syslog.map((log, i) => (
          <div key={i} className="whitespace-nowrap">{log}</div>
        ))}
      </div>

      {/* Animated Radar/Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_10%,#020204_85%)] pointer-events-none" />

      {/* Hex Data Stream (Top Right) */}
      <div className="absolute top-6 right-8 text-[9px] text-indigo-500/50 tracking-widest text-right max-w-[200px] break-words leading-relaxed pointer-events-none">
        <div className="text-cyan-500/60 font-bold mb-1">HW_PROFILER: OK</div>
        <div>CPU_CORES: {navigator.hardwareConcurrency || 8} LOGICAL</div>
        <div>SYS_MEM: ~{((navigator as any).deviceMemory || 8) * 1024} MB</div>
        <div>GPU_ACCEL: TENSOR_READY</div>
        <div className="mt-2 text-cyan-500/40">MEMORY_ADDR_DUMP:</div>
        <div className="font-bold">{hexData}</div>
      </div>

      {/* Core UI */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center w-full max-w-2xl px-8"
      >
        {/* Animated AI Core Icon */}
        <div className="relative w-32 h-32 mb-10 flex items-center justify-center">
          {/* Outer rotating dashed ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-cyan-500/30"
          />
          {/* Inner counter-rotating ring */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 rounded-full border-2 border-transparent border-t-indigo-500/60 border-b-indigo-500/60"
          />
          {/* Fast inner spinner */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 rounded-full border border-transparent border-r-cyan-400/40"
          />
          {/* Glowing center */}
          <div className="absolute inset-6 rounded-full bg-cyan-500/5 backdrop-blur-md border border-cyan-500/40 flex items-center justify-center shadow-[0_0_50px_-5px_rgba(6,182,212,0.4)]">
            <Cpu size={28} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
          </div>
        </div>

        {/* Branding */}
        <h1 className="text-[2.5rem] font-black tracking-[0.25em] text-white mb-2 shadow-cyan-500/50 drop-shadow-lg">
          EDGE<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">ORCHESTRA</span>
        </h1>
        <div className="flex items-center gap-3 mb-10">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-cyan-500/50" />
          <p className="text-[10px] text-cyan-400/80 uppercase tracking-[0.5em] font-bold">Local Intelligence Matrix</p>
          <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-cyan-500/50" />
        </div>

        {/* Boot Sequence Text Log */}
        <div className="w-full h-36 flex flex-col justify-end text-[10px] text-cyan-500/70 tracking-widest space-y-2 mb-8 font-mono">
          <AnimatePresence>
            {BOOT_STEPS.slice(0, step).map((text, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-4"
              >
                <span className="text-indigo-400 font-bold shrink-0">
                  [{String((idx * 0.041).toFixed(3))}]
                </span>
                <span className={idx === BOOT_STEPS.length - 1 ? "text-cyan-300 font-bold drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" : ""}>
                  {text}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {step < BOOT_STEPS.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="w-3 h-4 bg-cyan-400 mt-2 ml-14 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
            />
          )}
        </div>

        {/* Loading Progress Bar */}
        <div className="w-full">
          <div className="flex justify-between text-[10px] text-cyan-500/60 mb-2 font-bold tracking-widest">
            <span>BOOT_SEQUENCE_STATUS</span>
            <span>{Math.floor(progress)}%</span>
          </div>
          <div className="h-[2px] w-full bg-white/10 overflow-hidden relative">
            <motion.div 
              className="absolute top-0 left-0 bottom-0 bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,1)]"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "circOut", duration: 0.4 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Extreme Scanline */}
      <motion.div 
        className="absolute top-0 left-0 right-0 h-[4px] bg-cyan-400/20 shadow-[0_0_40px_rgba(6,182,212,0.8)] pointer-events-none z-50 mix-blend-screen"
        initial={{ top: "-10%" }}
        animate={{ top: "110%" }}
        transition={{ duration: 2.5, ease: "linear", repeat: Infinity }}
      />
    </motion.div>
  );
}
