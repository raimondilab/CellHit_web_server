import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from 'react-helmet';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { DataTable } from 'primereact/datatable';
import {Column} from 'primereact/column';
import { Tooltip } from 'primereact/tooltip';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import 'animate.css';
import 'primeicons/primeicons.css';
import { MultiSelect } from 'primereact/multiselect';
import axios from 'axios';
import { AutoComplete } from "primereact/autocomplete";
import { Link } from 'react-router-dom';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';

import DensityPlotDrug from '../../components/DensityPlotDrug/DensityPlotDrug';
import BoxPlot from '../../components/BoxPlot/BoxPlot';
import Histogram from '../../components/Histogram/Histogram';
import ResidualPlot from '../../components/ResidualPlot/ResidualPlot';


const ResultPage = () => {

const navigate = useNavigate();
const location = useLocation();

useEffect(() => {
   if (!location.state) {
     navigate('/');
   }
}, [location, navigate]);

const state = location.state ||  [];
state.data = state.data || []
state.data.data = state.data.data || [];
const data = state.data.data.databases || [];
const gdscDrugs = require('../../gdsc_drugs.json');
const prismDrugs = require('../../prism_drugs.json');


const filteredData = data.filter(item => item.__typename === "Gdsc");
const filteredDataPrism = data.filter(item => item.__typename === "Prism");

const apiUrl = 'https://api.cellhit.bioinfolab.sns.it/graphql';

const [gdscData, setGdscData] = useState(filteredData || []);
const [prismData, setPrismData] = useState(filteredDataPrism || []);
const [loading, setLoading] = useState(false);
const [loadingSta, setLoadingSta] = useState(false);
const [loadingPrism, setLoadingPrism] = useState(false);
const [loadingPrismSta, setLoadingPrismSta] = useState(false);
const [value, setValue] = useState('');
const [totalRecords, setTotalRecords] = useState(4060342);
const [totalRecordsPrism, setTotalRecordsPrism] = useState(17958038);
const [gdscDataSta, setGdscDataSta] = useState([]);
const [prismDataSta, setPrismDataSta] = useState([]);

const [selectedDrug, setSelectedDrug] = useState(null);
const [filteredDrugs, setFilteredDrugs] = useState(null);
const [filteredDrugsPrism, setFilteredDrugsPrism] = useState(null);
const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Dialog settings
  const [position, setPosition] = useState('center');
  const [visible, setVisible] = useState(false);

const show = (position) => {
    setPosition(position);
    setVisible(true);
  };

const [lazyState, setLazyState] = useState({
    first: 0,
    rows: 10,
    page: 1,
    sortField: null,
    sortOrder: null,
    filters: {drugName: { value: null, matchMode: FilterMatchMode.CONTAINS }}
});

const [lazyStatePrism, setLazyStatePrism] = useState({
    first: 0,
    rows: 10,
    page: 1,
    sortField: null,
    sortOrder: null,
    filters: {drugName: { value: null, matchMode: FilterMatchMode.CONTAINS }}
});

const dt = useRef(null);
const dtPrism = useRef(null);

   gdscData.forEach(obj => delete obj["__typename"]);
   prismData.forEach(obj => delete obj["__typename"]);

   const columns = Object.keys(gdscData[0] || ['']);
   const columnsPrism = Object.keys(prismData[0] || ['']);

   const multiSelectOptions = columns.map(col => ({ label: col, value: col }));
   const multiSelectOptionsPrism = columnsPrism.map(col => ({ label: col, value: col }));

   const [visibleColumns, setVisibleColumns] = useState(columns);
   const [visibleColumnsPrism, setVisibleColumnsPrism] = useState(columnsPrism);

   const onColumnToggle = (event) => {
    const selectedFieldNames = event.value;
    const updatedVisibleColumns = columns.filter(col => selectedFieldNames.includes(col));
    setVisibleColumns(updatedVisibleColumns);
   };

   const onColumnTogglePrism = (event) => {
    const selectedFieldNames = event.value;
    const updatedVisibleColumnsPrism = columnsPrism.filter(col => selectedFieldNames.includes(col));
    setVisibleColumnsPrism(updatedVisibleColumnsPrism);
   };

   const dynamicColumns = visibleColumns.map((col) => (
   <Column
          key={col}
          field={col}
          header={col}
          body={(rowData) => {
            const value = rowData[col];

            if (col === "DrugName" && typeof value === "string") {
              return value.toUpperCase();
            }

            if (col === "gdscId" || col === "drugId" ) {
              return value;
            }

            return typeof value === "number" ? value.toExponential(2) : value;
          }}
        />
    ));

   const dynamicColumnsPrism = visibleColumnsPrism.map((col) => {
    return <Column key={col} field={col} header={col}
        body={(rowData) => {
            const value = rowData[col];

            if (col === "DrugName" && typeof value === "string") {
              return value.toUpperCase();
            }

            if (col === "prismId" || col === "drugId" ) {
              return value;
            }

            return typeof value === "number" ? value.toExponential(2) : value;
          }}

     />;
   });

   const exportCSV = (tableRef, selectionOnly) => {
        tableRef.current.exportCSV({ selectionOnly });
    };


async function sendExploreData(value) {

  const query = {
    query: `
    query getGDSC($offset: Int!, $limit: Int!, $drug: String) {
        gdsc(pagination: {offset: $offset, limit: $limit, drug: $drug}) {
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
    }
    `,
    variables: {
        offset: 0,
        limit: 10,
        drug: selectedDrug ? selectedDrug.name : null,
    }

    };
    try {

        setLoading(true);
        let navigateData = null;
        navigateData = await axios.post(apiUrl, query);

        if (navigateData.data.data.gdsc){
            setGdscData(navigateData.data.data.gdsc );
            setTotalRecords(14197);
        }

         setLoading(false);

    } catch (error) {
        setLoading(false);
    }
}


const onFilterPrism = (event) => {

    let _filteredDrugsP;

   if (!event.query.trim().length) {
        _filteredDrugsP = [...prismDrugs];
    } else {
        _filteredDrugsP = prismDrugs.filter(drug => {
             return drug.name.toString().toLowerCase().startsWith(event.query.toString().toLowerCase());
      });
    }

   setFilteredDrugsPrism(_filteredDrugsP);

};

async function getGDSCData(page, elementForPage, selectedDrug) {

  const offset = page * elementForPage;

  const query = {
    query: `
    query getGDSC($offset: Int!, $limit: Int!, $drug: String) {
        gdsc(pagination: {offset: $offset, limit: $limit, drug: $drug}) {
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
    }
    `,
    variables: {
        offset: offset,
        limit: elementForPage,
        drug: selectedDrug ? selectedDrug.name : null,
    }

};


  try {
    setLoading(true);
    const response = await axios.post(apiUrl, query);

    if (response.data.data.gdsc){
         setGdscData(response.data.data.gdsc);

         if (!selectedDrug.name){
             setTotalRecords(4060342);
         }
    }
    setLoading(false);


  } catch (error) {
    setLoading(false);
    console.error(error);
  }
}

const onPage = (event) => {
   setLoading(true);
   setLazyState(event);
   getGDSCData(event.page, event.rows, selectedDrug);
};

const onFilter = (event) => {

   let _filteredDrugs;

   if (!event.query.trim().length) {
        _filteredDrugs = [...gdscDrugs];
    } else {
        _filteredDrugs = gdscDrugs.filter(drug => {
             return drug.name.toString().toLowerCase().startsWith(event.query.toString().toLowerCase());
      });
    }

   setFilteredDrugs(_filteredDrugs);

};

// Get drug data by drug - filter button
const handleDrugSelection = (event) => {

   if (selectedDrug){

      // Get drug specific data for table
      sendExploreData(selectedDrug.name.toString());

      // Get drug specific data for statistical visualization
      setGdscDataSta([]);
      getGDSCDataToSta(selectedDrug.name.toString());

      setLazyState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: null,
        sortOrder: null,
        filters: null
     })
   }
};

