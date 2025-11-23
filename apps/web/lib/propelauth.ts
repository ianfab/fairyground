import { getPropelAuthApis } from "@propelauth/nextjs/server";

// getPropelAuthApis automatically reads from environment variables:
// - PROPELAUTH_AUTH_URL or NEXT_PUBLIC_AUTH_URL
// - PROPELAUTH_API_KEY
// - PROPELAUTH_VERIFIER_KEY
const propelauth = getPropelAuthApis();

export default propelauth;

