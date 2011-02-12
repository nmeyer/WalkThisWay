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
        if (result.tracks && result.tracks.length && result.tracks[0].preview_url) {
            el.song = result;
            console.log(el)
            p.progress(el);
        }
        return handle(p, list);
    });
}

if (process.argv[1] === __filename) {
    var c = new twitter.client();
    var p = new promise.Promise();
    when(c.search('#nowplaying'), function(twitter_info) {
        for (var i = 0; i < twitter_info.length; i++) {
            console.log(twitter_info[i])
        }
        // handle(p, twitter_info);
    })
}