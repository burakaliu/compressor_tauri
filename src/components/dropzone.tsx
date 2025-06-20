import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import "./Dropzone.css";

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
    <div {...getRootProps()} className="dropzone">
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the images here ...</p>
      ) : (
        <p>Drag 'n' drop some images here, or click to select images</p>
      )}
    </div>
  );
}
