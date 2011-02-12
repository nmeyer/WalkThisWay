var http = require("http");
var url = require("url");
var sys = require("sys");
var events = require("events");
var querystring = require("querystring")
var promise = require("lib/promise")
var fs = require('fs')
var path = require('path')
// var config = require('config')

var _filecache = {}

// This is a hack to get cookies to work with http library headers. this will likely break any other libraries using node.js/http
// As far as i can see, node.js is broken how it handles headers and this change should be implemented in node.js core
http.IncomingMessage.prototype._addHeaderLine = function (field, value) {
	if(field == "set-cookie") {
		if (this.headers.hasOwnProperty(field)) {
			this.headers[field].push(value);
		} else {
			this.headers[field] = [value];
		}
	}
	else {
		if (this.headers.hasOwnProperty(field)) {
			this.headers[field] += ", " + value;
		} else {
			this.headers[field] = value;
		}
	}
};

try {
	var compress = require("lib/compress");
}
catch(err) {
	if( err.message.indexOf("Cannot find module") >= 0 ) {
		sys.puts("no compress");
		var compress = null;
	}
	else {
		throw err;
	}
}

var HttpClient = function(proxy) {
    this.index = _filecache.instance++
    this.proxy = proxy
    this.cookies = []
}

HttpClient.prototype.getHeaders = function(curl, method, data, exheaders) {
	var headers = {
		"User-Agent": "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.6; en-US; rv:1.9.2.12) Gecko/20101026 Firefox/3.6.12",
		"Accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding":"gzip,deflate",
		"Accept-Language":"en-us,en;q=0.5",
        "Accept-Charset":"ISO-8859-1,utf-8;q=0.7,*;q=0.7",
        "Connection": "close",
        "Keep-Alive": "115",
		"Host" : curl.hostname
	};
	if (this.proxy) {
	    headers['Proxy-Connection'] = 'keep-alive'
	}
	if(method == "POST") {
		headers["Content-Length"] = data.length;
		headers["Content-Type"] = "application/x-www-form-urlencoded";
	}
	for (attr in exheaders) { headers[attr] = exheaders[attr]; }		
	if(!compress && headers["Accept-Encoding"]) {
		headers["Accept-Encoding"] = "none";
	}    

    var cookies = this.cookies
	var mycookies = [];

	cookies.filter(function(value, index, arr) {
		if(curl.pathname) {
			return(curl.hostname.substring(curl.hostname.length - value.domain.length) == value.domain && curl.pathname.indexOf(value.path) >= 0);
		}
		else {
			return(curl.hostname.substring(curl.hostname.length - value.domain.length) == value.domain);
		}
	}).forEach( function(cookie) {
		mycookies.push(cookie.value);
	});
	if( mycookies.length > 0 ) {
	    headers["Cookie"] = mycookies.join(";");
	}
	return headers
}

HttpClient.prototype.updateCookies = function(cookieHeader, curl) {
    var cookies = this.cookies
    cookieHeader.forEach( function( cookie ) {
		var props = cookie.split(";");
		var newcookie = {
			"value": "",
			"domain": "",
			"path": "/",
			"expires": ""
		};
		
		newcookie.value = props.shift();
		props.forEach( function( prop ) {
			var parts = prop.split("="),
			    name = parts[0].trim();
			switch(name.toLowerCase()) {
				case "domain":
					newcookie.domain = parts[1].trim();
					break;
				case "path":
					newcookie.path = parts[1].trim();
					break;
				case "expires":
					newcookie.expires = parts[1].trim();
					break;
			}
		});
		if(newcookie.domain == "") newcookie.domain = curl.hostname;
		var match = cookies.filter(function(value, index, arr) {
			if(value.domain == newcookie.domain && value.path == newcookie.path && value.value.split("=")[0] == newcookie.value.split("=")[0]) {
				arr[index] = newcookie;
				return true;
			}
			else {
				return false;
			}
		});
		if(match.length == 0) cookies.push(newcookie);
	});
}

HttpClient.prototype.formatHeaders = function(headers) {
    var parts = []
    for (var key in headers) {
        parts.push(key+': '+headers[key])
    }
    return parts.join('\n')
}

HttpClient.prototype.doRequest = function(client, method, target, headers) {
    var req = client.request(method, target, headers)
    if (this.debug) {
        console.log('\n===> REQUEST:')
        console.log(method+' '+target+' HTTP/1.1')
        console.log(this.formatHeaders(headers))
    }
    return req
}

