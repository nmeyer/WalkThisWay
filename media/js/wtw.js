

// Socket.IO setup

var socket = new io.Socket(); 
console.log('socket connecting...')
socket.connect();
console.log('socket connected.')

socket.on('connect', function(){ 
    socket.send('hi!'); 
}) 
socket.on('message', function(data){ 
    console.log('socket got message:', data);
})
socket.on('disconnect', function(){
    console.log('socket disconnected.')
})


// Sammy

var app = $.sammy(function() {

    this.get('#/', function() {
        $('body').text('Sammy App running!');
    });

});

$(function() {
    app.run();
});
