import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTab?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('VisionInspect Uncaught Error in Component:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.fallbackTab) {
      this.props.fallbackTab();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-2xl border border-rose-500/40 bg-slate-900/95 p-8 text-center shadow-2xl backdrop-blur-xl space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Module Encountered an Unexpected Issue
              </h2>
              <p className="text-xs text-slate-400">
                The visual inspector recovered cleanly without crashing your session.
              </p>
              {this.state.error && (
                <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-rose-300/90 text-left overflow-x-auto max-h-32">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>

              <button
                onClick={() => {
                  this.handleReset();
                  if (typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-all"
              >
                <LayoutDashboard className="h-4 w-4 text-cyan-400" />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
