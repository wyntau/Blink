EASEING_METHOD =
    Quadratic:
        In: (k)->
            k * k
        Out: (k)->
            k * ( 2 - k )
        InOut: (k)->
            if (k *= 2) < 1
                0.5 * k * k
            else
                -0.5 * ( --k * ( k - 2 ) - 1 )

    Cubic:
        In: (k)->
            k * k * k
        Out: (k)->
            --k * k * k + 1
        InOut: (k)->
            if (k *= 2) < 1
                0.5 * k * k * k
            else
                0.5 * ( ( k -= 2 ) * k * k + 2 )

    Quartic:
        In: (k)->
            k * k * k * k
        Out: (k)->
            1 - ( --k * k * k * k )
        InOut: (k)->
            if (k *= 2) < 1
                0.5 * k * k * k * k
            else
                - 0.5 * ( ( k -= 2 ) * k * k * k - 2 )

    Bounce:
        In: (k)->
            1 - EASEING_METHOD.Bounce.Out(1 - k)
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
                EASEING_METHOD.Bounce.In(k * 2) * 0.5
            else
                EASEING_METHOD.Bounce.Out(k * 2 - 1) * 0.5 + 0.5