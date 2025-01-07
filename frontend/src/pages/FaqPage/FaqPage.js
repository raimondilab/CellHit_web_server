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
                         WebCellHit's modified Celligner method addresses data leakage, simplifies implementation with Python-based tools, improves normalization practices, and introduces a heuristic based on neighborhood consistency for better alignment quality.
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