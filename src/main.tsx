import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
      <Toaster />
    </ThemeProvider>
  </React.StrictMode>,
);
