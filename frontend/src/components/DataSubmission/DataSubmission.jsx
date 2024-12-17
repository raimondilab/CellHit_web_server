import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import axios from 'axios';
import HeaderTitleRunCellHit from '../../components/HeaderTitleRunCellHit/HeaderTitleRunCellHit';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';
import {useNavigate} from "react-router-dom";

const DataSubmission = ({ setIsSubmit, setTaskId, setTaskStatus }) => {

  const navigate = useNavigate();
  const [position, setPosition] = useState('center');
  const [visible, setVisible] = useState(false);
  const initialValues = { taskId: "" };
  const [formValues, setFormValues] = useState(initialValues);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setIsLoading] = useState(false);

  const [value, setValue] = useState("GDSC");


  const show = (position) => {
    setPosition(position);
    setVisible(true);
  };

 const handleFileChange = (e) => {
  const file = e.target.files[0];

  if (file) {
    setSelectedFile(file);
  }
  setSelectedFile(file);
};

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value.trim() });
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
    setIsLoading(true);
    getTaskResults();
  };


// Send file to back-end and get TaskId
async function sendFile() {
  try {
    const formData = new FormData();
    formData.append("operations", JSON.stringify({
      query: `
        mutation runAnalysis($file: Upload!, $dataset: String!) {
          runAnalysis(file: $file, dataset: $dataset) {
            taskId
            status
          }
        }
      `,
      variables: {
        file: null,  // Will be filled by the file upload
        dataset: value,
      },
    }));
    formData.append("map", JSON.stringify({ 0: ["variables.file"] }));
    formData.append("0", selectedFile);  // Add file to the request

    const apiUrl = 'https://test.bioinfolab.sns.it/graphql';
    const response = await axios.post(apiUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    if (response.data.errors) {
      setIsSubmit(false);
      Swal.fire({
        icon: "error",
        text: "Oops... \n An error has occurred!"
      });
    } else {
      setTaskId(response.data.data.runAnalysis.taskId);
      setTaskStatus(response.data.data.runAnalysis.status);
    }
  } catch (error) {
    setIsSubmit(false);
    Swal.fire({
      icon: "error",
      text: error.message,
    });
  }
}

const handleDownload = () => {
        const downloadUrl = 'http://127.0.0.1:8003/api/download/GBM.csv';
        window.open(downloadUrl, '_blank');
};

// Get task results
async function getTaskResults() {
    try {
        const query = {
            query: `
                query getTask {
                    getTask (taskId: "${formValues.target}") {
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

            const taskID = taskData.data.data.getTask.taskId;
            const result = taskData.data.data.getTask.result;

            if (taskID !== "PENDING"){

                   // Append the form values as query parameters to the URL
                   const url = new URL(window.location.href);
                   url.searchParams.set('taskId', taskID);

                   // Navigate to result page
                   navigate('/result/' + url.search, { state: { taskID: taskID, data: result } });
          } else {
              Swal.fire({
                icon: "info",
                text: "No result found!"
            });
             setIsLoading(false);
          }

        }
    } catch (error) {
        Swal.fire({
            icon: "error",
            text: error.message
        });
    }
}


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
                  <input type="file" id="databaseBtn" name="dataset" accept=".csv" required onChange={handleFileChange}/>
                  <label htmlFor="databaseBtn" className="label-btn me-2">
                    Upload dataset
                  </label>
                  <label
                      htmlFor="gdsc"
                      className={`label-btn gdsc-border me-01 ${value === "GDSC" ? "hover" : ""}`}
                      onClick={() => setValue("gdsc")}
                    >
                      GDSC
                    </label>
                    <label
                      htmlFor="prism"
                      className={`label-btn prism-border me-2 disabled ${value === "PRISM" ? "hover" : ""}`}
                      onClick={() => setValue("prism")} disabled
                    >
                      PRISM
                    </label>

                  <label htmlFor="search" className="label-btn">Submit</label>
                  <button id="search" className="btn button shadow-none" type="submit"></button>
                </div>
              </form>
              <span>
                Please click <b><Link onClick={handleDownload}>here</Link></b> for an example input file
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
              src="/assets/images/celligner_diagram.png"
              className="img-fluid center-help mb-5"
              data-toggle="tooltip"
              data-placement="top"
              title="Click to zoom-in"
              alt="Learning Workflow"
            />
             <p className="fs-1 mb-3 text-justify mb-2">
              We trained explainable machine learning algorithms by employing cell line transcriptomics to predict the growth inhibitory
              potential of drugs. We used large language models (LLMs) to expand descriptions of the mechanisms of action (MOA) for
               each drug starting from available annotations, which were matched to the semantically closest pathways from reference knowledge bases.
            </p>

          </div>
        </div>
      </div>
    </>
  );
};

export default DataSubmission;
