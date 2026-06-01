/* ──────────────────────────────────────────────────────────
   Orchestra AI — Ollama HTTP Client
   Communicates with the local Ollama server for inference
   ────────────────────────────────────────────────────────── */

import type { OllamaModel } from "@/types";

const DEFAULT_BASE_URL = "http://localhost:11434";

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  images?: string[]; // base64-encoded
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
    top_p?: number;
    top_k?: number;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllmaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  images?: string[];
}

export interface OllamaChatRequest {
  model: string;
  messages: OllmaChatMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

class OllamaClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || DEFAULT_BASE_URL;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  /** Check if Ollama is running */
  async ping(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/version`, {
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /** List available models */
  async listModels(): Promise<OllamaModel[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.models || [];
    } catch (err) {
      console.error("[Ollama] Failed to list models:", err);
      return [];
    }
  }

  /** Generate a completion (non-streaming) */
  async generate(req: OllamaGenerateRequest): Promise<OllamaGenerateResponse> {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...req, stream: false }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ollama generate failed (${res.status}): ${text}`);
    }
    return res.json();
  }

  /** Chat completion (non-streaming) */
  async chat(req: OllamaChatRequest): Promise<OllamaGenerateResponse> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...req, stream: false }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ollama chat failed (${res.status}): ${text}`);
    }
    const data = await res.json();
    return {
      model: data.model,
      response: data.message?.content || "",
      done: data.done,
      total_duration: data.total_duration,
      eval_count: data.eval_count,
      eval_duration: data.eval_duration,
    };
  }

  /** Generate with streaming — yields chunks */
  async *generateStream(
    req: OllamaGenerateRequest
  ): AsyncGenerator<string, void, unknown> {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...req, stream: true }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`Ollama stream failed (${res.status})`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          if (json.response) yield json.response;
        } catch {
          // skip malformed lines
        }
      }
    }
  }

  /** Pull a model (initiate download) */
  async pullModel(
    name: string,
    onProgress?: (status: string, completed?: number, total?: number) => void
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, stream: true }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`Failed to pull model ${name}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          onProgress?.(json.status, json.completed, json.total);
        } catch {
          // skip
        }
      }
    }
  }

  /** Vision completion: analyze an image */
  async analyzeImage(
    model: string,
    prompt: string,
    imageBase64: string,
    systemPrompt?: string
  ): Promise<string> {
    const result = await this.generate({
      model,
      prompt,
      system: systemPrompt,
      images: [imageBase64],
      options: { temperature: 0.4, num_predict: 2048 },
    });
    return result.response;
  }
}

/** Singleton Ollama client */
export const ollama = new OllamaClient();
export default OllamaClient;
