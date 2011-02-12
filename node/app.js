var connect = require('connect'),
    MemoryStore = require('connect').session.MemoryStore,
    socketIO = require("socket.io-connect").socketIO,
    sys = require('sys');

var server = connect.createServer(
      socketIO( function () { return server; }, function (client, req, res) {
          client.send(req.session.toString()); // Send the client their session
      }),  
      connect.cookieDecoder(),
      
      connect.session({secret: 'your_secret_is_safe_here',  store: new MemoryStore({ reapInterval: 60000 * 10}) }),
      
      connect.staticProvider(__dirname + '/..')
);
    
server.listen(8000); // Listen for requests