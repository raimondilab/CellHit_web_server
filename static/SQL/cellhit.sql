/** CREATE DATABASE STATEMENTS **/

CREATE DATABASE IF NOT EXISTS cellhit;
USE cellhit;

/** CREATE USER STATEMENTS **/

CREATE USER 'clrp'@'localhost' IDENTIFIED BY 'clrpmolecule24#';
GRANT SELECT ON *.* TO 'clrp'@'localhost';


/** CREATE TABLE STATEMENTS **/

CREATE TABLE gdsc (
   GdscID INT NOT NULL AUTO_INCREMENT,
   DrugName VARCHAR(400) NOT NULL,
   DrugID INT,
   Source VARCHAR(20),
   SampleIndex VARCHAR(40),
   Predictions DOUBLE,
   PredictionsStd DOUBLE,
   QuantileScore DOUBLE,
   ExperimentalMin DOUBLE,
   ExperimentalMedian DOUBLE,
   ExperimentalMax DOUBLE,
   ModelMSE DOUBLE,
   ModelCorr DOUBLE,
   transcr_CCLE_neigh VARCHAR(100),
   transcr_CCLE_neigh_CellLineName VARCHAR(100),
   transcr_CCLE_neigh_Oncotree VARCHAR(100),
   response_CCLE_neigh VARCHAR(100),
   response_CCLE_neigh_CellLineName VARCHAR(100),
   response_CCLE_neigh_Oncotree VARCHAR(100),
   transcr_TCGA_neigh VARCHAR(100),
   transcr_TCGA_neigh_diagnosis VARCHAR(100),
   transcr_TCGA_neigh_site VARCHAR(100),
   response_TCGA_neigh VARCHAR(100),
   response_TCGA_neigh_diagnosis VARCHAR(100),
   response_TCGA_neigh_site VARCHAR(100),
   PutativeTarget VARCHAR(100),
   TopLocalShapGenes,RecoveredTarget TEXT(3000)
   PRIMARY KEY (GdscID)
);

CREATE TABLE prism (
   prism_id INT NOT NULL AUTO_INCREMENT,
   DrugName VARCHAR(400) NOT NULL,
   DrugID INT,
   Source VARCHAR(20),
   SampleIndex VARCHAR(40),
   Predictions DOUBLE,
   PredictionsStd DOUBLE,
   QuantileScore DOUBLE,
   ExperimentalMin DOUBLE,
   ExperimentalMedian DOUBLE,
   ExperimentalMax DOUBLE,
   ModelMSE DOUBLE,
   ModelCorr DOUBLE,
   transcr_CCLE_neigh VARCHAR(100),
   transcr_CCLE_neigh_CellLineName VARCHAR(100),
   transcr_CCLE_neigh_Oncotree VARCHAR(100),
   response_CCLE_neigh VARCHAR(100),
   response_CCLE_neigh_CellLineName VARCHAR(100),
   response_CCLE_neigh_Oncotree VARCHAR(100),
   transcr_TCGA_neigh VARCHAR(100),
   transcr_TCGA_neigh_diagnosis VARCHAR(100),
   transcr_TCGA_neigh_site VARCHAR(100),
   response_TCGA_neigh VARCHAR(100),
   response_TCGA_neigh_diagnosis VARCHAR(100),
   response_TCGA_neigh_site VARCHAR(100),
   PutativeTarget VARCHAR(100),
   TopLocalShapGenes,RecoveredTarget TEXT(3000)
   PRIMARY KEY (prism_id)
);


