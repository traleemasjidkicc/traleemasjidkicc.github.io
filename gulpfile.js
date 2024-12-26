import gulp from 'gulp';
import browserSync from 'browser-sync';
import fs from 'fs';
import path from 'path';
import replace from 'gulp-replace';
import through2 from 'through2';

const bs = browserSync.create();
const jsDir = 'assets/js/';
const htmlFiles = '**/*.html';

// Task to rename the JS file and update the HTML files
gulp.task('rename-js', function (done) {
    const timestamp = Date.now();
    const jsFiles = fs.readdirSync(jsDir).filter(file => /scripts-\d+\.js$/.test(file));

    if (jsFiles.length === 0) {
        console.log('No matching JS file found.');
        done();
        return;
    }

    const oldFileName = jsFiles[0];
    const newFileName = `scripts-${timestamp}.js`;

    // Rename the JS file
    fs.renameSync(path.join(jsDir, oldFileName), path.join(jsDir, newFileName));
    console.log(`Renamed: ${oldFileName} to ${newFileName}`);

    // Update the HTML files with the new script name
    gulp.src(htmlFiles, { allowEmpty: true })
        .pipe(replace(
            /<script defer type="text\/javascript" src="assets\/js\/scripts-\d+\.js"><\/script>/g,
            `<script defer type="text/javascript" src="assets/js/${newFileName}"></script>`
        ))
        .pipe(through2.obj((file, _, cb) => {
            // Force writing changes to ensure all open files are updated
            if (file.isBuffer()) {
                fs.writeFileSync(file.path, file.contents);
            }
            cb(null, file);
        }))
        .pipe(gulp.dest(function (file) {
            return file.base;
        }))
        .on('end', done);
});

// Task to update the HTML files (used by lint-staged)
gulp.task('update-html', function (done) {
    const jsFiles = fs.readdirSync(jsDir).filter(file => /scripts-\d+\.js$/.test(file));

    if (jsFiles.length === 0) {
        console.log('No matching JS file found for update.');
        done();
        return;
    }

    const newFileName = jsFiles[0];

    gulp.src(htmlFiles, { allowEmpty: true })
        .pipe(replace(
            /<script defer type="text\/javascript" src="assets\/js\/scripts-\d+\.js"><\/script>/g,
            `<script defer type="text/javascript" src="assets/js/${newFileName}"></script>`
        ))
        .pipe(gulp.dest(function (file) {
            return file.base;
        }))
        .on('end', done);
});

// Task to serve and watch files
gulp.task('serve', function () {
    bs.init({
        server: {
            baseDir: "./"
        }
    });

    // Watch HTML and CSS files for changes
    gulp.watch(["*.html", "assets/css/*.css", "assets/js/*.js"]).on("change", bs.reload);
});

// Default task that runs both the rename-js task once and then starts the server
gulp.task('default', gulp.series('serve'));
