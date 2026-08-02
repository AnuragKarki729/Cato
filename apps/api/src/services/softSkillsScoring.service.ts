import type { Db, ObjectId } from 'mongodb';
import { findSignalByApplicantId } from '../repositories/signals.repo.js';
import { saveDummySoftSkills } from '../repositories/softSkills.repo.js';
import { generateSoftSkillsFromSignal } from './softSkillsDummy.service.js';

export async function recalculateSoftSkillsFromSignal(db: Db, applicantId: ObjectId, supabaseUserId: string) {
  const signal = await findSignalByApplicantId(db, applicantId);
  const items = generateSoftSkillsFromSignal(supabaseUserId, signal);

  return saveDummySoftSkills(db, applicantId, items);
}
