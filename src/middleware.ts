import { NextRequest, NextResponse } from 'next/server';

export const config = {
  // 認証をかけたいパスを指定
  // matcher: ['/admin/:path*', '/api/generate'],
    matcher: '/:path*'
};

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    // Base64デコード (user:password)
    const [user, pwd] = atob(authValue).split(':');

    if (
      user === process.env.BASIC_AUTH_USER &&
      pwd === process.env.BASIC_AUTH_PASSWORD
    ) {
      return NextResponse.next();
    }
  }

  // 認証失敗時、または未入力時は 401 を返してブラウザにログインダイアログを出させる
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}