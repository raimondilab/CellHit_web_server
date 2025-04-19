import React, { useState, useRef, useEffect, useMemo } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { MultiSelect } from 'primereact/multiselect';
import 'primeicons/primeicons.css';
import Swal from 'sweetalert2';
import { saveAs } from 'file-saver';
import { utils, write } from 'xlsx';

const InferenceTable = ({
    inferenceData,
    setShapData,
    setDrugKey,
    setCellKey,
    setPredictedValue,
    setTitleDrug,
    setCellDatabase
}) => {

    const dt = useRef(null);

    // Process data
    inferenceData.forEach(obj => {
        delete obj["__typename"];
        if (obj.DrugName) obj.DrugName = obj.DrugName.toUpperCase(); // Force uppercase DrugName

        // Process SHAP
        if (obj.ShapDictionary && typeof obj.ShapDictionary === 'object') {
            const posKeys = [];
            const negKeys = [];
            for (const [key, value] of Object.entries(obj.ShapDictionary)) {
                if (typeof value === 'number') {
                    if (value > 0) posKeys.push(`${key}:${value.toExponential(2)}`);
                    else if (value < 0) negKeys.push(`${key}:${value.toExponential(2)}`);
                }
            }
            obj.ShapPos = posKeys.join(',');
            obj.ShapNeg = negKeys.join(',');
        } else {
            obj.ShapPos = '';
            obj.ShapNeg = '';
        }
    });

    const columnsDefault = [
        { field: 'DrugName', header: 'DrugName' },
        { field: 'index', header: 'index' },
        { field: 'prediction', header: 'prediction' },
        { field: 'std', header: 'std' },
        { field: 'QuantileScore', header: 'QuantileScore' },
        { field: 'PutativeTarget', header: 'PutativeTarget' },
        { field: 'TopGenes', header: 'TopGenes' },
        { field: 'ShapPos', header: 'ShapPos' },
        { field: 'ShapNeg', header: 'ShapNeg' }
    ];

    const columns = Object.keys(inferenceData[0] || {}).filter(col => col && col !== 'ShapDictionary')
        .map(col => ({ field: col, header: col }));

    const multiSelectOptions = columns.map(col => ({ label: col.header, value: col.field }));
    const [visibleColumns, setVisibleColumns] = useState(columnsDefault);
    const [selectedColumns, setSelectedColumns] = useState(columnsDefault);
    const [selectedRow, setSelectedRow] = useState(null);
    const [selectedDatasets, setSelectedDatasets] = useState([]);
    const [selectedDrugs, setSelectedDrugs] = useState([]);

    const uniqueDrugs = useMemo(() => {
    const filteredByDataset = selectedDatasets.length > 0
        ? inferenceData.filter(item => selectedDatasets.includes(item.dataset))
        : inferenceData;

    return [
        ...new Set(filteredByDataset.map(inf => inf.DrugName?.trim()))
    ]
        .filter(drug => drug)
        .map(drug => ({ label: drug.toUpperCase(), value: drug }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }, [selectedDatasets, inferenceData]);

    const datasets = [
        ...new Set(inferenceData.map((inf) => inf.dataset?.trim()))
    ].filter(dataset => dataset)
        .map(dataset => ({ label: dataset, value: dataset }))
        .sort((a, b) => a.label.localeCompare(b.label));

    const [filteredData, setFilteredData] = useState(inferenceData);

    useEffect(() => {
        let data = [...inferenceData];

        if (selectedDatasets.length > 0) {
            data = data.filter(item => selectedDatasets.includes(item.dataset));
        }

        if (selectedDrugs.length > 0) {
            data = data.filter(item => selectedDrugs.includes(item.DrugName));
        }

        setFilteredData(data);
    }, [selectedDatasets, selectedDrugs, inferenceData]);

    const onColumnToggle = (event) => {
        const selectedFieldNames = event.value;
        const updatedVisibleColumns = columns.filter(col => selectedFieldNames.includes(col.field));
        setVisibleColumns(updatedVisibleColumns);
        setSelectedColumns(event.value);
    };

    const onRowClick = (e) => {
        const clickedRow = e.data;
        if (clickedRow && clickedRow.ShapDictionary) {
            setShapData(clickedRow.ShapDictionary);
            setCellKey(clickedRow.index);
            setDrugKey(clickedRow.DrugID);
            setPredictedValue(clickedRow.prediction);
            setTitleDrug(clickedRow.DrugName);
            setCellDatabase(clickedRow.dataset);
        }
        setSelectedRow(clickedRow);
    };

    const getRowClass = (rowData) => {
        return rowData === selectedRow ? 'highlighted-row' : '';
    };

    const exportCSV = (tableRef, selectionOnly) => {
        tableRef.current.exportCSV({ selectionOnly });
    };

    // Function to prepare data for export
    const prepareDataForExport = (data) => {
        return data.map(item => {
            return visibleColumns.map(col => item[col.field]); // Only export visible columns
        });
    };

    const exportExcel = async (dataToExport) => {
    const xlsx = await import('xlsx');

    const uniquePatients = getUniquePatients(dataToExport);

    const visibleDrugNames = [
        ...new Set(dataToExport.map(item => item.DrugName))
    ].filter(Boolean);

    const firstVisibleDrug = visibleDrugNames[0] || 'Unknown';

    Swal.fire({
        icon: 'info',
        title: 'Excel Export Notice',
        html: `
            <p>A total of <strong>${uniquePatients.length}</strong> patient rows (based on <code>index</code>) for <strong>${firstVisibleDrug}</strong> will be exported. </p>
            <p>If you want to export data for another drug, please apply the <strong>Drug</strong> filter first.</p>
        `,
        confirmButtonText: 'OK'
    }).then(() => {

        const worksheet = xlsx.utils.json_to_sheet(uniquePatients);


        const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };


        const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });


        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });


        saveAs(blob, 'data_export.xlsx');
    });
};


    const exportPdf = (dataToExport, columns) => {
        setTimeout(() => {
            import('jspdf').then((jsPDF) => {
                import('jspdf-autotable').then(() => {
                    const doc = new jsPDF.default('landscape', 'pt');
                    const formattedColumns = columns.map(col => ({
                        title: col.header,
                        dataKey: col.field
                    }));
                    doc.autoTable({
                        columns: formattedColumns,
                        body: dataToExport,
                        styles: { fontSize: 8 }, // reduce font size
                        margin: { top: 50 }
                    });
                    doc.save('data.pdf');
                });
            });
        }, 100); // Defer execution
    };

    const getUniquePatients = (data) => {
        const seen = new Set();
        return data.filter(item => {
            if (seen.has(item.index)) return false;
            seen.add(item.index);
            return true;
        });
    };

    const handleClick = () => {
        navigator.clipboard.writeText(window.location.href);
    };

    const handleResetData = () => {
        setSelectedRow([]);
        setShapData();
    };

    const dynamicColumns = visibleColumns.map((col) => (
        <Column
            key={col.field}
            field={col.field}
            header={col.header}
            sortable
            body={(rowData) => {
                const value = rowData[col.field];
                if (col.field === "DrugName" && typeof value === "string") {
                    return value.toUpperCase();
                }
                return typeof value === "number" ? value.toExponential(2) : value;
            }}
        />
    ));

    const header = (
        <div className="row align-items-center">
            <div className="col">
                <div className="flex justify-content-end">
                    <MultiSelect
                        value={selectedDatasets}
                        options={datasets}
                        onChange={(e) => setSelectedDatasets(e.value)}
                        optionLabel="label"
                        optionValue="value"
                        display="chip"
                        placeholder="Filter by dataset"
                        style={{ width: '200px', marginRight: '10px' }}
                    />
                    <MultiSelect
                        value={selectedDrugs}
                        options={uniqueDrugs}
                        onChange={(e) => setSelectedDrugs(e.value)}
                        optionLabel="label"
                        optionValue="value"
                        display="chip"
                        placeholder="Filter by drug"
                        style={{ width: '200px', marginRight: '10px' }}
                    />
                </div>
            </div>
            <div className="col" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <Button type="button" icon="pi pi-replay" text className="p-button-rounded p-mr-2" onClick={handleResetData} tooltip="Unselect row" />
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
                <Button icon="pi pi-file" className="p-button-rounded p-mr-2" onClick={() => exportCSV(dt, false)} />
                <Button icon="pi pi-file-excel" className="p-button-success p-button-rounded p-mr-2" onClick={() => exportExcel(filteredData)} />
                <Button
                    icon="pi pi-file-pdf"
                    className="p-button-warning p-button-rounded"
                    onClick={() => {
                        const uniquePatients = getUniquePatients(filteredData);
                        const visibleDrugNames = [
                            ...new Set(filteredData.map(item => item.DrugName))
                        ].filter(Boolean);

                        const firstVisibleDrug = filteredData.find(item => item.DrugName)?.DrugName || 'Unknown';

                        Swal.fire({
                            icon: 'info',
                            title: 'PDF Export Notice',
                            html: `
                                <p>A total of <strong>${uniquePatients.length}</strong> patient rows (based on <code>index</code>) for <strong>${firstVisibleDrug}</strong> will be exported. </p>
                                <p>If you want to export data for another drug, please apply the <strong>Drug</strong> filter first.</p>
                            `,
                            confirmButtonText: 'OK'
                        }).then(() => {
                            exportPdf(uniquePatients, visibleColumns);
                        });
                    }}
                />
                <Button icon="pi pi-link" severity="help" className="p-button-rounded p-mr-2" onClick={handleClick} />
            </div>
        </div>
    );

    return (
        <DataTable
            ref={dt}
            value={filteredData}
            paginator
            rows={5}
            emptyMessage="No inference found."
            removableSort
            header={header}
            rowClassName={getRowClass}
            onRowClick={onRowClick}
            className="inference"
            tableStyle={{ minWidth: '50rem' }}
        >
            {dynamicColumns}
        </DataTable>
    );
};

export default InferenceTable;
