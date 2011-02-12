/*

USAGE
node app.js -p 6969 -w

*/

require.paths.unshift(__dirname)

var service = require('lib/service')

// service.channel('search', search.apiSearch)

process.on('uncaughtException', function(err) {
    logging.event('error',  err)
})

service.run(3000)
