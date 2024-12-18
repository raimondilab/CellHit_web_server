import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import ScatterPlot from '../../components/ScatterPlot/ScatterPlot';
import InferenceTable from '../../components/InferenceTable/InferenceTable';
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
                query getTask {
                    getTask (taskId: "${taskID}") {
                        taskId
                        result
                    }
                }
            `
        };

        const apiUrl = 'https://test.bioinfolab.sns.it/graphql';
        const taskData = await axios.post(apiUrl, query);

        if (!taskData.data.data || taskData.data.errors) {
            Swal.fire({
                icon: "error",
                text: "Oops... An error has occurred!"
            });

        } else if (taskData) {

            const taskId = taskData.data.data.getTask.taskId;
            const result = taskData.data.data.getTask.result;

            setTask(taskId || "");
            setResult(result ||  "" );

        }
    } catch (error) {
        Swal.fire({
            icon: "error",
            text: error.message
        });
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

  useEffect(() => {
      if (result.height) {
        setHeight(Object.values(result.height));
      } else {
        setHeight("500");
      }
    }, [result.height]);

  const umapData = result ? result : "{}"
  const inferenceData = result.table ? Object.values(result.table) : []
  const heatmapData = result.heatmap ? result.heatmap : "{}"

  // Dialog settings
  const [position, setPosition] = useState('center');
  const [visible, setVisible] = useState(false);

  const show = (position) => {
    setPosition(position);
    setVisible(true);
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
         <h1 className="display-5 fw-bold line mb-4">Task id:{task}</h1>

          {/* Help message */}
          <Dialog header="CellHit" visible={visible} position={position} style={{ width: '50vw' }} onHide={() => setVisible(false)}
            draggable={false} resizable={false} breakpoints={{ '960px': '75vw', '641px': '100vw' }}>
            <p className="m-0 mb-1 text-justify">
              We trained explainable machine learning algorithms by employing cell
              line transcriptomics to predict the growth inhibitory potential of drugs. We used large
              language models (LLMs) to expand descriptions of the mechanisms of action (MOA) for
              each drug starting from available annotations, which were matched to the semantically
              closest pathways from reference knowledge bases.
            </p>
            <p className="m-0 mb-1 text-justify">For more information, please refer to the
              <Link className="" to="/about/" target="_blank"><b> about</b></Link> page.
            </p>
          </Dialog>
        </div>
        <div className="row">
            <TabView>
                <TabPanel header="UMAP">
                <h4 className="display-6 fw-bold mb-5">UMAP<sup><Button icon="pi pi-info"
                onClick={() => show('top-right')} text size="small" className="btn-dialog" /></sup></h4>
                 <div className="row">
                    <div className="col-12 mb-1">
                    <div className="p-3 ">
                        <ScatterPlot  jsonData={umapData}/>
                    </div>
                   </div>
               </div>
                </TabPanel>
                <TabPanel header="Inference">
                   <h4 className="display-6 fw-bold mb-5">Inference<sup><Button icon="pi pi-info"
                   onClick={() => show('top-right')} text size="small" className="btn-dialog" /></sup></h4>
                    <div className="row">
                      <div className="col-12 nopadding">
                          <InferenceTable inferenceData={inferenceData}/>
                    </div>
                    </div>
                </TabPanel>
                <TabPanel header="Heatmap">
                    <h4 className="display-6 fw-bold mb-5">Heatmap<sup><Button icon="pi pi-info"
                   onClick={() => show('top-right')} text size="small" className="btn-dialog" /></sup></h4>
                    <div className="row">
                      <div className="col-12 nopadding">
                        <div className="rounded-3 shadow img-fluid" style={{ height: height}}>
                         <HeatMap jsonData={heatmapData}/>
                    </div>
                    </div>
                    </div>
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