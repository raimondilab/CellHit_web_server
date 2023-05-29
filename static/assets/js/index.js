$( document ).ready(function() {

// Assigning values to window object
window.onload = initializeCookieBanner();
window.hideCookieBanner = hideCookieBanner;



// Show results
$("#search-box").submit(function(e){

  const databaseBtn = $('#databaseBtn').val();
  const annotationBtn = $('#annotationBtn').val();

	if (databaseBtn !== "" && databaseBtn !== "undefined" && annotationBtn !== "" && annotationBtn  !== "undefined") {
	     $("#search-box").submit();

	}

    Swal.fire({
      title: 'Oops...',
      text: 'Please fill out these fields!',
     showCloseButton: true
     });

    e.preventDefault();
});

});

/* Javascript to show and hide cookie banner using localstorage */
/* Shows the Cookie banner */
function showCookieBanner(){
 let cookieBanner = document.getElementById("cb-cookie-banner");
 cookieBanner.style.display = "block";
}

/* Hides the Cookie banner and saves the value to localstorage */
function hideCookieBanner(){
 localStorage.setItem("cb_isCookieAccepted", "yes");
 let cookieBanner = document.getElementById("cb-cookie-banner");
 cookieBanner.style.display = "none";
}

/* Checks the localstorage and shows Cookie banner based on it. */
function initializeCookieBanner(){
 let isCookieAccepted = localStorage.getItem("cb_isCookieAccepted");
 if(isCookieAccepted === null)
 {
  localStorage.setItem("cb_isCookieAccepted", "no");
  showCookieBanner();
 }
 if(isCookieAccepted === "no"){
  showCookieBanner();
 }
}