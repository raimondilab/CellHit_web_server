[![DOI](https://zenodo.org/badge/645703655.svg)](https://doi.org/10.5281/zenodo.15309741)

<p align="center">
  <img 
    src="https://github.com/raimondilab/CLRP/blob/master/frontend/public/assets/images/1.webp" 
    alt="Badge del workflow sperimentale" 
    width="30%" 
  />
</p>



CellHit is a web server designed to provide detailed insights into patient cancer cell sensitivities to drugs. Using patient transcriptomic data, CellHit predicts drug sensitivities leveraging data from the GDSC and PRISM assays, enabling opportunities for targeted therapies and precision oncology. The platform integrates the computational pipeline from Learning and actioning general principles of cancer cell drug sensitivity, enhancing accessibility to state-of-the-art methods. CellHit also offers an extensive suite of tools for aligning, visualizing, and modeling patient cancer cells alongside well-characterized commercial cell lines. Crucially, the webserver abstracts away the necessity to set up the required running environment and most of the needed pre-processing and harmonization steps. Additionally, the web server allows users to explore pre-computed predictions and outputs for the entire TCGA dataset.

# Details on the computational workflow

![Badge del workflow sperimentale](https://cellhit.bioinfolab.sns.it/assets/images/web.webp)


The computational steps of the pipeline are illustrated in the figure above. To harmonize new bulk samples with TCGA data, the process begins by applying the ComBat method. The pipeline then ensures that all genes required for the CellHit models are present in the data. If any genes are missing, an ad-hoc model is automatically invoked to impute them. The data is subsequently aligned using a modified version of the Celligner method to ensure compatibility with cancer cell line transcriptomic profiles, which form the basis for model training. Finally, the processed data is used for inference with pretrained CellHit models. As a sanity check, the aligned data is projected into a low-dimensional UMAP space to contextualize it relative to CCLE and TCGA transcriptomic datasets. Further details on the methodologies and specific procedures in each step will be discussed in the respective subsections.
