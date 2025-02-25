import React, { useState } from 'react';
import { Timeline } from 'primereact/timeline';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Link } from 'react-router-dom';
import { Dialog } from 'primereact/dialog';

const HeaderTitleRunCellHit = () => {

  const [position, setPosition] = useState('center');
  const [visible, setVisible] = useState(false);

  const show = (position) => {
    setPosition(position);
    setVisible(true);
  };

    return (
    <>
      <div className="row">
        <div className="col-md-12">
          <h2 className="display-6 fw-bold mb-5">Run analysis<sup><Button icon="pi pi-info"
            onClick={() => show('top-right')} text size="small" className="btn-dialog" /></sup></h2>
          {/* Help message */}
          <Dialog header="CellHit" visible={visible} position={position} style={{ width: '50vw' }} onHide={() => setVisible(false)}
            draggable={false} resizable={false} breakpoints={{ '960px': '75vw', '641px': '100vw' }}>
            <p className="text-justify mb-3">To run CellHit on your data, you need to upload a transcriptomic dataset of your choice. Start by clicking the "Upload Dataset" button, which will take you to the upload window. Next, select the drug dataset by choosing either GDSC or PRISM. Finally, click the submit button to complete the process.
            <br/>Please ensure that you provide a CSV, ZIP, or GZ file containing bulk transcriptomic data from cancer cells, formatted in log2(TPM+1).
            </p>
             <p className=" text-justify ">To properly process the input file, it must adhere to the following specific structure:</p>
             <ol>
              <li className="text-justify">The file must include a column labelled "GENE," which contains gene names.</li>
              <li className="text-justify">Each sample should have its corresponding column with numeric values representing the transcriptomic data for each gene. Sample names should be unique and clearly labelled (e.g., GB101-1_S3, GB101-2_S4).</li>
              <li className="text-justify">Include a column titled "TCGA_CODE" to specify the cancer type associated with each sample in that row (for example, "GBM" for Glioblastoma Multiforme).</li>
              <li className="text-justify">Add a column labelled "TISSUE" to indicate the tissue type for each sample in that row (for example, "CNS/Brain").</li>
            </ol>
            <p className="m-0 mb-1 text-justify">For more information, please refer to the
              <Link className="" to="/about/" target="_blank" rel="noopener noreferrer"><b> about</b></Link> page.
            </p>
          </Dialog>

        </div>
      </div>
    </>
  );
};
export default HeaderTitleRunCellHit;
