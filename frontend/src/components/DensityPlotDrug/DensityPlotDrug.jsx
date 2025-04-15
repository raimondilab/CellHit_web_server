import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

function calculatePearsonCorrelation(data, keyX, keyY) {
  if (!data || data.length < 2) return NaN;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0, n = 0;

  for (const item of data) {
    const x = item[keyX];
    const y = item[keyY];
    if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) continue;

    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
    n++;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));
  return denominator === 0 ? NaN : numerator / denominator;
}

const DensityPlotDrug = ({ data = [], selectedDrug = {} }) => {

  const drugCorrelation = useMemo(
    () => calculatePearsonCorrelation(data, 'predictions', 'experimentalMedian'),
    [data]
  );

  const plotData = useMemo(() => [
    {
      x: data.map(d => d.predictions),
      type: 'histogram',
      histnorm: 'probability density',
      name: 'Predictions',
      opacity: 0.65,
      marker: { color: 'purple' },
      nbinsx: 30,
    },
    {
      x: data.map(d => d.experimentalMedian),
      type: 'histogram',
      histnorm: 'probability density',
      name: 'Experimental',
      opacity: 0.65,
      marker: { color: 'darkorange' },
      nbinsx: 30,
    }
  ], [data]);

  const layout = useMemo(() => ({
    title: {
      text: `Prediction vs. Experimental Density`
    },
    xaxis: {
      title: 'Value (Sensitivity)',
      automargin: true,
    },
    yaxis: {
      title: 'Probability Density',
      automargin: true,
    },
    font: {
      size: 9,
      color: '#000',
    },
    barmode: 'overlay',
    hovermode: 'x unified',
    legend: {
      x: 0.6,
      y: 0.95,
      bgcolor: 'rgba(255,255,255,0.6)',
    },
    margin: { l: 60, r: 20, t: 80, b: 50 },
    autosize: true,
  }), [selectedDrug, drugCorrelation]);

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

export default DensityPlotDrug;
