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
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import 'animate.css';
import 'primeicons/primeicons.css';
import { MultiSelect } from 'primereact/multiselect';
import Swal from 'sweetalert2'


const ResultPage = () => {

const navigate = useNavigate();
const location = useLocation();

useEffect(() => {
   if (!location.state) {
     // Redirect to the home page
     navigate('/');
   }
}, [location, navigate]);


const state = location.state ||  [];
const data = state.data.data.databases || [];

const filteredData = data.filter(item => item.__typename === "Gdsc");

console.log(state)

const [gdscData, setGdscData] = useState(filteredData || []);
const [prismData, setPrismData] = useState([]);

const dt = useRef(null);
const dtPrism = useRef(null);

   gdscData.forEach(obj => delete obj["__typename"]);
   const columns = Object.keys(gdscData[0]);
   //const columnsPrism = Object.keys(prismData);

   console.log(gdscData)

   const multiSelectOptions = columns.map(col => ({ label: col, value: col }));
   //const multiSelectOptionsPrism = columns.map(col => ({ label: col, value: col }));

   const [visibleColumns, setVisibleColumns] = useState(columns);
   //const [visibleColumnsPrism, setVisibleColumnsPrism] = useState(columns);

   const onColumnToggle = (event) => {
    const selectedFieldNames = event.value;
    const updatedVisibleColumns = columns.filter(col => selectedFieldNames.includes(col));
    setVisibleColumns(updatedVisibleColumns);
   };

//   const onColumnTogglePrism = (event) => {
//    const selectedFieldNames = event.value;
//    const updatedVisibleColumnsPrism = columnsPrism.filter(col => selectedFieldNames.includes(col));
//    setVisibleColumnsPrism(updatedVisibleColumnsPrism);
//   };

   const dynamicColumns = visibleColumns.map((col) => {
    return <Column key={col} field={col} header={col} sortable />;
   });

//   const dynamicColumnsPrism = visibleColumnsPrism.map((col) => {
//    return <Column key={col} field={col} header={col} sortable />;
//   });

   const exportCSV = (tableRef, selectionOnly) => {
        tableRef.current.exportCSV({ selectionOnly });
    };

     const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        'country.name': { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        representative: { value: null, matchMode: FilterMatchMode.IN },
        status: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
    });

    const value = filters['global'] ? filters['global'].value : '';

    const onGlobalFilterChange = (event) => {
        const value = event.target.value;
        let _filters = { ...filters };

        _filters['global'].value = value;

        setFilters(_filters);
    };

  const header = (
  <div className="row align-items-center">
      <div className="col">
          <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText type="search" value={value || ''} onChange={(e) => onGlobalFilterChange(e)} placeholder="Search by drug" />
          </span>
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
          <Button type="button" icon="pi pi-file" className="p-button-rounded p-mr-2" onClick={() => exportCSV(dt, false)} data-pr-tooltip="CSV" />
      </div>
  </div>
);

//  const headerPrism = (
//  <div className="row align-items-center">
//      <div className="col">
//          <span className="p-input-icon-left">
//              <i className="pi pi-search" />
//              <InputText type="search" value={value || ''} onChange={(e) => onGlobalFilterChange(e)} placeholder="Search by drug" />
//          </span>
//      </div>
//      <div className="col" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
//          <MultiSelect
//              value={visibleColumnsPrism.map(col => col)}
//              options={multiSelectOptionsPrism}
//              onChange={onColumnTogglePrism}
//              optionLabel="label"
//              optionValue="value"
//              placeholder="Select Columns"
//              display="chip"
//              style={{ width: '200px', marginRight: '10px' }}
//          />
//          <Button type="button" icon="pi pi-file" className="p-button-rounded p-mr-2" onClick={() => exportCSV(dtPrism, false)} data-pr-tooltip="CSV" />
//      </div>
//  </div>
//);


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
               <DataTable stripedRows  ref={dt} value={gdscData} paginator rows={10} removableSort header={header} filters={filters} onFilter={(e) => setFilters(e.filters)} tableStyle={{ minWidth: '50rem' }}>
                    {dynamicColumns}
                </DataTable>
            </div>
        </div>
          <div className="row mb-4">
            <div className="col-12">
               <h2 className="display-6 fw-bold mb-5">PRISM</h2>
               <Tooltip target=".export-buttons>button" position="bottom" />

            </div>
        </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default ResultPage;
