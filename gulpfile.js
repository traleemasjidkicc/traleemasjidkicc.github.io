import gulp from 'gulp';
import browserSync from 'browser-sync';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import replace from 'gulp-replace';
import through2 from 'through2';

const bs = browserSync.create();
const jsDir = 'assets/js/';
const cssDir = 'assets/css/';
const htmlFiles = '**/*.html';
const hookFiles = ['pre-commit'];
const retiredHookFiles = ['post-commit'];
const scriptsJsPath = path.join(jsDir, 'scripts.js');
const mainCssPath = path.join(cssDir, 'main.css');
const assetVersionPath = 'assets/asset-version.txt';
const scriptTagPattern =
    /<script defer type="text\/javascript" src="assets\/js\/scripts\.js\?v=\d+"><\/script>/g;
const mainCssLinkPattern =
    /<link rel="stylesheet" href="assets\/css\/main\.css\?v=\d+">/g;

const readAssetVersion = () => {
    if (!fs.existsSync(assetVersionPath)) {
        return String(Date.now());
    }

    const version = fs.readFileSync(assetVersionPath, 'utf8').trim();
    return version || String(Date.now());
};

const writeAssetVersion = (version) => {
    fs.writeFileSync(assetVersionPath, `${version}\n`);
};

const hasJsChanged = () => {
    if (!fs.existsSync(scriptsJsPath)) {
        return false;
    }

    const status = execSync(`git status --porcelain -- "${scriptsJsPath}"`, {
        encoding: 'utf8',
    }).trim();

    return status.length > 0;
};

const hasCssChanged = () => {
    if (!fs.existsSync(mainCssPath)) {
        return false;
    }

    const status = execSync(`git status --porcelain -- "${mainCssPath}"`, {
        encoding: 'utf8',
    }).trim();

    return status.length > 0;
};

const updateHtmlAssetVersions = (version, { forceWrite = false } = {}) => {
    const scriptTag = `<script defer type="text/javascript" src="assets/js/scripts.js?v=${version}"></script>`;
    const cssLink = `<link rel="stylesheet" href="assets/css/main.css?v=${version}">`;

    return gulp.src(htmlFiles, { allowEmpty: true })
        .pipe(replace(scriptTagPattern, scriptTag))
        .pipe(replace(mainCssLinkPattern, cssLink))
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

    for (const hook of retiredHookFiles) {
        const target = path.join(gitHooksDir, hook);
        if (fs.existsSync(target)) {
            fs.unlinkSync(target);
            console.log(`Removed retired hook: ${target}`);
        }
    }

    console.log('Git hooks ready. Commits will run yarn precommit automatically.');
    done();
});

// Bump ?v= in HTML and asset-version.txt (stable filenames — no file rename)
gulp.task('bump-asset-version', function (done) {
    const version = String(Date.now());
    writeAssetVersion(version);
    console.log(`Bumped asset version to ${version}`);

    updateHtmlAssetVersions(version, { forceWrite: true })
        .on('end', done);
});

// Task to update the HTML files (sync ?v= to asset-version.txt)
gulp.task('update-html', function (done) {
    if (!fs.existsSync(scriptsJsPath) && !fs.existsSync(mainCssPath)) {
        console.log('No scripts.js or main.css found for update.');
        done();
        return;
    }

    const version = readAssetVersion();
    updateHtmlAssetVersions(version)
        .on('end', done);
});

// Pre-commit: bump ?v= and package version when JS/CSS changed
gulp.task('precommit', function (done) {
    const jsChanged = hasJsChanged();
    const cssChanged = hasCssChanged();

    if (!jsChanged && !cssChanged) {
        console.log('No JS or CSS changes detected — skipping cache bust and version bump.');
        done();
        return;
    }

    gulp.series('bump-asset-version')(function (err) {
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
        },
        middleware: [
            (req, res, next) => {
                if (/\.(js|css|html)$/.test(req.url.split('?')[0])) {
                    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
                }
                next();
            },
        ],
    });

    gulp.watch(['*.html', 'assets/css/*.css', 'assets/js/*.js'])
        .on('all', () => bs.reload());
});

// Sync HTML asset refs, then start the dev server
gulp.task('default', gulp.series('update-html', 'serve'));
