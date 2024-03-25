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


const dt = useRef(null);
let data = null;

   const columns = [
       { field: 'anPosition', header: 'Position' },
       { field: 'unRefProtRe', header: 'Ref' }
   ];

   const multiSelectOptions = columns.map(col => ({ label: col.header, value: col.field }));
   const [visibleColumns, setVisibleColumns] = useState(columns);

   const onColumnToggle = (event) => {
    const selectedFieldNames = event.value;
    const updatedVisibleColumns = columns.filter(col => selectedFieldNames.includes(col.field));
    setVisibleColumns(updatedVisibleColumns);
   };

    const dynamicColumns = visibleColumns.map((col) => {
    return <Column key={col.field} field={col.field} header={col.header} sortable />;
   });

   const exportColumns = columns.map((col) => ({ title: col.header, dataKey: col.field }));

   const exportCSV = (selectionOnly) => {
        dt.current.exportCSV({ selectionOnly });
    };

   const exportPdf = () => {
    import('jspdf').then((jsPDF) => {
        import('jspdf-autotable').then(() => {
            const doc = new jsPDF.default();
            doc.autoTable(exportColumns, data);
            doc.save('data.pdf');
            });
        });
    };

    const exportExcel = async () => {
    const xlsx = await import('xlsx');
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAsExcelFile(excelBuffer, 'data');
    };

    const saveAsExcelFile = (buffer, fileName) => {
        import('file-saver').then((module) => {
            if (module && module.default) {
                let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
                let EXCEL_EXTENSION = '.xlsx';
                const data = new Blob([buffer], {
                    type: EXCEL_TYPE
                });

                module.default.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
            }
        });
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
              <InputText type="search" value={value || ''} onChange={(e) => onGlobalFilterChange(e)} placeholder="Global Search" />
          </span>
      </div>
      <div className="col" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <MultiSelect
              value={visibleColumns.map(col => col.field)}
              options={multiSelectOptions}
              onChange={onColumnToggle}
              optionLabel="label"
              optionValue="value"
              placeholder="Select Columns"
              display="chip"
              style={{ width: '200px', marginRight: '10px' }}
          />
          <Button type="button" icon="pi pi-file" className="p-button-rounded p-mr-2" onClick={() => exportCSV(false)} data-pr-tooltip="CSV" />
          <Button type="button" icon="pi pi-file-excel" className="p-button-success p-button-rounded p-mr-2" onClick={exportExcel} data-pr-tooltip="XLS" />
          <Button type="button" icon="pi pi-file-pdf" className="p-button-warning p-button-rounded" onClick={exportPdf} data-pr-tooltip="PDF" />
      </div>
  </div>
);

const onClickHandlerHelp = () => {
 Swal.fire({
  html: `
     <div className="container my-2">
     <h2 className="display-6 fw-bold mb-2">Help</h2>
     <p className="text-justify fs-1">We provides various filters that enable the visualization of the heatmap according to your specific requirements.
     Please note that the available filters may be updated based on the available results.</p>
     <p className="text-justify fs-1">For more information, please refer to the <a className="italic" href="/help/" target="_blank">help</a> page.</p>
     </div>
  `,
  showCloseButton: true,
});;
};

return (
    <>
      <Helmet>
        <title> CellHit</title>
      </Helmet>
      <Header />
      <section className="py-9">
        <div className="container">
        <div className="row mb-4">
            <div className="col-12">
             <h1 className="display-5 fw-bold mb-3 line">Explore
             <span className="badge">
                        <button type="button" className="btn btn-info"  onClick={onClickHandlerHelp}><ion-icon name="information-outline"></ion-icon></button>
                 </span>
             </h1>
            </div>
          </div>
          <div className="row mb-5">
            <div className="col-12">
               <h2 className="display-6 fw-bold mb-5">GDSC</h2>
               <Tooltip target=".export-buttons>button" position="bottom" />
               <DataTable ref={dt} value={data} paginator rows={5} removableSort header={header} filters={filters} onFilter={(e) => setFilters(e.filters)} tableStyle={{ minWidth: '50rem' }}>
                    {dynamicColumns}
                </DataTable>
            </div>
        </div>
          <div className="row mb-4">
            <div className="col-12">
               <h2 className="display-6 fw-bold mb-5">PRISM</h2>
               <Tooltip target=".export-buttons>button" position="bottom" />
               <DataTable ref={dt} value={data} paginator rows={5} removableSort header={header} filters={filters} onFilter={(e) => setFilters(e.filters)} tableStyle={{ minWidth: '50rem' }}>
                    {dynamicColumns}
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
