import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import ScatterPlot from '../../components/ScatterPlot/ScatterPlot';
import InferenceTable from '../../components/InferenceTable/InferenceTable';
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
            setLoadFunctionalInfo(false);

        } else {
            // If neither URL parameters nor location.state are present, navigate to home
            navigate('/');
        }
    }, [location.search, location.state, navigate]);


  // Dialog settings
  const [position, setPosition] = useState('center');
  const [visible, setVisible] = useState(false);

  const show = (position) => {
    setPosition(position);
    setVisible(true);
  };

  // Select lineage
  const mapLineage = require('../../map_lineage.json');
  const [lineage, setLineage ] = useState("");
  const [subtype, setSubtype] = useState("");
  const [subtypesByLineage, setSubtypesByLineage ] = useState([]);
  const uniqueLineage = [...new Set(mapLineage.map(lineage => lineage.lineage))];

  // Set lineage
  const handleLineage = (e) => {

  const selectedLineage = e.target.value;
  setLineage(selectedLineage);

  // Filter subtypes based on the selected lineage and remove duplicates
  const filteredSubtypes = mapLineage
    .filter(item => item.lineage === selectedLineage)
    .map(item => item.subtype);

  setSubtypesByLineage([...new Set(filteredSubtypes)]); // Update subtypes state
};

 // Set subtype
 const handleSubtype = (e) => {
  setSubtype(e.target.value);
 }


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
                <TabPanel header="Cell line">
                <h4 className="display-6 fw-bold mb-5">Cell line<sup><Button icon="pi pi-info"
                onClick={() => show('top-right')} text size="small" className="btn-dialog" /></sup></h4>
                 <div className="row">
                <div className="col-md-2 mb-2">
                  <div className="bg-light rounded-3">
                    <div className="p-3">
                      <div className="mb-2">
                        <label htmlFor="lineage" className="form-label">Lineage&nbsp;</label>
                        <select className="form-select mb-3" name="lineage"  value={lineage}
                                    onChange={handleLineage}>
                          <option value=""></option>
                          {uniqueLineage.sort((a, b) => a - b).map(lineage => (
                            <option key={lineage} value={lineage}>
                              {lineage.charAt(0).toUpperCase() + lineage.slice(1)}
                            </option>
                          ))}
                        </select>
                        <label htmlFor="subtype" className="form-label">Subtype&nbsp;</label>
                        <select className="form-select mb-3" name="subtype" value={subtype}
                                    onChange={handleSubtype} >
                        {subtypesByLineage.sort((a, b) => a - b).map(subtype => (
                            <option key={subtype} value={subtype}>
                              {subtype.charAt(0).toUpperCase() + subtype.slice(1)}
                            </option>
                          ))}

                        </select>
                        <label htmlFor="color" className="form-label">Color by&nbsp;</label>
                        <select className="form-select mb-3" name="color" >
                            <option value="lineage" defaultValue>Lineage</option>
                            <option value="subtypes">Subtypes</option>
                            <option value="origin">Origin</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  </div>
                <div className="col-10 mb-1">
                <div className="p-3 ">
                    <ScatterPlot/>
                </div>
                  </div>
               </div>
                </TabPanel>
                <TabPanel header="Inference">
                   <h4 className="display-6 fw-bold mb-5">Inference<sup><Button icon="pi pi-info"
                   onClick={() => show('top-right')} text size="small" className="btn-dialog" /></sup></h4>
                    <div className="row">
                      <div className="col-12">
                          <InferenceTable inferenceData={[]}/>
                    </div>
                    </div>
                </TabPanel>
                <TabPanel header="Heatmap">
                    <p className="m-0">
                        At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti
                        quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in
                        culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.
                        Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus.
                    </p>
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