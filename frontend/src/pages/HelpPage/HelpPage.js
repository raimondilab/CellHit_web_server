import React from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

const HelpPage = () => {
  return (
    <>
      <Helmet>
        <title>CellHit | Help</title>
      </Helmet>
      <Header />
      <section className="py-9">
        <div className="container">
          <div className="row">
            <div className="col-sm-12 text-sm-start text-center">
              <h1 className="display-5 fw-bold mb-4">Help</h1>
              <p className="fs-1 text-justify mb-4">
                CellHit is a web server designed to provide detailed insights into patient cancer cell sensitivities to drugs.
                Using patient transcriptomic data, CellHit predicts drug sensitivities leveraging data from the GDSC and PRISM assays, enabling opportunities for targeted therapies and precision oncology.
                The platform integrates the computational pipeline from <Link to="https://doi.org/10.1101/2024.03.28.586783" target="_blank" rel="noopener noreferrer"><b><i> Learning and actioning general principles of cancer cell drug sensitivity</i></b></Link>, enhancing accessibility to state-of-the-art methods.
                CellHit also offers an extensive suite of tools for aligning, visualizing, and modeling patient cancer cells alongside well-characterized commercial cell lines.
                Crucially, the webserver abstracts away the necessity to set up the required running environment and most of the needed pre-processing and harmonization steps.
                Additionally, the web server allows users to explore pre-computed predictions and outputs for the entire TCGA dataset.
                For more information, please refer to the <Link className="" to="/about/" target="_blank" rel="noopener noreferrer"><b><i> about</i></b></Link> page.
              </p>
              <h5 className="display-6 fw-bold mb-4">UMAP</h5>
              <p className="fs-1 text-justify mb-4">
                UMAP 2D projection of Celligner alignment coloured by oncotree or tissue. Users can see the UMAP plot with colours representing the oncotree code or tissue name by selecting it in the "colour by" options field.
              </p>
              <div className="row">
                <div className="col-md-6 text-center">
                  <img
                    tabIndex="1"
                    src="/assets/images/oncotree_plot.png"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Click to zoom-in"
                    alt="Learning Workflow"
                    className="shrink img-fluid mb-5"
                  />
                </div>
                <div className="col-md-6 text-center">
                  <img
                    tabIndex="1"
                    src="/assets/images/tissue_plot.png"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Click to zoom-in"
                    alt="Learning Workflow"
                    className="shrink img-fluid mb-5"
                  />
                </div>
              </div>
              <h5 className="display-6 fw-bold mb-4">Table</h5>
              <p className="fs-1 text-justify mb-4">
                The inference table displays the results from the CelHit pipeline for each sample. Users can filter the results by drugs or datasets. Furthermore, users can select the columns to visualize, export the data in various formats, and copy the URL of the results to share them.
              </p>
              <img
                      tabIndex="1"
                      src="/assets/images/table.png"
                      data-toggle="tooltip"
                      data-placement="top"
                      title="Click to zoom-in"
                      alt="Learning Workflow"
                      className="center-help shrink img-fluid mb-5"
                    />
               <h5 className="display-6 fw-bold mb-4">Heatmap</h5>
              <p className="fs-1 text-justify mb-4">
                Heatmap of CellHit predictions of GDSC/PRISM drugs (columns) for each sample (rows). Cells contain the predicted lnIC50 values normalized by median subtraction.
              </p>
              <img
                      tabIndex="1"
                      src="/assets/images/heatmap.png"
                      data-toggle="tooltip"
                      data-placement="top"
                      title="Click to zoom-in"
                      alt="Learning Workflow"
                      className="center-help shrink img-fluid mb-5"
                    />
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default HelpPage;
