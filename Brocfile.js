const compileModules = require('broccoli-compile-modules');
const mergeTrees = require('broccoli-merge-trees');

const src = 'src';
const srcAndRSVP = mergeTrees([src, 'node_modules/rsvp/lib']);

const lgtm = compileModules(src, {
  inputFiles: ['lgtm.umd.js'],
  formatter: 'bundle',
  output: '/lgtm.js'
});

const lgtmStandalone = compileModules(srcAndRSVP, {
  inputFiles: ['lgtm-standalone.umd.js'],
  formatter: 'bundle',
  output: '/lgtm-standalone.js'
});

const lgtmCommonJS = compileModules(src, {
  inputFiles: ['lgtm.js', 'lgtm/**/*.js'],
  formatter: 'commonjs',
  output: '/commonjs'
});

module.exports = mergeTrees([lgtm, lgtmStandalone, lgtmCommonJS]);
//module.exports = srcAndRSVP;
