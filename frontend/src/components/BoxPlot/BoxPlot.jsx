import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

const BoxPlot = ({ data = [], selectedDrug = {} }) => {

  const plotData = useMemo(() => {
    if (!data.length) return [];

    const groupedBySource = data.reduce((acc, item) => {
      const source = item.source || 'Unknown';
      if (!acc[source]) acc[source] = [];
      acc[source].push(item);
      return acc;
    }, {});

    const colorPalette = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728']; // adicione mais se precisar

    return Object.entries(groupedBySource).map(([source, items], index) => ({
      y: items.map(d => d.predictions),
      x: Array(items.length).fill(source),
      type: 'box',
      name: `${source} (n=${items.length})`,
      marker: { color: colorPalette[index % colorPalette.length] },
      text: items.map(d =>
        `Sample: ${d.sampleIndex || d.sampleId || 'N/A'}<br>` +
        `Prediction: ${d.predictions?.toFixed(3) || 'N/A'}<br>` +
        `Quantile Score: ${d.quantileScore?.toFixed(3) || 'N/A'}`
      ),
      boxpoints: 'outliers',
      hoverinfo: 'text',
    }));
  }, [data]);

  const layout = useMemo(() => ({
    title: { text: `Predictions by Source` },
    xaxis: { title: 'Source', automargin: true },
    yaxis: { title: 'Predictions', automargin: true },
    autosize: true,
    boxmode: 'group',
    hovermode: 'closest',
    margin: { t: 50, l: 50, r: 30, b: 50 },
    font: {
      size: 9,
      color: '#000000',
    },
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

export default BoxPlot;
