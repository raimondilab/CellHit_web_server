import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Container, Nav } from 'react-bootstrap';


const Header = () => {
  return (
    <header className="gy-3">
      <Navbar  expand="lg" fixed="top" className="py-3 backdrop" onScroll="data-navbar-on-scroll">
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center fw-bolder fs-2 fst-italic">
            CellHit
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/" target="_blank">Home</Nav.Link>
              <Nav.Link as={Link} to="/under/">About</Nav.Link>
              <Nav.Link as={Link} to="/under/">Help</Nav.Link>
              <Nav.Link as={Link} to="/under/">FAQs</Nav.Link>
              <Nav.Link href="https://bioinfolab.sns.it/" target="_blank">Bioinfolab</Nav.Link>
              <Nav.Link href="http://laboratoriobiologia.sns.it/" target="_blank">Bio@SNS</Nav.Link>
              <Nav.Link href="https://github.com/raimondilab/" target="_blank">
                <ion-icon name="logo-github"></ion-icon>
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
}

export default Header;
