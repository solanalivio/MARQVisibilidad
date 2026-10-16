import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function proxyRequest(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const apiBase = (process.env.API_INTERNAL_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
  const targetPath = path.join('/');
  const search = req.nextUrl.search || '';
  const targetUrl = `${apiBase}/api/${targetPath}${search}`;

  const headers = new Headers();
  const forwardHeaders = [
    'cookie',
    'x-csrf-token',
    'content-type',
    'authorization',
    'accept',
    'user-agent',
    'x-forwarded-for',
  ];

  for (const key of forwardHeaders) {
    const val = req.headers.get(key);
    if (val) headers.set(key, val);
  }

  const method = req.method.toUpperCase();
  const hasBody = !['GET', 'HEAD'].includes(method);
  const body = hasBody ? await req.arrayBuffer() : undefined;

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      redirect: 'manual',
      cache: 'no-store',
    });

    const responseHeaders = new Headers();
    const contentType = upstream.headers.get('content-type');
    if (contentType) {
      responseHeaders.set('content-type', contentType);
    }

    const setCookies =
      typeof (upstream.headers as any).getSetCookie === 'function'
        ? (upstream.headers as any).getSetCookie()
        : upstream.headers.get('set-cookie')
        ? [upstream.headers.get('set-cookie')!]
        : [];

    for (const cookie of setCookies) {
      responseHeaders.append('set-cookie', cookie);
    }

    if (upstream.status === 204) {
      return new NextResponse(null, { status: 204, headers: responseHeaders });
    }

    const data = await upstream.arrayBuffer();
    return new NextResponse(data, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        statusCode: 502,
        message: 'No se pudo conectar con el servidor de API',
        error: error?.message || 'Bad Gateway',
      },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, context);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, context);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, context);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, context);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, context);
}
