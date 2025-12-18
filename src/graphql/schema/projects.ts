import {
  objectType,
  inputObjectType,
  mutationField,
  queryField,
  stringArg,
  arg,
  list,
  nonNull,
  enumType,
} from 'nexus';

import {
  PROJECT_STATUS_MAP,
  PROJECT_CONTACT_RELATION_MAP,
  SCOPE_OF_WORK_MAP,
  ScopeOfWork,
} from '../../services/projects/model';

export const ScopeOfWorkEnum = enumType({
  name: 'ScopeOfWorkEnum',
  members: Object.keys(SCOPE_OF_WORK_MAP),
  description: `Project scope of work. Allowed values:
${Object.keys(SCOPE_OF_WORK_MAP)
  .map(
    (k) => `- ${k}: ${SCOPE_OF_WORK_MAP[k as keyof typeof SCOPE_OF_WORK_MAP]}`,
  )
  .join('\n')}`,
});

export const ProjectStatusEnum = enumType({
  name: 'ProjectStatusEnum',
  members: Object.keys(PROJECT_STATUS_MAP),
  description: `Project status. Allowed values:
${Object.keys(PROJECT_STATUS_MAP)
  .map(
    (k) =>
      `- ${k}: ${PROJECT_STATUS_MAP[k as keyof typeof PROJECT_STATUS_MAP]}`,
  )
  .join('\n')}`,
});

export const Company = objectType({
  name: 'Company',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('name');
  },
});

export const ProjectContactRelationEnum = enumType({
  name: 'ProjectContactRelationEnum',
  members: Object.keys(PROJECT_CONTACT_RELATION_MAP),
  description: `Project contact relation to project. Allowed values:
${Object.keys(PROJECT_CONTACT_RELATION_MAP)
  .map(
    (k) =>
      `- ${k}: ${PROJECT_CONTACT_RELATION_MAP[k as keyof typeof PROJECT_CONTACT_RELATION_MAP]}`,
  )
  .join('\n')}`,
});

export const ProjectContact = objectType({
  name: 'ProjectContact',
  definition(t) {
    t.nonNull.string('contact_id');
    t.nonNull.field('relation_to_project', {
      type: 'ProjectContactRelationEnum',
    });
    t.field('contact', {
      type: 'Contact',
      resolve: async (parent, _, ctx) => {
        if (!parent.contact_id) return null;
        return ctx.dataloaders.contacts.getContactsById.load(parent.contact_id);
      },
    });
  },
});

export const Project = objectType({
  name: 'Project',
  sourceType: {
    module: require.resolve('../../services/projects'),
    export: 'ProjectDoc',
  },
  definition(t) {
    t.nonNull.string('id', {
      resolve: (parent) => parent._id,
    });
    t.nonNull.string('workspaceId');
    t.nonNull.string('name', {
      resolve: (parent) => parent.name,
    });
    t.nonNull.string('project_code', {
      resolve: (parent) => parent.projectCode,
    });
    t.string('description');
    t.string('parent_project');
    t.list.field('sub_projects', {
      type: 'Project',
      description: 'List of sub-projects (children) for this project.',
      resolve: async (parent, _, ctx) => {
        return ctx.services.projectsService.findProjectsByParentProjectId(
          parent._id,
          ctx.user,
        );
      },
    });
    t.nonNull.int('totalDescendantCount', {
      description: 'Total count of all descendants (subprojects at all levels)',
      resolve: async (parent, _, ctx) => {
        return ctx.services.projectsService.countAllDescendants(
          parent._id,
          ctx.user,
        );
      },
    });
    t.field('status', {
      type: 'ProjectStatusEnum',
      description: `Project status. Allowed values: ${Object.keys(PROJECT_STATUS_MAP).join(', ')}`,
      resolve: (parent) => {
        return (parent as any).status;
      },
    });
    t.field('scope_of_work', {
      type: list('ScopeOfWorkEnum'),
      description: `Project scope of work. Allowed values: ${Object.keys(SCOPE_OF_WORK_MAP).join(', ')}`,
      resolve: (parent) => {
        return (parent as any).scope_of_work;
      },
    });
    t.list.nonNull.field('project_contacts', {
      type: 'ProjectContact',
      description: `Contacts associated with the project and their relation to the project.`,
      resolve: (parent) => {
        return (parent as any).project_contacts || [];
      },
    });
    t.nonNull.string('created_by', {
      resolve: (parent) => parent.createdBy,
    });
    t.nonNull.string('created_at');
    t.nonNull.string('updated_at');
    t.nonNull.string('updated_by');
    t.nonNull.boolean('deleted');
    t.field('created_by_user', {
      type: 'User',
      resolve: async (parent, _, ctx) => {
        // Assuming createdBy is the user id
        if (!parent.createdBy) return null;
        return ctx.dataloaders.users.getUsersById.load(parent.createdBy);
      },
    });
    t.field('updated_by_user', {
      type: 'User',
      resolve: async (parent, _, ctx) => {
        // Assuming updated_by is the user id
        if (!parent.updated_by) return null;
        return ctx.dataloaders.users.getUsersById.load(parent.updated_by);
      },
    });
    t.field('associatedPriceBooks', {
      type: 'ListPriceBooksResult',
      description: 'All price books associated with this project',
      async resolve(parent, _, ctx) {
        return ctx.services.pricesService.listPriceBooks(
          {
            filter: {
              workspaceId: parent.workspaceId,
              projectId: parent._id,
            },
            page: { number: 1, size: 1000 },
          },
          ctx.user,
        );
      },
    });
  },
});

