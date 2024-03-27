import React, { useState } from "react";
import { Helmet } from 'react-helmet';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import {useNavigate} from "react-router-dom";
import { Container, Row, Col, Form } from 'react-bootstrap';
import { Button } from 'primereact/button';
import { Heading, Box, Text, Image, VStack, HStack, Divider } from '@chakra-ui/react';
import axios from 'axios';
import Swal from 'sweetalert2';

const HomePage = () => {

const navigate = useNavigate();
const [loading, setLoading] = useState(false);

// Function to send form data to the API
async function sendExploreData() {
        try {

        const query = {
              query: `
               query getData{
                    databases {
                      __typename
                       ... on Gdsc {
                        drugName
                      drugId
                      source
                      sampleIndex
                      predictions
                      predictionsStd
                      quantileScore
                      experimentalMin
                      experimentalMedian
                      experimentalMax
                      modelMse
                      modelCorr
                      transcrCcleNeigh
                      transcrCcleNeighCelllinename
                      transcrCcleNeighOncotree
                      responseCcleNeigh
                      responseCcleNeighCelllinename
                      responseCcleNeighOncotree
                      transcrTcgaNeigh
                      transcrTcgaNeighDiagnosis
                      transcrTcgaNeighSite
                      responseTcgaNeigh
                      responseTcgaNeighDiagnosis
                      responseTcgaNeighSite
                      putativeTarget
                      topLocalShapGenes
                      recoveredTarget
                      }
                       ... on Prism {
                         __typename
                         drugName
                      drugId
                      source
                      sampleIndex
                      predictions
                      predictionsStd
                      quantileScore
                      experimentalMin
                      experimentalMedian
                      experimentalMax
                      modelMse
                      modelCorr
                      transcrCcleNeigh
                      transcrCcleNeighCelllinename
                      transcrCcleNeighOncotree
                      responseCcleNeigh
                      responseCcleNeighCelllinename
                      responseCcleNeighOncotree
                      transcrTcgaNeigh
                      transcrTcgaNeighDiagnosis
                      transcrTcgaNeighSite
                      responseTcgaNeigh
                      responseTcgaNeighDiagnosis
                      responseTcgaNeighSite
                      putativeTarget
                      topLocalShapGenes
                      recoveredTarget
                      }
                    }
                    }
              `
            };

        let navigateData = null;
        let type = "";
        const apiUrl = 'http://127.0.0.1:8001/graphql';

        navigateData = await axios.post(apiUrl, query);

        if (!navigateData) {
                setLoading(false);
                Swal.fire({
                    icon: "info",
                    text: "No results found!"
            });
            return;
        }else if (navigateData.data.errors){
               setLoading(false);
                Swal.fire({
                    icon: "error",
                    text: "Oops... \n An error has occurred!"
                });
                 return;
        }else if (navigateData) {
            setLoading(false);
            navigate("/explore/", { state: { 'data': navigateData.data } });
          }
        }

        catch (error) {
         setLoading(false);
          Swal.fire({
              icon: "error",
              text: error.message
          });
       }
}

const load = () => {
        setLoading(true);
        sendExploreData();
};

  return (
    <>
      <Helmet>
        <title>CellHit | Home</title>
      </Helmet>
      <Header />
    <section className="py-0" id="home">
    <div className="container">
        <div className="row align-items-center min-vh-100 min-vh-md-100 vh-sm-100 vh-100">
            <div className="col-sm-6 col-md-6 col-lg-6 text-sm-start text-center">
                <h1 className="display-2 fw-semi-bold lh-sm fs-4 fs-lg-6 fs-xxl-8">Discover CellHit</h1>
                <p className="mb-4 fs-1 fs-lg-1 fs-xxl-2">
                   Interpretable models for drug-response prediction
                </p>
                 <Button  className="btn-home  shadow-none" label="Explore now" loading={loading} onClick={load} />
                <div className="row align-items-center row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4 py-5 hide-mobile">
                    <div className="col d-flex align-items-start vertical_line">
                        <div>
                            <h4 className="fw-bold mb-0">GDSC</h4>
                            <p className="mb-0">887 Cell lines</p>
                            <p>6337 Drugs</p>
                        </div>
                    </div>
                    <div className="col d-flex align-items-start vertical_line">
                        <div>
                            <h4 className="fw-bold mb-0">PRISM</h4>
                            <p className="mb-0">686 Cell lines</p>
                            <p>286 Drugs</p>
                        </div>
                    </div>
                </div>
            </div>
             <div className="col-sm-6 col-md-6 col-lg-6 text-sm-start text-center">
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

