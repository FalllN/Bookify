'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#fdfaf3]/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-white shadow-2xl border border-[#e8dfc4] max-w-sm text-center">
        <div className="relative">
            <Loader2 className="w-12 h-12 text-[#663820] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-[#663820] rounded-full" />
            </div>
        </div>
        
        <div className="space-y-2">
            <h3 className="text-2xl font-bold text-[#663820] font-serif">Curating Your Library...</h3>
            <p className="text-[#8B7355] text-lg italic">"A room without books is like a body without a soul."</p>
        </div>
        
        <div className="w-full bg-[#f3e4c7] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#663820] h-full animate-[progress_2s_ease-in-out_infinite]" />
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes progress {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  )
}

export default LoadingOverlay