export const CreateProject = mutationField('createProject', {
  type: 'Project',
  args: {
    input: arg({ type: 'ProjectInput' }),
  },
  async resolve(_, { input }, ctx) {
    if (!input) {
      throw new Error('Input is required');
    }
    if (!input.workspaceId) {
      throw new Error('workspaceId is required');
    }
    return ctx.services.projectsService.createProject(
      {
        workspaceId: input.workspaceId,
        name: input.name,
        projectCode: input.project_code,
        description: input.description || undefined,
        status: input.status || undefined,
        scope_of_work: (input.scope_of_work as ScopeOfWork[]) || [],
        project_contacts: input.project_contacts || [],
        parent_project: input.parent_project || undefined,
        deleted: input.deleted,
      },
      ctx.user,
    );
  },
});

export const listProjects = queryField('listProjects', {
  type: list('Project'),
  args: {
    workspaceId: nonNull(stringArg()),
  },
  resolve: (_, { workspaceId }, ctx) => {
    return ctx.services.projectsService.listProjects(workspaceId, ctx.user);
  },
});

export const listTopLevelProjects = queryField('listTopLevelProjects', {
  type: list('Project'),
  description: 'Lists all top-level projects (where parent_project is null).',
  args: {
    workspaceId: nonNull(stringArg()),
  },
  resolve: async (_, { workspaceId }, ctx) => {
    const projects = await ctx.services.projectsService.listProjects(
      workspaceId,
      ctx.user,
    );
    // Only include projects where parent_project is null or undefined
    return projects.filter((dbProject: any) => !dbProject.parent_project);
  },
});

export const listProjectsByParentProjectId = queryField(
  'listProjectsByParentProjectId',
  {
    type: list('Project'),
    args: {
      parent_project: nonNull(stringArg()),
    },
    resolve: (_, { parent_project }, ctx) => {
      return ctx.services.projectsService.findProjectsByParentProjectId(
        parent_project,
        ctx.user,
      );
    },
  },
);

export const getProjectById = queryField('getProjectById', {
  type: 'Project',
  args: {
    id: nonNull(stringArg()),
  },
  resolve: (_, { id }, ctx) => {
    return ctx.services.projectsService.getProjectById(id, ctx.user);
  },
});

export const ProjectContactInput = inputObjectType({
  name: 'ProjectContactInput',
  definition(t) {
    t.nonNull.string('contact_id');
    t.nonNull.field('relation_to_project', {
      type: 'ProjectContactRelationEnum',
    });
  },
});

export const ProjectInput = inputObjectType({
  name: 'ProjectInput',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.nonNull.string('name');
    t.nonNull.string('project_code');
    t.string('description');
    t.string('parent_project', {
      description: 'Optional referential id to a parent project',
    });
    t.field('status', {
      type: 'ProjectStatusEnum',
      description: `Project status. Allowed values: ${Object.keys(PROJECT_STATUS_MAP).join(', ')}`,
    });
    t.field('scope_of_work', {
      type: list('ScopeOfWorkEnum'),
      description: `Project scope of work. Allowed values: ${Object.keys(SCOPE_OF_WORK_MAP).join(', ')}`,
    });
    t.list.nonNull.field('project_contacts', {
      type: 'ProjectContactInput',
      description:
        'Contacts associated with the project and their relation to the project.',
    });
    t.nonNull.boolean('deleted');
  },
});

