import React from 'react'

interface State { hasError: boolean; message: string }
interface Props { children: React.ReactNode }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', backgroundColor: 'var(--bg)',
          color: 'var(--text)', fontFamily: 'Hanken Grotesk, sans-serif',
          padding: 32,
        }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 24 }}>
              {this.state.message || 'An unexpected error occurred.'}
            </p>
            <a href="/" style={{
              display: 'inline-block', padding: '10px 24px',
              backgroundColor: 'var(--accent)', color: '#fff',
              borderRadius: 8, fontSize: 14, textDecoration: 'none',
            }}>
              Back to home
            </a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}