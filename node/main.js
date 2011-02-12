require.paths.unshift(__dirname);

var assert = require('assert'),
    querystring = require('querystring'),
    httpclient = require('lib/httpclient'),
    location = require('location'),
    when = require('lib/promise').when,
    lang = require('lib/lang'),
    twitter = require('twitter'),
    echonest = require('echonest');
    
if (process.argv[1] === __filename) {
    var c = new twitter.client();
    var d = new echonest.client();
    
    when(c.blah(), function(name) {
        when(d.blah(name), function(result) {
            console.log(result);
        })
    })
}