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

const filteredData = data.filter(item => item.__typename === "Gdsc");
const filteredDataPrism = data.filter(item => item.__typename === "Prism");

const apiUrl = 'https://api.cellhit.bioinfolab.sns.it/graphql';

const [gdscData, setGdscData] = useState(filteredData);
const [prismData, setPrismData] = useState(filteredDataPrism);
const [loading, setLoading] = useState(false);
const [loadingPrism, setLoadingPrism] = useState(false);
const [value, setValue] = useState('');
const [totalRecords, setTotalRecords] = useState(4060342);
const [totalRecordsPrism, setTotalRecordsPrism] = useState(17803038);


const [selectedDrug, setSelectedDrug] = useState(null);
const [filteredDrugs, setFilteredDrugs] = useState(null);

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

   const columns = Object.keys(gdscData[0]);
   const columnsPrism = Object.keys(prismData[0]);

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

   const dynamicColumns = visibleColumns.map((col) => {
    return <Column key={col} field={col} header={col}  />;
   });

   const dynamicColumnsPrism = visibleColumnsPrism.map((col) => {
    return <Column key={col} field={col} header={col}  />;
   });

   const exportCSV = (tableRef, selectionOnly) => {
        tableRef.current.exportCSV({ selectionOnly });
    };


async function sendExploreData(value) {
    const query = {
        query: `
            query getGDSCDrug{
                gdscDrug(drug: "${value}") {
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
        `
    };
    try {

        setLoading(true);
        let navigateData = null;
        navigateData = await axios.post(apiUrl, query);

        if (navigateData.data.data.gdscDrug){

            setGdscData(navigateData.data.data.gdscDrug );
            setTotalRecords(navigateData.data.data.gdscDrug.length)

        }

         setLoading(false);

    } catch (error) {
        setLoading(false);
    }
}


const onDrugFilterChange = (event) => {
    setValue(event.target.value);

};

async function getGDSCData(page, elementForPage) {

  const offset = page * elementForPage;

  const query = {
    query: `
    query getGDSC($offset: Int!, $limit: Int!) {
        gdsc(pagination: {offset: $offset, limit: $limit}) {
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
        limit: elementForPage
    }
};


  try {
    setLoading(true);
    const response = await axios.post(apiUrl, query);

    console.log(response)

    if (response.data.data.gdsc){
         setGdscData(response.data.data.gdsc);
    }
    setLoading(false);

  } catch (error) {
    setLoading(false);
    console.error(error);
  }
}

const onPage = (event) => {
   setLoading(true);
   setTotalRecords(4060342);
   setLazyState(event);
   getGDSCData(event.page, event.rows);
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

const handleDrugSelection = (event) => {

   if (selectedDrug){

      sendExploreData(selectedDrug.name);

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


async function getPRISMData(page, elementForPage) {

  const offset = page * elementForPage;

  const query = {
    query: `
    query getPRISM($offset: Int!, $limit: Int!) {
        prism(pagination: {offset: $offset, limit: $limit}) {
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
        limit: elementForPage
    }
};

  try {
    setLoadingPrism(true);
    const response = await axios.post(apiUrl, query);
    setPrismData(response.data.data.prism || Object.keys(prismData[0]));
    setLoadingPrism(false);

  } catch (error) {
    setLoadingPrism(false);
    console.error(error);
  }
}

const onPagePrism = (event) => {
   setLoadingPrism(true);
   setTotalRecordsPrism(17803038);
   setLazyStatePrism(event);
   getPRISMData(event.page, event.rows);
};


const handleResetData = (event) => {
   setLoading(true);
   setTotalRecords(4060342);
   setLazyState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: null,
        sortOrder: null,
        filters: null
     });
   getGDSCData(0, 10);
   setSelectedDrug(null);
};

const header = (
  <div className="row align-items-center">
      <div className="col">
         <AutoComplete field="name"  value={selectedDrug} suggestions={filteredDrugs} completeMethod={onFilter}
          onChange={(e) => setSelectedDrug(e.value)}  forceSelection  placeholder="Search by drug"/>
         <Button type="button"  icon="pi pi-filter" className="p-button-rounded p-mr-2 ms-xxl-1"
              onClick={handleDrugSelection} label="Filter"/>
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
          <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText type="search" value={value} onChange={(e) => onDrugFilterChange(e)} placeholder="Search by drug" disabled/>
          </span>
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
          <Button type="button" label="Export" icon="pi pi-download" className="p-button-rounded p-mr-2" onClick={() => exportCSV(dtPrism, false)} data-pr-tooltip="CSV" />
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
             <h1 className="display-5 fw-bold mb-3 line">Explore
             </h1>
            </div>
          </div>
          <div className="row mb-5">
            <div className="col-12">
               <h2 className="display-6 fw-bold mb-5">GDSC</h2>
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
          <div className="row mb-4">
            <div className="col-12">
               <h2 className="display-6 fw-bold mb-5">PRISM</h2>
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
        </div>
      </section>
      <Footer />
    </>
  );
};

export default ResultPage;
