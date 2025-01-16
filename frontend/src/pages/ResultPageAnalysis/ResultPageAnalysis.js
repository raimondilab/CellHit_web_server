import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import ScatterPlot from '../../components/ScatterPlot/ScatterPlot';
import InferenceTable from '../../components/InferenceTable/InferenceTable';
import BarPlot from '../../components/BarPlot/BarPlot';
import DensityPlot from '../../components/DensityPlot/DensityPlot';
import HeatMap from '../../components/HeatMap/HeatMap';
import { Helmet } from 'react-helmet';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Link } from 'react-router-dom';
import { Dialog } from 'primereact/dialog';
import Swal from 'sweetalert2';
import axios from 'axios';
import { ProgressSpinner } from 'primereact/progressspinner';
import { TabView, TabPanel } from 'primereact/tabview';
import { getTaskResultsStep, getDistribution } from '../../ApiFunctions.js';

const ResultPageAnalysis = () => {

const navigate = useNavigate();
const location = useLocation();
const [load, setLoad] = useState(false);

const [task, setTask] = useState("");
const [result, setResult] = useState("");

// Get task results
async function getTaskResults(taskID) {
    try {
        const query = {
            query: `
                query getResults {
                     getResults (taskId: "${taskID}", step: "umap") {
                        taskId
                        status
                        result
                    }
                }
            `
        };

        const apiUrl = 'https://api.cellhit.bioinfolab.sns.it/graphql';
        const taskData = await axios.post(apiUrl, query);

        if (!taskData.data.data || taskData.data.errors) {
            Swal.fire({
                icon: "error",
                text: "Oops... An error has occurred!"
            });

        } else if (taskData) {

            const taskID = taskData.data.data.getResults.taskId;
            const newStatus = taskData.data.data.getResults.status;
            const result = taskData.data.data.getResults.result;

            setTask(taskID || "");
            setResult(result ||  "" );

           if (taskID === "PROGRESS" ) {

                Swal.fire({
                    icon: "info",
                     html: "The task is still in progress! <br> Currently, it is at this step: " + newStatus.replace(/\n/g, "<br>")
                });

               setLoad(false);

           } else if (taskID === "PENDING" ) {
              Swal.fire({
                icon: "info",
                text: "No result found!"
            });

             setLoad(false);
             navigate("/analysis/")
           }
        }
    } catch (error) {
        Swal.fire({
            icon: "error",
            text: error.message
        });
        setLoad(false);
    }
}


useEffect(() => {
    const query = new URLSearchParams(location.search);
    const urlTask = query.get('taskId');

    if (!location.state && urlTask) {

        // If URL parameter exists, fetch results
        setLoad(true);
        setTask(urlTask);
        getTaskResults(urlTask).then(() => setLoad(false));

    } else if (location.state && urlTask) {
        // If state exists, use it directly
        const { taskID, data } = location.state;
        setTask(taskID || "");
        setResult(data || "");
        setLoad(false);
    } else {
        // Redirect if no valid data
        navigate('/');
    }

}, [location.search, location.state, navigate]);


  const [height, setHeight] = useState("500");
  const umapData = result ? result : "{}"
  const [inferenceData, setInferenceData] = useState([]);
  const [heatmapData, setHeatmapData] = useState("{}");
  const [umapPlotData, setUmapPlotData] = useState("{}");
  const [umapType, setUmapType] = useState('oncotree');


useEffect(() => {
    if (umapType === 'oncotree') {
        setUmapPlotData(umapData.oncotree || "{}");
    } else if (umapType === 'tissue') {
        setUmapPlotData(umapData.tissue || "{}");
    }
}, [umapData, umapType]);


  // Dialog settings
  const [position, setPosition] = useState('center');
  const [visible, setVisible] = useState(false);
  const [positionIn, setPositionIn] = useState('center');
  const [visibleIn, setVisibleIn] = useState(false);
  const [positionHeat, setPositionHeat] = useState('center');
  const [visibleHeat, setVisibleHeat] = useState(false);

  const show = (position) => {
    setPosition(position);
    setVisible(true);
  };

  const showIn = (positionIn) => {
    setPositionIn(positionIn);
    setVisibleIn(true);
  };

  const showHeat = (positionHeat) => {
    setPositionHeat(positionHeat);
    setVisibleHeat(true);
  };

// Control Calls
const [callNumberTable, setCallNumberTable] = useState(1);
const [callNumberHeatmap, setCallNumberHeatmap] = useState(1);
const [activeTabIndex, setActiveTabIndex] = useState(0);

// Load data tab
const [tableLoadData, setTableLoadData] = useState(false);
const [heatmapLoadData, setHeatmapLoadData] = useState(false);
const [shapData, setShapData] = useState();
const [cellData, setCellData] = useState();
const [drugData, setDrugData] = useState();
const [titleDrug, setTitleDrug] = useState();
const [titleCell, setTitleCell] = useState();
const [predictedValue, setPredictedValue] = useState(0);
const [drugKey, setDrugKey] = useState();
const [cellKey, setCellKey] = useState();


useEffect(() => {
    const fetchData = async () => {
        try {
            const result_cell = await getDistribution(task, 'distrib_cells', cellKey);
            const result_drug = await getDistribution(task, 'distrib_drugs', drugKey);
            console.log(result_drug);
            setDrugData(result_drug);
            setCellData(result_cell);
            setTitleCell(cellKey);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    if (cellKey && drugKey && predictedValue){
        fetchData();
    }

}, [cellKey, drugKey, predictedValue]);

const handleColorBy = (e) => {
    let value = e.target.value;
    setUmapType(value);

    if (value === 'oncotree') {
        setUmapPlotData(umapData.oncotree || "{}");
    } else if (value === 'tissue') {
        setUmapPlotData(umapData.tissue || "{}");
    }
};

const handleTable = async () => {

    if (activeTabIndex === 1 && inferenceData.length === 0) {
        setTableLoadData(true);
        try {

          const tableData = await getTaskResultsStep(task, "table");

            if (tableData){
                 setInferenceData(tableData);
            } else {
                // No table data available
                setInferenceData([]);
            }
        } catch (error) {
            console.error("Error fetching table data:", error);
        } finally {
            setTableLoadData(false);
        }

        setCallNumberTable(callNumberTable + 1);
    }
}

const handleHeatmap = async () => {

    if (activeTabIndex === 2 && heatmapData === "{}") {

        setHeatmapLoadData(true);

        try {

            const heatmapDataJson = await getTaskResultsStep(task, "heatmap");

            if (heatmapDataJson){
                 setHeatmapData(heatmapDataJson.data? heatmapDataJson.data : "{}");
                 setHeight(heatmapDataJson.height? heatmapDataJson.height : "500");
            } else {
                // No heatmap data available
                setHeatmapData("{}");
            }
        } catch (error) {
            console.error("Error fetching table data:", error);
        } finally {
            setHeatmapLoadData(false);
        }

        setCallNumberHeatmap(callNumberHeatmap + 1);

    }
}

// Get tab data
useEffect(() => {

    if (activeTabIndex === 1 && callNumberTable === 1) {
         handleTable();
    }

    if (activeTabIndex === 2 && callNumberHeatmap === 1) {
        handleHeatmap();
    }

     // Reset plots
     setShapData();
     setCellKey();
     setDrugKey();
     setPredictedValue();
     setTitleDrug();

}, [activeTabIndex, callNumberTable, callNumberHeatmap]);

    return (
    <>
    <Helmet>
        <title>CellHit | Result</title>
      </Helmet>
      <Header/>
        { load &&  (
         <section className="py-9">
             <div className="container">
                 <div className="row mb-4">
                    <ProgressSpinner style={{width: '50px', height: '50px'}}
                    strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" />
                 </div>
              </div>
           </section>
        )}
        {(!load) && (
        <section className="py-9">
        <div className="container">
        <div className="row">
        <div className="col-md-12">
         <h1 className="display-5 fw-bold line mb-4">Task id:{task}</h1>

          {/* Help message */}
          <Dialog header="UMAP" visible={visible} position={position} style={{ width: '50vw' }} onHide={() => setVisible(false)}
            draggable={false} resizable={false} breakpoints={{ '960px': '75vw', '641px': '100vw' }}>
            <p className="m-0 mb-1 text-justify">
              UMAP 2D projection of Celligner alignment coloured by oncotree or tissue. Users can see the UMAP plot with colours representing the oncotree code or tissue name by selecting it in the "colour by" options field.
            </p>
            <p className="m-0 mb-1 text-justify">For more information, please refer to the
              <Link className="" to="/help/" target="_blank"><b> help</b></Link> page.
            </p>
          </Dialog>
          {/* Help message */}
          <Dialog header="Table" visible={visibleIn} position={positionIn} style={{ width: '50vw' }} onHide={() => setVisibleIn(false)}
            draggable={false} resizable={false} breakpoints={{ '960px': '75vw', '641px': '100vw' }}>
            <p className="m-0 mb-1 text-justify">
              The inference table displays the results from the CelHit pipeline for each sample. Users can filter the results by drugs or datasets. Furthermore, users can select the columns to visualize, export the data in various formats, and copy the URL of the results to share them.
              Besides, Users can click on a specific row to view the SHAP plot, which illustrates the importance of the top genes. The selected row will be highlighted with a blue background. To reset the selection and hide the SHAP plot, click the button featuring a replay icon.
            </p>
            <p className="m-0 mb-1 text-justify">For more information, please refer to the
              <Link className="" to="/help/" target="_blank"><b> help</b></Link> page.
            </p>
          </Dialog>
          {/* Help message */}
          <Dialog header="Heatmap" visible={visibleHeat} position={positionHeat} style={{ width: '50vw' }} onHide={() => setVisibleHeat(false)}
            draggable={false} resizable={false} breakpoints={{ '960px': '75vw', '641px': '100vw' }}>
            <p className="m-0 mb-1 text-justify">
              Heatmap of CellHit predictions of GDSC/PRISM drugs (columns) for each sample (rows). Cells contain the predicted lnIC50 values normalized by median subtraction.
            </p>
            <p className="m-0 mb-1 text-justify">For more information, please refer to the
              <Link className="" to="/help/" target="_blank"><b> help</b></Link> page.
            </p>
          </Dialog>
        </div>
        <div className="row">
            <TabView scrollable activeIndex={activeTabIndex} onTabChange={(e) => setActiveTabIndex(e.index)}>
                <TabPanel header="UMAP">
                <h4 className="display-6 fw-bold mb-5">UMAP<sup><Button icon="pi pi-info"
                onClick={() => show('top-right')} text size="small" className="btn-dialog" /></sup></h4>
                 <div className="row">
                 <div className="col-2 mb-1">
                  <div className="bg-light rounded-3">
                    <div className="p-3">
                      <div className="mb-2">
                        <label htmlFor="color" className="form-label">Color by&nbsp;</label>
                        <select className="form-select mb-3" name="color" onChange={handleColorBy} value={umapType}>
                            <option value="oncotree" defaultValue>Oncotree</option>
                            <option value="tissue">Tissue</option>
                        </select>
                        </div>
                      </div>
                     </div>
                    </div>
                    <div className="col-10 mb-1">
                    <div className="p-3 ">
                        <ScatterPlot  jsonData={umapPlotData}/>
                    </div>
                   </div>
               </div>
                </TabPanel>
                <TabPanel header="Inference">
                   <h4 className="display-6 fw-bold mb-5">Inference<sup><Button icon="pi pi-info"
                   onClick={() => showIn('top-right')} text size="small" className="btn-dialog" /></sup></h4>
                    { tableLoadData &&  (
                         <div className="row mb-5">
                            <ProgressSpinner style={{width: '50px', height: '50px'}}
                            strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" />
                         </div>
                    )}
                    { !tableLoadData &&  (
                       <div className="row mb-4">
                        <div className="col-12 nopadding">
                          <InferenceTable inferenceData={inferenceData}  setShapData={setShapData}  setTitleDrug={setTitleDrug}
                          setDrugKey={setDrugKey} setCellKey={setCellKey} setPredictedValue={setPredictedValue}/>
                         </div>
                       </div>
                     )}
                     { (!tableLoadData && shapData) && (
                        <div className="row">
                          <div className="col-12 col-md-4 nopadding">
                            <div className="rounded-3 shadow img-fluid">
                              <BarPlot jsonData={shapData} />
                            </div>
                          </div>
                          <div className="col-12 col-md-4 nopadding">
                            <div className="rounded-3 shadow img-fluid">
                              <DensityPlot title={titleDrug} data={drugData} predictionValue={predictedValue} />
                            </div>
                          </div>
                          <div className="col-12 col-md-4 nopadding">
                            <div className="rounded-3 shadow img-fluid">
                              <DensityPlot title={titleCell} data={cellData} predictionValue={predictedValue} />
                            </div>
                          </div>
                        </div>

                     )}
                </TabPanel>
                <TabPanel header="Heatmap">
                   <h4 className="display-6 fw-bold mb-5">Heatmap<sup><Button icon="pi pi-info"
                   onClick={() => showHeat('top-right')} text size="small" className="btn-dialog" /></sup></h4>
                    { heatmapLoadData &&  (
                         <div className="row mb-4">
                            <ProgressSpinner style={{width: '50px', height: '50px'}}
                            strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" />
                         </div>
                    )}
                    { !heatmapLoadData &&  (
                    <div className="row">
                      <div className="col-12 nopadding">
                        <div className="rounded-3 shadow img-fluid" style={{ height: height}}>
                         <HeatMap jsonData={heatmapData}/>
                        </div>
                      </div>
                    </div>
                    )}
                </TabPanel>
            </TabView>
            </div>
          </div>
        </div>
      </section>
       )}
    <Footer/>
    </>
  );
};

export default ResultPageAnalysis