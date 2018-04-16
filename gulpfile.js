var gulp = require('gulp');
var uglify = require('gulp-uglify');
var cleanCSS = require('gulp-clean-css');
var rename = require("gulp-rename");
var clean = require('gulp-clean');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var runSequence = require('run-sequence');
var zip = require('gulp-zip');
var gnf = require('gulp-npm-files');
var debug=require('gulp-debug');
var del = require('del');


var zipFileName='';

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
        .pipe(gulp.dest('reports/public/css'));
});
gulp.task('icons',function(){
    return gulp.src('public/icons/**/*')
        .pipe(gulp.dest('reports/public/icons'));
});
gulp.task('img',function(){
    return gulp.src('public/img/**/*')
        .pipe(gulp.dest('reports/public/img'));
});

//--------------jslib
gulp.task('libFilesJS',function(){
    return gulp.src('public/jslib/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('reports/public/jslib'));
});
gulp.task('dojoFile',function(){
    return gulp.src('tempDojo/jslib/dojo/dojo.js.uncompressed.js')
        .pipe(rename('dojo.js'))
        .pipe(uglify())
        .pipe(gulp.dest('reports/public/jslib/dojo'));
});
gulp.task('dojoNls',function(){
    return gulp.src('tempDojo/jslib/dojo/nls/**/*')
        .pipe(gulp.dest('reports/public/jslib/dojo/nls'));
});
gulp.task('handsontable',function(){
    return gulp.src('public/jslib/handsontable/**/*')
        .pipe(gulp.dest('reports/public/jslib/handsontable'));
});

gulp.task('moment',function(){
    return gulp.src('public/jslib/moment/**/*')
        .pipe(gulp.dest('reports/public/jslib/moment'));
});

gulp.task('numeral',function(){
    return gulp.src('public/jslib/numeral/**/*')
        .pipe(gulp.dest('reports/public/jslib/numeral'));
});

//----------------------dojoCSS
gulp.task('dijitThemes',function(){
    return gulp.src('public/jslib/dijit/themes/**/*')
        .pipe(gulp.dest('reports/public/jslib/dijit/themes'));
});
gulp.task('dijitIcons',function(){
    return gulp.src('public/jslib/dijit/icons/**/*')
        .pipe(gulp.dest('reports/public/jslib/dijit/icons'));
});
gulp.task('dojoResources',function(){
    return gulp.src('public/jslib/dojo/resources/**/*')
        .pipe(gulp.dest('reports/public/jslib/dojo/resources'));
});
gulp.task('dojoLoadingGiv',function(){
    return gulp.src('public/jslib/dojox/widget/Standby/images/*.gif')
        .pipe(gulp.dest('reports/public/jslib/dojox/widget/Standby/images'));
});


gulp.task('jslib',['libFilesJS','dojoFile','dijitThemes','dijitIcons','dojoResources','dojoLoadingGiv',
    'dojoNls','handsontable','moment','numeral']);
//-----------------root
gulp.task('rootFiles',function(){
    return gulp.src(['package.json','config.json','debug.cfg','debug.cmd','debug.sh','debug_retail.cfg','debug_retail.cmd',
        'production.cfg','production_retail.cfg','start.cmd','start.sh','start_retail.cmd','updateDB.sql'])
        .pipe(gulp.dest('reports'));
});
gulp.task('installNode',function(){
    return gulp.src(['installNode/**/*'])
        .pipe(gulp.dest('reports/installNode'));
});
gulp.task('node_modules',function(){
    return gulp.src('node_modules/**/*')
        .pipe(gulp.dest('reports/node_modules'));
});


gulp.task('server',function(){
    return gulp.src('server/**/*')
        .pipe(uglify())
        .pipe(gulp.dest('reports/server'));
});
gulp.task('reportsConfig',function(){
    return gulp.src('reportsConfig/**/*')
        .pipe(gulp.dest('reports/reportsConfig'));
});
gulp.task('pages',function(){
    return gulp.src('pages/**/*')
        .pipe(gulp.dest('reports/pages'));
});

gulp.task('public',['jslib','css','icons','img']);

gulp.task('cleanGulpDir', function () {
    return gulp.src('reports/', { read: false })
        .pipe(clean());
});

gulp.task('zipRelease', function (cb) {
    exec('git rev-parse --abbrev-ref HEAD', function(error, stdout, stderr) {
        if (error) {
            console.error("realiseZip error=",error);
            return;
        }
        var branch=stdout.replace(/\./g, '_').trim();
        zipFileName='reports_v'+branch+'.zip';
        console.log('zipFileName=', zipFileName);
        return gulp.src('release/reports/**/*', {base:'release/reports'})
            .pipe(zip(zipFileName))
            .pipe(debug({title:'170'+zipFileName}))
            .pipe(gulp.dest('release'))
    });

});

gulp.task('build',["rootFiles",'node_modules','pages','installNode','server','public','reportsConfig']);

gulp.task('realiseFolder',function(cd){
    console.log('realiseFolder');
    return gulp.src('./reports/**/*')
        .pipe(gulp.dest('release/reports'));
});

gulp.task('deleteTempFiles',['realiseFolder'], function(cd){
    console.log('deleteTempFiles');
    return del('reports');
});

gulp.task('default', function(done) {
    runSequence(/*'cleanGulpDir',*/'generateDojoDir', 'build','cleanDojoDir','deleteTempFiles', 'zipRelease', function() {
        console.log('callback all done');
        done();
    });
});
