import { getRouteHandlers } from "@propelauth/nextjs/server/app-router";
import { NextRequest } from "next/server";

// postLoginRedirectPathFn is optional - it redirects users after successful login
const routeHandlers = getRouteHandlers({
  postLoginRedirectPathFn: (req: NextRequest) => {
    // Redirect to homepage after login
    return "/";
  }
});

export const GET = routeHandlers.getRouteHandler;
export const POST = routeHandlers.postRouteHandler;

