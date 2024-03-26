import React from 'react';
import { Link } from 'react-router-dom';


const Header = () => {
  return (
  <>
    <header className="gy-3">
      <nav className="navbar navbar-expand-lg navbar-light fixed-top py-3 backdrop" data-navbar-on-scroll="data-navbar-on-scroll">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center fw-bolder fs-2 fst-italic" to="/">
              <img src="/assets/images/logo.png" alt="CellHit" className="img-fluid w-15"/>
        </Link>
          <button className="navbar-toggler collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation"><span className="navbar-toggler-icon"></span></button>
          <div className="collapse navbar-collapse border-top border-lg-0 mt-4 mt-lg-0" id="navbarSupportedContent">
            <ul className="navbar-nav ms-auto pt-2 pt-lg-0">
              <li className="nav-item px-2"><Link className="nav-link fw-medium" aria-current="page" to="/" target="_blank">Home</Link></li>
              <li className="nav-item px-2"><Link className="nav-link fw-medium" to="/under/">About</Link></li>
              <li className="nav-item px-2"><Link className="nav-link fw-medium" to="/under/">Help</Link></li>
              <li className="nav-item px-2"><Link className="nav-link fw-medium" to="/under/">FAQs</Link></li>
              <li className="nav-item px-2"><Link className="nav-link fw-medium" to="https://bioinfolab.sns.it/" target="_blank">Bioinfolab</Link></li>
              <li className="nav-item px-2"><Link className="nav-link fw-medium" to="http://laboratoriobiologia.sns.it/" target="_blank">Bio@SNS</Link></li>
              <li className="nav-item px-2"><Link className="nav-link fw-medium" to="https://github.com/raimondilab/" target="_blank"><ion-icon name="logo-github"></ion-icon></Link></li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
   </>
  );
}

export default Header;
