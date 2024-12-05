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


import { TabView, TabPanel } from 'primereact/tabview';


const ResultPageAnalysis = () => {

const navigate = useNavigate();
const location = useLocation();
const [loadFunctionalInfo, setLoadFunctionalInfo] = useState(false);

const [task, setTask] = useState("");
const [result, setResult] = useState("");

useEffect(() => {

        const query = new URLSearchParams(location.search);
        const urlTask = query.get('taskId');

        if (!location.state) {

            // Set state from URL parameters
            setTask(urlTask);
            setLoadFunctionalInfo(true);

            if(urlTask){

//               sendExploreData(urlTarget, urlType)
//              .then(data => {
//                if (data) {
//                  setInfo(data.data || []);
//                  setLoadFunctionalInfo(false);
//                } else {
//                  console.log('No data received!');
//                  setInfo([]); // Handle empty or undefined data
//                  setLoadFunctionalInfo(false);
//                }
//              })
//              .catch(error => {
//                console.log('Error fetching data:', error);
//                setInfo([]); // Handle the error scenario
//                setLoadFunctionalInfo(false);
//              });


            } else {
            // If neither URL parameters nor location.state are present, navigate to home
            navigate('/');
        }

        } else if (location.state) {
            // Fallback to location.state if URL parameters are not present
            const state = location.state;
            setTask(state.taskID || "");
            setResult(state.data || "")
            setLoadFunctionalInfo(false);

        } else {
            // If neither URL parameters nor location.state are present, navigate to home
            navigate('/');
        }
    }, [location.search, location.state, navigate]);

  const [height, setHeight] = useState("819.26");


  //const data = JSON.parse(result.umap);

  const data =  {
    "0": { "UMAP1": -85.51314, "UMAP2": 1135.882, "tissue": "CNS/Brain", "oncotree_code": "GBM", "Source": "TCGA", "index": "TCGA-19-1787-01" },
    "1": { "UMAP1": -196.9247, "UMAP2": 1441.3835, "tissue": "Prostate", "oncotree_code": "ODG", "Source": "CCLE", "index": "ACH-000285" },
    "2": { "UMAP1": 110.69679, "UMAP2": -849.85754, "tissue": "Bowel", "oncotree_code": "COAD", "Source": "FPS", "index": "FPS_GB101-1_S3" },
    "3": { "UMAP1": 115.69679, "UMAP2": -869.85754, "tissue": "Bowel", "oncotree_code": "ODG", "Source": "FPS", "index": "FPS_GB101-2_S4" },
    "4": { "UMAP1": -902.91925, "UMAP2": -430.4279, "tissue": "Liver", "oncotree_code": "HCC", "Source": "FPS", "index": "FPS_GB101-2_S5" }
 };

  const umapData = Object.values(data);

  const [tissue, setTissue] = useState(null);
  const [source, setSource] = useState(null);
  const [oncotreeCode, setOncotreeCode]  = useState(null);

  const uniqueTissue = [...new Set(umapData.map(item => item.tissue))];
  const uniqueSource = [... new Set(umapData.map(item => item.Source))];
  const uniqueOncotree = [...new Set(umapData.map(item => item.oncotree_code))];

 const handleTissue = (e) => {
      setTissue(e.target.value);
  };

  const handleSource = (e) => {
      setSource(e.target.value);

  };

  const handleOncotreeCode = (e) => {
      setOncotreeCode(e.target.value);
  };

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


const jsonData = "{}"

    return (
    <>
    <Helmet>
        <title>CellHit | Result</title>
      </Helmet>
      <Header/>
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
                          <InferenceTable inferenceData={[]}/>
                    </div>
                    </div>
                </TabPanel>
                <TabPanel header="Heatmap">
                    <h4 className="display-6 fw-bold mb-5">Heatmap<sup><Button icon="pi pi-info"
                   onClick={() => show('top-right')} text size="small" className="btn-dialog" /></sup></h4>
                    <div className="row">
                      <div className="col-12 nopadding">
                        <div className="rounded-3 shadow img-fluid" style={{ height: height}}>
                         <HeatMap jsonData={jsonData}/>
                    </div>
                    </div>
                    </div>
                </TabPanel>
            </TabView>
            </div>
          </div>
        </div>
      </section>
    <Footer/>
    </>
  );
};

export default ResultPageAnalysis