// Get specif drug data for statical visualization
async function getGDSCDataToSta(value) {

const query = {
        query: `
            query getGDSCDrug{
                gdscDrug(drug: "${value}") {
                    drugName
                    source
                    sampleIndex
                    predictions
                    quantileScore
                    experimentalMedian
                }
            }
        `
    };
    try {
        setLoadingSta(true);

        let navigateData = null;
        navigateData = await axios.post(apiUrl, query);

        if (navigateData.data.data.gdscDrug){
            setGdscDataSta(navigateData.data.data.gdscDrug );
        }

        setLoadingSta(false);

    } catch (error) {
        setLoadingSta(false);
    }

}

// Get specif drug data for statical visualization
async function getPRISMDataToSta (value) {

   const query = {
        query: `
            query getPRISMDrug{
                prismDrug(drug: "${value}") {
                    drugName
                    source
                    sampleIndex
                    predictions
                    quantileScore
                    experimentalMedian
                }
            }
        `
    };
    try {

        setLoadingPrismSta(true);

        let navigateData = null;
        navigateData = await axios.post(apiUrl, query);
        console.log(navigateData)

        if (navigateData.data.data.prismDrug){
            setPrismDataSta(navigateData.data.data.prismDrug);
        }

         setLoadingPrismSta(false);

    } catch (error) {
        setLoadingPrismSta(false);
    }

}


