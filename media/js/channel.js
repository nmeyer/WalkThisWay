var _channels = {}
var _socketTimeout = (typeof exports !== 'undefined' ? 30000 : 90000)

var ioSocketOptions = {
    resource: 'socket.io',
    transports: ['htmlfile', 'websocket', 'xhr-multipart', 'server-events', 'xhr-polling'],
	transportOptions: {
        'htmlfile': { timeout: _socketTimeout },
        'xhr-multipart': { timeout: _socketTimeout },
        'xhr-polling': { timeout: _socketTimeout },
        'jsonp-polling': { timeout: _socketTimeout }
	}
}
// 
// if (window.location.hostname && 
//     window.location.hostname.indexOf('localhost') == -1 &&
//     window.location.hostname.indexOf('127.0.0.1') == -1 &&
//     window.location.hostname.indexOf('10.0.6.237') === -1 &&
//     window.location.hostname.indexOf('10.0.4.192') === -1) {
//     ioSocketOptions.secure = true
//     ioSocketOptions.port = 443
// }

    ioSocketOptions.port = 80

var Socket = function () {
    this.socket = null
    this.timeout = 5000
    this.sendBuffer = []
}

Socket.prototype.connect = function() {
    if (this.socket && (this.socket.connected || this.socket.connecting)) return
    this.socket = socket = new io.Socket(null, ioSocketOptions);

    var self = this
        
    this.connectTimeout = setTimeout(function() {
        // console.log('socket:'+self.socket.transport.sessionid+' [reconnect]')
        self.socket.disconnect()
        self.connect()
    }, this.timeout)        
        
    socket.connect()
    socket.on('message', function(message) {
        // console.log('socket:'+this.transport.sessionid+' [message]: ', message)
        var channel = _channels[message.channel]
    	if (channel) {
    	    if (channel.instance == message.instance) {
        	    try {
        	        if (message.error)
            		    channel.emit('error', formatError(message.error))
            		else if (message.close) {
                	    channel.close()
            	    }
        	        else if (message.message) {
        	            channel.emit('message', message.message)
        	        }
                } catch (e) {
                    channel.emit('error', formatError(e))
                }
            }
    	}
    })
    socket.on('connect', function() {
        console.log('socket:'+this.transport.sessionid+' [connect]: '+this.transport.type)
        clearTimeout(self.connectTimeout)
        var sendBuffer = self.sendBuffer
        if (sendBuffer.length) {
            for (var i=0, msg; msg = sendBuffer[i]; i++) {
                // console.log('socket:'+this.transport.sessionid+' [sendBuffer]: ', msg)
                socket.send(msg)
            }
            self.sendBuffer = []
        }
    })
    socket.on('disconnect', function() {
        console.log('socket:'+this.transport.sessionid+' [disconnect]')
    })
    socket.on('error', function(e) {
        console.log('socket:'+this.transport.sessionid+' [error]', e)
    })    
}

Socket.prototype.send = function(message) {
    if (this.socket && this.socket.connected) {
        this.socket.send(message)
    }
    else {
        this.sendBuffer.push(message)
        this.connect()
    }
}

Socket.prototype.networkError = function() {
    
}

var _socket = new Socket()

function formatError(error) {
    return error.stack ? error.stack : error
}

var Channel = function(name) {
    //  events emitted: message, close, error
    if (name in _channels) {
        _channels[name].close(true)
    }
    _channels[name] = this
    this.name = name    
    this.instance = typeof GUID !== 'undefined' ? GUID.guid() : '0000-0000-0000-0000'
    this._events = {}
    this._open = true
    
    _socket.send({
        channel: this.name,
        instance: this.instance,
        open: true,
        browser_id: Session.browserId,
        session_id: Session.sessionId,
        user: window.current_user
    })    
}

Channel.prototype.send = function(message) {
    _socket.send({
        channel: this.name,
        instance: this.instance,
        message: message
    })
}

Channel.prototype.sendMessages = function(messages) {
    if (messages instanceof Array && messages.length) {
        _socket.send({
            channel: this.name,
            instance: this.instance,
            messages: messages
        })
    }
}

Channel.prototype.close = function(noEmit) {
    if (!noEmit) this.emit('close')
    this._open = false
}

Channel.prototype.on = function(name, fn){
	if (!(name in this._events)) this._events[name] = []
	this._events[name].push(fn)
	return this
}

Channel.prototype.emit = function(name, arg){
    if (!this._open) return
	if (name in this._events){
		for (var i = 0, ii = this._events[name].length; i < ii; i++)
            this._events[name][i].apply(this, [arg])
	}
	return this
};

var Log = window.Log

if (!Log) {
    Log = {
        eventBuffer: [],
        channel: new Channel('log')
    }
}

Log.event = function(type, data) {
    var event = {
        type: type,
        ts: new Date().getTime()
    }
    if (data) event.data = data

    Log.eventBuffer.push(event)
    Log.flush()
}

// send all events in the eventBuffer to the server and set to empty
Log.flush = function() {
    var eventBuffer = Log.eventBuffer
    if (eventBuffer.length) {
        Log.channel.sendMessages(eventBuffer)
    }
    Log.eventBuffer = []    
};

// flush events every 5 seconds
// setInterval(function() { Log.flush() }, 5000);

// flush events when user leaves the page for any reason
// $(window).unload(function() { Log.flush() });