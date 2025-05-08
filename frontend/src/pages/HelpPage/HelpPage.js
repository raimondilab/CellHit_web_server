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

const handleDownloadTissue = () => {
  const downloadUrl = '/assets/data/tissue.csv';
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', 'tissue.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


const handleDownloadTCGA = () => {
  const downloadUrl = '/assets/data/tcga_study_names.csv';
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', 'tcga_study_names.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
                    src="/assets/images/cellhit_graphical.webp"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Click to zoom-in"
                    alt="graphical abstract"
                    className="center-help shrink img-fluid mb-5"
                  />
            <h5 className="display-6 fw-bold mb-4" id="explore">Explore now</h5>
            <p className="fs-1 text-justify mb-2">We provide precomputed predictions for all TCGA samples across both GDSC and PRISM
            drugs, totaling 4.060.342 and 17.958.038 predictions, respectively, along with a comprehensive
            set of contextual information. </p>
            <p className="fs-1 text-justify">Specifically, it contains:</p>
                <ul>
                  <li className="fs-1 text-justify mb-1">
                    <b>General Drug Information:</b>
                  </li>
                   <ul>
                    <li className="fs-1 text-justify mb-1"><Chip label="DrugID" />: Internal identifier assigned to the drug. This ID originates from one of the two primary drug screening datasets: GDSC (Genomics of Drug Sensitivity in Cancer) or PRISM (Profiling Relative Inhibition Simultaneously in Mixtures).</li>
                    <li className="fs-1 text-justify mb-1"><Chip label="DrugName" />: The common or official pharmaceutical name of the drug being studied.</li>
                    <li className="fs-1 text-justify mb-1"><Chip label="PutativeTarget" />: Officially declared primary biological targets (proteins) of the drug. These targets are often derived from literature or known pharmacological databases.</li>
                  </ul>

                  <li className="fs-1 text-justify mb-1">
                    <b>Sample Information:</b>
                     <ul>
                      <li className="fs-1 text-justify mb-1">
                         <Chip label="sampleIndex" /> Identifier of the biological sample or cell line used for the prediction. This is typically a standardized cell line accession code or sample name.
                      </li>
                      </ul>
                  </li>

                  <li className="fs-1 text-justify mb-1"><b>Prediction and Uncertainty:</b></li>
                  <ul>
                    <li className="fs-1 text-justify mb-1"><Chip label="predictions" />: Numerical prediction output of the machine learning model, given in terms of the natural logarithm of the IC50 (ln(IC50)) expressed in micromolar (µM). IC50 represents the concentration of the drug required to inhibit a given biological process (e.g., cell proliferation) by 50%; lower values indicate higher drug sensitivity, higher values indicate resistance.</li>
                    <li className="fs-1 text-justify mb-1"><Chip label="predictionsStd" />: Standard deviation representing uncertainty estimation around the prediction. Computed from the ensemble of multiple machine learning models, this value provides an indication of predictive consistency (lower std indicates higher confidence in the prediction).</li>
                  </ul>

                  <li className="fs-1 text-justify mb-1"><b>Experimental Reference Values:</b></li>
                  <p className="fs-1 text-justify mb-1"> These metrics represent historical or previously recorded experimental drug sensitivity measurements, useful for contextualizing the current prediction:</p>
                  <ul>
                    <li className="fs-1 text-justify mb-1"><Chip label="experimentalMin" />: Minimum experimentally observed ln(IC50) value for this drug across available datasets, indicating the highest sensitivity (lowest resistance).</li>
                    <li className="fs-1 text-justify mb-1"><Chip label="experimentalMedian" />: Median experimentally observed ln(IC50) across cell lines or samples, representing typical or average sensitivity.</li>
                     <li className="fs-1 text-justify mb-1"><Chip label="experimentalMax" />: Maximum experimentally observed ln(IC50), indicating the least sensitive or most resistant cases recorded experimentally.</li>
                  </ul>

                  <li className="fs-1 text-justify mb-1"><b>Feature Importance and Interpretation:</b></li>
                  <ul>
                    <li className="fs-1 text-justify mb-1"><Chip label="TopGenes" />: List of the 15 most influential genes (ranked by absolute importance) that significantly contributed to the model's prediction. These genes were identified using feature attribution methods (e.g., SHAP values).</li>
                    <li className="fs-1 text-justify mb-1"><Chip label="Recovered targets" />: Subset of genes from the <i>TopGenes</i> list that are also the officially documented putative targets of the drug, highlighting cases where biological knowledge aligns with model-derived importance scores.</li>
                  </ul>
                  <li className="fs-1 text-justify mb-1"><b>Quantitative Assessment of Prediction Quality:</b></li>
                     <ul>
                         <li className="fs-1 text-justify mb-1"><Chip label="quantileScore" /> A normalized score (ranging from 0 to 1) designed to balance sensitivity (true positives) and specificity (true negatives) of drug predictions for a given sample. A score closer to 1 indicates a higher confidence or quality of prediction and more reliable sensitivity profiling.  </li>
                      </ul>

                     <li className="fs-1 text-justify mb-1"><b>Transcriptomic Nearest Neighbors:</b></li>
                     <p className="fs-1 text-justify ">These entries provide context by identifying the most similar transcriptomic profiles from known large-scale datasets:</p>
                     <ul>
                         <li className="fs-1 text-justify mb-1"><Chip label="transcrCcleNeigh" /> Accession identifier for the Cancer Cell Line Encyclopedia (CCLE) cell line with the transcriptome most similar to the sample of interest, measured by Euclidean distance.</li>
                         <li className="fs-1 text-justify mb-1"><Chip label="transcrCcleNeighCelllinename" /> Commercial or commonly known name of this CCLE cell line neighbor.</li>
                         <li className="fs-1 text-justify mb-1"><Chip label="transcrCcleNeighOncotree" /> Tissue origin of the closest CCLE transcriptomic neighbor.</li>
                         <li className="fs-1 text-justify mb-1"><Chip label="transcrTcgaNeigh" /> Accession identifier for the TCGA (The Cancer Genome Atlas) sample transcriptomically closest to the sample of interest.</li>
                          <li className="fs-1 text-justify mb-1"><Chip label="transcrTcgaNeighDiagnosis" /> Diagnosis origin of the closest TCGA transcriptomic neighbor.</li>
                         <li className="fs-1 text-justify mb-1"><Chip label="transcrTcgaNeighSite" /> Tissue origin of the closest TCGA transcriptomic neighbor.</li>
                      </ul>

                  <li className="fs-1 text-justify mb-1"><b>Response-based Nearest Neighbors:</b></li>
                   <ul>
                         <li className="fs-1 text-justify mb-1"><Chip label="responseCcleNeigh" /> Accession identifier of the CCLE cell line whose predicted drug response profile is closest to the current sample, as determined by Euclidean distance across all predicted drug responses.</li>
                         <li className="fs-1 text-justify mb-1"><Chip label="responseCcleNeighCelllinename" /> Commercial or commonly known name of this response-based CCLE neighbor.</li>
                         <li className="fs-1 text-justify mb-1"><Chip label="responseCcleNeighOncotree" /> Tissue origin of the response-based CCLE neighbor.</li>
                         <li className="fs-1 text-justify mb-1"><Chip label="responseTcgaNeigh" /> Accession identifier of the TCGA sample with the most similar drug response profile.</li>
                         <li className="fs-1 text-justify mb-1"><Chip label="responseTcgaNeighDiagnosis" /> Diagnosis of origin of this TCGA response-based neighbor.</li>
                         <li className="fs-1 text-justify mb-1"><Chip label="responseTcgaNeighSite" /> Tissue of origin of this TCGA response-based neighbor.</li>
                  </ul>
                   <li className="fs-1 text-justify mb-1"><b>Source Origin:</b></li>
                     <ul>
                         <li className="fs-1 text-justify mb-1"><Chip label="source" /> Name or identifier of the dataset (TCGA, CCLE, or another experimental source) to which the specific drug-cell line pair belongs.</li>
                      </ul>
                </ul>
            <p className="fs-1 text-justify">Users can access the predictions tables for GDSC and PRISM and filter the results by drug name. They should click the button next to the filter field to apply their selection. Once the filter is applied, a statistical visualization of the selected drug will be displayed. A description of this visualization is provided below. Additionally, users have the option to download the predictions.</p>

            <h6 className="fs-1 text-justify mb-4"><b>Model Predictions Overview</b></h6>
            <p className="fs-1 text-justify mb-3">Investigate how the model predictions compare to experimental data and evaluate the performance of drug sensitivity predictions. Additionally, conduct a residual analysis to assess the model’s fit to the data by examining the residuals, which represent the differences between predicted and observed sensitivities.</p>
            <p className="fs-1 text-justify mb-2"><Chip label="Predictions by Source" />: The box plot summarizes and compares the statistical distributions of predictions across different sources (TCGA and CCLE) as defined in the data. Analyze the consistency of model predictions across these various datasets or sources.</p>
            <p className="fs-1 text-justify mb-2"><Chip label="Quantile Score Distribution" />: The histogram illustrates the distribution of predicted relative sensitivity values (Quantile Scores) for the selected drug. It shows how many indicators are predicted to be very sensitive (low QS), have median sensitivity (QS around 0.5), or be very resistant (high QS) in the context of the overall model predictions. This provides valuable insight into the expected sensitivity profile for the drug.</p>
            <p className="fs-1 text-justify mb-2"><Chip label="Predicted vs Experimental Density" />: The density plot examines and compares the overall shape of the distributions of predicted and experimental values for the drug. Evaluate whether the model accurately captures the central tendency and variability observed in the experimental data.</p>
            <p className="fs-1 text-justify mb-4"><Chip label="Residuals (Prediction - Experimental)" />: The residue plot shows the difference between prediction and experimental value for each cell line grouped by source for a specific drug.</p>
            <div className="row">
              <div className="col-md-4 text-center">
                <img
                  tabIndex="1"
                  src="/assets/images/boxplot.webp"
                  data-toggle="tooltip"
                  data-placement="top"
                  title="Click to zoom-in"
                  alt="boxplot"
                  className="shrink img-fluid mb-2"
                />
              </div>
              <div className="col-md-4 text-center">
                <img
                  tabIndex="1"
                  src="/assets/images/histogram.webp"
                  data-toggle="tooltip"
                  data-placement="top"
                  title="Click to zoom-in"
                  alt="histogram"
                  className="shrink img-fluid mb-2"
                />
              </div>
              <div className="col-md-4 text-center">
                <img
                  tabIndex="1"
                  src="/assets/images/density.webp"
                  data-toggle="tooltip"
                  data-placement="top"
                  title="Click to zoom-in"
                  alt="density"
                  className="shrink img-fluid mb-2"
                />
              </div>
             </div>
             <div className="row">
              <div className="col-md-12 text-center">
                <img
                  tabIndex="1"
                  src="/assets/images/residue.webp"
                  data-toggle="tooltip"
                  data-placement="top"
                  title="Click to zoom-in"
                  alt="residue"
                  className="shrink img-fluid mb-5"
                />
              </div>
            </div>

            <h5 className="display-6 fw-bold mb-4">Run CellHit</h5>
            <p className="fs-1 text-justify mb-2">To run CellHit on your data, you need to upload a transcriptomic dataset of your choice. Start by clicking the "Upload Dataset" button, which will take you to the upload window. Next, select the drug dataset by choosing either GDSC or PRISM. Finally, click the submit button to complete the process.
            <br/>Please ensure that you provide a CSV, ZIP, or GZ file containing bulk transcriptomic data from cancer cells, in raw counts.
            </p>
             <p className="fs-1 text-justify">To properly process the input file, it must adhere to the following specific structure:</p>
             <ol>
              <li className="fs-1 text-justify">The file must include a column labelled "GENE," which contains gene names.</li>
              <li className="fs-1 text-justify">Each sample should have its corresponding column with numeric values representing the transcriptomic data for each gene. Sample names should be unique and clearly labelled (e.g., GB101-1_S3, GB101-2_S4).</li>
              <li className="fs-1 text-justify">Include a column titled "TCGA_CODE" to specify the cancer type associated with each sample in that row (for example, "GBM" for Glioblastoma Multiforme). The complete list of TCGA acronyms is available at <Link  onClick={handleDownloadTCGA}><b><i>here.</i></b></Link></li>
              <li className="fs-1 text-justify">Add a column labelled "TISSUE" to indicate the tissue type for each sample in that row (for example, "CNS/Brain"). The complete list of tissue names is available at <b><i><span style={{ cursor: 'pointer' }} onClick={handleDownloadTissue}>here.</span></i></b></li>
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
                    src="/assets/images/oncotree_plot.webp"
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
                    src="/assets/images/tissue_plot.webp"
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
                  <li className="fs-1 text-justify mb-1">
                    <b>General Drug Information:</b>
                  </li>
                   <ul>
                    <li className="fs-1 text-justify mb-1"><Chip label="DrugID" />: Internal identifier assigned to the drug. This ID originates from one of the two primary drug screening datasets: GDSC (Genomics of Drug Sensitivity in Cancer) or PRISM (Profiling Relative Inhibition Simultaneously in Mixtures).</li>
                    <li className="fs-1 text-justify mb-1"><Chip label="DrugName" />: The common or official pharmaceutical name of the drug being studied.</li>
                    <li className="fs-1 text-justify mb-1"><Chip label="PutativeTarget" />: Officially declared primary biological targets (proteins) of the drug. These targets are often derived from literature or known pharmacological databases.</li>
                  </ul>

                  <li className="fs-1 text-justify mb-1">
                    <b>Sample Information:</b>
                     <ul>
                      <li className="fs-1 text-justify mb-1">
                         <Chip label="index" /> Identifier of the biological sample or cell line used for the prediction. This is typically a standardized cell line accession code or sample name.
                      </li>
                      </ul>
                  </li>

                  <li className="fs-1 text-justify mb-1"><b>Prediction and Uncertainty:</b></li>
                  <ul>
                    <li className="fs-1 text-justify mb-1"><Chip label="prediction" />: Numerical prediction output of the machine learning model, given in terms of the natural logarithm of the IC50 (ln(IC50)) expressed in micromolar (µM). IC50 represents the concentration of the drug required to inhibit a given biological process (e.g., cell proliferation) by 50%; lower values indicate higher drug sensitivity, higher values indicate resistance.</li>
                    <li className="fs-1 text-justify mb-1"><Chip label="std" />: Standard deviation representing uncertainty estimation around the prediction. Computed from the ensemble of multiple machine learning models, this value provides an indication of predictive consistency (lower std indicates higher confidence in the prediction).</li>
                  </ul>

                  <li className="fs-1 text-justify mb-1"><b>Experimental Reference Values:</b></li>
                  <p className="fs-1 text-justify mb-1"> These metrics represent historical or previously recorded experimental drug sensitivity measurements, useful for contextualizing the current prediction:</p>
                  <ul>
                    <li className="fs-1 text-justify mb-1"><Chip label="DrugMin" />: Minimum experimentally observed ln(IC50) value for this drug across available datasets, indicating the highest sensitivity (lowest resistance).</li>
                    <li className="fs-1 text-justify mb-1"><Chip label="DrugMedian" />: Median experimentally observed ln(IC50) across cell lines or samples, representing typical or average sensitivity.</li>
                     <li className="fs-1 text-justify mb-1"><Chip label="DrugMax" />: Maximum experimentally observed ln(IC50), indicating the least sensitive or most resistant cases recorded experimentally.</li>
                  </ul>

                  <li className="fs-1 text-justify mb-1"><b>Feature Importance and Interpretation:</b></li>
                  <ul>
                    <li className="fs-1 text-justify mb-1"><Chip label="TopGenes" />: List of the 15 most influential genes (ranked by absolute importance) that significantly contributed to the model's prediction. These genes were identified using feature attribution methods (e.g., SHAP values).</li>
                    <li className="fs-1 text-justify mb-1"><Chip label="Recovered targets" />: Subset of genes from the <i>TopGenes</i> list that are also the officially documented putative targets of the drug, highlighting cases where biological knowledge aligns with model-derived importance scores.</li>
                  </ul>

                   <li className="fs-1 text-justify mb-1"><b>SHAP-based Explanation Details:</b></li>
                   <p className="fs-1 text-justify mb-2">SHAP (SHapley Additive exPlanations) values quantitatively represent the impact of gene expression on model predictions:</p>
                   <ul>
                         <li className="fs-1 text-justify mb-1"><Chip label="ShapPos" /> Dictionary listing genes with the strongest positive SHAP values. A higher gene expression at the recorded level for these genes is associated with an increased predicted ln(IC50), implying greater drug resistance.</li>
                         <li className="fs-1 text-justify mb-1"><Chip label="ShapNeg" /> Dictionary of genes with the strongest negative SHAP values. Increased gene expression for these genes at the observed level decreases predicted ln(IC50), indicating higher drug sensitivity.</li>
                  </ul>

                  <li className="fs-1 text-justify mb-1"><b>Quantitative Assessment of Prediction Quality:</b></li>
                     <ul>
                         <li className="fs-1 text-justify mb-1"><Chip label="Quantile score" /> A normalized score (ranging from 0 to 1) designed to balance sensitivity (true positives) and specificity (true negatives) of drug predictions for a given sample. A score closer to 1 indicates a higher confidence or quality of prediction and more reliable sensitivity profiling.  </li>
                      </ul>

                     <li className="fs-1 text-justify mb-1"><b>Transcriptomic Nearest Neighbors:</b></li>
                     <p className="fs-1 text-justify ">These entries provide context by identifying the most similar transcriptomic profiles from known large-scale datasets:</p>
                     <ul>
                         <li className="fs-1 text-justify mb-1"><Chip label="ccle_transcriptomic_neigh" /> Accession identifier for the Cancer Cell Line Encyclopedia (CCLE) cell line with the transcriptome most similar to the sample of interest, measured by Euclidean distance.</li>
                         <li className="fs-1 text-justify mb-1"><Chip label="ccle_transcriptomic_neigh_name" /> Commercial or commonly known name of this CCLE cell line neighbor.</li>
                         <li className="fs-1 text-justify mb-1"><Chip label="ccle_transcriptomic_neigh_tissue" /> Tissue origin of the closest CCLE transcriptomic neighbor.</li>
                         <li className="fs-1 text-justify mb-1"><Chip label="tcga_transcriptomic_neigh" /> Accession identifier for the TCGA (The Cancer Genome Atlas) sample transcriptomically closest to the sample of interest.</li>
                         <li className="fs-1 text-justify mb-1"><Chip label="tcga_transcriptomic_neigh_tissue" /> Tissue origin of the closest TCGA transcriptomic neighbor.</li>
                      </ul>

                  <li className="fs-1 text-justify mb-1"><b>Response-based Nearest Neighbors:</b></li>
                   <ul>
                         <li className="fs-1 text-justify mb-1"><Chip label="ccle_response_neigh" /> Accession identifier of the CCLE cell line whose predicted drug response profile is closest to the current sample, as determined by Euclidean distance across all predicted drug responses.</li>
                         <li className="fs-1 text-justify mb-1"><Chip label="ccle_response_neigh_name" /> Commercial or commonly known name of this response-based CCLE neighbor.</li>
                         <li className="fs-1 text-justify mb-1"><Chip label="ccle_response_neigh_tissue" /> Tissue origin of the response-based CCLE neighbor.</li>
                         <li className="fs-1 text-justify mb-1"><Chip label="tcga_response_neigh" /> Accession identifier of the TCGA sample with the most similar drug response profile.</li>
                         <li className="fs-1 text-justify mb-1"><Chip label="tcga_response_neigh_tissue" /> Tissue of origin of this TCGA response-based neighbor.</li>
                  </ul>
                   <li className="fs-1 text-justify mb-1"><b>Dataset Origin:</b></li>
                     <ul>
                         <li className="fs-1 text-justify mb-1"><Chip label="dataset" /> Name or identifier of the dataset (GDSC, PRISM, or another experimental source) to which the specific drug-cell line pair belongs.</li>
                      </ul>
                </ul>
              <p className="fs-1 text-justify mb-4">
                Users can filter the results by drugs or datasets. Furthermore, users can select the columns to visualize, export the data in various formats, and copy the URL of the results to share them.
              </p>
              <img
                      tabIndex="1"
                      src="/assets/images/tablei.webp"
                      data-toggle="tooltip"
                      data-placement="top"
                      title="Click to zoom-in"
                      alt="Learning Workflow"
                      className="center-help shrink img-fluid mb-5"
                    />
               <p className="fs-1 text-justify mb-4">
                Users can access additional information by clicking on a specific prediction row in the table, including a graph displaying the top 15 genes ranked by their absolute SHAP importance. In this graph, blue bars represent genes that lower the IC50 value (indicating increased drug sensitivity). In contrast, red bars represent genes that raise the IC50 value (indicating decreased sensitivity).
                <br/>Additionally, we utilize kernel density estimation (KDE) plots to visualize two complementary distributional features of the predictions. The first plot compares a drug's predicted response to that of other drugs tested on the same cell line; a red line on the left side of the distribution indicates higher efficacy. The second plot examines the drug's behaviour across multiple cell lines, helping to identify instances where consistently low IC50 values may suggest general toxicity instead of selective effectiveness. <br/>Click the replay icon to reset the selection and hide the SHAP plot and distribution plots.
              </p>
                <div className="row">
                <div className="col-md-12 text-center">
                  <img
                    tabIndex="1"
                    src="/assets/images/table.webp"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Click to zoom-in"
                    alt="table"
                    className="center-help shrink img-fluid mb-5"
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 text-center">
                  <img
                    tabIndex="1"
                    src="/assets/images/gene_importance.webp"
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
                    src="/assets/images/drug_distr.webp"
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
                    src="/assets/images/drug_cell.webp"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Click to zoom-in"
                    alt="Cell distribution plot"
                    className="shrink img-fluid mb-5"
                  />
                </div>
              </div>
               <h5 className="display-6 fw-bold mb-4" id="heatmap">Heatmap</h5>
              <p className="fs-1 text-justify">
                A heatmap provides an overview of drug sensitivity profiles, with samples represented as rows and drugs as columns. Responses are calculated using two normalization methods: Median Subtraction and Standardization.
               </p>
               <ul>
                <li  class="fs-1 text-justify">Median Subtraction: This method adjusts predictions by subtracting the median value for each drug (from either GDSC or PRISM). It indicates whether a sample shows higher sensitivity (highlighted in blue, below the median) or lower sensitivity (indicated in red, above the median). This approach is useful for assessing drug specificity.</li>
                <li  class="fs-1 text-justify">Standardization: This method normalizes values by subtracting the mean and dividing by the standard deviation of the processed samples. It emphasizes the relative differences between samples, making it particularly useful for identifying distinct tumor subtypes and potential applications in precision medicine.</li>
             </ul>
             <p className="fs-1 text-justify">By incorporating response information and applying hierarchical clustering to the rows, we can simplify the grouping of patients with similar response patterns. Both rows and columns are clustered based on predicted sensitivities, which helps group drugs and samples with identical response profiles. This clustering aids in identifying subgroups of patients with unique sensitivity characteristics.
              </p>
             <p className="fs-1 text-justify mb-4">To refine the extensive drug set from GDSC and PRISM, users can select from a dropdown menu to choose between 15 and 50 top medications based on the highest variance across predicted samples. Additionally, any drug with an average ln(IC50) value lower than -1 is included in the selection.</p>
               <div className="row">
                <div className="col-md-6 text-center">
                  <img
                    tabIndex="1"
                    src="/assets/images/heatmap.webp"
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
                    src="/assets/images/heatmap2.webp"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Click to zoom-in"
                    alt="Learning Workflow"
                    className="shrink img-fluid mb-5"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default HelpPage;
