import React, { useState } from "react";
import { Helmet } from 'react-helmet';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { Container, Row, Col, Form } from 'react-bootstrap';
import { Button } from 'primereact/button';
import { Heading, Box, Text, Image, VStack, HStack, Divider } from '@chakra-ui/react';

const HomePage = () => {

const [loading, setLoading] = useState(false);

const load = () => {
        setLoading(true);

        setTimeout(() => {
            setLoading(false);
        }, 2000);
};

  return (
    <>
      <Helmet>
        <title>CellHit | Home</title>
      </Helmet>
      <Header />
      <div className="d-flex flex-column flex-grow-1">
        <Container className="my-auto">
          <Row className="justify-content-md-center align-items-center" style={{ minHeight: '97vh' }}>
            <Col xs={12} md={6}>
             <Box maxW='32rem'>
              <Heading  as='h1' size='4xl' noOfLines={1} mb={4}>Discover CellHit</Heading>
              <Text fontSize='xl'>
               Cell line response prediction model to small molecule perturbation
              </Text>
              <Button label="Explore now"  loading={loading} onClick={load} />
            </Box>
            <div class="row align-items-center row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4 py-5 hide-mobile">
                    <div class="col d-flex align-items-start vertical_line">
                        <div>
                            <h4 class="fw-bold mb-0"> 1249 </h4>
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
            </Col>
            <Col xs={12} md={6}>
              <img src="/assets/images/bg.png" alt="Web server logo" className="img-fluid" />
            </Col>
          </Row>
        </Container>
      </div>
      <Footer />
    </>
  );
};

export default HomePage;

