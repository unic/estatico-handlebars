const test = require('ava');
const glob = require('glob');
const path = require('path');
const fs = require('fs');
const del = require('del');
const merge = require('lodash.merge');
const task = require('../index.js');

const defaults = {
  src: './test/fixtures/!(_)*.hbs',
  srcBase: './test/fixtures/',
  dest: './test/results/',
  plugins: {
    data: file =>
      // Use JSON file with same name as html file
      require(file.path.replace(path.extname(file.path), '.json')), // eslint-disable-line global-require, import/no-dynamic-require
    handlebars: {
      partials: [
        './test/fixtures/_*.hbs',
      ],
      parsePartialName: (partialOptions, file) => path.relative('./test/fixtures', file.path)
        .replace(path.extname(file.path), '')
        .replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
    },
    prettify: {
      // Use tabs over spaces
      indent_with_tabs: true,
    },
  },
};

const compare = (t, name) => {
  const expected = glob.sync(path.join(__dirname, `expected/${name}/*`), {
    nodir: true,
  });

  expected.forEach((filePath) => {
    const expectedFile = fs.readFileSync(filePath).toString();
    const resultedFile = fs.readFileSync(filePath.replace(`expected/${name}`, 'results')).toString();

    t.is(expectedFile, resultedFile);
  });

  t.end();
};

test.cb('default', (t) => {
  task(defaults).on('end', () => compare(t, 'default'));
});

test.cb('unprettified', (t) => {
  const options = merge({}, defaults, {
    plugins: {
      prettify: null,
    },
  });

  task(options).on('end', () => compare(t, 'unprettified'));
});

// Clean up
test.afterEach(() => del(path.join(__dirname, '/results')));
