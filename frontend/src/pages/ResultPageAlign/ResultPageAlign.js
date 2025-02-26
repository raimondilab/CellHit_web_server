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
import { getTaskResultsStep, getDistribution, getHeatmap } from '../../ApiFunctions.js';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { SelectButton } from 'primereact/selectbutton';
import { Tooltip } from 'primereact/tooltip';


const ResultAlign = () => {

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

        const apiUrl = 'https://test.cellhit.bioinfolab.sns.it/graphql';
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

  const umapData = result ? result : "{}"
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

  const show = (position) => {
    setPosition(position);
    setVisible(true);
  };


const handleColorBy = (e) => {
    let value = e.target.value;
    setUmapType(value);

    if (value === 'oncotree') {
        setUmapPlotData(umapData.oncotree || "{}");
    } else if (value === 'tissue') {
        setUmapPlotData(umapData.tissue || "{}");
    }
};

const handleClick = () => {
    navigator.clipboard.writeText(window.location.href);
  };

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
         <h1 className="display-5 fw-bold line mb-4">
        Task id: {task}
        <sup className="ms-1" tooltip="Click to copy the result link">
            <button className="btn-dialog"  onClick={handleClick} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <i tabIndex="1" className="pi pi-link" />
            </button>
        </sup>
      </h1>


          {/* Help message */}
          <Dialog header="UMAP" visible={visible} position={position} style={{ width: '50vw' }} onHide={() => setVisible(false)}
            draggable={false} resizable={false} breakpoints={{ '960px': '75vw', '641px': '100vw' }}>
            <p className="m-0 mb-1 text-justify">
              UMAP 2D projection of Celligner alignment coloured by oncotree or tissue. Users can see the UMAP plot with colours representing the oncotree code or tissue name by selecting it in the "colour by" options field.
            </p>
            <p className="m-0 mb-1 text-justify">For more information, please refer to the
              <Link className="" to="/help/#umap" target="_blank"><b> help</b></Link> page.
            </p>
          </Dialog>
        </div>
        <div className="row">
               <h4 className="display-6 fw-bold mb-5">UMAP<sup><Button icon="pi pi-info"
                onClick={() => show('top-right')} text size="small" className="btn-dialog" /></sup></h4>
                <div className="row">
                  <div className="col-12 col-sm-2  mb-1">
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
                  <div className="col-12 col-sm-10 mb-1">
                    <div className="p-3">
                      <ScatterPlot jsonData={umapPlotData}/>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </section>
       )}
    <Footer/>
    </>
  );
};

export default ResultAlign