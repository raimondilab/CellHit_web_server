import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

const Histogram = ({ data = [], selectedDrug = {} }) => {
  const plotData = useMemo(() => {
    if (!data.length) return [];

    return [
      {
        x: data.map(d => d.quantileScore),
        type: 'histogram',
        name: 'Quantile Score',
        marker: { color: 'lightseagreen' },
        nbinsx: 25,
        opacity: 0.75,
      },
    ];
  }, [data]);

  const layout = useMemo(() => ({
    title: {
      text:  `Quantile Score Distribution`,
    },
    xaxis: {
      title: 'Quantile Score (QS)',
      automargin: true,
    },
    yaxis: {
      title: 'Cell Line Count',
      automargin: true,
    },
    font: {
      size: 9,
      color: '#000000',
    },
    bargap: 0.05,
    autosize: true,
    hovermode: 'closest',
    margin: { l: 50, r: 20, t: 40, b: 50 },
  }), [selectedDrug]);

  return (
    <Plot
      data={plotData}
      layout={layout}
      useResizeHandler={true}
      style={{ width: '100%', height: '100%' }}
      config={{ responsive: true }}
    />
  );
};

export default Histogram;
