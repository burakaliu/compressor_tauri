import React, { useState } from "react";
import "../components/ResultsPage.css"; // Reuse existing styles

interface SettingsPageProps {
  onBackToMain: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBackToMain }) => {
  const [compressionQuality, setCompressionQuality] = useState(80);
  const [threadCount, setThreadCount] = useState(4);
  const [outputFormat, setOutputFormat] = useState("jpg");

  const handleSaveSettings = () => {
    // TODO: Implement settings saving via Tauri commands
    console.log("Settings saved:", { compressionQuality, threadCount, outputFormat });
    alert("Settings saved successfully!");
  };

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
            value={compressionQuality}
            onChange={(e) => setCompressionQuality(Number(e.target.value))}
          />
          <span className="setting-value">{compressionQuality}%</span>
          <small>Higher values preserve more detail but result in larger files</small>
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

        <div className="setting-group">
          <label htmlFor="format">Output Format</label>
          <select
            id="format"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value)}
          >
            <option value="jpg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
          <small>JPEG is best for photos, PNG for graphics with transparency</small>
        </div>

        <button onClick={handleSaveSettings} className="save-button">
          Save Settings
        </button>
      </div>

      <div className="settings-info">
        <h3>About Image Compression</h3>
        <ul>
          <li><strong>Quality:</strong> Controls the balance between file size and image quality</li>
          <li><strong>Threads:</strong> Number of parallel processing threads for faster compression</li>
          <li><strong>Format:</strong> Output image format - JPEG for photos, PNG for graphics</li>
          <li><strong>WebP:</strong> Modern format with better compression than JPEG/PNG</li>
        </ul>
      </div>
    </div>
  );
};

export default SettingsPage;
