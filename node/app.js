require.paths.unshift(__dirname)

var connect = require('connect'),
    MemoryStore = require('connect').session.MemoryStore,
    socketIO = require("socket.io-connect").socketIO

var http        = require('http')
var sys         = require('sys')
var fs          = require('fs')
var url         = require('url')
var querystring = require('querystring')
var supervise   = require('lib/supervise')

require('lib/lang')

var debug = true

function run() {
    var argv = process.argv.slice(1)
    var arg, port = 8000, daemonize = false, watch = false
    while (arg = argv.shift()) {
        if (arg === '-p' || arg === '--port'){
            port = Number(argv.shift())
        } else if (arg === "-w" || arg === "--watch") {
            watch = true
        }
    }

    if (watch) {        
        var daemon = supervise.start([__dirname+'/app.js', '-p', port]);
        supervise.watch(process.cwd(), /.*\.js$/, supervise.restart)
        return
    } 

    var server = connect.createServer(
          socketIO( function () { return server; }, function (client, req, res) {
              client.send(req.session.toString()); // Send the client their session
          }),  
          connect.cookieDecoder(),
          connect.session({secret: 'your_secret_is_safe_here',  store: new MemoryStore({ reapInterval: 60000 * 10}) }),
          connect.staticProvider(__dirname + '/..')
    );

    server.listen(8000); // Listen for requests
}

run()