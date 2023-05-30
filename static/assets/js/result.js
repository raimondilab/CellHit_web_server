$( document ).ready(function() {


scatter_plot();

ora();

// Intro modal
$('#btnIntro').click(function() {
introPanel();
});
});

//Download jpg
function downloadPng(pngId, fileName) {
	const svg_id = document.getElementById(pngId);
	console.log(unescape(encodeURIComponent(svg_id.outerHTML)));
	const base64doc = btoa(unescape(encodeURIComponent(svg_id.outerHTML)));
	const a = document.createElement('a');
	const e = new MouseEvent('click');
	a.download = fileName + '.png';
	a.href = 'data:image/png;base64,' + base64doc;
	a.dispatchEvent(e);
}

// Show Help Panel
function introPanel() {
	$("#dialog-info").dialog({
		modal: true,
		buttons: {
			Ok: function() {
				$(this).dialog("close");
			}
		}
	});
}


function scatter_plot(){

var trace1 = {
  x: [1, 2, 3, 4, 5],
  y: [1, 6, 3, 6, 1],
  mode: 'markers',
  type: 'scatter',
  name: 'ovary',
  text: ['A-1', 'A-2', 'A-3', 'A-4', 'A-5'],
  marker: { size: 12 }
};

var trace2 = {
  x: [1.5, 2.5, 3.5, 4.5, 5.5],
  y: [4, 1, 7, 1, 4],
  mode: 'markers',
  type: 'scatter',
  name: 'blood',
  text: ['B-a', 'B-b', 'B-c', 'B-d', 'B-e'],
  marker: { size: 12 }
};

var data = [ trace1, trace2 ];

var layout = {
  autosize: true,
  xaxis: {
    showgrid: false,
    showticklabels : false
},
yaxis: {
    showgrid: false,
    showline: false,
    showticklabels : false
}

};

var config = {responsive: true}

Plotly.newPlot('scatter_plot', data, layout, config);

}