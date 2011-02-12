require.paths.unshift(__dirname);


var assert = require('assert'),
    querystring = require('querystring'),
    httpclient = require('lib/httpclient'),
    location = require('location'),
    promise = require('lib/promise'),
    when = promise.when;
    
function echonest_client() {
    this.key = "T55ZYXXBRBVZXB2CF";
    this.url = "http://developer.echonest.com/api/v4" // [type]/[method] 
    this.client = new httpclient.HttpClient();
}


/**
 * returns a promise that returns:
 * {name: song name, lat: lat of twitter post, lng: lng of twitter post}
 */
echonest_client.prototype.lookup_song = function(name) {
    var self = this;
    var p = new promise.Promise();
    var params;
    
    var url;
    params = {
        api_key: self.key,
        title: name
    };
    url = self.url + '/song/search?' + querystring.stringify(params) + '&bucket=id:7digital&bucket=tracks';
    // console.log(url)
    when(self.client.get(url), function(response) {
        var songs =  JSON.parse(response.body).response.songs;
        if (songs && songs.length)
            p.resolve(songs[0]);
        } else {
            p.reject();
            
        }
    });
    return p;
}

exports.client = echonest_client;

// test
if (process.argv[1] === __filename) {
    var c = new echonest_client();
    c.blah();
}