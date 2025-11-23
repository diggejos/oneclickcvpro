import React, { useRef, useState } from 'react';
import { Upload, FileText, X, FileType } from 'lucide-react';
import { FileInput } from '../types';

interface FileDropZoneProps {
  label: string;
  value: FileInput;
  onChange: (val: FileInput) => void;
  placeholder?: string;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({ label, value, onChange, placeholder }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onChange({
        type: 'file',
        content: base64,
        mimeType: file.type,
        fileName: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    onChange({ type: 'text', content: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="mb-4">
      <label className="text-sm font-bold text-slate-800 flex items-center justify-between gap-2 mb-2">
        <span className="flex items-center gap-2">{label}</span>
        {value.type === 'file' && (
           <button onClick={clearFile} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
             <X size={12} /> Clear File
           </button>
        )}
      </label>

      {value.type === 'file' ? (
        <div className="w-full h-32 bg-indigo-50 border-2 border-indigo-200 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-4">
           <FileType size={32} className="text-indigo-500 mb-2" />
           <p className="text-sm font-semibold text-indigo-900 truncate max-w-full px-4">{value.fileName}</p>
           <p className="text-xs text-indigo-400 mt-1">PDF Uploaded</p>
        </div>
      ) : (
        <div className="relative">
          {/* Drop Overlay */}
          <div 
            className={`relative transition-all ${isDragging ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea
              className="w-full h-32 p-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none font-mono bg-white shadow-inner block"
              placeholder={placeholder || "Paste text here or drag & drop a PDF..."}
              value={value.content}
              onChange={(e) => onChange({ ...value, content: e.target.value })}
            />
            
            {/* Overlay helper text for drag */}
            <div className="absolute bottom-2 right-2 pointer-events-none">
               <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-1 rounded border border-slate-200 flex items-center gap-1">
                  <Upload size={10} /> Drop PDF or Paste Text
               </span>
            </div>
          </div>
          <input 
            type="file" 
            accept="application/pdf" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
          />
          {/* Hidden trigger area for click-to-upload if text area is empty? 
              No, let's keep it simple: Drag/Drop works on the textarea, or use a small button 
          */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
            title="Upload PDF"
          >
            <Upload size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
