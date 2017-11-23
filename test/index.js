const test = require('ava');
const sinon = require('sinon');
const glob = require('glob');
const path = require('path');
const fs = require('fs');
const del = require('del');
const merge = require('lodash.merge');
const task = require('../index.js');

const defaults = {
  src: './test/fixtures/index.hbs',
  srcBase: './test/fixtures/',
  dest: './test/results/',
  plugins: {
    data: file => {
      return require(file.path.replace(path.extname(file.path), '.json'));
    },
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

const stripLog = (str) => {
  return str.replace(/\n/gm, '').replace(/\t/g, ' ').replace(/\s\s+/g, ' ')
}

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

test.cb('error', (t) => {
  const options = merge({}, defaults, {
    src: './test/fixtures/error.hbs',
    errorHandler: (err) => {
      console.log(err.message);
    },
  });

  const spy = sinon.spy(console, 'log');

  task(options).on('end', () => {
    spy.restore();

    const data = {
      error: stripLog(spy.getCall(1).args[0])
        .replace(/(.*?)\/(test)/, '$2'),
      expected: stripLog(`test/fixtures/error.json: Unexpected token
 in JSON at position 15`)
    };

    const handlebars = {
      error: stripLog(spy.getCall(0).args[0]), // For some reason, this error is emitted before the data one
      expected: stripLog(`Parse error on line 2:
<div> {{> _partial}</div>
------------------^
Expecting 'CLOSE_RAW_BLOCK', 'CLOSE', 'CLOSE_UNESCAPED', 'OPEN_SEXPR', 'CLOSE_SEXPR', 'ID', 'OPEN_BLOCK_PARAMS', 'STRING', 'NUMBER', 'BOOLEAN', 'UNDEFINED', 'NULL', 'DATA', 'SEP', got 'INVALID'`)
    };

    t.is(data.error, data.expected);
    t.is(handlebars.error, handlebars.expected);

    t.end();
  });
});

test.afterEach(() => del(path.join(__dirname, '/results')));
