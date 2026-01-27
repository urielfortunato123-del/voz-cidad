import { useState, useRef } from 'react';
import { Upload, X, File, Image, Video, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VALIDATION } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FileUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  className?: string;
}

export function FileUploader({ 
  files, 
  onChange, 
  maxFiles = VALIDATION.MAX_FILES,
  maxSize = VALIDATION.MAX_FILE_SIZE,
  className 
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    const validFiles = selectedFiles.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} é muito grande. Máximo: ${maxSize / 1024 / 1024}MB`);
        return false;
      }
      return true;
    });
    
    const totalFiles = files.length + validFiles.length;
    if (totalFiles > maxFiles) {
      toast.error(`Máximo de ${maxFiles} arquivos permitido`);
      const allowed = validFiles.slice(0, maxFiles - files.length);
      onChange([...files, ...allowed]);
    } else {
      onChange([...files, ...validFiles]);
    }
    
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
  
  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };
  
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type === 'application/pdf') return FileText;
    return File;
  };
  
  return (
    <div className={cn('space-y-3', className)}>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={VALIDATION.ALLOWED_FILE_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={files.length >= maxFiles}
        className="w-full btn-touch border-dashed border-2"
      >
        <Upload className="mr-2 h-5 w-5" />
        Anexar evidências ({files.length}/{maxFiles})
      </Button>
      
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => {
            const Icon = getFileIcon(file.type);
            return (
              <div 
                key={index}
                className="flex items-center justify-between bg-muted rounded-lg p-3"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <span className="text-sm truncate">{file.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Fotos, vídeos ou documentos. Máx: {maxFiles} arquivos, {maxSize / 1024 / 1024}MB cada.
      </p>
    </div>
  );
}
