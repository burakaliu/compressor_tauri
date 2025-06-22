import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function handleExport() {
  const dir = await open({ directory: true });
  if (dir) {
    await invoke("export_compressed_images", { destination: dir });
  } else {
    console.error("No directory selected for export");
  }
  //alert("Export completed successfully!");
  //toast("Event has been created.");
  toast("Export Complete", {
    description: "Your images were exported successfully."
  });
}

