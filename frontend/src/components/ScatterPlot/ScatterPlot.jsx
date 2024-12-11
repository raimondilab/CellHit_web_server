import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

const ScatterPlot = ({ umapData }) => {
  const layout = {
    showlegend: true, // Enable the legend
    autosize: true, // Automatically adjust size
    displaylogo: false, // Remove the Plotly logo from the toolbar
    legend: {
      orientation: 'v', // Display the legend vertically
    },
    yaxis: {
      automargin: true, // Adjust margins for axis labels
      showgrid: true, // Show gridlines
      showticklabels: true, // Show tick labels
      zeroline: false, // Hide the zero line
      title: 'UMAP2', // Label for the y-axis
    },
    xaxis: {
      automargin: true, // Adjust margins for axis labels
      showgrid: true, // Show gridlines
      showticklabels: true, // Show tick labels
      zeroline: false, // Hide the zero line
      title: 'UMAP1', // Label for the x-axis
    },
    font: {
      size: 9, // Font size for text
      color: '#000000', // Font color
    },
  };

  const symbol_map = {
    TCGA: 'cross', // Use 'cross' symbol for TCGA
    CCLE: 'diamond', // Use 'diamond' symbol for CCLE
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
    // Generate colors cyclically based on the size needed
    return Array.from({ length: size }, (_, i) => plotlyPalette[i % plotlyPalette.length]);
  };

  const traces = useMemo(() => {
    if (!Array.isArray(umapData) || umapData.length === 0) return []; // Return empty if data is invalid

    // Set to track names already added to the legend
    const legendSet = new Set();

    // Create a color map based on unique tissue types
    const uniqueTissues = [...new Set(umapData.map((item) => item.tissue))];
    const color_palette = generateColorPalette(uniqueTissues.length);

    const color_map = uniqueTissues.reduce((acc, tissue, index) => {
      acc[tissue] = color_palette[index];
      return acc;
    }, {});

    // Main data traces
    const mainTraces = umapData.map((item) => {
      const name = `${item.oncotree_code} (${item.Source})`;
      const showLegend = !legendSet.has(name); // Show legend entry only once
      legendSet.add(name); // Add the name to the legend set

      return {
        x: [item.UMAP1], // UMAP1 value
        y: [item.UMAP2], // UMAP2 value
        mode: 'markers', // Use markers for scatter plot
        type: 'scatter', // Plot type
        name: name, // Legend name
        text: `${item.tissue}, ${item.oncotree_code}, ${item.index}`, // Hover text
        showlegend: showLegend, // Only show legend if not already added
        marker: {
          size: 6, // Marker size
          color: color_map[item.tissue], // Color based on tissue type
          symbol: symbol_map[item.Source] || 'circle', // Default symbol is 'circle'
        },
      };
    });

    // Create traces for the legend symbols (symbolLegendTraces)
    const uniqueSources = [...new Set(umapData.map((item) => item.Source))];
    const symbolLegendTraces = uniqueSources.map((source) => ({
      x: [null], // Not plotted on the graph
      y: [null], // Not plotted on the graph
      mode: 'markers', // Use markers
      type: 'scatter', // Scatter type
      name: source, // Source name in the legend
      showlegend: true, // Always visible in the legend
      marker: {
        size: 6, // Marker size for the legend
        color: '#000000', // Uniform color for legend symbols
        symbol: symbol_map[source] || 'circle', // Default symbol is 'circle'
      },
      legendgroup: null, // Not part of a clickable legend group
      hoverinfo: 'none', // No hover info for legend symbols
      opacity: 0.4, // Invisible on the graph
    }));

    return [...symbolLegendTraces, ...mainTraces];
  }, [umapData]);

  return (
    <>
      <Plot
        data={traces}
        useResizeHandler={true} // Resize automatically with the container
        style={{ width: '100%', height: '100%' }} // Full width and height
        layout={layout} // Pass the layout object
      />
    </>
  );
};

export default ScatterPlot;
