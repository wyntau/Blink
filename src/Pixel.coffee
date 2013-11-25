class Pixel
    @MIN_RADIUS   = 0
    @MAX_RADIUS   = 10
    @MAX_DURATION = 2000
    @MIN_SCORE    = 0
    @MAX_SCORE    = 8000
    constructor: (mapObj, opts)->

        @_lnglat = new AMap.LngLat(opts.lng, opts.lat)

        @p = mapObj.lnglatTocontainer @_lnglat

        @_score = Math.max(Pixel.MIN_SCORE, Math.min(opts.score, Pixel.MAX_SCORE))

        @_fromR = Pixel.MIN_RADIUS

        @_toR = @_score / Pixel.MAX_SCORE * Pixel.MAX_RADIUS

        @R = @_fromR

        @_duration = @_score / Pixel.MAX_SCORE * Pixel.MAX_DURATION

        @_start = +new Date() + Math.random() * Pixel.MAX_DURATION * 2

    reInit: ->
        if not @_next or @_next.length <= 0
            return false;
        else
            newScore = @_score + @_next.pop()
            @_score = Math.max(Pixel.MIN_SCORE, Math.min(newScore, Pixel.MAX_SCORE))
            @_toR = @_score / Pixel.MAX_SCORE * Pixel.MAX_RADIUS
            @R = @_fromR
            @_duration = @_score / Pixel.MAX_SCORE * Pixel.MAX_DURATION
            @_start = +new Date() + Math.random() * Pixel.MAX_DURATION * 2

    addLife: (newScore)->
        if not @_next
            @_next = [newScore]
        else
            @_next.push newScore

    update: ->
        if @complete
            @reInit();
            @complete = false

        now = +new Date()
        spend = now - @_start

        if spend < 0 # hasn't start blink
            return false;

        if spend <= @_duration # is start blinking
            @R = @_fromR + (@_toR - @_fromR) * (spend / @_duration)
        else if @_duration <= spend <= 2 * @_duration # is disappearing
            @R = @_fromR + (@_toR - @_fromR) * (2 * @_duration - spend) / @_duration
        else
            @complete = true
            return false

        {
            x: @p.x
            y: @p.y
            R: @R
        }

    updatePos: (mapObj)->
        @p = mapObj.lnglatTocontainer @_lnglat

window.Pixel = Pixel
