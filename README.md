# SKPXR

**SKPXR** is a wrapper designed to be a drop-in replacement for **PixiJS v7.2.4**. Its main goal is to incorporate fast vector rendering using Skia (`canvaskit-wasm`) and enable exporting canvases to PDF while preserving crisp vector elements. 

For PDF export, we use a custom CanvasKit build from this fork: [Gerpea/canvaskit-pdf](https://github.com/Gerpea/canvaskit-pdf/tree/canvaskit-pdf). You can find the build instructions there, though the pre-compiled files are already included in this repo under `vendor/canvaskit-wasm`.

## ⚠️ Current Status: `v0.1.0-alpha.0`

This is an early alpha release. That means **there is no warranty**, and things might break at any time. Use it at your own risk! 

That said, I have tested it with PixiJS v7.2.4's basic primitives and sprites. Here is what currently works:

### ✅ Supported Features
* **Basic Primitives:** Graphics shapes, positioning, and transforms (including skew, scale, and rotation).
* **Sprites & Textures:** Simple sprites (no tiling yet).
* **Core Engine:** Sync with the Pixi `Ticker`, blend modes, and alpha inheritance.
* **Vector Text:** True vector text rendering! 

### ⚠️ Known Limitations & Trade-offs
* **Fonts:** Because WASM is sandboxed, it doesn't have access to your system fonts. Right now, text rendering only uses the default compiled-in WASM font. Custom font loading at app initialization is planned for a future update.
* **Masking:** Limited support (honestly, it's partially broken right now).
* **Tiling Sprites:** Not supported yet.

👉 **Check out the live examples here:** [https://gerpea.github.io/skpxr/](https://gerpea.github.io/skpxr/)

## 🗺️ Roadmap

* Implement the rest of the [PixiJS v7 API](https://pixijs.download/v7.x/docs/index.html).
* Successfully run all official examples from the PixiJS website.
* Eventually look into PixiJS v8 support (but that is a long road ahead!).

## 🛠️ Local Development & Contributing

Want to help out? Here is a quick guide to getting the dev environment running:

1. Clone the repo:
   ```bash
   git clone https://github.com/Gerpea/skpxr.git
   cd skpxr
   ```
2. Install dependencies for the core library:
   ```bash
   npm ci
   ```
3. Install dependencies for the example app:
    ```bash
    cd example && npm ci && cd ..
    ```
4. Start the development server:
    ```bash
    npm run dev:example
    ```

And you're ready to go! Dive into the code, find the bugs, untangle the architectural nightmares, and fix them. I would be incredibly happy to receive some PRs!