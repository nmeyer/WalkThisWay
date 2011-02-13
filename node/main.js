require.paths.unshift(__dirname);

var assert = require('assert'),
    querystring = require('querystring'),
    httpclient = require('lib/httpclient'),
    location = require('location'),
    when = require('lib/promise').when,
    lang = require('lib/lang'),
    twitter = require('twitter'),
    echonest = require('echonest'),
promise = require('lib/promise'),
db = require('lib/mongodb').Database;

var running = [];


function handle(p, list) {
    if (list.length === 0) {
        return;
    }
    var el = list.shift();
    var d = new echonest.client();
    when(d.lookup_song(el.name), function(result) {
        if (result && result.tracks && result.tracks.length && result.tracks[0].preview_url) {
            el.track_url = result.tracks[0].preview_url;
            el.title = result.title;
            el.raw_echonest = result;
            console.log(el);
            for (var i = 0; i < running.length; i++) {
                if (p === running[i]) {
                    p.progress(el);
                    break;
                }
            }
        }
        return handle(p, list);
    });
}

var id = 0;
function assign_id(obj) {
    id++;
    obj.id = id;
}

function format_location(obj) {
    if (typeof obj === 'string') {
	return obj;
    } else {
	return "" + obj.latitude + ',' + obj.longitude;
    }
}

var echo_queries = 0
function search(loc) {
    var c = new twitter.client();
    var echo = new echonest.client();
    
    var p = new promise.Promise();
    assign_id(p);
    running.push(p);
    console.log('running search:' + p.id)

    var results = [];
    var total = 0;
    var q = c.search(format_location(loc), '#nowplaying');
    q.then(
	function() {
	    /*
	    console.log('resolving')
	    for (var i = 0; i < results.length; i++) {
		var tweet = results[i];
		var first_song = tweet.song_info;
		if (first_song && first_song.tracks && first_song.tracks.length) {
		    tweet.track_url = first_song.tracks[0].preview_url;
		    p.progress(tweet);
		    console.log('sending tweet:')
		    console.log(tweet);
		    break;
		}
	    }
	    */
	},
	function(e){
	    console.log('uh oh')
	    console.log(e)
	},
	function(x) {
	    total += x.length;
	    var tweet;
	    for(var i = 0; i < x.length; i++) {
		tweet = x[i];
		if (tweet.id && tweet.id_str) {
		    results.push(tweet);
/*
		    if (echo_queries >= 10) { 
			continue;
		    }
*/
		    console.log('asking for song info from echonest')
// 		    echo_queries++;
            
            var whenHandler = (function(t) {
                return function(first_song) {
        			console.log('got song info from echonest from tweet: ')
        			console.log(t)
        			t.song_info = first_song;
        			if (first_song && first_song.tracks && first_song.tracks.length) {
        			    t.track_url = first_song.tracks[0].preview_url;
        			    p.progress(t);
        			}
    		    }
            })(tweet)
		    when(echo.lookup_song(tweet.info.title), whenHandler);
		}
	    }
	    // p.resolve();
	})

    /*
    c.search('#nowplaying', "" + loc.latitude + ',' + loc.longitude).then(function() {console.log('resolved')}, function(){console.log('rejected') }, function(twitter_info) {
        console.log('progress:' + p.id)
        handle(p, twitter_info);
    })
    */
    return p;
}

function stop_search() {
    while (running.length) {
        el = running.pop();
        console.log('stopping:' + el.id)
    }
}

exports.stop_search = stop_search
exports.search = search

if (process.argv[1] === __filename) {
    var p = new promise.Promise();
    var results = [];
    var total = 0;
    
    search("40.7392920,-73.9893630", '#nowplaying').then(
	function() {
	},
	function(e){
	    console.log('uh oh')
	    console.log(e)
	},
	function(x) {
	    console.log(x)
	})
}