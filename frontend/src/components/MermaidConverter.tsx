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
      <div className="social-links">
        <a href="https://github.com/vdutts7/mermaid-excali" target="_blank" rel="noopener noreferrer" className="social-link">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </a>
        <a href="https://x.com/vdutts7" target="_blank" rel="noopener noreferrer" className="social-link">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          @vdutts7
        </a>
      </div>

      <textarea
        className="mermaid-input"
        value={mermaidCode}
        onChange={(e) => setMermaidCode(e.target.value)}
        placeholder="graph TD
    A[Start] --> B[End]"
        spellCheck="false"
      />

      <div className="converter-actions">
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
        <button className="btn-secondary" onClick={handleClear}>
          Clear
        </button>
      </div>
    </>
  )
}
