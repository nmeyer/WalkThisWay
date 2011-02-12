var logging = require('../mw/logging')
var fs      = require('fs')
var spawn   = require('child_process').spawn

function watchGivenFile (path, callback) {
    fs.watchFile(path, {interval: 500}, function(curr, prev) {
        if (curr.mtime.getTime() === prev.mtime.getTime())
            return
        callback(path)
    })
}

function watchDirectory(path, ext, callback) {    
    fs.stat(path, function(err, stats){
        if(err) {
            sys.puts('Error retrieving stats for file: ' + path)
        } else {
            if(stats.isDirectory()) {
                fs.readdir(path, function(err, fileNames) {
                    if(err) {
                        sys.puts('Error reading path: ' + path)
                    }
                    else {
                        fileNames.forEach(function (fileName) {
                            watchDirectory(path + '/' + fileName, ext, callback)
                        });
                    }
                });
            } else {

                if (ext.test(path)) {
                    // sys.log("watch: "+path+" ["+ext+"]")
                    watchGivenFile(path, callback)
                } else {
                    // sys.log("NOT watch: "+path+" ["+ext+"]")
                }

            }
        }
    })
}

var daemon = null;
function startDaemon(args) {
    logging.info("starting " + args[0])

    daemon = spawn('node', args)
    logging.info("spawned child with pid "+daemon.pid)
    exports.daemon = daemon
    
    // Add listeners to kill daemon if parent exits
    var signals = ['SIGTERM', 'SIGINT', 'SIGQUIT', 'SIGKILL']
    signals.forEach(function(signal) {
        // sys.log('parent started listening for '+signal)
        process.addListener(signal, function() {
            logging.info('parent received '+signal+'. killing child pid '+daemon.pid)
            daemon.kill(signal)
            process.exit(0)
        })
    })
    
    // pipe daemon output to parent process
    daemon.stderr.addListener('data', function (data) {
        if (/^execvp\(\)/.test(data.asciiSlice(0,data.length))) {
            sys.error('ERROR: Failed to start child process.')
            process.exit(1)
        }
        sys.error(data)
    })
    daemon.stdout.addListener('data', function (data) {
        sys.print(data)
    })
    
    // restart daemon if it crashes
    daemon.addListener('exit', function (code) {
        sys.puts('daemon exited with code ' + code +', restarting next tick.')
        process.nextTick(function() { 
            startDaemon(args) }
        )
    })
    
    return daemon
}

function restartDaemon() {
    var daemon = exports.daemon
    sys.log("restarting daemon")
    process.kill(daemon.pid)
}

exports.daemon  = null
exports.start   = startDaemon
exports.restart = restartDaemon
exports.watch   = watchDirectory
