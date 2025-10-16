import { NextRequest, NextResponse } from "next/server"
import { elements } from "@/src/types"

// GET /api/health - Health check endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    elements_count: elements.size,
  })
}

