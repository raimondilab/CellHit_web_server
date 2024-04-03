import React from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { Helmet } from 'react-helmet';

const Under = () => {
   return (
    <>
    <Helmet>
        <title>CellHit | Under</title>
      </Helmet>
      <Header/>
      <section className="py-0">
    <div className="bg-holder d-sm-block img-fluid bg hide-mobile" id="back"
          style={{ backgroundImage: 'url(/assets/images/cell.webp)'}}>
    </div>
    <div className="container">
        <div className="row align-items-center min-vh-100">
            <div className="col-sm-12 text-sm-start text-center">
                <h1 className="fw-light font-base fs-6 fs-xxl-7">Under<strong> construction </strong></h1>
                <p className="fs-1 mb-5">Page is under construction <br />
               Coming soon</p>
            </div>
        </div>
        <div className="col-sm-1 col-md-3 col-lg-3 shrink hide-mobile"></div>
    </div>
</section>

    <Footer/>
   	</>
   )
}

export default Under