import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { MyDropzone } from "./components/dropzone";
import { open } from "@tauri-apps/plugin-dialog";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [images, setImages] = useState<File[] | undefined>();
  const [compressedImages, setCompressedImages] = useState<string[]>([]);

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  useEffect(() => {
    invoke<string[]>("get_compressed_images").then(setCompressedImages);
  }, []);

  async function handleImageDrop(files: File[]) {
    console.log("Files dropped:", files);
    if (files.length > 0) {
      setImages(files);
      console.log("Image files set in state:", files);
    } else {
      console.error("No files dropped");
    }
  }

  async function handleImageUpload(_images: File[]) {
    // send as base64
    if (_images && _images.length > 0) {
      const base64Images = await Promise.all(
        _images.map((file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) {
                resolve(e.target.result as string);
              } else {
                reject(new Error("Failed to read file"));
              }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
          });
        })
      );
      await invoke("handle_images", { images: base64Images });
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

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

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

      <MyDropzone onImageUpload={handleImageDrop} />

      <br />

      <button type="button" onClick={() => handleImageUpload(images || [])}>
        Click to run compressor
      </button>

      <button type="button" onClick={handleExport}>
        Export Compressed Images
      </button>

      <div className="row">
        <div className="card">
          <p>Before</p>
          {images?.map((file, i) => (
            <img
              className={"before-img"}
              key={i}
              src={URL.createObjectURL(file)}
              alt={`original-${i}`}
            />
          ))}
        </div>
        <div className="card">
          <p>After</p>
          <div>
            {compressedImages.map((src, i) => (
              <img
                className={"before-img"}
                key={i}
                src={src}
                alt={`compressed-${i}`}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
