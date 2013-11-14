ioEvent = (socket)->
    events['connection'] socket

    for eventName, handler of events when eventName isnt 'connection'
        socket.on eventName, (data)->
            handler socket, data

events =
    connection: (socket)->
        socket.emit 'init', 5000

    refresh: (socket, num)->
        socket.emit 'refresh', num

module.exports = ioEvent