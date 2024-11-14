// This middleware adds the base URL and current pathname to the request headers and redirects to the homepage if the URL is "/game" or "/search"
import { NextResponse } from "next/server";

export function middleware(request: Request) {
  const requestHeaders = new Headers(request.headers);
  const baseURL = new URL(request.url).origin;
  const pathname = new URL(request.url).pathname;

  // Set the base URL and pathname in the request headers
  requestHeaders.set("x-base-url", baseURL);
  requestHeaders.set("x-pathname", pathname);

  // Redirect to the home page if the URL is "/game" or "/search"
  const redirectUrls = ['/game', '/search']
  if (redirectUrls.some(url => pathname === url)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}