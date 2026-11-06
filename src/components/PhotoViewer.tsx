import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { CrossfadeImage } from './CrossfadeImage';

interface PhotoViewerProps {
  images: string[];
  title: string;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export function PhotoViewer({ images, title, index, onIndexChange, onClose }: PhotoViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const move = (step: number) => onIndexChange((index + step + images.length) % images.length);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="photo-viewer"
      aria-label={`Fotos de ${title}`}
      onClose={(event) => {
        // Ignore a queued close event if StrictMode has already reopened it.
        if (!event.currentTarget.open) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          move(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }}
    >
      <div className="photo-viewer-header">
        <strong>{title}</strong>
        <button type="button" autoFocus onClick={() => dialogRef.current?.close()} aria-label="Cerrar foto">
          <X size={24} />
        </button>
      </div>
      <div className="photo-viewer-stage">
        <CrossfadeImage src={images[index]} alt={`${title} - Foto ${index + 1}`} fit="contain" />
      </div>
      <div className="photo-viewer-controls">
        {images.length > 1 && (
          <button type="button" onClick={() => move(-1)} aria-label="Foto anterior ampliada">
            <ChevronLeft size={22} />
          </button>
        )}
        <span aria-live="polite">{index + 1} / {images.length}</span>
        {images.length > 1 && (
          <button type="button" onClick={() => move(1)} aria-label="Foto siguiente ampliada">
            <ChevronRight size={22} />
          </button>
        )}
      </div>
    </dialog>
  );
}
