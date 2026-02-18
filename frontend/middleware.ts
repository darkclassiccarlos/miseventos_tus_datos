import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const tokenCookie = request.cookies.get('auth-token');
    const tokenValue = tokenCookie?.value;

    // Define public and private routes
    const isPublicRoute = pathname === '/login' || pathname === '/register';
    const isProtectedRoute = pathname.startsWith('/admin') || pathname.startsWith('/events');

    // If it's a protected route and there's no valid token, redirect to login
    if (isProtectedRoute && !tokenValue) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If it's a public route and user is ALREADY authenticated, redirect to home
    if (isPublicRoute && tokenValue) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/events/:path*', '/login', '/register'],
};
