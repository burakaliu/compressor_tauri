import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { MyDropzone } from "./components/dropzone";
import { open } from "@tauri-apps/plugin-dialog";
import ResultsPage from "./components/ResultsPage";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [images, setImages] = useState<File[] | undefined>();
  const [currentPage, setCurrentPage] = useState<'main' | 'results'>('main');
  const [imagesDropped, setImagesDropped] = useState(false);

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
      const imageDataArray = await Promise.all(
        _images.map((file) => {
          return new Promise<{data: string, filename: string}>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) {
                resolve({
                  data: e.target.result as string,
                  filename: file.name
                });
              } else {
                reject(new Error("Failed to read file"));
              }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
          });
        })
      );
      await invoke("handle_images", { images: imageDataArray });
      imagesDropped && setImagesDropped(false); // Reset images dropped state
      // Navigate to results page after compression
      setCurrentPage('results');
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

  return (
    <>
      {currentPage === 'main' ? (
        <main className="container">
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

          { imagesDropped ? (
            <div className="images-dropped">
              <p>Images ready for compression: {images?.length}</p>
            <ul className="image-list">
              {images?.map((file, index) => {
                const imageUrl = URL.createObjectURL(file);
                return (
                  <div key={index} className="image-card">
                    <li className="before-img-name">{file.name}</li>
                    <img src={imageUrl} alt={file.name} className="before-img"/>
                  </div>
                );
              })}
            </ul>
                      <button type="button" onClick={() => resetImages()} className="reset-images-button">
            <span className="reset-images">Reset Images</span>
          </button>
            </div>
          ) : (
            <MyDropzone onImageUpload={handleImageDrop} />
          )}


          <br />

          <button type="button" onClick={() => handleImageUpload(images || [])}>
            Click to run compressor
          </button>

          <button type="button" onClick={handleExport}>
            Export Compressed Images
          </button>

          <button type="button" onClick={() => setCurrentPage('results')}>
            View Results
          </button>
        </main>
      ) : (
        <ResultsPage onBackToMain={() => setCurrentPage('main')} />
      )}
    </>
  );
}

export default App;
