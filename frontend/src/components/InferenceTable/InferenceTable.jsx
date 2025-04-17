import React, { useState, useRef, useEffect, useMemo } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { MultiSelect } from 'primereact/multiselect';
import 'primeicons/primeicons.css';

const InferenceTable = ({
    inferenceData,
    setShapData,
    setDrugKey,
    setCellKey,
    setPredictedValue,
    setTitleDrug,
    setCellDatabase,
    taskID
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

    const API_BASE_URL = 'http://127.0.0.1:8003';

    const downloadFileFromAPI = async (taskId, format) => {
       const downloadUrl = `${API_BASE_URL}/api/export/${taskId}?format=${format}`;
       window.open(downloadUrl, '_blank');
    };

    const exportCSV = (taskId) => {
        downloadFileFromAPI(taskId, 'csv');
    };

    const exportExcel = (taskId) => {
        downloadFileFromAPI(taskId, 'excel');
    };

    const exportPdf = (taskId) => {
        downloadFileFromAPI(taskId, 'pdf');
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
                        options={uniqueDrugs} // <-- always shows all drugs
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
                <Button icon="pi pi-file" className="p-button-rounded p-mr-2" onClick={() => exportCSV(taskID)} />
                <Button icon="pi pi-file-excel" className="p-button-success p-button-rounded p-mr-2" onClick={() => exportExcel(taskID)} />
                <Button icon="pi pi-file-pdf" className="p-button-warning p-button-rounded" onClick={() => exportPdf(taskID)} />
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
