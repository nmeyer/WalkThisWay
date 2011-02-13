var PLAYING = 1,
    PAUSED  = 2,
    STOPPED = 3

function Player(selector) {
    this.tag = $(selector).get(0)
    this.state = STOPPED
    this.queue = []
    
    var that = this
    $(this.tag).bind('ended', function() {
        that.next()
    })
    
    console.log('player created')
}
Player.prototype.play = function Player_play() {
    this.tag.play()
    this.state = PLAYING
    console.log('player playing')
}
Player.prototype.pause = function Player_pause() {
    this.tag.pause()
    this.state = PAUSED
    console.log('player paused')
}
Player.prototype.load = function Player_load(url) {
    this.state = STOPPED
    this.tag.src = url
    console.log('player loading '+url)
    this.tag.load()
    this.play()
    console.log('player loaded '+url)
}
Player.prototype.enqueue = function Player_enqueue(url) {
    console.log('player queued '+url)
    this.queue.push(url)
}
Player.prototype.next = function Player_next() {
    console.log('player loading next song')
    var next = this.queue.shift()
    if (next) {
        this.load(next)
    } else {
        this.state = STOPPED
    }
}
Player.prototype.clearQueue = function Player_clearQueue() {
    this.queue = []
    console.log('player cleared queue')
}
