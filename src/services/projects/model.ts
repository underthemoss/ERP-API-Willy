import { type MongoClient, type Db, type Collection } from 'mongodb';
import { generateId } from '../../lib/id-generator';

export const PROJECT_STATUS_MAP = {
  CONCEPT_OPPORTUNITY: 'CONCEPT / OPPORTUNITY',
  BIDDING_TENDERING: 'BIDDING / TENDERING',
  PRE_CONSTRUCTION: 'PRE‑CONSTRUCTION',
  MOBILIZATION: 'MOBILIZATION',
  ACTIVE_CONSTRUCTION: 'ACTIVE CONSTRUCTION',
  SUBSTANTIAL_COMPLETION: 'SUBSTANTIAL COMPLETION',
  CLOSE_OUT: 'CLOSE‑OUT',
  WARRANTY_MAINTENANCE: 'WARRANTY / MAINTENANCE',
  ARCHIVED_CLOSED: 'ARCHIVED / CLOSED',
} as const;

export type ProjectStatus = keyof typeof PROJECT_STATUS_MAP;

export const PROJECT_CONTACT_RELATION_MAP = {
  PROJECT_MANAGER_GC: 'Project Manager (GC)',
  SITE_SUPERINTENDENT: 'Site Superintendent',
  OWNERS_REPRESENTATIVE: 'Owner’s Representative',
  ARCHITECT_ENGINEER_OF_RECORD: 'Architect / Engineer of Record',
  SAFETY_MANAGER: 'Safety Manager',
  EQUIPMENT_RENTAL_COORDINATOR: 'Equipment / Rental Coordinator',
} as const;

export type ProjectContactRelation = keyof typeof PROJECT_CONTACT_RELATION_MAP;

export type ProjectContact = {
  contact_id: string;
  relation_to_project: ProjectContactRelation;
};

export const SCOPE_OF_WORK_MAP = {
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
} as const;

export type ScopeOfWork = keyof typeof SCOPE_OF_WORK_MAP;

export type ProjectDoc = {
  _id: string;
  workspaceId: string;
  name: string;
  projectCode: string;
  description?: string;
  status?: ProjectStatus;
  scope_of_work?: ScopeOfWork[];
  project_contacts?: ProjectContact[];
  parent_project?: string;
  poRefTemplateId?: string; // PO reference number template ID for this project
  soRefTemplateId?: string; // SO reference number template ID for this project
  invoiceRefTemplateId?: string; // Invoice reference number template ID for this project
  createdBy: string;
  created_at: Date;
  updated_at: Date;
  updated_by: string;
  deleted: boolean;
};

export type ProjectsUpdateInput = Omit<ProjectDoc, '_id'>;

export class ProjectsModel {
  /**
   * Helper to create a project with a generated ID.
   * @param project ProjectDoc minus _id
   */
  static async createProjectWithId(
    model: ProjectsModel,
    project: Omit<ProjectDoc, '_id'>,
  ) {
    const projectWithId: ProjectDoc = {
      ...project,
      _id: generateId('PO', project.workspaceId),
    };
    return await model.createProject(projectWithId);
  }
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'projects';
  private db: Db;
  private collection: Collection<ProjectDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<ProjectDoc>(this.collectionName);
  }

  async updateProject(id: string, project: ProjectsUpdateInput) {
    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      { $set: { ...project, _id: id } },
    );
    return result;
  }

  /**
   * Patch top-level fields of a project document.
   * Only updates the fields provided in the patch object.
   * Does not allow updating _id.
   */
  async patchProject(
    id: string,
    patch: Partial<Omit<ProjectsUpdateInput, 'createdBy' | 'created_at'>>,
  ): Promise<void> {
    // Remove forbidden fields if present
    const { _id, createdBy, created_at, ...allowedPatch } = patch as any;
    await this.collection.findOneAndUpdate(
      { _id: id },
      { $set: allowedPatch },
      { returnDocument: 'after' },
    );
  }

  async createProject(project: ProjectDoc) {
    await this.collection.insertOne(project);
    return project;
  }

  async getProjectById(id: string) {
    return await this.collection.findOne({ _id: id });
  }

  async getProjectsByWorkspaceId(workspaceId: string) {
    return await this.collection.find({ workspaceId }).toArray();
  }

  async getProjectsByIds(ids: string[]): Promise<ProjectDoc[]> {
    if (!ids.length) return [];
    const docs = await this.collection.find({ _id: { $in: ids } }).toArray();
    return docs;
  }

  /**
   * Find all projects with the given parent_project id.
   */
  async getProjectsByParentProjectId(
    parentProjectId: string,
  ): Promise<ProjectDoc[]> {
    return await this.collection
      .find({ parent_project: parentProjectId })
      .toArray();
  }

  /**
   * Count all descendants (subprojects at all nesting levels) for a given project.
   * Uses $graphLookup for efficient recursive traversal.
   * Excludes soft-deleted projects (deleted: true) from the count.
   */
  async countAllDescendants(projectId: string): Promise<number> {
    const result = await this.collection
      .aggregate([
        { $match: { _id: projectId } },
        {
          $graphLookup: {
            from: this.collectionName,
            startWith: '$_id',
            connectFromField: '_id',
            connectToField: 'parent_project',
            as: 'descendants',
            maxDepth: 100, // Prevent infinite loops, adjust as needed
            restrictSearchWithMatch: { deleted: false }, // Exclude soft-deleted projects
          },
        },
        {
          $project: {
            descendantCount: { $size: '$descendants' },
          },
        },
      ])
      .toArray();

    return result.length > 0 ? result[0].descendantCount : 0;
  }
}

export const createProjectsModel = (config: { mongoClient: MongoClient }) => {
  const projectsModel = new ProjectsModel(config);
  return projectsModel;
};
