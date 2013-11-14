WIDTH = 0
HEIGHT = 0
MAX_DELAY = 5000

MAX_DURATION = 5000

MAX_RADIUS = 10

ioEvent = (socket)->

    for eventName, handler of events
        socket.on eventName, (data)->
            handler socket, data

events =
    'first connect': (socket, data)->
        WIDTH = data.width || 800
        HEIGHT = data.height || 600

        socket.emit 'init', makePixel(5000)

        setInterval ->
            socket.emit 'refresh', makePixel(2000)
        , 3000

makePixel = (num)->
    for i in [0...num]
        [
            parseInt Math.random() * WIDTH
            parseInt Math.random() * HEIGHT
            parseInt Math.random() * MAX_RADIUS + 1
            i
        ]

module.exports = ioEvent