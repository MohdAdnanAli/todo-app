import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console for debugging
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
          <div 
            className="max-w-md w-full p-8 rounded-2xl text-center"
            style={{ 
              background: 'var(--bg-secondary)', 
              boxShadow: 'var(--shadow)' 
            }}
          >
            <div className="mb-6">
              <div 
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                style={{ background: 'var(--bg-tertiary)' }}
              >
                <AlertTriangle 
                  size={32} 
                  className="text-yellow-500"
                />
              </div>
            </div>

            <h1 
              className="text-xl font-semibold mb-3"
              style={{ color: 'var(--text-primary)' }}
            >
              Something went wrong
            </h1>

            <p 
              className="text-sm mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              An unexpected error occurred. Please try refreshing the page or go back to the home screen.
            </p>

            {/* Error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <div 
                className="text-left text-xs p-3 rounded-lg mb-6 overflow-auto max-h-32"
                style={{ 
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-muted)'
                }}
              >
                <p className="font-mono break-words">
                  {this.state.error.name}: {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm
                  bg-gradient-to-r from-indigo-500 to-purple-500 text-white
                  shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                style={{ boxShadow: 'var(--glow)' }}
              >
                <RefreshCw size={16} />
                Try Again
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm
                  bg-gradient-to-r from-cyan-500 to-blue-500 text-white
                  shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                style={{ boxShadow: 'var(--glow)' }}
              >
                <Home size={16} />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

