import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

const HeatMap = ({ jsonData }) => {


  const parsedData = useMemo(() => JSON.parse(jsonData), [jsonData]);
  const { data, layout } = parsedData;

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

export default HeatMap;
