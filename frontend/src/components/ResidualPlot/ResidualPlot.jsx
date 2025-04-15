import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

const ResidualPlot = ({ data = [], selectedDrug = {} }) => {

  const plotData = useMemo(() => {
    const residualsBySource = data.reduce((acc, item) => {
      const source = item.source || 'Unknown';
      if (!acc[source]) acc[source] = [];
      const residual = item.predictions - item.experimentalMedian;
      acc[source].push({
        x: item.sampleIndex,
        y: residual,
      });
      return acc;
    }, {});

    return Object.entries(residualsBySource).map(([source, values]) => ({
      x: values.map(v => v.x),
      y: values.map(v => v.y),
      type: 'scatter',
      mode: 'markers',
      name: source,
    }));
  }, [data]);

  const layout = useMemo(() => ({
    title: { text: `Residues (Prediction - Experimental)` },
    xaxis: { title: 'Sample', standoff: 50,  automargin: true  },
    yaxis: { title: 'Residue' , automargin: true},
    hovermode: 'closest',
    autosize: true,
    font: {
      size: 9,
      color: '#000000',
    },
  }), [selectedDrug]);

  return (
      <Plot
        data={plotData}
        layout={layout}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />
  );
};

export default ResidualPlot;
