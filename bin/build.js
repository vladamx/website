#!/usr/bin/env node

'use strict'

const path = require('path')
const Metalsmith = require('metalsmith')
const layouts = require('metalsmith-layouts')
const markdown = require('metalsmith-markdown')
const permalinks = require('metalsmith-permalinks')
const metalsmithPrism = require('metalsmith-prism')
const collections = require('metalsmith-collections')
const feed = require('metalsmith-feed')
const mapHandlebarsPartials = require('../scripts/mapHandlebarsPartials')
const siteInfo = require('../siteInfo')
const ncp = require('ncp')
const dir = path.join(__dirname, '..')

function build (done) {
  const metalsmith = Metalsmith(dir)

  metalsmith.metadata({
    site: siteInfo
  })

  metalsmith
    .source(path.join(dir, 'content'))
      .use(collections({
        blog: {
          pattern: 'blog/**/*.md',
          sortBy: 'date',
          reverse: true,
          refer: false
        }
      }))
      .use(feed({
        collection: 'blog'
      }))
      .use(markdown({
        langPrefix: 'language-'
      }))
      .use(metalsmithPrism())
      .use(permalinks({
        relative: false
      }))
      .use(layouts({
        engine: 'handlebars',
        pattern: '**/*.html',
        partials: mapHandlebarsPartials(metalsmith, 'layouts', 'partials'),
        helpers: {
          excerpt: require('../scripts/helpers/excerpt'),
          moment: require('../scripts/helpers/moment')
        }
      }))
      .destination(path.join(dir, 'dist'))

  metalsmith.build(err => {
    if (err) {
      throw err
    }
    done && done()
  })
}

function copyStatic (done) {
  ncp(path.join(dir, 'static'), path.join(dir, 'dist', 'static'), err => {
    if (err) {
      throw err
    }

    done && done()
  })
}

function buildAndCopy (done) {
  build(() =>
    copyStatic(() => {
      done && done()
      console.log('build done!')
    })
  )
}

buildAndCopy()

module.exports = buildAndCopy
