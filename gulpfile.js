const gulp       = require('gulp');
const concat     = require('gulp-concat');
const uglify     = require('gulp-uglify');
const rename     = require('gulp-rename');
const del        = require('del');                    // rm -rf
const prefixer   = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const cssmin     = require('gulp-minify-css');
const less       = require('gulp-less');
const imagemin   = require('gulp-imagemin');
const browser    = require('browser-sync').create();
const pug        = require('gulp-pug');

var port = process.env.SERVER_PORT || 3000;

// refers to my build directory and or files to
// to delete
var toDelete = [
  'build/*',
]

const path = {
    build: { //Тут мы укажем куда складывать готовые после сборки файлы
          html : 'build/',
          js   : 'build/js/',
          css  : 'build/css/',
          img  : 'build/img/',
          fonts: 'build/fonts/'
        }, 
    src : { //Пути откуда брать исходники
        html : 'src/pages/*.pug',     //Синтаксис src/*.html говорит gulp что мы хотим взять все файлы с расширением .html
        js   : 'src/js/main.js',      //В стилях и скриптах нам понадобятся только main файлы
        style: 'src/css/main.less',
        img  : 'src/img/**/*.*',      //Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
        fonts: 'src/fonts/**/*.*'
        },
    watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
        html : 'src/**/*.pug',
        js   : 'src/js/**/*.js',
        style: 'src/css/**/*.less',
        img  : 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*'
        },
    clean: './build'
};

const vendorJs = [
    'node_modules/jquery/dist/jquery.js',
    'node_modules/slick-carousel/slick/slick.min.js',
];

const vendorCss = [
  'node_modules/slick-carousel/slick/slick.css',
  'node_modules/slick-carousel/slick/slick-theme.css',
];

// TASKS BEGIN

// deletes files
gulp.task('clean', function() {
  return del(toDelete); // rm -rf
});

// put Bootstrap fonts into build directory
gulp.task('font', function() {
    return gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts));
})

// concacts and minifys all personally written JS
gulp.task('js', function() {
  vendorJs.push(path.src.js)
  
  let stream = gulp.src(vendorJs)
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(gulp.dest(path.build.js));
  return stream;
});

// Minify personally written css to at least ie8 compatibility
gulp.task('css', function() {
  vendorCss.push(path.src.style)

  const stream = gulp.src(vendorCss)  //Выберем наш main.less
    .pipe(sourcemaps.init()) //То же самое что и с js
    .pipe(less()) //Скомпилируем
    .pipe(prefixer()) //Добавим вендорные префиксы
    .pipe(cssmin()) //Сожмем
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(path.build.css));
return stream;
})

gulp.task('html', function() {
    return gulp.src(path.src.html) //Выберем файлы по нужному пути
        .pipe(pug({}))
        .pipe(gulp.dest(path.build.html)); //И перезагрузим наш сервер для обновлений
})

gulp.task('image', function(){
    return gulp.src(path.src.img) //Выберем наши картинки
        .pipe(imagemin({ //Сожмем их
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            interlaced : true
        }))
        .pipe(gulp.dest(path.build.img));
})

// Bring up the browser and serve app
gulp.task('browser', function() {
  browser.init({
    server: path.build.html,
    port  : port
  });
  // watch and rebuild .js files
  gulp.watch(path.src.js, gulp.parallel('js'))
    .on('change', browser.reload);

  // watch and rebuild .css files
  gulp.watch(path.src.style, gulp.parallel('css'))
    .on('change', browser.reload);

  // Reload when html changes
  gulp.watch(path.watch.html, gulp.parallel('html'))
    .on('change', browser.reload);

  // Reload when image changes
  gulp.watch(path.src.img, gulp.parallel('image'))
    .on('change', browser.reload);
})

// Clean is forced to run *FIRST* using gulp.series
// Then subsequent tasks can be asynchronous in executing
gulp.task('serve', gulp.series('clean',
  gulp.parallel(
    'html',
    'js',
    'css',
    'font',
    'image'),
  'browser'));

// attach a default task, so when when just <code>gulp</code> the thing runs
gulp.task('default', gulp.series('serve'));

gulp.task('build', gulp.series('clean', 
        'html',
        'js', 
        'css',
        'font',
        'image'));
