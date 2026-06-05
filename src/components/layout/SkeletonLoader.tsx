import { motion } from "framer-motion";

export function SkeletonLoader() {
  return (
    <div className="h-full w-full p-6 space-y-6 bg-surface-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
        <div className="w-48 h-6 rounded bg-white/5 animate-pulse" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass rounded-2xl p-4 h-32 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="w-2/3 h-4 rounded bg-white/10 animate-pulse" />
                <div className="w-1/3 h-3 rounded bg-white/5 animate-pulse" />
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 animate-pulse mt-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