async function getDataDrugPrism(value) {


    const query = {
        query: `
            query getPrism($offset: Int!, $limit: Int!, $drug: String) {
                 prism(pagination: {offset: $offset, limit: $limit, drug: $drug}) {
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
            `,
            variables: {
                offset: 0,
                limit: 10,
                drug: value ? value : null,
            }
        };
    try {

        setLoadingPrism(true);
        let navigateData = null;
        navigateData = await axios.post(apiUrl, query);


        if (navigateData.data.data.prism){
            setPrismData(navigateData.data.data.prism );
            setTotalRecordsPrism(14197);

        }

         setLoadingPrism(false);

    } catch (error) {
        setLoading(false);
    }
}

const handleDrugSelectionPrism = (event) => {

   if (value){

      // Get specific drug table
      getDataDrugPrism(value.name.toString());

      // Get specific drug statical visualization
      setPrismDataSta([]);
      getPRISMDataToSta(value.name.toString());

      setLazyStatePrism({
        first: 0,
        rows: 10,
        page: 1,
        sortField: null,
        sortOrder: null,
        filters: null
     })
   }
};


async function getPRISMData(page, elementForPage, value) {

  const offset = page * elementForPage;

  const query = {
    query: `
    query getPrism($offset: Int!, $limit: Int!, $drug: String) {
        prism(pagination: {offset: $offset, limit: $limit, drug: $drug}) {
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
    `,
    variables: {
        offset: offset,
        limit: elementForPage,
        drug: value ? value.name : null,
    }
};

  try {
    setLoadingPrism(true);
    const response = await axios.post(apiUrl, query);

      if (response.data.data.prism){
            setPrismData(response.data.data.prism);

            if(!value.name){
                setTotalRecordsPrism(17958038);
            }
     }

    setLoadingPrism(false);

  } catch (error) {
    setLoadingPrism(false);
    console.error(error);
  }
}

const onPagePrism = (event) => {
   setLoadingPrism(true);
   setLazyStatePrism(event);
   getPRISMData(event.page, event.rows, value);
};


const handleResetData = (event) => {
   setLoading(true);
   setLazyState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: null,
        sortOrder: null,
        filters: null
     });
   setSelectedDrug("");
   getGDSCData(0, 10);
   setLoading(false);
   setTotalRecords(4060342);
};

const handleResetDataPrism = (event) => {
   setLoadingPrism(true);
   setLazyStatePrism({
        first: 0,
        rows: 10,
        page: 1,
        sortField: null,
        sortOrder: null,
        filters: null
     });
   setValue("");
   getPRISMData(0, 10);
   setLoadingPrism(false);
   setTotalRecordsPrism(17958038);
};


