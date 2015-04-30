if (process.env['LGTM_STANDALONE']) {
  module.exports = require('../dist/lgtm-standalone');
} else {
  module.exports = require('../dist/lgtm');
}
