import React from 'react';
import ErrorPage from '../../pages/ErrorPage/ErrorPage'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ hasError: true });
    console.error('Error caught by error boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage error={"Please visit our homepage to discover our results"} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
