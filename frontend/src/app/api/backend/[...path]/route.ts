import { NextRequest } from "next/server"
import { proxyHandler } from "@/lib/server/auth-route-handlers"

async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const { path } = await context.params
  return proxyHandler(req, path)
}

export { handler as GET, handler as POST, handler as PATCH, handler as PUT, handler as DELETE }
