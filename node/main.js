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
            console.log(el)
            p.progress(el);
        }
        return handle(p, list);
    });
}

function search(loc) {
    var c = new twitter.client();
    var p = new promise.Promise();
    when(c.search('#nowplaying', "" + loc.latitude + ',' + loc.longitude), function(twitter_info) {
        handle(p, twitter_info);
    })
    return p;
}

exports.search = search

if (process.argv[1] === __filename) {
    var c = new twitter.client();
    var p = new promise.Promise();
    when(c.search('#nowplaying', "40.7392920,-73.9893630"), function(twitter_info) {
        handle(p, twitter_info);
    })
}