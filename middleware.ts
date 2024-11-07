// Middleware used to simply set the base URL and pathname in the request headers
import { NextResponse } from "next/server";

export function middleware(request: Request) {
  const requestHeaders = new Headers(request.headers);
  const baseURL = new URL(request.url).origin;
  const pathname = new URL(request.url).pathname;
  requestHeaders.set("x-base-url", baseURL);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}