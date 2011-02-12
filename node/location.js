require.paths.unshift(__dirname);

var assert = require('assert'),
    querystring = require('querystring'),
    httpclient = require('lib/httpclient'),
    when = require('lib/promise').when;

function location_client() {
}

location_client.prototype.current_location = function() {
    return "40.7392920,-73.9893630";
};

    if (process.argv[1] === __filename) {

var params = {address:"902+broadway+st+10010", sensor: "false"};
var client = new httpclient.HttpClient();

var url = "http://maps.googleapis.com/maps/api/geocode/json?" + querystring.stringify(params)
console.log(url)
when(client.get(url), function(response) {
    console.log(response.body)
})
}

exports.client = location_client;