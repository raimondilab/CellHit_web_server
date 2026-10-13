import React, { useState } from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Chip } from 'primereact/chip';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';
import 'primeicons/primeicons.css';

const MCP_URL = 'https://mcp.cellhit.bioinfolab.sns.it/mcp';
const CLAUDE_CODE_COMMAND = `claude mcp add --transport http cellhit ${MCP_URL}`;

const TOOLS = [
  { name: 'get_task_status', description: 'Checks whether a task is completed, still running, failed or deleted.' },
  { name: 'get_task_results', description: 'Returns the predictions of an analysis task, filtered by drug and/or sample.' },
  { name: 'show_heatmap', description: 'Shows the interactive heatmap of the top 15 drugs of an analysis task.' },
  { name: 'show_umap', description: 'Shows the interactive UMAP of a task: your samples aligned with CCLE and TCGA.' },
  { name: 'get_precomputed', description: 'Queries the precomputed predictions for TCGA, TARGET and Treehouse patients and CCLE cell lines.' },
];

const EXAMPLES = [
  {
    id: 'tasks',
    title: 'Your analysis results',
    questions: [
      ['Is task https://cellhit.bioinfolab.sns.it/result/?taskId=… ready?', 'get_task_status'],
      ['Show the GDSC predictions for Camptothecin in my task …', 'get_task_results'],
      ['Which drugs have the highest predicted sensitivity for sample P1 of task …, in PRISM?', 'get_task_results'],
      ['Compare the GDSC predictions of Olaparib across all samples of task …', 'get_task_results'],
    ],
  },
  {
    id: 'charts',
    title: 'Charts',
    questions: [
      ['Show the GDSC heatmap of task …', 'show_heatmap'],
      ['Show the standardized PRISM heatmap of task …', 'show_heatmap'],
      ['Show the UMAP of task … colored by tissue', 'show_umap'],
      ['Where do my samples fall relative to the reference cell lines? Task …', 'show_umap'],
    ],
  },
  {
    id: 'samples',
    title: 'Precomputed predictions by sample',
    questions: [
      ['GDSC predictions for the cell line ACH-001113', 'sample'],
      ['PRISM predictions for the TCGA sample TCGA-19-1787-01', 'sample'],
      ['Predicted Camptothecin response for the cell line ACH-000001 in GDSC', 'drug + sample'],
    ],
  },
  {
    id: 'cancer-types',
    title: 'Precomputed predictions by tissue, disease or cancer type',
    questions: [
      ['GDSC predictions for Camptothecin in brain samples', 'tissue'],
      ['Which GDSC drugs are predicted to be most effective in neuroblastoma?', 'disease'],
      ['PRISM predictions in acute lymphoblastic leukemia samples', 'disease'],
      ['GDSC predictions for Camptothecin in TCGA glioblastomas', 'tcga_code'],
      ['Predictions for lung adenocarcinoma samples (OncoTree LUAD) in GDSC', 'oncotree_code'],
      ['GDSC predictions for Camptothecin in brain samples with a glioma diagnosis', 'tissue + disease'],
    ],
  },
  {
    id: 'neighbors',
    title: 'Precomputed predictions by nearest neighbor',
    questions: [
      ['For Camptothecin in GDSC, which samples have an expression profile closest to a glioma cell line?', 'transcriptomic neighbor'],
      ['For Camptothecin in GDSC, which samples respond like TCGA lung tumors?', 'response neighbor'],
      ['Samples whose closest cell line is ACH-001113, for Camptothecin in GDSC', 'neighbor cell line'],
      ['Camptothecin predictions in GDSC for samples whose nearest TCGA neighbor is an adenocarcinoma', 'neighbor diagnosis'],
    ],
  },
  {
    id: 'browsing',
    title: 'Browsing long results',
    questions: [
      ['Show the next 50 rows', 'offset'],
      ['Show only the first 10 predictions', 'limit'],
    ],
  },
];

