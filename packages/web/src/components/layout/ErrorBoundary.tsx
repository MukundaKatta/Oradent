"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { ptBR } from "@/i18n";
import { localizeErrorMessage } from "@/lib/errorMessages";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[300px] items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900">
              {ptBR.shell.errorBoundary.title}
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              {localizeErrorMessage(this.state.error?.message, ptBR.shell.errorBoundary.unexpectedError)}
            </p>
            <button
              onClick={this.handleRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              {ptBR.shell.errorBoundary.retry}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
