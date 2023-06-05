$( document ).ready(function() {

// Draw scatter plot
scatter_plot();


// Draw Ora analysis
ora();

// Add ora table
addTableOra([]);

// Add small molecule table
addTableSmallMolecule([]);

// List subtype by lineage
subtype_list("adrenal");

// List subtype by lineage
$("#lineage").on("change", function() {
    const lineage = $('#lineage').val();
    subtype_list(lineage);
});

// Show compound structure
$('#table2 tbody').on('click', 'tr', function () {
     var table = $('#table2').DataTable();
     var data = table.row(this).data();
     small_molecule_details(data[0]);
});

// Intro modal
$('#btnIntro').click(function() {
    introPanel();
});

});

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

// Draw scatter plot
function scatter_plot(){

var trace1 = {
  x: [1, 2, 3, 4, 5],
  y: [1, 6, 3, 6, 1],
  mode: 'markers+text',
  type: 'scatter',
  name: 'ovary',
  text: ['A-1', 'A-2', 'A-3', 'A-4', 'A-5'],
  textposition: 'top center',
  textfont: {
    family:  'Roboto Condensed'
  },
  marker: { size: 12,
   line: {
      width: 1
    }
  }
};

var trace2 = {
  x: [1.5, 2.5, 3.5, 4.5, 5.5],
  y: [4, 1, 7, 1, 4],
  mode: 'markers',
  type: 'scatter',
  name: 'blood',
  showlegend : false,
  marker: { size: 7,
   symbol: "diamond"
  }
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

/* Get subtypes by lineage */
function subtype_list(lineage){

    d3.json("/subtypes", function(data) {

		  var select = document.getElementById("subtypes");
		  $("#subtypes").find('option').remove();

           for (var i = 0; i < data.length; i++) {
               var opt = document.createElement('option');
                   opt.value = data[i];
                   opt.innerHTML = data[i];
                   select.appendChild(opt);
            }
        }).send("POST", JSON.stringify({
				'lineage': lineage
	}));
}