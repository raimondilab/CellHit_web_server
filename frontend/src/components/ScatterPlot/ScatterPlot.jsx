import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

const ScatterPlot = ({ umapData }) => {

  const layout = {
    showlegend: true,

    autosize: true,
    displaylogo: false,
    yaxis: {
      automargin: true,
      showgrid: true,
      showticklabels: true,
      zeroline: false,
      title: 'UMAP2',
    },
    xaxis: {
      automargin: true,
      showgrid: true,
      showticklabels: true,
      zeroline: false,
      title: 'UMAP1',
    },
    font: {
      size: 9,
      color: '#000000',
    },
  };

  const symbol_map = {
    TCGA: 'cross',
    CCLE: 'diamond',
  };

    const generateColorPalette = (size) => {
    const plotlyPalette = [
      '#636EFA', '#EF553B', '#00CC96', '#AB63FA', '#FFA15A',
      '#19D3F3', '#FF6692', '#B6E880', '#FF97FF', '#FECB52',
    ];

    return Array.from({ length: size }, (_, i) => plotlyPalette[i % plotlyPalette.length]);
  };

  const traces = useMemo(() => {

    const uniqueOncotree = [...new Set(umapData.map((item) => item.oncotree_code))];

    const color_palette = generateColorPalette(uniqueOncotree.length);

    const color_map = uniqueOncotree.reduce((acc, code, index) => {
      acc[code] = color_palette[index];
      return acc;
    }, {});

    return umapData.map((item) => ({
      x: [item.UMAP1],
      y: [item.UMAP2],
      mode: 'markers',
      type: 'scatter',
      name: `${item.oncotree_code} (${item.Source})`,
      text: `${item.tissue}, ${item.oncotree_code}, ${item.index}`,
      marker: {
        size: 6,
        color: color_map[item.oncotree_code],
        symbol: symbol_map[item.Source] || 'circle',
      },
    }));
  }, [umapData]);


  return (
    <>
      <Plot
        data={traces}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
        layout={layout}
      />
    </>
  );
};

export default ScatterPlot;
