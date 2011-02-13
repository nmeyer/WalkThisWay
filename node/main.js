require.paths.unshift(__dirname);

var assert = require('assert'),
    querystring = require('querystring'),
    httpclient = require('lib/httpclient'),
    location = require('location'),
    when = require('lib/promise').when,
    lang = require('lib/lang'),
    twitter = require('twitter'),
    echonest = require('echonest'),
    promise = require('lib/promise');

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

function search(loc) {
    var c = new twitter.client();
    var p = new promise.Promise();
    assign_id(p);
    running.push(p);
    console.log('running search:' + p.id)
    c.search('#nowplaying', "" + loc.latitude + ',' + loc.longitude).then(function() {console.log('resolved')}, function(){console.log('rejected') }, function(twitter_info) {
        console.log('progress:' + p.id)
        handle(p, twitter_info);
    })
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
    var c = new twitter.client();
    var p = new promise.Promise();
    c.search('#nowplaying', "40.7392920,-73.9893630").then(function() {}, function(){}, function(twitter_info) {
        handle(p, twitter_info);
    })
}