export const UpdateProject = mutationField('updateProject', {
  type: 'Project',
  args: {
    id: stringArg(),
    input: arg({ type: 'ProjectInput' }),
  },
  async resolve(_, { id, input }, ctx) {
    const now = new Date();

    if (!id) {
      throw new Error('Project id is required');
    }

    // createdBy must be present on the user context and be a string
    const createdBy =
      ctx.user && typeof ctx.user.id === 'string'
        ? (ctx.user as any).id
        : undefined;
    if (!createdBy) {
      throw new Error('No createdBy (es_user_id) found in user context');
    }

    // Ensure all required fields are present
    const project = {
      workspaceId: input?.workspaceId ?? '',
      name: input?.name ?? '',
      projectCode: input?.project_code ?? '',
      description: input?.description ?? undefined,
      status: input?.status || undefined,
      scope_of_work: input?.scope_of_work as ScopeOfWork[] | undefined,
      project_contacts: input?.project_contacts || [],
      deleted: input?.deleted ?? false,
      createdBy,
      created_at: now,
      updated_at: now,
      parent_project: input?.parent_project || undefined,
    };

    await ctx.services.projectsService.updateProject(id, project, ctx.user);

    return ctx.services.projectsService.getProjectById(id, ctx.user);
  },
});

export const DeleteProject = mutationField('deleteProject', {
  type: 'Project',
  args: {
    id: nonNull(stringArg()),
  },
  resolve(_, { id }, ctx) {
    return ctx.services.projectsService.deleteProject(id, ctx.user);
  },
});

// --- Project Status Codes Query ---

const SCOPE_OF_WORK_DESCRIPTIONS: Record<
  keyof typeof SCOPE_OF_WORK_MAP,
  string
> = {
  SITE_CIVIL:
    'Clearing, grubbing, earthwork, underground utilities, erosion control, paving, striping, hardscape, and landscaping.',
  FOUNDATIONS:
    'Deep (pile, caisson) and shallow (spread footing, slab‑on‑grade) foundations, waterproofing, and sub‑slab drainage systems.',
  STRUCTURAL_FRAME:
    'Structural steel or cast‑in‑place concrete frame, metal decking, shear bracing, anchor bolts, and related fireproofing.',
  BUILDING_ENVELOPE:
    'Exterior wall systems (masonry, precast, curtain wall), thermal & moisture protection, roofing systems, windows, skylights, and exterior doors.',
  INTERIOR_BUILD_OUT:
    'Metal studs, drywall, ceilings, flooring, interior glazing, millwork, casework, interior doors, hardware, paint, and specialty finishes.',
  MEP: 'HVAC equipment & ductwork, plumbing supply & waste, fire protection systems, medium- and low-voltage electrical distribution, lighting, and emergency power.',
  SPECIALTY_SYSTEMS:
    'Vertical transportation (elevators, lifts), building automation, security & access control, audiovisual, structured cabling, and telecom infrastructure.',
  COMMISSIONING_STARTUP:
    'Functional performance testing, TAB (testing, adjusting & balancing), systems verification, owner training sessions, and punch‑list resolution.',
  DEMOBILIZATION_CLOSE_OUT:
    'Final cleaning, removal of temporary facilities, restoration of lay‑down areas, compilation of turnover documentation, warranty certificates, lien waivers, and final pay application.',
  WARRANTY_SERVICES:
    'Scheduled inspections, corrective work, preventive maintenance, and performance monitoring through warranty expiration.',
};

export const listScopeOfWorkCodes = queryField('listScopeOfWorkCodes', {
  type: list(
    objectType({
      name: 'ScopeOfWorkCode',
      definition(t) {
        t.nonNull.string('code');
        t.nonNull.string('description');
      },
    }),
  ),
  description:
    'Lists all possible scope_of_work codes and their descriptions, including recommended usage and stage meaning.',
  resolve: () =>
    Object.entries(SCOPE_OF_WORK_DESCRIPTIONS).map(([code, description]) => ({
      code,
      description,
    })),
});

const PROJECT_CONTACT_RELATION_DESCRIPTIONS: Record<
  keyof typeof PROJECT_CONTACT_RELATION_MAP,
  string
> = PROJECT_CONTACT_RELATION_MAP;

const PROJECT_STATUS_DESCRIPTIONS: Record<
  keyof typeof PROJECT_STATUS_MAP,
  string