HttpClient.prototype.getTarget = function(curl) {
    var target = "";
	if(curl.pathname) target += curl.pathname;
	if(curl.search) target += curl.search.replace(/ /g, '%20').replace(/:/g, '%3A');
	if(curl.hash) target += curl.hash;
	if(target=="") target = "/";
    return target
}

HttpClient.prototype.get = function(rurl, exheaders, followRedirects, isRedirect) {
    return this.perform(rurl, "GET", null, exheaders, followRedirects, isRedirect)
}

HttpClient.prototype.post = function(rurl, data, exheaders, followRedirects, isRedirect) {
    if (typeof data != 'string')
        data = querystring.stringify(data);
    return this.perform(rurl, "POST", data, exheaders, followRedirects, isRedirect)
}

HttpClient.prototype.doPoll = function(testFunc, timeout, rurl, method, data, exheaders, followRedirects, isRedirect) {
    timeout = timeout || 1000
    var response = new promise.Promise()    
    var self = this
    var poller = function() {
        self.perform(rurl, method, data, exheaders, followRedirects, true).then(function(resp) {       
            if (testFunc(resp))
                setTimeout(poller, timeout)
            else
                response.resolve(resp)
        }).catch(function(error) {
            response.resolve({
                error: error,
                body: ''
            })
        })
    }
    poller()
    return response
}


