import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ArrowLeft, BarChart3, Image as ImageIcon, FileImage } from 'lucide-react';

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
    <Card 
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onImageSelect(metadata)}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileImage className="h-4 w-4 text-primary" />
            <h3 className="font-medium truncate">{metadata.original_name}</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Original</p>
              <p className="font-medium">{formatFileSize(metadata.original_size)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Compressed</p>
              <p className="font-medium">
                {metadata.compressed_size ? formatFileSize(metadata.compressed_size) : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600 font-medium">
              Saved: {compressionRatio}%
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              → {metadata.compressed_name}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Original</p>
            <img 
              src={originalSrc} 
              alt={`Original ${metadata.original_name}`}
              className="w-full h-20 object-cover rounded border"
            />
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Compressed</p>
            <img 
              src={compressedSrc} 
              alt={`Compressed ${metadata.original_name}`}
              className="w-full h-20 object-cover rounded border"
            />
          </div>
        </div>
      </div>
    </Card>
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
      // The compression results would be loaded here
      // For now, we'll just set loading to false
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading results...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (imageMetadata.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              onClick={onBackToMain}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Compression Results</h1>
            </div>
          </div>
          
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <h2 className="text-xl font-medium">No Results Found</h2>
                <p className="text-muted-foreground">
                  No compression results found. Please compress some images first.
                </p>
              </div>
              <Button onClick={onBackToMain}>
                Go Back to Compress Images
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={onBackToMain}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Compression Results</h1>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <span>{imageMetadata.length} images processed</span>
          </div>
        </div>

        {/* Diagnostics */}
        {diagnostics && (
          <Card className="p-6 mb-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Compression Analysis</h3>
              <pre className="text-sm text-muted-foreground bg-muted p-3 rounded overflow-x-auto">
                {diagnostics}
              </pre>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Images Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Detailed View */}
          {selectedImage && (
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-8">
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">Detailed Comparison</h2>
                  
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Original:</strong> {selectedImage.original_name}
                    </p>
                    <p className="text-sm">
                      <strong>Compressed:</strong> {selectedImage.compressed_name}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Original</h3>
                      <img 
                        src={originalImages[selectedImage.index] || ''} 
                        alt={`Original ${selectedImage.original_name}`}
                        className="w-full rounded border"
                      />
                      <p className="text-sm text-muted-foreground">
                        Size: {formatFileSize(selectedImage.original_size)}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Compressed</h3>
                      <img 
                        src={compressedImages[selectedImage.index] || ''} 
                        alt={`Compressed ${selectedImage.original_name}`}
                        className="w-full rounded border"
                      />
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Size: {selectedImage.compressed_size ? formatFileSize(selectedImage.compressed_size) : 'N/A'}</p>
                        <p>Compression: {selectedImage.compressed_size 
                          ? `${((selectedImage.original_size - selectedImage.compressed_size) / selectedImage.original_size * 100).toFixed(1)}% smaller`
                          : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
