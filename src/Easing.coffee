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