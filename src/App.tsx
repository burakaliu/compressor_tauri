import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { MyDropzone } from "./components/dropzone";
import { open } from "@tauri-apps/plugin-dialog";
import ResultsPage from "./components/ResultsPage";
import SettingsPage from "./pages/Settings";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [images, setImages] = useState<File[] | undefined>();
  const [currentPage, setCurrentPage] = useState<"main" | "results" | "settings">("main");
  const [imagesDropped, setImagesDropped] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [results, setResults] = useState<any>([]);


  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  useEffect(() => {
    // Remove this useEffect since we handle images in ResultsPage
  }, []);

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
    if (_images && _images.length > 0) {
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
        
        console.log(`Starting compression of ${imageDataArray.length} images...`);
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

  const runCompression = async () => {
    setCompressing(true);
    console.log("Running parallel compression...");

    try {
      const res = await invoke("parallel_compress");
      setResults(res);
      setCurrentPage("results");
    } catch (error) {
      console.error("Parallel compression failed", error);
      alert(`Compression error: ${error}. Check results page for details.`);
      setCurrentPage("results");
    } finally {
      setCompressing(false);
    }
  };

  return (
    <>
      {currentPage === "main" ? (
        <main className="container">
          <div className="header">
            <button
              onClick={() => setCurrentPage("results")}
              className="view-results-button"
            >
              View Results
            </button>
            <button
              onClick={() => setCurrentPage("settings")}
              className="settings-button"
            >
              Settings
            </button>
          </div>
          <h1>Welcome to image Compressor</h1>

          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              greet();
            }}
          >
            <input
              id="greet-input"
              onChange={(e) => setName(e.currentTarget.value)}
              placeholder="Enter a name..."
            />
            <button type="submit">Greet</button>
          </form>
          <p>{greetMsg}</p>

          {imagesDropped ? (
            <div className="images-dropped">
              <p>Images ready for compression: {images?.length}</p>
              <ul className="image-list">
                {images?.map((file, index) => {
                  const imageUrl = URL.createObjectURL(file);
                  return (
                    <div key={index} className="image-card">
                      <li className="before-img-name">{file.name}</li>
                      <img
                        src={imageUrl}
                        alt={file.name}
                        className="before-img"
                      />
                    </div>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={() => resetImages()}
                className="reset-images-button"
              >
                <span className="reset-images">Reset Images</span>
              </button>
            </div>
          ) : (
            <MyDropzone onImageUpload={handleImageDrop} />
          )}

          <br />

          {compressing ? (
            <div className="loading-overlay">
              <p>Compressing images... please wait</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleImageUpload(images || [])}
            >
              Click to run compressor
            </button>
          )}

          <button type="button" onClick={runCompression}>
            Run Parallel Compression
          </button>
          
          <br />

          <button
            type="button"
            onClick={() => invoke("lossy_compression")}
            className="lossy-compression-button"
          >
            run lossy
          </button>

          <br />

          <button type="button" onClick={handleExport}>
            Export Compressed Images
          </button>

          <button type="button" onClick={() => setCurrentPage("results")}>
            View Results
          </button>
        </main>
      ) : currentPage === "results" ? (
        <ResultsPage onBackToMain={() => setCurrentPage("main")} />
      ) : (
        <SettingsPage onBackToMain={() => setCurrentPage("main")} />
      )}
    </>
  );
}

export default App;
