import type { AppProps } from 'next/app'
import '@/styles/globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flex: 1 }}>
          <Component {...pageProps} />
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  )
}