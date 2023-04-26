import { NextRequest, NextResponse } from "next/server";
import { hash2 } from "./utils/Utils";
import { basicAuthDisabled } from "@/utils/Config";

export const config = {
  matcher: ["/enter"],
};

// https://github.com/vercel/examples/blob/main/edge-functions/basic-auth-password/middleware.ts
export function middleware(req: NextRequest) {
  if (basicAuthDisabled) {
    return NextResponse.next();
  }

  const basicAuth = req.headers.get("authorization");
  const url = req.nextUrl;

  if (basicAuth) {
    const authValue = basicAuth.split(" ")[1];
    const [user, pwd] = atob(authValue).split(":");

    // clear in chrome://settings/passwords
    // use https://codesandbox.io/s/hasher-vcjwju to generate hash
    if (hash2(user) === -877169473 && hash2(pwd) === -458352693) {
      return NextResponse.next();
    }
  }

  url.pathname = "/api/auth";

  return NextResponse.rewrite(url);
}
