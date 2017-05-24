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

        let filePath = path.relative('./source', file.path)
          // Remove extension
          .replace(path.extname(file.path), '')
          // Use forward slashes on every OS
          .replace(new RegExp('\\' + path.sep, 'g'), '/')

        return filePath
      }
    },
    data: (file) => {
      const path = require('path')

      let data = {}

      // Find .data.js file with same name
      try {
        data = require(file.path.replace(path.extname(file.path), '.data.js'))
      } catch (e) {}

      return data
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
    './source/*.(hbs|data\.js|md)',
    './source/pages/**/*.(hbs|data\.js|md)',
    './source/demo/pages/**/*.(hbs|data\.js|md)',
    './source/modules/**/!(_)*.(hbs|data\.js|md)',
    './source/demo/modules/**/!(_)*.(hbs|data\.js|md)',
    './source/preview/styleguide/*.(hbs|data\.js|md)'
  ]
}

const fn = (options, fileEvents, cb) => {
  const gulp = require('gulp')
  const merge = require('lodash.merge')
  const prettify = require('gulp-prettify')
  const handlebars = require('gulp-hb')
  const path = require('path')
  const through = require('through2')

  const config = merge({}, defaults, options)

  if (typeof fileEvents === 'function') {
    cb = fileEvents
    fileEvents = null
  }

  return gulp.src(config.src, {
    base: config.srcBase
  })

    // TODO: Add dependency graph and decide based on fileEvents which files to pass through
    // .pipe(through.obj((file, enc, done) => {
    //   done(null, file)
    // }))

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

    // (Optional) callback
    .on('finish', cb || (() => {}))
}

// task(defaults)

module.exports = {
  name,
  fn,
  defaults
}
