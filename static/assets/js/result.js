$( document ).ready(function() {

// Setting visibility pathway-level heatmap
show_row('#pathway_level', "#row_pathway");

// Setting visibility gene-level heatmap
show_row('#gene_level',"#row_gene_level");

// Setting visibility survival analysis
show_row('#survival_analysis', "#row_survival");
show_title('#survival_tissue_ligand_enzyme', "#title_ligand_enzyme");
show_title('#survival_tissue_gpcr_ligand_enzyme', "#title_gpcr_ligand_enzyme");
show_title('#survival_subtype', "#title_survival_subtype");
show_title('#survival_tissue_ligand_enzyme_subtype', "#title_ligand_enzyme_subtype");
show_title('#survival_tissue_gpcr_ligand_enzyme_subtype', "#title_gpcr_ligand_enzyme_subtype");

// Setting visibility Coupling/Transduction Mechanism
show_row('#coupling_level', '#row_coupling');

// Cross ref
show_title("#crossref","#row_related");

// Export pathways level heatmaps
$('#exp_path').click(function() {
downloadPng("pathway_level_heatmap", "pathway_level_heatmap");
downloadPng("subtypes_level_heatmap", "subtypes_level_heatmap");
});

// Intro modal
$('#btnIntro').click(function() {
introPanel();
});
});

/**
 * Shows the row with the given ID if the result type is not empty.
 * @param {string} result_type - The ID of the result type input element.
 * @param {string} row_id - The ID of the row to show.
 */
function show_row(result_type, row_id){
const type_val = $(result_type).val() || ""; // Use default value
if (type_val){
    $(row_id).removeClass("hidden");
}
}

function show_title(result_type, row_id){
const type_val = $(result_type).val() || "[]"; // Use default value
if (type_val.length > 2){
    $(row_id).removeClass("hidden");
}
}

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