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
// var main = require('fake')
var main = require('main')

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
          socketIO(function () { 
              return server; 
          }, function (client, req, res) {
              console.log(client.sessionId + ' connected')

              //  client.send(req.session.toString()) // Send the client their session

              var tweets = []
              var sent = false;
              client.on('message', function(message){
                  console.log('got message: '+message)
                  var latlng  = JSON.parse(message).location
                  console.log(latlng)
                  main.search(latlng).then(
                      function() {
                          console.log('search promise resolved.')
                          // tweets.sort(function(a, b) {
                          //     var date1 = new Date(a.created_at)
                          //   var date2 = new Date(b.created_at)
                          //   if (date1 < date2)
                          //       return -1
                          //   else if (date2 > date1)
                          //       return 1
                          //   else return 0
                          // })
                          // console.log(tweets)
                          // client.send(JSON.stringify(tweets[0]))
                      }, 
                      function() {
                          
                      }, 
                      function(el) {
                          // tweets.push(el);
                          if (sent) return
                          client.send(JSON.stringify(el));
                          sent = true;
                  })
              });

              client.on('disconnect', function(){
                  main.stop_search()

                  console.log(client.sessionId + ' disconnected');

              });
              
          }),  
          connect.cookieDecoder(),
          connect.session({secret: 'your_secret_is_safe_here',  store: new MemoryStore({ reapInterval: 60000 * 10}) }),
          connect.staticProvider(__dirname + '/..')
    );

    server.listen(8000); // Listen for requests
}

run()