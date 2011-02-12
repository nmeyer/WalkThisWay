var http        = require('http')
var sys         = require('sys')
var fs          = require('fs')
var url         = require('url')
var querystring = require('querystring')
var supervise   = require('lib/supervise')
var io          = require('lib/socket.io')

require('lib/lang')

var debug = true

var _channelHandlers = {}

var handle404 = function (request, response) {
    response.writeHead(200,{"Content-Type": "text/html"})
    response.end("404: Not Found: "+request.url)
}

var Channel = function (client, openMessage) {
    this.browserId = openMessage.browser_id || null
    this.sessionId = openMessage.session_id || null
    this.user = openMessage.user
    this.name = openMessage.channel
    this.instance = openMessage.instance
    this.log = new logging.Log(this)
    this._open = true
    this.client = client
}

Channel.prototype.send = function(message) {
    if (!this._open) return
    this.client.send({
        channel: this.name, 
        instance: this.instance,
        message: message
    })
}

Channel.prototype.close = function(force) {
    if (!this._open) return
    if (!force) this.client.send({
        channel: this.name, 
        instance: this.instance,
        close: true
    })
    this._open = false
}

Channel.prototype.error = function(e) {
    if (!this._open) return
    this.client.send({
        channel: this.name, 
        instance: this.instance,
        error: e
    })
    this.log.error(e)
}

function channel(path, handler) {
    _channelHandlers[path] = handler
}

function run() {
    var argv = process.argv.slice(1)
    var arg, port = 3000, daemonize = false, watch = false
    while (arg = argv.shift()) {
        if (arg === '-p' || arg === '--port'){
            port = Number(argv.shift())
        } else if (arg === "-w" || arg === "--watch") {
            watch = true
        }
    }

    if (watch) {        
        var daemon = supervise.start([__dirname+'/../app.js', '-p', port]);
        supervise.watch(process.cwd(), /.*\.js$/, supervise.restart)
        supervise.watch(process.cwd()+'/lib', /.*\.js$/, supervise.restart)
        return
    } 

    var server = http.createServer(function(request,response) {
        handle404(request, response)
    })

    server.listen(port)
    logging.info("listening on port "+port)    

    var timeoutSettings = { timeout: null, closeTimeout: 80000, duration: 20000 }   
    
    var socket = io.listen(server, {
        resource: 'io',
        transports: ['jsonp-polling', 'websocket', 'server-events', 'htmlfile', 'xhr-multipart', 'xhr-polling'],
     transportOptions: {
         'xhr-multipart': timeoutSettings,
         'xhr-polling': timeoutSettings,
         'jsonp-polling': timeoutSettings
     },
     log: function(message) {
         if (debug) logging.debug(message)
     }
    })

    socket.on('connection', function(client){ 
        var channels = {}
        client.on('message', function(message) {
            
            if (message.open) {
                var channel = new Channel(client, message)                
                if (channel.name in channels)
                    channels[channel.name].close(true)
                channels[channel.name] = channel
                return
            }

            var channel = channels[message.channel]
            if (channel) {
                if (channel.instance == message.instance) {
                    if (channel.name in _channelHandlers) {
                        var handler = _channelHandlers[channel.name]
                        if (message.message)
                            handler(message.message, channel)
                        else if (message.messages) {
                            var messages = message.messages
                            for (var i=0, m; m=messages[i]; i++)
                                handler(m, channel)
                        }
                    }                                
                }
            }
        }) 
        client.on('disconnect', function() {
            for (var channel in channels) {
                _channelHandlers[channel](null, channels[channel])
            }
        })
    });
}

exports.channel = channel
exports.run = run