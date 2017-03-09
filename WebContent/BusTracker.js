/**
 * Written by Kyra Oberholtzer
 * Lab 9
 */
var map = null;	        // a Google Map object
var timer = null;       // an interval timer
var update = 0;         // update counter
var markers = [];       // array of markers

$(document).ready(function() {      // when document loads, do some initialization
	  "use strict";
    var startPoint = new google.maps.LatLng(43.044240, -87.906446);// location of MSOE athletic field
    displayMap(startPoint); // map this starting location (see code below) using Google Maps
    addMarker(map, startPoint, "MSOE Athletic Field", "The place to be!");  // add a push-pin to the map

    // initialize button event handlers (note this shows an alternative to $("#id).click(handleClick)
    $("#start").on( "click", doAjaxRequest);
    $("#stop").on( "click", stopTimer);
});

//Enter key link to start button
$(document).keypress(function(e){
    if (e.which == 13){
        $("#start").click();
    }
});

// Display a Google Map centered on the specified position. If the map already exists, update the center point of the map per the specified position
// param position - a google.maps.LatLng object containing the coordinates to center the map around
function displayMap(position) {
	  "use strict";
	      var mapOptions = {
        zoom: 13, // range 0 to 21 (the mouse can be used to zoom in and out)
        center: position, // the position at the center of the map
        mapTypeId: google.maps.MapTypeId.ROADMAP // ROADMAP, SATELLITE, or HYBRID
    };
    var mapDiv = $("#map").get(0); // get the DOM <div> element underlying the jQuery result
    if(map===null) { // create just once
        map = new google.maps.Map(mapDiv, mapOptions); // create a map if one doesn't exist
    }
    else {
        map.panTo(position); // otherwise, pan the existing map to the specified position
    }
}

// This function adds a "push-pin" marker to the existing map
// param map - the map to add the marker to
// param position - the google.maps.LatLng position of the marker on the map
// param title - the title of the marker
// param content - the text that appears when a user clicks on the marker
function addMarker(map, position, title, content) {
	  "use strict";
	      var markerOptions = {
        position: position, // position of the push-pin
        map: map,	// the map to put the pin into
        title: title, // title of the pin
        clickable: true, // if true, enable info window pop-up
        icon: "motorcycle.png" //change from default icon
    };
    // create the push-pin marker
    var marker = new google.maps.Marker(markerOptions);
    // allow for only 10 markers
    markers.push(marker);
    if(markers.length > 10) {
        markers.shift().setMap(null);
    }

    // now create the pop-up window that is displayed when you click the marker
    var infoWindowOptions = {
        content: content, // description
        position: position // where to put it
    };
    var infoWindow = new google.maps.InfoWindow(infoWindowOptions);
    google.maps.event.addListener(marker, "click", function() {
        infoWindow.open(map);
    });
}


// This function executes a JSON request to the CPULoadServlet
function doAjaxRequest() {
	  "use strict";
    var params = "key=" + key + "&rt="; //key for url in correct format "key=ABCDEF123456789&rt=31"

    params += $("#route").val().toString();

    //Do Ajax request
    $.ajax({
        type : "GET", // request via HTTP GET
        url : "http://localhost:3002/BusInfo?", // the url of the servlet returning the Ajax response
        data : params, // key and route, for example "key=ABCDEF123456789&rt=31"
        crossDomain: true,// cross-origin request? Then set to true
        async: true, // the default; false for synchronous
        dataType : "json", // we want a JSON response
        success : handleSuccess, // the function to call on success
        error : handleError // the function to call if an error occurs

    });

    // create timer that runs every 5 seconds
    // When started, it should cause doAjaxRequest to be called every 5 seconds
    if(timer===null){
        timer = setInterval(doAjaxRequest, 5000);
    }

}

// This function stops the timer and nulls the reference
// Clears the update label and the map markers
function stopTimer() {
	  "use strict";

	  clearInterval(timer);
	  timer = null;

	  update = 0;
	  $("#update").html("");

	  clearMarkers();

}

//This function clears all of the markers on the map
function clearMarkers(){
    for (var i = 0; i < markers.length; i++){
        markers[i].setMap(null);
    }
}

// This function is called if the Ajax request succeeds.
// The response from the server is a JavaScript object!
function handleSuccess( response, textStatus, jqXHR ) {
    "use strict";

    var result;
    console.log("response is " + textStatus);

    // starting html for the table
    var innerhtml = "<tr><th>Bus</th><th>Route " + $("#route").val().toString() + "</th><th>latitude</th><th>longitude</th><th>speed(MPH)</th><th>dist(mi)</th></tr>";

    // checks if bustime-response exists
    // if not it means the response includes an error
    if (response["bustime-response"] !== undefined) {
        result = response["bustime-response"];
        // checks if the error element exists
        // if it does the route or key was incorrect
        if (result.error === undefined) {
            result = response["bustime-response"];
            // loop through bus elements from response and add
            // them to the table innerhtml
            for (var i = 0; i < result["vehicle"].length; i++) {

                var bus = result.vehicle[i];

                var distance = bus.pdist/5280;
                distance = parseFloat(Math.round(distance * 100) / 100).toFixed(2);
                var speed = bus.spd;
                var latitude = bus.lat;
                latitude = parseFloat(Math.round(latitude * 100) / 100).toFixed(2);
                var longitude = bus.lon;
                longitude = parseFloat(Math.round(longitude * 100) / 100).toFixed(2);
                var title = bus.vid;
                var content = bus.des;

                innerhtml += "<tr>";
                innerhtml += "<td>" + title + "</td>";
                innerhtml += "<td>" + content + "</td>";
                innerhtml += "<td>" + latitude + "</td>";
                innerhtml += "<td>" + longitude + "</td>";
                innerhtml += "<td>" + speed + "</td>";
                innerhtml += "<td>" + distance + "</td>";
                innerhtml += "</tr>";


                var position = new google.maps.LatLng(latitude, longitude); // creates a Google position object
                addMarker(map, position, title, content); // adds the position object to the map

            }
            // increment the update after ajax call completes, only reached if successful
            update++;
            // update html to display the update and number in the format "Update #"
            var html = "Update " + update;
            $("#update").html(html);

            // update table to innerhtml generated in the loop
            $("#table1").html(innerhtml);
        } else {
            // print out error message to table if result.error exists
            innerhtml = "<tr><td>" + result["error"][0].msg + "</td></tr>";
            $("#table1").html(innerhtml);
            stopTimer();
        }
    }
    else {
        // print out error message to table if bustime-response doesn't exist
        innerhtml = "<tr><td>" + response.status + "</td></tr>";
        $("#table1").html(innerhtml);
        stopTimer();
    }


}

// This function is called if the Ajax request fails (e.g. network error, bad url, server timeout, etc)
function handleError(jqXHR, textStatus, errorThrown) {
    "use strict";
    console.log("Error processing Ajax request!");
    // print out error to table if there was an error processing the ajax request
    var innerhtml = "<tr><td>" + "Error processing Ajax request!" + "</td></tr>";
    $("#table1").html(innerhtml);
    stopTimer();
}
