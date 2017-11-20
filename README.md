# estatico-handlebars

Transforms `Handlebars` to `HTML`.

## Installation

```
$ npm i -S estatico-handlebars
```

## Usage

```js
const gulp = require('gulp');
const handlebars = require('estatico-handlebars')({
  // Custom options, deep-merged into defaults via _.merge
});

gulp.task('html', handlebars.fn());
```

### Options (TODO: format properly!)

```js
src: [
  './source/*.hbs',
  './source/pages/**/*.hbs',
  './source/demo/pages/**/*.hbs',
  './source/modules/**/!(_)*.hbs',
  './source/demo/modules/**/!(_)*.hbs',
  './source/preview/styleguide/*.hbs',
],
srcBase: './source',
plugins: {
  handlebars: {
    partials: [
      './source/layouts/*.hbs',
      './source/modules/**/*.hbs',
      './source/demo/modules/**/*.hbs',
      './source/preview/**/*.hbs',
    ],
    parsePartialName: (options, file) => {
      const filePath = path.relative('./source', file.path)
        // Remove extension
        .replace(path.extname(file.path), '')
        // Use forward slashes on every OS
        .replace(new RegExp(`\\${path.sep}`, 'g'), '/');

      return filePath;
    },
  },
  data: (file) => {
    let data = {};

    // Find .data.js file with same name
    try {
      data = importFresh(file.path.replace(path.extname(file.path), '.data.js'));
    } catch (e) {} // eslint-disable-line no-empty

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
dest: './build/',
watch: [
  './source/*.(hbs|data.js|md)',
  './source/pages/**/*.(hbs|data.js|md)',
  './source/demo/pages/**/*.(hbs|data.js|md)',
  './source/modules/**/!(_)*.(hbs|data.js|md)',
  './source/demo/modules/**/!(_)*.(hbs|data.js|md)',
  './source/preview/styleguide/*.(hbs|data.js|md)',
],
```

## License

Apache 2.0.
