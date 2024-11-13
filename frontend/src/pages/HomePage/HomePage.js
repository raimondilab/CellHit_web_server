import React, { useState } from "react";
import { Helmet } from 'react-helmet';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { useNavigate } from "react-router-dom";
import { Button } from 'primereact/button';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Card } from 'primereact/card';


const HomePage = () => {

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Function to send form data to the API
    async function sendExploreData() {
        try {
            const query = {
                query: `
                    query getData {
                        databases {
                            __typename
                            ... on Gdsc {
                                gdscId
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
                                prismId
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
            const apiUrl = 'https://api.cellhit.bioinfolab.sns.it/graphql';

            navigateData = await axios.post(apiUrl, query);

            if (!navigateData) {
                setLoading(false);
                Swal.fire({
                    icon: "info",
                    text: "No results found!"
                });
                return;
            } else if (navigateData.data.errors) {
                setLoading(false);
                Swal.fire({
                    icon: "error",
                    text: "Oops... \n An error has occurred!"
                });
                return;
            } else if (navigateData) {
                setLoading(false);
                navigate("/explore/", { state: { 'data': navigateData.data } });
            }
        } catch (error) {
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
            <section className="py-1" id="home">
                <div className="container d-flex align-items-center justify-content-center min-vh-100 text-center">
                    <div className="row align-items-center">
                        <div className="col">
                            <img src="/assets/images/1.svg" alt="Database" className="img-fluid w-75" />
                            <h1 className="display-2 fw-semi-bold lh-sm fs-4 fs-lg-6 fs-xxl-8">Discover CellHit</h1>
                            <p className="mb-4 fs-1 fs-lg-1 fs-xxl-2">
                                Interpretable models for drug-response prediction
                            </p>
                            <div className="mb-4">
                                <Button className="btn-home shadow-none me-3"  size="large" label="Explore now" loading={loading} onClick={load} />
                                <Button className="btn-home-two shadow-none"  size="large" label="Run CellHit" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </>
    );
};

export default HomePage;
