class Pixel
    @RADIUS = 5
    @DURATION = 500
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
        @toR = toR || Pixel.RADIUS
        @R = @fromR
        @

    setColor: (r, g, b)->
        @r = Math.floor(r || Math.random() * 255)
        @g = Math.floor(g || Math.random() * 255)
        @b = Math.floor(b || Math.random() * 255)
        @

    setLife: (delay, duration)->
        @start = +new Date() + (delay || 0)
        @duration = duration || Pixel.DURATION
        @

    setEaseingMethod: (easingMethod)->
        if not easingMethod
            @easingMethod = (x)->
                x
            return

        [section, mode] = easingMethod.split('.')
        @easingMethod = Easing[section]?[mode] || (x)->
            x
        @

    update: ->
        now = +new Date()
        spend = now - @start

        if spend <= @duration # is blinking
            @R = @fromR + (@toR - @fromR) * @easingMethod(spend / @duration)
        else if @duration <= spend <= 2 * @duration # is disappearing
            @R = @fromR + (@toR - @fromR) * @easingMethod( (2 * @duration - spend) / @duration)
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

class Easing
    @Quadratic:
        In: (k)->
            k * k
        Out: (k)->
            k * ( 2 - k )
        InOut: (k)->
            if (k *= 2) < 1
                0.5 * k * k
            else
                -0.5 * ( --k * ( k - 2 ) - 1 )

    @Cubic:
        In: (k)->
            k * k * k
        Out: (k)->
            --k * k * k + 1
        InOut: (k)->
            if (k *= 2) < 1
                0.5 * k * k * k
            else
                0.5 * ( ( k -= 2 ) * k * k + 2 )

    @Quartic:
        In: (k)->
            k * k * k * k
        Out: (k)->
            1 - ( --k * k * k * k )
        InOut: (k)->
            if (k *= 2) < 1
                0.5 * k * k * k * k
            else
                - 0.5 * ( ( k -= 2 ) * k * k * k - 2 )

    @Bounce:
        In: (k)->
            1 - Easing.Bounce.Out(1 - k)
        Out: (k)->
            if k < ( 1 / 2.75 )
                7.5625 * k * k;
            else if k < ( 2 / 2.75 )
                7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75
            else if k < ( 2.5 / 2.75 )
                7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375
            else
                7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375
        InOut: (k)->
            if k < 0.5
                Easing.Bounce.In(k * 2) * 0.5
            else
                Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5

window.Pixel = Pixel
