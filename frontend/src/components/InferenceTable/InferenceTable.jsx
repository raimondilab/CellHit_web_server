import React, {  useState, useRef, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import {Column} from 'primereact/column';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { MultiSelect } from 'primereact/multiselect';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';


const InferenceTable = ({ inferenceData }) => {

  const handleClick = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const dt = useRef(null);

  const columnsDefault = [
      { field: 'DrugName', header: 'DrugName' },
      { field: 'index', header: 'index' },
      { field: 'prediction', header: 'prediction' },
      { field: 'std', header: 'std' },
      { field: 'QuantileScore', header: 'QuantileScore' },
      { field: 'PutativeTarget', header: 'PutativeTarget' },
      { field: 'TopGenes', header: 'TopGenes' }
    ];

 inferenceData.forEach(obj => delete obj["__typename"]);

 const columns = Object.keys(inferenceData[0] || [''])
     .filter(col => col) // Remove any undefined/null values
    .map(col => ({ field: col, header: col }));

 const multiSelectOptions = columns.map(col => ({ label: col.header, value: col.field }));
 const [visibleColumns, setVisibleColumns] = useState(columnsDefault);

 const [selectedDatasets, setSelectedDatasets] = useState([]);
 const [selectedDrugs, setSelectedDrugs] = useState([]);
 const [selectedColumns, setSelectedColumns] = useState(columnsDefault);

 const [dataset, setDataset] = useState();
 const datasets = [
        { label: 'GDSC', value: 'GDSC' },
        { label: 'Prism', value: 'Prism' }
        ];

     const [drugName, setDrugName] = useState();

    // Extract unique drugs
    const uniqueDrugs = [
    ...new Set(inferenceData.map(inference => inference.DrugName?.trim()))
    ].filter(drug => drug) // Remove any undefined/null values
    .map(drug => ({ label: drug, value: drug }));

   const onColumnToggle = (event) => {
    const selectedFieldNames = event.value;
    const updatedVisibleColumns = columns.filter(col => selectedFieldNames.includes(col.field));
     setVisibleColumns(updatedVisibleColumns);
     setSelectedColumns(event.value);
   };

  const [filteredData, setFilteredData] = useState(inferenceData);

  // Function to filter inferenceData based on selectedDrugs and selectedDatasets
  useEffect(() => {
    let data = [...inferenceData];

    if (selectedDatasets.length > 0) {
      data = data.filter((item) => selectedDatasets.includes(item.dataset));
    }

    if (selectedDrugs.length > 0) {
      data = data.filter((item) => selectedDrugs.includes(item.DrugName));
    }

    setFilteredData(data);
  }, [selectedDrugs, selectedDatasets, inferenceData]);


  const dynamicColumns = visibleColumns.map((col) => {
    return <Column key={col.field} field={col.field} header={col.header} sortable />;
 });

const exportCSV = (tableRef, selectionOnly) => {
        tableRef.current.exportCSV({ selectionOnly });
  };

  const exportExcel = async (dataToExport) => {
    const xlsx = await import('xlsx');
    const worksheet = xlsx.utils.json_to_sheet(dataToExport);
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

   const exportPdf = (dataToExport, columns) => {
    import('jspdf').then((jsPDF) => {
        import('jspdf-autotable').then(() => {
            const doc = new jsPDF.default('landscape');
            // Ensure columns are formatted as needed for jsPDF autoTable
            const formattedColumns = columns.map(col => ({title: col.header, dataKey: col.field}));
            doc.autoTable(formattedColumns, dataToExport);
            doc.save('data.pdf');
        });
    });
    };

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        source: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        drugName: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        sampleIndex: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
        putativeTarget: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        topLocalShapGenes: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] }
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
      <div className="col mb-2">
          <div className="flex justify-content-end">
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search" />
                    <InputText value={value || ''} onChange={onGlobalFilterChange} placeholder="Global Search" />
                </IconField>
            </div>
      </div>
      <div className="col" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <MultiSelect
                value={selectedDatasets} // Correctly tied to state
                options={datasets} // Options remain the same
                onChange={onColumnToggle} // Update state
                optionLabel="label"
                optionValue="value"
                display="chip"
                placeholder="Filter by dataset"
                style={{ width: '200px', marginRight: '10px' }}
            />
          <MultiSelect
                value={selectedDrugs} // Correctly tied to state
                options={uniqueDrugs} // Ensure uniqueDrugs has correct structure
                onChange={(e) => setSelectedDrugs(e.value)} // Update state
                optionLabel="label"
                optionValue="value"
                display="chip"
                placeholder="Filter by drug"
                style={{ width: '200px', marginRight: '10px' }}
            />
          <MultiSelect
                value={visibleColumns.map(col => col.field)}
                options={multiSelectOptions}
                onChange={onColumnToggle}
                optionLabel="label"
                optionValue="value"
                placeholder="Select columns"
                display="chip"
                style={{ width: '200px', marginRight: '10px' }}
            />
          <Button type="button" icon="pi pi-file" className="p-button-rounded p-mr-2" onClick={() => exportCSV(dt, false)} data-pr-tooltip="CSV" />
          <Button type="button" icon="pi pi-file-excel" className="p-button-success p-button-rounded p-mr-2" onClick={() => exportExcel(inferenceData)} data-pr-tooltip="XLS" />
          <Button type="button" icon="pi pi-file-pdf" className="p-button-warning p-button-rounded" onClick={() => exportPdf(inferenceData, columns)} data-pr-tooltip="PDF" />
          <Button type="button" icon="pi pi-link" severity="help"  className="p-button-rounded p-mr-2" onClick={handleClick}/>
      </div>
  </div>
);

return (
<>
 <DataTable ref={dt} value={filteredData} paginator rows={5}  emptyMessage="No inference found."
 removableSort header={header} filters={filters}   removableSort
 onFilter={(e) => setFilters(e.filters)} tableStyle={{ minWidth: '50rem' }}>
          {dynamicColumns}
  </DataTable>
</>
  )
}

export default InferenceTable