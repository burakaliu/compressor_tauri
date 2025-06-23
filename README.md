# Stretta - Image Compressor

![Stretta Logo](https://img.shields.io/badge/Stretta-Image%20Compressor-blue)
![License](https://img.shields.io/badge/license-Apache%202.0-green)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

**Stretta** is a simple, fast, and intuitive desktop application for compressing images while maintaining quality. Built with modern web technologies and Rust, it offers a beautiful user interface with powerful compression capabilities.

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

## 🎨 User Interface

### Main Features

- **Clean, Modern Design**: Built with Tailwind CSS and Radix UI components
- **Responsive Layout**: Adapts to different window sizes
- **Intuitive Navigation**: Easy switching between compression, results, and settings
- **Visual Feedback**: Loading states, progress indicators, and success notifications

### Pages

1. **Main Page**: Drag & drop interface for image selection and compression
2. **Results Page**: Visual comparison of original vs compressed images with statistics
3. **Settings Page**: Compression quality control, method selection, and theme preferences

## ⚙️ Configuration

### Compression Settings

- **Quality**: 10-100% (affects lossy compression methods)
- **Method Options**:
  - `Lossy (JPEG)`: Traditional JPEG compression
  - `Lossless (PNG)`: PNG compression without quality loss
  - `WebP Lossy`: Modern lossy compression with better efficiency than JPEG
  - `WebP Lossless`: Modern lossless compression with better efficiency than PNG

### Theme Settings

- **Light Mode**: Clean, bright interface
- **Dark Mode**: Easy on the eyes for low-light environments
- **System**: Automatically follows your system's theme preference

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible, unstyled UI components
- **Vite**: Fast build tool and development server

### Backend (Rust + Tauri)
- **Tauri**: Secure, fast, and lightweight desktop app framework
- **Rust**: High-performance image processing
- **Image Compressor**: Rust library for various compression algorithms
- **Serde**: Serialization/deserialization for data exchange

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

## 👨‍💻 Author

**Burak Unlu** - [burakaliunlu@gmail.com](mailto:burakaliunlu@gmail.com)

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) - For the excellent desktop app framework
- [Radix UI](https://www.radix-ui.com/) - For accessible UI components
- [Lucide](https://lucide.dev/) - For beautiful icons
- [Tailwind CSS](https://tailwindcss.com/) - For the utility-first CSS framework

## 📊 Performance

- **Fast Compression**: Powered by Rust for optimal performance
- **Low Memory Usage**: Efficient memory management
- **Small Bundle Size**: Optimized for minimal disk space usage
- **Native Performance**: Near-native speed with Tauri's lightweight runtime

---

**Stretta** - Compress images beautifully, simply, and securely. 🎨✨
