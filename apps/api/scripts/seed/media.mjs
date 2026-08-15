// Media generation + Cloudinary upload for seed applicants.
//
// Strategy:
//  - Generate a small POOL of short, COLORFUL (never black) portrait videos with
//    ffmpeg, upload each once to Cloudinary, and reuse them across applicants
//    round-robin. This keeps Cloudinary usage tiny while giving every applicant a
//    real, playable video with a real (non-black) thumbnail.
//  - Optionally generate one sample resume PDF and reuse it for applicants that
//    have a resume.
//
// Overrides (skip generation entirely and reuse assets you already host):
//   SEED_SKIP_MEDIA=true                -> no ffmpeg, no upload; use the *_URL vars
//   SEED_SAMPLE_10S_URL / _PUBLIC_ID    -> your own 10s video
//   SEED_SAMPLE_30S_URL / _PUBLIC_ID    -> your own 30s video
//   SEED_SAMPLE_THUMBNAIL_URL           -> thumbnail for the above
//   SEED_SAMPLE_RESUME_URL / _PUBLIC_ID -> your own resume PDF
//
// ffmpeg is required unless SEED_SKIP_MEDIA=true.

import { mkdtempSync, rmSync, writeFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { v2 as cloudinary } from 'cloudinary';
import { SEED_CLOUDINARY_FOLDER, log, requireEnv } from './shared.mjs';

// Distinct, colorful lavfi test patterns → visually different clips.
const LAVFI_SOURCES = [
  'testsrc2=size=1080x1920:rate=30',
  'smptebars=size=1080x1920:rate=30',
  'rgbtestsrc=size=1080x1920:rate=30',
  'testsrc=size=1080x1920:rate=30',
  'mandelbrot=size=1080x1920:rate=30',
  'life=size=1080x1920:rate=30:mold=10:ratio=0.1:death_color=0x39FF14:life_color=0xFF6EC7'
];

const TEN_SECOND_POOL = 4;
const THIRTY_SECOND_POOL = 3;

function ffmpegAvailable() {
  const res = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  return res.status === 0;
}

function generateVideo(tmpDir, source, durationSeconds, outName) {
  const outPath = join(tmpDir, outName);
  const res = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-f', 'lavfi',
      '-i', source,
      '-t', String(durationSeconds),
      '-pix_fmt', 'yuv420p',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-movflags', '+faststart',
      outPath
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] }
  );
  if (res.status !== 0) {
    throw new Error(`ffmpeg failed for ${outName}: ${res.stderr?.toString().slice(-500)}`);
  }
  return outPath;
}

async function uploadVideo(path, publicId, durationSeconds) {
  const result = await cloudinary.uploader.upload(path, {
    resource_type: 'video',
    folder: SEED_CLOUDINARY_FOLDER,
    public_id: publicId,
    overwrite: true
  });
  const thumbnailUrl = cloudinary.url(result.public_id, {
    resource_type: 'video',
    format: 'jpg',
    secure: true,
    transformation: [{ start_offset: '1', width: 720, height: 1280, crop: 'fill' }]
  });
  return {
    storageProvider: 'cloudinary',
    cloudinaryPublicId: result.public_id,
    secureUrl: result.secure_url,
    thumbnailUrl,
    contentType: 'video/mp4',
    fileSizeBytes: result.bytes ?? statSync(path).size,
    durationSeconds,
    maxResolution: '1080p',
    orientation: 'portrait'
  };
}

// Minimal, valid single-page PDF built by hand with correct xref offsets.
function buildSamplePdf() {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    null, // content stream, filled below
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  ];
  const streamText =
    'BT /F1 24 Tf 72 720 Td (Cato Seed Sample Resume) Tj ' +
    '0 -36 Td /F1 12 Tf (This is placeholder resume data for a dummy applicant.) Tj ' +
    '0 -18 Td (Not a real person. Safe to delete via the reset script.) Tj ET';
  objects[3] = `<< /Length ${streamText.length} >>\nstream\n${streamText}\nendstream`;

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return pdf;
}

