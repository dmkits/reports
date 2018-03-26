//var gulp=require('gulp');
//var cleanCss =require('gulp-clean-css');
//var uglify=require('gulp-uglify');


//gulp.task('build:installNode',function(){
//    return gulp.src('installNode/**/*')
//        .pipe(gulp.dest('build/installNode'));
//
//});
//gulp.task('build:node_modules',function(){
//    return gulp.src('node_modules/**/*')
//        .pipe(gulp.dest('build/node_modules'));
//
//});
//
//gulp.task('build:pages',function(){
//    return gulp.src('pages/**/*')
//        .pipe(gulp.dest('build/pages'));
//
//});

//gulp.task('public:jslib',function(){
//    return gulp.src('public/jslib/hTableSimple.js')
//        .pipe(uglify())
//        .pipe(gulp.dest('build/public/jslib'));
//
//});
//
//gulp.task('public:css',function(){
//    return gulp.src('public/css/**/*')
//        .pipe(cleanCss())
//        .pipe(gulp.dest('build/public/css'));
//
//});
//
//gulp.task('server',function(){
//    return gulp.src('server/**/*')
//        .pipe(uglify())
//        .pipe(gulp.dest('build/server'));
//
//});
//
//gulp.task('default',['server']);


var gulp = require('gulp');
var clean = require('gulp-clean');
//var rename = require("gulp-rename");
var spawn = require('child_process').spawn;

gulp.task('clean-dist', function () {
    return gulp.src('dist/', { read: false })
        .pipe(clean());
});

// Do the Dojo build via node
gulp.task('dojo', ['clean-dist'], function (cb) {
    var cmd = spawn('node', [
        'public/jslib/dojo/dojo.js',
        'load=build',
        '--profile',
        'build.profile.js',
        '--releaseDir',
        '../dist'
    ], { stdio: 'inherit' });

    return cmd.on('close', function (code) {
        console.log('Dojo build completed ' + (code === 0 ? 'successfully!' : 'with issues.'));
        cb(code);
    });
});

// Dojo outputs uncompresssed files.
// Remove these for a release build.
gulp.task('clean-uncompressed', ['dojo'], function () {
    return gulp.src('dist/**/*.uncompressed.js', { read: false })
        .pipe(clean());
});

// Copy an html file configured for release build
gulp.task('copy', ['clean-uncompressed'], function () {
    return gulp.src('src/built.html')
        .pipe(rename('index.html'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('build', ['copy']);

gulp.task('default', ['build']);