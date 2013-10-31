module.exports = ->

  # init the config
  @initConfig

    pkg: @file.readJSON 'package.json'

    # compile coffee to js files
    coffee:
      main:
        options:
          # bare: true
          join: true # first concat all files into one, then compile that file to .js
          separator: '\n\n'
        files:
          'js/Blink.js': [
            'src/Animation.coffee'
            'src/Easing.coffee'
            'src/Pixel.coffee'
          ]
          'js/main.js': [
            'src/Main.coffee'
          ]

    # watch all coffee files change
    watch:
      main:
        files: ['src/**/*.coffee']
        tasks: ['coffee']

  @loadNpmTasks 'grunt-contrib-coffee'
  @loadNpmTasks 'grunt-contrib-watch'

  @registerTask 'default', ['coffee']
  @registerTask 'dev', ['coffee', 'watch']