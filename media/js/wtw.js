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
    var newyork = new google.maps.LatLng(40.69847032728747, -73.9514422416687);
    
    var map = WTW.map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    })
    
    navigator.geolocation.getCurrentPosition(function(position) {
        console.log('initial position found via geolocation API: ', position)
        var initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude)
        map.setCenter(initialLocation)
    }, function() {
        console.log('location failed. defaulting to new york')
        map.setCenter(newyork)
    })
        
}

// Player

function initPlayer() {
    var player = WTW.player = new Player("#player")
    player.load('media/clips/sample.clip.mp3')
    player.play()
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