import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from 'react-helmet';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { DataTable } from 'primereact/datatable';
import {Column} from 'primereact/column';
import { Tooltip } from 'primereact/tooltip';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import 'animate.css';
import 'primeicons/primeicons.css';
import { MultiSelect } from 'primereact/multiselect';
import axios from 'axios';
import { AutoComplete } from "primereact/autocomplete";
import DataSubmission from '../../components/DataSubmission/DataSubmission';
import ProgressionRun from '../../components/ProgressionRun/ProgressionRun';

const RunCellHit = () => {

 const [isSubmit, setIsSubmit] = useState(false);
 const [taskId, setTaskId] = useState("");
 const [taskStatus, setTaskStatus] = useState("");
 const [alignOnly, setAlignOnly] = useState('off');

return (
    <>
      <Helmet>
        <title> CellHit | Analysis</title>
      </Helmet>
      <Header />
      <section className="py-9">
        <div className="container">
        <div className="row mb-4">
            <div className="col-12">
             <h1 className="display-5 fw-bold line mb-4">CellHit</h1>
                   { (isSubmit && taskId) ? (
                         <ProgressionRun taskID={taskId}  statusTask={taskStatus} setTaskStatus={setTaskStatus} setIsSubmit={setIsSubmit} alignOnly={alignOnly}/>
                      ) : (
                         <DataSubmission setIsSubmit={setIsSubmit} setTaskId={setTaskId} setTaskStatus={setTaskStatus}  alignOnly={alignOnly} setAlignOnly={setAlignOnly}/>
                      )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default RunCellHit;
