import { getRouteHandlers } from "@propelauth/nextjs/server/app-router";
import { NextRequest } from "next/server";

// postLoginRedirectPathFn is optional - it redirects users after successful login
const routeHandlers = getRouteHandlers({
  postLoginRedirectPathFn: (req: NextRequest) => {
    // Redirect to homepage after login
    return "/";
  }
});

// Wrap handlers to handle Next.js 15 async params
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const params = await context.params;
  return routeHandlers.getRouteHandler(req, { params });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const params = await context.params;
  return routeHandlers.postRouteHandler(req, { params });
}

