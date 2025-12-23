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
              min-height: 100dvh;
            }
            .main-container {
              min-height: 100dvh;
              padding: 16px;
              overflow-y: auto;
            }
            .inner-container {
              display: flex;
              flex-direction: column;
              padding-top: 8px !important;
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
            }
            .card-left {
              height: 280px;
              min-height: 280px;
              flex: none !important;
            }
            .card-right {
              height: 400px;
              min-height: 400px;
              max-height: 400px;
              flex: none !important;
            }
            .card-right > div:last-child {
              flex: 1 !important;
              min-height: 0 !important;
              overflow: hidden !important;
              display: flex !important;
              flex-direction: column !important;
            }
            .card-right form {
              position: sticky;
              bottom: 0;
              background: white;
            }
            .about-section {
              margin-top: 32px !important;
              margin-bottom: 24px !important;
            }
            .about-section > div:first-child {
              flex-direction: column !important;
              gap: 8px !important;
            }
            .about-section svg {
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
