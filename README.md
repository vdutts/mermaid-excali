# Mermaid to Excalidraw Converter

Convert Mermaid diagrams to Excalidraw format with live preview.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/misty-emaners-projects/mermaid2excali)

<img width="1357" height="728" alt="Screenshot 2025-10-16 at 4 15 49 AM" src="https://github.com/user-attachments/assets/b51b1575-f711-4e6c-9240-cd317fdb9caf" />

## 🚀 Quick Start

### Development
```bash
cd frontend
npm install
npm run dev
```

### Production Build
```bash
cd frontend
npm install
npm run build
npm run preview  # Test production build locally
```

## 📦 Deployment

**IMPORTANT:** Package versions are locked to exact versions to prevent breaking changes.

### Deploy to Vercel
1. Build the frontend: `cd frontend && npm run build`
2. Deploy the `frontend/dist` directory to Vercel
3. Verify Mermaid diagrams render correctly

### Deploy Script
Use the provided deployment script for consistent builds:

```bash
chmod +x deploy.sh
./deploy.sh
```

## 🔒 Version Locking

All dependencies use exact versions (no `^` or `~`):
- `@excalidraw/excalidraw`: `0.17.3`
- `@excalidraw/mermaid-to-excalidraw`: `1.1.3`
- `react`: `18.2.0`
- `react-dom`: `18.2.0`

**DO NOT** run `npm update` without thorough testing.

## 🐛 Critical Fix Applied

See [PRODUCTION_NOTES.md](./PRODUCTION_NOTES.md) for details on the rendering fix that ensures Mermaid diagrams display correctly.

## 📝 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── MermaidConverter.tsx  # Main converter component
│   ├── utils/
│   │   └── mermaidConverter.ts   # Conversion logic with normalizeElement()
│   └── App.tsx                    # Main app
├── package.json                   # Locked dependencies
└── dist/                          # Production build output
```

## 🔧 Troubleshooting

If diagrams don't render:
1. Check browser console for errors
2. Verify `normalizeElement()` function exists in build
3. Ensure exact package versions match `package.json`
4. Clear browser cache

## 📚 Documentation

- [Production Notes](./PRODUCTION_NOTES.md) - Critical fix details
- [Excalidraw Docs](https://docs.excalidraw.com/)
- [Mermaid Docs](https://mermaid.js.org/)
