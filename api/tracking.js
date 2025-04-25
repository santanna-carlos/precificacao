export const config = {
    runtime: 'edge',
    regions: ['gru1'] // opcional: você pode usar a região mais próxima dos seus usuários (gru1 = São Paulo)
  }
  
  export default async function handler(request) {
    const { pathname } = new URL(request.url)
    const userAgent = request.headers.get('user-agent') || ''
  
    const isBot = /bot|facebook|whatsapp|twitter|linkedin|slack|telegram|discord/i.test(userAgent)
    const isTracking = /^\/tracking\/[a-z0-9\-]{36}$/i.test(pathname)
  
    if (isTracking && isBot) {
      const fullUrl = request.url
      return new Response(
        `
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8" />
            <title>Rastreamento de Projeto | Offi</title>
            <meta property="og:title" content="Acompanhe seu projeto com a Offi" />
            <meta property="og:description" content="Veja o andamento da produção do seu móvel planejado." />
            <meta property="og:image" content="https://app.useoffi.com/imagens/tracking-og.png" />
            <meta property="og:url" content="${fullUrl}" />
            <meta name="twitter:card" content="summary_large_image" />
          </head>
          <body>
            <p>Redirecionando para o rastreamento...</p>
            <script>
              window.location.href = "${fullUrl}";
            </script>
          </body>
        </html>
        `,
        {
          headers: {
            'Content-Type': 'text/html',
          },
        }
      )
    }
  
    // Se não for bot ou não for rota de tracking, continua normalmente
    return fetch(request)
  }
  
