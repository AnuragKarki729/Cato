export type AppUserRole = 'applicant' | 'recruiter';

export type AuthRoleResponse = {
  role: AppUserRole | null;
};

export type ClaimAuthRoleRequest = {
  role: AppUserRole;
};
