if (typeof WTW === 'undefined')
    var WTW = {}
WTW.map = null
WTW.app = null
WTW.socket = null

// Socket.IO setup

var socket = WTW.socket = new io.Socket(); 
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

// Google Maps

function initMap() {
    var myLatlng = new google.maps.LatLng(-34.397, 150.644);
    var map = WTW.map = new google.maps.Map(document.getElementById("map"), {
        zoom: 8,
        center: myLatlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    })
}

// Player

function initPlayer() {
    // var $player = document.getElementById("player");
    var player = WTW.player = new Player("#player")
    player.load('media/clips/sample.clip.mp3')
    player.play()
    // $player.load();
    // $player.play();
}

// Sammy

var app = WTW.app = $.sammy(function() {

    this.get('#/', function() {
        
    });

});

$(function() {
    app.run()
    initMap()
    initPlayer()
});