import chokidar from 'chokidar';
import mjml2html from 'mjml';
import path from 'node:path';
import process from 'node:process';
import handler from 'serve-handler';
import http from 'node:http';
import { networkInterfaces } from 'node:os';
import {
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile
} from 'node:fs/promises';

const SOURCE_DIR = path.resolve(process.cwd(), 'src');
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const MJML_EXTENSION = '.mjml';
const OUTPUT_EXTENSION = '.html';

async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

async function collectMjmlFiles(dir = SOURCE_DIR) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectMjmlFiles(fullPath);
      }
      if (entry.isFile() && entry.name.endsWith(MJML_EXTENSION)) {
        return fullPath;
      }
      return [];
    })
  );

  return files.flat();
}

function resolveOutputPaths(filePath) {
  const relativeToSource = path.relative(SOURCE_DIR, filePath);
  const parsed = path.parse(relativeToSource);
  const destinationDir = path.join(DIST_DIR, parsed.dir);
  const outputFile = path.join(destinationDir, `${parsed.name}${OUTPUT_EXTENSION}`);
  return { destinationDir, outputFile };
}

async function compileFile(filePath) {
  try {
    const fileContent = await readFile(filePath, 'utf8');
    const { html, errors } = mjml2html(fileContent, { filePath });

    if (errors && errors.length > 0) {
      console.warn(`[mjml] ${errors.length} issue(s) while compiling ${filePath}`);
      for (const issue of errors) {
        console.warn(`- ${issue.formattedMessage ?? issue.message}`);
      }
    }

    const { destinationDir, outputFile } = resolveOutputPaths(filePath);
    await ensureDir(destinationDir);
    await writeFile(outputFile, html, 'utf8');
    console.log(`[mjml] ${path.relative(process.cwd(), filePath)} -> ${path.relative(process.cwd(), outputFile)}`);
  } catch (error) {
    console.error(`[mjml] Failed to compile ${filePath}:`, error.message ?? error);
  }
}

async function removeCompiledFile(filePath) {
  const { outputFile } = resolveOutputPaths(filePath);
  try {
    await rm(outputFile, { force: true });
    console.log(`[mjml] removed ${path.relative(process.cwd(), outputFile)}`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`[mjml] Failed to remove ${outputFile}:`, error.message ?? error);
    }
  }
}

async function buildAll() {
  await ensureDir(DIST_DIR);
  const files = await collectMjmlFiles();
  if (files.length === 0) {
    console.warn('[mjml] No MJML files found under src');
    return;
  }
  await Promise.all(files.map((filePath) => compileFile(filePath)));
}

async function ensureSourceDirExists() {
  try {
    const stats = await stat(SOURCE_DIR);
    if (!stats.isDirectory()) {
      throw new Error('src exists but is not a directory');
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('Missing src directory. Create it before running the MJML build script.');
    }
    throw error;
  }
}

function getLocalIpAddress() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
      if (net.family === familyV4Value && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

async function startServer(port = 3000) {
  const server = http.createServer((request, response) => {
    return handler(request, response, {
      public: DIST_DIR,
      cleanUrls: false,
      directoryListing: true
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      const localIp = getLocalIpAddress();
      console.log('\n🌐 Server running at:');
      console.log(`   Local:    http://localhost:${port}`);
      console.log(`   Network:  http://${localIp}:${port}\n`);
      resolve(server);
    });
    server.on('error', reject);
  });
}

async function run() {
  await ensureSourceDirExists();
  const watchMode = process.argv.includes('--watch');
  await buildAll();

  if (!watchMode) {
    return;
  }

  await startServer(3000);

  const watcher = chokidar.watch(path.join(SOURCE_DIR, '**/*.mjml'), {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 50
    }
  });

  watcher
    .on('add', (filePath) => compileFile(filePath))
    .on('change', (filePath) => compileFile(filePath))
    .on('unlink', (filePath) => removeCompiledFile(filePath))
    .on('error', (error) => console.error('[mjml] Watcher error:', error));

  console.log('[mjml] Watching for changes in src/**/*.mjml');
}

run().catch((error) => {
  console.error('[mjml] Unhandled error:', error.message ?? error);
  process.exit(1);
});
