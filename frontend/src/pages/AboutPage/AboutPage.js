import React from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';


const AboutPage = () => {
   return (
    <>
    <Helmet>
        <title>CellHit | About</title>
      </Helmet>
      <Header/>
      <section className="py-9">
      <div className="container">
        <div className="row">
        <div className="col-sm-12 text-sm-start text-center">
                    <h1 className="display-5 fw-bold mb-4">About</h1>
                    <p className="fs-1 text-justify mb-4">
                      CellHit is a web server designed to provide detailed insights into patient cancer cell sensitivities to drugs.
                      Using patient transcriptomic data, CellHit predicts drug sensitivities leveraging data from the GDSC and PRISM assays, enabling opportunities for targeted therapies and precision oncology.
                      The platform integrates the computational pipeline from <Link to="https://doi.org/10.1101/2024.03.28.586783" target="_blank" rel="noopener noreferrer"><b><i> Learning and actioning general principles of cancer cell drug sensitivity</i></b></Link>, enhancing accessibility to state-of-the-art methods.
                      CellHit also offers an extensive suite of tools for aligning, visualizing, and modeling patient cancer cells alongside well-characterized commercial cell lines.
                      Crucially, the webserver abstracts away the necessity to set up the required running environment and most of the needed pre-processing and harmonization steps.
                      Additionally, the web server allows users to explore pre-computed predictions and outputs for the entire TCGA dataset.
                    </p>
                     <h5 className="display-6 fw-bold mb-5">Details on the computational workflow</h5>
                     <img
                      tabIndex="1"
                      src="/assets/images/web.png"
                      data-toggle="tooltip"
                      data-placement="top"
                      title="Click to zoom-in"
                      alt="Learning Workflow"
                      className="center-help shrink img-fluid mb-5"
                    />
                    <p className="fs-1 text-justify mb-4">
                    The computational steps of the pipeline are illustrated in the figure above.
                    To harmonize new bulk samples with TCGA data, the process begins by applying the ComBat method.
                    The pipeline then ensures that all genes required for the CellHit models are present in the data.
                    If any genes are missing, an ad-hoc model is automatically invoked to impute them.
                    The data is subsequently aligned using a modified version of the <Link to="https://doi.org/10.1038/s41467-020-20294-x" target="_blank" rel="noopener noreferrer"><b><i>Celligner</i></b></Link> method to ensure compatibility with cancer cell line transcriptomic profiles, which form the basis for model training.
                    Finally, the processed data is used for inference with pretrained CellHit models. As a sanity check, the aligned data is projected into a low-dimensional UMAP space to contextualize it relative to CCLE and TCGA transcriptomic datasets.
                    Further details on the methodologies and specific procedures in each step will be discussed in the respective subsections.
                    </p>
                    <h4 className="fw-bold mb-3">ComBat</h4>
                    <p className="fs-1 text-justify mb-4">
                    Combat correction is performed using the <Link to="https://epigenelabs.github.io/pyComBat/" target="_blank" rel="noopener noreferrer"><b><i>pyComBat package</i></b></Link>.
                    Notably, if the user assigns a TCGA tumor label (e.g., BRCA, LAML, LUAD; see [placeholder for the link]) to the samples in a
                    dedicated column along with transcriptomics data, this metadata is utilized to achieve improved harmonization with
                    TCGA (through the “mod” argument of pyComBat). It is important to note that the input data is expected to originate
                    from bulk transcriptomics of patient tissue (in log2(TPM+1) format) rather than from commercial cell lines.
                    This step ensures the harmonization of new patient bulk RNA-seq data with TCGA bulk RNA-seq data.
                    </p>
                    <h4 className="fw-bold mb-3">Gene imputer</h4>
                    <p className="fs-1 text-justify mb-4">
                     A machine learning pipeline was developed to handle missing values in incoming transcriptomic data.
                     The imputation step utilized an XGBoost regressor trained on synthetically corrupted TCGA RNA-seq data.
                     To simulate realistic missing data scenarios, 10–20% of gene expression values were randomly masked per sample.
                     Optimal hyperparameters for the XGBoost model were identified using Optuna, which employed a multivariate Tree-structured Parzen Estimator (TPE) sampler.
                     Hyperparameter optimization was performed through 3-fold cross-validation on random subsets of 400 genes per fold. The folds were stratified by tumor type to ensure robust generalization across different cancer subtypes.
                     The imputer receives as input the corrupted RNA-seq profiles along with tumor type information and outputs a the gene expression profile suitable for downstream analysis with CellHit models.
                     More details are available at <Link to="https://github.com/mr-fcharles/WebCellHit" target="_blank" rel="noopener noreferrer"><b><i>WebCellHit</i></b></Link>.
                    </p>
                    <h4 className="fw-bold mb-3">NewCelligner</h4>
                    <p className="fs-1 text-justify mb-2">
                    Building upon the methods introduced in Celligner, our objective was to obtain a robust tool to quickly align transcriptional profiles of tumor samples (TCGA) and established cancer cell lines (CCLE).
                    Initial attempts to integrate Celligner into our pipeline revealed several shortcomings:
                    </p>
                     <ul class="mb-4 ml-10">
                        <li class="fs-1 text-justify">In its original form, the code did not serve our purposes since the “train” and “transform” methods of the original method shared some statistics that were completely fine for the original Celligner goals but resulted in data leakage in our predictive machine learning framework; </li>
                        <li class="fs-1 text-justify">Celligner featured a somewhat opaque implementation approach that included a probably incorrect implementation of contrastive PCA (cPCA) routine and reliance on R-based packages for differential gene expression analysis;</li>
                        <li class="fs-1 text-justify">Furthermore, the original strategy of Celligner to evaluate the goodness of the obtained outputs relied on measuring the correlation of both obtained tumor samples and cancer cell lines by stratifying by tissue type (where greater correlation means better alignment). However, this metrics disregards the fact that some of the cell lines feature heterogeneous neighborhoods (hyperspheres in  CCLE the transcriptomic space with feature high tissue heterogeneity) even before alignment with TCGA;</li>
                        <li class="fs-1 text-justify">Celligner presents a lot of hypermeters which are not fixed through a thorough hyper parameter selection procedure;</li>
                    </ul>
                    <p className="fs-1 text-justify mb-2">
                    To address these issues, we fundamentally refactored the Celligner pipeline.
                    All R-based dependencies were removed by reimplementing the functionality of the limma eBayes and F-statistics tests directly in Python, ensuring consistency with original results while streamlining the computational workflow.
                    We corrected the cPCA procedure by rewriting the methodology presented in the original paper from scratch using PyTorch and GPU acceleration.
                    We also improved data standardization practices by computing and storing separate mean and standard deviation parameters for the CCLE and TCGA datasets, thereby enforcing proper normalization and reducing data leakage during transformation.
                    </p>
                    <p className="fs-1 text-justify mb-2">
                    A central innovation was the introduction of a new heuristic procedure to measure alignment quality, grounded in neighborhood consistency. This approach relies on tissue-type annotations and nearest neighbor analyses, allowing us to quantify how well each cell line aligns with its corresponding tumor counterparts after the Celligner procedure.
                    By selecting hyperparameters that minimize this heuristic, we achieved a more reliable and biologically meaningful alignment.
                    </p>
                    <h5 className="display-6 fw-bold mb-3">Libraries</h5>
                    <ul class="mb-1 ml-10">
                        <li class="fs-1 text-justify">ReactJS (v18.2.0)</li>
                        <li class="fs-1 text-justify">Plotly.js (v2.6.0)</li>
                        <li class="fs-1 text-justify">Primereact (v10.5.0)</li>
                        <li class="fs-1 text-justify">React-bootstrap (v2.10.0)</li>
                        <li class="fs-1 text-justify">FastAPI (v0.104.1)</li>
                        <li class="fs-1 text-justify">Strawberry-graphql (v0.217.1)</li>
                        <li class="fs-1 text-justify">SQLAlchemy (v1.4.51)</li>
                        <li class="fs-1 text-justify">Celery (v5.4.0)</li>
                        <li class="fs-1 text-justify mb-4">Redis (v3.5.3)</li>
                    </ul>
                    <h5 className="display-6 fw-bold mb-3">Contact</h5>
                    <p class="fs-1 text-justify">Francesco Raimondi - francesco.raimondi@sns.it</p>


          </div>
        </div>
    </div>
</section>

    <Footer/>
   	</>
   )
}

export default AboutPage