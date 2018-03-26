var gulp=require('gulp');
var cleanCss =require('gulp-clean-css');
var uglify=require('gulp-uglify');


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

gulp.task('public:jslib',function(){
    return gulp.src('public/jslib/hTableSimple.js')
        .pipe(uglify())
        .pipe(gulp.dest('build/public/jslib'));

});

gulp.task('public:css',function(){
    return gulp.src('public/css/**/*')
        .pipe(cleanCss())
        .pipe(gulp.dest('build/public/css'));

});

gulp.task('server',function(){
    return gulp.src('server/**/*')
        .pipe(uglify())
        .pipe(gulp.dest('build/server'));

});

gulp.task('default',['server']);