HttpClient.prototype.perform = function(rurl, method, data, exheaders, followRedirects, isRedirect) {
    var response = new promise.Promise()

    var pollTestFunc = null
    var pollTimeout = null

    response.poll = function(testFunc, timeout) {
        pollTestFunc = testFunc
        pollTimeout = timeout
        return response
    }

    response.resolveAndPoll = function(r) {
        if (pollTestFunc) {
            self.doPoll(pollTestFunc, pollTimeout, rurl, method, data, exheaders, followRedirects)
                .then(response.resolve)
        }
        else
            response.resolve(r)
    }

    try {
        var self = this

        if (followRedirects == undefined) followRedirects = true
    	var curl = url.parse(rurl);
    	var key = curl.protocol + "//" + curl.hostname;
        var cookies = this.cookies
        var secure = curl.protocol == 'https:';
		var host = curl.hostname
		var port = parseInt(curl.port || secure ? 443 : 80)		
		var target = this.getTarget(curl)
		var headers = this.getHeaders(curl, method, data, exheaders)
		var client = null
		var request = null
		
		if (_filecache.id && !isRedirect) {
            _filecache.index[self.index] = _filecache.index[self.index] == undefined ? 0 : _filecache.index[self.index] + 1
            var dir = config.settings.home+'/node/test/data/html/'+_filecache.id
            var name = host+'-'+self.index+'-'+_filecache.index[self.index]
            var metaFile = [dir, name+'.meta'].join('/')
            var htmlFile = [dir, name+'.html'].join('/')
		    try {
                if (_filecache.refresh) throw "refresh"
                var meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'))
                var html = fs.readFileSync(htmlFile, 'utf8')
                setTimeout(function() {
                    if(meta.headers["set-cookie"]) 
                        self.updateCookies(meta.headers["set-cookie"], curl)                    
                    response.progress(html)                    
                    response.resolve({
                        status: meta.status,
                        headers: meta.headers, 
                        body: html})
                }, 1)
                // console.log(self.index + ': filecache hit: '+htmlFile, html.length);
                return response
            }
            catch (e) {
                if (!_filecache.refresh) throw e
                setTimeout(function() {
                    response.then(function(r) {
                        path.exists(dir, function(exists) {
                            try {
                                if (!exists) fs.mkdirSync(dir, 0644)
                            }
                            catch (e) {
                                if (e.message.indexOf('File exists') == -1) throw e
                            }
                            var meta = {
                                status: r.status,
                                headers: r.headers
                            }
                            fs.writeFileSync(metaFile, JSON.stringify(meta), 'utf8')
                            fs.writeFileSync(htmlFile, r.body, 'utf8')
                        })
                    })                 
                }, 1)
            }
		}

        if (this.proxy) {
            var proxy = this.proxy.split(':')
            host = proxy[0]
            port = proxy[1] || port
            var originalTarget = target
            target = key + originalTarget
            if (secure) {
                var client = http.createClient(port, host)
                var connectHeaders = {
                    'User-Agent': headers['User-Agent'],
                    'Proxy-Connection': 'keep-alive',
                    'Host': curl.hostname,
                    'Content-Length': 0
                }
                request = new promise.Promise()
                var connectReq = self.doRequest(client, 'CONNECT', curl.hostname+':443', connectHeaders)
                connectReq.on('response', function(res) {
                    if (res.statusCode != 200) {
                        response.resolve({
                            error: new Error('Could not establish HTTPS connection via proxy'),
                            body: ''
                        })                                                 
                        return
                    }
                    client.setSecure()
                    client.on('secure', function() {
                        var req = self.doRequest(client, method, originalTarget, headers)
                        request.resolve(req)
                    })
                    client.on('error', function(error) {
                        response.resolve({
                            error: error,
                            body: ''
                        })                         
                    })
                })
                connectReq.end()
            }
        }
        
        if (!client) client = http.createClient(port, host, secure)
        if (!request) request = self.doRequest(client, method, target, headers)

        promise.when(request, function(req) {
            req.addListener("response", function(res) {
                var mybody = [];
                var gunzip= null
                
                if (self.debug) {
                    console.log('\n<=== RESPONSE:')
                    console.log(self.formatHeaders(res.headers))
                }                
                
                if (compress && res.headers["content-encoding"] == "gzip") {
            	    gunzip = new compress.Gunzip;    
                    gunzip.init();
                }

                client.removeAllListeners("error")
                client.on("error", function(e) {
                    if (!res.ended) res.emit("error", e)
                })

                res.setEncoding(res.headers["content-encoding"] == "gzip" ? "binary" : "utf8");

                res.addListener("data", function(chunk) {
                    if (gunzip) 
                        chunk = gunzip.inflate(chunk, "binary");
                    mybody.push(chunk);
                    response.progress(chunk)
                });

                res.addListener("end", function() {
                    try {
                        var body = mybody.join("");
                        if (gunzip) {
                            gunzip.end();
                            gunzip = null
                        }
                        var resp = {
                            "status" : res.statusCode,
                            "location": rurl,
                            "headers" : res.headers,
                            "body-length" : body.length,
                            "body" : body
                        }
                        var redir_path = null
                        var delay = 0
                        var match = /content=['"](\d+);\s*url=['"]?(.*?)['"]?['"]/i.exec(body)
                        if (match) {
                            delay = +match[1]
                            redir_path = match[2]
                        }
                        if (res.headers.location) {
                            redir_path = res.headers.location
                            if (redir_path.indexOf('http') != 0 && redir_path[0] != '/') {
                                redir_path = curl.pathname + redir_path
                            }
                        }               
                        if (followRedirects && redir_path && delay < 60) {
                            var redir_url = redir_path
                            if (redir_url.indexOf('http') != 0) {
                                redir_url = curl.protocol + '//' + curl.host + redir_path
                            }
                            promise.when(self.get(redir_url, exheaders, followRedirects, true), function(r) {
                                response.resolveAndPoll(r)
                            })
                        }
                        else {
                            response.resolveAndPoll(resp)
                        }
                        res.ended = true
                    }
                    catch (error) { res.emit("error", error) }
                });
                res.addListener("error", function(error) {
                    if (gunzip) {
                        gunzip.end();
                        gunzip = null
                    }
                    response.resolveAndPoll({
                        error: error, 
                        headers: res.headers,
                        body: mybody.join("")
                    })
                });

                if(res.headers["set-cookie"]) self.updateCookies(res.headers["set-cookie"], curl)
            });
            if (method == 'POST') {
                if (self.debug) console.log('\n'+data)
                req.end(data)
            }
            else {
                req.end()
            }
        })
    }
    catch (error) { 
        response.resolve({
            error: error,
            body: ''
        }) 
    }

	return response
}

HttpClient.prototype.getCookie = function(domain, name) {
	var mycookies = this.cookies.filter(function(value, index, arr) {
		return(domain == value.domain);
	});
	for( var i=0; i < mycookies.length; i++ ) {
		parts = mycookies[i].value.split("=");
		if( parts[0] == name ) {
			return parts[1];
		}
	}
	return null;
}

HttpClient.prototype.setCookie = function(name, value, path, domain, expires) {
    var newcookie = {
        "value": [name,value].join('='),
        "domain": domain || "",
        "path": path || "/",
        "expires": expires || ""
    }
    this.cookies.push(newcookie)
}

HttpClient.prototype.setDebug = function(state) {
    this.debug = state
}

exports.stopCache = function() {
    _filecache.id = null
    _filecache.instance = 0
    _filecache.index = {}
    _cacheIndex = 0
}

exports.startCache = function(id, refresh) {
    exports.stopCache()
    _filecache.id = id
    _filecache.refresh = refresh
}

exports.HttpClient = HttpClient;
