import React from 'react';
import { Link } from 'react-router-dom';


const Header = () => {
  return (
  <>
    <header className="gy-3">
      <nav className="navbar navbar-expand-lg navbar-light fixed-top py-3 backdrop" data-navbar-on-scroll="data-navbar-on-scroll">
        <div className="container">
          <h1 className="navbar-brand d-flex align-items-center fw-bolder fs-2 fst-italic">
          <Link aria-current="page" to="/"><img src="/assets/images/lo.webp" alt="Database" className="img-fluid w-15"/></Link></h1>
          <button className="navbar-toggler collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation"><span className="navbar-toggler-icon"></span></button>
          <div className="collapse navbar-collapse border-top border-lg-0 mt-4 mt-lg-0" id="navbarSupportedContent">
            <ul className="navbar-nav ms-auto pt-2 pt-lg-0">
              <li className="nav-item px-2"><Link className="nav-link fw-medium" aria-current="page" to="/" rel="noopener noreferrer" target="_blank">Home</Link></li>
              <li className="nav-item px-2"><Link className="nav-link fw-medium" to="/about/">About</Link></li>
              <li className="nav-item px-2"><Link className="nav-link fw-medium" to="/help/">Help</Link></li>
              <li className="nav-item px-2"><Link className="nav-link fw-medium" to="/faq/">FAQs</Link></li>
              <li className="nav-item px-2"><Link className="nav-link fw-medium" to="https://bioinfolab.sns.it/" target="_blank" rel="noopener noreferrer">Bioinfolab</Link></li>
              <li className="nav-item px-2"><Link className="nav-link fw-medium" to="http://laboratoriobiologia.sns.it/" target="_blank" rel="noopener noreferrer">Bio@SNS</Link></li>
              <li className="nav-item px-2"><Link className="nav-link fw-medium" to="https://github.com/raimondilab/CellHit" target="_blank" rel="noopener noreferrer"><ion-icon name="logo-github"></ion-icon></Link></li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
   </>
  );
}

export default Header;
