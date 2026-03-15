"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface FileUploadProps {
  onUploadSuccess: (fileData: any) => void;
  children?: React.ReactNode;
  accept?: string;
  maxSize?: number; // in MB
}

export function FileUpload({ 
  onUploadSuccess, 
  children, 
  accept = ".stl,.obj,.3mf,.gcode",
  maxSize = 50 
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (fileInputRef.current && fileInputRef.current.files) {
        const files = Array.from(fileInputRef.current.files);
        if (files.length === 0) return;

        setIsUploading(true);
        setError(null);

        // Upload files sequentially to avoid overwhelming server or state updates
        for (const file of files) {
             // Check extension
            const extension = file.name.split('.').pop()?.toLowerCase();
            const acceptedExtensions = accept.split(',').map(ext => ext.trim().replace('.', '').toLowerCase());
            
            if (extension && !acceptedExtensions.includes(extension)) {
               setError(`Arquivo ${file.name} ignorado: Tipo inválido.`);
               continue;
            }

            if (file.size > maxSize * 1024 * 1024) {
               setError(`Arquivo ${file.name} ignorado: Tamanho excede ${maxSize}MB.`);
               continue;
            }

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await api.post('/upload/stl', formData, {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                  },
                });

                if (response.data) {
                     onUploadSuccess(response.data);
                }
            } catch (err: any) {
                console.error(`Error uploading ${file.name}`, err);
                setError(`Erro ao enviar ${file.name}`);
            }
        }
        
        setIsUploading(false);
         // Clear input
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  // Clean up unused state that doesn't make sense for multiple files
  // const [uploadedFile, setUploadedFile] = useState<any>(null); -> Removed logic relying on this for multiple mode

  const clearFile = () => {
    // setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // If children are provided, we use them as the trigger
  if (children) {
    return (
      <div className="w-full">
        <div onClick={triggerInput}>
          {children}
        </div>
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept={accept} 
          multiple
          onChange={handleFileChange}
          disabled={isUploading}
        />
        {isUploading && (
          <div className="flex items-center gap-2 mt-2 text-indigo-600 text-xs font-bold animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            Enviando arquivos...
          </div>
        )}
        {error && <p className="text-rose-500 text-xs mt-2 font-bold ml-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="w-full">
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-emerald-300 transition-all group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
            ) : (
              <Upload className="w-10 h-10 text-slate-300 group-hover:text-emerald-500 mb-3 transition-colors" />
            )}
            <p className="mb-2 text-sm text-slate-500 font-bold">
              {isUploading ? 'Enviando arquivos...' : 'Clique para enviar arquivos 3D'}
            </p>
            <p className="text-xs text-slate-400 font-medium">{accept.replace(/\./g, '').toUpperCase()} (Máx. {maxSize}MB)</p>
          </div>
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept={accept} 
            multiple
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      {error && <p className="text-rose-500 text-xs mt-2 font-bold ml-1">{error}</p>}
    </div>
  );
}
