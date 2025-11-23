import { getRouteHandlers, getPropelAuthApis } from "@propelauth/nextjs/server";

const propelauth = getPropelAuthApis({
  authUrl: process.env.NEXT_PUBLIC_AUTH_URL!,
  apiKey: process.env.PROPELAUTH_API_KEY!,
  verifierKey: process.env.PROPELAUTH_VERIFIER_KEY!,
});

export default propelauth;

