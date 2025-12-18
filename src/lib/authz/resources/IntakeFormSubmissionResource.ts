import { Redis } from 'ioredis';
import { AuthzedClient } from '../spiceDB-client';
import {
  ERP_INTAKE_FORM_SUBMISSION_PERMISSIONS,
  ERP_INTAKE_FORM_SUBMISSION_RELATIONS,
  ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS,
  ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS_MAP,
  ERP_INTAKE_FORM_SUBMISSION_SUBJECT_RELATIONS,
  ERP_INTAKE_FORM_SUBMISSION_SUBJECT_RELATIONS_MAP,
  RESOURCE_TYPES,
} from '../spicedb-generated-types';
import { BaseResourceWithCaching } from '../../spicedb-base-resource/BaseResource';

export class IntakeFormSubmissionResource extends BaseResourceWithCaching<
  ERP_INTAKE_FORM_SUBMISSION_RELATIONS,
  ERP_INTAKE_FORM_SUBMISSION_PERMISSIONS,
  RESOURCE_TYPES,
  ERP_INTAKE_FORM_SUBMISSION_SUBJECT_RELATIONS,
  ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS
> {
  constructor(client: AuthzedClient, redis: Redis) {
    super(
      client,
      redis,
      RESOURCE_TYPES.ERP_INTAKE_FORM_SUBMISSION,
      ERP_INTAKE_FORM_SUBMISSION_SUBJECT_RELATIONS_MAP,
      ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS_MAP,
    );
  }
  // Add IntakeFormSubmission specific methods here

  writeIntakeFormSubmissionRelations(opts: {
    id: string;
    formId: string;
    userId: string;
  }) {
    const { id, formId, userId } = opts;
    return this.writeRelations([
      {
        resourceId: id,
        relation:
          ERP_INTAKE_FORM_SUBMISSION_SUBJECT_RELATIONS.INTAKE_FORM_INTAKE_FORM,
        subjectId: formId,
      },
      {
        resourceId: id,
        relation: ERP_INTAKE_FORM_SUBMISSION_SUBJECT_RELATIONS.USER_SUBMITTER,
        subjectId: userId,
      },
    ]);
  }

  writeIntakeFormRelation(opts: { id: string; formId: string }) {
    const { id, formId } = opts;
    return this.writeRelations([
      {
        resourceId: id,
        relation:
          ERP_INTAKE_FORM_SUBMISSION_SUBJECT_RELATIONS.INTAKE_FORM_INTAKE_FORM,
        subjectId: formId,
      },
    ]);
  }

  writeSubmitterRelation(opts: { id: string; userId: string }) {
    const { id, userId } = opts;
    return this.writeRelations([
      {
        resourceId: id,
        relation: ERP_INTAKE_FORM_SUBMISSION_SUBJECT_RELATIONS.USER_SUBMITTER,
        subjectId: userId,
      },
    ]);
  }

  writeBuyerWorkspaceRelation(opts: { id: string; buyerWorkspaceId: string }) {
    const { id, buyerWorkspaceId } = opts;
    return this.writeRelations([
      {
        resourceId: id,
        relation:
          ERP_INTAKE_FORM_SUBMISSION_SUBJECT_RELATIONS.WORKSPACE_BUYERS_WORKSPACE,
        subjectId: buyerWorkspaceId,
      },
    ]);
  }

  deleteBuyerWorkspaceRelation(opts: { id: string }) {
    const { id } = opts;
    return this.deleteRelationships({
      resourceId: id,
      relation:
        ERP_INTAKE_FORM_SUBMISSION_SUBJECT_RELATIONS.WORKSPACE_BUYERS_WORKSPACE,
    });
  }
}
