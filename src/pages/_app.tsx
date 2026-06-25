import type { AppProps } from 'next/app'
import '@/styles/globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Header />
      <main style={{ flex: 1 }}>
        <Component {...pageProps} />
      </main>
      <Footer />
    </ErrorBoundary>
  )
}