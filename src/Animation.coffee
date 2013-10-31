###*
 * Generic animation class with support for dropped frames both optional easing and duration.

 * Optional duration is useful when the lifetime is defined by another condition than time
 * e.g. speed of an animating object, etc.

 * Dropped frame logic allows to keep using the same updater logic independent from the actual
 * rendering. This eases a lot of cases where it might be pretty complex to break down a state
 * based on the pure time difference.
###
class Animate
  time = Date.now or ->
    +new Date()
  desiredFrames = 60
  millisecondsPerSecond = 1000
  running = {}
  counter = 1

  # Adding support for HTML5's requestAnimationFrame as suggested by acdha.
  # Implementation taken from matt synder's post here:
  # http://mattsnider.com/cross-browser-and-legacy-supported-requestframeanimation/
  ((w)->
    requestAnimationFrame = w.requestAnimationFrame ||
      w.mozRequestAnimationFrame ||
      w.webkitRequestAnimationFrame ||
      w.msRequestAnimationFrame
    cancelAnimationFrame = w.cancelAnimationFrame ||
      w.mozCancelAnimationFrame ||
      w.webkitCancelAnimationFrame ||
      w.msCancelAnimationFrame
    if !requestAnimationFrame or !cancelAnimationFrame
      TARGET_FPS = 60
      aAnimQueue = []
      processing = []
      iRequestId = 0
      iIntervalId = null

      # create a mock requestAnimationFrame function
      w.requestAnimationFrame = (callback)->
        aAnimQueue.push [ ++iRequestId, callback ]

        if !iIntervalId
          iIntervalId = setInterval ->
            if aAnimQueue.length
              iTime = do time ## TODO: $.now not exist, time
              # Process all of the currently outstanding frame
              # requests, but none that get added during the
              # processing.
              # Swap the arrays so we don't have to create a new
              # array every frame.
              temp = processing
              processing = aAnimQueue
              aAnimQueue = temp
              while processing.length
                processing.shift()[ 1 ] iTime
            else
              # don't continue the interval, if unnecessary
              clearInterval iIntervalId
              iIntervalId = undefined
          , 1000 / TARGET_FPS  # estimating support for #{TARGET_FPS} frames per second
        iRequestId
      w.cancelAnimationFrame = (requestId)->
        # find the request ID and remove it
        for i in [0...aAnimQueue.length]
          if aAnimQueue[ i ][ 0 ] is requestId
            aAnimQueue.splice i, 1
            return

        # If it's not in the queue, it may be in the set we're currently
        # processing (if cancelAnimationFrame is called from within a
        # requestAnimationFrame callback).
        for i in [0...processing.length]
          if processing[ i ][ 0 ] is requestId
            processing.splice i, 1
            return
  )(window)

  ###*
   * Stops the given animation.
   * @param id {Integer} Unique animation ID
   * @return {Boolean} Whether the animation was stopped (aka, was running before)
  ###
  @stop: (id)->
    cleared = running[id]?
    if cleared
      running[id] = null
    cleared

  ###*
   * Whether the given animation is still running.
   * @param id {Integer} Unique animation ID
   * @return {Boolean} Whether the animation is still running
  ###
  @isRunning: (id)->
    running[id]?

  ###*
   * Start the animation.
   * @param stepCallback {Function} Pointer to function which is executed on every step.
   * Signature of the method should be `function(percent, now, virtual) { return continueWithAnimation; }`
   * @param verifyCallback {Function} Executed before every animation step.
   * Signature of the method should be `function() { return continueWithAnimation; }`
   * @param completedCallback {Function} Signature of the method should be `function(renderedFrames, animateId, finishedAnimation) {}`
   * @param duration {Integer} Milliseconds to run the animation
   * @param easingMethod {Function} Pointer to easing function Signature of the method should be `function(percent) { return modifiedValue; }`
   * @return {Integer} Identifier of animation. Can be used to stop it any time.
  ###
  @start: (stepCallback, verifyCallback, completedCallback, duration, easingMethod)->
    start = do time
    lastFrame = start
    percent = 0
    dropCounter = 0
    id = counter++

    # Compacting running db automatically every few new animations
    if id % 20 is 0
      newRunning = {}
      for usedId of running when running[usedId] is true
        newRunning[usedId] = true
      running = newRunning

    # This is the internal step method which is called every few milliseconds
    step = (virtual)->
      # Normalize virtual value
      render = virtual isnt true

      # Get current time
      now = do time

      # Verification is executed before next animation step
      if !running[id] or (verifyCallback and !verifyCallback(id))
        running[id] = null
        completedCallback and completedCallback(desiredFrames - (dropCounter / ((now - start) / millisecondsPerSecond)), id, false)
        return

      # For the current rendering to apply let's update omitted steps in memory.
      # This is important to bring internal state variables up-to-date with progress in time.
      if render
        droppedFrames = Math.round((now - lastFrame) / (millisecondsPerSecond / desiredFrames)) - 1
        for j in [0...Math.min(droppedFrames, 4)]
          step true
          dropCounter++

      # Compute percent value
      if duration
        percent = (now - start) / duration
        if percent > 1
          percent = 1

      # Execute step callback, then...
      value = if easingMethod then easingMethod(percent) else percent
      if (stepCallback(value, now, render) is false or percent is 1) and render
        running[id] = null
        completedCallback && completedCallback desiredFrames - dropCounter / ((now - start) / millisecondsPerSecond), id, percent is 1 or duration is null
      else if render
        lastFrame = now
        window.requestAnimationFrame step

    # Mark as running
    running[id] = true

    # Init first step
    window.requestAnimationFrame step

    # Return unique animation ID
    id