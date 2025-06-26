# Stretta - Image Compressor

![Stretta Logo](https://img.shields.io/badge/Stretta-Image%20Compressor-blue)
![License](https://img.shields.io/badge/license-Apache%202.0-green)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

**Stretta** is a simple, fast, private, and intuitive desktop application for compressing images. Built with Rust, Tauri, React, Vite, Tailwind, and shadcn/ui, it does everything you could want an image compressor to do

This was just a simple side project to learn Rust but I can continue expanding it if anyone finds it useful. I'm by no means a good programmer so if you find anything stupid in the code or something that could be improved, feel free to let me know


## Installation
Just head to the releases and download the latest one. dmg is for mac and exe is for windows

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

## 🛠️ How do it work?

- Lossy compression uses the image crate with a JPEG encoder
- Lossless compression uses the oxipng crate and its PNG encoder 
- WebP compression uses the webp crate. JPEG compression can sometimes produce smaller file sizes compared to WebP compression, so the program defaults to normal JPEG lossy compression for any files where WebP compression doesn't make sense 



## 📝 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

