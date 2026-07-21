import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ProjectErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ProjectErrorBoundary] Caught an error in widget:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center shadow-sm space-y-3 font-sans w-full">
          <div className="mx-auto w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-800">Something went wrong</h4>
            <p className="text-xs text-slate-500 mt-1">This section failed to load. You can try reloading it.</p>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="text-[10px] text-red-700 bg-red-100/50 p-3 rounded-lg overflow-x-auto text-left max-h-40">
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <RefreshCw size={12} className="animate-spin-slow" /> Reload Section
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
