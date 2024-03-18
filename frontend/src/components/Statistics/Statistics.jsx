import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Statistics = () => {
  return (
    <Container className="my-4 text-center">
      <Row>
        <Col>
          <div className="statistic-item">
            <h2>1249</h2>
            <p>Cell Lines</p>
          </div>
        </Col>
        <Col>
          <div className="statistic-item">
            <h2>37</h2>
            <p>Cancer Types</p>
          </div>
        </Col>
        <Col>
          <div className="statistic-item">
            <h2>1024</h2>
            <p>FDA-approved drugs</p>
          </div>
        </Col>
        <Col>
          <div className="statistic-item">
            <h2>794</h2>
            <p>Genes</p>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Statistics;
