class Map
    constructor:()->
        @mapObj = new AMap.Map 'amap', {
            level: 5
        }

        canvasObj = new AMap.Canvas()

        @arr = []

        self = @

        AMap.event.addListener canvasObj, 'draw', (data)=>
            if self.canvas
                return;

            self.canvas = data.node;

            self.socket = io.connect('http://localhost:3000');

            self.socket.on 'init', (data)=>
                for dot in data.dots
                    self.arr.push(new Pixel(self.mapObj, {
                        lng: dot[0],
                        lat: dot[1],
                        score: dot[2]
                        }))

            self.socket.on 'update', (data)=>

                for dot, i in data.update
                    self.arr[i].addLife dot

            AMap.event.addListener self.mapObj, 'dragging', =>
                for dot in self.arr
                    dot.updatePos self.mapObj

            AMap.event.addListener self.mapObj, 'zoomend', =>
                for dot in self.arr
                    dot.updatePos self.mapObj

            self.drawCanvas()

        canvasObj.setMap @mapObj

    drawCanvas: ->
        img = new Image

        img.onload = =>
            @_img = img
            _step = =>
                # console.log 'step'
                ctx = @canvas.getContext('2d')
                ctx.clearRect 0,0, ctx.canvas.width, ctx.canvas.height
                ctx.fillStyle = 'rgba(0,0,0,0.7)'
                ctx.fillRect 0,0, ctx.canvas.width, ctx.canvas.height
                pixels = []
                for dot in @arr
                    if (tmp = dot.update())
                        pixels.push(tmp)

                for pixel in pixels
                    {x,y,R} = pixel
                    ctx.drawImage @_img, x - R, y - R, 2 * R, 2 * R

            _verify = =>
                true

            _complete = =>
                console.log 'complete'

            Animation.start _step, _verify, _complete

        img.src = '/img/particle.png'

new Map
