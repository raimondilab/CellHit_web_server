import React, { useState } from "react";
import { Helmet } from 'react-helmet';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import {useNavigate} from "react-router-dom";
import { Container, Row, Col, Form } from 'react-bootstrap';
import { Button } from 'primereact/button';
import { Heading, Box, Text, Image, VStack, HStack, Divider } from '@chakra-ui/react';

const HomePage = () => {

const navigate = useNavigate();
const [loading, setLoading] = useState(false);

const load = () => {
        setLoading(true);

        setTimeout(() => {
            setLoading(false);
            navigate("/explore/", { state: {'source': 'home'}});
        }, 2000);
};

  return (
    <>
      <Helmet>
        <title>CellHit | Home</title>
      </Helmet>
      <Header />
    <section class="py-0" id="home">
    <div class="container">
        <div class="row align-items-center min-vh-100 min-vh-md-100 vh-sm-100 vh-100">
            <div class="col-sm-6 col-md-6 col-lg-6 text-sm-start text-center">
                <h1 class="display-2 fw-semi-bold lh-sm fs-4 fs-lg-6 fs-xxl-8">Discover CellHit</h1>
                <p class="mb-4 fs-1 fs-lg-1 fs-xxl-2">
                    Cell line response prediction model to
                    small molecule perturbation
                </p>
                 <Button  className="btn-home  shadow-none" label="Explore now" loading={loading} onClick={load} />
                <div class="row align-items-center row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4 py-5 hide-mobile">
                    <div class="col d-flex align-items-start vertical_line">
                        <div>
                            <h4 class="fw-bold mb-0"> 45 </h4>
                            <p>Cell Lines</p>
                        </div>
                    </div>
                    <div class="col d-flex align-items-start vertical_line">
                        <div>
                            <h4 class="fw-bold mb-0">37</h4>
                            <p>Cancer Types</p>
                        </div>
                    </div>
                    <div class="col d-flex align-items-start vertical_line">
                        <div>
                            <h4 class="fw-bold mb-0">1024</h4>
                            <p>FDA-approved drugs</p>
                        </div>
                    </div>
                    <div class="col d-flex align-items-start vertical_line">
                        <div>
                            <h4 class="fw-bold mb-0">794</h4>
                            <p>Genes</p>
                        </div>
                    </div>
                </div>
            </div>
             <div class="col-sm-6 col-md-6 col-lg-6 text-sm-start text-center">
               <img src="/assets/images/bg.png" alt="Database" className="img-fluid"/>
             </div>
        </div>
    </div>
</section>
      <Footer/>
    </>
  );
};

export default HomePage;

