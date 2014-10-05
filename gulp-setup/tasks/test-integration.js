'use strict';

var gulp = require('gulp');
var karma = require('karma').server;

gulp.task('test:integration', ['test:unit', 'test:integration:bundle'], function (done) {
  karma.start({
    configFile: process.env.PWD + '/karma.conf.js',
    singleRun: true
  }, done);
});