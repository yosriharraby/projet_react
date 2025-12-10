export { default as middleware } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/onboarding", 
    "/patients/:path*", 
    "/services/:path*", 
    "/appointments/:path*", 
    "/consultations/:path*", 
    "/portal/:path*", 
    "/admin/:path*", 
    "/doctor/:path*", 
    "/receptionist/:path*"
  ],
};


