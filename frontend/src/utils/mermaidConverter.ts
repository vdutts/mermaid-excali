import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw"

// Helper function to ensure all elements have required properties
function normalizeElement(element: any): any {
  const normalized = {
    ...element,
    // Ensure all required properties exist with defaults
    strokeColor: element.strokeColor || "#000000",
    backgroundColor: element.backgroundColor || "transparent",
    strokeStyle: element.strokeStyle || "solid",
    fillStyle: element.fillStyle || "solid",
    strokeSharpness: element.strokeSharpness || "round",
    roughness: element.roughness ?? 1,
    opacity: element.opacity ?? 100,
    roundness: element.roundness || null,
    seed: element.seed || Math.floor(Math.random() * 2 ** 31),
    version: element.version || 1,
    versionNonce: element.versionNonce || Math.floor(Math.random() * 2 ** 31),
    isDeleted: element.isDeleted || false,
    boundElements: element.boundElements || null,
    updated: element.updated || Date.now(),
    link: element.link || null,
    locked: element.locked || false,
    angle: element.angle || 0,
    // Arrow-specific properties
    ...(element.type === "arrow" && {
      startBinding: element.startBinding || null,
      endBinding: element.endBinding || null,
      startArrowhead: element.startArrowhead || null,
      endArrowhead: element.endArrowhead || "arrow",
      elbowed: element.elbowed || false,
      points: element.points || [],
    }),
    // Text-specific properties
    ...(element.type === "text" && {
      fontSize: element.fontSize || 20,
      fontFamily: element.fontFamily || 1,
      text: element.text || "",
      textAlign: element.textAlign || "left",
      verticalAlign: element.verticalAlign || "top",
      baseline: element.baseline || 18,
      containerId: element.containerId || null,
      originalText: element.originalText || element.text || "",
      lineHeight: element.lineHeight || 1.25,
    }),
  }
  
  return normalized
}

// Main conversion function using the official Excalidraw mermaid parser
export async function convertMermaidToExcalidraw(mermaidCode: string): Promise<any[]> {
  try {
    const { elements } = await parseMermaidToExcalidraw(mermaidCode, {
      themeVariables: {
        fontSize: "16px",
      },
    })
    
    // Normalize all elements to ensure they have required properties
    const normalizedElements = elements.map(normalizeElement)
    
    return normalizedElements
  } catch (error) {
    throw new Error(`Failed to convert Mermaid: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
