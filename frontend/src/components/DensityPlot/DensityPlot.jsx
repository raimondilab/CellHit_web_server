import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { kernelDensityEstimation } from 'simple-statistics';

const DensityPlot = ({ data, predictionValue, title, bandwidth = 1 }) => {
  const isValidData = data && Array.isArray(data) && data.length > 0;

  const gaussianKernel = useMemo(() => {
    return (x) => Math.exp(-0.5 * x ** 2) / Math.sqrt(2 * Math.PI);
  }, []);

  const kde = useMemo(() => {
    return isValidData ? kernelDensityEstimation(data, (x) => gaussianKernel(x / bandwidth)) : null;
  }, [data, gaussianKernel, bandwidth, isValidData]);

  const xValues = useMemo(() => Array.from({ length: 100 }, (_, i) => -3 + i * 0.1), []);
  const densityY = useMemo(() => (kde ? xValues.map(kde) : []), [kde, xValues]);

  const processedData = useMemo(() => {
    return {
      densityX: xValues,
      densityY: densityY,
      predictionValue: predictionValue,
    };
  }, [xValues, densityY, predictionValue]);

  if (!isValidData) {
    return <div>No data available for plotting</div>;
  }

  const layout = {
    title: { text: `${title} predicted response distribution` },
    xaxis: {
      title: { text: 'Prediction (IC50)' },
      automargin: true,
    },
    yaxis: {
      title: { text: 'Density' },
      automargin: true,
    },
    font: {
      size: 9,
      color: '#000000',
    },
    showlegend: true,
    autosize: true,
  };

  const plotData = [
    {
      x: processedData.densityX,
      y: processedData.densityY,
      type: 'scatter',
      mode: 'lines',
      fill: 'tozeroy',
      name: 'Distribution',
      line: { color: 'rgba(31,119,180,0.8)' },
    },
    {
      x: [processedData.predictionValue, processedData.predictionValue],
      y: [0, Math.max(...processedData.densityY)],
      type: 'scatter',
      mode: 'lines',
      name: 'Prediction Value',
      line: { color: 'rgba(214,39,40,0.8)', dash: 'dash' },
    },
  ];

  return (
    <Plot
      data={plotData}
      layout={layout}
      useResizeHandler={true}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default DensityPlot;
