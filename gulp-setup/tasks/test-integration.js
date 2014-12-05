'use strict';

var gulp = require('gulp');
var karma = require('karma').server;

gulp.task('test:integration', ['test:integration:bundle'], function (done) {
  karma.start({
    configFile: process.env.PWD + '/karma.conf.js',
    singleRun: +process.env.KARMA_DEBUG === 1 ? false : true
  }, done);
});