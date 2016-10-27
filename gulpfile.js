// jshint node:true
'use strict';

var gulp = require('gulp'),
    del = require('del'),
    vinylPaths = require('vinyl-paths'),
    $ = require('gulp-load-plugins')();

var paths = {
    scripts: ['src/tablemanager.js']
};

var pkg = require('./package.json');
var banner = ['/**',
    ' * <%= pkg.title %> v<%= pkg.version %> - <%= pkg.description %>',
    ' * <%= description %>',
    ' * ------------------------',
    ' * @link <%= pkg.homepage %>',
    ' * @license <%= pkg.license %>',
    ' * @author <%= pkg.author.name %>',
    ' *         Twitter : @timonorawski',
    ' *         Website : <%= pkg.author.url.replace("http://", "") %>',
    ' */',
    '\n'].join('\n');
var bannerLight = ['/** <%= pkg.title %> v<%= pkg.version %> - <%= pkg.description %>',
    ' - <%= pkg.homepage.replace("http://", "") %>',
    ' - License <%= pkg.license %>',
    ' - Author : <%= pkg.author.name %>',
    ' / <%= pkg.author.url.replace("http://", "") %>',
    ' */',
    '\n'].join('');


gulp.task('clean', function () {
    return gulp.src('dist/*')
        .pipe(vinylPaths(del));
});

gulp.task('test', ['test-scripts', 'test-langs', 'test-plugins']);
gulp.task('test-scripts', function () {
    return gulp.src(paths.scripts)
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish'));
});

gulp.task('scripts', ['test-scripts'], function () {
    return gulp.src(paths.scripts)
        .pipe($.header(banner, {pkg: pkg, description: 'Table Manager core file'}))
        .pipe($.newer('dist/tablemanager.js'))
        .pipe($.concat('tablemanager.js', {newLine: '\r\n\r\n'}))
        .pipe(gulp.dest('dist/'))
        .pipe($.size({title: 'tablemanager.js'}))
        .pipe($.rename({suffix: '.min'}))
        .pipe($.uglify())
        .pipe($.header(bannerLight, {pkg: pkg}))
        .pipe(gulp.dest('dist/'))
        .pipe($.size({title: 'tablemanager.min.js'}));
});

gulp.task('watch', function () {
    gulp.watch(paths.scripts, ['scripts']);
    $.livereload.listen();
});

gulp.task('build', ['scripts']);

gulp.task('default', ['build', 'watch']);
