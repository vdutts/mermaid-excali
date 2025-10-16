import type { ExcalidrawElement } from "@excalidraw/excalidraw"

interface MermaidNode {
  id: string
  label: string
  type?: string
}

interface MermaidEdge {
  from: string
  to: string
  label?: string
}

interface ParsedMermaid {
  nodes: MermaidNode[]
  edges: MermaidEdge[]
  type: string
}

// Parse Mermaid syntax to extract nodes and edges
function parseMermaidSyntax(code: string): ParsedMermaid {
  const lines = code.split("\n").filter((line) => line.trim())

  if (lines.length === 0) {
    throw new Error("Empty Mermaid code")
  }

  const firstLine = lines[0].trim()
  let diagramType = "flowchart"

  // Detect diagram type
  if (firstLine.startsWith("graph")) {
    diagramType = "flowchart"
  } else if (firstLine.startsWith("sequenceDiagram")) {
    diagramType = "sequence"
  } else if (firstLine.startsWith("classDiagram")) {
    diagramType = "class"
  } else if (firstLine.startsWith("stateDiagram")) {
    diagramType = "state"
  } else if (firstLine.startsWith("gantt")) {
    diagramType = "gantt"
  }

  const nodes: MermaidNode[] = []
  const edges: MermaidEdge[] = []
  const nodeMap = new Map<string, MermaidNode>()

  // Parse nodes and edges
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()

    if (!line || line.startsWith("%%")) continue

    // Parse node definitions: A[Label], B{Decision}, C(Process)
    const nodeMatch = line.match(/^([A-Za-z0-9_]+)\[(.*?)\]/)
    const decisionMatch = line.match(/^([A-Za-z0-9_]+)\{(.*?)\}/)
    const processMatch = line.match(/^([A-Za-z0-9_]+)$$(.*?)$$/)
    const circleMatch = line.match(/^([A-Za-z0-9_]+)$$\((.*?)$$\)/)

    if (nodeMatch) {
      const [, id, label] = nodeMatch
      const node: MermaidNode = { id, label, type: "rectangle" }
      nodeMap.set(id, node)
      nodes.push(node)
    } else if (decisionMatch) {
      const [, id, label] = decisionMatch
      const node: MermaidNode = { id, label, type: "diamond" }
      nodeMap.set(id, node)
      nodes.push(node)
    } else if (circleMatch) {
      const [, id, label] = circleMatch
      const node: MermaidNode = { id, label, type: "circle" }
      nodeMap.set(id, node)
      nodes.push(node)
    } else if (processMatch) {
      const [, id, label] = processMatch
      const node: MermaidNode = { id, label, type: "rounded" }
      nodeMap.set(id, node)
      nodes.push(node)
    }

    // Parse edges: A  B, A |Label| B
    const edgeMatch = line.match(/([A-Za-z0-9_]+)\s*(?:|->|===|--)\s*(?:\|([^|]*)\|)?\s*([A-Za-z0-9_]+)/)
    if (edgeMatch) {
      const [, from, label, to] = edgeMatch
      edges.push({ from, to, label: label?.trim() })

      // Ensure nodes exist
      if (!nodeMap.has(from)) {
        const node: MermaidNode = { id: from, label: from }
        nodeMap.set(from, node)
        nodes.push(node)
      }
      if (!nodeMap.has(to)) {
        const node: MermaidNode = { id: to, label: to }
        nodeMap.set(to, node)
        nodes.push(node)
      }
    }
  }

  if (nodes.length === 0) {
    throw new Error("No nodes found in Mermaid diagram")
  }

  return { nodes, edges, type: diagramType }
}

// Convert parsed Mermaid to Excalidraw elements
function createExcalidrawElements(parsed: ParsedMermaid): ExcalidrawElement[] {
  const elements: ExcalidrawElement[] = []
  const nodePositions = new Map<string, { x: number; y: number }>()

  // Calculate positions using a simple hierarchical layout
  const nodesByLevel = new Map<number, string[]>()
  const visited = new Set<string>()

  // Simple BFS to assign levels
  const queue: [string, number][] = []
  if (parsed.nodes.length > 0) {
    queue.push([parsed.nodes[0].id, 0])
  }

  while (queue.length > 0) {
    const [nodeId, level] = queue.shift()!
    if (visited.has(nodeId)) continue
    visited.add(nodeId)

    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, [])
    }
    nodesByLevel.get(level)!.push(nodeId)

    // Find children
    for (const edge of parsed.edges) {
      if (edge.from === nodeId && !visited.has(edge.to)) {
        queue.push([edge.to, level + 1])
      }
    }
  }

  // Position nodes
  const levelHeight = 150
  const nodeWidth = 120
  const nodeHeight = 60

  for (const [level, nodeIds] of nodesByLevel) {
    const y = level * levelHeight + 50
    const totalWidth = nodeIds.length * (nodeWidth + 100)
    const startX = Math.max(50, (800 - totalWidth) / 2)

    nodeIds.forEach((nodeId, index) => {
      const x = startX + index * (nodeWidth + 100)
      nodePositions.set(nodeId, { x, y })
    })
  }

  // Create node elements
  for (const node of parsed.nodes) {
    const pos = nodePositions.get(node.id) || { x: 100, y: 100 }

    const element: Partial<ExcalidrawElement> = {
      id: node.id,
      type: node.type === "diamond" ? "diamond" : node.type === "circle" ? "ellipse" : "rectangle",
      x: pos.x,
      y: pos.y,
      width: nodeWidth,
      height: nodeHeight,
      text: node.label,
      strokeColor: "#1f2937",
      backgroundColor: "#dbeafe",
      fillStyle: "hachure",
      strokeWidth: 2,
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      index: "a0" as const,
      roundness: node.type === "rounded" ? "round" : null,
      seed: Math.random() * 1000000,
      versionNonce: Math.random() * 1000000,
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
    }

    elements.push(element as ExcalidrawElement)
  }

  // Create edge elements (arrows)
  for (const edge of parsed.edges) {
    const fromPos = nodePositions.get(edge.from)
    const toPos = nodePositions.get(edge.to)

    if (!fromPos || !toPos) continue

    const fromX = fromPos.x + nodeWidth / 2
    const fromY = fromPos.y + nodeHeight / 2
    const toX = toPos.x + nodeWidth / 2
    const toY = toPos.y + nodeHeight / 2

    const arrowElement: Partial<ExcalidrawElement> = {
      id: `arrow-${edge.from}-${edge.to}`,
      type: "arrow",
      x: fromX,
      y: fromY,
      width: toX - fromX,
      height: toY - fromY,
      points: [
        [0, 0],
        [toX - fromX, toY - fromY],
      ],
      strokeColor: "#1f2937",
      backgroundColor: "transparent",
      fillStyle: "hachure",
      strokeWidth: 2,
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      index: "a0" as const,
      roundness: null,
      seed: Math.random() * 1000000,
      versionNonce: Math.random() * 1000000,
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
      startArrowType: null,
      endArrowType: "arrow",
      startBinding: null,
      endBinding: null,
    }

    if (edge.label) {
      arrowElement.text = edge.label
    }

    elements.push(arrowElement as ExcalidrawElement)
  }

  return elements
}

// Main conversion function
export async function convertMermaidToExcalidraw(mermaidCode: string): Promise<ExcalidrawElement[]> {
  try {
    const parsed = parseMermaidSyntax(mermaidCode)
    const elements = createExcalidrawElements(parsed)
    return elements
  } catch (error) {
    throw new Error(`Failed to convert Mermaid: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
