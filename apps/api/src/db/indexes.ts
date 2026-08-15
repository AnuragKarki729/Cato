import type { Db } from 'mongodb';
import { ensureApplicantIndexes } from '../repositories/applicants.repo.js';
import { ensureApplicantActivityIndexes } from '../repositories/applicantActivities.repo.js';
import { ensureEducationIndexes } from '../repositories/education.repo.js';
import { ensureInternshipIndexes } from '../repositories/internships.repo.js';
import { ensureRecruiterIndexes } from '../repositories/recruiters.repo.js';
import { ensureRecruiterSavedFilterIndexes } from '../repositories/recruiterSavedFilters.repo.js';
import { ensureNotificationIndexes } from '../repositories/notifications.repo.js';
import { ensureApplicantProjectIndexes } from '../repositories/projects.repo.js';
import { ensureResumeIndexes } from '../repositories/resumes.repo.js';
import { ensureSignalIndexes } from '../repositories/signals.repo.js';
import { ensureSoftSkillIndexes } from '../repositories/softSkills.repo.js';
import { ensureAppUserRoleIndexes } from '../repositories/userRoles.repo.js';

export async function ensureDatabaseIndexes(db: Db) {
  await Promise.all([
    ensureApplicantIndexes(db),
    ensureApplicantActivityIndexes(db),
    ensureAppUserRoleIndexes(db),
    ensureEducationIndexes(db),
    ensureResumeIndexes(db),
    ensureSignalIndexes(db),
    ensureApplicantProjectIndexes(db),
    ensureSoftSkillIndexes(db),
    ensureInternshipIndexes(db),
    ensureRecruiterIndexes(db),
    ensureRecruiterSavedFilterIndexes(db),
    ensureNotificationIndexes(db)
  ]);
}
