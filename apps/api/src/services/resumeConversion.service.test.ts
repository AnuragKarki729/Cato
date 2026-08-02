import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import { convertResumeDataUriToPdfDataUri } from './resumeConversion.service.js';

const execFileAsync = promisify(execFile);

function toDataUri(mimeType: string, content: Buffer | string) {
  return `data:${mimeType};base64,${Buffer.from(content).toString('base64')}`;
}

async function hasLibreOffice() {
  try {
    await execFileAsync(process.env.LIBREOFFICE_BINARY ?? 'soffice', ['--version'], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function createDocxDataUri() {
  const workDir = await mkdtemp(path.join(tmpdir(), 'cato-resume-test-'));
  const htmlPath = path.join(workDir, 'resume.html');
  const docxPath = path.join(workDir, 'resume.docx');

  try {
    await writeFile(htmlPath, '<html><body><h1>Cato Resume</h1><p>Conversion smoke test.</p></body></html>');

    await execFileAsync(
      process.env.LIBREOFFICE_BINARY ?? 'soffice',
      ['--headless', '--convert-to', 'docx', '--outdir', workDir, htmlPath],
      { timeout: 30000 }
    );

    const docx = await readFile(docxPath);
    return toDataUri('application/vnd.openxmlformats-officedocument.wordprocessingml.document', docx);
  } finally {
    await rm(workDir, { force: true, recursive: true });
  }
}

test('convertResumeDataUriToPdfDataUri rejects invalid data URI input', async () => {
  await assert.rejects(
    () => convertResumeDataUriToPdfDataUri('not-a-data-uri', 'docx'),
    /Invalid resume data URI|Resume PDF conversion failed/
  );
});

test('convertResumeDataUriToPdfDataUri converts DOC content to a PDF data URI', async (t) => {
  if (!(await hasLibreOffice())) {
    t.skip('LibreOffice soffice binary is not installed in this environment.');
    return;
  }

  const docDataUri = toDataUri(
    'application/msword',
    '<html><body><h1>Cato Resume</h1><p>DOC conversion smoke test.</p></body></html>'
  );
  const pdfDataUri = await convertResumeDataUriToPdfDataUri(docDataUri, 'doc');

  assert.match(pdfDataUri, /^data:application\/pdf;base64,/);
  assert.equal(Buffer.from(pdfDataUri.split(',')[1], 'base64').subarray(0, 4).toString(), '%PDF');
});

test('convertResumeDataUriToPdfDataUri converts DOCX content to a PDF data URI', async (t) => {
  if (!(await hasLibreOffice())) {
    t.skip('LibreOffice soffice binary is not installed in this environment.');
    return;
  }

  const docxDataUri = await createDocxDataUri();
  const pdfDataUri = await convertResumeDataUriToPdfDataUri(docxDataUri, 'docx');

  assert.match(pdfDataUri, /^data:application\/pdf;base64,/);
  assert.equal(Buffer.from(pdfDataUri.split(',')[1], 'base64').subarray(0, 4).toString(), '%PDF');
});
