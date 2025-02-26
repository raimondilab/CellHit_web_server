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
import JSZip from 'jszip';
import { ungzip } from 'pako';


const DataSubmission = ({ setIsSubmit, setTaskId, setTaskStatus, alignOnly, setAlignOnly }) => {

  const navigate = useNavigate();
  const [position, setPosition] = useState('center');
  const [visible, setVisible] = useState(false);
  const initialValues = { taskId: "" };
  const [formValues, setFormValues] = useState(initialValues);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState(["gdsc"]);


  const show = (position) => {
    setPosition(position);
    setVisible(true);
  };

const handleFileChange = async (e) => {
  const file = e.target.files[0];

  if (!file) return;

  const fileExtension = file.name.split('.').pop().toLowerCase();

  if (!['csv', 'zip', 'gz'].includes(fileExtension)) {
    Swal.fire({ icon: "error", text: "Invalid file format! Please upload a .csv, .zip, or .gz file." });
    return;
  }

  setSelectedFile(file);
};

const handleAlignment = () => {
  setAlignOnly(prevState => {
    const newState = prevState === "ON" ? "off" : "ON";

    if (newState === "ON") {
      Swal.fire({
        icon: "info",
        text: "You have chosen the alignment option only; please note that this does not incorporate the inference associated with the CellHit.",
      });
    }

    return newState;
  });
};


  const toggleDataset = (dataset) => {
    const newValues = values.includes(dataset)
      ? values.filter((v) => v !== dataset) // Remove dataset if already selected
      : [...values, dataset]; // Add dataset if not selected

    setValues(newValues);

    if (newValues.length > 1) {
      Swal.fire({
        icon: "info",
        text: "You have selected both GDSC and PRISM datasets. This may take longer to process.",
      });
    }
  };

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value.trim() });
  };

const handleFormSubmit = async (e) => {
  e.preventDefault();

  if (submitted) return;

  setSubmitted(true);

  try {
    let processedFile = selectedFile;

    if (selectedFile.name.endsWith('.zip')) {
      processedFile = await extractZip(selectedFile);
    } else if (selectedFile.name.endsWith('.gz')) {
      processedFile = await decompressGzip(selectedFile);
    } else {
      processedFile =  selectedFile;
    }

    if (!processedFile){
        setIsSubmit(false);
        setSubmitted(false);
        return;
    }

    const fileContent = await processedFile.text();
    await validateFile(fileContent)

    setIsSubmit(true);

    // Call send file function base on the task type
    alignOnly ? await sendFileAlignment(processedFile) : await sendFile(processedFile);

  } catch (error) {
    setIsSubmit(false);
    setSubmitted(false);

    Swal.fire({
      icon: "error",
      text: `Error: ${error.message}`,
    });
  }
};



async function extractZip(file) {
  const zip = await JSZip.loadAsync(file);
  const files = Object.keys(zip.files);

  if (files.length !== 1) {
   Swal.fire({
      icon: "error",
      text: `Error: Zip file must contain exactly one file.`,
    });
    return;
  }

  const fileName = files[0];
  const fileContent = await zip.files[fileName].async("blob");

  return new File([fileContent], fileName, { type: "text/csv" });
}

async function decompressGzip(file) {
  const arrayBuffer = await file.arrayBuffer();
  const decompressed = ungzip(new Uint8Array(arrayBuffer));

  return new File([decompressed], file.name.replace('.gz', ''), { type: "text/csv" });
}

// Get results by taskId
const handleFormSubmitTask = (e) => {

  e.preventDefault();

  setIsLoading(true);

  getTaskResults().finally(() => {
    setIsLoading(false);
  });
};


async function sendFileAlignment(file) {
  try {
    const formData = new FormData();
    formData.append("operations", JSON.stringify({
      query: `
        mutation run($file: Upload!) {
          runAlignment(file: $file) {
            taskId
            status
          }
        }
      `,
      variables: {
        file: null, // Will be filled by the file upload
      },
    }));

    formData.append("map", JSON.stringify({ 0: ["variables.file"] }));
    formData.append("0", file); // Add file to the request

    const apiUrl = 'https://test.bioinfolab.sns.it/graphql';
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




// Send file to back-end and get TaskId
async function sendFile(file) {
  try {
    const formData = new FormData();
    formData.append("operations", JSON.stringify({
      query: `
        mutation runAnalysis($file: Upload!, $datasets: [String!]!) {
          runAnalysis(file: $file, datasets: $datasets) {
            taskId
            status
          }
        }
      `,
      variables: {
        file: null, // Will be filled by the file upload
        datasets: values,
      },
    }));

    formData.append("map", JSON.stringify({ 0: ["variables.file"] }));
    formData.append("0", file); // Add file to the request

    const apiUrl = 'https://test.bioinfolab.sns.it/graphql';
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
                  <input type="file" id="databaseBtn" name="dataset" accept=".csv, .zip, .gz" required onChange={handleFileChange}/>
                  <label htmlFor="databaseBtn" className="label-btn me-2">
                    Upload dataset
                  </label>
                  <label
                      htmlFor="gdsc"
                      className={`label-btn gdsc-border me-01 ${values.includes("gdsc") ? "hover" : ""}`}
                      onClick={() => toggleDataset("gdsc")}
                    >
                      GDSC
                    </label>
                    <label
                      htmlFor="prism"
                      className={`label-btn prism-border me-2 ${values.includes("prism") ? "hover" : ""}`}
                      onClick={() => toggleDataset("prism")}
                    >
                      PRISM
                    </label>
                    <label
                      htmlFor="alignment"
                      className={`label-btn  me-2 ${alignOnly === "ON" ? "hover" : ""}`}
                      onClick={() => handleAlignment()}
                    >
                      ONLY alignment
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
                      required
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
                e.g. c9076d4e-ee2a-41dd-a76c-5730c12e7385
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
