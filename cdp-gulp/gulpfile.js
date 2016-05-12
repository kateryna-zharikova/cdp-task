var gulp = require('gulp');
var bower = require('gulp-bower');
var less = require('gulp-less');
var del = require('del');
var util = require('gulp-util');
var cached = require('gulp-cached');
var remember = require('gulp-remember');
var autoprefixer = require('gulp-autoprefixer');
var csso = require('gulp-csso');
var concat = require('gulp-concat');
var gulpif = require('gulp-if');
var imagemin = require('gulp-imagemin');
var spritesmith = require('gulp.spritesmith');
var htmlreplace = require('gulp-html-replace');
var uglify = require('gulp-uglify');
var mainBowerFiles = require('main-bower-files');
var filter = require('gulp-filter');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var debowerify = require("debowerify");
var eslint = require('gulp-eslint');
var gulpStylelint = require('gulp-stylelint');
var plato = require('plato');

var argv = require('minimist')(process.argv.slice(2), {
    string: 'env',
    default: {env: process.env.NODE_ENV || 'development'}
});

var conf = {
    reports: './reports',
    less: 'src/less/*.less',
    images: ['src/images/**/*.{png,svg}', '!src/images/icons/**'],
    icons: 'src/images/icons/*.png',
    html: 'src/*.html',
    js: 'src/js/*.js',
    sprite: {
        imgName: 'images/build/sprite.png',
        cssName: 'less/build/sprite.less',
        imgPath: '../images/build/sprite.png'
    },
    build: {
        tmpFolders: '**/build',
        folder: 'build',
        css: 'build/css',
        images: 'build/images',
        js: 'build/js',
        html: 'build/html'
    }
};

var bootstrap = {
    less: 'bower_components/bootstrap/less/bootstrap.less'
};

gulp.task('bower', function () {
    return bower()
        .pipe(gulp.dest('bower_components'));
});

gulp.task('style', ['clean', 'bower', 'images'], function () {
    return gulp.src([bootstrap.less, conf.less])
        .pipe(less())
        .pipe(autoprefixer(['last 2 version']))
        .pipe(concat('cdp.css'))
        // Compress code only on production build
        .pipe(gulpif(argv.env === 'production', csso()))
        .pipe(gulp.dest(conf.build.css));
});

gulp.task('style-watch', function () {
    return gulp.src([bootstrap.less, conf.less])
        .pipe(cached())
        .pipe(less())
        .on('error', errorHandler)
        .pipe(autoprefixer(['last 2 version']))
        .pipe(remember())
        .pipe(concat('cdp.css'))
        .pipe(gulp.dest(conf.build.css))
});

gulp.task('images', ['clean', 'bower', 'sprite'], function () {
    return gulp.src(conf.images)
        .pipe(gulpif(argv.env === 'production', imagemin()))
        .pipe(gulp.dest(conf.build.images))
});

gulp.task('sprite', ['clean'], function () {
    return gulp.src(conf.icons)
        .pipe(spritesmith(conf.sprite))
        .pipe(gulp.dest('src/'));
});

gulp.task('html', ['clean'], function () {
    return gulp.src(conf.html)
        .pipe(htmlreplace({
            'css': '../css/cdp.css',
            'js': '../js/cdp.js',
            'logo': {
                src: '../images/logo_gray-blue_80px.svg',
                tpl: '<img src="%s" alt="Epam logo"/>'
            }
        }))
        .pipe(gulp.dest(conf.build.html));
});

gulp.task('script', ['clean', 'bower'], function () {
    return browserify('src/js/app.js', {debug:true})
          .transform(debowerify)
          .bundle()
          .pipe(source('cdp.js'))
          .pipe(gulp.dest(conf.build.js));
});

gulp.task('lint-js', function(){
  return gulp.src(conf.js)
    .pipe (eslint())
    .pipe (eslint.format())
    .pipe (eslint.failOnError());
});

gulp.task('lint-less', function(){
  return gulp.src(conf.less)
    .pipe(gulpStylelint({
              reporters: [
                {formatter: 'string', console: true}
              ],
              syntax: 'less'
            }))
});

gulp.task('lint', ['lint-less', 'lint-js'], function(){
  var files = conf.js;
  var outputDir = conf.reports;
  var options = {
    title: 'Analiz'
  };
  var callback = function (report){};

  plato.inspect(files, outputDir, options, callback);
})

gulp.task('clean', function () {
    return del([conf.build.folder, conf.build.tmpFolders, conf.reports]);
});

gulp.task('build', ['style', 'images', 'html', 'script']);

gulp.task('watch', ['build'], function () {
    return gulp.watch(conf.less, ['style-watch']);
});

function errorHandler(error) {
    util.log(util.colors.red('Error'), error.message);

    this.end();
}