const MCPPage = () => {

  const [copied, setCopied] = useState(null);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const CopyBox = ({ text, copyKey }) => (
    <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
      <code className="fs-1 px-2 py-1 border rounded text-break">{text}</code>
      <Button
        icon={copied === copyKey ? 'pi pi-check' : 'pi pi-copy'}
        className="p-button-text p-button-sm"
        onClick={() => copy(text, copyKey)}
        aria-label="Copy"
        tooltip={copied === copyKey ? 'Copied' : 'Copy'}
      />
    </div>
  );

  return (
    <>
      <Helmet>
        <title>CellHit | MCP server</title>
      </Helmet>
      <Header />
      <section className="py-9">
        <div className="container">
          <div className="row">
            <div className="col-sm-12 text-sm-start text-center">

              <h1 className="display-5 fw-bold mb-4">MCP server</h1>
              <p className="fs-1 text-justify mb-5">
                CellHit is available as a Model Context Protocol (MCP) server. Connect it to an AI assistant such as
                Claude or ChatGPT and ask about your analysis results or the precomputed predictions in plain language.
              </p>

              <h5 className="display-6 fw-bold mb-4" id="connect">Connect</h5>
              <p className="fs-1 text-justify mb-2">Server URL:</p>
              <CopyBox text={MCP_URL} copyKey="url" />
              <ul className="mb-3">
                <li className="fs-1 text-justify mb-1"><b>Claude:</b> add a custom connector with the URL above, then enable CellHit in a new conversation.</li>
                <li className="fs-1 text-justify mb-1"><b>ChatGPT:</b> enable developer mode and create a connector with the URL above.</li>
                <li className="fs-1 text-justify mb-1"><b>Claude Code:</b></li>
              </ul>
              <CopyBox text={CLAUDE_CODE_COMMAND} copyKey="claude-code" />

              <h5 className="display-6 fw-bold mb-4" id="tools">Tools</h5>
              <p className="fs-1 text-justify mb-2">The assistant picks the right tool for each question.</p>
              <div className="table-responsive mb-5">
                <table className="table fs-1">
                  <tbody>
                    {TOOLS.map(tool => (
                      <tr key={tool.name}>
                        <td><Chip label={tool.name} /></td>
                        <td>{tool.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h5 className="display-6 fw-bold mb-4" id="charts">Interactive charts</h5>
              <ul className="mb-3">
                <li className="fs-1 text-justify mb-1">
                  <b>Heatmap:</b> top 15 drugs of an analysis task. Switch between <Chip label="GDSC" /> and <Chip label="PRISM" />, and between <Chip label="Median" /> and <Chip label="Standardized" /> scaling.
                </li>
                <li className="fs-1 text-justify mb-1">
                  <b>UMAP:</b> your samples projected onto the CCLE and TCGA reference. Color by <Chip label="Oncotree" />, <Chip label="Tissue" /> or <Chip label="Batch" />.
                </li>
              </ul>
              <p className="fs-1 text-justify mb-2">
                Both charts open inside the conversation, with zoom and hover, and link to the full results page.
              </p>
              <Message
                severity="info"
                className="mb-5"
                text="Charts appear in assistants that support MCP Apps. In other clients you get a text summary and the link to the results page."
              />

              <h5 className="display-6 fw-bold mb-4" id="examples">Example questions</h5>
              {EXAMPLES.map(group => (
                <div key={group.id} id={group.id} className="mb-4">
                  <h6 className="fs-1 text-justify mb-2"><b>{group.title}</b></h6>
                  <ul>
                    {group.questions.map(([question, hint]) => (
                      <li key={question} className="fs-1 text-justify mb-1">
                        <i>“{question}”</i> <Chip label={hint} className="ms-1" />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="fs-1 text-justify mb-5">
                Replace “…” with your task ID or the result page URL. Field descriptions are on the <Link to="/help/" target="_blank" rel="noopener noreferrer"><b><i>help</i></b></Link> page.
              </p>

              <h5 className="display-6 fw-bold mb-4" id="notes">Good to know</h5>
              <Message
                severity="warn"
                className="mb-3"
                text="GDSC (ln(IC50)) and PRISM (log-fold change) predictions are on different scales. Lower values mean higher sensitivity in both; compare and rank only within one dataset."
              />
              <ul className="mb-5">
                <li className="fs-1 text-justify mb-1">Name the dataset (GDSC or PRISM) and use the English drug name, e.g. <Chip label="Camptothecin" />.</li>
                <li className="fs-1 text-justify mb-1">Task results are kept for 30 days. After that the assistant reports the task as deleted.</li>
                <li className="fs-1 text-justify mb-1">Tissue, disease and TCGA code describe the sample itself; neighbor filters describe its closest CCLE or TCGA sample.</li>
                <li className="fs-1 text-justify mb-1">Predictions are computational estimates, not clinical evidence.</li>
              </ul>

            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default MCPPage;
