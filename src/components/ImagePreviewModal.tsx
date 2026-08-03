import React, { useEffect } from 'react';
import { X, ExternalLink, Download } from 'lucide-react';

interface ImagePreviewModalProps {
  src: string | null;
  alt?: string;
  title?: string;
  onClose: () => void;
}

export default function ImagePreviewModal({
  src,
  alt = 'Visualização da Imagem',
  title,
  onClose,
}: ImagePreviewModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (src) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top action bar */}
      <div 
        className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-3 z-[210]"
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white/80 hover:text-white transition backdrop-blur-md cursor-pointer border border-white/15 shadow-lg flex items-center justify-center"
          title="Abrir em nova aba"
        >
          <ExternalLink className="w-5 h-5" />
        </a>
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition backdrop-blur-md cursor-pointer border border-white/25 shadow-xl flex items-center justify-center hover:scale-105 active:scale-95"
          title="Fechar imagem (Esc)"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Image Container */}
      <div
        className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-white/10 select-none transition-transform duration-300"
          referrerPolicy="no-referrer"
        />

        {(title || alt) && (
          <div className="mt-3 px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl text-center max-w-md">
            <p className="text-xs font-bold text-white tracking-wide truncate">
              {title || alt}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
