import type { Collection, Db, ObjectId, WithId } from 'mongodb';
import { collections } from '../db/collections.js';

type MediaAsset = {
  storageProvider: 'cloudinary';
  cloudinaryPublicId?: string;
  secureUrl?: string;
  thumbnailUrl?: string;
  contentType?: string;
  fileSizeBytes?: number;
  durationSeconds: number;
  maxResolution: '1080p';
  orientation: 'portrait';
  uploadedAt: Date;
};

export type ApplicantSignalDocument = {
  applicantId: ObjectId;
  promptId?: string;
  promptTextSnapshot?: string;
  tenSecondElaboration?: string;
  tenSecondElaborationSkipped?: boolean;
  tenSecondVideo?: MediaAsset;
  thirtySecondVideo?: MediaAsset;
  thirtySecondVideoSkipped: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function applicantSignalsCollection(db: Db): Collection<ApplicantSignalDocument> {
  return db.collection<ApplicantSignalDocument>(collections.applicantSignals);
}

export async function findSignalByApplicantId(db: Db, applicantId: ObjectId) {
  return applicantSignalsCollection(db).findOne({ applicantId });
}

export async function selectSignalPrompt(db: Db, applicantId: ObjectId, promptId: string, promptText: string) {
  const now = new Date();

  await applicantSignalsCollection(db).updateOne(
    { applicantId },
    {
      $setOnInsert: {
        applicantId,
        thirtySecondVideoSkipped: false,
        createdAt: now
      },
      $set: {
        promptId,
        promptTextSnapshot: promptText,
        updatedAt: now
      }
    },
    { upsert: true }
  );

  const signal = await findSignalByApplicantId(db, applicantId);

  if (!signal) {
    throw new Error('Signal prompt save failed');
  }

  return signal;
}

export async function saveSignalVideo(
  db: Db,
  applicantId: ObjectId,
  videoType: 'tenSecondVideo' | 'thirtySecondVideo',
  asset: MediaAsset
) {
  const now = new Date();
  const setOnInsert: Partial<ApplicantSignalDocument> = {
    applicantId,
    createdAt: now
  };

  if (videoType !== 'thirtySecondVideo') {
    setOnInsert.thirtySecondVideoSkipped = false;
  }

  await applicantSignalsCollection(db).updateOne(
    { applicantId },
    {
      $setOnInsert: setOnInsert,
      $set: {
        [videoType]: asset,
        ...(videoType === 'thirtySecondVideo' ? { thirtySecondVideoSkipped: false } : {}),
        updatedAt: now
      }
    },
    { upsert: true }
  );

  const signal = await findSignalByApplicantId(db, applicantId);

  if (!signal) {
    throw new Error('Signal video save failed');
  }

  return signal;
}

export async function saveTenSecondElaboration(
  db: Db,
  applicantId: ObjectId,
  input: { elaboration?: string; skipped: boolean }
) {
  const now = new Date();

  await applicantSignalsCollection(db).updateOne(
    { applicantId },
    {
      $setOnInsert: {
        applicantId,
        thirtySecondVideoSkipped: false,
        createdAt: now
      },
      $set: {
        tenSecondElaborationSkipped: input.skipped,
        updatedAt: now
      },
      $unset: input.skipped || !input.elaboration ? { tenSecondElaboration: '' } : {}
    },
    { upsert: true }
  );

  if (!input.skipped && input.elaboration) {
    await applicantSignalsCollection(db).updateOne(
      { applicantId },
      {
        $set: {
          tenSecondElaboration: input.elaboration,
          updatedAt: now
        }
      }
    );
  }

  const signal = await findSignalByApplicantId(db, applicantId);

  if (!signal) {
    throw new Error('Signal elaboration save failed');
  }

  return signal;
}

export async function skipThirtySecondVideo(db: Db, applicantId: ObjectId) {
  const now = new Date();

  await applicantSignalsCollection(db).updateOne(
    { applicantId },
    {
      $setOnInsert: {
        applicantId,
        createdAt: now
      },
      $set: {
        thirtySecondVideoSkipped: true,
        updatedAt: now
      },
      $unset: {
        thirtySecondVideo: ''
      }
    },
    { upsert: true }
  );

  const signal = await findSignalByApplicantId(db, applicantId);

  if (!signal) {
    throw new Error('Signal skip save failed');
  }

  return signal;
}

export async function deleteSignalVideo(
  db: Db,
  applicantId: ObjectId,
  videoType: 'tenSecondVideo' | 'thirtySecondVideo'
) {
  const now = new Date();

  await applicantSignalsCollection(db).updateOne(
    { applicantId },
    {
      $set: {
        ...(videoType === 'thirtySecondVideo' ? { thirtySecondVideoSkipped: true } : {}),
        updatedAt: now
      },
      $unset: {
        [videoType]: ''
      }
    }
  );

  return findSignalByApplicantId(db, applicantId);
}

function serializeMediaAsset(asset?: MediaAsset) {
  if (!asset) {
    return undefined;
  }

  return {
    storageProvider: asset.storageProvider,
    cloudinaryPublicId: asset.cloudinaryPublicId,
    secureUrl: asset.secureUrl,
    thumbnailUrl: asset.thumbnailUrl,
    contentType: asset.contentType,
    fileSizeBytes: asset.fileSizeBytes,
    durationSeconds: asset.durationSeconds,
    maxResolution: asset.maxResolution,
    orientation: asset.orientation,
    uploadedAt: asset.uploadedAt.toISOString()
  };
}

export function serializeSignal(signal: WithId<ApplicantSignalDocument>) {
  return {
    promptId: signal.promptId,
    promptTextSnapshot: signal.promptTextSnapshot,
    tenSecondElaboration: signal.tenSecondElaboration,
    tenSecondElaborationSkipped: Boolean(signal.tenSecondElaborationSkipped),
    tenSecondVideo: serializeMediaAsset(signal.tenSecondVideo),
    thirtySecondVideo: serializeMediaAsset(signal.thirtySecondVideo),
    thirtySecondVideoSkipped: signal.thirtySecondVideoSkipped,
    updatedAt: signal.updatedAt.toISOString()
  };
}
