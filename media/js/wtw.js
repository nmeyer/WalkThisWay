if (typeof WTW === 'undefined')
    var WTW = {}
WTW.map = null
WTW.app = null
WTW.socket = null
WTW.player = null

// Socket.IO setup

var socket = WTW.socket = new io.Socket(); 
console.log('socket connecting...')
socket.connect();

socket.on('connect', function(){ 
    console.log('socket connected.')
}) 
socket.on('message', function(data){ 
    console.log('socket got message:', data);
    var message = JSON.parse(data)
    if (message.location) {
        showTweetOnMap(message)
    }
    if (message.track_url) {
        WTW.player.play(message.track_url)
    }
})
socket.on('disconnect', function(){
    console.log('socket disconnected.')
})

// Google Maps

function showTweetOnMap(message) {
    var position = new google.maps.LatLng(message.location.latitude, message.location.longitude)
    console.log('placing marker at ', position)
    var marker = new google.maps.Marker({
        map: WTW.map,
        draggable: false,
        animation: google.maps.Animation.DROP,
        position: position
    });
    
    WTW.map.panTo(position)
    
}

function updateCurrentPosition(position) {
    
    // center map at new position
    var newLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude)
    WTW.map.setCenter(newLocation)
    
    // convert to socket.io wire format
    var latlon = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
    }
    console.log('updated current position: ', latlon)
    
    // send new position to backend
    var message = {
        location: latlon
    }
    socket.send(JSON.stringify(message))
    console.log('socket sent location.')
}

function initMap() {
    var newyork = {
        coords: { 
            latitude: 40.739292,
            longitude: -73.989363
        }
    }
    
    var map = WTW.map = new google.maps.Map(document.getElementById("map"), {
        center: new google.maps.LatLng(newyork.latitude, newyork.longitude),
        disableDefaultUI: true,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    })
    
    /*
    navigator.geolocation.getCurrentPosition(function(position) {
        console.log('getCurrentPosition')
        updateCurrentPosition(position)
    }, function() {
        console.log('location failed. keeping default in new york.')
        updateCurrentPosition(newyork)
    })
    */
    updateCurrentPosition(newyork);
    
    /*
    var watcher = navigator.geolocation.watchPosition(function(position) {
        console.log('watchPosition')
        updateCurrentPosition(position)
    })
    */
        
}

// Player

function initPlayer() {
    var player = WTW.player = new Player("#player")
    // player.load('media/clips/sample.clip.mp3') // test
    // player.play()
}

// Sammy

// var app = WTW.app = $.sammy(function() {
// 
//     this.get('#/', function() {
//         
//     });
// 
// });

$(function() {
    initPlayer()
    // app.run()
    initMap()
});