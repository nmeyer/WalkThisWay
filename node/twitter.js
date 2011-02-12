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
        return !(el.startswith("#") || el.startswith('@') || (el === 'rt'));
    });
    return tokens.join(' ');
}
 
/**
 * returns a promise that returns:
 * {name: song name, lat: lat of twitter post, lng: lng of twitter post}
 */
twitter_client.prototype.search_helper = function(p, term, page) {
    var self = this;
    var loc = new location.client();
    
    var params = {
        q: term,
        geocode: loc.current_location() + ",1mi",
        rpp: 100,
        page: page
    };
    
    // console.log(self.search_url.prefix + querystring.stringify(params) + self.search_url.suffix)
    when(self.client.get(self.search_url.prefix + querystring.stringify(params) + self.search_url.suffix), function(response) {
        var q = JSON.parse(response.body);
        var results = q.results.map(function(x) {
            var data = {
                name: self.clean(x.text),
                lat: 0,
                lng: 0
            };
            try {
                var lat_lng = x.location.split(' ')[1].split(',').map(parseFloat);
                data.lat = lat_lng[0];
                data.lng = lat_lng[1];
            } catch (e) {
            }
            return data;
        }).filter(function(x) {
            return x.name.length && x.lat && !isNaN(x.lat) && x.lng && !isNaN(x.lng);
        });
        p.resolve(results);
    })
}
twitter_client.prototype.search = function(term) {
    var self = this;
    
    var p = new promise.Promise();
    self.search_helper(p, term);
    return p;
};


exports.client = twitter_client;

// test
if (process.argv[1] === __filename) {
    var c = new twitter_client();
    c.blah();
}