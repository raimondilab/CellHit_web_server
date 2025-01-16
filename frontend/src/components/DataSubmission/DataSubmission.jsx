import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import axios from 'axios';
import HeaderTitleRunCellHit from '../../components/HeaderTitleRunCellHit/HeaderTitleRunCellHit';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';
import {useNavigate} from "react-router-dom";
import Papa from 'papaparse';

const DataSubmission = ({ setIsSubmit, setTaskId, setTaskStatus }) => {

  const navigate = useNavigate();
  const [position, setPosition] = useState('center');
  const [visible, setVisible] = useState(false);
  const initialValues = { taskId: "" };
  const [formValues, setFormValues] = useState(initialValues);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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

  const handleFormSubmit = async (e) => {
  e.preventDefault();

  if (submitted) return; // Prevent multiple submissions if already submitted

  setSubmitted(true); // Disable button after first click

  try {
    // Read file as text
    const fileContent = await selectedFile.text();

    // Validate file content
    await validateFile(fileContent);

    // If validation passes, send the file
    setIsSubmit(true);
    await sendFile();

  } catch (error) {
    // Handle validation or upload error
    setIsSubmit(false);
    setSubmitted(false); // Re-enable the button if there's an error

    Swal.fire({
      icon: "error",
      text: `Error: ${error.message}`,
    });
  }
};


// Get results by taskId
const handleFormSubmitTask = (e) => {

  e.preventDefault();

  setIsLoading(true);

  getTaskResults().finally(() => {
    setIsLoading(false);
  });
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

    const apiUrl = 'https://api.cellhit.bioinfolab.sns.it/graphql';
    const response = await axios.post(apiUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    if (response.data.errors) {
      setIsSubmit(false);
      setSubmitted(false);
      Swal.fire({
        icon: "error",
        text: "Oops... \n An error has occurred!"
      });
    } else {
      setTaskId(response.data.data.runAnalysis.taskId);
      console.log(response.data.data.runAnalysis.status)
      setTaskStatus(response.data.data.runAnalysis.status);
    }
  } catch (error) {
    setIsSubmit(false);
    setSubmitted(false);
    Swal.fire({
      icon: "error",
      text: error.message,
    });
  }
}

const handleDownload = () => {
        const downloadUrl = 'https://api.cellhit.bioinfolab.sns.it/api/download/GBM.csv';
        window.open(downloadUrl, '_blank');
};

// Get task results
async function getTaskResults() {
    try {
        const query = {
            query: `
                query getResults {
                    getResults (taskId: "${formValues.target}", step: "umap") {
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
           setIsLoading(false);
            Swal.fire({
                icon: "error",
                text: "Oops... An error has occurred!"
            });

        } else if (taskData) {

            const taskID = taskData.data.data.getResults.taskId;
            const newStatus = taskData.data.data.getResults.status;
            const result = taskData.data.data.getResults.result;

            if (taskID === "PROGRESS" ) {
                Swal.fire({
                    icon: "info",
                     html: "The task is still in progress! <br> Currently, it is at this step: " + newStatus.replace(/\n/g, "<br>")
                });
               setIsLoading(false);
            }

            if (newStatus === "SUCCESS"){

                   // Append the form values as query parameters to the URL
                   const url = new URL(window.location.href);
                   url.searchParams.set('taskId', taskID);

                   // Navigate to result page
                   navigate('/result/' + url.search, { state: { taskID: taskID, data: result } });

          } else if (taskID === "PENDING" ) {
              Swal.fire({
                icon: "info",
                text: "No result found!"
            });
             setIsLoading(false);
          }

        }
    } catch (error) {
        setIsLoading(false);
        Swal.fire({
            icon: "error",
            text: error.message
        });
    }
}

// Validation function (unchanged from previous example)
function validateFile(fileContent) {
  return new Promise((resolve, reject) => {
    const requiredColumns = ['TCGA_CODE', 'TISSUE', 'GENE'];

    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: function (result) {
        const { data, errors, meta } = result;

        if (errors.length > 0) {
          reject(new Error(`Error parsing the file: ${errors.map(err => err.message).join(', ')}`));
          return;
        }

        const columns = meta.fields;
        const missingColumns = requiredColumns.filter(col => !columns.includes(col));
        if (missingColumns.length > 0) {
          reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
          return;
        }

        const sampleColumns = columns.filter(col => !requiredColumns.includes(col));
        for (let row of data) {
          for (let col of sampleColumns) {
            const value = row[col];
            if (value && isNaN(parseFloat(value)) && value !== 'NaN') {
              reject(new Error(`All SAMPLE columns must have numeric values or NaN. Invalid value: ${value}`));
              return;
            }
          }
        }

        resolve(data);
      },
      error: function (error) {
        reject(new Error(`Error reading the file: ${error.message}`));
      }
    });
  });
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

                   <label htmlFor="search" className="label-btn" disabled={submitted}>
                  {submitted ?  <i className="pi pi-spin pi-spinner"></i> : 'Submit'}
                  </label>
                <button
                  id="search"
                  className="btn button shadow-none"
                  type="submit"
                  disabled={submitted} // Disable the button immediately after first submission
                ></button>
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
                e.g. 68e40208-b5c9-40cd-b686-43ef4da4115d
              </span>
            </div>

          </div>
        </Card>
        </div>

        <div className="row mt-5">
          <div className="col-md-12">
            <img
              tabIndex="1"
              src="/assets/images/web.png"
              className="img-fluid center-help mb-5"
              data-toggle="tooltip"
              data-placement="top"
              title="Click to zoom-in"
              alt="Learning Workflow"
              className="center-help shrink img-fluid mb-3"
            />
             <p className="fs-1 mb-3 text-justify mb-2">
              CellHit web server is a powerful tool that provides practical insights into cancer cell sensitivities to drugs using patient transcriptomic data (bulk RNA-seq). By utilizing data from the GDSC and PRISM assays,
              CellHit predicts drug sensitivities, thereby facilitating the development of targeted therapies and precision oncology.
              The web server also offers a wide range of tools for aligning, visualizing, and modelling patient transcriptomics
              alongside well-characterized commercial cell lines. For more information, please refer to the
              <Link className="" to="/about/" target="_blank" rel="noopener noreferrer"><b><i> about</i></b></Link> page.
            </p>

          </div>
        </div>
      </div>
    </>
  );
};

export default DataSubmission;
