# Stretta - Image Compressor

![Stretta Logo](https://img.shields.io/badge/Stretta-Image%20Compressor-blue)
![License](https://img.shields.io/badge/license-Apache%202.0-green)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

**Stretta** is a simple, fast, private, and intuitive desktop application for compressing images. Built with Rust, Tauri, React, Vite, Tailwind, and shadcn/ui. It does everything you could want an image compressor to do. If it doesn't, let me know and I'll add whatever you want. If you find any bugs, let me know. This was just a simple side project to learn Rust but I can continue expanding it if anyone finds it useful. The rest of the readme is AI slop

## ✨ Features

- **Multiple Compression Formats**: Support for JPEG, PNG, WebP (lossy and lossless)
- **Drag & Drop Interface**: Simply drag and drop images to compress them
- **Batch Processing**: Compress multiple images at once
- **Quality Control**: Adjustable compression quality settings (10-100%)
- **Before/After Comparison**: Visual comparison slider to see compression results
- **Dark/Light Mode**: Automatic theme switching with manual override
- **Cross-Platform**: Available for Windows, macOS, and Linux
- **No Internet Required**: All processing happens locally on your machine
- **Privacy First**: Your images never leave your device

## 🖼️ Supported Formats

### Input Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)

### Output Formats
- **Lossy (JPEG)**: Best for photos, smaller file sizes
- **Lossless (PNG)**: Perfect for graphics with transparency, no quality loss
- **WebP Lossy**: Modern format with better compression than JPEG
- **WebP Lossless**: Superior compression compared to PNG

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Rust** (latest stable version)
- **Operating System**: Windows 10+, macOS 10.15+, or Linux

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/stretta-image-compressor.git
   cd stretta-image-compressor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run tauri dev
   ```

4. **Build for production:**
   ```bash
   npm run tauri build
   ```

### Quick Start

1. **Launch the application**
2. **Drag and drop** images into the main window or click to select files
3. **Adjust settings** (optional):
   - Go to Settings to change compression quality
   - Choose your preferred compression method
   - Toggle between light and dark themes
4. **Compress** your images by clicking "Start Compression"
5. **Review results** in the Results page with before/after comparisons
6. **Export** compressed images to your desired location

## ⚙️ Configuration

### Compression Settings

- **Quality**: 10-100% (affects lossy compression methods)
- **Method Options**:
  - `Lossy (JPEG)`: Traditional JPEG compression
  - `Lossless (PNG)`: PNG compression without quality loss
  - `WebP Lossy`: Modern lossy compression with better efficiency than JPEG
  - `WebP Lossless`: Modern lossless compression with better efficiency than PNG

## 🛠️ Development

### Project Structure

```
stretta-image-compressor/
├── src/                    # React frontend source
│   ├── components/         # Reusable UI components
│   ├── contexts/          # React contexts (theme, etc.)
│   ├── pages/             # Main application pages
│   └── lib/               # Utility functions
├── src-tauri/             # Rust backend source
│   ├── src/               # Rust source files
│   └── Cargo.toml         # Rust dependencies
├── public/                # Static assets
└── package.json           # Node.js dependencies
```

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build frontend for production
- `npm run tauri dev`: Run Tauri development server
- `npm run tauri build`: Build desktop application

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

