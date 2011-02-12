require.paths.unshift(__dirname);


var assert = require('assert'),
    querystring = require('querystring'),
    httpclient = require('lib/httpclient'),
    location = require('location'),
    when = require('lib/promise').when,
    lang = require('lib/lang'),
    promise = require('lib/promise');

var DEFAULTS = {
    
};

function twitter_client() {
    this.format = 'json';
    this.client = new httpclient.HttpClient();
    this.search_url = {
        prefix: "http://search.twitter.com/search." + this.format + "?",
        suffix: ""
    };
    this.tweet_url = {
        prefix: "http://api.twitter.com/1/statuses/show/",
        suffix: "." + this.format
    };
}



/**
 * valid options:
 *   
 */
twitter_client.prototype.clean = function(s) {
    // remove tokens that start with 
    // #
    s = s.toLowerCase();
    var tokens = s.split(' ');
    tokens = tokens.filter(function(el) {
        return !(el.startswith("#") || el.startswith('@'));
    });
    return tokens.join(' ');
}
 
twitter_client.prototype.blah = function(options) {
    var self = this;
    
    var p = new promise.Promise();
    var params = {
        q: '#nowplaying',
        geocode: "40.7392920,-73.9893630,1mi"
    };
    
    console.log(self.search_url.prefix + querystring.stringify(params) + self.search_url.suffix)
    when(self.client.get(self.search_url.prefix + querystring.stringify(params) + self.search_url.suffix), function(response) {
        var q = JSON.parse(response.body);
        p.resolve(self.clean(q.results[0].text));
    })
    return p;
};


exports.client = twitter_client;

// test
if (process.argv[1] === __filename) {
    var c = new twitter_client();
    c.blah();
}