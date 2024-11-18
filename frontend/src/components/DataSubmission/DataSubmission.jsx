import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import axios from 'axios';
import HeaderTitleRunCellHit from '../../components/HeaderTitleRunCellHit/HeaderTitleRunCellHit';
import Swal from 'sweetalert2';

const DataSubmission = ({ setIsSubmit, setTaskId, setTaskStatus }) => {

  const [position, setPosition] = useState('center');
  const [visible, setVisible] = useState(false);
  const initialValues = { target: "" };
  const [formValues, setFormValues] = useState(initialValues);
  const [loading, setIsLoading] = useState(false);

  const show = (position) => {
    setPosition(position);
    setVisible(true);
  };

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value.toUpperCase().trim() });
  };

  // Send file to analysis
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setIsSubmit(true);
    sendFile();
  };

  // Get results by taskId
  const handleFormSubmitTask = (e) => {
    e.preventDefault();
  };


// Send file to back-end and get TaskId
async function sendFile() {

 try {
   const query = {
              query: `
               query getTaskId {
                  getTaskId {
                    taskId
                    status
                  }
                }
              `
            };

    let taskData = null;
    const apiUrl = 'http://127.0.0.1:8003/graphql';

    taskData = await axios.post(apiUrl, query);

    if (!taskData) {
                setIsSubmit(false);
                Swal.fire({
                    icon: "info",
                    text: "No results found!"
                });
                return;
    } else if (taskData.data.errors) {
                setIsSubmit(false);
                Swal.fire({
                    icon: "error",
                    text: "Oops... \n An error has occurred!"
                });
                return;
            } else if (taskData) {
                setTaskId(taskData.data.data.getTaskId.taskId);
                setTaskStatus(taskData.data.data.getTaskId.status);
            }
    } catch (error) {
            setIsSubmit(false);
            Swal.fire({
                icon: "error",
                text: error.message
            });
        }
};

  return (
    <>
      <HeaderTitleRunCellHit />

      <div className="row">
        <div className="col-md-12">
          <Card title="Enter your data or reload previous results by task ID">
          <div className="container col-12 d-flex flex-wrap flex-md-nowrap justify-content-start align-items-start">

            {/* First Column */}
            <div className="col-md-6 mb-3">
              <form id="search-box" onSubmit={handleFormSubmit} className="mb-2">
                <div className="form-group">
                  <input type="file" id="databaseBtn" name="dataset" required />
                  <label htmlFor="databaseBtn" className="label-btn me-2">
                    Upload dataset
                  </label>
                  <label htmlFor="search" className="label-btn">Submit</label>
                  <button id="search" className="btn button shadow-none" type="submit"></button>
                </div>
              </form>
              <span>
                Please click <b><a href="/static/clrp/upload_example_LRRK2.csv" download>here</a></b> for an example input file
              </span>
            </div>

            {/* Second Column */}
            <div className="col-md-6 position-relative pt-0 justify-content-start">
              <form onSubmit={handleFormSubmitTask} style={{ display: 'flex', flexDirection: 'column', width: '100%' }} className="mb-3">
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <span className="p-input-icon-left" style={{ width: '100%', position: 'relative' }}>
                    <InputText
                      className="p-input text-lg"
                      name="target"
                      value={formValues.target}
                      onChange={onChangeHandler}
                      style={{ width: '100%' }}
                      placeholder="Task ID"
                    />
                    <Button
                      type="submit"
                      className="btn-form p-button-rounded p-button-secondary search-button"
                      style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>
                      {loading ? (
                        <i className="pi pi-spin pi-spinner"></i>
                      ) : (
                        <i className="pi pi-search"></i>
                      )}
                    </Button>
                  </span>
                </div>
              </form>
              <span>
                e.g. 14049663-6257-4a1f-81e5-563c714e90af
              </span>
            </div>

          </div>
        </Card>
        </div>

        <div className="row mt-4">
          <div className="col-md-12">
            <img
              tabIndex="1"
              src="/assets/images/learning_workflow.png"
              className="img-fluid center-help mb-5"
              data-toggle="tooltip"
              data-placement="top"
              title="Click to zoom-in"
              alt="Learning Workflow"
            />
            <h5 className="display-6 fw-bold mb-3">Instructions</h5>
            <p className="fs-1 mb-5 text-justify mb-2">
              We extracted a list of all the UniProt accession numbers from the file containing the FASTA sequence for
              the entire human proteome database. Next, we extracted and mapped each residue's structural
              and functional annotation layers. Following that, we calculated the contacts for each PDB and AF structure.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default DataSubmission;
