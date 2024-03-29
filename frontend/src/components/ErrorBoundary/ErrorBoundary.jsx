import React, { Component } from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { Helmet } from 'react-helmet';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }


  resetErrorState = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

     resetErrorStateAndNavigateHome = () => {
      this.resetErrorState(); // Reset the error state
      this.props.navigate('/'); // Use navigate function to navigate home
    };


  // Use this lifecycle method to update state so the next render will show the fallback UI.
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  // Use this to log error messages
  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.log(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
      <>
    <Helmet>
        <title>CellHit | Error</title>
      </Helmet>
      <Header/>
        <section className="py-0">
    <div className="bg-holder d-sm-block img-fluid bg" id="back"
          style={{ backgroundImage: 'url(/assets/images/cell.webp)'}}>
    </div>
    <div className="container">
        <div className="row align-items-center min-vh-100 min-vh-md-100 vh-sm-100 vh-100">
            <div className="col-sm-12 text-sm-start text-center">
                <h1 className="fw-light font-base fs-6 fs-xxl-7">Oops...</h1>
                <h2 className="fw-light font-base fs-6 fs-xxl-7">An <strong>error</strong> has occurred</h2>
                <p className="fs-1 mb-5">
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                       I'm sorry, but the action you're attempting to perform is not allowed.
                       <br/>Please return to the Home page.
                    </details></p>
                     <button onClick={this.resetErrorStateAndNavigateHome} className="btn btn-primary mb-1 btn-form">
                      Go Home
                    </button>
            </div>
        </div>
    </div>
</section>
    <Footer/>
    </>
      );
    }

    // If there's no error, render children components
    return this.props.children;
  }
}

export default ErrorBoundary;
