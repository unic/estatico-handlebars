const gulp = require('gulp');
const prettify = require('gulp-prettify');
const handlebars = require('gulp-hb');
const path = require('path');
const fs = require('fs');
const through = require('through2');
const util = require('gulp-util');
const importFresh = require('import-fresh');
const merge = require('lodash.merge');

const defaults = {
  src: [
    './src/*.hbs',
    './src/pages/**/*.hbs',
    './src/demo/pages/**/*.hbs',
    './src/modules/**/!(_)*.hbs',
    './src/demo/modules/**/!(_)*.hbs',
    './src/preview/styleguide/*.hbs',
  ],
  srcBase: './src',
  plugins: {
    handlebars: {
      partials: [
        './src/layouts/*.hbs',
        './src/modules/**/*.hbs',
        './src/demo/modules/**/*.hbs',
        './src/preview/**/*.hbs',
      ],
      parsePartialName: (options, file) => {
        const filePath = path.relative('./src', file.path)
          // Remove extension
          .replace(path.extname(file.path), '')
          // Use forward slashes on every OS
          .replace(new RegExp(`\\${path.sep}`, 'g'), '/');

        return filePath;
      },
    },
    data: (file) => {
      const dataFilePath = file.path.replace(path.extname(file.path), '.data.js');
      let data = {};

      // Find .data.js file with same name
      if (!fs.existsSync(dataFilePath)) {
        util.log('estatico-handlebars', util.colors.cyan(file.path), 'No data file found');

        return data;
      }

      try {
        data = importFresh(dataFilePath);
      } catch (err) {
        util.log('estatico-handlebars', util.colors.cyan(file.path), util.colors.red(err.message));
      }

      return data;
    },
    prettify: {
      indent_with_tabs: false,
      max_preserve_newlines: 1,
    },
  },
  errorHandler: (error) => {
    util.log(error.plugin, util.colors.cyan(error.fileName), util.colors.red(error.message));
  },
  dest: './dist/',
  watch: [
    './src/*.(hbs|data.js|md)',
    './src/pages/**/*.(hbs|data.js|md)',
    './src/demo/pages/**/*.(hbs|data.js|md)',
    './src/modules/**/!(_)*.(hbs|data.js|md)',
    './src/demo/modules/**/!(_)*.(hbs|data.js|md)',
    './src/preview/styleguide/*.(hbs|data.js|md)',
  ],
};

module.exports = (options) => {
  const config = merge({}, defaults, options);

  return gulp.src(config.src, {
    base: config.srcBase,
  })

  // TODO: Add dependency graph and decide based on fileEvents which files to pass through
  // .pipe(through.obj((file, enc, done) => {
  //   done(null, file)
  // }))

    // Find data and assign it to file object
    .pipe(through.obj((file, enc, done) => {
      file.data = config.plugins.data(file); // eslint-disable-line no-param-reassign

      done(null, file);
    }))

    // Handlebars
    .pipe(handlebars(config.plugins.handlebars).on('error', config.errorHandler))

    // Formatting
    .pipe(config.plugins.prettify ? prettify(config.plugins.prettify) : util.noop())

    // Rename to .html
    .pipe(through.obj((file, enc, done) => {
      file.path = file.path.replace(path.extname(file.path), '.html'); // eslint-disable-line no-param-reassign

      done(null, file);
    }))

    // Save
    .pipe(gulp.dest(config.dest));
};
