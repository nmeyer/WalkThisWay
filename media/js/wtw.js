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
        updateNowPlaying(message.song_info)
        WTW.player.play(message.track_url)
    }
    if (message.text) {
        updateTweetDisplay(message)
    }
})
socket.on('disconnect', function(){
    console.log('socket disconnected.')
})

// Info Displays

function updateTweetDisplay(message) {
    var $tweet = $('#tweet')
    $tweet.find('#tweet-body').text(unescape(message.text))
    $tweet.find('#tweet-user').text(message.from_user)
}

function updateNowPlaying(song) {
    var $nowPlaying = $('#now-playing')
    $nowPlaying.find('#artist').text(song.artist_name)
    $nowPlaying.find('#title').text(song.title)
}

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
    
    if (position) {
        WTW.currentPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
        }
        console.log('updated current position: ', WTW.currentPosition)

        // center map at new position
        var newLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude)
        WTW.map.panTo(newLocation)
    }
    
    if (WTW.player.ready) {
        // send new position to backend
        var message = {
            location: WTW.currentPosition
        }
        socket.send(JSON.stringify(message))
        console.log('socket sent location.')
    }
}

function initMap() {
    var newyork = {
        coords: { 
            latitude: 40.739292,
            longitude: -73.989363
        }
    }
    WTW.currentPosition = {
        latitude: newyork.coords.latitude,
        longitude: newyork.coords.longitude,
        accuracy: newyork.coords.accuracy
    }
    
    var map = WTW.map = new google.maps.Map(document.getElementById("map"), {
        center: new google.maps.LatLng(WTW.currentPosition.latitude, WTW.currentPosition.longitude),
        disableDefaultUI: true,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    })
    
    // navigator.geolocation.getCurrentPosition(function(position) {
    //     console.log('getCurrentPosition')
    //     updateCurrentPosition(position)
    // }, function() {
    //     console.log('location failed. keeping default in new york.')
    //     updateCurrentPosition(newyork)
    // })
    // 
    // var watcher = navigator.geolocation.watchPosition(function(position) {
    //     console.log('watchPosition')
    //     updateCurrentPosition(position)
    // })
        
}

// Player

function initPlayer() {
    var player = WTW.player = new Player("#player")
}

WTW.readyForMusic = function() {
    updateCurrentPosition()
    setInterval(function() {
        updateCurrentPosition()
    }, 15000)
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