import React from 'react';
import {ErrorMessage} from "./ErrorMessage";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { errorCaught: false };
  }
  static getDerivedStateFromError(error) {
    return { errorCaught: error };
  }
  render() {
    if (this.state.errorCaught) {
      return (
        <ErrorMessage error={this.state.errorCaught}/>
      )
    }
    return this.props.children; 
  }
}