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

function handle(list) {
    if (list.length === 0) {
        return;
    }
    var el = list.shift();
    var d = new echonest.client();
    when(d.lookup_song(el.name), function(result) {
        el.song = result;
        console.log(el);
        return handle(list);
    });
}

if (process.argv[1] === __filename) {
    var c = new twitter.client();
    
    when(c.blah(), function(twitter_info) {
        handle(twitter_info);
    })
}