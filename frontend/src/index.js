import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

import 'primeicons/primeicons.css';
import "primereact/resources/themes/lara-light-cyan/theme.css";

import "./index.css"

// Import Pages
import HomePage from './pages/HomePage/HomePage'
import Under from './pages/UnderPage/Under'
import ErrorPage from './pages/ErrorPage/ErrorPage'
import ResultPage from './pages/ResultPage/ResultPage'


const router = createBrowserRouter([ {
      path: "/",
      element: (
      <ErrorBoundary>
        <HomePage />
      </ErrorBoundary>
      ),
      errorElement: <ErrorPage error={"Sorry for the inconvenience, we're working on it!"}/>
    },
    {
      path: "/under/",
      element: <Under/>,
    },
    {
      path: "/explore/",
      element: (
      <ErrorBoundary>
        <ResultPage />
      </ErrorBoundary>
      )
    },
    {
      path: "*",
      element: <ErrorPage error={"Page not found. This page doesn't exist!"}/>
    },
  ],
 );

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <RouterProvider router={router} />
  </ErrorBoundary>
);
