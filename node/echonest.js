require.paths.unshift(__dirname);


var assert = require('assert'),
    querystring = require('querystring'),
    httpclient = require('lib/httpclient'),
    location = require('location'),
    promise = require('lib/promise'),
    when = promise.when;
    
function echonest_client() {
    this.key = "T55ZYXXBRBVZXB2CF";
    this.url = "http://developer.echonest.com/api/v4" // [type]/[method] 
    this.client = new httpclient.HttpClient();
}

echonest_client.prototype.blah = function(name) {
    var self = this;
    var p = new promise.Promise();
    var params = {
        api_key: self.key,
        title: name
    };
    var url = self.url + '/song/search?' + querystring.stringify(params);
    when(self.client.get(url), function(response) {
        p.resolve(JSON.parse(response.body).response.songs[0]);
    });
    return p;
}

exports.client = echonest_client;

// test
if (process.argv[1] === __filename) {
    var c = new echonest_client();
    c.blah();
}