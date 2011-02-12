var PLAYING = 1,
    PAUSED  = 2,
    STOPPED = 3

function Player(selector) {
    this.tag = $(selector).get(0)
    this.state = STOPPED
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