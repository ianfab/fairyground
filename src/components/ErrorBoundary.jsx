import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong with the chess board.</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
            <summary>Error details</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo.componentStack}
          </details>
          <button 
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null })
              // Try to reset to chess variant
              if (this.props.onReset) {
                this.props.onReset()
              }
            }}
            style={{ marginTop: '10px', padding: '5px 10px' }}
          >
            Reset Board
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
