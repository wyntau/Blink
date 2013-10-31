PIXEL_NUM = 2000

WIDTH = HEIGHT = 500

DEFAUTL_BACKGROUND = '#000'

MAX_DELAY = 5000

MAX_DURATION = 5000

MAX_RADIUS = 5

canvas = document.getElementById 'canvas'
ctx = canvas.getContext '2d'

arr = []

for i in [0...PIXEL_NUM]
    arr.push(
        new Pixel({
            x: Math.random() * WIDTH,
            y: Math.random() * HEIGHT,
            R: Math.random() * MAX_RADIUS + 1,
            delay: Math.random * MAX_DELAY,
            duration: Math.random() * MAX_DURATION + 50
        })
    )
step = ->
    states = []

    for pixel, i in arr[0..]
        if (state = pixel.update()) is null
            arr.splice i, 1
        else if(state)
            states.push state

    ctx.fillStyle = DEFAUTL_BACKGROUND
    ctx.fillRect 0, 0, canvas.width, canvas.height

    for state in states
        {r,g,b,R,x,y} = state
        ctx.fillStyle = "rgb(#{r},#{g},#{b})"
        ctx.beginPath()
        ctx.arc(x, y, R, 0, Math.PI * 2)
        ctx.fill()

    states = []

verify = ->
    arr.length

complete = ->
    console.log 'complete'

Animate.start step, verify, complete