import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

const BarPlot = ({ jsonData }) => {

  // Process the jsonData to separate positive and negative values
  const processedData = useMemo(() => {
    const geneUp = [];
    const valuesUp = [];
    const geneDown = [];
    const valuesDown = [];

    for (const [key, value] of Object.entries(jsonData)) {
      if (value > 0) {
        geneUp.push({ gene: key, value });
      } else {
        geneDown.push({ gene: key, value });
      }
    }

    geneUp.sort((a, b) => a.gene.localeCompare(b.gene)).reverse();
    geneDown.sort((a, b) => a.gene.localeCompare(b.gene)).reverse();

    return {
      geneUp: geneUp.map(item => item.gene),
      valuesUp: geneUp.map(item => item.value),
      geneDown: geneDown.map(item => item.gene),
      valuesDown: geneDown.map(item => item.value),
    };
  }, [jsonData]);

  const layout = {
    showlegend: false,
    autosize: true,
    title: { text: 'Gene Importance' },
    xaxis: {
      automargin: true,
      title: { text: 'SHAP Value' },
    },
    yaxis: {
      automargin: true,
      title: { text: 'Genes' },
    },
    font: {
      size: 9,
      color: '#000000',
    },
    barmode: 'relative',
  };

  const data = [
    {
      type: 'bar',
      orientation: "h",
      x: processedData.valuesUp,
      y: processedData.geneUp,
      base: 0,
      marker: {
        color: '#BC3D41',
      },
      name: 'SHAP Values',
    },
    {
      type: 'bar',
      orientation: "h",
      x: processedData.valuesDown,
      y: processedData.geneDown,
      base: 0,
      marker: {
        color: '#4F7EBB',
      },
      name: 'SHAP Values',
    },
  ];

  return (
    <>
      <Plot
        data={data}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
        layout={layout}
      />
    </>
  );
};

export default BarPlot;
