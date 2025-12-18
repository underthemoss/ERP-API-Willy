# Intake Forms GraphQL API Documentation

This document provides the complete GraphQL API specification for the Intake Forms feature, extracted from the generated GraphQL schema.

## Table of Contents

- [Types](#types)
  - [IntakeForm](#intakeform)
  - [IntakeFormSubmission](#intakeformsubmission)
  - [Pagination Types](#pagination-types)
- [Input Types](#input-types)
  - [IntakeFormInput](#intakeforminput)
  - [IntakeFormSubmissionInput](#intakeformsubmissioninput)
- [Queries](#queries)
  - [getIntakeFormById](#getintakeformbyid)
  - [listIntakeForms](#listintakeforms)
  - [listIntakeFormSubmissions](#listintakeformsubmissions)
- [Mutations](#mutations)
  - [createIntakeForm](#createintakeform)
  - [createIntakeFormSubmission](#createintakeformsubmission)
- [Example Usage](#example-usage)

---

## Types

### IntakeForm

Represents an intake form that can be filled out by users.

```graphql
type IntakeForm {
  createdAt: DateTime!
  id: ID!
  isActive: Boolean!
  projectId: ID
  updatedAt: DateTime!
  workspaceId: ID!
}
```

**Field Descriptions:**

- `id`: Unique identifier for the intake form (format: `IN_FRM-{unique_id}`)
- `workspaceId`: The workspace this form belongs to
- `projectId`: Optional associated project ID
- `isActive`: Whether the form is currently active and accepting submissions
- `createdAt`: ISO 8601 datetime when the form was created
- `updatedAt`: ISO 8601 datetime when the form was last updated

### IntakeFormSubmission

Represents a submission to an intake form.

```graphql
type IntakeFormSubmission {
  companyName: String
  createdAt: DateTime!
  durationInDays: Int
  email: String!
  formId: ID!
  id: ID!
  name: String!
  phone: String
  quantity: Int
  requestBody: String
  startDate: DateTime!
  workspaceId: ID!
}
```

**Field Descriptions:**

- `id`: Unique identifier for the submission (format: `IN_FRM_SUB-{unique_id}`)
- `formId`: ID of the intake form this submission belongs to
- `workspaceId`: The workspace this submission belongs to
- `name`: Name of the person submitting the form (required)
- `email`: Email address of the submitter (required)
- `startDate`: Requested start date for the service/rental
- `phone`: Optional phone number
- `companyName`: Optional company name
- `requestBody`: Optional detailed request description
- `durationInDays`: Optional duration in days for rentals
- `quantity`: Optional quantity of items requested
- `createdAt`: ISO 8601 datetime when the submission was created

### Pagination Types

#### IntakeFormPage

```graphql
type IntakeFormPage {
  items: [IntakeForm!]!
  page: IntakeFormPageInfo!
}
```

#### IntakeFormPageInfo

```graphql
type IntakeFormPageInfo {
  number: Int!
  size: Int!
  totalItems: Int!
  totalPages: Int!
}
```

#### IntakeFormSubmissionPage

```graphql
type IntakeFormSubmissionPage {
  items: [IntakeFormSubmission!]!
  page: IntakeFormSubmissionPageInfo!
}
```

#### IntakeFormSubmissionPageInfo

```graphql
type IntakeFormSubmissionPageInfo {
  number: Int!
  size: Int!
  totalItems: Int!
  totalPages: Int!
}
```

---

## Input Types

### IntakeFormInput

Input type for creating an intake form.

```graphql
input IntakeFormInput {
  createdAt: DateTime!
  isActive: Boolean!
  projectId: ID
  updatedAt: DateTime!
  workspaceId: ID!
}
```

### IntakeFormSubmissionInput

Input type for creating an intake form submission.

```graphql
input IntakeFormSubmissionInput {
  companyName: String
  createdAt: DateTime!
  durationInDays: Int
  email: String!
  formId: ID!
  name: String!
  phone: String
  quantity: Int
  requestBody: String
  startDate: DateTime!
  workspaceId: ID!
}
```

---

## Queries

### getIntakeFormById

Get a single intake form by its ID.

```graphql
query getIntakeFormById(id: String!): IntakeForm
```

**Description:** Get a single intake form by ID

**Arguments:**

- `id` (String!, required): The intake form ID

**Returns:** `IntakeForm` or null if not found

**Example Query:**

```graphql
query GetIntakeFormById($id: String!) {
  getIntakeFormById(id: $id) {
    id
    workspaceId
    projectId
    isActive
    createdAt
    updatedAt
  }
}
```

**Variables Example:**

```json
{
  "id": "IN_FRM-ABC123"
}
```

### listIntakeForms

List all intake forms for a workspace with pagination.

```graphql
query listIntakeForms(workspaceId: String!): IntakeFormPage
```

**Description:** List all intake forms for a workspace

**Arguments:**

- `workspaceId` (String!, required): The workspace ID to filter forms

**Returns:** `IntakeFormPage` with paginated results

**Example Query:**

```graphql
query ListIntakeForms($workspaceId: String!) {
  listIntakeForms(workspaceId: $workspaceId) {
    items {
      id
      workspaceId
      projectId
      isActive
      createdAt
      updatedAt
    }
    page {
      number
      size
      totalItems
      totalPages
    }
  }
}
```

### listIntakeFormSubmissions

List all intake form submissions for a workspace with pagination.

```graphql
query listIntakeFormSubmissions(workspaceId: String!): IntakeFormSubmissionPage
```

**Description:** List all intake form submissions for a workspace

**Arguments:**

- `workspaceId` (String!, required): The workspace ID to filter submissions

**Returns:** `IntakeFormSubmissionPage` with paginated results

**Example Query:**

```graphql
query ListIntakeFormSubmissions($workspaceId: String!) {
  listIntakeFormSubmissions(workspaceId: $workspaceId) {
    items {
      id
      formId
      workspaceId
      name
      email
      createdAt
      startDate
      phone
      companyName
      requestBody
      durationInDays
      quantity
    }
    page {
      number
      size
      totalItems
      totalPages
    }
  }
}
```

---

## Mutations

### createIntakeForm

Create a new intake form.

```graphql
mutation createIntakeForm(input: IntakeFormInput!): IntakeForm
```

**Description:** Create a new intake form

**Arguments:**

- `input` (IntakeFormInput!, required): The intake form data

**Returns:** The created `IntakeForm`

**Example Mutation:**

```graphql
mutation CreateIntakeForm($input: IntakeFormInput!) {
  createIntakeForm(input: $input) {
    id
    workspaceId
    projectId
    isActive
    createdAt
    updatedAt
  }
}
```

**Variables Example:**

```json
{
  "input": {
    "workspaceId": "WS_123",
    "projectId": "PROJ_456",
    "isActive": true,
    "createdAt": "2024-01-09T10:00:00Z",
    "updatedAt": "2024-01-09T10:00:00Z"
  }
}
```

### createIntakeFormSubmission

Create a new intake form submission.

```graphql
mutation createIntakeFormSubmission(input: IntakeFormSubmissionInput!): IntakeFormSubmission
```

**Description:** Create a new intake form submission

**Arguments:**

- `input` (IntakeFormSubmissionInput!, required): The submission data

**Returns:** The created `IntakeFormSubmission`

**Example Mutation:**

```graphql
mutation CreateIntakeFormSubmission($input: IntakeFormSubmissionInput!) {
  createIntakeFormSubmission(input: $input) {
    id
    formId
    workspaceId
    name
    email
    createdAt
    startDate
    phone
    companyName
    requestBody
    durationInDays
    quantity
  }
}
```

**Variables Example:**

```json
{
  "input": {
    "formId": "IN_FRM-ABC123",
    "workspaceId": "WS_123",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "createdAt": "2024-01-09T10:00:00Z",
    "startDate": "2024-01-15T09:00:00Z",
    "phone": "+1234567890",
    "companyName": "Acme Construction",
    "requestBody": "Need equipment for construction project starting next week",
    "durationInDays": 30,
    "quantity": 5
  }
}
```

---

## Example Usage

### Complete Flow Example

1. **Create an Intake Form:**

```graphql
mutation {
  createIntakeForm(
    input: {
      workspaceId: "WS_123"
      isActive: true
      createdAt: "2024-01-09T10:00:00Z"
      updatedAt: "2024-01-09T10:00:00Z"
    }
  ) {
    id
    isActive
  }
}
```

2. **Submit a Form Response:**

```graphql
mutation {
  createIntakeFormSubmission(
    input: {
      formId: "IN_FRM-ABC123"
      workspaceId: "WS_123"
      name: "Jane Smith"
      email: "jane@example.com"
      startDate: "2024-01-20T09:00:00Z"
      createdAt: "2024-01-09T11:00:00Z"
      companyName: "Smith Construction"
      requestBody: "Need 3 excavators for 2 weeks"
      durationInDays: 14
      quantity: 3
    }
  ) {
    id
    name
    email
  }
}
```

3. **List All Submissions:**

```graphql
query {
  listIntakeFormSubmissions(workspaceId: "WS_123") {
    items {
      id
      name
      email
      companyName
      startDate
      durationInDays
      quantity
    }
    page {
      totalItems
      totalPages
    }
  }
}
```

---

## Authentication

All endpoints require authentication. The user must be authenticated with a valid JWT token that includes:

- `es_user_id`: User identifier
- `es_company_id`: Company identifier

The authentication token should be included in the request headers:

```
Authorization: Bearer <JWT_TOKEN>
```

---

## Error Handling

The API will return standard GraphQL errors for:

- Missing required fields
- Invalid input data
- Authentication failures
- Authorization failures

Example error response:

```json
{
  "errors": [
    {
      "message": "Authentication required",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

---

## Notes for Frontend Integration

1. **Date Handling**: All date fields use ISO 8601 format (DateTime scalar)
2. **ID Format**:
   - IntakeForm IDs: `IN_FRM-{unique_id}`
   - IntakeFormSubmission IDs: `IN_FRM_SUB-{unique_id}`
3. **Required Fields**: Pay attention to fields marked with `!` as they are required
4. **Pagination**: The API returns paginated results with metadata about total items and pages
5. **Workspace Scoping**: All operations are scoped to a workspace ID for multi-tenancy

---

## Support

For questions or issues with the Intake Forms API, please contact the backend team.
