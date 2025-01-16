import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

import { kernelDensityEstimation } from 'simple-statistics';


const DensityPlot = ({ data, predictionValue, title }) => {

  const bandwidth = 1; // Larghezza del kernel

  // Definizione della funzione kernel gaussiana
  const gaussianKernel = (x) => Math.exp(-0.5 * x ** 2) / Math.sqrt(2 * Math.PI);

  // Genera la densità
  const kde = kernelDensityEstimation(data, (x) => gaussianKernel(x / bandwidth));

  const xValues = Array.from({ length: 100 }, (_, i) => -3 + i * 0.1); // Genera valori di X
  const densityY = xValues.map(kde); // Applica il KDE


  // Process the data to create a density estimation
  const processedData = useMemo(() => {
    return {
      densityX: xValues, // X values for the density plot
      densityY: densityY, // Y values (density) for the density plot
      predictionValue: predictionValue, // The single prediction value to mark
    };
  }, [data]);

  const layout = {
    title: { text: `${title} predicted response distribution` },
    xaxis: {
      title: { text: 'Prediction (IC50)' , automargin:true},
    },
    yaxis: {
      title: { text: 'Density' , automargin:true},
    },
    font: {
            size: 9,
            color: '#000000'
          },
    showlegend: true,
    autosize: true,
    displaylogo: false,
    //legend: {"orientation": "h", y: 1.3, x: 0},
  };

  const plotData = [
    {
      x: processedData.densityX,
      y: processedData.densityY,
      type: 'scatter',
      mode: 'lines',
      fill: 'tozeroy',
      name: 'Distribution',
      line: {
        color: 'rgba(31,119,180,0.8)',
      },
    },
    {
      x: [processedData.predictionValue, processedData.predictionValue],
      y: [0, Math.max(...processedData.densityY)], // Vertical line
      type: 'scatter',
      mode: 'lines',
      name: 'Prediction Value',
      line: {
        color: 'rgba(214,39,40,0.8)',
        dash: 'dash',
      },
    },
  ];

  return (
    <>
      <Plot
        data={plotData}
        layout={layout}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
      />
    </>
  );
};

export default DensityPlot;
