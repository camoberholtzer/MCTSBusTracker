/**
 * Kyra Oberholtzer
 * Lab 9
 * SE 2840
 *
 * BusTrackerServer.js is a NodeJS Server
 * which when run creates a server running
 * on a local port
 */

//require libraries for runtime
var express = require('express'); // express web server framework from NPM
var favicon = require('serve-favicon');
var ajax = require('request'); // import the request library (downloaded from NPM) for making ajax requests
var http = require('http');

// defines the app
var app = express();

//loads icon to web browser
app.use(favicon(__dirname + '/WebContent/favicon.ico'));

//runs the server on port 3002
var server = app.listen(3002);

//when /BusInfo is added to the url this method is called to do an ajax request to mcts
app.get('/BusInfo', function( request, response ) {

    var route = request.query.rt; // route found in url
    var key = request.query.key; // key found in url
    var uri = "http://realtime.ridemcts.com/bustime/api/v2/getvehicles?key="+ key + "&rt=" + route + "&format=json"; //url to call for json response

    // the default response (same as asking for route 1000)
    var busData = {status:"Server Error; IOException during request to ridemcts.com: Simulated server error during request to ridemcts.com"};

    if( route === '1000') { // simulate MCTS server error..
        response.json(busData); // note that this sends the above default response
        response.end();
    } else if( route === '1001' ) { // 1001 error, page not found
        response.sendStatus(404);
    } else if ( route === '1002') { // 1002 error, key or route not specified
        busData = {status:"Key or route parameter empty"};
        response.json(busData);
        response.end();
    } else if ( route === '1003') { // 1003 error, invalid key supplied
        busData = {"bustime-response":{"error":[{msg:"Invalid API access key supplied"}]}};
        response.json(busData);
        response.end();
    } else {
        // if no errors are simulated, make the real ajax call to MCTS
        ajax(uri, function( error, res, body ) {
            if( !error && res.statusCode === 200 ) { // no errors and a good response
                // parse the body (a JSON string) to a JavaScript object
                busData = JSON.parse(body);
            }
            // Note: if a failure occurs, the default response above is sent here
            response.json(busData); // no need to set content-type! Express handles it automatically
        });
    }
});

// serves up the html files to the server
app.use(express.static('./WebContent'));