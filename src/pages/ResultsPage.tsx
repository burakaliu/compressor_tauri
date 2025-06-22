import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { convertFileSrc } from "@tauri-apps/api/core";
import { ImageMetadata } from "../App";
import { handleExport } from "../lib/utils";

import {
  ArrowLeft,
  BarChart3,
  Image as ImageIcon,
  FileImage,
  Download,
} from "lucide-react";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";

// Helper functions
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const imageSrc = (base64: string) => {
  return `data:image;base64,${base64}`;
};

const imageName = (path: string) => {
  return path.split("/").pop() || "image";
};

interface ImageComparisonProps {
  metadata: ImageMetadata;
  onImageSelect: (metadata: ImageMetadata) => void;
  isSelected: boolean;
}

const ImageComparison: React.FC<ImageComparisonProps> = ({
  metadata,
  onImageSelect,
  isSelected,
}) => {
  const compressionRatio = metadata.reduction_percent.toFixed(2);

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? "ring-2 ring-primary ring-offset-2"
          : "hover:ring-0 hover:ring-muted-foreground/20"
      }`}
      onClick={() => onImageSelect(metadata)}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileImage className="h-4 w-4 text-primary" />
            <h3 className="font-medium truncate">
              {imageName(metadata.original_path)}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Original</p>
              <p className="font-medium">
                {formatFileSize(metadata.original_size)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Compressed</p>
              <p className="font-medium">
                {metadata.compressed_size
                  ? formatFileSize(metadata.compressed_size)
                  : "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600 font-medium">
              Saved: {compressionRatio}%
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              → {imageName(metadata.compressed_path)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Original</p>
            <img
              src={imageSrc(metadata.original_base64)}
              alt={`Original ${imageName(metadata.original_path)}`}
              className="w-full h-20 object-cover rounded border"
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Compressed</p>
            <img
              src={imageSrc(metadata.compressed_base64)}
              alt={`Compressed ${imageName(metadata.compressed_path)}`}
              className="w-full h-20 object-cover rounded border"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

interface ResultsPageProps {
  results: ImageMetadata[];
  onBackToMain: () => void;
}

const ResultsPage: React.FC<ResultsPageProps> = ({
  results,
  onBackToMain,
}: ResultsPageProps) => {
  const [imageMetadata, setImageMetadata] = useState<ImageMetadata[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<string>("");

  useEffect(() => {
    console.log("Results received:", results);
    if (results && results.length > 0) {
      setImageMetadata(results);
      setSelectedImage(results[0]); // Set first image as selected by default
      setLoading(false);
    } else {
      loadImages();
    }
  }, [results]);

  const loadImages = async () => {
    try {
      setLoading(true);

      // Try to load results from Tauri commands if not provided via props
      try {
        const metadata: ImageMetadata[] = await invoke(
          "get_compression_results"
        );
        setImageMetadata(metadata);

        // Set the first image as selected by default
        if (metadata.length > 0) {
          setSelectedImage(metadata[0]);
        }

        // Optionally load diagnostics if available
        try {
          const diagnosticsData: string = await invoke("get_diagnostics");
          setDiagnostics(diagnosticsData);
        } catch (diagError) {
          console.log("No diagnostics available:", diagError);
        }
      } catch (error) {
        console.log("No stored results available:", error);
        // This is normal if no compression has been done yet
      }
    } catch (error) {
      console.error("Failed to load images:", error);
    } finally {
      setLoading(false);
    }
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
              <h1 className="text-2xl font-bold text-foreground">
                Compression Results
              </h1>
            </div>
          </div>

          <Card className="p-8 text-center">
            <div className="space-y-4">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <h2 className="text-xl font-medium">No Results Found</h2>
                <p className="text-muted-foreground">
                  No compression results found. Please compress some images
                  first.
                </p>
              </div>
              <Button onClick={onBackToMain}>Go Back to Compress Images</Button>
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
              <h1 className="text-2xl font-bold text-foreground">
                Compression Results
              </h1>
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

        {/* Images Grid */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {imageMetadata.map((metadata) => (
              <ImageComparison
                key={metadata.original_path}
                metadata={metadata}
                onImageSelect={setSelectedImage}
                isSelected={selectedImage?.original_path === metadata.original_path}
              />
            ))}
          </div>
        </div>

        {/* Detailed View - Full Width Below Grid */}
        {selectedImage && (
          <Card className="p-8">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Detailed Comparison</h2>

              <div className="space-y-6">
                {/* File Names - Left and Right */}
                <div className="flex justify-between items-center">
                  <p className="text-sm">
                    <strong>Original:</strong> {imageName(selectedImage.original_path)}
                  </p>
                  <p className="text-sm">
                    <strong>Compressed:</strong> {imageName(selectedImage.compressed_path)}
                  </p>
                </div>

                {/* Full Width Image Comparison */}
                <div className="w-full h-fit rounded border overflow-hidden">
                  <ReactCompareSlider
                    itemOne={
                      <ReactCompareSliderImage
                        src={imageSrc(selectedImage.original_base64)}
                        srcSet={imageSrc(selectedImage.original_base64)}
                        alt="Original image"
                      />
                    }
                    itemTwo={
                      <ReactCompareSliderImage
                        src={imageSrc(selectedImage.compressed_base64)}
                        srcSet={imageSrc(selectedImage.compressed_base64)}
                        alt="Compressed image"
                      />
                    }
                  />
                </div>
                
                {/* Stats Layout */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                  {/* Original Stats - Left */}
                  <div className="text-left">
                    <h3 className="font-medium text-sm text-muted-foreground">Original</h3>
                    <p className="text-lg font-semibold">
                      {formatFileSize(selectedImage.original_size)}
                    </p>
                  </div>
                  
                  {/* Compression Stats - Center */}
                  <div className="text-center">
                    <h3 className="font-medium text-sm text-muted-foreground">Savings</h3>
                    <p className="text-lg font-semibold text-green-600">
                      {selectedImage.compressed_size
                        ? `${selectedImage.reduction_percent.toFixed(1)}%`
                        : "N/A"}
                    </p>
                  </div>
                  
                  {/* Compressed Stats - Right */}
                  <div className="text-right">
                    <h3 className="font-medium text-sm text-muted-foreground">Compressed</h3>
                    <p className="text-lg font-semibold">
                      {selectedImage.compressed_size
                        ? formatFileSize(selectedImage.compressed_size)
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
        {/* Export Button */}
            <div className="flex justify-center p-8">
              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Compressed Images
              </Button>
            </div>
      </div>

    </div>
  );
};

export default ResultsPage;
