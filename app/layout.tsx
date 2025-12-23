export const metadata = {
  title: 'Michelin Restaurant Agent',
  description: 'Michelin restaurant reservations powered by Llama 1B',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <style>{`
          * {
            box-sizing: border-box;
          }
          html, body {
            min-height: 100%;
            margin: 0;
            padding: 0;
          }
          .cards-container {
            display: flex;
            gap: 24px;
          }
          .card-left {
            flex: 1.2;
            height: 520px;
          }
          .card-right {
            flex: 0.8;
            height: 520px;
          }
          .main-container {
            min-height: 100vh;
            padding: 24px 24px 48px;
          }
          .main-title {
            font-size: 28px;
          }
          @media (max-width: 768px) {
            html, body {
              height: 100dvh;
              max-height: 100dvh;
            }
            .main-container {
              height: 100dvh;
              max-height: 100dvh;
              min-height: auto;
              padding: 16px;
              overflow: hidden;
            }
            .inner-container {
              height: 100%;
              display: flex;
              flex-direction: column;
            }
            .main-title {
              font-size: 18px;
              margin: 0 0 4px 0 !important;
            }
            .main-subtitle {
              font-size: 11px !important;
              margin: 0 0 10px 0 !important;
            }
            .cards-container {
              flex-direction: column;
              gap: 12px;
              flex: 1;
              min-height: 0;
              overflow: hidden;
            }
            .card-left {
              flex: 1;
              height: auto;
              min-height: 0;
            }
            .card-right {
              flex: 1;
              height: auto;
              min-height: 0;
              overflow: hidden;
            }
            .about-section {
              display: none;
            }
          }
        `}</style>
      </head>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
