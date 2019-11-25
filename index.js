"use strict";

const _start = require('./dist/start')
const _build = require('./dist/build')

exports.start = _start.default || _start
exports.build = _build.default || _build