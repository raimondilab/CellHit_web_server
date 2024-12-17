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

        const apiUrl = 'http://127.0.0.1:8003/graphql';
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

    if (urlTask) {
        // If URL parameter exists, fetch results
        setLoad(true);
        setTask(urlTask);
        getTaskResults(urlTask).then(() => setLoad(false));
    } else if (location.state) {
        // If state exists, use it directly
        const { taskID, data } = location.state;
        setTask(taskID || "");
        setResult(data || "");
        setLoad(false);
    } else {
        // Redirect if no valid data
        navigate('/');
    }

}, [location.search, navigate]);


  const [height, setHeight] = useState("500");

  useEffect(() => {
      if (result.height) {
        setHeight(Object.values(result.height));
      } else {
        setHeight("500");
      }
    }, [result.height]);

  const umapData = result.umap ? Object.values(result.umap) : []
  const inferenceData = result.table ? Object.values(result.table) : []
  const heatmapData = result.heatmap ? result.heatmap : "{}"

  console.log(inferenceData)

  const [tissue, setTissue] = useState("");
  const [source, setSource] = useState("");
  const [oncotreeCode, setOncotreeCode]  = useState("");

  const uniqueTissue = [...new Set(umapData.map(item => item.tissue))].sort();
  const uniqueSource = [...new Set(umapData.map(item => item.Source))].sort();
  const uniqueOncotree = [...new Set(umapData.map(item => item.oncotree_code))].sort();

  const handleTissue = (e) => setTissue(e.target.value);
  const handleSource = (e) => setSource(e.target.value);
  const handleOncotreeCode = (e) => setOncotreeCode(e.target.value);

// Function to filter UMAP data base on tissue, source or oncoTree code
const umapDataFiltered = useMemo(() => {
    return umapData.filter((item) => {
        const matchesTissue = !tissue || item.tissue === tissue;
        const matchesSource = !source || item.Source === source;
        const matchesOncotree = !oncotreeCode || item.oncotree_code === oncotreeCode;
        return matchesTissue && matchesSource && matchesOncotree;
    });
}, [tissue, source, oncotreeCode, umapData]);


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
                 <div className="col-md-2 mb-2">
                  <div className="bg-light rounded-3">
                    <div className="p-3">
                      <div className="mb-2">
                        <label htmlFor="tissue" className="form-label">Tissue&nbsp;</label>
                        <select className="form-select mb-3" name="tissue"  value={tissue}
                                    onChange={handleTissue}>
                          <option value=""></option>
                          {uniqueTissue.sort((a, b) => a - b).map(tissue => (
                            <option key={tissue} value={tissue}>
                              {tissue.charAt(0).toUpperCase() + tissue.slice(1)}
                            </option>
                          ))}
                        </select>
                        <label htmlFor="source" className="form-label">Source&nbsp;</label>
                        <select className="form-select mb-3" name="source"  value={source}
                                    onChange={handleSource}>
                          <option value=""></option>
                          {uniqueSource.sort((a, b) => a - b).map(source => (
                            <option key={source} value={source}>
                              {source.charAt(0).toUpperCase() + source.slice(1)}
                            </option>
                          ))}
                        </select>
                         <label htmlFor="oncotree_code" className="form-label">Oncotree Code&nbsp;</label>
                        <select className="form-select mb-3" name="oncotree_code"  value={oncotreeCode}
                                    onChange={handleOncotreeCode}>
                          <option value=""></option>
                          {uniqueOncotree.sort((a, b) => a - b).map(oncotreeCode => (
                            <option key={oncotreeCode} value={oncotreeCode}>
                              {oncotreeCode.charAt(0).toUpperCase() + oncotreeCode.slice(1)}
                            </option>
                          ))}
                        </select>
                       </div>
                    </div>
                  </div>
                  </div>
                    <div className="col-10 mb-1">
                    <div className="p-3 ">
                        <ScatterPlot  umapData={umapDataFiltered}/>
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