import { useEffect } from "react";
import { Card } from "./ui/card";
import { Upload } from "lucide-react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { readFile } from "@tauri-apps/plugin-fs";

interface MyDropzoneProps {
  onImageUpload: (files: File[]) => void;
}

export function MyDropzone({ onImageUpload }: MyDropzoneProps) {
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    async function setupDropListener() {
      const webview = await getCurrentWebview();
      unlisten = await webview.onDragDropEvent(async (event) => {
        if (event.payload.type === "drop") {
          const paths = event.payload.paths || [];
          const fileObjs: File[] = [];

          for (const path of paths) {
            try {
              const binary = await readFile(path);
              const blob = new Blob([new Uint8Array(binary)]);
              const fileName = path.split("/").pop() || "file";
              const file = new File([blob], fileName);
              fileObjs.push(file);
            } catch (err) {
              console.error(`Failed to read file: ${path}`, err);
            }
          }

          if (fileObjs.length > 0) {
            onImageUpload(fileObjs);
          }
        }
      });
    }

    setupDropListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [onImageUpload]);

  return (
    <Card className="w-full p-8 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer text-center space-y-4">
      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <Upload className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <p className="text-lg font-medium">Upload Images</p>
        <p className="text-sm text-muted-foreground">
          Drag & drop images here from your file explorer
        </p>
        <p className="text-xs text-muted-foreground">
          Supports: JPEG, PNG, GIF, WebP, BMP
        </p>
      </div>
    </Card>
  );
}
