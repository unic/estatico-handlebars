const glob = require('glob')
const path = require('path')
const fs = require('fs')
const should = require('should') // eslint-disable-line
const del = require('del')

module.exports = {
  before: function (done) {
    const config = {
      src: './test/fixtures/!(_)*.hbs',
      srcBase: './test/fixtures/',
      dest: './test/results/',
      plugins: {
        data: (file) => {
          // Use JSON file with same name as html file
          return require(file.path.replace(path.extname(file.path), '.json'))
        },
        handlebars: {
          partials: [
            './test/fixtures/_*.hbs'
          ],
          parsePartialName: (options, file) => {
            return path.relative('./test/fixtures', file.path)
              .replace(path.extname(file.path), '')
              .replace(new RegExp('\\' + path.sep, 'g'), '/')
          }
        },
        prettify: {
          // Use tabs over spaces
          indent_with_tabs: true
        }
      }
    }

    const task = require('../index.js')(config)

    task.fn().on('end', done)
  },

  default: function () {
    const expected = glob.sync(path.join(__dirname, '/expected/**/*'), {
      nodir: true
    })

    expected.forEach((filePath) => {
      const expectedFile = fs.readFileSync(filePath).toString()
      const resultedFile = fs.readFileSync(filePath.replace('expected', 'results')).toString()

      expectedFile.should.be.eql(resultedFile)
    })
  },

  after: function (done) {
    del(path.join(__dirname, '/results')).then(() => done())
  }
}
