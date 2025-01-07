import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import ErrorBoundaryWrapper from './components/ErrorBoundaryWrapper/ErrorBoundaryWrapper';

import 'primeicons/primeicons.css';
import "primereact/resources/themes/lara-light-cyan/theme.css";

import "./index.css"

// Import Pages
import HomePage from './pages/HomePage/HomePage'
import Under from './pages/UnderPage/Under'
import ErrorPage from './pages/ErrorPage/ErrorPage'
import ResultPage from './pages/ResultPage/ResultPage'
import ResultPageAnalysis from './pages/ResultPageAnalysis/ResultPageAnalysis'
import RunCellHit from './pages/RunCellHit/RunCellHit'
import AboutPage from './pages/AboutPage/AboutPage'
import HelpPage from './pages/HelpPage/HelpPage'
import FaqPage from './pages/FaqPage/FaqPage'

const router = createBrowserRouter([ {
      path: "/",
      element: (
        <HomePage />
      ),
      errorElement: <ErrorPage error={"Sorry for the inconvenience, we're working on it!"}/>
    },
    {
      path: "/under/",
      element: <Under/>,
    },
    {
      path: "/about/",
      element: <AboutPage/>,
    },
    {
      path: "/help/",
      element: <HelpPage/>,
    },
    {
      path: "/faq/",
      element: <FaqPage/>,
    },
    {
      path: "/explore/",
      element: (
      <ErrorBoundaryWrapper>
        <ResultPage />
      </ErrorBoundaryWrapper>
      )
    },
    {
      path: "/analysis/",
      element: (
      <ErrorBoundaryWrapper>
        <RunCellHit />
      </ErrorBoundaryWrapper>
      )
    },
    {
      path: "/result/",
      element: (
      <ErrorBoundaryWrapper>
        <ResultPageAnalysis />
      </ErrorBoundaryWrapper>
      )
    },
    {
      path: "*",
      element: <ErrorPage error={"Page not found. This page doesn't exist!"}/>
    },
  ],
 );

createRoot(document.getElementById("root")).render(
    <RouterProvider router={router} />
);
