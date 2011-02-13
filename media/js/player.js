
function Player(selector) {
    var that = this
    this.ready = false
    this.$player = $(selector).jPlayer({
        swfPath: 'media/js',
        solution: 'flash',
        preload: 'auto',
        ready: function() {
            console.log('player ready.')
            that.ready = true
        },
        ended: function() {
            console.log('player ended.')
            $(this).jPlayer('play') // just replay active song if we haven't gotten a new song since...
        }
    })
}
Player.prototype.play = function Player_play(url) {
    this.$player.jPlayer('clearMedia')
    this.$player.jPlayer('setMedia', {
        mp3: url
    })
    this.$player.jPlayer('play')
    console.log('player playing ' + url)
}
Player.prototype.stop = function Player_stop() {
    this.$player.jPlayer('clearMedia')
    console.log('player stopped')
}
