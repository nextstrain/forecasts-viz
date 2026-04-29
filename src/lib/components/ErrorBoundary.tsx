import React from 'react';
import {ErrorMessage} from "./ErrorMessage.tsx";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  errorCaught: Error | false;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { errorCaught: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { errorCaught: error };
  }
  override render() {
    if (this.state.errorCaught) {
      return (
        <ErrorMessage error={this.state.errorCaught}/>
      )
    }
    return this.props.children;
  }
}