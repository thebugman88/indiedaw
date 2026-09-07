import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-neutral-100 flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Something went wrong</h2>
              <p className="text-xs text-zinc-400">
                The application caught an unexpected error. Your saved sessions in local storage
                are preserved.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-black/60 rounded-lg p-3 text-left border border-zinc-800/80 overflow-x-auto">
                <p className="text-[11px] font-mono text-red-400 font-semibold break-all">
                  {this.state.error.message || 'Unknown runtime error'}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-white text-black font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Studio</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
