WIDTH = window.innerWidth

HEIGHT = window.innerHeight

DEFAUTL_BACKGROUND = '#000'

canvas = document.getElementById 'canvas'
ctx = canvas.getContext '2d'

ctx.canvas.width = WIDTH
ctx.canvas.height = HEIGHT

img = new Image()
img.src = 'img/particle.png'

arr = []

stats = new Stats()
stats.domElement.style.position = 'absolute'
stats.domElement.style.right = '30px'
stats.domElement.style.top = '30px'
stats.domElement.style.width = '90px'
document.body.appendChild( stats.domElement )

addPixel = (pixels)->
    for key, pixel of pixels
        arr.push(
            new Pixel
                x: pixel[0]
                y: pixel[1]
                R: pixel[2]
                delay: pixel[3]
                duration: 3000
        )

socket = io.connect 'http://localhost:3000'

socket.emit 'first connect',
    width:WIDTH
    height: HEIGHT

socket.on 'init', (pixels)->
    addPixel pixels
    Animation.start step, verify, complete

socket.on 'refresh', (pixels)->
    addPixel pixels

step = ->
    stats.begin()
    states = []
    drop = 0

    for pixel, i in arr[0..]
        if (state = pixel.update()) is null
            arr.splice i, 1
            drop++
        else if(state)
            states.push state

    ctx.fillStyle = DEFAUTL_BACKGROUND
    ctx.fillRect 0, 0, canvas.width, canvas.height

    for state in states
        {r,g,b,a,R,x,y} = state
        # ctx.globalAlpha = a
        ctx.drawImage img, x - R, y - R, 2 * R, 2 * R
        # ctx.fillStyle = "rgba(#{r},#{g},#{b},#{a})"
        # ctx.beginPath()
        # ctx.arc(x, y, R, 0, Math.PI * 2)
        # ctx.fill()

    states = []
    stats.end()

verify = ->
    arr.length

complete = ->
    console.log 'complete'

