export const roleDepartments = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Finance',
  'Operations',
  'Data',
  'Research',
  'HR',
  'Legal',
  'Customer Success',
  'Other'
] as const;

export type RoleDepartment = (typeof roleDepartments)[number];
