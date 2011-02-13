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
    
exports.stop_search = function() {
    
}

function fake_object() {
    var lat = 40.7392920;
    var lng = -73.9893630;
    var dlat = 0.05;
    var dlng = 0.05;
    return {
        location: {
            latitude: lat + (((Math.random() * 2) - 1) * dlat),
            longitude: lng + (((Math.random() * 2) - 1) * dlng)
        },
        track_url: 'http://previews.7digital.com/clips/1069/8826261.clip.mp3'
    }
}

var running = false;
var T = 250;
function helper(p) {
    setTimeout(function() {
        console.log('*** sending ***');
        p.progress(fake_object());
        helper(p);
    }, Math.random() * T);
}

exports.search = function() {
    if (running) return {
        then: function() {}
    };
    running = true;
    var p = new promise.Promise();
    helper(p);
    return p;
}