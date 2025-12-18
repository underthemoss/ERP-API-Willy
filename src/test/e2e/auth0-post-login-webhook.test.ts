import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';
import { WorkspaceAccessType, WorkspaceUserRole } from './generated/graphql';
import { v4 } from 'uuid';

const { getApiUrl, createClient } = createTestEnvironment();

// GraphQL mutations for workspace and user management
gql`
  mutation CreateWorkspaceForAuth0Test(
    $name: String!
    $accessType: WorkspaceAccessType!
  ) {
    createWorkspace(name: $name, accessType: $accessType) {
      id
      name
    }
  }
`;

gql`
  mutation InviteUserToWorkspaceForAuth0Test(
    $workspaceId: String!
    $email: String!
    $roles: [WorkspaceUserRole!]!
  ) {
    inviteUserToWorkspace(
      workspaceId: $workspaceId
      email: $email
      roles: $roles
    ) {
      userId
      roles
    }
  }
`;

describe('Auth0 Post-Login Webhook', () => {
  it('User can not login if they have never been invited', async () => {
    const url = getApiUrl();

    const response = await fetch(`${url}/webhooks/auth0/post-login/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: v4(),
        email: `${v4()}@example.com`,
        timestamp: new Date().toISOString(),
        event_type: 'post-login',
      }),
    });

    // In test mode, HMAC validation is skipped, so we should get a successful response
    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.code).toBe('USER_NOT_INVITED');
  });

  it('Invited user can be matched by email and successfully authenticate through webhook', async () => {
    const url = getApiUrl();
    const { sdk } = await createClient();

    // Step 1: Create a workspace
    const workspaceResponse = await sdk.CreateWorkspaceForAuth0Test({
      name: 'Test Workspace for Auth0',
      accessType: WorkspaceAccessType.InviteOnly,
    });

    expect(workspaceResponse.createWorkspace).toBeDefined();
    const workspaceId = workspaceResponse.createWorkspace!.id;

    // Step 2: Invite a user with a specific email
    const invitedEmail = 'invited.user@testcompany.com';
    const inviteResponse = await sdk.InviteUserToWorkspaceForAuth0Test({
      workspaceId,
      email: invitedEmail,
      roles: [WorkspaceUserRole.AllResourcesReader],
    });

    expect(inviteResponse.inviteUserToWorkspace).toBeDefined();
    expect(inviteResponse.inviteUserToWorkspace!.userId).toBeDefined();

    // Step 3: Call the Auth0 webhook for the invited user
    const webhookResponse = await fetch(`${url}/webhooks/auth0/post-login/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: 'auth0|invited_user_123', // Different Auth0 ID
        email: invitedEmail, // Same email as invited
        given_name: 'Invited',
        family_name: 'User',
        timestamp: new Date().toISOString(),
        event_type: 'post-login',
        email_verified: true,
      }),
    });

    // Step 4: Verify successful authentication
    const webhookData = await webhookResponse.json();
    expect(webhookResponse.status).toBe(200);
    expect(webhookData.success).toBe(true);
    expect(webhookData.message).toBe(
      'Post-login webhook processed successfully',
    );
    expect(webhookData.data).toBeDefined();
    expect(webhookData.data.processed).toBe(true);
    // The webhook should have matched the user by email and updated their auth0_user_id
    expect(webhookData.data.uid).toBe(
      inviteResponse.inviteUserToWorkspace!.userId,
    );
  });

  it('Existing user with auth0_user_id is matched by auth0_user_id on subsequent logins', async () => {
    const url = getApiUrl();
    const { sdk } = await createClient();

    // Step 1: Create a workspace and invite a user
    const workspaceResponse = await sdk.CreateWorkspaceForAuth0Test({
      name: 'Test Workspace for Auth0 ID Matching',
      accessType: WorkspaceAccessType.InviteOnly,
    });

    expect(workspaceResponse.createWorkspace).toBeDefined();
    const workspaceId = workspaceResponse.createWorkspace!.id;

    const invitedEmail = 'auth0.id.test@company.com';
    const inviteResponse = await sdk.InviteUserToWorkspaceForAuth0Test({
      workspaceId,
      email: invitedEmail,
      roles: [WorkspaceUserRole.AllResourcesReader],
    });

    expect(inviteResponse.inviteUserToWorkspace).toBeDefined();
    const userId = inviteResponse.inviteUserToWorkspace!.userId;

    // Step 2: First login - user gets auth0_user_id assigned
    const auth0UserId = 'auth0|unique_user_456';
    const firstLoginResponse = await fetch(
      `${url}/webhooks/auth0/post-login/v1`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: auth0UserId,
          email: invitedEmail,
          given_name: 'Test',
          family_name: 'User',
          timestamp: new Date().toISOString(),
          event_type: 'post-login',
          email_verified: true,
        }),
      },
    );

    const firstLoginData = await firstLoginResponse.json();
    expect(firstLoginResponse.status).toBe(200);
    expect(firstLoginData.data.uid).toBe(userId);

    // Step 3: Second login with DIFFERENT email but SAME auth0_user_id
    // This simulates user changing their email in Auth0
    const updatedEmail = 'new.email@company.com';
    const secondLoginResponse = await fetch(
      `${url}/webhooks/auth0/post-login/v1`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: auth0UserId, // Same Auth0 ID
          email: updatedEmail, // Different email
          given_name: 'Test',
          family_name: 'User',
          timestamp: new Date().toISOString(),
          event_type: 'post-login',
          email_verified: true,
        }),
      },
    );

    // Step 4: Verify user was matched by auth0_user_id, not email
    const secondLoginData = await secondLoginResponse.json();
    console.log(secondLoginData);
    expect(secondLoginResponse.status).toBe(200);
    expect(secondLoginData.success).toBe(true);
    // Should return the same user ID, proving it matched by auth0_user_id
    expect(secondLoginData.data.uid).toBe(userId);

    // The user was found by auth0_user_id even though the email was different
    // This proves the auth0_user_id matching takes precedence over email matching
  });

  it('User with bypass email can login without invitation when INVITE_ONLY_BYPASS_EMAILS is set', async () => {
    const url = getApiUrl();

    // The bypass email is configured in test-environment.ts as 'bypass.test@example.com'
    const bypassEmail = 'bypass.test@example.com';

    // Step 1: Call the Auth0 webhook for the bypass email user (without inviting them)
    const webhookResponse = await fetch(`${url}/webhooks/auth0/post-login/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: 'auth0|bypass_user_123',
        email: bypassEmail,
        given_name: 'Bypass',
        family_name: 'User',
        timestamp: new Date().toISOString(),
        event_type: 'post-login',
        email_verified: true,
      }),
    });

    // Step 2: Verify successful authentication despite not being invited
    const webhookData = await webhookResponse.json();
    expect(webhookResponse.status).toBe(200);
    expect(webhookData.success).toBe(true);
    expect(webhookData.message).toBe(
      'Post-login webhook processed successfully',
    );
    expect(webhookData.data).toBeDefined();
    expect(webhookData.data.processed).toBe(true);

    // Step 3: Try with a non-bypass email to confirm it still gets rejected
    const nonBypassResponse = await fetch(
      `${url}/webhooks/auth0/post-login/v1`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'auth0|non_bypass_user_456',
          email: 'non.bypass@testcompany.com',
          given_name: 'Non',
          family_name: 'Bypass',
          timestamp: new Date().toISOString(),
          event_type: 'post-login',
          email_verified: true,
        }),
      },
    );

    const nonBypassData = await nonBypassResponse.json();
    expect(nonBypassResponse.status).toBe(403);
    expect(nonBypassData.code).toBe('USER_NOT_INVITED');
  });
});
