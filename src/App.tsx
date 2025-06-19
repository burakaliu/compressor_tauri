import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { MyDropzone } from "./components/dropzone";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [slapMsg, setSlapMsg] = useState("");
  const [name, setName] = useState("");
  const [images, setImages] = useState<File[] | undefined>();

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  async function slap() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setSlapMsg(await invoke("slap", { name }));
  }

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    console.log("Image change event:", event);
    const target = event.target as HTMLInputElement & {
      files: FileList | null;
    }
    setImages(target.files ? Array.from(target.files) : undefined);
    console.log("Files:", target.files);
  }

  async function handleImageUpload() {
    // send as base64
    if (images && images.length > 0) {
      const base64Images = await Promise.all(
        images.map((file) => {
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
    }
    else {
      console.error("No images selected");
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

      <p>Press h</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleImageUpload();
        }}
      >
        <label htmlFor="images">Select images:</label>
        <input
          id="images"
          name="images"
          onChange={(e) => handleImageChange(e)}
          placeholder="Select images..."
          type="file"
          multiple
          accept="image/*"
        />
        <button type="submit">Upload Image</button>
      </form>

      <MyDropzone />

      <br />

      <button type="button" onClick={() => invoke("compress")}>
        Click to run compressor
      </button>
    </main>
  );
}

export default App;
