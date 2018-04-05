var gulp = require('gulp');
var uglify = require('gulp-uglify');
var cleanCSS = require('gulp-clean-css');
var rename = require("gulp-rename");
var clean = require('gulp-clean');
var spawn = require('child_process').spawn;
var runSequence = require('run-sequence');
const zip = require('gulp-zip');

//----------dojo
gulp.task('cleanDojoDir', function () {
    return gulp.src('tempDojo', { read: false })
        .pipe(clean());
});
gulp.task('generateDojoDir', ['cleanDojoDir'], function (cb) {
    var cmd = spawn('public/jslib/util/buildscripts/build.sh', ['--profile', 'reports.profile.js'], { stdio: 'inherit' });
    cmd.on('close', function (code) {
        console.log('Dojo build completed ' + (code === 0 ? 'successfully!' : 'with issues.'));
        cb(code);
    });
});

//------public
gulp.task('css',function(){
    return gulp.src('public/css/**/*.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest('release/public/css'));
});
gulp.task('icons',function(){
    return gulp.src('public/icons/**/*')
        .pipe(gulp.dest('release/public/icons'));
});
gulp.task('img',function(){
    return gulp.src('public/img/**/*')
        .pipe(gulp.dest('release/public/img'));
});

//--------------jslib
gulp.task('libFilesJS',function(){
    return gulp.src('public/jslib/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('release/public/jslib'));
});
gulp.task('dojoFile',function(){
    return gulp.src('tempDojo/jslib/dojo/dojo.js.uncompressed.js')
        .pipe(rename('dojo.js'))
        .pipe(uglify())
        .pipe(gulp.dest('release/public/jslib/dojo'));
});
gulp.task('dojoNls',function(){
    return gulp.src('tempDojo/jslib/dojo/nls/**/*')
        .pipe(gulp.dest('release/public/jslib/dojo/nls'));
});
gulp.task('handsontable',function(){
    return gulp.src('public/jslib/handsontable/**/*')
        .pipe(gulp.dest('release/public/jslib/handsontable'));
});

gulp.task('moment',function(){
    return gulp.src('public/jslib/moment/**/*')
        .pipe(gulp.dest('release/public/jslib/moment'));
});

gulp.task('numeral',function(){
    return gulp.src('public/jslib/numeral/**/*')
        .pipe(gulp.dest('release/public/jslib/numeral'));
});

//----------------------dojoCSS
gulp.task('dijitThemes',function(){
    return gulp.src('public/jslib/dijit/themes/**/*')
        .pipe(gulp.dest('release/public/jslib/dijit/themes'));
});
gulp.task('dijitIcons',function(){
    return gulp.src('public/jslib/dijit/icons/**/*')
        .pipe(gulp.dest('release/public/jslib/dijit/icons'));
});
gulp.task('dojoResources',function(){
    return gulp.src('public/jslib/dojo/resources/**/*')
        .pipe(gulp.dest('release/public/jslib/dojo/resources'));
});
gulp.task('dojoLoadingGiv',function(){
    return gulp.src('public/jslib/dojox/widget/Standby/images/*.gif')
        .pipe(gulp.dest('release/public/jslib/dojox/widget/Standby/images'));
});


gulp.task('jslib',['libFilesJS','dojoFile','dijitThemes','dijitIcons','dojoResources','dojoLoadingGiv',
    'dojoNls','handsontable','moment','numeral']);
//-----------------root
gulp.task('rootFiles',function(){
    return gulp.src(['package.json','config.json','debug.cfg','debug.cmd','debug.sh','debug_retail.cfg','debug_retail.cmd',
        'production.cfg','production_retail.cfg','start.cmd','start.sh','start_retail.cmd','updateDB.sql'])
        .pipe(gulp.dest('release'));
});
gulp.task('installNode',function(){
    return gulp.src(['installNode/**/*'])
        .pipe(gulp.dest('release/installNode'));
});
gulp.task('node_modules',function(){
    return gulp.src('node_modules/**/*')
        .pipe(gulp.dest('release/node_modules'));
});
gulp.task('server',function(){
    return gulp.src('server/**/*')
        .pipe(uglify())
        .pipe(gulp.dest('release/server'));
});
gulp.task('reportsConfig',function(){
    return gulp.src('reportsConfig/**/*')
        .pipe(gulp.dest('release/reportsConfig'));
});
gulp.task('pages',function(){
    return gulp.src('pages/**/*')
        .pipe(gulp.dest('release/pages'));
});

gulp.task('public',['jslib','css','icons','img']);

gulp.task('cleanGulpDir', function () {
    return gulp.src('release/', { read: false })
        .pipe(clean());
});

gulp.task('zipRelease', function () {
    return gulp.src('./release/**/*')
        .pipe(zip('release.zip'))
        .pipe(gulp.dest('./'))
});

gulp.task('build',["rootFiles",'node_modules','pages','installNode','server','public','reportsConfig']);


gulp.task('default', function(done) {
    runSequence('cleanGulpDir','generateDojoDir', 'build','cleanDojoDir','zipRelease', function() {
        console.log('callback all done');
        done();
    });
});

