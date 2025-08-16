import React, { useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { UploadCloud, File as FileIcon, X } from "lucide-react";

type UploadDropzoneProps = {
  onFileDrop: (files: File[]) => void;
  file: File | null;
};

export default function UploadDropzone({ onFileDrop, file }: UploadDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], _fileRejections: FileRejection[]) => {
      if (acceptedFiles.length > 0) {
        onFileDrop(acceptedFiles);
      }
    },
    [onFileDrop]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  });

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileDrop([]);
  };

  return (
    <div
      {...getRootProps()}
      className={`relative p-6 md:p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors shadow-sm
        ${
          isDragActive
            ? "border-primary bg-primary/10 ring-2 ring-primary/10"
            : "border-border hover:border-primary/40 bg-card"
        }`}
    >
      <input {...getInputProps()} data-testid="file-input" />

      {file ? (
        <div className="flex flex-col items-center justify-center gap-3 w-full md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <FileIcon className="w-12 h-12 text-primary" />
            <div className="text-left">
              <p className="font-semibold text-sm md:text-base truncate max-w-[300px]">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <button
              onClick={handleRemoveFile}
              className="p-2 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center gap-2"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" /> Hapus
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4">
          <UploadCloud className="w-16 h-16 text-primary" />
          <div className="text-center">
            <p className="font-semibold">Letakkan file di sini atau klik untuk memilih</p>
            <p className="text-sm text-muted-foreground">Mendukung file .xlsx, .xls, dan .csv</p>
          </div>
        </div>
      )}
    </div>
  );
}
