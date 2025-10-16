import { NextRequest, NextResponse } from "next/server"
import { elements } from "@/src/types"

// GET /api/elements/search - Query elements with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")
    
    let results = Array.from(elements.values())

    // Filter by type if specified
    if (type) {
      results = results.filter((element) => element.type === type)
    }

    // Apply additional filters
    const filters: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      if (key !== "type") {
        filters[key] = value
      }
    })

    if (Object.keys(filters).length > 0) {
      results = results.filter((element) => {
        return Object.entries(filters).every(([key, value]) => {
          return (element as any)[key] === value
        })
      })
    }

    return NextResponse.json({
      success: true,
      elements: results,
      count: results.length,
    })
  } catch (error) {
    console.error("Error querying elements:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    )
  }
}