const header = (
  <div className="row align-items-center">
      <div className="col">
         <AutoComplete field="name"  value={selectedDrug} suggestions={filteredDrugs} completeMethod={onFilter}
          onChange={(e) => setSelectedDrug(e.value)}  forceSelection  placeholder="Filter by drug" />
         <Button type="button"  icon="pi pi-filter" className="p-button-rounded p-mr-2 ms-1"
              onClick={handleDrugSelection} />
      </div>
      <div className="col" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <MultiSelect
              value={visibleColumns.map(col => col)}
              options={multiSelectOptions}
              onChange={onColumnToggle}
              optionLabel="label"
              optionValue="value"
              placeholder="Select Columns"
              display="chip"
              style={{ width: '200px', marginRight: '10px' }}
          />
          <Button type="button" text icon="pi pi-download" className="p-button-rounded p-mr-2" onClick={() => exportCSV(dt, false)} data-pr-tooltip="CSV" />
          <Button type="button" icon="pi pi-refresh" text  onClick={handleResetData}/>
      </div>
  </div>
);

  const headerPrism = (
  <div className="row align-items-center">
      <div className="col">
         <AutoComplete field="name"  value={value} suggestions={filteredDrugsPrism} completeMethod={onFilterPrism}
          onChange={(e) => setValue(e.value)}  forceSelection  placeholder="Filter by drug" />
         <Button type="button"  icon="pi pi-filter" className="p-button-rounded p-mr-2 ms-1"
              onClick={handleDrugSelectionPrism} />
      </div>
      <div className="col" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <MultiSelect
              value={visibleColumnsPrism.map(col => col)}
              options={multiSelectOptionsPrism}
              onChange={onColumnTogglePrism}
              optionLabel="label"
              optionValue="value"
              placeholder="Select Columns"
              display="chip"
              style={{ width: '200px', marginRight: '10px' }}
          />
          <Button type="button" text icon="pi pi-download" className="p-button-rounded p-mr-2" onClick={() => exportCSV(dtPrism, false)} data-pr-tooltip="CSV" />
          <Button type="button" icon="pi pi-refresh" text  onClick={handleResetDataPrism}/>
      </div>
  </div>
);


