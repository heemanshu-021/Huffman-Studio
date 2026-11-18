import React, { useRef, DragEvent, ChangeEvent, useState } from 'react';
import { UploadCloud, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  accept: string;
  title: string;
  subtitle: string;
  browseLabel?: string;
  supportedFormatsText: string;
  icon?: React.ReactNode;
  className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelected,
  accept,
  title,
  subtitle,
  browseLabel = 'Browse Files',
  supportedFormatsText,
  icon,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`
        relative overflow-hidden rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer
        transition-all duration-200 group
        ${
          isDragging
            ? 'border-emerald-400 bg-emerald-500/[0.07] scale-[1.008] shadow-glow-emerald'
            : 'border-surface-border hover:border-emerald-500/40 bg-surface-card/60 hover:bg-surface-card/90'
        }
        ${className}
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />

      {/* Subtle radial ambient background light */}
      <div className="absolute inset-0 bg-radial-gradient from-emerald-500/[0.04] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-md mx-auto space-y-4">
        {/* Animated Icon Container */}
        <div
          className={`
            w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
            ${
              isDragging
                ? 'bg-emerald-500/20 text-emerald-300 scale-110 shadow-glow-emerald'
                : 'bg-surface-2 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/25 border border-surface-border'
            }
          `}
        >
          {icon || <UploadCloud className="w-8 h-8" />}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-slate-100 group-hover:text-white transition-colors">
            {isDragging ? 'Drop file to upload' : title}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
            {subtitle}
          </p>
        </div>

        <div className="pt-2 flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            {browseLabel}
          </Button>
        </div>

        <div className="pt-3 border-t border-surface-border/60 w-full flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{supportedFormatsText}</span>
        </div>
      </div>
    </div>
  );
};
