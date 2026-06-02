/* ──────────────────────────────────────────────────────────
   Orchestra AI — WebAssembly Plugin Runner
   Handles string serialization/deserialization with Rust WASM
   ────────────────────────────────────────────────────────── */

export interface PluginInfo {
  name: string;
  version: string;
  description: string;
  author: string;
  capabilities: string[];
}

export interface PluginResponse {
  response: string;
  status: "success" | "error";
  metadata: Record<string, any>;
}

export class WasmRunner {
  private instance: WebAssembly.Instance | null = null;
  private memory: WebAssembly.Memory | null = null;

  constructor(private wasmBytes: Uint8Array) {}

  async init(): Promise<PluginInfo> {
    const importObject = {
      env: {
        abort: () => {
          console.error("[WASM] Aborted execution");
        },
      },
    };

    const result = (await WebAssembly.instantiate(this.wasmBytes, importObject)) as any;
    const inst = result.instance as WebAssembly.Instance;
    this.instance = inst;
    this.memory = inst.exports.memory as WebAssembly.Memory;

    if (!this.memory) {
      throw new Error("WASM module does not export its linear memory");
    }

    return this.getInfo();
  }

  private readString(ptr: number): string {
    if (!this.memory) throw new Error("WASM memory not initialized");
    const mem = new Uint8Array(this.memory.buffer);
    
    // Find the null-termination byte
    let end = ptr;
    while (mem[end] !== 0 && end < mem.length) {
      end++;
    }
    
    const decoder = new TextDecoder();
    return decoder.decode(mem.subarray(ptr, end));
  }

  private writeString(str: string): { ptr: number; len: number } {
    if (!this.memory || !this.instance) throw new Error("WASM memory not initialized");
    
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const len = bytes.length;

    // Check if the WASM module exports alloc, otherwise fall back
    let ptr: number;
    if (typeof this.instance.exports.alloc === "function") {
      ptr = (this.instance.exports.alloc as Function)(len + 1); // +1 for null termination
    } else {
      // Direct placement fallback (not memory safe for arbitrary WASM but works for simple templates)
      ptr = 1024;
    }

    const mem = new Uint8Array(this.memory.buffer);
    mem.set(bytes, ptr);
    mem[ptr + len] = 0; // null termination

    return { ptr, len };
  }

  private getInfo(): PluginInfo {
    if (!this.instance) throw new Error("Plugin not initialized");
    const get_info = this.instance.exports.get_info as Function;
    if (!get_info) {
      throw new Error("Plugin does not export get_info function");
    }

    const ptr = get_info();
    const jsonStr = this.readString(ptr);
    return JSON.parse(jsonStr);
  }

  run(query: string, context?: string): PluginResponse {
    if (!this.instance) throw new Error("Plugin not initialized");
    const process = this.instance.exports.process as Function;
    if (!process) {
      throw new Error("Plugin does not export process function");
    }

    const inputObj = { query, context: context || null };
    const { ptr, len } = this.writeString(JSON.stringify(inputObj));

    const outPtr = process(ptr, len);
    const resultStr = this.readString(outPtr);

    // Clean up memory if dealloc is exported
    if (typeof this.instance.exports.dealloc === "function") {
      (this.instance.exports.dealloc as Function)(ptr, len + 1);
    }

    return JSON.parse(resultStr);
  }
}
