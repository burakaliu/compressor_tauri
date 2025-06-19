import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";

export function MyDropzone(images: FileList | null) {

  const onDrop = useCallback((acceptedFiles: FileList) => {
    console.log("Files dropped:", acceptedFiles);
    images = acceptedFiles;
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <p>Drag 'n' drop some files here, or click to select files</p>
      )}
    </div>
  );
}
