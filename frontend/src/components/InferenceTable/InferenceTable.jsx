import React, {  useState, useRef, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import {Column} from 'primereact/column';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { MultiSelect } from 'primereact/multiselect';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import 'primeicons/primeicons.css';

const InferenceTable = ({ inferenceData, setShapData, setDrugKey, setCellKey, setPredictedValue, setTitleDrug, setCellDatabase }) => {

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
    .filter(col => col && col !== 'ShapDictionary') // Remove any undefined/null values
    .map(col => ({ field: col, header: col }));

 const multiSelectOptions = columns.map(col => ({ label: col.header, value: col.field }));
 const [visibleColumns, setVisibleColumns] = useState(columnsDefault);

 const [selectedDatasets, setSelectedDatasets] = useState([]);
 const [selectedDrugs, setSelectedDrugs] = useState([]);
 const [selectedColumns, setSelectedColumns] = useState(columnsDefault);
 const [selectedRow, setSelectedRow] = useState(null);

    // Extract unique drugs
    const uniqueDrugs = [
      ...new Set(inferenceData.map((inference) => inference.DrugName?.trim()))
    ]
      .filter((drug) => drug) // Remove any undefined/null values
      .map((drug) => ({ label: drug, value: drug }))
      .sort((a, b) => a.label.localeCompare(b.label)); // Sort by the label property

    // Filter the drugs available only in the selected dataset
    const filteredDrugs = selectedDatasets.length > 0
    ? [...new Set(inferenceData
        .filter((inference) => selectedDatasets.includes(inference.dataset))
        .map((inference) => inference.DrugName?.trim())
    )]
        .filter((drug) => drug)
        .map((drug) => ({ label: drug, value: drug }))
        .sort((a, b) => a.label.localeCompare(b.label))
    : uniqueDrugs;

    // Extract unique dataset
    const datasets = [
      ...new Set(inferenceData.map((inference) => inference.dataset?.trim()))
    ]
      .filter((dataset) => dataset) // Remove any undefined/null values
      .map((dataset) => ({ label: dataset, value: dataset }))
      .sort((a, b) => a.label.localeCompare(b.label)); // Sort by the label property

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
    return (
        <Column
            key={col.field}
            field={col.field}
            header={col.header}
            sortable
            body={(rowData) => {
                const value = rowData[col.field];
                return typeof value === "number" ? value.toFixed(4) : value;
            }}
        />
    );
  });

 const onRowClick = (e) => {
    const clickedRowData = e.data;
    if (clickedRowData && clickedRowData.ShapDictionary) {
      setShapData(clickedRowData.ShapDictionary);
      setCellKey(clickedRowData.index);
      setDrugKey(clickedRowData.DrugID);
      setPredictedValue(clickedRowData.prediction);
      setTitleDrug(clickedRowData.DrugName);
      setCellDatabase(clickedRowData.dataset);
    }

    // Update the selected row
    setSelectedRow(clickedRowData);
  };

 const getRowClass = (rowData) => {
    return rowData === selectedRow ? 'highlighted-row' : '';
  };

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

    const handleResetData = (event) => {
        setSelectedRow([]);
        setShapData();
    };

  const header = (
  <div className="row align-items-center">
      <div className="col">
          <div className="flex justify-content-end">
                 <MultiSelect
                value={selectedDatasets} // Correctly tied to state
                options={datasets} // Options remain the same
                onChange={(e) => setSelectedDatasets(e.value)} // Update state
                optionLabel="label"
                optionValue="value"
                display="chip"
                placeholder="Filter by dataset"
                style={{ width: '200px', marginRight: '10px' }}
            />
          <MultiSelect
                value={selectedDrugs} // Correctly tied to state
                options={filteredDrugs} // Ensure uniqueDrugs has correct structure
                onChange={(e) => setSelectedDrugs(e.value)} // Update state
                optionLabel="label"
                optionValue="value"
                display="chip"
                placeholder="Filter by drug"
                style={{ width: '200px', marginRight: '10px' }}
            />

            </div>
      </div>
      <div className="col" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Button type="button" icon="pi pi-replay" text className="p-button-rounded p-mr-2"  onClick={handleResetData} tooltip="Unselect row"/>
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
 removableSort header={header} filters={filters}   removableSort  rowClassName={getRowClass}
 onFilter={(e) => setFilters(e.filters)} tableStyle={{ minWidth: '50rem' }}  onRowClick={onRowClick}>
          {dynamicColumns}
  </DataTable>
</>
  )
}

export default InferenceTable