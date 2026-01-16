# Stemvex - Technical Storytelling Suite

> Adobe Creative Cloud Web Add-on for Adobe Express

Convert LaTeX mathematical equations into high-quality PNG images and insert them as native bitmap graphics into Adobe Express documents.

## 🎯 Features

- **LaTeX to PNG Conversion**: Render LaTeX equations using KaTeX and convert them to PNG images
- **Native Adobe Express Integration**: Insert equations as bitmap images that can be moved, resized, and edited
- **Rich Example Library**: 17+ example equations covering algebra, calculus, matrices, and more
- **LaTeX Validation**: Real-time syntax checking before conversion
- **Quick Reference Guide**: Built-in LaTeX cheatsheet for common commands

## 🏗️ Architecture

Stemvex uses Adobe's two-runtime architecture:

- **UI Runtime** (iframe): Handles LaTeX processing using KaTeX and html2canvas
- **Document Sandbox Runtime**: Manages Adobe Express document manipulation
- **Bridge Communication**: Secure data transfer between runtimes via ArrayBuffer

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm
- Adobe Express account
- Modern web browser (Chrome, Firefox, Edge, or Safari)

### Installation

1. Clone or extract this repository
2. Install dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm start
```

This will start a local development server (typically at `http://localhost:5241`).

### Building for Production

Build the project:

```bash
npm run build
```

The compiled add-on will be output to the `dist/` directory.

### Package for Distribution

Create a distributable package:

```bash
npm run package
```

## 📖 Usage in Adobe Express

### Loading the Add-on

1. Open Adobe Express in your browser
2. Enable **Developer Mode** in settings
3. Click **Add Your Add-on**
4. Enter the development server URL (e.g., `http://localhost:5241`)
5. The Stemvex panel will appear in your Adobe Express workspace

### Creating Math Equations

1. Enter LaTeX code in the text area (without `$` delimiters)
2. Use the example buttons to load pre-made equations
3. Click **Insert Equation** to render and insert into your document
4. The equation appears as a PNG image that you can move and resize

### Example LaTeX

```latex
E = mc^{2}                                      # Einstein's equation
\frac{-b \pm \sqrt{b^{2} - 4ac}}{2a}          # Quadratic formula
\int_{a}^{b} f(x) \, dx                        # Integral
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}           # Summation
\begin{pmatrix} a & b \\ c & d \end{pmatrix}  # Matrix
```

## 📁 Project Structure

```
stemvex/
├── src/
│   ├── engines/
│   │   └── math/
│   │       └── MathEngine.ts          # LaTeX → PNG conversion engine
│   ├── sandbox/
│   │   ├── commands/
│   │   │   └── insertMath.ts          # Document manipulation command
│   │   ├── code.ts                    # Sandbox runtime entry point
│   │   └── tsconfig.json
│   ├── ui/
│   │   ├── components/
│   │   │   ├── App.tsx                # Main application component
│   │   │   └── MathInput.tsx          # LaTeX input component
│   │   ├── index.tsx                  # UI runtime entry point
│   │   ├── styles.css                 # Tailwind CSS imports
│   │   ├── global.d.ts
│   │   └── tsconfig.json
│   ├── models/
│   │   └── DocumentSandboxApi.ts      # Runtime bridge interface
│   ├── index.html                     # HTML entry point
│   └── manifest.json                  # Add-on manifest
├── package.json
├── tsconfig.json
├── webpack.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🛠️ Technology Stack

### Core
- **TypeScript** 5.3.2
- **React** 18.2.0
- **Webpack** 5.98.0

### Math Rendering
- **KaTeX** 0.16.27 - Fast LaTeX rendering
- **html2canvas** 1.4.1 - HTML to PNG conversion

### Styling
- **TailwindCSS** 3.4.19
- **Adobe Spectrum Web Components** 1.7.0

### Adobe
- **Adobe Creative Cloud Web Add-on SDK**
- **Adobe Express Document SDK**

## 🔧 Technical Details

### Why Bitmap Images?

The add-on converts LaTeX to PNG (bitmap) rather than SVG (vector) because:
- Adobe Express SDK has better support for bitmap images
- Ensures consistent rendering across all platforms
- Avoids complex SVG path conversion issues

### Two-Runtime Communication

```
User Input (LaTeX)
    ↓
UI Runtime: MathEngine.convertToPNG()
    → KaTeX renders LaTeX to HTML
    → html2canvas converts HTML to PNG
    → PNG Blob → ArrayBuffer
    ↓
Bridge: runtime.apiProxy()
    ↓
Sandbox Runtime: insertMath()
    → ArrayBuffer → Blob
    → editor.loadBitmapImage()
    → editor.createImageContainer()
    → Added to document
```

## 📝 Scripts

- `npm install` - Install dependencies
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run package` - Create distribution package
- `npm run clean` - Remove build artifacts

## 🐛 Troubleshooting

### Blank White Boxes

Check browser console for errors. Ensure html2canvas is rendering correctly.

### LaTeX Syntax Errors

- Use braces for superscripts/subscripts: `x^{2}` not `x^2`
- Don't include `$` delimiters (they're stripped automatically)
- Check bracket matching with the built-in validator

### Build Errors

- Ensure all dependencies are installed: `npm install`
- Clear node_modules and reinstall if needed
- Check Node.js version is 16 or later

### Add-on Not Loading

- Verify development server is running (`npm start`)
- Check that Developer Mode is enabled in Adobe Express
- Ensure the URL is correct (typically `http://localhost:5241`)

## 📄 License

This project is provided as-is for educational and development purposes.

## 🤝 Contributing

This is a complete, production-ready add-on. Future features can follow the same architectural pattern:
- Code syntax highlighting
- Data visualization
- Diagram generation

## 📚 Resources

- [Adobe Creative Cloud Add-on Documentation](https://developer.adobe.com/express/add-ons/)
- [KaTeX Documentation](https://katex.org/)
- [Adobe Spectrum Web Components](https://opensource.adobe.com/spectrum-web-components/)

---

**Built with ❤️ for technical storytellers**
