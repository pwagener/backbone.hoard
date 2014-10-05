'use strict';

var gulp = require('gulp');
var browserify = require('browserify');
var vinyl = require('vinyl-source-stream');

gulp.task('test:integration:bundle', ['link'], function () {
  return browserify('./spec/integration/setup.js', { debug: true})
    .bundle()
    .pipe(vinyl('spec.bundle.js'))
    .pipe(gulp.dest('./spec/integration'));
});