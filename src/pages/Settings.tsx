import React, { useEffect, useState } from "react";
import "../components/ResultsPage.css"; // Reuse existing styles
import { invoke } from "@tauri-apps/api/core";

// Define the settings interface to match the Rust enum
interface AppSettings {
  compression_quality: number;
  method: "lossy" | "lossless" | "webp_lossy" | "webp_lossless";
}

const defaultSettings: AppSettings = {
  compression_quality: 75,
  method: "webp_lossy",
};

interface SettingsPageProps {
  onBackToMain: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBackToMain }) => {
  const [threadCount, setThreadCount] = useState(4);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    invoke<AppSettings>("load_settings")
      .then((loadedSettings) => setSettings(loadedSettings))
      .catch(() => setSettings(defaultSettings));
  }, []);

  const save = () => {
    invoke("save_settings", { settings }).then(() => {
      alert("Settings saved");
    });
  }


  return (
    <div className="results-page">
      <div className="header">
        <button onClick={onBackToMain} className="back-button">
          ← Back to Main
        </button>
        <h1>Compression Settings</h1>
      </div>

      <div className="settings-content">
        <div className="setting-group">
          <label htmlFor="quality">Compression Quality (%)</label>
          <input
            id="quality"
            type="range"
            min="10"
            max="100"
            value={settings.compression_quality}
            onChange={(e) => setSettings({
              ...settings,
              compression_quality: Number(e.target.value)
            })}
          />
          <span className="setting-value">{settings.compression_quality}%</span>
          <small>
            Higher values preserve more detail but result in larger files
          </small>
        </div>

        <div className="setting-group">
          <label htmlFor="method">Compression Method</label>
          <select
            id="method"
            value={settings.method}
            onChange={(e) => setSettings({
              ...settings,
              method: e.target.value as AppSettings["method"]
            })}
          >
            <option value="lossy">Lossy (JPEG)</option>
            <option value="lossless">Lossless (PNG)</option>
            <option value="webp_lossy">WebP Lossy</option>
            <option value="webp_lossless">WebP Lossless</option>
          </select>
          <small>
            Choose compression method: Lossy for smaller files, Lossless for perfect quality
          </small>
        </div>

        <div className="setting-group">
          <label htmlFor="threads">Thread Count</label>
          <input
            id="threads"
            type="range"
            min="1"
            max="8"
            value={threadCount}
            onChange={(e) => setThreadCount(Number(e.target.value))}
          />
          <span className="setting-value">{threadCount}</span>
          <small>More threads can speed up compression but use more CPU</small>
        </div>

        <button onClick={save} className="save-button">
          Save Settings
        </button>
      </div>

      <div className="settings-info">
        <h3>About Image Compression</h3>
        <ul>
          <li>
            <strong>Quality:</strong> Controls the balance between file size and
            image quality
          </li>
          <li>
            <strong>Lossy:</strong> JPEG compression - smaller files, some quality loss
          </li>
          <li>
            <strong>Lossless:</strong> PNG compression - perfect quality, larger files
          </li>
          <li>
            <strong>WebP Lossy:</strong> Modern format with better compression than JPEG
          </li>
          <li>
            <strong>WebP Lossless:</strong> Modern format with better compression than PNG
          </li>
          <li>
            <strong>Threads:</strong> Number of parallel processing threads for
            faster compression
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SettingsPage;
