var gulp = require('gulp');

var webserver = require('gulp-webserver');

gulp.task('webserver', function () {
  gulp.src('./src')
    .pipe(webserver({
      host: '127.0.0.1',
      livereload: true,
      // directoryListing: true,
      open: true
    }));
})

gulp.task('default', function () {
  
})