import { NextRequest, NextResponse } from 'next/server';

const botUserAgents = [
  'facebookexternalhit',
  'WhatsApp',
  'Twitterbot',
  'Slackbot',
  'LinkedInBot',
  'TelegramBot',
  'Discordbot',
  'Googlebot',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const userAgent = req.headers.get('user-agent') || '';

  const isBot = botUserAgents.some(bot => userAgent.includes(bot));
  const match = pathname.match(/^\/tracking\/([^\/]+)$/);

  if (match && isBot) {
    const id = match[1];
    const title = 'Seu pedido está em andamento!';
    const description = 'Acompanhe em tempo real o andamento do seu projeto.';
    const image = 'https://app.useoffi.com/imagens/tracking-og.png';
    const url = `https://app.useoffi.com/tracking/${id}`;

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:url" content="${url}" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${description}" />
        <meta name="twitter:image" content="${image}" />
        <title>${title}</title>
      </head>
      <body>
        <p>Redirecionando...</p>
        <script>window.location.href = "${url}"</script>
      </body>
      </html>
    `,
      {
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  }

  return NextResponse.next();
}
