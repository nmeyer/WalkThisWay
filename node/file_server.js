var http = require('http'),
    // config = require('./config'),
    static = require('./lib/node-static')

var argv = process.argv.slice(1),
    port = 8000,
    arg

while (arg = argv.shift()) {
    if (arg === '-p' || arg === '--port')
        port = Number(argv.shift())
}
    
var mediaServer = new static.Server(__dirname + '/..')

http.createServer(function (request, response) {
    request.addListener('end', function () {
        mediaServer.serve(request, response);
    })
}).listen(port);