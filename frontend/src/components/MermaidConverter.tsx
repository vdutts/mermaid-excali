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
    <>
      <textarea
        className="mermaid-input"
        value={mermaidCode}
        onChange={(e) => setMermaidCode(e.target.value)}
        placeholder="graph TD
    A[Start] --> B[End]"
        spellCheck="false"
      />

      <div className="converter-actions">
        <button className="btn-secondary" onClick={handleClear}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
          Clear
        </button>
        <button 
          className={`btn-convert ${isConverting ? 'converting' : ''}`}
          onClick={handleConvert} 
          disabled={isConverting || !excalidrawAPI || !mermaidCode.trim()}
        >
          {isConverting ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
              </svg>
              Converting
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              Convert
            </>
          )}
        </button>
      </div>
    </>
  )
}
