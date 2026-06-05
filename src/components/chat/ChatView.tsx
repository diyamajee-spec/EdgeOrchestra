/* ──────────────────────────────────────────────────────────
   Chat Interface Component
   ────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrchestraStore } from "@/store/orchestra";
import { AGENT_COLORS, cn, timeAgo } from "@/lib/utils";
import {
  Send,
  Camera,
  Paperclip,
  Mic,
  Sparkles,
  Loader2,
  Trash2,
  Image,
  Volume2,
  VolumeX,
  Cpu,
} from "lucide-react";
import type { ChatMessage } from "@/types";

export function ChatView() {
  const {
    messages,
    isProcessing,
    sendMessage,
    clearMessages,
  } = useOrchestraStore();
  const [input, setInput] = useState("");
  const [showWebcam, setShowWebcam] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Speech Recognition (STT) ──
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser/webview.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setInput((prev) => prev + (prev ? " " : "") + text);
    };

    rec.onerror = (event: any) => {
      console.error("[SpeechRecognition] Error:", event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  // ── Speech Synthesis (TTS) ──
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const speak = (id: string, text: string) => {
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/\*\*/g, "")
      .replace(/`/g, "")
      .replace(/###/g, "")
      .replace(/##/g, "")
      .replace(/- /g, "")
      .replace(/\n/g, " ");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed && !capturedImage) return;
    setInput("");
    const img = capturedImage;
    setCapturedImage(null);
    await sendMessage(trimmed || "Analyze this image", img ? "image" : "text", img || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Sparkles size={18} className="text-orchestra-400" />
          <h2 className="text-sm font-semibold text-white/80">
            Agent Conversation
          </h2>
          <span className="text-xs text-white/25 font-mono">
            {messages.length} messages
          </span>
        </div>
        <button
          id="clear-chat"
          onClick={clearMessages}
          className="p-2 rounded-lg hover:bg-white/5 text-white/25 hover:text-accent-rose/70 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scroll-smooth"
      >
        {messages.length === 0 && (
          <EmptyState onDemo={() => {
            setInput("Analyze my desk via webcam and create a productivity plan");
          }} />
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onSpeak={speak}
              speakingId={speakingId}
            />
          ))}
        </AnimatePresence>

        {isProcessing && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex gap-3 w-full"
          >
            <div className="w-8 h-8 rounded-xl bg-[#020205] border border-cyan-500/30 flex items-center justify-center text-sm shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <Sparkles size={14} className="text-cyan-400" />
            </div>
            <ProcessAnalyzer />
          </motion.div>
        )}
      </div>

      {/* Captured Image Preview */}
      {capturedImage && (
        <div className="px-6 pb-2">
          <div className="relative inline-block">
            <img
              src={`data:image/jpeg;base64,${capturedImage}`}
              alt="Captured"
              className="h-20 rounded-lg border border-white/10"
            />
            <button
              onClick={() => setCapturedImage(null)}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-rose flex items-center justify-center text-white text-xs"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Webcam Modal */}
      {showWebcam && (
        <WebcamCapture
          onCapture={(img) => {
            setCapturedImage(img);
            setShowWebcam(false);
          }}
          onClose={() => setShowWebcam(false)}
        />
      )}

      {/* Input Bar */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-end gap-2 glass rounded-2xl px-4 py-3">
          {/* Toolbar */}
          <div className="flex items-center gap-1 pb-0.5">
            <button
              id="webcam-btn"
              onClick={() => setShowWebcam(true)}
              className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-accent-cyan transition-colors"
              title="Capture webcam"
            >
              <Camera size={18} />
            </button>
            <button
              className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-orchestra-400 transition-colors"
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>
            <button
              onClick={toggleListening}
              className={cn(
                "p-2 rounded-lg transition-colors relative",
                isListening
                  ? "text-accent-amber bg-accent-amber/10 pulse-ring"
                  : "text-white/30 hover:bg-white/5 hover:text-accent-amber"
              )}
              title={isListening ? "Listening... Click to stop" : "Voice input"}
            >
              <Mic size={18} />
            </button>
          </div>

          {/* Text Input */}
          <textarea
            ref={inputRef}
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Orchestra anything… (try: 'Analyze my desk and plan my day')"
            rows={1}
            className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/20 resize-none outline-none py-2 max-h-32"
            style={{ minHeight: "2rem" }}
          />

          {/* Send */}
          <motion.button
            id="send-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={isProcessing || (!input.trim() && !capturedImage)}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-200",
              input.trim() || capturedImage
                ? "bg-orchestra-500 text-white shadow-lg shadow-orchestra-500/25 hover:bg-orchestra-400"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            )}
          >
            {isProcessing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ── Message Bubble ──
function MessageBubble({
  message,
  onSpeak,
  speakingId,
}: {
  message: ChatMessage;
  onSpeak: (id: string, text: string) => void;
  speakingId: string | null;
}) {
  const isUser = message.role === "user";
  const isAgent = message.role === "agent";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0",
          isUser
            ? "bg-orchestra-500/20 text-orchestra-300"
            : isAgent
            ? ""
            : "bg-surface-3 text-white/40"
        )}
        style={
          isAgent && message.agentId
            ? {
                backgroundColor: `${AGENT_COLORS[message.agentId]}15`,
                color: AGENT_COLORS[message.agentId],
              }
            : undefined
        }
      >
        {isUser ? "You" : isAgent && message.agentId ? (
          { router: "🎯", vision: "👁️", planner: "📋", memory: "🧠", research: "🔬", action: "⚡", creative: "🎨" }[message.agentId]
        ) : "⚙️"}
      </div>

      {/* Content */}
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-orchestra-500/15 text-white/90 rounded-tr-md"
            : "bg-surface-2 text-white/75 rounded-tl-md border border-white/5"
        )}
      >
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {message.attachments.map((attachment, i) => (
              <img key={attachment.id || i} src={attachment.url} alt={attachment.name || "Attachment"} className="max-h-48 rounded-lg border border-white/10" />
            ))}
          </div>
        )}
        <div className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{
          __html: formatMessage(message.content)
        }} />
        <div className="text-[10px] text-white/20 mt-2 font-mono flex items-center justify-between">
          <div>
            {timeAgo(message.timestamp)}
            {isAgent && message.agentId && (
              <span
                className="ml-2"
                style={{ color: AGENT_COLORS[message.agentId] }}
              >
                via {message.agentId}
              </span>
            )}
          </div>
          {!isUser && (
            <button
              onClick={() => onSpeak(message.id, message.content)}
              className="ml-3 hover:text-white/60 transition-colors inline-flex items-center gap-1"
              title="Speak response"
            >
              {speakingId === message.id ? (
                <VolumeX size={12} className="text-accent-amber animate-pulse" />
              ) : (
                <Volume2 size={12} />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Simple markdown-like formatting ──
function formatMessage(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white/95">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-surface-3 text-orchestra-300 text-xs font-mono">$1</code>')
    .replace(/^### (.*$)/gm, '<h3 class="text-sm font-bold text-white/85 mt-3 mb-1">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-base font-bold text-white/90 mt-3 mb-1">$1</h2>')
    .replace(/^- (.*$)/gm, '<div class="flex gap-2 ml-2"><span class="text-orchestra-400">•</span><span>$1</span></div>')
    .replace(/^\d+\. (.*$)/gm, '<div class="ml-2">$&</div>')
    .replace(/\n/g, "<br/>");
}

// ── Empty State ──
function EmptyState({ onDemo }: { onDemo: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full text-center py-20"
    >
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orchestra-400/20 to-orchestra-600/10 flex items-center justify-center mb-6 float-animation">
        <Sparkles size={32} className="text-orchestra-400" />
      </div>
      <h2 className="text-xl font-bold gradient-text mb-2">
        Welcome to Orchestra AI
      </h2>
      <p className="text-sm text-white/30 max-w-md mb-6">
        Your personal AI orchestra is ready. Multiple specialized agents
        collaborate to understand, plan, and act — all running locally on your
        device.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {[
          "Analyze my desk via webcam",
          "Create a productivity plan",
          "What can you do?",
        ].map((prompt) => (
          <motion.button
            key={prompt}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onDemo()}
            className="px-4 py-2 rounded-xl text-xs font-medium glass hover:bg-white/5 text-white/40 hover:text-white/70 transition-all"
          >
            {prompt}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Webcam Capture Component ──
function WebcamCapture({
  onCapture,
  onClose,
}: {
  onCapture: (base64: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((s) => {
        currentStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(console.error);

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
    stream?.getTracks().forEach((t) => t.stop());
    onCapture(base64);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-strong rounded-2xl p-6 max-w-lg w-full mx-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <Camera size={16} className="text-accent-cyan" />
            Webcam Capture
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/40"
          >
            ✕
          </button>
        </div>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full rounded-xl border border-white/10 bg-black"
        />
        <div className="flex gap-2 mt-4">
          <button
            onClick={capture}
            className="flex-1 py-2.5 rounded-xl bg-accent-cyan/20 text-accent-cyan text-sm font-semibold hover:bg-accent-cyan/30 transition-colors flex items-center justify-center gap-2"
          >
            <Image size={16} />
            Capture & Analyze
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 text-white/40 text-sm hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Process Analyzer (Mini Terminal in Chat) ──
function ProcessAnalyzer() {
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const steps = [
      "ROUTER: Parsing natural language intent...",
      "ROUTER: Identifying contextual targets...",
      "ORCHESTRATOR: Constructing dependency graph...",
      "WASM: Pre-warming isolated sandboxes...",
      "DISPATCH: Handing over to specialist swarm..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        // --- Synthesized Keyboard Click SFX ---
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
          }
        } catch (e) { /* ignore */ }

        setLogs(prev => [...prev, steps[i]]);
        i++;
      }
    }, 450);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#020205] rounded-2xl rounded-tl-md border border-cyan-500/30 px-4 py-4 flex flex-col gap-2 w-full max-w-[85%] font-mono text-[10px] shadow-[0_0_20px_rgba(6,182,212,0.15)] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-1 border-b border-cyan-500/20 pb-2 relative z-10">
        <div className="flex items-center gap-2">
          <Cpu size={14} className="text-cyan-400" />
          <span className="text-cyan-400 font-bold tracking-[0.2em]">INTENT_MATRIX_ANALYZER</span>
        </div>
        {logs.length < 5 ? (
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{animationDelay: "0ms"}} />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{animationDelay: "150ms"}} />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{animationDelay: "300ms"}} />
          </div>
        ) : (
          <span className="text-emerald-400 font-bold">READY</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 text-cyan-500/80 relative z-10">
        {logs.map((log, idx) => (
          <motion.div 
            key={idx} 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-2"
          >
            <span className="text-indigo-400 font-bold mt-0.5">{'>'}</span>
            <span className={idx === 4 ? "text-cyan-300 font-bold" : ""}>{log}</span>
          </motion.div>
        ))}
        {logs.length < 5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
            className="w-2.5 h-3.5 bg-cyan-400 mt-1 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
          />
        )}
      </div>
      
      {/* Laser sweep effect inside the bubble */}
      <motion.div 
        className="absolute top-0 bottom-0 w-[1px] bg-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,1)] pointer-events-none z-0"
        initial={{ left: "-10%" }}
        animate={{ left: "110%" }}
        transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
      />
    </div>
  );
}
