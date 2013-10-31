DURATION = 500
RADIUS = 5
window.Pixel = class Pixel
    constructor: (option)->

        @setPosition option.x, option.y

        @setRadius option.R

        @setColor option.r, option.g, option.b

        @setLife option.delay, option.duration

        @setEaseingMethod option.easeing

    setPosition: (x, y)->
        @x = x || 0
        @y = y || 0
        @

    setRadius: (toR)->
        @fromR = 0
        @toR = toR || RADIUS
        @R = @fromR
        @

    setColor: (r, g, b)->
        @r = Math.floor(r || Math.random() * 255)
        @g = Math.floor(g || Math.random() * 255)
        @b = Math.floor(b || Math.random() * 255)
        @

    setLife: (delay, duration)->
        @start = +new Date() + (delay || 0)
        @duration = duration || DURATION
        @

    setEaseingMethod: (easingMethod)->
        if not easingMethod
            @easingMethod = (x)->
                x
            return

        [section, mode] = easingMethod.split('.')
        @easingMethod = EASEING_METHOD[section]?[mode] || (x)->
            x
        @

    update: ->
        now = +new Date()
        spend = now - @start

        if spend <= @duration # is blinking
            @R = @fromR + @toR * @easingMethod(spend / @duration)
        else if @duration <= spend <= 2 * @duration # is disappearing
            @R = @fromR + @toR * @easingMethod( (2 * @duration - spend) / @duration)
        else if spend > 2 * @duration # has animation end
            return null
        else
            console.log 'notmatch'

        {
            x: @x
            y: @y
            r: @r
            g: @g
            b: @b
            R: @R
        }
