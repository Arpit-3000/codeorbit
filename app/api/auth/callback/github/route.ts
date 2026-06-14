import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Build the callback page URL with the parameters
  const callbackPageUrl = new URL('/auth/github/callback', request.url);
  
  if (error) {
    callbackPageUrl.searchParams.set('error', error);
    if (errorDescription) {
      callbackPageUrl.searchParams.set('error_description', errorDescription);
    }
  } else if (code) {
    callbackPageUrl.searchParams.set('code', code);
  }

  // Redirect to the callback page that will handle the OAuth flow
  return NextResponse.redirect(callbackPageUrl);
}