async function uploadResumePdf(tmpDir) {
  const pdfPath = join(tmpDir, 'seed-resume.pdf');
  writeFileSync(pdfPath, buildSamplePdf(), 'latin1');
  const result = await cloudinary.uploader.upload(pdfPath, {
    resource_type: 'raw',
    folder: SEED_CLOUDINARY_FOLDER,
    public_id: 'seed_resume',
    overwrite: true
  });
  return {
    cloudinaryPublicId: result.public_id,
    secureUrl: result.secure_url,
    fileSizeBytes: result.bytes ?? statSync(pdfPath).size
  };
}

// Returns pools of media assets to be assigned to applicants.
export async function buildMediaPools() {
  const skipMedia = process.env.SEED_SKIP_MEDIA === 'true';

  if (skipMedia) {
    const tenUrl = process.env.SEED_SAMPLE_10S_URL;
    const thirtyUrl = process.env.SEED_SAMPLE_30S_URL;
    const thumb = process.env.SEED_SAMPLE_THUMBNAIL_URL;
    if (!tenUrl || !thumb) {
      throw new Error(
        'SEED_SKIP_MEDIA=true requires at least SEED_SAMPLE_10S_URL and SEED_SAMPLE_THUMBNAIL_URL'
      );
    }
    log('SEED_SKIP_MEDIA=true — using supplied sample URLs (no ffmpeg/upload).');
    const makeAsset = (url, publicId, duration) => ({
      storageProvider: 'cloudinary',
      cloudinaryPublicId: publicId,
      secureUrl: url,
      thumbnailUrl: thumb,
      contentType: 'video/mp4',
      durationSeconds: duration,
      maxResolution: '1080p',
      orientation: 'portrait'
    });
    return {
      tenSecond: [makeAsset(tenUrl, process.env.SEED_SAMPLE_10S_PUBLIC_ID, 10)],
      thirtySecond: thirtyUrl
        ? [makeAsset(thirtyUrl, process.env.SEED_SAMPLE_30S_PUBLIC_ID, 30)]
        : [],
      resume: process.env.SEED_SAMPLE_RESUME_URL
        ? {
            cloudinaryPublicId: process.env.SEED_SAMPLE_RESUME_PUBLIC_ID,
            secureUrl: process.env.SEED_SAMPLE_RESUME_URL
          }
        : null
    };
  }

  if (!ffmpegAvailable()) {
    throw new Error(
      'ffmpeg not found. Install ffmpeg, or run with SEED_SKIP_MEDIA=true plus SEED_SAMPLE_*_URL vars.'
    );
  }

  cloudinary.config({
    cloud_name: requireEnv('CLOUDINARY_CLOUD_NAME'),
    api_key: requireEnv('CLOUDINARY_API_KEY'),
    api_secret: requireEnv('CLOUDINARY_API_SECRET')
  });

  const tmpDir = mkdtempSync(join(tmpdir(), 'cato-seed-'));
  try {
    log(`Generating ${TEN_SECOND_POOL} x 10s and ${THIRTY_SECOND_POOL} x 30s sample videos with ffmpeg...`);
    const tenSecond = [];
    for (let i = 0; i < TEN_SECOND_POOL; i += 1) {
      const src = LAVFI_SOURCES[i % LAVFI_SOURCES.length];
      const path = generateVideo(tmpDir, src, 10, `ten_${i}.mp4`);
      tenSecond.push(await uploadVideo(path, `seed_10s_${i}`, 10));
      log(`  uploaded 10s clip ${i + 1}/${TEN_SECOND_POOL}`);
    }

    const thirtySecond = [];
    for (let i = 0; i < THIRTY_SECOND_POOL; i += 1) {
      const src = LAVFI_SOURCES[(i + 2) % LAVFI_SOURCES.length];
      const path = generateVideo(tmpDir, src, 30, `thirty_${i}.mp4`);
      thirtySecond.push(await uploadVideo(path, `seed_30s_${i}`, 30));
      log(`  uploaded 30s clip ${i + 1}/${THIRTY_SECOND_POOL}`);
    }

    log('Generating + uploading sample resume PDF...');
    const resume = await uploadResumePdf(tmpDir);

    return { tenSecond, thirtySecond, resume };
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}
