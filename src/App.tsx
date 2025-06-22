import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { MyDropzone } from "./components/dropzone";
import { open } from "@tauri-apps/plugin-dialog";
import ResultsPage from "./pages/ResultsPage";
import SettingsPage from "./pages/Settings";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Settings, FileImage, Download, Eye } from "lucide-react";

function App() {
  const [images, setImages] = useState<File[] | undefined>();
  const [currentPage, setCurrentPage] = useState<
    "main" | "results" | "settings"
  >("main");
  const [imagesDropped, setImagesDropped] = useState(false);
  const [compressing, setCompressing] = useState(false);

  async function handleImageDrop(files: File[]) {
    console.log("Files dropped:", files);
    if (files.length > 0) {
      setImages(files);
      console.log("Image files set in state:", files);
      setImagesDropped(true);
    } else {
      console.error("No files dropped");
    }
  }

  async function handleImageUpload(_images: File[]) {
    // send as base64 with filenames
    if (imagesDropped && _images && _images.length > 0) {
      setCompressing(true);
      try {
        const imageDataArray = await Promise.all(
          _images.map((file) => {
            return new Promise<{ data: string; filename: string }>(
              (resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                  if (e.target?.result) {
                    resolve({
                      data: e.target.result as string,
                      filename: file.name,
                    });
                  } else {
                    reject(new Error("Failed to read file"));
                  }
                };
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(file);
              }
            );
          })
        );

        console.log(
          `Starting compression of ${imageDataArray.length} images...`
        );
        await invoke("handle_images", { images: imageDataArray });

        imagesDropped && setImagesDropped(false); // Reset images dropped state
        // Navigate to results page after compression
        setCurrentPage("results");
        console.log("Compression completed, navigating to results page");
      } catch (error) {
        console.error("Image compression failed", error);
        // Show error to user but still navigate to results to show diagnostics
        alert(`Compression error: ${error}. Check results page for details.`);
        setCurrentPage("results");
      } finally {
        setCompressing(false);
      }
    } else {
      console.error("No images selected ", images);
      alert("Please upload some images first.");
      setCompressing(false);
    }
  }

  async function handleExport() {
    const dir = await open({ directory: true });
    if (dir) {
      await invoke("export_compressed_images", { destination: dir });
    }
  }

  function resetImages() {
    setImages(undefined);
    setImagesDropped(false);
  }

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    console.log("Drag and drop listeners added");

    //log to console when something is dropped
    window.addEventListener("drop", (e) => {
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        console.log("Files dropped:", e.dataTransfer.files);
      }
    });

    //log to console when something is dragged over
    window.addEventListener("dragover", (e) => {
      console.log("Drag over event detected");
    });

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {currentPage === "main" ? (
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-2">
              <FileImage className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                Image Compressor
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage("results")}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Results
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage("settings")}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {imagesDropped ? (
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      Ready for Compression
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      {images?.length} image{images?.length !== 1 ? "s" : ""}{" "}
                      selected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images?.map((file, index) => {
                      const imageUrl = URL.createObjectURL(file);
                      return (
                        <div
                          key={index}
                          className="border rounded-lg p-3 space-y-2"
                        >
                          <img
                            src={imageUrl}
                            alt={file.name}
                            className="w-full h-32 object-cover rounded"
                          />
                          <p className="text-sm text-muted-foreground truncate">
                            {file.name}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleImageUpload(images || [])}
                      disabled={compressing}
                      className="flex-1"
                    >
                      {compressing ? "Compressing..." : "Start Compression"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => resetImages()}
                      disabled={compressing}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <MyDropzone onImageUpload={handleImageDrop} />
            )}

            {/* Loading Overlay */}
            {compressing && (
              <Card className="p-6">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground">
                    Compressing images... please wait
                  </p>
                </div>
              </Card>
            )}

            {/* Export Button */}
            <div className="flex justify-center">
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
        </main>
      ) : currentPage === "results" ? (
        <ResultsPage onBackToMain={() => setCurrentPage("main")} />
      ) : (
        <SettingsPage onBackToMain={() => setCurrentPage("main")} />
      )}
    </div>
  );
}

export default App;
