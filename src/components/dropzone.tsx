import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface MyDropzoneProps {
  onImageUpload: (files: File[]) => void;
}

export function MyDropzone({onImageUpload}: MyDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log("Files dropped:", acceptedFiles);

    if (acceptedFiles.length > 0) {
      onImageUpload(acceptedFiles);
      console.log("Image files sent to onImageUpload:", acceptedFiles);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp", ".bmp"] },
  });

  return (
    <div {...getRootProps()} style={{ 
      border: '2px dashed #ccc', 
      padding: '20px', 
      textAlign: 'center',
      cursor: 'pointer'
    }}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the images here ...</p>
      ) : (
        <p>Drag 'n' drop some images here, or click to select images</p>
      )}
    </div>
  );
}
