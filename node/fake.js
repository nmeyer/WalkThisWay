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

var fake_urls = [
    'http://previews.7digital.com/clips/1069/10541562.clip.mp3',
    'http://previews.7digital.com/clips/1069/11906060.clip.mp3',
    'http://previews.7digital.com/clips/1069/8826261.clip.mp3',
    'http://previews.7digital.com/clips/1069/10866589.clip.mp3',
    'http://previews.7digital.com/clips/1069/3470736.clip.mp3',
    'http://previews.7digital.com/clips/1069/3246146.clip.mp3'
]

function fake_object() {
    var lat = 40.7392920;
    var lng = -73.9893630;
    var dlat = 0.01;
    var dlng = 0.01;
    var track_num = Math.floor(Math.random() * 30) % 5
    return {
        location: {
            latitude: lat + (((Math.random() * 2) - 1) * dlat),
            longitude: lng + (((Math.random() * 2) - 1) * dlng)
        },
        track_url: fake_urls[track_num]
    }
}

var running = false;
var T = 250;
function helper(p) {
    setTimeout(function() {
        console.log('*** sending ***');
        p.progress(fake_object());
        helper(p);
    }, 15000);
}

exports.search = function() {
    if (running) return {
        then: function() {}
    };
    running = true;
    var p = new promise.Promise();
    
    setTimeout(function() {
        console.log('*** sending ***')
        p.progress(fake_object())  
    }, 1000)
    
    helper(p);
    return p;
}