import React from 'react';

const Footer = () => {
  return (
    <>
      <footer className="footer bg-primary d-flex justify-content-center align-items-center vh-10">
        <div className="container text-center d-flex flex-column justify-content-center">
          <p className="fs--1 fw-bold text-200 mb-1 mt-2">
            Disclaimer: This resource is intended for research purposes and it must not substitute a doctor's medical judgement or healthcare professional advice
          </p>
          <p className="fs--1 fw-bold text-200 mb-1">
            All rights Reserved &copy; Bioinformatics group of the BIO@SNS, Scuola Normale Superiore, Pisa (Italy) - 2024
          </p>
        </div>
      </footer>
    </>
  );
};

export default Footer;
