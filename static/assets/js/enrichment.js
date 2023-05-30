/* Gprofiler*/
function ora(data) {

var trace1 = {
  x: ["REAC", "KEGG", "WP", "REAC"],
  y: [10, 11, 12, 13],
  mode: 'markers',
  marker: {
    color: ['hsl(0,100,40)', 'hsl(33,100,40)', 'hsl(66,100,40)', 'hsl(99,100,40)'],
    size: [12, 22, 32, 42],
    opacity: [0.6, 0.7, 0.8, 0.9]
  },
  type: 'scatter'
};

var trace2 = {
  x: ["REAC", "KEGG", "WP", "CORUM"],
  y: [11, 12, 13, 16],
  mode: 'markers',
  marker: {
    color: 'rgb(31, 119, 180)',
    size: 18,
    symbol: ['circle', 'square', 'diamond', 'cross']
  },
  type: 'scatter'
};

var trace3 = {
  x: ["REAC", "KEGG", "WP", "CORUM", "WP", "REAC"],
  y: [0, 2, 4, 6, 8, 10],
  mode: 'markers',
  marker: {
    size: 18,
    line: {
      color: ['rgb(120,120,120)', 'rgb(120,120,120)', 'red', 'rgb(120,120,120)'],
      width: [2, 2, 6, 2]
    }
  },
  type: 'scatter'
};

var data = [trace1, trace2, trace3];

var layout = { autosize: true,
               showlegend: false,
               showgrid: false,
              title : "g:Profiler"
              };

var config = {responsive: true}

Plotly.newPlot('ora', data, layout, config);

};
