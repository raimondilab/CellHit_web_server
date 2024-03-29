import React from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';

function ErrorBoundaryWrapper(props) {
  const navigate = useNavigate();

  return <ErrorBoundary navigate={navigate} {...props} />;
}

export default ErrorBoundaryWrapper;
