import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const Footer = () => {
  return (
    <footer className="bg-primary mb-0">
      <Container>
        <Row className="justify-content-md-between justify-content-evenly py-1">
          <Col xs={12} sm={8} md={6} lg="auto" className="text-center text-md-start">
            <p className="fs--1 my-2 fw-bold text-200">
              All rights Reserved &copy; Bioinformatics group of the BIO@SNS, Scuola Normale Superiore, Pisa (Italy) - 2024
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default Footer;
