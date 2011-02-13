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

twitter_client.prototype.detect_location_format = function(x) {
    assert.notEqual(x, undefined, 'there is no x')
    x = x.toLowerCase();
    var tokens = x.split(' ');
    var num_tokens = tokens.length;
    if (num_tokens ===2 && tokens[0].endswith(':')) {
        var lat_lng = tokens[1].split(',').map(parseFloat);
        return {
            location: {
                latitude: lat_lng[0],
                longitude: lat_lng[1]
            }
        };
    } else if (num_tokens === 2 && tokens[0].endswith(',')) {
        return {
            location: {
                latitude: parseFloat(tokens[0]),
                longitude: parseFloat(tokens[1])
            }
        };
    } 
    return {};
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
twitter_client.prototype.search_helper = function(p, term, location) {
    var self = this;
    
    var params = {
        q: term,
        geocode: location + ",5mi",
        rpp: 100
    };
    console.log(params)
    
    // console.log(self.search_url.prefix + querystring.stringify(params) + self.search_url.suffix)
    when(self.client.get(self.search_url.prefix + querystring.stringify(params) + self.search_url.suffix), function(response) {
        var q = JSON.parse(response.body);
        var results = q.results.map(function(x) {
            var data = {
                name: self.clean(x.text),
                location: {},
                raw_twitter: x
            };
            try {
                var lat_lng = x.location.split(' ')[1].split(',').map(parseFloat);
                data.location.latitude = lat_lng[0];
                data.location.longitude = lat_lng[1];
            } catch (e) {
            }
            return data;
        }).filter(function(x) {
            return x.name.length && x.location.latitude && !isNaN(x.location.latitude) && x.location.longitude && !isNaN(x.location.longitude);
        });
        p.progress(results);
    })
}
twitter_client.prototype.search = function(term, location) {
    var self = this;
    var p = new promise.Promise();
    self.search_helper(p, term, location);
    return p;
};

exports.client = twitter_client;

// test
if (process.argv[1] === __filename) {
    var c = new twitter_client();
    c.blah();
}