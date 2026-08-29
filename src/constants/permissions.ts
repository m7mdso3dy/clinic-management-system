/** Stable permission names stored in `permissions.name`. */
export const PERMISSIONS = {
  examinationTypesList: 'examination_types.list',
  examinationTypesCreate: 'examination_types.create',
  examinationTypesUpdate: 'examination_types.update',
  examinationTypesDelete: 'examination_types.delete',
  patientsList: 'patients.list',
  patientsView: 'patients.view',
  patientsCreate: 'patients.create',
  patientsUpdate: 'patients.update',
  patientsDelete: 'patients.delete',
  rolesList: 'roles.list',
  rolesCreate: 'roles.create',
  rolesUpdate: 'roles.update',
  rolesDelete: 'roles.delete',
} as const

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