> = {
  CONCEPT_OPPORTUNITY:
    'Project identified; high‑level requirements gathered and cost/benefit studied.',
  BIDDING_TENDERING:
    'Drawings, specifications, and bid packages issued; pricing and proposals collected; intent‑to‑award decisions pending.',
  PRE_CONSTRUCTION:
    'Contracts executed, detailed design finalized, long‑lead procurement released, permitting underway, baseline schedule & budget approved.',
  MOBILIZATION:
    'Temporary facilities, utilities, safety plans, site survey/layout, and initial material staging established before bulk construction starts.',
  ACTIVE_CONSTRUCTION:
    'Major physical work across trades is in progress; schedule and cost controls actively managed.',
  SUBSTANTIAL_COMPLETION:
    'Building/system is functional and fit for its intended use; punch‑list items and minor outstanding work remain.',
  CLOSE_OUT:
    'As‑builts compiled, O&M manuals delivered, training performed, final inspections & commissioning completed, retention released.',
  WARRANTY_MAINTENANCE:
    'Contractor/service provider addresses defects during the warranty interval; performance monitoring as necessary.',
  ARCHIVED_CLOSED:
    'All contractual and financial obligations satisfied; records archived; no further activity expected.',
};

export const listProjectStatusCodes = queryField('listProjectStatusCodes', {
  type: list(
    objectType({
      name: 'ProjectStatusCode',
      definition(t) {
        t.nonNull.string('code');
        t.nonNull.string('description');
      },
    }),
  ),
  description:
    'Lists all possible project status codes and their descriptions, including recommended usage and stage meaning.',
  resolve: () =>
    Object.entries(PROJECT_STATUS_DESCRIPTIONS).map(([code, description]) => ({
      code,
      description,
    })),
});

export const listProjectContactRelationCodes = queryField(
  'listProjectContactRelationCodes',
  {
    type: list(
      objectType({
        name: 'ProjectContactRelationCode',
        definition(t) {
          t.nonNull.string('code');
          t.nonNull.string('description');
        },
      }),
    ),
    description:
      'Lists all possible project contact relation codes and their descriptions.',
    resolve: () =>
      Object.entries(PROJECT_CONTACT_RELATION_DESCRIPTIONS).map(
        ([code, description]) => ({
          code,
          description,
        }),
      ),
  },
);

// --- PATCH FIELD MUTATIONS ---

export const updateProjectName = mutationField('updateProjectName', {
  type: 'Project',
  args: {
    id: nonNull(stringArg()),
    name: nonNull(stringArg()),
  },
  resolve(_, { id, name }, ctx) {
    return ctx.services.projectsService.patchProject(id, { name }, ctx.user);
  },
});

export const updateProjectCode = mutationField('updateProjectCode', {
  type: 'Project',
  args: {
    id: nonNull(stringArg()),
    project_code: nonNull(stringArg()),
  },
  resolve(_, { id, project_code }, ctx) {
    return ctx.services.projectsService.patchProject(
      id,
      { projectCode: project_code },
      ctx.user,
    );
  },
});

export const updateProjectDescription = mutationField(
  'updateProjectDescription',
  {
    type: 'Project',
    args: {
      id: nonNull(stringArg()),
      description: stringArg(),
    },
    resolve(_, { id, description }, ctx) {
      return ctx.services.projectsService.patchProject(
        id,
        { description: description || '' },
        ctx.user,
      );
    },
  },
);

export const updateProjectStatus = mutationField('updateProjectStatus', {
  type: 'Project',
  args: {
    id: nonNull(stringArg()),
    status: arg({ type: 'ProjectStatusEnum' }),
  },
  resolve(_, { id, status }, ctx) {
    return ctx.services.projectsService.patchProject(
      id,
      { status: status || undefined },
      ctx.user,
    );
  },
});

export const updateProjectScopeOfWork = mutationField(
  'updateProjectScopeOfWork',
  {
    type: 'Project',
    args: {
      id: nonNull(stringArg()),
      scope_of_work: nonNull(arg({ type: list(nonNull('ScopeOfWorkEnum')) })),
    },
    resolve(_, { id, scope_of_work }, ctx) {
      return ctx.services.projectsService.patchProject(
        id,
        {
          scope_of_work,
        },
        ctx.user,
      );
    },
  },
);

export const updateProjectParentProject = mutationField(
  'updateProjectParentProject',
  {
    type: 'Project',
    args: {
      id: nonNull(stringArg()),
      parent_project: stringArg(),
    },
    resolve(_, { id, parent_project }, ctx) {
      return ctx.services.projectsService.patchProject(
        id,
        { parent_project: parent_project || undefined },
        ctx.user,
      );
    },
  },
);

export const updateProjectContacts = mutationField('updateProjectContacts', {
  type: 'Project',
  args: {
    id: nonNull(stringArg()),
    project_contacts: nonNull(
      arg({ type: list(nonNull('ProjectContactInput')) }),
    ),
  },
  resolve(_, { id, project_contacts }, ctx) {
    return ctx.services.projectsService.patchProject(
      id,
      { project_contacts },
      ctx.user,
    );
  },
});
