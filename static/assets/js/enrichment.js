/* Gprofiler*/
function ora(data) {

// Labels of row and columns
//var sources = d3.map(data, function(d){return d.source;}).keys()
//var values = d3.map(data, function(d){return d.p_value;}).keys()
//
//// Build color scale
//var myColor = d3.scaleSequential(d3.interpolateRainbow).domain([0, sources.length]);

var reac = {
  x: ["REAC", "REAC", "REAC", "REAC"],
  y: [10, 11, 12, 13],
  mode: 'markers',
  marker: {
    color: 'rgb(93, 164, 214)',
    size: [10, 10, 10, 10]
  },
  type: 'scatter',
  name: 'REAC'
};

var kegg = {
  x: ["KEGG", "KEGG", "KEGG", "KEGG"],
  y: [11, 12, 13, 15],
  mode: 'markers',
  marker: {
    color: 'rgb(255, 144, 14)',
    size: 10
  },
  type: 'scatter',
  name: 'KEGG'
};

var corum = {
  x: ["CORUM", "CORUM", "CORUM", "CORUM", "CORUM"],
  y: [5, 4, 6, 8, 10],
  mode: 'markers',
  marker: {
    color: 'rgb(44, 160, 101)',
    size: [10, 10, 10, 10]
  },
  type: 'scatter',
  name: 'CORUM'
};

var data = [reac, corum, kegg];

var layout = {
               autosize: true,
               showlegend: true,
               title: {
                  font: {
                        family: 'Roboto Condensed',
                        size: '0.75rem',
                        color: '#183F56'
                    }
                  },
                  xaxis: {
                  showgrid: false,
                  tickangle: 90,
                  ticks: 'outside',
                  font: {
                        family: 'Roboto Condensed',
                        size: '0.75rem',
                        color: '#183F56'
                    }
                  },
               yaxis: {
                  autorange: false,
                  showline: true,
                  showgrid: false,
                  ticks: 'outside',
                  range: [0, 16],
                  title: {
                  text: '-log10(p-value)',
                  font: {
                        family: 'Roboto Condensed',
                        size: '0.75rem',
                        color: '#183F56'
                    }
                  }
                   }
            };

var config = {responsive: true}

Plotly.newPlot('ora', data, layout, config);

};

/**
Create result table
**/
function addTableOra(data) {

  var myTableDiv = document.getElementById("enrichment_table");

  var table = document.createElement('TABLE');
  table.border = '1';
  table.style.width = '100%';
  table.setAttribute('id','table');

  var tableHead = document.createElement('THEAD');
  table.appendChild(tableHead);

   var trh = document.createElement('TR');
    tableHead.appendChild(trh);

   field = ['Source', 'p_value', 'Name', 'Native', 'Intersection size']
   for (var i = 0; i < field.length; i++) {
       var th = document.createElement('TH');
          th.width = '75';
          th.appendChild(document.createTextNode(field[i]));
          trh.appendChild(th);
    }

  var tableBody = document.createElement('TBODY');
  table.appendChild(tableBody);

  for (var i = 0; i < data.length; i++) {
    var tr = document.createElement('TR');
    tableBody.appendChild(tr);

  // create cells
  var td = document.createElement('TD');
  td.width = '75';
  td.appendChild(document.createTextNode(data[i].source));
  tr.appendChild(td);

  var td_p_value = document.createElement('TD');
  td_p_value.width = '75';
  td_p_value.appendChild(document.createTextNode(data[i].p_value));
  tr.appendChild(td_p_value);

  var td_name = document.createElement('TD');
  td_name.width = '75';
  td_name.appendChild(document.createTextNode(data[i].name));
  tr.appendChild(td_name);

  var td_native = document.createElement('TD');
  td_native.width = '75';
  td_native.appendChild(document.createTextNode(data[i].native));
  tr.appendChild(td_native);

  var td_intersection_size = document.createElement('TD');
  td_intersection_size.width = '75';
  td_intersection_size.appendChild(document.createTextNode(data[i].intersection_size));
  tr.appendChild(td_intersection_size);

  }
  myTableDiv.appendChild(table);

  // Set DataTable library
  let data_table = new DataTable('#table', {

  // options
    scrollY: 291,
    scrollX: true,
    dom: 'Bfrtip',
    buttons: [
    'copy', 'csv', 'excel', 'pdf', 'print'
    ]});

}
