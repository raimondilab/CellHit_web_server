import React from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

const HelpPage = () => {

const handleDownload = () => {
        const downloadUrl = 'https://api.cellhit.bioinfolab.sns.it/api/download/GBM.csv';
        window.open(downloadUrl, '_blank');
};

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
            <h5 className="display-6 fw-bold mb-4">Run CellHit</h5>
            <p className="fs-1 text-justify mb-2">To run CellHit on your data, you must upload a transcriptomic dataset of your choice.
            Begin by clicking the "Upload Dataset" button to be directed to the upload window. Then,
            select the drugs dataset by choosing either GDSC or PRISM. Finally, click the submit button to complete the process.
            </p>
             <p className="fs-1 text-justify ">To properly process the input file, it must adhere to the following specific structure:</p>
             <ol>
              <li className="fs-1 text-justify">The file must include a column labelled "GENE," which contains gene names.</li>
              <li className="fs-1 text-justify">Each sample should have its corresponding column with numeric values representing the transcriptomic data for each gene. Sample names should be unique and clearly labelled (e.g., GB101-1_S3, GB101-2_S4).</li>
              <li className="fs-1 text-justify">Include a column titled "TCGA_CODE" to specify the cancer type associated with each sample in that row (for example, "GBM" for Glioblastoma Multiforme).</li>
              <li className="fs-1 text-justify">Add a column labelled "TISSUE" to indicate the tissue type for each sample in that row (for example, "CNS/Brain").</li>
            </ol>
            <p className="fs-1 m-0 mb-4 text-justify"> Please click <b><Link onClick={handleDownload}>here</Link></b> for an example input file.
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
                      src="/assets/images/tablei.png"
                      data-toggle="tooltip"
                      data-placement="top"
                      title="Click to zoom-in"
                      alt="Learning Workflow"
                      className="center-help shrink img-fluid mb-5"
                    />
               <p className="fs-1 text-justify mb-4">
                Users can click on a specific row to view the SHAP plot, which illustrates the importance of the top genes. The selected row will be highlighted with a blue background. To reset the selection and hide the SHAP plot, click the button featuring a replay icon.
              </p>
                <div className="row">
                <div className="col-md-6 text-center">
                  <img
                    tabIndex="1"
                    src="/assets/images/table.png"
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
                      src="/assets/images/gene_importance.png"
                      data-toggle="tooltip"
                      data-placement="top"
                      title="Click to zoom-in"
                      alt="Learning Workflow"
                      className="shrink img-fluid mb-5"
                    />

                </div>
              </div>
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
