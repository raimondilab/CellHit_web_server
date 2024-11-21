import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
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

                    console.log(task)

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
                <TabPanel header="Celligner">
                <h4 className="display-6 fw-bold mb-5">Cell line<sup><Button icon="pi pi-info"
            onClick={() => show('top-right')} text size="small" className="btn-dialog" /></sup></h4>
                <div className="col-3">
                    <div className="p-3 rounded-3 shadow">
                        <div className="form-floating border rounded mb-3">
                            <select className="form-select form-select-transparent" id="lineage" data-control="lineage">
                            </select>
                            <label>Select lineage</label>
                        </div>
                        <div className="form-floating border rounded mb-3">
                            <select className="form-select form-select-transparent" id="subtypes"></select>
                            <label>Select subtype</label>
                        </div>
                        <div className="form-floating border rounded mb-3">
                            <select type="text" className="form-select form-select-lg" aria-label="color by">
                                <option value="Lineage" selected>Lineage</option>
                                <option value="Subtypes">Subtypes</option>
                                <option value="Origin">Origin</option>
                            </select>
                            <label>Color by</label>
                        </div>
                    </div>
                </div>
                <div class="col-9 mb-1">
                <div class="p-3 ">
                    <div id="scatter_plot"></div>
                </div>
               </div>
                </TabPanel>
                <TabPanel header="Inference">
                    <p className="m-0">
                        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam,
                        eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo
                        enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui
                        ratione voluptatem sequi nesciunt. Consectetur, adipisci velit, sed quia non numquam eius modi.
                    </p>
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