import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

const DataSubmission = () => {
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Your submit logic here
  };

  return (
    <>
      <div className="row">
        <div className="col-md-12 mb-5">
          <h2 className="display-6 fw-bold mb-5">Run analysis<sup><Button icon="pi pi-info"
            onClick={() => show('top-right')} text size="small" className="btn-dialog" /></sup></h2>
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
          <Card title="Enter your data or reload previous results by task ID">
          <div className="container col-12 d-flex flex-wrap flex-md-nowrap justify-content-start align-items-start">

            {/* First Column */}
            <div className="col-md-6 mb-3">
              <form id="search-box" method="post" className="mb-2" action="/result/">
                <div className="form-group">
                  <input type="file" id="databaseBtn" name="dataset" />
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
              <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%' }} className="mb-3">
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
                e.g. rs1042522-2f3677b5-e69d-4500-840f-295d67cce939
              </span>
            </div>

          </div>
        </Card>
        </div>

        <div className="row">
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
