var gulp        = require('gulp');
var browserSync = require('browser-sync').create();
var sass        = require('gulp-sass');
var filter = require('gulp-filter');
var concat = require('gulp-concat');

gulp.task('sass', function() {
  return gulp.src("app/css/*.sass")
    .pipe(sass())
    .pipe(gulp.dest("app/css"))
    .pipe(browserSync.stream());
});

gulp.task('vendors', function() {
  var fcss = filter(['**/*.css'], {restore: true});
  var fjs = filter(['**/*.js'], {restore: true});
  var files = [
    'jquery/dist/jquery.min.js',
    'bootstrap/dist/css/bootstrap.min.css',
    'bootstrap/dist/css/bootstrap-theme.min.css',
    'bootstrap/dist/js/bootstrap.min.js',
    'web-pingjs/ping.js'
  ].map(function(file){
    return './node_modules/' + file;
  });

  return gulp.src(files)
    .pipe(fcss)
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest('./app/css/'))
    .pipe(fcss.restore)
    .pipe(fjs)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('./app/js/'));
});

gulp.task('serve', ['vendors', 'sass'], function() {
  browserSync.init({
    server: {
      baseDir: "./app"
    }
  });

  gulp.watch("app/scss/*.scss", ['sass']);
  gulp.watch("app/*.html").on('change', browserSync.reload);
});

gulp.task('default', ['serve']);
