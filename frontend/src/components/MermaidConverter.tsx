"use client"

import { useState, useEffect } from "react"
import type { ExcalidrawAPIRefValue } from "@excalidraw/excalidraw"
import { convertMermaidToExcalidraw } from "../utils/mermaidConverter"
import "../styles/MermaidConverter.css"

interface MermaidConverterProps {
  excalidrawAPI: ExcalidrawAPIRefValue | null
}

const EXAMPLE_MERMAID = `graph TD
    A[Start]  B{Decision}
    B |Yes| C[Process A]
    B |No| D[Process B]
    C  E[End]
    D  E`

export default function MermaidConverter({ excalidrawAPI }: MermaidConverterProps) {
  const [mermaidCode, setMermaidCode] = useState<string>(EXAMPLE_MERMAID)
  const [isConverting, setIsConverting] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")

  // Auto-convert on input change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mermaidCode.trim()) {
        handleConvert()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [mermaidCode])

  const handleConvert = async () => {
    if (!excalidrawAPI) {
      setError("Excalidraw API not available")
      return
    }

    if (!mermaidCode.trim()) {
      setError("Please enter Mermaid code")
      return
    }

    setIsConverting(true)
    setError("")
    setSuccess("")

    try {
      const elements = await convertMermaidToExcalidraw(mermaidCode)

      if (elements.length === 0) {
        setError("No elements generated from Mermaid code")
        setIsConverting(false)
        return
      }

      // Update Excalidraw canvas with converted elements
      excalidrawAPI.updateScene({
        elements: elements,
        captureUpdate: false,
      })

      setSuccess(`✓ Converted ${elements.length} elements`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Conversion failed"
      setError(errorMessage)
    } finally {
      setIsConverting(false)
    }
  }

  const handleClear = () => {
    setMermaidCode("")
    setError("")
    setSuccess("")
  }

  const handleLoadExample = () => {
    setMermaidCode(EXAMPLE_MERMAID)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mermaidCode)
    setSuccess("✓ Copied to clipboard")
    setTimeout(() => setSuccess(""), 2000)
  }

  return (
    <div className="mermaid-converter">
      <div className="converter-header">
        <h2>Mermaid Diagram</h2>
        <div className="header-actions">
          <button className="btn-small btn-info" onClick={handleLoadExample} title="Load example diagram">
            Example
          </button>
          <button className="btn-small btn-secondary" onClick={handleCopyCode} title="Copy code to clipboard">
            Copy
          </button>
        </div>
      </div>

      <textarea
        className="mermaid-input"
        value={mermaidCode}
        onChange={(e) => setMermaidCode(e.target.value)}
        placeholder="Enter Mermaid diagram syntax..."
        spellCheck="false"
      />

      <div className="converter-actions">
        <button className="btn-primary btn-convert" onClick={handleConvert} disabled={isConverting || !excalidrawAPI}>
          {isConverting ? "Converting..." : "Convert to Excalidraw"}
        </button>
        <button className="btn-secondary" onClick={handleClear}>
          Clear
        </button>
      </div>

      {error && (
        <div className="message error-message">
          <span className="message-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="message success-message">
          <span className="message-icon">✓</span>
          <span>{success}</span>
        </div>
      )}

      <div className="converter-info">
        <h3>Supported Diagrams</h3>
        <ul>
          <li>Flowcharts (graph TD, LR, etc.)</li>
          <li>Sequence diagrams</li>
          <li>Class diagrams</li>
          <li>State diagrams</li>
          <li>Gantt charts</li>
        </ul>
      </div>
    </div>
  )
}
