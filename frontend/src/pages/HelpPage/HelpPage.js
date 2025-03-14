import React from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Chip } from 'primereact/chip';


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
                The platform integrates the computational pipeline from <Link to="https://doi.org/10.1038/s41467-025-56827-5" target="_blank" rel="noopener noreferrer"><b><i> Learning and actioning general principles of cancer cell drug sensitivity</i></b></Link>, enhancing accessibility to state-of-the-art methods.
                CellHit also offers an extensive suite of tools for aligning, visualizing, and modeling patient cancer cells alongside well-characterized commercial cell lines.
                Crucially, the webserver abstracts away the necessity to set up the required running environment and most of the needed pre-processing and harmonization steps.
                Additionally, the web server allows users to explore pre-computed predictions and outputs for the entire TCGA dataset.
                For more information, please refer to the <Link className="" to="/about/" target="_blank" rel="noopener noreferrer"><b><i> about</i></b></Link> page.
              </p>
               <img
                    tabIndex="1"
                    src="/assets/images/cellhit_graphical.png"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Click to zoom-in"
                    alt="graphical abstract"
                    className="center-help shrink img-fluid mb-5"
                  />
            <h5 className="display-6 fw-bold mb-4" id="explore">Explore now</h5>
            <p className="fs-1 text-justify mb-2">Users can explore pre-computed predictions and outputs for the entire TCGA dataset using two major pharmacogenomic databases: GDSC, which includes data from 686 cell lines tested against 286 drugs, and PRISM, covering 887 cell lines and 6,337 drugs. Users can access the predictions tables for GDSC and PRISM, filter results by drug name, and click the button next to the filter field to apply their selection. Additionally, users have the option to download the predictions.</p>
            <p className="fs-1 text-justify ">The key columns in the pre-computed predictions dataset are:</p>
             <ul>
              <li className="fs-1 text-justify mb-1"><b>Drug Information:</b> Includes <Chip label="drugName" />, <Chip label="drugId" />, and <Chip label="gdscId" />, identifying the tested compounds</li>
              <li className="fs-1 text-justify mb-1"><b>Sample Identification:</b> <Chip label="sampleIndex" /> represents the transcriptomic sample being analyzed</li>
              <li className="fs-1 text-justify mb-1"><b>Predictions and Metrics:</b></li>
              <ul>
              <li className="fs-1 text-justify mb-1"><Chip label="predictions" />: The estimated drug response score</li>
              <li className="fs-1 text-justify mb-1"><Chip label="predictionsStd" />: Standard deviation of predictions</li>
              <li className="fs-1 text-justify mb-1"><Chip label="quantileScore" />: Normalized response score based on prior experimental data</li>
              <li className="fs-1 text-justify mb-1"><Chip label="experimentalMin" />, <Chip label="experimentalMedian" />, <Chip label="experimentalMax" />: Provide experimental response ranges</li>
              <li className="fs-1 text-justify mb-1"><Chip label="modelMse" /> and <Chip label="modelCorr" />: Model performance metrics</li>
              </ul>
              <li className="fs-1 text-justify mb-1"><b>Similarity-based Information:</b></li>
              <ul>
              <li className="fs-1 text-justify mb-1"><Chip label="transcrCcleNeigh" /> and <Chip label="transcrTcgaNeigh" />: Transcriptomic similarity to known cell lines and TCGA samples</li>
              <li className="fs-1 text-justify mb-1"><Chip label="responseCcleNeigh" /> and <Chip label="responseTcgaNeigh" />: Response similarity to cell lines and TCGA samples</li>
              </ul>
              <li className="fs-1 text-justify mb-1"><b>Drug Target and Biomarkers:</b></li>
              <ul>
              <li className="fs-1 text-justify mb-1"><Chip label="putativeTarget" />: The predicted molecular target of the drug</li>
              <li className="fs-1 text-justify mb-1"><Chip label="topLocalShapGenes" />: Key genes influencing the drug response</li>
              <li className="fs-1 text-justify mb-4"><Chip label="recoveredTarget" />: Validated target information</li>
              </ul>
            </ul>
            <h5 className="display-6 fw-bold mb-4">Run CellHit</h5>
            <p className="fs-1 text-justify mb-2">To run CellHit on your data, you need to upload a transcriptomic dataset of your choice. Start by clicking the "Upload Dataset" button, which will take you to the upload window. Next, select the drug dataset by choosing either GDSC or PRISM. Finally, click the submit button to complete the process.
            <br/>Please ensure that you provide a CSV, ZIP, or GZ file containing bulk transcriptomic data from cancer cells, formatted in log2(TPM+1).
            </p>
             <p className="fs-1 text-justify">To properly process the input file, it must adhere to the following specific structure:</p>
             <ol>
              <li className="fs-1 text-justify">The file must include a column labelled "GENE," which contains gene names.</li>
              <li className="fs-1 text-justify">Each sample should have its corresponding column with numeric values representing the transcriptomic data for each gene. Sample names should be unique and clearly labelled (e.g., GB101-1_S3, GB101-2_S4).</li>
              <li className="fs-1 text-justify">Include a column titled "TCGA_CODE" to specify the cancer type associated with each sample in that row (for example, "GBM" for Glioblastoma Multiforme).</li>
              <li className="fs-1 text-justify">Add a column labelled "TISSUE" to indicate the tissue type for each sample in that row (for example, "CNS/Brain").</li>
            </ol>
            <p className="fs-1 m-0 mb-4 text-justify"> Please click <b><Link onClick={handleDownload}>here</Link></b> for an example input file.
            </p>
              <h5 className="display-6 fw-bold mb-4" id="umap">UMAP</h5>
              <p className="fs-1 text-justify mb-4">
                The UMAP scatterplot consists of aligned sample transcriptomic RNA-seq data. To enable a quick qualitative assessment of the aligned data, the server generates a low-dimensional projection using parametric-UMAP mapping. This projection maps the incoming data within the pre-existing aligned transcriptomics spaces of the TCGA and CCLE datasets, providing contextualization against established datasets. The data is displayed in an interactive scatterplot, allowing users to visualize metadata associated with transcriptomic neighbors in the space.
                Users can see the scatterplot with colours representing the oncotree code or tissue name by selecting it in the "colour by" options field.
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
              <h5 className="display-6 fw-bold mb-4" id="inference">Inference</h5>
              <p className="fs-1 text-justify mb-1">
                The inference table  is a comprehensive tabular dataset that includes detailed predictions and metadata for each sample and selected assay. </p>
             <p className="fs-1 text-justify">Specifically, it contains:</p>
             <ul>
                <li  class="fs-1 text-justify">Predictions for each sample, including ln(IC50) values for GDSC and LFC values for PRISM;</li>
                <li  class="fs-1 text-justify">Uncertainty estimates for predictions, represented as standard deviations derived from the ensemble model;</li>
                <li  class="fs-1 text-justify">Quantile Scores, a quantitative metric introduced in <Link to="https://doi.org/10.1101/2024.03.28.586783" target="_blank" rel="noopener noreferrer"><b><i> Learning and actioning general principles of cancer cell drug sensitivity</i></b></Link> to balance specificity and efficacy in drug response predictions;</li>
                <li  class="fs-1 text-justify">Empirical statistics for each drug (derived from experimental data), including minimum, median, and maximum values;</li>
                <li  class="fs-1 text-justify">Transcriptomic neighbors identified in both CCLE and TCGA datasets, representing the closest matching cell lines and cancer samples in transcriptomic space;</li>
                <li  class="fs-1 text-justify">Response neighbors, identifying CCLE or TCGA samples with predicted responses most similar to the given data;</li>
                <li  class="fs-1 text-justify">Annotation of neighbors with metadata, including Oncotree classifications and tissue of origin;</li>
                <li  class="fs-1 text-justify">The top 15 genes ranked by SHAP importance, offering interpretability for the trained models;</li>
                <li  class="fs-1 text-justify">Putative gene annotations for each drug, providing insights into potential drug-gene associations;</li>
             </ul>
              <p className="fs-1 text-justify mb-4">
                Users can filter the results by drugs or datasets. Furthermore, users can select the columns to visualize, export the data in various formats, and copy the URL of the results to share them.
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
                Users can click on a specific row to view more detailed information about the prediction, including the SHAP and predicted response distribution plots. These visuals illustrate the importance of the top genes and drugs and the distribution of the predicted responses. The selected row will be highlighted with a blue background. Click the replay icon to reset the selection and hide the SHAP plot and distribution plots.
              </p>
                <div className="row">
                <div className="col-md-12 text-center">
                  <img
                    tabIndex="1"
                    src="/assets/images/table.png"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Click to zoom-in"
                    alt="Learning Workflow"
                    className="center-help shrink img-fluid mb-5"
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 text-center">
                  <img
                    tabIndex="1"
                    src="/assets/images/gene_importance.png"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Click to zoom-in"
                    alt="Gene importance SHAP plot"
                    className="shrink img-fluid mb-5"
                  />
                </div>
                 <div className="col-md-4 text-center">
                  <img
                    tabIndex="1"
                    src="/assets/images/drug_distr.png"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Click to zoom-in"
                    alt="Drug distribution plot"
                    className="shrink img-fluid mb-5"
                  />
                </div>
                <div className="col-md-4 text-center">
                  <img
                    tabIndex="1"
                    src="/assets/images/drug_cell.png"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Click to zoom-in"
                    alt="Cell distribution plot"
                    className="shrink img-fluid mb-5"
                  />
                </div>
              </div>
               <h5 className="display-6 fw-bold mb-4" id="heatmap">Heatmap</h5>
              <p className="fs-1 text-justify mb-4">
                Heatmap of CellHit predictions is a graphical heatmap that visualizes sensitivity data or, in other words, the responsiveness profile of the input samples, represented as rows, while drugs are represented in columns. The heatmap values correspond to median-centered IC50/LFC for each sample-drug pair or stabilized predictions.
                Drugs with activity below the median are shown in red, indicating reduced activity, while those above the median are displayed in blue, suggesting increased activity. This visualization provides an at-a-glance summary of drug sensitivities, helping users to quickly identify the most interesting drugs for a given sample. Rows and columns are clustered based on predicted sensitivities, grouping drugs and samples sharing similar response profiles, which might be useful to reveal patient subgroups with distinct sensitivity characteristics.
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
