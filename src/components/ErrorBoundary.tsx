/* eslint-disable react/jsx-props-no-spreading */
import { Component, ReactNode } from "react";

import ErrorInfo from "./popups/ErrorInfo";

interface ErrorState {
  error: any;
  errorInfo: any;
}

export default class ErrorBoundary extends Component<any, ErrorState> {
  constructor(props: any) {
    super(props);
    this.state = { error: null, errorInfo: null } as ErrorState;
  }

  componentDidCatch(error: any, errorInfo: any): void {
    // Catch errors in any components below and re-render with error message
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    // You can also log error messages to an error reporting service here
  }

  closeErrorDialog = (): void => {
    setTimeout(() => {
      this.setState({
        error: null,
        errorInfo: null,
      });
    }, 350);
  };

  render(): ReactNode {
    const { children } = this.props;
    const { errorInfo } = this.state;
    return (
      <>
        {errorInfo ? (
          <ErrorInfo {...this.state} closeCallback={this.closeErrorDialog} />
        ) : (
          children
        )}
      </>
    );
  }
}
