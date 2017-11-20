const test = require('ava');
const glob = require('glob');
const path = require('path');
const fs = require('fs');
const del = require('del');

test.cb('default', (t) => {
  const config = {
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
        parsePartialName: (options, file) => path.relative('./test/fixtures', file.path)
          .replace(path.extname(file.path), '')
          .replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
      },
      prettify: {
        // Use tabs over spaces
        indent_with_tabs: true,
      },
    },
  };

  const task = require('../index.js')(config); // eslint-disable-line global-require

  task.fn().on('end', () => {
    const expected = glob.sync(path.join(__dirname, '/expected/**/*'), {
      nodir: true,
    });

    expected.forEach((filePath) => {
      const expectedFile = fs.readFileSync(filePath).toString();
      const resultedFile = fs.readFileSync(filePath.replace('expected', 'results')).toString();

      t.is(expectedFile, resultedFile);
    });

    t.end();
  });
});

// Clean up
test.after(() => {
  return del(path.join(__dirname, '/results'));
})
