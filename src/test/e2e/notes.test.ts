import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';

// GraphQL queries and mutations
gql`
  query GetNoteById($id: String!) {
    getNoteById(id: $id) {
      _id
      workspace_id
      parent_entity_id
      value
      created_by
      created_at
      updated_at
    }
  }
`;

gql`
  mutation CreateNote($input: NoteInput!) {
    createNote(input: $input) {
      _id
      workspace_id
      parent_entity_id
      value
      created_by
      created_at
      updated_at
    }
  }
`;

gql`
  query ListNotesByEntityId($parent_entity_id: String!) {
    listNotesByEntityId(parent_entity_id: $parent_entity_id) {
      _id
      workspace_id
      parent_entity_id
      value
      created_by
    }
  }
`;

gql`
  mutation UpdateNote($id: String!, $value: JSON!) {
    updateNote(id: $id, value: $value) {
      _id
      workspace_id
      value
      updated_at
    }
  }
`;

gql`
  mutation DeleteNote($id: String!) {
    deleteNote(id: $id) {
      _id
      deleted
    }
  }
`;

describe('Notes', () => {
  const { createClient } = createTestEnvironment();

  it('should get note by id with workspace authorization', async () => {
    const { sdk, user, utils } = await createClient();

    // Create a workspace
    const workspace = await utils.createWorkspace();

    // Create a project to attach notes to
    const project = await sdk.CreateProject({
      input: {
        workspaceId: workspace.id,
        name: 'Test Project for Get Note',
        project_code: 'NOTE-TEST-GET-001',
        description: 'Project for testing get note by id',
        deleted: false,
      },
    });

    // Create a note
    const noteValue = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'This is a test note' }],
        },
      ],
    };

    if (!project.createProject) {
      throw new Error('Failed to create project');
    }

    const { createNote } = await sdk.CreateNote({
      input: {
        workspace_id: workspace.id,
        parent_entity_id: project.createProject.id,
        value: noteValue,
      },
    });

    if (!createNote) {
      throw new Error('Failed to create note');
    }

    // Get the note by ID
    const { getNoteById } = await sdk.GetNoteById({
      id: createNote._id,
    });

    expect(getNoteById).toBeDefined();
    if (!getNoteById) {
      throw new Error('Failed to get note');
    }
    expect(getNoteById._id).toBe(createNote._id);
    expect(getNoteById.workspace_id).toBe(workspace.id);
    expect(getNoteById.parent_entity_id).toBe(project.createProject.id);
    expect(getNoteById.value).toEqual(noteValue);
    expect(getNoteById.created_by).toBe(user.id);
  });

  it('should return null when getting non-existent note by id', async () => {
    const { sdk } = await createClient();

    // Try to get a note that doesn't exist
    const { getNoteById } = await sdk.GetNoteById({
      id: 'NON_EXISTENT_ID',
    });

    expect(getNoteById).toBeNull();
  });

  it('should deny access to note when user does not have workspace access', async () => {
    const { sdk: sdk1, utils: utils1 } = await createClient();
    const { sdk: sdk2 } = await createClient();

    // User 1 creates a workspace and note
    const workspace = await utils1.createWorkspace();

    const project = await sdk1.CreateProject({
      input: {
        workspaceId: workspace.id,
        name: 'Test Project for Access Control',
        project_code: 'NOTE-TEST-GET-002',
        description: 'Project for testing access control',
        deleted: false,
      },
    });

    const noteValue = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Private note' }],
        },
      ],
    };

    if (!project.createProject) {
      throw new Error('Failed to create project');
    }

    const { createNote } = await sdk1.CreateNote({
      input: {
        workspace_id: workspace.id,
        parent_entity_id: project.createProject.id,
        value: noteValue,
      },
    });

    if (!createNote) {
      throw new Error('Failed to create note');
    }

    // User 2 tries to get the note (should return null)
    const { getNoteById } = await sdk2.GetNoteById({
      id: createNote._id,
    });
    expect(getNoteById).toBeNull();
  });

  it('should create a note with workspace_id', async () => {
    const { sdk, user, utils } = await createClient();

    // Create a workspace
    const workspace = await utils.createWorkspace();

    // Create a project to attach notes to
    const project = await sdk.CreateProject({
      input: {
        workspaceId: workspace.id,
        name: 'Test Project for Notes',
        project_code: 'NOTE-TEST-001',
        description: 'Project for testing notes',
        deleted: false,
      },
    });

    // Create a note
    const noteValue = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'This is a test note' }],
        },
      ],
    };

    if (!project.createProject) {
      throw new Error('Failed to create project');
    }

    const { createNote } = await sdk.CreateNote({
      input: {
        workspace_id: workspace.id,
        parent_entity_id: project.createProject.id,
        value: noteValue,
      },
    });

    expect(createNote).toBeDefined();
    if (!createNote) {
      throw new Error('Failed to create note');
    }
    expect(createNote._id).toBeDefined();
    expect(createNote.workspace_id).toBe(workspace.id);
    expect(createNote.parent_entity_id).toBe(project.createProject.id);
    expect(createNote.value).toEqual(noteValue);
    expect(createNote.created_by).toBe(user.id);
  });

  it('should list notes by parent entity id', async () => {
    const { sdk, utils } = await createClient();

    // Create a workspace
    const workspace = await utils.createWorkspace();

    // Create a project
    const project = await sdk.CreateProject({
      input: {
        workspaceId: workspace.id,
        name: 'Test Project for Note List',
        project_code: 'NOTE-TEST-002',
        description: 'Project for testing note listing',
        deleted: false,
      },
    });

    // Create multiple notes
    const noteValue1 = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'First note' }],
        },
      ],
    };

    const noteValue2 = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Second note' }],
        },
      ],
    };

    if (!project.createProject) {
      throw new Error('Failed to create project');
    }

    await sdk.CreateNote({
      input: {
        workspace_id: workspace.id,
        parent_entity_id: project.createProject.id,
        value: noteValue1,
      },
    });

    await sdk.CreateNote({
      input: {
        workspace_id: workspace.id,
        parent_entity_id: project.createProject.id,
        value: noteValue2,
      },
    });

    // List notes
    const { listNotesByEntityId } = await sdk.ListNotesByEntityId({
      parent_entity_id: project.createProject.id,
    });

    expect(listNotesByEntityId).toHaveLength(2);
    expect(listNotesByEntityId[0].workspace_id).toBe(workspace.id);
    expect(listNotesByEntityId[1].workspace_id).toBe(workspace.id);
  });

  it('should update a note', async () => {
    const { sdk, utils } = await createClient();

    // Create a workspace
    const workspace = await utils.createWorkspace();

    // Create a project
    const project = await sdk.CreateProject({
      input: {
        workspaceId: workspace.id,
        name: 'Test Project for Note Update',
        project_code: 'NOTE-TEST-003',
        description: 'Project for testing note updates',
        deleted: false,
      },
    });

    // Create a note
    const originalValue = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Original text' }],
        },
      ],
    };

    if (!project.createProject) {
      throw new Error('Failed to create project');
    }

    const { createNote } = await sdk.CreateNote({
      input: {
        workspace_id: workspace.id,
        parent_entity_id: project.createProject.id,
        value: originalValue,
      },
    });

    if (!createNote) {
      throw new Error('Failed to create note');
    }

    // Update the note
    const updatedValue = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Updated text' }],
        },
      ],
    };

    const { updateNote } = await sdk.UpdateNote({
      id: createNote._id,
      value: updatedValue,
    });

    expect(updateNote).toBeDefined();
    if (!updateNote) {
      throw new Error('Failed to update note');
    }
    expect(updateNote._id).toBe(createNote._id);
    expect(updateNote.workspace_id).toBe(workspace.id);
    expect(updateNote.value).toEqual(updatedValue);
  });

  it('should delete a note', async () => {
    const { sdk, utils } = await createClient();

    // Create a workspace
    const workspace = await utils.createWorkspace();

    // Create a project
    const project = await sdk.CreateProject({
      input: {
        workspaceId: workspace.id,
        name: 'Test Project for Note Delete',
        project_code: 'NOTE-TEST-004',
        description: 'Project for testing note deletion',
        deleted: false,
      },
    });

    // Create a note
    const noteValue = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'To be deleted' }],
        },
      ],
    };

    if (!project.createProject) {
      throw new Error('Failed to create project');
    }

    const { createNote } = await sdk.CreateNote({
      input: {
        workspace_id: workspace.id,
        parent_entity_id: project.createProject.id,
        value: noteValue,
      },
    });

    if (!createNote) {
      throw new Error('Failed to create note');
    }

    // Delete the note
    const { deleteNote } = await sdk.DeleteNote({
      id: createNote._id,
    });

    expect(deleteNote).toBeDefined();
    if (!deleteNote) {
      throw new Error('Failed to delete note');
    }
    expect(deleteNote._id).toBe(createNote._id);
    expect(deleteNote.deleted).toBe(true);

    // Verify it's not in the list anymore
    const { listNotesByEntityId } = await sdk.ListNotesByEntityId({
      parent_entity_id: project.createProject.id,
    });

    expect(listNotesByEntityId).toHaveLength(0);
  });
});
