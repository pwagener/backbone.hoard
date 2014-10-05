'use strict';

var gulp = require('gulp');
var rimraf = require('gulp-rimraf');

gulp.task('clean', function () {
  return gulp.src('./spec/integration/spec.bundle.js', { read: false })
    .pipe(rimraf());
});