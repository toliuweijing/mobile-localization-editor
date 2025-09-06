
import React, { useState, useRef, useCallback } from 'react';
import UploadIcon from './icons/UploadIcon';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  error: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onFileSelect(event.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
        <div
            onClick={handleClick}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300
            ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-slate-800' : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
        >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadIcon className={`w-10 h-10 mb-3 transition-colors ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
                <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Android (.xml) or iOS (.strings)</p>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".xml,.strings"
                onChange={handleFileChange}
            />
        </div>
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default FileUpload;
