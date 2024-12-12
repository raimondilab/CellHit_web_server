import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

const ScatterPlot = ({ umapData }) => {
  const layout = {
    showlegend: true,
    autosize: true,
    displaylogo: false,
    legend: {
      orientation: 'v',
    },
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

  const plotlyPalette = [
  "#E13978", "#F5899E", "#C091E3", "#E08571", "#9F55BB", "#45A132", "#96568E",
  "#5AB172", "#DFBC3A", "#349077", "#D8AB6A", "#75DFBB", "#5DA134", "#1F8FFF",
  "#9C5E2B", "#51D5E0", "#ABD23F", "#DA45BB", "#555555", "#56E79D", "#B644DC",
  "#73E03D", "#3870C9", "#6C55E2", "#5FDB69", "#659FD9", "#D74829", "#bdbdbd",
  "#E491C1", "#348ABD", "#A60628", "#7A68A6", "#467821", "#CF4457", "#188487",
  "#E24A33", "#FBC15E", "#8EBA42", "#988ED5", "#FFB5B8", "#FFC0CB", "#CD5C5C"
  ];

    // Static color palette for tissue types
    const tissueTypes = [
      "Adrenal Gland", "Ampulla of Vater", "Biliary Tract", "Bladder/Urinary Tract",
      "Bone", "Bowel", "Breast", "CNS/Brain", "Cervix", "Esophagus/Stomach",
      "Eye", "Head and Neck", "Kidney", "Liver", "Lung", "Lymphoid", "Myeloid",
      "Ovary/Fallopian Tube", "Pancreas", "Peripheral Nervous System", "Pleura",
      "Prostate", "Skin", "Soft Tissue", "Testis", "Thymus", "Thyroid", "Uterus",
      "Vulva/Vagina"
    ];

    // Map tissue types to unique colors
    const color_palette = tissueTypes.reduce((acc, tissue, index) => {
      acc[tissue] = plotlyPalette[index % plotlyPalette.length]; // Ensures no repetition within palette length
      return acc;
    }, {});

  const getColorForTissue = (tissue) => {
    return color_palette[tissue] || color_palette.Default;
  };

  const traces = useMemo(() => {
    if (!Array.isArray(umapData) || umapData.length === 0) return [];

    const legendSet = new Set();

    const mainTraces = umapData.map((item) => {
      const name = `${item.oncotree_code} (${item.Source})`;
      const showLegend = !legendSet.has(name);
      legendSet.add(name);

      return {
        x: [item.UMAP1],
        y: [item.UMAP2],
        mode: 'markers',
        type: 'scatter',
        name: name,
        text: `${item.tissue}, ${item.oncotree_code}, ${item.index}`,
        showlegend: showLegend,
        marker: {
          size: 6,
          color: getColorForTissue(item.tissue),
          symbol: symbol_map[item.Source] || 'circle',
        },
      };
    });

    const uniqueSources = [...new Set(umapData.map((item) => item.Source))];
    const symbolLegendTraces = uniqueSources.map((source) => ({
      x: [null],
      y: [null],
      mode: 'markers',
      type: 'scatter',
      name: source,
      showlegend: true,
      marker: {
        size: 6,
        color: '#000000',
        symbol: symbol_map[source] || 'circle',
      },
      legendgroup: null,
      hoverinfo: 'none',
      opacity: 0.4,
    }));

    return [...symbolLegendTraces, ...mainTraces];
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

