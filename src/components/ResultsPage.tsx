import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './ResultsPage.css';

interface ImageMetadata {
  original_name: string;
  compressed_name: string;
  original_size: number;
  compressed_size: number | null;
  input_path: string;
  output_path: string;
  index: number;
}

interface ImageComparisonProps {
  metadata: ImageMetadata;
  originalSrc: string;
  compressedSrc: string;
  onImageSelect: (metadata: ImageMetadata) => void;
  isSelected: boolean;
}

const ImageComparison: React.FC<ImageComparisonProps> = ({
  metadata,
  originalSrc,
  compressedSrc,
  onImageSelect,
  isSelected
}) => {
  const compressionRatio = metadata.compressed_size 
    ? ((metadata.original_size - metadata.compressed_size) / metadata.original_size * 100).toFixed(1)
    : 'N/A';

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div 
      className={`image-comparison ${isSelected ? 'selected' : ''}`}
      onClick={() => onImageSelect(metadata)}
    >
      <div className="image-info">
        <h3>{metadata.original_name}</h3>
        <div className="size-info">
          <span>Original: {formatFileSize(metadata.original_size)}</span>
          <span>Compressed: {metadata.compressed_size ? formatFileSize(metadata.compressed_size) : 'N/A'}</span>
          <span className="compression-ratio">Saved: {compressionRatio}%</span>
          <span className="compressed-name">→ {metadata.compressed_name}</span>
        </div>
      </div>
      
      <div className="images-container">
        <div className="image-section">
          <h4>Original</h4>
          <img src={originalSrc} alt={`Original ${metadata.original_name}`} />
        </div>
        
        <div className="image-section">
          <h4>Compressed</h4>
          <img src={compressedSrc} alt={`Compressed ${metadata.original_name}`} />
        </div>
      </div>
    </div>
  );
};

interface ResultsPageProps {
  onBackToMain: () => void;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ onBackToMain }) => {
  const [imageMetadata, setImageMetadata] = useState<ImageMetadata[]>([]);
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  const [compressedImages, setCompressedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<string>('');

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      
      // Get metadata, original images, compressed images, and diagnostics
      const [metadata, original, compressed, diag] = await Promise.all([
        invoke<ImageMetadata[]>('get_image_metadata'),
        invoke<string[]>('get_original_images'),
        invoke<string[]>('get_compressed_images'),
        invoke<string>('get_compression_diagnostics')
      ]);

      setImageMetadata(metadata);
      setOriginalImages(original);
      setCompressedImages(compressed);
      setDiagnostics(diag);
      
      if (metadata.length > 0) {
        setSelectedImage(metadata[0]);
      }
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="results-page">
        <div className="loading">Loading results...</div>
      </div>
    );
  }

  if (imageMetadata.length === 0) {
    return (
      <div className="results-page">
        <div className="header">
          <button onClick={onBackToMain} className="back-button">
            ← Back to Main
          </button>
          <h1>Compression Results</h1>
        </div>
        <div className="no-results">
          <p>No compression results found. Please compress some images first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-page">
      <div className="header">
        <button onClick={onBackToMain} className="back-button">
          ← Back to Main
        </button>
        <h1>Compression Results</h1>
        <div className="summary">
          <span>{imageMetadata.length} images processed</span>
        </div>
      </div>

      {diagnostics && (
        <div className="diagnostics-section">
          <h3>Compression Analysis</h3>
          <pre className="diagnostics-text">{diagnostics}</pre>
        </div>
      )}

      <div className="content">
        <div className="images-grid">
          {imageMetadata.map((metadata, index) => (
            <ImageComparison
              key={metadata.index}
              metadata={metadata}
              originalSrc={originalImages[index] || ''}
              compressedSrc={compressedImages[index] || ''}
              onImageSelect={setSelectedImage}
              isSelected={selectedImage?.index === metadata.index}
            />
          ))}
        </div>

        {selectedImage && (
          <div className="detailed-view">
            <h2>Detailed Comparison</h2>
            <p className="filename-comparison">
              <strong>Original:</strong> {selectedImage.original_name} → <strong>Compressed:</strong> {selectedImage.compressed_name}
            </p>
            <div className="side-by-side">
              <div className="image-detail">
                <h3>Original</h3>
                <img 
                  src={originalImages[selectedImage.index] || ''} 
                  alt={`Original ${selectedImage.original_name}`}
                  className="detail-image"
                />
                <div className="image-stats">
                  <p>Size: {formatFileSize(selectedImage.original_size)}</p>
                </div>
              </div>
              
              <div className="image-detail">
                <h3>Compressed</h3>
                <img 
                  src={compressedImages[selectedImage.index] || ''} 
                  alt={`Compressed ${selectedImage.original_name}`}
                  className="detail-image"
                />
                <div className="image-stats">
                  <p>Size: {selectedImage.compressed_size ? formatFileSize(selectedImage.compressed_size) : 'N/A'}</p>
                  <p>Compression: {selectedImage.compressed_size 
                    ? `${((selectedImage.original_size - selectedImage.compressed_size) / selectedImage.original_size * 100).toFixed(1)}% smaller`
                    : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default ResultsPage;
