var gulp = require('gulp');
var bs = require('browser-sync').create(); // create a browser sync instance.
var reload      = bs.reload;

gulp.task('default', function () {

    // Serve files from the root of this project
    bs.init({
        server: {
            baseDir: "./"
        }
    });

    gulp.watch("**/*.css").on("change", reload);
    gulp.watch("*.html").on("change", reload);
});
