"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, File, Image, FileText, Film, Paperclip, Music, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Define supported file types and their icons
const fileTypeIcons = {
  image: <Image className="h-5 w-5" />,
  pdf: <FileText className="h-5 w-5" />,
  doc: <FileText className="h-5 w-5" />,
  video: <Film className="h-5 w-5" />,
  audio: <Music className="h-5 w-5" />,
  default: <File className="h-5 w-5" />
};

// Determine file type from MIME type
const getFileType = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'application/msword' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'doc';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'default';
};

// Convert file size to readable format
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' bytes';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string;
  className?: string;
  disabled?: boolean;
}

export function FileUploader({
  onFilesSelected,
  maxFiles = 5,
  maxSizeMB = 25,
  acceptedTypes = "image/*,application/pdf,.doc,.docx,video/*",
  className,
  disabled = false
}: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    processFiles(selectedFiles);
    
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const processFiles = (selectedFiles: File[]) => {
    // Check if adding these files would exceed the maximum
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} files.`);
      return;
    }
    
    // Validate files
    const validFiles = selectedFiles.filter(file => {
      // Check file size
      if (file.size > maxSizeBytes) {
        toast.error(`${file.name} exceeds the maximum file size of ${maxSizeMB}MB.`);
        return false;
      }
      
      // Additional validation can be added here
      return true;
    });
    
    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onFilesSelected(updatedFiles);
    }
  };
  
  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const clearFiles = () => {
    setFiles([]);
    onFilesSelected([]);
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* File dropzone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={!disabled ? handleDrop : undefined}
      >
        <div className="flex flex-col items-center justify-center py-4">
          <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            Drag & drop files or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Upload up to {maxFiles} files (max {maxSizeMB}MB each)
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
      
      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Selected Files</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFiles}
              disabled={disabled}
            >
              Clear all
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-4 rounded-lg border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {files.map((file, index) => (
              <FilePreview
                key={`${file.name}-${index}`}
                file={file}
                onRemove={() => removeFile(index)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple file upload button component for chat interface
interface FileUploadButtonProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function FileUploadButton({ onFilesSelected, disabled = false }: FileUploadButtonProps) {
  const [showUploader, setShowUploader] = useState(false);
  
  const handleFilesSelected = (files: File[]) => {
    onFilesSelected(files);
    setShowUploader(false);
  };
  
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={() => setShowUploader(true)}
        disabled={disabled}
        className="text-muted-foreground"
      >
        <Paperclip className="h-5 w-5" />
      </Button>
      
      {showUploader && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
            <FileUploader
              onFilesSelected={handleFilesSelected}
              maxFiles={5}
              disabled={disabled}
            />
            <div className="flex justify-end mt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => setShowUploader(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// File Preview component
interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  disabled?: boolean;
}

function FilePreview({ file, onRemove, disabled }: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileType = getFileType(file.type);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const renderPreview = () => {
    switch (fileType) {
      case 'image':
        return (
          <div className="relative group aspect-square w-full overflow-hidden rounded-lg bg-muted">
            <img
              src={previewUrl}
              alt={file.name}
              className="object-cover w-full h-full transition-transform group-hover:scale-105"
            />
          </div>
        );
      case 'video':
        return (
          <div className="relative group aspect-video w-full overflow-hidden rounded-lg bg-muted">
            <video
              ref={videoRef}
              src={previewUrl}
              className="object-cover w-full h-full"
              controls
              controlsList="nodownload"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {isPlaying ? (
                <Pause className="w-12 h-12 text-white" />
              ) : (
                <Play className="w-12 h-12 text-white" />
              )}
            </button>
          </div>
        );
      case 'audio':
        return (
          <div className="relative group w-full rounded-lg bg-muted p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>
              <div className="flex-grow">
                <div className="text-sm font-medium truncate">{file.name}</div>
                <audio ref={audioRef} src={previewUrl} className="hidden" />
                <div className="h-1 bg-primary/20 rounded-full mt-2">
                  <div className="h-full bg-primary rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
            </div>
          </div>
        );
      case 'pdf':
      case 'doc':
        return (
          <div className="relative group aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              {fileTypeIcons[fileType]}
              <span className="text-xs text-muted-foreground truncate max-w-[90%]">
                {file.name}
              </span>
            </div>
          </div>
        );
      default:
        return (
          <div className="relative group aspect-square w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              {fileTypeIcons.default}
              <span className="text-xs text-muted-foreground truncate max-w-[90%]">
                {file.name}
              </span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      {renderPreview()}
      <Button
        variant="secondary"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onRemove}
        disabled={disabled}
      >
        <X className="h-4 w-4" />
      </Button>
      <div className="mt-2 text-xs text-muted-foreground">
        {formatFileSize(file.size)}
      </div>
    </div>
  );
}