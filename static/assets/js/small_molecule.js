/**
Create result table
**/
function addTableSmallMolecule(data) {

//    // Check if data is empty
//    if (data.length === 0) {
//        document.getElementById("results").style.display = "none";
//        return;
//    }

  data = [{'compound_name':"Idronoxil", 'top_feature': "METABOL_5-HIAA", 'moa': "XIAP inhibitor \n METABOL_5-HIAA \n CRISPR_PCGF3 (10336)", "target": "ENOX2, SPHK1" , 'dsk_score': 0.8}]

  var myTableDiv = document.getElementById("small_molecule");

  var table = document.createElement('TABLE');
  table.border = '1';
  table.style.width = '100%';
  table.setAttribute('id','table2');

  var tableHead = document.createElement('THEAD');
  table.appendChild(tableHead);

   var trh = document.createElement('TR');
    tableHead.appendChild(trh);

   field = ['Compound Name', 'Top Feature', 'MOA', 'Target', 'DKS score']
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
  td.appendChild(document.createTextNode(data[i].compound_name));
  tr.appendChild(td);

  var td_p_value = document.createElement('TD');
  td_p_value.width = '75';
  td_p_value.appendChild(document.createTextNode(data[i].top_feature));
  tr.appendChild(td_p_value);

  var td_name = document.createElement('TD');
  td_name.width = '75';
  td_name.appendChild(document.createTextNode(data[i].moa));
  tr.appendChild(td_name);

  var td_native = document.createElement('TD');
  td_native.width = '75';
  td_native.appendChild(document.createTextNode(data[i].target));
  tr.appendChild(td_native);

  var td_intersection_size = document.createElement('TD');
  td_intersection_size.width = '75';
  td_intersection_size.appendChild(document.createTextNode(data[i].dsk_score));
  tr.appendChild(td_intersection_size);

  }

  myTableDiv.appendChild(table);

  // Set DataTable library
  let data_table = new DataTable('#table2', {

  // options
    scrollY: 291,
    scrollX: true,
    dom: 'Bfrtip',
    buttons: [
    'copy', 'csv', 'excel', 'pdf', 'print'
    ]});

    // Initialize drug panel
    var table = $('#table2').DataTable();
    var tb_data = table.row(0).data();
    small_molecule_details(tb_data[0]);

}

// Show compounds structure
function small_molecule_details(compound_name){

  console.log(compound_name);

d3.json("/compound", function(data) {
    console.log(data);
     if (data){
         $("#structure").attr("src", data[0].structure);
         $("#compound_name").text(data[0].compound_name);
         $("#description").text(data[0].description);
     }

}).send("POST", JSON.stringify({
				'compound_name': compound_name
	}));


}