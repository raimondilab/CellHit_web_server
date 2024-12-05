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
      "#E13978", "#F5899E", "#C091E3", "#E08571", "#9F55BB",
      "#45A132", "#96568E", "#F5899E", "#5AB172", "#DFBC3A",
      "#349077", "#D8AB6A", "#75DFBB", "#5DA134", "#1F8FFF",
      "#9C5E2B", "#51D5E0", "#ABD23F", "#DA45BB", "#555555",
      "#56E79D", "#B644DC", "#73E03D", "#F5899E", "#3870C9",
      "#6C55E2", "#5FDB69", "#F5899E", "#659FD9", "#D74829",
      "#bdbdbd", "#E491C1", "#E491C1"
    ];
    return Array.from({ length: size }, (_, i) => plotlyPalette[i % plotlyPalette.length]);
  };

  const traces = useMemo(() => {
    // Ensure umapData is a valid array
    if (!Array.isArray(umapData) || umapData.length === 0) return []; // Return empty if not valid

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
