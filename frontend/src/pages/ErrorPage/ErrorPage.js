import React, { useState, useEffect} from 'react';
import { useRouteError } from "react-router-dom";
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

const ErrorPage = ({error}) => {

  const errorRoute = useRouteError();
  const [messageError, setMessageError] = useState(error);

useEffect(() => {
    if (errorRoute){
     setMessageError(errorRoute.status);
  }
}, [errorRoute]);

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
            <div className="col-sm-12 text-sm-start text-center bg-white">
                <h1 className="fw-light font-base fs-6 fs-xxl-7">Oops...</h1>
                <h2 className="fw-light font-base fs-6 fs-xxl-7">An <strong>error</strong> has occurred</h2>
                <p className="fs-1 mb-5">{ error }</p>
                <Link to="/" className="btn btn-primary mb-1 btn-form">
                  Go Home
                </Link>
            </div>
        </div>
    </div>
</section>

    <Footer/>
   	</>
   )
}

export default ErrorPage