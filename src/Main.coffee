PIXEL_NUM = 5000

WIDTH = window.innerWidth

HEIGHT = window.innerHeight

DEFAUTL_BACKGROUND = '#000'

MAX_DELAY = 5000

MAX_DURATION = 5000

MAX_RADIUS = 10

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

addPixel = (num)->
    for i in [0...num]
        arr.push(
            new Pixel({
                x: Math.random() * WIDTH,
                y: Math.random() * HEIGHT,
                R: Math.random() * MAX_RADIUS + 1,
                delay: i, # Math.random * MAX_DELAY + 50,
                duration: 3000 # Math.random() * MAX_DURATION + 50
            })
        )

socket = io.connect 'http://localhost:3000'
socket.on 'init', (num)->
    addPixel num
    Animation.start step, verify, complete
socket.on 'refresh', (num)->
    addPixel num
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
    # socket.emit 'refresh', drop
    stats.end()

verify = ->
    arr.length

complete = ->
    console.log 'complete'