return (
    <>
      <Helmet>
        <title> CellHit | Explore</title>
      </Helmet>
      <Header />
      <section className="py-9">
        <div className="container">
        <div className="row mb-4">
            <div className="col-12">
               {/* Help message */}
          <Dialog header="Explore" visible={visible} position={position} style={{ width: '50vw' }} onHide={() => setVisible(false)}
            draggable={false} resizable={false} breakpoints={{ '960px': '75vw', '641px': '100vw' }}>
            <p className="m-0 mb-1 text-justify">
              This page provides access to pre-computed pharmacogenomic predictions for the entire TCGA dataset, using data from two major databases: GDSC, which includes 686 cell lines and 286 drugs, and PRISM, which features 887 cell lines and 6,337 drugs.
            </p>
            <p className="m-0 mb-1 text-justify">   You can view the prediction tables for both GDSC and PRISM. To find results for a specific drug, enter its name in the filter field and click the adjacent button to apply the filter. Once you apply the filter, a statistical visualization for the selected drug will appear, along with a description of the visualization. Additionally, you have the option to download either the complete or filtered prediction tables.
            </p>
            <p className="m-0 mb-1 text-justify">For more information, please refer to the
              <Link className="" to="/help/#explore" target="_blank"><b> help</b></Link> page.
            </p>
          </Dialog>
             <h1 className="display-5 fw-bold mb-3 line">Explore
             <sup><Button icon="pi pi-info"
                onClick={() => show('top-right')} text size="small" className="btn-dialog" /></sup>
             </h1>
            </div>
          </div>
           <TabView scrollable activeIndex={activeTabIndex} onTabChange={(e) => setActiveTabIndex(e.index)}>
          <TabPanel header="GDSC">
           <div className="row mb-5">
            <div className="col-12">
               <Tooltip target=".export-buttons>button" position="bottom" />
               <DataTable stripedRows lazy ref={dt} value={gdscData} paginator first={lazyState.first}
               rows={lazyState.rows}  rowsPerPageOptions={[10, 25, 50, 100]} totalRecords={totalRecords}  header={header}
               onPage={onPage} dataKey="gdscId"
                    paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                    currentPageReportTemplate="{first} to {last} of {totalRecords}"
                    loading={loading} tableStyle={{ minWidth: '50rem' }}>
                    {dynamicColumns}
                </DataTable>
               </div>
            </div>
           {loadingSta && (
                      <div className="row mb-5">
                        <h4 className="display-6 fw-bold mb-3">{selectedDrug?.name}</h4>
                        <div className="col-md-12">
                          <div className="alert alert-info" role="alert">
                            <strong>Hold tight!</strong> We're generating visual insights for <em>{selectedDrug?.name}</em>.
                            This may take a few seconds depending on the data size.
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedDrug && gdscDataSta.length > 0 && !loadingSta && (
                      <>
                        <div className="row mb-4">
                          <div className="col-12">
                            <h4 className="display-6 fw-bold mb-3">
                              {selectedDrug.name} – Model Predictions Overview
                            </h4>
                            <p className="text-muted">
                              Explore how the model predictions compare to experimental data and quantify the performance of the drug sensitivity prediction.
                            </p>
                          </div>
                        </div>

                        <div className="row g-4 mb-5">
                          {[BoxPlot, Histogram, DensityPlotDrug].map((Component, idx) => (
                            <div key={idx} className="col-12 col-md-6 col-lg-4">
                              <div className="p-3 rounded-3 shadow bg-white h-100">
                                <Component data={gdscDataSta} selectedDrug={selectedDrug} />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="row mb-5">
                          <div className="col-12">
                            <h5 className="fw-semibold mb-2">Residual Analysis</h5>
                            <p className="text-muted small mb-3">
                              Assess how well the model fits the data by inspecting the residuals (difference between predicted and observed sensitivity).
                            </p>
                            <div className="p-3 rounded-3 shadow bg-white">
                              <ResidualPlot data={gdscDataSta} />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
             </TabPanel>
             <TabPanel header="PRISM">
                <div className="row mb-4">
                <div className="col-12">
                   <Tooltip target=".export-buttons>button" position="bottom" />
                     <DataTable stripedRows lazy ref={dtPrism} value={prismData} paginator first={lazyStatePrism.first}  rows={lazyStatePrism.rows}
                     dataKey="prismId" onPage={onPagePrism}
                      paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                        currentPageReportTemplate="{first} to {last} of {totalRecords}" rowsPerPageOptions={[10, 25, 50, 100]}
                     totalRecords={totalRecordsPrism}  header={headerPrism}  loading={loadingPrism}  tableStyle={{ minWidth: '50rem' }}>
                        {dynamicColumnsPrism}
                    </DataTable>
                    </div>
                  </div>
                  {loadingPrismSta && (
                      <div className="row mb-5">
                        <h4 className="display-6 fw-bold mb-3">{value?.name}</h4>
                        <div className="col-md-12">
                          <div className="alert alert-info" role="alert">
                            <strong>Hold tight!</strong> We're generating visual insights for <em>{value?.name}</em>.
                            This may take a few seconds depending on the data size.
                          </div>
                        </div>
                      </div>
                    )}

                    {value && prismDataSta.length > 0 && !loadingPrismSta && (
                      <>
                        <div className="row mb-4">
                          <div className="col-12">
                            <h4 className="display-6 fw-bold mb-3">
                              {value.name} – Model Predictions Overview
                            </h4>
                            <p className="text-muted">
                              Explore how the model predictions compare to experimental data and quantify the performance of the drug sensitivity prediction.
                            </p>
                          </div>
                        </div>
                        <div className="row g-4 mb-5">
                          {[BoxPlot, Histogram, DensityPlotDrug].map((Component, idx) => (
                            <div key={idx + "prism"} className="col-12 col-md-6 col-lg-4">
                              <div className="p-3 rounded-3 shadow bg-white h-100">
                                <Component data={prismDataSta} selectedDrug={value} />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="row mb-5">
                          <div className="col-12">
                            <h5 className="fw-semibold mb-2">Residual Analysis</h5>
                            <p className="text-muted small mb-3">
                              Assess how well the model fits the data by inspecting the residuals (difference between predicted and observed sensitivity).
                            </p>
                            <div className="p-3 rounded-3 shadow bg-white">
                              <ResidualPlot data={prismDataSta} />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
              </TabPanel>
           </TabView>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default ResultPage;
