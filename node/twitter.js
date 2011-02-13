require.paths.unshift(__dirname);


var assert = require('assert'),
    querystring = require('querystring'),
    httpclient = require('lib/httpclient'),
    location = require('location'),
    when = require('lib/promise').when,
    lang = require('lib/lang'),
    promise = require('lib/promise');

// twitter id -> [song name, raw]
var mapping = {
};

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
                latitude: lat_lng[0],
                longitude: lat_lng[1]
        };
    } else if (num_tokens === 2 && tokens[0].endswith(',')) {
        return {
                latitude: parseFloat(tokens[0]),
                longitude: parseFloat(tokens[1])
        };
    } 
    return {};
}


/**
 * valid options:
 *   
 */
twitter_client.prototype.clean = function(s) {
    s = s.toLowerCase();
    // s = s.replace(/&.+;/g, ' ');
    var tokens = s.split(' ');
    tokens = tokens.filter(function(el) {
        return !(el.startswith("#") || el.startswith('@') || (el === 'rt') || el.startswith('http'));
    });
    return tokens.join(' ');
}
 
twitter_client.prototype.search_helper = function(p, location, term, source, topics, page) {
    var self = this;
    page = page || 1;
    if (page >= 10) {
	p.resolve();
	return;
    }
    assert.ok((source != undefined) || (term != undefined) || (topic != undefined), 'one query term must be defined');
    var g = (location) ? location + ',2mi' : undefined;
    var params = {
        q: term,
        geocode: g,
        rpp: 100,
	page: page,
	lang: 'en'
    };
    console.log(params)
    
    console.log(self.search_url.prefix + querystring.stringify(params) + self.search_url.suffix)
    when(self.client.get(self.search_url.prefix + querystring.stringify(params) + self.search_url.suffix), function(response) {
        var q = JSON.parse(response.body);
        var results = [], result;
	for (var i = 0; i < q.results.length; i++) {
	    result = q.results[i];
	    // console.log(result)
	    result.info = one(self.clean(result.text))
	    result.location = self.detect_location_format(result.location)
	    if (result.location.latitude && result.location.longitude)
		results.push(result)
	}
	console.log('twitter.progress w/ ' + results.length);
        p.progress(results.slice(0, 25));
	if (false && results.length) {
	    self.search_helper(p, location, term, source, topics, page + 1);
	} else {
	    console.log('twitter.resolve')
	    // p.resolve();
	    return;
	}
    })
}

/**
 * returns a promise that returns:
 * {name: song name, lat: lat of twitter post, lng: lng of twitter post}
 */
twitter_client.prototype.search = function(location, term) {
    var self = this;
    var p = new promise.Promise();
    self.search_helper(p,location,term);

    /*
    c.search("40.7392920,-73.9893630", '#nowplaying').then(function(){
	for (var i = 0; i < 10; i++) {
	    var s = c.clean(results[i].text);
	    console.log(one(s))
	}
    }, function(e){
	console.log('uh oh')
	console.log(e)
    }, function(x) {
	total += x.length;
	console.log('x:' + x.length + ', ' + total);
	var tweet;
	for(var i = 0; i < x.length; i++) {
	    tweet = x[i];
	    if (tweet.id && tweet.id_str) {
		results.push(tweet);
	    }
	}
    });
    */

    return p;
};

exports.client = twitter_client;

function one(s) {
    var data = {}
    var b = 0, e = s.length;
    if (s.indexOf('listening to') !== -1) {
	b = s.indexOf('listening to') + ('listening to').length;
    }
    
    if ((s.indexOf('by') != -1) && (s.indexOf('by') === s.lastIndexOf('by'))) {
	e = s.lastIndexOf('by')
    }
    data.title = s.substring(b, e);
    
    if (e !== s.length) {
	data.author = s.substr(e + 2);
    }
    return data;
}

// test
if (process.argv[1] === __filename) {
    var c = new twitter_client();
    var total = 0;
    var results = [];
    c.search("40.7392920,-73.9893630", '#nowplaying').then(function(){
	for (var i = 0; i < 10; i++) {
	    var s = c.clean(results[i].text);
	    console.log(one(s))
	}
    }, function(e){
	console.log('uh oh')
	console.log(e)
    }, function(x) {
	total += x.length;
	console.log('x:' + x.length + ', ' + total);
	console.log(x)
	var tweet;
	for(var i = 0; i < x.length; i++) {
	    tweet = x[i];
	    if (tweet.id && tweet.id_str) {
		results.push(tweet);
	    }
	}
    });
}
