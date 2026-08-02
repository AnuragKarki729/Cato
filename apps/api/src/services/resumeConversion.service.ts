import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function parseDataUri(dataUri: string) {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    throw new Error('Invalid resume data URI');
  }

  return Buffer.from(match[2], 'base64');
}

export async function convertResumeDataUriToPdfDataUri(dataUri: string, fileType: 'doc' | 'docx') {
  const workDir = await mkdtemp(path.join(tmpdir(), 'cato-resume-'));
  const inputPath = path.join(workDir, `resume-${randomUUID()}.${fileType}`);

  try {
    await writeFile(inputPath, parseDataUri(dataUri));

    const binary = process.env.LIBREOFFICE_BINARY ?? 'soffice';

    await execFileAsync(binary, ['--headless', '--convert-to', 'pdf', '--outdir', workDir, inputPath], {
      timeout: 30000
    });

    const outputPath = inputPath.replace(/\.(doc|docx)$/i, '.pdf');
    const pdfBuffer = await readFile(outputPath);

    return `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Resume PDF conversion failed: ${error.message}`
        : 'Resume PDF conversion failed'
    );
  } finally {
    await rm(workDir, { force: true, recursive: true });
  }
}
