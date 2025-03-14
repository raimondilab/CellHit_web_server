import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

const BarPlot = ({ jsonData }) => {
  const processedData = useMemo(() => {
    const geneList = Object.entries(jsonData).map(([gene, value]) => ({ gene, value }));

    // Sort from largest to smallest (negative values first, then positive ones)
    geneList.sort((a, b) => a.value - b.value);

    return {
      genes: geneList.map(item => item.gene),
      values: geneList.map(item => item.value),
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
      autorange: 'reversed',
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
      x: processedData.values,
      y: processedData.genes,
      marker: {
        color: processedData.values.map(value => (value > 0 ? '#BC3D41' : '#4F7EBB')),
      },
      name: 'SHAP Values',
    },
  ];

  return (
    <Plot
      data={data}
      useResizeHandler={true}
      style={{ width: '100%', height: '100%' }}
      layout={layout}
    />
  );
};

export default BarPlot;
