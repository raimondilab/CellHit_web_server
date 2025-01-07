import React from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';


const FaqPage = () => {
   return (
    <>
    <Helmet>
        <title>CellHit | FAQs</title>
      </Helmet>
      <Header/>
      <section className="py-9">
      <div className="container">
        <div className="row">
            <div className="col-sm-12 text-sm-start text-center">
                        <h1 className="display-5 fw-bold mb-4">FAQs</h1>
                         <p className="fs-1 text-justify"><b>What is WebCellHit, and what does it do?</b><br/>
                         WebCellHit is a web server designed to predict cancer cell sensitivities to drugs using patient transcriptomic data.
                         It leverages data from GDSC
                         and PRISM assays to enable targeted therapies and precision oncology, simplifying complex computational workflows.
                        </p>
                        <p className="fs-1 text-justify"><b>What kind of data does WebCellHit require as input?</b><br/>
                        WebCellHit requires bulk RNA-seq transcriptomic data from patient tissues in log2(TPM+1) format. This ensures compatibility with its harmonization and predictive models.
                        </p>
                        <p className="fs-1 text-justify"><b>What is the ComBat harmonization method used for?</b><br/>
                        The ComBat method aligns new patient bulk RNA-seq data with TCGA bulk RNA-seq data by correcting batch effects. It utilizes TCGA tumor labels, when provided, for enhanced harmonization.
                        </p>
                        <p className="fs-1 text-justify"><b>How does WebCellHit handle missing gene expression data?</b><br/>
                        WebCellHit uses a machine-learning-based gene imputer, powered by an XGBoost regressor, to infer missing gene expression values. This ensures completeness of the dataset for downstream analysis.
                        </p>
                        <p className="fs-1 text-justify"><b>What improvements have been made to the Celligner method in WebCellHit?</b><br/>
                         WebCellHit's modified Celligner method addresses data leakage, simplifies implementation with Python-based tools, improves normalization practices, and introduces a heuristic based on neighborhood consistency for better alignment quality.
                        </p>
                        <p className="fs-1 text-justify"><b>What is the purpose of Parametric UMAP in WebCellHit?</b><br/>
                         Parametric UMAP facilitates efficient visualization of user data in a fixed reference space aligned to CCLE and TCGA datasets. This GPU-accelerated implementation avoids recalculating embeddings, maintaining consistency and interpretability.
                        </p>
                        <p className="fs-1 text-justify"><b>How does WebCellHit ensure the biological relevance of its predictions?</b><br/>
                         By aligning patient data with well-characterized commercial cell lines and using robust evaluation metrics, WebCellHit ensures that its models reflect tissue-specific tumor profiles accurately.
                        </p>
                        <p className="fs-1 text-justify"><b>What tools are integrated into WebCellHit's workflow?</b><br/>
                         WebCellHit integrates tools like ComBat for harmonization, an XGBoost-based gene imputer, a custom version of Celligner for alignment, and Parametric UMAP for visualization.
                        </p>
                        <p className="fs-1 text-justify"><b>Can I explore pre-computed predictions using WebCellHit?</b><br/>
                         WebCellHit integrates tools like ComBat for harmonization, an XGBoost-based gene imputer, a custom version of Celligner for alignment, and Parametric UMAP for visualization.
                        </p>
                        <p className="fs-1 text-justify"><b>Where can I find the source code for WebCellHit's components?</b><br/>
                          <ul class="mb-1 ml-10">
                            <li class="fs-1 text-justify">CellHit models: <Link to="https://github.com/raimondilab/CellHit" target="_blank" rel="noopener noreferrer"><b><i>GitHub Repository</i></b></Link></li>
                            <li class="fs-1 text-justify">Celligner package: <Link to="https://github.com/mr-fcharles/celligner" target="_blank" rel="noopener noreferrer"><b><i>Celligner GitHub</i></b></Link></li>
                            <li class="fs-1 text-justify">Parametric UMAP: <Link to="https://github.com/mr-fcharles/parametric_umap" target="_blank" rel="noopener noreferrer"><b><i>Parametric UMAP GitHub</i></b></Link></li>
                        </ul>
                        </p>
                        <p className="fs-1 text-justify"><b>Does WebCellHit support visualization of aligned data?</b><br/>
                         Yes, WebCellHit projects aligned data into a low-dimensional UMAP space for contextualization relative to CCLE and TCGA transcriptomic datasets.
                        </p>
                        <p className="fs-1 text-justify"><b>What types of cancer datasets can WebCellHit process?</b><br/>
                         WebCellHit is compatible with patient transcriptomic datasets and harmonizes them with TCGA and CCLE data for analysis and prediction.
                        </p>
                        <p className="fs-1 text-justify"><b>Is WebCellHit suitable for commercial cell line data?</b><br/>
                         No, WebCellHit is specifically designed for bulk RNA-seq data from patient tissues and not for data from commercial cell lines.
                        </p>
                        <p className="fs-1 text-justify"><b>How are hyperparameters optimized in WebCellHit’s pipeline?</b><br/>
                         Hyperparameters are optimized using tools like Optuna and a heuristic procedure based on neighborhood consistency to achieve robust alignment and reliable predictions.
                        </p>
                        <p className="fs-1 text-justify"><b>What publication or research supports the methods used in WebCellHit?</b><br/>
                         The methods are based on research outlined in <Link to="https://doi.org/10.1101/2024.03.28.586783" target="_blank" rel="noopener noreferrer"><b><i> Learning and actioning general principles of cancer cell drug sensitivity</i></b></Link> and other supporting studies cited in the workflow.
                        </p>
              </div>
        </div>
    </div>
</section>

    <Footer/>
   	</>
   )
}

export default FaqPage