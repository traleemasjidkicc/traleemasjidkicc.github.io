import gulp from 'gulp';
import browserSync from 'browser-sync';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import replace from 'gulp-replace';
import through2 from 'through2';

const bs = browserSync.create();
const jsDir = 'assets/js/';
const htmlFiles = '**/*.html';
const hookFiles = ['pre-commit', 'post-commit'];
const scriptTagPattern =
    /<script defer type="text\/javascript" src="assets\/js\/scripts-\d+\.js"><\/script>/g;

const getScriptsJsFile = () => {
    const jsFiles = fs.readdirSync(jsDir).filter(file => /scripts-\d+\.js$/.test(file));
    return jsFiles[0] ?? null;
};

const hasJsChanged = () => {
    const jsFile = getScriptsJsFile();
    if (!jsFile) {
        return false;
    }

    const jsPath = path.join(jsDir, jsFile);
    const status = execSync(`git status --porcelain -- "${jsPath}"`, {
        encoding: 'utf8',
    }).trim();

    return status.length > 0;
};

const updateHtmlScriptRefs = (fileName, { forceWrite = false } = {}) => {
    return gulp.src(htmlFiles, { allowEmpty: true })
        .pipe(replace(
            scriptTagPattern,
            `<script defer type="text/javascript" src="assets/js/${fileName}"></script>`
        ))
        .pipe(through2.obj((file, _, cb) => {
            if (forceWrite && file.isBuffer()) {
                fs.writeFileSync(file.path, file.contents);
            }
            cb(null, file);
        }))
        .pipe(gulp.dest(file => file.base));
};

// Task to install git hooks from repo root into .git/hooks/
gulp.task('setup-hooks', function (done) {
    const gitHooksDir = path.join('.git', 'hooks');

    if (!fs.existsSync('.git')) {
        console.error('Not a git repository — cannot install hooks.');
        done(new Error('Not a git repository'));
        return;
    }

    fs.mkdirSync(gitHooksDir, { recursive: true });

    for (const hook of hookFiles) {
        const source = path.join('.', hook);
        const target = path.join(gitHooksDir, hook);

        if (!fs.existsSync(source)) {
            console.error(`Hook source not found: ${source}`);
            done(new Error(`Missing hook file: ${hook}`));
            return;
        }

        fs.copyFileSync(source, target);
        fs.chmodSync(target, 0o755);
        console.log(`Installed: ${target}`);
    }

    console.log('Git hooks ready. Commits will run yarn precommit automatically.');
    done();
});

// Task to rename the JS file and update the HTML files
gulp.task('rename-js', function (done) {
    const jsFile = getScriptsJsFile();

    if (!jsFile) {
        console.log('No matching JS file found.');
        done();
        return;
    }

    const newFileName = `scripts-${Date.now()}.js`;

    fs.renameSync(path.join(jsDir, jsFile), path.join(jsDir, newFileName));
    console.log(`Renamed: ${jsFile} to ${newFileName}`);

    updateHtmlScriptRefs(newFileName, { forceWrite: true })
        .on('end', done);
});

// Rename JS and update HTML only when the scripts file has changed
gulp.task('rename-js-if-changed', function (done) {
    if (!hasJsChanged()) {
        console.log('No JS changes detected — skipping rename and HTML update.');
        done();
        return;
    }

    gulp.series('rename-js')(done);
});

// Task to update the HTML files (sync refs to current JS filename)
gulp.task('update-html', function (done) {
    const jsFile = getScriptsJsFile();

    if (!jsFile) {
        console.log('No matching JS file found for update.');
        done();
        return;
    }

    updateHtmlScriptRefs(jsFile)
        .on('end', done);
});

// Pre-commit: cache-bust JS and bump version only when JS changed
gulp.task('precommit', function (done) {
    if (!hasJsChanged()) {
        console.log('No JS changes detected — skipping cache bust and version bump.');
        done();
        return;
    }

    gulp.series('rename-js')(function (err) {
        if (err) {
            done(err);
            return;
        }

        try {
            execSync('yarn version patch -i', { stdio: 'inherit' });
        } catch (error) {
            done(error);
            return;
        }

        done();
    });
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
