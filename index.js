const name = 'html'

const defaults = {
  src: [
    './source/*.hbs',
    './source/pages/**/*.hbs',
    './source/demo/pages/**/*.hbs',
    './source/modules/**/!(_)*.hbs',
    './source/demo/modules/**/!(_)*.hbs',
    './source/preview/styleguide/*.hbs'
  ],
  srcBase: './source',
  plugins: {
    handlebars: {
      partials: [
        './source/layouts/*.hbs',
        './source/modules/**/*.hbs',
        './source/demo/modules/**/*.hbs',
        './source/preview/**/*.hbs'
      ],
      parsePartialName: (options, file) => {
        const path = require('path')

        return path.relative('./source', file.path)
          // Remove extension
          .replace(path.extname(file.path), '')
          // Use forward slashes on every OS
          .replace(new RegExp('\\' + path.sep, 'g'), '/')
      }
    },
    data: (file) => {
      const path = require('path')

      // Find .data.js file with same name
      return (() => {
        try {
          return require(file.path.replace(path.extname(file.path), '.data.js'))
        } catch (e) {
          return {}
        }
      })()
    },
    prettify: {
      indent_with_tabs: false,
      max_preserve_newlines: 1
    }
  },
  errorHandler: (error) => {
    const util = require('gulp-util')

    util.log(error.plugin, util.colors.cyan(error.fileName), util.colors.red(error.message))
  },
  dest: './build/',
  watch: [
    './source/*.(hbs|data.js,md)',
    './source/pages/**/*.(hbs|data.js,md)',
    './source/demo/pages/**/*.(hbs|data.js,md)',
    './source/modules/**/!(_)*.(hbs|data.js,md)',
    './source/demo/modules/**/!(_)*.(hbs|data.js,md)',
    './source/preview/styleguide/*.(hbs|data.js,md)'
  ]
}

const task = (options) => {
  const gulp = require('gulp')
  const merge = require('lodash.merge')
  const prettify = require('gulp-prettify')
  const handlebars = require('gulp-hb')
  const path = require('path')
  const through = require('through2')

  const config = merge({}, defaults, options)

  return gulp.src(config.src, {
    base: config.srcBase
  })

    // Find data and assign it to file object
    .pipe(through.obj((file, enc, done) => {
      file.data = config.plugins.data(file)

      done(null, file)
    }))

    // Handlebars
    .pipe(handlebars(config.plugins.handlebars).on('error', config.errorHandler))

    // Formatting
    .pipe(prettify(config.plugins.prettify))

    // Rename to .html
    .pipe(through.obj((file, enc, done) => {
      file.path = file.path.replace(path.extname(file.path), '.html')

      done(null, file)
    }))

    // Save
    .pipe(gulp.dest(config.dest))
}

task(defaults)

module.exports = {
  name,
  task,
  defaults
}
