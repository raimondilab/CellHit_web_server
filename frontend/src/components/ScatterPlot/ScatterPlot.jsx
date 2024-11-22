import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

const ScatterPlot = ({ }) => {

  const layout = {
		showlegend: true,
		legend: {"orientation": "v", y: 1.3, x: 0},
		autosize: true,
		yaxis: {
		   automargin:true,
		   showgrid: false,
           showline: false,
           showticklabels : false
		},
        xaxis: {
            automargin:true,
            showgrid: false,
            showticklabels : false
           },
        displaylogo: false,
         font: {
            size: 9,
            color: '#000000'
          }
	    };

var trace1 = {
  x: [1.5, 2.5, 3.5, 4.5, 5.5],
  y: [4, 1, 7, 1, 4],
  mode: 'markers',
  type: 'scatter',
  name: 'TCGA+Tumor',
  showlegend : true,
  marker: {
   size: 12,
   symbol: "diamond"
  }
};

  var trace2 = {
  x: [1, 2, 3, 4, 5],
  y: [1, 6, 3, 6, 1],
  mode: 'markers',
  type: 'scatter',
  name: 'Ovary',
  text: ['B-a', 'B-b', 'B-c', 'B-d', 'B-e'],
  marker: {
   size: 8,
   opacity: 0.5,
   line: {
      width: 1
    }
  }
};

 var trace3 = {
  x: [1, 6, 9, 4, 5],
  y: [1, 6, 3, 6, 1],
  mode: 'markers',
  type: 'scatter',
  name: 'Bone',
  text: ['B-a', 'B-b', 'B-c', 'B-d', 'B-e'],
  marker: {
      size: 8,
      opacity: 0.5,
   line: {
      width: 1
    }
  }
};

var data = [ trace1, trace2, trace3 ];

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

export default ScatterPlot;
