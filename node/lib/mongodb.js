var mongodb = require('../lib/node-mongodb-native'),
    config = require('../config'),
    url = require('url'),
    logging = require('./logging')

var _db = null

function connect(urls, options) {
    var uri, name, servers = [], replSet

    if (!urls) urls = ['mongodb://127.0.0.1/mw']
    
    if (!(urls instanceof Array)) urls = [urls]

    for (var i=0, u; u = urls[i]; i++) {
        uri = url.parse(u)
        if (uri.protocol !== 'mongodb:') 
            throw new Error('database URI must start with mongodb://')
        servers.push(new mongodb.Server(uri.hostname, +(uri.port || 27017), options))
        if (i==0) name = uri.pathname.substr(1)
    }
    replSet = new mongodb.ReplSetServers(servers)
    
    _db = new mongodb.Db(name, replSet, { native_parser:true })

    _db.open(function(err) {
        _db.emit('connect', err)
    })
}

var Collection = function (name) {
    this.name = name
}

Collection.prototype.execute = function(db) {
    var self = this
    db.collection(self.name, function(err, collection) {
        self.handleCollection(err, collection)
    })                        
}

var _opFunctions = {
    find: 'find',
    save: 'save',
    insert: 'insert'
}

var _cursorFunctions = {
    one: 'nextObject',
    each: 'each',
    all: 'toArray'
}

for (var func in _opFunctions) {
    Collection.prototype[func] = function(f) {
        return function() {
            this.opFunc = _opFunctions[f]
            this.opArgs = Array.prototype.slice.call(arguments)
            return this        
        }
    }(func)
}

for (var func in _cursorFunctions) {
    Collection.prototype[func] = function(f) {
        return function(cb) {
            this.cursorFunc = _cursorFunctions[f]
            this.cursorCallback = cb
            var self = this
            return { error: function(cb) { self.errorCallback = cb } }        
        }
    }(func)
}

Collection.prototype.value = function(cb) {
    var self = this
    self.valueCallback = cb
    return { error: function(cb) { self.errorCallback = cb } }    
}

Collection.prototype.error = function(cb) {
    this.errorCallback = cb
}

Collection.prototype.handleCollection = function(err, coll) {
    var self = this

    if (!self.checkError(err) && self.opFunc) {
        var args = self.opArgs
        if (self.opFunc == 'find') {
            args = args.concat([function(e, c) {
                self.handleFind(e, c)
            }])
        }
        else {
            args = args.concat([function(e, v) {
                if (!self.checkError(e)) {
                    if (self.valueCallback)
                        self.valueCallback(v)
                }
            }])
        }
        coll[self.opFunc].apply(coll, args)
    }
}

Collection.prototype.handleFind = function(err, cursor) {
    var self = this
    
    if (!self.checkError(err) && self.cursorFunc) {
        cursor[self.cursorFunc](function(err, result) {
            if (!self.checkError(err)) {
                self.cursorCallback(result)
            }
        })
    }
}

Collection.prototype.checkError = function(err) {
    if (err) {
        if (this.errorCallback) this.errorCallback(err)    
    }
    return err
}

function Database(collectionName) {    
    var collection = new Collection(collectionName)

    if (!_db) {
        connect(config.settings.db)
        
        _db.on('error', function(err) {
            collection.checkError(err)
            _db.close()
            _db = null
        })    

    }

    var executeFunc = function(err) {
        if (!err) {
            collection.execute(_db)            
        }        
    }

    if (_db.state === 'notConnected') {
        _db.on('connect', executeFunc)        
    }
    else {
        process.nextTick(function() {
            executeFunc()            
        })
    }

    return collection
}

exports.Database = Database
