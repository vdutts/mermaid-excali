# Production Notes

## Critical Fix Applied (Oct 16, 2025)

### Issue
Mermaid diagrams were converting successfully but not rendering on the Excalidraw canvas. Elements were created but invisible due to missing required properties.

### Root Cause
The `@excalidraw/mermaid-to-excalidraw` parser returns elements missing several properties that Excalidraw requires:
- `strokeColor` - Required for element visibility
- `backgroundColor` - Required by `isTransparent()` function
- `strokeSharpness` - Required for collision detection
- `angle` - Required for element positioning

When these properties were undefined, Excalidraw's internal functions (specifically `isTransparent()` at `utils.ts:411`) would crash trying to read `.length` on undefined values.

### Solution
Added a `normalizeElement()` function in `/frontend/src/utils/mermaidConverter.ts` that ensures all required properties exist with sensible defaults:

```typescript
strokeColor: element.strokeColor || "#000000"
backgroundColor: element.backgroundColor || "transparent"
strokeSharpness: element.strokeSharpness || "round"
angle: element.angle || 0
```

### Version Locking
All package versions have been locked to exact versions (removed `^` prefix) to prevent future breaking changes:

**Critical Dependencies:**
- `@excalidraw/excalidraw`: `0.17.3` (exact)
- `@excalidraw/mermaid-to-excalidraw`: `1.1.3` (exact)
- `react`: `18.2.0` (exact)
- `react-dom`: `18.2.0` (exact)

### Production Deployment Checklist

1. **Before deploying:**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Verify the build:**
   - Check that `frontend/dist` directory is created
   - Test the production build locally: `npm run preview`
   - Verify Mermaid diagrams render correctly

3. **Environment variables:**
   - Ensure production API endpoints are configured
   - Check CORS settings for production domain

4. **Never run:**
   - `npm update` without testing
   - `npm install` with `--save` flag for new packages without version pinning

### Testing in Production
1. Load the app
2. Enter a Mermaid diagram (use the default example)
3. Verify elements appear on the right canvas
4. Verify no console errors related to `isTransparent` or `reading 'length'`

### If Issues Occur
1. Check browser console for errors
2. Verify exact package versions match this document
3. Clear browser cache and reload
4. Check that `normalizeElement()` function is present in the build

### Maintenance
- Do NOT upgrade `@excalidraw/excalidraw` or `@excalidraw/mermaid-to-excalidraw` without thorough testing
- If upgrades are necessary, test locally first and verify all properties are still being set correctly
- Keep this document updated with any changes
