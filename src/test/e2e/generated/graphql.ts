import { FieldPolicy, FieldReadFunction, TypePolicies, TypePolicy } from '@apollo/client/cache';
import { GraphQLClient } from 'graphql-request';
import * as Dom from 'graphql-request/dist/types.dom';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** The `BigInt` scalar type represents non-fractional signed whole numeric values. */
  BigInt: { input: any; output: any; }
  /** A date string, such as 2007-12-03, compliant with the `full-date` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: { input: any; output: any; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: { input: any; output: any; }
};

export type AcceptQuoteInput = {
  /** If the seller accepts on behalf of the buyer, provide confirmation details here. */
  approvalConfirmation?: InputMaybe<Scalars['String']['input']>;
  /** Buyer's full legal name as provided in the agreement for compliance purposes */
  buyerAcceptedFullLegalName?: InputMaybe<Scalars['String']['input']>;
  quoteId: Scalars['String']['input'];
  /** Base64 encoded signature image (PNG or JPEG, optional) */
  signature?: InputMaybe<Scalars['String']['input']>;
};

export type AcceptQuoteResult = {
  __typename?: 'AcceptQuoteResult';
  purchaseOrder?: Maybe<PurchaseOrder>;
  quote: Quote;
  salesOrder: SalesOrder;
};

export type AddInvoiceChargesInput = {
  chargeIds: Array<Scalars['ID']['input']>;
  invoiceId: Scalars['ID']['input'];
};

export type AddTaxLineItemInput = {
  description: Scalars['String']['input'];
  invoiceId: Scalars['ID']['input'];
  order?: InputMaybe<Scalars['Int']['input']>;
  type: TaxType;
  value: Scalars['Float']['input'];
};

export type AdminMutationNamespace = {
  __typename?: 'AdminMutationNamespace';
  /** Assign roles to a user (Admin only) */
  assignRolesToUser?: Maybe<Scalars['Boolean']['output']>;
  /** Touch all documents in a collection by adding/updating a _touch timestamp field. */
  collectionSnapshot: CollectionSnapshotResult;
  /** Delete a specific SpiceDB relationship */
  deleteRelationship: DeleteRelationshipResult;
  /** Remove roles from a user (Admin only) */
  removeRolesFromUser?: Maybe<Scalars['Boolean']['output']>;
  /** Send an email using the professional HTML template (Admin only) */
  sendTemplatedEmail: SendTemplatedEmailResult;
  /** Send a test email to verify email configuration (Admin only) */
  sendTestEmail: SendTestEmailResult;
  /** Create or update a SpiceDB relationship */
  writeRelationship: WriteRelationshipResult;
};


export type AdminMutationNamespaceAssignRolesToUserArgs = {
  roleIds: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


export type AdminMutationNamespaceCollectionSnapshotArgs = {
  collectionName: Scalars['String']['input'];
};


export type AdminMutationNamespaceDeleteRelationshipArgs = {
  relation: Scalars['String']['input'];
  resourceId: Scalars['String']['input'];
  resourceType: Scalars['String']['input'];
  subjectId: Scalars['String']['input'];
  subjectType: Scalars['String']['input'];
};


export type AdminMutationNamespaceRemoveRolesFromUserArgs = {
  roleIds: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


export type AdminMutationNamespaceSendTemplatedEmailArgs = {
  bannerImgUrl?: InputMaybe<Scalars['String']['input']>;
  content: Scalars['String']['input'];
  iconUrl?: InputMaybe<Scalars['String']['input']>;
  primaryCtaText?: InputMaybe<Scalars['String']['input']>;
  primaryCtaUrl?: InputMaybe<Scalars['String']['input']>;
  replyTo?: InputMaybe<Scalars['String']['input']>;
  secondaryCtaText?: InputMaybe<Scalars['String']['input']>;
  secondaryCtaUrl?: InputMaybe<Scalars['String']['input']>;
  subject: Scalars['String']['input'];
  subtitle?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type AdminMutationNamespaceSendTestEmailArgs = {
  message?: InputMaybe<Scalars['String']['input']>;
  subject?: InputMaybe<Scalars['String']['input']>;
  to: Scalars['String']['input'];
};


export type AdminMutationNamespaceWriteRelationshipArgs = {
  relation: Scalars['String']['input'];
  resourceId: Scalars['String']['input'];
  resourceType: Scalars['String']['input'];
  subjectId: Scalars['String']['input'];
  subjectRelation?: InputMaybe<Scalars['String']['input']>;
  subjectType: Scalars['String']['input'];
};

export type AdminQueryNamespace = {
  __typename?: 'AdminQueryNamespace';
  /** Get a single Auth0 user by ID (Admin only) */
  getUserById?: Maybe<Auth0User>;
  /** Get roles assigned to a user (Admin only) */
  getUserRoles?: Maybe<Array<Maybe<Auth0Role>>>;
  /** List available relations and permissions for a resource type */
  listAvailableRelations: Array<AvailableRelation>;
  /** List SpiceDB relationships with optional filters */
  listRelationships: ListRelationshipsResult;
  /** List all resource types defined in the SpiceDB schema */
  listResourceTypes: Array<Scalars['String']['output']>;
  /** List all available Auth0 roles (Admin only) */
  listRoles?: Maybe<Array<Maybe<Auth0Role>>>;
  /** Preview the HTML output of an email template without sending it */
  previewEmailTemplate: EmailTemplatePreviewResult;
  /** Returns the raw SpiceDB Zed schema from SpiceDB */
  rawZedSchema: Scalars['String']['output'];
  /** Search for users in Auth0 (Admin only) */
  searchUsers?: Maybe<Auth0UsersSearchResult>;
  /** Get recent SendGrid email activity (Admin only) */
  sendGridEmailActivity: Array<EmailActivity>;
  /** Get email details including content by SendGrid message ID (Admin only) */
  sendGridEmailDetails?: Maybe<EmailDetails>;
};


export type AdminQueryNamespaceGetUserByIdArgs = {
  userId: Scalars['String']['input'];
};


export type AdminQueryNamespaceGetUserRolesArgs = {
  userId: Scalars['String']['input'];
};


export type AdminQueryNamespaceListAvailableRelationsArgs = {
  resourceType?: InputMaybe<Scalars['String']['input']>;
};


export type AdminQueryNamespaceListRelationshipsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  relation?: InputMaybe<Scalars['String']['input']>;
  resourceId?: InputMaybe<Scalars['String']['input']>;
  resourceType?: InputMaybe<Scalars['String']['input']>;
  subjectId?: InputMaybe<Scalars['String']['input']>;
  subjectType?: InputMaybe<Scalars['String']['input']>;
};


export type AdminQueryNamespacePreviewEmailTemplateArgs = {
  bannerImgUrl?: InputMaybe<Scalars['String']['input']>;
  content: Scalars['String']['input'];
  iconUrl?: InputMaybe<Scalars['String']['input']>;
  primaryCtaText?: InputMaybe<Scalars['String']['input']>;
  primaryCtaUrl?: InputMaybe<Scalars['String']['input']>;
  secondaryCtaText?: InputMaybe<Scalars['String']['input']>;
  secondaryCtaUrl?: InputMaybe<Scalars['String']['input']>;
  subtitle?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};


export type AdminQueryNamespaceSearchUsersArgs = {
  fields?: InputMaybe<Scalars['String']['input']>;
  includeFields?: InputMaybe<Scalars['Boolean']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Scalars['String']['input']>;
};


export type AdminQueryNamespaceSendGridEmailActivityArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type AdminQueryNamespaceSendGridEmailDetailsArgs = {
  msgId: Scalars['String']['input'];
};

export type AdoptOrphanedSubmissionsResult = {
  __typename?: 'AdoptOrphanedSubmissionsResult';
  /** Number of submissions that were adopted */
  adoptedCount: Scalars['Int']['output'];
  /** List of adopted submission IDs */
  adoptedSubmissionIds: Array<Scalars['ID']['output']>;
  /** The submissions that were adopted (with full details) */
  adoptedSubmissions: Array<IntakeFormSubmission>;
};

export type Asset = {
  __typename?: 'Asset';
  category?: Maybe<AssetCategory>;
  class?: Maybe<AssetClass>;
  company?: Maybe<AssetCompany>;
  company_id?: Maybe<Scalars['String']['output']>;
  custom_name?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  details?: Maybe<AssetDetails>;
  groups?: Maybe<Array<Maybe<AssetGroup>>>;
  id?: Maybe<Scalars['String']['output']>;
  inventory_branch?: Maybe<AssetInventoryBranch>;
  keypad?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  msp_branch?: Maybe<AssetMspBranch>;
  name?: Maybe<Scalars['String']['output']>;
  photo?: Maybe<AssetPhoto>;
  photo_id?: Maybe<Scalars['String']['output']>;
  pim_category_id?: Maybe<Scalars['String']['output']>;
  pim_category_name?: Maybe<Scalars['String']['output']>;
  pim_category_path?: Maybe<Scalars['String']['output']>;
  pim_make?: Maybe<Scalars['String']['output']>;
  pim_make_id?: Maybe<Scalars['String']['output']>;
  pim_product_id?: Maybe<Scalars['String']['output']>;
  pim_product_model?: Maybe<Scalars['String']['output']>;
  pim_product_name?: Maybe<Scalars['String']['output']>;
  pim_product_platform_id?: Maybe<Scalars['String']['output']>;
  pim_product_variant?: Maybe<Scalars['String']['output']>;
  pim_product_year?: Maybe<Scalars['String']['output']>;
  rsp_branch?: Maybe<AssetRspBranch>;
  tracker?: Maybe<AssetTracker>;
  tsp_companies?: Maybe<Array<Maybe<AssetTspCompany>>>;
  type?: Maybe<AssetType>;
};

export type AssetCategory = {
  __typename?: 'AssetCategory';
  category_id?: Maybe<Scalars['String']['output']>;
  composite?: Maybe<Scalars['String']['output']>;
  level_1?: Maybe<Scalars['String']['output']>;
  level_2?: Maybe<Scalars['String']['output']>;
  level_3?: Maybe<Scalars['String']['output']>;
};

export type AssetClass = {
  __typename?: 'AssetClass';
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type AssetCompany = {
  __typename?: 'AssetCompany';
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type AssetDetails = {
  __typename?: 'AssetDetails';
  asset_id?: Maybe<Scalars['String']['output']>;
  camera_id?: Maybe<Scalars['String']['output']>;
  custom_name?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  driver_name?: Maybe<Scalars['String']['output']>;
  model?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  photo_id?: Maybe<Scalars['String']['output']>;
  serial_number?: Maybe<Scalars['String']['output']>;
  tracker_id?: Maybe<Scalars['String']['output']>;
  vin?: Maybe<Scalars['String']['output']>;
  year?: Maybe<Scalars['String']['output']>;
};

export type AssetGroup = {
  __typename?: 'AssetGroup';
  company_id?: Maybe<Scalars['String']['output']>;
  company_name?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type AssetInventoryBranch = {
  __typename?: 'AssetInventoryBranch';
  company_id?: Maybe<Scalars['String']['output']>;
  company_name?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type AssetMspBranch = {
  __typename?: 'AssetMspBranch';
  company_id?: Maybe<Scalars['String']['output']>;
  company_name?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type AssetPhoto = {
  __typename?: 'AssetPhoto';
  filename?: Maybe<Scalars['String']['output']>;
  photo_id?: Maybe<Scalars['String']['output']>;
};

export type AssetRspBranch = {
  __typename?: 'AssetRspBranch';
  company_id?: Maybe<Scalars['String']['output']>;
  company_name?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type AssetSchedule = {
  __typename?: 'AssetSchedule';
  asset_id: Scalars['String']['output'];
  company_id: Scalars['String']['output'];
  created_at: Scalars['String']['output'];
  created_by: Scalars['String']['output'];
  end_date: Scalars['String']['output'];
  id: Scalars['String']['output'];
  project_id: Scalars['String']['output'];
  start_date: Scalars['String']['output'];
  updated_at: Scalars['String']['output'];
  updated_by: Scalars['String']['output'];
};

export type AssetScheduleInput = {
  asset_id: Scalars['String']['input'];
  end_date: Scalars['String']['input'];
  project_id: Scalars['String']['input'];
  start_date: Scalars['String']['input'];
};

export type AssetScheduleListResult = {
  __typename?: 'AssetScheduleListResult';
  items: Array<AssetSchedule>;
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type AssetTracker = {
  __typename?: 'AssetTracker';
  company_id?: Maybe<Scalars['String']['output']>;
  created?: Maybe<Scalars['String']['output']>;
  device_serial?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  tracker_type_id?: Maybe<Scalars['String']['output']>;
  updated?: Maybe<Scalars['String']['output']>;
  vendor_id?: Maybe<Scalars['String']['output']>;
};

export type AssetTspCompany = {
  __typename?: 'AssetTspCompany';
  company_id?: Maybe<Scalars['String']['output']>;
  company_name?: Maybe<Scalars['String']['output']>;
};

export type AssetType = {
  __typename?: 'AssetType';
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type Auth0Identity = {
  __typename?: 'Auth0Identity';
  accessToken?: Maybe<Scalars['String']['output']>;
  connection: Scalars['String']['output'];
  isSocial: Scalars['Boolean']['output'];
  provider: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

export type Auth0Role = {
  __typename?: 'Auth0Role';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type Auth0User = {
  __typename?: 'Auth0User';
  appMetadata?: Maybe<Scalars['JSON']['output']>;
  blocked?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  emailVerified?: Maybe<Scalars['Boolean']['output']>;
  familyName?: Maybe<Scalars['String']['output']>;
  givenName?: Maybe<Scalars['String']['output']>;
  identities?: Maybe<Array<Maybe<Auth0Identity>>>;
  lastIp?: Maybe<Scalars['String']['output']>;
  lastLogin?: Maybe<Scalars['String']['output']>;
  loginsCount?: Maybe<Scalars['Int']['output']>;
  multifactor?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  name?: Maybe<Scalars['String']['output']>;
  nickname?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  phoneVerified?: Maybe<Scalars['Boolean']['output']>;
  picture?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  userId: Scalars['String']['output'];
  userMetadata?: Maybe<Scalars['JSON']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

export type Auth0UsersSearchResult = {
  __typename?: 'Auth0UsersSearchResult';
  length: Scalars['Int']['output'];
  limit: Scalars['Int']['output'];
  start: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
  users: Array<Auth0User>;
};

export type AvailableRelation = {
  __typename?: 'AvailableRelation';
  allowedResourceTypes: Array<Scalars['String']['output']>;
  allowedSubjectTypes: Array<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  isComputed: Scalars['Boolean']['output'];
  relation: Scalars['String']['output'];
};

export type BaseTransaction = {
  comments?: Maybe<Array<Comment>>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdBy?: Maybe<Scalars['ID']['output']>;
  history?: Maybe<Array<Maybe<TransactionLogEntry>>>;
  id: Scalars['ID']['output'];
  lastUpdatedBy?: Maybe<Scalars['ID']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  projectId?: Maybe<Scalars['ID']['output']>;
  statusId?: Maybe<Scalars['ID']['output']>;
  type?: Maybe<TransactionType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  workflowId?: Maybe<Scalars['ID']['output']>;
  workspaceId?: Maybe<Scalars['ID']['output']>;
};

export type Brand = {
  __typename?: 'Brand';
  colors?: Maybe<Array<Maybe<BrandColor>>>;
  createdAt: Scalars['String']['output'];
  createdBy: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  domain?: Maybe<Scalars['String']['output']>;
  fonts?: Maybe<Array<Maybe<BrandFont>>>;
  id: Scalars['String']['output'];
  images?: Maybe<Array<Maybe<BrandImage>>>;
  links?: Maybe<Array<Maybe<BrandLink>>>;
  logos?: Maybe<Array<Maybe<BrandLogo>>>;
  longDescription?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
  updatedBy: Scalars['String']['output'];
};

export type BrandColor = {
  __typename?: 'BrandColor';
  brightness?: Maybe<Scalars['Int']['output']>;
  hex: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type BrandFont = {
  __typename?: 'BrandFont';
  name: Scalars['String']['output'];
  origin?: Maybe<Scalars['String']['output']>;
  originId?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
  weights?: Maybe<Array<Maybe<Scalars['Int']['output']>>>;
};

export type BrandImage = {
  __typename?: 'BrandImage';
  formats?: Maybe<Array<Maybe<BrandImageFormat>>>;
  type?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

export type BrandImageFormat = {
  __typename?: 'BrandImageFormat';
  background?: Maybe<Scalars['String']['output']>;
  format?: Maybe<Scalars['String']['output']>;
  height?: Maybe<Scalars['Int']['output']>;
  size?: Maybe<Scalars['Int']['output']>;
  src: Scalars['String']['output'];
  width?: Maybe<Scalars['Int']['output']>;
};

export type BrandLink = {
  __typename?: 'BrandLink';
  name: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type BrandLogo = {
  __typename?: 'BrandLogo';
  formats?: Maybe<Array<Maybe<BrandImageFormat>>>;
  theme?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

export type BrandSearchResult = {
  __typename?: 'BrandSearchResult';
  brandId: Scalars['String']['output'];
  domain: Scalars['String']['output'];
  icon?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type BulkCalculateSubTotalInput = {
  durationInDays: Scalars['Int']['input'];
  priceId: Scalars['ID']['input'];
};

export type BulkMarkInventoryReceivedInput = {
  assetId?: InputMaybe<Scalars['String']['input']>;
  conditionNotes?: InputMaybe<Scalars['String']['input']>;
  conditionOnReceipt?: InputMaybe<InventoryCondition>;
  ids: Array<Scalars['String']['input']>;
  pimProductId?: InputMaybe<Scalars['String']['input']>;
  receiptNotes?: InputMaybe<Scalars['String']['input']>;
  receivedAt?: InputMaybe<Scalars['DateTime']['input']>;
  resourceMapId?: InputMaybe<Scalars['String']['input']>;
  resourceMapIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type BulkMarkInventoryReceivedResult = {
  __typename?: 'BulkMarkInventoryReceivedResult';
  items: Array<Inventory>;
  totalProcessed: Scalars['Int']['output'];
};

export type BusinessContact = {
  __typename?: 'BusinessContact';
  accountsPayableContactId?: Maybe<Scalars['String']['output']>;
  address?: Maybe<Scalars['String']['output']>;
  /** All price books associated with this business contact */
  associatedPriceBooks?: Maybe<ListPriceBooksResult>;
  brand?: Maybe<Brand>;
  brandId?: Maybe<Scalars['String']['output']>;
  contactType: ContactType;
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  employees?: Maybe<ListPersonContactsResult>;
  id: Scalars['ID']['output'];
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  placeId?: Maybe<Scalars['String']['output']>;
  profilePicture?: Maybe<Scalars['String']['output']>;
  resourceMapIds?: Maybe<Array<Scalars['String']['output']>>;
  resource_map_entries: Array<ResourceMapResource>;
  taxId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  website?: Maybe<Scalars['String']['output']>;
  workspaceId: Scalars['String']['output'];
};

export type BusinessContactInput = {
  accountsPayableContactId?: InputMaybe<Scalars['ID']['input']>;
  address?: InputMaybe<Scalars['String']['input']>;
  brandId?: InputMaybe<Scalars['ID']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  placeId?: InputMaybe<Scalars['String']['input']>;
  profilePicture?: InputMaybe<Scalars['String']['input']>;
  resourceMapIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  taxId?: InputMaybe<Scalars['String']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
  workspaceId: Scalars['String']['input'];
};

export type CancelInvoiceInput = {
  invoiceId: Scalars['String']['input'];
};

export type Charge = {
  __typename?: 'Charge';
  amountInCents: Scalars['Int']['output'];
  billingPeriodEnd?: Maybe<Scalars['DateTime']['output']>;
  billingPeriodStart?: Maybe<Scalars['DateTime']['output']>;
  chargeType: ChargeType;
  /** @deprecated No longer used */
  companyId?: Maybe<Scalars['ID']['output']>;
  contact?: Maybe<Contact>;
  contactId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  fulfilment?: Maybe<Fulfilment>;
  fulfilmentId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  invoice?: Maybe<Invoice>;
  invoiceId?: Maybe<Scalars['ID']['output']>;
  project?: Maybe<Project>;
  projectId?: Maybe<Scalars['ID']['output']>;
  purchaseOrderNumber?: Maybe<Scalars['String']['output']>;
  salesOrder?: Maybe<SalesOrder>;
  salesOrderId?: Maybe<Scalars['ID']['output']>;
  salesOrderLineItem?: Maybe<SalesOrderLineItem>;
  salesOrderLineItemId?: Maybe<Scalars['ID']['output']>;
  workspaceId: Scalars['ID']['output'];
};

export type ChargePage = {
  __typename?: 'ChargePage';
  items: Array<Charge>;
  page: PaginationInfo;
};

export enum ChargeType {
  Rental = 'RENTAL',
  Sale = 'SALE',
  Service = 'SERVICE'
}

export type CollectionSnapshotResult = {
  __typename?: 'CollectionSnapshotResult';
  collectionName: Scalars['String']['output'];
  documentsUpdated: Scalars['Int']['output'];
  error?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
  timestamp?: Maybe<Scalars['String']['output']>;
};

export type Comment = {
  __typename?: 'Comment';
  id?: Maybe<Scalars['ID']['output']>;
};

export type Company = {
  __typename?: 'Company';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type Contact = BusinessContact | PersonContact;

export enum ContactType {
  Business = 'BUSINESS',
  Person = 'PERSON'
}

export type CreateChargeInput = {
  amountInCents: Scalars['Int']['input'];
  chargeType: ChargeType;
  contactId: Scalars['ID']['input'];
  description: Scalars['String']['input'];
  fulfilmentId?: InputMaybe<Scalars['ID']['input']>;
  invoiceId?: InputMaybe<Scalars['ID']['input']>;
  projectId?: InputMaybe<Scalars['ID']['input']>;
  purchaseOrderNumber?: InputMaybe<Scalars['ID']['input']>;
  salesOrderId?: InputMaybe<Scalars['ID']['input']>;
  salesOrderLineItemId?: InputMaybe<Scalars['ID']['input']>;
  workspaceId: Scalars['ID']['input'];
};

export type CreateFulfilmentReservationInput = {
  endDate: Scalars['DateTime']['input'];
  fulfilmentId: Scalars['ID']['input'];
  inventoryId: Scalars['ID']['input'];
  salesOrderType: FulfilmentType;
  startDate: Scalars['DateTime']['input'];
};

export type CreateInventoryInput = {
  actualReturnDate?: InputMaybe<Scalars['DateTime']['input']>;
  assetId?: InputMaybe<Scalars['String']['input']>;
  expectedReturnDate?: InputMaybe<Scalars['DateTime']['input']>;
  fulfilmentId?: InputMaybe<Scalars['String']['input']>;
  isThirdPartyRental: Scalars['Boolean']['input'];
  pimCategoryId?: InputMaybe<Scalars['String']['input']>;
  pimCategoryName?: InputMaybe<Scalars['String']['input']>;
  pimCategoryPath?: InputMaybe<Scalars['String']['input']>;
  pimProductId?: InputMaybe<Scalars['String']['input']>;
  purchaseOrderId?: InputMaybe<Scalars['String']['input']>;
  purchaseOrderLineItemId?: InputMaybe<Scalars['String']['input']>;
  resourceMapId?: InputMaybe<Scalars['String']['input']>;
  resourceMapIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  status: InventoryStatus;
  workspaceId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateInvoiceInput = {
  buyerId: Scalars['String']['input'];
  sellerId: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};

export type CreatePdfResult = {
  __typename?: 'CreatePdfResult';
  error_message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type CreatePriceBookInput = {
  businessContactId?: InputMaybe<Scalars['ID']['input']>;
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  parentPriceBookId?: InputMaybe<Scalars['ID']['input']>;
  /** Percentage factor for the parent price book */
  parentPriceBookPercentageFactor?: InputMaybe<Scalars['Float']['input']>;
  projectId?: InputMaybe<Scalars['ID']['input']>;
  workspaceId: Scalars['ID']['input'];
};

export type CreateQuoteFromIntakeFormSubmissionInput = {
  intakeFormSubmissionId: Scalars['ID']['input'];
  sellersBuyerContactId: Scalars['ID']['input'];
  sellersProjectId: Scalars['ID']['input'];
  validUntil?: InputMaybe<Scalars['DateTime']['input']>;
};

export type CreateQuoteInput = {
  buyerWorkspaceId?: InputMaybe<Scalars['String']['input']>;
  buyersProjectId?: InputMaybe<Scalars['String']['input']>;
  buyersSellerContactId?: InputMaybe<Scalars['String']['input']>;
  rfqId?: InputMaybe<Scalars['String']['input']>;
  sellerWorkspaceId: Scalars['String']['input'];
  sellersBuyerContactId: Scalars['String']['input'];
  sellersProjectId: Scalars['String']['input'];
  status?: InputMaybe<QuoteStatus>;
  validUntil?: InputMaybe<Scalars['DateTime']['input']>;
};

export type CreateQuoteRevisionInput = {
  lineItems: Array<QuoteRevisionLineItemInput>;
  quoteId: Scalars['String']['input'];
  revisionNumber: Scalars['Int']['input'];
  validUntil?: InputMaybe<Scalars['DateTime']['input']>;
};

export type CreateRfqInput = {
  buyersWorkspaceId: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  invitedSellerContactIds: Array<Scalars['String']['input']>;
  lineItems: Array<RfqLineItemInput>;
  responseDeadline?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<RfqStatus>;
};

export type CreateReferenceNumberTemplateInput = {
  businessContactId?: InputMaybe<Scalars['String']['input']>;
  projectId?: InputMaybe<Scalars['String']['input']>;
  resetFrequency: ResetFrequency;
  seqPadding?: InputMaybe<Scalars['Int']['input']>;
  startAt?: InputMaybe<Scalars['Int']['input']>;
  template: Scalars['String']['input'];
  type: ReferenceNumberType;
  useGlobalSequence: Scalars['Boolean']['input'];
  workspaceId: Scalars['String']['input'];
};

export type CreateRentalFulfilmentInput = {
  assignedToId?: InputMaybe<Scalars['String']['input']>;
  expectedRentalEndDate?: InputMaybe<Scalars['DateTime']['input']>;
  /** If salesOrderLineItemId is not provided, these fields are required */
  pimDetails?: InputMaybe<FulfilmentPimInput>;
  pricePerDayInCents: Scalars['Int']['input'];
  pricePerMonthInCents: Scalars['Int']['input'];
  pricePerWeekInCents: Scalars['Int']['input'];
  rentalEndDate?: InputMaybe<Scalars['DateTime']['input']>;
  rentalStartDate?: InputMaybe<Scalars['DateTime']['input']>;
  salesOrderId: Scalars['String']['input'];
  salesOrderLineItemId?: InputMaybe<Scalars['String']['input']>;
  workflowColumnId?: InputMaybe<Scalars['ID']['input']>;
  workflowId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateRentalPriceInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  pimCategoryId: Scalars['String']['input'];
  pimProductId?: InputMaybe<Scalars['ID']['input']>;
  priceBookId?: InputMaybe<Scalars['ID']['input']>;
  pricePerDayInCents: Scalars['Int']['input'];
  pricePerMonthInCents: Scalars['Int']['input'];
  pricePerWeekInCents: Scalars['Int']['input'];
  workspaceId: Scalars['ID']['input'];
};

export type CreateRentalPurchaseOrderLineItemInput = {
  deliveryNotes?: InputMaybe<Scalars['String']['input']>;
  delivery_charge_in_cents?: InputMaybe<Scalars['Int']['input']>;
  delivery_date?: InputMaybe<Scalars['String']['input']>;
  delivery_location?: InputMaybe<Scalars['String']['input']>;
  delivery_method?: InputMaybe<DeliveryMethod>;
  lineitem_status?: InputMaybe<PoLineItemStatus>;
  off_rent_date?: InputMaybe<Scalars['String']['input']>;
  po_pim_id?: InputMaybe<Scalars['String']['input']>;
  po_quantity?: InputMaybe<Scalars['Int']['input']>;
  price_id?: InputMaybe<Scalars['String']['input']>;
  purchase_order_id: Scalars['String']['input'];
};

export type CreateRentalSalesOrderLineItemInput = {
  deliveryNotes?: InputMaybe<Scalars['String']['input']>;
  delivery_charge_in_cents?: InputMaybe<Scalars['Int']['input']>;
  delivery_date?: InputMaybe<Scalars['String']['input']>;
  delivery_location?: InputMaybe<Scalars['String']['input']>;
  delivery_method?: InputMaybe<DeliveryMethod>;
  intake_form_submission_line_item_id?: InputMaybe<Scalars['String']['input']>;
  lineitem_status?: InputMaybe<LineItemStatus>;
  off_rent_date?: InputMaybe<Scalars['String']['input']>;
  price_id?: InputMaybe<Scalars['String']['input']>;
  sales_order_id: Scalars['String']['input'];
  so_pim_id?: InputMaybe<Scalars['String']['input']>;
  so_quantity?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateSaleFulfilmentInput = {
  assignedToId?: InputMaybe<Scalars['String']['input']>;
  /** If salesOrderLineItemId is not provided, these fields are required */
  pimDetails?: InputMaybe<FulfilmentPimInput>;
  quantity: Scalars['Int']['input'];
  salesOrderId: Scalars['String']['input'];
  salesOrderLineItemId?: InputMaybe<Scalars['String']['input']>;
  unitCostInCents: Scalars['Int']['input'];
  workflowColumnId?: InputMaybe<Scalars['ID']['input']>;
  workflowId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateSalePriceInput = {
  discounts?: InputMaybe<Scalars['JSON']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  pimCategoryId: Scalars['String']['input'];
  pimProductId?: InputMaybe<Scalars['ID']['input']>;
  priceBookId?: InputMaybe<Scalars['ID']['input']>;
  unitCostInCents: Scalars['Int']['input'];
  workspaceId: Scalars['ID']['input'];
};

export type CreateSalePurchaseOrderLineItemInput = {
  deliveryNotes?: InputMaybe<Scalars['String']['input']>;
  delivery_charge_in_cents?: InputMaybe<Scalars['Int']['input']>;
  delivery_date?: InputMaybe<Scalars['String']['input']>;
  delivery_location?: InputMaybe<Scalars['String']['input']>;
  delivery_method?: InputMaybe<DeliveryMethod>;
  lineitem_status?: InputMaybe<PoLineItemStatus>;
  po_pim_id?: InputMaybe<Scalars['String']['input']>;
  po_quantity?: InputMaybe<Scalars['Int']['input']>;
  price_id?: InputMaybe<Scalars['String']['input']>;
  purchase_order_id: Scalars['String']['input'];
};

export type CreateSaleSalesOrderLineItemInput = {
  deliveryNotes?: InputMaybe<Scalars['String']['input']>;
  delivery_charge_in_cents?: InputMaybe<Scalars['Int']['input']>;
  delivery_date?: InputMaybe<Scalars['String']['input']>;
  delivery_location?: InputMaybe<Scalars['String']['input']>;
  delivery_method?: InputMaybe<DeliveryMethod>;
  intake_form_submission_line_item_id?: InputMaybe<Scalars['String']['input']>;
  lineitem_status?: InputMaybe<LineItemStatus>;
  price_id?: InputMaybe<Scalars['String']['input']>;
  sales_order_id: Scalars['String']['input'];
  so_pim_id?: InputMaybe<Scalars['String']['input']>;
  so_quantity?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateServiceFulfilmentInput = {
  assignedToId?: InputMaybe<Scalars['String']['input']>;
  /** If salesOrderLineItemId is not provided, these fields are required */
  pimDetails?: InputMaybe<FulfilmentPimInput>;
  salesOrderId: Scalars['String']['input'];
  salesOrderLineItemId?: InputMaybe<Scalars['String']['input']>;
  serviceDate: Scalars['DateTime']['input'];
  unitCostInCents: Scalars['Int']['input'];
  workflowColumnId?: InputMaybe<Scalars['ID']['input']>;
  workflowId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateWorkflowConfigurationInput = {
  columns: Array<WorkflowColumnInput>;
  name: Scalars['String']['input'];
};

export type CurrentTimeEvent = {
  __typename?: 'CurrentTimeEvent';
  /** The current server time */
  timestamp: Scalars['String']['output'];
};

export type DeleteInventoryInput = {
  reason: Scalars['String']['input'];
};

export type DeleteRelationshipResult = {
  __typename?: 'DeleteRelationshipResult';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export enum DeliveryMethod {
  Delivery = 'DELIVERY',
  Pickup = 'PICKUP'
}

export type EmailActivity = {
  __typename?: 'EmailActivity';
  clicks?: Maybe<Scalars['Int']['output']>;
  email: Scalars['String']['output'];
  event: Scalars['String']['output'];
  fromEmail?: Maybe<Scalars['String']['output']>;
  htmlContent?: Maybe<Scalars['String']['output']>;
  msgId: Scalars['String']['output'];
  opens?: Maybe<Scalars['Int']['output']>;
  plainContent?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  subject?: Maybe<Scalars['String']['output']>;
  timestamp: Scalars['Float']['output'];
};

export type EmailDetails = {
  __typename?: 'EmailDetails';
  from: Scalars['String']['output'];
  htmlContent?: Maybe<Scalars['String']['output']>;
  msgId: Scalars['String']['output'];
  plainContent?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  subject: Scalars['String']['output'];
  timestamp: Scalars['Float']['output'];
  to: Scalars['String']['output'];
};

export type EmailTemplatePreviewResult = {
  __typename?: 'EmailTemplatePreviewResult';
  /** The generated HTML content of the email template */
  html: Scalars['String']['output'];
};

export type ExampleTicket = {
  __typename?: 'ExampleTicket';
  description: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type File = {
  __typename?: 'File';
  comments: Array<Note>;
  created_at: Scalars['String']['output'];
  created_by: Scalars['String']['output'];
  created_by_user?: Maybe<User>;
  deleted: Scalars['Boolean']['output'];
  file_key: Scalars['String']['output'];
  file_name: Scalars['String']['output'];
  file_size: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  mime_type: Scalars['String']['output'];
  parent_entity_id: Scalars['String']['output'];
  updated_at: Scalars['String']['output'];
  updated_by: Scalars['String']['output'];
  updated_by_user?: Maybe<User>;
  url: Scalars['String']['output'];
  workspace_id: Scalars['String']['output'];
};


export type FileUrlArgs = {
  type?: InputMaybe<FileUrlType>;
};

export enum FileUrlType {
  Attachment = 'ATTACHMENT',
  Inline = 'INLINE'
}

export type Fulfilment = RentalFulfilment | SaleFulfilment | ServiceFulfilment;

export type FulfilmentBase = {
  assignedTo?: Maybe<User>;
  assignedToId?: Maybe<Scalars['ID']['output']>;
  /** @deprecated CompanyId is deprecated and will be removed in future versions. Use workspaceId instead. */
  companyId?: Maybe<Scalars['ID']['output']>;
  contact?: Maybe<Contact>;
  contactId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  pimCategory?: Maybe<PimCategory>;
  pimCategoryId?: Maybe<Scalars['ID']['output']>;
  pimCategoryName?: Maybe<Scalars['String']['output']>;
  pimCategoryPath?: Maybe<Scalars['String']['output']>;
  pimProduct?: Maybe<PimProduct>;
  pimProductId?: Maybe<Scalars['ID']['output']>;
  price?: Maybe<Price>;
  priceId?: Maybe<Scalars['ID']['output']>;
  priceName?: Maybe<Scalars['String']['output']>;
  project?: Maybe<Project>;
  projectId?: Maybe<Scalars['ID']['output']>;
  purchaseOrderLineItem?: Maybe<PurchaseOrderLineItem>;
  purchaseOrderLineItemId?: Maybe<Scalars['ID']['output']>;
  purchaseOrderNumber: Scalars['String']['output'];
  salesOrder?: Maybe<SalesOrder>;
  salesOrderId: Scalars['ID']['output'];
  salesOrderLineItem?: Maybe<SalesOrderLineItem>;
  salesOrderLineItemId: Scalars['ID']['output'];
  salesOrderPONumber?: Maybe<Scalars['String']['output']>;
  salesOrderType: FulfilmentType;
  updatedAt: Scalars['DateTime']['output'];
  workflowColumnId?: Maybe<Scalars['ID']['output']>;
  workflowId?: Maybe<Scalars['ID']['output']>;
  workspaceId: Scalars['ID']['output'];
};

export type FulfilmentPimInput = {
  pimCategoryId: Scalars['ID']['input'];
  pimCategoryName: Scalars['String']['input'];
  pimCategoryPath: Scalars['String']['input'];
  pimProductId?: InputMaybe<Scalars['ID']['input']>;
};

export type FulfilmentReservation = {
  __typename?: 'FulfilmentReservation';
  companyId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  createdByUser?: Maybe<User>;
  deleted: Scalars['Boolean']['output'];
  endDate: Scalars['DateTime']['output'];
  fulfilment?: Maybe<Fulfilment>;
  fulfilmentId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  inventory?: Maybe<Inventory>;
  inventoryId: Scalars['String']['output'];
  salesOrderType: FulfilmentType;
  startDate: Scalars['DateTime']['output'];
  type: ReservationType;
  updatedAt: Scalars['DateTime']['output'];
  updatedBy: Scalars['String']['output'];
  updatedByUser?: Maybe<User>;
};

export enum FulfilmentType {
  Rental = 'RENTAL',
  Sale = 'SALE',
  Service = 'SERVICE'
}

export type GenerateReferenceNumberInput = {
  parentProjectCode?: InputMaybe<Scalars['String']['input']>;
  projectCode?: InputMaybe<Scalars['String']['input']>;
  templateId: Scalars['String']['input'];
};

export type GenerateReferenceNumberResult = {
  __typename?: 'GenerateReferenceNumberResult';
  referenceNumber: Scalars['String']['output'];
  sequenceNumber: Scalars['Int']['output'];
  templateUsed: ReferenceNumberTemplate;
};

export type ImportPricesResult = {
  __typename?: 'ImportPricesResult';
  errors: Array<Scalars['String']['output']>;
  failed: Scalars['Int']['output'];
  imported: Scalars['Int']['output'];
};

export type IntakeForm = {
  __typename?: 'IntakeForm';
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isDeleted: Scalars['Boolean']['output'];
  isPublic: Scalars['Boolean']['output'];
  pricebook?: Maybe<PriceBook>;
  pricebookId?: Maybe<Scalars['ID']['output']>;
  project?: Maybe<IntakeFormProject>;
  projectId?: Maybe<Scalars['ID']['output']>;
  sharedWithUserIds: Array<Scalars['ID']['output']>;
  sharedWithUsers: Array<Maybe<User>>;
  updatedAt: Scalars['DateTime']['output'];
  updatedBy: Scalars['String']['output'];
  workspace?: Maybe<IntakeFormWorkspace>;
  workspaceId: Scalars['ID']['output'];
};

export type IntakeFormInput = {
  isActive: Scalars['Boolean']['input'];
  isPublic?: InputMaybe<Scalars['Boolean']['input']>;
  pricebookId?: InputMaybe<Scalars['ID']['input']>;
  projectId?: InputMaybe<Scalars['ID']['input']>;
  sharedWithEmails?: InputMaybe<Array<Scalars['String']['input']>>;
  workspaceId: Scalars['ID']['input'];
};

export type IntakeFormLineItem = {
  __typename?: 'IntakeFormLineItem';
  customPriceName?: Maybe<Scalars['String']['output']>;
  deliveryLocation?: Maybe<Scalars['String']['output']>;
  deliveryMethod: DeliveryMethod;
  deliveryNotes?: Maybe<Scalars['String']['output']>;
  description: Scalars['String']['output'];
  durationInDays: Scalars['Int']['output'];
  fulfilmentId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  inventoryReservations?: Maybe<Array<InventoryReservation>>;
  pimCategory?: Maybe<PimCategory>;
  pimCategoryId: Scalars['String']['output'];
  price?: Maybe<Price>;
  priceForecast?: Maybe<LineItemPriceForecast>;
  priceId?: Maybe<Scalars['String']['output']>;
  quantity: Scalars['Int']['output'];
  rentalEndDate?: Maybe<Scalars['DateTime']['output']>;
  rentalStartDate?: Maybe<Scalars['DateTime']['output']>;
  salesOrderId?: Maybe<Scalars['String']['output']>;
  salesOrderLineItem?: Maybe<SalesOrderLineItem>;
  startDate: Scalars['DateTime']['output'];
  subtotalInCents: Scalars['Int']['output'];
  type: RequestType;
};

export type IntakeFormLineItemInput = {
  customPriceName?: InputMaybe<Scalars['String']['input']>;
  deliveryLocation?: InputMaybe<Scalars['String']['input']>;
  deliveryMethod: DeliveryMethod;
  deliveryNotes?: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  durationInDays: Scalars['Int']['input'];
  id?: InputMaybe<Scalars['ID']['input']>;
  pimCategoryId: Scalars['String']['input'];
  priceId?: InputMaybe<Scalars['String']['input']>;
  quantity: Scalars['Int']['input'];
  rentalEndDate?: InputMaybe<Scalars['DateTime']['input']>;
  rentalStartDate?: InputMaybe<Scalars['DateTime']['input']>;
  salesOrderId?: InputMaybe<Scalars['String']['input']>;
  salesOrderLineItemId?: InputMaybe<Scalars['String']['input']>;
  startDate: Scalars['DateTime']['input'];
  type: RequestType;
};

export type IntakeFormPage = {
  __typename?: 'IntakeFormPage';
  items: Array<IntakeForm>;
  page: IntakeFormPageInfo;
};

export type IntakeFormPageInfo = {
  __typename?: 'IntakeFormPageInfo';
  number: Scalars['Int']['output'];
  size: Scalars['Int']['output'];
  totalItems: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type IntakeFormProject = {
  __typename?: 'IntakeFormProject';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  projectCode: Scalars['String']['output'];
};

export type IntakeFormSubmission = {
  __typename?: 'IntakeFormSubmission';
  buyerWorkspace?: Maybe<IntakeFormWorkspace>;
  buyerWorkspaceId?: Maybe<Scalars['String']['output']>;
  companyName?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  email?: Maybe<Scalars['String']['output']>;
  form?: Maybe<IntakeForm>;
  formId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  lineItems?: Maybe<Array<IntakeFormLineItem>>;
  name?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  purchaseOrderId?: Maybe<Scalars['String']['output']>;
  purchaseOrderNumber?: Maybe<Scalars['String']['output']>;
  /** The quote generated from this intake form submission */
  quote?: Maybe<Quote>;
  salesOrder?: Maybe<SubmissionSalesOrder>;
  status: IntakeFormSubmissionStatus;
  submittedAt?: Maybe<Scalars['DateTime']['output']>;
  totalInCents: Scalars['Int']['output'];
  userId?: Maybe<Scalars['String']['output']>;
  workspaceId: Scalars['ID']['output'];
};

export type IntakeFormSubmissionInput = {
  buyerWorkspaceId?: InputMaybe<Scalars['String']['input']>;
  companyName?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  formId: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  purchaseOrderNumber?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  workspaceId: Scalars['ID']['input'];
};

export type IntakeFormSubmissionPage = {
  __typename?: 'IntakeFormSubmissionPage';
  items: Array<IntakeFormSubmission>;
  page: IntakeFormSubmissionPageInfo;
};

export type IntakeFormSubmissionPageInfo = {
  __typename?: 'IntakeFormSubmissionPageInfo';
  number: Scalars['Int']['output'];
  size: Scalars['Int']['output'];
  totalItems: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export enum IntakeFormSubmissionStatus {
  Draft = 'DRAFT',
  Submitted = 'SUBMITTED'
}

export type IntakeFormWorkspace = {
  __typename?: 'IntakeFormWorkspace';
  bannerImageUrl?: Maybe<Scalars['String']['output']>;
  companyId: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type Inventory = {
  __typename?: 'Inventory';
  actualReturnDate?: Maybe<Scalars['DateTime']['output']>;
  asset?: Maybe<Asset>;
  assetId?: Maybe<Scalars['String']['output']>;
  companyId: Scalars['String']['output'];
  conditionNotes?: Maybe<Scalars['String']['output']>;
  conditionOnReceipt?: Maybe<InventoryCondition>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  createdByUser?: Maybe<User>;
  expectedReturnDate?: Maybe<Scalars['DateTime']['output']>;
  fulfilment?: Maybe<Fulfilment>;
  fulfilmentId?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  isThirdPartyRental: Scalars['Boolean']['output'];
  pimCategory?: Maybe<PimCategory>;
  pimCategoryId?: Maybe<Scalars['String']['output']>;
  pimCategoryName?: Maybe<Scalars['String']['output']>;
  pimCategoryPath?: Maybe<Scalars['String']['output']>;
  pimProduct?: Maybe<PimProduct>;
  pimProductId?: Maybe<Scalars['String']['output']>;
  purchaseOrder?: Maybe<PurchaseOrder>;
  purchaseOrderId?: Maybe<Scalars['String']['output']>;
  purchaseOrderLineItem?: Maybe<PurchaseOrderLineItem>;
  purchaseOrderLineItemId?: Maybe<Scalars['String']['output']>;
  receiptNotes?: Maybe<Scalars['String']['output']>;
  receivedAt?: Maybe<Scalars['DateTime']['output']>;
  resourceMap?: Maybe<ResourceMapResource>;
  resourceMapId?: Maybe<Scalars['String']['output']>;
  resourceMapIds?: Maybe<Array<Scalars['String']['output']>>;
  resource_map_entries?: Maybe<Array<ResourceMapResource>>;
  status: InventoryStatus;
  updatedAt: Scalars['DateTime']['output'];
  updatedBy: Scalars['String']['output'];
  updatedByUser?: Maybe<User>;
  workspaceId?: Maybe<Scalars['String']['output']>;
};

export enum InventoryCondition {
  Damaged = 'DAMAGED',
  New = 'NEW',
  Refurbished = 'REFURBISHED',
  Used = 'USED'
}

export type InventoryGroupedByCategory = {
  __typename?: 'InventoryGroupedByCategory';
  pimCategoryId?: Maybe<Scalars['String']['output']>;
  pimCategoryName?: Maybe<Scalars['String']['output']>;
  pimCategoryPath?: Maybe<Scalars['String']['output']>;
  quantityOnOrder: Scalars['Int']['output'];
  quantityReceived: Scalars['Int']['output'];
  sampleInventories: Array<Maybe<Inventory>>;
  sampleInventoryIds: Array<Scalars['String']['output']>;
  totalQuantity: Scalars['Int']['output'];
};

export type InventoryGroupedByCategoryResponse = {
  __typename?: 'InventoryGroupedByCategoryResponse';
  items: Array<InventoryGroupedByCategory>;
  pageNumber: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type InventoryReservation = FulfilmentReservation;

export type InventoryReservationsPage = {
  __typename?: 'InventoryReservationsPage';
  number: Scalars['Int']['output'];
  size: Scalars['Int']['output'];
  totalItems: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type InventoryReservationsResponse = {
  __typename?: 'InventoryReservationsResponse';
  items: Array<InventoryReservation>;
  page: InventoryReservationsPage;
};

export type InventoryResponse = {
  __typename?: 'InventoryResponse';
  items: Array<Inventory>;
};

export enum InventoryStatus {
  OnOrder = 'ON_ORDER',
  Received = 'RECEIVED'
}

export type Invoice = {
  __typename?: 'Invoice';
  buyer?: Maybe<Contact>;
  buyerId: Scalars['String']['output'];
  companyId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<Scalars['String']['output']>;
  createdByUser?: Maybe<User>;
  finalSumInCents: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  invoiceNumber: Scalars['String']['output'];
  invoicePaidDate?: Maybe<Scalars['DateTime']['output']>;
  invoiceSentDate?: Maybe<Scalars['DateTime']['output']>;
  lineItems: Array<InvoiceLineItem>;
  seller?: Maybe<Contact>;
  sellerId: Scalars['String']['output'];
  status: InvoiceStatus;
  subTotalInCents: Scalars['Int']['output'];
  taxLineItems: Array<TaxLineItem>;
  /** @deprecated Use tax line items to see tax info */
  taxPercent: Scalars['Float']['output'];
  /** @deprecated Use totalTaxesInCents */
  taxesInCents: Scalars['Int']['output'];
  totalTaxesInCents: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  updatedBy?: Maybe<Scalars['String']['output']>;
  updatedByUser?: Maybe<User>;
  workspaceId: Scalars['String']['output'];
};

export type InvoiceLineItem = {
  __typename?: 'InvoiceLineItem';
  charge?: Maybe<Charge>;
  chargeId: Scalars['ID']['output'];
  description: Scalars['String']['output'];
  totalInCents: Scalars['Int']['output'];
};

export enum InvoiceStatus {
  Cancelled = 'CANCELLED',
  Draft = 'DRAFT',
  Paid = 'PAID',
  Sent = 'SENT'
}

export type InvoicesResponse = {
  __typename?: 'InvoicesResponse';
  items: Array<Invoice>;
};

export type LineItemCostOptionDetails = {
  __typename?: 'LineItemCostOptionDetails';
  exactSplitDistribution: LineItemRentalPeriod;
  optimalSplit: LineItemRentalPeriod;
  plainText: Scalars['String']['output'];
  rates: LineItemPricing;
};

export type LineItemPriceForecast = {
  __typename?: 'LineItemPriceForecast';
  accumulative_cost_in_cents: Scalars['Int']['output'];
  days: Array<LineItemPriceForecastDay>;
};

export type LineItemPriceForecastDay = {
  __typename?: 'LineItemPriceForecastDay';
  accumulative_cost_in_cents: Scalars['Int']['output'];
  cost_in_cents: Scalars['Int']['output'];
  day: Scalars['Int']['output'];
  details: LineItemCostOptionDetails;
  rental_period: LineItemRentalPeriod;
  savings_compared_to_day_rate_in_cents: Scalars['Int']['output'];
  savings_compared_to_day_rate_in_fraction: Scalars['Float']['output'];
  savings_compared_to_exact_split_in_cents: Scalars['Int']['output'];
  strategy: Scalars['String']['output'];
};

export type LineItemPricing = {
  __typename?: 'LineItemPricing';
  pricePer1DayInCents: Scalars['Int']['output'];
  pricePer7DaysInCents: Scalars['Int']['output'];
  pricePer28DaysInCents: Scalars['Int']['output'];
};

export type LineItemRentalPeriod = {
  __typename?: 'LineItemRentalPeriod';
  days1: Scalars['Int']['output'];
  days7: Scalars['Int']['output'];
  days28: Scalars['Int']['output'];
};

export enum LineItemStatus {
  Confirmed = 'CONFIRMED',
  Draft = 'DRAFT',
  Submitted = 'SUBMITTED'
}

export enum LineItemType {
  Rental = 'RENTAL',
  Sale = 'SALE'
}

export type ListAssetsPage = {
  number?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
};

export type ListAssetsResult = {
  __typename?: 'ListAssetsResult';
  items: Array<Asset>;
  page: PaginationInfo;
};

export type ListChargesFilter = {
  chargeType?: InputMaybe<ChargeType>;
  contactId?: InputMaybe<Scalars['ID']['input']>;
  fulfilmentId?: InputMaybe<Scalars['ID']['input']>;
  invoiceId?: InputMaybe<Scalars['ID']['input']>;
  projectId?: InputMaybe<Scalars['ID']['input']>;
  purchaseOrderNumber?: InputMaybe<Scalars['ID']['input']>;
  salesOrderId?: InputMaybe<Scalars['ID']['input']>;
  workspaceId: Scalars['ID']['input'];
};

export type ListContactsFilter = {
  /** Filter person contacts by their employer business ID */
  businessId?: InputMaybe<Scalars['ID']['input']>;
  contactType?: InputMaybe<ContactType>;
  workspaceId: Scalars['String']['input'];
};

export type ListContactsPage = {
  number?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
};

export type ListContactsResult = {
  __typename?: 'ListContactsResult';
  items: Array<Contact>;
  page: PaginationInfo;
};

export type ListFulfilmentsFilter = {
  assignedTo?: InputMaybe<Scalars['ID']['input']>;
  salesOrderId?: InputMaybe<Scalars['ID']['input']>;
  salesOrderLineItemId?: InputMaybe<Scalars['ID']['input']>;
  salesOrderType?: InputMaybe<FulfilmentType>;
  workflowColumnId?: InputMaybe<Scalars['ID']['input']>;
  workflowId?: InputMaybe<Scalars['ID']['input']>;
  workspaceId: Scalars['ID']['input'];
};

export type ListFulfilmentsPage = {
  number?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
};

export type ListFulfilmentsResult = {
  __typename?: 'ListFulfilmentsResult';
  items: Array<Fulfilment>;
  page: PaginationInfo;
};

export type ListInventoryFilter = {
  assetId?: InputMaybe<Scalars['String']['input']>;
  companyId?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  fulfilmentId?: InputMaybe<Scalars['String']['input']>;
  isThirdPartyRental?: InputMaybe<Scalars['Boolean']['input']>;
  pimCategoryId?: InputMaybe<Scalars['String']['input']>;
  purchaseOrderId?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<InventoryStatus>;
  workspaceId?: InputMaybe<Scalars['String']['input']>;
};

export type ListInventoryPage = {
  number?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
};

export type ListInventoryQuery = {
  filter?: InputMaybe<ListInventoryFilter>;
  page?: InputMaybe<ListInventoryPage>;
};

export type ListInventoryReservationsFilter = {
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  fulfilmentId?: InputMaybe<Scalars['String']['input']>;
  inventoryId?: InputMaybe<Scalars['String']['input']>;
  pimCategoryId?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  type?: InputMaybe<ReservationType>;
};

export type ListInvoicesFilter = {
  companyId?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<InvoiceStatus>;
  workspaceId: Scalars['String']['input'];
};

export type ListInvoicesPage = {
  number?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
};

export type ListInvoicesQuery = {
  filter: ListInvoicesFilter;
  page?: InputMaybe<ListInvoicesPage>;
};

export type ListPersonContactsResult = {
  __typename?: 'ListPersonContactsResult';
  items: Array<PersonContact>;
  page: PaginationInfo;
};

export type ListPimCategoriesFilter = {
  parentId?: InputMaybe<Scalars['ID']['input']>;
  path?: InputMaybe<Scalars['String']['input']>;
  priceBookId?: InputMaybe<Scalars['ID']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
};

export type ListPimCategoriesPage = {
  number?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
};

export type ListPimCategoriesResult = {
  __typename?: 'ListPimCategoriesResult';
  items: Array<PimCategory>;
  page: PaginationInfo;
};

export type ListPimProductsFilter = {
  pimCategoryPlatformId?: InputMaybe<Scalars['ID']['input']>;
  /** Search term to filter products by name  */
  searchTerm?: InputMaybe<Scalars['String']['input']>;
};

export type ListPimProductsPage = {
  number?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
};

export type ListPimProductsResult = {
  __typename?: 'ListPimProductsResult';
  items: Array<PimProduct>;
  page: PaginationInfo;
};

export type ListPriceBooksFilter = {
  workspaceId: Scalars['ID']['input'];
};

export type ListPriceBooksPage = {
  number?: Scalars['Int']['input'];
  size?: Scalars['Int']['input'];
};

export type ListPriceBooksResult = {
  __typename?: 'ListPriceBooksResult';
  items: Array<PriceBook>;
  page: PaginationInfo;
};

export type ListPricesFilter = {
  businessContactId?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  pimCategoryId?: InputMaybe<Scalars['String']['input']>;
  priceBookId?: InputMaybe<Scalars['String']['input']>;
  priceType?: InputMaybe<PriceType>;
  projectId?: InputMaybe<Scalars['String']['input']>;
  workspaceId: Scalars['ID']['input'];
};

export type ListPricesPage = {
  number?: Scalars['Int']['input'];
  size?: Scalars['Int']['input'];
};

export type ListPricesResult = {
  __typename?: 'ListPricesResult';
  items: Array<Price>;
  page: PaginationInfo;
};

export type ListQuotesFilter = {
  buyerWorkspaceId?: InputMaybe<Scalars['String']['input']>;
  rfqId?: InputMaybe<Scalars['String']['input']>;
  sellerWorkspaceId?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<QuoteStatus>;
};

export type ListQuotesPage = {
  number?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
};

export type ListQuotesQuery = {
  filter: ListQuotesFilter;
  page?: InputMaybe<ListQuotesPage>;
};

export type ListRfQsFilter = {
  buyersWorkspaceId: Scalars['String']['input'];
  createdAtEnd?: InputMaybe<Scalars['DateTime']['input']>;
  createdAtStart?: InputMaybe<Scalars['DateTime']['input']>;
  invitedSellerContactIds?: InputMaybe<Array<Scalars['String']['input']>>;
  status?: InputMaybe<RfqStatus>;
  updatedAtEnd?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAtStart?: InputMaybe<Scalars['DateTime']['input']>;
};

export type ListRfQsPage = {
  number?: Scalars['Int']['input'];
  size?: Scalars['Int']['input'];
};

export type ListRfQsResult = {
  __typename?: 'ListRFQsResult';
  items: Array<Rfq>;
  page: PaginationInfo;
};

export type ListRelationshipsResult = {
  __typename?: 'ListRelationshipsResult';
  cursor?: Maybe<Scalars['String']['output']>;
  relationships: Array<SpiceDbRelationship>;
};

export type ListRentalFulfilmentsFilter = {
  assignedToId?: InputMaybe<Scalars['ID']['input']>;
  contactId?: InputMaybe<Scalars['ID']['input']>;
  hasInventoryAssigned?: InputMaybe<Scalars['Boolean']['input']>;
  pimCategoryId?: InputMaybe<Scalars['ID']['input']>;
  projectId?: InputMaybe<Scalars['ID']['input']>;
  salesOrderId?: InputMaybe<Scalars['ID']['input']>;
  salesOrderLineItemId?: InputMaybe<Scalars['ID']['input']>;
  salesOrderType?: InputMaybe<FulfilmentType>;
  timelineEndDate?: InputMaybe<Scalars['DateTime']['input']>;
  timelineStartDate?: InputMaybe<Scalars['DateTime']['input']>;
  workflowColumnId?: InputMaybe<Scalars['ID']['input']>;
  workflowId?: InputMaybe<Scalars['ID']['input']>;
  workspaceId: Scalars['ID']['input'];
};

export type ListRentalFulfilmentsResult = {
  __typename?: 'ListRentalFulfilmentsResult';
  items: Array<RentalFulfilment>;
  page: PaginationInfo;
};

export type ListRentalViewsPageInput = {
  number?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
};

export type ListRentalViewsResult = {
  __typename?: 'ListRentalViewsResult';
  items: Array<RentalMaterializedView>;
  page: PaginationInfo;
};

export type ListTransactionResult = {
  __typename?: 'ListTransactionResult';
  items: Array<Transaction>;
  page: PaginationInfo;
};

export type ListUserPermissionsResult = {
  __typename?: 'ListUserPermissionsResult';
  permissions: UserPermission;
};

export type ListWorkflowConfigurationsPage = {
  number?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
};

export type ListWorkflowConfigurationsResult = {
  __typename?: 'ListWorkflowConfigurationsResult';
  items: Array<WorkflowConfiguration>;
  page: PaginationInfo;
};

export type ListWorkspaceMembersResult = {
  __typename?: 'ListWorkspaceMembersResult';
  items: Array<WorkspaceMember>;
  page: PaginationInfo;
};

export type ListWorkspacesResult = {
  __typename?: 'ListWorkspacesResult';
  items: Array<Workspace>;
  page: PaginationInfo;
};

export type Llm = {
  __typename?: 'Llm';
  exampleTicket?: Maybe<ExampleTicket>;
  suggestTaxObligations?: Maybe<TaxAnalysisResult>;
};


export type LlmSuggestTaxObligationsArgs = {
  invoiceDescription: Scalars['String']['input'];
};

export type MarkInvoiceAsPaidInput = {
  date: Scalars['DateTime']['input'];
  invoiceId: Scalars['String']['input'];
};

export type MarkInvoiceAsSentInput = {
  date: Scalars['DateTime']['input'];
  invoiceId: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  acceptQuote: AcceptQuoteResult;
  addFileToEntity: File;
  addInvoiceCharges: Invoice;
  addSearchRecent: SearchUserState;
  addTaxLineItem: Invoice;
  /** Admin mutations (Admin only) */
  admin?: Maybe<AdminMutationNamespace>;
  /** Adopt orphaned intake form submissions (with null buyerWorkspaceId) to the specified workspace. Only submissions created by the authenticated user will be adopted. If submissionIds is provided with items, only those specific submissions will be adopted. If submissionIds is omitted or empty, all orphaned submissions will be adopted. Idempotent. */
  adoptOrphanedSubmissions: AdoptOrphanedSubmissionsResult;
  archiveWorkspace?: Maybe<Workspace>;
  assignInventoryToRentalFulfilment?: Maybe<RentalFulfilment>;
  bulkMarkInventoryReceived: BulkMarkInventoryReceivedResult;
  cancelInvoice: Invoice;
  clearInvoiceTaxes: Invoice;
  clearSearchRecents: SearchUserState;
  createAssetSchedule?: Maybe<AssetSchedule>;
  createBusinessContact?: Maybe<BusinessContact>;
  createCharge?: Maybe<Charge>;
  createFulfilmentReservation: FulfilmentReservation;
  /** Create a new intake form */
  createIntakeForm?: Maybe<IntakeForm>;
  /** Create a new intake form submission */
  createIntakeFormSubmission?: Maybe<IntakeFormSubmission>;
  /** Create a new line item for an intake form submission */
  createIntakeFormSubmissionLineItem?: Maybe<IntakeFormLineItem>;
  createInventory: Inventory;
  createInvoice: Invoice;
  createNote?: Maybe<Note>;
  /** Generate and save a PDF for an entity by path and entity_id */
  createPdfFromPageAndAttachToEntityId?: Maybe<CreatePdfResult>;
  createPersonContact?: Maybe<PersonContact>;
  createPriceBook?: Maybe<PriceBook>;
  createProject?: Maybe<Project>;
  createPurchaseOrder?: Maybe<PurchaseOrder>;
  createQuote: Quote;
  createQuoteFromIntakeFormSubmission: Quote;
  createQuoteRevision: QuoteRevision;
  createRFQ: Rfq;
  createReferenceNumberTemplate?: Maybe<ReferenceNumberTemplate>;
  createRentalFulfilment?: Maybe<RentalFulfilment>;
  createRentalPrice?: Maybe<RentalPrice>;
  createRentalPurchaseOrderLineItem?: Maybe<RentalPurchaseOrderLineItem>;
  createRentalSalesOrderLineItem?: Maybe<RentalSalesOrderLineItem>;
  createSaleFulfilment?: Maybe<SaleFulfilment>;
  createSalePrice?: Maybe<SalePrice>;
  createSalePurchaseOrderLineItem?: Maybe<SalePurchaseOrderLineItem>;
  createSaleSalesOrderLineItem?: Maybe<SaleSalesOrderLineItem>;
  createSalesOrder?: Maybe<SalesOrder>;
  createServiceFulfilment?: Maybe<ServiceFulfilment>;
  createTransaction?: Maybe<Transaction>;
  createWorkflowConfiguration?: Maybe<WorkflowConfiguration>;
  createWorkspace?: Maybe<Workspace>;
  deleteContactById?: Maybe<Scalars['Boolean']['output']>;
  deleteFulfilment?: Maybe<Scalars['Boolean']['output']>;
  /** Soft delete an intake form */
  deleteIntakeForm?: Maybe<IntakeForm>;
  /** Delete an intake form submission line item */
  deleteIntakeFormSubmissionLineItem?: Maybe<Scalars['Boolean']['output']>;
  deleteInventory: Scalars['Boolean']['output'];
  deleteInvoice: Scalars['Boolean']['output'];
  deleteNote?: Maybe<Note>;
  deletePriceBookById?: Maybe<Scalars['Boolean']['output']>;
  deletePriceById?: Maybe<Scalars['Boolean']['output']>;
  deleteProject?: Maybe<Project>;
  deleteReferenceNumberTemplate?: Maybe<Scalars['Boolean']['output']>;
  deleteWorkflowConfigurationById?: Maybe<Scalars['Boolean']['output']>;
  exportPrices?: Maybe<File>;
  generateReferenceNumber?: Maybe<GenerateReferenceNumberResult>;
  getSignedReadUrl?: Maybe<Scalars['String']['output']>;
  importPrices?: Maybe<ImportPricesResult>;
  inviteUserToWorkspace?: Maybe<WorkspaceMember>;
  joinWorkspace?: Maybe<Workspace>;
  markInvoiceAsPaid: Invoice;
  markInvoiceAsSent: Invoice;
  refreshBrand?: Maybe<Brand>;
  rejectQuote: Quote;
  removeFileFromEntity: File;
  removeSearchRecent: SearchUserState;
  removeTaxLineItem: Invoice;
  removeUserFromWorkspace?: Maybe<Scalars['Boolean']['output']>;
  renameFile: File;
  resetSequenceNumber?: Maybe<Scalars['Boolean']['output']>;
  runNightlyRentalChargesJob: Array<RentalFulfilment>;
  runNightlyRentalChargesJobAsync?: Maybe<Scalars['Boolean']['output']>;
  sendQuote: Quote;
  setExpectedRentalEndDate?: Maybe<RentalFulfilment>;
  setFulfilmentPurchaseOrderLineItemId?: Maybe<FulfilmentBase>;
  /** Set the active status of an intake form */
  setIntakeFormActive?: Maybe<IntakeForm>;
  /**
   * DEPRECATED: Use addTaxLineItem instead for more flexible tax management
   * @deprecated Use addTaxLineItem instead for more flexible tax management
   */
  setInvoiceTax: Invoice;
  setRentalEndDate?: Maybe<RentalFulfilment>;
  setRentalStartDate?: Maybe<RentalFulfilment>;
  softDeletePurchaseOrder?: Maybe<PurchaseOrder>;
  softDeletePurchaseOrderLineItem?: Maybe<PurchaseOrderLineItem>;
  softDeleteSalesOrder?: Maybe<SalesOrder>;
  softDeleteSalesOrderLineItem?: Maybe<SalesOrderLineItem>;
  /** Submit an intake form submission (changes status from DRAFT to SUBMITTED) */
  submitIntakeFormSubmission?: Maybe<IntakeFormSubmission>;
  submitPurchaseOrder?: Maybe<PurchaseOrder>;
  submitSalesOrder?: Maybe<SalesOrder>;
  /** Sync the current authenticated user to the database and assign domain permissions. This replicates the Auth0 post-login webhook logic for local development. Safe to call in any environment - idempotent operation. */
  syncCurrentUser?: Maybe<User>;
  toggleSearchFavorite: SearchUserState;
  touchAllContacts?: Maybe<TouchAllContactsResult>;
  unarchiveWorkspace?: Maybe<Workspace>;
  unassignInventoryFromRentalFulfilment?: Maybe<RentalFulfilment>;
  updateBusinessAddress?: Maybe<BusinessContact>;
  updateBusinessBrandId?: Maybe<BusinessContact>;
  updateBusinessContact?: Maybe<BusinessContact>;
  updateBusinessName?: Maybe<BusinessContact>;
  updateBusinessPhone?: Maybe<BusinessContact>;
  updateBusinessTaxId?: Maybe<BusinessContact>;
  updateBusinessWebsite?: Maybe<BusinessContact>;
  updateFulfilmentAssignee?: Maybe<FulfilmentBase>;
  updateFulfilmentColumn?: Maybe<FulfilmentBase>;
  /** Update an existing intake form */
  updateIntakeForm?: Maybe<IntakeForm>;
  /** Update an existing intake form submission */
  updateIntakeFormSubmission?: Maybe<IntakeFormSubmission>;
  /** Update an existing intake form submission line item */
  updateIntakeFormSubmissionLineItem?: Maybe<IntakeFormLineItem>;
  updateInventoryActualReturnDate?: Maybe<Inventory>;
  updateInventoryExpectedReturnDate?: Maybe<Inventory>;
  updateInventorySerialisedId?: Maybe<Inventory>;
  updateNote?: Maybe<Note>;
  updatePersonBusiness?: Maybe<PersonContact>;
  updatePersonContact?: Maybe<PersonContact>;
  updatePersonEmail?: Maybe<PersonContact>;
  updatePersonName?: Maybe<PersonContact>;
  updatePersonPhone?: Maybe<PersonContact>;
  updatePersonResourceMap?: Maybe<PersonContact>;
  updatePersonRole?: Maybe<PersonContact>;
  updatePriceBook?: Maybe<PriceBook>;
  updateProject?: Maybe<Project>;
  updateProjectCode?: Maybe<Project>;
  updateProjectContacts?: Maybe<Project>;
  updateProjectDescription?: Maybe<Project>;
  updateProjectName?: Maybe<Project>;
  updateProjectParentProject?: Maybe<Project>;
  updateProjectScopeOfWork?: Maybe<Project>;
  updateProjectStatus?: Maybe<Project>;
  updatePurchaseOrder?: Maybe<PurchaseOrder>;
  /** @deprecated use updateSalePurchaseOrderLineItem */
  updatePurchaseOrderLineItem?: Maybe<PurchaseOrderLineItem>;
  updateQuote: Quote;
  updateQuoteRevision: QuoteRevision;
  updateQuoteStatus: Quote;
  updateRFQ: Rfq;
  updateReferenceNumberTemplate?: Maybe<ReferenceNumberTemplate>;
  updateRentalPrice?: Maybe<RentalPrice>;
  updateRentalPurchaseOrderLineItem?: Maybe<RentalPurchaseOrderLineItem>;
  updateRentalSalesOrderLineItem?: Maybe<RentalSalesOrderLineItem>;
  updateSalePrice?: Maybe<SalePrice>;
  updateSalePurchaseOrderLineItem?: Maybe<SalePurchaseOrderLineItem>;
  updateSaleSalesOrderLineItem?: Maybe<SaleSalesOrderLineItem>;
  updateSalesOrder?: Maybe<SalesOrder>;
  /** @deprecated use updateSaleSalesOrderLineItem */
  updateSalesOrderLineItem?: Maybe<SalesOrderLineItem>;
  updateTaxLineItem: Invoice;
  updateWorkflowConfiguration?: Maybe<WorkflowConfiguration>;
  updateWorkspaceAccessType?: Maybe<Workspace>;
  updateWorkspaceSettings?: Maybe<Workspace>;
  updateWorkspaceUserRoles?: Maybe<WorkspaceMember>;
  upsertPimCategory?: Maybe<PimCategory>;
  upsertUser?: Maybe<User>;
};


export type MutationAcceptQuoteArgs = {
  input: AcceptQuoteInput;
};


export type MutationAddFileToEntityArgs = {
  file_key: Scalars['String']['input'];
  file_name: Scalars['String']['input'];
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  parent_entity_id: Scalars['String']['input'];
  parent_entity_type?: InputMaybe<ResourceTypes>;
  workspace_id: Scalars['String']['input'];
};


export type MutationAddInvoiceChargesArgs = {
  input: AddInvoiceChargesInput;
};


export type MutationAddSearchRecentArgs = {
  searchDocumentId: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type MutationAddTaxLineItemArgs = {
  input: AddTaxLineItemInput;
};


export type MutationAdoptOrphanedSubmissionsArgs = {
  submissionIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  workspaceId: Scalars['String']['input'];
};


export type MutationArchiveWorkspaceArgs = {
  workspaceId: Scalars['String']['input'];
};


export type MutationAssignInventoryToRentalFulfilmentArgs = {
  allowOverlappingReservations?: InputMaybe<Scalars['Boolean']['input']>;
  fulfilmentId: Scalars['ID']['input'];
  inventoryId: Scalars['ID']['input'];
};


export type MutationBulkMarkInventoryReceivedArgs = {
  input: BulkMarkInventoryReceivedInput;
};


export type MutationCancelInvoiceArgs = {
  input: CancelInvoiceInput;
};


export type MutationClearInvoiceTaxesArgs = {
  invoiceId: Scalars['ID']['input'];
};


export type MutationClearSearchRecentsArgs = {
  workspaceId: Scalars['String']['input'];
};


export type MutationCreateAssetScheduleArgs = {
  input?: InputMaybe<AssetScheduleInput>;
};


export type MutationCreateBusinessContactArgs = {
  input: BusinessContactInput;
};


export type MutationCreateChargeArgs = {
  input: CreateChargeInput;
};


export type MutationCreateFulfilmentReservationArgs = {
  input: CreateFulfilmentReservationInput;
};


export type MutationCreateIntakeFormArgs = {
  input: IntakeFormInput;
};


export type MutationCreateIntakeFormSubmissionArgs = {
  input: IntakeFormSubmissionInput;
};


export type MutationCreateIntakeFormSubmissionLineItemArgs = {
  input: IntakeFormLineItemInput;
  submissionId: Scalars['String']['input'];
};


export type MutationCreateInventoryArgs = {
  input: CreateInventoryInput;
};


export type MutationCreateInvoiceArgs = {
  input: CreateInvoiceInput;
};


export type MutationCreateNoteArgs = {
  input: NoteInput;
};


export type MutationCreatePdfFromPageAndAttachToEntityIdArgs = {
  entity_id: Scalars['String']['input'];
  file_name?: InputMaybe<Scalars['String']['input']>;
  path: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type MutationCreatePersonContactArgs = {
  input: PersonContactInput;
};


export type MutationCreatePriceBookArgs = {
  input: CreatePriceBookInput;
};


export type MutationCreateProjectArgs = {
  input?: InputMaybe<ProjectInput>;
};


export type MutationCreatePurchaseOrderArgs = {
  input?: InputMaybe<PurchaseOrderInput>;
};


export type MutationCreateQuoteArgs = {
  input: CreateQuoteInput;
};


export type MutationCreateQuoteFromIntakeFormSubmissionArgs = {
  input: CreateQuoteFromIntakeFormSubmissionInput;
};


export type MutationCreateQuoteRevisionArgs = {
  input: CreateQuoteRevisionInput;
};


export type MutationCreateRfqArgs = {
  input: CreateRfqInput;
};


export type MutationCreateReferenceNumberTemplateArgs = {
  input: CreateReferenceNumberTemplateInput;
};


export type MutationCreateRentalFulfilmentArgs = {
  input: CreateRentalFulfilmentInput;
};


export type MutationCreateRentalPriceArgs = {
  input: CreateRentalPriceInput;
};


export type MutationCreateRentalPurchaseOrderLineItemArgs = {
  input?: InputMaybe<CreateRentalPurchaseOrderLineItemInput>;
};


export type MutationCreateRentalSalesOrderLineItemArgs = {
  input?: InputMaybe<CreateRentalSalesOrderLineItemInput>;
};


export type MutationCreateSaleFulfilmentArgs = {
  input: CreateSaleFulfilmentInput;
};


export type MutationCreateSalePriceArgs = {
  input: CreateSalePriceInput;
};


export type MutationCreateSalePurchaseOrderLineItemArgs = {
  input?: InputMaybe<CreateSalePurchaseOrderLineItemInput>;
};


export type MutationCreateSaleSalesOrderLineItemArgs = {
  input?: InputMaybe<CreateSaleSalesOrderLineItemInput>;
};


export type MutationCreateSalesOrderArgs = {
  input?: InputMaybe<SalesOrderInput>;
};


export type MutationCreateServiceFulfilmentArgs = {
  input: CreateServiceFulfilmentInput;
};


export type MutationCreateTransactionArgs = {
  input: TransactionInput;
};


export type MutationCreateWorkflowConfigurationArgs = {
  input: CreateWorkflowConfigurationInput;
};


export type MutationCreateWorkspaceArgs = {
  accessType: WorkspaceAccessType;
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  bannerImageUrl?: InputMaybe<Scalars['String']['input']>;
  brandId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};


export type MutationDeleteContactByIdArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteFulfilmentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteIntakeFormArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteIntakeFormSubmissionLineItemArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteInventoryArgs = {
  id: Scalars['String']['input'];
  input: DeleteInventoryInput;
};


export type MutationDeleteInvoiceArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteNoteArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeletePriceBookByIdArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePriceByIdArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProjectArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteReferenceNumberTemplateArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteWorkflowConfigurationByIdArgs = {
  id: Scalars['ID']['input'];
};


export type MutationExportPricesArgs = {
  priceBookId: Scalars['ID']['input'];
};


export type MutationGenerateReferenceNumberArgs = {
  input: GenerateReferenceNumberInput;
};


export type MutationGetSignedReadUrlArgs = {
  fileId: Scalars['ID']['input'];
  type?: InputMaybe<FileUrlType>;
};


export type MutationImportPricesArgs = {
  fileId: Scalars['ID']['input'];
  priceBookId: Scalars['ID']['input'];
};


export type MutationInviteUserToWorkspaceArgs = {
  email: Scalars['String']['input'];
  roles: Array<WorkspaceUserRole>;
  workspaceId: Scalars['String']['input'];
};


export type MutationJoinWorkspaceArgs = {
  workspaceId: Scalars['String']['input'];
};


export type MutationMarkInvoiceAsPaidArgs = {
  input: MarkInvoiceAsPaidInput;
};


export type MutationMarkInvoiceAsSentArgs = {
  input: MarkInvoiceAsSentInput;
};


export type MutationRefreshBrandArgs = {
  brandId: Scalars['String']['input'];
};


export type MutationRejectQuoteArgs = {
  quoteId: Scalars['String']['input'];
};


export type MutationRemoveFileFromEntityArgs = {
  file_id: Scalars['String']['input'];
};


export type MutationRemoveSearchRecentArgs = {
  searchDocumentId: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type MutationRemoveTaxLineItemArgs = {
  input: RemoveTaxLineItemInput;
};


export type MutationRemoveUserFromWorkspaceArgs = {
  userId: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type MutationRenameFileArgs = {
  file_id: Scalars['String']['input'];
  new_file_name: Scalars['String']['input'];
};


export type MutationResetSequenceNumberArgs = {
  newValue?: InputMaybe<Scalars['Int']['input']>;
  templateId: Scalars['String']['input'];
};


export type MutationSendQuoteArgs = {
  input: SendQuoteInput;
};


export type MutationSetExpectedRentalEndDateArgs = {
  expectedRentalEndDate: Scalars['DateTime']['input'];
  fulfilmentId: Scalars['ID']['input'];
};


export type MutationSetFulfilmentPurchaseOrderLineItemIdArgs = {
  fulfilmentId: Scalars['ID']['input'];
  purchaseOrderLineItemId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationSetIntakeFormActiveArgs = {
  id: Scalars['String']['input'];
  isActive: Scalars['Boolean']['input'];
};


export type MutationSetInvoiceTaxArgs = {
  input: SetInvoiceTaxInput;
};


export type MutationSetRentalEndDateArgs = {
  fulfilmentId: Scalars['ID']['input'];
  rentalEndDate: Scalars['DateTime']['input'];
};


export type MutationSetRentalStartDateArgs = {
  fulfilmentId: Scalars['ID']['input'];
  rentalStartDate: Scalars['DateTime']['input'];
};


export type MutationSoftDeletePurchaseOrderArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSoftDeletePurchaseOrderLineItemArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSoftDeleteSalesOrderArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSoftDeleteSalesOrderLineItemArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSubmitIntakeFormSubmissionArgs = {
  id: Scalars['String']['input'];
};


export type MutationSubmitPurchaseOrderArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSubmitSalesOrderArgs = {
  id: Scalars['ID']['input'];
};


export type MutationToggleSearchFavoriteArgs = {
  searchDocumentId: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type MutationTouchAllContactsArgs = {
  batchSize?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationUnarchiveWorkspaceArgs = {
  workspaceId: Scalars['String']['input'];
};


export type MutationUnassignInventoryFromRentalFulfilmentArgs = {
  fulfilmentId: Scalars['ID']['input'];
};


export type MutationUpdateBusinessAddressArgs = {
  address: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type MutationUpdateBusinessBrandIdArgs = {
  brandId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
};


export type MutationUpdateBusinessContactArgs = {
  id: Scalars['ID']['input'];
  input: UpdateBusinessContactInput;
};


export type MutationUpdateBusinessNameArgs = {
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};


export type MutationUpdateBusinessPhoneArgs = {
  id: Scalars['ID']['input'];
  phone: Scalars['String']['input'];
};


export type MutationUpdateBusinessTaxIdArgs = {
  id: Scalars['ID']['input'];
  taxId: Scalars['String']['input'];
};


export type MutationUpdateBusinessWebsiteArgs = {
  id: Scalars['ID']['input'];
  website: Scalars['String']['input'];
};


export type MutationUpdateFulfilmentAssigneeArgs = {
  assignedToId?: InputMaybe<Scalars['ID']['input']>;
  fulfilmentId: Scalars['ID']['input'];
};


export type MutationUpdateFulfilmentColumnArgs = {
  fulfilmentId: Scalars['ID']['input'];
  workflowColumnId?: InputMaybe<Scalars['ID']['input']>;
  workflowId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationUpdateIntakeFormArgs = {
  id: Scalars['String']['input'];
  input: UpdateIntakeFormInput;
};


export type MutationUpdateIntakeFormSubmissionArgs = {
  id: Scalars['String']['input'];
  input: UpdateIntakeFormSubmissionInput;
};


export type MutationUpdateIntakeFormSubmissionLineItemArgs = {
  id: Scalars['String']['input'];
  input: IntakeFormLineItemInput;
};


export type MutationUpdateInventoryActualReturnDateArgs = {
  actualReturnDate: Scalars['DateTime']['input'];
  id: Scalars['String']['input'];
};


export type MutationUpdateInventoryExpectedReturnDateArgs = {
  expectedReturnDate: Scalars['DateTime']['input'];
  id: Scalars['String']['input'];
};


export type MutationUpdateInventorySerialisedIdArgs = {
  id: Scalars['String']['input'];
  input: UpdateInventorySerialisedIdInput;
};


export type MutationUpdateNoteArgs = {
  id: Scalars['String']['input'];
  value: Scalars['JSON']['input'];
};


export type MutationUpdatePersonBusinessArgs = {
  businessId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
};


export type MutationUpdatePersonContactArgs = {
  id: Scalars['ID']['input'];
  input: UpdatePersonContactInput;
};


export type MutationUpdatePersonEmailArgs = {
  email: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type MutationUpdatePersonNameArgs = {
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};


export type MutationUpdatePersonPhoneArgs = {
  id: Scalars['ID']['input'];
  phone: Scalars['String']['input'];
};


export type MutationUpdatePersonResourceMapArgs = {
  id: Scalars['ID']['input'];
  resourceMapIds: Array<Scalars['ID']['input']>;
};


export type MutationUpdatePersonRoleArgs = {
  id: Scalars['ID']['input'];
  role: Scalars['String']['input'];
};


export type MutationUpdatePriceBookArgs = {
  input: UpdatePriceBookInput;
};


export type MutationUpdateProjectArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<ProjectInput>;
};


export type MutationUpdateProjectCodeArgs = {
  id: Scalars['String']['input'];
  project_code: Scalars['String']['input'];
};


export type MutationUpdateProjectContactsArgs = {
  id: Scalars['String']['input'];
  project_contacts: Array<ProjectContactInput>;
};


export type MutationUpdateProjectDescriptionArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
};


export type MutationUpdateProjectNameArgs = {
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type MutationUpdateProjectParentProjectArgs = {
  id: Scalars['String']['input'];
  parent_project?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateProjectScopeOfWorkArgs = {
  id: Scalars['String']['input'];
  scope_of_work: Array<ScopeOfWorkEnum>;
};


export type MutationUpdateProjectStatusArgs = {
  id: Scalars['String']['input'];
  status?: InputMaybe<ProjectStatusEnum>;
};


export type MutationUpdatePurchaseOrderArgs = {
  input?: InputMaybe<UpdatePurchaseOrderInput>;
};


export type MutationUpdatePurchaseOrderLineItemArgs = {
  input?: InputMaybe<UpdatePurchaseOrderLineItemInput>;
};


export type MutationUpdateQuoteArgs = {
  input: UpdateQuoteInput;
};


export type MutationUpdateQuoteRevisionArgs = {
  input: UpdateQuoteRevisionInput;
};


export type MutationUpdateQuoteStatusArgs = {
  input: UpdateQuoteStatusInput;
};


export type MutationUpdateRfqArgs = {
  input: UpdateRfqInput;
};


export type MutationUpdateReferenceNumberTemplateArgs = {
  input: UpdateReferenceNumberTemplateInput;
};


export type MutationUpdateRentalPriceArgs = {
  input: UpdateRentalPriceInput;
};


export type MutationUpdateRentalPurchaseOrderLineItemArgs = {
  input?: InputMaybe<UpdateRentalPurchaseOrderLineItemInput>;
};


export type MutationUpdateRentalSalesOrderLineItemArgs = {
  input?: InputMaybe<UpdateRentalSalesOrderLineItemInput>;
};


export type MutationUpdateSalePriceArgs = {
  input: UpdateSalePriceInput;
};


export type MutationUpdateSalePurchaseOrderLineItemArgs = {
  input?: InputMaybe<UpdateSalePurchaseOrderLineItemInput>;
};


export type MutationUpdateSaleSalesOrderLineItemArgs = {
  input?: InputMaybe<UpdateSaleSalesOrderLineItemInput>;
};


export type MutationUpdateSalesOrderArgs = {
  input?: InputMaybe<UpdateSalesOrderInput>;
};


export type MutationUpdateSalesOrderLineItemArgs = {
  input?: InputMaybe<UpdateSalesOrderLineItemInput>;
};


export type MutationUpdateTaxLineItemArgs = {
  input: UpdateTaxLineItemInput;
};


export type MutationUpdateWorkflowConfigurationArgs = {
  id: Scalars['ID']['input'];
  input: UpdateWorkflowConfigurationInput;
};


export type MutationUpdateWorkspaceAccessTypeArgs = {
  accessType: WorkspaceAccessType;
  workspaceId: Scalars['String']['input'];
};


export type MutationUpdateWorkspaceSettingsArgs = {
  bannerImageUrl?: InputMaybe<Scalars['String']['input']>;
  brandId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  workspaceId: Scalars['String']['input'];
};


export type MutationUpdateWorkspaceUserRolesArgs = {
  roles: Array<WorkspaceUserRole>;
  userId: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type MutationUpsertPimCategoryArgs = {
  input: UpsertPimCategoryInput;
};


export type MutationUpsertUserArgs = {
  id: Scalars['String']['input'];
  input: UserUpsertInput;
};

export type Note = {
  __typename?: 'Note';
  _id: Scalars['String']['output'];
  company_id: Scalars['String']['output'];
  created_at: Scalars['DateTime']['output'];
  created_by: Scalars['String']['output'];
  created_by_user?: Maybe<User>;
  deleted: Scalars['Boolean']['output'];
  parent_entity_id: Scalars['String']['output'];
  sub_notes: Array<Note>;
  updated_at: Scalars['DateTime']['output'];
  updated_by: Scalars['String']['output'];
  value: Scalars['JSON']['output'];
  workspace_id: Scalars['String']['output'];
};

export type NoteInput = {
  parent_entity_id: Scalars['String']['input'];
  value: Scalars['JSON']['input'];
  workspace_id: Scalars['String']['input'];
};

export type NoteUpdateInput = {
  id: Scalars['String']['input'];
  value: Scalars['JSON']['input'];
};

export enum PoLineItemStatus {
  Confirmed = 'CONFIRMED',
  Draft = 'DRAFT',
  Submitted = 'SUBMITTED'
}

export enum PoLineItemType {
  Rental = 'RENTAL',
  Sale = 'SALE'
}

export type PageInfoInput = {
  number?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
};

export type PaginationInfo = {
  __typename?: 'PaginationInfo';
  number: Scalars['Int']['output'];
  size: Scalars['Int']['output'];
  totalItems: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export enum PaginationOrder {
  Asc = 'ASC',
  Desc = 'DESC'
}

export enum PermissionType {
  ErpChargeDelete = 'ERP_CHARGE_DELETE',
  ErpChargeRead = 'ERP_CHARGE_READ',
  ErpChargeUpdate = 'ERP_CHARGE_UPDATE',
  ErpContactDelete = 'ERP_CONTACT_DELETE',
  ErpContactRead = 'ERP_CONTACT_READ',
  ErpContactUpdate = 'ERP_CONTACT_UPDATE',
  ErpDomainIsMember = 'ERP_DOMAIN_IS_MEMBER',
  ErpFileDelete = 'ERP_FILE_DELETE',
  ErpFileRead = 'ERP_FILE_READ',
  ErpFileUpdate = 'ERP_FILE_UPDATE',
  ErpFulfilmentDelete = 'ERP_FULFILMENT_DELETE',
  ErpFulfilmentManageRentalPeriod = 'ERP_FULFILMENT_MANAGE_RENTAL_PERIOD',
  ErpFulfilmentRead = 'ERP_FULFILMENT_READ',
  ErpFulfilmentUpdate = 'ERP_FULFILMENT_UPDATE',
  ErpIntakeFormCreateSubmission = 'ERP_INTAKE_FORM_CREATE_SUBMISSION',
  ErpIntakeFormRead = 'ERP_INTAKE_FORM_READ',
  ErpIntakeFormReadSubmissions = 'ERP_INTAKE_FORM_READ_SUBMISSIONS',
  ErpIntakeFormSubmissionRead = 'ERP_INTAKE_FORM_SUBMISSION_READ',
  ErpIntakeFormSubmissionUpdate = 'ERP_INTAKE_FORM_SUBMISSION_UPDATE',
  ErpIntakeFormUpdate = 'ERP_INTAKE_FORM_UPDATE',
  ErpIntakeFormUpdateSubmissions = 'ERP_INTAKE_FORM_UPDATE_SUBMISSIONS',
  ErpInvoiceRead = 'ERP_INVOICE_READ',
  ErpInvoiceUpdate = 'ERP_INVOICE_UPDATE',
  ErpPlatformIsAdmin = 'ERP_PLATFORM_IS_ADMIN',
  ErpPricebookPriceRead = 'ERP_PRICEBOOK_PRICE_READ',
  ErpPricebookPriceUpdate = 'ERP_PRICEBOOK_PRICE_UPDATE',
  ErpPricebookRead = 'ERP_PRICEBOOK_READ',
  ErpPricebookUpdate = 'ERP_PRICEBOOK_UPDATE',
  ErpProjectRead = 'ERP_PROJECT_READ',
  ErpProjectUpdate = 'ERP_PROJECT_UPDATE',
  ErpPurchaseOrderRead = 'ERP_PURCHASE_ORDER_READ',
  ErpPurchaseOrderUpdate = 'ERP_PURCHASE_ORDER_UPDATE',
  ErpQuoteAccept = 'ERP_QUOTE_ACCEPT',
  ErpQuoteRead = 'ERP_QUOTE_READ',
  ErpQuoteReject = 'ERP_QUOTE_REJECT',
  ErpQuoteUpdate = 'ERP_QUOTE_UPDATE',
  ErpRfqRead = 'ERP_RFQ_READ',
  ErpRfqUpdate = 'ERP_RFQ_UPDATE',
  ErpSalesOrderPortalAccess = 'ERP_SALES_ORDER_PORTAL_ACCESS',
  ErpSalesOrderRead = 'ERP_SALES_ORDER_READ',
  ErpSalesOrderUpdate = 'ERP_SALES_ORDER_UPDATE',
  ErpWorkspaceAddUser = 'ERP_WORKSPACE_ADD_USER',
  ErpWorkspaceCanJoin = 'ERP_WORKSPACE_CAN_JOIN',
  ErpWorkspaceCanManageBuyerIntakeFormSubmissions = 'ERP_WORKSPACE_CAN_MANAGE_BUYER_INTAKE_FORM_SUBMISSIONS',
  ErpWorkspaceCanManageCharges = 'ERP_WORKSPACE_CAN_MANAGE_CHARGES',
  ErpWorkspaceCanManageContacts = 'ERP_WORKSPACE_CAN_MANAGE_CONTACTS',
  ErpWorkspaceCanManageFiles = 'ERP_WORKSPACE_CAN_MANAGE_FILES',
  ErpWorkspaceCanManageIntakeForms = 'ERP_WORKSPACE_CAN_MANAGE_INTAKE_FORMS',
  ErpWorkspaceCanManageIntakeFormSubmissions = 'ERP_WORKSPACE_CAN_MANAGE_INTAKE_FORM_SUBMISSIONS',
  ErpWorkspaceCanManageInvoices = 'ERP_WORKSPACE_CAN_MANAGE_INVOICES',
  ErpWorkspaceCanManagePrices = 'ERP_WORKSPACE_CAN_MANAGE_PRICES',
  ErpWorkspaceCanManagePriceBooks = 'ERP_WORKSPACE_CAN_MANAGE_PRICE_BOOKS',
  ErpWorkspaceCanManageProjects = 'ERP_WORKSPACE_CAN_MANAGE_PROJECTS',
  ErpWorkspaceCanManagePurchaseOrders = 'ERP_WORKSPACE_CAN_MANAGE_PURCHASE_ORDERS',
  ErpWorkspaceCanManageQuotes = 'ERP_WORKSPACE_CAN_MANAGE_QUOTES',
  ErpWorkspaceCanManageReferenceNumberTemplates = 'ERP_WORKSPACE_CAN_MANAGE_REFERENCE_NUMBER_TEMPLATES',
  ErpWorkspaceCanManageRfqs = 'ERP_WORKSPACE_CAN_MANAGE_RFQS',
  ErpWorkspaceCanManageSalesOrders = 'ERP_WORKSPACE_CAN_MANAGE_SALES_ORDERS',
  ErpWorkspaceCanReadBuyerIntakeFormSubmissions = 'ERP_WORKSPACE_CAN_READ_BUYER_INTAKE_FORM_SUBMISSIONS',
  ErpWorkspaceCanReadCharges = 'ERP_WORKSPACE_CAN_READ_CHARGES',
  ErpWorkspaceCanReadContacts = 'ERP_WORKSPACE_CAN_READ_CONTACTS',
  ErpWorkspaceCanReadFiles = 'ERP_WORKSPACE_CAN_READ_FILES',
  ErpWorkspaceCanReadInvoices = 'ERP_WORKSPACE_CAN_READ_INVOICES',
  ErpWorkspaceCanReadProjects = 'ERP_WORKSPACE_CAN_READ_PROJECTS',
  ErpWorkspaceCanReadPurchaseOrders = 'ERP_WORKSPACE_CAN_READ_PURCHASE_ORDERS',
  ErpWorkspaceCanReadQuotes = 'ERP_WORKSPACE_CAN_READ_QUOTES',
  ErpWorkspaceCanReadReferenceNumberTemplates = 'ERP_WORKSPACE_CAN_READ_REFERENCE_NUMBER_TEMPLATES',
  ErpWorkspaceCanReadRfqs = 'ERP_WORKSPACE_CAN_READ_RFQS',
  ErpWorkspaceCanReadSalesOrders = 'ERP_WORKSPACE_CAN_READ_SALES_ORDERS',
  ErpWorkspaceCreateIntakeForm = 'ERP_WORKSPACE_CREATE_INTAKE_FORM',
  ErpWorkspaceCreateIntakeFormSubmission = 'ERP_WORKSPACE_CREATE_INTAKE_FORM_SUBMISSION',
  ErpWorkspaceCreatePriceBook = 'ERP_WORKSPACE_CREATE_PRICE_BOOK',
  ErpWorkspaceIsAdmin = 'ERP_WORKSPACE_IS_ADMIN',
  ErpWorkspaceManage = 'ERP_WORKSPACE_MANAGE',
  ErpWorkspaceRead = 'ERP_WORKSPACE_READ',
  ErpWorkspaceReadIntakeForms = 'ERP_WORKSPACE_READ_INTAKE_FORMS',
  ErpWorkspaceReadIntakeFormSubmissions = 'ERP_WORKSPACE_READ_INTAKE_FORM_SUBMISSIONS',
  ErpWorkspaceReadPrices = 'ERP_WORKSPACE_READ_PRICES',
  ErpWorkspaceReadPriceBooks = 'ERP_WORKSPACE_READ_PRICE_BOOKS',
  ErpWorkspaceRemoveUser = 'ERP_WORKSPACE_REMOVE_USER',
  ErpWorkspaceUpdateUserRoles = 'ERP_WORKSPACE_UPDATE_USER_ROLES'
}

export type PersonContact = {
  __typename?: 'PersonContact';
  business?: Maybe<BusinessContact>;
  businessId: Scalars['String']['output'];
  contactType: ContactType;
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  profilePicture?: Maybe<Scalars['String']['output']>;
  resourceMapIds?: Maybe<Array<Scalars['String']['output']>>;
  resource_map_entries: Array<ResourceMapResource>;
  role?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  workspaceId: Scalars['String']['output'];
};

export type PersonContactInput = {
  businessId: Scalars['ID']['input'];
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  profilePicture?: InputMaybe<Scalars['String']['input']>;
  resourceMapIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  role: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};

export type PimCategory = {
  __typename?: 'PimCategory';
  childrenCount?: Maybe<Scalars['Int']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  has_products?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['String']['output'];
  is_deleted?: Maybe<Scalars['Boolean']['output']>;
  name: Scalars['String']['output'];
  path: Scalars['String']['output'];
  platform_id: Scalars['String']['output'];
  productCount?: Maybe<Scalars['Int']['output']>;
  tenant_id: Scalars['String']['output'];
};

export type PimProduct = {
  __typename?: 'PimProduct';
  id?: Maybe<Scalars['String']['output']>;
  is_deleted?: Maybe<Scalars['Boolean']['output']>;
  make?: Maybe<Scalars['String']['output']>;
  manufacturer_part_number?: Maybe<Scalars['String']['output']>;
  model?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  pim_category_id?: Maybe<Scalars['String']['output']>;
  pim_category_path?: Maybe<Scalars['String']['output']>;
  pim_category_platform_id?: Maybe<Scalars['String']['output']>;
  pim_product_id?: Maybe<Scalars['String']['output']>;
  sku?: Maybe<Scalars['String']['output']>;
  tenant_id?: Maybe<Scalars['String']['output']>;
  upc?: Maybe<Scalars['String']['output']>;
  year?: Maybe<Scalars['String']['output']>;
};

export type Price = RentalPrice | SalePrice;

export type PriceBook = {
  __typename?: 'PriceBook';
  businessContact?: Maybe<BusinessContact>;
  businessContactId?: Maybe<Scalars['ID']['output']>;
  comments: Array<Note>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  createdByUser?: Maybe<User>;
  id: Scalars['ID']['output'];
  /** @deprecated soon to be removed */
  isDefault: Scalars['Boolean']['output'];
  listPrices?: Maybe<ListPricesResult>;
  location?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  parentPriceBook?: Maybe<PriceBook>;
  parentPriceBookId?: Maybe<Scalars['ID']['output']>;
  parentPriceBookPercentageFactor?: Maybe<Scalars['Float']['output']>;
  project?: Maybe<Project>;
  projectId?: Maybe<Scalars['ID']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  updatedBy: Scalars['String']['output'];
  updatedByUser?: Maybe<User>;
  workspaceId: Scalars['ID']['output'];
};


export type PriceBookListPricesArgs = {
  filter?: InputMaybe<ListPricesFilter>;
  page: ListPricesPage;
};

export enum PriceType {
  Rental = 'RENTAL',
  Sale = 'SALE'
}

export type Project = {
  __typename?: 'Project';
  /** All price books associated with this project */
  associatedPriceBooks?: Maybe<ListPriceBooksResult>;
  comments: Array<Note>;
  created_at: Scalars['String']['output'];
  created_by: Scalars['String']['output'];
  created_by_user?: Maybe<User>;
  deleted: Scalars['Boolean']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  parent_project?: Maybe<Scalars['String']['output']>;
  project_code: Scalars['String']['output'];
  /** Contacts associated with the project and their relation to the project. */
  project_contacts?: Maybe<Array<ProjectContact>>;
  /** Project scope of work. Allowed values: SITE_CIVIL, FOUNDATIONS, STRUCTURAL_FRAME, BUILDING_ENVELOPE, INTERIOR_BUILD_OUT, MEP, SPECIALTY_SYSTEMS, COMMISSIONING_STARTUP, DEMOBILIZATION_CLOSE_OUT, WARRANTY_SERVICES */
  scope_of_work?: Maybe<Array<Maybe<ScopeOfWorkEnum>>>;
  /** Project status. Allowed values: CONCEPT_OPPORTUNITY, BIDDING_TENDERING, PRE_CONSTRUCTION, MOBILIZATION, ACTIVE_CONSTRUCTION, SUBSTANTIAL_COMPLETION, CLOSE_OUT, WARRANTY_MAINTENANCE, ARCHIVED_CLOSED */
  status?: Maybe<ProjectStatusEnum>;
  /** List of sub-projects (children) for this project. */
  sub_projects?: Maybe<Array<Maybe<Project>>>;
  /** Total count of all descendants (subprojects at all levels) */
  totalDescendantCount: Scalars['Int']['output'];
  updated_at: Scalars['String']['output'];
  updated_by: Scalars['String']['output'];
  updated_by_user?: Maybe<User>;
  workspaceId: Scalars['String']['output'];
};

export type ProjectContact = {
  __typename?: 'ProjectContact';
  contact?: Maybe<Contact>;
  contact_id: Scalars['String']['output'];
  relation_to_project: ProjectContactRelationEnum;
};

export type ProjectContactInput = {
  contact_id: Scalars['String']['input'];
  relation_to_project: ProjectContactRelationEnum;
};

export type ProjectContactRelationCode = {
  __typename?: 'ProjectContactRelationCode';
  code: Scalars['String']['output'];
  description: Scalars['String']['output'];
};

/**
 * Project contact relation to project. Allowed values:
 * - PROJECT_MANAGER_GC: Project Manager (GC)
 * - SITE_SUPERINTENDENT: Site Superintendent
 * - OWNERS_REPRESENTATIVE: Owner’s Representative
 * - ARCHITECT_ENGINEER_OF_RECORD: Architect / Engineer of Record
 * - SAFETY_MANAGER: Safety Manager
 * - EQUIPMENT_RENTAL_COORDINATOR: Equipment / Rental Coordinator
 */
export enum ProjectContactRelationEnum {
  ArchitectEngineerOfRecord = 'ARCHITECT_ENGINEER_OF_RECORD',
  EquipmentRentalCoordinator = 'EQUIPMENT_RENTAL_COORDINATOR',
  OwnersRepresentative = 'OWNERS_REPRESENTATIVE',
  ProjectManagerGc = 'PROJECT_MANAGER_GC',
  SafetyManager = 'SAFETY_MANAGER',
  SiteSuperintendent = 'SITE_SUPERINTENDENT'
}

export type ProjectInput = {
  deleted: Scalars['Boolean']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  /** Optional referential id to a parent project */
  parent_project?: InputMaybe<Scalars['String']['input']>;
  project_code: Scalars['String']['input'];
  /** Contacts associated with the project and their relation to the project. */
  project_contacts?: InputMaybe<Array<ProjectContactInput>>;
  /** Project scope of work. Allowed values: SITE_CIVIL, FOUNDATIONS, STRUCTURAL_FRAME, BUILDING_ENVELOPE, INTERIOR_BUILD_OUT, MEP, SPECIALTY_SYSTEMS, COMMISSIONING_STARTUP, DEMOBILIZATION_CLOSE_OUT, WARRANTY_SERVICES */
  scope_of_work?: InputMaybe<Array<InputMaybe<ScopeOfWorkEnum>>>;
  /** Project status. Allowed values: CONCEPT_OPPORTUNITY, BIDDING_TENDERING, PRE_CONSTRUCTION, MOBILIZATION, ACTIVE_CONSTRUCTION, SUBSTANTIAL_COMPLETION, CLOSE_OUT, WARRANTY_MAINTENANCE, ARCHIVED_CLOSED */
  status?: InputMaybe<ProjectStatusEnum>;
  workspaceId: Scalars['String']['input'];
};

export type ProjectStatusCode = {
  __typename?: 'ProjectStatusCode';
  code: Scalars['String']['output'];
  description: Scalars['String']['output'];
};

/**
 * Project status. Allowed values:
 * - CONCEPT_OPPORTUNITY: CONCEPT / OPPORTUNITY
 * - BIDDING_TENDERING: BIDDING / TENDERING
 * - PRE_CONSTRUCTION: PRE‑CONSTRUCTION
 * - MOBILIZATION: MOBILIZATION
 * - ACTIVE_CONSTRUCTION: ACTIVE CONSTRUCTION
 * - SUBSTANTIAL_COMPLETION: SUBSTANTIAL COMPLETION
 * - CLOSE_OUT: CLOSE‑OUT
 * - WARRANTY_MAINTENANCE: WARRANTY / MAINTENANCE
 * - ARCHIVED_CLOSED: ARCHIVED / CLOSED
 */
export enum ProjectStatusEnum {
  ActiveConstruction = 'ACTIVE_CONSTRUCTION',
  ArchivedClosed = 'ARCHIVED_CLOSED',
  BiddingTendering = 'BIDDING_TENDERING',
  CloseOut = 'CLOSE_OUT',
  ConceptOpportunity = 'CONCEPT_OPPORTUNITY',
  Mobilization = 'MOBILIZATION',
  PreConstruction = 'PRE_CONSTRUCTION',
  SubstantialCompletion = 'SUBSTANTIAL_COMPLETION',
  WarrantyMaintenance = 'WARRANTY_MAINTENANCE'
}

export type PurchaseOrder = {
  __typename?: 'PurchaseOrder';
  comments: Array<Note>;
  /** @deprecated Use workspaceId instead */
  company_id: Scalars['String']['output'];
  created_at: Scalars['String']['output'];
  created_by: Scalars['String']['output'];
  created_by_user?: Maybe<User>;
  deleted_at?: Maybe<Scalars['String']['output']>;
  /** Progress of inventory fulfillment for this purchase order */
  fulfillmentProgress?: Maybe<PurchaseOrderFulfillmentProgress>;
  id: Scalars['String']['output'];
  /** The intake form submission associated with this purchase order */
  intakeFormSubmission?: Maybe<IntakeFormSubmission>;
  /** All inventory items associated with this purchase order */
  inventory: Array<Inventory>;
  line_items?: Maybe<Array<Maybe<PurchaseOrderLineItem>>>;
  /** Pricing summary for the sales order */
  pricing?: Maybe<PurchaseOrderPricing>;
  project?: Maybe<Project>;
  project_id?: Maybe<Scalars['String']['output']>;
  purchase_order_number: Scalars['String']['output'];
  quote_id?: Maybe<Scalars['String']['output']>;
  quote_revision_id?: Maybe<Scalars['String']['output']>;
  seller?: Maybe<Contact>;
  seller_id: Scalars['String']['output'];
  /** Status of the purchase order */
  status: PurchaseOrderStatus;
  updated_at: Scalars['String']['output'];
  updated_by: Scalars['String']['output'];
  updated_by_user?: Maybe<User>;
  workspace_id?: Maybe<Scalars['String']['output']>;
};

export type PurchaseOrderFulfillmentProgress = {
  __typename?: 'PurchaseOrderFulfillmentProgress';
  /** Percentage of items received (0-100) */
  fulfillmentPercentage: Scalars['Float']['output'];
  /** True when all items have been received */
  isFullyFulfilled: Scalars['Boolean']['output'];
  /** True when some but not all items have been received */
  isPartiallyFulfilled: Scalars['Boolean']['output'];
  /** Number of inventory items still on order */
  onOrderItems: Scalars['Int']['output'];
  /** Number of inventory items that have been received */
  receivedItems: Scalars['Int']['output'];
  /** Human-readable fulfillment status */
  status: Scalars['String']['output'];
  /** Total number of inventory items for this purchase order */
  totalItems: Scalars['Int']['output'];
};

export type PurchaseOrderInput = {
  project_id?: InputMaybe<Scalars['String']['input']>;
  purchase_order_number?: InputMaybe<Scalars['String']['input']>;
  seller_id: Scalars['String']['input'];
  workspace_id: Scalars['String']['input'];
};

export type PurchaseOrderLineItem = RentalPurchaseOrderLineItem | SalePurchaseOrderLineItem;

export type PurchaseOrderLineItemPriceEstimate = {
  __typename?: 'PurchaseOrderLineItemPriceEstimate';
  costInCents?: Maybe<Scalars['Int']['output']>;
  /** Delivery cost in cents for this line item */
  delivery_cost_in_cents?: Maybe<Scalars['Int']['output']>;
  details?: Maybe<LineItemCostOptionDetails>;
  /** Forecast of accumulative cost over a range of days */
  forecast?: Maybe<LineItemPriceForecast>;
  rentalPeriod?: Maybe<LineItemRentalPeriod>;
  savingsComparedToDayRateInCents?: Maybe<Scalars['Int']['output']>;
  savingsComparedToDayRateInFraction?: Maybe<Scalars['Float']['output']>;
  savingsComparedToExactSplitInCents?: Maybe<Scalars['Int']['output']>;
  strategy?: Maybe<Scalars['String']['output']>;
  /** Total cost including delivery in cents for this line item */
  total_including_delivery_in_cents?: Maybe<Scalars['Int']['output']>;
};


export type PurchaseOrderLineItemPriceEstimateForecastArgs = {
  number_of_days?: InputMaybe<Scalars['Int']['input']>;
};

export type PurchaseOrderListResult = {
  __typename?: 'PurchaseOrderListResult';
  items: Array<PurchaseOrder>;
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type PurchaseOrderPricing = {
  __typename?: 'PurchaseOrderPricing';
  /** Sum of all line item totals (pre-tax) */
  sub_total_in_cents?: Maybe<Scalars['Int']['output']>;
  /** Total amount (same as sub_total_in_cents, no tax included) */
  total_in_cents?: Maybe<Scalars['Int']['output']>;
};

export enum PurchaseOrderStatus {
  Draft = 'DRAFT',
  Submitted = 'SUBMITTED'
}

export type Query = {
  __typename?: 'Query';
  /** Admin operations (Admin only) */
  admin?: Maybe<AdminQueryNamespace>;
  bulkCalculateSubTotal: Array<LineItemPriceForecast>;
  calculateSubTotal: LineItemPriceForecast;
  getBrandByDomain?: Maybe<Brand>;
  getBrandById?: Maybe<Brand>;
  getBrandsByIds?: Maybe<Array<Maybe<Brand>>>;
  getBulkSearchDocumentsById: Array<Maybe<SearchDocument>>;
  getContactById?: Maybe<Contact>;
  getCurrentSequenceNumber: Scalars['Int']['output'];
  getCurrentUser?: Maybe<User>;
  getDefaultTemplates: Array<ReferenceNumberTemplate>;
  getFulfilmentById?: Maybe<Fulfilment>;
  /** Get a single intake form by ID */
  getIntakeFormById?: Maybe<IntakeForm>;
  /** Get a single intake form submission by ID */
  getIntakeFormSubmissionById?: Maybe<IntakeFormSubmission>;
  /** Get an intake form submission by purchase order ID */
  getIntakeFormSubmissionByPurchaseOrderId?: Maybe<IntakeFormSubmission>;
  /** Get an intake form submission by sales order ID */
  getIntakeFormSubmissionBySalesOrderId?: Maybe<IntakeFormSubmission>;
  /** Get a single intake form submission line item by ID */
  getIntakeFormSubmissionLineItem?: Maybe<IntakeFormLineItem>;
  getInventoryReservationById?: Maybe<InventoryReservation>;
  getNoteById?: Maybe<Note>;
  getPimCategoryById?: Maybe<PimCategory>;
  getPimProductById?: Maybe<PimProduct>;
  getPriceBookById?: Maybe<PriceBook>;
  getPriceById?: Maybe<Price>;
  getProjectById?: Maybe<Project>;
  getPurchaseOrderById?: Maybe<PurchaseOrder>;
  getPurchaseOrderLineItemById?: Maybe<PurchaseOrderLineItem>;
  getReferenceNumberTemplate?: Maybe<ReferenceNumberTemplate>;
  /** Get a single resource map entry by id, with tenant check */
  getResourceMapEntry?: Maybe<ResourceMapResource>;
  getSalesOrderById?: Maybe<SalesOrder>;
  getSalesOrderLineItemById?: Maybe<SalesOrderLineItem>;
  getSearchDocumentByDocumentId?: Maybe<SearchDocument>;
  getSearchDocumentById?: Maybe<SearchDocument>;
  getSearchUserState?: Maybe<SearchUserState>;
  getSignedUploadUrl: SignedUploadUrl;
  getUsersById?: Maybe<Array<Maybe<User>>>;
  getWorkflowConfigurationById?: Maybe<WorkflowConfiguration>;
  getWorkspaceById?: Maybe<Workspace>;
  helloWorld?: Maybe<Scalars['String']['output']>;
  inventoryById?: Maybe<Inventory>;
  invoiceById?: Maybe<Invoice>;
  listAssetSchedules?: Maybe<AssetScheduleListResult>;
  listAssets?: Maybe<ListAssetsResult>;
  listCharges?: Maybe<ChargePage>;
  listContacts?: Maybe<ListContactsResult>;
  listFilesByEntityId: Array<File>;
  listFulfilments?: Maybe<ListFulfilmentsResult>;
  /** List all line items for an intake form submission */
  listIntakeFormSubmissionLineItems: Array<IntakeFormLineItem>;
  /** List all intake form submissions for a workspace with pagination */
  listIntakeFormSubmissions?: Maybe<IntakeFormSubmissionPage>;
  /** List all intake form submissions for a buyer workspace with pagination */
  listIntakeFormSubmissionsAsBuyer?: Maybe<IntakeFormSubmissionPage>;
  /** List all intake forms for a workspace with pagination */
  listIntakeForms?: Maybe<IntakeFormPage>;
  /** List all intake forms that a user has access to with pagination */
  listIntakeFormsForUser?: Maybe<IntakeFormPage>;
  listInventory: InventoryResponse;
  listInventoryGroupedByPimCategoryId: InventoryGroupedByCategoryResponse;
  listInventoryReservations: InventoryReservationsResponse;
  listInvoices: InvoicesResponse;
  listJoinableWorkspaces: ListWorkspacesResult;
  /** List intake form submissions created by the authenticated user that have no buyer workspace assigned. */
  listMyOrphanedSubmissions: Array<IntakeFormSubmission>;
  listNotesByEntityId: Array<Note>;
  listPimCategories?: Maybe<ListPimCategoriesResult>;
  listPimProducts?: Maybe<ListPimProductsResult>;
  listPriceBookCategories: Array<PimCategory>;
  listPriceBooks?: Maybe<ListPriceBooksResult>;
  listPriceNames: Array<Scalars['String']['output']>;
  listPrices?: Maybe<ListPricesResult>;
  /** Lists all possible project contact relation codes and their descriptions. */
  listProjectContactRelationCodes?: Maybe<Array<Maybe<ProjectContactRelationCode>>>;
  /** Lists all possible project status codes and their descriptions, including recommended usage and stage meaning. */
  listProjectStatusCodes?: Maybe<Array<Maybe<ProjectStatusCode>>>;
  listProjects?: Maybe<Array<Maybe<Project>>>;
  listProjectsByParentProjectId?: Maybe<Array<Maybe<Project>>>;
  listPurchaseOrders?: Maybe<PurchaseOrderListResult>;
  listQuotes: QuotesResponse;
  listRFQs: ListRfQsResult;
  listReferenceNumberTemplates: Array<ReferenceNumberTemplate>;
  listRentalFulfilments?: Maybe<ListRentalFulfilmentsResult>;
  listRentalViews?: Maybe<ListRentalViewsResult>;
  /** Get all resource map entries filtered by tenant_id (from the calling user company id) */
  listResourceMapEntries?: Maybe<Array<Maybe<ResourceMapResource>>>;
  /** List resource map entities by parent_id (with tenant scoping) */
  listResourceMapEntriesByParentId?: Maybe<Array<Maybe<ResourceMapResource>>>;
  /** List resource map entries filtered by tag type */
  listResourceMapEntriesByTagType?: Maybe<Array<Maybe<ResourceMapResource>>>;
  listSalesOrders?: Maybe<SalesOrderListResult>;
  /** Lists all possible scope_of_work codes and their descriptions, including recommended usage and stage meaning. */
  listScopeOfWorkCodes?: Maybe<Array<Maybe<ScopeOfWorkCode>>>;
  /** Lists all top-level projects (where parent_project is null). */
  listTopLevelProjects?: Maybe<Array<Maybe<Project>>>;
  listTransactions: ListTransactionResult;
  listUserResourcePermissions: ListUserPermissionsResult;
  listWorkflowConfigurations?: Maybe<ListWorkflowConfigurationsResult>;
  listWorkspaceMembers: ListWorkspaceMembersResult;
  listWorkspaces: ListWorkspacesResult;
  llm?: Maybe<Llm>;
  quoteById?: Maybe<Quote>;
  quoteRevisionById?: Maybe<QuoteRevision>;
  rfqById?: Maybe<Rfq>;
  searchBrands?: Maybe<Array<Maybe<BrandSearchResult>>>;
  searchDocuments: SearchDocumentsResult;
  usersSearch?: Maybe<Array<Maybe<User>>>;
  validEnterpriseDomain: ValidEnterpriseDomainResult;
};


export type QueryBulkCalculateSubTotalArgs = {
  inputs: Array<BulkCalculateSubTotalInput>;
};


export type QueryCalculateSubTotalArgs = {
  durationInDays: Scalars['Int']['input'];
  priceId: Scalars['ID']['input'];
};


export type QueryGetBrandByDomainArgs = {
  domain: Scalars['String']['input'];
};


export type QueryGetBrandByIdArgs = {
  brandId: Scalars['String']['input'];
};


export type QueryGetBrandsByIdsArgs = {
  brandIds: Array<Scalars['String']['input']>;
};


export type QueryGetBulkSearchDocumentsByIdArgs = {
  ids: Array<Scalars['String']['input']>;
};


export type QueryGetContactByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetCurrentSequenceNumberArgs = {
  templateId: Scalars['String']['input'];
  type: ReferenceNumberType;
  workspaceId: Scalars['String']['input'];
};


export type QueryGetDefaultTemplatesArgs = {
  workspaceId: Scalars['String']['input'];
};


export type QueryGetFulfilmentByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetIntakeFormByIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetIntakeFormSubmissionByIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetIntakeFormSubmissionByPurchaseOrderIdArgs = {
  purchaseOrderId: Scalars['String']['input'];
};


export type QueryGetIntakeFormSubmissionBySalesOrderIdArgs = {
  salesOrderId: Scalars['String']['input'];
};


export type QueryGetIntakeFormSubmissionLineItemArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetInventoryReservationByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetNoteByIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetPimCategoryByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetPimProductByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetPriceBookByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetPriceByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetProjectByIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetPurchaseOrderByIdArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetPurchaseOrderLineItemByIdArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetReferenceNumberTemplateArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetResourceMapEntryArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetSalesOrderByIdArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetSalesOrderLineItemByIdArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetSearchDocumentByDocumentIdArgs = {
  documentId: Scalars['String']['input'];
};


export type QueryGetSearchDocumentByIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetSearchUserStateArgs = {
  workspaceId: Scalars['String']['input'];
};


export type QueryGetSignedUploadUrlArgs = {
  contentType: SupportedContentType;
  originalFilename?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetUsersByIdArgs = {
  userIds: Array<Scalars['String']['input']>;
};


export type QueryGetWorkflowConfigurationByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetWorkspaceByIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryInventoryByIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryInvoiceByIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryListAssetSchedulesArgs = {
  asset_id?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  project_id?: InputMaybe<Scalars['String']['input']>;
};


export type QueryListAssetsArgs = {
  page?: InputMaybe<ListAssetsPage>;
};


export type QueryListChargesArgs = {
  filter: ListChargesFilter;
  page?: InputMaybe<PageInfoInput>;
};


export type QueryListContactsArgs = {
  filter: ListContactsFilter;
  page?: InputMaybe<ListContactsPage>;
};


export type QueryListFilesByEntityIdArgs = {
  parent_entity_id: Scalars['String']['input'];
  workspace_id: Scalars['String']['input'];
};


export type QueryListFulfilmentsArgs = {
  filter: ListFulfilmentsFilter;
  page?: InputMaybe<ListFulfilmentsPage>;
};


export type QueryListIntakeFormSubmissionLineItemsArgs = {
  submissionId: Scalars['String']['input'];
};


export type QueryListIntakeFormSubmissionsArgs = {
  excludeWithSalesOrder?: InputMaybe<Scalars['Boolean']['input']>;
  intakeFormId?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  workspaceId: Scalars['String']['input'];
};


export type QueryListIntakeFormSubmissionsAsBuyerArgs = {
  buyerWorkspaceId: Scalars['String']['input'];
  intakeFormId?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryListIntakeFormsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  workspaceId: Scalars['String']['input'];
};


export type QueryListIntakeFormsForUserArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryListInventoryArgs = {
  query?: InputMaybe<ListInventoryQuery>;
};


export type QueryListInventoryGroupedByPimCategoryIdArgs = {
  query?: InputMaybe<ListInventoryQuery>;
};


export type QueryListInventoryReservationsArgs = {
  filter?: InputMaybe<ListInventoryReservationsFilter>;
  page?: InputMaybe<ListInventoryPage>;
};


export type QueryListInvoicesArgs = {
  query?: InputMaybe<ListInvoicesQuery>;
};


export type QueryListNotesByEntityIdArgs = {
  parent_entity_id: Scalars['String']['input'];
};


export type QueryListPimCategoriesArgs = {
  filter?: InputMaybe<ListPimCategoriesFilter>;
  page?: InputMaybe<ListPimCategoriesPage>;
};


export type QueryListPimProductsArgs = {
  filter?: InputMaybe<ListPimProductsFilter>;
  page?: InputMaybe<ListPimProductsPage>;
};


export type QueryListPriceBookCategoriesArgs = {
  priceBookId?: InputMaybe<Scalars['String']['input']>;
  workspaceId: Scalars['ID']['input'];
};


export type QueryListPriceBooksArgs = {
  filter: ListPriceBooksFilter;
  page: ListPriceBooksPage;
};


export type QueryListPriceNamesArgs = {
  pimCategoryId?: InputMaybe<Scalars['String']['input']>;
  priceBookId?: InputMaybe<Scalars['String']['input']>;
  workspaceId: Scalars['ID']['input'];
};


export type QueryListPricesArgs = {
  filter: ListPricesFilter;
  page: ListPricesPage;
};


export type QueryListProjectsArgs = {
  workspaceId: Scalars['String']['input'];
};


export type QueryListProjectsByParentProjectIdArgs = {
  parent_project: Scalars['String']['input'];
};


export type QueryListPurchaseOrdersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  workspaceId: Scalars['String']['input'];
};


export type QueryListQuotesArgs = {
  query?: InputMaybe<ListQuotesQuery>;
};


export type QueryListRfQsArgs = {
  filter: ListRfQsFilter;
  page: ListRfQsPage;
};


export type QueryListReferenceNumberTemplatesArgs = {
  filter: ReferenceNumberTemplateFilterInput;
  page?: InputMaybe<PageInfoInput>;
};


export type QueryListRentalFulfilmentsArgs = {
  filter: ListRentalFulfilmentsFilter;
  page?: InputMaybe<ListFulfilmentsPage>;
};


export type QueryListRentalViewsArgs = {
  filter?: InputMaybe<RentalViewFilterInput>;
  page?: InputMaybe<ListRentalViewsPageInput>;
};


export type QueryListResourceMapEntriesByParentIdArgs = {
  parent_id: Scalars['String']['input'];
};


export type QueryListResourceMapEntriesByTagTypeArgs = {
  types: Array<ResourceMapTagType>;
};


export type QueryListSalesOrdersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  workspaceId: Scalars['String']['input'];
};


export type QueryListTopLevelProjectsArgs = {
  workspaceId: Scalars['String']['input'];
};


export type QueryListTransactionsArgs = {
  workspaceId: Scalars['ID']['input'];
};


export type QueryListUserResourcePermissionsArgs = {
  resourceId: Scalars['ID']['input'];
  resourceType: ResourceType;
};


export type QueryListWorkflowConfigurationsArgs = {
  page?: InputMaybe<ListWorkflowConfigurationsPage>;
};


export type QueryListWorkspaceMembersArgs = {
  workspaceId: Scalars['String']['input'];
};


export type QueryQuoteByIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryQuoteRevisionByIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryRfqByIdArgs = {
  id: Scalars['String']['input'];
};


export type QuerySearchBrandsArgs = {
  query: Scalars['String']['input'];
};


export type QuerySearchDocumentsArgs = {
  collections?: InputMaybe<Array<SearchableCollectionType>>;
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  searchText?: InputMaybe<Scalars['String']['input']>;
  workspaceId: Scalars['String']['input'];
};


export type QueryUsersSearchArgs = {
  searchTerm?: InputMaybe<Scalars['String']['input']>;
};


export type QueryValidEnterpriseDomainArgs = {
  domain: Scalars['String']['input'];
};

export type Quote = {
  __typename?: 'Quote';
  /** Buyer's full legal name as provided when accepting the quote */
  buyerAcceptedFullLegalName?: Maybe<Scalars['String']['output']>;
  buyerUserId?: Maybe<Scalars['String']['output']>;
  buyerWorkspaceId?: Maybe<Scalars['String']['output']>;
  buyersProject?: Maybe<Project>;
  buyersProjectId?: Maybe<Scalars['String']['output']>;
  buyersSellerContact?: Maybe<Contact>;
  buyersSellerContactId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  createdByUser?: Maybe<User>;
  currentRevision?: Maybe<QuoteRevision>;
  currentRevisionId?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  /** The intake form submission this quote was generated from */
  intakeFormSubmission?: Maybe<IntakeFormSubmission>;
  intakeFormSubmissionId?: Maybe<Scalars['String']['output']>;
  rfqId?: Maybe<Scalars['String']['output']>;
  sellerWorkspaceId: Scalars['String']['output'];
  sellersBuyerContact?: Maybe<Contact>;
  sellersBuyerContactId: Scalars['String']['output'];
  sellersProject?: Maybe<Project>;
  sellersProjectId: Scalars['String']['output'];
  /** Temporary signed URL to view the signature (valid for 15 minutes) */
  signatureUrl?: Maybe<Scalars['String']['output']>;
  status: QuoteStatus;
  updatedAt: Scalars['DateTime']['output'];
  updatedBy: Scalars['String']['output'];
  updatedByUser?: Maybe<User>;
  validUntil?: Maybe<Scalars['DateTime']['output']>;
};

export enum QuoteLineItemDeliveryMethod {
  Delivery = 'DELIVERY',
  Pickup = 'PICKUP'
}

export enum QuoteLineItemType {
  Rental = 'RENTAL',
  Sale = 'SALE',
  Service = 'SERVICE'
}

export type QuoteRevision = {
  __typename?: 'QuoteRevision';
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  createdByUser?: Maybe<User>;
  hasUnpricedLineItems: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  lineItems: Array<QuoteRevisionLineItem>;
  quoteId: Scalars['String']['output'];
  revisionNumber: Scalars['Int']['output'];
  status: RevisionStatus;
  updatedAt: Scalars['DateTime']['output'];
  updatedBy: Scalars['String']['output'];
  updatedByUser?: Maybe<User>;
  validUntil?: Maybe<Scalars['DateTime']['output']>;
};

export type QuoteRevisionLineItem = QuoteRevisionRentalLineItem | QuoteRevisionSaleLineItem | QuoteRevisionServiceLineItem;

export type QuoteRevisionLineItemInput = {
  deliveryLocation?: InputMaybe<Scalars['String']['input']>;
  deliveryMethod?: InputMaybe<QuoteLineItemDeliveryMethod>;
  deliveryNotes?: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  intakeFormSubmissionLineItemId?: InputMaybe<Scalars['String']['input']>;
  pimCategoryId?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
  rentalEndDate?: InputMaybe<Scalars['DateTime']['input']>;
  rentalStartDate?: InputMaybe<Scalars['DateTime']['input']>;
  sellersPriceId?: InputMaybe<Scalars['ID']['input']>;
  type: QuoteLineItemType;
};

export type QuoteRevisionRentalLineItem = {
  __typename?: 'QuoteRevisionRentalLineItem';
  deliveryLocation?: Maybe<Scalars['String']['output']>;
  deliveryMethod?: Maybe<QuoteLineItemDeliveryMethod>;
  deliveryNotes?: Maybe<Scalars['String']['output']>;
  description: Scalars['String']['output'];
  id?: Maybe<Scalars['String']['output']>;
  intakeFormSubmissionLineItem?: Maybe<IntakeFormLineItem>;
  intakeFormSubmissionLineItemId?: Maybe<Scalars['String']['output']>;
  pimCategory?: Maybe<PimCategory>;
  pimCategoryId: Scalars['String']['output'];
  price?: Maybe<Price>;
  quantity: Scalars['Int']['output'];
  rentalEndDate: Scalars['DateTime']['output'];
  rentalStartDate: Scalars['DateTime']['output'];
  sellersPriceId?: Maybe<Scalars['ID']['output']>;
  subtotalInCents: Scalars['Int']['output'];
  type: QuoteLineItemType;
};

export type QuoteRevisionSaleLineItem = {
  __typename?: 'QuoteRevisionSaleLineItem';
  deliveryLocation?: Maybe<Scalars['String']['output']>;
  deliveryMethod?: Maybe<QuoteLineItemDeliveryMethod>;
  deliveryNotes?: Maybe<Scalars['String']['output']>;
  description: Scalars['String']['output'];
  id?: Maybe<Scalars['String']['output']>;
  intakeFormSubmissionLineItem?: Maybe<IntakeFormLineItem>;
  intakeFormSubmissionLineItemId?: Maybe<Scalars['String']['output']>;
  pimCategory?: Maybe<PimCategory>;
  pimCategoryId: Scalars['String']['output'];
  price?: Maybe<Price>;
  quantity: Scalars['Int']['output'];
  sellersPriceId?: Maybe<Scalars['ID']['output']>;
  subtotalInCents: Scalars['Int']['output'];
  type: QuoteLineItemType;
};

export type QuoteRevisionServiceLineItem = {
  __typename?: 'QuoteRevisionServiceLineItem';
  deliveryLocation?: Maybe<Scalars['String']['output']>;
  deliveryMethod?: Maybe<QuoteLineItemDeliveryMethod>;
  deliveryNotes?: Maybe<Scalars['String']['output']>;
  description: Scalars['String']['output'];
  id?: Maybe<Scalars['String']['output']>;
  intakeFormSubmissionLineItem?: Maybe<IntakeFormLineItem>;
  intakeFormSubmissionLineItemId?: Maybe<Scalars['String']['output']>;
  price?: Maybe<Price>;
  quantity: Scalars['Int']['output'];
  sellersPriceId?: Maybe<Scalars['ID']['output']>;
  subtotalInCents: Scalars['Int']['output'];
  type: QuoteLineItemType;
};

export enum QuoteStatus {
  Accepted = 'ACCEPTED',
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Expired = 'EXPIRED',
  Rejected = 'REJECTED'
}

export type QuotesResponse = {
  __typename?: 'QuotesResponse';
  items: Array<Quote>;
};

export type Rfq = {
  __typename?: 'RFQ';
  buyersWorkspaceId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  createdByUser?: Maybe<User>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  invitedSellerContactIds: Array<Scalars['String']['output']>;
  invitedSellerContacts?: Maybe<Array<Contact>>;
  lineItems: Array<RfqLineItem>;
  responseDeadline?: Maybe<Scalars['DateTime']['output']>;
  status: RfqStatus;
  updatedAt: Scalars['DateTime']['output'];
  updatedBy: Scalars['String']['output'];
  updatedByUser?: Maybe<User>;
};

export type RfqLineItem = RfqRentalLineItem | RfqSaleLineItem | RfqServiceLineItem;

export type RfqLineItemInput = {
  description: Scalars['String']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  pimCategoryId?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
  rentalEndDate?: InputMaybe<Scalars['DateTime']['input']>;
  rentalStartDate?: InputMaybe<Scalars['DateTime']['input']>;
  type: QuoteLineItemType;
};

export type RfqRentalLineItem = {
  __typename?: 'RFQRentalLineItem';
  description: Scalars['String']['output'];
  id?: Maybe<Scalars['String']['output']>;
  pimCategory?: Maybe<PimCategory>;
  pimCategoryId: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
  rentalEndDate: Scalars['DateTime']['output'];
  rentalStartDate: Scalars['DateTime']['output'];
  type: QuoteLineItemType;
};

export type RfqSaleLineItem = {
  __typename?: 'RFQSaleLineItem';
  description: Scalars['String']['output'];
  id?: Maybe<Scalars['String']['output']>;
  pimCategory?: Maybe<PimCategory>;
  pimCategoryId: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
  type: QuoteLineItemType;
};

export type RfqServiceLineItem = {
  __typename?: 'RFQServiceLineItem';
  description: Scalars['String']['output'];
  id?: Maybe<Scalars['String']['output']>;
  quantity: Scalars['Int']['output'];
  type: QuoteLineItemType;
};

export enum RfqStatus {
  Accepted = 'ACCEPTED',
  Cancelled = 'CANCELLED',
  Draft = 'DRAFT',
  Expired = 'EXPIRED',
  Rejected = 'REJECTED',
  Sent = 'SENT'
}

export type ReferenceNumberTemplate = {
  __typename?: 'ReferenceNumberTemplate';
  businessContact?: Maybe<Contact>;
  businessContactId?: Maybe<Scalars['String']['output']>;
  /** @deprecated Use workspaceId instead */
  companyId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  createdByUser?: Maybe<User>;
  deleted: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  project?: Maybe<Project>;
  projectId?: Maybe<Scalars['String']['output']>;
  resetFrequency: ResetFrequency;
  seqPadding?: Maybe<Scalars['Int']['output']>;
  startAt?: Maybe<Scalars['Int']['output']>;
  template: Scalars['String']['output'];
  type: ReferenceNumberType;
  updatedAt: Scalars['DateTime']['output'];
  updatedBy: Scalars['String']['output'];
  updatedByUser?: Maybe<User>;
  useGlobalSequence: Scalars['Boolean']['output'];
  workspaceId: Scalars['String']['output'];
};

export type ReferenceNumberTemplateFilterInput = {
  businessContactId?: InputMaybe<Scalars['String']['input']>;
  projectId?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<ReferenceNumberType>;
  workspaceId: Scalars['String']['input'];
};

export enum ReferenceNumberType {
  Invoice = 'INVOICE',
  Po = 'PO',
  So = 'SO'
}

export type RemoveTaxLineItemInput = {
  invoiceId: Scalars['ID']['input'];
  taxLineItemId: Scalars['ID']['input'];
};

export type RentalFulfilment = FulfilmentBase & {
  __typename?: 'RentalFulfilment';
  assignedTo?: Maybe<User>;
  assignedToId?: Maybe<Scalars['ID']['output']>;
  /** @deprecated CompanyId is deprecated and will be removed in future versions. Use workspaceId instead. */
  companyId?: Maybe<Scalars['ID']['output']>;
  contact?: Maybe<Contact>;
  contactId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  expectedRentalEndDate?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  inventory?: Maybe<Inventory>;
  inventoryId?: Maybe<Scalars['ID']['output']>;
  lastChargedAt?: Maybe<Scalars['DateTime']['output']>;
  pimCategory?: Maybe<PimCategory>;
  pimCategoryId?: Maybe<Scalars['ID']['output']>;
  pimCategoryName?: Maybe<Scalars['String']['output']>;
  pimCategoryPath?: Maybe<Scalars['String']['output']>;
  pimProduct?: Maybe<PimProduct>;
  pimProductId?: Maybe<Scalars['ID']['output']>;
  price?: Maybe<Price>;
  priceId?: Maybe<Scalars['ID']['output']>;
  priceName?: Maybe<Scalars['String']['output']>;
  pricePerDayInCents: Scalars['Int']['output'];
  pricePerMonthInCents: Scalars['Int']['output'];
  pricePerWeekInCents: Scalars['Int']['output'];
  project?: Maybe<Project>;
  projectId?: Maybe<Scalars['ID']['output']>;
  purchaseOrderLineItem?: Maybe<PurchaseOrderLineItem>;
  purchaseOrderLineItemId?: Maybe<Scalars['ID']['output']>;
  purchaseOrderNumber: Scalars['String']['output'];
  rentalEndDate?: Maybe<Scalars['DateTime']['output']>;
  rentalStartDate?: Maybe<Scalars['DateTime']['output']>;
  salesOrder?: Maybe<SalesOrder>;
  salesOrderId: Scalars['ID']['output'];
  salesOrderLineItem?: Maybe<SalesOrderLineItem>;
  salesOrderLineItemId: Scalars['ID']['output'];
  salesOrderPONumber?: Maybe<Scalars['String']['output']>;
  salesOrderType: FulfilmentType;
  updatedAt: Scalars['DateTime']['output'];
  workflowColumnId?: Maybe<Scalars['ID']['output']>;
  workflowId?: Maybe<Scalars['ID']['output']>;
  workspaceId: Scalars['ID']['output'];
};

export type RentalMaterializedView = {
  __typename?: 'RentalMaterializedView';
  asset?: Maybe<RentalViewAsset>;
  details?: Maybe<RentalViewDetails>;
  order?: Maybe<RentalViewOrder>;
  rentalId: Scalars['String']['output'];
  status?: Maybe<RentalViewStatus>;
};

export type RentalPrice = {
  __typename?: 'RentalPrice';
  calculateSubTotal: LineItemPriceForecast;
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  parentPrice?: Maybe<Price>;
  parentPriceId?: Maybe<Scalars['ID']['output']>;
  parentPriceIdPercentageFactor?: Maybe<Scalars['Float']['output']>;
  pimCategory?: Maybe<PimCategory>;
  pimCategoryId: Scalars['String']['output'];
  pimCategoryName: Scalars['String']['output'];
  pimCategoryPath: Scalars['String']['output'];
  pimProduct?: Maybe<PimProduct>;
  pimProductId?: Maybe<Scalars['ID']['output']>;
  priceBook?: Maybe<PriceBook>;
  priceBookId?: Maybe<Scalars['ID']['output']>;
  pricePerDayInCents: Scalars['Int']['output'];
  pricePerMonthInCents: Scalars['Int']['output'];
  pricePerWeekInCents: Scalars['Int']['output'];
  priceType: PriceType;
  updatedAt: Scalars['DateTime']['output'];
  workspaceId: Scalars['ID']['output'];
};


export type RentalPriceCalculateSubTotalArgs = {
  durationInDays: Scalars['Int']['input'];
};

export type RentalPurchaseOrderLineItem = {
  __typename?: 'RentalPurchaseOrderLineItem';
  /** Full calculated price estimate for the line item (fixed or unfixed term) */
  calulate_price?: Maybe<PurchaseOrderLineItemPriceEstimate>;
  company_id?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  created_by?: Maybe<Scalars['String']['output']>;
  created_by_user?: Maybe<User>;
  deleted_at?: Maybe<Scalars['String']['output']>;
  deliveryNotes?: Maybe<Scalars['String']['output']>;
  delivery_charge_in_cents?: Maybe<Scalars['Int']['output']>;
  delivery_date?: Maybe<Scalars['String']['output']>;
  delivery_location?: Maybe<Scalars['String']['output']>;
  delivery_method?: Maybe<DeliveryMethod>;
  id: Scalars['String']['output'];
  /** Inventory items associated with this line item */
  inventory: Array<Inventory>;
  lineitem_status?: Maybe<PoLineItemStatus>;
  lineitem_type: PoLineItemType;
  off_rent_date?: Maybe<Scalars['String']['output']>;
  po_pim_id?: Maybe<Scalars['String']['output']>;
  po_quantity?: Maybe<Scalars['Int']['output']>;
  price?: Maybe<Price>;
  price_id?: Maybe<Scalars['String']['output']>;
  purchaseOrder?: Maybe<PurchaseOrder>;
  purchase_order_id: Scalars['String']['output'];
  quote_revision_line_item_id?: Maybe<Scalars['String']['output']>;
  so_pim_category?: Maybe<PimCategory>;
  so_pim_product?: Maybe<PimProduct>;
  /** Total days on rent (inclusive of start date, exclusive of end date) */
  totalDaysOnRent?: Maybe<Scalars['Int']['output']>;
  updated_at?: Maybe<Scalars['String']['output']>;
  updated_by?: Maybe<Scalars['String']['output']>;
  updated_by_user?: Maybe<User>;
};

export type RentalSalesOrderLineItem = {
  __typename?: 'RentalSalesOrderLineItem';
  /** Full calculated price estimate for the line item (fixed or unfixed term) */
  calulate_price?: Maybe<SalesOrderLineItemPriceEstimate>;
  company_id?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  created_by?: Maybe<Scalars['String']['output']>;
  created_by_user?: Maybe<User>;
  deleted_at?: Maybe<Scalars['String']['output']>;
  deliveryNotes?: Maybe<Scalars['String']['output']>;
  delivery_charge_in_cents?: Maybe<Scalars['Int']['output']>;
  delivery_date?: Maybe<Scalars['String']['output']>;
  delivery_location?: Maybe<Scalars['String']['output']>;
  delivery_method?: Maybe<DeliveryMethod>;
  id: Scalars['String']['output'];
  /** The intake form submission line item associated with this sales order line item */
  intakeFormSubmissionLineItem?: Maybe<IntakeFormLineItem>;
  intake_form_submission_line_item_id?: Maybe<Scalars['String']['output']>;
  lineitem_status?: Maybe<LineItemStatus>;
  lineitem_type: LineItemType;
  off_rent_date?: Maybe<Scalars['String']['output']>;
  price?: Maybe<Price>;
  price_id?: Maybe<Scalars['String']['output']>;
  quote_revision_line_item_id?: Maybe<Scalars['String']['output']>;
  sales_order_id: Scalars['String']['output'];
  so_pim_category?: Maybe<PimCategory>;
  so_pim_id?: Maybe<Scalars['String']['output']>;
  so_pim_product?: Maybe<PimProduct>;
  so_quantity?: Maybe<Scalars['Int']['output']>;
  /** Total days on rent (inclusive of start date, exclusive of end date) */
  totalDaysOnRent?: Maybe<Scalars['Int']['output']>;
  updated_at?: Maybe<Scalars['String']['output']>;
  updated_by?: Maybe<Scalars['String']['output']>;
  updated_by_user?: Maybe<User>;
};

export type RentalTransaction = BaseTransaction & {
  __typename?: 'RentalTransaction';
  assetId?: Maybe<Scalars['ID']['output']>;
  comments?: Maybe<Array<Comment>>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdBy?: Maybe<Scalars['ID']['output']>;
  dropOffLocation?: Maybe<Scalars['String']['output']>;
  endDate?: Maybe<Scalars['DateTime']['output']>;
  history?: Maybe<Array<Maybe<TransactionLogEntry>>>;
  id: Scalars['ID']['output'];
  lastUpdatedBy?: Maybe<Scalars['ID']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  pickUpLocation?: Maybe<Scalars['String']['output']>;
  pimId?: Maybe<Scalars['ID']['output']>;
  pricePerDayInCents?: Maybe<Scalars['Int']['output']>;
  pricePerMonthInCents?: Maybe<Scalars['Int']['output']>;
  pricePerWeekInCents?: Maybe<Scalars['Int']['output']>;
  projectId?: Maybe<Scalars['ID']['output']>;
  startDate?: Maybe<Scalars['DateTime']['output']>;
  statusId?: Maybe<Scalars['ID']['output']>;
  type?: Maybe<TransactionType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  workflowId?: Maybe<Scalars['ID']['output']>;
  workspaceId?: Maybe<Scalars['ID']['output']>;
};

export type RentalViewAsset = {
  __typename?: 'RentalViewAsset';
  assetId?: Maybe<Scalars['String']['output']>;
  class?: Maybe<RentalViewAssetClass>;
  company?: Maybe<RentalViewAssetCompany>;
  details?: Maybe<RentalViewAssetDetails>;
  groups?: Maybe<Array<Maybe<RentalViewAssetGroup>>>;
  inventoryBranch?: Maybe<RentalViewAssetBranch>;
  keypad?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  make?: Maybe<RentalViewAssetMake>;
  model?: Maybe<RentalViewAssetModel>;
  mspBranch?: Maybe<RentalViewAssetBranch>;
  photo?: Maybe<RentalViewAssetPhoto>;
  rspBranch?: Maybe<RentalViewAssetBranch>;
  tracker?: Maybe<RentalViewAssetTracker>;
  tspCompanies?: Maybe<Array<Maybe<RentalViewAssetTspCompany>>>;
  type?: Maybe<RentalViewAssetType>;
};

export type RentalViewAssetBranch = {
  __typename?: 'RentalViewAssetBranch';
  companyId?: Maybe<Scalars['String']['output']>;
  companyName?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type RentalViewAssetClass = {
  __typename?: 'RentalViewAssetClass';
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type RentalViewAssetCompany = {
  __typename?: 'RentalViewAssetCompany';
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type RentalViewAssetDetails = {
  __typename?: 'RentalViewAssetDetails';
  assetId?: Maybe<Scalars['String']['output']>;
  cameraId?: Maybe<Scalars['String']['output']>;
  customName?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  driverName?: Maybe<Scalars['String']['output']>;
  model?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  photoId?: Maybe<Scalars['String']['output']>;
  serialNumber?: Maybe<Scalars['String']['output']>;
  trackerId?: Maybe<Scalars['String']['output']>;
  vin?: Maybe<Scalars['String']['output']>;
  year?: Maybe<Scalars['String']['output']>;
};

export type RentalViewAssetGroup = {
  __typename?: 'RentalViewAssetGroup';
  companyId?: Maybe<Scalars['String']['output']>;
  companyName?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type RentalViewAssetMake = {
  __typename?: 'RentalViewAssetMake';
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type RentalViewAssetModel = {
  __typename?: 'RentalViewAssetModel';
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type RentalViewAssetPhoto = {
  __typename?: 'RentalViewAssetPhoto';
  filename?: Maybe<Scalars['String']['output']>;
  photoId?: Maybe<Scalars['String']['output']>;
};

export type RentalViewAssetTracker = {
  __typename?: 'RentalViewAssetTracker';
  companyId?: Maybe<Scalars['String']['output']>;
  created?: Maybe<Scalars['String']['output']>;
  deviceSerial?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  trackerTypeId?: Maybe<Scalars['String']['output']>;
  updated?: Maybe<Scalars['String']['output']>;
  vendorId?: Maybe<Scalars['String']['output']>;
};

export type RentalViewAssetTspCompany = {
  __typename?: 'RentalViewAssetTspCompany';
  companyId?: Maybe<Scalars['String']['output']>;
  companyName?: Maybe<Scalars['String']['output']>;
};

export type RentalViewAssetType = {
  __typename?: 'RentalViewAssetType';
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type RentalViewDetails = {
  __typename?: 'RentalViewDetails';
  amountReceived?: Maybe<Scalars['String']['output']>;
  assetId?: Maybe<Scalars['String']['output']>;
  borrowerUserId?: Maybe<Scalars['String']['output']>;
  dateCreated?: Maybe<Scalars['String']['output']>;
  deleted?: Maybe<Scalars['String']['output']>;
  deliveryCharge?: Maybe<Scalars['String']['output']>;
  deliveryInstructions?: Maybe<Scalars['String']['output']>;
  deliveryRequired?: Maybe<Scalars['String']['output']>;
  dropOffDeliveryId?: Maybe<Scalars['String']['output']>;
  dropOffDeliveryRequired?: Maybe<Scalars['String']['output']>;
  endDate?: Maybe<Scalars['String']['output']>;
  endDateEstimated?: Maybe<Scalars['String']['output']>;
  equipmentClassId?: Maybe<Scalars['String']['output']>;
  externalId?: Maybe<Scalars['String']['output']>;
  hasReRent?: Maybe<Scalars['String']['output']>;
  inventoryProductId?: Maybe<Scalars['String']['output']>;
  inventoryProductName?: Maybe<Scalars['String']['output']>;
  inventoryProductNameHistorical?: Maybe<Scalars['String']['output']>;
  isBelowFloorRate?: Maybe<Scalars['String']['output']>;
  isFlatMonthlyRate?: Maybe<Scalars['String']['output']>;
  isFlexibleRate?: Maybe<Scalars['String']['output']>;
  jobDescription?: Maybe<Scalars['String']['output']>;
  lienNoticeSent?: Maybe<Scalars['String']['output']>;
  offRentDateRequested?: Maybe<Scalars['String']['output']>;
  oneTimeCharge?: Maybe<Scalars['String']['output']>;
  orderId?: Maybe<Scalars['String']['output']>;
  partTypeId?: Maybe<Scalars['String']['output']>;
  price?: Maybe<Scalars['String']['output']>;
  pricePerDay?: Maybe<Scalars['String']['output']>;
  pricePerHour?: Maybe<Scalars['String']['output']>;
  pricePerMonth?: Maybe<Scalars['String']['output']>;
  pricePerWeek?: Maybe<Scalars['String']['output']>;
  purchasePrice?: Maybe<Scalars['String']['output']>;
  quantity?: Maybe<Scalars['String']['output']>;
  rateTypeId?: Maybe<Scalars['String']['output']>;
  rentalId?: Maybe<Scalars['String']['output']>;
  rentalPricingStructureId?: Maybe<Scalars['String']['output']>;
  rentalProtectionPlanId?: Maybe<Scalars['String']['output']>;
  rentalPurchaseOptionId?: Maybe<Scalars['String']['output']>;
  rentalStatusId?: Maybe<Scalars['String']['output']>;
  rentalTypeId?: Maybe<Scalars['String']['output']>;
  returnCharge?: Maybe<Scalars['String']['output']>;
  returnDeliveryId?: Maybe<Scalars['String']['output']>;
  returnDeliveryRequired?: Maybe<Scalars['String']['output']>;
  startDate?: Maybe<Scalars['String']['output']>;
  startDateEstimated?: Maybe<Scalars['String']['output']>;
  taxable?: Maybe<Scalars['String']['output']>;
};

export type RentalViewFilterInput = {
  assetId?: InputMaybe<Scalars['String']['input']>;
  borrowerUserId?: InputMaybe<Scalars['String']['input']>;
  orderId?: InputMaybe<Scalars['String']['input']>;
  rentalStatusId?: InputMaybe<Scalars['String']['input']>;
  startDateFrom?: InputMaybe<Scalars['String']['input']>;
  startDateTo?: InputMaybe<Scalars['String']['input']>;
};

export type RentalViewOrder = {
  __typename?: 'RentalViewOrder';
  companyId?: Maybe<Scalars['String']['output']>;
  companyName?: Maybe<Scalars['String']['output']>;
  dateCreated?: Maybe<Scalars['String']['output']>;
  dateUpdated?: Maybe<Scalars['String']['output']>;
  orderId?: Maybe<Scalars['String']['output']>;
  orderStatusId?: Maybe<Scalars['String']['output']>;
  orderStatusName?: Maybe<Scalars['String']['output']>;
  orderedByEmail?: Maybe<Scalars['String']['output']>;
  orderedByFirstName?: Maybe<Scalars['String']['output']>;
  orderedByLastName?: Maybe<Scalars['String']['output']>;
  orderedByUserId?: Maybe<Scalars['String']['output']>;
};

export type RentalViewStatus = {
  __typename?: 'RentalViewStatus';
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export enum RequestType {
  Purchase = 'PURCHASE',
  Rental = 'RENTAL'
}

export enum ReservationType {
  Fulfilment = 'FULFILMENT'
}

export enum ResetFrequency {
  Daily = 'daily',
  Monthly = 'monthly',
  Never = 'never',
  Yearly = 'yearly'
}

export type ResourceMapResource = {
  __typename?: 'ResourceMapResource';
  children?: Maybe<Array<Maybe<ResourceMapResource>>>;
  hierarchy_id?: Maybe<Scalars['String']['output']>;
  hierarchy_name?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  parent?: Maybe<ResourceMapResource>;
  parent_id?: Maybe<Scalars['String']['output']>;
  path?: Maybe<Array<Scalars['String']['output']>>;
  resource_id: Scalars['String']['output'];
  tagType?: Maybe<ResourceMapTagType>;
  tenant_id: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export enum ResourceMapTagType {
  BusinessUnit = 'BUSINESS_UNIT',
  Location = 'LOCATION',
  Role = 'ROLE'
}

export enum ResourceType {
  ErpCharge = 'ERP_CHARGE',
  ErpContact = 'ERP_CONTACT',
  ErpDomain = 'ERP_DOMAIN',
  ErpFile = 'ERP_FILE',
  ErpFulfilment = 'ERP_FULFILMENT',
  ErpIntakeForm = 'ERP_INTAKE_FORM',
  ErpIntakeFormSubmission = 'ERP_INTAKE_FORM_SUBMISSION',
  ErpInvoice = 'ERP_INVOICE',
  ErpPlatform = 'ERP_PLATFORM',
  ErpPricebook = 'ERP_PRICEBOOK',
  ErpPricebookPrice = 'ERP_PRICEBOOK_PRICE',
  ErpProject = 'ERP_PROJECT',
  ErpPurchaseOrder = 'ERP_PURCHASE_ORDER',
  ErpQuote = 'ERP_QUOTE',
  ErpRfq = 'ERP_RFQ',
  ErpSalesOrder = 'ERP_SALES_ORDER',
  ErpServiceAccount = 'ERP_SERVICE_ACCOUNT',
  ErpUser = 'ERP_USER',
  ErpWorkspace = 'ERP_WORKSPACE'
}

export enum ResourceTypes {
  ErpCharge = 'ERP_CHARGE',
  ErpContact = 'ERP_CONTACT',
  ErpDomain = 'ERP_DOMAIN',
  ErpFile = 'ERP_FILE',
  ErpFulfilment = 'ERP_FULFILMENT',
  ErpIntakeForm = 'ERP_INTAKE_FORM',
  ErpIntakeFormSubmission = 'ERP_INTAKE_FORM_SUBMISSION',
  ErpInvoice = 'ERP_INVOICE',
  ErpPlatform = 'ERP_PLATFORM',
  ErpPricebook = 'ERP_PRICEBOOK',
  ErpPricebookPrice = 'ERP_PRICEBOOK_PRICE',
  ErpProject = 'ERP_PROJECT',
  ErpPurchaseOrder = 'ERP_PURCHASE_ORDER',
  ErpQuote = 'ERP_QUOTE',
  ErpRfq = 'ERP_RFQ',
  ErpSalesOrder = 'ERP_SALES_ORDER',
  ErpServiceAccount = 'ERP_SERVICE_ACCOUNT',
  ErpUser = 'ERP_USER',
  ErpWorkspace = 'ERP_WORKSPACE'
}

export enum RevisionStatus {
  Draft = 'DRAFT',
  Sent = 'SENT'
}

export type SaleFulfilment = FulfilmentBase & {
  __typename?: 'SaleFulfilment';
  assignedTo?: Maybe<User>;
  assignedToId?: Maybe<Scalars['ID']['output']>;
  /** @deprecated CompanyId is deprecated and will be removed in future versions. Use workspaceId instead. */
  companyId?: Maybe<Scalars['ID']['output']>;
  contact?: Maybe<Contact>;
  contactId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  pimCategory?: Maybe<PimCategory>;
  pimCategoryId?: Maybe<Scalars['ID']['output']>;
  pimCategoryName?: Maybe<Scalars['String']['output']>;
  pimCategoryPath?: Maybe<Scalars['String']['output']>;
  pimProduct?: Maybe<PimProduct>;
  pimProductId?: Maybe<Scalars['ID']['output']>;
  price?: Maybe<Price>;
  priceId?: Maybe<Scalars['ID']['output']>;
  priceName?: Maybe<Scalars['String']['output']>;
  project?: Maybe<Project>;
  projectId?: Maybe<Scalars['ID']['output']>;
  purchaseOrderLineItem?: Maybe<PurchaseOrderLineItem>;
  purchaseOrderLineItemId?: Maybe<Scalars['ID']['output']>;
  purchaseOrderNumber: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
  salePrice?: Maybe<Scalars['Float']['output']>;
  salesOrder?: Maybe<SalesOrder>;
  salesOrderId: Scalars['ID']['output'];
  salesOrderLineItem?: Maybe<SalesOrderLineItem>;
  salesOrderLineItemId: Scalars['ID']['output'];
  salesOrderPONumber?: Maybe<Scalars['String']['output']>;
  salesOrderType: FulfilmentType;
  unitCostInCents: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  workflowColumnId?: Maybe<Scalars['ID']['output']>;
  workflowId?: Maybe<Scalars['ID']['output']>;
  workspaceId: Scalars['ID']['output'];
};

export type SalePrice = {
  __typename?: 'SalePrice';
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  discounts?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  parentPrice?: Maybe<Price>;
  parentPriceId?: Maybe<Scalars['ID']['output']>;
  parentPriceIdPercentageFactor?: Maybe<Scalars['Float']['output']>;
  pimCategory?: Maybe<PimCategory>;
  pimCategoryId: Scalars['String']['output'];
  pimCategoryName: Scalars['String']['output'];
  pimCategoryPath: Scalars['String']['output'];
  pimProduct?: Maybe<PimProduct>;
  pimProductId?: Maybe<Scalars['ID']['output']>;
  priceBook?: Maybe<PriceBook>;
  priceBookId?: Maybe<Scalars['ID']['output']>;
  priceType: PriceType;
  unitCostInCents: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type SalePurchaseOrderLineItem = {
  __typename?: 'SalePurchaseOrderLineItem';
  company_id?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  created_by?: Maybe<Scalars['String']['output']>;
  created_by_user?: Maybe<User>;
  deleted_at?: Maybe<Scalars['String']['output']>;
  deliveryNotes?: Maybe<Scalars['String']['output']>;
  delivery_charge_in_cents?: Maybe<Scalars['Int']['output']>;
  delivery_date?: Maybe<Scalars['String']['output']>;
  delivery_location?: Maybe<Scalars['String']['output']>;
  delivery_method?: Maybe<DeliveryMethod>;
  id: Scalars['String']['output'];
  /** Inventory items associated with this line item */
  inventory: Array<Inventory>;
  lineitem_status?: Maybe<PoLineItemStatus>;
  lineitem_type: PoLineItemType;
  po_pim_id?: Maybe<Scalars['String']['output']>;
  po_quantity?: Maybe<Scalars['Int']['output']>;
  price?: Maybe<Price>;
  price_id?: Maybe<Scalars['String']['output']>;
  purchaseOrder?: Maybe<PurchaseOrder>;
  purchase_order_id: Scalars['String']['output'];
  quote_revision_line_item_id?: Maybe<Scalars['String']['output']>;
  so_pim_category?: Maybe<PimCategory>;
  so_pim_product?: Maybe<PimProduct>;
  updated_at?: Maybe<Scalars['String']['output']>;
  updated_by?: Maybe<Scalars['String']['output']>;
  updated_by_user?: Maybe<User>;
};

export type SaleSalesOrderLineItem = {
  __typename?: 'SaleSalesOrderLineItem';
  company_id?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  created_by?: Maybe<Scalars['String']['output']>;
  created_by_user?: Maybe<User>;
  deleted_at?: Maybe<Scalars['String']['output']>;
  deliveryNotes?: Maybe<Scalars['String']['output']>;
  delivery_charge_in_cents?: Maybe<Scalars['Int']['output']>;
  delivery_date?: Maybe<Scalars['String']['output']>;
  delivery_location?: Maybe<Scalars['String']['output']>;
  delivery_method?: Maybe<DeliveryMethod>;
  id: Scalars['String']['output'];
  /** The intake form submission line item associated with this sales order line item */
  intakeFormSubmissionLineItem?: Maybe<IntakeFormLineItem>;
  intake_form_submission_line_item_id?: Maybe<Scalars['String']['output']>;
  lineitem_status?: Maybe<LineItemStatus>;
  lineitem_type: LineItemType;
  price?: Maybe<Price>;
  price_id?: Maybe<Scalars['String']['output']>;
  quote_revision_line_item_id?: Maybe<Scalars['String']['output']>;
  sales_order_id: Scalars['String']['output'];
  so_pim_category?: Maybe<PimCategory>;
  so_pim_id?: Maybe<Scalars['String']['output']>;
  so_pim_product?: Maybe<PimProduct>;
  so_quantity?: Maybe<Scalars['Int']['output']>;
  updated_at?: Maybe<Scalars['String']['output']>;
  updated_by?: Maybe<Scalars['String']['output']>;
  updated_by_user?: Maybe<User>;
};

export type SaleTransaction = BaseTransaction & {
  __typename?: 'SaleTransaction';
  comments?: Maybe<Array<Comment>>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdBy?: Maybe<Scalars['ID']['output']>;
  history?: Maybe<Array<Maybe<TransactionLogEntry>>>;
  id: Scalars['ID']['output'];
  lastUpdatedBy?: Maybe<Scalars['ID']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  priceInCents?: Maybe<Scalars['Int']['output']>;
  product?: Maybe<Scalars['String']['output']>;
  projectId?: Maybe<Scalars['ID']['output']>;
  quantity?: Maybe<Scalars['Int']['output']>;
  statusId?: Maybe<Scalars['ID']['output']>;
  type?: Maybe<TransactionType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  workflowId?: Maybe<Scalars['ID']['output']>;
  workspaceId?: Maybe<Scalars['ID']['output']>;
};

export type SalesOrder = {
  __typename?: 'SalesOrder';
  buyer?: Maybe<Contact>;
  buyer_id: Scalars['String']['output'];
  comments: Array<Note>;
  /** @deprecated Use workspace_id instead */
  company_id: Scalars['String']['output'];
  created_at: Scalars['String']['output'];
  created_by: Scalars['String']['output'];
  created_by_user?: Maybe<User>;
  deleted_at?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  /** The intake form submission associated with this sales order */
  intakeFormSubmission?: Maybe<IntakeFormSubmission>;
  intake_form_submission_id?: Maybe<Scalars['String']['output']>;
  line_items?: Maybe<Array<Maybe<SalesOrderLineItem>>>;
  /** Pricing summary for the sales order */
  pricing?: Maybe<SalesOrderPricing>;
  project?: Maybe<Project>;
  project_id?: Maybe<Scalars['String']['output']>;
  purchase_order_number?: Maybe<Scalars['String']['output']>;
  quote_id?: Maybe<Scalars['String']['output']>;
  quote_revision_id?: Maybe<Scalars['String']['output']>;
  sales_order_number: Scalars['String']['output'];
  /** Status of the sales order */
  status: SalesOrderStatus;
  updated_at: Scalars['String']['output'];
  updated_by: Scalars['String']['output'];
  updated_by_user?: Maybe<User>;
  workspace_id?: Maybe<Scalars['String']['output']>;
};

export type SalesOrderInput = {
  buyer_id: Scalars['String']['input'];
  intake_form_submission_id?: InputMaybe<Scalars['String']['input']>;
  project_id?: InputMaybe<Scalars['String']['input']>;
  purchase_order_number?: InputMaybe<Scalars['String']['input']>;
  sales_order_number?: InputMaybe<Scalars['String']['input']>;
  workspace_id: Scalars['String']['input'];
};

export type SalesOrderLineItem = RentalSalesOrderLineItem | SaleSalesOrderLineItem;

export type SalesOrderLineItemPriceEstimate = {
  __typename?: 'SalesOrderLineItemPriceEstimate';
  costInCents?: Maybe<Scalars['Int']['output']>;
  /** Delivery cost in cents for this line item */
  delivery_cost_in_cents?: Maybe<Scalars['Int']['output']>;
  details?: Maybe<LineItemCostOptionDetails>;
  /** Forecast of accumulative cost over a range of days */
  forecast?: Maybe<LineItemPriceForecast>;
  rentalPeriod?: Maybe<LineItemRentalPeriod>;
  savingsComparedToDayRateInCents?: Maybe<Scalars['Int']['output']>;
  savingsComparedToDayRateInFraction?: Maybe<Scalars['Float']['output']>;
  savingsComparedToExactSplitInCents?: Maybe<Scalars['Int']['output']>;
  strategy?: Maybe<Scalars['String']['output']>;
  /** Total cost including delivery in cents for this line item */
  total_including_delivery_in_cents?: Maybe<Scalars['Int']['output']>;
};


export type SalesOrderLineItemPriceEstimateForecastArgs = {
  number_of_days?: InputMaybe<Scalars['Int']['input']>;
};

export type SalesOrderListResult = {
  __typename?: 'SalesOrderListResult';
  items: Array<SalesOrder>;
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type SalesOrderPricing = {
  __typename?: 'SalesOrderPricing';
  /** Sum of all line item totals (pre-tax) */
  sub_total_in_cents?: Maybe<Scalars['Int']['output']>;
  /** Total amount (same as sub_total_in_cents, no tax included) */
  total_in_cents?: Maybe<Scalars['Int']['output']>;
};

export enum SalesOrderStatus {
  Draft = 'DRAFT',
  Submitted = 'SUBMITTED'
}

export type ScopeOfWorkCode = {
  __typename?: 'ScopeOfWorkCode';
  code: Scalars['String']['output'];
  description: Scalars['String']['output'];
};

/**
 * Project scope of work. Allowed values:
 * - SITE_CIVIL: Clearing, grubbing, earthwork, underground utilities, erosion control, paving, striping, hardscape, and landscaping.
 * - FOUNDATIONS: Deep (pile, caisson) and shallow (spread footing, slab‑on‑grade) foundations, waterproofing, and sub‑slab drainage systems.
 * - STRUCTURAL_FRAME: Structural steel or cast‑in‑place concrete frame, metal decking, shear bracing, anchor bolts, and related fireproofing.
 * - BUILDING_ENVELOPE: Exterior wall systems (masonry, precast, curtain wall), thermal & moisture protection, roofing systems, windows, skylights, and exterior doors.
 * - INTERIOR_BUILD_OUT: Metal studs, drywall, ceilings, flooring, interior glazing, millwork, casework, interior doors, hardware, paint, and specialty finishes.
 * - MEP: HVAC equipment & ductwork, plumbing supply & waste, fire protection systems, medium- and low-voltage electrical distribution, lighting, and emergency power.
 * - SPECIALTY_SYSTEMS: Vertical transportation (elevators, lifts), building automation, security & access control, audiovisual, structured cabling, and telecom infrastructure.
 * - COMMISSIONING_STARTUP: Functional performance testing, TAB (testing, adjusting & balancing), systems verification, owner training sessions, and punch‑list resolution.
 * - DEMOBILIZATION_CLOSE_OUT: Final cleaning, removal of temporary facilities, restoration of lay‑down areas, compilation of turnover documentation, warranty certificates, lien waivers, and final pay application.
 * - WARRANTY_SERVICES: Scheduled inspections, corrective work, preventive maintenance, and performance monitoring through warranty expiration.
 */
export enum ScopeOfWorkEnum {
  BuildingEnvelope = 'BUILDING_ENVELOPE',
  CommissioningStartup = 'COMMISSIONING_STARTUP',
  DemobilizationCloseOut = 'DEMOBILIZATION_CLOSE_OUT',
  Foundations = 'FOUNDATIONS',
  InteriorBuildOut = 'INTERIOR_BUILD_OUT',
  Mep = 'MEP',
  SiteCivil = 'SITE_CIVIL',
  SpecialtySystems = 'SPECIALTY_SYSTEMS',
  StructuralFrame = 'STRUCTURAL_FRAME',
  WarrantyServices = 'WARRANTY_SERVICES'
}

export type SearchDocument = {
  __typename?: 'SearchDocument';
  collection: SearchableCollectionType;
  createdAt: Scalars['String']['output'];
  documentId: Scalars['String']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  metadata: Scalars['JSON']['output'];
  subtitle?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
  workspaceId: Scalars['String']['output'];
};

export type SearchDocumentsResult = {
  __typename?: 'SearchDocumentsResult';
  documents: Array<SearchDocument>;
  page: PaginationInfo;
  total: Scalars['Int']['output'];
};

export type SearchUserState = {
  __typename?: 'SearchUserState';
  createdAt: Scalars['String']['output'];
  favorites: Array<SearchUserStateFavorite>;
  id: Scalars['ID']['output'];
  recents: Array<SearchUserStateRecent>;
  updatedAt: Scalars['String']['output'];
  userId: Scalars['String']['output'];
  workspaceId: Scalars['String']['output'];
};

export type SearchUserStateFavorite = {
  __typename?: 'SearchUserStateFavorite';
  addedAt: Scalars['String']['output'];
  searchDocument?: Maybe<SearchDocument>;
  searchDocumentId: Scalars['String']['output'];
};

export type SearchUserStateRecent = {
  __typename?: 'SearchUserStateRecent';
  accessedAt: Scalars['String']['output'];
  searchDocument?: Maybe<SearchDocument>;
  searchDocumentId: Scalars['String']['output'];
};

/** Collections that can be searched */
export enum SearchableCollectionType {
  Contacts = 'contacts',
  Invoices = 'invoices',
  Notes = 'notes',
  Projects = 'projects',
  PurchaseOrders = 'purchase_orders',
  SalesOrders = 'sales_orders'
}

export type SendQuoteInput = {
  quoteId: Scalars['String']['input'];
  revisionId: Scalars['String']['input'];
};

export type SendTemplatedEmailResult = {
  __typename?: 'SendTemplatedEmailResult';
  error?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type SendTestEmailResult = {
  __typename?: 'SendTestEmailResult';
  error?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type SequenceNumber = {
  __typename?: 'SequenceNumber';
  /** @deprecated Use workspaceId instead */
  companyId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  deleted: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  template?: Maybe<ReferenceNumberTemplate>;
  templateId?: Maybe<Scalars['String']['output']>;
  type: ReferenceNumberType;
  updatedAt: Scalars['DateTime']['output'];
  updatedBy: Scalars['String']['output'];
  value: Scalars['Int']['output'];
  workspaceId: Scalars['String']['output'];
};

export type ServiceFulfilment = FulfilmentBase & {
  __typename?: 'ServiceFulfilment';
  assignedTo?: Maybe<User>;
  assignedToId?: Maybe<Scalars['ID']['output']>;
  /** @deprecated CompanyId is deprecated and will be removed in future versions. Use workspaceId instead. */
  companyId?: Maybe<Scalars['ID']['output']>;
  contact?: Maybe<Contact>;
  contactId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  pimCategory?: Maybe<PimCategory>;
  pimCategoryId?: Maybe<Scalars['ID']['output']>;
  pimCategoryName?: Maybe<Scalars['String']['output']>;
  pimCategoryPath?: Maybe<Scalars['String']['output']>;
  pimProduct?: Maybe<PimProduct>;
  pimProductId?: Maybe<Scalars['ID']['output']>;
  price?: Maybe<Price>;
  priceId?: Maybe<Scalars['ID']['output']>;
  priceName?: Maybe<Scalars['String']['output']>;
  project?: Maybe<Project>;
  projectId?: Maybe<Scalars['ID']['output']>;
  purchaseOrderLineItem?: Maybe<PurchaseOrderLineItem>;
  purchaseOrderLineItemId?: Maybe<Scalars['ID']['output']>;
  purchaseOrderNumber: Scalars['String']['output'];
  salesOrder?: Maybe<SalesOrder>;
  salesOrderId: Scalars['ID']['output'];
  salesOrderLineItem?: Maybe<SalesOrderLineItem>;
  salesOrderLineItemId: Scalars['ID']['output'];
  salesOrderPONumber?: Maybe<Scalars['String']['output']>;
  salesOrderType: FulfilmentType;
  serviceDate?: Maybe<Scalars['DateTime']['output']>;
  unitCostInCents: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  workflowColumnId?: Maybe<Scalars['ID']['output']>;
  workflowId?: Maybe<Scalars['ID']['output']>;
  workspaceId: Scalars['ID']['output'];
};

export type ServiceTask = {
  __typename?: 'ServiceTask';
  completed?: Maybe<Scalars['Boolean']['output']>;
  taskDetails?: Maybe<Scalars['String']['output']>;
};

export type ServiceTransaction = BaseTransaction & {
  __typename?: 'ServiceTransaction';
  assignee?: Maybe<Scalars['String']['output']>;
  comments?: Maybe<Array<Comment>>;
  costInCents?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdBy?: Maybe<Scalars['ID']['output']>;
  history?: Maybe<Array<Maybe<TransactionLogEntry>>>;
  id: Scalars['ID']['output'];
  lastUpdatedBy?: Maybe<Scalars['ID']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  projectId?: Maybe<Scalars['ID']['output']>;
  statusId?: Maybe<Scalars['ID']['output']>;
  tasks?: Maybe<Array<ServiceTask>>;
  type?: Maybe<TransactionType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  workflowId?: Maybe<Scalars['ID']['output']>;
  workspaceId?: Maybe<Scalars['ID']['output']>;
};

export enum ServiceTransactionTypes {
  Custom = 'CUSTOM',
  Hauling = 'HAULING',
  Maintenance = 'MAINTENANCE'
}

export type SetInvoiceTaxInput = {
  invoiceId: Scalars['String']['input'];
  taxPercent: Scalars['Float']['input'];
};

export type SignedUploadUrl = {
  __typename?: 'SignedUploadUrl';
  key: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type SpiceDbObjectReference = {
  __typename?: 'SpiceDBObjectReference';
  id: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type SpiceDbRelationship = {
  __typename?: 'SpiceDBRelationship';
  relation: Scalars['String']['output'];
  resource: SpiceDbObjectReference;
  subject: SpiceDbSubjectReference;
};

export type SpiceDbSubjectReference = {
  __typename?: 'SpiceDBSubjectReference';
  id: Scalars['String']['output'];
  relation?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
};

export type SubmissionSalesOrder = {
  __typename?: 'SubmissionSalesOrder';
  created_at: Scalars['String']['output'];
  deleted_at?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['String']['output'];
  project?: Maybe<IntakeFormProject>;
  project_id?: Maybe<Scalars['String']['output']>;
  purchase_order_number?: Maybe<Scalars['String']['output']>;
  sales_order_number: Scalars['String']['output'];
  /** Status of the sales order */
  status: SalesOrderStatus;
  updated_at: Scalars['String']['output'];
  workspace_id?: Maybe<Scalars['String']['output']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  /** Subscribe to current server time updates (emitted every 5 seconds, for educational purposes) */
  currentTime?: Maybe<CurrentTimeEvent>;
};

export enum SupportedContentType {
  ApplicationPdf = 'APPLICATION_PDF',
  ImageJpeg = 'IMAGE_JPEG',
  ImagePng = 'IMAGE_PNG',
  TextCsv = 'TEXT_CSV'
}

export type TaxAnalysisResult = {
  __typename?: 'TaxAnalysisResult';
  taxes: Array<TaxObligation>;
};

export type TaxLineItem = {
  __typename?: 'TaxLineItem';
  calculatedAmountInCents?: Maybe<Scalars['Int']['output']>;
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  order: Scalars['Int']['output'];
  type: TaxType;
  value: Scalars['Float']['output'];
};

export type TaxObligation = {
  __typename?: 'TaxObligation';
  description: Scalars['String']['output'];
  order: Scalars['Int']['output'];
  reason: Scalars['String']['output'];
  type: TaxType;
  value: Scalars['Float']['output'];
};

export enum TaxType {
  FixedAmount = 'FIXED_AMOUNT',
  Percentage = 'PERCENTAGE'
}

export type TouchAllContactsResult = {
  __typename?: 'TouchAllContactsResult';
  touched: Scalars['Int']['output'];
};

export type Transaction = RentalTransaction | SaleTransaction | ServiceTransaction;

export type TransactionInput = {
  projectId?: InputMaybe<Scalars['ID']['input']>;
  type: TransactionType;
  workspaceId: Scalars['ID']['input'];
};

export type TransactionLogEntry = {
  __typename?: 'TransactionLogEntry';
  action?: Maybe<Scalars['String']['output']>;
  col?: Maybe<Scalars['String']['output']>;
  newValue?: Maybe<Scalars['String']['output']>;
  oldValue?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

export type TransactionStatus = {
  __typename?: 'TransactionStatus';
  colourCode?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  type?: Maybe<TransactionStatusType>;
  workflowId?: Maybe<Scalars['ID']['output']>;
};

export enum TransactionStatusType {
  Doing = 'DOING',
  Done = 'DONE',
  Todo = 'TODO'
}

export enum TransactionType {
  Rental = 'RENTAL',
  Sale = 'SALE',
  Service = 'SERVICE'
}

export type UpdateBusinessContactInput = {
  accountsPayableContactId?: InputMaybe<Scalars['ID']['input']>;
  address?: InputMaybe<Scalars['String']['input']>;
  brandId?: InputMaybe<Scalars['ID']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  placeId?: InputMaybe<Scalars['String']['input']>;
  profilePicture?: InputMaybe<Scalars['String']['input']>;
  resourceMapIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  taxId?: InputMaybe<Scalars['String']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateIntakeFormInput = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isPublic?: InputMaybe<Scalars['Boolean']['input']>;
  pricebookId?: InputMaybe<Scalars['ID']['input']>;
  projectId?: InputMaybe<Scalars['ID']['input']>;
  sharedWithEmails?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UpdateIntakeFormSubmissionInput = {
  buyerWorkspaceId?: InputMaybe<Scalars['String']['input']>;
  companyName?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  purchaseOrderId?: InputMaybe<Scalars['String']['input']>;
  purchaseOrderNumber?: InputMaybe<Scalars['String']['input']>;
  salesOrderId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateInventorySerialisedIdInput = {
  assetId: Scalars['String']['input'];
};

export type UpdatePersonContactInput = {
  businessId?: InputMaybe<Scalars['ID']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  profilePicture?: InputMaybe<Scalars['String']['input']>;
  resourceMapIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  role?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePriceBookInput = {
  businessContactId?: InputMaybe<Scalars['ID']['input']>;
  id: Scalars['ID']['input'];
  location?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  projectId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdatePurchaseOrderInput = {
  id: Scalars['String']['input'];
  project_id?: InputMaybe<Scalars['String']['input']>;
  purchase_order_number?: InputMaybe<Scalars['String']['input']>;
  seller_id?: InputMaybe<Scalars['String']['input']>;
  workspace_id?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePurchaseOrderLineItemInput = {
  deliveryNotes?: InputMaybe<Scalars['String']['input']>;
  delivery_charge_in_cents?: InputMaybe<Scalars['Int']['input']>;
  delivery_date?: InputMaybe<Scalars['String']['input']>;
  delivery_location?: InputMaybe<Scalars['String']['input']>;
  delivery_method?: InputMaybe<DeliveryMethod>;
  id: Scalars['String']['input'];
  lineitem_status?: InputMaybe<PoLineItemStatus>;
  lineitem_type?: InputMaybe<PoLineItemType>;
  off_rent_date?: InputMaybe<Scalars['String']['input']>;
  po_pim_id?: InputMaybe<Scalars['String']['input']>;
  po_quantity?: InputMaybe<Scalars['Int']['input']>;
  price_id?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateQuoteInput = {
  currentRevisionId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  sellersBuyerContactId?: InputMaybe<Scalars['String']['input']>;
  sellersProjectId?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<QuoteStatus>;
  validUntil?: InputMaybe<Scalars['DateTime']['input']>;
};

export type UpdateQuoteRevisionInput = {
  id: Scalars['String']['input'];
  lineItems?: InputMaybe<Array<QuoteRevisionLineItemInput>>;
  validUntil?: InputMaybe<Scalars['DateTime']['input']>;
};

export type UpdateQuoteStatusInput = {
  id: Scalars['String']['input'];
  status: QuoteStatus;
};

export type UpdateRfqInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  invitedSellerContactIds?: InputMaybe<Array<Scalars['String']['input']>>;
  lineItems?: InputMaybe<Array<RfqLineItemInput>>;
  responseDeadline?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<RfqStatus>;
};

export type UpdateReferenceNumberTemplateInput = {
  businessContactId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  projectId?: InputMaybe<Scalars['String']['input']>;
  resetFrequency?: InputMaybe<ResetFrequency>;
  seqPadding?: InputMaybe<Scalars['Int']['input']>;
  startAt?: InputMaybe<Scalars['Int']['input']>;
  template?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<ReferenceNumberType>;
  useGlobalSequence?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateRentalPriceInput = {
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  pimCategoryId?: InputMaybe<Scalars['String']['input']>;
  pimProductId?: InputMaybe<Scalars['ID']['input']>;
  pricePerDayInCents?: InputMaybe<Scalars['Int']['input']>;
  pricePerMonthInCents?: InputMaybe<Scalars['Int']['input']>;
  pricePerWeekInCents?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateRentalPurchaseOrderLineItemInput = {
  deliveryNotes?: InputMaybe<Scalars['String']['input']>;
  delivery_charge_in_cents?: InputMaybe<Scalars['Int']['input']>;
  delivery_date?: InputMaybe<Scalars['String']['input']>;
  delivery_location?: InputMaybe<Scalars['String']['input']>;
  delivery_method?: InputMaybe<DeliveryMethod>;
  id: Scalars['String']['input'];
  lineitem_status?: InputMaybe<PoLineItemStatus>;
  off_rent_date?: InputMaybe<Scalars['String']['input']>;
  po_pim_id?: InputMaybe<Scalars['String']['input']>;
  po_quantity?: InputMaybe<Scalars['Int']['input']>;
  price_id?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateRentalSalesOrderLineItemInput = {
  deliveryNotes?: InputMaybe<Scalars['String']['input']>;
  delivery_charge_in_cents?: InputMaybe<Scalars['Int']['input']>;
  delivery_date?: InputMaybe<Scalars['String']['input']>;
  delivery_location?: InputMaybe<Scalars['String']['input']>;
  delivery_method?: InputMaybe<DeliveryMethod>;
  id: Scalars['String']['input'];
  lineitem_status?: InputMaybe<LineItemStatus>;
  off_rent_date?: InputMaybe<Scalars['String']['input']>;
  price_id?: InputMaybe<Scalars['String']['input']>;
  so_pim_id?: InputMaybe<Scalars['String']['input']>;
  so_quantity?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateSalePriceInput = {
  discounts?: InputMaybe<Scalars['JSON']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  pimCategoryId?: InputMaybe<Scalars['String']['input']>;
  pimProductId?: InputMaybe<Scalars['ID']['input']>;
  unitCostInCents?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateSalePurchaseOrderLineItemInput = {
  deliveryNotes?: InputMaybe<Scalars['String']['input']>;
  delivery_charge_in_cents?: InputMaybe<Scalars['Int']['input']>;
  delivery_date?: InputMaybe<Scalars['String']['input']>;
  delivery_location?: InputMaybe<Scalars['String']['input']>;
  delivery_method?: InputMaybe<DeliveryMethod>;
  id: Scalars['String']['input'];
  lineitem_status?: InputMaybe<PoLineItemStatus>;
  po_pim_id?: InputMaybe<Scalars['String']['input']>;
  po_quantity?: InputMaybe<Scalars['Int']['input']>;
  price_id?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSaleSalesOrderLineItemInput = {
  deliveryNotes?: InputMaybe<Scalars['String']['input']>;
  delivery_charge_in_cents?: InputMaybe<Scalars['Int']['input']>;
  delivery_date?: InputMaybe<Scalars['String']['input']>;
  delivery_location?: InputMaybe<Scalars['String']['input']>;
  delivery_method?: InputMaybe<DeliveryMethod>;
  id: Scalars['String']['input'];
  lineitem_status?: InputMaybe<LineItemStatus>;
  price_id?: InputMaybe<Scalars['String']['input']>;
  so_pim_id?: InputMaybe<Scalars['String']['input']>;
  so_quantity?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateSalesOrderInput = {
  buyer_id?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  project_id?: InputMaybe<Scalars['String']['input']>;
  purchase_order_number?: InputMaybe<Scalars['String']['input']>;
  sales_order_number?: InputMaybe<Scalars['String']['input']>;
  workspace_id?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSalesOrderLineItemInput = {
  deliveryNotes?: InputMaybe<Scalars['String']['input']>;
  delivery_charge_in_cents?: InputMaybe<Scalars['Int']['input']>;
  delivery_date?: InputMaybe<Scalars['String']['input']>;
  delivery_location?: InputMaybe<Scalars['String']['input']>;
  delivery_method?: InputMaybe<DeliveryMethod>;
  id: Scalars['String']['input'];
  lineitem_status?: InputMaybe<LineItemStatus>;
  lineitem_type?: InputMaybe<LineItemType>;
  off_rent_date?: InputMaybe<Scalars['String']['input']>;
  price_id?: InputMaybe<Scalars['String']['input']>;
  so_pim_id?: InputMaybe<Scalars['String']['input']>;
  so_quantity?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateTaxLineItemInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  invoiceId: Scalars['ID']['input'];
  order?: InputMaybe<Scalars['Int']['input']>;
  taxLineItemId: Scalars['ID']['input'];
  type?: InputMaybe<TaxType>;
  value?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateWorkflowConfigurationInput = {
  columns: Array<WorkflowColumnInput>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertPimCategoryInput = {
  description: Scalars['String']['input'];
  has_products: Scalars['Boolean']['input'];
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  path: Scalars['String']['input'];
  platform_id: Scalars['String']['input'];
};

export type User = {
  __typename?: 'User';
  companyId: Scalars['String']['output'];
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  id: Scalars['String']['output'];
  lastLoginLocation?: Maybe<UserLocationInfo>;
  lastName: Scalars['String']['output'];
  picture?: Maybe<Scalars['String']['output']>;
};

export type UserLocationInfo = {
  __typename?: 'UserLocationInfo';
  city?: Maybe<Scalars['String']['output']>;
  countryCode?: Maybe<Scalars['String']['output']>;
  countryName?: Maybe<Scalars['String']['output']>;
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  timezone?: Maybe<Scalars['String']['output']>;
};

export type UserPermission = {
  __typename?: 'UserPermission';
  permissionMap: UserPermissionMap;
  permissions: Array<PermissionType>;
  resourceId: Scalars['String']['output'];
  resourceType: ResourceType;
};

export type UserPermissionMap = {
  __typename?: 'UserPermissionMap';
  ERP_CHARGE_DELETE?: Maybe<Scalars['Boolean']['output']>;
  ERP_CHARGE_READ?: Maybe<Scalars['Boolean']['output']>;
  ERP_CHARGE_UPDATE?: Maybe<Scalars['Boolean']['output']>;
  ERP_CONTACT_DELETE?: Maybe<Scalars['Boolean']['output']>;
  ERP_CONTACT_READ?: Maybe<Scalars['Boolean']['output']>;
  ERP_CONTACT_UPDATE?: Maybe<Scalars['Boolean']['output']>;
  ERP_DOMAIN_IS_MEMBER?: Maybe<Scalars['Boolean']['output']>;
  ERP_FILE_DELETE?: Maybe<Scalars['Boolean']['output']>;
  ERP_FILE_READ?: Maybe<Scalars['Boolean']['output']>;
  ERP_FILE_UPDATE?: Maybe<Scalars['Boolean']['output']>;
  ERP_FULFILMENT_DELETE?: Maybe<Scalars['Boolean']['output']>;
  ERP_FULFILMENT_MANAGE_RENTAL_PERIOD?: Maybe<Scalars['Boolean']['output']>;
  ERP_FULFILMENT_READ?: Maybe<Scalars['Boolean']['output']>;
  ERP_FULFILMENT_UPDATE?: Maybe<Scalars['Boolean']['output']>;
  ERP_INTAKE_FORM_CREATE_SUBMISSION?: Maybe<Scalars['Boolean']['output']>;
  ERP_INTAKE_FORM_READ?: Maybe<Scalars['Boolean']['output']>;
  ERP_INTAKE_FORM_READ_SUBMISSIONS?: Maybe<Scalars['Boolean']['output']>;
  ERP_INTAKE_FORM_SUBMISSION_READ?: Maybe<Scalars['Boolean']['output']>;
  ERP_INTAKE_FORM_SUBMISSION_UPDATE?: Maybe<Scalars['Boolean']['output']>;
  ERP_INTAKE_FORM_UPDATE?: Maybe<Scalars['Boolean']['output']>;
  ERP_INTAKE_FORM_UPDATE_SUBMISSIONS?: Maybe<Scalars['Boolean']['output']>;
  ERP_INVOICE_READ?: Maybe<Scalars['Boolean']['output']>;
  ERP_INVOICE_UPDATE?: Maybe<Scalars['Boolean']['output']>;
  ERP_PLATFORM_IS_ADMIN?: Maybe<Scalars['Boolean']['output']>;
  ERP_PRICEBOOK_PRICE_READ?: Maybe<Scalars['Boolean']['output']>;
  ERP_PRICEBOOK_PRICE_UPDATE?: Maybe<Scalars['Boolean']['output']>;
  ERP_PRICEBOOK_READ?: Maybe<Scalars['Boolean']['output']>;
  ERP_PRICEBOOK_UPDATE?: Maybe<Scalars['Boolean']['output']>;
  ERP_PROJECT_READ?: Maybe<Scalars['Boolean']['output']>;
  ERP_PROJECT_UPDATE?: Maybe<Scalars['Boolean']['output']>;
  ERP_PURCHASE_ORDER_READ?: Maybe<Scalars['Boolean']['output']>;
  ERP_PURCHASE_ORDER_UPDATE?: Maybe<Scalars['Boolean']['output']>;
  ERP_QUOTE_ACCEPT?: Maybe<Scalars['Boolean']['output']>;
  ERP_QUOTE_READ?: Maybe<Scalars['Boolean']['output']>;
  ERP_QUOTE_REJECT?: Maybe<Scalars['Boolean']['output']>;
  ERP_QUOTE_UPDATE?: Maybe<Scalars['Boolean']['output']>;
  ERP_RFQ_READ?: Maybe<Scalars['Boolean']['output']>;
  ERP_RFQ_UPDATE?: Maybe<Scalars['Boolean']['output']>;
  ERP_SALES_ORDER_PORTAL_ACCESS?: Maybe<Scalars['Boolean']['output']>;
  ERP_SALES_ORDER_READ?: Maybe<Scalars['Boolean']['output']>;
  ERP_SALES_ORDER_UPDATE?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_ADD_USER?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_JOIN?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_MANAGE_BUYER_INTAKE_FORM_SUBMISSIONS?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_MANAGE_CHARGES?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_MANAGE_CONTACTS?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_MANAGE_FILES?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_MANAGE_INTAKE_FORMS?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_MANAGE_INTAKE_FORM_SUBMISSIONS?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_MANAGE_INVOICES?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_MANAGE_PRICES?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_MANAGE_PRICE_BOOKS?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_MANAGE_PROJECTS?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_MANAGE_PURCHASE_ORDERS?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_MANAGE_QUOTES?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_MANAGE_REFERENCE_NUMBER_TEMPLATES?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_MANAGE_RFQS?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_MANAGE_SALES_ORDERS?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_READ_BUYER_INTAKE_FORM_SUBMISSIONS?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_READ_CHARGES?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_READ_CONTACTS?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_READ_FILES?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_READ_INVOICES?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_READ_PROJECTS?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_READ_PURCHASE_ORDERS?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_READ_QUOTES?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_READ_REFERENCE_NUMBER_TEMPLATES?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_READ_RFQS?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CAN_READ_SALES_ORDERS?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CREATE_INTAKE_FORM?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CREATE_INTAKE_FORM_SUBMISSION?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_CREATE_PRICE_BOOK?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_IS_ADMIN?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_MANAGE?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_READ?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_READ_INTAKE_FORMS?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_READ_INTAKE_FORM_SUBMISSIONS?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_READ_PRICES?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_READ_PRICE_BOOKS?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_REMOVE_USER?: Maybe<Scalars['Boolean']['output']>;
  ERP_WORKSPACE_UPDATE_USER_ROLES?: Maybe<Scalars['Boolean']['output']>;
};

export type UserUpsertInput = {
  auth0UserId?: InputMaybe<Scalars['String']['input']>;
  companyId?: InputMaybe<Scalars['String']['input']>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  email: Scalars['String']['input'];
  emailVerified?: InputMaybe<Scalars['Boolean']['input']>;
  esUserId?: InputMaybe<Scalars['String']['input']>;
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  picture?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type ValidEnterpriseDomainResult = {
  __typename?: 'ValidEnterpriseDomainResult';
  domain: Scalars['String']['output'];
  isValid: Scalars['Boolean']['output'];
  reason?: Maybe<Scalars['String']['output']>;
};

export type Workflow = {
  __typename?: 'Workflow';
  id?: Maybe<Scalars['ID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  statuses?: Maybe<Array<TransactionStatus>>;
};

export type WorkflowColumn = {
  __typename?: 'WorkflowColumn';
  colour?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type WorkflowColumnInput = {
  colour?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type WorkflowConfiguration = {
  __typename?: 'WorkflowConfiguration';
  columns: Array<WorkflowColumn>;
  companyId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  createdByUser?: Maybe<User>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  deletedBy?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  updatedBy: Scalars['String']['output'];
  updatedByUser?: Maybe<User>;
};

export type Workspace = {
  __typename?: 'Workspace';
  accessType?: Maybe<WorkspaceAccessType>;
  archived?: Maybe<Scalars['Boolean']['output']>;
  archivedAt?: Maybe<Scalars['String']['output']>;
  bannerImageUrl?: Maybe<Scalars['String']['output']>;
  brandId?: Maybe<Scalars['String']['output']>;
  companyId?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  createdBy?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  domain?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  ownerId?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  updatedBy?: Maybe<Scalars['String']['output']>;
};

export enum WorkspaceAccessType {
  InviteOnly = 'INVITE_ONLY',
  SameDomain = 'SAME_DOMAIN'
}

export type WorkspaceMember = {
  __typename?: 'WorkspaceMember';
  roles: Array<WorkspaceUserRole>;
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

export type WorkspaceRoleInfo = {
  __typename?: 'WorkspaceRoleInfo';
  description?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  role: WorkspaceUserRole;
};

/** Roles a user can have in a workspace (auto-generated from SpiceDB schema) */
export enum WorkspaceUserRole {
  Admin = 'admin',
  AllResourcesReader = 'all_resources_reader',
  BuyerIntakeFormSubmissionsManager = 'buyer_intake_form_submissions_manager',
  BuyerIntakeFormSubmissionsReader = 'buyer_intake_form_submissions_reader',
  ChargeManager = 'charge_manager',
  ChargeReader = 'charge_reader',
  ContactManager = 'contact_manager',
  ContactReader = 'contact_reader',
  FileManager = 'file_manager',
  FileReader = 'file_reader',
  IntakeFormSubmissionsManager = 'intake_form_submissions_manager',
  IntakeFormSubmissionsReader = 'intake_form_submissions_reader',
  IntakeFormsManager = 'intake_forms_manager',
  IntakeFormsReader = 'intake_forms_reader',
  InvoiceManager = 'invoice_manager',
  InvoiceReader = 'invoice_reader',
  Member = 'member',
  PriceBooksManager = 'price_books_manager',
  PriceBooksReader = 'price_books_reader',
  ProjectManager = 'project_manager',
  ProjectReader = 'project_reader',
  PurchaseOrderManager = 'purchase_order_manager',
  PurchaseOrderReader = 'purchase_order_reader',
  QuotesManager = 'quotes_manager',
  QuotesReader = 'quotes_reader',
  RfqsManager = 'rfqs_manager',
  RfqsReader = 'rfqs_reader',
  SalesOrderManager = 'sales_order_manager',
  SalesOrderReader = 'sales_order_reader'
}

export type WriteRelationshipResult = {
  __typename?: 'WriteRelationshipResult';
  message?: Maybe<Scalars['String']['output']>;
  /** The created/updated relationship */
  relationship?: Maybe<SpiceDbRelationship>;
  success: Scalars['Boolean']['output'];
};

export type ListInventoryForAssetTestQueryVariables = Exact<{
  query?: InputMaybe<ListInventoryQuery>;
}>;


export type ListInventoryForAssetTestQuery = { __typename?: 'Query', listInventory: { __typename?: 'InventoryResponse', items: Array<{ __typename?: 'Inventory', id: string, status: InventoryStatus, assetId?: string | null, isThirdPartyRental: boolean, companyId: string }> } };

export type ListAssetsForAssetScheduleQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ListAssetsForAssetScheduleQuery = { __typename?: 'Query', listAssets?: { __typename?: 'ListAssetsResult', items: Array<{ __typename?: 'Asset', id?: string | null, description?: string | null, company_id?: string | null }> } | null };

export type CreateProjectForAssetScheduleMutationVariables = Exact<{
  input?: InputMaybe<ProjectInput>;
}>;


export type CreateProjectForAssetScheduleMutation = { __typename?: 'Mutation', createProject?: { __typename?: 'Project', id: string, name: string, project_code: string, description?: string | null, deleted: boolean } | null };

export type CreateAssetScheduleForAssetScheduleMutationVariables = Exact<{
  input?: InputMaybe<AssetScheduleInput>;
}>;


export type CreateAssetScheduleForAssetScheduleMutation = { __typename?: 'Mutation', createAssetSchedule?: { __typename?: 'AssetSchedule', id: string, asset_id: string, project_id: string, company_id: string, start_date: string, end_date: string, created_at: string, created_by: string, updated_at: string, updated_by: string } | null };

export type CreateWorkspaceForAuth0TestMutationVariables = Exact<{
  name: Scalars['String']['input'];
  accessType: WorkspaceAccessType;
}>;


export type CreateWorkspaceForAuth0TestMutation = { __typename?: 'Mutation', createWorkspace?: { __typename?: 'Workspace', id: string, name: string } | null };

export type InviteUserToWorkspaceForAuth0TestMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  email: Scalars['String']['input'];
  roles: Array<WorkspaceUserRole> | WorkspaceUserRole;
}>;


export type InviteUserToWorkspaceForAuth0TestMutation = { __typename?: 'Mutation', inviteUserToWorkspace?: { __typename?: 'WorkspaceMember', userId: string, roles: Array<WorkspaceUserRole> } | null };

export type ChargeFieldsFragment = { __typename?: 'Charge', id: string, amountInCents: number, description: string, chargeType: ChargeType, contactId: string, createdAt: any, projectId?: string | null, salesOrderId?: string | null, purchaseOrderNumber?: string | null, salesOrderLineItemId?: string | null, fulfilmentId?: string | null, invoiceId?: string | null };

export type CreateChargeMutationVariables = Exact<{
  input: CreateChargeInput;
}>;


export type CreateChargeMutation = { __typename?: 'Mutation', createCharge?: { __typename?: 'Charge', id: string, amountInCents: number, description: string, chargeType: ChargeType, contactId: string, createdAt: any, projectId?: string | null, salesOrderId?: string | null, purchaseOrderNumber?: string | null, salesOrderLineItemId?: string | null, fulfilmentId?: string | null, invoiceId?: string | null } | null };

export type CreateBusinessContact_BusinessMutationMutationVariables = Exact<{
  input: BusinessContactInput;
}>;


export type CreateBusinessContact_BusinessMutationMutation = { __typename?: 'Mutation', createBusinessContact?: { __typename?: 'BusinessContact', id: string, name: string, phone?: string | null, address?: string | null, taxId?: string | null, website?: string | null, workspaceId: string, contactType: ContactType } | null };

export type UpdateBusinessName_BusinessMutationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
}>;


export type UpdateBusinessName_BusinessMutationMutation = { __typename?: 'Mutation', updateBusinessName?: { __typename?: 'BusinessContact', id: string, name: string } | null };

export type UpdateBusinessPhone_BusinessMutationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  phone: Scalars['String']['input'];
}>;


export type UpdateBusinessPhone_BusinessMutationMutation = { __typename?: 'Mutation', updateBusinessPhone?: { __typename?: 'BusinessContact', id: string, phone?: string | null } | null };

export type UpdateBusinessAddress_BusinessMutationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  address: Scalars['String']['input'];
}>;


export type UpdateBusinessAddress_BusinessMutationMutation = { __typename?: 'Mutation', updateBusinessAddress?: { __typename?: 'BusinessContact', id: string, address?: string | null } | null };

export type UpdateBusinessTaxId_BusinessMutationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  taxId: Scalars['String']['input'];
}>;


export type UpdateBusinessTaxId_BusinessMutationMutation = { __typename?: 'Mutation', updateBusinessTaxId?: { __typename?: 'BusinessContact', id: string, taxId?: string | null } | null };

export type UpdateBusinessWebsite_BusinessMutationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  website: Scalars['String']['input'];
}>;


export type UpdateBusinessWebsite_BusinessMutationMutation = { __typename?: 'Mutation', updateBusinessWebsite?: { __typename?: 'BusinessContact', id: string, website?: string | null } | null };

export type GetContactById_BusinessMutationQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetContactById_BusinessMutationQuery = { __typename?: 'Query', getContactById?: { __typename: 'BusinessContact', id: string, name: string, phone?: string | null, address?: string | null, taxId?: string | null, website?: string | null } | { __typename?: 'PersonContact' } | null };

export type CreatePersonContact_PersonMutationMutationVariables = Exact<{
  input: PersonContactInput;
}>;


export type CreatePersonContact_PersonMutationMutation = { __typename?: 'Mutation', createPersonContact?: { __typename?: 'PersonContact', id: string, name: string, email: string, role?: string | null, phone?: string | null, businessId: string, resourceMapIds?: Array<string> | null, workspaceId: string } | null };

export type UpdatePersonName_PersonMutationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
}>;


export type UpdatePersonName_PersonMutationMutation = { __typename?: 'Mutation', updatePersonName?: { __typename?: 'PersonContact', id: string, name: string } | null };

export type UpdatePersonPhone_PersonMutationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  phone: Scalars['String']['input'];
}>;


export type UpdatePersonPhone_PersonMutationMutation = { __typename?: 'Mutation', updatePersonPhone?: { __typename?: 'PersonContact', id: string, phone?: string | null } | null };

export type UpdatePersonEmail_PersonMutationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  email: Scalars['String']['input'];
}>;


export type UpdatePersonEmail_PersonMutationMutation = { __typename?: 'Mutation', updatePersonEmail?: { __typename?: 'PersonContact', id: string, email: string } | null };

export type UpdatePersonRole_PersonMutationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  role: Scalars['String']['input'];
}>;


export type UpdatePersonRole_PersonMutationMutation = { __typename?: 'Mutation', updatePersonRole?: { __typename?: 'PersonContact', id: string, role?: string | null } | null };

export type UpdatePersonBusiness_PersonMutationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  businessId: Scalars['ID']['input'];
}>;


export type UpdatePersonBusiness_PersonMutationMutation = { __typename?: 'Mutation', updatePersonBusiness?: { __typename?: 'PersonContact', id: string, businessId: string } | null };

export type UpdatePersonResourceMap_PersonMutationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  resourceMapIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type UpdatePersonResourceMap_PersonMutationMutation = { __typename?: 'Mutation', updatePersonResourceMap?: { __typename?: 'PersonContact', id: string, resourceMapIds?: Array<string> | null } | null };

export type GetContactById_PersonMutationQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetContactById_PersonMutationQuery = { __typename?: 'Query', getContactById?: { __typename?: 'BusinessContact' } | { __typename: 'PersonContact', id: string, name: string, email: string, role?: string | null, phone?: string | null, businessId: string, resourceMapIds?: Array<string> | null } | null };

export type CreateBusinessContactMutationVariables = Exact<{
  input: BusinessContactInput;
}>;


export type CreateBusinessContactMutation = { __typename?: 'Mutation', createBusinessContact?: { __typename?: 'BusinessContact', id: string, name: string, workspaceId: string, contactType: ContactType, createdBy: string, createdAt: any, updatedAt: any, notes?: string | null, profilePicture?: string | null, phone?: string | null, address?: string | null, taxId?: string | null, website?: string | null, accountsPayableContactId?: string | null } | null };

export type CreatePersonContactMutationVariables = Exact<{
  input: PersonContactInput;
}>;


export type CreatePersonContactMutation = { __typename?: 'Mutation', createPersonContact?: { __typename?: 'PersonContact', id: string, name: string, workspaceId: string, contactType: ContactType, createdBy: string, createdAt: any, updatedAt: any, notes?: string | null, profilePicture?: string | null, phone?: string | null, email: string, role?: string | null, businessId: string, business?: { __typename?: 'BusinessContact', id: string, name: string } | null } | null };

export type UpdateBusinessContactMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateBusinessContactInput;
}>;


export type UpdateBusinessContactMutation = { __typename?: 'Mutation', updateBusinessContact?: { __typename?: 'BusinessContact', id: string, name: string, notes?: string | null, phone?: string | null, address?: string | null, taxId?: string | null, website?: string | null, accountsPayableContactId?: string | null, updatedAt: any } | null };

export type UpdatePersonContactMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdatePersonContactInput;
}>;


export type UpdatePersonContactMutation = { __typename?: 'Mutation', updatePersonContact?: { __typename?: 'PersonContact', id: string, name: string, notes?: string | null, phone?: string | null, email: string, role?: string | null, businessId: string, updatedAt: any } | null };

export type DeleteContactByIdMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteContactByIdMutation = { __typename?: 'Mutation', deleteContactById?: boolean | null };

export type GetContactByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetContactByIdQuery = { __typename?: 'Query', getContactById?: { __typename?: 'BusinessContact', id: string, name: string, contactType: ContactType } | { __typename?: 'PersonContact', id: string, name: string, contactType: ContactType, businessId: string } | null };

export type GetBusinessContactWithEmployeesQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetBusinessContactWithEmployeesQuery = { __typename?: 'Query', getContactById?: { __typename: 'BusinessContact', id: string, name: string, contactType: ContactType, employees?: { __typename?: 'ListPersonContactsResult', items: Array<{ __typename?: 'PersonContact', id: string, name: string, email: string, role?: string | null, businessId: string }>, page: { __typename?: 'PaginationInfo', number: number, size: number, totalItems: number, totalPages: number } } | null } | { __typename: 'PersonContact', id: string, name: string, contactType: ContactType } | null };

export type ListContactsQueryVariables = Exact<{
  filter: ListContactsFilter;
}>;


export type ListContactsQuery = { __typename?: 'Query', listContacts?: { __typename?: 'ListContactsResult', items: Array<{ __typename?: 'BusinessContact', id: string, name: string, contactType: ContactType } | { __typename?: 'PersonContact', id: string, name: string, contactType: ContactType, businessId: string }>, page: { __typename?: 'PaginationInfo', number: number, size: number } } | null };

export type GetBusinessContactWithAssociatedPriceBooksQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetBusinessContactWithAssociatedPriceBooksQuery = { __typename?: 'Query', getContactById?: { __typename: 'BusinessContact', id: string, name: string, associatedPriceBooks?: { __typename?: 'ListPriceBooksResult', items: Array<{ __typename?: 'PriceBook', id: string, name: string, businessContactId?: string | null, workspaceId: string }>, page: { __typename?: 'PaginationInfo', number: number, size: number } } | null } | { __typename?: 'PersonContact' } | null };

export type ValidEnterpriseDomainQueryVariables = Exact<{
  domain: Scalars['String']['input'];
}>;


export type ValidEnterpriseDomainQuery = { __typename?: 'Query', validEnterpriseDomain: { __typename?: 'ValidEnterpriseDomainResult', isValid: boolean, domain: string, reason?: string | null } };

export type GetSignedUploadUrlQueryVariables = Exact<{
  contentType: SupportedContentType;
  originalFilename?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetSignedUploadUrlQuery = { __typename?: 'Query', getSignedUploadUrl: { __typename?: 'SignedUploadUrl', url: string, key: string } };

export type AddFileToEntityMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  parentEntityId: Scalars['String']['input'];
  parentEntityType?: InputMaybe<ResourceTypes>;
  fileKey: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  metadata?: InputMaybe<Scalars['JSON']['input']>;
}>;


export type AddFileToEntityMutation = { __typename?: 'Mutation', addFileToEntity: { __typename?: 'File', id: string, workspace_id: string, parent_entity_id: string, file_key: string, file_name: string, file_size: number, mime_type: string, metadata?: any | null, created_at: string, created_by: string, updated_at: string, updated_by: string, deleted: boolean, url: string, created_by_user?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null, updated_by_user?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null } };

export type ListFilesByEntityIdQueryVariables = Exact<{
  parentEntityId: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
}>;


export type ListFilesByEntityIdQuery = { __typename?: 'Query', listFilesByEntityId: Array<{ __typename?: 'File', id: string, workspace_id: string, parent_entity_id: string, file_key: string, file_name: string, file_size: number, mime_type: string, metadata?: any | null, created_at: string, created_by: string, updated_at: string, updated_by: string, deleted: boolean, url: string }> };

export type RenameFileMutationVariables = Exact<{
  fileId: Scalars['String']['input'];
  newFileName: Scalars['String']['input'];
}>;


export type RenameFileMutation = { __typename?: 'Mutation', renameFile: { __typename?: 'File', id: string, file_name: string, updated_at: string, updated_by: string, updated_by_user?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null } };

export type RemoveFileFromEntityMutationVariables = Exact<{
  fileId: Scalars['String']['input'];
}>;


export type RemoveFileFromEntityMutation = { __typename?: 'Mutation', removeFileFromEntity: { __typename?: 'File', id: string, file_name: string, deleted: boolean, updated_at: string, updated_by: string } };

export type InviteUserToWorkspaceMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  email: Scalars['String']['input'];
  roles: Array<WorkspaceUserRole> | WorkspaceUserRole;
}>;


export type InviteUserToWorkspaceMutation = { __typename?: 'Mutation', inviteUserToWorkspace?: { __typename?: 'WorkspaceMember', userId: string, roles: Array<WorkspaceUserRole> } | null };

export type AssignInventoryToRentalFulfilmentMutationVariables = Exact<{
  fulfilmentId: Scalars['ID']['input'];
  inventoryId: Scalars['ID']['input'];
  allowOverlappingReservations?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type AssignInventoryToRentalFulfilmentMutation = { __typename?: 'Mutation', assignInventoryToRentalFulfilment?: { __typename: 'RentalFulfilment', id: string, inventoryId?: string | null } | null };

export type UnassignInventoryFromRentalFulfilmentMutationVariables = Exact<{
  fulfilmentId: Scalars['ID']['input'];
}>;


export type UnassignInventoryFromRentalFulfilmentMutation = { __typename?: 'Mutation', unassignInventoryFromRentalFulfilment?: { __typename: 'RentalFulfilment', id: string, inventoryId?: string | null } | null };

export type CreateInventoryForFulfilmentTestMutationVariables = Exact<{
  input: CreateInventoryInput;
}>;


export type CreateInventoryForFulfilmentTestMutation = { __typename?: 'Mutation', createInventory: { __typename?: 'Inventory', id: string, companyId: string, status: InventoryStatus, pimCategoryId?: string | null, pimCategoryName?: string | null, assetId?: string | null } };

export type UtilListInventoryReservationsQueryVariables = Exact<{
  filter?: InputMaybe<ListInventoryReservationsFilter>;
  page?: InputMaybe<ListInventoryPage>;
}>;


export type UtilListInventoryReservationsQuery = { __typename?: 'Query', listInventoryReservations: { __typename?: 'InventoryReservationsResponse', items: Array<{ __typename: 'FulfilmentReservation', id: string, inventoryId: string, startDate: any, endDate: any, fulfilmentId: string, type: ReservationType, salesOrderType: FulfilmentType }> } };

export type RentalFulfilmentFieldsFragment = { __typename?: 'RentalFulfilment', id: string, contactId?: string | null, projectId?: string | null, salesOrderId: string, salesOrderLineItemId: string, purchaseOrderNumber: string, salesOrderType: FulfilmentType, workflowId?: string | null, workflowColumnId?: string | null, assignedToId?: string | null, createdAt: any, updatedAt: any, rentalStartDate?: any | null, rentalEndDate?: any | null, lastChargedAt?: any | null };

export type SaleFulfilmentFieldsFragment = { __typename?: 'SaleFulfilment', id: string, contactId?: string | null, projectId?: string | null, salesOrderId: string, salesOrderLineItemId: string, purchaseOrderNumber: string, salesOrderType: FulfilmentType, workflowId?: string | null, workflowColumnId?: string | null, assignedToId?: string | null, createdAt: any, updatedAt: any, unitCostInCents: number, quantity: number, salesOrderLineItem?: { __typename: 'RentalSalesOrderLineItem' } | { __typename: 'SaleSalesOrderLineItem', price?: { __typename: 'RentalPrice' } | { __typename: 'SalePrice', discounts?: any | null } | null } | null };

export type ServiceFulfilmentFieldsFragment = { __typename?: 'ServiceFulfilment', id: string, contactId?: string | null, projectId?: string | null, salesOrderId: string, salesOrderLineItemId: string, purchaseOrderNumber: string, salesOrderType: FulfilmentType, workflowId?: string | null, workflowColumnId?: string | null, assignedToId?: string | null, createdAt: any, updatedAt: any, serviceDate?: any | null };

export type CreateRentalFulfilmentMutationVariables = Exact<{
  input: CreateRentalFulfilmentInput;
}>;


export type CreateRentalFulfilmentMutation = { __typename?: 'Mutation', createRentalFulfilment?: { __typename?: 'RentalFulfilment', id: string, contactId?: string | null, projectId?: string | null, salesOrderId: string, salesOrderLineItemId: string, purchaseOrderNumber: string, salesOrderType: FulfilmentType, workflowId?: string | null, workflowColumnId?: string | null, assignedToId?: string | null, createdAt: any, updatedAt: any, rentalStartDate?: any | null, rentalEndDate?: any | null, lastChargedAt?: any | null } | null };

export type CreateSaleFulfilmentMutationVariables = Exact<{
  input: CreateSaleFulfilmentInput;
}>;


export type CreateSaleFulfilmentMutation = { __typename?: 'Mutation', createSaleFulfilment?: { __typename?: 'SaleFulfilment', id: string, contactId?: string | null, projectId?: string | null, salesOrderId: string, salesOrderLineItemId: string, purchaseOrderNumber: string, salesOrderType: FulfilmentType, workflowId?: string | null, workflowColumnId?: string | null, assignedToId?: string | null, createdAt: any, updatedAt: any, unitCostInCents: number, quantity: number, salesOrderLineItem?: { __typename: 'RentalSalesOrderLineItem' } | { __typename: 'SaleSalesOrderLineItem', price?: { __typename: 'RentalPrice' } | { __typename: 'SalePrice', discounts?: any | null } | null } | null } | null };

export type CreateServiceFulfilmentMutationVariables = Exact<{
  input: CreateServiceFulfilmentInput;
}>;


export type CreateServiceFulfilmentMutation = { __typename?: 'Mutation', createServiceFulfilment?: { __typename?: 'ServiceFulfilment', id: string, contactId?: string | null, projectId?: string | null, salesOrderId: string, salesOrderLineItemId: string, purchaseOrderNumber: string, salesOrderType: FulfilmentType, workflowId?: string | null, workflowColumnId?: string | null, assignedToId?: string | null, createdAt: any, updatedAt: any, serviceDate?: any | null } | null };

export type DeleteFulfilmentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteFulfilmentMutation = { __typename?: 'Mutation', deleteFulfilment?: boolean | null };

export type GetFulfilmentByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetFulfilmentByIdQuery = { __typename?: 'Query', getFulfilmentById?: { __typename: 'RentalFulfilment', id: string, contactId?: string | null, projectId?: string | null, salesOrderId: string, salesOrderLineItemId: string, purchaseOrderNumber: string, salesOrderType: FulfilmentType, workflowId?: string | null, workflowColumnId?: string | null, assignedToId?: string | null, createdAt: any, updatedAt: any, rentalStartDate?: any | null, rentalEndDate?: any | null, lastChargedAt?: any | null } | { __typename: 'SaleFulfilment', id: string, contactId?: string | null, projectId?: string | null, salesOrderId: string, salesOrderLineItemId: string, purchaseOrderNumber: string, salesOrderType: FulfilmentType, workflowId?: string | null, workflowColumnId?: string | null, assignedToId?: string | null, createdAt: any, updatedAt: any, unitCostInCents: number, quantity: number, salesOrderLineItem?: { __typename: 'RentalSalesOrderLineItem' } | { __typename: 'SaleSalesOrderLineItem', price?: { __typename: 'RentalPrice' } | { __typename: 'SalePrice', discounts?: any | null } | null } | null } | { __typename: 'ServiceFulfilment', id: string, contactId?: string | null, projectId?: string | null, salesOrderId: string, salesOrderLineItemId: string, purchaseOrderNumber: string, salesOrderType: FulfilmentType, workflowId?: string | null, workflowColumnId?: string | null, assignedToId?: string | null, createdAt: any, updatedAt: any, serviceDate?: any | null } | null };

export type ListFulfilmentsQueryVariables = Exact<{
  filter: ListFulfilmentsFilter;
  page?: InputMaybe<ListFulfilmentsPage>;
}>;


export type ListFulfilmentsQuery = { __typename?: 'Query', listFulfilments?: { __typename?: 'ListFulfilmentsResult', items: Array<{ __typename: 'RentalFulfilment', id: string, contactId?: string | null, projectId?: string | null, salesOrderId: string, salesOrderLineItemId: string, purchaseOrderNumber: string, salesOrderType: FulfilmentType, workflowId?: string | null, workflowColumnId?: string | null, assignedToId?: string | null, createdAt: any, updatedAt: any, rentalStartDate?: any | null, rentalEndDate?: any | null, lastChargedAt?: any | null } | { __typename: 'SaleFulfilment', id: string, contactId?: string | null, projectId?: string | null, salesOrderId: string, salesOrderLineItemId: string, purchaseOrderNumber: string, salesOrderType: FulfilmentType, workflowId?: string | null, workflowColumnId?: string | null, assignedToId?: string | null, createdAt: any, updatedAt: any, unitCostInCents: number, quantity: number, salesOrderLineItem?: { __typename: 'RentalSalesOrderLineItem' } | { __typename: 'SaleSalesOrderLineItem', price?: { __typename: 'RentalPrice' } | { __typename: 'SalePrice', discounts?: any | null } | null } | null } | { __typename: 'ServiceFulfilment', id: string, contactId?: string | null, projectId?: string | null, salesOrderId: string, salesOrderLineItemId: string, purchaseOrderNumber: string, salesOrderType: FulfilmentType, workflowId?: string | null, workflowColumnId?: string | null, assignedToId?: string | null, createdAt: any, updatedAt: any, serviceDate?: any | null }>, page: { __typename?: 'PaginationInfo', number: number, size: number } } | null };

export type UpdateFulfilmentColumnMutationVariables = Exact<{
  fulfilmentId: Scalars['ID']['input'];
  workflowColumnId: Scalars['ID']['input'];
  workflowId: Scalars['ID']['input'];
}>;


export type UpdateFulfilmentColumnMutation = { __typename?: 'Mutation', updateFulfilmentColumn?: { __typename?: 'RentalFulfilment', id: string, workflowId?: string | null, workflowColumnId?: string | null, updatedAt: any } | { __typename?: 'SaleFulfilment', id: string, workflowId?: string | null, workflowColumnId?: string | null, updatedAt: any } | { __typename?: 'ServiceFulfilment', id: string, workflowId?: string | null, workflowColumnId?: string | null, updatedAt: any } | null };

export type UpdateFulfilmentAssigneeMutationVariables = Exact<{
  fulfilmentId: Scalars['ID']['input'];
  assignedToId: Scalars['ID']['input'];
}>;


export type UpdateFulfilmentAssigneeMutation = { __typename?: 'Mutation', updateFulfilmentAssignee?: { __typename?: 'RentalFulfilment', id: string, assignedToId?: string | null, updatedAt: any } | { __typename?: 'SaleFulfilment', id: string, assignedToId?: string | null, updatedAt: any } | { __typename?: 'ServiceFulfilment', id: string, assignedToId?: string | null, updatedAt: any } | null };

export type SetRentalStartDateMutationVariables = Exact<{
  fulfilmentId: Scalars['ID']['input'];
  rentalStartDate: Scalars['DateTime']['input'];
}>;


export type SetRentalStartDateMutation = { __typename?: 'Mutation', setRentalStartDate?: { __typename?: 'RentalFulfilment', id: string, rentalStartDate?: any | null, rentalEndDate?: any | null, salesOrderType: FulfilmentType } | null };

export type SetRentalEndDateMutationVariables = Exact<{
  fulfilmentId: Scalars['ID']['input'];
  rentalEndDate: Scalars['DateTime']['input'];
}>;


export type SetRentalEndDateMutation = { __typename?: 'Mutation', setRentalEndDate?: { __typename?: 'RentalFulfilment', id: string, rentalStartDate?: any | null, rentalEndDate?: any | null, salesOrderType: FulfilmentType } | null };

export type SetExpectedRentalEndDateMutationVariables = Exact<{
  fulfilmentId: Scalars['ID']['input'];
  expectedRentalEndDate: Scalars['DateTime']['input'];
}>;


export type SetExpectedRentalEndDateMutation = { __typename?: 'Mutation', setExpectedRentalEndDate?: { __typename?: 'RentalFulfilment', id: string, expectedRentalEndDate?: any | null, rentalStartDate?: any | null, rentalEndDate?: any | null, salesOrderType: FulfilmentType } | null };

export type CreateRentalPurchaseOrderLineItemMutationVariables = Exact<{
  input: CreateRentalPurchaseOrderLineItemInput;
}>;


export type CreateRentalPurchaseOrderLineItemMutation = { __typename?: 'Mutation', createRentalPurchaseOrderLineItem?: { __typename?: 'RentalPurchaseOrderLineItem', id: string, purchase_order_id: string, price_id?: string | null, po_quantity?: number | null } | null };

export type SetFulfilmentPurchaseOrderLineItemIdMutationVariables = Exact<{
  fulfilmentId: Scalars['ID']['input'];
  purchaseOrderLineItemId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type SetFulfilmentPurchaseOrderLineItemIdMutation = { __typename?: 'Mutation', setFulfilmentPurchaseOrderLineItemId?: { __typename?: 'RentalFulfilment', id: string, purchaseOrderLineItemId?: string | null, updatedAt: any, purchaseOrderLineItem?: { __typename: 'RentalPurchaseOrderLineItem', id: string, purchase_order_id: string, purchaseOrder?: { __typename?: 'PurchaseOrder', id: string, purchase_order_number: string } | null } | { __typename: 'SalePurchaseOrderLineItem', id: string, purchase_order_id: string, purchaseOrder?: { __typename?: 'PurchaseOrder', id: string, purchase_order_number: string } | null } | null } | { __typename?: 'SaleFulfilment', id: string, purchaseOrderLineItemId?: string | null, updatedAt: any, purchaseOrderLineItem?: { __typename: 'RentalPurchaseOrderLineItem', id: string, purchase_order_id: string, purchaseOrder?: { __typename?: 'PurchaseOrder', id: string, purchase_order_number: string } | null } | { __typename: 'SalePurchaseOrderLineItem', id: string, purchase_order_id: string, purchaseOrder?: { __typename?: 'PurchaseOrder', id: string, purchase_order_number: string } | null } | null } | { __typename?: 'ServiceFulfilment', id: string, purchaseOrderLineItemId?: string | null, updatedAt: any, purchaseOrderLineItem?: { __typename: 'RentalPurchaseOrderLineItem', id: string, purchase_order_id: string, purchaseOrder?: { __typename?: 'PurchaseOrder', id: string, purchase_order_number: string } | null } | { __typename: 'SalePurchaseOrderLineItem', id: string, purchase_order_id: string, purchaseOrder?: { __typename?: 'PurchaseOrder', id: string, purchase_order_number: string } | null } | null } | null };

export type ListChargesQueryVariables = Exact<{
  filter: ListChargesFilter;
  page?: InputMaybe<PageInfoInput>;
}>;


export type ListChargesQuery = { __typename?: 'Query', listCharges?: { __typename?: 'ChargePage', items: Array<{ __typename?: 'Charge', id: string, amountInCents: number, description: string, chargeType: ChargeType, contactId: string, createdAt: any, projectId?: string | null, salesOrderId?: string | null, purchaseOrderNumber?: string | null, salesOrderLineItemId?: string | null, fulfilmentId?: string | null, invoiceId?: string | null, billingPeriodStart?: any | null, billingPeriodEnd?: any | null }> } | null };

export type ListRentalFulfilmentsQueryVariables = Exact<{
  filter: ListRentalFulfilmentsFilter;
  page?: InputMaybe<ListFulfilmentsPage>;
}>;


export type ListRentalFulfilmentsQuery = { __typename?: 'Query', listRentalFulfilments?: { __typename?: 'ListRentalFulfilmentsResult', items: Array<{ __typename?: 'RentalFulfilment', id: string, contactId?: string | null, projectId?: string | null, salesOrderId: string, salesOrderLineItemId: string, purchaseOrderNumber: string, salesOrderType: FulfilmentType, workflowId?: string | null, workflowColumnId?: string | null, assignedToId?: string | null, createdAt: any, updatedAt: any, rentalStartDate?: any | null, rentalEndDate?: any | null, expectedRentalEndDate?: any | null, inventoryId?: string | null, pricePerDayInCents: number, pricePerWeekInCents: number, pricePerMonthInCents: number, pimCategoryId?: string | null }>, page: { __typename?: 'PaginationInfo', number: number, size: number, totalItems: number, totalPages: number } } | null };

export type GetDefaultTemplatesQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type GetDefaultTemplatesQuery = { __typename?: 'Query', getDefaultTemplates: Array<{ __typename?: 'ReferenceNumberTemplate', id: string, workspaceId: string, type: ReferenceNumberType, template: string, seqPadding?: number | null, startAt?: number | null, resetFrequency: ResetFrequency, useGlobalSequence: boolean, createdBy: string, createdAt: any, updatedAt: any, updatedBy: string, businessContactId?: string | null, projectId?: string | null, deleted: boolean }> };

export type GetIntakeFormLineItemWithInventoryReservationsQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetIntakeFormLineItemWithInventoryReservationsQuery = { __typename?: 'Query', getIntakeFormSubmissionLineItem?: { __typename?: 'IntakeFormLineItem', id: string, fulfilmentId?: string | null, salesOrderLineItem?: { __typename?: 'RentalSalesOrderLineItem', id: string } | { __typename?: 'SaleSalesOrderLineItem', id: string } | null, inventoryReservations?: Array<{ __typename?: 'FulfilmentReservation', id: string, inventoryId: string, startDate: any, endDate: any }> | null } | null };

export type SubmitSalesOrderForPortalTestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SubmitSalesOrderForPortalTestMutation = { __typename?: 'Mutation', submitSalesOrder?: { __typename?: 'SalesOrder', id: string, status: SalesOrderStatus } | null };

export type ListFulfilmentsForPortalTestQueryVariables = Exact<{
  filter: ListFulfilmentsFilter;
}>;


export type ListFulfilmentsForPortalTestQuery = { __typename?: 'Query', listFulfilments?: { __typename?: 'ListFulfilmentsResult', items: Array<{ __typename: 'RentalFulfilment', id: string, salesOrderLineItemId: string, salesOrderType: FulfilmentType, rentalStartDate?: any | null, rentalEndDate?: any | null, inventoryId?: string | null } | { __typename: 'SaleFulfilment', id: string, salesOrderLineItemId: string, salesOrderType: FulfilmentType } | { __typename: 'ServiceFulfilment', id: string, salesOrderLineItemId: string, salesOrderType: FulfilmentType }> } | null };

export type SetRentalStartDateForPortalTestMutationVariables = Exact<{
  fulfilmentId: Scalars['ID']['input'];
  rentalStartDate: Scalars['DateTime']['input'];
}>;


export type SetRentalStartDateForPortalTestMutation = { __typename?: 'Mutation', setRentalStartDate?: { __typename?: 'RentalFulfilment', id: string, rentalStartDate?: any | null } | null };

export type SetRentalEndDateForPortalTestMutationVariables = Exact<{
  fulfilmentId: Scalars['ID']['input'];
  rentalEndDate: Scalars['DateTime']['input'];
}>;


export type SetRentalEndDateForPortalTestMutation = { __typename?: 'Mutation', setRentalEndDate?: { __typename?: 'RentalFulfilment', id: string, rentalEndDate?: any | null } | null };

export type AssignInventoryForPortalTestMutationVariables = Exact<{
  fulfilmentId: Scalars['ID']['input'];
  inventoryId: Scalars['ID']['input'];
}>;


export type AssignInventoryForPortalTestMutation = { __typename?: 'Mutation', assignInventoryToRentalFulfilment?: { __typename: 'RentalFulfilment', inventoryId?: string | null, id: string } | null };

export type CreateInventoryForPortalTestMutationVariables = Exact<{
  input: CreateInventoryInput;
}>;


export type CreateInventoryForPortalTestMutation = { __typename?: 'Mutation', createInventory: { __typename?: 'Inventory', id: string, status: InventoryStatus } };

export type GetIntakeFormSubmissionByIdForPortalTestQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetIntakeFormSubmissionByIdForPortalTestQuery = { __typename?: 'Query', getIntakeFormSubmissionById?: { __typename?: 'IntakeFormSubmission', id: string, formId: string, workspaceId: string, name?: string | null, email?: string | null, status: IntakeFormSubmissionStatus, salesOrder?: { __typename?: 'SubmissionSalesOrder', id: string, status: SalesOrderStatus, sales_order_number: string, purchase_order_number?: string | null, project?: { __typename?: 'IntakeFormProject', id: string, name: string } | null } | null, lineItems?: Array<{ __typename?: 'IntakeFormLineItem', id: string, description: string, quantity: number, type: RequestType, fulfilmentId?: string | null, salesOrderLineItem?: { __typename?: 'RentalSalesOrderLineItem', id: string, so_quantity?: number | null } | { __typename?: 'SaleSalesOrderLineItem', id: string, so_quantity?: number | null } | null, inventoryReservations?: Array<{ __typename?: 'FulfilmentReservation', id: string, inventoryId: string, startDate: any, endDate: any }> | null }> | null } | null };

export type ListIntakeFormSubmissionLineItemsForPortalTestQueryVariables = Exact<{
  submissionId: Scalars['String']['input'];
}>;


export type ListIntakeFormSubmissionLineItemsForPortalTestQuery = { __typename?: 'Query', listIntakeFormSubmissionLineItems: Array<{ __typename?: 'IntakeFormLineItem', id: string, description: string, quantity: number, type: RequestType, fulfilmentId?: string | null, salesOrderLineItem?: { __typename?: 'RentalSalesOrderLineItem', id: string, so_quantity?: number | null } | { __typename?: 'SaleSalesOrderLineItem', id: string, so_quantity?: number | null } | null, inventoryReservations?: Array<{ __typename?: 'FulfilmentReservation', id: string, inventoryId: string, startDate: any, endDate: any }> | null }> };

export type CreateIntakeFormMutationVariables = Exact<{
  input: IntakeFormInput;
}>;


export type CreateIntakeFormMutation = { __typename?: 'Mutation', createIntakeForm?: { __typename?: 'IntakeForm', id: string, workspaceId: string, projectId?: string | null, pricebookId?: string | null, isPublic: boolean, isActive: boolean, isDeleted: boolean, createdAt: any, updatedAt: any, sharedWithUserIds: Array<string>, sharedWithUsers: Array<{ __typename?: 'User', id: string, email: string, firstName: string, lastName: string } | null> } | null };

export type SetIntakeFormActiveMutationVariables = Exact<{
  id: Scalars['String']['input'];
  isActive: Scalars['Boolean']['input'];
}>;


export type SetIntakeFormActiveMutation = { __typename?: 'Mutation', setIntakeFormActive?: { __typename?: 'IntakeForm', id: string, isActive: boolean, isDeleted: boolean } | null };

export type DeleteIntakeFormMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteIntakeFormMutation = { __typename?: 'Mutation', deleteIntakeForm?: { __typename?: 'IntakeForm', id: string, isActive: boolean, isDeleted: boolean } | null };

export type GetIntakeFormByIdQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetIntakeFormByIdQuery = { __typename?: 'Query', getIntakeFormById?: { __typename?: 'IntakeForm', id: string, workspaceId: string, projectId?: string | null, isActive: boolean, isDeleted: boolean, createdAt: any, updatedAt: any, workspace?: { __typename?: 'IntakeFormWorkspace', id: string, name: string } | null, pricebook?: { __typename?: 'PriceBook', listPrices?: { __typename?: 'ListPricesResult', items: Array<{ __typename?: 'RentalPrice', id: string, pricePerDayInCents: number, pricePerWeekInCents: number, pricePerMonthInCents: number } | { __typename?: 'SalePrice', id: string, unitCostInCents: number }> } | null } | null } | null };

export type ListIntakeFormsQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type ListIntakeFormsQuery = { __typename?: 'Query', listIntakeForms?: { __typename?: 'IntakeFormPage', items: Array<{ __typename?: 'IntakeForm', id: string, workspaceId: string, projectId?: string | null, isActive: boolean, isDeleted: boolean, createdAt: any, updatedAt: any }>, page: { __typename?: 'IntakeFormPageInfo', number: number, size: number, totalItems: number, totalPages: number } } | null };

export type ListIntakeFormsWithWorkspaceQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type ListIntakeFormsWithWorkspaceQuery = { __typename?: 'Query', listIntakeForms?: { __typename?: 'IntakeFormPage', items: Array<{ __typename?: 'IntakeForm', id: string, workspaceId: string, projectId?: string | null, isActive: boolean, isDeleted: boolean, createdAt: any, updatedAt: any, workspace?: { __typename?: 'IntakeFormWorkspace', id: string, companyId: number, name: string, bannerImageUrl?: string | null, logoUrl?: string | null } | null }>, page: { __typename?: 'IntakeFormPageInfo', number: number, size: number, totalItems: number, totalPages: number } } | null };

export type CreateIntakeFormSubmissionMutationVariables = Exact<{
  input: IntakeFormSubmissionInput;
}>;


export type CreateIntakeFormSubmissionMutation = { __typename?: 'Mutation', createIntakeFormSubmission?: { __typename?: 'IntakeFormSubmission', id: string, userId?: string | null, formId: string, workspaceId: string, name?: string | null, email?: string | null, createdAt: any, phone?: string | null, companyName?: string | null, purchaseOrderNumber?: string | null, status: IntakeFormSubmissionStatus, submittedAt?: any | null, lineItems?: Array<{ __typename?: 'IntakeFormLineItem', id: string, startDate: any, description: string, quantity: number, durationInDays: number, type: RequestType, pimCategoryId: string, priceId?: string | null, customPriceName?: string | null, deliveryMethod: DeliveryMethod, deliveryLocation?: string | null, deliveryNotes?: string | null, rentalStartDate?: any | null, rentalEndDate?: any | null, salesOrderId?: string | null, salesOrderLineItem?: { __typename?: 'RentalSalesOrderLineItem', id: string } | { __typename?: 'SaleSalesOrderLineItem', id: string } | null }> | null } | null };

export type ListIntakeFormSubmissionsQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  intakeFormId?: InputMaybe<Scalars['String']['input']>;
}>;


export type ListIntakeFormSubmissionsQuery = { __typename?: 'Query', listIntakeFormSubmissions?: { __typename?: 'IntakeFormSubmissionPage', items: Array<{ __typename?: 'IntakeFormSubmission', id: string, userId?: string | null, formId: string, workspaceId: string, buyerWorkspaceId?: string | null, name?: string | null, email?: string | null, createdAt: any, phone?: string | null, companyName?: string | null, purchaseOrderNumber?: string | null, lineItems?: Array<{ __typename?: 'IntakeFormLineItem', id: string, startDate: any, description: string, quantity: number, durationInDays: number, type: RequestType, pimCategoryId: string, deliveryMethod: DeliveryMethod }> | null }>, page: { __typename?: 'IntakeFormSubmissionPageInfo', number: number, size: number, totalItems: number, totalPages: number } } | null };

export type ListIntakeFormSubmissionsAsBuyerQueryVariables = Exact<{
  buyerWorkspaceId: Scalars['String']['input'];
}>;


export type ListIntakeFormSubmissionsAsBuyerQuery = { __typename?: 'Query', listIntakeFormSubmissionsAsBuyer?: { __typename?: 'IntakeFormSubmissionPage', items: Array<{ __typename?: 'IntakeFormSubmission', id: string, userId?: string | null, formId: string, workspaceId: string, buyerWorkspaceId?: string | null, name?: string | null, email?: string | null, createdAt: any, phone?: string | null, companyName?: string | null, purchaseOrderNumber?: string | null, lineItems?: Array<{ __typename?: 'IntakeFormLineItem', id: string, startDate: any, description: string, quantity: number, durationInDays: number, type: RequestType, pimCategoryId: string, deliveryMethod: DeliveryMethod }> | null }>, page: { __typename?: 'IntakeFormSubmissionPageInfo', number: number, size: number, totalItems: number, totalPages: number } } | null };

export type UpdateIntakeFormSubmissionMutationVariables = Exact<{
  id: Scalars['String']['input'];
  input: UpdateIntakeFormSubmissionInput;
}>;


export type UpdateIntakeFormSubmissionMutation = { __typename?: 'Mutation', updateIntakeFormSubmission?: { __typename?: 'IntakeFormSubmission', id: string, userId?: string | null, formId: string, workspaceId: string, name?: string | null, email?: string | null, createdAt: any, phone?: string | null, companyName?: string | null, purchaseOrderNumber?: string | null, lineItems?: Array<{ __typename?: 'IntakeFormLineItem', id: string, startDate: any, description: string, quantity: number, durationInDays: number, type: RequestType, pimCategoryId: string, deliveryMethod: DeliveryMethod }> | null } | null };

export type GetIntakeFormSubmissionLineItemQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetIntakeFormSubmissionLineItemQuery = { __typename?: 'Query', getIntakeFormSubmissionLineItem?: { __typename?: 'IntakeFormLineItem', id: string, startDate: any, description: string, quantity: number, durationInDays: number, type: RequestType, pimCategoryId: string, priceId?: string | null, customPriceName?: string | null, deliveryMethod: DeliveryMethod, deliveryLocation?: string | null, deliveryNotes?: string | null, rentalStartDate?: any | null, rentalEndDate?: any | null, salesOrderId?: string | null, salesOrderLineItem?: { __typename?: 'RentalSalesOrderLineItem', id: string } | { __typename?: 'SaleSalesOrderLineItem', id: string } | null } | null };

export type ListIntakeFormSubmissionLineItemsQueryVariables = Exact<{
  submissionId: Scalars['String']['input'];
}>;


export type ListIntakeFormSubmissionLineItemsQuery = { __typename?: 'Query', listIntakeFormSubmissionLineItems: Array<{ __typename?: 'IntakeFormLineItem', id: string, startDate: any, description: string, quantity: number, durationInDays: number, type: RequestType, pimCategoryId: string, deliveryMethod: DeliveryMethod }> };

export type CreateIntakeFormSubmissionLineItemMutationVariables = Exact<{
  submissionId: Scalars['String']['input'];
  input: IntakeFormLineItemInput;
}>;


export type CreateIntakeFormSubmissionLineItemMutation = { __typename?: 'Mutation', createIntakeFormSubmissionLineItem?: { __typename?: 'IntakeFormLineItem', id: string, startDate: any, description: string, quantity: number, durationInDays: number, type: RequestType, pimCategoryId: string, priceId?: string | null, customPriceName?: string | null, deliveryMethod: DeliveryMethod, deliveryLocation?: string | null, deliveryNotes?: string | null, rentalStartDate?: any | null, rentalEndDate?: any | null, salesOrderId?: string | null, salesOrderLineItem?: { __typename?: 'RentalSalesOrderLineItem', id: string } | { __typename?: 'SaleSalesOrderLineItem', id: string } | null } | null };

export type UpdateIntakeFormSubmissionLineItemMutationVariables = Exact<{
  id: Scalars['String']['input'];
  input: IntakeFormLineItemInput;
}>;


export type UpdateIntakeFormSubmissionLineItemMutation = { __typename?: 'Mutation', updateIntakeFormSubmissionLineItem?: { __typename?: 'IntakeFormLineItem', id: string, startDate: any, description: string, quantity: number, durationInDays: number, type: RequestType, pimCategoryId: string, priceId?: string | null, customPriceName?: string | null, deliveryMethod: DeliveryMethod, deliveryLocation?: string | null, deliveryNotes?: string | null, rentalStartDate?: any | null, rentalEndDate?: any | null, salesOrderId?: string | null, salesOrderLineItem?: { __typename?: 'RentalSalesOrderLineItem', id: string } | { __typename?: 'SaleSalesOrderLineItem', id: string } | null } | null };

export type DeleteIntakeFormSubmissionLineItemMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteIntakeFormSubmissionLineItemMutation = { __typename?: 'Mutation', deleteIntakeFormSubmissionLineItem?: boolean | null };

export type SubmitIntakeFormSubmissionMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type SubmitIntakeFormSubmissionMutation = { __typename?: 'Mutation', submitIntakeFormSubmission?: { __typename?: 'IntakeFormSubmission', id: string, status: IntakeFormSubmissionStatus, submittedAt?: any | null, name?: string | null, email?: string | null } | null };

export type GetIntakeFormSubmissionByIdQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetIntakeFormSubmissionByIdQuery = { __typename?: 'Query', getIntakeFormSubmissionById?: { __typename?: 'IntakeFormSubmission', id: string, userId?: string | null, formId: string, workspaceId: string, name?: string | null, email?: string | null, createdAt: any, phone?: string | null, companyName?: string | null, purchaseOrderNumber?: string | null, status: IntakeFormSubmissionStatus, submittedAt?: any | null, lineItems?: Array<{ __typename?: 'IntakeFormLineItem', id: string, startDate: any, description: string, quantity: number, durationInDays: number, type: RequestType, pimCategoryId: string, deliveryMethod: DeliveryMethod }> | null } | null };

export type UpdateIntakeFormMutationVariables = Exact<{
  id: Scalars['String']['input'];
  input: UpdateIntakeFormInput;
}>;


export type UpdateIntakeFormMutation = { __typename?: 'Mutation', updateIntakeForm?: { __typename?: 'IntakeForm', id: string, workspaceId: string, projectId?: string | null, pricebookId?: string | null, isPublic: boolean, sharedWithUserIds: Array<string>, isActive: boolean, isDeleted: boolean, createdAt: any, updatedAt: any, sharedWithUsers: Array<{ __typename?: 'User', id: string, email: string } | null> } | null };

export type ListIntakeFormsForUserQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ListIntakeFormsForUserQuery = { __typename?: 'Query', listIntakeFormsForUser?: { __typename?: 'IntakeFormPage', items: Array<{ __typename?: 'IntakeForm', id: string, workspaceId: string, projectId?: string | null, pricebookId?: string | null, isPublic: boolean, sharedWithUserIds: Array<string>, isActive: boolean, isDeleted: boolean, createdAt: any, updatedAt: any }>, page: { __typename?: 'IntakeFormPageInfo', number: number, size: number, totalItems: number, totalPages: number } } | null };

export type AdoptOrphanedSubmissionsMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  submissionIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
}>;


export type AdoptOrphanedSubmissionsMutation = { __typename?: 'Mutation', adoptOrphanedSubmissions: { __typename?: 'AdoptOrphanedSubmissionsResult', adoptedCount: number, adoptedSubmissionIds: Array<string>, adoptedSubmissions: Array<{ __typename?: 'IntakeFormSubmission', id: string, userId?: string | null, formId: string, workspaceId: string, buyerWorkspaceId?: string | null, name?: string | null, email?: string | null }> } };

export type ListMyOrphanedSubmissionsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListMyOrphanedSubmissionsQuery = { __typename?: 'Query', listMyOrphanedSubmissions: Array<{ __typename?: 'IntakeFormSubmission', id: string, userId?: string | null, formId: string, workspaceId: string, buyerWorkspaceId?: string | null, name?: string | null, email?: string | null }> };

export type CreatePoForLineItemInventoryMutationVariables = Exact<{
  input?: InputMaybe<PurchaseOrderInput>;
}>;


export type CreatePoForLineItemInventoryMutation = { __typename?: 'Mutation', createPurchaseOrder?: { __typename?: 'PurchaseOrder', id: string, purchase_order_number: string } | null };

export type CreateSaleLineItemForInventoryMutationVariables = Exact<{
  input?: InputMaybe<CreateSalePurchaseOrderLineItemInput>;
}>;


export type CreateSaleLineItemForInventoryMutation = { __typename?: 'Mutation', createSalePurchaseOrderLineItem?: { __typename?: 'SalePurchaseOrderLineItem', id: string, purchase_order_id: string, lineitem_type: PoLineItemType } | null };

export type GetLineItemWithInventoryQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetLineItemWithInventoryQuery = { __typename?: 'Query', getPurchaseOrderLineItemById?: { __typename: 'RentalPurchaseOrderLineItem' } | { __typename: 'SalePurchaseOrderLineItem', id: string, inventory: Array<{ __typename?: 'Inventory', id: string, status: InventoryStatus, purchaseOrderLineItemId?: string | null }> } | null };

export type CreatePoForFulfillmentMutationVariables = Exact<{
  input?: InputMaybe<PurchaseOrderInput>;
}>;


export type CreatePoForFulfillmentMutation = { __typename?: 'Mutation', createPurchaseOrder?: { __typename?: 'PurchaseOrder', id: string, purchase_order_number: string } | null };

export type GetPoWithFulfillmentProgressQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetPoWithFulfillmentProgressQuery = { __typename?: 'Query', getPurchaseOrderById?: { __typename?: 'PurchaseOrder', id: string, inventory: Array<{ __typename?: 'Inventory', id: string, status: InventoryStatus }>, fulfillmentProgress?: { __typename?: 'PurchaseOrderFulfillmentProgress', totalItems: number, receivedItems: number, onOrderItems: number, fulfillmentPercentage: number, isFullyFulfilled: boolean, isPartiallyFulfilled: boolean, status: string } | null } | null };

export type CreatePoFullyFulfilledMutationVariables = Exact<{
  input?: InputMaybe<PurchaseOrderInput>;
}>;


export type CreatePoFullyFulfilledMutation = { __typename?: 'Mutation', createPurchaseOrder?: { __typename?: 'PurchaseOrder', id: string } | null };

export type GetFullyFulfilledPoQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetFullyFulfilledPoQuery = { __typename?: 'Query', getPurchaseOrderById?: { __typename?: 'PurchaseOrder', id: string, fulfillmentProgress?: { __typename?: 'PurchaseOrderFulfillmentProgress', totalItems: number, receivedItems: number, onOrderItems: number, fulfillmentPercentage: number, isFullyFulfilled: boolean, isPartiallyFulfilled: boolean, status: string } | null } | null };

export type CreatePoNoInventoryMutationVariables = Exact<{
  input?: InputMaybe<PurchaseOrderInput>;
}>;


export type CreatePoNoInventoryMutation = { __typename?: 'Mutation', createPurchaseOrder?: { __typename?: 'PurchaseOrder', id: string } | null };

export type GetEmptyPoQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetEmptyPoQuery = { __typename?: 'Query', getPurchaseOrderById?: { __typename?: 'PurchaseOrder', id: string, inventory: Array<{ __typename?: 'Inventory', id: string }>, fulfillmentProgress?: { __typename?: 'PurchaseOrderFulfillmentProgress', totalItems: number, receivedItems: number, onOrderItems: number, fulfillmentPercentage: number, isFullyFulfilled: boolean, isPartiallyFulfilled: boolean, status: string } | null } | null };

export type CreateInventoryWithReturnDatesMutationVariables = Exact<{
  input: CreateInventoryInput;
}>;


export type CreateInventoryWithReturnDatesMutation = { __typename?: 'Mutation', createInventory: { __typename?: 'Inventory', id: string, companyId: string, status: InventoryStatus, isThirdPartyRental: boolean, expectedReturnDate?: any | null, actualReturnDate?: any | null, createdAt: any, updatedAt: any, createdBy: string, updatedBy: string } };

export type UpdateInventoryExpectedReturnDateMutationVariables = Exact<{
  id: Scalars['String']['input'];
  expectedReturnDate: Scalars['DateTime']['input'];
}>;


export type UpdateInventoryExpectedReturnDateMutation = { __typename?: 'Mutation', updateInventoryExpectedReturnDate?: { __typename?: 'Inventory', id: string, companyId: string, status: InventoryStatus, isThirdPartyRental: boolean, expectedReturnDate?: any | null, actualReturnDate?: any | null, updatedAt: any, updatedBy: string } | null };

export type UpdateInventoryActualReturnDateMutationVariables = Exact<{
  id: Scalars['String']['input'];
  actualReturnDate: Scalars['DateTime']['input'];
}>;


export type UpdateInventoryActualReturnDateMutation = { __typename?: 'Mutation', updateInventoryActualReturnDate?: { __typename?: 'Inventory', id: string, companyId: string, status: InventoryStatus, isThirdPartyRental: boolean, expectedReturnDate?: any | null, actualReturnDate?: any | null, updatedAt: any, updatedBy: string } | null };

export type GetInventoryWithReturnDatesQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetInventoryWithReturnDatesQuery = { __typename?: 'Query', inventoryById?: { __typename?: 'Inventory', id: string, companyId: string, status: InventoryStatus, isThirdPartyRental: boolean, expectedReturnDate?: any | null, actualReturnDate?: any | null, createdAt: any, updatedAt: any, createdBy: string, updatedBy: string } | null };

export type CreateInventoryMutationVariables = Exact<{
  input: CreateInventoryInput;
}>;


export type CreateInventoryMutation = { __typename?: 'Mutation', createInventory: { __typename?: 'Inventory', id: string, companyId: string, workspaceId?: string | null, status: InventoryStatus, fulfilmentId?: string | null, purchaseOrderId?: string | null, purchaseOrderLineItemId?: string | null, isThirdPartyRental: boolean, assetId?: string | null, pimCategoryId?: string | null, pimCategoryPath?: string | null, pimCategoryName?: string | null, pimProductId?: string | null, createdAt: any, updatedAt: any, createdBy: string, updatedBy: string } };

export type BulkMarkInventoryReceivedMutationVariables = Exact<{
  input: BulkMarkInventoryReceivedInput;
}>;


export type BulkMarkInventoryReceivedMutation = { __typename?: 'Mutation', bulkMarkInventoryReceived: { __typename?: 'BulkMarkInventoryReceivedResult', totalProcessed: number, items: Array<{ __typename?: 'Inventory', id: string, companyId: string, status: InventoryStatus, fulfilmentId?: string | null, purchaseOrderId?: string | null, purchaseOrderLineItemId?: string | null, isThirdPartyRental: boolean, assetId?: string | null, pimCategoryId?: string | null, pimCategoryPath?: string | null, pimCategoryName?: string | null, pimProductId?: string | null, receivedAt?: any | null, receiptNotes?: string | null, resourceMapId?: string | null, conditionOnReceipt?: InventoryCondition | null, conditionNotes?: string | null, updatedAt: any, updatedBy: string }> } };

export type UpdateInventorySerialisedIdMutationVariables = Exact<{
  id: Scalars['String']['input'];
  input: UpdateInventorySerialisedIdInput;
}>;


export type UpdateInventorySerialisedIdMutation = { __typename?: 'Mutation', updateInventorySerialisedId?: { __typename?: 'Inventory', id: string, companyId: string, status: InventoryStatus, assetId?: string | null, updatedAt: any, updatedBy: string } | null };

export type DeleteInventoryMutationVariables = Exact<{
  id: Scalars['String']['input'];
  input: DeleteInventoryInput;
}>;


export type DeleteInventoryMutation = { __typename?: 'Mutation', deleteInventory: boolean };

export type InventoryByIdQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type InventoryByIdQuery = { __typename?: 'Query', inventoryById?: { __typename?: 'Inventory', id: string, companyId: string, workspaceId?: string | null, status: InventoryStatus, fulfilmentId?: string | null, purchaseOrderId?: string | null, purchaseOrderLineItemId?: string | null, isThirdPartyRental: boolean, assetId?: string | null, pimCategoryId?: string | null, pimCategoryPath?: string | null, pimCategoryName?: string | null, pimProductId?: string | null, createdAt: any, updatedAt: any, createdBy: string, updatedBy: string, purchaseOrderLineItem?: { __typename?: 'RentalPurchaseOrderLineItem', id: string, purchase_order_id: string, lineitem_type: PoLineItemType, po_quantity?: number | null, po_pim_id?: string | null } | { __typename?: 'SalePurchaseOrderLineItem', id: string, purchase_order_id: string, lineitem_type: PoLineItemType, po_quantity?: number | null, po_pim_id?: string | null } | null } | null };

export type ListInventoryItemsQueryVariables = Exact<{
  query?: InputMaybe<ListInventoryQuery>;
}>;


export type ListInventoryItemsQuery = { __typename?: 'Query', listInventory: { __typename?: 'InventoryResponse', items: Array<{ __typename?: 'Inventory', id: string, companyId: string, workspaceId?: string | null, status: InventoryStatus, fulfilmentId?: string | null, purchaseOrderId?: string | null, purchaseOrderLineItemId?: string | null, isThirdPartyRental: boolean, assetId?: string | null, pimCategoryId?: string | null, pimCategoryPath?: string | null, pimCategoryName?: string | null, pimProductId?: string | null, createdAt: any, updatedAt: any, createdBy: string, updatedBy: string, purchaseOrderLineItem?: { __typename?: 'RentalPurchaseOrderLineItem', id: string, purchase_order_id: string, lineitem_type: PoLineItemType, po_quantity?: number | null, po_pim_id?: string | null } | { __typename?: 'SalePurchaseOrderLineItem', id: string, purchase_order_id: string, lineitem_type: PoLineItemType, po_quantity?: number | null, po_pim_id?: string | null } | null }> } };

export type ListInventoryGroupedByPimCategoryIdQueryVariables = Exact<{
  query?: InputMaybe<ListInventoryQuery>;
}>;


export type ListInventoryGroupedByPimCategoryIdQuery = { __typename?: 'Query', listInventoryGroupedByPimCategoryId: { __typename?: 'InventoryGroupedByCategoryResponse', items: Array<{ __typename?: 'InventoryGroupedByCategory', pimCategoryId?: string | null, pimCategoryName?: string | null, pimCategoryPath?: string | null, quantityOnOrder: number, quantityReceived: number, totalQuantity: number, sampleInventoryIds: Array<string>, sampleInventories: Array<{ __typename?: 'Inventory', id: string, status: InventoryStatus, pimProductId?: string | null, pimCategoryId?: string | null, isThirdPartyRental: boolean, assetId?: string | null, asset?: { __typename?: 'Asset', id?: string | null, name?: string | null, pim_product_id?: string | null, pim_category_id?: string | null, pim_category_name?: string | null } | null } | null> }> } };

export type CreateWorkspaceForInvoiceMutationVariables = Exact<{
  name: Scalars['String']['input'];
  accessType: WorkspaceAccessType;
}>;


export type CreateWorkspaceForInvoiceMutation = { __typename?: 'Mutation', createWorkspace?: { __typename?: 'Workspace', id: string, name: string } | null };

export type AddTaxLineItemMutationVariables = Exact<{
  input: AddTaxLineItemInput;
}>;


export type AddTaxLineItemMutation = { __typename?: 'Mutation', addTaxLineItem: { __typename?: 'Invoice', id: string, totalTaxesInCents: number, finalSumInCents: number, taxLineItems: Array<{ __typename?: 'TaxLineItem', id: string, description: string, type: TaxType, value: number, calculatedAmountInCents?: number | null, order: number }> } };

export type UpdateTaxLineItemMutationVariables = Exact<{
  input: UpdateTaxLineItemInput;
}>;


export type UpdateTaxLineItemMutation = { __typename?: 'Mutation', updateTaxLineItem: { __typename?: 'Invoice', id: string, totalTaxesInCents: number, finalSumInCents: number, taxLineItems: Array<{ __typename?: 'TaxLineItem', id: string, description: string, type: TaxType, value: number, calculatedAmountInCents?: number | null, order: number }> } };

export type RemoveTaxLineItemMutationVariables = Exact<{
  input: RemoveTaxLineItemInput;
}>;


export type RemoveTaxLineItemMutation = { __typename?: 'Mutation', removeTaxLineItem: { __typename?: 'Invoice', id: string, totalTaxesInCents: number, finalSumInCents: number, taxLineItems: Array<{ __typename?: 'TaxLineItem', id: string, description: string, type: TaxType, value: number, calculatedAmountInCents?: number | null, order: number }> } };

export type ClearInvoiceTaxesMutationVariables = Exact<{
  invoiceId: Scalars['ID']['input'];
}>;


export type ClearInvoiceTaxesMutation = { __typename?: 'Mutation', clearInvoiceTaxes: { __typename?: 'Invoice', id: string, totalTaxesInCents: number, finalSumInCents: number, taxLineItems: Array<{ __typename?: 'TaxLineItem', id: string }> } };

export type InvoiceByIdWithTaxesQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type InvoiceByIdWithTaxesQuery = { __typename?: 'Query', invoiceById?: { __typename?: 'Invoice', id: string, status: InvoiceStatus, invoicePaidDate?: any | null, updatedBy?: string | null, subTotalInCents: number, taxesInCents: number, finalSumInCents: number, taxPercent: number, totalTaxesInCents: number, taxLineItems: Array<{ __typename?: 'TaxLineItem', id: string, description: string, type: TaxType, value: number, calculatedAmountInCents?: number | null, order: number }>, lineItems: Array<{ __typename?: 'InvoiceLineItem', chargeId: string, description: string, totalInCents: number }> } | null };

export type CreateInvoiceMutationVariables = Exact<{
  input: CreateInvoiceInput;
}>;


export type CreateInvoiceMutation = { __typename?: 'Mutation', createInvoice: { __typename?: 'Invoice', id: string, status: InvoiceStatus, buyerId: string, sellerId: string, companyId: string, invoiceSentDate?: any | null, updatedBy?: string | null } };

export type MarkInvoiceAsSentMutationVariables = Exact<{
  input: MarkInvoiceAsSentInput;
}>;


export type MarkInvoiceAsSentMutation = { __typename?: 'Mutation', markInvoiceAsSent: { __typename?: 'Invoice', id: string, status: InvoiceStatus, invoiceSentDate?: any | null, updatedBy?: string | null } };

export type DeleteInvoiceMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteInvoiceMutation = { __typename?: 'Mutation', deleteInvoice: boolean };

export type MarkInvoiceAsPaidMutationVariables = Exact<{
  input: MarkInvoiceAsPaidInput;
}>;


export type MarkInvoiceAsPaidMutation = { __typename?: 'Mutation', markInvoiceAsPaid: { __typename?: 'Invoice', id: string, status: InvoiceStatus, invoicePaidDate?: any | null, updatedBy?: string | null } };

export type CancelInvoiceMutationVariables = Exact<{
  input: CancelInvoiceInput;
}>;


export type CancelInvoiceMutation = { __typename?: 'Mutation', cancelInvoice: { __typename?: 'Invoice', id: string, status: InvoiceStatus, updatedBy?: string | null } };

export type InvoiceByIdQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type InvoiceByIdQuery = { __typename?: 'Query', invoiceById?: { __typename?: 'Invoice', id: string, status: InvoiceStatus, invoicePaidDate?: any | null, updatedBy?: string | null, subTotalInCents: number, taxesInCents: number, finalSumInCents: number, taxPercent: number, lineItems: Array<{ __typename?: 'InvoiceLineItem', chargeId: string, description: string, totalInCents: number, charge?: { __typename?: 'Charge', id: string, amountInCents: number, description: string, chargeType: ChargeType, contactId: string, invoiceId?: string | null } | null }> } | null };

export type AddInvoiceChargesMutationVariables = Exact<{
  input: AddInvoiceChargesInput;
}>;


export type AddInvoiceChargesMutation = { __typename?: 'Mutation', addInvoiceCharges: { __typename?: 'Invoice', id: string, lineItems: Array<{ __typename?: 'InvoiceLineItem', chargeId: string, description: string, totalInCents: number }> } };

export type CreateChargeForInvoiceMutationVariables = Exact<{
  input: CreateChargeInput;
}>;


export type CreateChargeForInvoiceMutation = { __typename?: 'Mutation', createCharge?: { __typename?: 'Charge', id: string, amountInCents: number, description: string, chargeType: ChargeType, contactId: string, invoiceId?: string | null } | null };

export type ListChargesForInvoiceQueryVariables = Exact<{
  filter: ListChargesFilter;
  page?: InputMaybe<PageInfoInput>;
}>;


export type ListChargesForInvoiceQuery = { __typename?: 'Query', listCharges?: { __typename?: 'ChargePage', items: Array<{ __typename?: 'Charge', id: string, amountInCents: number, description: string, chargeType: ChargeType, contactId: string, invoiceId?: string | null }>, page: { __typename?: 'PaginationInfo', number: number, size: number, totalItems: number, totalPages: number } } | null };

export type CreateProjectForMcpMutationVariables = Exact<{
  input: ProjectInput;
}>;


export type CreateProjectForMcpMutation = { __typename?: 'Mutation', createProject?: { __typename?: 'Project', id: string, name: string, workspaceId: string } | null };

export type CreateBusinessContactForMcpMutationVariables = Exact<{
  input: BusinessContactInput;
}>;


export type CreateBusinessContactForMcpMutation = { __typename?: 'Mutation', createBusinessContact?: { __typename?: 'BusinessContact', id: string, name: string, workspaceId: string } | null };

export type CreatePersonContactForMcpMutationVariables = Exact<{
  input: PersonContactInput;
}>;


export type CreatePersonContactForMcpMutation = { __typename?: 'Mutation', createPersonContact?: { __typename?: 'PersonContact', id: string, name: string, email: string, businessId: string, workspaceId: string } | null };

export type CreatePimCategoryForMcpMutationVariables = Exact<{
  input: UpsertPimCategoryInput;
}>;


export type CreatePimCategoryForMcpMutation = { __typename?: 'Mutation', upsertPimCategory?: { __typename?: 'PimCategory', id: string, name: string } | null };

export type CreatePriceBookForMcpMutationVariables = Exact<{
  input: CreatePriceBookInput;
}>;


export type CreatePriceBookForMcpMutation = { __typename?: 'Mutation', createPriceBook?: { __typename?: 'PriceBook', id: string, name: string, workspaceId: string } | null };

export type CreateRentalPriceForMcpMutationVariables = Exact<{
  input: CreateRentalPriceInput;
}>;


export type CreateRentalPriceForMcpMutation = { __typename?: 'Mutation', createRentalPrice?: { __typename?: 'RentalPrice', id: string, name?: string | null, priceType: PriceType, priceBookId?: string | null } | null };

export type GetNoteByIdQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetNoteByIdQuery = { __typename?: 'Query', getNoteById?: { __typename?: 'Note', _id: string, workspace_id: string, parent_entity_id: string, value: any, created_by: string, created_at: any, updated_at: any } | null };

export type CreateNoteMutationVariables = Exact<{
  input: NoteInput;
}>;


export type CreateNoteMutation = { __typename?: 'Mutation', createNote?: { __typename?: 'Note', _id: string, workspace_id: string, parent_entity_id: string, value: any, created_by: string, created_at: any, updated_at: any } | null };

export type ListNotesByEntityIdQueryVariables = Exact<{
  parent_entity_id: Scalars['String']['input'];
}>;


export type ListNotesByEntityIdQuery = { __typename?: 'Query', listNotesByEntityId: Array<{ __typename?: 'Note', _id: string, workspace_id: string, parent_entity_id: string, value: any, created_by: string }> };

export type UpdateNoteMutationVariables = Exact<{
  id: Scalars['String']['input'];
  value: Scalars['JSON']['input'];
}>;


export type UpdateNoteMutation = { __typename?: 'Mutation', updateNote?: { __typename?: 'Note', _id: string, workspace_id: string, value: any, updated_at: any } | null };

export type DeleteNoteMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteNoteMutation = { __typename?: 'Mutation', deleteNote?: { __typename?: 'Note', _id: string, deleted: boolean } | null };

export type CreatePimCategoryForPriceBooksMutationVariables = Exact<{
  input: UpsertPimCategoryInput;
}>;


export type CreatePimCategoryForPriceBooksMutation = { __typename?: 'Mutation', upsertPimCategory?: { __typename?: 'PimCategory', id: string, name: string } | null };

export type CreatePriceBookMutationVariables = Exact<{
  input: CreatePriceBookInput;
}>;


export type CreatePriceBookMutation = { __typename?: 'Mutation', createPriceBook?: { __typename?: 'PriceBook', id: string, name: string } | null };

export type UpdatePriceBookMutationVariables = Exact<{
  input: UpdatePriceBookInput;
}>;


export type UpdatePriceBookMutation = { __typename?: 'Mutation', updatePriceBook?: { __typename?: 'PriceBook', id: string, name: string, notes?: string | null, location?: string | null, businessContactId?: string | null, projectId?: string | null, updatedAt: any } | null };

export type ListPriceBooksQueryVariables = Exact<{
  filter: ListPriceBooksFilter;
  page: ListPriceBooksPage;
}>;


export type ListPriceBooksQuery = { __typename?: 'Query', listPriceBooks?: { __typename?: 'ListPriceBooksResult', items: Array<{ __typename?: 'PriceBook', id: string, name: string }>, page: { __typename?: 'PaginationInfo', number: number, size: number } } | null };

export type GetPriceBookByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetPriceBookByIdQuery = { __typename?: 'Query', getPriceBookById?: { __typename?: 'PriceBook', id: string, name: string, updatedAt: any } | null };

export type ListPriceBookCategoriesQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  priceBookId?: InputMaybe<Scalars['String']['input']>;
}>;


export type ListPriceBookCategoriesQuery = { __typename?: 'Query', listPriceBookCategories: Array<{ __typename?: 'PimCategory', id: string, name: string }> };

export type DeletePriceBookByIdMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeletePriceBookByIdMutation = { __typename?: 'Mutation', deletePriceBookById?: boolean | null };

export type CreateRentalPriceForPriceBooksMutationVariables = Exact<{
  input: CreateRentalPriceInput;
}>;


export type CreateRentalPriceForPriceBooksMutation = { __typename?: 'Mutation', createRentalPrice?: { __typename?: 'RentalPrice', id: string, priceBookId?: string | null, pimCategoryId: string } | null };

export type CreatePimCategoryForPricesMutationVariables = Exact<{
  input: UpsertPimCategoryInput;
}>;


export type CreatePimCategoryForPricesMutation = { __typename?: 'Mutation', upsertPimCategory?: { __typename?: 'PimCategory', id: string, name: string } | null };

export type CreatePriceBookForPricesMutationVariables = Exact<{
  input: CreatePriceBookInput;
}>;


export type CreatePriceBookForPricesMutation = { __typename?: 'Mutation', createPriceBook?: { __typename?: 'PriceBook', id: string, name: string } | null };

export type CreateRentalPriceForPricesMutationVariables = Exact<{
  input: CreateRentalPriceInput;
}>;


export type CreateRentalPriceForPricesMutation = { __typename?: 'Mutation', createRentalPrice?: { __typename?: 'RentalPrice', id: string, priceBookId?: string | null, pimCategoryId: string, pimCategoryName: string, pimCategoryPath: string, pricePerDayInCents: number } | null };

export type CreateSalePriceForPricesMutationVariables = Exact<{
  input: CreateSalePriceInput;
}>;


export type CreateSalePriceForPricesMutation = { __typename?: 'Mutation', createSalePrice?: { __typename?: 'SalePrice', id: string, priceBookId?: string | null, pimCategoryId: string, pimCategoryName: string, pimCategoryPath: string, unitCostInCents: number } | null };

export type ListPricesQueryVariables = Exact<{
  filter: ListPricesFilter;
  page: ListPricesPage;
}>;


export type ListPricesQuery = { __typename?: 'Query', listPrices?: { __typename?: 'ListPricesResult', items: Array<{ __typename?: 'RentalPrice', id: string, priceBookId?: string | null, pimCategoryId: string, pricePerDayInCents: number } | { __typename?: 'SalePrice', id: string, priceBookId?: string | null, pimCategoryId: string, unitCostInCents: number }>, page: { __typename?: 'PaginationInfo', number: number, size: number } } | null };

export type DeletePriceByIdMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeletePriceByIdMutation = { __typename?: 'Mutation', deletePriceById?: boolean | null };

export type CreateBusinessContactForPricesMutationVariables = Exact<{
  input: BusinessContactInput;
}>;


export type CreateBusinessContactForPricesMutation = { __typename?: 'Mutation', createBusinessContact?: { __typename?: 'BusinessContact', id: string, name: string } | null };

export type CreateProjectForPricesMutationVariables = Exact<{
  input?: InputMaybe<ProjectInput>;
}>;


export type CreateProjectForPricesMutation = { __typename?: 'Mutation', createProject?: { __typename?: 'Project', id: string, name: string, project_code: string } | null };

export type CalculateSubTotalQueryVariables = Exact<{
  priceId: Scalars['ID']['input'];
  durationInDays: Scalars['Int']['input'];
}>;


export type CalculateSubTotalQuery = { __typename?: 'Query', calculateSubTotal: { __typename?: 'LineItemPriceForecast', accumulative_cost_in_cents: number, days: Array<{ __typename?: 'LineItemPriceForecastDay', day: number, accumulative_cost_in_cents: number, cost_in_cents: number, strategy: string, savings_compared_to_day_rate_in_cents: number, savings_compared_to_day_rate_in_fraction: number, savings_compared_to_exact_split_in_cents: number, rental_period: { __typename?: 'LineItemRentalPeriod', days1: number, days7: number, days28: number } }> } };

export type GetRentalPriceWithCalculateSubTotalQueryVariables = Exact<{
  priceId: Scalars['ID']['input'];
  durationInDays: Scalars['Int']['input'];
}>;


export type GetRentalPriceWithCalculateSubTotalQuery = { __typename?: 'Query', getPriceById?: { __typename: 'RentalPrice', id: string, pricePerDayInCents: number, pricePerWeekInCents: number, pricePerMonthInCents: number, calculateSubTotal: { __typename?: 'LineItemPriceForecast', accumulative_cost_in_cents: number, days: Array<{ __typename?: 'LineItemPriceForecastDay', day: number, accumulative_cost_in_cents: number, cost_in_cents: number, strategy: string }> } } | { __typename: 'SalePrice' } | null };

export type GetPriceByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetPriceByIdQuery = { __typename?: 'Query', getPriceById?: { __typename?: 'RentalPrice', id: string, pricePerDayInCents: number, pricePerWeekInCents: number, pricePerMonthInCents: number } | { __typename?: 'SalePrice', id: string, unitCostInCents: number } | null };

export type ListProjectsQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type ListProjectsQuery = { __typename?: 'Query', listProjects?: Array<{ __typename?: 'Project', id: string, name: string, project_code: string, description?: string | null, deleted: boolean, scope_of_work?: Array<ScopeOfWorkEnum | null> | null, project_contacts?: Array<{ __typename?: 'ProjectContact', contact_id: string, relation_to_project: ProjectContactRelationEnum }> | null } | null> | null };

export type DeleteProjectMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteProjectMutation = { __typename?: 'Mutation', deleteProject?: { __typename?: 'Project', id: string, scope_of_work?: Array<ScopeOfWorkEnum | null> | null, project_contacts?: Array<{ __typename?: 'ProjectContact', contact_id: string, relation_to_project: ProjectContactRelationEnum }> | null } | null };

export type CreateProjectMutationVariables = Exact<{
  input?: InputMaybe<ProjectInput>;
}>;


export type CreateProjectMutation = { __typename?: 'Mutation', createProject?: { __typename?: 'Project', id: string, name: string, project_code: string, description?: string | null, created_by: string, created_at: string, updated_at: string, deleted: boolean, scope_of_work?: Array<ScopeOfWorkEnum | null> | null, status?: ProjectStatusEnum | null, project_contacts?: Array<{ __typename?: 'ProjectContact', contact_id: string, relation_to_project: ProjectContactRelationEnum }> | null } | null };

export type UpdateProjectMutationVariables = Exact<{
  id: Scalars['String']['input'];
  input?: InputMaybe<ProjectInput>;
}>;


export type UpdateProjectMutation = { __typename?: 'Mutation', updateProject?: { __typename?: 'Project', id: string, name: string, project_code: string, description?: string | null, created_by: string, created_at: string, updated_at: string, deleted: boolean, scope_of_work?: Array<ScopeOfWorkEnum | null> | null, status?: ProjectStatusEnum | null, project_contacts?: Array<{ __typename?: 'ProjectContact', contact_id: string, relation_to_project: ProjectContactRelationEnum }> | null } | null };

export type GetProjectByIdQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetProjectByIdQuery = { __typename?: 'Query', getProjectById?: { __typename?: 'Project', id: string, name: string, project_code: string, description?: string | null, created_by: string, created_at: string, updated_at: string, deleted: boolean, scope_of_work?: Array<ScopeOfWorkEnum | null> | null, status?: ProjectStatusEnum | null, project_contacts?: Array<{ __typename?: 'ProjectContact', contact_id: string, relation_to_project: ProjectContactRelationEnum }> | null } | null };

export type GetProjectWithContactQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetProjectWithContactQuery = { __typename?: 'Query', getProjectById?: { __typename?: 'Project', id: string, name: string, project_contacts?: Array<{ __typename?: 'ProjectContact', contact_id: string, relation_to_project: ProjectContactRelationEnum, contact?: { __typename?: 'BusinessContact', id: string, name: string, contactType: ContactType } | { __typename?: 'PersonContact', id: string, name: string, contactType: ContactType, businessId: string } | null }> | null } | null };

export type GetProjectWithAssociatedPriceBooksQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetProjectWithAssociatedPriceBooksQuery = { __typename?: 'Query', getProjectById?: { __typename?: 'Project', id: string, name: string, project_code: string, associatedPriceBooks?: { __typename?: 'ListPriceBooksResult', items: Array<{ __typename?: 'PriceBook', id: string, name: string, projectId?: string | null, workspaceId: string }>, page: { __typename?: 'PaginationInfo', number: number, size: number } } | null } | null };

export type GetProjectWithDescendantCountQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetProjectWithDescendantCountQuery = { __typename?: 'Query', getProjectById?: { __typename?: 'Project', id: string, name: string, project_code: string, parent_project?: string | null, totalDescendantCount: number, sub_projects?: Array<{ __typename?: 'Project', id: string, name: string, totalDescendantCount: number } | null> | null } | null };

export type CreatePurchaseOrderForFulfilmentTestMutationVariables = Exact<{
  input?: InputMaybe<PurchaseOrderInput>;
}>;


export type CreatePurchaseOrderForFulfilmentTestMutation = { __typename?: 'Mutation', createPurchaseOrder?: { __typename?: 'PurchaseOrder', id: string, purchase_order_number: string, seller_id: string, project_id?: string | null, company_id: string, status: PurchaseOrderStatus } | null };

export type CreateRentalPoLineItemForFulfilmentTestMutationVariables = Exact<{
  input?: InputMaybe<CreateRentalPurchaseOrderLineItemInput>;
}>;


export type CreateRentalPoLineItemForFulfilmentTestMutation = { __typename?: 'Mutation', createRentalPurchaseOrderLineItem?: { __typename?: 'RentalPurchaseOrderLineItem', id: string, purchase_order_id: string, po_pim_id?: string | null, po_quantity?: number | null, lineitem_type: PoLineItemType } | null };

export type CreateSalesOrderForFulfilmentTestMutationVariables = Exact<{
  input?: InputMaybe<SalesOrderInput>;
}>;


export type CreateSalesOrderForFulfilmentTestMutation = { __typename?: 'Mutation', createSalesOrder?: { __typename?: 'SalesOrder', id: string, purchase_order_number?: string | null, buyer_id: string, company_id: string, status: SalesOrderStatus } | null };

export type CreateRentalSoLineItemForFulfilmentTestMutationVariables = Exact<{
  input: CreateRentalSalesOrderLineItemInput;
}>;


export type CreateRentalSoLineItemForFulfilmentTestMutation = { __typename?: 'Mutation', createRentalSalesOrderLineItem?: { __typename?: 'RentalSalesOrderLineItem', id: string, sales_order_id: string, so_pim_id?: string | null, so_quantity?: number | null, lineitem_type: LineItemType } | null };

export type CreateRentalPriceForFulfilmentTestMutationVariables = Exact<{
  input: CreateRentalPriceInput;
}>;


export type CreateRentalPriceForFulfilmentTestMutation = { __typename?: 'Mutation', createRentalPrice?: { __typename?: 'RentalPrice', id: string, name?: string | null, priceType: PriceType } | null };

export type CreatePimCategoryForTestMutationVariables = Exact<{
  input: UpsertPimCategoryInput;
}>;


export type CreatePimCategoryForTestMutation = { __typename?: 'Mutation', upsertPimCategory?: { __typename?: 'PimCategory', id: string, name: string, path: string } | null };

export type CreateRentalFulfilmentForTestMutationVariables = Exact<{
  input: CreateRentalFulfilmentInput;
}>;


export type CreateRentalFulfilmentForTestMutation = { __typename?: 'Mutation', createRentalFulfilment?: { __typename?: 'RentalFulfilment', id: string, salesOrderId: string, salesOrderLineItemId: string, inventoryId?: string | null, purchaseOrderLineItemId?: string | null } | null };

export type SetFulfilmentPurchaseOrderLineItemForTestMutationVariables = Exact<{
  fulfilmentId: Scalars['ID']['input'];
  purchaseOrderLineItemId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type SetFulfilmentPurchaseOrderLineItemForTestMutation = { __typename?: 'Mutation', setFulfilmentPurchaseOrderLineItemId?: { __typename?: 'RentalFulfilment', inventoryId?: string | null, id: string, purchaseOrderLineItemId?: string | null } | { __typename?: 'SaleFulfilment', id: string, purchaseOrderLineItemId?: string | null } | { __typename?: 'ServiceFulfilment', id: string, purchaseOrderLineItemId?: string | null } | null };

export type SubmitPurchaseOrderForFulfilmentTestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SubmitPurchaseOrderForFulfilmentTestMutation = { __typename?: 'Mutation', submitPurchaseOrder?: { __typename?: 'PurchaseOrder', id: string, status: PurchaseOrderStatus } | null };

export type ListRentalFulfilmentsForTestQueryVariables = Exact<{
  filter: ListRentalFulfilmentsFilter;
}>;


export type ListRentalFulfilmentsForTestQuery = { __typename?: 'Query', listRentalFulfilments?: { __typename?: 'ListRentalFulfilmentsResult', items: Array<{ __typename?: 'RentalFulfilment', id: string, salesOrderId: string, salesOrderLineItemId: string, inventoryId?: string | null, purchaseOrderLineItemId?: string | null }> } | null };

export type ListInventoryForFulfilmentTestQueryVariables = Exact<{
  query?: InputMaybe<ListInventoryQuery>;
}>;


export type ListInventoryForFulfilmentTestQuery = { __typename?: 'Query', listInventory: { __typename?: 'InventoryResponse', items: Array<{ __typename?: 'Inventory', id: string, status: InventoryStatus, purchaseOrderId?: string | null, purchaseOrderLineItemId?: string | null, isThirdPartyRental: boolean }> } };

export type CreatePurchaseOrderForInventoryTestMutationVariables = Exact<{
  input?: InputMaybe<PurchaseOrderInput>;
}>;


export type CreatePurchaseOrderForInventoryTestMutation = { __typename?: 'Mutation', createPurchaseOrder?: { __typename?: 'PurchaseOrder', id: string, purchase_order_number: string, seller_id: string, project_id?: string | null, company_id: string, status: PurchaseOrderStatus } | null };

export type CreateRentalPoLineItemForInventoryTestMutationVariables = Exact<{
  input?: InputMaybe<CreateRentalPurchaseOrderLineItemInput>;
}>;


export type CreateRentalPoLineItemForInventoryTestMutation = { __typename?: 'Mutation', createRentalPurchaseOrderLineItem?: { __typename?: 'RentalPurchaseOrderLineItem', id: string, purchase_order_id: string, po_pim_id?: string | null, po_quantity?: number | null, lineitem_type: PoLineItemType } | null };

export type CreateSalePoLineItemForInventoryTestMutationVariables = Exact<{
  input?: InputMaybe<CreateSalePurchaseOrderLineItemInput>;
}>;


export type CreateSalePoLineItemForInventoryTestMutation = { __typename?: 'Mutation', createSalePurchaseOrderLineItem?: { __typename?: 'SalePurchaseOrderLineItem', id: string, purchase_order_id: string, po_pim_id?: string | null, po_quantity?: number | null, lineitem_type: PoLineItemType } | null };

export type SubmitPurchaseOrderForInventoryTestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SubmitPurchaseOrderForInventoryTestMutation = { __typename?: 'Mutation', submitPurchaseOrder?: { __typename?: 'PurchaseOrder', id: string, status: PurchaseOrderStatus } | null };

export type ListInventoryForTestQueryVariables = Exact<{
  query?: InputMaybe<ListInventoryQuery>;
}>;


export type ListInventoryForTestQuery = { __typename?: 'Query', listInventory: { __typename?: 'InventoryResponse', items: Array<{ __typename?: 'Inventory', id: string, status: InventoryStatus, purchaseOrderId?: string | null, purchaseOrderLineItemId?: string | null, isThirdPartyRental: boolean, pimProductId?: string | null, pimCategoryId?: string | null, pimCategoryPath?: string | null, pimCategoryName?: string | null, workspaceId?: string | null }> } };

export type CreateProjectForPurchaseOrderMutationVariables = Exact<{
  input?: InputMaybe<ProjectInput>;
}>;


export type CreateProjectForPurchaseOrderMutation = { __typename?: 'Mutation', createProject?: { __typename?: 'Project', id: string, name: string, project_code: string, description?: string | null, deleted: boolean } | null };

export type CreatePersonContact_PurchaseOrderMutationVariables = Exact<{
  input: PersonContactInput;
}>;


export type CreatePersonContact_PurchaseOrderMutation = { __typename?: 'Mutation', createPersonContact?: { __typename?: 'PersonContact', id: string, name: string, email: string, role?: string | null, workspaceId: string, businessId: string, contactType: ContactType } | null };

export type CreatePurchaseOrderMutationVariables = Exact<{
  input?: InputMaybe<PurchaseOrderInput>;
}>;


export type CreatePurchaseOrderMutation = { __typename?: 'Mutation', createPurchaseOrder?: { __typename?: 'PurchaseOrder', id: string, purchase_order_number: string, seller_id: string, project_id?: string | null, company_id: string, created_at: string, created_by: string, updated_at: string, updated_by: string, status: PurchaseOrderStatus, line_items?: Array<{ __typename?: 'RentalPurchaseOrderLineItem', id: string, po_pim_id?: string | null, po_quantity?: number | null } | { __typename?: 'SalePurchaseOrderLineItem', id: string, po_pim_id?: string | null, po_quantity?: number | null } | null> | null } | null };

export type GetPurchaseOrderByIdQueryVariables = Exact<{
  id?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetPurchaseOrderByIdQuery = { __typename?: 'Query', getPurchaseOrderById?: { __typename?: 'PurchaseOrder', id: string, purchase_order_number: string, seller_id: string, project_id?: string | null, company_id: string, created_at: string, created_by: string, updated_at: string, updated_by: string, status: PurchaseOrderStatus, line_items?: Array<{ __typename?: 'RentalPurchaseOrderLineItem', id: string, po_pim_id?: string | null, po_quantity?: number | null } | { __typename?: 'SalePurchaseOrderLineItem', id: string, po_pim_id?: string | null, po_quantity?: number | null } | null> | null } | null };

export type ListPurchaseOrdersQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ListPurchaseOrdersQuery = { __typename?: 'Query', listPurchaseOrders?: { __typename?: 'PurchaseOrderListResult', total: number, limit: number, offset: number, items: Array<{ __typename?: 'PurchaseOrder', id: string, purchase_order_number: string, seller_id: string, project_id?: string | null, company_id: string, created_at: string, created_by: string, updated_at: string, updated_by: string, status: PurchaseOrderStatus, line_items?: Array<{ __typename?: 'RentalPurchaseOrderLineItem', id: string, po_pim_id?: string | null, po_quantity?: number | null } | { __typename?: 'SalePurchaseOrderLineItem', id: string, po_pim_id?: string | null, po_quantity?: number | null } | null> | null }> } | null };

export type CreateQuoteFromIntakeFormSubmissionForTestsMutationVariables = Exact<{
  input: CreateQuoteFromIntakeFormSubmissionInput;
}>;


export type CreateQuoteFromIntakeFormSubmissionForTestsMutation = { __typename?: 'Mutation', createQuoteFromIntakeFormSubmission: { __typename?: 'Quote', id: string, sellerWorkspaceId: string, sellersBuyerContactId: string, sellersProjectId: string, status: QuoteStatus, intakeFormSubmissionId?: string | null, currentRevisionId?: string | null, currentRevision?: { __typename?: 'QuoteRevision', id: string, revisionNumber: number, status: RevisionStatus, hasUnpricedLineItems: boolean, lineItems: Array<{ __typename: 'QuoteRevisionRentalLineItem', id?: string | null, description: string, quantity: number, subtotalInCents: number, type: QuoteLineItemType, pimCategoryId: string, rentalStartDate: any, rentalEndDate: any, sellersPriceId?: string | null, intakeFormSubmissionLineItemId?: string | null, deliveryMethod?: QuoteLineItemDeliveryMethod | null, deliveryLocation?: string | null, deliveryNotes?: string | null } | { __typename: 'QuoteRevisionSaleLineItem', id?: string | null, description: string, quantity: number, subtotalInCents: number, type: QuoteLineItemType, pimCategoryId: string, sellersPriceId?: string | null, intakeFormSubmissionLineItemId?: string | null, deliveryMethod?: QuoteLineItemDeliveryMethod | null, deliveryLocation?: string | null, deliveryNotes?: string | null } | { __typename: 'QuoteRevisionServiceLineItem', id?: string | null, description: string, quantity: number, subtotalInCents: number, type: QuoteLineItemType, sellersPriceId?: string | null, intakeFormSubmissionLineItemId?: string | null, deliveryMethod?: QuoteLineItemDeliveryMethod | null, deliveryLocation?: string | null, deliveryNotes?: string | null }> } | null } };

export type CreateIntakeFormForQuoteTestsMutationVariables = Exact<{
  input: IntakeFormInput;
}>;


export type CreateIntakeFormForQuoteTestsMutation = { __typename?: 'Mutation', createIntakeForm?: { __typename?: 'IntakeForm', id: string, workspaceId: string, projectId?: string | null, pricebookId?: string | null, isPublic: boolean, isActive: boolean } | null };

export type CreateIntakeFormSubmissionForQuoteTestsMutationVariables = Exact<{
  input: IntakeFormSubmissionInput;
}>;


export type CreateIntakeFormSubmissionForQuoteTestsMutation = { __typename?: 'Mutation', createIntakeFormSubmission?: { __typename?: 'IntakeFormSubmission', id: string, formId: string, workspaceId: string, name?: string | null, email?: string | null, status: IntakeFormSubmissionStatus, lineItems?: Array<{ __typename?: 'IntakeFormLineItem', id: string, description: string, quantity: number, type: RequestType, pimCategoryId: string, priceId?: string | null, deliveryMethod: DeliveryMethod, deliveryLocation?: string | null, deliveryNotes?: string | null, rentalStartDate?: any | null, rentalEndDate?: any | null }> | null } | null };

export type CreateIntakeFormSubmissionLineItemForQuoteTestsMutationVariables = Exact<{
  submissionId: Scalars['String']['input'];
  input: IntakeFormLineItemInput;
}>;


export type CreateIntakeFormSubmissionLineItemForQuoteTestsMutation = { __typename?: 'Mutation', createIntakeFormSubmissionLineItem?: { __typename?: 'IntakeFormLineItem', id: string, description: string, quantity: number, type: RequestType, pimCategoryId: string, priceId?: string | null, deliveryMethod: DeliveryMethod, deliveryLocation?: string | null, deliveryNotes?: string | null, rentalStartDate?: any | null, rentalEndDate?: any | null } | null };

export type SubmitIntakeFormSubmissionForQuoteTestsMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type SubmitIntakeFormSubmissionForQuoteTestsMutation = { __typename?: 'Mutation', submitIntakeFormSubmission?: { __typename?: 'IntakeFormSubmission', id: string, status: IntakeFormSubmissionStatus, submittedAt?: any | null } | null };

export type CreateQuoteRevisionWithOptionalPriceMutationVariables = Exact<{
  input: CreateQuoteRevisionInput;
}>;


export type CreateQuoteRevisionWithOptionalPriceMutation = { __typename?: 'Mutation', createQuoteRevision: { __typename?: 'QuoteRevision', id: string, quoteId: string, revisionNumber: number, status: RevisionStatus, hasUnpricedLineItems: boolean, lineItems: Array<{ __typename: 'QuoteRevisionRentalLineItem', id?: string | null, description: string, quantity: number, subtotalInCents: number, type: QuoteLineItemType, pimCategoryId: string, rentalStartDate: any, rentalEndDate: any, sellersPriceId?: string | null, intakeFormSubmissionLineItemId?: string | null, deliveryMethod?: QuoteLineItemDeliveryMethod | null, deliveryLocation?: string | null, deliveryNotes?: string | null } | { __typename: 'QuoteRevisionSaleLineItem', id?: string | null, description: string, quantity: number, subtotalInCents: number, type: QuoteLineItemType, pimCategoryId: string, sellersPriceId?: string | null, intakeFormSubmissionLineItemId?: string | null, deliveryMethod?: QuoteLineItemDeliveryMethod | null, deliveryLocation?: string | null, deliveryNotes?: string | null } | { __typename: 'QuoteRevisionServiceLineItem' }> } };

export type CreateQuoteForIntakeTestsMutationVariables = Exact<{
  input: CreateQuoteInput;
}>;


export type CreateQuoteForIntakeTestsMutation = { __typename?: 'Mutation', createQuote: { __typename?: 'Quote', id: string, sellerWorkspaceId: string, sellersBuyerContactId: string, sellersProjectId: string, status: QuoteStatus, intakeFormSubmissionId?: string | null } };

export type UpdateQuoteRevisionForIntakeTestsMutationVariables = Exact<{
  input: UpdateQuoteRevisionInput;
}>;


export type UpdateQuoteRevisionForIntakeTestsMutation = { __typename?: 'Mutation', updateQuoteRevision: { __typename?: 'QuoteRevision', id: string, quoteId: string, revisionNumber: number, status: RevisionStatus, lineItems: Array<{ __typename: 'QuoteRevisionRentalLineItem', id?: string | null, description: string, quantity: number, subtotalInCents: number, type: QuoteLineItemType, pimCategoryId: string, rentalStartDate: any, rentalEndDate: any, sellersPriceId?: string | null, intakeFormSubmissionLineItemId?: string | null, deliveryMethod?: QuoteLineItemDeliveryMethod | null, deliveryLocation?: string | null, deliveryNotes?: string | null } | { __typename: 'QuoteRevisionSaleLineItem', id?: string | null, description: string, quantity: number, subtotalInCents: number, type: QuoteLineItemType, pimCategoryId: string, sellersPriceId?: string | null, intakeFormSubmissionLineItemId?: string | null, deliveryMethod?: QuoteLineItemDeliveryMethod | null, deliveryLocation?: string | null, deliveryNotes?: string | null } | { __typename: 'QuoteRevisionServiceLineItem', id?: string | null, description: string, quantity: number, subtotalInCents: number, type: QuoteLineItemType, sellersPriceId?: string | null, intakeFormSubmissionLineItemId?: string | null, deliveryMethod?: QuoteLineItemDeliveryMethod | null, deliveryLocation?: string | null, deliveryNotes?: string | null }> } };

export type SendQuoteForIntakeTestsMutationVariables = Exact<{
  input: SendQuoteInput;
}>;


export type SendQuoteForIntakeTestsMutation = { __typename?: 'Mutation', sendQuote: { __typename?: 'Quote', id: string, status: QuoteStatus, currentRevisionId?: string | null } };

export type CreateRentalPriceForQuoteTestsMutationVariables = Exact<{
  input: CreateRentalPriceInput;
}>;


export type CreateRentalPriceForQuoteTestsMutation = { __typename?: 'Mutation', createRentalPrice?: { __typename?: 'RentalPrice', id: string, workspaceId: string, priceBookId?: string | null, pimCategoryId: string, pricePerDayInCents: number, pricePerWeekInCents: number, pricePerMonthInCents: number } | null };

export type CreateSalePriceForQuoteTestsMutationVariables = Exact<{
  input: CreateSalePriceInput;
}>;


export type CreateSalePriceForQuoteTestsMutation = { __typename?: 'Mutation', createSalePrice?: { __typename?: 'SalePrice', id: string, workspaceId: string, priceBookId?: string | null, pimCategoryId: string, unitCostInCents: number } | null };

export type CreatePriceBookForQuoteTestsMutationVariables = Exact<{
  input: CreatePriceBookInput;
}>;


export type CreatePriceBookForQuoteTestsMutation = { __typename?: 'Mutation', createPriceBook?: { __typename?: 'PriceBook', id: string, workspaceId: string, name: string } | null };

export type CreatePimCategoryForQuoteTestsMutationVariables = Exact<{
  input: UpsertPimCategoryInput;
}>;


export type CreatePimCategoryForQuoteTestsMutation = { __typename?: 'Mutation', upsertPimCategory?: { __typename?: 'PimCategory', id: string, name: string, path: string } | null };

export type CreateBusinessContactForQuoteTestsMutationVariables = Exact<{
  input: BusinessContactInput;
}>;


export type CreateBusinessContactForQuoteTestsMutation = { __typename?: 'Mutation', createBusinessContact?: { __typename?: 'BusinessContact', id: string, workspaceId: string, name: string } | null };

export type CreatePersonContactForQuoteTestsMutationVariables = Exact<{
  input: PersonContactInput;
}>;


export type CreatePersonContactForQuoteTestsMutation = { __typename?: 'Mutation', createPersonContact?: { __typename?: 'PersonContact', id: string, workspaceId: string, name: string, email: string } | null };

export type CreateProjectForQuoteTestsMutationVariables = Exact<{
  input: ProjectInput;
}>;


export type CreateProjectForQuoteTestsMutation = { __typename?: 'Mutation', createProject?: { __typename?: 'Project', id: string, workspaceId: string, name: string } | null };

export type CreateQuoteForTestsMutationVariables = Exact<{
  input: CreateQuoteInput;
}>;


export type CreateQuoteForTestsMutation = { __typename?: 'Mutation', createQuote: { __typename?: 'Quote', id: string, sellerWorkspaceId: string, sellersBuyerContactId: string, sellersProjectId: string, status: QuoteStatus, updatedAt: any } };

export type UpdateQuoteForTestsMutationVariables = Exact<{
  input: UpdateQuoteInput;
}>;


export type UpdateQuoteForTestsMutation = { __typename?: 'Mutation', updateQuote: { __typename?: 'Quote', id: string, sellerWorkspaceId: string, sellersBuyerContactId: string, sellersProjectId: string, buyerWorkspaceId?: string | null, buyersSellerContactId?: string | null, buyersProjectId?: string | null, status: QuoteStatus, currentRevisionId?: string | null, validUntil?: any | null, updatedAt: any, updatedBy: string } };

export type CreateQuoteRevisionMutationVariables = Exact<{
  input: CreateQuoteRevisionInput;
}>;


export type CreateQuoteRevisionMutation = { __typename?: 'Mutation', createQuoteRevision: { __typename?: 'QuoteRevision', id: string, quoteId: string, revisionNumber: number, status: RevisionStatus, validUntil?: any | null, createdAt: any, createdBy: string, updatedAt: any, updatedBy: string, lineItems: Array<{ __typename: 'QuoteRevisionRentalLineItem', id?: string | null, description: string, quantity: number, subtotalInCents: number, type: QuoteLineItemType, pimCategoryId: string, rentalStartDate: any, rentalEndDate: any, sellersPriceId?: string | null } | { __typename: 'QuoteRevisionSaleLineItem', id?: string | null, description: string, quantity: number, subtotalInCents: number, type: QuoteLineItemType, pimCategoryId: string, sellersPriceId?: string | null } | { __typename: 'QuoteRevisionServiceLineItem', id?: string | null, description: string, quantity: number, subtotalInCents: number, type: QuoteLineItemType, sellersPriceId?: string | null }> } };

export type GetQuoteRevisionByIdQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetQuoteRevisionByIdQuery = { __typename?: 'Query', quoteRevisionById?: { __typename?: 'QuoteRevision', id: string, quoteId: string, revisionNumber: number, status: RevisionStatus, validUntil?: any | null, updatedAt: any, updatedBy: string, lineItems: Array<{ __typename: 'QuoteRevisionRentalLineItem', id?: string | null, description: string, quantity: number, subtotalInCents: number, type: QuoteLineItemType, pimCategoryId: string, rentalStartDate: any, rentalEndDate: any, sellersPriceId?: string | null } | { __typename: 'QuoteRevisionSaleLineItem', id?: string | null, description: string, quantity: number, subtotalInCents: number, type: QuoteLineItemType, pimCategoryId: string, sellersPriceId?: string | null } | { __typename: 'QuoteRevisionServiceLineItem', id?: string | null, description: string, quantity: number, subtotalInCents: number, type: QuoteLineItemType, sellersPriceId?: string | null }> } | null };

export type CreateRentalPriceForTestsMutationVariables = Exact<{
  input: CreateRentalPriceInput;
}>;


export type CreateRentalPriceForTestsMutation = { __typename?: 'Mutation', createRentalPrice?: { __typename?: 'RentalPrice', id: string, workspaceId: string, priceBookId?: string | null, pimCategoryId: string, pricePerDayInCents: number, pricePerWeekInCents: number, pricePerMonthInCents: number } | null };

export type CreateSalePriceForTestsMutationVariables = Exact<{
  input: CreateSalePriceInput;
}>;


export type CreateSalePriceForTestsMutation = { __typename?: 'Mutation', createSalePrice?: { __typename?: 'SalePrice', id: string, workspaceId: string, priceBookId?: string | null, pimCategoryId: string, unitCostInCents: number } | null };

export type CreatePimCategoryForTestsMutationVariables = Exact<{
  input: UpsertPimCategoryInput;
}>;


export type CreatePimCategoryForTestsMutation = { __typename?: 'Mutation', upsertPimCategory?: { __typename?: 'PimCategory', id: string, name: string, path: string } | null };

export type CreatePriceBookForTestsMutationVariables = Exact<{
  input: CreatePriceBookInput;
}>;


export type CreatePriceBookForTestsMutation = { __typename?: 'Mutation', createPriceBook?: { __typename?: 'PriceBook', id: string, name: string, workspaceId: string } | null };

export type CreateBusinessContactForTestsMutationVariables = Exact<{
  input: BusinessContactInput;
}>;


export type CreateBusinessContactForTestsMutation = { __typename?: 'Mutation', createBusinessContact?: { __typename?: 'BusinessContact', id: string, workspaceId: string, name: string } | null };

export type CreatePersonContactForTestsMutationVariables = Exact<{
  input: PersonContactInput;
}>;


export type CreatePersonContactForTestsMutation = { __typename?: 'Mutation', createPersonContact?: { __typename?: 'PersonContact', id: string, name: string, email: string, role?: string | null, businessId: string, contactType: ContactType } | null };

export type CreateProjectForTestsMutationVariables = Exact<{
  input: ProjectInput;
}>;


export type CreateProjectForTestsMutation = { __typename?: 'Mutation', createProject?: { __typename?: 'Project', id: string, workspaceId: string, name: string, project_code: string } | null };

export type UpdateQuoteRevisionForTestsMutationVariables = Exact<{
  input: UpdateQuoteRevisionInput;
}>;


export type UpdateQuoteRevisionForTestsMutation = { __typename?: 'Mutation', updateQuoteRevision: { __typename?: 'QuoteRevision', id: string, quoteId: string, revisionNumber: number, status: RevisionStatus, validUntil?: any | null, updatedAt: any, updatedBy: string, lineItems: Array<{ __typename: 'QuoteRevisionRentalLineItem', id?: string | null, description: string, quantity: number, subtotalInCents: number, type: QuoteLineItemType, pimCategoryId: string, rentalStartDate: any, rentalEndDate: any, sellersPriceId?: string | null } | { __typename: 'QuoteRevisionSaleLineItem', id?: string | null, description: string, quantity: number, subtotalInCents: number, type: QuoteLineItemType, pimCategoryId: string, sellersPriceId?: string | null } | { __typename: 'QuoteRevisionServiceLineItem', id?: string | null, description: string, quantity: number, subtotalInCents: number, type: QuoteLineItemType, sellersPriceId?: string | null }> } };

export type SendQuoteForTestsMutationVariables = Exact<{
  input: SendQuoteInput;
}>;


export type SendQuoteForTestsMutation = { __typename?: 'Mutation', sendQuote: { __typename?: 'Quote', id: string, status: QuoteStatus, currentRevisionId?: string | null, validUntil?: any | null, updatedAt: any, updatedBy: string } };

export type CreateReferenceNumberTemplateMutationVariables = Exact<{
  input: CreateReferenceNumberTemplateInput;
}>;


export type CreateReferenceNumberTemplateMutation = { __typename?: 'Mutation', createReferenceNumberTemplate?: { __typename?: 'ReferenceNumberTemplate', id: string, workspaceId: string, type: ReferenceNumberType, template: string, seqPadding?: number | null, startAt?: number | null, resetFrequency: ResetFrequency, useGlobalSequence: boolean, createdBy: string, createdAt: any, updatedAt: any, updatedBy: string, businessContactId?: string | null, projectId?: string | null, deleted: boolean, createdByUser?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null, updatedByUser?: { __typename?: 'User', id: string, firstName: string, lastName: string } | null } | null };

export type UpdateReferenceNumberTemplateMutationVariables = Exact<{
  input: UpdateReferenceNumberTemplateInput;
}>;


export type UpdateReferenceNumberTemplateMutation = { __typename?: 'Mutation', updateReferenceNumberTemplate?: { __typename?: 'ReferenceNumberTemplate', id: string, workspaceId: string, type: ReferenceNumberType, template: string, seqPadding?: number | null, startAt?: number | null, resetFrequency: ResetFrequency, useGlobalSequence: boolean, createdBy: string, createdAt: any, updatedAt: any, updatedBy: string, businessContactId?: string | null, projectId?: string | null, deleted: boolean } | null };

export type DeleteReferenceNumberTemplateMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteReferenceNumberTemplateMutation = { __typename?: 'Mutation', deleteReferenceNumberTemplate?: boolean | null };

export type ResetSequenceNumberMutationVariables = Exact<{
  templateId: Scalars['String']['input'];
  newValue?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ResetSequenceNumberMutation = { __typename?: 'Mutation', resetSequenceNumber?: boolean | null };

export type GenerateReferenceNumberMutationVariables = Exact<{
  input: GenerateReferenceNumberInput;
}>;


export type GenerateReferenceNumberMutation = { __typename?: 'Mutation', generateReferenceNumber?: { __typename?: 'GenerateReferenceNumberResult', referenceNumber: string, sequenceNumber: number, templateUsed: { __typename?: 'ReferenceNumberTemplate', id: string, type: ReferenceNumberType, template: string, seqPadding?: number | null, startAt?: number | null, resetFrequency: ResetFrequency, useGlobalSequence: boolean } } | null };

export type ListReferenceNumberTemplatesQueryVariables = Exact<{
  filter: ReferenceNumberTemplateFilterInput;
  page?: InputMaybe<PageInfoInput>;
}>;


export type ListReferenceNumberTemplatesQuery = { __typename?: 'Query', listReferenceNumberTemplates: Array<{ __typename?: 'ReferenceNumberTemplate', id: string, workspaceId: string, type: ReferenceNumberType, template: string, seqPadding?: number | null, startAt?: number | null, resetFrequency: ResetFrequency, useGlobalSequence: boolean, createdBy: string, createdAt: any, updatedAt: any, updatedBy: string, businessContactId?: string | null, projectId?: string | null, deleted: boolean }> };

export type GetReferenceNumberTemplateQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetReferenceNumberTemplateQuery = { __typename?: 'Query', getReferenceNumberTemplate?: { __typename?: 'ReferenceNumberTemplate', id: string, workspaceId: string, type: ReferenceNumberType, template: string, seqPadding?: number | null, startAt?: number | null, resetFrequency: ResetFrequency, useGlobalSequence: boolean, createdBy: string, createdAt: any, updatedAt: any, updatedBy: string, businessContactId?: string | null, projectId?: string | null, deleted: boolean } | null };

export type GetCurrentSequenceNumberQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  type: ReferenceNumberType;
  templateId: Scalars['String']['input'];
}>;


export type GetCurrentSequenceNumberQuery = { __typename?: 'Query', getCurrentSequenceNumber: number };

export type CreateProjectForReferenceNumbersMutationVariables = Exact<{
  input?: InputMaybe<ProjectInput>;
}>;


export type CreateProjectForReferenceNumbersMutation = { __typename?: 'Mutation', createProject?: { __typename?: 'Project', id: string, name: string, project_code: string, description?: string | null, deleted: boolean } | null };

export type CreatePersonContactForReferenceNumbersMutationVariables = Exact<{
  input: PersonContactInput;
}>;


export type CreatePersonContactForReferenceNumbersMutation = { __typename?: 'Mutation', createPersonContact?: { __typename?: 'PersonContact', id: string, name: string, email: string, role?: string | null, workspaceId: string, businessId: string, contactType: ContactType } | null };

export type ListRentalViewsQueryVariables = Exact<{
  filter?: InputMaybe<RentalViewFilterInput>;
  page?: InputMaybe<ListRentalViewsPageInput>;
}>;


export type ListRentalViewsQuery = { __typename?: 'Query', listRentalViews?: { __typename?: 'ListRentalViewsResult', items: Array<{ __typename?: 'RentalMaterializedView', rentalId: string, details?: { __typename?: 'RentalViewDetails', rentalId?: string | null, borrowerUserId?: string | null, rentalStatusId?: string | null, startDate?: string | null, endDate?: string | null, price?: string | null, orderId?: string | null } | null, asset?: { __typename?: 'RentalViewAsset', assetId?: string | null, details?: { __typename?: 'RentalViewAssetDetails', name?: string | null, description?: string | null } | null, company?: { __typename?: 'RentalViewAssetCompany', id?: string | null, name?: string | null } | null } | null, status?: { __typename?: 'RentalViewStatus', id?: string | null, name?: string | null } | null, order?: { __typename?: 'RentalViewOrder', orderId?: string | null, companyId?: string | null, companyName?: string | null, orderStatusName?: string | null } | null }>, page: { __typename?: 'PaginationInfo', number: number, size: number, totalItems: number, totalPages: number } } | null };

export type CreatePurchaseOrderForQuantityValidationMutationVariables = Exact<{
  input?: InputMaybe<PurchaseOrderInput>;
}>;


export type CreatePurchaseOrderForQuantityValidationMutation = { __typename?: 'Mutation', createPurchaseOrder?: { __typename?: 'PurchaseOrder', id: string, purchase_order_number: string, status: PurchaseOrderStatus } | null };

export type CreateRentalPoLineItemForQuantityValidationMutationVariables = Exact<{
  input?: InputMaybe<CreateRentalPurchaseOrderLineItemInput>;
}>;


export type CreateRentalPoLineItemForQuantityValidationMutation = { __typename?: 'Mutation', createRentalPurchaseOrderLineItem?: { __typename?: 'RentalPurchaseOrderLineItem', id: string, purchase_order_id: string, po_quantity?: number | null, lineitem_type: PoLineItemType } | null };

export type UpdateRentalPoLineItemForQuantityValidationMutationVariables = Exact<{
  input?: InputMaybe<UpdateRentalPurchaseOrderLineItemInput>;
}>;


export type UpdateRentalPoLineItemForQuantityValidationMutation = { __typename?: 'Mutation', updateRentalPurchaseOrderLineItem?: { __typename?: 'RentalPurchaseOrderLineItem', id: string, po_quantity?: number | null } | null };

export type CreateSalesOrderForQuantityValidationMutationVariables = Exact<{
  input?: InputMaybe<SalesOrderInput>;
}>;


export type CreateSalesOrderForQuantityValidationMutation = { __typename?: 'Mutation', createSalesOrder?: { __typename?: 'SalesOrder', id: string, sales_order_number: string, status: SalesOrderStatus } | null };

export type CreateRentalSoLineItemForQuantityValidationMutationVariables = Exact<{
  input?: InputMaybe<CreateRentalSalesOrderLineItemInput>;
}>;


export type CreateRentalSoLineItemForQuantityValidationMutation = { __typename?: 'Mutation', createRentalSalesOrderLineItem?: { __typename?: 'RentalSalesOrderLineItem', id: string, sales_order_id: string, so_quantity?: number | null, lineitem_type: LineItemType } | null };

export type UpdateRentalSoLineItemForQuantityValidationMutationVariables = Exact<{
  input?: InputMaybe<UpdateRentalSalesOrderLineItemInput>;
}>;


export type UpdateRentalSoLineItemForQuantityValidationMutation = { __typename?: 'Mutation', updateRentalSalesOrderLineItem?: { __typename?: 'RentalSalesOrderLineItem', id: string, so_quantity?: number | null } | null };

export type CreateRfqMutationVariables = Exact<{
  input: CreateRfqInput;
}>;


export type CreateRfqMutation = { __typename?: 'Mutation', createRFQ: { __typename?: 'RFQ', id: string, buyersWorkspaceId: string, responseDeadline?: any | null, invitedSellerContactIds: Array<string>, status: RfqStatus, createdAt: any, updatedAt: any, createdBy: string, updatedBy: string, createdByUser?: { __typename?: 'User', id: string, email: string } | null, updatedByUser?: { __typename?: 'User', id: string, email: string } | null, lineItems: Array<{ __typename: 'RFQRentalLineItem', id?: string | null, description: string, quantity: number, type: QuoteLineItemType, pimCategoryId: string, rentalStartDate: any, rentalEndDate: any } | { __typename: 'RFQSaleLineItem', id?: string | null, description: string, quantity: number, type: QuoteLineItemType, pimCategoryId: string } | { __typename: 'RFQServiceLineItem', id?: string | null, description: string, quantity: number, type: QuoteLineItemType }> } };

export type UpdateRfqMutationVariables = Exact<{
  input: UpdateRfqInput;
}>;


export type UpdateRfqMutation = { __typename?: 'Mutation', updateRFQ: { __typename?: 'RFQ', id: string, buyersWorkspaceId: string, responseDeadline?: any | null, invitedSellerContactIds: Array<string>, status: RfqStatus, updatedAt: any, updatedBy: string, lineItems: Array<{ __typename?: 'RFQRentalLineItem', id?: string | null, description: string, quantity: number, type: QuoteLineItemType, pimCategoryId: string, rentalStartDate: any, rentalEndDate: any } | { __typename?: 'RFQSaleLineItem', id?: string | null, description: string, quantity: number, type: QuoteLineItemType, pimCategoryId: string } | { __typename?: 'RFQServiceLineItem', id?: string | null, description: string, quantity: number, type: QuoteLineItemType }> } };

export type GetRfqWithRelationshipsQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetRfqWithRelationshipsQuery = { __typename?: 'Query', rfqById?: { __typename?: 'RFQ', id: string, buyersWorkspaceId: string, status: RfqStatus, invitedSellerContactIds: Array<string>, createdBy: string, updatedBy: string, createdByUser?: { __typename?: 'User', id: string, email: string } | null, updatedByUser?: { __typename?: 'User', id: string, email: string } | null, invitedSellerContacts?: Array<{ __typename?: 'BusinessContact', id: string, name: string, contactType: ContactType } | { __typename?: 'PersonContact', id: string, name: string, contactType: ContactType }> | null, lineItems: Array<{ __typename: 'RFQRentalLineItem', id?: string | null, description: string, pimCategoryId: string, rentalStartDate: any, rentalEndDate: any, pimCategory?: { __typename?: 'PimCategory', id: string, name: string } | null } | { __typename: 'RFQSaleLineItem' } | { __typename: 'RFQServiceLineItem' }> } | null };

export type ListRfQsQueryVariables = Exact<{
  filter: ListRfQsFilter;
  page: ListRfQsPage;
}>;


export type ListRfQsQuery = { __typename?: 'Query', listRFQs: { __typename?: 'ListRFQsResult', items: Array<{ __typename?: 'RFQ', id: string, buyersWorkspaceId: string, status: RfqStatus, invitedSellerContactIds: Array<string>, createdAt: any, updatedAt: any, createdBy: string, updatedBy: string, lineItems: Array<{ __typename: 'RFQRentalLineItem', id?: string | null, description: string, quantity: number, type: QuoteLineItemType, pimCategoryId: string, rentalStartDate: any, rentalEndDate: any } | { __typename: 'RFQSaleLineItem', id?: string | null, description: string, quantity: number, type: QuoteLineItemType, pimCategoryId: string } | { __typename: 'RFQServiceLineItem', id?: string | null, description: string, quantity: number, type: QuoteLineItemType }> }>, page: { __typename?: 'PaginationInfo', number: number, size: number, totalItems: number, totalPages: number } } };

export type CreateQuoteLinkedToRfqMutationVariables = Exact<{
  input: CreateQuoteInput;
}>;


export type CreateQuoteLinkedToRfqMutation = { __typename?: 'Mutation', createQuote: { __typename?: 'Quote', id: string, rfqId?: string | null, sellerWorkspaceId: string, sellersBuyerContactId: string, sellersProjectId: string, status: QuoteStatus, createdAt: any, createdBy: string } };

export type ListQuotesByRfqIdQueryVariables = Exact<{
  query?: InputMaybe<ListQuotesQuery>;
}>;


export type ListQuotesByRfqIdQuery = { __typename?: 'Query', listQuotes: { __typename?: 'QuotesResponse', items: Array<{ __typename?: 'Quote', id: string, rfqId?: string | null, status: QuoteStatus, sellerWorkspaceId: string }> } };

export type CreatePimCategoryForRfqMutationVariables = Exact<{
  input: UpsertPimCategoryInput;
}>;


export type CreatePimCategoryForRfqMutation = { __typename?: 'Mutation', upsertPimCategory?: { __typename?: 'PimCategory', id: string, name: string } | null };

export type CreatePersonContactForRfqMutationVariables = Exact<{
  input: PersonContactInput;
}>;


export type CreatePersonContactForRfqMutation = { __typename?: 'Mutation', createPersonContact?: { __typename?: 'PersonContact', id: string, name: string, email: string, role?: string | null, businessId: string, contactType: ContactType } | null };

export type CreateQuoteForRfqTestMutationVariables = Exact<{
  input: CreateQuoteInput;
}>;


export type CreateQuoteForRfqTestMutation = { __typename?: 'Mutation', createQuote: { __typename?: 'Quote', id: string, rfqId?: string | null, sellerWorkspaceId: string, sellersBuyerContactId: string, buyerWorkspaceId?: string | null, sellersProjectId: string, status: QuoteStatus, createdAt: any, createdBy: string } };

export type CreateQuoteRevisionForRfqTestMutationVariables = Exact<{
  input: CreateQuoteRevisionInput;
}>;


export type CreateQuoteRevisionForRfqTestMutation = { __typename?: 'Mutation', createQuoteRevision: { __typename?: 'QuoteRevision', id: string, quoteId: string, revisionNumber: number, status: RevisionStatus, lineItems: Array<{ __typename: 'QuoteRevisionRentalLineItem', id?: string | null, description: string, quantity: number, rentalStartDate: any, rentalEndDate: any } | { __typename: 'QuoteRevisionSaleLineItem' } | { __typename: 'QuoteRevisionServiceLineItem' }> } };

export type SendQuoteForRfqTestMutationVariables = Exact<{
  input: SendQuoteInput;
}>;


export type SendQuoteForRfqTestMutation = { __typename?: 'Mutation', sendQuote: { __typename?: 'Quote', id: string, status: QuoteStatus, currentRevisionId?: string | null, currentRevision?: { __typename?: 'QuoteRevision', id: string, status: RevisionStatus } | null } };

export type AcceptQuoteForRfqTestMutationVariables = Exact<{
  input: AcceptQuoteInput;
}>;


export type AcceptQuoteForRfqTestMutation = { __typename?: 'Mutation', acceptQuote: { __typename?: 'AcceptQuoteResult', quote: { __typename?: 'Quote', id: string, status: QuoteStatus, buyerAcceptedFullLegalName?: string | null }, salesOrder: { __typename?: 'SalesOrder', id: string, workspace_id?: string | null, project_id?: string | null, buyer_id: string, line_items?: Array<{ __typename: 'RentalSalesOrderLineItem', id: string, lineitem_type: LineItemType, so_pim_id?: string | null, so_quantity?: number | null, price_id?: string | null, delivery_date?: string | null, off_rent_date?: string | null, delivery_method?: DeliveryMethod | null, delivery_location?: string | null, deliveryNotes?: string | null, quote_revision_line_item_id?: string | null } | { __typename: 'SaleSalesOrderLineItem', id: string, lineitem_type: LineItemType, so_pim_id?: string | null, so_quantity?: number | null, price_id?: string | null, delivery_date?: string | null, delivery_method?: DeliveryMethod | null, delivery_location?: string | null, deliveryNotes?: string | null, quote_revision_line_item_id?: string | null } | null> | null }, purchaseOrder?: { __typename?: 'PurchaseOrder', id: string, workspace_id?: string | null, project_id?: string | null, seller_id: string, line_items?: Array<{ __typename: 'RentalPurchaseOrderLineItem', id: string, lineitem_type: PoLineItemType, po_pim_id?: string | null, po_quantity?: number | null, price_id?: string | null, delivery_date?: string | null, off_rent_date?: string | null, delivery_method?: DeliveryMethod | null, delivery_location?: string | null, deliveryNotes?: string | null, quote_revision_line_item_id?: string | null } | { __typename: 'SalePurchaseOrderLineItem', id: string, lineitem_type: PoLineItemType, po_pim_id?: string | null, po_quantity?: number | null, price_id?: string | null, delivery_date?: string | null, delivery_method?: DeliveryMethod | null, delivery_location?: string | null, deliveryNotes?: string | null, quote_revision_line_item_id?: string | null } | null> | null } | null } };

export type RejectQuoteForRfqTestMutationVariables = Exact<{
  quoteId: Scalars['String']['input'];
}>;


export type RejectQuoteForRfqTestMutation = { __typename?: 'Mutation', rejectQuote: { __typename?: 'Quote', id: string, status: QuoteStatus } };

export type GetQuoteForRfqTestQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetQuoteForRfqTestQuery = { __typename?: 'Query', quoteById?: { __typename?: 'Quote', id: string, status: QuoteStatus, rfqId?: string | null, buyerWorkspaceId?: string | null, sellerWorkspaceId: string, currentRevisionId?: string | null, buyerAcceptedFullLegalName?: string | null, currentRevision?: { __typename?: 'QuoteRevision', id: string, status: RevisionStatus, validUntil?: any | null } | null } | null };

export type GetRfqForQuoteAcceptanceQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetRfqForQuoteAcceptanceQuery = { __typename?: 'Query', rfqById?: { __typename?: 'RFQ', id: string, status: RfqStatus } | null };

export type GetQuoteRevisionForAcceptanceTestQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetQuoteRevisionForAcceptanceTestQuery = { __typename?: 'Query', quoteRevisionById?: { __typename?: 'QuoteRevision', id: string, quoteId: string, revisionNumber: number, status: RevisionStatus, lineItems: Array<{ __typename: 'QuoteRevisionRentalLineItem', id?: string | null, description: string, quantity: number, pimCategoryId: string, rentalStartDate: any, rentalEndDate: any, sellersPriceId?: string | null } | { __typename: 'QuoteRevisionSaleLineItem' } | { __typename: 'QuoteRevisionServiceLineItem' }> } | null };

export type CreateProjectForSalesOrderMutationVariables = Exact<{
  input?: InputMaybe<ProjectInput>;
}>;


export type CreateProjectForSalesOrderMutation = { __typename?: 'Mutation', createProject?: { __typename?: 'Project', id: string, name: string, project_code: string, description?: string | null, deleted: boolean } | null };

export type CreateSalesOrderMutationVariables = Exact<{
  input?: InputMaybe<SalesOrderInput>;
}>;


export type CreateSalesOrderMutation = { __typename?: 'Mutation', createSalesOrder?: { __typename?: 'SalesOrder', id: string, status: SalesOrderStatus, project_id?: string | null, buyer_id: string, purchase_order_number?: string | null, sales_order_number: string, company_id: string, created_at: string, updated_at: string, updated_by: string } | null };

export type ListSalesOrdersQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ListSalesOrdersQuery = { __typename?: 'Query', listSalesOrders?: { __typename?: 'SalesOrderListResult', total: number, limit: number, offset: number, items: Array<{ __typename?: 'SalesOrder', id: string, status: SalesOrderStatus, project_id?: string | null, buyer_id: string, purchase_order_number?: string | null, sales_order_number: string, company_id: string, created_at: string, updated_at: string, updated_by: string }> } | null };

export type CreateRentalSalesOrderLineItemMutationVariables = Exact<{
  input: CreateRentalSalesOrderLineItemInput;
}>;


export type CreateRentalSalesOrderLineItemMutation = { __typename?: 'Mutation', createRentalSalesOrderLineItem?: { __typename?: 'RentalSalesOrderLineItem', id: string, sales_order_id: string, so_pim_id?: string | null, so_quantity?: number | null, company_id?: string | null, created_at?: string | null, created_by?: string | null, updated_at?: string | null, updated_by?: string | null, lineitem_type: LineItemType, price_id?: string | null, lineitem_status?: LineItemStatus | null, delivery_date?: string | null, off_rent_date?: string | null, deliveryNotes?: string | null, totalDaysOnRent?: number | null } | null };

export type CreateSaleSalesOrderLineItemMutationVariables = Exact<{
  input: CreateSaleSalesOrderLineItemInput;
}>;


export type CreateSaleSalesOrderLineItemMutation = { __typename?: 'Mutation', createSaleSalesOrderLineItem?: { __typename?: 'SaleSalesOrderLineItem', id: string, sales_order_id: string, so_pim_id?: string | null, so_quantity?: number | null, company_id?: string | null, created_at?: string | null, created_by?: string | null, updated_at?: string | null, updated_by?: string | null, lineitem_type: LineItemType, price_id?: string | null, lineitem_status?: LineItemStatus | null, deliveryNotes?: string | null } | null };

export type SoftDeleteSalesOrderLineItemMutationVariables = Exact<{
  id?: InputMaybe<Scalars['String']['input']>;
}>;


export type SoftDeleteSalesOrderLineItemMutation = { __typename?: 'Mutation', softDeleteSalesOrderLineItem?: { __typename?: 'RentalSalesOrderLineItem', id: string, deleted_at?: string | null, sales_order_id: string } | { __typename?: 'SaleSalesOrderLineItem', id: string, deleted_at?: string | null, sales_order_id: string } | null };

export type GetSalesOrderLineItemByIdQueryVariables = Exact<{
  id?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetSalesOrderLineItemByIdQuery = { __typename?: 'Query', getSalesOrderLineItemById?: { __typename?: 'RentalSalesOrderLineItem', id: string, deleted_at?: string | null, sales_order_id: string, deliveryNotes?: string | null } | { __typename?: 'SaleSalesOrderLineItem', id: string, deleted_at?: string | null, sales_order_id: string, deliveryNotes?: string | null } | null };

export type GetSalesOrderByIdQueryVariables = Exact<{
  id?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetSalesOrderByIdQuery = { __typename?: 'Query', getSalesOrderById?: { __typename?: 'SalesOrder', id: string, line_items?: Array<{ __typename?: 'RentalSalesOrderLineItem', id: string, deleted_at?: string | null, deliveryNotes?: string | null } | { __typename?: 'SaleSalesOrderLineItem', id: string, deleted_at?: string | null, deliveryNotes?: string | null } | null> | null } | null };

export type GetSalesOrderByIdWithAllFieldsQueryVariables = Exact<{
  id?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetSalesOrderByIdWithAllFieldsQuery = { __typename?: 'Query', getSalesOrderById?: { __typename?: 'SalesOrder', id: string, status: SalesOrderStatus, project_id?: string | null, buyer_id: string, purchase_order_number?: string | null, company_id: string, created_at: string, updated_at: string, updated_by: string, line_items?: Array<{ __typename?: 'RentalSalesOrderLineItem', id: string, deleted_at?: string | null, deliveryNotes?: string | null } | { __typename?: 'SaleSalesOrderLineItem', id: string, deleted_at?: string | null, deliveryNotes?: string | null } | null> | null } | null };

export type GetSalesOrderByIdWithPricingQueryVariables = Exact<{
  id?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetSalesOrderByIdWithPricingQuery = { __typename?: 'Query', getSalesOrderById?: { __typename?: 'SalesOrder', id: string, pricing?: { __typename?: 'SalesOrderPricing', sub_total_in_cents?: number | null, total_in_cents?: number | null } | null } | null };

export type SubmitSalesOrderMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SubmitSalesOrderMutation = { __typename?: 'Mutation', submitSalesOrder?: { __typename?: 'SalesOrder', id: string, status: SalesOrderStatus } | null };

export type UpdateSalesOrderMutationVariables = Exact<{
  input: UpdateSalesOrderInput;
}>;


export type UpdateSalesOrderMutation = { __typename?: 'Mutation', updateSalesOrder?: { __typename?: 'SalesOrder', id: string, project_id?: string | null, buyer_id: string, purchase_order_number?: string | null, updated_at: string, updated_by: string } | null };

export type ListFulfilmentsForSalesOrderQueryVariables = Exact<{
  filter: ListFulfilmentsFilter;
  page?: InputMaybe<ListFulfilmentsPage>;
}>;


export type ListFulfilmentsForSalesOrderQuery = { __typename?: 'Query', listFulfilments?: { __typename?: 'ListFulfilmentsResult', items: Array<{ __typename?: 'RentalFulfilment', id: string, salesOrderId: string, salesOrderLineItemId: string, salesOrderType: FulfilmentType, workflowId?: string | null, workflowColumnId?: string | null, assignedToId?: string | null, createdAt: any, contactId?: string | null, projectId?: string | null, purchaseOrderNumber: string, rentalStartDate?: any | null, rentalEndDate?: any | null, expectedRentalEndDate?: any | null } | { __typename?: 'SaleFulfilment', id: string, salesOrderId: string, salesOrderLineItemId: string, salesOrderType: FulfilmentType, workflowId?: string | null, workflowColumnId?: string | null, assignedToId?: string | null, createdAt: any, contactId?: string | null, projectId?: string | null, purchaseOrderNumber: string } | { __typename?: 'ServiceFulfilment', id: string, salesOrderId: string, salesOrderLineItemId: string, salesOrderType: FulfilmentType, workflowId?: string | null, workflowColumnId?: string | null, assignedToId?: string | null, createdAt: any, contactId?: string | null, projectId?: string | null, purchaseOrderNumber: string }> } | null };

export type CreateRentalPriceForSalesOrderMutationVariables = Exact<{
  input: CreateRentalPriceInput;
}>;


export type CreateRentalPriceForSalesOrderMutation = { __typename?: 'Mutation', createRentalPrice?: { __typename?: 'RentalPrice', id: string, name?: string | null, pimCategoryName: string, pricePerDayInCents: number, pricePerWeekInCents: number, pricePerMonthInCents: number } | null };

export type CreateSalePriceForSalesOrderMutationVariables = Exact<{
  input: CreateSalePriceInput;
}>;


export type CreateSalePriceForSalesOrderMutation = { __typename?: 'Mutation', createSalePrice?: { __typename?: 'SalePrice', id: string, name?: string | null, pimCategoryName: string, unitCostInCents: number } | null };

export type CreatePimCategoryMutationVariables = Exact<{
  input: UpsertPimCategoryInput;
}>;


export type CreatePimCategoryMutation = { __typename?: 'Mutation', upsertPimCategory?: { __typename?: 'PimCategory', id: string } | null };

export type SoftDeleteSalesOrderMutationVariables = Exact<{
  id?: InputMaybe<Scalars['String']['input']>;
}>;


export type SoftDeleteSalesOrderMutation = { __typename?: 'Mutation', softDeleteSalesOrder?: { __typename?: 'SalesOrder', id: string, deleted_at?: string | null, status: SalesOrderStatus } | null };

export type CreateSalesOrderWithIntakeFormMutationVariables = Exact<{
  input?: InputMaybe<SalesOrderInput>;
}>;


export type CreateSalesOrderWithIntakeFormMutation = { __typename?: 'Mutation', createSalesOrder?: { __typename?: 'SalesOrder', id: string, status: SalesOrderStatus, project_id?: string | null, buyer_id: string, purchase_order_number?: string | null, sales_order_number: string, company_id: string, created_at: string, updated_at: string, updated_by: string, intake_form_submission_id?: string | null } | null };

export type CreateRentalSalesOrderLineItemWithIntakeFormMutationVariables = Exact<{
  input: CreateRentalSalesOrderLineItemInput;
}>;


export type CreateRentalSalesOrderLineItemWithIntakeFormMutation = { __typename?: 'Mutation', createRentalSalesOrderLineItem?: { __typename?: 'RentalSalesOrderLineItem', id: string, sales_order_id: string, so_pim_id?: string | null, so_quantity?: number | null, company_id?: string | null, created_at?: string | null, created_by?: string | null, updated_at?: string | null, updated_by?: string | null, lineitem_type: LineItemType, price_id?: string | null, lineitem_status?: LineItemStatus | null, delivery_date?: string | null, off_rent_date?: string | null, deliveryNotes?: string | null, totalDaysOnRent?: number | null, intake_form_submission_line_item_id?: string | null } | null };

export type CreateSaleSalesOrderLineItemWithIntakeFormMutationVariables = Exact<{
  input: CreateSaleSalesOrderLineItemInput;
}>;


export type CreateSaleSalesOrderLineItemWithIntakeFormMutation = { __typename?: 'Mutation', createSaleSalesOrderLineItem?: { __typename?: 'SaleSalesOrderLineItem', id: string, sales_order_id: string, so_pim_id?: string | null, so_quantity?: number | null, company_id?: string | null, created_at?: string | null, created_by?: string | null, updated_at?: string | null, updated_by?: string | null, lineitem_type: LineItemType, price_id?: string | null, lineitem_status?: LineItemStatus | null, deliveryNotes?: string | null, intake_form_submission_line_item_id?: string | null } | null };

export type GetSalesOrderWithIntakeFormQueryVariables = Exact<{
  id?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetSalesOrderWithIntakeFormQuery = { __typename?: 'Query', getSalesOrderById?: { __typename?: 'SalesOrder', id: string, intake_form_submission_id?: string | null, intakeFormSubmission?: { __typename?: 'IntakeFormSubmission', id: string, formId: string, workspaceId: string, name?: string | null, email?: string | null } | null } | null };

export type GetSalesOrderLineItemWithIntakeFormQueryVariables = Exact<{
  id?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetSalesOrderLineItemWithIntakeFormQuery = { __typename?: 'Query', getSalesOrderLineItemById?: { __typename?: 'RentalSalesOrderLineItem', id: string, intake_form_submission_line_item_id?: string | null, intakeFormSubmissionLineItem?: { __typename?: 'IntakeFormLineItem', id: string, description: string, quantity: number } | null } | { __typename?: 'SaleSalesOrderLineItem', id: string, intake_form_submission_line_item_id?: string | null, intakeFormSubmissionLineItem?: { __typename?: 'IntakeFormLineItem', id: string, description: string, quantity: number } | null } | null };

export type GetIntakeFormSubmissionWithSalesOrderQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetIntakeFormSubmissionWithSalesOrderQuery = { __typename?: 'Query', getIntakeFormSubmissionById?: { __typename?: 'IntakeFormSubmission', id: string, formId: string, workspaceId: string, name?: string | null, email?: string | null, salesOrder?: { __typename?: 'SubmissionSalesOrder', id: string, status: SalesOrderStatus, sales_order_number: string } | null } | null };

export type GetIntakeFormLineItemWithSalesOrderLineItemQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetIntakeFormLineItemWithSalesOrderLineItemQuery = { __typename?: 'Query', getIntakeFormSubmissionLineItem?: { __typename?: 'IntakeFormLineItem', id: string, description: string, quantity: number, salesOrderLineItem?: { __typename?: 'RentalSalesOrderLineItem', id: string, intake_form_submission_line_item_id?: string | null } | { __typename?: 'SaleSalesOrderLineItem', id: string, intake_form_submission_line_item_id?: string | null } | null } | null };

export type SearchDocumentsQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  searchText?: InputMaybe<Scalars['String']['input']>;
  collections?: InputMaybe<Array<SearchableCollectionType> | SearchableCollectionType>;
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
}>;


export type SearchDocumentsQuery = { __typename?: 'Query', searchDocuments: { __typename?: 'SearchDocumentsResult', total: number, documents: Array<{ __typename?: 'SearchDocument', id: string, documentId: string, collection: SearchableCollectionType, workspaceId: string, title: string, subtitle?: string | null, documentType: string, metadata: any, createdAt: string, updatedAt: string }>, page: { __typename?: 'PaginationInfo', number: number, size: number, totalItems: number, totalPages: number } } };

export type GetSearchDocumentByIdQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetSearchDocumentByIdQuery = { __typename?: 'Query', getSearchDocumentById?: { __typename?: 'SearchDocument', id: string, documentId: string, collection: SearchableCollectionType, workspaceId: string, title: string, subtitle?: string | null, documentType: string, metadata: any, createdAt: string, updatedAt: string } | null };

export type GetBulkSearchDocumentsByIdQueryVariables = Exact<{
  ids: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type GetBulkSearchDocumentsByIdQuery = { __typename?: 'Query', getBulkSearchDocumentsById: Array<{ __typename?: 'SearchDocument', id: string, documentId: string, collection: SearchableCollectionType, workspaceId: string, title: string, subtitle?: string | null, documentType: string, metadata: any, createdAt: string, updatedAt: string } | null> };

export type GetSearchUserStateQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type GetSearchUserStateQuery = { __typename?: 'Query', getSearchUserState?: { __typename?: 'SearchUserState', id: string, userId: string, workspaceId: string, createdAt: string, updatedAt: string, favorites: Array<{ __typename?: 'SearchUserStateFavorite', searchDocumentId: string, addedAt: string }>, recents: Array<{ __typename?: 'SearchUserStateRecent', searchDocumentId: string, accessedAt: string }> } | null };

export type ToggleSearchFavoriteMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  searchDocumentId: Scalars['String']['input'];
}>;


export type ToggleSearchFavoriteMutation = { __typename?: 'Mutation', toggleSearchFavorite: { __typename?: 'SearchUserState', id: string, userId: string, workspaceId: string, updatedAt: string, favorites: Array<{ __typename?: 'SearchUserStateFavorite', searchDocumentId: string, addedAt: string }>, recents: Array<{ __typename?: 'SearchUserStateRecent', searchDocumentId: string, accessedAt: string }> } };

export type AddSearchRecentMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  searchDocumentId: Scalars['String']['input'];
}>;


export type AddSearchRecentMutation = { __typename?: 'Mutation', addSearchRecent: { __typename?: 'SearchUserState', id: string, userId: string, workspaceId: string, updatedAt: string, favorites: Array<{ __typename?: 'SearchUserStateFavorite', searchDocumentId: string, addedAt: string }>, recents: Array<{ __typename?: 'SearchUserStateRecent', searchDocumentId: string, accessedAt: string }> } };

export type RemoveSearchRecentMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  searchDocumentId: Scalars['String']['input'];
}>;


export type RemoveSearchRecentMutation = { __typename?: 'Mutation', removeSearchRecent: { __typename?: 'SearchUserState', id: string, userId: string, workspaceId: string, updatedAt: string, favorites: Array<{ __typename?: 'SearchUserStateFavorite', searchDocumentId: string, addedAt: string }>, recents: Array<{ __typename?: 'SearchUserStateRecent', searchDocumentId: string, accessedAt: string }> } };

export type ClearSearchRecentsMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type ClearSearchRecentsMutation = { __typename?: 'Mutation', clearSearchRecents: { __typename?: 'SearchUserState', id: string, userId: string, workspaceId: string, updatedAt: string, favorites: Array<{ __typename?: 'SearchUserStateFavorite', searchDocumentId: string, addedAt: string }>, recents: Array<{ __typename?: 'SearchUserStateRecent', searchDocumentId: string, accessedAt: string }> } };

export type UtilCreatePimCategoryMutationVariables = Exact<{
  input: UpsertPimCategoryInput;
}>;


export type UtilCreatePimCategoryMutation = { __typename?: 'Mutation', upsertPimCategory?: { __typename?: 'PimCategory', id: string, name: string, path: string } | null };

export type UtilCreateWorkspaceMutationVariables = Exact<{
  accessType: WorkspaceAccessType;
  name: Scalars['String']['input'];
}>;


export type UtilCreateWorkspaceMutation = { __typename?: 'Mutation', createWorkspace?: { __typename?: 'Workspace', id: string, name: string } | null };

export type UtilInviteUserToWorkspaceMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  email: Scalars['String']['input'];
  roles: Array<WorkspaceUserRole> | WorkspaceUserRole;
}>;


export type UtilInviteUserToWorkspaceMutation = { __typename?: 'Mutation', inviteUserToWorkspace?: { __typename?: 'WorkspaceMember', userId: string, roles: Array<WorkspaceUserRole> } | null };

export type UpdateRentalPriceMutationVariables = Exact<{
  input: UpdateRentalPriceInput;
}>;


export type UpdateRentalPriceMutation = { __typename?: 'Mutation', updateRentalPrice?: { __typename?: 'RentalPrice', id: string, name?: string | null, pricePerDayInCents: number, pricePerWeekInCents: number, pricePerMonthInCents: number, pimProductId?: string | null, pimCategoryId: string, pimCategoryName: string, pimCategoryPath: string, updatedAt: any } | null };

export type UpdateSalePriceMutationVariables = Exact<{
  input: UpdateSalePriceInput;
}>;


export type UpdateSalePriceMutation = { __typename?: 'Mutation', updateSalePrice?: { __typename?: 'SalePrice', id: string, name?: string | null, unitCostInCents: number, discounts?: any | null, pimProductId?: string | null, pimCategoryId: string, pimCategoryName: string, pimCategoryPath: string, updatedAt: any } | null };

export type UpsertTestUserMutationVariables = Exact<{
  id: Scalars['String']['input'];
  input: UserUpsertInput;
}>;


export type UpsertTestUserMutation = { __typename?: 'Mutation', upsertUser?: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string, companyId: string } | null };

export type SyncCurrentUserMutationVariables = Exact<{ [key: string]: never; }>;


export type SyncCurrentUserMutation = { __typename?: 'Mutation', syncCurrentUser?: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string, companyId: string } | null };

export type CreateWorkflowConfigurationMutationVariables = Exact<{
  input: CreateWorkflowConfigurationInput;
}>;


export type CreateWorkflowConfigurationMutation = { __typename?: 'Mutation', createWorkflowConfiguration?: { __typename?: 'WorkflowConfiguration', id: string, name: string, companyId: string, createdBy: string, updatedBy: string, createdAt: any, updatedAt: any, columns: Array<{ __typename?: 'WorkflowColumn', id: string, name: string }> } | null };

export type ListWorkflowConfigurationsQueryVariables = Exact<{
  page?: InputMaybe<ListWorkflowConfigurationsPage>;
}>;


export type ListWorkflowConfigurationsQuery = { __typename?: 'Query', listWorkflowConfigurations?: { __typename?: 'ListWorkflowConfigurationsResult', items: Array<{ __typename?: 'WorkflowConfiguration', id: string, name: string, columns: Array<{ __typename?: 'WorkflowColumn', id: string, name: string }> }>, page: { __typename?: 'PaginationInfo', number: number, size: number } } | null };

export type GetWorkflowConfigurationByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetWorkflowConfigurationByIdQuery = { __typename?: 'Query', getWorkflowConfigurationById?: { __typename?: 'WorkflowConfiguration', id: string, name: string, companyId: string, createdBy: string, updatedBy: string, createdAt: any, updatedAt: any, columns: Array<{ __typename?: 'WorkflowColumn', id: string, name: string }> } | null };

export type UpdateWorkflowConfigurationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateWorkflowConfigurationInput;
}>;


export type UpdateWorkflowConfigurationMutation = { __typename?: 'Mutation', updateWorkflowConfiguration?: { __typename?: 'WorkflowConfiguration', id: string, name: string, columns: Array<{ __typename?: 'WorkflowColumn', id: string, name: string }> } | null };

export type DeleteWorkflowConfigurationByIdMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteWorkflowConfigurationByIdMutation = { __typename?: 'Mutation', deleteWorkflowConfigurationById?: boolean | null };

export type ListWorkspaceMembersTestQueryVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type ListWorkspaceMembersTestQuery = { __typename?: 'Query', listWorkspaceMembers: { __typename?: 'ListWorkspaceMembersResult', items: Array<{ __typename?: 'WorkspaceMember', userId: string, roles: Array<WorkspaceUserRole>, user?: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string } | null }>, page: { __typename?: 'PaginationInfo', totalItems: number } } };

export type UpdateWorkspaceUserRolesMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
  roles: Array<WorkspaceUserRole> | WorkspaceUserRole;
}>;


export type UpdateWorkspaceUserRolesMutation = { __typename?: 'Mutation', updateWorkspaceUserRoles?: { __typename?: 'WorkspaceMember', userId: string, roles: Array<WorkspaceUserRole> } | null };

export type RemoveUserFromWorkspaceMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
}>;


export type RemoveUserFromWorkspaceMutation = { __typename?: 'Mutation', removeUserFromWorkspace?: boolean | null };

export type ArchiveWorkspaceTestMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type ArchiveWorkspaceTestMutation = { __typename?: 'Mutation', archiveWorkspace?: { __typename?: 'Workspace', id: string, archived?: boolean | null, archivedAt?: string | null, updatedAt?: string | null, updatedBy?: string | null } | null };

export type ArchiveWorkspaceNonAdminMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type ArchiveWorkspaceNonAdminMutation = { __typename?: 'Mutation', archiveWorkspace?: { __typename?: 'Workspace', id: string, archived?: boolean | null } | null };

export type ArchiveWorkspaceNonExistentMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type ArchiveWorkspaceNonExistentMutation = { __typename?: 'Mutation', archiveWorkspace?: { __typename?: 'Workspace', id: string } | null };

export type ArchiveWorkspaceAlreadyArchivedMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type ArchiveWorkspaceAlreadyArchivedMutation = { __typename?: 'Mutation', archiveWorkspace?: { __typename?: 'Workspace', id: string, archived?: boolean | null } | null };

export type ArchiveWorkspaceForUnarchiveTestMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type ArchiveWorkspaceForUnarchiveTestMutation = { __typename?: 'Mutation', archiveWorkspace?: { __typename?: 'Workspace', id: string } | null };

export type UnarchiveWorkspaceTestMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type UnarchiveWorkspaceTestMutation = { __typename?: 'Mutation', unarchiveWorkspace?: { __typename?: 'Workspace', id: string, archived?: boolean | null, archivedAt?: string | null, updatedAt?: string | null, updatedBy?: string | null } | null };

export type ArchiveWorkspaceForNonAdminUnarchiveTestMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type ArchiveWorkspaceForNonAdminUnarchiveTestMutation = { __typename?: 'Mutation', archiveWorkspace?: { __typename?: 'Workspace', id: string } | null };

export type UnarchiveWorkspaceNonAdminMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type UnarchiveWorkspaceNonAdminMutation = { __typename?: 'Mutation', unarchiveWorkspace?: { __typename?: 'Workspace', id: string } | null };

export type UnarchiveWorkspaceNonExistentMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type UnarchiveWorkspaceNonExistentMutation = { __typename?: 'Mutation', unarchiveWorkspace?: { __typename?: 'Workspace', id: string } | null };

export type UnarchiveWorkspaceNotArchivedMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type UnarchiveWorkspaceNotArchivedMutation = { __typename?: 'Mutation', unarchiveWorkspace?: { __typename?: 'Workspace', id: string } | null };

export type ArchiveWorkspaceForListTestMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type ArchiveWorkspaceForListTestMutation = { __typename?: 'Mutation', archiveWorkspace?: { __typename?: 'Workspace', id: string } | null };

export type ListWorkspacesAfterArchiveQueryVariables = Exact<{ [key: string]: never; }>;


export type ListWorkspacesAfterArchiveQuery = { __typename?: 'Query', listWorkspaces: { __typename?: 'ListWorkspacesResult', items: Array<{ __typename?: 'Workspace', id: string, name: string, archived?: boolean | null }>, page: { __typename?: 'PaginationInfo', totalItems: number } } };

export type ArchiveWorkspaceForUnarchiveListTestMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type ArchiveWorkspaceForUnarchiveListTestMutation = { __typename?: 'Mutation', archiveWorkspace?: { __typename?: 'Workspace', id: string } | null };

export type ListWorkspacesBeforeUnarchiveQueryVariables = Exact<{ [key: string]: never; }>;


export type ListWorkspacesBeforeUnarchiveQuery = { __typename?: 'Query', listWorkspaces: { __typename?: 'ListWorkspacesResult', items: Array<{ __typename?: 'Workspace', id: string }> } };

export type UnarchiveWorkspaceForListTestMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type UnarchiveWorkspaceForListTestMutation = { __typename?: 'Mutation', unarchiveWorkspace?: { __typename?: 'Workspace', id: string } | null };

export type CreateWorkspaceForSettingsMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateWorkspaceForSettingsMutation = { __typename?: 'Mutation', createWorkspace?: { __typename?: 'Workspace', id: string, name: string, description?: string | null } | null };

export type UpdateWorkspaceSettingsMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  brandId?: InputMaybe<Scalars['String']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  bannerImageUrl?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateWorkspaceSettingsMutation = { __typename?: 'Mutation', updateWorkspaceSettings?: { __typename?: 'Workspace', id: string, name: string, description?: string | null, brandId?: string | null, logoUrl?: string | null, bannerImageUrl?: string | null, updatedBy?: string | null } | null };

export type CreateWorkspaceWithAllFieldsForPatchMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateWorkspaceWithAllFieldsForPatchMutation = { __typename?: 'Mutation', createWorkspace?: { __typename?: 'Workspace', id: string, name: string, description?: string | null, brandId?: string | null, logoUrl?: string | null, bannerImageUrl?: string | null } | null };

export type UpdateOnlyNameMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateOnlyNameMutation = { __typename?: 'Mutation', updateWorkspaceSettings?: { __typename?: 'Workspace', id: string, name: string, description?: string | null, brandId?: string | null, logoUrl?: string | null, bannerImageUrl?: string | null } | null };

export type CreateWorkspaceForNonAdminTestMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateWorkspaceForNonAdminTestMutation = { __typename?: 'Mutation', createWorkspace?: { __typename?: 'Workspace', id: string } | null };

export type AttemptUnauthorizedUpdateMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type AttemptUnauthorizedUpdateMutation = { __typename?: 'Mutation', updateWorkspaceSettings?: { __typename?: 'Workspace', id: string } | null };

export type CreateWorkspaceForEmptyNameTestMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateWorkspaceForEmptyNameTestMutation = { __typename?: 'Mutation', createWorkspace?: { __typename?: 'Workspace', id: string } | null };

export type UpdateWithEmptyNameMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type UpdateWithEmptyNameMutation = { __typename?: 'Mutation', updateWorkspaceSettings?: { __typename?: 'Workspace', id: string } | null };

export type UpdateNonExistentWorkspaceMutationVariables = Exact<{ [key: string]: never; }>;


export type UpdateNonExistentWorkspaceMutation = { __typename?: 'Mutation', updateWorkspaceSettings?: { __typename?: 'Workspace', id: string } | null };

export type CreateInviteOnlyWorkspaceForAccessTypeMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateInviteOnlyWorkspaceForAccessTypeMutation = { __typename?: 'Mutation', createWorkspace?: { __typename?: 'Workspace', id: string, accessType?: WorkspaceAccessType | null, domain?: string | null } | null };

export type UpdateToSameDomainMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type UpdateToSameDomainMutation = { __typename?: 'Mutation', updateWorkspaceAccessType?: { __typename?: 'Workspace', id: string, accessType?: WorkspaceAccessType | null, updatedBy?: string | null } | null };

export type CreateSameDomainWorkspaceMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateSameDomainWorkspaceMutation = { __typename?: 'Mutation', createWorkspace?: { __typename?: 'Workspace', id: string, accessType?: WorkspaceAccessType | null, domain?: string | null } | null };

export type UpdateToInviteOnlyMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type UpdateToInviteOnlyMutation = { __typename?: 'Mutation', updateWorkspaceAccessType?: { __typename?: 'Workspace', id: string, accessType?: WorkspaceAccessType | null, updatedBy?: string | null } | null };

export type CreateWorkspaceForAccessTypeTestMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateWorkspaceForAccessTypeTestMutation = { __typename?: 'Mutation', createWorkspace?: { __typename?: 'Workspace', id: string } | null };

export type AttemptUnauthorizedAccessTypeUpdateMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type AttemptUnauthorizedAccessTypeUpdateMutation = { __typename?: 'Mutation', updateWorkspaceAccessType?: { __typename?: 'Workspace', id: string } | null };

export type UpdateAccessTypeNonExistentMutationVariables = Exact<{ [key: string]: never; }>;


export type UpdateAccessTypeNonExistentMutation = { __typename?: 'Mutation', updateWorkspaceAccessType?: { __typename?: 'Workspace', id: string } | null };

export type CreateWorkspaceForSpiceDbTestMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateWorkspaceForSpiceDbTestMutation = { __typename?: 'Mutation', createWorkspace?: { __typename?: 'Workspace', id: string, accessType?: WorkspaceAccessType | null, domain?: string | null } | null };

export type UpdateToSameDomainSpiceDbMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type UpdateToSameDomainSpiceDbMutation = { __typename?: 'Mutation', updateWorkspaceAccessType?: { __typename?: 'Workspace', id: string, accessType?: WorkspaceAccessType | null } | null };

export type ListJoinableAfterSameDomainQueryVariables = Exact<{ [key: string]: never; }>;


export type ListJoinableAfterSameDomainQuery = { __typename?: 'Query', listJoinableWorkspaces: { __typename?: 'ListWorkspacesResult', items: Array<{ __typename?: 'Workspace', id: string, name: string }> } };

export type UpdateToInviteOnlySpiceDbMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type UpdateToInviteOnlySpiceDbMutation = { __typename?: 'Mutation', updateWorkspaceAccessType?: { __typename?: 'Workspace', id: string, accessType?: WorkspaceAccessType | null } | null };

export type CreateWorkspaceWithAllFieldsMutationVariables = Exact<{
  name: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  brandId?: InputMaybe<Scalars['String']['input']>;
  bannerImageUrl?: InputMaybe<Scalars['String']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  accessType: WorkspaceAccessType;
  archived?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type CreateWorkspaceWithAllFieldsMutation = { __typename?: 'Mutation', createWorkspace?: { __typename?: 'Workspace', id: string, companyId?: number | null, name: string, description?: string | null, domain?: string | null, brandId?: string | null, createdBy?: string | null, bannerImageUrl?: string | null, logoUrl?: string | null, accessType?: WorkspaceAccessType | null, archived?: boolean | null, archivedAt?: string | null, createdAt?: string | null, updatedAt?: string | null, updatedBy?: string | null, ownerId?: string | null } | null };

export type CreateWorkspaceWithSameDomainMutationVariables = Exact<{
  name: Scalars['String']['input'];
  accessType: WorkspaceAccessType;
}>;


export type CreateWorkspaceWithSameDomainMutation = { __typename?: 'Mutation', createWorkspace?: { __typename?: 'Workspace', id: string, name: string, accessType?: WorkspaceAccessType | null } | null };

export type CreateWorkspaceAutoDomainMutationVariables = Exact<{
  name: Scalars['String']['input'];
  accessType: WorkspaceAccessType;
}>;


export type CreateWorkspaceAutoDomainMutation = { __typename?: 'Mutation', createWorkspace?: { __typename?: 'Workspace', id: string, domain?: string | null } | null };

export type CreateWorkspaceForListMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateWorkspaceForListMutation = { __typename?: 'Mutation', createWorkspace?: { __typename?: 'Workspace', id: string } | null };

export type ListWorkspacesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListWorkspacesQuery = { __typename?: 'Query', listWorkspaces: { __typename?: 'ListWorkspacesResult', items: Array<{ __typename?: 'Workspace', id: string, name: string, accessType?: WorkspaceAccessType | null, archived?: boolean | null }>, page: { __typename?: 'PaginationInfo', number: number, size: number, totalItems: number, totalPages: number } } };

export type CreateWorkspaceForJoinableTestMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateWorkspaceForJoinableTestMutation = { __typename?: 'Mutation', createWorkspace?: { __typename?: 'Workspace', id: string } | null };

export type ListJoinableWorkspacesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListJoinableWorkspacesQuery = { __typename?: 'Query', listJoinableWorkspaces: { __typename?: 'ListWorkspacesResult', items: Array<{ __typename?: 'Workspace', id: string, name: string }>, page: { __typename?: 'PaginationInfo', totalItems: number } } };

export type ListMyWorkspacesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListMyWorkspacesQuery = { __typename?: 'Query', listWorkspaces: { __typename?: 'ListWorkspacesResult', items: Array<{ __typename?: 'Workspace', id: string, name: string }> } };

export type CreateInviteOnlyWorkspaceMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateInviteOnlyWorkspaceMutation = { __typename?: 'Mutation', createWorkspace?: { __typename?: 'Workspace', id: string } | null };

export type AttemptUnauthorizedJoinMutationVariables = Exact<{
  workspaceId: Scalars['String']['input'];
}>;


export type AttemptUnauthorizedJoinMutation = { __typename?: 'Mutation', joinWorkspace?: { __typename?: 'Workspace', id: string } | null };

export type JoinNonExistentWorkspaceMutationVariables = Exact<{ [key: string]: never; }>;


export type JoinNonExistentWorkspaceMutation = { __typename?: 'Mutation', joinWorkspace?: { __typename?: 'Workspace', id: string } | null };

export type AcceptQuoteResultKeySpecifier = ('purchaseOrder' | 'quote' | 'salesOrder' | AcceptQuoteResultKeySpecifier)[];
export type AcceptQuoteResultFieldPolicy = {
	purchaseOrder?: FieldPolicy<any> | FieldReadFunction<any>,
	quote?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrder?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AdminMutationNamespaceKeySpecifier = ('assignRolesToUser' | 'collectionSnapshot' | 'deleteRelationship' | 'removeRolesFromUser' | 'sendTemplatedEmail' | 'sendTestEmail' | 'writeRelationship' | AdminMutationNamespaceKeySpecifier)[];
export type AdminMutationNamespaceFieldPolicy = {
	assignRolesToUser?: FieldPolicy<any> | FieldReadFunction<any>,
	collectionSnapshot?: FieldPolicy<any> | FieldReadFunction<any>,
	deleteRelationship?: FieldPolicy<any> | FieldReadFunction<any>,
	removeRolesFromUser?: FieldPolicy<any> | FieldReadFunction<any>,
	sendTemplatedEmail?: FieldPolicy<any> | FieldReadFunction<any>,
	sendTestEmail?: FieldPolicy<any> | FieldReadFunction<any>,
	writeRelationship?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AdminQueryNamespaceKeySpecifier = ('getUserById' | 'getUserRoles' | 'listAvailableRelations' | 'listRelationships' | 'listResourceTypes' | 'listRoles' | 'previewEmailTemplate' | 'rawZedSchema' | 'searchUsers' | 'sendGridEmailActivity' | 'sendGridEmailDetails' | AdminQueryNamespaceKeySpecifier)[];
export type AdminQueryNamespaceFieldPolicy = {
	getUserById?: FieldPolicy<any> | FieldReadFunction<any>,
	getUserRoles?: FieldPolicy<any> | FieldReadFunction<any>,
	listAvailableRelations?: FieldPolicy<any> | FieldReadFunction<any>,
	listRelationships?: FieldPolicy<any> | FieldReadFunction<any>,
	listResourceTypes?: FieldPolicy<any> | FieldReadFunction<any>,
	listRoles?: FieldPolicy<any> | FieldReadFunction<any>,
	previewEmailTemplate?: FieldPolicy<any> | FieldReadFunction<any>,
	rawZedSchema?: FieldPolicy<any> | FieldReadFunction<any>,
	searchUsers?: FieldPolicy<any> | FieldReadFunction<any>,
	sendGridEmailActivity?: FieldPolicy<any> | FieldReadFunction<any>,
	sendGridEmailDetails?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AdoptOrphanedSubmissionsResultKeySpecifier = ('adoptedCount' | 'adoptedSubmissionIds' | 'adoptedSubmissions' | AdoptOrphanedSubmissionsResultKeySpecifier)[];
export type AdoptOrphanedSubmissionsResultFieldPolicy = {
	adoptedCount?: FieldPolicy<any> | FieldReadFunction<any>,
	adoptedSubmissionIds?: FieldPolicy<any> | FieldReadFunction<any>,
	adoptedSubmissions?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AssetKeySpecifier = ('category' | 'class' | 'company' | 'company_id' | 'custom_name' | 'description' | 'details' | 'groups' | 'id' | 'inventory_branch' | 'keypad' | 'msp_branch' | 'name' | 'photo' | 'photo_id' | 'pim_category_id' | 'pim_category_name' | 'pim_category_path' | 'pim_make' | 'pim_make_id' | 'pim_product_id' | 'pim_product_model' | 'pim_product_name' | 'pim_product_platform_id' | 'pim_product_variant' | 'pim_product_year' | 'rsp_branch' | 'tracker' | 'tsp_companies' | 'type' | AssetKeySpecifier)[];
export type AssetFieldPolicy = {
	category?: FieldPolicy<any> | FieldReadFunction<any>,
	class?: FieldPolicy<any> | FieldReadFunction<any>,
	company?: FieldPolicy<any> | FieldReadFunction<any>,
	company_id?: FieldPolicy<any> | FieldReadFunction<any>,
	custom_name?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	details?: FieldPolicy<any> | FieldReadFunction<any>,
	groups?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	inventory_branch?: FieldPolicy<any> | FieldReadFunction<any>,
	keypad?: FieldPolicy<any> | FieldReadFunction<any>,
	msp_branch?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	photo?: FieldPolicy<any> | FieldReadFunction<any>,
	photo_id?: FieldPolicy<any> | FieldReadFunction<any>,
	pim_category_id?: FieldPolicy<any> | FieldReadFunction<any>,
	pim_category_name?: FieldPolicy<any> | FieldReadFunction<any>,
	pim_category_path?: FieldPolicy<any> | FieldReadFunction<any>,
	pim_make?: FieldPolicy<any> | FieldReadFunction<any>,
	pim_make_id?: FieldPolicy<any> | FieldReadFunction<any>,
	pim_product_id?: FieldPolicy<any> | FieldReadFunction<any>,
	pim_product_model?: FieldPolicy<any> | FieldReadFunction<any>,
	pim_product_name?: FieldPolicy<any> | FieldReadFunction<any>,
	pim_product_platform_id?: FieldPolicy<any> | FieldReadFunction<any>,
	pim_product_variant?: FieldPolicy<any> | FieldReadFunction<any>,
	pim_product_year?: FieldPolicy<any> | FieldReadFunction<any>,
	rsp_branch?: FieldPolicy<any> | FieldReadFunction<any>,
	tracker?: FieldPolicy<any> | FieldReadFunction<any>,
	tsp_companies?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AssetCategoryKeySpecifier = ('category_id' | 'composite' | 'level_1' | 'level_2' | 'level_3' | AssetCategoryKeySpecifier)[];
export type AssetCategoryFieldPolicy = {
	category_id?: FieldPolicy<any> | FieldReadFunction<any>,
	composite?: FieldPolicy<any> | FieldReadFunction<any>,
	level_1?: FieldPolicy<any> | FieldReadFunction<any>,
	level_2?: FieldPolicy<any> | FieldReadFunction<any>,
	level_3?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AssetClassKeySpecifier = ('description' | 'id' | 'name' | AssetClassKeySpecifier)[];
export type AssetClassFieldPolicy = {
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AssetCompanyKeySpecifier = ('id' | 'name' | AssetCompanyKeySpecifier)[];
export type AssetCompanyFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AssetDetailsKeySpecifier = ('asset_id' | 'camera_id' | 'custom_name' | 'description' | 'driver_name' | 'model' | 'name' | 'photo_id' | 'serial_number' | 'tracker_id' | 'vin' | 'year' | AssetDetailsKeySpecifier)[];
export type AssetDetailsFieldPolicy = {
	asset_id?: FieldPolicy<any> | FieldReadFunction<any>,
	camera_id?: FieldPolicy<any> | FieldReadFunction<any>,
	custom_name?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	driver_name?: FieldPolicy<any> | FieldReadFunction<any>,
	model?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	photo_id?: FieldPolicy<any> | FieldReadFunction<any>,
	serial_number?: FieldPolicy<any> | FieldReadFunction<any>,
	tracker_id?: FieldPolicy<any> | FieldReadFunction<any>,
	vin?: FieldPolicy<any> | FieldReadFunction<any>,
	year?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AssetGroupKeySpecifier = ('company_id' | 'company_name' | 'id' | 'name' | AssetGroupKeySpecifier)[];
export type AssetGroupFieldPolicy = {
	company_id?: FieldPolicy<any> | FieldReadFunction<any>,
	company_name?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AssetInventoryBranchKeySpecifier = ('company_id' | 'company_name' | 'description' | 'id' | 'name' | AssetInventoryBranchKeySpecifier)[];
export type AssetInventoryBranchFieldPolicy = {
	company_id?: FieldPolicy<any> | FieldReadFunction<any>,
	company_name?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AssetMspBranchKeySpecifier = ('company_id' | 'company_name' | 'description' | 'id' | 'name' | AssetMspBranchKeySpecifier)[];
export type AssetMspBranchFieldPolicy = {
	company_id?: FieldPolicy<any> | FieldReadFunction<any>,
	company_name?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AssetPhotoKeySpecifier = ('filename' | 'photo_id' | AssetPhotoKeySpecifier)[];
export type AssetPhotoFieldPolicy = {
	filename?: FieldPolicy<any> | FieldReadFunction<any>,
	photo_id?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AssetRspBranchKeySpecifier = ('company_id' | 'company_name' | 'description' | 'id' | 'name' | AssetRspBranchKeySpecifier)[];
export type AssetRspBranchFieldPolicy = {
	company_id?: FieldPolicy<any> | FieldReadFunction<any>,
	company_name?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AssetScheduleKeySpecifier = ('asset_id' | 'company_id' | 'created_at' | 'created_by' | 'end_date' | 'id' | 'project_id' | 'start_date' | 'updated_at' | 'updated_by' | AssetScheduleKeySpecifier)[];
export type AssetScheduleFieldPolicy = {
	asset_id?: FieldPolicy<any> | FieldReadFunction<any>,
	company_id?: FieldPolicy<any> | FieldReadFunction<any>,
	created_at?: FieldPolicy<any> | FieldReadFunction<any>,
	created_by?: FieldPolicy<any> | FieldReadFunction<any>,
	end_date?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	project_id?: FieldPolicy<any> | FieldReadFunction<any>,
	start_date?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_at?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_by?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AssetScheduleListResultKeySpecifier = ('items' | 'limit' | 'offset' | 'total' | AssetScheduleListResultKeySpecifier)[];
export type AssetScheduleListResultFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	limit?: FieldPolicy<any> | FieldReadFunction<any>,
	offset?: FieldPolicy<any> | FieldReadFunction<any>,
	total?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AssetTrackerKeySpecifier = ('company_id' | 'created' | 'device_serial' | 'id' | 'tracker_type_id' | 'updated' | 'vendor_id' | AssetTrackerKeySpecifier)[];
export type AssetTrackerFieldPolicy = {
	company_id?: FieldPolicy<any> | FieldReadFunction<any>,
	created?: FieldPolicy<any> | FieldReadFunction<any>,
	device_serial?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	tracker_type_id?: FieldPolicy<any> | FieldReadFunction<any>,
	updated?: FieldPolicy<any> | FieldReadFunction<any>,
	vendor_id?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AssetTspCompanyKeySpecifier = ('company_id' | 'company_name' | AssetTspCompanyKeySpecifier)[];
export type AssetTspCompanyFieldPolicy = {
	company_id?: FieldPolicy<any> | FieldReadFunction<any>,
	company_name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AssetTypeKeySpecifier = ('id' | 'name' | AssetTypeKeySpecifier)[];
export type AssetTypeFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type Auth0IdentityKeySpecifier = ('accessToken' | 'connection' | 'isSocial' | 'provider' | 'userId' | Auth0IdentityKeySpecifier)[];
export type Auth0IdentityFieldPolicy = {
	accessToken?: FieldPolicy<any> | FieldReadFunction<any>,
	connection?: FieldPolicy<any> | FieldReadFunction<any>,
	isSocial?: FieldPolicy<any> | FieldReadFunction<any>,
	provider?: FieldPolicy<any> | FieldReadFunction<any>,
	userId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type Auth0RoleKeySpecifier = ('description' | 'id' | 'name' | Auth0RoleKeySpecifier)[];
export type Auth0RoleFieldPolicy = {
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type Auth0UserKeySpecifier = ('appMetadata' | 'blocked' | 'createdAt' | 'email' | 'emailVerified' | 'familyName' | 'givenName' | 'identities' | 'lastIp' | 'lastLogin' | 'loginsCount' | 'multifactor' | 'name' | 'nickname' | 'phoneNumber' | 'phoneVerified' | 'picture' | 'updatedAt' | 'userId' | 'userMetadata' | 'username' | Auth0UserKeySpecifier)[];
export type Auth0UserFieldPolicy = {
	appMetadata?: FieldPolicy<any> | FieldReadFunction<any>,
	blocked?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	email?: FieldPolicy<any> | FieldReadFunction<any>,
	emailVerified?: FieldPolicy<any> | FieldReadFunction<any>,
	familyName?: FieldPolicy<any> | FieldReadFunction<any>,
	givenName?: FieldPolicy<any> | FieldReadFunction<any>,
	identities?: FieldPolicy<any> | FieldReadFunction<any>,
	lastIp?: FieldPolicy<any> | FieldReadFunction<any>,
	lastLogin?: FieldPolicy<any> | FieldReadFunction<any>,
	loginsCount?: FieldPolicy<any> | FieldReadFunction<any>,
	multifactor?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	nickname?: FieldPolicy<any> | FieldReadFunction<any>,
	phoneNumber?: FieldPolicy<any> | FieldReadFunction<any>,
	phoneVerified?: FieldPolicy<any> | FieldReadFunction<any>,
	picture?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	userId?: FieldPolicy<any> | FieldReadFunction<any>,
	userMetadata?: FieldPolicy<any> | FieldReadFunction<any>,
	username?: FieldPolicy<any> | FieldReadFunction<any>
};
export type Auth0UsersSearchResultKeySpecifier = ('length' | 'limit' | 'start' | 'total' | 'users' | Auth0UsersSearchResultKeySpecifier)[];
export type Auth0UsersSearchResultFieldPolicy = {
	length?: FieldPolicy<any> | FieldReadFunction<any>,
	limit?: FieldPolicy<any> | FieldReadFunction<any>,
	start?: FieldPolicy<any> | FieldReadFunction<any>,
	total?: FieldPolicy<any> | FieldReadFunction<any>,
	users?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AvailableRelationKeySpecifier = ('allowedResourceTypes' | 'allowedSubjectTypes' | 'description' | 'isComputed' | 'relation' | AvailableRelationKeySpecifier)[];
export type AvailableRelationFieldPolicy = {
	allowedResourceTypes?: FieldPolicy<any> | FieldReadFunction<any>,
	allowedSubjectTypes?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	isComputed?: FieldPolicy<any> | FieldReadFunction<any>,
	relation?: FieldPolicy<any> | FieldReadFunction<any>
};
export type BaseTransactionKeySpecifier = ('comments' | 'createdAt' | 'createdBy' | 'history' | 'id' | 'lastUpdatedBy' | 'notes' | 'projectId' | 'statusId' | 'type' | 'updatedAt' | 'workflowId' | 'workspaceId' | BaseTransactionKeySpecifier)[];
export type BaseTransactionFieldPolicy = {
	comments?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	history?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	lastUpdatedBy?: FieldPolicy<any> | FieldReadFunction<any>,
	notes?: FieldPolicy<any> | FieldReadFunction<any>,
	projectId?: FieldPolicy<any> | FieldReadFunction<any>,
	statusId?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	workflowId?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type BrandKeySpecifier = ('colors' | 'createdAt' | 'createdBy' | 'description' | 'domain' | 'fonts' | 'id' | 'images' | 'links' | 'logos' | 'longDescription' | 'name' | 'updatedAt' | 'updatedBy' | BrandKeySpecifier)[];
export type BrandFieldPolicy = {
	colors?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	domain?: FieldPolicy<any> | FieldReadFunction<any>,
	fonts?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	images?: FieldPolicy<any> | FieldReadFunction<any>,
	links?: FieldPolicy<any> | FieldReadFunction<any>,
	logos?: FieldPolicy<any> | FieldReadFunction<any>,
	longDescription?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedBy?: FieldPolicy<any> | FieldReadFunction<any>
};
export type BrandColorKeySpecifier = ('brightness' | 'hex' | 'type' | BrandColorKeySpecifier)[];
export type BrandColorFieldPolicy = {
	brightness?: FieldPolicy<any> | FieldReadFunction<any>,
	hex?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>
};
export type BrandFontKeySpecifier = ('name' | 'origin' | 'originId' | 'type' | 'weights' | BrandFontKeySpecifier)[];
export type BrandFontFieldPolicy = {
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	origin?: FieldPolicy<any> | FieldReadFunction<any>,
	originId?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>,
	weights?: FieldPolicy<any> | FieldReadFunction<any>
};
export type BrandImageKeySpecifier = ('formats' | 'type' | 'url' | BrandImageKeySpecifier)[];
export type BrandImageFieldPolicy = {
	formats?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>,
	url?: FieldPolicy<any> | FieldReadFunction<any>
};
export type BrandImageFormatKeySpecifier = ('background' | 'format' | 'height' | 'size' | 'src' | 'width' | BrandImageFormatKeySpecifier)[];
export type BrandImageFormatFieldPolicy = {
	background?: FieldPolicy<any> | FieldReadFunction<any>,
	format?: FieldPolicy<any> | FieldReadFunction<any>,
	height?: FieldPolicy<any> | FieldReadFunction<any>,
	size?: FieldPolicy<any> | FieldReadFunction<any>,
	src?: FieldPolicy<any> | FieldReadFunction<any>,
	width?: FieldPolicy<any> | FieldReadFunction<any>
};
export type BrandLinkKeySpecifier = ('name' | 'url' | BrandLinkKeySpecifier)[];
export type BrandLinkFieldPolicy = {
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	url?: FieldPolicy<any> | FieldReadFunction<any>
};
export type BrandLogoKeySpecifier = ('formats' | 'theme' | 'type' | 'url' | BrandLogoKeySpecifier)[];
export type BrandLogoFieldPolicy = {
	formats?: FieldPolicy<any> | FieldReadFunction<any>,
	theme?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>,
	url?: FieldPolicy<any> | FieldReadFunction<any>
};
export type BrandSearchResultKeySpecifier = ('brandId' | 'domain' | 'icon' | 'name' | BrandSearchResultKeySpecifier)[];
export type BrandSearchResultFieldPolicy = {
	brandId?: FieldPolicy<any> | FieldReadFunction<any>,
	domain?: FieldPolicy<any> | FieldReadFunction<any>,
	icon?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type BulkMarkInventoryReceivedResultKeySpecifier = ('items' | 'totalProcessed' | BulkMarkInventoryReceivedResultKeySpecifier)[];
export type BulkMarkInventoryReceivedResultFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	totalProcessed?: FieldPolicy<any> | FieldReadFunction<any>
};
export type BusinessContactKeySpecifier = ('accountsPayableContactId' | 'address' | 'associatedPriceBooks' | 'brand' | 'brandId' | 'contactType' | 'createdAt' | 'createdBy' | 'employees' | 'id' | 'latitude' | 'longitude' | 'name' | 'notes' | 'phone' | 'placeId' | 'profilePicture' | 'resourceMapIds' | 'resource_map_entries' | 'taxId' | 'updatedAt' | 'website' | 'workspaceId' | BusinessContactKeySpecifier)[];
export type BusinessContactFieldPolicy = {
	accountsPayableContactId?: FieldPolicy<any> | FieldReadFunction<any>,
	address?: FieldPolicy<any> | FieldReadFunction<any>,
	associatedPriceBooks?: FieldPolicy<any> | FieldReadFunction<any>,
	brand?: FieldPolicy<any> | FieldReadFunction<any>,
	brandId?: FieldPolicy<any> | FieldReadFunction<any>,
	contactType?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	employees?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	latitude?: FieldPolicy<any> | FieldReadFunction<any>,
	longitude?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	notes?: FieldPolicy<any> | FieldReadFunction<any>,
	phone?: FieldPolicy<any> | FieldReadFunction<any>,
	placeId?: FieldPolicy<any> | FieldReadFunction<any>,
	profilePicture?: FieldPolicy<any> | FieldReadFunction<any>,
	resourceMapIds?: FieldPolicy<any> | FieldReadFunction<any>,
	resource_map_entries?: FieldPolicy<any> | FieldReadFunction<any>,
	taxId?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	website?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ChargeKeySpecifier = ('amountInCents' | 'billingPeriodEnd' | 'billingPeriodStart' | 'chargeType' | 'companyId' | 'contact' | 'contactId' | 'createdAt' | 'description' | 'fulfilment' | 'fulfilmentId' | 'id' | 'invoice' | 'invoiceId' | 'project' | 'projectId' | 'purchaseOrderNumber' | 'salesOrder' | 'salesOrderId' | 'salesOrderLineItem' | 'salesOrderLineItemId' | 'workspaceId' | ChargeKeySpecifier)[];
export type ChargeFieldPolicy = {
	amountInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	billingPeriodEnd?: FieldPolicy<any> | FieldReadFunction<any>,
	billingPeriodStart?: FieldPolicy<any> | FieldReadFunction<any>,
	chargeType?: FieldPolicy<any> | FieldReadFunction<any>,
	companyId?: FieldPolicy<any> | FieldReadFunction<any>,
	contact?: FieldPolicy<any> | FieldReadFunction<any>,
	contactId?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	fulfilment?: FieldPolicy<any> | FieldReadFunction<any>,
	fulfilmentId?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	invoice?: FieldPolicy<any> | FieldReadFunction<any>,
	invoiceId?: FieldPolicy<any> | FieldReadFunction<any>,
	project?: FieldPolicy<any> | FieldReadFunction<any>,
	projectId?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrderNumber?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrder?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderId?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderLineItemId?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ChargePageKeySpecifier = ('items' | 'page' | ChargePageKeySpecifier)[];
export type ChargePageFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>
};
export type CollectionSnapshotResultKeySpecifier = ('collectionName' | 'documentsUpdated' | 'error' | 'success' | 'timestamp' | CollectionSnapshotResultKeySpecifier)[];
export type CollectionSnapshotResultFieldPolicy = {
	collectionName?: FieldPolicy<any> | FieldReadFunction<any>,
	documentsUpdated?: FieldPolicy<any> | FieldReadFunction<any>,
	error?: FieldPolicy<any> | FieldReadFunction<any>,
	success?: FieldPolicy<any> | FieldReadFunction<any>,
	timestamp?: FieldPolicy<any> | FieldReadFunction<any>
};
export type CommentKeySpecifier = ('id' | CommentKeySpecifier)[];
export type CommentFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>
};
export type CompanyKeySpecifier = ('id' | 'name' | CompanyKeySpecifier)[];
export type CompanyFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type CreatePdfResultKeySpecifier = ('error_message' | 'success' | CreatePdfResultKeySpecifier)[];
export type CreatePdfResultFieldPolicy = {
	error_message?: FieldPolicy<any> | FieldReadFunction<any>,
	success?: FieldPolicy<any> | FieldReadFunction<any>
};
export type CurrentTimeEventKeySpecifier = ('timestamp' | CurrentTimeEventKeySpecifier)[];
export type CurrentTimeEventFieldPolicy = {
	timestamp?: FieldPolicy<any> | FieldReadFunction<any>
};
export type DeleteRelationshipResultKeySpecifier = ('message' | 'success' | DeleteRelationshipResultKeySpecifier)[];
export type DeleteRelationshipResultFieldPolicy = {
	message?: FieldPolicy<any> | FieldReadFunction<any>,
	success?: FieldPolicy<any> | FieldReadFunction<any>
};
export type EmailActivityKeySpecifier = ('clicks' | 'email' | 'event' | 'fromEmail' | 'htmlContent' | 'msgId' | 'opens' | 'plainContent' | 'status' | 'subject' | 'timestamp' | EmailActivityKeySpecifier)[];
export type EmailActivityFieldPolicy = {
	clicks?: FieldPolicy<any> | FieldReadFunction<any>,
	email?: FieldPolicy<any> | FieldReadFunction<any>,
	event?: FieldPolicy<any> | FieldReadFunction<any>,
	fromEmail?: FieldPolicy<any> | FieldReadFunction<any>,
	htmlContent?: FieldPolicy<any> | FieldReadFunction<any>,
	msgId?: FieldPolicy<any> | FieldReadFunction<any>,
	opens?: FieldPolicy<any> | FieldReadFunction<any>,
	plainContent?: FieldPolicy<any> | FieldReadFunction<any>,
	status?: FieldPolicy<any> | FieldReadFunction<any>,
	subject?: FieldPolicy<any> | FieldReadFunction<any>,
	timestamp?: FieldPolicy<any> | FieldReadFunction<any>
};
export type EmailDetailsKeySpecifier = ('from' | 'htmlContent' | 'msgId' | 'plainContent' | 'status' | 'subject' | 'timestamp' | 'to' | EmailDetailsKeySpecifier)[];
export type EmailDetailsFieldPolicy = {
	from?: FieldPolicy<any> | FieldReadFunction<any>,
	htmlContent?: FieldPolicy<any> | FieldReadFunction<any>,
	msgId?: FieldPolicy<any> | FieldReadFunction<any>,
	plainContent?: FieldPolicy<any> | FieldReadFunction<any>,
	status?: FieldPolicy<any> | FieldReadFunction<any>,
	subject?: FieldPolicy<any> | FieldReadFunction<any>,
	timestamp?: FieldPolicy<any> | FieldReadFunction<any>,
	to?: FieldPolicy<any> | FieldReadFunction<any>
};
export type EmailTemplatePreviewResultKeySpecifier = ('html' | EmailTemplatePreviewResultKeySpecifier)[];
export type EmailTemplatePreviewResultFieldPolicy = {
	html?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ExampleTicketKeySpecifier = ('description' | 'title' | ExampleTicketKeySpecifier)[];
export type ExampleTicketFieldPolicy = {
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	title?: FieldPolicy<any> | FieldReadFunction<any>
};
export type FileKeySpecifier = ('comments' | 'created_at' | 'created_by' | 'created_by_user' | 'deleted' | 'file_key' | 'file_name' | 'file_size' | 'id' | 'metadata' | 'mime_type' | 'parent_entity_id' | 'updated_at' | 'updated_by' | 'updated_by_user' | 'url' | 'workspace_id' | FileKeySpecifier)[];
export type FileFieldPolicy = {
	comments?: FieldPolicy<any> | FieldReadFunction<any>,
	created_at?: FieldPolicy<any> | FieldReadFunction<any>,
	created_by?: FieldPolicy<any> | FieldReadFunction<any>,
	created_by_user?: FieldPolicy<any> | FieldReadFunction<any>,
	deleted?: FieldPolicy<any> | FieldReadFunction<any>,
	file_key?: FieldPolicy<any> | FieldReadFunction<any>,
	file_name?: FieldPolicy<any> | FieldReadFunction<any>,
	file_size?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	metadata?: FieldPolicy<any> | FieldReadFunction<any>,
	mime_type?: FieldPolicy<any> | FieldReadFunction<any>,
	parent_entity_id?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_at?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_by?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_by_user?: FieldPolicy<any> | FieldReadFunction<any>,
	url?: FieldPolicy<any> | FieldReadFunction<any>,
	workspace_id?: FieldPolicy<any> | FieldReadFunction<any>
};
export type FulfilmentBaseKeySpecifier = ('assignedTo' | 'assignedToId' | 'companyId' | 'contact' | 'contactId' | 'createdAt' | 'id' | 'pimCategory' | 'pimCategoryId' | 'pimCategoryName' | 'pimCategoryPath' | 'pimProduct' | 'pimProductId' | 'price' | 'priceId' | 'priceName' | 'project' | 'projectId' | 'purchaseOrderLineItem' | 'purchaseOrderLineItemId' | 'purchaseOrderNumber' | 'salesOrder' | 'salesOrderId' | 'salesOrderLineItem' | 'salesOrderLineItemId' | 'salesOrderPONumber' | 'salesOrderType' | 'updatedAt' | 'workflowColumnId' | 'workflowId' | 'workspaceId' | FulfilmentBaseKeySpecifier)[];
export type FulfilmentBaseFieldPolicy = {
	assignedTo?: FieldPolicy<any> | FieldReadFunction<any>,
	assignedToId?: FieldPolicy<any> | FieldReadFunction<any>,
	companyId?: FieldPolicy<any> | FieldReadFunction<any>,
	contact?: FieldPolicy<any> | FieldReadFunction<any>,
	contactId?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategory?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryId?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryName?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryPath?: FieldPolicy<any> | FieldReadFunction<any>,
	pimProduct?: FieldPolicy<any> | FieldReadFunction<any>,
	pimProductId?: FieldPolicy<any> | FieldReadFunction<any>,
	price?: FieldPolicy<any> | FieldReadFunction<any>,
	priceId?: FieldPolicy<any> | FieldReadFunction<any>,
	priceName?: FieldPolicy<any> | FieldReadFunction<any>,
	project?: FieldPolicy<any> | FieldReadFunction<any>,
	projectId?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrderLineItemId?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrderNumber?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrder?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderId?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderLineItemId?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderPONumber?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderType?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	workflowColumnId?: FieldPolicy<any> | FieldReadFunction<any>,
	workflowId?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type FulfilmentReservationKeySpecifier = ('companyId' | 'createdAt' | 'createdBy' | 'createdByUser' | 'deleted' | 'endDate' | 'fulfilment' | 'fulfilmentId' | 'id' | 'inventory' | 'inventoryId' | 'salesOrderType' | 'startDate' | 'type' | 'updatedAt' | 'updatedBy' | 'updatedByUser' | FulfilmentReservationKeySpecifier)[];
export type FulfilmentReservationFieldPolicy = {
	companyId?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	createdByUser?: FieldPolicy<any> | FieldReadFunction<any>,
	deleted?: FieldPolicy<any> | FieldReadFunction<any>,
	endDate?: FieldPolicy<any> | FieldReadFunction<any>,
	fulfilment?: FieldPolicy<any> | FieldReadFunction<any>,
	fulfilmentId?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	inventory?: FieldPolicy<any> | FieldReadFunction<any>,
	inventoryId?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderType?: FieldPolicy<any> | FieldReadFunction<any>,
	startDate?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedBy?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedByUser?: FieldPolicy<any> | FieldReadFunction<any>
};
export type GenerateReferenceNumberResultKeySpecifier = ('referenceNumber' | 'sequenceNumber' | 'templateUsed' | GenerateReferenceNumberResultKeySpecifier)[];
export type GenerateReferenceNumberResultFieldPolicy = {
	referenceNumber?: FieldPolicy<any> | FieldReadFunction<any>,
	sequenceNumber?: FieldPolicy<any> | FieldReadFunction<any>,
	templateUsed?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ImportPricesResultKeySpecifier = ('errors' | 'failed' | 'imported' | ImportPricesResultKeySpecifier)[];
export type ImportPricesResultFieldPolicy = {
	errors?: FieldPolicy<any> | FieldReadFunction<any>,
	failed?: FieldPolicy<any> | FieldReadFunction<any>,
	imported?: FieldPolicy<any> | FieldReadFunction<any>
};
export type IntakeFormKeySpecifier = ('createdAt' | 'createdBy' | 'id' | 'isActive' | 'isDeleted' | 'isPublic' | 'pricebook' | 'pricebookId' | 'project' | 'projectId' | 'sharedWithUserIds' | 'sharedWithUsers' | 'updatedAt' | 'updatedBy' | 'workspace' | 'workspaceId' | IntakeFormKeySpecifier)[];
export type IntakeFormFieldPolicy = {
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	isActive?: FieldPolicy<any> | FieldReadFunction<any>,
	isDeleted?: FieldPolicy<any> | FieldReadFunction<any>,
	isPublic?: FieldPolicy<any> | FieldReadFunction<any>,
	pricebook?: FieldPolicy<any> | FieldReadFunction<any>,
	pricebookId?: FieldPolicy<any> | FieldReadFunction<any>,
	project?: FieldPolicy<any> | FieldReadFunction<any>,
	projectId?: FieldPolicy<any> | FieldReadFunction<any>,
	sharedWithUserIds?: FieldPolicy<any> | FieldReadFunction<any>,
	sharedWithUsers?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedBy?: FieldPolicy<any> | FieldReadFunction<any>,
	workspace?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type IntakeFormLineItemKeySpecifier = ('customPriceName' | 'deliveryLocation' | 'deliveryMethod' | 'deliveryNotes' | 'description' | 'durationInDays' | 'fulfilmentId' | 'id' | 'inventoryReservations' | 'pimCategory' | 'pimCategoryId' | 'price' | 'priceForecast' | 'priceId' | 'quantity' | 'rentalEndDate' | 'rentalStartDate' | 'salesOrderId' | 'salesOrderLineItem' | 'startDate' | 'subtotalInCents' | 'type' | IntakeFormLineItemKeySpecifier)[];
export type IntakeFormLineItemFieldPolicy = {
	customPriceName?: FieldPolicy<any> | FieldReadFunction<any>,
	deliveryLocation?: FieldPolicy<any> | FieldReadFunction<any>,
	deliveryMethod?: FieldPolicy<any> | FieldReadFunction<any>,
	deliveryNotes?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	durationInDays?: FieldPolicy<any> | FieldReadFunction<any>,
	fulfilmentId?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	inventoryReservations?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategory?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryId?: FieldPolicy<any> | FieldReadFunction<any>,
	price?: FieldPolicy<any> | FieldReadFunction<any>,
	priceForecast?: FieldPolicy<any> | FieldReadFunction<any>,
	priceId?: FieldPolicy<any> | FieldReadFunction<any>,
	quantity?: FieldPolicy<any> | FieldReadFunction<any>,
	rentalEndDate?: FieldPolicy<any> | FieldReadFunction<any>,
	rentalStartDate?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderId?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	startDate?: FieldPolicy<any> | FieldReadFunction<any>,
	subtotalInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>
};
export type IntakeFormPageKeySpecifier = ('items' | 'page' | IntakeFormPageKeySpecifier)[];
export type IntakeFormPageFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>
};
export type IntakeFormPageInfoKeySpecifier = ('number' | 'size' | 'totalItems' | 'totalPages' | IntakeFormPageInfoKeySpecifier)[];
export type IntakeFormPageInfoFieldPolicy = {
	number?: FieldPolicy<any> | FieldReadFunction<any>,
	size?: FieldPolicy<any> | FieldReadFunction<any>,
	totalItems?: FieldPolicy<any> | FieldReadFunction<any>,
	totalPages?: FieldPolicy<any> | FieldReadFunction<any>
};
export type IntakeFormProjectKeySpecifier = ('id' | 'name' | 'projectCode' | IntakeFormProjectKeySpecifier)[];
export type IntakeFormProjectFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	projectCode?: FieldPolicy<any> | FieldReadFunction<any>
};
export type IntakeFormSubmissionKeySpecifier = ('buyerWorkspace' | 'buyerWorkspaceId' | 'companyName' | 'createdAt' | 'email' | 'form' | 'formId' | 'id' | 'lineItems' | 'name' | 'phone' | 'purchaseOrderId' | 'purchaseOrderNumber' | 'quote' | 'salesOrder' | 'status' | 'submittedAt' | 'totalInCents' | 'userId' | 'workspaceId' | IntakeFormSubmissionKeySpecifier)[];
export type IntakeFormSubmissionFieldPolicy = {
	buyerWorkspace?: FieldPolicy<any> | FieldReadFunction<any>,
	buyerWorkspaceId?: FieldPolicy<any> | FieldReadFunction<any>,
	companyName?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	email?: FieldPolicy<any> | FieldReadFunction<any>,
	form?: FieldPolicy<any> | FieldReadFunction<any>,
	formId?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	lineItems?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	phone?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrderId?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrderNumber?: FieldPolicy<any> | FieldReadFunction<any>,
	quote?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrder?: FieldPolicy<any> | FieldReadFunction<any>,
	status?: FieldPolicy<any> | FieldReadFunction<any>,
	submittedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	totalInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	userId?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type IntakeFormSubmissionPageKeySpecifier = ('items' | 'page' | IntakeFormSubmissionPageKeySpecifier)[];
export type IntakeFormSubmissionPageFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>
};
export type IntakeFormSubmissionPageInfoKeySpecifier = ('number' | 'size' | 'totalItems' | 'totalPages' | IntakeFormSubmissionPageInfoKeySpecifier)[];
export type IntakeFormSubmissionPageInfoFieldPolicy = {
	number?: FieldPolicy<any> | FieldReadFunction<any>,
	size?: FieldPolicy<any> | FieldReadFunction<any>,
	totalItems?: FieldPolicy<any> | FieldReadFunction<any>,
	totalPages?: FieldPolicy<any> | FieldReadFunction<any>
};
export type IntakeFormWorkspaceKeySpecifier = ('bannerImageUrl' | 'companyId' | 'id' | 'logoUrl' | 'name' | IntakeFormWorkspaceKeySpecifier)[];
export type IntakeFormWorkspaceFieldPolicy = {
	bannerImageUrl?: FieldPolicy<any> | FieldReadFunction<any>,
	companyId?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	logoUrl?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type InventoryKeySpecifier = ('actualReturnDate' | 'asset' | 'assetId' | 'companyId' | 'conditionNotes' | 'conditionOnReceipt' | 'createdAt' | 'createdBy' | 'createdByUser' | 'expectedReturnDate' | 'fulfilment' | 'fulfilmentId' | 'id' | 'isThirdPartyRental' | 'pimCategory' | 'pimCategoryId' | 'pimCategoryName' | 'pimCategoryPath' | 'pimProduct' | 'pimProductId' | 'purchaseOrder' | 'purchaseOrderId' | 'purchaseOrderLineItem' | 'purchaseOrderLineItemId' | 'receiptNotes' | 'receivedAt' | 'resourceMap' | 'resourceMapId' | 'resourceMapIds' | 'resource_map_entries' | 'status' | 'updatedAt' | 'updatedBy' | 'updatedByUser' | 'workspaceId' | InventoryKeySpecifier)[];
export type InventoryFieldPolicy = {
	actualReturnDate?: FieldPolicy<any> | FieldReadFunction<any>,
	asset?: FieldPolicy<any> | FieldReadFunction<any>,
	assetId?: FieldPolicy<any> | FieldReadFunction<any>,
	companyId?: FieldPolicy<any> | FieldReadFunction<any>,
	conditionNotes?: FieldPolicy<any> | FieldReadFunction<any>,
	conditionOnReceipt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	createdByUser?: FieldPolicy<any> | FieldReadFunction<any>,
	expectedReturnDate?: FieldPolicy<any> | FieldReadFunction<any>,
	fulfilment?: FieldPolicy<any> | FieldReadFunction<any>,
	fulfilmentId?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	isThirdPartyRental?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategory?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryId?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryName?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryPath?: FieldPolicy<any> | FieldReadFunction<any>,
	pimProduct?: FieldPolicy<any> | FieldReadFunction<any>,
	pimProductId?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrder?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrderId?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrderLineItemId?: FieldPolicy<any> | FieldReadFunction<any>,
	receiptNotes?: FieldPolicy<any> | FieldReadFunction<any>,
	receivedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	resourceMap?: FieldPolicy<any> | FieldReadFunction<any>,
	resourceMapId?: FieldPolicy<any> | FieldReadFunction<any>,
	resourceMapIds?: FieldPolicy<any> | FieldReadFunction<any>,
	resource_map_entries?: FieldPolicy<any> | FieldReadFunction<any>,
	status?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedBy?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedByUser?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type InventoryGroupedByCategoryKeySpecifier = ('pimCategoryId' | 'pimCategoryName' | 'pimCategoryPath' | 'quantityOnOrder' | 'quantityReceived' | 'sampleInventories' | 'sampleInventoryIds' | 'totalQuantity' | InventoryGroupedByCategoryKeySpecifier)[];
export type InventoryGroupedByCategoryFieldPolicy = {
	pimCategoryId?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryName?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryPath?: FieldPolicy<any> | FieldReadFunction<any>,
	quantityOnOrder?: FieldPolicy<any> | FieldReadFunction<any>,
	quantityReceived?: FieldPolicy<any> | FieldReadFunction<any>,
	sampleInventories?: FieldPolicy<any> | FieldReadFunction<any>,
	sampleInventoryIds?: FieldPolicy<any> | FieldReadFunction<any>,
	totalQuantity?: FieldPolicy<any> | FieldReadFunction<any>
};
export type InventoryGroupedByCategoryResponseKeySpecifier = ('items' | 'pageNumber' | 'pageSize' | 'totalCount' | 'totalPages' | InventoryGroupedByCategoryResponseKeySpecifier)[];
export type InventoryGroupedByCategoryResponseFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	pageNumber?: FieldPolicy<any> | FieldReadFunction<any>,
	pageSize?: FieldPolicy<any> | FieldReadFunction<any>,
	totalCount?: FieldPolicy<any> | FieldReadFunction<any>,
	totalPages?: FieldPolicy<any> | FieldReadFunction<any>
};
export type InventoryReservationsPageKeySpecifier = ('number' | 'size' | 'totalItems' | 'totalPages' | InventoryReservationsPageKeySpecifier)[];
export type InventoryReservationsPageFieldPolicy = {
	number?: FieldPolicy<any> | FieldReadFunction<any>,
	size?: FieldPolicy<any> | FieldReadFunction<any>,
	totalItems?: FieldPolicy<any> | FieldReadFunction<any>,
	totalPages?: FieldPolicy<any> | FieldReadFunction<any>
};
export type InventoryReservationsResponseKeySpecifier = ('items' | 'page' | InventoryReservationsResponseKeySpecifier)[];
export type InventoryReservationsResponseFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>
};
export type InventoryResponseKeySpecifier = ('items' | InventoryResponseKeySpecifier)[];
export type InventoryResponseFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>
};
export type InvoiceKeySpecifier = ('buyer' | 'buyerId' | 'companyId' | 'createdAt' | 'createdBy' | 'createdByUser' | 'finalSumInCents' | 'id' | 'invoiceNumber' | 'invoicePaidDate' | 'invoiceSentDate' | 'lineItems' | 'seller' | 'sellerId' | 'status' | 'subTotalInCents' | 'taxLineItems' | 'taxPercent' | 'taxesInCents' | 'totalTaxesInCents' | 'updatedAt' | 'updatedBy' | 'updatedByUser' | 'workspaceId' | InvoiceKeySpecifier)[];
export type InvoiceFieldPolicy = {
	buyer?: FieldPolicy<any> | FieldReadFunction<any>,
	buyerId?: FieldPolicy<any> | FieldReadFunction<any>,
	companyId?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	createdByUser?: FieldPolicy<any> | FieldReadFunction<any>,
	finalSumInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	invoiceNumber?: FieldPolicy<any> | FieldReadFunction<any>,
	invoicePaidDate?: FieldPolicy<any> | FieldReadFunction<any>,
	invoiceSentDate?: FieldPolicy<any> | FieldReadFunction<any>,
	lineItems?: FieldPolicy<any> | FieldReadFunction<any>,
	seller?: FieldPolicy<any> | FieldReadFunction<any>,
	sellerId?: FieldPolicy<any> | FieldReadFunction<any>,
	status?: FieldPolicy<any> | FieldReadFunction<any>,
	subTotalInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	taxLineItems?: FieldPolicy<any> | FieldReadFunction<any>,
	taxPercent?: FieldPolicy<any> | FieldReadFunction<any>,
	taxesInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	totalTaxesInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedBy?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedByUser?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type InvoiceLineItemKeySpecifier = ('charge' | 'chargeId' | 'description' | 'totalInCents' | InvoiceLineItemKeySpecifier)[];
export type InvoiceLineItemFieldPolicy = {
	charge?: FieldPolicy<any> | FieldReadFunction<any>,
	chargeId?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	totalInCents?: FieldPolicy<any> | FieldReadFunction<any>
};
export type InvoicesResponseKeySpecifier = ('items' | InvoicesResponseKeySpecifier)[];
export type InvoicesResponseFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>
};
export type LineItemCostOptionDetailsKeySpecifier = ('exactSplitDistribution' | 'optimalSplit' | 'plainText' | 'rates' | LineItemCostOptionDetailsKeySpecifier)[];
export type LineItemCostOptionDetailsFieldPolicy = {
	exactSplitDistribution?: FieldPolicy<any> | FieldReadFunction<any>,
	optimalSplit?: FieldPolicy<any> | FieldReadFunction<any>,
	plainText?: FieldPolicy<any> | FieldReadFunction<any>,
	rates?: FieldPolicy<any> | FieldReadFunction<any>
};
export type LineItemPriceForecastKeySpecifier = ('accumulative_cost_in_cents' | 'days' | LineItemPriceForecastKeySpecifier)[];
export type LineItemPriceForecastFieldPolicy = {
	accumulative_cost_in_cents?: FieldPolicy<any> | FieldReadFunction<any>,
	days?: FieldPolicy<any> | FieldReadFunction<any>
};
export type LineItemPriceForecastDayKeySpecifier = ('accumulative_cost_in_cents' | 'cost_in_cents' | 'day' | 'details' | 'rental_period' | 'savings_compared_to_day_rate_in_cents' | 'savings_compared_to_day_rate_in_fraction' | 'savings_compared_to_exact_split_in_cents' | 'strategy' | LineItemPriceForecastDayKeySpecifier)[];
export type LineItemPriceForecastDayFieldPolicy = {
	accumulative_cost_in_cents?: FieldPolicy<any> | FieldReadFunction<any>,
	cost_in_cents?: FieldPolicy<any> | FieldReadFunction<any>,
	day?: FieldPolicy<any> | FieldReadFunction<any>,
	details?: FieldPolicy<any> | FieldReadFunction<any>,
	rental_period?: FieldPolicy<any> | FieldReadFunction<any>,
	savings_compared_to_day_rate_in_cents?: FieldPolicy<any> | FieldReadFunction<any>,
	savings_compared_to_day_rate_in_fraction?: FieldPolicy<any> | FieldReadFunction<any>,
	savings_compared_to_exact_split_in_cents?: FieldPolicy<any> | FieldReadFunction<any>,
	strategy?: FieldPolicy<any> | FieldReadFunction<any>
};
export type LineItemPricingKeySpecifier = ('pricePer1DayInCents' | 'pricePer7DaysInCents' | 'pricePer28DaysInCents' | LineItemPricingKeySpecifier)[];
export type LineItemPricingFieldPolicy = {
	pricePer1DayInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	pricePer7DaysInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	pricePer28DaysInCents?: FieldPolicy<any> | FieldReadFunction<any>
};
export type LineItemRentalPeriodKeySpecifier = ('days1' | 'days7' | 'days28' | LineItemRentalPeriodKeySpecifier)[];
export type LineItemRentalPeriodFieldPolicy = {
	days1?: FieldPolicy<any> | FieldReadFunction<any>,
	days7?: FieldPolicy<any> | FieldReadFunction<any>,
	days28?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ListAssetsResultKeySpecifier = ('items' | 'page' | ListAssetsResultKeySpecifier)[];
export type ListAssetsResultFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ListContactsResultKeySpecifier = ('items' | 'page' | ListContactsResultKeySpecifier)[];
export type ListContactsResultFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ListFulfilmentsResultKeySpecifier = ('items' | 'page' | ListFulfilmentsResultKeySpecifier)[];
export type ListFulfilmentsResultFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ListPersonContactsResultKeySpecifier = ('items' | 'page' | ListPersonContactsResultKeySpecifier)[];
export type ListPersonContactsResultFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ListPimCategoriesResultKeySpecifier = ('items' | 'page' | ListPimCategoriesResultKeySpecifier)[];
export type ListPimCategoriesResultFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ListPimProductsResultKeySpecifier = ('items' | 'page' | ListPimProductsResultKeySpecifier)[];
export type ListPimProductsResultFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ListPriceBooksResultKeySpecifier = ('items' | 'page' | ListPriceBooksResultKeySpecifier)[];
export type ListPriceBooksResultFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ListPricesResultKeySpecifier = ('items' | 'page' | ListPricesResultKeySpecifier)[];
export type ListPricesResultFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ListRFQsResultKeySpecifier = ('items' | 'page' | ListRFQsResultKeySpecifier)[];
export type ListRFQsResultFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ListRelationshipsResultKeySpecifier = ('cursor' | 'relationships' | ListRelationshipsResultKeySpecifier)[];
export type ListRelationshipsResultFieldPolicy = {
	cursor?: FieldPolicy<any> | FieldReadFunction<any>,
	relationships?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ListRentalFulfilmentsResultKeySpecifier = ('items' | 'page' | ListRentalFulfilmentsResultKeySpecifier)[];
export type ListRentalFulfilmentsResultFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ListRentalViewsResultKeySpecifier = ('items' | 'page' | ListRentalViewsResultKeySpecifier)[];
export type ListRentalViewsResultFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ListTransactionResultKeySpecifier = ('items' | 'page' | ListTransactionResultKeySpecifier)[];
export type ListTransactionResultFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ListUserPermissionsResultKeySpecifier = ('permissions' | ListUserPermissionsResultKeySpecifier)[];
export type ListUserPermissionsResultFieldPolicy = {
	permissions?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ListWorkflowConfigurationsResultKeySpecifier = ('items' | 'page' | ListWorkflowConfigurationsResultKeySpecifier)[];
export type ListWorkflowConfigurationsResultFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ListWorkspaceMembersResultKeySpecifier = ('items' | 'page' | ListWorkspaceMembersResultKeySpecifier)[];
export type ListWorkspaceMembersResultFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ListWorkspacesResultKeySpecifier = ('items' | 'page' | ListWorkspacesResultKeySpecifier)[];
export type ListWorkspacesResultFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>
};
export type LlmKeySpecifier = ('exampleTicket' | 'suggestTaxObligations' | LlmKeySpecifier)[];
export type LlmFieldPolicy = {
	exampleTicket?: FieldPolicy<any> | FieldReadFunction<any>,
	suggestTaxObligations?: FieldPolicy<any> | FieldReadFunction<any>
};
export type MutationKeySpecifier = ('acceptQuote' | 'addFileToEntity' | 'addInvoiceCharges' | 'addSearchRecent' | 'addTaxLineItem' | 'admin' | 'adoptOrphanedSubmissions' | 'archiveWorkspace' | 'assignInventoryToRentalFulfilment' | 'bulkMarkInventoryReceived' | 'cancelInvoice' | 'clearInvoiceTaxes' | 'clearSearchRecents' | 'createAssetSchedule' | 'createBusinessContact' | 'createCharge' | 'createFulfilmentReservation' | 'createIntakeForm' | 'createIntakeFormSubmission' | 'createIntakeFormSubmissionLineItem' | 'createInventory' | 'createInvoice' | 'createNote' | 'createPdfFromPageAndAttachToEntityId' | 'createPersonContact' | 'createPriceBook' | 'createProject' | 'createPurchaseOrder' | 'createQuote' | 'createQuoteFromIntakeFormSubmission' | 'createQuoteRevision' | 'createRFQ' | 'createReferenceNumberTemplate' | 'createRentalFulfilment' | 'createRentalPrice' | 'createRentalPurchaseOrderLineItem' | 'createRentalSalesOrderLineItem' | 'createSaleFulfilment' | 'createSalePrice' | 'createSalePurchaseOrderLineItem' | 'createSaleSalesOrderLineItem' | 'createSalesOrder' | 'createServiceFulfilment' | 'createTransaction' | 'createWorkflowConfiguration' | 'createWorkspace' | 'deleteContactById' | 'deleteFulfilment' | 'deleteIntakeForm' | 'deleteIntakeFormSubmissionLineItem' | 'deleteInventory' | 'deleteInvoice' | 'deleteNote' | 'deletePriceBookById' | 'deletePriceById' | 'deleteProject' | 'deleteReferenceNumberTemplate' | 'deleteWorkflowConfigurationById' | 'exportPrices' | 'generateReferenceNumber' | 'getSignedReadUrl' | 'importPrices' | 'inviteUserToWorkspace' | 'joinWorkspace' | 'markInvoiceAsPaid' | 'markInvoiceAsSent' | 'refreshBrand' | 'rejectQuote' | 'removeFileFromEntity' | 'removeSearchRecent' | 'removeTaxLineItem' | 'removeUserFromWorkspace' | 'renameFile' | 'resetSequenceNumber' | 'runNightlyRentalChargesJob' | 'runNightlyRentalChargesJobAsync' | 'sendQuote' | 'setExpectedRentalEndDate' | 'setFulfilmentPurchaseOrderLineItemId' | 'setIntakeFormActive' | 'setInvoiceTax' | 'setRentalEndDate' | 'setRentalStartDate' | 'softDeletePurchaseOrder' | 'softDeletePurchaseOrderLineItem' | 'softDeleteSalesOrder' | 'softDeleteSalesOrderLineItem' | 'submitIntakeFormSubmission' | 'submitPurchaseOrder' | 'submitSalesOrder' | 'syncCurrentUser' | 'toggleSearchFavorite' | 'touchAllContacts' | 'unarchiveWorkspace' | 'unassignInventoryFromRentalFulfilment' | 'updateBusinessAddress' | 'updateBusinessBrandId' | 'updateBusinessContact' | 'updateBusinessName' | 'updateBusinessPhone' | 'updateBusinessTaxId' | 'updateBusinessWebsite' | 'updateFulfilmentAssignee' | 'updateFulfilmentColumn' | 'updateIntakeForm' | 'updateIntakeFormSubmission' | 'updateIntakeFormSubmissionLineItem' | 'updateInventoryActualReturnDate' | 'updateInventoryExpectedReturnDate' | 'updateInventorySerialisedId' | 'updateNote' | 'updatePersonBusiness' | 'updatePersonContact' | 'updatePersonEmail' | 'updatePersonName' | 'updatePersonPhone' | 'updatePersonResourceMap' | 'updatePersonRole' | 'updatePriceBook' | 'updateProject' | 'updateProjectCode' | 'updateProjectContacts' | 'updateProjectDescription' | 'updateProjectName' | 'updateProjectParentProject' | 'updateProjectScopeOfWork' | 'updateProjectStatus' | 'updatePurchaseOrder' | 'updatePurchaseOrderLineItem' | 'updateQuote' | 'updateQuoteRevision' | 'updateQuoteStatus' | 'updateRFQ' | 'updateReferenceNumberTemplate' | 'updateRentalPrice' | 'updateRentalPurchaseOrderLineItem' | 'updateRentalSalesOrderLineItem' | 'updateSalePrice' | 'updateSalePurchaseOrderLineItem' | 'updateSaleSalesOrderLineItem' | 'updateSalesOrder' | 'updateSalesOrderLineItem' | 'updateTaxLineItem' | 'updateWorkflowConfiguration' | 'updateWorkspaceAccessType' | 'updateWorkspaceSettings' | 'updateWorkspaceUserRoles' | 'upsertPimCategory' | 'upsertUser' | MutationKeySpecifier)[];
export type MutationFieldPolicy = {
	acceptQuote?: FieldPolicy<any> | FieldReadFunction<any>,
	addFileToEntity?: FieldPolicy<any> | FieldReadFunction<any>,
	addInvoiceCharges?: FieldPolicy<any> | FieldReadFunction<any>,
	addSearchRecent?: FieldPolicy<any> | FieldReadFunction<any>,
	addTaxLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	admin?: FieldPolicy<any> | FieldReadFunction<any>,
	adoptOrphanedSubmissions?: FieldPolicy<any> | FieldReadFunction<any>,
	archiveWorkspace?: FieldPolicy<any> | FieldReadFunction<any>,
	assignInventoryToRentalFulfilment?: FieldPolicy<any> | FieldReadFunction<any>,
	bulkMarkInventoryReceived?: FieldPolicy<any> | FieldReadFunction<any>,
	cancelInvoice?: FieldPolicy<any> | FieldReadFunction<any>,
	clearInvoiceTaxes?: FieldPolicy<any> | FieldReadFunction<any>,
	clearSearchRecents?: FieldPolicy<any> | FieldReadFunction<any>,
	createAssetSchedule?: FieldPolicy<any> | FieldReadFunction<any>,
	createBusinessContact?: FieldPolicy<any> | FieldReadFunction<any>,
	createCharge?: FieldPolicy<any> | FieldReadFunction<any>,
	createFulfilmentReservation?: FieldPolicy<any> | FieldReadFunction<any>,
	createIntakeForm?: FieldPolicy<any> | FieldReadFunction<any>,
	createIntakeFormSubmission?: FieldPolicy<any> | FieldReadFunction<any>,
	createIntakeFormSubmissionLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	createInventory?: FieldPolicy<any> | FieldReadFunction<any>,
	createInvoice?: FieldPolicy<any> | FieldReadFunction<any>,
	createNote?: FieldPolicy<any> | FieldReadFunction<any>,
	createPdfFromPageAndAttachToEntityId?: FieldPolicy<any> | FieldReadFunction<any>,
	createPersonContact?: FieldPolicy<any> | FieldReadFunction<any>,
	createPriceBook?: FieldPolicy<any> | FieldReadFunction<any>,
	createProject?: FieldPolicy<any> | FieldReadFunction<any>,
	createPurchaseOrder?: FieldPolicy<any> | FieldReadFunction<any>,
	createQuote?: FieldPolicy<any> | FieldReadFunction<any>,
	createQuoteFromIntakeFormSubmission?: FieldPolicy<any> | FieldReadFunction<any>,
	createQuoteRevision?: FieldPolicy<any> | FieldReadFunction<any>,
	createRFQ?: FieldPolicy<any> | FieldReadFunction<any>,
	createReferenceNumberTemplate?: FieldPolicy<any> | FieldReadFunction<any>,
	createRentalFulfilment?: FieldPolicy<any> | FieldReadFunction<any>,
	createRentalPrice?: FieldPolicy<any> | FieldReadFunction<any>,
	createRentalPurchaseOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	createRentalSalesOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	createSaleFulfilment?: FieldPolicy<any> | FieldReadFunction<any>,
	createSalePrice?: FieldPolicy<any> | FieldReadFunction<any>,
	createSalePurchaseOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	createSaleSalesOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	createSalesOrder?: FieldPolicy<any> | FieldReadFunction<any>,
	createServiceFulfilment?: FieldPolicy<any> | FieldReadFunction<any>,
	createTransaction?: FieldPolicy<any> | FieldReadFunction<any>,
	createWorkflowConfiguration?: FieldPolicy<any> | FieldReadFunction<any>,
	createWorkspace?: FieldPolicy<any> | FieldReadFunction<any>,
	deleteContactById?: FieldPolicy<any> | FieldReadFunction<any>,
	deleteFulfilment?: FieldPolicy<any> | FieldReadFunction<any>,
	deleteIntakeForm?: FieldPolicy<any> | FieldReadFunction<any>,
	deleteIntakeFormSubmissionLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	deleteInventory?: FieldPolicy<any> | FieldReadFunction<any>,
	deleteInvoice?: FieldPolicy<any> | FieldReadFunction<any>,
	deleteNote?: FieldPolicy<any> | FieldReadFunction<any>,
	deletePriceBookById?: FieldPolicy<any> | FieldReadFunction<any>,
	deletePriceById?: FieldPolicy<any> | FieldReadFunction<any>,
	deleteProject?: FieldPolicy<any> | FieldReadFunction<any>,
	deleteReferenceNumberTemplate?: FieldPolicy<any> | FieldReadFunction<any>,
	deleteWorkflowConfigurationById?: FieldPolicy<any> | FieldReadFunction<any>,
	exportPrices?: FieldPolicy<any> | FieldReadFunction<any>,
	generateReferenceNumber?: FieldPolicy<any> | FieldReadFunction<any>,
	getSignedReadUrl?: FieldPolicy<any> | FieldReadFunction<any>,
	importPrices?: FieldPolicy<any> | FieldReadFunction<any>,
	inviteUserToWorkspace?: FieldPolicy<any> | FieldReadFunction<any>,
	joinWorkspace?: FieldPolicy<any> | FieldReadFunction<any>,
	markInvoiceAsPaid?: FieldPolicy<any> | FieldReadFunction<any>,
	markInvoiceAsSent?: FieldPolicy<any> | FieldReadFunction<any>,
	refreshBrand?: FieldPolicy<any> | FieldReadFunction<any>,
	rejectQuote?: FieldPolicy<any> | FieldReadFunction<any>,
	removeFileFromEntity?: FieldPolicy<any> | FieldReadFunction<any>,
	removeSearchRecent?: FieldPolicy<any> | FieldReadFunction<any>,
	removeTaxLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	removeUserFromWorkspace?: FieldPolicy<any> | FieldReadFunction<any>,
	renameFile?: FieldPolicy<any> | FieldReadFunction<any>,
	resetSequenceNumber?: FieldPolicy<any> | FieldReadFunction<any>,
	runNightlyRentalChargesJob?: FieldPolicy<any> | FieldReadFunction<any>,
	runNightlyRentalChargesJobAsync?: FieldPolicy<any> | FieldReadFunction<any>,
	sendQuote?: FieldPolicy<any> | FieldReadFunction<any>,
	setExpectedRentalEndDate?: FieldPolicy<any> | FieldReadFunction<any>,
	setFulfilmentPurchaseOrderLineItemId?: FieldPolicy<any> | FieldReadFunction<any>,
	setIntakeFormActive?: FieldPolicy<any> | FieldReadFunction<any>,
	setInvoiceTax?: FieldPolicy<any> | FieldReadFunction<any>,
	setRentalEndDate?: FieldPolicy<any> | FieldReadFunction<any>,
	setRentalStartDate?: FieldPolicy<any> | FieldReadFunction<any>,
	softDeletePurchaseOrder?: FieldPolicy<any> | FieldReadFunction<any>,
	softDeletePurchaseOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	softDeleteSalesOrder?: FieldPolicy<any> | FieldReadFunction<any>,
	softDeleteSalesOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	submitIntakeFormSubmission?: FieldPolicy<any> | FieldReadFunction<any>,
	submitPurchaseOrder?: FieldPolicy<any> | FieldReadFunction<any>,
	submitSalesOrder?: FieldPolicy<any> | FieldReadFunction<any>,
	syncCurrentUser?: FieldPolicy<any> | FieldReadFunction<any>,
	toggleSearchFavorite?: FieldPolicy<any> | FieldReadFunction<any>,
	touchAllContacts?: FieldPolicy<any> | FieldReadFunction<any>,
	unarchiveWorkspace?: FieldPolicy<any> | FieldReadFunction<any>,
	unassignInventoryFromRentalFulfilment?: FieldPolicy<any> | FieldReadFunction<any>,
	updateBusinessAddress?: FieldPolicy<any> | FieldReadFunction<any>,
	updateBusinessBrandId?: FieldPolicy<any> | FieldReadFunction<any>,
	updateBusinessContact?: FieldPolicy<any> | FieldReadFunction<any>,
	updateBusinessName?: FieldPolicy<any> | FieldReadFunction<any>,
	updateBusinessPhone?: FieldPolicy<any> | FieldReadFunction<any>,
	updateBusinessTaxId?: FieldPolicy<any> | FieldReadFunction<any>,
	updateBusinessWebsite?: FieldPolicy<any> | FieldReadFunction<any>,
	updateFulfilmentAssignee?: FieldPolicy<any> | FieldReadFunction<any>,
	updateFulfilmentColumn?: FieldPolicy<any> | FieldReadFunction<any>,
	updateIntakeForm?: FieldPolicy<any> | FieldReadFunction<any>,
	updateIntakeFormSubmission?: FieldPolicy<any> | FieldReadFunction<any>,
	updateIntakeFormSubmissionLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	updateInventoryActualReturnDate?: FieldPolicy<any> | FieldReadFunction<any>,
	updateInventoryExpectedReturnDate?: FieldPolicy<any> | FieldReadFunction<any>,
	updateInventorySerialisedId?: FieldPolicy<any> | FieldReadFunction<any>,
	updateNote?: FieldPolicy<any> | FieldReadFunction<any>,
	updatePersonBusiness?: FieldPolicy<any> | FieldReadFunction<any>,
	updatePersonContact?: FieldPolicy<any> | FieldReadFunction<any>,
	updatePersonEmail?: FieldPolicy<any> | FieldReadFunction<any>,
	updatePersonName?: FieldPolicy<any> | FieldReadFunction<any>,
	updatePersonPhone?: FieldPolicy<any> | FieldReadFunction<any>,
	updatePersonResourceMap?: FieldPolicy<any> | FieldReadFunction<any>,
	updatePersonRole?: FieldPolicy<any> | FieldReadFunction<any>,
	updatePriceBook?: FieldPolicy<any> | FieldReadFunction<any>,
	updateProject?: FieldPolicy<any> | FieldReadFunction<any>,
	updateProjectCode?: FieldPolicy<any> | FieldReadFunction<any>,
	updateProjectContacts?: FieldPolicy<any> | FieldReadFunction<any>,
	updateProjectDescription?: FieldPolicy<any> | FieldReadFunction<any>,
	updateProjectName?: FieldPolicy<any> | FieldReadFunction<any>,
	updateProjectParentProject?: FieldPolicy<any> | FieldReadFunction<any>,
	updateProjectScopeOfWork?: FieldPolicy<any> | FieldReadFunction<any>,
	updateProjectStatus?: FieldPolicy<any> | FieldReadFunction<any>,
	updatePurchaseOrder?: FieldPolicy<any> | FieldReadFunction<any>,
	updatePurchaseOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	updateQuote?: FieldPolicy<any> | FieldReadFunction<any>,
	updateQuoteRevision?: FieldPolicy<any> | FieldReadFunction<any>,
	updateQuoteStatus?: FieldPolicy<any> | FieldReadFunction<any>,
	updateRFQ?: FieldPolicy<any> | FieldReadFunction<any>,
	updateReferenceNumberTemplate?: FieldPolicy<any> | FieldReadFunction<any>,
	updateRentalPrice?: FieldPolicy<any> | FieldReadFunction<any>,
	updateRentalPurchaseOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	updateRentalSalesOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	updateSalePrice?: FieldPolicy<any> | FieldReadFunction<any>,
	updateSalePurchaseOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	updateSaleSalesOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	updateSalesOrder?: FieldPolicy<any> | FieldReadFunction<any>,
	updateSalesOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	updateTaxLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	updateWorkflowConfiguration?: FieldPolicy<any> | FieldReadFunction<any>,
	updateWorkspaceAccessType?: FieldPolicy<any> | FieldReadFunction<any>,
	updateWorkspaceSettings?: FieldPolicy<any> | FieldReadFunction<any>,
	updateWorkspaceUserRoles?: FieldPolicy<any> | FieldReadFunction<any>,
	upsertPimCategory?: FieldPolicy<any> | FieldReadFunction<any>,
	upsertUser?: FieldPolicy<any> | FieldReadFunction<any>
};
export type NoteKeySpecifier = ('_id' | 'company_id' | 'created_at' | 'created_by' | 'created_by_user' | 'deleted' | 'parent_entity_id' | 'sub_notes' | 'updated_at' | 'updated_by' | 'value' | 'workspace_id' | NoteKeySpecifier)[];
export type NoteFieldPolicy = {
	_id?: FieldPolicy<any> | FieldReadFunction<any>,
	company_id?: FieldPolicy<any> | FieldReadFunction<any>,
	created_at?: FieldPolicy<any> | FieldReadFunction<any>,
	created_by?: FieldPolicy<any> | FieldReadFunction<any>,
	created_by_user?: FieldPolicy<any> | FieldReadFunction<any>,
	deleted?: FieldPolicy<any> | FieldReadFunction<any>,
	parent_entity_id?: FieldPolicy<any> | FieldReadFunction<any>,
	sub_notes?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_at?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_by?: FieldPolicy<any> | FieldReadFunction<any>,
	value?: FieldPolicy<any> | FieldReadFunction<any>,
	workspace_id?: FieldPolicy<any> | FieldReadFunction<any>
};
export type PaginationInfoKeySpecifier = ('number' | 'size' | 'totalItems' | 'totalPages' | PaginationInfoKeySpecifier)[];
export type PaginationInfoFieldPolicy = {
	number?: FieldPolicy<any> | FieldReadFunction<any>,
	size?: FieldPolicy<any> | FieldReadFunction<any>,
	totalItems?: FieldPolicy<any> | FieldReadFunction<any>,
	totalPages?: FieldPolicy<any> | FieldReadFunction<any>
};
export type PersonContactKeySpecifier = ('business' | 'businessId' | 'contactType' | 'createdAt' | 'createdBy' | 'email' | 'id' | 'name' | 'notes' | 'phone' | 'profilePicture' | 'resourceMapIds' | 'resource_map_entries' | 'role' | 'updatedAt' | 'workspaceId' | PersonContactKeySpecifier)[];
export type PersonContactFieldPolicy = {
	business?: FieldPolicy<any> | FieldReadFunction<any>,
	businessId?: FieldPolicy<any> | FieldReadFunction<any>,
	contactType?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	email?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	notes?: FieldPolicy<any> | FieldReadFunction<any>,
	phone?: FieldPolicy<any> | FieldReadFunction<any>,
	profilePicture?: FieldPolicy<any> | FieldReadFunction<any>,
	resourceMapIds?: FieldPolicy<any> | FieldReadFunction<any>,
	resource_map_entries?: FieldPolicy<any> | FieldReadFunction<any>,
	role?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type PimCategoryKeySpecifier = ('childrenCount' | 'description' | 'has_products' | 'id' | 'is_deleted' | 'name' | 'path' | 'platform_id' | 'productCount' | 'tenant_id' | PimCategoryKeySpecifier)[];
export type PimCategoryFieldPolicy = {
	childrenCount?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	has_products?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	is_deleted?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	path?: FieldPolicy<any> | FieldReadFunction<any>,
	platform_id?: FieldPolicy<any> | FieldReadFunction<any>,
	productCount?: FieldPolicy<any> | FieldReadFunction<any>,
	tenant_id?: FieldPolicy<any> | FieldReadFunction<any>
};
export type PimProductKeySpecifier = ('id' | 'is_deleted' | 'make' | 'manufacturer_part_number' | 'model' | 'name' | 'pim_category_id' | 'pim_category_path' | 'pim_category_platform_id' | 'pim_product_id' | 'sku' | 'tenant_id' | 'upc' | 'year' | PimProductKeySpecifier)[];
export type PimProductFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	is_deleted?: FieldPolicy<any> | FieldReadFunction<any>,
	make?: FieldPolicy<any> | FieldReadFunction<any>,
	manufacturer_part_number?: FieldPolicy<any> | FieldReadFunction<any>,
	model?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	pim_category_id?: FieldPolicy<any> | FieldReadFunction<any>,
	pim_category_path?: FieldPolicy<any> | FieldReadFunction<any>,
	pim_category_platform_id?: FieldPolicy<any> | FieldReadFunction<any>,
	pim_product_id?: FieldPolicy<any> | FieldReadFunction<any>,
	sku?: FieldPolicy<any> | FieldReadFunction<any>,
	tenant_id?: FieldPolicy<any> | FieldReadFunction<any>,
	upc?: FieldPolicy<any> | FieldReadFunction<any>,
	year?: FieldPolicy<any> | FieldReadFunction<any>
};
export type PriceBookKeySpecifier = ('businessContact' | 'businessContactId' | 'comments' | 'createdAt' | 'createdBy' | 'createdByUser' | 'id' | 'isDefault' | 'listPrices' | 'location' | 'name' | 'notes' | 'parentPriceBook' | 'parentPriceBookId' | 'parentPriceBookPercentageFactor' | 'project' | 'projectId' | 'updatedAt' | 'updatedBy' | 'updatedByUser' | 'workspaceId' | PriceBookKeySpecifier)[];
export type PriceBookFieldPolicy = {
	businessContact?: FieldPolicy<any> | FieldReadFunction<any>,
	businessContactId?: FieldPolicy<any> | FieldReadFunction<any>,
	comments?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	createdByUser?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	isDefault?: FieldPolicy<any> | FieldReadFunction<any>,
	listPrices?: FieldPolicy<any> | FieldReadFunction<any>,
	location?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	notes?: FieldPolicy<any> | FieldReadFunction<any>,
	parentPriceBook?: FieldPolicy<any> | FieldReadFunction<any>,
	parentPriceBookId?: FieldPolicy<any> | FieldReadFunction<any>,
	parentPriceBookPercentageFactor?: FieldPolicy<any> | FieldReadFunction<any>,
	project?: FieldPolicy<any> | FieldReadFunction<any>,
	projectId?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedBy?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedByUser?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ProjectKeySpecifier = ('associatedPriceBooks' | 'comments' | 'created_at' | 'created_by' | 'created_by_user' | 'deleted' | 'description' | 'id' | 'name' | 'parent_project' | 'project_code' | 'project_contacts' | 'scope_of_work' | 'status' | 'sub_projects' | 'totalDescendantCount' | 'updated_at' | 'updated_by' | 'updated_by_user' | 'workspaceId' | ProjectKeySpecifier)[];
export type ProjectFieldPolicy = {
	associatedPriceBooks?: FieldPolicy<any> | FieldReadFunction<any>,
	comments?: FieldPolicy<any> | FieldReadFunction<any>,
	created_at?: FieldPolicy<any> | FieldReadFunction<any>,
	created_by?: FieldPolicy<any> | FieldReadFunction<any>,
	created_by_user?: FieldPolicy<any> | FieldReadFunction<any>,
	deleted?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	parent_project?: FieldPolicy<any> | FieldReadFunction<any>,
	project_code?: FieldPolicy<any> | FieldReadFunction<any>,
	project_contacts?: FieldPolicy<any> | FieldReadFunction<any>,
	scope_of_work?: FieldPolicy<any> | FieldReadFunction<any>,
	status?: FieldPolicy<any> | FieldReadFunction<any>,
	sub_projects?: FieldPolicy<any> | FieldReadFunction<any>,
	totalDescendantCount?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_at?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_by?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_by_user?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ProjectContactKeySpecifier = ('contact' | 'contact_id' | 'relation_to_project' | ProjectContactKeySpecifier)[];
export type ProjectContactFieldPolicy = {
	contact?: FieldPolicy<any> | FieldReadFunction<any>,
	contact_id?: FieldPolicy<any> | FieldReadFunction<any>,
	relation_to_project?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ProjectContactRelationCodeKeySpecifier = ('code' | 'description' | ProjectContactRelationCodeKeySpecifier)[];
export type ProjectContactRelationCodeFieldPolicy = {
	code?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ProjectStatusCodeKeySpecifier = ('code' | 'description' | ProjectStatusCodeKeySpecifier)[];
export type ProjectStatusCodeFieldPolicy = {
	code?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>
};
export type PurchaseOrderKeySpecifier = ('comments' | 'company_id' | 'created_at' | 'created_by' | 'created_by_user' | 'deleted_at' | 'fulfillmentProgress' | 'id' | 'intakeFormSubmission' | 'inventory' | 'line_items' | 'pricing' | 'project' | 'project_id' | 'purchase_order_number' | 'quote_id' | 'quote_revision_id' | 'seller' | 'seller_id' | 'status' | 'updated_at' | 'updated_by' | 'updated_by_user' | 'workspace_id' | PurchaseOrderKeySpecifier)[];
export type PurchaseOrderFieldPolicy = {
	comments?: FieldPolicy<any> | FieldReadFunction<any>,
	company_id?: FieldPolicy<any> | FieldReadFunction<any>,
	created_at?: FieldPolicy<any> | FieldReadFunction<any>,
	created_by?: FieldPolicy<any> | FieldReadFunction<any>,
	created_by_user?: FieldPolicy<any> | FieldReadFunction<any>,
	deleted_at?: FieldPolicy<any> | FieldReadFunction<any>,
	fulfillmentProgress?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	intakeFormSubmission?: FieldPolicy<any> | FieldReadFunction<any>,
	inventory?: FieldPolicy<any> | FieldReadFunction<any>,
	line_items?: FieldPolicy<any> | FieldReadFunction<any>,
	pricing?: FieldPolicy<any> | FieldReadFunction<any>,
	project?: FieldPolicy<any> | FieldReadFunction<any>,
	project_id?: FieldPolicy<any> | FieldReadFunction<any>,
	purchase_order_number?: FieldPolicy<any> | FieldReadFunction<any>,
	quote_id?: FieldPolicy<any> | FieldReadFunction<any>,
	quote_revision_id?: FieldPolicy<any> | FieldReadFunction<any>,
	seller?: FieldPolicy<any> | FieldReadFunction<any>,
	seller_id?: FieldPolicy<any> | FieldReadFunction<any>,
	status?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_at?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_by?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_by_user?: FieldPolicy<any> | FieldReadFunction<any>,
	workspace_id?: FieldPolicy<any> | FieldReadFunction<any>
};
export type PurchaseOrderFulfillmentProgressKeySpecifier = ('fulfillmentPercentage' | 'isFullyFulfilled' | 'isPartiallyFulfilled' | 'onOrderItems' | 'receivedItems' | 'status' | 'totalItems' | PurchaseOrderFulfillmentProgressKeySpecifier)[];
export type PurchaseOrderFulfillmentProgressFieldPolicy = {
	fulfillmentPercentage?: FieldPolicy<any> | FieldReadFunction<any>,
	isFullyFulfilled?: FieldPolicy<any> | FieldReadFunction<any>,
	isPartiallyFulfilled?: FieldPolicy<any> | FieldReadFunction<any>,
	onOrderItems?: FieldPolicy<any> | FieldReadFunction<any>,
	receivedItems?: FieldPolicy<any> | FieldReadFunction<any>,
	status?: FieldPolicy<any> | FieldReadFunction<any>,
	totalItems?: FieldPolicy<any> | FieldReadFunction<any>
};
export type PurchaseOrderLineItemPriceEstimateKeySpecifier = ('costInCents' | 'delivery_cost_in_cents' | 'details' | 'forecast' | 'rentalPeriod' | 'savingsComparedToDayRateInCents' | 'savingsComparedToDayRateInFraction' | 'savingsComparedToExactSplitInCents' | 'strategy' | 'total_including_delivery_in_cents' | PurchaseOrderLineItemPriceEstimateKeySpecifier)[];
export type PurchaseOrderLineItemPriceEstimateFieldPolicy = {
	costInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	delivery_cost_in_cents?: FieldPolicy<any> | FieldReadFunction<any>,
	details?: FieldPolicy<any> | FieldReadFunction<any>,
	forecast?: FieldPolicy<any> | FieldReadFunction<any>,
	rentalPeriod?: FieldPolicy<any> | FieldReadFunction<any>,
	savingsComparedToDayRateInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	savingsComparedToDayRateInFraction?: FieldPolicy<any> | FieldReadFunction<any>,
	savingsComparedToExactSplitInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	strategy?: FieldPolicy<any> | FieldReadFunction<any>,
	total_including_delivery_in_cents?: FieldPolicy<any> | FieldReadFunction<any>
};
export type PurchaseOrderListResultKeySpecifier = ('items' | 'limit' | 'offset' | 'total' | PurchaseOrderListResultKeySpecifier)[];
export type PurchaseOrderListResultFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	limit?: FieldPolicy<any> | FieldReadFunction<any>,
	offset?: FieldPolicy<any> | FieldReadFunction<any>,
	total?: FieldPolicy<any> | FieldReadFunction<any>
};
export type PurchaseOrderPricingKeySpecifier = ('sub_total_in_cents' | 'total_in_cents' | PurchaseOrderPricingKeySpecifier)[];
export type PurchaseOrderPricingFieldPolicy = {
	sub_total_in_cents?: FieldPolicy<any> | FieldReadFunction<any>,
	total_in_cents?: FieldPolicy<any> | FieldReadFunction<any>
};
export type QueryKeySpecifier = ('admin' | 'bulkCalculateSubTotal' | 'calculateSubTotal' | 'getBrandByDomain' | 'getBrandById' | 'getBrandsByIds' | 'getBulkSearchDocumentsById' | 'getContactById' | 'getCurrentSequenceNumber' | 'getCurrentUser' | 'getDefaultTemplates' | 'getFulfilmentById' | 'getIntakeFormById' | 'getIntakeFormSubmissionById' | 'getIntakeFormSubmissionByPurchaseOrderId' | 'getIntakeFormSubmissionBySalesOrderId' | 'getIntakeFormSubmissionLineItem' | 'getInventoryReservationById' | 'getNoteById' | 'getPimCategoryById' | 'getPimProductById' | 'getPriceBookById' | 'getPriceById' | 'getProjectById' | 'getPurchaseOrderById' | 'getPurchaseOrderLineItemById' | 'getReferenceNumberTemplate' | 'getResourceMapEntry' | 'getSalesOrderById' | 'getSalesOrderLineItemById' | 'getSearchDocumentByDocumentId' | 'getSearchDocumentById' | 'getSearchUserState' | 'getSignedUploadUrl' | 'getUsersById' | 'getWorkflowConfigurationById' | 'getWorkspaceById' | 'helloWorld' | 'inventoryById' | 'invoiceById' | 'listAssetSchedules' | 'listAssets' | 'listCharges' | 'listContacts' | 'listFilesByEntityId' | 'listFulfilments' | 'listIntakeFormSubmissionLineItems' | 'listIntakeFormSubmissions' | 'listIntakeFormSubmissionsAsBuyer' | 'listIntakeForms' | 'listIntakeFormsForUser' | 'listInventory' | 'listInventoryGroupedByPimCategoryId' | 'listInventoryReservations' | 'listInvoices' | 'listJoinableWorkspaces' | 'listMyOrphanedSubmissions' | 'listNotesByEntityId' | 'listPimCategories' | 'listPimProducts' | 'listPriceBookCategories' | 'listPriceBooks' | 'listPriceNames' | 'listPrices' | 'listProjectContactRelationCodes' | 'listProjectStatusCodes' | 'listProjects' | 'listProjectsByParentProjectId' | 'listPurchaseOrders' | 'listQuotes' | 'listRFQs' | 'listReferenceNumberTemplates' | 'listRentalFulfilments' | 'listRentalViews' | 'listResourceMapEntries' | 'listResourceMapEntriesByParentId' | 'listResourceMapEntriesByTagType' | 'listSalesOrders' | 'listScopeOfWorkCodes' | 'listTopLevelProjects' | 'listTransactions' | 'listUserResourcePermissions' | 'listWorkflowConfigurations' | 'listWorkspaceMembers' | 'listWorkspaces' | 'llm' | 'quoteById' | 'quoteRevisionById' | 'rfqById' | 'searchBrands' | 'searchDocuments' | 'usersSearch' | 'validEnterpriseDomain' | QueryKeySpecifier)[];
export type QueryFieldPolicy = {
	admin?: FieldPolicy<any> | FieldReadFunction<any>,
	bulkCalculateSubTotal?: FieldPolicy<any> | FieldReadFunction<any>,
	calculateSubTotal?: FieldPolicy<any> | FieldReadFunction<any>,
	getBrandByDomain?: FieldPolicy<any> | FieldReadFunction<any>,
	getBrandById?: FieldPolicy<any> | FieldReadFunction<any>,
	getBrandsByIds?: FieldPolicy<any> | FieldReadFunction<any>,
	getBulkSearchDocumentsById?: FieldPolicy<any> | FieldReadFunction<any>,
	getContactById?: FieldPolicy<any> | FieldReadFunction<any>,
	getCurrentSequenceNumber?: FieldPolicy<any> | FieldReadFunction<any>,
	getCurrentUser?: FieldPolicy<any> | FieldReadFunction<any>,
	getDefaultTemplates?: FieldPolicy<any> | FieldReadFunction<any>,
	getFulfilmentById?: FieldPolicy<any> | FieldReadFunction<any>,
	getIntakeFormById?: FieldPolicy<any> | FieldReadFunction<any>,
	getIntakeFormSubmissionById?: FieldPolicy<any> | FieldReadFunction<any>,
	getIntakeFormSubmissionByPurchaseOrderId?: FieldPolicy<any> | FieldReadFunction<any>,
	getIntakeFormSubmissionBySalesOrderId?: FieldPolicy<any> | FieldReadFunction<any>,
	getIntakeFormSubmissionLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	getInventoryReservationById?: FieldPolicy<any> | FieldReadFunction<any>,
	getNoteById?: FieldPolicy<any> | FieldReadFunction<any>,
	getPimCategoryById?: FieldPolicy<any> | FieldReadFunction<any>,
	getPimProductById?: FieldPolicy<any> | FieldReadFunction<any>,
	getPriceBookById?: FieldPolicy<any> | FieldReadFunction<any>,
	getPriceById?: FieldPolicy<any> | FieldReadFunction<any>,
	getProjectById?: FieldPolicy<any> | FieldReadFunction<any>,
	getPurchaseOrderById?: FieldPolicy<any> | FieldReadFunction<any>,
	getPurchaseOrderLineItemById?: FieldPolicy<any> | FieldReadFunction<any>,
	getReferenceNumberTemplate?: FieldPolicy<any> | FieldReadFunction<any>,
	getResourceMapEntry?: FieldPolicy<any> | FieldReadFunction<any>,
	getSalesOrderById?: FieldPolicy<any> | FieldReadFunction<any>,
	getSalesOrderLineItemById?: FieldPolicy<any> | FieldReadFunction<any>,
	getSearchDocumentByDocumentId?: FieldPolicy<any> | FieldReadFunction<any>,
	getSearchDocumentById?: FieldPolicy<any> | FieldReadFunction<any>,
	getSearchUserState?: FieldPolicy<any> | FieldReadFunction<any>,
	getSignedUploadUrl?: FieldPolicy<any> | FieldReadFunction<any>,
	getUsersById?: FieldPolicy<any> | FieldReadFunction<any>,
	getWorkflowConfigurationById?: FieldPolicy<any> | FieldReadFunction<any>,
	getWorkspaceById?: FieldPolicy<any> | FieldReadFunction<any>,
	helloWorld?: FieldPolicy<any> | FieldReadFunction<any>,
	inventoryById?: FieldPolicy<any> | FieldReadFunction<any>,
	invoiceById?: FieldPolicy<any> | FieldReadFunction<any>,
	listAssetSchedules?: FieldPolicy<any> | FieldReadFunction<any>,
	listAssets?: FieldPolicy<any> | FieldReadFunction<any>,
	listCharges?: FieldPolicy<any> | FieldReadFunction<any>,
	listContacts?: FieldPolicy<any> | FieldReadFunction<any>,
	listFilesByEntityId?: FieldPolicy<any> | FieldReadFunction<any>,
	listFulfilments?: FieldPolicy<any> | FieldReadFunction<any>,
	listIntakeFormSubmissionLineItems?: FieldPolicy<any> | FieldReadFunction<any>,
	listIntakeFormSubmissions?: FieldPolicy<any> | FieldReadFunction<any>,
	listIntakeFormSubmissionsAsBuyer?: FieldPolicy<any> | FieldReadFunction<any>,
	listIntakeForms?: FieldPolicy<any> | FieldReadFunction<any>,
	listIntakeFormsForUser?: FieldPolicy<any> | FieldReadFunction<any>,
	listInventory?: FieldPolicy<any> | FieldReadFunction<any>,
	listInventoryGroupedByPimCategoryId?: FieldPolicy<any> | FieldReadFunction<any>,
	listInventoryReservations?: FieldPolicy<any> | FieldReadFunction<any>,
	listInvoices?: FieldPolicy<any> | FieldReadFunction<any>,
	listJoinableWorkspaces?: FieldPolicy<any> | FieldReadFunction<any>,
	listMyOrphanedSubmissions?: FieldPolicy<any> | FieldReadFunction<any>,
	listNotesByEntityId?: FieldPolicy<any> | FieldReadFunction<any>,
	listPimCategories?: FieldPolicy<any> | FieldReadFunction<any>,
	listPimProducts?: FieldPolicy<any> | FieldReadFunction<any>,
	listPriceBookCategories?: FieldPolicy<any> | FieldReadFunction<any>,
	listPriceBooks?: FieldPolicy<any> | FieldReadFunction<any>,
	listPriceNames?: FieldPolicy<any> | FieldReadFunction<any>,
	listPrices?: FieldPolicy<any> | FieldReadFunction<any>,
	listProjectContactRelationCodes?: FieldPolicy<any> | FieldReadFunction<any>,
	listProjectStatusCodes?: FieldPolicy<any> | FieldReadFunction<any>,
	listProjects?: FieldPolicy<any> | FieldReadFunction<any>,
	listProjectsByParentProjectId?: FieldPolicy<any> | FieldReadFunction<any>,
	listPurchaseOrders?: FieldPolicy<any> | FieldReadFunction<any>,
	listQuotes?: FieldPolicy<any> | FieldReadFunction<any>,
	listRFQs?: FieldPolicy<any> | FieldReadFunction<any>,
	listReferenceNumberTemplates?: FieldPolicy<any> | FieldReadFunction<any>,
	listRentalFulfilments?: FieldPolicy<any> | FieldReadFunction<any>,
	listRentalViews?: FieldPolicy<any> | FieldReadFunction<any>,
	listResourceMapEntries?: FieldPolicy<any> | FieldReadFunction<any>,
	listResourceMapEntriesByParentId?: FieldPolicy<any> | FieldReadFunction<any>,
	listResourceMapEntriesByTagType?: FieldPolicy<any> | FieldReadFunction<any>,
	listSalesOrders?: FieldPolicy<any> | FieldReadFunction<any>,
	listScopeOfWorkCodes?: FieldPolicy<any> | FieldReadFunction<any>,
	listTopLevelProjects?: FieldPolicy<any> | FieldReadFunction<any>,
	listTransactions?: FieldPolicy<any> | FieldReadFunction<any>,
	listUserResourcePermissions?: FieldPolicy<any> | FieldReadFunction<any>,
	listWorkflowConfigurations?: FieldPolicy<any> | FieldReadFunction<any>,
	listWorkspaceMembers?: FieldPolicy<any> | FieldReadFunction<any>,
	listWorkspaces?: FieldPolicy<any> | FieldReadFunction<any>,
	llm?: FieldPolicy<any> | FieldReadFunction<any>,
	quoteById?: FieldPolicy<any> | FieldReadFunction<any>,
	quoteRevisionById?: FieldPolicy<any> | FieldReadFunction<any>,
	rfqById?: FieldPolicy<any> | FieldReadFunction<any>,
	searchBrands?: FieldPolicy<any> | FieldReadFunction<any>,
	searchDocuments?: FieldPolicy<any> | FieldReadFunction<any>,
	usersSearch?: FieldPolicy<any> | FieldReadFunction<any>,
	validEnterpriseDomain?: FieldPolicy<any> | FieldReadFunction<any>
};
export type QuoteKeySpecifier = ('buyerAcceptedFullLegalName' | 'buyerUserId' | 'buyerWorkspaceId' | 'buyersProject' | 'buyersProjectId' | 'buyersSellerContact' | 'buyersSellerContactId' | 'createdAt' | 'createdBy' | 'createdByUser' | 'currentRevision' | 'currentRevisionId' | 'id' | 'intakeFormSubmission' | 'intakeFormSubmissionId' | 'rfqId' | 'sellerWorkspaceId' | 'sellersBuyerContact' | 'sellersBuyerContactId' | 'sellersProject' | 'sellersProjectId' | 'signatureUrl' | 'status' | 'updatedAt' | 'updatedBy' | 'updatedByUser' | 'validUntil' | QuoteKeySpecifier)[];
export type QuoteFieldPolicy = {
	buyerAcceptedFullLegalName?: FieldPolicy<any> | FieldReadFunction<any>,
	buyerUserId?: FieldPolicy<any> | FieldReadFunction<any>,
	buyerWorkspaceId?: FieldPolicy<any> | FieldReadFunction<any>,
	buyersProject?: FieldPolicy<any> | FieldReadFunction<any>,
	buyersProjectId?: FieldPolicy<any> | FieldReadFunction<any>,
	buyersSellerContact?: FieldPolicy<any> | FieldReadFunction<any>,
	buyersSellerContactId?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	createdByUser?: FieldPolicy<any> | FieldReadFunction<any>,
	currentRevision?: FieldPolicy<any> | FieldReadFunction<any>,
	currentRevisionId?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	intakeFormSubmission?: FieldPolicy<any> | FieldReadFunction<any>,
	intakeFormSubmissionId?: FieldPolicy<any> | FieldReadFunction<any>,
	rfqId?: FieldPolicy<any> | FieldReadFunction<any>,
	sellerWorkspaceId?: FieldPolicy<any> | FieldReadFunction<any>,
	sellersBuyerContact?: FieldPolicy<any> | FieldReadFunction<any>,
	sellersBuyerContactId?: FieldPolicy<any> | FieldReadFunction<any>,
	sellersProject?: FieldPolicy<any> | FieldReadFunction<any>,
	sellersProjectId?: FieldPolicy<any> | FieldReadFunction<any>,
	signatureUrl?: FieldPolicy<any> | FieldReadFunction<any>,
	status?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedBy?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedByUser?: FieldPolicy<any> | FieldReadFunction<any>,
	validUntil?: FieldPolicy<any> | FieldReadFunction<any>
};
export type QuoteRevisionKeySpecifier = ('createdAt' | 'createdBy' | 'createdByUser' | 'hasUnpricedLineItems' | 'id' | 'lineItems' | 'quoteId' | 'revisionNumber' | 'status' | 'updatedAt' | 'updatedBy' | 'updatedByUser' | 'validUntil' | QuoteRevisionKeySpecifier)[];
export type QuoteRevisionFieldPolicy = {
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	createdByUser?: FieldPolicy<any> | FieldReadFunction<any>,
	hasUnpricedLineItems?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	lineItems?: FieldPolicy<any> | FieldReadFunction<any>,
	quoteId?: FieldPolicy<any> | FieldReadFunction<any>,
	revisionNumber?: FieldPolicy<any> | FieldReadFunction<any>,
	status?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedBy?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedByUser?: FieldPolicy<any> | FieldReadFunction<any>,
	validUntil?: FieldPolicy<any> | FieldReadFunction<any>
};
export type QuoteRevisionRentalLineItemKeySpecifier = ('deliveryLocation' | 'deliveryMethod' | 'deliveryNotes' | 'description' | 'id' | 'intakeFormSubmissionLineItem' | 'intakeFormSubmissionLineItemId' | 'pimCategory' | 'pimCategoryId' | 'price' | 'quantity' | 'rentalEndDate' | 'rentalStartDate' | 'sellersPriceId' | 'subtotalInCents' | 'type' | QuoteRevisionRentalLineItemKeySpecifier)[];
export type QuoteRevisionRentalLineItemFieldPolicy = {
	deliveryLocation?: FieldPolicy<any> | FieldReadFunction<any>,
	deliveryMethod?: FieldPolicy<any> | FieldReadFunction<any>,
	deliveryNotes?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	intakeFormSubmissionLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	intakeFormSubmissionLineItemId?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategory?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryId?: FieldPolicy<any> | FieldReadFunction<any>,
	price?: FieldPolicy<any> | FieldReadFunction<any>,
	quantity?: FieldPolicy<any> | FieldReadFunction<any>,
	rentalEndDate?: FieldPolicy<any> | FieldReadFunction<any>,
	rentalStartDate?: FieldPolicy<any> | FieldReadFunction<any>,
	sellersPriceId?: FieldPolicy<any> | FieldReadFunction<any>,
	subtotalInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>
};
export type QuoteRevisionSaleLineItemKeySpecifier = ('deliveryLocation' | 'deliveryMethod' | 'deliveryNotes' | 'description' | 'id' | 'intakeFormSubmissionLineItem' | 'intakeFormSubmissionLineItemId' | 'pimCategory' | 'pimCategoryId' | 'price' | 'quantity' | 'sellersPriceId' | 'subtotalInCents' | 'type' | QuoteRevisionSaleLineItemKeySpecifier)[];
export type QuoteRevisionSaleLineItemFieldPolicy = {
	deliveryLocation?: FieldPolicy<any> | FieldReadFunction<any>,
	deliveryMethod?: FieldPolicy<any> | FieldReadFunction<any>,
	deliveryNotes?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	intakeFormSubmissionLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	intakeFormSubmissionLineItemId?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategory?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryId?: FieldPolicy<any> | FieldReadFunction<any>,
	price?: FieldPolicy<any> | FieldReadFunction<any>,
	quantity?: FieldPolicy<any> | FieldReadFunction<any>,
	sellersPriceId?: FieldPolicy<any> | FieldReadFunction<any>,
	subtotalInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>
};
export type QuoteRevisionServiceLineItemKeySpecifier = ('deliveryLocation' | 'deliveryMethod' | 'deliveryNotes' | 'description' | 'id' | 'intakeFormSubmissionLineItem' | 'intakeFormSubmissionLineItemId' | 'price' | 'quantity' | 'sellersPriceId' | 'subtotalInCents' | 'type' | QuoteRevisionServiceLineItemKeySpecifier)[];
export type QuoteRevisionServiceLineItemFieldPolicy = {
	deliveryLocation?: FieldPolicy<any> | FieldReadFunction<any>,
	deliveryMethod?: FieldPolicy<any> | FieldReadFunction<any>,
	deliveryNotes?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	intakeFormSubmissionLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	intakeFormSubmissionLineItemId?: FieldPolicy<any> | FieldReadFunction<any>,
	price?: FieldPolicy<any> | FieldReadFunction<any>,
	quantity?: FieldPolicy<any> | FieldReadFunction<any>,
	sellersPriceId?: FieldPolicy<any> | FieldReadFunction<any>,
	subtotalInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>
};
export type QuotesResponseKeySpecifier = ('items' | QuotesResponseKeySpecifier)[];
export type QuotesResponseFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RFQKeySpecifier = ('buyersWorkspaceId' | 'createdAt' | 'createdBy' | 'createdByUser' | 'description' | 'id' | 'invitedSellerContactIds' | 'invitedSellerContacts' | 'lineItems' | 'responseDeadline' | 'status' | 'updatedAt' | 'updatedBy' | 'updatedByUser' | RFQKeySpecifier)[];
export type RFQFieldPolicy = {
	buyersWorkspaceId?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	createdByUser?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	invitedSellerContactIds?: FieldPolicy<any> | FieldReadFunction<any>,
	invitedSellerContacts?: FieldPolicy<any> | FieldReadFunction<any>,
	lineItems?: FieldPolicy<any> | FieldReadFunction<any>,
	responseDeadline?: FieldPolicy<any> | FieldReadFunction<any>,
	status?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedBy?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedByUser?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RFQRentalLineItemKeySpecifier = ('description' | 'id' | 'pimCategory' | 'pimCategoryId' | 'quantity' | 'rentalEndDate' | 'rentalStartDate' | 'type' | RFQRentalLineItemKeySpecifier)[];
export type RFQRentalLineItemFieldPolicy = {
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategory?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryId?: FieldPolicy<any> | FieldReadFunction<any>,
	quantity?: FieldPolicy<any> | FieldReadFunction<any>,
	rentalEndDate?: FieldPolicy<any> | FieldReadFunction<any>,
	rentalStartDate?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RFQSaleLineItemKeySpecifier = ('description' | 'id' | 'pimCategory' | 'pimCategoryId' | 'quantity' | 'type' | RFQSaleLineItemKeySpecifier)[];
export type RFQSaleLineItemFieldPolicy = {
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategory?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryId?: FieldPolicy<any> | FieldReadFunction<any>,
	quantity?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RFQServiceLineItemKeySpecifier = ('description' | 'id' | 'quantity' | 'type' | RFQServiceLineItemKeySpecifier)[];
export type RFQServiceLineItemFieldPolicy = {
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	quantity?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ReferenceNumberTemplateKeySpecifier = ('businessContact' | 'businessContactId' | 'companyId' | 'createdAt' | 'createdBy' | 'createdByUser' | 'deleted' | 'id' | 'project' | 'projectId' | 'resetFrequency' | 'seqPadding' | 'startAt' | 'template' | 'type' | 'updatedAt' | 'updatedBy' | 'updatedByUser' | 'useGlobalSequence' | 'workspaceId' | ReferenceNumberTemplateKeySpecifier)[];
export type ReferenceNumberTemplateFieldPolicy = {
	businessContact?: FieldPolicy<any> | FieldReadFunction<any>,
	businessContactId?: FieldPolicy<any> | FieldReadFunction<any>,
	companyId?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	createdByUser?: FieldPolicy<any> | FieldReadFunction<any>,
	deleted?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	project?: FieldPolicy<any> | FieldReadFunction<any>,
	projectId?: FieldPolicy<any> | FieldReadFunction<any>,
	resetFrequency?: FieldPolicy<any> | FieldReadFunction<any>,
	seqPadding?: FieldPolicy<any> | FieldReadFunction<any>,
	startAt?: FieldPolicy<any> | FieldReadFunction<any>,
	template?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedBy?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedByUser?: FieldPolicy<any> | FieldReadFunction<any>,
	useGlobalSequence?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalFulfilmentKeySpecifier = ('assignedTo' | 'assignedToId' | 'companyId' | 'contact' | 'contactId' | 'createdAt' | 'expectedRentalEndDate' | 'id' | 'inventory' | 'inventoryId' | 'lastChargedAt' | 'pimCategory' | 'pimCategoryId' | 'pimCategoryName' | 'pimCategoryPath' | 'pimProduct' | 'pimProductId' | 'price' | 'priceId' | 'priceName' | 'pricePerDayInCents' | 'pricePerMonthInCents' | 'pricePerWeekInCents' | 'project' | 'projectId' | 'purchaseOrderLineItem' | 'purchaseOrderLineItemId' | 'purchaseOrderNumber' | 'rentalEndDate' | 'rentalStartDate' | 'salesOrder' | 'salesOrderId' | 'salesOrderLineItem' | 'salesOrderLineItemId' | 'salesOrderPONumber' | 'salesOrderType' | 'updatedAt' | 'workflowColumnId' | 'workflowId' | 'workspaceId' | RentalFulfilmentKeySpecifier)[];
export type RentalFulfilmentFieldPolicy = {
	assignedTo?: FieldPolicy<any> | FieldReadFunction<any>,
	assignedToId?: FieldPolicy<any> | FieldReadFunction<any>,
	companyId?: FieldPolicy<any> | FieldReadFunction<any>,
	contact?: FieldPolicy<any> | FieldReadFunction<any>,
	contactId?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	expectedRentalEndDate?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	inventory?: FieldPolicy<any> | FieldReadFunction<any>,
	inventoryId?: FieldPolicy<any> | FieldReadFunction<any>,
	lastChargedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategory?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryId?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryName?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryPath?: FieldPolicy<any> | FieldReadFunction<any>,
	pimProduct?: FieldPolicy<any> | FieldReadFunction<any>,
	pimProductId?: FieldPolicy<any> | FieldReadFunction<any>,
	price?: FieldPolicy<any> | FieldReadFunction<any>,
	priceId?: FieldPolicy<any> | FieldReadFunction<any>,
	priceName?: FieldPolicy<any> | FieldReadFunction<any>,
	pricePerDayInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	pricePerMonthInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	pricePerWeekInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	project?: FieldPolicy<any> | FieldReadFunction<any>,
	projectId?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrderLineItemId?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrderNumber?: FieldPolicy<any> | FieldReadFunction<any>,
	rentalEndDate?: FieldPolicy<any> | FieldReadFunction<any>,
	rentalStartDate?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrder?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderId?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderLineItemId?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderPONumber?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderType?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	workflowColumnId?: FieldPolicy<any> | FieldReadFunction<any>,
	workflowId?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalMaterializedViewKeySpecifier = ('asset' | 'details' | 'order' | 'rentalId' | 'status' | RentalMaterializedViewKeySpecifier)[];
export type RentalMaterializedViewFieldPolicy = {
	asset?: FieldPolicy<any> | FieldReadFunction<any>,
	details?: FieldPolicy<any> | FieldReadFunction<any>,
	order?: FieldPolicy<any> | FieldReadFunction<any>,
	rentalId?: FieldPolicy<any> | FieldReadFunction<any>,
	status?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalPriceKeySpecifier = ('calculateSubTotal' | 'createdAt' | 'createdBy' | 'id' | 'name' | 'parentPrice' | 'parentPriceId' | 'parentPriceIdPercentageFactor' | 'pimCategory' | 'pimCategoryId' | 'pimCategoryName' | 'pimCategoryPath' | 'pimProduct' | 'pimProductId' | 'priceBook' | 'priceBookId' | 'pricePerDayInCents' | 'pricePerMonthInCents' | 'pricePerWeekInCents' | 'priceType' | 'updatedAt' | 'workspaceId' | RentalPriceKeySpecifier)[];
export type RentalPriceFieldPolicy = {
	calculateSubTotal?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	parentPrice?: FieldPolicy<any> | FieldReadFunction<any>,
	parentPriceId?: FieldPolicy<any> | FieldReadFunction<any>,
	parentPriceIdPercentageFactor?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategory?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryId?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryName?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryPath?: FieldPolicy<any> | FieldReadFunction<any>,
	pimProduct?: FieldPolicy<any> | FieldReadFunction<any>,
	pimProductId?: FieldPolicy<any> | FieldReadFunction<any>,
	priceBook?: FieldPolicy<any> | FieldReadFunction<any>,
	priceBookId?: FieldPolicy<any> | FieldReadFunction<any>,
	pricePerDayInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	pricePerMonthInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	pricePerWeekInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	priceType?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalPurchaseOrderLineItemKeySpecifier = ('calulate_price' | 'company_id' | 'created_at' | 'created_by' | 'created_by_user' | 'deleted_at' | 'deliveryNotes' | 'delivery_charge_in_cents' | 'delivery_date' | 'delivery_location' | 'delivery_method' | 'id' | 'inventory' | 'lineitem_status' | 'lineitem_type' | 'off_rent_date' | 'po_pim_id' | 'po_quantity' | 'price' | 'price_id' | 'purchaseOrder' | 'purchase_order_id' | 'quote_revision_line_item_id' | 'so_pim_category' | 'so_pim_product' | 'totalDaysOnRent' | 'updated_at' | 'updated_by' | 'updated_by_user' | RentalPurchaseOrderLineItemKeySpecifier)[];
export type RentalPurchaseOrderLineItemFieldPolicy = {
	calulate_price?: FieldPolicy<any> | FieldReadFunction<any>,
	company_id?: FieldPolicy<any> | FieldReadFunction<any>,
	created_at?: FieldPolicy<any> | FieldReadFunction<any>,
	created_by?: FieldPolicy<any> | FieldReadFunction<any>,
	created_by_user?: FieldPolicy<any> | FieldReadFunction<any>,
	deleted_at?: FieldPolicy<any> | FieldReadFunction<any>,
	deliveryNotes?: FieldPolicy<any> | FieldReadFunction<any>,
	delivery_charge_in_cents?: FieldPolicy<any> | FieldReadFunction<any>,
	delivery_date?: FieldPolicy<any> | FieldReadFunction<any>,
	delivery_location?: FieldPolicy<any> | FieldReadFunction<any>,
	delivery_method?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	inventory?: FieldPolicy<any> | FieldReadFunction<any>,
	lineitem_status?: FieldPolicy<any> | FieldReadFunction<any>,
	lineitem_type?: FieldPolicy<any> | FieldReadFunction<any>,
	off_rent_date?: FieldPolicy<any> | FieldReadFunction<any>,
	po_pim_id?: FieldPolicy<any> | FieldReadFunction<any>,
	po_quantity?: FieldPolicy<any> | FieldReadFunction<any>,
	price?: FieldPolicy<any> | FieldReadFunction<any>,
	price_id?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrder?: FieldPolicy<any> | FieldReadFunction<any>,
	purchase_order_id?: FieldPolicy<any> | FieldReadFunction<any>,
	quote_revision_line_item_id?: FieldPolicy<any> | FieldReadFunction<any>,
	so_pim_category?: FieldPolicy<any> | FieldReadFunction<any>,
	so_pim_product?: FieldPolicy<any> | FieldReadFunction<any>,
	totalDaysOnRent?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_at?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_by?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_by_user?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalSalesOrderLineItemKeySpecifier = ('calulate_price' | 'company_id' | 'created_at' | 'created_by' | 'created_by_user' | 'deleted_at' | 'deliveryNotes' | 'delivery_charge_in_cents' | 'delivery_date' | 'delivery_location' | 'delivery_method' | 'id' | 'intakeFormSubmissionLineItem' | 'intake_form_submission_line_item_id' | 'lineitem_status' | 'lineitem_type' | 'off_rent_date' | 'price' | 'price_id' | 'quote_revision_line_item_id' | 'sales_order_id' | 'so_pim_category' | 'so_pim_id' | 'so_pim_product' | 'so_quantity' | 'totalDaysOnRent' | 'updated_at' | 'updated_by' | 'updated_by_user' | RentalSalesOrderLineItemKeySpecifier)[];
export type RentalSalesOrderLineItemFieldPolicy = {
	calulate_price?: FieldPolicy<any> | FieldReadFunction<any>,
	company_id?: FieldPolicy<any> | FieldReadFunction<any>,
	created_at?: FieldPolicy<any> | FieldReadFunction<any>,
	created_by?: FieldPolicy<any> | FieldReadFunction<any>,
	created_by_user?: FieldPolicy<any> | FieldReadFunction<any>,
	deleted_at?: FieldPolicy<any> | FieldReadFunction<any>,
	deliveryNotes?: FieldPolicy<any> | FieldReadFunction<any>,
	delivery_charge_in_cents?: FieldPolicy<any> | FieldReadFunction<any>,
	delivery_date?: FieldPolicy<any> | FieldReadFunction<any>,
	delivery_location?: FieldPolicy<any> | FieldReadFunction<any>,
	delivery_method?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	intakeFormSubmissionLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	intake_form_submission_line_item_id?: FieldPolicy<any> | FieldReadFunction<any>,
	lineitem_status?: FieldPolicy<any> | FieldReadFunction<any>,
	lineitem_type?: FieldPolicy<any> | FieldReadFunction<any>,
	off_rent_date?: FieldPolicy<any> | FieldReadFunction<any>,
	price?: FieldPolicy<any> | FieldReadFunction<any>,
	price_id?: FieldPolicy<any> | FieldReadFunction<any>,
	quote_revision_line_item_id?: FieldPolicy<any> | FieldReadFunction<any>,
	sales_order_id?: FieldPolicy<any> | FieldReadFunction<any>,
	so_pim_category?: FieldPolicy<any> | FieldReadFunction<any>,
	so_pim_id?: FieldPolicy<any> | FieldReadFunction<any>,
	so_pim_product?: FieldPolicy<any> | FieldReadFunction<any>,
	so_quantity?: FieldPolicy<any> | FieldReadFunction<any>,
	totalDaysOnRent?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_at?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_by?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_by_user?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalTransactionKeySpecifier = ('assetId' | 'comments' | 'createdAt' | 'createdBy' | 'dropOffLocation' | 'endDate' | 'history' | 'id' | 'lastUpdatedBy' | 'notes' | 'pickUpLocation' | 'pimId' | 'pricePerDayInCents' | 'pricePerMonthInCents' | 'pricePerWeekInCents' | 'projectId' | 'startDate' | 'statusId' | 'type' | 'updatedAt' | 'workflowId' | 'workspaceId' | RentalTransactionKeySpecifier)[];
export type RentalTransactionFieldPolicy = {
	assetId?: FieldPolicy<any> | FieldReadFunction<any>,
	comments?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	dropOffLocation?: FieldPolicy<any> | FieldReadFunction<any>,
	endDate?: FieldPolicy<any> | FieldReadFunction<any>,
	history?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	lastUpdatedBy?: FieldPolicy<any> | FieldReadFunction<any>,
	notes?: FieldPolicy<any> | FieldReadFunction<any>,
	pickUpLocation?: FieldPolicy<any> | FieldReadFunction<any>,
	pimId?: FieldPolicy<any> | FieldReadFunction<any>,
	pricePerDayInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	pricePerMonthInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	pricePerWeekInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	projectId?: FieldPolicy<any> | FieldReadFunction<any>,
	startDate?: FieldPolicy<any> | FieldReadFunction<any>,
	statusId?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	workflowId?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalViewAssetKeySpecifier = ('assetId' | 'class' | 'company' | 'details' | 'groups' | 'inventoryBranch' | 'keypad' | 'make' | 'model' | 'mspBranch' | 'photo' | 'rspBranch' | 'tracker' | 'tspCompanies' | 'type' | RentalViewAssetKeySpecifier)[];
export type RentalViewAssetFieldPolicy = {
	assetId?: FieldPolicy<any> | FieldReadFunction<any>,
	class?: FieldPolicy<any> | FieldReadFunction<any>,
	company?: FieldPolicy<any> | FieldReadFunction<any>,
	details?: FieldPolicy<any> | FieldReadFunction<any>,
	groups?: FieldPolicy<any> | FieldReadFunction<any>,
	inventoryBranch?: FieldPolicy<any> | FieldReadFunction<any>,
	keypad?: FieldPolicy<any> | FieldReadFunction<any>,
	make?: FieldPolicy<any> | FieldReadFunction<any>,
	model?: FieldPolicy<any> | FieldReadFunction<any>,
	mspBranch?: FieldPolicy<any> | FieldReadFunction<any>,
	photo?: FieldPolicy<any> | FieldReadFunction<any>,
	rspBranch?: FieldPolicy<any> | FieldReadFunction<any>,
	tracker?: FieldPolicy<any> | FieldReadFunction<any>,
	tspCompanies?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalViewAssetBranchKeySpecifier = ('companyId' | 'companyName' | 'description' | 'id' | 'name' | RentalViewAssetBranchKeySpecifier)[];
export type RentalViewAssetBranchFieldPolicy = {
	companyId?: FieldPolicy<any> | FieldReadFunction<any>,
	companyName?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalViewAssetClassKeySpecifier = ('description' | 'id' | 'name' | RentalViewAssetClassKeySpecifier)[];
export type RentalViewAssetClassFieldPolicy = {
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalViewAssetCompanyKeySpecifier = ('id' | 'name' | RentalViewAssetCompanyKeySpecifier)[];
export type RentalViewAssetCompanyFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalViewAssetDetailsKeySpecifier = ('assetId' | 'cameraId' | 'customName' | 'description' | 'driverName' | 'model' | 'name' | 'photoId' | 'serialNumber' | 'trackerId' | 'vin' | 'year' | RentalViewAssetDetailsKeySpecifier)[];
export type RentalViewAssetDetailsFieldPolicy = {
	assetId?: FieldPolicy<any> | FieldReadFunction<any>,
	cameraId?: FieldPolicy<any> | FieldReadFunction<any>,
	customName?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	driverName?: FieldPolicy<any> | FieldReadFunction<any>,
	model?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	photoId?: FieldPolicy<any> | FieldReadFunction<any>,
	serialNumber?: FieldPolicy<any> | FieldReadFunction<any>,
	trackerId?: FieldPolicy<any> | FieldReadFunction<any>,
	vin?: FieldPolicy<any> | FieldReadFunction<any>,
	year?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalViewAssetGroupKeySpecifier = ('companyId' | 'companyName' | 'id' | 'name' | RentalViewAssetGroupKeySpecifier)[];
export type RentalViewAssetGroupFieldPolicy = {
	companyId?: FieldPolicy<any> | FieldReadFunction<any>,
	companyName?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalViewAssetMakeKeySpecifier = ('id' | 'name' | RentalViewAssetMakeKeySpecifier)[];
export type RentalViewAssetMakeFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalViewAssetModelKeySpecifier = ('id' | 'name' | RentalViewAssetModelKeySpecifier)[];
export type RentalViewAssetModelFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalViewAssetPhotoKeySpecifier = ('filename' | 'photoId' | RentalViewAssetPhotoKeySpecifier)[];
export type RentalViewAssetPhotoFieldPolicy = {
	filename?: FieldPolicy<any> | FieldReadFunction<any>,
	photoId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalViewAssetTrackerKeySpecifier = ('companyId' | 'created' | 'deviceSerial' | 'id' | 'trackerTypeId' | 'updated' | 'vendorId' | RentalViewAssetTrackerKeySpecifier)[];
export type RentalViewAssetTrackerFieldPolicy = {
	companyId?: FieldPolicy<any> | FieldReadFunction<any>,
	created?: FieldPolicy<any> | FieldReadFunction<any>,
	deviceSerial?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	trackerTypeId?: FieldPolicy<any> | FieldReadFunction<any>,
	updated?: FieldPolicy<any> | FieldReadFunction<any>,
	vendorId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalViewAssetTspCompanyKeySpecifier = ('companyId' | 'companyName' | RentalViewAssetTspCompanyKeySpecifier)[];
export type RentalViewAssetTspCompanyFieldPolicy = {
	companyId?: FieldPolicy<any> | FieldReadFunction<any>,
	companyName?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalViewAssetTypeKeySpecifier = ('id' | 'name' | RentalViewAssetTypeKeySpecifier)[];
export type RentalViewAssetTypeFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalViewDetailsKeySpecifier = ('amountReceived' | 'assetId' | 'borrowerUserId' | 'dateCreated' | 'deleted' | 'deliveryCharge' | 'deliveryInstructions' | 'deliveryRequired' | 'dropOffDeliveryId' | 'dropOffDeliveryRequired' | 'endDate' | 'endDateEstimated' | 'equipmentClassId' | 'externalId' | 'hasReRent' | 'inventoryProductId' | 'inventoryProductName' | 'inventoryProductNameHistorical' | 'isBelowFloorRate' | 'isFlatMonthlyRate' | 'isFlexibleRate' | 'jobDescription' | 'lienNoticeSent' | 'offRentDateRequested' | 'oneTimeCharge' | 'orderId' | 'partTypeId' | 'price' | 'pricePerDay' | 'pricePerHour' | 'pricePerMonth' | 'pricePerWeek' | 'purchasePrice' | 'quantity' | 'rateTypeId' | 'rentalId' | 'rentalPricingStructureId' | 'rentalProtectionPlanId' | 'rentalPurchaseOptionId' | 'rentalStatusId' | 'rentalTypeId' | 'returnCharge' | 'returnDeliveryId' | 'returnDeliveryRequired' | 'startDate' | 'startDateEstimated' | 'taxable' | RentalViewDetailsKeySpecifier)[];
export type RentalViewDetailsFieldPolicy = {
	amountReceived?: FieldPolicy<any> | FieldReadFunction<any>,
	assetId?: FieldPolicy<any> | FieldReadFunction<any>,
	borrowerUserId?: FieldPolicy<any> | FieldReadFunction<any>,
	dateCreated?: FieldPolicy<any> | FieldReadFunction<any>,
	deleted?: FieldPolicy<any> | FieldReadFunction<any>,
	deliveryCharge?: FieldPolicy<any> | FieldReadFunction<any>,
	deliveryInstructions?: FieldPolicy<any> | FieldReadFunction<any>,
	deliveryRequired?: FieldPolicy<any> | FieldReadFunction<any>,
	dropOffDeliveryId?: FieldPolicy<any> | FieldReadFunction<any>,
	dropOffDeliveryRequired?: FieldPolicy<any> | FieldReadFunction<any>,
	endDate?: FieldPolicy<any> | FieldReadFunction<any>,
	endDateEstimated?: FieldPolicy<any> | FieldReadFunction<any>,
	equipmentClassId?: FieldPolicy<any> | FieldReadFunction<any>,
	externalId?: FieldPolicy<any> | FieldReadFunction<any>,
	hasReRent?: FieldPolicy<any> | FieldReadFunction<any>,
	inventoryProductId?: FieldPolicy<any> | FieldReadFunction<any>,
	inventoryProductName?: FieldPolicy<any> | FieldReadFunction<any>,
	inventoryProductNameHistorical?: FieldPolicy<any> | FieldReadFunction<any>,
	isBelowFloorRate?: FieldPolicy<any> | FieldReadFunction<any>,
	isFlatMonthlyRate?: FieldPolicy<any> | FieldReadFunction<any>,
	isFlexibleRate?: FieldPolicy<any> | FieldReadFunction<any>,
	jobDescription?: FieldPolicy<any> | FieldReadFunction<any>,
	lienNoticeSent?: FieldPolicy<any> | FieldReadFunction<any>,
	offRentDateRequested?: FieldPolicy<any> | FieldReadFunction<any>,
	oneTimeCharge?: FieldPolicy<any> | FieldReadFunction<any>,
	orderId?: FieldPolicy<any> | FieldReadFunction<any>,
	partTypeId?: FieldPolicy<any> | FieldReadFunction<any>,
	price?: FieldPolicy<any> | FieldReadFunction<any>,
	pricePerDay?: FieldPolicy<any> | FieldReadFunction<any>,
	pricePerHour?: FieldPolicy<any> | FieldReadFunction<any>,
	pricePerMonth?: FieldPolicy<any> | FieldReadFunction<any>,
	pricePerWeek?: FieldPolicy<any> | FieldReadFunction<any>,
	purchasePrice?: FieldPolicy<any> | FieldReadFunction<any>,
	quantity?: FieldPolicy<any> | FieldReadFunction<any>,
	rateTypeId?: FieldPolicy<any> | FieldReadFunction<any>,
	rentalId?: FieldPolicy<any> | FieldReadFunction<any>,
	rentalPricingStructureId?: FieldPolicy<any> | FieldReadFunction<any>,
	rentalProtectionPlanId?: FieldPolicy<any> | FieldReadFunction<any>,
	rentalPurchaseOptionId?: FieldPolicy<any> | FieldReadFunction<any>,
	rentalStatusId?: FieldPolicy<any> | FieldReadFunction<any>,
	rentalTypeId?: FieldPolicy<any> | FieldReadFunction<any>,
	returnCharge?: FieldPolicy<any> | FieldReadFunction<any>,
	returnDeliveryId?: FieldPolicy<any> | FieldReadFunction<any>,
	returnDeliveryRequired?: FieldPolicy<any> | FieldReadFunction<any>,
	startDate?: FieldPolicy<any> | FieldReadFunction<any>,
	startDateEstimated?: FieldPolicy<any> | FieldReadFunction<any>,
	taxable?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalViewOrderKeySpecifier = ('companyId' | 'companyName' | 'dateCreated' | 'dateUpdated' | 'orderId' | 'orderStatusId' | 'orderStatusName' | 'orderedByEmail' | 'orderedByFirstName' | 'orderedByLastName' | 'orderedByUserId' | RentalViewOrderKeySpecifier)[];
export type RentalViewOrderFieldPolicy = {
	companyId?: FieldPolicy<any> | FieldReadFunction<any>,
	companyName?: FieldPolicy<any> | FieldReadFunction<any>,
	dateCreated?: FieldPolicy<any> | FieldReadFunction<any>,
	dateUpdated?: FieldPolicy<any> | FieldReadFunction<any>,
	orderId?: FieldPolicy<any> | FieldReadFunction<any>,
	orderStatusId?: FieldPolicy<any> | FieldReadFunction<any>,
	orderStatusName?: FieldPolicy<any> | FieldReadFunction<any>,
	orderedByEmail?: FieldPolicy<any> | FieldReadFunction<any>,
	orderedByFirstName?: FieldPolicy<any> | FieldReadFunction<any>,
	orderedByLastName?: FieldPolicy<any> | FieldReadFunction<any>,
	orderedByUserId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type RentalViewStatusKeySpecifier = ('id' | 'name' | RentalViewStatusKeySpecifier)[];
export type RentalViewStatusFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ResourceMapResourceKeySpecifier = ('children' | 'hierarchy_id' | 'hierarchy_name' | 'id' | 'parent' | 'parent_id' | 'path' | 'resource_id' | 'tagType' | 'tenant_id' | 'type' | 'value' | ResourceMapResourceKeySpecifier)[];
export type ResourceMapResourceFieldPolicy = {
	children?: FieldPolicy<any> | FieldReadFunction<any>,
	hierarchy_id?: FieldPolicy<any> | FieldReadFunction<any>,
	hierarchy_name?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	parent?: FieldPolicy<any> | FieldReadFunction<any>,
	parent_id?: FieldPolicy<any> | FieldReadFunction<any>,
	path?: FieldPolicy<any> | FieldReadFunction<any>,
	resource_id?: FieldPolicy<any> | FieldReadFunction<any>,
	tagType?: FieldPolicy<any> | FieldReadFunction<any>,
	tenant_id?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>,
	value?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SaleFulfilmentKeySpecifier = ('assignedTo' | 'assignedToId' | 'companyId' | 'contact' | 'contactId' | 'createdAt' | 'id' | 'pimCategory' | 'pimCategoryId' | 'pimCategoryName' | 'pimCategoryPath' | 'pimProduct' | 'pimProductId' | 'price' | 'priceId' | 'priceName' | 'project' | 'projectId' | 'purchaseOrderLineItem' | 'purchaseOrderLineItemId' | 'purchaseOrderNumber' | 'quantity' | 'salePrice' | 'salesOrder' | 'salesOrderId' | 'salesOrderLineItem' | 'salesOrderLineItemId' | 'salesOrderPONumber' | 'salesOrderType' | 'unitCostInCents' | 'updatedAt' | 'workflowColumnId' | 'workflowId' | 'workspaceId' | SaleFulfilmentKeySpecifier)[];
export type SaleFulfilmentFieldPolicy = {
	assignedTo?: FieldPolicy<any> | FieldReadFunction<any>,
	assignedToId?: FieldPolicy<any> | FieldReadFunction<any>,
	companyId?: FieldPolicy<any> | FieldReadFunction<any>,
	contact?: FieldPolicy<any> | FieldReadFunction<any>,
	contactId?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategory?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryId?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryName?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryPath?: FieldPolicy<any> | FieldReadFunction<any>,
	pimProduct?: FieldPolicy<any> | FieldReadFunction<any>,
	pimProductId?: FieldPolicy<any> | FieldReadFunction<any>,
	price?: FieldPolicy<any> | FieldReadFunction<any>,
	priceId?: FieldPolicy<any> | FieldReadFunction<any>,
	priceName?: FieldPolicy<any> | FieldReadFunction<any>,
	project?: FieldPolicy<any> | FieldReadFunction<any>,
	projectId?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrderLineItemId?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrderNumber?: FieldPolicy<any> | FieldReadFunction<any>,
	quantity?: FieldPolicy<any> | FieldReadFunction<any>,
	salePrice?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrder?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderId?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderLineItemId?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderPONumber?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderType?: FieldPolicy<any> | FieldReadFunction<any>,
	unitCostInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	workflowColumnId?: FieldPolicy<any> | FieldReadFunction<any>,
	workflowId?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SalePriceKeySpecifier = ('createdAt' | 'createdBy' | 'discounts' | 'id' | 'name' | 'parentPrice' | 'parentPriceId' | 'parentPriceIdPercentageFactor' | 'pimCategory' | 'pimCategoryId' | 'pimCategoryName' | 'pimCategoryPath' | 'pimProduct' | 'pimProductId' | 'priceBook' | 'priceBookId' | 'priceType' | 'unitCostInCents' | 'updatedAt' | 'workspaceId' | SalePriceKeySpecifier)[];
export type SalePriceFieldPolicy = {
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	discounts?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	parentPrice?: FieldPolicy<any> | FieldReadFunction<any>,
	parentPriceId?: FieldPolicy<any> | FieldReadFunction<any>,
	parentPriceIdPercentageFactor?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategory?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryId?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryName?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryPath?: FieldPolicy<any> | FieldReadFunction<any>,
	pimProduct?: FieldPolicy<any> | FieldReadFunction<any>,
	pimProductId?: FieldPolicy<any> | FieldReadFunction<any>,
	priceBook?: FieldPolicy<any> | FieldReadFunction<any>,
	priceBookId?: FieldPolicy<any> | FieldReadFunction<any>,
	priceType?: FieldPolicy<any> | FieldReadFunction<any>,
	unitCostInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SalePurchaseOrderLineItemKeySpecifier = ('company_id' | 'created_at' | 'created_by' | 'created_by_user' | 'deleted_at' | 'deliveryNotes' | 'delivery_charge_in_cents' | 'delivery_date' | 'delivery_location' | 'delivery_method' | 'id' | 'inventory' | 'lineitem_status' | 'lineitem_type' | 'po_pim_id' | 'po_quantity' | 'price' | 'price_id' | 'purchaseOrder' | 'purchase_order_id' | 'quote_revision_line_item_id' | 'so_pim_category' | 'so_pim_product' | 'updated_at' | 'updated_by' | 'updated_by_user' | SalePurchaseOrderLineItemKeySpecifier)[];
export type SalePurchaseOrderLineItemFieldPolicy = {
	company_id?: FieldPolicy<any> | FieldReadFunction<any>,
	created_at?: FieldPolicy<any> | FieldReadFunction<any>,
	created_by?: FieldPolicy<any> | FieldReadFunction<any>,
	created_by_user?: FieldPolicy<any> | FieldReadFunction<any>,
	deleted_at?: FieldPolicy<any> | FieldReadFunction<any>,
	deliveryNotes?: FieldPolicy<any> | FieldReadFunction<any>,
	delivery_charge_in_cents?: FieldPolicy<any> | FieldReadFunction<any>,
	delivery_date?: FieldPolicy<any> | FieldReadFunction<any>,
	delivery_location?: FieldPolicy<any> | FieldReadFunction<any>,
	delivery_method?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	inventory?: FieldPolicy<any> | FieldReadFunction<any>,
	lineitem_status?: FieldPolicy<any> | FieldReadFunction<any>,
	lineitem_type?: FieldPolicy<any> | FieldReadFunction<any>,
	po_pim_id?: FieldPolicy<any> | FieldReadFunction<any>,
	po_quantity?: FieldPolicy<any> | FieldReadFunction<any>,
	price?: FieldPolicy<any> | FieldReadFunction<any>,
	price_id?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrder?: FieldPolicy<any> | FieldReadFunction<any>,
	purchase_order_id?: FieldPolicy<any> | FieldReadFunction<any>,
	quote_revision_line_item_id?: FieldPolicy<any> | FieldReadFunction<any>,
	so_pim_category?: FieldPolicy<any> | FieldReadFunction<any>,
	so_pim_product?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_at?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_by?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_by_user?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SaleSalesOrderLineItemKeySpecifier = ('company_id' | 'created_at' | 'created_by' | 'created_by_user' | 'deleted_at' | 'deliveryNotes' | 'delivery_charge_in_cents' | 'delivery_date' | 'delivery_location' | 'delivery_method' | 'id' | 'intakeFormSubmissionLineItem' | 'intake_form_submission_line_item_id' | 'lineitem_status' | 'lineitem_type' | 'price' | 'price_id' | 'quote_revision_line_item_id' | 'sales_order_id' | 'so_pim_category' | 'so_pim_id' | 'so_pim_product' | 'so_quantity' | 'updated_at' | 'updated_by' | 'updated_by_user' | SaleSalesOrderLineItemKeySpecifier)[];
export type SaleSalesOrderLineItemFieldPolicy = {
	company_id?: FieldPolicy<any> | FieldReadFunction<any>,
	created_at?: FieldPolicy<any> | FieldReadFunction<any>,
	created_by?: FieldPolicy<any> | FieldReadFunction<any>,
	created_by_user?: FieldPolicy<any> | FieldReadFunction<any>,
	deleted_at?: FieldPolicy<any> | FieldReadFunction<any>,
	deliveryNotes?: FieldPolicy<any> | FieldReadFunction<any>,
	delivery_charge_in_cents?: FieldPolicy<any> | FieldReadFunction<any>,
	delivery_date?: FieldPolicy<any> | FieldReadFunction<any>,
	delivery_location?: FieldPolicy<any> | FieldReadFunction<any>,
	delivery_method?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	intakeFormSubmissionLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	intake_form_submission_line_item_id?: FieldPolicy<any> | FieldReadFunction<any>,
	lineitem_status?: FieldPolicy<any> | FieldReadFunction<any>,
	lineitem_type?: FieldPolicy<any> | FieldReadFunction<any>,
	price?: FieldPolicy<any> | FieldReadFunction<any>,
	price_id?: FieldPolicy<any> | FieldReadFunction<any>,
	quote_revision_line_item_id?: FieldPolicy<any> | FieldReadFunction<any>,
	sales_order_id?: FieldPolicy<any> | FieldReadFunction<any>,
	so_pim_category?: FieldPolicy<any> | FieldReadFunction<any>,
	so_pim_id?: FieldPolicy<any> | FieldReadFunction<any>,
	so_pim_product?: FieldPolicy<any> | FieldReadFunction<any>,
	so_quantity?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_at?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_by?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_by_user?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SaleTransactionKeySpecifier = ('comments' | 'createdAt' | 'createdBy' | 'history' | 'id' | 'lastUpdatedBy' | 'notes' | 'priceInCents' | 'product' | 'projectId' | 'quantity' | 'statusId' | 'type' | 'updatedAt' | 'workflowId' | 'workspaceId' | SaleTransactionKeySpecifier)[];
export type SaleTransactionFieldPolicy = {
	comments?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	history?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	lastUpdatedBy?: FieldPolicy<any> | FieldReadFunction<any>,
	notes?: FieldPolicy<any> | FieldReadFunction<any>,
	priceInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	product?: FieldPolicy<any> | FieldReadFunction<any>,
	projectId?: FieldPolicy<any> | FieldReadFunction<any>,
	quantity?: FieldPolicy<any> | FieldReadFunction<any>,
	statusId?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	workflowId?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SalesOrderKeySpecifier = ('buyer' | 'buyer_id' | 'comments' | 'company_id' | 'created_at' | 'created_by' | 'created_by_user' | 'deleted_at' | 'id' | 'intakeFormSubmission' | 'intake_form_submission_id' | 'line_items' | 'pricing' | 'project' | 'project_id' | 'purchase_order_number' | 'quote_id' | 'quote_revision_id' | 'sales_order_number' | 'status' | 'updated_at' | 'updated_by' | 'updated_by_user' | 'workspace_id' | SalesOrderKeySpecifier)[];
export type SalesOrderFieldPolicy = {
	buyer?: FieldPolicy<any> | FieldReadFunction<any>,
	buyer_id?: FieldPolicy<any> | FieldReadFunction<any>,
	comments?: FieldPolicy<any> | FieldReadFunction<any>,
	company_id?: FieldPolicy<any> | FieldReadFunction<any>,
	created_at?: FieldPolicy<any> | FieldReadFunction<any>,
	created_by?: FieldPolicy<any> | FieldReadFunction<any>,
	created_by_user?: FieldPolicy<any> | FieldReadFunction<any>,
	deleted_at?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	intakeFormSubmission?: FieldPolicy<any> | FieldReadFunction<any>,
	intake_form_submission_id?: FieldPolicy<any> | FieldReadFunction<any>,
	line_items?: FieldPolicy<any> | FieldReadFunction<any>,
	pricing?: FieldPolicy<any> | FieldReadFunction<any>,
	project?: FieldPolicy<any> | FieldReadFunction<any>,
	project_id?: FieldPolicy<any> | FieldReadFunction<any>,
	purchase_order_number?: FieldPolicy<any> | FieldReadFunction<any>,
	quote_id?: FieldPolicy<any> | FieldReadFunction<any>,
	quote_revision_id?: FieldPolicy<any> | FieldReadFunction<any>,
	sales_order_number?: FieldPolicy<any> | FieldReadFunction<any>,
	status?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_at?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_by?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_by_user?: FieldPolicy<any> | FieldReadFunction<any>,
	workspace_id?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SalesOrderLineItemPriceEstimateKeySpecifier = ('costInCents' | 'delivery_cost_in_cents' | 'details' | 'forecast' | 'rentalPeriod' | 'savingsComparedToDayRateInCents' | 'savingsComparedToDayRateInFraction' | 'savingsComparedToExactSplitInCents' | 'strategy' | 'total_including_delivery_in_cents' | SalesOrderLineItemPriceEstimateKeySpecifier)[];
export type SalesOrderLineItemPriceEstimateFieldPolicy = {
	costInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	delivery_cost_in_cents?: FieldPolicy<any> | FieldReadFunction<any>,
	details?: FieldPolicy<any> | FieldReadFunction<any>,
	forecast?: FieldPolicy<any> | FieldReadFunction<any>,
	rentalPeriod?: FieldPolicy<any> | FieldReadFunction<any>,
	savingsComparedToDayRateInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	savingsComparedToDayRateInFraction?: FieldPolicy<any> | FieldReadFunction<any>,
	savingsComparedToExactSplitInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	strategy?: FieldPolicy<any> | FieldReadFunction<any>,
	total_including_delivery_in_cents?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SalesOrderListResultKeySpecifier = ('items' | 'limit' | 'offset' | 'total' | SalesOrderListResultKeySpecifier)[];
export type SalesOrderListResultFieldPolicy = {
	items?: FieldPolicy<any> | FieldReadFunction<any>,
	limit?: FieldPolicy<any> | FieldReadFunction<any>,
	offset?: FieldPolicy<any> | FieldReadFunction<any>,
	total?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SalesOrderPricingKeySpecifier = ('sub_total_in_cents' | 'total_in_cents' | SalesOrderPricingKeySpecifier)[];
export type SalesOrderPricingFieldPolicy = {
	sub_total_in_cents?: FieldPolicy<any> | FieldReadFunction<any>,
	total_in_cents?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ScopeOfWorkCodeKeySpecifier = ('code' | 'description' | ScopeOfWorkCodeKeySpecifier)[];
export type ScopeOfWorkCodeFieldPolicy = {
	code?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SearchDocumentKeySpecifier = ('collection' | 'createdAt' | 'documentId' | 'documentType' | 'id' | 'metadata' | 'subtitle' | 'title' | 'updatedAt' | 'workspaceId' | SearchDocumentKeySpecifier)[];
export type SearchDocumentFieldPolicy = {
	collection?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	documentId?: FieldPolicy<any> | FieldReadFunction<any>,
	documentType?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	metadata?: FieldPolicy<any> | FieldReadFunction<any>,
	subtitle?: FieldPolicy<any> | FieldReadFunction<any>,
	title?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SearchDocumentsResultKeySpecifier = ('documents' | 'page' | 'total' | SearchDocumentsResultKeySpecifier)[];
export type SearchDocumentsResultFieldPolicy = {
	documents?: FieldPolicy<any> | FieldReadFunction<any>,
	page?: FieldPolicy<any> | FieldReadFunction<any>,
	total?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SearchUserStateKeySpecifier = ('createdAt' | 'favorites' | 'id' | 'recents' | 'updatedAt' | 'userId' | 'workspaceId' | SearchUserStateKeySpecifier)[];
export type SearchUserStateFieldPolicy = {
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	favorites?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	recents?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	userId?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SearchUserStateFavoriteKeySpecifier = ('addedAt' | 'searchDocument' | 'searchDocumentId' | SearchUserStateFavoriteKeySpecifier)[];
export type SearchUserStateFavoriteFieldPolicy = {
	addedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	searchDocument?: FieldPolicy<any> | FieldReadFunction<any>,
	searchDocumentId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SearchUserStateRecentKeySpecifier = ('accessedAt' | 'searchDocument' | 'searchDocumentId' | SearchUserStateRecentKeySpecifier)[];
export type SearchUserStateRecentFieldPolicy = {
	accessedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	searchDocument?: FieldPolicy<any> | FieldReadFunction<any>,
	searchDocumentId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SendTemplatedEmailResultKeySpecifier = ('error' | 'message' | 'success' | SendTemplatedEmailResultKeySpecifier)[];
export type SendTemplatedEmailResultFieldPolicy = {
	error?: FieldPolicy<any> | FieldReadFunction<any>,
	message?: FieldPolicy<any> | FieldReadFunction<any>,
	success?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SendTestEmailResultKeySpecifier = ('error' | 'message' | 'success' | SendTestEmailResultKeySpecifier)[];
export type SendTestEmailResultFieldPolicy = {
	error?: FieldPolicy<any> | FieldReadFunction<any>,
	message?: FieldPolicy<any> | FieldReadFunction<any>,
	success?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SequenceNumberKeySpecifier = ('companyId' | 'createdAt' | 'createdBy' | 'deleted' | 'id' | 'template' | 'templateId' | 'type' | 'updatedAt' | 'updatedBy' | 'value' | 'workspaceId' | SequenceNumberKeySpecifier)[];
export type SequenceNumberFieldPolicy = {
	companyId?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	deleted?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	template?: FieldPolicy<any> | FieldReadFunction<any>,
	templateId?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedBy?: FieldPolicy<any> | FieldReadFunction<any>,
	value?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ServiceFulfilmentKeySpecifier = ('assignedTo' | 'assignedToId' | 'companyId' | 'contact' | 'contactId' | 'createdAt' | 'id' | 'pimCategory' | 'pimCategoryId' | 'pimCategoryName' | 'pimCategoryPath' | 'pimProduct' | 'pimProductId' | 'price' | 'priceId' | 'priceName' | 'project' | 'projectId' | 'purchaseOrderLineItem' | 'purchaseOrderLineItemId' | 'purchaseOrderNumber' | 'salesOrder' | 'salesOrderId' | 'salesOrderLineItem' | 'salesOrderLineItemId' | 'salesOrderPONumber' | 'salesOrderType' | 'serviceDate' | 'unitCostInCents' | 'updatedAt' | 'workflowColumnId' | 'workflowId' | 'workspaceId' | ServiceFulfilmentKeySpecifier)[];
export type ServiceFulfilmentFieldPolicy = {
	assignedTo?: FieldPolicy<any> | FieldReadFunction<any>,
	assignedToId?: FieldPolicy<any> | FieldReadFunction<any>,
	companyId?: FieldPolicy<any> | FieldReadFunction<any>,
	contact?: FieldPolicy<any> | FieldReadFunction<any>,
	contactId?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategory?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryId?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryName?: FieldPolicy<any> | FieldReadFunction<any>,
	pimCategoryPath?: FieldPolicy<any> | FieldReadFunction<any>,
	pimProduct?: FieldPolicy<any> | FieldReadFunction<any>,
	pimProductId?: FieldPolicy<any> | FieldReadFunction<any>,
	price?: FieldPolicy<any> | FieldReadFunction<any>,
	priceId?: FieldPolicy<any> | FieldReadFunction<any>,
	priceName?: FieldPolicy<any> | FieldReadFunction<any>,
	project?: FieldPolicy<any> | FieldReadFunction<any>,
	projectId?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrderLineItemId?: FieldPolicy<any> | FieldReadFunction<any>,
	purchaseOrderNumber?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrder?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderId?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderLineItem?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderLineItemId?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderPONumber?: FieldPolicy<any> | FieldReadFunction<any>,
	salesOrderType?: FieldPolicy<any> | FieldReadFunction<any>,
	serviceDate?: FieldPolicy<any> | FieldReadFunction<any>,
	unitCostInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	workflowColumnId?: FieldPolicy<any> | FieldReadFunction<any>,
	workflowId?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ServiceTaskKeySpecifier = ('completed' | 'taskDetails' | ServiceTaskKeySpecifier)[];
export type ServiceTaskFieldPolicy = {
	completed?: FieldPolicy<any> | FieldReadFunction<any>,
	taskDetails?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ServiceTransactionKeySpecifier = ('assignee' | 'comments' | 'costInCents' | 'createdAt' | 'createdBy' | 'history' | 'id' | 'lastUpdatedBy' | 'location' | 'notes' | 'projectId' | 'statusId' | 'tasks' | 'type' | 'updatedAt' | 'workflowId' | 'workspaceId' | ServiceTransactionKeySpecifier)[];
export type ServiceTransactionFieldPolicy = {
	assignee?: FieldPolicy<any> | FieldReadFunction<any>,
	comments?: FieldPolicy<any> | FieldReadFunction<any>,
	costInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	history?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	lastUpdatedBy?: FieldPolicy<any> | FieldReadFunction<any>,
	location?: FieldPolicy<any> | FieldReadFunction<any>,
	notes?: FieldPolicy<any> | FieldReadFunction<any>,
	projectId?: FieldPolicy<any> | FieldReadFunction<any>,
	statusId?: FieldPolicy<any> | FieldReadFunction<any>,
	tasks?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	workflowId?: FieldPolicy<any> | FieldReadFunction<any>,
	workspaceId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SignedUploadUrlKeySpecifier = ('key' | 'url' | SignedUploadUrlKeySpecifier)[];
export type SignedUploadUrlFieldPolicy = {
	key?: FieldPolicy<any> | FieldReadFunction<any>,
	url?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SpiceDBObjectReferenceKeySpecifier = ('id' | 'type' | SpiceDBObjectReferenceKeySpecifier)[];
export type SpiceDBObjectReferenceFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SpiceDBRelationshipKeySpecifier = ('relation' | 'resource' | 'subject' | SpiceDBRelationshipKeySpecifier)[];
export type SpiceDBRelationshipFieldPolicy = {
	relation?: FieldPolicy<any> | FieldReadFunction<any>,
	resource?: FieldPolicy<any> | FieldReadFunction<any>,
	subject?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SpiceDBSubjectReferenceKeySpecifier = ('id' | 'relation' | 'type' | SpiceDBSubjectReferenceKeySpecifier)[];
export type SpiceDBSubjectReferenceFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	relation?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SubmissionSalesOrderKeySpecifier = ('created_at' | 'deleted_at' | 'id' | 'project' | 'project_id' | 'purchase_order_number' | 'sales_order_number' | 'status' | 'updated_at' | 'workspace_id' | SubmissionSalesOrderKeySpecifier)[];
export type SubmissionSalesOrderFieldPolicy = {
	created_at?: FieldPolicy<any> | FieldReadFunction<any>,
	deleted_at?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	project?: FieldPolicy<any> | FieldReadFunction<any>,
	project_id?: FieldPolicy<any> | FieldReadFunction<any>,
	purchase_order_number?: FieldPolicy<any> | FieldReadFunction<any>,
	sales_order_number?: FieldPolicy<any> | FieldReadFunction<any>,
	status?: FieldPolicy<any> | FieldReadFunction<any>,
	updated_at?: FieldPolicy<any> | FieldReadFunction<any>,
	workspace_id?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SubscriptionKeySpecifier = ('currentTime' | SubscriptionKeySpecifier)[];
export type SubscriptionFieldPolicy = {
	currentTime?: FieldPolicy<any> | FieldReadFunction<any>
};
export type TaxAnalysisResultKeySpecifier = ('taxes' | TaxAnalysisResultKeySpecifier)[];
export type TaxAnalysisResultFieldPolicy = {
	taxes?: FieldPolicy<any> | FieldReadFunction<any>
};
export type TaxLineItemKeySpecifier = ('calculatedAmountInCents' | 'description' | 'id' | 'order' | 'type' | 'value' | TaxLineItemKeySpecifier)[];
export type TaxLineItemFieldPolicy = {
	calculatedAmountInCents?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	order?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>,
	value?: FieldPolicy<any> | FieldReadFunction<any>
};
export type TaxObligationKeySpecifier = ('description' | 'order' | 'reason' | 'type' | 'value' | TaxObligationKeySpecifier)[];
export type TaxObligationFieldPolicy = {
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	order?: FieldPolicy<any> | FieldReadFunction<any>,
	reason?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>,
	value?: FieldPolicy<any> | FieldReadFunction<any>
};
export type TouchAllContactsResultKeySpecifier = ('touched' | TouchAllContactsResultKeySpecifier)[];
export type TouchAllContactsResultFieldPolicy = {
	touched?: FieldPolicy<any> | FieldReadFunction<any>
};
export type TransactionLogEntryKeySpecifier = ('action' | 'col' | 'newValue' | 'oldValue' | 'userId' | TransactionLogEntryKeySpecifier)[];
export type TransactionLogEntryFieldPolicy = {
	action?: FieldPolicy<any> | FieldReadFunction<any>,
	col?: FieldPolicy<any> | FieldReadFunction<any>,
	newValue?: FieldPolicy<any> | FieldReadFunction<any>,
	oldValue?: FieldPolicy<any> | FieldReadFunction<any>,
	userId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type TransactionStatusKeySpecifier = ('colourCode' | 'id' | 'name' | 'type' | 'workflowId' | TransactionStatusKeySpecifier)[];
export type TransactionStatusFieldPolicy = {
	colourCode?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>,
	workflowId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type UserKeySpecifier = ('companyId' | 'email' | 'firstName' | 'id' | 'lastLoginLocation' | 'lastName' | 'picture' | UserKeySpecifier)[];
export type UserFieldPolicy = {
	companyId?: FieldPolicy<any> | FieldReadFunction<any>,
	email?: FieldPolicy<any> | FieldReadFunction<any>,
	firstName?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	lastLoginLocation?: FieldPolicy<any> | FieldReadFunction<any>,
	lastName?: FieldPolicy<any> | FieldReadFunction<any>,
	picture?: FieldPolicy<any> | FieldReadFunction<any>
};
export type UserLocationInfoKeySpecifier = ('city' | 'countryCode' | 'countryName' | 'latitude' | 'longitude' | 'timezone' | UserLocationInfoKeySpecifier)[];
export type UserLocationInfoFieldPolicy = {
	city?: FieldPolicy<any> | FieldReadFunction<any>,
	countryCode?: FieldPolicy<any> | FieldReadFunction<any>,
	countryName?: FieldPolicy<any> | FieldReadFunction<any>,
	latitude?: FieldPolicy<any> | FieldReadFunction<any>,
	longitude?: FieldPolicy<any> | FieldReadFunction<any>,
	timezone?: FieldPolicy<any> | FieldReadFunction<any>
};
export type UserPermissionKeySpecifier = ('permissionMap' | 'permissions' | 'resourceId' | 'resourceType' | UserPermissionKeySpecifier)[];
export type UserPermissionFieldPolicy = {
	permissionMap?: FieldPolicy<any> | FieldReadFunction<any>,
	permissions?: FieldPolicy<any> | FieldReadFunction<any>,
	resourceId?: FieldPolicy<any> | FieldReadFunction<any>,
	resourceType?: FieldPolicy<any> | FieldReadFunction<any>
};
export type UserPermissionMapKeySpecifier = ('ERP_CHARGE_DELETE' | 'ERP_CHARGE_READ' | 'ERP_CHARGE_UPDATE' | 'ERP_CONTACT_DELETE' | 'ERP_CONTACT_READ' | 'ERP_CONTACT_UPDATE' | 'ERP_DOMAIN_IS_MEMBER' | 'ERP_FILE_DELETE' | 'ERP_FILE_READ' | 'ERP_FILE_UPDATE' | 'ERP_FULFILMENT_DELETE' | 'ERP_FULFILMENT_MANAGE_RENTAL_PERIOD' | 'ERP_FULFILMENT_READ' | 'ERP_FULFILMENT_UPDATE' | 'ERP_INTAKE_FORM_CREATE_SUBMISSION' | 'ERP_INTAKE_FORM_READ' | 'ERP_INTAKE_FORM_READ_SUBMISSIONS' | 'ERP_INTAKE_FORM_SUBMISSION_READ' | 'ERP_INTAKE_FORM_SUBMISSION_UPDATE' | 'ERP_INTAKE_FORM_UPDATE' | 'ERP_INTAKE_FORM_UPDATE_SUBMISSIONS' | 'ERP_INVOICE_READ' | 'ERP_INVOICE_UPDATE' | 'ERP_PLATFORM_IS_ADMIN' | 'ERP_PRICEBOOK_PRICE_READ' | 'ERP_PRICEBOOK_PRICE_UPDATE' | 'ERP_PRICEBOOK_READ' | 'ERP_PRICEBOOK_UPDATE' | 'ERP_PROJECT_READ' | 'ERP_PROJECT_UPDATE' | 'ERP_PURCHASE_ORDER_READ' | 'ERP_PURCHASE_ORDER_UPDATE' | 'ERP_QUOTE_ACCEPT' | 'ERP_QUOTE_READ' | 'ERP_QUOTE_REJECT' | 'ERP_QUOTE_UPDATE' | 'ERP_RFQ_READ' | 'ERP_RFQ_UPDATE' | 'ERP_SALES_ORDER_PORTAL_ACCESS' | 'ERP_SALES_ORDER_READ' | 'ERP_SALES_ORDER_UPDATE' | 'ERP_WORKSPACE_ADD_USER' | 'ERP_WORKSPACE_CAN_JOIN' | 'ERP_WORKSPACE_CAN_MANAGE_BUYER_INTAKE_FORM_SUBMISSIONS' | 'ERP_WORKSPACE_CAN_MANAGE_CHARGES' | 'ERP_WORKSPACE_CAN_MANAGE_CONTACTS' | 'ERP_WORKSPACE_CAN_MANAGE_FILES' | 'ERP_WORKSPACE_CAN_MANAGE_INTAKE_FORMS' | 'ERP_WORKSPACE_CAN_MANAGE_INTAKE_FORM_SUBMISSIONS' | 'ERP_WORKSPACE_CAN_MANAGE_INVOICES' | 'ERP_WORKSPACE_CAN_MANAGE_PRICES' | 'ERP_WORKSPACE_CAN_MANAGE_PRICE_BOOKS' | 'ERP_WORKSPACE_CAN_MANAGE_PROJECTS' | 'ERP_WORKSPACE_CAN_MANAGE_PURCHASE_ORDERS' | 'ERP_WORKSPACE_CAN_MANAGE_QUOTES' | 'ERP_WORKSPACE_CAN_MANAGE_REFERENCE_NUMBER_TEMPLATES' | 'ERP_WORKSPACE_CAN_MANAGE_RFQS' | 'ERP_WORKSPACE_CAN_MANAGE_SALES_ORDERS' | 'ERP_WORKSPACE_CAN_READ_BUYER_INTAKE_FORM_SUBMISSIONS' | 'ERP_WORKSPACE_CAN_READ_CHARGES' | 'ERP_WORKSPACE_CAN_READ_CONTACTS' | 'ERP_WORKSPACE_CAN_READ_FILES' | 'ERP_WORKSPACE_CAN_READ_INVOICES' | 'ERP_WORKSPACE_CAN_READ_PROJECTS' | 'ERP_WORKSPACE_CAN_READ_PURCHASE_ORDERS' | 'ERP_WORKSPACE_CAN_READ_QUOTES' | 'ERP_WORKSPACE_CAN_READ_REFERENCE_NUMBER_TEMPLATES' | 'ERP_WORKSPACE_CAN_READ_RFQS' | 'ERP_WORKSPACE_CAN_READ_SALES_ORDERS' | 'ERP_WORKSPACE_CREATE_INTAKE_FORM' | 'ERP_WORKSPACE_CREATE_INTAKE_FORM_SUBMISSION' | 'ERP_WORKSPACE_CREATE_PRICE_BOOK' | 'ERP_WORKSPACE_IS_ADMIN' | 'ERP_WORKSPACE_MANAGE' | 'ERP_WORKSPACE_READ' | 'ERP_WORKSPACE_READ_INTAKE_FORMS' | 'ERP_WORKSPACE_READ_INTAKE_FORM_SUBMISSIONS' | 'ERP_WORKSPACE_READ_PRICES' | 'ERP_WORKSPACE_READ_PRICE_BOOKS' | 'ERP_WORKSPACE_REMOVE_USER' | 'ERP_WORKSPACE_UPDATE_USER_ROLES' | UserPermissionMapKeySpecifier)[];
export type UserPermissionMapFieldPolicy = {
	ERP_CHARGE_DELETE?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_CHARGE_READ?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_CHARGE_UPDATE?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_CONTACT_DELETE?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_CONTACT_READ?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_CONTACT_UPDATE?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_DOMAIN_IS_MEMBER?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_FILE_DELETE?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_FILE_READ?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_FILE_UPDATE?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_FULFILMENT_DELETE?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_FULFILMENT_MANAGE_RENTAL_PERIOD?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_FULFILMENT_READ?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_FULFILMENT_UPDATE?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_INTAKE_FORM_CREATE_SUBMISSION?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_INTAKE_FORM_READ?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_INTAKE_FORM_READ_SUBMISSIONS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_INTAKE_FORM_SUBMISSION_READ?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_INTAKE_FORM_SUBMISSION_UPDATE?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_INTAKE_FORM_UPDATE?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_INTAKE_FORM_UPDATE_SUBMISSIONS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_INVOICE_READ?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_INVOICE_UPDATE?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_PLATFORM_IS_ADMIN?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_PRICEBOOK_PRICE_READ?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_PRICEBOOK_PRICE_UPDATE?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_PRICEBOOK_READ?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_PRICEBOOK_UPDATE?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_PROJECT_READ?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_PROJECT_UPDATE?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_PURCHASE_ORDER_READ?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_PURCHASE_ORDER_UPDATE?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_QUOTE_ACCEPT?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_QUOTE_READ?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_QUOTE_REJECT?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_QUOTE_UPDATE?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_RFQ_READ?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_RFQ_UPDATE?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_SALES_ORDER_PORTAL_ACCESS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_SALES_ORDER_READ?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_SALES_ORDER_UPDATE?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_ADD_USER?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_JOIN?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_MANAGE_BUYER_INTAKE_FORM_SUBMISSIONS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_MANAGE_CHARGES?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_MANAGE_CONTACTS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_MANAGE_FILES?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_MANAGE_INTAKE_FORMS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_MANAGE_INTAKE_FORM_SUBMISSIONS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_MANAGE_INVOICES?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_MANAGE_PRICES?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_MANAGE_PRICE_BOOKS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_MANAGE_PROJECTS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_MANAGE_PURCHASE_ORDERS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_MANAGE_QUOTES?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_MANAGE_REFERENCE_NUMBER_TEMPLATES?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_MANAGE_RFQS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_MANAGE_SALES_ORDERS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_READ_BUYER_INTAKE_FORM_SUBMISSIONS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_READ_CHARGES?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_READ_CONTACTS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_READ_FILES?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_READ_INVOICES?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_READ_PROJECTS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_READ_PURCHASE_ORDERS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_READ_QUOTES?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_READ_REFERENCE_NUMBER_TEMPLATES?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_READ_RFQS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CAN_READ_SALES_ORDERS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CREATE_INTAKE_FORM?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CREATE_INTAKE_FORM_SUBMISSION?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_CREATE_PRICE_BOOK?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_IS_ADMIN?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_MANAGE?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_READ?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_READ_INTAKE_FORMS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_READ_INTAKE_FORM_SUBMISSIONS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_READ_PRICES?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_READ_PRICE_BOOKS?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_REMOVE_USER?: FieldPolicy<any> | FieldReadFunction<any>,
	ERP_WORKSPACE_UPDATE_USER_ROLES?: FieldPolicy<any> | FieldReadFunction<any>
};
export type ValidEnterpriseDomainResultKeySpecifier = ('domain' | 'isValid' | 'reason' | ValidEnterpriseDomainResultKeySpecifier)[];
export type ValidEnterpriseDomainResultFieldPolicy = {
	domain?: FieldPolicy<any> | FieldReadFunction<any>,
	isValid?: FieldPolicy<any> | FieldReadFunction<any>,
	reason?: FieldPolicy<any> | FieldReadFunction<any>
};
export type WorkflowKeySpecifier = ('id' | 'name' | 'statuses' | WorkflowKeySpecifier)[];
export type WorkflowFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	statuses?: FieldPolicy<any> | FieldReadFunction<any>
};
export type WorkflowColumnKeySpecifier = ('colour' | 'id' | 'name' | WorkflowColumnKeySpecifier)[];
export type WorkflowColumnFieldPolicy = {
	colour?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>
};
export type WorkflowConfigurationKeySpecifier = ('columns' | 'companyId' | 'createdAt' | 'createdBy' | 'createdByUser' | 'deletedAt' | 'deletedBy' | 'id' | 'name' | 'updatedAt' | 'updatedBy' | 'updatedByUser' | WorkflowConfigurationKeySpecifier)[];
export type WorkflowConfigurationFieldPolicy = {
	columns?: FieldPolicy<any> | FieldReadFunction<any>,
	companyId?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	createdByUser?: FieldPolicy<any> | FieldReadFunction<any>,
	deletedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	deletedBy?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedBy?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedByUser?: FieldPolicy<any> | FieldReadFunction<any>
};
export type WorkspaceKeySpecifier = ('accessType' | 'archived' | 'archivedAt' | 'bannerImageUrl' | 'brandId' | 'companyId' | 'createdAt' | 'createdBy' | 'description' | 'domain' | 'id' | 'logoUrl' | 'name' | 'ownerId' | 'updatedAt' | 'updatedBy' | WorkspaceKeySpecifier)[];
export type WorkspaceFieldPolicy = {
	accessType?: FieldPolicy<any> | FieldReadFunction<any>,
	archived?: FieldPolicy<any> | FieldReadFunction<any>,
	archivedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	bannerImageUrl?: FieldPolicy<any> | FieldReadFunction<any>,
	brandId?: FieldPolicy<any> | FieldReadFunction<any>,
	companyId?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	createdBy?: FieldPolicy<any> | FieldReadFunction<any>,
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	domain?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	logoUrl?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	ownerId?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	updatedBy?: FieldPolicy<any> | FieldReadFunction<any>
};
export type WorkspaceMemberKeySpecifier = ('roles' | 'user' | 'userId' | WorkspaceMemberKeySpecifier)[];
export type WorkspaceMemberFieldPolicy = {
	roles?: FieldPolicy<any> | FieldReadFunction<any>,
	user?: FieldPolicy<any> | FieldReadFunction<any>,
	userId?: FieldPolicy<any> | FieldReadFunction<any>
};
export type WorkspaceRoleInfoKeySpecifier = ('description' | 'label' | 'role' | WorkspaceRoleInfoKeySpecifier)[];
export type WorkspaceRoleInfoFieldPolicy = {
	description?: FieldPolicy<any> | FieldReadFunction<any>,
	label?: FieldPolicy<any> | FieldReadFunction<any>,
	role?: FieldPolicy<any> | FieldReadFunction<any>
};
export type WriteRelationshipResultKeySpecifier = ('message' | 'relationship' | 'success' | WriteRelationshipResultKeySpecifier)[];
export type WriteRelationshipResultFieldPolicy = {
	message?: FieldPolicy<any> | FieldReadFunction<any>,
	relationship?: FieldPolicy<any> | FieldReadFunction<any>,
	success?: FieldPolicy<any> | FieldReadFunction<any>
};
export type StrictTypedTypePolicies = {
	AcceptQuoteResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AcceptQuoteResultKeySpecifier | (() => undefined | AcceptQuoteResultKeySpecifier),
		fields?: AcceptQuoteResultFieldPolicy,
	},
	AdminMutationNamespace?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AdminMutationNamespaceKeySpecifier | (() => undefined | AdminMutationNamespaceKeySpecifier),
		fields?: AdminMutationNamespaceFieldPolicy,
	},
	AdminQueryNamespace?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AdminQueryNamespaceKeySpecifier | (() => undefined | AdminQueryNamespaceKeySpecifier),
		fields?: AdminQueryNamespaceFieldPolicy,
	},
	AdoptOrphanedSubmissionsResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AdoptOrphanedSubmissionsResultKeySpecifier | (() => undefined | AdoptOrphanedSubmissionsResultKeySpecifier),
		fields?: AdoptOrphanedSubmissionsResultFieldPolicy,
	},
	Asset?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AssetKeySpecifier | (() => undefined | AssetKeySpecifier),
		fields?: AssetFieldPolicy,
	},
	AssetCategory?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AssetCategoryKeySpecifier | (() => undefined | AssetCategoryKeySpecifier),
		fields?: AssetCategoryFieldPolicy,
	},
	AssetClass?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AssetClassKeySpecifier | (() => undefined | AssetClassKeySpecifier),
		fields?: AssetClassFieldPolicy,
	},
	AssetCompany?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AssetCompanyKeySpecifier | (() => undefined | AssetCompanyKeySpecifier),
		fields?: AssetCompanyFieldPolicy,
	},
	AssetDetails?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AssetDetailsKeySpecifier | (() => undefined | AssetDetailsKeySpecifier),
		fields?: AssetDetailsFieldPolicy,
	},
	AssetGroup?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AssetGroupKeySpecifier | (() => undefined | AssetGroupKeySpecifier),
		fields?: AssetGroupFieldPolicy,
	},
	AssetInventoryBranch?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AssetInventoryBranchKeySpecifier | (() => undefined | AssetInventoryBranchKeySpecifier),
		fields?: AssetInventoryBranchFieldPolicy,
	},
	AssetMspBranch?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AssetMspBranchKeySpecifier | (() => undefined | AssetMspBranchKeySpecifier),
		fields?: AssetMspBranchFieldPolicy,
	},
	AssetPhoto?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AssetPhotoKeySpecifier | (() => undefined | AssetPhotoKeySpecifier),
		fields?: AssetPhotoFieldPolicy,
	},
	AssetRspBranch?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AssetRspBranchKeySpecifier | (() => undefined | AssetRspBranchKeySpecifier),
		fields?: AssetRspBranchFieldPolicy,
	},
	AssetSchedule?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AssetScheduleKeySpecifier | (() => undefined | AssetScheduleKeySpecifier),
		fields?: AssetScheduleFieldPolicy,
	},
	AssetScheduleListResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AssetScheduleListResultKeySpecifier | (() => undefined | AssetScheduleListResultKeySpecifier),
		fields?: AssetScheduleListResultFieldPolicy,
	},
	AssetTracker?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AssetTrackerKeySpecifier | (() => undefined | AssetTrackerKeySpecifier),
		fields?: AssetTrackerFieldPolicy,
	},
	AssetTspCompany?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AssetTspCompanyKeySpecifier | (() => undefined | AssetTspCompanyKeySpecifier),
		fields?: AssetTspCompanyFieldPolicy,
	},
	AssetType?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AssetTypeKeySpecifier | (() => undefined | AssetTypeKeySpecifier),
		fields?: AssetTypeFieldPolicy,
	},
	Auth0Identity?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | Auth0IdentityKeySpecifier | (() => undefined | Auth0IdentityKeySpecifier),
		fields?: Auth0IdentityFieldPolicy,
	},
	Auth0Role?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | Auth0RoleKeySpecifier | (() => undefined | Auth0RoleKeySpecifier),
		fields?: Auth0RoleFieldPolicy,
	},
	Auth0User?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | Auth0UserKeySpecifier | (() => undefined | Auth0UserKeySpecifier),
		fields?: Auth0UserFieldPolicy,
	},
	Auth0UsersSearchResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | Auth0UsersSearchResultKeySpecifier | (() => undefined | Auth0UsersSearchResultKeySpecifier),
		fields?: Auth0UsersSearchResultFieldPolicy,
	},
	AvailableRelation?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | AvailableRelationKeySpecifier | (() => undefined | AvailableRelationKeySpecifier),
		fields?: AvailableRelationFieldPolicy,
	},
	BaseTransaction?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | BaseTransactionKeySpecifier | (() => undefined | BaseTransactionKeySpecifier),
		fields?: BaseTransactionFieldPolicy,
	},
	Brand?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | BrandKeySpecifier | (() => undefined | BrandKeySpecifier),
		fields?: BrandFieldPolicy,
	},
	BrandColor?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | BrandColorKeySpecifier | (() => undefined | BrandColorKeySpecifier),
		fields?: BrandColorFieldPolicy,
	},
	BrandFont?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | BrandFontKeySpecifier | (() => undefined | BrandFontKeySpecifier),
		fields?: BrandFontFieldPolicy,
	},
	BrandImage?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | BrandImageKeySpecifier | (() => undefined | BrandImageKeySpecifier),
		fields?: BrandImageFieldPolicy,
	},
	BrandImageFormat?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | BrandImageFormatKeySpecifier | (() => undefined | BrandImageFormatKeySpecifier),
		fields?: BrandImageFormatFieldPolicy,
	},
	BrandLink?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | BrandLinkKeySpecifier | (() => undefined | BrandLinkKeySpecifier),
		fields?: BrandLinkFieldPolicy,
	},
	BrandLogo?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | BrandLogoKeySpecifier | (() => undefined | BrandLogoKeySpecifier),
		fields?: BrandLogoFieldPolicy,
	},
	BrandSearchResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | BrandSearchResultKeySpecifier | (() => undefined | BrandSearchResultKeySpecifier),
		fields?: BrandSearchResultFieldPolicy,
	},
	BulkMarkInventoryReceivedResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | BulkMarkInventoryReceivedResultKeySpecifier | (() => undefined | BulkMarkInventoryReceivedResultKeySpecifier),
		fields?: BulkMarkInventoryReceivedResultFieldPolicy,
	},
	BusinessContact?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | BusinessContactKeySpecifier | (() => undefined | BusinessContactKeySpecifier),
		fields?: BusinessContactFieldPolicy,
	},
	Charge?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ChargeKeySpecifier | (() => undefined | ChargeKeySpecifier),
		fields?: ChargeFieldPolicy,
	},
	ChargePage?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ChargePageKeySpecifier | (() => undefined | ChargePageKeySpecifier),
		fields?: ChargePageFieldPolicy,
	},
	CollectionSnapshotResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | CollectionSnapshotResultKeySpecifier | (() => undefined | CollectionSnapshotResultKeySpecifier),
		fields?: CollectionSnapshotResultFieldPolicy,
	},
	Comment?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | CommentKeySpecifier | (() => undefined | CommentKeySpecifier),
		fields?: CommentFieldPolicy,
	},
	Company?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | CompanyKeySpecifier | (() => undefined | CompanyKeySpecifier),
		fields?: CompanyFieldPolicy,
	},
	CreatePdfResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | CreatePdfResultKeySpecifier | (() => undefined | CreatePdfResultKeySpecifier),
		fields?: CreatePdfResultFieldPolicy,
	},
	CurrentTimeEvent?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | CurrentTimeEventKeySpecifier | (() => undefined | CurrentTimeEventKeySpecifier),
		fields?: CurrentTimeEventFieldPolicy,
	},
	DeleteRelationshipResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | DeleteRelationshipResultKeySpecifier | (() => undefined | DeleteRelationshipResultKeySpecifier),
		fields?: DeleteRelationshipResultFieldPolicy,
	},
	EmailActivity?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | EmailActivityKeySpecifier | (() => undefined | EmailActivityKeySpecifier),
		fields?: EmailActivityFieldPolicy,
	},
	EmailDetails?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | EmailDetailsKeySpecifier | (() => undefined | EmailDetailsKeySpecifier),
		fields?: EmailDetailsFieldPolicy,
	},
	EmailTemplatePreviewResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | EmailTemplatePreviewResultKeySpecifier | (() => undefined | EmailTemplatePreviewResultKeySpecifier),
		fields?: EmailTemplatePreviewResultFieldPolicy,
	},
	ExampleTicket?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ExampleTicketKeySpecifier | (() => undefined | ExampleTicketKeySpecifier),
		fields?: ExampleTicketFieldPolicy,
	},
	File?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | FileKeySpecifier | (() => undefined | FileKeySpecifier),
		fields?: FileFieldPolicy,
	},
	FulfilmentBase?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | FulfilmentBaseKeySpecifier | (() => undefined | FulfilmentBaseKeySpecifier),
		fields?: FulfilmentBaseFieldPolicy,
	},
	FulfilmentReservation?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | FulfilmentReservationKeySpecifier | (() => undefined | FulfilmentReservationKeySpecifier),
		fields?: FulfilmentReservationFieldPolicy,
	},
	GenerateReferenceNumberResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | GenerateReferenceNumberResultKeySpecifier | (() => undefined | GenerateReferenceNumberResultKeySpecifier),
		fields?: GenerateReferenceNumberResultFieldPolicy,
	},
	ImportPricesResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ImportPricesResultKeySpecifier | (() => undefined | ImportPricesResultKeySpecifier),
		fields?: ImportPricesResultFieldPolicy,
	},
	IntakeForm?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | IntakeFormKeySpecifier | (() => undefined | IntakeFormKeySpecifier),
		fields?: IntakeFormFieldPolicy,
	},
	IntakeFormLineItem?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | IntakeFormLineItemKeySpecifier | (() => undefined | IntakeFormLineItemKeySpecifier),
		fields?: IntakeFormLineItemFieldPolicy,
	},
	IntakeFormPage?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | IntakeFormPageKeySpecifier | (() => undefined | IntakeFormPageKeySpecifier),
		fields?: IntakeFormPageFieldPolicy,
	},
	IntakeFormPageInfo?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | IntakeFormPageInfoKeySpecifier | (() => undefined | IntakeFormPageInfoKeySpecifier),
		fields?: IntakeFormPageInfoFieldPolicy,
	},
	IntakeFormProject?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | IntakeFormProjectKeySpecifier | (() => undefined | IntakeFormProjectKeySpecifier),
		fields?: IntakeFormProjectFieldPolicy,
	},
	IntakeFormSubmission?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | IntakeFormSubmissionKeySpecifier | (() => undefined | IntakeFormSubmissionKeySpecifier),
		fields?: IntakeFormSubmissionFieldPolicy,
	},
	IntakeFormSubmissionPage?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | IntakeFormSubmissionPageKeySpecifier | (() => undefined | IntakeFormSubmissionPageKeySpecifier),
		fields?: IntakeFormSubmissionPageFieldPolicy,
	},
	IntakeFormSubmissionPageInfo?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | IntakeFormSubmissionPageInfoKeySpecifier | (() => undefined | IntakeFormSubmissionPageInfoKeySpecifier),
		fields?: IntakeFormSubmissionPageInfoFieldPolicy,
	},
	IntakeFormWorkspace?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | IntakeFormWorkspaceKeySpecifier | (() => undefined | IntakeFormWorkspaceKeySpecifier),
		fields?: IntakeFormWorkspaceFieldPolicy,
	},
	Inventory?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | InventoryKeySpecifier | (() => undefined | InventoryKeySpecifier),
		fields?: InventoryFieldPolicy,
	},
	InventoryGroupedByCategory?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | InventoryGroupedByCategoryKeySpecifier | (() => undefined | InventoryGroupedByCategoryKeySpecifier),
		fields?: InventoryGroupedByCategoryFieldPolicy,
	},
	InventoryGroupedByCategoryResponse?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | InventoryGroupedByCategoryResponseKeySpecifier | (() => undefined | InventoryGroupedByCategoryResponseKeySpecifier),
		fields?: InventoryGroupedByCategoryResponseFieldPolicy,
	},
	InventoryReservationsPage?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | InventoryReservationsPageKeySpecifier | (() => undefined | InventoryReservationsPageKeySpecifier),
		fields?: InventoryReservationsPageFieldPolicy,
	},
	InventoryReservationsResponse?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | InventoryReservationsResponseKeySpecifier | (() => undefined | InventoryReservationsResponseKeySpecifier),
		fields?: InventoryReservationsResponseFieldPolicy,
	},
	InventoryResponse?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | InventoryResponseKeySpecifier | (() => undefined | InventoryResponseKeySpecifier),
		fields?: InventoryResponseFieldPolicy,
	},
	Invoice?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | InvoiceKeySpecifier | (() => undefined | InvoiceKeySpecifier),
		fields?: InvoiceFieldPolicy,
	},
	InvoiceLineItem?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | InvoiceLineItemKeySpecifier | (() => undefined | InvoiceLineItemKeySpecifier),
		fields?: InvoiceLineItemFieldPolicy,
	},
	InvoicesResponse?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | InvoicesResponseKeySpecifier | (() => undefined | InvoicesResponseKeySpecifier),
		fields?: InvoicesResponseFieldPolicy,
	},
	LineItemCostOptionDetails?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | LineItemCostOptionDetailsKeySpecifier | (() => undefined | LineItemCostOptionDetailsKeySpecifier),
		fields?: LineItemCostOptionDetailsFieldPolicy,
	},
	LineItemPriceForecast?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | LineItemPriceForecastKeySpecifier | (() => undefined | LineItemPriceForecastKeySpecifier),
		fields?: LineItemPriceForecastFieldPolicy,
	},
	LineItemPriceForecastDay?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | LineItemPriceForecastDayKeySpecifier | (() => undefined | LineItemPriceForecastDayKeySpecifier),
		fields?: LineItemPriceForecastDayFieldPolicy,
	},
	LineItemPricing?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | LineItemPricingKeySpecifier | (() => undefined | LineItemPricingKeySpecifier),
		fields?: LineItemPricingFieldPolicy,
	},
	LineItemRentalPeriod?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | LineItemRentalPeriodKeySpecifier | (() => undefined | LineItemRentalPeriodKeySpecifier),
		fields?: LineItemRentalPeriodFieldPolicy,
	},
	ListAssetsResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ListAssetsResultKeySpecifier | (() => undefined | ListAssetsResultKeySpecifier),
		fields?: ListAssetsResultFieldPolicy,
	},
	ListContactsResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ListContactsResultKeySpecifier | (() => undefined | ListContactsResultKeySpecifier),
		fields?: ListContactsResultFieldPolicy,
	},
	ListFulfilmentsResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ListFulfilmentsResultKeySpecifier | (() => undefined | ListFulfilmentsResultKeySpecifier),
		fields?: ListFulfilmentsResultFieldPolicy,
	},
	ListPersonContactsResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ListPersonContactsResultKeySpecifier | (() => undefined | ListPersonContactsResultKeySpecifier),
		fields?: ListPersonContactsResultFieldPolicy,
	},
	ListPimCategoriesResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ListPimCategoriesResultKeySpecifier | (() => undefined | ListPimCategoriesResultKeySpecifier),
		fields?: ListPimCategoriesResultFieldPolicy,
	},
	ListPimProductsResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ListPimProductsResultKeySpecifier | (() => undefined | ListPimProductsResultKeySpecifier),
		fields?: ListPimProductsResultFieldPolicy,
	},
	ListPriceBooksResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ListPriceBooksResultKeySpecifier | (() => undefined | ListPriceBooksResultKeySpecifier),
		fields?: ListPriceBooksResultFieldPolicy,
	},
	ListPricesResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ListPricesResultKeySpecifier | (() => undefined | ListPricesResultKeySpecifier),
		fields?: ListPricesResultFieldPolicy,
	},
	ListRFQsResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ListRFQsResultKeySpecifier | (() => undefined | ListRFQsResultKeySpecifier),
		fields?: ListRFQsResultFieldPolicy,
	},
	ListRelationshipsResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ListRelationshipsResultKeySpecifier | (() => undefined | ListRelationshipsResultKeySpecifier),
		fields?: ListRelationshipsResultFieldPolicy,
	},
	ListRentalFulfilmentsResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ListRentalFulfilmentsResultKeySpecifier | (() => undefined | ListRentalFulfilmentsResultKeySpecifier),
		fields?: ListRentalFulfilmentsResultFieldPolicy,
	},
	ListRentalViewsResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ListRentalViewsResultKeySpecifier | (() => undefined | ListRentalViewsResultKeySpecifier),
		fields?: ListRentalViewsResultFieldPolicy,
	},
	ListTransactionResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ListTransactionResultKeySpecifier | (() => undefined | ListTransactionResultKeySpecifier),
		fields?: ListTransactionResultFieldPolicy,
	},
	ListUserPermissionsResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ListUserPermissionsResultKeySpecifier | (() => undefined | ListUserPermissionsResultKeySpecifier),
		fields?: ListUserPermissionsResultFieldPolicy,
	},
	ListWorkflowConfigurationsResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ListWorkflowConfigurationsResultKeySpecifier | (() => undefined | ListWorkflowConfigurationsResultKeySpecifier),
		fields?: ListWorkflowConfigurationsResultFieldPolicy,
	},
	ListWorkspaceMembersResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ListWorkspaceMembersResultKeySpecifier | (() => undefined | ListWorkspaceMembersResultKeySpecifier),
		fields?: ListWorkspaceMembersResultFieldPolicy,
	},
	ListWorkspacesResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ListWorkspacesResultKeySpecifier | (() => undefined | ListWorkspacesResultKeySpecifier),
		fields?: ListWorkspacesResultFieldPolicy,
	},
	Llm?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | LlmKeySpecifier | (() => undefined | LlmKeySpecifier),
		fields?: LlmFieldPolicy,
	},
	Mutation?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | MutationKeySpecifier | (() => undefined | MutationKeySpecifier),
		fields?: MutationFieldPolicy,
	},
	Note?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | NoteKeySpecifier | (() => undefined | NoteKeySpecifier),
		fields?: NoteFieldPolicy,
	},
	PaginationInfo?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | PaginationInfoKeySpecifier | (() => undefined | PaginationInfoKeySpecifier),
		fields?: PaginationInfoFieldPolicy,
	},
	PersonContact?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | PersonContactKeySpecifier | (() => undefined | PersonContactKeySpecifier),
		fields?: PersonContactFieldPolicy,
	},
	PimCategory?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | PimCategoryKeySpecifier | (() => undefined | PimCategoryKeySpecifier),
		fields?: PimCategoryFieldPolicy,
	},
	PimProduct?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | PimProductKeySpecifier | (() => undefined | PimProductKeySpecifier),
		fields?: PimProductFieldPolicy,
	},
	PriceBook?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | PriceBookKeySpecifier | (() => undefined | PriceBookKeySpecifier),
		fields?: PriceBookFieldPolicy,
	},
	Project?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ProjectKeySpecifier | (() => undefined | ProjectKeySpecifier),
		fields?: ProjectFieldPolicy,
	},
	ProjectContact?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ProjectContactKeySpecifier | (() => undefined | ProjectContactKeySpecifier),
		fields?: ProjectContactFieldPolicy,
	},
	ProjectContactRelationCode?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ProjectContactRelationCodeKeySpecifier | (() => undefined | ProjectContactRelationCodeKeySpecifier),
		fields?: ProjectContactRelationCodeFieldPolicy,
	},
	ProjectStatusCode?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ProjectStatusCodeKeySpecifier | (() => undefined | ProjectStatusCodeKeySpecifier),
		fields?: ProjectStatusCodeFieldPolicy,
	},
	PurchaseOrder?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | PurchaseOrderKeySpecifier | (() => undefined | PurchaseOrderKeySpecifier),
		fields?: PurchaseOrderFieldPolicy,
	},
	PurchaseOrderFulfillmentProgress?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | PurchaseOrderFulfillmentProgressKeySpecifier | (() => undefined | PurchaseOrderFulfillmentProgressKeySpecifier),
		fields?: PurchaseOrderFulfillmentProgressFieldPolicy,
	},
	PurchaseOrderLineItemPriceEstimate?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | PurchaseOrderLineItemPriceEstimateKeySpecifier | (() => undefined | PurchaseOrderLineItemPriceEstimateKeySpecifier),
		fields?: PurchaseOrderLineItemPriceEstimateFieldPolicy,
	},
	PurchaseOrderListResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | PurchaseOrderListResultKeySpecifier | (() => undefined | PurchaseOrderListResultKeySpecifier),
		fields?: PurchaseOrderListResultFieldPolicy,
	},
	PurchaseOrderPricing?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | PurchaseOrderPricingKeySpecifier | (() => undefined | PurchaseOrderPricingKeySpecifier),
		fields?: PurchaseOrderPricingFieldPolicy,
	},
	Query?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | QueryKeySpecifier | (() => undefined | QueryKeySpecifier),
		fields?: QueryFieldPolicy,
	},
	Quote?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | QuoteKeySpecifier | (() => undefined | QuoteKeySpecifier),
		fields?: QuoteFieldPolicy,
	},
	QuoteRevision?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | QuoteRevisionKeySpecifier | (() => undefined | QuoteRevisionKeySpecifier),
		fields?: QuoteRevisionFieldPolicy,
	},
	QuoteRevisionRentalLineItem?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | QuoteRevisionRentalLineItemKeySpecifier | (() => undefined | QuoteRevisionRentalLineItemKeySpecifier),
		fields?: QuoteRevisionRentalLineItemFieldPolicy,
	},
	QuoteRevisionSaleLineItem?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | QuoteRevisionSaleLineItemKeySpecifier | (() => undefined | QuoteRevisionSaleLineItemKeySpecifier),
		fields?: QuoteRevisionSaleLineItemFieldPolicy,
	},
	QuoteRevisionServiceLineItem?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | QuoteRevisionServiceLineItemKeySpecifier | (() => undefined | QuoteRevisionServiceLineItemKeySpecifier),
		fields?: QuoteRevisionServiceLineItemFieldPolicy,
	},
	QuotesResponse?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | QuotesResponseKeySpecifier | (() => undefined | QuotesResponseKeySpecifier),
		fields?: QuotesResponseFieldPolicy,
	},
	RFQ?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RFQKeySpecifier | (() => undefined | RFQKeySpecifier),
		fields?: RFQFieldPolicy,
	},
	RFQRentalLineItem?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RFQRentalLineItemKeySpecifier | (() => undefined | RFQRentalLineItemKeySpecifier),
		fields?: RFQRentalLineItemFieldPolicy,
	},
	RFQSaleLineItem?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RFQSaleLineItemKeySpecifier | (() => undefined | RFQSaleLineItemKeySpecifier),
		fields?: RFQSaleLineItemFieldPolicy,
	},
	RFQServiceLineItem?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RFQServiceLineItemKeySpecifier | (() => undefined | RFQServiceLineItemKeySpecifier),
		fields?: RFQServiceLineItemFieldPolicy,
	},
	ReferenceNumberTemplate?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ReferenceNumberTemplateKeySpecifier | (() => undefined | ReferenceNumberTemplateKeySpecifier),
		fields?: ReferenceNumberTemplateFieldPolicy,
	},
	RentalFulfilment?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalFulfilmentKeySpecifier | (() => undefined | RentalFulfilmentKeySpecifier),
		fields?: RentalFulfilmentFieldPolicy,
	},
	RentalMaterializedView?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalMaterializedViewKeySpecifier | (() => undefined | RentalMaterializedViewKeySpecifier),
		fields?: RentalMaterializedViewFieldPolicy,
	},
	RentalPrice?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalPriceKeySpecifier | (() => undefined | RentalPriceKeySpecifier),
		fields?: RentalPriceFieldPolicy,
	},
	RentalPurchaseOrderLineItem?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalPurchaseOrderLineItemKeySpecifier | (() => undefined | RentalPurchaseOrderLineItemKeySpecifier),
		fields?: RentalPurchaseOrderLineItemFieldPolicy,
	},
	RentalSalesOrderLineItem?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalSalesOrderLineItemKeySpecifier | (() => undefined | RentalSalesOrderLineItemKeySpecifier),
		fields?: RentalSalesOrderLineItemFieldPolicy,
	},
	RentalTransaction?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalTransactionKeySpecifier | (() => undefined | RentalTransactionKeySpecifier),
		fields?: RentalTransactionFieldPolicy,
	},
	RentalViewAsset?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalViewAssetKeySpecifier | (() => undefined | RentalViewAssetKeySpecifier),
		fields?: RentalViewAssetFieldPolicy,
	},
	RentalViewAssetBranch?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalViewAssetBranchKeySpecifier | (() => undefined | RentalViewAssetBranchKeySpecifier),
		fields?: RentalViewAssetBranchFieldPolicy,
	},
	RentalViewAssetClass?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalViewAssetClassKeySpecifier | (() => undefined | RentalViewAssetClassKeySpecifier),
		fields?: RentalViewAssetClassFieldPolicy,
	},
	RentalViewAssetCompany?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalViewAssetCompanyKeySpecifier | (() => undefined | RentalViewAssetCompanyKeySpecifier),
		fields?: RentalViewAssetCompanyFieldPolicy,
	},
	RentalViewAssetDetails?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalViewAssetDetailsKeySpecifier | (() => undefined | RentalViewAssetDetailsKeySpecifier),
		fields?: RentalViewAssetDetailsFieldPolicy,
	},
	RentalViewAssetGroup?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalViewAssetGroupKeySpecifier | (() => undefined | RentalViewAssetGroupKeySpecifier),
		fields?: RentalViewAssetGroupFieldPolicy,
	},
	RentalViewAssetMake?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalViewAssetMakeKeySpecifier | (() => undefined | RentalViewAssetMakeKeySpecifier),
		fields?: RentalViewAssetMakeFieldPolicy,
	},
	RentalViewAssetModel?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalViewAssetModelKeySpecifier | (() => undefined | RentalViewAssetModelKeySpecifier),
		fields?: RentalViewAssetModelFieldPolicy,
	},
	RentalViewAssetPhoto?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalViewAssetPhotoKeySpecifier | (() => undefined | RentalViewAssetPhotoKeySpecifier),
		fields?: RentalViewAssetPhotoFieldPolicy,
	},
	RentalViewAssetTracker?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalViewAssetTrackerKeySpecifier | (() => undefined | RentalViewAssetTrackerKeySpecifier),
		fields?: RentalViewAssetTrackerFieldPolicy,
	},
	RentalViewAssetTspCompany?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalViewAssetTspCompanyKeySpecifier | (() => undefined | RentalViewAssetTspCompanyKeySpecifier),
		fields?: RentalViewAssetTspCompanyFieldPolicy,
	},
	RentalViewAssetType?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalViewAssetTypeKeySpecifier | (() => undefined | RentalViewAssetTypeKeySpecifier),
		fields?: RentalViewAssetTypeFieldPolicy,
	},
	RentalViewDetails?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalViewDetailsKeySpecifier | (() => undefined | RentalViewDetailsKeySpecifier),
		fields?: RentalViewDetailsFieldPolicy,
	},
	RentalViewOrder?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalViewOrderKeySpecifier | (() => undefined | RentalViewOrderKeySpecifier),
		fields?: RentalViewOrderFieldPolicy,
	},
	RentalViewStatus?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | RentalViewStatusKeySpecifier | (() => undefined | RentalViewStatusKeySpecifier),
		fields?: RentalViewStatusFieldPolicy,
	},
	ResourceMapResource?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ResourceMapResourceKeySpecifier | (() => undefined | ResourceMapResourceKeySpecifier),
		fields?: ResourceMapResourceFieldPolicy,
	},
	SaleFulfilment?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SaleFulfilmentKeySpecifier | (() => undefined | SaleFulfilmentKeySpecifier),
		fields?: SaleFulfilmentFieldPolicy,
	},
	SalePrice?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SalePriceKeySpecifier | (() => undefined | SalePriceKeySpecifier),
		fields?: SalePriceFieldPolicy,
	},
	SalePurchaseOrderLineItem?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SalePurchaseOrderLineItemKeySpecifier | (() => undefined | SalePurchaseOrderLineItemKeySpecifier),
		fields?: SalePurchaseOrderLineItemFieldPolicy,
	},
	SaleSalesOrderLineItem?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SaleSalesOrderLineItemKeySpecifier | (() => undefined | SaleSalesOrderLineItemKeySpecifier),
		fields?: SaleSalesOrderLineItemFieldPolicy,
	},
	SaleTransaction?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SaleTransactionKeySpecifier | (() => undefined | SaleTransactionKeySpecifier),
		fields?: SaleTransactionFieldPolicy,
	},
	SalesOrder?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SalesOrderKeySpecifier | (() => undefined | SalesOrderKeySpecifier),
		fields?: SalesOrderFieldPolicy,
	},
	SalesOrderLineItemPriceEstimate?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SalesOrderLineItemPriceEstimateKeySpecifier | (() => undefined | SalesOrderLineItemPriceEstimateKeySpecifier),
		fields?: SalesOrderLineItemPriceEstimateFieldPolicy,
	},
	SalesOrderListResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SalesOrderListResultKeySpecifier | (() => undefined | SalesOrderListResultKeySpecifier),
		fields?: SalesOrderListResultFieldPolicy,
	},
	SalesOrderPricing?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SalesOrderPricingKeySpecifier | (() => undefined | SalesOrderPricingKeySpecifier),
		fields?: SalesOrderPricingFieldPolicy,
	},
	ScopeOfWorkCode?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ScopeOfWorkCodeKeySpecifier | (() => undefined | ScopeOfWorkCodeKeySpecifier),
		fields?: ScopeOfWorkCodeFieldPolicy,
	},
	SearchDocument?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SearchDocumentKeySpecifier | (() => undefined | SearchDocumentKeySpecifier),
		fields?: SearchDocumentFieldPolicy,
	},
	SearchDocumentsResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SearchDocumentsResultKeySpecifier | (() => undefined | SearchDocumentsResultKeySpecifier),
		fields?: SearchDocumentsResultFieldPolicy,
	},
	SearchUserState?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SearchUserStateKeySpecifier | (() => undefined | SearchUserStateKeySpecifier),
		fields?: SearchUserStateFieldPolicy,
	},
	SearchUserStateFavorite?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SearchUserStateFavoriteKeySpecifier | (() => undefined | SearchUserStateFavoriteKeySpecifier),
		fields?: SearchUserStateFavoriteFieldPolicy,
	},
	SearchUserStateRecent?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SearchUserStateRecentKeySpecifier | (() => undefined | SearchUserStateRecentKeySpecifier),
		fields?: SearchUserStateRecentFieldPolicy,
	},
	SendTemplatedEmailResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SendTemplatedEmailResultKeySpecifier | (() => undefined | SendTemplatedEmailResultKeySpecifier),
		fields?: SendTemplatedEmailResultFieldPolicy,
	},
	SendTestEmailResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SendTestEmailResultKeySpecifier | (() => undefined | SendTestEmailResultKeySpecifier),
		fields?: SendTestEmailResultFieldPolicy,
	},
	SequenceNumber?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SequenceNumberKeySpecifier | (() => undefined | SequenceNumberKeySpecifier),
		fields?: SequenceNumberFieldPolicy,
	},
	ServiceFulfilment?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ServiceFulfilmentKeySpecifier | (() => undefined | ServiceFulfilmentKeySpecifier),
		fields?: ServiceFulfilmentFieldPolicy,
	},
	ServiceTask?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ServiceTaskKeySpecifier | (() => undefined | ServiceTaskKeySpecifier),
		fields?: ServiceTaskFieldPolicy,
	},
	ServiceTransaction?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ServiceTransactionKeySpecifier | (() => undefined | ServiceTransactionKeySpecifier),
		fields?: ServiceTransactionFieldPolicy,
	},
	SignedUploadUrl?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SignedUploadUrlKeySpecifier | (() => undefined | SignedUploadUrlKeySpecifier),
		fields?: SignedUploadUrlFieldPolicy,
	},
	SpiceDBObjectReference?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SpiceDBObjectReferenceKeySpecifier | (() => undefined | SpiceDBObjectReferenceKeySpecifier),
		fields?: SpiceDBObjectReferenceFieldPolicy,
	},
	SpiceDBRelationship?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SpiceDBRelationshipKeySpecifier | (() => undefined | SpiceDBRelationshipKeySpecifier),
		fields?: SpiceDBRelationshipFieldPolicy,
	},
	SpiceDBSubjectReference?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SpiceDBSubjectReferenceKeySpecifier | (() => undefined | SpiceDBSubjectReferenceKeySpecifier),
		fields?: SpiceDBSubjectReferenceFieldPolicy,
	},
	SubmissionSalesOrder?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SubmissionSalesOrderKeySpecifier | (() => undefined | SubmissionSalesOrderKeySpecifier),
		fields?: SubmissionSalesOrderFieldPolicy,
	},
	Subscription?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | SubscriptionKeySpecifier | (() => undefined | SubscriptionKeySpecifier),
		fields?: SubscriptionFieldPolicy,
	},
	TaxAnalysisResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | TaxAnalysisResultKeySpecifier | (() => undefined | TaxAnalysisResultKeySpecifier),
		fields?: TaxAnalysisResultFieldPolicy,
	},
	TaxLineItem?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | TaxLineItemKeySpecifier | (() => undefined | TaxLineItemKeySpecifier),
		fields?: TaxLineItemFieldPolicy,
	},
	TaxObligation?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | TaxObligationKeySpecifier | (() => undefined | TaxObligationKeySpecifier),
		fields?: TaxObligationFieldPolicy,
	},
	TouchAllContactsResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | TouchAllContactsResultKeySpecifier | (() => undefined | TouchAllContactsResultKeySpecifier),
		fields?: TouchAllContactsResultFieldPolicy,
	},
	TransactionLogEntry?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | TransactionLogEntryKeySpecifier | (() => undefined | TransactionLogEntryKeySpecifier),
		fields?: TransactionLogEntryFieldPolicy,
	},
	TransactionStatus?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | TransactionStatusKeySpecifier | (() => undefined | TransactionStatusKeySpecifier),
		fields?: TransactionStatusFieldPolicy,
	},
	User?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | UserKeySpecifier | (() => undefined | UserKeySpecifier),
		fields?: UserFieldPolicy,
	},
	UserLocationInfo?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | UserLocationInfoKeySpecifier | (() => undefined | UserLocationInfoKeySpecifier),
		fields?: UserLocationInfoFieldPolicy,
	},
	UserPermission?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | UserPermissionKeySpecifier | (() => undefined | UserPermissionKeySpecifier),
		fields?: UserPermissionFieldPolicy,
	},
	UserPermissionMap?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | UserPermissionMapKeySpecifier | (() => undefined | UserPermissionMapKeySpecifier),
		fields?: UserPermissionMapFieldPolicy,
	},
	ValidEnterpriseDomainResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | ValidEnterpriseDomainResultKeySpecifier | (() => undefined | ValidEnterpriseDomainResultKeySpecifier),
		fields?: ValidEnterpriseDomainResultFieldPolicy,
	},
	Workflow?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | WorkflowKeySpecifier | (() => undefined | WorkflowKeySpecifier),
		fields?: WorkflowFieldPolicy,
	},
	WorkflowColumn?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | WorkflowColumnKeySpecifier | (() => undefined | WorkflowColumnKeySpecifier),
		fields?: WorkflowColumnFieldPolicy,
	},
	WorkflowConfiguration?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | WorkflowConfigurationKeySpecifier | (() => undefined | WorkflowConfigurationKeySpecifier),
		fields?: WorkflowConfigurationFieldPolicy,
	},
	Workspace?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | WorkspaceKeySpecifier | (() => undefined | WorkspaceKeySpecifier),
		fields?: WorkspaceFieldPolicy,
	},
	WorkspaceMember?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | WorkspaceMemberKeySpecifier | (() => undefined | WorkspaceMemberKeySpecifier),
		fields?: WorkspaceMemberFieldPolicy,
	},
	WorkspaceRoleInfo?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | WorkspaceRoleInfoKeySpecifier | (() => undefined | WorkspaceRoleInfoKeySpecifier),
		fields?: WorkspaceRoleInfoFieldPolicy,
	},
	WriteRelationshipResult?: Omit<TypePolicy, "fields" | "keyFields"> & {
		keyFields?: false | WriteRelationshipResultKeySpecifier | (() => undefined | WriteRelationshipResultKeySpecifier),
		fields?: WriteRelationshipResultFieldPolicy,
	}
};
export type TypedTypePolicies = StrictTypedTypePolicies & TypePolicies;
export const ChargeFieldsFragmentDoc = gql`
    fragment ChargeFields on Charge {
  id
  amountInCents
  description
  chargeType
  contactId
  createdAt
  projectId
  salesOrderId
  purchaseOrderNumber
  salesOrderLineItemId
  fulfilmentId
  invoiceId
}
    `;
export const RentalFulfilmentFieldsFragmentDoc = gql`
    fragment RentalFulfilmentFields on RentalFulfilment {
  id
  contactId
  projectId
  salesOrderId
  salesOrderLineItemId
  purchaseOrderNumber
  salesOrderType
  workflowId
  workflowColumnId
  assignedToId
  createdAt
  updatedAt
  rentalStartDate
  rentalEndDate
  lastChargedAt
}
    `;
export const SaleFulfilmentFieldsFragmentDoc = gql`
    fragment SaleFulfilmentFields on SaleFulfilment {
  id
  contactId
  projectId
  salesOrderId
  salesOrderLineItemId
  purchaseOrderNumber
  salesOrderType
  workflowId
  workflowColumnId
  assignedToId
  createdAt
  updatedAt
  unitCostInCents
  quantity
  salesOrderLineItem {
    __typename
    ... on SaleSalesOrderLineItem {
      price {
        __typename
        ... on SalePrice {
          discounts
        }
      }
    }
  }
}
    `;
export const ServiceFulfilmentFieldsFragmentDoc = gql`
    fragment ServiceFulfilmentFields on ServiceFulfilment {
  id
  contactId
  projectId
  salesOrderId
  salesOrderLineItemId
  purchaseOrderNumber
  salesOrderType
  workflowId
  workflowColumnId
  assignedToId
  createdAt
  updatedAt
  serviceDate
}
    `;
export const ListInventoryForAssetTestDocument = gql`
    query ListInventoryForAssetTest($query: ListInventoryQuery) {
  listInventory(query: $query) {
    items {
      id
      status
      assetId
      isThirdPartyRental
      companyId
    }
  }
}
    `;
export const ListAssetsForAssetScheduleDocument = gql`
    query ListAssetsForAssetSchedule($limit: Int) {
  listAssets(page: {size: $limit}) {
    items {
      id
      description
      company_id
    }
  }
}
    `;
export const CreateProjectForAssetScheduleDocument = gql`
    mutation CreateProjectForAssetSchedule($input: ProjectInput) {
  createProject(input: $input) {
    id
    name
    project_code
    description
    deleted
  }
}
    `;
export const CreateAssetScheduleForAssetScheduleDocument = gql`
    mutation CreateAssetScheduleForAssetSchedule($input: AssetScheduleInput) {
  createAssetSchedule(input: $input) {
    id
    asset_id
    project_id
    company_id
    start_date
    end_date
    created_at
    created_by
    updated_at
    updated_by
  }
}
    `;
export const CreateWorkspaceForAuth0TestDocument = gql`
    mutation CreateWorkspaceForAuth0Test($name: String!, $accessType: WorkspaceAccessType!) {
  createWorkspace(name: $name, accessType: $accessType) {
    id
    name
  }
}
    `;
export const InviteUserToWorkspaceForAuth0TestDocument = gql`
    mutation InviteUserToWorkspaceForAuth0Test($workspaceId: String!, $email: String!, $roles: [WorkspaceUserRole!]!) {
  inviteUserToWorkspace(workspaceId: $workspaceId, email: $email, roles: $roles) {
    userId
    roles
  }
}
    `;
export const CreateChargeDocument = gql`
    mutation CreateCharge($input: CreateChargeInput!) {
  createCharge(input: $input) {
    ...ChargeFields
  }
}
    ${ChargeFieldsFragmentDoc}`;
export const CreateBusinessContact_BusinessMutationDocument = gql`
    mutation CreateBusinessContact_BusinessMutation($input: BusinessContactInput!) {
  createBusinessContact(input: $input) {
    id
    name
    phone
    address
    taxId
    website
    workspaceId
    contactType
  }
}
    `;
export const UpdateBusinessName_BusinessMutationDocument = gql`
    mutation UpdateBusinessName_BusinessMutation($id: ID!, $name: String!) {
  updateBusinessName(id: $id, name: $name) {
    id
    name
  }
}
    `;
export const UpdateBusinessPhone_BusinessMutationDocument = gql`
    mutation UpdateBusinessPhone_BusinessMutation($id: ID!, $phone: String!) {
  updateBusinessPhone(id: $id, phone: $phone) {
    id
    phone
  }
}
    `;
export const UpdateBusinessAddress_BusinessMutationDocument = gql`
    mutation UpdateBusinessAddress_BusinessMutation($id: ID!, $address: String!) {
  updateBusinessAddress(id: $id, address: $address) {
    id
    address
  }
}
    `;
export const UpdateBusinessTaxId_BusinessMutationDocument = gql`
    mutation UpdateBusinessTaxId_BusinessMutation($id: ID!, $taxId: String!) {
  updateBusinessTaxId(id: $id, taxId: $taxId) {
    id
    taxId
  }
}
    `;
export const UpdateBusinessWebsite_BusinessMutationDocument = gql`
    mutation UpdateBusinessWebsite_BusinessMutation($id: ID!, $website: String!) {
  updateBusinessWebsite(id: $id, website: $website) {
    id
    website
  }
}
    `;
export const GetContactById_BusinessMutationDocument = gql`
    query GetContactById_BusinessMutation($id: ID!) {
  getContactById(id: $id) {
    ... on BusinessContact {
      __typename
      id
      name
      phone
      address
      taxId
      website
    }
  }
}
    `;
export const CreatePersonContact_PersonMutationDocument = gql`
    mutation CreatePersonContact_PersonMutation($input: PersonContactInput!) {
  createPersonContact(input: $input) {
    id
    name
    email
    role
    phone
    businessId
    resourceMapIds
    workspaceId
  }
}
    `;
export const UpdatePersonName_PersonMutationDocument = gql`
    mutation UpdatePersonName_PersonMutation($id: ID!, $name: String!) {
  updatePersonName(id: $id, name: $name) {
    id
    name
  }
}
    `;
export const UpdatePersonPhone_PersonMutationDocument = gql`
    mutation UpdatePersonPhone_PersonMutation($id: ID!, $phone: String!) {
  updatePersonPhone(id: $id, phone: $phone) {
    id
    phone
  }
}
    `;
export const UpdatePersonEmail_PersonMutationDocument = gql`
    mutation UpdatePersonEmail_PersonMutation($id: ID!, $email: String!) {
  updatePersonEmail(id: $id, email: $email) {
    id
    email
  }
}
    `;
export const UpdatePersonRole_PersonMutationDocument = gql`
    mutation UpdatePersonRole_PersonMutation($id: ID!, $role: String!) {
  updatePersonRole(id: $id, role: $role) {
    id
    role
  }
}
    `;
export const UpdatePersonBusiness_PersonMutationDocument = gql`
    mutation UpdatePersonBusiness_PersonMutation($id: ID!, $businessId: ID!) {
  updatePersonBusiness(id: $id, businessId: $businessId) {
    id
    businessId
  }
}
    `;
export const UpdatePersonResourceMap_PersonMutationDocument = gql`
    mutation UpdatePersonResourceMap_PersonMutation($id: ID!, $resourceMapIds: [ID!]!) {
  updatePersonResourceMap(id: $id, resourceMapIds: $resourceMapIds) {
    id
    resourceMapIds
  }
}
    `;
export const GetContactById_PersonMutationDocument = gql`
    query GetContactById_PersonMutation($id: ID!) {
  getContactById(id: $id) {
    ... on PersonContact {
      __typename
      id
      name
      email
      role
      phone
      businessId
      resourceMapIds
    }
  }
}
    `;
export const CreateBusinessContactDocument = gql`
    mutation CreateBusinessContact($input: BusinessContactInput!) {
  createBusinessContact(input: $input) {
    id
    name
    workspaceId
    contactType
    createdBy
    createdAt
    updatedAt
    notes
    profilePicture
    phone
    address
    taxId
    website
    accountsPayableContactId
  }
}
    `;
export const CreatePersonContactDocument = gql`
    mutation CreatePersonContact($input: PersonContactInput!) {
  createPersonContact(input: $input) {
    id
    name
    workspaceId
    contactType
    createdBy
    createdAt
    updatedAt
    notes
    profilePicture
    phone
    email
    role
    businessId
    business {
      id
      name
    }
  }
}
    `;
export const UpdateBusinessContactDocument = gql`
    mutation UpdateBusinessContact($id: ID!, $input: UpdateBusinessContactInput!) {
  updateBusinessContact(id: $id, input: $input) {
    id
    name
    notes
    phone
    address
    taxId
    website
    accountsPayableContactId
    updatedAt
  }
}
    `;
export const UpdatePersonContactDocument = gql`
    mutation UpdatePersonContact($id: ID!, $input: UpdatePersonContactInput!) {
  updatePersonContact(id: $id, input: $input) {
    id
    name
    notes
    phone
    email
    role
    businessId
    updatedAt
  }
}
    `;
export const DeleteContactByIdDocument = gql`
    mutation DeleteContactById($id: ID!) {
  deleteContactById(id: $id)
}
    `;
export const GetContactByIdDocument = gql`
    query GetContactById($id: ID!) {
  getContactById(id: $id) {
    ... on BusinessContact {
      id
      name
      contactType
    }
    ... on PersonContact {
      id
      name
      contactType
      businessId
    }
  }
}
    `;
export const GetBusinessContactWithEmployeesDocument = gql`
    query GetBusinessContactWithEmployees($id: ID!) {
  getContactById(id: $id) {
    ... on BusinessContact {
      __typename
      id
      name
      contactType
      employees {
        items {
          id
          name
          email
          role
          businessId
        }
        page {
          number
          size
          totalItems
          totalPages
        }
      }
    }
    ... on PersonContact {
      __typename
      id
      name
      contactType
    }
  }
}
    `;
export const ListContactsDocument = gql`
    query ListContacts($filter: ListContactsFilter!) {
  listContacts(filter: $filter) {
    items {
      ... on BusinessContact {
        id
        name
        contactType
      }
      ... on PersonContact {
        id
        name
        contactType
        businessId
      }
    }
    page {
      number
      size
    }
  }
}
    `;
export const GetBusinessContactWithAssociatedPriceBooksDocument = gql`
    query GetBusinessContactWithAssociatedPriceBooks($id: ID!) {
  getContactById(id: $id) {
    ... on BusinessContact {
      __typename
      id
      name
      associatedPriceBooks {
        items {
          id
          name
          businessContactId
          workspaceId
        }
        page {
          number
          size
        }
      }
    }
  }
}
    `;
export const ValidEnterpriseDomainDocument = gql`
    query ValidEnterpriseDomain($domain: String!) {
  validEnterpriseDomain(domain: $domain) {
    isValid
    domain
    reason
  }
}
    `;
export const GetSignedUploadUrlDocument = gql`
    query GetSignedUploadUrl($contentType: SupportedContentType!, $originalFilename: String) {
  getSignedUploadUrl(
    contentType: $contentType
    originalFilename: $originalFilename
  ) {
    url
    key
  }
}
    `;
export const AddFileToEntityDocument = gql`
    mutation AddFileToEntity($workspaceId: String!, $parentEntityId: String!, $parentEntityType: ResourceTypes, $fileKey: String!, $fileName: String!, $metadata: JSON) {
  addFileToEntity(
    workspace_id: $workspaceId
    parent_entity_id: $parentEntityId
    parent_entity_type: $parentEntityType
    file_key: $fileKey
    file_name: $fileName
    metadata: $metadata
  ) {
    id
    workspace_id
    parent_entity_id
    file_key
    file_name
    file_size
    mime_type
    metadata
    created_at
    created_by
    updated_at
    updated_by
    deleted
    url
    created_by_user {
      id
      firstName
      lastName
    }
    updated_by_user {
      id
      firstName
      lastName
    }
  }
}
    `;
export const ListFilesByEntityIdDocument = gql`
    query ListFilesByEntityId($parentEntityId: String!, $workspaceId: String!) {
  listFilesByEntityId(
    parent_entity_id: $parentEntityId
    workspace_id: $workspaceId
  ) {
    id
    workspace_id
    parent_entity_id
    file_key
    file_name
    file_size
    mime_type
    metadata
    created_at
    created_by
    updated_at
    updated_by
    deleted
    url
  }
}
    `;
export const RenameFileDocument = gql`
    mutation RenameFile($fileId: String!, $newFileName: String!) {
  renameFile(file_id: $fileId, new_file_name: $newFileName) {
    id
    file_name
    updated_at
    updated_by
    updated_by_user {
      id
      firstName
      lastName
    }
  }
}
    `;
export const RemoveFileFromEntityDocument = gql`
    mutation RemoveFileFromEntity($fileId: String!) {
  removeFileFromEntity(file_id: $fileId) {
    id
    file_name
    deleted
    updated_at
    updated_by
  }
}
    `;
export const InviteUserToWorkspaceDocument = gql`
    mutation InviteUserToWorkspace($workspaceId: String!, $email: String!, $roles: [WorkspaceUserRole!]!) {
  inviteUserToWorkspace(workspaceId: $workspaceId, email: $email, roles: $roles) {
    userId
    roles
  }
}
    `;
export const AssignInventoryToRentalFulfilmentDocument = gql`
    mutation AssignInventoryToRentalFulfilment($fulfilmentId: ID!, $inventoryId: ID!, $allowOverlappingReservations: Boolean) {
  assignInventoryToRentalFulfilment(
    fulfilmentId: $fulfilmentId
    inventoryId: $inventoryId
    allowOverlappingReservations: $allowOverlappingReservations
  ) {
    __typename
    id
    inventoryId
  }
}
    `;
export const UnassignInventoryFromRentalFulfilmentDocument = gql`
    mutation UnassignInventoryFromRentalFulfilment($fulfilmentId: ID!) {
  unassignInventoryFromRentalFulfilment(fulfilmentId: $fulfilmentId) {
    __typename
    id
    inventoryId
  }
}
    `;
export const CreateInventoryForFulfilmentTestDocument = gql`
    mutation CreateInventoryForFulfilmentTest($input: CreateInventoryInput!) {
  createInventory(input: $input) {
    id
    companyId
    status
    pimCategoryId
    pimCategoryName
    assetId
  }
}
    `;
export const UtilListInventoryReservationsDocument = gql`
    query UtilListInventoryReservations($filter: ListInventoryReservationsFilter, $page: ListInventoryPage) {
  listInventoryReservations(filter: $filter, page: $page) {
    items {
      __typename
      ... on FulfilmentReservation {
        id
        inventoryId
        startDate
        endDate
        fulfilmentId
        type
        salesOrderType
      }
    }
  }
}
    `;
export const CreateRentalFulfilmentDocument = gql`
    mutation CreateRentalFulfilment($input: CreateRentalFulfilmentInput!) {
  createRentalFulfilment(input: $input) {
    ...RentalFulfilmentFields
  }
}
    ${RentalFulfilmentFieldsFragmentDoc}`;
export const CreateSaleFulfilmentDocument = gql`
    mutation CreateSaleFulfilment($input: CreateSaleFulfilmentInput!) {
  createSaleFulfilment(input: $input) {
    ...SaleFulfilmentFields
  }
}
    ${SaleFulfilmentFieldsFragmentDoc}`;
export const CreateServiceFulfilmentDocument = gql`
    mutation CreateServiceFulfilment($input: CreateServiceFulfilmentInput!) {
  createServiceFulfilment(input: $input) {
    ...ServiceFulfilmentFields
  }
}
    ${ServiceFulfilmentFieldsFragmentDoc}`;
export const DeleteFulfilmentDocument = gql`
    mutation DeleteFulfilment($id: ID!) {
  deleteFulfilment(id: $id)
}
    `;
export const GetFulfilmentByIdDocument = gql`
    query GetFulfilmentById($id: ID!) {
  getFulfilmentById(id: $id) {
    __typename
    ... on RentalFulfilment {
      ...RentalFulfilmentFields
    }
    ... on SaleFulfilment {
      ...SaleFulfilmentFields
    }
    ... on ServiceFulfilment {
      ...ServiceFulfilmentFields
    }
  }
}
    ${RentalFulfilmentFieldsFragmentDoc}
${SaleFulfilmentFieldsFragmentDoc}
${ServiceFulfilmentFieldsFragmentDoc}`;
export const ListFulfilmentsDocument = gql`
    query ListFulfilments($filter: ListFulfilmentsFilter!, $page: ListFulfilmentsPage) {
  listFulfilments(filter: $filter, page: $page) {
    items {
      __typename
      ... on RentalFulfilment {
        ...RentalFulfilmentFields
      }
      ... on SaleFulfilment {
        ...SaleFulfilmentFields
      }
      ... on ServiceFulfilment {
        ...ServiceFulfilmentFields
      }
    }
    page {
      number
      size
    }
  }
}
    ${RentalFulfilmentFieldsFragmentDoc}
${SaleFulfilmentFieldsFragmentDoc}
${ServiceFulfilmentFieldsFragmentDoc}`;
export const UpdateFulfilmentColumnDocument = gql`
    mutation UpdateFulfilmentColumn($fulfilmentId: ID!, $workflowColumnId: ID!, $workflowId: ID!) {
  updateFulfilmentColumn(
    fulfilmentId: $fulfilmentId
    workflowColumnId: $workflowColumnId
    workflowId: $workflowId
  ) {
    id
    workflowId
    workflowColumnId
    updatedAt
  }
}
    `;
export const UpdateFulfilmentAssigneeDocument = gql`
    mutation UpdateFulfilmentAssignee($fulfilmentId: ID!, $assignedToId: ID!) {
  updateFulfilmentAssignee(
    fulfilmentId: $fulfilmentId
    assignedToId: $assignedToId
  ) {
    id
    assignedToId
    updatedAt
  }
}
    `;
export const SetRentalStartDateDocument = gql`
    mutation SetRentalStartDate($fulfilmentId: ID!, $rentalStartDate: DateTime!) {
  setRentalStartDate(
    fulfilmentId: $fulfilmentId
    rentalStartDate: $rentalStartDate
  ) {
    id
    rentalStartDate
    rentalEndDate
    salesOrderType
  }
}
    `;
export const SetRentalEndDateDocument = gql`
    mutation SetRentalEndDate($fulfilmentId: ID!, $rentalEndDate: DateTime!) {
  setRentalEndDate(fulfilmentId: $fulfilmentId, rentalEndDate: $rentalEndDate) {
    id
    rentalStartDate
    rentalEndDate
    salesOrderType
  }
}
    `;
export const SetExpectedRentalEndDateDocument = gql`
    mutation SetExpectedRentalEndDate($fulfilmentId: ID!, $expectedRentalEndDate: DateTime!) {
  setExpectedRentalEndDate(
    fulfilmentId: $fulfilmentId
    expectedRentalEndDate: $expectedRentalEndDate
  ) {
    id
    expectedRentalEndDate
    rentalStartDate
    rentalEndDate
    salesOrderType
  }
}
    `;
export const CreateRentalPurchaseOrderLineItemDocument = gql`
    mutation CreateRentalPurchaseOrderLineItem($input: CreateRentalPurchaseOrderLineItemInput!) {
  createRentalPurchaseOrderLineItem(input: $input) {
    id
    purchase_order_id
    price_id
    po_quantity
  }
}
    `;
export const SetFulfilmentPurchaseOrderLineItemIdDocument = gql`
    mutation SetFulfilmentPurchaseOrderLineItemId($fulfilmentId: ID!, $purchaseOrderLineItemId: ID) {
  setFulfilmentPurchaseOrderLineItemId(
    fulfilmentId: $fulfilmentId
    purchaseOrderLineItemId: $purchaseOrderLineItemId
  ) {
    id
    purchaseOrderLineItemId
    purchaseOrderLineItem {
      __typename
      ... on RentalPurchaseOrderLineItem {
        id
        purchase_order_id
        purchaseOrder {
          id
          purchase_order_number
        }
      }
      ... on SalePurchaseOrderLineItem {
        id
        purchase_order_id
        purchaseOrder {
          id
          purchase_order_number
        }
      }
    }
    updatedAt
  }
}
    `;
export const ListChargesDocument = gql`
    query ListCharges($filter: ListChargesFilter!, $page: PageInfoInput) {
  listCharges(filter: $filter, page: $page) {
    items {
      id
      amountInCents
      description
      chargeType
      contactId
      createdAt
      projectId
      salesOrderId
      purchaseOrderNumber
      salesOrderLineItemId
      fulfilmentId
      invoiceId
      billingPeriodStart
      billingPeriodEnd
    }
  }
}
    `;
export const ListRentalFulfilmentsDocument = gql`
    query ListRentalFulfilments($filter: ListRentalFulfilmentsFilter!, $page: ListFulfilmentsPage) {
  listRentalFulfilments(filter: $filter, page: $page) {
    items {
      id
      contactId
      projectId
      salesOrderId
      salesOrderLineItemId
      purchaseOrderNumber
      salesOrderType
      workflowId
      workflowColumnId
      assignedToId
      createdAt
      updatedAt
      rentalStartDate
      rentalEndDate
      expectedRentalEndDate
      inventoryId
      pricePerDayInCents
      pricePerWeekInCents
      pricePerMonthInCents
      pimCategoryId
    }
    page {
      number
      size
      totalItems
      totalPages
    }
  }
}
    `;
export const GetDefaultTemplatesDocument = gql`
    query GetDefaultTemplates($workspaceId: String!) {
  getDefaultTemplates(workspaceId: $workspaceId) {
    id
    workspaceId
    type
    template
    seqPadding
    startAt
    resetFrequency
    useGlobalSequence
    createdBy
    createdAt
    updatedAt
    updatedBy
    businessContactId
    projectId
    deleted
  }
}
    `;
export const GetIntakeFormLineItemWithInventoryReservationsDocument = gql`
    query GetIntakeFormLineItemWithInventoryReservations($id: String!) {
  getIntakeFormSubmissionLineItem(id: $id) {
    id
    salesOrderLineItem {
      ... on RentalSalesOrderLineItem {
        id
      }
      ... on SaleSalesOrderLineItem {
        id
      }
    }
    fulfilmentId
    inventoryReservations {
      ... on FulfilmentReservation {
        id
        inventoryId
        startDate
        endDate
      }
    }
  }
}
    `;
export const SubmitSalesOrderForPortalTestDocument = gql`
    mutation SubmitSalesOrderForPortalTest($id: ID!) {
  submitSalesOrder(id: $id) {
    id
    status
  }
}
    `;
export const ListFulfilmentsForPortalTestDocument = gql`
    query ListFulfilmentsForPortalTest($filter: ListFulfilmentsFilter!) {
  listFulfilments(filter: $filter) {
    items {
      __typename
      ... on RentalFulfilment {
        id
        salesOrderLineItemId
        salesOrderType
        rentalStartDate
        rentalEndDate
        inventoryId
      }
      ... on SaleFulfilment {
        id
        salesOrderLineItemId
        salesOrderType
      }
      ... on ServiceFulfilment {
        id
        salesOrderLineItemId
        salesOrderType
      }
    }
  }
}
    `;
export const SetRentalStartDateForPortalTestDocument = gql`
    mutation SetRentalStartDateForPortalTest($fulfilmentId: ID!, $rentalStartDate: DateTime!) {
  setRentalStartDate(
    fulfilmentId: $fulfilmentId
    rentalStartDate: $rentalStartDate
  ) {
    id
    rentalStartDate
  }
}
    `;
export const SetRentalEndDateForPortalTestDocument = gql`
    mutation SetRentalEndDateForPortalTest($fulfilmentId: ID!, $rentalEndDate: DateTime!) {
  setRentalEndDate(fulfilmentId: $fulfilmentId, rentalEndDate: $rentalEndDate) {
    id
    rentalEndDate
  }
}
    `;
export const AssignInventoryForPortalTestDocument = gql`
    mutation AssignInventoryForPortalTest($fulfilmentId: ID!, $inventoryId: ID!) {
  assignInventoryToRentalFulfilment(
    fulfilmentId: $fulfilmentId
    inventoryId: $inventoryId
  ) {
    __typename
    id
    ... on RentalFulfilment {
      inventoryId
    }
  }
}
    `;
export const CreateInventoryForPortalTestDocument = gql`
    mutation CreateInventoryForPortalTest($input: CreateInventoryInput!) {
  createInventory(input: $input) {
    id
    status
  }
}
    `;
export const GetIntakeFormSubmissionByIdForPortalTestDocument = gql`
    query GetIntakeFormSubmissionByIdForPortalTest($id: String!) {
  getIntakeFormSubmissionById(id: $id) {
    id
    formId
    workspaceId
    name
    email
    status
    salesOrder {
      id
      status
      sales_order_number
      purchase_order_number
      project {
        id
        name
      }
    }
    lineItems {
      id
      description
      quantity
      type
      salesOrderLineItem {
        ... on RentalSalesOrderLineItem {
          id
          so_quantity
        }
        ... on SaleSalesOrderLineItem {
          id
          so_quantity
        }
      }
      fulfilmentId
      inventoryReservations {
        ... on FulfilmentReservation {
          id
          inventoryId
          startDate
          endDate
        }
      }
    }
  }
}
    `;
export const ListIntakeFormSubmissionLineItemsForPortalTestDocument = gql`
    query ListIntakeFormSubmissionLineItemsForPortalTest($submissionId: String!) {
  listIntakeFormSubmissionLineItems(submissionId: $submissionId) {
    id
    description
    quantity
    type
    salesOrderLineItem {
      ... on RentalSalesOrderLineItem {
        id
        so_quantity
      }
      ... on SaleSalesOrderLineItem {
        id
        so_quantity
      }
    }
    fulfilmentId
    inventoryReservations {
      ... on FulfilmentReservation {
        id
        inventoryId
        startDate
        endDate
      }
    }
  }
}
    `;
export const CreateIntakeFormDocument = gql`
    mutation CreateIntakeForm($input: IntakeFormInput!) {
  createIntakeForm(input: $input) {
    id
    workspaceId
    projectId
    pricebookId
    isPublic
    isActive
    isDeleted
    createdAt
    updatedAt
    sharedWithUserIds
    sharedWithUsers {
      id
      email
      firstName
      lastName
    }
  }
}
    `;
export const SetIntakeFormActiveDocument = gql`
    mutation SetIntakeFormActive($id: String!, $isActive: Boolean!) {
  setIntakeFormActive(id: $id, isActive: $isActive) {
    id
    isActive
    isDeleted
  }
}
    `;
export const DeleteIntakeFormDocument = gql`
    mutation DeleteIntakeForm($id: String!) {
  deleteIntakeForm(id: $id) {
    id
    isActive
    isDeleted
  }
}
    `;
export const GetIntakeFormByIdDocument = gql`
    query GetIntakeFormById($id: String!) {
  getIntakeFormById(id: $id) {
    id
    workspaceId
    workspace {
      id
      name
    }
    projectId
    isActive
    isDeleted
    createdAt
    updatedAt
    pricebook {
      listPrices(page: {size: 10}) {
        items {
          ... on RentalPrice {
            id
            pricePerDayInCents
            pricePerWeekInCents
            pricePerMonthInCents
          }
          ... on SalePrice {
            id
            unitCostInCents
          }
        }
      }
    }
  }
}
    `;
export const ListIntakeFormsDocument = gql`
    query ListIntakeForms($workspaceId: String!) {
  listIntakeForms(workspaceId: $workspaceId) {
    items {
      id
      workspaceId
      projectId
      isActive
      isDeleted
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
    `;
export const ListIntakeFormsWithWorkspaceDocument = gql`
    query ListIntakeFormsWithWorkspace($workspaceId: String!) {
  listIntakeForms(workspaceId: $workspaceId) {
    items {
      id
      workspaceId
      workspace {
        id
        companyId
        name
        bannerImageUrl
        logoUrl
      }
      projectId
      isActive
      isDeleted
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
    `;
export const CreateIntakeFormSubmissionDocument = gql`
    mutation CreateIntakeFormSubmission($input: IntakeFormSubmissionInput!) {
  createIntakeFormSubmission(input: $input) {
    id
    userId
    formId
    workspaceId
    name
    email
    createdAt
    phone
    companyName
    purchaseOrderNumber
    status
    submittedAt
    lineItems {
      id
      startDate
      description
      quantity
      durationInDays
      type
      pimCategoryId
      priceId
      customPriceName
      deliveryMethod
      deliveryLocation
      deliveryNotes
      rentalStartDate
      rentalEndDate
      salesOrderId
      salesOrderLineItem {
        ... on RentalSalesOrderLineItem {
          id
        }
        ... on SaleSalesOrderLineItem {
          id
        }
      }
    }
  }
}
    `;
export const ListIntakeFormSubmissionsDocument = gql`
    query ListIntakeFormSubmissions($workspaceId: String!, $intakeFormId: String) {
  listIntakeFormSubmissions(
    workspaceId: $workspaceId
    intakeFormId: $intakeFormId
  ) {
    items {
      id
      userId
      formId
      workspaceId
      buyerWorkspaceId
      name
      email
      createdAt
      phone
      companyName
      purchaseOrderNumber
      lineItems {
        id
        startDate
        description
        quantity
        durationInDays
        type
        pimCategoryId
        deliveryMethod
      }
    }
    page {
      number
      size
      totalItems
      totalPages
    }
  }
}
    `;
export const ListIntakeFormSubmissionsAsBuyerDocument = gql`
    query ListIntakeFormSubmissionsAsBuyer($buyerWorkspaceId: String!) {
  listIntakeFormSubmissionsAsBuyer(buyerWorkspaceId: $buyerWorkspaceId) {
    items {
      id
      userId
      formId
      workspaceId
      buyerWorkspaceId
      name
      email
      createdAt
      phone
      companyName
      purchaseOrderNumber
      lineItems {
        id
        startDate
        description
        quantity
        durationInDays
        type
        pimCategoryId
        deliveryMethod
      }
    }
    page {
      number
      size
      totalItems
      totalPages
    }
  }
}
    `;
export const UpdateIntakeFormSubmissionDocument = gql`
    mutation UpdateIntakeFormSubmission($id: String!, $input: UpdateIntakeFormSubmissionInput!) {
  updateIntakeFormSubmission(id: $id, input: $input) {
    id
    userId
    formId
    workspaceId
    name
    email
    createdAt
    phone
    companyName
    purchaseOrderNumber
    lineItems {
      id
      startDate
      description
      quantity
      durationInDays
      type
      pimCategoryId
      deliveryMethod
    }
  }
}
    `;
export const GetIntakeFormSubmissionLineItemDocument = gql`
    query GetIntakeFormSubmissionLineItem($id: String!) {
  getIntakeFormSubmissionLineItem(id: $id) {
    id
    startDate
    description
    quantity
    durationInDays
    type
    pimCategoryId
    priceId
    customPriceName
    deliveryMethod
    deliveryLocation
    deliveryNotes
    rentalStartDate
    rentalEndDate
    salesOrderId
    salesOrderLineItem {
      ... on RentalSalesOrderLineItem {
        id
      }
      ... on SaleSalesOrderLineItem {
        id
      }
    }
  }
}
    `;
export const ListIntakeFormSubmissionLineItemsDocument = gql`
    query ListIntakeFormSubmissionLineItems($submissionId: String!) {
  listIntakeFormSubmissionLineItems(submissionId: $submissionId) {
    id
    startDate
    description
    quantity
    durationInDays
    type
    pimCategoryId
    deliveryMethod
  }
}
    `;
export const CreateIntakeFormSubmissionLineItemDocument = gql`
    mutation CreateIntakeFormSubmissionLineItem($submissionId: String!, $input: IntakeFormLineItemInput!) {
  createIntakeFormSubmissionLineItem(submissionId: $submissionId, input: $input) {
    id
    startDate
    description
    quantity
    durationInDays
    type
    pimCategoryId
    priceId
    customPriceName
    deliveryMethod
    deliveryLocation
    deliveryNotes
    rentalStartDate
    rentalEndDate
    salesOrderId
    salesOrderLineItem {
      ... on RentalSalesOrderLineItem {
        id
      }
      ... on SaleSalesOrderLineItem {
        id
      }
    }
  }
}
    `;
export const UpdateIntakeFormSubmissionLineItemDocument = gql`
    mutation UpdateIntakeFormSubmissionLineItem($id: String!, $input: IntakeFormLineItemInput!) {
  updateIntakeFormSubmissionLineItem(id: $id, input: $input) {
    id
    startDate
    description
    quantity
    durationInDays
    type
    pimCategoryId
    priceId
    customPriceName
    deliveryMethod
    deliveryLocation
    deliveryNotes
    rentalStartDate
    rentalEndDate
    salesOrderId
    salesOrderLineItem {
      ... on RentalSalesOrderLineItem {
        id
      }
      ... on SaleSalesOrderLineItem {
        id
      }
    }
  }
}
    `;
export const DeleteIntakeFormSubmissionLineItemDocument = gql`
    mutation DeleteIntakeFormSubmissionLineItem($id: String!) {
  deleteIntakeFormSubmissionLineItem(id: $id)
}
    `;
export const SubmitIntakeFormSubmissionDocument = gql`
    mutation SubmitIntakeFormSubmission($id: String!) {
  submitIntakeFormSubmission(id: $id) {
    id
    status
    submittedAt
    name
    email
  }
}
    `;
export const GetIntakeFormSubmissionByIdDocument = gql`
    query GetIntakeFormSubmissionById($id: String!) {
  getIntakeFormSubmissionById(id: $id) {
    id
    userId
    formId
    workspaceId
    name
    email
    createdAt
    phone
    companyName
    purchaseOrderNumber
    status
    submittedAt
    lineItems {
      id
      startDate
      description
      quantity
      durationInDays
      type
      pimCategoryId
      deliveryMethod
    }
  }
}
    `;
export const UpdateIntakeFormDocument = gql`
    mutation UpdateIntakeForm($id: String!, $input: UpdateIntakeFormInput!) {
  updateIntakeForm(id: $id, input: $input) {
    id
    workspaceId
    projectId
    pricebookId
    isPublic
    sharedWithUserIds
    sharedWithUsers {
      id
      email
    }
    isActive
    isDeleted
    createdAt
    updatedAt
  }
}
    `;
export const ListIntakeFormsForUserDocument = gql`
    query ListIntakeFormsForUser($page: Int, $limit: Int) {
  listIntakeFormsForUser(page: $page, limit: $limit) {
    items {
      id
      workspaceId
      projectId
      pricebookId
      isPublic
      sharedWithUserIds
      isActive
      isDeleted
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
    `;
export const AdoptOrphanedSubmissionsDocument = gql`
    mutation AdoptOrphanedSubmissions($workspaceId: String!, $submissionIds: [ID!]) {
  adoptOrphanedSubmissions(
    workspaceId: $workspaceId
    submissionIds: $submissionIds
  ) {
    adoptedCount
    adoptedSubmissionIds
    adoptedSubmissions {
      id
      userId
      formId
      workspaceId
      buyerWorkspaceId
      name
      email
    }
  }
}
    `;
export const ListMyOrphanedSubmissionsDocument = gql`
    query ListMyOrphanedSubmissions {
  listMyOrphanedSubmissions {
    id
    userId
    formId
    workspaceId
    buyerWorkspaceId
    name
    email
  }
}
    `;
export const CreatePoForLineItemInventoryDocument = gql`
    mutation CreatePOForLineItemInventory($input: PurchaseOrderInput) {
  createPurchaseOrder(input: $input) {
    id
    purchase_order_number
  }
}
    `;
export const CreateSaleLineItemForInventoryDocument = gql`
    mutation CreateSaleLineItemForInventory($input: CreateSalePurchaseOrderLineItemInput) {
  createSalePurchaseOrderLineItem(input: $input) {
    id
    purchase_order_id
    lineitem_type
  }
}
    `;
export const GetLineItemWithInventoryDocument = gql`
    query GetLineItemWithInventory($id: String!) {
  getPurchaseOrderLineItemById(id: $id) {
    __typename
    ... on SalePurchaseOrderLineItem {
      id
      inventory {
        id
        status
        purchaseOrderLineItemId
      }
    }
  }
}
    `;
export const CreatePoForFulfillmentDocument = gql`
    mutation CreatePOForFulfillment($input: PurchaseOrderInput) {
  createPurchaseOrder(input: $input) {
    id
    purchase_order_number
  }
}
    `;
export const GetPoWithFulfillmentProgressDocument = gql`
    query GetPOWithFulfillmentProgress($id: String!) {
  getPurchaseOrderById(id: $id) {
    id
    inventory {
      id
      status
    }
    fulfillmentProgress {
      totalItems
      receivedItems
      onOrderItems
      fulfillmentPercentage
      isFullyFulfilled
      isPartiallyFulfilled
      status
    }
  }
}
    `;
export const CreatePoFullyFulfilledDocument = gql`
    mutation CreatePOFullyFulfilled($input: PurchaseOrderInput) {
  createPurchaseOrder(input: $input) {
    id
  }
}
    `;
export const GetFullyFulfilledPoDocument = gql`
    query GetFullyFulfilledPO($id: String!) {
  getPurchaseOrderById(id: $id) {
    id
    fulfillmentProgress {
      totalItems
      receivedItems
      onOrderItems
      fulfillmentPercentage
      isFullyFulfilled
      isPartiallyFulfilled
      status
    }
  }
}
    `;
export const CreatePoNoInventoryDocument = gql`
    mutation CreatePONoInventory($input: PurchaseOrderInput) {
  createPurchaseOrder(input: $input) {
    id
  }
}
    `;
export const GetEmptyPoDocument = gql`
    query GetEmptyPO($id: String!) {
  getPurchaseOrderById(id: $id) {
    id
    inventory {
      id
    }
    fulfillmentProgress {
      totalItems
      receivedItems
      onOrderItems
      fulfillmentPercentage
      isFullyFulfilled
      isPartiallyFulfilled
      status
    }
  }
}
    `;
export const CreateInventoryWithReturnDatesDocument = gql`
    mutation CreateInventoryWithReturnDates($input: CreateInventoryInput!) {
  createInventory(input: $input) {
    id
    companyId
    status
    isThirdPartyRental
    expectedReturnDate
    actualReturnDate
    createdAt
    updatedAt
    createdBy
    updatedBy
  }
}
    `;
export const UpdateInventoryExpectedReturnDateDocument = gql`
    mutation UpdateInventoryExpectedReturnDate($id: String!, $expectedReturnDate: DateTime!) {
  updateInventoryExpectedReturnDate(
    id: $id
    expectedReturnDate: $expectedReturnDate
  ) {
    id
    companyId
    status
    isThirdPartyRental
    expectedReturnDate
    actualReturnDate
    updatedAt
    updatedBy
  }
}
    `;
export const UpdateInventoryActualReturnDateDocument = gql`
    mutation UpdateInventoryActualReturnDate($id: String!, $actualReturnDate: DateTime!) {
  updateInventoryActualReturnDate(id: $id, actualReturnDate: $actualReturnDate) {
    id
    companyId
    status
    isThirdPartyRental
    expectedReturnDate
    actualReturnDate
    updatedAt
    updatedBy
  }
}
    `;
export const GetInventoryWithReturnDatesDocument = gql`
    query GetInventoryWithReturnDates($id: String!) {
  inventoryById(id: $id) {
    id
    companyId
    status
    isThirdPartyRental
    expectedReturnDate
    actualReturnDate
    createdAt
    updatedAt
    createdBy
    updatedBy
  }
}
    `;
export const CreateInventoryDocument = gql`
    mutation CreateInventory($input: CreateInventoryInput!) {
  createInventory(input: $input) {
    id
    companyId
    workspaceId
    status
    fulfilmentId
    purchaseOrderId
    purchaseOrderLineItemId
    isThirdPartyRental
    assetId
    pimCategoryId
    pimCategoryPath
    pimCategoryName
    pimProductId
    createdAt
    updatedAt
    createdBy
    updatedBy
  }
}
    `;
export const BulkMarkInventoryReceivedDocument = gql`
    mutation BulkMarkInventoryReceived($input: BulkMarkInventoryReceivedInput!) {
  bulkMarkInventoryReceived(input: $input) {
    items {
      id
      companyId
      status
      fulfilmentId
      purchaseOrderId
      purchaseOrderLineItemId
      isThirdPartyRental
      assetId
      pimCategoryId
      pimCategoryPath
      pimCategoryName
      pimProductId
      receivedAt
      receiptNotes
      resourceMapId
      conditionOnReceipt
      conditionNotes
      updatedAt
      updatedBy
    }
    totalProcessed
  }
}
    `;
export const UpdateInventorySerialisedIdDocument = gql`
    mutation UpdateInventorySerialisedId($id: String!, $input: UpdateInventorySerialisedIdInput!) {
  updateInventorySerialisedId(id: $id, input: $input) {
    id
    companyId
    status
    assetId
    updatedAt
    updatedBy
  }
}
    `;
export const DeleteInventoryDocument = gql`
    mutation DeleteInventory($id: String!, $input: DeleteInventoryInput!) {
  deleteInventory(id: $id, input: $input)
}
    `;
export const InventoryByIdDocument = gql`
    query InventoryById($id: String!) {
  inventoryById(id: $id) {
    id
    companyId
    workspaceId
    status
    fulfilmentId
    purchaseOrderId
    purchaseOrderLineItemId
    isThirdPartyRental
    assetId
    pimCategoryId
    pimCategoryPath
    pimCategoryName
    pimProductId
    createdAt
    updatedAt
    createdBy
    updatedBy
    purchaseOrderLineItem {
      ... on SalePurchaseOrderLineItem {
        id
        purchase_order_id
        lineitem_type
        po_quantity
        po_pim_id
      }
      ... on RentalPurchaseOrderLineItem {
        id
        purchase_order_id
        lineitem_type
        po_quantity
        po_pim_id
      }
    }
  }
}
    `;
export const ListInventoryItemsDocument = gql`
    query ListInventoryItems($query: ListInventoryQuery) {
  listInventory(query: $query) {
    items {
      id
      companyId
      workspaceId
      status
      fulfilmentId
      purchaseOrderId
      purchaseOrderLineItemId
      isThirdPartyRental
      assetId
      pimCategoryId
      pimCategoryPath
      pimCategoryName
      pimProductId
      createdAt
      updatedAt
      createdBy
      updatedBy
      purchaseOrderLineItem {
        ... on SalePurchaseOrderLineItem {
          id
          purchase_order_id
          lineitem_type
          po_quantity
          po_pim_id
        }
        ... on RentalPurchaseOrderLineItem {
          id
          purchase_order_id
          lineitem_type
          po_quantity
          po_pim_id
        }
      }
    }
  }
}
    `;
export const ListInventoryGroupedByPimCategoryIdDocument = gql`
    query ListInventoryGroupedByPimCategoryId($query: ListInventoryQuery) {
  listInventoryGroupedByPimCategoryId(query: $query) {
    items {
      pimCategoryId
      pimCategoryName
      pimCategoryPath
      quantityOnOrder
      quantityReceived
      totalQuantity
      sampleInventoryIds
      sampleInventories {
        id
        status
        pimProductId
        pimCategoryId
        isThirdPartyRental
        assetId
        asset {
          id
          name
          pim_product_id
          pim_category_id
          pim_category_name
        }
      }
    }
  }
}
    `;
export const CreateWorkspaceForInvoiceDocument = gql`
    mutation CreateWorkspaceForInvoice($name: String!, $accessType: WorkspaceAccessType!) {
  createWorkspace(name: $name, accessType: $accessType) {
    id
    name
  }
}
    `;
export const AddTaxLineItemDocument = gql`
    mutation AddTaxLineItem($input: AddTaxLineItemInput!) {
  addTaxLineItem(input: $input) {
    id
    taxLineItems {
      id
      description
      type
      value
      calculatedAmountInCents
      order
    }
    totalTaxesInCents
    finalSumInCents
  }
}
    `;
export const UpdateTaxLineItemDocument = gql`
    mutation UpdateTaxLineItem($input: UpdateTaxLineItemInput!) {
  updateTaxLineItem(input: $input) {
    id
    taxLineItems {
      id
      description
      type
      value
      calculatedAmountInCents
      order
    }
    totalTaxesInCents
    finalSumInCents
  }
}
    `;
export const RemoveTaxLineItemDocument = gql`
    mutation RemoveTaxLineItem($input: RemoveTaxLineItemInput!) {
  removeTaxLineItem(input: $input) {
    id
    taxLineItems {
      id
      description
      type
      value
      calculatedAmountInCents
      order
    }
    totalTaxesInCents
    finalSumInCents
  }
}
    `;
export const ClearInvoiceTaxesDocument = gql`
    mutation ClearInvoiceTaxes($invoiceId: ID!) {
  clearInvoiceTaxes(invoiceId: $invoiceId) {
    id
    taxLineItems {
      id
    }
    totalTaxesInCents
    finalSumInCents
  }
}
    `;
export const InvoiceByIdWithTaxesDocument = gql`
    query InvoiceByIdWithTaxes($id: String!) {
  invoiceById(id: $id) {
    id
    status
    invoicePaidDate
    updatedBy
    subTotalInCents
    taxesInCents
    finalSumInCents
    taxPercent
    totalTaxesInCents
    taxLineItems {
      id
      description
      type
      value
      calculatedAmountInCents
      order
    }
    lineItems {
      chargeId
      description
      totalInCents
    }
  }
}
    `;
export const CreateInvoiceDocument = gql`
    mutation CreateInvoice($input: CreateInvoiceInput!) {
  createInvoice(input: $input) {
    id
    status
    buyerId
    sellerId
    companyId
    invoiceSentDate
    updatedBy
  }
}
    `;
export const MarkInvoiceAsSentDocument = gql`
    mutation MarkInvoiceAsSent($input: MarkInvoiceAsSentInput!) {
  markInvoiceAsSent(input: $input) {
    id
    status
    invoiceSentDate
    updatedBy
  }
}
    `;
export const DeleteInvoiceDocument = gql`
    mutation DeleteInvoice($id: String!) {
  deleteInvoice(id: $id)
}
    `;
export const MarkInvoiceAsPaidDocument = gql`
    mutation MarkInvoiceAsPaid($input: MarkInvoiceAsPaidInput!) {
  markInvoiceAsPaid(input: $input) {
    id
    status
    invoicePaidDate
    updatedBy
  }
}
    `;
export const CancelInvoiceDocument = gql`
    mutation CancelInvoice($input: CancelInvoiceInput!) {
  cancelInvoice(input: $input) {
    id
    status
    updatedBy
  }
}
    `;
export const InvoiceByIdDocument = gql`
    query InvoiceById($id: String!) {
  invoiceById(id: $id) {
    id
    status
    invoicePaidDate
    updatedBy
    subTotalInCents
    taxesInCents
    finalSumInCents
    taxPercent
    lineItems {
      chargeId
      description
      totalInCents
      charge {
        id
        amountInCents
        description
        chargeType
        contactId
        invoiceId
      }
    }
  }
}
    `;
export const AddInvoiceChargesDocument = gql`
    mutation AddInvoiceCharges($input: AddInvoiceChargesInput!) {
  addInvoiceCharges(input: $input) {
    id
    lineItems {
      chargeId
      description
      totalInCents
    }
  }
}
    `;
export const CreateChargeForInvoiceDocument = gql`
    mutation CreateChargeForInvoice($input: CreateChargeInput!) {
  createCharge(input: $input) {
    id
    amountInCents
    description
    chargeType
    contactId
    invoiceId
  }
}
    `;
export const ListChargesForInvoiceDocument = gql`
    query ListChargesForInvoice($filter: ListChargesFilter!, $page: PageInfoInput) {
  listCharges(filter: $filter, page: $page) {
    items {
      id
      amountInCents
      description
      chargeType
      contactId
      invoiceId
    }
    page {
      number
      size
      totalItems
      totalPages
    }
  }
}
    `;
export const CreateProjectForMcpDocument = gql`
    mutation CreateProjectForMCP($input: ProjectInput!) {
  createProject(input: $input) {
    id
    name
    workspaceId
  }
}
    `;
export const CreateBusinessContactForMcpDocument = gql`
    mutation CreateBusinessContactForMCP($input: BusinessContactInput!) {
  createBusinessContact(input: $input) {
    id
    name
    workspaceId
  }
}
    `;
export const CreatePersonContactForMcpDocument = gql`
    mutation CreatePersonContactForMCP($input: PersonContactInput!) {
  createPersonContact(input: $input) {
    id
    name
    email
    businessId
    workspaceId
  }
}
    `;
export const CreatePimCategoryForMcpDocument = gql`
    mutation CreatePimCategoryForMCP($input: UpsertPimCategoryInput!) {
  upsertPimCategory(input: $input) {
    id
    name
  }
}
    `;
export const CreatePriceBookForMcpDocument = gql`
    mutation CreatePriceBookForMCP($input: CreatePriceBookInput!) {
  createPriceBook(input: $input) {
    id
    name
    workspaceId
  }
}
    `;
export const CreateRentalPriceForMcpDocument = gql`
    mutation CreateRentalPriceForMCP($input: CreateRentalPriceInput!) {
  createRentalPrice(input: $input) {
    id
    name
    priceType
    priceBookId
  }
}
    `;
export const GetNoteByIdDocument = gql`
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
export const CreateNoteDocument = gql`
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
export const ListNotesByEntityIdDocument = gql`
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
export const UpdateNoteDocument = gql`
    mutation UpdateNote($id: String!, $value: JSON!) {
  updateNote(id: $id, value: $value) {
    _id
    workspace_id
    value
    updated_at
  }
}
    `;
export const DeleteNoteDocument = gql`
    mutation DeleteNote($id: String!) {
  deleteNote(id: $id) {
    _id
    deleted
  }
}
    `;
export const CreatePimCategoryForPriceBooksDocument = gql`
    mutation CreatePimCategoryForPriceBooks($input: UpsertPimCategoryInput!) {
  upsertPimCategory(input: $input) {
    id
    name
  }
}
    `;
export const CreatePriceBookDocument = gql`
    mutation CreatePriceBook($input: CreatePriceBookInput!) {
  createPriceBook(input: $input) {
    id
    name
  }
}
    `;
export const UpdatePriceBookDocument = gql`
    mutation UpdatePriceBook($input: UpdatePriceBookInput!) {
  updatePriceBook(input: $input) {
    id
    name
    notes
    location
    businessContactId
    projectId
    updatedAt
  }
}
    `;
export const ListPriceBooksDocument = gql`
    query ListPriceBooks($filter: ListPriceBooksFilter!, $page: ListPriceBooksPage!) {
  listPriceBooks(filter: $filter, page: $page) {
    items {
      id
      name
    }
    page {
      number
      size
    }
  }
}
    `;
export const GetPriceBookByIdDocument = gql`
    query GetPriceBookById($id: ID!) {
  getPriceBookById(id: $id) {
    id
    name
    updatedAt
  }
}
    `;
export const ListPriceBookCategoriesDocument = gql`
    query ListPriceBookCategories($workspaceId: ID!, $priceBookId: String) {
  listPriceBookCategories(workspaceId: $workspaceId, priceBookId: $priceBookId) {
    id
    name
  }
}
    `;
export const DeletePriceBookByIdDocument = gql`
    mutation DeletePriceBookById($id: ID!) {
  deletePriceBookById(id: $id)
}
    `;
export const CreateRentalPriceForPriceBooksDocument = gql`
    mutation CreateRentalPriceForPriceBooks($input: CreateRentalPriceInput!) {
  createRentalPrice(input: $input) {
    id
    priceBookId
    pimCategoryId
  }
}
    `;
export const CreatePimCategoryForPricesDocument = gql`
    mutation CreatePimCategoryForPrices($input: UpsertPimCategoryInput!) {
  upsertPimCategory(input: $input) {
    id
    name
  }
}
    `;
export const CreatePriceBookForPricesDocument = gql`
    mutation CreatePriceBookForPrices($input: CreatePriceBookInput!) {
  createPriceBook(input: $input) {
    id
    name
  }
}
    `;
export const CreateRentalPriceForPricesDocument = gql`
    mutation CreateRentalPriceForPrices($input: CreateRentalPriceInput!) {
  createRentalPrice(input: $input) {
    id
    priceBookId
    pimCategoryId
    pimCategoryName
    pimCategoryPath
    pricePerDayInCents
  }
}
    `;
export const CreateSalePriceForPricesDocument = gql`
    mutation CreateSalePriceForPrices($input: CreateSalePriceInput!) {
  createSalePrice(input: $input) {
    id
    priceBookId
    pimCategoryId
    pimCategoryName
    pimCategoryPath
    unitCostInCents
  }
}
    `;
export const ListPricesDocument = gql`
    query ListPrices($filter: ListPricesFilter!, $page: ListPricesPage!) {
  listPrices(filter: $filter, page: $page) {
    items {
      ... on RentalPrice {
        id
        priceBookId
        pimCategoryId
        pricePerDayInCents
      }
      ... on SalePrice {
        id
        priceBookId
        pimCategoryId
        unitCostInCents
      }
    }
    page {
      number
      size
    }
  }
}
    `;
export const DeletePriceByIdDocument = gql`
    mutation DeletePriceById($id: ID!) {
  deletePriceById(id: $id)
}
    `;
export const CreateBusinessContactForPricesDocument = gql`
    mutation CreateBusinessContactForPrices($input: BusinessContactInput!) {
  createBusinessContact(input: $input) {
    id
    name
  }
}
    `;
export const CreateProjectForPricesDocument = gql`
    mutation CreateProjectForPrices($input: ProjectInput) {
  createProject(input: $input) {
    id
    name
    project_code
  }
}
    `;
export const CalculateSubTotalDocument = gql`
    query CalculateSubTotal($priceId: ID!, $durationInDays: Int!) {
  calculateSubTotal(priceId: $priceId, durationInDays: $durationInDays) {
    accumulative_cost_in_cents
    days {
      day
      accumulative_cost_in_cents
      cost_in_cents
      strategy
      rental_period {
        days1
        days7
        days28
      }
      savings_compared_to_day_rate_in_cents
      savings_compared_to_day_rate_in_fraction
      savings_compared_to_exact_split_in_cents
    }
  }
}
    `;
export const GetRentalPriceWithCalculateSubTotalDocument = gql`
    query GetRentalPriceWithCalculateSubTotal($priceId: ID!, $durationInDays: Int!) {
  getPriceById(id: $priceId) {
    __typename
    ... on RentalPrice {
      id
      pricePerDayInCents
      pricePerWeekInCents
      pricePerMonthInCents
      calculateSubTotal(durationInDays: $durationInDays) {
        accumulative_cost_in_cents
        days {
          day
          accumulative_cost_in_cents
          cost_in_cents
          strategy
        }
      }
    }
  }
}
    `;
export const GetPriceByIdDocument = gql`
    query GetPriceById($id: ID!) {
  getPriceById(id: $id) {
    ... on RentalPrice {
      id
      pricePerDayInCents
      pricePerWeekInCents
      pricePerMonthInCents
    }
    ... on SalePrice {
      id
      unitCostInCents
    }
  }
}
    `;
export const ListProjectsDocument = gql`
    query ListProjects($workspaceId: String!) {
  listProjects(workspaceId: $workspaceId) {
    id
    name
    project_code
    description
    deleted
    scope_of_work
    project_contacts {
      contact_id
      relation_to_project
    }
  }
}
    `;
export const DeleteProjectDocument = gql`
    mutation DeleteProject($id: String!) {
  deleteProject(id: $id) {
    id
    scope_of_work
    project_contacts {
      contact_id
      relation_to_project
    }
  }
}
    `;
export const CreateProjectDocument = gql`
    mutation CreateProject($input: ProjectInput) {
  createProject(input: $input) {
    id
    name
    project_code
    description
    created_by
    created_at
    updated_at
    deleted
    scope_of_work
    status
    project_contacts {
      contact_id
      relation_to_project
    }
  }
}
    `;
export const UpdateProjectDocument = gql`
    mutation UpdateProject($id: String!, $input: ProjectInput) {
  updateProject(id: $id, input: $input) {
    id
    name
    project_code
    description
    created_by
    created_at
    updated_at
    deleted
    scope_of_work
    status
    project_contacts {
      contact_id
      relation_to_project
    }
  }
}
    `;
export const GetProjectByIdDocument = gql`
    query GetProjectById($id: String!) {
  getProjectById(id: $id) {
    id
    name
    project_code
    description
    created_by
    created_at
    updated_at
    deleted
    scope_of_work
    status
    project_contacts {
      contact_id
      relation_to_project
    }
  }
}
    `;
export const GetProjectWithContactDocument = gql`
    query GetProjectWithContact($id: String!) {
  getProjectById(id: $id) {
    id
    name
    project_contacts {
      contact_id
      relation_to_project
      contact {
        ... on BusinessContact {
          id
          name
          contactType
        }
        ... on PersonContact {
          id
          name
          contactType
          businessId
        }
      }
    }
  }
}
    `;
export const GetProjectWithAssociatedPriceBooksDocument = gql`
    query GetProjectWithAssociatedPriceBooks($id: String!) {
  getProjectById(id: $id) {
    id
    name
    project_code
    associatedPriceBooks {
      items {
        id
        name
        projectId
        workspaceId
      }
      page {
        number
        size
      }
    }
  }
}
    `;
export const GetProjectWithDescendantCountDocument = gql`
    query GetProjectWithDescendantCount($id: String!) {
  getProjectById(id: $id) {
    id
    name
    project_code
    parent_project
    totalDescendantCount
    sub_projects {
      id
      name
      totalDescendantCount
    }
  }
}
    `;
export const CreatePurchaseOrderForFulfilmentTestDocument = gql`
    mutation CreatePurchaseOrderForFulfilmentTest($input: PurchaseOrderInput) {
  createPurchaseOrder(input: $input) {
    id
    purchase_order_number
    seller_id
    project_id
    company_id
    status
  }
}
    `;
export const CreateRentalPoLineItemForFulfilmentTestDocument = gql`
    mutation CreateRentalPOLineItemForFulfilmentTest($input: CreateRentalPurchaseOrderLineItemInput) {
  createRentalPurchaseOrderLineItem(input: $input) {
    id
    purchase_order_id
    po_pim_id
    po_quantity
    lineitem_type
  }
}
    `;
export const CreateSalesOrderForFulfilmentTestDocument = gql`
    mutation CreateSalesOrderForFulfilmentTest($input: SalesOrderInput) {
  createSalesOrder(input: $input) {
    id
    purchase_order_number
    buyer_id
    company_id
    status
  }
}
    `;
export const CreateRentalSoLineItemForFulfilmentTestDocument = gql`
    mutation CreateRentalSOLineItemForFulfilmentTest($input: CreateRentalSalesOrderLineItemInput!) {
  createRentalSalesOrderLineItem(input: $input) {
    id
    sales_order_id
    so_pim_id
    so_quantity
    lineitem_type
  }
}
    `;
export const CreateRentalPriceForFulfilmentTestDocument = gql`
    mutation CreateRentalPriceForFulfilmentTest($input: CreateRentalPriceInput!) {
  createRentalPrice(input: $input) {
    id
    name
    priceType
  }
}
    `;
export const CreatePimCategoryForTestDocument = gql`
    mutation CreatePimCategoryForTest($input: UpsertPimCategoryInput!) {
  upsertPimCategory(input: $input) {
    id
    name
    path
  }
}
    `;
export const CreateRentalFulfilmentForTestDocument = gql`
    mutation CreateRentalFulfilmentForTest($input: CreateRentalFulfilmentInput!) {
  createRentalFulfilment(input: $input) {
    ... on RentalFulfilment {
      id
      salesOrderId
      salesOrderLineItemId
      inventoryId
      purchaseOrderLineItemId
    }
  }
}
    `;
export const SetFulfilmentPurchaseOrderLineItemForTestDocument = gql`
    mutation SetFulfilmentPurchaseOrderLineItemForTest($fulfilmentId: ID!, $purchaseOrderLineItemId: ID) {
  setFulfilmentPurchaseOrderLineItemId(
    fulfilmentId: $fulfilmentId
    purchaseOrderLineItemId: $purchaseOrderLineItemId
  ) {
    id
    purchaseOrderLineItemId
    ... on RentalFulfilment {
      inventoryId
    }
  }
}
    `;
export const SubmitPurchaseOrderForFulfilmentTestDocument = gql`
    mutation SubmitPurchaseOrderForFulfilmentTest($id: ID!) {
  submitPurchaseOrder(id: $id) {
    id
    status
  }
}
    `;
export const ListRentalFulfilmentsForTestDocument = gql`
    query ListRentalFulfilmentsForTest($filter: ListRentalFulfilmentsFilter!) {
  listRentalFulfilments(filter: $filter) {
    items {
      id
      salesOrderId
      salesOrderLineItemId
      inventoryId
      purchaseOrderLineItemId
    }
  }
}
    `;
export const ListInventoryForFulfilmentTestDocument = gql`
    query ListInventoryForFulfilmentTest($query: ListInventoryQuery) {
  listInventory(query: $query) {
    items {
      id
      status
      purchaseOrderId
      purchaseOrderLineItemId
      isThirdPartyRental
    }
  }
}
    `;
export const CreatePurchaseOrderForInventoryTestDocument = gql`
    mutation CreatePurchaseOrderForInventoryTest($input: PurchaseOrderInput) {
  createPurchaseOrder(input: $input) {
    id
    purchase_order_number
    seller_id
    project_id
    company_id
    status
  }
}
    `;
export const CreateRentalPoLineItemForInventoryTestDocument = gql`
    mutation CreateRentalPOLineItemForInventoryTest($input: CreateRentalPurchaseOrderLineItemInput) {
  createRentalPurchaseOrderLineItem(input: $input) {
    id
    purchase_order_id
    po_pim_id
    po_quantity
    lineitem_type
  }
}
    `;
export const CreateSalePoLineItemForInventoryTestDocument = gql`
    mutation CreateSalePOLineItemForInventoryTest($input: CreateSalePurchaseOrderLineItemInput) {
  createSalePurchaseOrderLineItem(input: $input) {
    id
    purchase_order_id
    po_pim_id
    po_quantity
    lineitem_type
  }
}
    `;
export const SubmitPurchaseOrderForInventoryTestDocument = gql`
    mutation SubmitPurchaseOrderForInventoryTest($id: ID!) {
  submitPurchaseOrder(id: $id) {
    id
    status
  }
}
    `;
export const ListInventoryForTestDocument = gql`
    query ListInventoryForTest($query: ListInventoryQuery) {
  listInventory(query: $query) {
    items {
      id
      status
      purchaseOrderId
      purchaseOrderLineItemId
      isThirdPartyRental
      pimProductId
      pimCategoryId
      pimCategoryPath
      pimCategoryName
      workspaceId
    }
  }
}
    `;
export const CreateProjectForPurchaseOrderDocument = gql`
    mutation CreateProjectForPurchaseOrder($input: ProjectInput) {
  createProject(input: $input) {
    id
    name
    project_code
    description
    deleted
  }
}
    `;
export const CreatePersonContact_PurchaseOrderDocument = gql`
    mutation CreatePersonContact_PurchaseOrder($input: PersonContactInput!) {
  createPersonContact(input: $input) {
    ... on PersonContact {
      id
      name
      email
      role
      workspaceId
      businessId
      contactType
    }
  }
}
    `;
export const CreatePurchaseOrderDocument = gql`
    mutation CreatePurchaseOrder($input: PurchaseOrderInput) {
  createPurchaseOrder(input: $input) {
    id
    purchase_order_number
    seller_id
    project_id
    company_id
    created_at
    created_by
    updated_at
    updated_by
    status
    line_items {
      ... on RentalPurchaseOrderLineItem {
        id
        po_pim_id
        po_quantity
      }
      ... on SalePurchaseOrderLineItem {
        id
        po_pim_id
        po_quantity
      }
    }
  }
}
    `;
export const GetPurchaseOrderByIdDocument = gql`
    query GetPurchaseOrderById($id: String) {
  getPurchaseOrderById(id: $id) {
    id
    purchase_order_number
    seller_id
    project_id
    company_id
    created_at
    created_by
    updated_at
    updated_by
    status
    line_items {
      ... on RentalPurchaseOrderLineItem {
        id
        po_pim_id
        po_quantity
      }
      ... on SalePurchaseOrderLineItem {
        id
        po_pim_id
        po_quantity
      }
    }
  }
}
    `;
export const ListPurchaseOrdersDocument = gql`
    query ListPurchaseOrders($workspaceId: String!, $limit: Int, $offset: Int) {
  listPurchaseOrders(workspaceId: $workspaceId, limit: $limit, offset: $offset) {
    items {
      id
      purchase_order_number
      seller_id
      project_id
      company_id
      created_at
      created_by
      updated_at
      updated_by
      status
      line_items {
        ... on RentalPurchaseOrderLineItem {
          id
          po_pim_id
          po_quantity
        }
        ... on SalePurchaseOrderLineItem {
          id
          po_pim_id
          po_quantity
        }
      }
    }
    total
    limit
    offset
  }
}
    `;
export const CreateQuoteFromIntakeFormSubmissionForTestsDocument = gql`
    mutation CreateQuoteFromIntakeFormSubmissionForTests($input: CreateQuoteFromIntakeFormSubmissionInput!) {
  createQuoteFromIntakeFormSubmission(input: $input) {
    id
    sellerWorkspaceId
    sellersBuyerContactId
    sellersProjectId
    status
    intakeFormSubmissionId
    currentRevisionId
    currentRevision {
      id
      revisionNumber
      status
      hasUnpricedLineItems
      lineItems {
        __typename
        ... on QuoteRevisionRentalLineItem {
          id
          description
          quantity
          subtotalInCents
          type
          pimCategoryId
          rentalStartDate
          rentalEndDate
          sellersPriceId
          intakeFormSubmissionLineItemId
          deliveryMethod
          deliveryLocation
          deliveryNotes
        }
        ... on QuoteRevisionSaleLineItem {
          id
          description
          quantity
          subtotalInCents
          type
          pimCategoryId
          sellersPriceId
          intakeFormSubmissionLineItemId
          deliveryMethod
          deliveryLocation
          deliveryNotes
        }
        ... on QuoteRevisionServiceLineItem {
          id
          description
          quantity
          subtotalInCents
          type
          sellersPriceId
          intakeFormSubmissionLineItemId
          deliveryMethod
          deliveryLocation
          deliveryNotes
        }
      }
    }
  }
}
    `;
export const CreateIntakeFormForQuoteTestsDocument = gql`
    mutation CreateIntakeFormForQuoteTests($input: IntakeFormInput!) {
  createIntakeForm(input: $input) {
    id
    workspaceId
    projectId
    pricebookId
    isPublic
    isActive
  }
}
    `;
export const CreateIntakeFormSubmissionForQuoteTestsDocument = gql`
    mutation CreateIntakeFormSubmissionForQuoteTests($input: IntakeFormSubmissionInput!) {
  createIntakeFormSubmission(input: $input) {
    id
    formId
    workspaceId
    name
    email
    status
    lineItems {
      id
      description
      quantity
      type
      pimCategoryId
      priceId
      deliveryMethod
      deliveryLocation
      deliveryNotes
      rentalStartDate
      rentalEndDate
    }
  }
}
    `;
export const CreateIntakeFormSubmissionLineItemForQuoteTestsDocument = gql`
    mutation CreateIntakeFormSubmissionLineItemForQuoteTests($submissionId: String!, $input: IntakeFormLineItemInput!) {
  createIntakeFormSubmissionLineItem(submissionId: $submissionId, input: $input) {
    id
    description
    quantity
    type
    pimCategoryId
    priceId
    deliveryMethod
    deliveryLocation
    deliveryNotes
    rentalStartDate
    rentalEndDate
  }
}
    `;
export const SubmitIntakeFormSubmissionForQuoteTestsDocument = gql`
    mutation SubmitIntakeFormSubmissionForQuoteTests($id: String!) {
  submitIntakeFormSubmission(id: $id) {
    id
    status
    submittedAt
  }
}
    `;
export const CreateQuoteRevisionWithOptionalPriceDocument = gql`
    mutation CreateQuoteRevisionWithOptionalPrice($input: CreateQuoteRevisionInput!) {
  createQuoteRevision(input: $input) {
    id
    quoteId
    revisionNumber
    status
    hasUnpricedLineItems
    lineItems {
      __typename
      ... on QuoteRevisionRentalLineItem {
        id
        description
        quantity
        subtotalInCents
        type
        pimCategoryId
        rentalStartDate
        rentalEndDate
        sellersPriceId
        intakeFormSubmissionLineItemId
        deliveryMethod
        deliveryLocation
        deliveryNotes
      }
      ... on QuoteRevisionSaleLineItem {
        id
        description
        quantity
        subtotalInCents
        type
        pimCategoryId
        sellersPriceId
        intakeFormSubmissionLineItemId
        deliveryMethod
        deliveryLocation
        deliveryNotes
      }
    }
  }
}
    `;
export const CreateQuoteForIntakeTestsDocument = gql`
    mutation CreateQuoteForIntakeTests($input: CreateQuoteInput!) {
  createQuote(input: $input) {
    id
    sellerWorkspaceId
    sellersBuyerContactId
    sellersProjectId
    status
    intakeFormSubmissionId
  }
}
    `;
export const UpdateQuoteRevisionForIntakeTestsDocument = gql`
    mutation UpdateQuoteRevisionForIntakeTests($input: UpdateQuoteRevisionInput!) {
  updateQuoteRevision(input: $input) {
    id
    quoteId
    revisionNumber
    status
    lineItems {
      __typename
      ... on QuoteRevisionRentalLineItem {
        id
        description
        quantity
        subtotalInCents
        type
        pimCategoryId
        rentalStartDate
        rentalEndDate
        sellersPriceId
        intakeFormSubmissionLineItemId
        deliveryMethod
        deliveryLocation
        deliveryNotes
      }
      ... on QuoteRevisionSaleLineItem {
        id
        description
        quantity
        subtotalInCents
        type
        pimCategoryId
        sellersPriceId
        intakeFormSubmissionLineItemId
        deliveryMethod
        deliveryLocation
        deliveryNotes
      }
      ... on QuoteRevisionServiceLineItem {
        id
        description
        quantity
        subtotalInCents
        type
        sellersPriceId
        intakeFormSubmissionLineItemId
        deliveryMethod
        deliveryLocation
        deliveryNotes
      }
    }
  }
}
    `;
export const SendQuoteForIntakeTestsDocument = gql`
    mutation SendQuoteForIntakeTests($input: SendQuoteInput!) {
  sendQuote(input: $input) {
    id
    status
    currentRevisionId
  }
}
    `;
export const CreateRentalPriceForQuoteTestsDocument = gql`
    mutation CreateRentalPriceForQuoteTests($input: CreateRentalPriceInput!) {
  createRentalPrice(input: $input) {
    id
    workspaceId
    priceBookId
    pimCategoryId
    pricePerDayInCents
    pricePerWeekInCents
    pricePerMonthInCents
  }
}
    `;
export const CreateSalePriceForQuoteTestsDocument = gql`
    mutation CreateSalePriceForQuoteTests($input: CreateSalePriceInput!) {
  createSalePrice(input: $input) {
    id
    workspaceId
    priceBookId
    pimCategoryId
    unitCostInCents
  }
}
    `;
export const CreatePriceBookForQuoteTestsDocument = gql`
    mutation CreatePriceBookForQuoteTests($input: CreatePriceBookInput!) {
  createPriceBook(input: $input) {
    id
    workspaceId
    name
  }
}
    `;
export const CreatePimCategoryForQuoteTestsDocument = gql`
    mutation CreatePimCategoryForQuoteTests($input: UpsertPimCategoryInput!) {
  upsertPimCategory(input: $input) {
    id
    name
    path
  }
}
    `;
export const CreateBusinessContactForQuoteTestsDocument = gql`
    mutation CreateBusinessContactForQuoteTests($input: BusinessContactInput!) {
  createBusinessContact(input: $input) {
    id
    workspaceId
    name
  }
}
    `;
export const CreatePersonContactForQuoteTestsDocument = gql`
    mutation CreatePersonContactForQuoteTests($input: PersonContactInput!) {
  createPersonContact(input: $input) {
    id
    workspaceId
    name
    email
  }
}
    `;
export const CreateProjectForQuoteTestsDocument = gql`
    mutation CreateProjectForQuoteTests($input: ProjectInput!) {
  createProject(input: $input) {
    id
    workspaceId
    name
  }
}
    `;
export const CreateQuoteForTestsDocument = gql`
    mutation CreateQuoteForTests($input: CreateQuoteInput!) {
  createQuote(input: $input) {
    id
    sellerWorkspaceId
    sellersBuyerContactId
    sellersProjectId
    status
    updatedAt
  }
}
    `;
export const UpdateQuoteForTestsDocument = gql`
    mutation UpdateQuoteForTests($input: UpdateQuoteInput!) {
  updateQuote(input: $input) {
    id
    sellerWorkspaceId
    sellersBuyerContactId
    sellersProjectId
    buyerWorkspaceId
    buyersSellerContactId
    buyersProjectId
    status
    currentRevisionId
    validUntil
    updatedAt
    updatedBy
  }
}
    `;
export const CreateQuoteRevisionDocument = gql`
    mutation CreateQuoteRevision($input: CreateQuoteRevisionInput!) {
  createQuoteRevision(input: $input) {
    id
    quoteId
    revisionNumber
    status
    validUntil
    createdAt
    createdBy
    updatedAt
    updatedBy
    lineItems {
      __typename
      ... on QuoteRevisionServiceLineItem {
        id
        description
        quantity
        subtotalInCents
        type
        sellersPriceId
      }
      ... on QuoteRevisionRentalLineItem {
        id
        description
        quantity
        subtotalInCents
        type
        pimCategoryId
        rentalStartDate
        rentalEndDate
        sellersPriceId
      }
      ... on QuoteRevisionSaleLineItem {
        id
        description
        quantity
        subtotalInCents
        type
        pimCategoryId
        sellersPriceId
      }
    }
  }
}
    `;
export const GetQuoteRevisionByIdDocument = gql`
    query GetQuoteRevisionById($id: String!) {
  quoteRevisionById(id: $id) {
    id
    quoteId
    revisionNumber
    status
    validUntil
    updatedAt
    updatedBy
    lineItems {
      __typename
      ... on QuoteRevisionServiceLineItem {
        id
        description
        quantity
        subtotalInCents
        type
        sellersPriceId
      }
      ... on QuoteRevisionRentalLineItem {
        id
        description
        quantity
        subtotalInCents
        type
        pimCategoryId
        rentalStartDate
        rentalEndDate
        sellersPriceId
      }
      ... on QuoteRevisionSaleLineItem {
        id
        description
        quantity
        subtotalInCents
        type
        pimCategoryId
        sellersPriceId
      }
    }
  }
}
    `;
export const CreateRentalPriceForTestsDocument = gql`
    mutation CreateRentalPriceForTests($input: CreateRentalPriceInput!) {
  createRentalPrice(input: $input) {
    id
    workspaceId
    priceBookId
    pimCategoryId
    pricePerDayInCents
    pricePerWeekInCents
    pricePerMonthInCents
  }
}
    `;
export const CreateSalePriceForTestsDocument = gql`
    mutation CreateSalePriceForTests($input: CreateSalePriceInput!) {
  createSalePrice(input: $input) {
    id
    workspaceId
    priceBookId
    pimCategoryId
    unitCostInCents
  }
}
    `;
export const CreatePimCategoryForTestsDocument = gql`
    mutation CreatePimCategoryForTests($input: UpsertPimCategoryInput!) {
  upsertPimCategory(input: $input) {
    id
    name
    path
  }
}
    `;
export const CreatePriceBookForTestsDocument = gql`
    mutation CreatePriceBookForTests($input: CreatePriceBookInput!) {
  createPriceBook(input: $input) {
    id
    name
    workspaceId
  }
}
    `;
export const CreateBusinessContactForTestsDocument = gql`
    mutation CreateBusinessContactForTests($input: BusinessContactInput!) {
  createBusinessContact(input: $input) {
    id
    workspaceId
    name
  }
}
    `;
export const CreatePersonContactForTestsDocument = gql`
    mutation CreatePersonContactForTests($input: PersonContactInput!) {
  createPersonContact(input: $input) {
    id
    name
    email
    role
    businessId
    contactType
  }
}
    `;
export const CreateProjectForTestsDocument = gql`
    mutation CreateProjectForTests($input: ProjectInput!) {
  createProject(input: $input) {
    id
    workspaceId
    name
    project_code
  }
}
    `;
export const UpdateQuoteRevisionForTestsDocument = gql`
    mutation UpdateQuoteRevisionForTests($input: UpdateQuoteRevisionInput!) {
  updateQuoteRevision(input: $input) {
    id
    quoteId
    revisionNumber
    status
    validUntil
    updatedAt
    updatedBy
    lineItems {
      __typename
      ... on QuoteRevisionRentalLineItem {
        id
        description
        quantity
        subtotalInCents
        type
        pimCategoryId
        rentalStartDate
        rentalEndDate
        sellersPriceId
      }
      ... on QuoteRevisionSaleLineItem {
        id
        description
        quantity
        subtotalInCents
        type
        pimCategoryId
        sellersPriceId
      }
      ... on QuoteRevisionServiceLineItem {
        id
        description
        quantity
        subtotalInCents
        type
        sellersPriceId
      }
    }
  }
}
    `;
export const SendQuoteForTestsDocument = gql`
    mutation SendQuoteForTests($input: SendQuoteInput!) {
  sendQuote(input: $input) {
    id
    status
    currentRevisionId
    validUntil
    updatedAt
    updatedBy
  }
}
    `;
export const CreateReferenceNumberTemplateDocument = gql`
    mutation CreateReferenceNumberTemplate($input: CreateReferenceNumberTemplateInput!) {
  createReferenceNumberTemplate(input: $input) {
    id
    workspaceId
    type
    template
    seqPadding
    startAt
    resetFrequency
    useGlobalSequence
    createdBy
    createdAt
    updatedAt
    updatedBy
    businessContactId
    projectId
    deleted
    createdByUser {
      id
      firstName
      lastName
    }
    updatedByUser {
      id
      firstName
      lastName
    }
  }
}
    `;
export const UpdateReferenceNumberTemplateDocument = gql`
    mutation UpdateReferenceNumberTemplate($input: UpdateReferenceNumberTemplateInput!) {
  updateReferenceNumberTemplate(input: $input) {
    id
    workspaceId
    type
    template
    seqPadding
    startAt
    resetFrequency
    useGlobalSequence
    createdBy
    createdAt
    updatedAt
    updatedBy
    businessContactId
    projectId
    deleted
  }
}
    `;
export const DeleteReferenceNumberTemplateDocument = gql`
    mutation DeleteReferenceNumberTemplate($id: String!) {
  deleteReferenceNumberTemplate(id: $id)
}
    `;
export const ResetSequenceNumberDocument = gql`
    mutation ResetSequenceNumber($templateId: String!, $newValue: Int) {
  resetSequenceNumber(templateId: $templateId, newValue: $newValue)
}
    `;
export const GenerateReferenceNumberDocument = gql`
    mutation GenerateReferenceNumber($input: GenerateReferenceNumberInput!) {
  generateReferenceNumber(input: $input) {
    referenceNumber
    sequenceNumber
    templateUsed {
      id
      type
      template
      seqPadding
      startAt
      resetFrequency
      useGlobalSequence
    }
  }
}
    `;
export const ListReferenceNumberTemplatesDocument = gql`
    query ListReferenceNumberTemplates($filter: ReferenceNumberTemplateFilterInput!, $page: PageInfoInput) {
  listReferenceNumberTemplates(filter: $filter, page: $page) {
    id
    workspaceId
    type
    template
    seqPadding
    startAt
    resetFrequency
    useGlobalSequence
    createdBy
    createdAt
    updatedAt
    updatedBy
    businessContactId
    projectId
    deleted
  }
}
    `;
export const GetReferenceNumberTemplateDocument = gql`
    query GetReferenceNumberTemplate($id: String!) {
  getReferenceNumberTemplate(id: $id) {
    id
    workspaceId
    type
    template
    seqPadding
    startAt
    resetFrequency
    useGlobalSequence
    createdBy
    createdAt
    updatedAt
    updatedBy
    businessContactId
    projectId
    deleted
  }
}
    `;
export const GetCurrentSequenceNumberDocument = gql`
    query GetCurrentSequenceNumber($workspaceId: String!, $type: ReferenceNumberType!, $templateId: String!) {
  getCurrentSequenceNumber(
    workspaceId: $workspaceId
    type: $type
    templateId: $templateId
  )
}
    `;
export const CreateProjectForReferenceNumbersDocument = gql`
    mutation CreateProjectForReferenceNumbers($input: ProjectInput) {
  createProject(input: $input) {
    id
    name
    project_code
    description
    deleted
  }
}
    `;
export const CreatePersonContactForReferenceNumbersDocument = gql`
    mutation CreatePersonContactForReferenceNumbers($input: PersonContactInput!) {
  createPersonContact(input: $input) {
    ... on PersonContact {
      id
      name
      email
      role
      workspaceId
      businessId
      contactType
    }
  }
}
    `;
export const ListRentalViewsDocument = gql`
    query ListRentalViews($filter: RentalViewFilterInput, $page: ListRentalViewsPageInput) {
  listRentalViews(filter: $filter, page: $page) {
    items {
      rentalId
      details {
        rentalId
        borrowerUserId
        rentalStatusId
        startDate
        endDate
        price
        orderId
      }
      asset {
        assetId
        details {
          name
          description
        }
        company {
          id
          name
        }
      }
      status {
        id
        name
      }
      order {
        orderId
        companyId
        companyName
        orderStatusName
      }
    }
    page {
      number
      size
      totalItems
      totalPages
    }
  }
}
    `;
export const CreatePurchaseOrderForQuantityValidationDocument = gql`
    mutation CreatePurchaseOrderForQuantityValidation($input: PurchaseOrderInput) {
  createPurchaseOrder(input: $input) {
    id
    purchase_order_number
    status
  }
}
    `;
export const CreateRentalPoLineItemForQuantityValidationDocument = gql`
    mutation CreateRentalPOLineItemForQuantityValidation($input: CreateRentalPurchaseOrderLineItemInput) {
  createRentalPurchaseOrderLineItem(input: $input) {
    id
    purchase_order_id
    po_quantity
    lineitem_type
  }
}
    `;
export const UpdateRentalPoLineItemForQuantityValidationDocument = gql`
    mutation UpdateRentalPOLineItemForQuantityValidation($input: UpdateRentalPurchaseOrderLineItemInput) {
  updateRentalPurchaseOrderLineItem(input: $input) {
    id
    po_quantity
  }
}
    `;
export const CreateSalesOrderForQuantityValidationDocument = gql`
    mutation CreateSalesOrderForQuantityValidation($input: SalesOrderInput) {
  createSalesOrder(input: $input) {
    id
    sales_order_number
    status
  }
}
    `;
export const CreateRentalSoLineItemForQuantityValidationDocument = gql`
    mutation CreateRentalSOLineItemForQuantityValidation($input: CreateRentalSalesOrderLineItemInput) {
  createRentalSalesOrderLineItem(input: $input) {
    id
    sales_order_id
    so_quantity
    lineitem_type
  }
}
    `;
export const UpdateRentalSoLineItemForQuantityValidationDocument = gql`
    mutation UpdateRentalSOLineItemForQuantityValidation($input: UpdateRentalSalesOrderLineItemInput) {
  updateRentalSalesOrderLineItem(input: $input) {
    id
    so_quantity
  }
}
    `;
export const CreateRfqDocument = gql`
    mutation CreateRFQ($input: CreateRFQInput!) {
  createRFQ(input: $input) {
    id
    buyersWorkspaceId
    responseDeadline
    invitedSellerContactIds
    status
    createdAt
    updatedAt
    createdBy
    createdByUser {
      id
      email
    }
    updatedByUser {
      id
      email
    }
    updatedBy
    lineItems {
      __typename
      ... on RFQServiceLineItem {
        id
        description
        quantity
        type
      }
      ... on RFQRentalLineItem {
        id
        description
        quantity
        type
        pimCategoryId
        rentalStartDate
        rentalEndDate
      }
      ... on RFQSaleLineItem {
        id
        description
        quantity
        type
        pimCategoryId
      }
    }
  }
}
    `;
export const UpdateRfqDocument = gql`
    mutation UpdateRFQ($input: UpdateRFQInput!) {
  updateRFQ(input: $input) {
    id
    buyersWorkspaceId
    responseDeadline
    invitedSellerContactIds
    status
    updatedAt
    updatedBy
    lineItems {
      ... on RFQServiceLineItem {
        id
        description
        quantity
        type
      }
      ... on RFQRentalLineItem {
        id
        description
        quantity
        type
        pimCategoryId
        rentalStartDate
        rentalEndDate
      }
      ... on RFQSaleLineItem {
        id
        description
        quantity
        type
        pimCategoryId
      }
    }
  }
}
    `;
export const GetRfqWithRelationshipsDocument = gql`
    query GetRFQWithRelationships($id: String!) {
  rfqById(id: $id) {
    id
    buyersWorkspaceId
    status
    invitedSellerContactIds
    createdBy
    updatedBy
    createdByUser {
      id
      email
    }
    updatedByUser {
      id
      email
    }
    invitedSellerContacts {
      ... on BusinessContact {
        id
        name
        contactType
      }
      ... on PersonContact {
        id
        name
        contactType
      }
    }
    lineItems {
      __typename
      ... on RFQRentalLineItem {
        id
        description
        pimCategoryId
        pimCategory {
          id
          name
        }
        rentalStartDate
        rentalEndDate
      }
    }
  }
}
    `;
export const ListRfQsDocument = gql`
    query ListRFQs($filter: ListRFQsFilter!, $page: ListRFQsPage!) {
  listRFQs(filter: $filter, page: $page) {
    items {
      id
      buyersWorkspaceId
      status
      invitedSellerContactIds
      createdAt
      updatedAt
      createdBy
      updatedBy
      lineItems {
        __typename
        ... on RFQServiceLineItem {
          id
          description
          quantity
          type
        }
        ... on RFQRentalLineItem {
          id
          description
          quantity
          type
          pimCategoryId
          rentalStartDate
          rentalEndDate
        }
        ... on RFQSaleLineItem {
          id
          description
          quantity
          type
          pimCategoryId
        }
      }
    }
    page {
      number
      size
      totalItems
      totalPages
    }
  }
}
    `;
export const CreateQuoteLinkedToRfqDocument = gql`
    mutation CreateQuoteLinkedToRFQ($input: CreateQuoteInput!) {
  createQuote(input: $input) {
    id
    rfqId
    sellerWorkspaceId
    sellersBuyerContactId
    sellersProjectId
    status
    createdAt
    createdBy
  }
}
    `;
export const ListQuotesByRfqIdDocument = gql`
    query ListQuotesByRFQId($query: ListQuotesQuery) {
  listQuotes(query: $query) {
    items {
      id
      rfqId
      status
      sellerWorkspaceId
    }
  }
}
    `;
export const CreatePimCategoryForRfqDocument = gql`
    mutation CreatePimCategoryForRFQ($input: UpsertPimCategoryInput!) {
  upsertPimCategory(input: $input) {
    id
    name
  }
}
    `;
export const CreatePersonContactForRfqDocument = gql`
    mutation CreatePersonContactForRFQ($input: PersonContactInput!) {
  createPersonContact(input: $input) {
    id
    name
    email
    role
    businessId
    contactType
  }
}
    `;
export const CreateQuoteForRfqTestDocument = gql`
    mutation CreateQuoteForRFQTest($input: CreateQuoteInput!) {
  createQuote(input: $input) {
    id
    rfqId
    sellerWorkspaceId
    sellersBuyerContactId
    buyerWorkspaceId
    sellersProjectId
    status
    createdAt
    createdBy
  }
}
    `;
export const CreateQuoteRevisionForRfqTestDocument = gql`
    mutation CreateQuoteRevisionForRFQTest($input: CreateQuoteRevisionInput!) {
  createQuoteRevision(input: $input) {
    id
    quoteId
    revisionNumber
    status
    lineItems {
      __typename
      ... on QuoteRevisionRentalLineItem {
        id
        description
        quantity
        rentalStartDate
        rentalEndDate
      }
    }
  }
}
    `;
export const SendQuoteForRfqTestDocument = gql`
    mutation SendQuoteForRFQTest($input: SendQuoteInput!) {
  sendQuote(input: $input) {
    id
    status
    currentRevisionId
    currentRevision {
      id
      status
    }
  }
}
    `;
export const AcceptQuoteForRfqTestDocument = gql`
    mutation AcceptQuoteForRFQTest($input: AcceptQuoteInput!) {
  acceptQuote(input: $input) {
    quote {
      id
      status
      buyerAcceptedFullLegalName
    }
    salesOrder {
      id
      workspace_id
      project_id
      buyer_id
      line_items {
        __typename
        ... on RentalSalesOrderLineItem {
          id
          lineitem_type
          so_pim_id
          so_quantity
          price_id
          delivery_date
          off_rent_date
          delivery_method
          delivery_location
          deliveryNotes
          quote_revision_line_item_id
        }
        ... on SaleSalesOrderLineItem {
          id
          lineitem_type
          so_pim_id
          so_quantity
          price_id
          delivery_date
          delivery_method
          delivery_location
          deliveryNotes
          quote_revision_line_item_id
        }
      }
    }
    purchaseOrder {
      id
      workspace_id
      project_id
      seller_id
      line_items {
        __typename
        ... on RentalPurchaseOrderLineItem {
          id
          lineitem_type
          po_pim_id
          po_quantity
          price_id
          delivery_date
          off_rent_date
          delivery_method
          delivery_location
          deliveryNotes
          quote_revision_line_item_id
        }
        ... on SalePurchaseOrderLineItem {
          id
          lineitem_type
          po_pim_id
          po_quantity
          price_id
          delivery_date
          delivery_method
          delivery_location
          deliveryNotes
          quote_revision_line_item_id
        }
      }
    }
  }
}
    `;
export const RejectQuoteForRfqTestDocument = gql`
    mutation RejectQuoteForRFQTest($quoteId: String!) {
  rejectQuote(quoteId: $quoteId) {
    id
    status
  }
}
    `;
export const GetQuoteForRfqTestDocument = gql`
    query GetQuoteForRFQTest($id: String!) {
  quoteById(id: $id) {
    id
    status
    rfqId
    buyerWorkspaceId
    sellerWorkspaceId
    currentRevisionId
    buyerAcceptedFullLegalName
    currentRevision {
      id
      status
      validUntil
    }
  }
}
    `;
export const GetRfqForQuoteAcceptanceDocument = gql`
    query GetRFQForQuoteAcceptance($id: String!) {
  rfqById(id: $id) {
    id
    status
  }
}
    `;
export const GetQuoteRevisionForAcceptanceTestDocument = gql`
    query GetQuoteRevisionForAcceptanceTest($id: String!) {
  quoteRevisionById(id: $id) {
    id
    quoteId
    revisionNumber
    status
    lineItems {
      __typename
      ... on QuoteRevisionRentalLineItem {
        id
        description
        quantity
        pimCategoryId
        rentalStartDate
        rentalEndDate
        sellersPriceId
      }
    }
  }
}
    `;
export const CreateProjectForSalesOrderDocument = gql`
    mutation CreateProjectForSalesOrder($input: ProjectInput) {
  createProject(input: $input) {
    id
    name
    project_code
    description
    deleted
  }
}
    `;
export const CreateSalesOrderDocument = gql`
    mutation CreateSalesOrder($input: SalesOrderInput) {
  createSalesOrder(input: $input) {
    id
    status
    project_id
    buyer_id
    purchase_order_number
    sales_order_number
    company_id
    created_at
    updated_at
    updated_by
  }
}
    `;
export const ListSalesOrdersDocument = gql`
    query ListSalesOrders($workspaceId: String!, $limit: Int, $offset: Int) {
  listSalesOrders(workspaceId: $workspaceId, limit: $limit, offset: $offset) {
    items {
      id
      status
      project_id
      buyer_id
      purchase_order_number
      sales_order_number
      company_id
      created_at
      updated_at
      updated_by
    }
    total
    limit
    offset
  }
}
    `;
export const CreateRentalSalesOrderLineItemDocument = gql`
    mutation CreateRentalSalesOrderLineItem($input: CreateRentalSalesOrderLineItemInput!) {
  createRentalSalesOrderLineItem(input: $input) {
    id
    sales_order_id
    so_pim_id
    so_quantity
    company_id
    created_at
    created_by
    updated_at
    updated_by
    lineitem_type
    price_id
    lineitem_status
    delivery_date
    off_rent_date
    deliveryNotes
    totalDaysOnRent
  }
}
    `;
export const CreateSaleSalesOrderLineItemDocument = gql`
    mutation CreateSaleSalesOrderLineItem($input: CreateSaleSalesOrderLineItemInput!) {
  createSaleSalesOrderLineItem(input: $input) {
    id
    sales_order_id
    so_pim_id
    so_quantity
    company_id
    created_at
    created_by
    updated_at
    updated_by
    lineitem_type
    price_id
    lineitem_status
    deliveryNotes
  }
}
    `;
export const SoftDeleteSalesOrderLineItemDocument = gql`
    mutation SoftDeleteSalesOrderLineItem($id: String) {
  softDeleteSalesOrderLineItem(id: $id) {
    ... on RentalSalesOrderLineItem {
      id
      deleted_at
      sales_order_id
    }
    ... on SaleSalesOrderLineItem {
      id
      deleted_at
      sales_order_id
    }
  }
}
    `;
export const GetSalesOrderLineItemByIdDocument = gql`
    query GetSalesOrderLineItemById($id: String) {
  getSalesOrderLineItemById(id: $id) {
    ... on RentalSalesOrderLineItem {
      id
      deleted_at
      sales_order_id
      deliveryNotes
    }
    ... on SaleSalesOrderLineItem {
      id
      deleted_at
      sales_order_id
      deliveryNotes
    }
  }
}
    `;
export const GetSalesOrderByIdDocument = gql`
    query GetSalesOrderById($id: String) {
  getSalesOrderById(id: $id) {
    id
    line_items {
      ... on RentalSalesOrderLineItem {
        id
        deleted_at
        deliveryNotes
      }
      ... on SaleSalesOrderLineItem {
        id
        deleted_at
        deliveryNotes
      }
    }
  }
}
    `;
export const GetSalesOrderByIdWithAllFieldsDocument = gql`
    query GetSalesOrderByIdWithAllFields($id: String) {
  getSalesOrderById(id: $id) {
    id
    status
    project_id
    buyer_id
    purchase_order_number
    company_id
    created_at
    updated_at
    updated_by
    line_items {
      ... on RentalSalesOrderLineItem {
        id
        deleted_at
        deliveryNotes
      }
      ... on SaleSalesOrderLineItem {
        id
        deleted_at
        deliveryNotes
      }
    }
  }
}
    `;
export const GetSalesOrderByIdWithPricingDocument = gql`
    query GetSalesOrderByIdWithPricing($id: String) {
  getSalesOrderById(id: $id) {
    id
    pricing {
      sub_total_in_cents
      total_in_cents
    }
  }
}
    `;
export const SubmitSalesOrderDocument = gql`
    mutation SubmitSalesOrder($id: ID!) {
  submitSalesOrder(id: $id) {
    id
    status
  }
}
    `;
export const UpdateSalesOrderDocument = gql`
    mutation UpdateSalesOrder($input: UpdateSalesOrderInput!) {
  updateSalesOrder(input: $input) {
    id
    project_id
    buyer_id
    purchase_order_number
    updated_at
    updated_by
  }
}
    `;
export const ListFulfilmentsForSalesOrderDocument = gql`
    query ListFulfilmentsForSalesOrder($filter: ListFulfilmentsFilter!, $page: ListFulfilmentsPage) {
  listFulfilments(filter: $filter, page: $page) {
    items {
      ... on FulfilmentBase {
        id
        salesOrderId
        salesOrderLineItemId
        salesOrderType
        workflowId
        workflowColumnId
        assignedToId
        createdAt
        contactId
        projectId
        purchaseOrderNumber
      }
      ... on RentalFulfilment {
        rentalStartDate
        rentalEndDate
        expectedRentalEndDate
      }
    }
  }
}
    `;
export const CreateRentalPriceForSalesOrderDocument = gql`
    mutation CreateRentalPriceForSalesOrder($input: CreateRentalPriceInput!) {
  createRentalPrice(input: $input) {
    id
    name
    pimCategoryName
    pricePerDayInCents
    pricePerWeekInCents
    pricePerMonthInCents
  }
}
    `;
export const CreateSalePriceForSalesOrderDocument = gql`
    mutation CreateSalePriceForSalesOrder($input: CreateSalePriceInput!) {
  createSalePrice(input: $input) {
    id
    name
    pimCategoryName
    unitCostInCents
  }
}
    `;
export const CreatePimCategoryDocument = gql`
    mutation CreatePimCategory($input: UpsertPimCategoryInput!) {
  upsertPimCategory(input: $input) {
    id
  }
}
    `;
export const SoftDeleteSalesOrderDocument = gql`
    mutation SoftDeleteSalesOrder($id: String) {
  softDeleteSalesOrder(id: $id) {
    id
    deleted_at
    status
  }
}
    `;
export const CreateSalesOrderWithIntakeFormDocument = gql`
    mutation CreateSalesOrderWithIntakeForm($input: SalesOrderInput) {
  createSalesOrder(input: $input) {
    id
    status
    project_id
    buyer_id
    purchase_order_number
    sales_order_number
    company_id
    created_at
    updated_at
    updated_by
    intake_form_submission_id
  }
}
    `;
export const CreateRentalSalesOrderLineItemWithIntakeFormDocument = gql`
    mutation CreateRentalSalesOrderLineItemWithIntakeForm($input: CreateRentalSalesOrderLineItemInput!) {
  createRentalSalesOrderLineItem(input: $input) {
    id
    sales_order_id
    so_pim_id
    so_quantity
    company_id
    created_at
    created_by
    updated_at
    updated_by
    lineitem_type
    price_id
    lineitem_status
    delivery_date
    off_rent_date
    deliveryNotes
    totalDaysOnRent
    intake_form_submission_line_item_id
  }
}
    `;
export const CreateSaleSalesOrderLineItemWithIntakeFormDocument = gql`
    mutation CreateSaleSalesOrderLineItemWithIntakeForm($input: CreateSaleSalesOrderLineItemInput!) {
  createSaleSalesOrderLineItem(input: $input) {
    id
    sales_order_id
    so_pim_id
    so_quantity
    company_id
    created_at
    created_by
    updated_at
    updated_by
    lineitem_type
    price_id
    lineitem_status
    deliveryNotes
    intake_form_submission_line_item_id
  }
}
    `;
export const GetSalesOrderWithIntakeFormDocument = gql`
    query GetSalesOrderWithIntakeForm($id: String) {
  getSalesOrderById(id: $id) {
    id
    intake_form_submission_id
    intakeFormSubmission {
      id
      formId
      workspaceId
      name
      email
    }
  }
}
    `;
export const GetSalesOrderLineItemWithIntakeFormDocument = gql`
    query GetSalesOrderLineItemWithIntakeForm($id: String) {
  getSalesOrderLineItemById(id: $id) {
    ... on RentalSalesOrderLineItem {
      id
      intake_form_submission_line_item_id
      intakeFormSubmissionLineItem {
        id
        description
        quantity
      }
    }
    ... on SaleSalesOrderLineItem {
      id
      intake_form_submission_line_item_id
      intakeFormSubmissionLineItem {
        id
        description
        quantity
      }
    }
  }
}
    `;
export const GetIntakeFormSubmissionWithSalesOrderDocument = gql`
    query GetIntakeFormSubmissionWithSalesOrder($id: String!) {
  getIntakeFormSubmissionById(id: $id) {
    id
    formId
    workspaceId
    name
    email
    salesOrder {
      id
      status
      sales_order_number
    }
  }
}
    `;
export const GetIntakeFormLineItemWithSalesOrderLineItemDocument = gql`
    query GetIntakeFormLineItemWithSalesOrderLineItem($id: String!) {
  getIntakeFormSubmissionLineItem(id: $id) {
    id
    description
    quantity
    salesOrderLineItem {
      ... on RentalSalesOrderLineItem {
        id
        intake_form_submission_line_item_id
      }
      ... on SaleSalesOrderLineItem {
        id
        intake_form_submission_line_item_id
      }
    }
  }
}
    `;
export const SearchDocumentsDocument = gql`
    query SearchDocuments($workspaceId: String!, $searchText: String, $collections: [SearchableCollectionType!], $page: Int, $pageSize: Int) {
  searchDocuments(
    workspaceId: $workspaceId
    searchText: $searchText
    collections: $collections
    page: $page
    pageSize: $pageSize
  ) {
    documents {
      id
      documentId
      collection
      workspaceId
      title
      subtitle
      documentType
      metadata
      createdAt
      updatedAt
    }
    total
    page {
      number
      size
      totalItems
      totalPages
    }
  }
}
    `;
export const GetSearchDocumentByIdDocument = gql`
    query GetSearchDocumentById($id: String!) {
  getSearchDocumentById(id: $id) {
    id
    documentId
    collection
    workspaceId
    title
    subtitle
    documentType
    metadata
    createdAt
    updatedAt
  }
}
    `;
export const GetBulkSearchDocumentsByIdDocument = gql`
    query GetBulkSearchDocumentsById($ids: [String!]!) {
  getBulkSearchDocumentsById(ids: $ids) {
    id
    documentId
    collection
    workspaceId
    title
    subtitle
    documentType
    metadata
    createdAt
    updatedAt
  }
}
    `;
export const GetSearchUserStateDocument = gql`
    query GetSearchUserState($workspaceId: String!) {
  getSearchUserState(workspaceId: $workspaceId) {
    id
    userId
    workspaceId
    favorites {
      searchDocumentId
      addedAt
    }
    recents {
      searchDocumentId
      accessedAt
    }
    createdAt
    updatedAt
  }
}
    `;
export const ToggleSearchFavoriteDocument = gql`
    mutation ToggleSearchFavorite($workspaceId: String!, $searchDocumentId: String!) {
  toggleSearchFavorite(
    workspaceId: $workspaceId
    searchDocumentId: $searchDocumentId
  ) {
    id
    userId
    workspaceId
    favorites {
      searchDocumentId
      addedAt
    }
    recents {
      searchDocumentId
      accessedAt
    }
    updatedAt
  }
}
    `;
export const AddSearchRecentDocument = gql`
    mutation AddSearchRecent($workspaceId: String!, $searchDocumentId: String!) {
  addSearchRecent(workspaceId: $workspaceId, searchDocumentId: $searchDocumentId) {
    id
    userId
    workspaceId
    favorites {
      searchDocumentId
      addedAt
    }
    recents {
      searchDocumentId
      accessedAt
    }
    updatedAt
  }
}
    `;
export const RemoveSearchRecentDocument = gql`
    mutation RemoveSearchRecent($workspaceId: String!, $searchDocumentId: String!) {
  removeSearchRecent(
    workspaceId: $workspaceId
    searchDocumentId: $searchDocumentId
  ) {
    id
    userId
    workspaceId
    favorites {
      searchDocumentId
      addedAt
    }
    recents {
      searchDocumentId
      accessedAt
    }
    updatedAt
  }
}
    `;
export const ClearSearchRecentsDocument = gql`
    mutation ClearSearchRecents($workspaceId: String!) {
  clearSearchRecents(workspaceId: $workspaceId) {
    id
    userId
    workspaceId
    favorites {
      searchDocumentId
      addedAt
    }
    recents {
      searchDocumentId
      accessedAt
    }
    updatedAt
  }
}
    `;
export const UtilCreatePimCategoryDocument = gql`
    mutation UtilCreatePimCategory($input: UpsertPimCategoryInput!) {
  upsertPimCategory(input: $input) {
    id
    name
    path
  }
}
    `;
export const UtilCreateWorkspaceDocument = gql`
    mutation UtilCreateWorkspace($accessType: WorkspaceAccessType!, $name: String!) {
  createWorkspace(accessType: $accessType, name: $name) {
    id
    name
  }
}
    `;
export const UtilInviteUserToWorkspaceDocument = gql`
    mutation UtilInviteUserToWorkspace($workspaceId: String!, $email: String!, $roles: [WorkspaceUserRole!]!) {
  inviteUserToWorkspace(workspaceId: $workspaceId, email: $email, roles: $roles) {
    userId
    roles
  }
}
    `;
export const UpdateRentalPriceDocument = gql`
    mutation UpdateRentalPrice($input: UpdateRentalPriceInput!) {
  updateRentalPrice(input: $input) {
    id
    name
    pricePerDayInCents
    pricePerWeekInCents
    pricePerMonthInCents
    pimProductId
    pimCategoryId
    pimCategoryName
    pimCategoryPath
    updatedAt
  }
}
    `;
export const UpdateSalePriceDocument = gql`
    mutation UpdateSalePrice($input: UpdateSalePriceInput!) {
  updateSalePrice(input: $input) {
    id
    name
    unitCostInCents
    discounts
    pimProductId
    pimCategoryId
    pimCategoryName
    pimCategoryPath
    updatedAt
  }
}
    `;
export const UpsertTestUserDocument = gql`
    mutation UpsertTestUser($id: String!, $input: UserUpsertInput!) {
  upsertUser(id: $id, input: $input) {
    id
    email
    firstName
    lastName
    companyId
  }
}
    `;
export const SyncCurrentUserDocument = gql`
    mutation SyncCurrentUser {
  syncCurrentUser {
    id
    email
    firstName
    lastName
    companyId
  }
}
    `;
export const CreateWorkflowConfigurationDocument = gql`
    mutation CreateWorkflowConfiguration($input: CreateWorkflowConfigurationInput!) {
  createWorkflowConfiguration(input: $input) {
    id
    name
    companyId
    columns {
      id
      name
    }
    createdBy
    updatedBy
    createdAt
    updatedAt
  }
}
    `;
export const ListWorkflowConfigurationsDocument = gql`
    query ListWorkflowConfigurations($page: ListWorkflowConfigurationsPage) {
  listWorkflowConfigurations(page: $page) {
    items {
      id
      name
      columns {
        id
        name
      }
    }
    page {
      number
      size
    }
  }
}
    `;
export const GetWorkflowConfigurationByIdDocument = gql`
    query GetWorkflowConfigurationById($id: ID!) {
  getWorkflowConfigurationById(id: $id) {
    id
    name
    companyId
    columns {
      id
      name
    }
    createdBy
    updatedBy
    createdAt
    updatedAt
  }
}
    `;
export const UpdateWorkflowConfigurationDocument = gql`
    mutation UpdateWorkflowConfiguration($id: ID!, $input: UpdateWorkflowConfigurationInput!) {
  updateWorkflowConfiguration(id: $id, input: $input) {
    id
    name
    columns {
      id
      name
    }
  }
}
    `;
export const DeleteWorkflowConfigurationByIdDocument = gql`
    mutation DeleteWorkflowConfigurationById($id: ID!) {
  deleteWorkflowConfigurationById(id: $id)
}
    `;
export const ListWorkspaceMembersTestDocument = gql`
    query ListWorkspaceMembersTest($workspaceId: String!) {
  listWorkspaceMembers(workspaceId: $workspaceId) {
    items {
      userId
      roles
      user {
        id
        email
        firstName
        lastName
      }
    }
    page {
      totalItems
    }
  }
}
    `;
export const UpdateWorkspaceUserRolesDocument = gql`
    mutation updateWorkspaceUserRoles($workspaceId: String!, $userId: String!, $roles: [WorkspaceUserRole!]!) {
  updateWorkspaceUserRoles(
    workspaceId: $workspaceId
    userId: $userId
    roles: $roles
  ) {
    userId
    roles
  }
}
    `;
export const RemoveUserFromWorkspaceDocument = gql`
    mutation removeUserFromWorkspace($workspaceId: String!, $userId: String!) {
  removeUserFromWorkspace(workspaceId: $workspaceId, userId: $userId)
}
    `;
export const ArchiveWorkspaceTestDocument = gql`
    mutation ArchiveWorkspaceTest($workspaceId: String!) {
  archiveWorkspace(workspaceId: $workspaceId) {
    id
    archived
    archivedAt
    updatedAt
    updatedBy
  }
}
    `;
export const ArchiveWorkspaceNonAdminDocument = gql`
    mutation ArchiveWorkspaceNonAdmin($workspaceId: String!) {
  archiveWorkspace(workspaceId: $workspaceId) {
    id
    archived
  }
}
    `;
export const ArchiveWorkspaceNonExistentDocument = gql`
    mutation ArchiveWorkspaceNonExistent($workspaceId: String!) {
  archiveWorkspace(workspaceId: $workspaceId) {
    id
  }
}
    `;
export const ArchiveWorkspaceAlreadyArchivedDocument = gql`
    mutation ArchiveWorkspaceAlreadyArchived($workspaceId: String!) {
  archiveWorkspace(workspaceId: $workspaceId) {
    id
    archived
  }
}
    `;
export const ArchiveWorkspaceForUnarchiveTestDocument = gql`
    mutation ArchiveWorkspaceForUnarchiveTest($workspaceId: String!) {
  archiveWorkspace(workspaceId: $workspaceId) {
    id
  }
}
    `;
export const UnarchiveWorkspaceTestDocument = gql`
    mutation UnarchiveWorkspaceTest($workspaceId: String!) {
  unarchiveWorkspace(workspaceId: $workspaceId) {
    id
    archived
    archivedAt
    updatedAt
    updatedBy
  }
}
    `;
export const ArchiveWorkspaceForNonAdminUnarchiveTestDocument = gql`
    mutation ArchiveWorkspaceForNonAdminUnarchiveTest($workspaceId: String!) {
  archiveWorkspace(workspaceId: $workspaceId) {
    id
  }
}
    `;
export const UnarchiveWorkspaceNonAdminDocument = gql`
    mutation UnarchiveWorkspaceNonAdmin($workspaceId: String!) {
  unarchiveWorkspace(workspaceId: $workspaceId) {
    id
  }
}
    `;
export const UnarchiveWorkspaceNonExistentDocument = gql`
    mutation UnarchiveWorkspaceNonExistent($workspaceId: String!) {
  unarchiveWorkspace(workspaceId: $workspaceId) {
    id
  }
}
    `;
export const UnarchiveWorkspaceNotArchivedDocument = gql`
    mutation UnarchiveWorkspaceNotArchived($workspaceId: String!) {
  unarchiveWorkspace(workspaceId: $workspaceId) {
    id
  }
}
    `;
export const ArchiveWorkspaceForListTestDocument = gql`
    mutation ArchiveWorkspaceForListTest($workspaceId: String!) {
  archiveWorkspace(workspaceId: $workspaceId) {
    id
  }
}
    `;
export const ListWorkspacesAfterArchiveDocument = gql`
    query ListWorkspacesAfterArchive {
  listWorkspaces {
    items {
      id
      name
      archived
    }
    page {
      totalItems
    }
  }
}
    `;
export const ArchiveWorkspaceForUnarchiveListTestDocument = gql`
    mutation ArchiveWorkspaceForUnarchiveListTest($workspaceId: String!) {
  archiveWorkspace(workspaceId: $workspaceId) {
    id
  }
}
    `;
export const ListWorkspacesBeforeUnarchiveDocument = gql`
    query ListWorkspacesBeforeUnarchive {
  listWorkspaces {
    items {
      id
    }
  }
}
    `;
export const UnarchiveWorkspaceForListTestDocument = gql`
    mutation UnarchiveWorkspaceForListTest($workspaceId: String!) {
  unarchiveWorkspace(workspaceId: $workspaceId) {
    id
  }
}
    `;
export const CreateWorkspaceForSettingsDocument = gql`
    mutation CreateWorkspaceForSettings {
  createWorkspace(
    name: "Original Workspace"
    description: "Original description"
    accessType: INVITE_ONLY
  ) {
    id
    name
    description
  }
}
    `;
export const UpdateWorkspaceSettingsDocument = gql`
    mutation UpdateWorkspaceSettings($workspaceId: String!, $name: String, $description: String, $brandId: String, $logoUrl: String, $bannerImageUrl: String) {
  updateWorkspaceSettings(
    workspaceId: $workspaceId
    name: $name
    description: $description
    brandId: $brandId
    logoUrl: $logoUrl
    bannerImageUrl: $bannerImageUrl
  ) {
    id
    name
    description
    brandId
    logoUrl
    bannerImageUrl
    updatedBy
  }
}
    `;
export const CreateWorkspaceWithAllFieldsForPatchDocument = gql`
    mutation CreateWorkspaceWithAllFieldsForPatch {
  createWorkspace(
    name: "Full Workspace"
    description: "Full description"
    brandId: "brand-original"
    logoUrl: "https://example.com/original-logo.png"
    bannerImageUrl: "https://example.com/original-banner.png"
    accessType: INVITE_ONLY
  ) {
    id
    name
    description
    brandId
    logoUrl
    bannerImageUrl
  }
}
    `;
export const UpdateOnlyNameDocument = gql`
    mutation UpdateOnlyName($workspaceId: String!, $name: String) {
  updateWorkspaceSettings(workspaceId: $workspaceId, name: $name) {
    id
    name
    description
    brandId
    logoUrl
    bannerImageUrl
  }
}
    `;
export const CreateWorkspaceForNonAdminTestDocument = gql`
    mutation CreateWorkspaceForNonAdminTest {
  createWorkspace(name: "Admin Only Workspace", accessType: INVITE_ONLY) {
    id
  }
}
    `;
export const AttemptUnauthorizedUpdateDocument = gql`
    mutation AttemptUnauthorizedUpdate($workspaceId: String!) {
  updateWorkspaceSettings(workspaceId: $workspaceId, name: "Unauthorized Update") {
    id
  }
}
    `;
export const CreateWorkspaceForEmptyNameTestDocument = gql`
    mutation CreateWorkspaceForEmptyNameTest {
  createWorkspace(name: "Valid Name", accessType: INVITE_ONLY) {
    id
  }
}
    `;
export const UpdateWithEmptyNameDocument = gql`
    mutation UpdateWithEmptyName($workspaceId: String!) {
  updateWorkspaceSettings(workspaceId: $workspaceId, name: "") {
    id
  }
}
    `;
export const UpdateNonExistentWorkspaceDocument = gql`
    mutation UpdateNonExistentWorkspace {
  updateWorkspaceSettings(workspaceId: "non-existent-id", name: "New Name") {
    id
  }
}
    `;
export const CreateInviteOnlyWorkspaceForAccessTypeDocument = gql`
    mutation CreateInviteOnlyWorkspaceForAccessType {
  createWorkspace(name: "Invite Only Workspace", accessType: INVITE_ONLY) {
    id
    accessType
    domain
  }
}
    `;
export const UpdateToSameDomainDocument = gql`
    mutation UpdateToSameDomain($workspaceId: String!) {
  updateWorkspaceAccessType(workspaceId: $workspaceId, accessType: SAME_DOMAIN) {
    id
    accessType
    updatedBy
  }
}
    `;
export const CreateSameDomainWorkspaceDocument = gql`
    mutation CreateSameDomainWorkspace {
  createWorkspace(name: "Same Domain Workspace", accessType: SAME_DOMAIN) {
    id
    accessType
    domain
  }
}
    `;
export const UpdateToInviteOnlyDocument = gql`
    mutation UpdateToInviteOnly($workspaceId: String!) {
  updateWorkspaceAccessType(workspaceId: $workspaceId, accessType: INVITE_ONLY) {
    id
    accessType
    updatedBy
  }
}
    `;
export const CreateWorkspaceForAccessTypeTestDocument = gql`
    mutation CreateWorkspaceForAccessTypeTest {
  createWorkspace(name: "Admin Only Access Type", accessType: INVITE_ONLY) {
    id
  }
}
    `;
export const AttemptUnauthorizedAccessTypeUpdateDocument = gql`
    mutation AttemptUnauthorizedAccessTypeUpdate($workspaceId: String!) {
  updateWorkspaceAccessType(workspaceId: $workspaceId, accessType: SAME_DOMAIN) {
    id
  }
}
    `;
export const UpdateAccessTypeNonExistentDocument = gql`
    mutation UpdateAccessTypeNonExistent {
  updateWorkspaceAccessType(
    workspaceId: "non-existent-id"
    accessType: SAME_DOMAIN
  ) {
    id
  }
}
    `;
export const CreateWorkspaceForSpiceDbTestDocument = gql`
    mutation CreateWorkspaceForSpiceDBTest {
  createWorkspace(name: "SpiceDB Test Workspace", accessType: INVITE_ONLY) {
    id
    accessType
    domain
  }
}
    `;
export const UpdateToSameDomainSpiceDbDocument = gql`
    mutation UpdateToSameDomainSpiceDB($workspaceId: String!) {
  updateWorkspaceAccessType(workspaceId: $workspaceId, accessType: SAME_DOMAIN) {
    id
    accessType
  }
}
    `;
export const ListJoinableAfterSameDomainDocument = gql`
    query ListJoinableAfterSameDomain {
  listJoinableWorkspaces {
    items {
      id
      name
    }
  }
}
    `;
export const UpdateToInviteOnlySpiceDbDocument = gql`
    mutation UpdateToInviteOnlySpiceDB($workspaceId: String!) {
  updateWorkspaceAccessType(workspaceId: $workspaceId, accessType: INVITE_ONLY) {
    id
    accessType
  }
}
    `;
export const CreateWorkspaceWithAllFieldsDocument = gql`
    mutation CreateWorkspaceWithAllFields($name: String!, $description: String, $brandId: String, $bannerImageUrl: String, $logoUrl: String, $accessType: WorkspaceAccessType!, $archived: Boolean) {
  createWorkspace(
    name: $name
    description: $description
    brandId: $brandId
    bannerImageUrl: $bannerImageUrl
    logoUrl: $logoUrl
    accessType: $accessType
    archived: $archived
  ) {
    id
    companyId
    name
    description
    domain
    brandId
    createdBy
    bannerImageUrl
    logoUrl
    accessType
    archived
    archivedAt
    createdAt
    updatedAt
    updatedBy
    ownerId
  }
}
    `;
export const CreateWorkspaceWithSameDomainDocument = gql`
    mutation CreateWorkspaceWithSameDomain($name: String!, $accessType: WorkspaceAccessType!) {
  createWorkspace(name: $name, accessType: $accessType) {
    id
    name
    accessType
  }
}
    `;
export const CreateWorkspaceAutoDomainDocument = gql`
    mutation CreateWorkspaceAutoDomain($name: String!, $accessType: WorkspaceAccessType!) {
  createWorkspace(name: $name, accessType: $accessType) {
    id
    domain
  }
}
    `;
export const CreateWorkspaceForListDocument = gql`
    mutation CreateWorkspaceForList {
  createWorkspace(name: "List Test Workspace", accessType: INVITE_ONLY) {
    id
  }
}
    `;
export const ListWorkspacesDocument = gql`
    query ListWorkspaces {
  listWorkspaces {
    items {
      id
      name
      accessType
      archived
    }
    page {
      number
      size
      totalItems
      totalPages
    }
  }
}
    `;
export const CreateWorkspaceForJoinableTestDocument = gql`
    mutation CreateWorkspaceForJoinableTest {
  createWorkspace(name: "Already Member Workspace", accessType: INVITE_ONLY) {
    id
  }
}
    `;
export const ListJoinableWorkspacesDocument = gql`
    query ListJoinableWorkspaces {
  listJoinableWorkspaces {
    items {
      id
      name
    }
    page {
      totalItems
    }
  }
}
    `;
export const ListMyWorkspacesDocument = gql`
    query ListMyWorkspaces {
  listWorkspaces {
    items {
      id
      name
    }
  }
}
    `;
export const CreateInviteOnlyWorkspaceDocument = gql`
    mutation CreateInviteOnlyWorkspace {
  createWorkspace(name: "Invite Only Workspace", accessType: INVITE_ONLY) {
    id
  }
}
    `;
export const AttemptUnauthorizedJoinDocument = gql`
    mutation AttemptUnauthorizedJoin($workspaceId: String!) {
  joinWorkspace(workspaceId: $workspaceId) {
    id
  }
}
    `;
export const JoinNonExistentWorkspaceDocument = gql`
    mutation JoinNonExistentWorkspace {
  joinWorkspace(workspaceId: "non-existent-id") {
    id
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    ListInventoryForAssetTest(variables?: ListInventoryForAssetTestQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListInventoryForAssetTestQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListInventoryForAssetTestQuery>(ListInventoryForAssetTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListInventoryForAssetTest', 'query');
    },
    ListAssetsForAssetSchedule(variables?: ListAssetsForAssetScheduleQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListAssetsForAssetScheduleQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListAssetsForAssetScheduleQuery>(ListAssetsForAssetScheduleDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListAssetsForAssetSchedule', 'query');
    },
    CreateProjectForAssetSchedule(variables?: CreateProjectForAssetScheduleMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateProjectForAssetScheduleMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateProjectForAssetScheduleMutation>(CreateProjectForAssetScheduleDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateProjectForAssetSchedule', 'mutation');
    },
    CreateAssetScheduleForAssetSchedule(variables?: CreateAssetScheduleForAssetScheduleMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateAssetScheduleForAssetScheduleMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateAssetScheduleForAssetScheduleMutation>(CreateAssetScheduleForAssetScheduleDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateAssetScheduleForAssetSchedule', 'mutation');
    },
    CreateWorkspaceForAuth0Test(variables: CreateWorkspaceForAuth0TestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateWorkspaceForAuth0TestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateWorkspaceForAuth0TestMutation>(CreateWorkspaceForAuth0TestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateWorkspaceForAuth0Test', 'mutation');
    },
    InviteUserToWorkspaceForAuth0Test(variables: InviteUserToWorkspaceForAuth0TestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<InviteUserToWorkspaceForAuth0TestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<InviteUserToWorkspaceForAuth0TestMutation>(InviteUserToWorkspaceForAuth0TestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'InviteUserToWorkspaceForAuth0Test', 'mutation');
    },
    CreateCharge(variables: CreateChargeMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateChargeMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateChargeMutation>(CreateChargeDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateCharge', 'mutation');
    },
    CreateBusinessContact_BusinessMutation(variables: CreateBusinessContact_BusinessMutationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateBusinessContact_BusinessMutationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateBusinessContact_BusinessMutationMutation>(CreateBusinessContact_BusinessMutationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateBusinessContact_BusinessMutation', 'mutation');
    },
    UpdateBusinessName_BusinessMutation(variables: UpdateBusinessName_BusinessMutationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateBusinessName_BusinessMutationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateBusinessName_BusinessMutationMutation>(UpdateBusinessName_BusinessMutationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateBusinessName_BusinessMutation', 'mutation');
    },
    UpdateBusinessPhone_BusinessMutation(variables: UpdateBusinessPhone_BusinessMutationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateBusinessPhone_BusinessMutationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateBusinessPhone_BusinessMutationMutation>(UpdateBusinessPhone_BusinessMutationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateBusinessPhone_BusinessMutation', 'mutation');
    },
    UpdateBusinessAddress_BusinessMutation(variables: UpdateBusinessAddress_BusinessMutationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateBusinessAddress_BusinessMutationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateBusinessAddress_BusinessMutationMutation>(UpdateBusinessAddress_BusinessMutationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateBusinessAddress_BusinessMutation', 'mutation');
    },
    UpdateBusinessTaxId_BusinessMutation(variables: UpdateBusinessTaxId_BusinessMutationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateBusinessTaxId_BusinessMutationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateBusinessTaxId_BusinessMutationMutation>(UpdateBusinessTaxId_BusinessMutationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateBusinessTaxId_BusinessMutation', 'mutation');
    },
    UpdateBusinessWebsite_BusinessMutation(variables: UpdateBusinessWebsite_BusinessMutationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateBusinessWebsite_BusinessMutationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateBusinessWebsite_BusinessMutationMutation>(UpdateBusinessWebsite_BusinessMutationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateBusinessWebsite_BusinessMutation', 'mutation');
    },
    GetContactById_BusinessMutation(variables: GetContactById_BusinessMutationQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetContactById_BusinessMutationQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetContactById_BusinessMutationQuery>(GetContactById_BusinessMutationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetContactById_BusinessMutation', 'query');
    },
    CreatePersonContact_PersonMutation(variables: CreatePersonContact_PersonMutationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePersonContact_PersonMutationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePersonContact_PersonMutationMutation>(CreatePersonContact_PersonMutationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePersonContact_PersonMutation', 'mutation');
    },
    UpdatePersonName_PersonMutation(variables: UpdatePersonName_PersonMutationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdatePersonName_PersonMutationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdatePersonName_PersonMutationMutation>(UpdatePersonName_PersonMutationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdatePersonName_PersonMutation', 'mutation');
    },
    UpdatePersonPhone_PersonMutation(variables: UpdatePersonPhone_PersonMutationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdatePersonPhone_PersonMutationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdatePersonPhone_PersonMutationMutation>(UpdatePersonPhone_PersonMutationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdatePersonPhone_PersonMutation', 'mutation');
    },
    UpdatePersonEmail_PersonMutation(variables: UpdatePersonEmail_PersonMutationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdatePersonEmail_PersonMutationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdatePersonEmail_PersonMutationMutation>(UpdatePersonEmail_PersonMutationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdatePersonEmail_PersonMutation', 'mutation');
    },
    UpdatePersonRole_PersonMutation(variables: UpdatePersonRole_PersonMutationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdatePersonRole_PersonMutationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdatePersonRole_PersonMutationMutation>(UpdatePersonRole_PersonMutationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdatePersonRole_PersonMutation', 'mutation');
    },
    UpdatePersonBusiness_PersonMutation(variables: UpdatePersonBusiness_PersonMutationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdatePersonBusiness_PersonMutationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdatePersonBusiness_PersonMutationMutation>(UpdatePersonBusiness_PersonMutationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdatePersonBusiness_PersonMutation', 'mutation');
    },
    UpdatePersonResourceMap_PersonMutation(variables: UpdatePersonResourceMap_PersonMutationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdatePersonResourceMap_PersonMutationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdatePersonResourceMap_PersonMutationMutation>(UpdatePersonResourceMap_PersonMutationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdatePersonResourceMap_PersonMutation', 'mutation');
    },
    GetContactById_PersonMutation(variables: GetContactById_PersonMutationQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetContactById_PersonMutationQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetContactById_PersonMutationQuery>(GetContactById_PersonMutationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetContactById_PersonMutation', 'query');
    },
    CreateBusinessContact(variables: CreateBusinessContactMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateBusinessContactMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateBusinessContactMutation>(CreateBusinessContactDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateBusinessContact', 'mutation');
    },
    CreatePersonContact(variables: CreatePersonContactMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePersonContactMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePersonContactMutation>(CreatePersonContactDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePersonContact', 'mutation');
    },
    UpdateBusinessContact(variables: UpdateBusinessContactMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateBusinessContactMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateBusinessContactMutation>(UpdateBusinessContactDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateBusinessContact', 'mutation');
    },
    UpdatePersonContact(variables: UpdatePersonContactMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdatePersonContactMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdatePersonContactMutation>(UpdatePersonContactDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdatePersonContact', 'mutation');
    },
    DeleteContactById(variables: DeleteContactByIdMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<DeleteContactByIdMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteContactByIdMutation>(DeleteContactByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'DeleteContactById', 'mutation');
    },
    GetContactById(variables: GetContactByIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetContactByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetContactByIdQuery>(GetContactByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetContactById', 'query');
    },
    GetBusinessContactWithEmployees(variables: GetBusinessContactWithEmployeesQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetBusinessContactWithEmployeesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetBusinessContactWithEmployeesQuery>(GetBusinessContactWithEmployeesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetBusinessContactWithEmployees', 'query');
    },
    ListContacts(variables: ListContactsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListContactsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListContactsQuery>(ListContactsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListContacts', 'query');
    },
    GetBusinessContactWithAssociatedPriceBooks(variables: GetBusinessContactWithAssociatedPriceBooksQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetBusinessContactWithAssociatedPriceBooksQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetBusinessContactWithAssociatedPriceBooksQuery>(GetBusinessContactWithAssociatedPriceBooksDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetBusinessContactWithAssociatedPriceBooks', 'query');
    },
    ValidEnterpriseDomain(variables: ValidEnterpriseDomainQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ValidEnterpriseDomainQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ValidEnterpriseDomainQuery>(ValidEnterpriseDomainDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ValidEnterpriseDomain', 'query');
    },
    GetSignedUploadUrl(variables: GetSignedUploadUrlQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetSignedUploadUrlQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetSignedUploadUrlQuery>(GetSignedUploadUrlDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetSignedUploadUrl', 'query');
    },
    AddFileToEntity(variables: AddFileToEntityMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<AddFileToEntityMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AddFileToEntityMutation>(AddFileToEntityDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'AddFileToEntity', 'mutation');
    },
    ListFilesByEntityId(variables: ListFilesByEntityIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListFilesByEntityIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListFilesByEntityIdQuery>(ListFilesByEntityIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListFilesByEntityId', 'query');
    },
    RenameFile(variables: RenameFileMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<RenameFileMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RenameFileMutation>(RenameFileDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'RenameFile', 'mutation');
    },
    RemoveFileFromEntity(variables: RemoveFileFromEntityMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<RemoveFileFromEntityMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RemoveFileFromEntityMutation>(RemoveFileFromEntityDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'RemoveFileFromEntity', 'mutation');
    },
    InviteUserToWorkspace(variables: InviteUserToWorkspaceMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<InviteUserToWorkspaceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<InviteUserToWorkspaceMutation>(InviteUserToWorkspaceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'InviteUserToWorkspace', 'mutation');
    },
    AssignInventoryToRentalFulfilment(variables: AssignInventoryToRentalFulfilmentMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<AssignInventoryToRentalFulfilmentMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AssignInventoryToRentalFulfilmentMutation>(AssignInventoryToRentalFulfilmentDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'AssignInventoryToRentalFulfilment', 'mutation');
    },
    UnassignInventoryFromRentalFulfilment(variables: UnassignInventoryFromRentalFulfilmentMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UnassignInventoryFromRentalFulfilmentMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UnassignInventoryFromRentalFulfilmentMutation>(UnassignInventoryFromRentalFulfilmentDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UnassignInventoryFromRentalFulfilment', 'mutation');
    },
    CreateInventoryForFulfilmentTest(variables: CreateInventoryForFulfilmentTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateInventoryForFulfilmentTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateInventoryForFulfilmentTestMutation>(CreateInventoryForFulfilmentTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateInventoryForFulfilmentTest', 'mutation');
    },
    UtilListInventoryReservations(variables?: UtilListInventoryReservationsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UtilListInventoryReservationsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<UtilListInventoryReservationsQuery>(UtilListInventoryReservationsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UtilListInventoryReservations', 'query');
    },
    CreateRentalFulfilment(variables: CreateRentalFulfilmentMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateRentalFulfilmentMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRentalFulfilmentMutation>(CreateRentalFulfilmentDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateRentalFulfilment', 'mutation');
    },
    CreateSaleFulfilment(variables: CreateSaleFulfilmentMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateSaleFulfilmentMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateSaleFulfilmentMutation>(CreateSaleFulfilmentDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateSaleFulfilment', 'mutation');
    },
    CreateServiceFulfilment(variables: CreateServiceFulfilmentMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateServiceFulfilmentMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateServiceFulfilmentMutation>(CreateServiceFulfilmentDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateServiceFulfilment', 'mutation');
    },
    DeleteFulfilment(variables: DeleteFulfilmentMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<DeleteFulfilmentMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteFulfilmentMutation>(DeleteFulfilmentDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'DeleteFulfilment', 'mutation');
    },
    GetFulfilmentById(variables: GetFulfilmentByIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetFulfilmentByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetFulfilmentByIdQuery>(GetFulfilmentByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetFulfilmentById', 'query');
    },
    ListFulfilments(variables: ListFulfilmentsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListFulfilmentsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListFulfilmentsQuery>(ListFulfilmentsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListFulfilments', 'query');
    },
    UpdateFulfilmentColumn(variables: UpdateFulfilmentColumnMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateFulfilmentColumnMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateFulfilmentColumnMutation>(UpdateFulfilmentColumnDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateFulfilmentColumn', 'mutation');
    },
    UpdateFulfilmentAssignee(variables: UpdateFulfilmentAssigneeMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateFulfilmentAssigneeMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateFulfilmentAssigneeMutation>(UpdateFulfilmentAssigneeDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateFulfilmentAssignee', 'mutation');
    },
    SetRentalStartDate(variables: SetRentalStartDateMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SetRentalStartDateMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SetRentalStartDateMutation>(SetRentalStartDateDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SetRentalStartDate', 'mutation');
    },
    SetRentalEndDate(variables: SetRentalEndDateMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SetRentalEndDateMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SetRentalEndDateMutation>(SetRentalEndDateDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SetRentalEndDate', 'mutation');
    },
    SetExpectedRentalEndDate(variables: SetExpectedRentalEndDateMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SetExpectedRentalEndDateMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SetExpectedRentalEndDateMutation>(SetExpectedRentalEndDateDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SetExpectedRentalEndDate', 'mutation');
    },
    CreateRentalPurchaseOrderLineItem(variables: CreateRentalPurchaseOrderLineItemMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateRentalPurchaseOrderLineItemMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRentalPurchaseOrderLineItemMutation>(CreateRentalPurchaseOrderLineItemDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateRentalPurchaseOrderLineItem', 'mutation');
    },
    SetFulfilmentPurchaseOrderLineItemId(variables: SetFulfilmentPurchaseOrderLineItemIdMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SetFulfilmentPurchaseOrderLineItemIdMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SetFulfilmentPurchaseOrderLineItemIdMutation>(SetFulfilmentPurchaseOrderLineItemIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SetFulfilmentPurchaseOrderLineItemId', 'mutation');
    },
    ListCharges(variables: ListChargesQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListChargesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListChargesQuery>(ListChargesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListCharges', 'query');
    },
    ListRentalFulfilments(variables: ListRentalFulfilmentsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListRentalFulfilmentsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListRentalFulfilmentsQuery>(ListRentalFulfilmentsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListRentalFulfilments', 'query');
    },
    GetDefaultTemplates(variables: GetDefaultTemplatesQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetDefaultTemplatesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetDefaultTemplatesQuery>(GetDefaultTemplatesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetDefaultTemplates', 'query');
    },
    GetIntakeFormLineItemWithInventoryReservations(variables: GetIntakeFormLineItemWithInventoryReservationsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetIntakeFormLineItemWithInventoryReservationsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetIntakeFormLineItemWithInventoryReservationsQuery>(GetIntakeFormLineItemWithInventoryReservationsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetIntakeFormLineItemWithInventoryReservations', 'query');
    },
    SubmitSalesOrderForPortalTest(variables: SubmitSalesOrderForPortalTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SubmitSalesOrderForPortalTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SubmitSalesOrderForPortalTestMutation>(SubmitSalesOrderForPortalTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SubmitSalesOrderForPortalTest', 'mutation');
    },
    ListFulfilmentsForPortalTest(variables: ListFulfilmentsForPortalTestQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListFulfilmentsForPortalTestQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListFulfilmentsForPortalTestQuery>(ListFulfilmentsForPortalTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListFulfilmentsForPortalTest', 'query');
    },
    SetRentalStartDateForPortalTest(variables: SetRentalStartDateForPortalTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SetRentalStartDateForPortalTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SetRentalStartDateForPortalTestMutation>(SetRentalStartDateForPortalTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SetRentalStartDateForPortalTest', 'mutation');
    },
    SetRentalEndDateForPortalTest(variables: SetRentalEndDateForPortalTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SetRentalEndDateForPortalTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SetRentalEndDateForPortalTestMutation>(SetRentalEndDateForPortalTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SetRentalEndDateForPortalTest', 'mutation');
    },
    AssignInventoryForPortalTest(variables: AssignInventoryForPortalTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<AssignInventoryForPortalTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AssignInventoryForPortalTestMutation>(AssignInventoryForPortalTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'AssignInventoryForPortalTest', 'mutation');
    },
    CreateInventoryForPortalTest(variables: CreateInventoryForPortalTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateInventoryForPortalTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateInventoryForPortalTestMutation>(CreateInventoryForPortalTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateInventoryForPortalTest', 'mutation');
    },
    GetIntakeFormSubmissionByIdForPortalTest(variables: GetIntakeFormSubmissionByIdForPortalTestQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetIntakeFormSubmissionByIdForPortalTestQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetIntakeFormSubmissionByIdForPortalTestQuery>(GetIntakeFormSubmissionByIdForPortalTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetIntakeFormSubmissionByIdForPortalTest', 'query');
    },
    ListIntakeFormSubmissionLineItemsForPortalTest(variables: ListIntakeFormSubmissionLineItemsForPortalTestQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListIntakeFormSubmissionLineItemsForPortalTestQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListIntakeFormSubmissionLineItemsForPortalTestQuery>(ListIntakeFormSubmissionLineItemsForPortalTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListIntakeFormSubmissionLineItemsForPortalTest', 'query');
    },
    CreateIntakeForm(variables: CreateIntakeFormMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateIntakeFormMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateIntakeFormMutation>(CreateIntakeFormDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateIntakeForm', 'mutation');
    },
    SetIntakeFormActive(variables: SetIntakeFormActiveMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SetIntakeFormActiveMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SetIntakeFormActiveMutation>(SetIntakeFormActiveDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SetIntakeFormActive', 'mutation');
    },
    DeleteIntakeForm(variables: DeleteIntakeFormMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<DeleteIntakeFormMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteIntakeFormMutation>(DeleteIntakeFormDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'DeleteIntakeForm', 'mutation');
    },
    GetIntakeFormById(variables: GetIntakeFormByIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetIntakeFormByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetIntakeFormByIdQuery>(GetIntakeFormByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetIntakeFormById', 'query');
    },
    ListIntakeForms(variables: ListIntakeFormsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListIntakeFormsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListIntakeFormsQuery>(ListIntakeFormsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListIntakeForms', 'query');
    },
    ListIntakeFormsWithWorkspace(variables: ListIntakeFormsWithWorkspaceQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListIntakeFormsWithWorkspaceQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListIntakeFormsWithWorkspaceQuery>(ListIntakeFormsWithWorkspaceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListIntakeFormsWithWorkspace', 'query');
    },
    CreateIntakeFormSubmission(variables: CreateIntakeFormSubmissionMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateIntakeFormSubmissionMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateIntakeFormSubmissionMutation>(CreateIntakeFormSubmissionDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateIntakeFormSubmission', 'mutation');
    },
    ListIntakeFormSubmissions(variables: ListIntakeFormSubmissionsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListIntakeFormSubmissionsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListIntakeFormSubmissionsQuery>(ListIntakeFormSubmissionsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListIntakeFormSubmissions', 'query');
    },
    ListIntakeFormSubmissionsAsBuyer(variables: ListIntakeFormSubmissionsAsBuyerQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListIntakeFormSubmissionsAsBuyerQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListIntakeFormSubmissionsAsBuyerQuery>(ListIntakeFormSubmissionsAsBuyerDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListIntakeFormSubmissionsAsBuyer', 'query');
    },
    UpdateIntakeFormSubmission(variables: UpdateIntakeFormSubmissionMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateIntakeFormSubmissionMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateIntakeFormSubmissionMutation>(UpdateIntakeFormSubmissionDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateIntakeFormSubmission', 'mutation');
    },
    GetIntakeFormSubmissionLineItem(variables: GetIntakeFormSubmissionLineItemQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetIntakeFormSubmissionLineItemQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetIntakeFormSubmissionLineItemQuery>(GetIntakeFormSubmissionLineItemDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetIntakeFormSubmissionLineItem', 'query');
    },
    ListIntakeFormSubmissionLineItems(variables: ListIntakeFormSubmissionLineItemsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListIntakeFormSubmissionLineItemsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListIntakeFormSubmissionLineItemsQuery>(ListIntakeFormSubmissionLineItemsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListIntakeFormSubmissionLineItems', 'query');
    },
    CreateIntakeFormSubmissionLineItem(variables: CreateIntakeFormSubmissionLineItemMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateIntakeFormSubmissionLineItemMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateIntakeFormSubmissionLineItemMutation>(CreateIntakeFormSubmissionLineItemDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateIntakeFormSubmissionLineItem', 'mutation');
    },
    UpdateIntakeFormSubmissionLineItem(variables: UpdateIntakeFormSubmissionLineItemMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateIntakeFormSubmissionLineItemMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateIntakeFormSubmissionLineItemMutation>(UpdateIntakeFormSubmissionLineItemDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateIntakeFormSubmissionLineItem', 'mutation');
    },
    DeleteIntakeFormSubmissionLineItem(variables: DeleteIntakeFormSubmissionLineItemMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<DeleteIntakeFormSubmissionLineItemMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteIntakeFormSubmissionLineItemMutation>(DeleteIntakeFormSubmissionLineItemDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'DeleteIntakeFormSubmissionLineItem', 'mutation');
    },
    SubmitIntakeFormSubmission(variables: SubmitIntakeFormSubmissionMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SubmitIntakeFormSubmissionMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SubmitIntakeFormSubmissionMutation>(SubmitIntakeFormSubmissionDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SubmitIntakeFormSubmission', 'mutation');
    },
    GetIntakeFormSubmissionById(variables: GetIntakeFormSubmissionByIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetIntakeFormSubmissionByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetIntakeFormSubmissionByIdQuery>(GetIntakeFormSubmissionByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetIntakeFormSubmissionById', 'query');
    },
    UpdateIntakeForm(variables: UpdateIntakeFormMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateIntakeFormMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateIntakeFormMutation>(UpdateIntakeFormDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateIntakeForm', 'mutation');
    },
    ListIntakeFormsForUser(variables?: ListIntakeFormsForUserQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListIntakeFormsForUserQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListIntakeFormsForUserQuery>(ListIntakeFormsForUserDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListIntakeFormsForUser', 'query');
    },
    AdoptOrphanedSubmissions(variables: AdoptOrphanedSubmissionsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<AdoptOrphanedSubmissionsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AdoptOrphanedSubmissionsMutation>(AdoptOrphanedSubmissionsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'AdoptOrphanedSubmissions', 'mutation');
    },
    ListMyOrphanedSubmissions(variables?: ListMyOrphanedSubmissionsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListMyOrphanedSubmissionsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListMyOrphanedSubmissionsQuery>(ListMyOrphanedSubmissionsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListMyOrphanedSubmissions', 'query');
    },
    CreatePOForLineItemInventory(variables?: CreatePoForLineItemInventoryMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePoForLineItemInventoryMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePoForLineItemInventoryMutation>(CreatePoForLineItemInventoryDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePOForLineItemInventory', 'mutation');
    },
    CreateSaleLineItemForInventory(variables?: CreateSaleLineItemForInventoryMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateSaleLineItemForInventoryMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateSaleLineItemForInventoryMutation>(CreateSaleLineItemForInventoryDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateSaleLineItemForInventory', 'mutation');
    },
    GetLineItemWithInventory(variables: GetLineItemWithInventoryQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetLineItemWithInventoryQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetLineItemWithInventoryQuery>(GetLineItemWithInventoryDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetLineItemWithInventory', 'query');
    },
    CreatePOForFulfillment(variables?: CreatePoForFulfillmentMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePoForFulfillmentMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePoForFulfillmentMutation>(CreatePoForFulfillmentDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePOForFulfillment', 'mutation');
    },
    GetPOWithFulfillmentProgress(variables: GetPoWithFulfillmentProgressQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetPoWithFulfillmentProgressQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPoWithFulfillmentProgressQuery>(GetPoWithFulfillmentProgressDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetPOWithFulfillmentProgress', 'query');
    },
    CreatePOFullyFulfilled(variables?: CreatePoFullyFulfilledMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePoFullyFulfilledMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePoFullyFulfilledMutation>(CreatePoFullyFulfilledDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePOFullyFulfilled', 'mutation');
    },
    GetFullyFulfilledPO(variables: GetFullyFulfilledPoQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetFullyFulfilledPoQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetFullyFulfilledPoQuery>(GetFullyFulfilledPoDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetFullyFulfilledPO', 'query');
    },
    CreatePONoInventory(variables?: CreatePoNoInventoryMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePoNoInventoryMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePoNoInventoryMutation>(CreatePoNoInventoryDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePONoInventory', 'mutation');
    },
    GetEmptyPO(variables: GetEmptyPoQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetEmptyPoQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetEmptyPoQuery>(GetEmptyPoDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetEmptyPO', 'query');
    },
    CreateInventoryWithReturnDates(variables: CreateInventoryWithReturnDatesMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateInventoryWithReturnDatesMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateInventoryWithReturnDatesMutation>(CreateInventoryWithReturnDatesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateInventoryWithReturnDates', 'mutation');
    },
    UpdateInventoryExpectedReturnDate(variables: UpdateInventoryExpectedReturnDateMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateInventoryExpectedReturnDateMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateInventoryExpectedReturnDateMutation>(UpdateInventoryExpectedReturnDateDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateInventoryExpectedReturnDate', 'mutation');
    },
    UpdateInventoryActualReturnDate(variables: UpdateInventoryActualReturnDateMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateInventoryActualReturnDateMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateInventoryActualReturnDateMutation>(UpdateInventoryActualReturnDateDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateInventoryActualReturnDate', 'mutation');
    },
    GetInventoryWithReturnDates(variables: GetInventoryWithReturnDatesQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetInventoryWithReturnDatesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetInventoryWithReturnDatesQuery>(GetInventoryWithReturnDatesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetInventoryWithReturnDates', 'query');
    },
    CreateInventory(variables: CreateInventoryMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateInventoryMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateInventoryMutation>(CreateInventoryDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateInventory', 'mutation');
    },
    BulkMarkInventoryReceived(variables: BulkMarkInventoryReceivedMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<BulkMarkInventoryReceivedMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<BulkMarkInventoryReceivedMutation>(BulkMarkInventoryReceivedDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'BulkMarkInventoryReceived', 'mutation');
    },
    UpdateInventorySerialisedId(variables: UpdateInventorySerialisedIdMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateInventorySerialisedIdMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateInventorySerialisedIdMutation>(UpdateInventorySerialisedIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateInventorySerialisedId', 'mutation');
    },
    DeleteInventory(variables: DeleteInventoryMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<DeleteInventoryMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteInventoryMutation>(DeleteInventoryDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'DeleteInventory', 'mutation');
    },
    InventoryById(variables: InventoryByIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<InventoryByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<InventoryByIdQuery>(InventoryByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'InventoryById', 'query');
    },
    ListInventoryItems(variables?: ListInventoryItemsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListInventoryItemsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListInventoryItemsQuery>(ListInventoryItemsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListInventoryItems', 'query');
    },
    ListInventoryGroupedByPimCategoryId(variables?: ListInventoryGroupedByPimCategoryIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListInventoryGroupedByPimCategoryIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListInventoryGroupedByPimCategoryIdQuery>(ListInventoryGroupedByPimCategoryIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListInventoryGroupedByPimCategoryId', 'query');
    },
    CreateWorkspaceForInvoice(variables: CreateWorkspaceForInvoiceMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateWorkspaceForInvoiceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateWorkspaceForInvoiceMutation>(CreateWorkspaceForInvoiceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateWorkspaceForInvoice', 'mutation');
    },
    AddTaxLineItem(variables: AddTaxLineItemMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<AddTaxLineItemMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AddTaxLineItemMutation>(AddTaxLineItemDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'AddTaxLineItem', 'mutation');
    },
    UpdateTaxLineItem(variables: UpdateTaxLineItemMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateTaxLineItemMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateTaxLineItemMutation>(UpdateTaxLineItemDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateTaxLineItem', 'mutation');
    },
    RemoveTaxLineItem(variables: RemoveTaxLineItemMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<RemoveTaxLineItemMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RemoveTaxLineItemMutation>(RemoveTaxLineItemDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'RemoveTaxLineItem', 'mutation');
    },
    ClearInvoiceTaxes(variables: ClearInvoiceTaxesMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ClearInvoiceTaxesMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ClearInvoiceTaxesMutation>(ClearInvoiceTaxesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ClearInvoiceTaxes', 'mutation');
    },
    InvoiceByIdWithTaxes(variables: InvoiceByIdWithTaxesQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<InvoiceByIdWithTaxesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<InvoiceByIdWithTaxesQuery>(InvoiceByIdWithTaxesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'InvoiceByIdWithTaxes', 'query');
    },
    CreateInvoice(variables: CreateInvoiceMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateInvoiceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateInvoiceMutation>(CreateInvoiceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateInvoice', 'mutation');
    },
    MarkInvoiceAsSent(variables: MarkInvoiceAsSentMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<MarkInvoiceAsSentMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<MarkInvoiceAsSentMutation>(MarkInvoiceAsSentDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'MarkInvoiceAsSent', 'mutation');
    },
    DeleteInvoice(variables: DeleteInvoiceMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<DeleteInvoiceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteInvoiceMutation>(DeleteInvoiceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'DeleteInvoice', 'mutation');
    },
    MarkInvoiceAsPaid(variables: MarkInvoiceAsPaidMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<MarkInvoiceAsPaidMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<MarkInvoiceAsPaidMutation>(MarkInvoiceAsPaidDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'MarkInvoiceAsPaid', 'mutation');
    },
    CancelInvoice(variables: CancelInvoiceMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CancelInvoiceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CancelInvoiceMutation>(CancelInvoiceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CancelInvoice', 'mutation');
    },
    InvoiceById(variables: InvoiceByIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<InvoiceByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<InvoiceByIdQuery>(InvoiceByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'InvoiceById', 'query');
    },
    AddInvoiceCharges(variables: AddInvoiceChargesMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<AddInvoiceChargesMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AddInvoiceChargesMutation>(AddInvoiceChargesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'AddInvoiceCharges', 'mutation');
    },
    CreateChargeForInvoice(variables: CreateChargeForInvoiceMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateChargeForInvoiceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateChargeForInvoiceMutation>(CreateChargeForInvoiceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateChargeForInvoice', 'mutation');
    },
    ListChargesForInvoice(variables: ListChargesForInvoiceQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListChargesForInvoiceQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListChargesForInvoiceQuery>(ListChargesForInvoiceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListChargesForInvoice', 'query');
    },
    CreateProjectForMCP(variables: CreateProjectForMcpMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateProjectForMcpMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateProjectForMcpMutation>(CreateProjectForMcpDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateProjectForMCP', 'mutation');
    },
    CreateBusinessContactForMCP(variables: CreateBusinessContactForMcpMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateBusinessContactForMcpMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateBusinessContactForMcpMutation>(CreateBusinessContactForMcpDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateBusinessContactForMCP', 'mutation');
    },
    CreatePersonContactForMCP(variables: CreatePersonContactForMcpMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePersonContactForMcpMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePersonContactForMcpMutation>(CreatePersonContactForMcpDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePersonContactForMCP', 'mutation');
    },
    CreatePimCategoryForMCP(variables: CreatePimCategoryForMcpMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePimCategoryForMcpMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePimCategoryForMcpMutation>(CreatePimCategoryForMcpDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePimCategoryForMCP', 'mutation');
    },
    CreatePriceBookForMCP(variables: CreatePriceBookForMcpMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePriceBookForMcpMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePriceBookForMcpMutation>(CreatePriceBookForMcpDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePriceBookForMCP', 'mutation');
    },
    CreateRentalPriceForMCP(variables: CreateRentalPriceForMcpMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateRentalPriceForMcpMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRentalPriceForMcpMutation>(CreateRentalPriceForMcpDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateRentalPriceForMCP', 'mutation');
    },
    GetNoteById(variables: GetNoteByIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetNoteByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetNoteByIdQuery>(GetNoteByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetNoteById', 'query');
    },
    CreateNote(variables: CreateNoteMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateNoteMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateNoteMutation>(CreateNoteDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateNote', 'mutation');
    },
    ListNotesByEntityId(variables: ListNotesByEntityIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListNotesByEntityIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListNotesByEntityIdQuery>(ListNotesByEntityIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListNotesByEntityId', 'query');
    },
    UpdateNote(variables: UpdateNoteMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateNoteMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateNoteMutation>(UpdateNoteDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateNote', 'mutation');
    },
    DeleteNote(variables: DeleteNoteMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<DeleteNoteMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteNoteMutation>(DeleteNoteDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'DeleteNote', 'mutation');
    },
    CreatePimCategoryForPriceBooks(variables: CreatePimCategoryForPriceBooksMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePimCategoryForPriceBooksMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePimCategoryForPriceBooksMutation>(CreatePimCategoryForPriceBooksDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePimCategoryForPriceBooks', 'mutation');
    },
    CreatePriceBook(variables: CreatePriceBookMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePriceBookMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePriceBookMutation>(CreatePriceBookDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePriceBook', 'mutation');
    },
    UpdatePriceBook(variables: UpdatePriceBookMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdatePriceBookMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdatePriceBookMutation>(UpdatePriceBookDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdatePriceBook', 'mutation');
    },
    ListPriceBooks(variables: ListPriceBooksQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListPriceBooksQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListPriceBooksQuery>(ListPriceBooksDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListPriceBooks', 'query');
    },
    GetPriceBookById(variables: GetPriceBookByIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetPriceBookByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPriceBookByIdQuery>(GetPriceBookByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetPriceBookById', 'query');
    },
    ListPriceBookCategories(variables: ListPriceBookCategoriesQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListPriceBookCategoriesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListPriceBookCategoriesQuery>(ListPriceBookCategoriesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListPriceBookCategories', 'query');
    },
    DeletePriceBookById(variables: DeletePriceBookByIdMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<DeletePriceBookByIdMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeletePriceBookByIdMutation>(DeletePriceBookByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'DeletePriceBookById', 'mutation');
    },
    CreateRentalPriceForPriceBooks(variables: CreateRentalPriceForPriceBooksMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateRentalPriceForPriceBooksMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRentalPriceForPriceBooksMutation>(CreateRentalPriceForPriceBooksDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateRentalPriceForPriceBooks', 'mutation');
    },
    CreatePimCategoryForPrices(variables: CreatePimCategoryForPricesMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePimCategoryForPricesMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePimCategoryForPricesMutation>(CreatePimCategoryForPricesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePimCategoryForPrices', 'mutation');
    },
    CreatePriceBookForPrices(variables: CreatePriceBookForPricesMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePriceBookForPricesMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePriceBookForPricesMutation>(CreatePriceBookForPricesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePriceBookForPrices', 'mutation');
    },
    CreateRentalPriceForPrices(variables: CreateRentalPriceForPricesMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateRentalPriceForPricesMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRentalPriceForPricesMutation>(CreateRentalPriceForPricesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateRentalPriceForPrices', 'mutation');
    },
    CreateSalePriceForPrices(variables: CreateSalePriceForPricesMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateSalePriceForPricesMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateSalePriceForPricesMutation>(CreateSalePriceForPricesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateSalePriceForPrices', 'mutation');
    },
    ListPrices(variables: ListPricesQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListPricesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListPricesQuery>(ListPricesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListPrices', 'query');
    },
    DeletePriceById(variables: DeletePriceByIdMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<DeletePriceByIdMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeletePriceByIdMutation>(DeletePriceByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'DeletePriceById', 'mutation');
    },
    CreateBusinessContactForPrices(variables: CreateBusinessContactForPricesMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateBusinessContactForPricesMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateBusinessContactForPricesMutation>(CreateBusinessContactForPricesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateBusinessContactForPrices', 'mutation');
    },
    CreateProjectForPrices(variables?: CreateProjectForPricesMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateProjectForPricesMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateProjectForPricesMutation>(CreateProjectForPricesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateProjectForPrices', 'mutation');
    },
    CalculateSubTotal(variables: CalculateSubTotalQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CalculateSubTotalQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<CalculateSubTotalQuery>(CalculateSubTotalDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CalculateSubTotal', 'query');
    },
    GetRentalPriceWithCalculateSubTotal(variables: GetRentalPriceWithCalculateSubTotalQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetRentalPriceWithCalculateSubTotalQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRentalPriceWithCalculateSubTotalQuery>(GetRentalPriceWithCalculateSubTotalDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetRentalPriceWithCalculateSubTotal', 'query');
    },
    GetPriceById(variables: GetPriceByIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetPriceByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPriceByIdQuery>(GetPriceByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetPriceById', 'query');
    },
    ListProjects(variables: ListProjectsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListProjectsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListProjectsQuery>(ListProjectsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListProjects', 'query');
    },
    DeleteProject(variables: DeleteProjectMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<DeleteProjectMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteProjectMutation>(DeleteProjectDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'DeleteProject', 'mutation');
    },
    CreateProject(variables?: CreateProjectMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateProjectMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateProjectMutation>(CreateProjectDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateProject', 'mutation');
    },
    UpdateProject(variables: UpdateProjectMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateProjectMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateProjectMutation>(UpdateProjectDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateProject', 'mutation');
    },
    GetProjectById(variables: GetProjectByIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetProjectByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetProjectByIdQuery>(GetProjectByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetProjectById', 'query');
    },
    GetProjectWithContact(variables: GetProjectWithContactQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetProjectWithContactQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetProjectWithContactQuery>(GetProjectWithContactDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetProjectWithContact', 'query');
    },
    GetProjectWithAssociatedPriceBooks(variables: GetProjectWithAssociatedPriceBooksQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetProjectWithAssociatedPriceBooksQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetProjectWithAssociatedPriceBooksQuery>(GetProjectWithAssociatedPriceBooksDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetProjectWithAssociatedPriceBooks', 'query');
    },
    GetProjectWithDescendantCount(variables: GetProjectWithDescendantCountQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetProjectWithDescendantCountQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetProjectWithDescendantCountQuery>(GetProjectWithDescendantCountDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetProjectWithDescendantCount', 'query');
    },
    CreatePurchaseOrderForFulfilmentTest(variables?: CreatePurchaseOrderForFulfilmentTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePurchaseOrderForFulfilmentTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePurchaseOrderForFulfilmentTestMutation>(CreatePurchaseOrderForFulfilmentTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePurchaseOrderForFulfilmentTest', 'mutation');
    },
    CreateRentalPOLineItemForFulfilmentTest(variables?: CreateRentalPoLineItemForFulfilmentTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateRentalPoLineItemForFulfilmentTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRentalPoLineItemForFulfilmentTestMutation>(CreateRentalPoLineItemForFulfilmentTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateRentalPOLineItemForFulfilmentTest', 'mutation');
    },
    CreateSalesOrderForFulfilmentTest(variables?: CreateSalesOrderForFulfilmentTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateSalesOrderForFulfilmentTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateSalesOrderForFulfilmentTestMutation>(CreateSalesOrderForFulfilmentTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateSalesOrderForFulfilmentTest', 'mutation');
    },
    CreateRentalSOLineItemForFulfilmentTest(variables: CreateRentalSoLineItemForFulfilmentTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateRentalSoLineItemForFulfilmentTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRentalSoLineItemForFulfilmentTestMutation>(CreateRentalSoLineItemForFulfilmentTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateRentalSOLineItemForFulfilmentTest', 'mutation');
    },
    CreateRentalPriceForFulfilmentTest(variables: CreateRentalPriceForFulfilmentTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateRentalPriceForFulfilmentTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRentalPriceForFulfilmentTestMutation>(CreateRentalPriceForFulfilmentTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateRentalPriceForFulfilmentTest', 'mutation');
    },
    CreatePimCategoryForTest(variables: CreatePimCategoryForTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePimCategoryForTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePimCategoryForTestMutation>(CreatePimCategoryForTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePimCategoryForTest', 'mutation');
    },
    CreateRentalFulfilmentForTest(variables: CreateRentalFulfilmentForTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateRentalFulfilmentForTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRentalFulfilmentForTestMutation>(CreateRentalFulfilmentForTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateRentalFulfilmentForTest', 'mutation');
    },
    SetFulfilmentPurchaseOrderLineItemForTest(variables: SetFulfilmentPurchaseOrderLineItemForTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SetFulfilmentPurchaseOrderLineItemForTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SetFulfilmentPurchaseOrderLineItemForTestMutation>(SetFulfilmentPurchaseOrderLineItemForTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SetFulfilmentPurchaseOrderLineItemForTest', 'mutation');
    },
    SubmitPurchaseOrderForFulfilmentTest(variables: SubmitPurchaseOrderForFulfilmentTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SubmitPurchaseOrderForFulfilmentTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SubmitPurchaseOrderForFulfilmentTestMutation>(SubmitPurchaseOrderForFulfilmentTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SubmitPurchaseOrderForFulfilmentTest', 'mutation');
    },
    ListRentalFulfilmentsForTest(variables: ListRentalFulfilmentsForTestQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListRentalFulfilmentsForTestQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListRentalFulfilmentsForTestQuery>(ListRentalFulfilmentsForTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListRentalFulfilmentsForTest', 'query');
    },
    ListInventoryForFulfilmentTest(variables?: ListInventoryForFulfilmentTestQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListInventoryForFulfilmentTestQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListInventoryForFulfilmentTestQuery>(ListInventoryForFulfilmentTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListInventoryForFulfilmentTest', 'query');
    },
    CreatePurchaseOrderForInventoryTest(variables?: CreatePurchaseOrderForInventoryTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePurchaseOrderForInventoryTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePurchaseOrderForInventoryTestMutation>(CreatePurchaseOrderForInventoryTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePurchaseOrderForInventoryTest', 'mutation');
    },
    CreateRentalPOLineItemForInventoryTest(variables?: CreateRentalPoLineItemForInventoryTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateRentalPoLineItemForInventoryTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRentalPoLineItemForInventoryTestMutation>(CreateRentalPoLineItemForInventoryTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateRentalPOLineItemForInventoryTest', 'mutation');
    },
    CreateSalePOLineItemForInventoryTest(variables?: CreateSalePoLineItemForInventoryTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateSalePoLineItemForInventoryTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateSalePoLineItemForInventoryTestMutation>(CreateSalePoLineItemForInventoryTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateSalePOLineItemForInventoryTest', 'mutation');
    },
    SubmitPurchaseOrderForInventoryTest(variables: SubmitPurchaseOrderForInventoryTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SubmitPurchaseOrderForInventoryTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SubmitPurchaseOrderForInventoryTestMutation>(SubmitPurchaseOrderForInventoryTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SubmitPurchaseOrderForInventoryTest', 'mutation');
    },
    ListInventoryForTest(variables?: ListInventoryForTestQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListInventoryForTestQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListInventoryForTestQuery>(ListInventoryForTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListInventoryForTest', 'query');
    },
    CreateProjectForPurchaseOrder(variables?: CreateProjectForPurchaseOrderMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateProjectForPurchaseOrderMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateProjectForPurchaseOrderMutation>(CreateProjectForPurchaseOrderDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateProjectForPurchaseOrder', 'mutation');
    },
    CreatePersonContact_PurchaseOrder(variables: CreatePersonContact_PurchaseOrderMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePersonContact_PurchaseOrderMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePersonContact_PurchaseOrderMutation>(CreatePersonContact_PurchaseOrderDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePersonContact_PurchaseOrder', 'mutation');
    },
    CreatePurchaseOrder(variables?: CreatePurchaseOrderMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePurchaseOrderMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePurchaseOrderMutation>(CreatePurchaseOrderDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePurchaseOrder', 'mutation');
    },
    GetPurchaseOrderById(variables?: GetPurchaseOrderByIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetPurchaseOrderByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPurchaseOrderByIdQuery>(GetPurchaseOrderByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetPurchaseOrderById', 'query');
    },
    ListPurchaseOrders(variables: ListPurchaseOrdersQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListPurchaseOrdersQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListPurchaseOrdersQuery>(ListPurchaseOrdersDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListPurchaseOrders', 'query');
    },
    CreateQuoteFromIntakeFormSubmissionForTests(variables: CreateQuoteFromIntakeFormSubmissionForTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateQuoteFromIntakeFormSubmissionForTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateQuoteFromIntakeFormSubmissionForTestsMutation>(CreateQuoteFromIntakeFormSubmissionForTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateQuoteFromIntakeFormSubmissionForTests', 'mutation');
    },
    CreateIntakeFormForQuoteTests(variables: CreateIntakeFormForQuoteTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateIntakeFormForQuoteTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateIntakeFormForQuoteTestsMutation>(CreateIntakeFormForQuoteTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateIntakeFormForQuoteTests', 'mutation');
    },
    CreateIntakeFormSubmissionForQuoteTests(variables: CreateIntakeFormSubmissionForQuoteTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateIntakeFormSubmissionForQuoteTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateIntakeFormSubmissionForQuoteTestsMutation>(CreateIntakeFormSubmissionForQuoteTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateIntakeFormSubmissionForQuoteTests', 'mutation');
    },
    CreateIntakeFormSubmissionLineItemForQuoteTests(variables: CreateIntakeFormSubmissionLineItemForQuoteTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateIntakeFormSubmissionLineItemForQuoteTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateIntakeFormSubmissionLineItemForQuoteTestsMutation>(CreateIntakeFormSubmissionLineItemForQuoteTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateIntakeFormSubmissionLineItemForQuoteTests', 'mutation');
    },
    SubmitIntakeFormSubmissionForQuoteTests(variables: SubmitIntakeFormSubmissionForQuoteTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SubmitIntakeFormSubmissionForQuoteTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SubmitIntakeFormSubmissionForQuoteTestsMutation>(SubmitIntakeFormSubmissionForQuoteTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SubmitIntakeFormSubmissionForQuoteTests', 'mutation');
    },
    CreateQuoteRevisionWithOptionalPrice(variables: CreateQuoteRevisionWithOptionalPriceMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateQuoteRevisionWithOptionalPriceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateQuoteRevisionWithOptionalPriceMutation>(CreateQuoteRevisionWithOptionalPriceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateQuoteRevisionWithOptionalPrice', 'mutation');
    },
    CreateQuoteForIntakeTests(variables: CreateQuoteForIntakeTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateQuoteForIntakeTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateQuoteForIntakeTestsMutation>(CreateQuoteForIntakeTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateQuoteForIntakeTests', 'mutation');
    },
    UpdateQuoteRevisionForIntakeTests(variables: UpdateQuoteRevisionForIntakeTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateQuoteRevisionForIntakeTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateQuoteRevisionForIntakeTestsMutation>(UpdateQuoteRevisionForIntakeTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateQuoteRevisionForIntakeTests', 'mutation');
    },
    SendQuoteForIntakeTests(variables: SendQuoteForIntakeTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SendQuoteForIntakeTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SendQuoteForIntakeTestsMutation>(SendQuoteForIntakeTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SendQuoteForIntakeTests', 'mutation');
    },
    CreateRentalPriceForQuoteTests(variables: CreateRentalPriceForQuoteTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateRentalPriceForQuoteTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRentalPriceForQuoteTestsMutation>(CreateRentalPriceForQuoteTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateRentalPriceForQuoteTests', 'mutation');
    },
    CreateSalePriceForQuoteTests(variables: CreateSalePriceForQuoteTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateSalePriceForQuoteTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateSalePriceForQuoteTestsMutation>(CreateSalePriceForQuoteTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateSalePriceForQuoteTests', 'mutation');
    },
    CreatePriceBookForQuoteTests(variables: CreatePriceBookForQuoteTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePriceBookForQuoteTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePriceBookForQuoteTestsMutation>(CreatePriceBookForQuoteTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePriceBookForQuoteTests', 'mutation');
    },
    CreatePimCategoryForQuoteTests(variables: CreatePimCategoryForQuoteTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePimCategoryForQuoteTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePimCategoryForQuoteTestsMutation>(CreatePimCategoryForQuoteTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePimCategoryForQuoteTests', 'mutation');
    },
    CreateBusinessContactForQuoteTests(variables: CreateBusinessContactForQuoteTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateBusinessContactForQuoteTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateBusinessContactForQuoteTestsMutation>(CreateBusinessContactForQuoteTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateBusinessContactForQuoteTests', 'mutation');
    },
    CreatePersonContactForQuoteTests(variables: CreatePersonContactForQuoteTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePersonContactForQuoteTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePersonContactForQuoteTestsMutation>(CreatePersonContactForQuoteTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePersonContactForQuoteTests', 'mutation');
    },
    CreateProjectForQuoteTests(variables: CreateProjectForQuoteTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateProjectForQuoteTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateProjectForQuoteTestsMutation>(CreateProjectForQuoteTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateProjectForQuoteTests', 'mutation');
    },
    CreateQuoteForTests(variables: CreateQuoteForTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateQuoteForTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateQuoteForTestsMutation>(CreateQuoteForTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateQuoteForTests', 'mutation');
    },
    UpdateQuoteForTests(variables: UpdateQuoteForTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateQuoteForTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateQuoteForTestsMutation>(UpdateQuoteForTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateQuoteForTests', 'mutation');
    },
    CreateQuoteRevision(variables: CreateQuoteRevisionMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateQuoteRevisionMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateQuoteRevisionMutation>(CreateQuoteRevisionDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateQuoteRevision', 'mutation');
    },
    GetQuoteRevisionById(variables: GetQuoteRevisionByIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetQuoteRevisionByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetQuoteRevisionByIdQuery>(GetQuoteRevisionByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetQuoteRevisionById', 'query');
    },
    CreateRentalPriceForTests(variables: CreateRentalPriceForTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateRentalPriceForTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRentalPriceForTestsMutation>(CreateRentalPriceForTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateRentalPriceForTests', 'mutation');
    },
    CreateSalePriceForTests(variables: CreateSalePriceForTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateSalePriceForTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateSalePriceForTestsMutation>(CreateSalePriceForTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateSalePriceForTests', 'mutation');
    },
    CreatePimCategoryForTests(variables: CreatePimCategoryForTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePimCategoryForTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePimCategoryForTestsMutation>(CreatePimCategoryForTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePimCategoryForTests', 'mutation');
    },
    CreatePriceBookForTests(variables: CreatePriceBookForTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePriceBookForTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePriceBookForTestsMutation>(CreatePriceBookForTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePriceBookForTests', 'mutation');
    },
    CreateBusinessContactForTests(variables: CreateBusinessContactForTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateBusinessContactForTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateBusinessContactForTestsMutation>(CreateBusinessContactForTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateBusinessContactForTests', 'mutation');
    },
    CreatePersonContactForTests(variables: CreatePersonContactForTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePersonContactForTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePersonContactForTestsMutation>(CreatePersonContactForTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePersonContactForTests', 'mutation');
    },
    CreateProjectForTests(variables: CreateProjectForTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateProjectForTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateProjectForTestsMutation>(CreateProjectForTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateProjectForTests', 'mutation');
    },
    UpdateQuoteRevisionForTests(variables: UpdateQuoteRevisionForTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateQuoteRevisionForTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateQuoteRevisionForTestsMutation>(UpdateQuoteRevisionForTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateQuoteRevisionForTests', 'mutation');
    },
    SendQuoteForTests(variables: SendQuoteForTestsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SendQuoteForTestsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SendQuoteForTestsMutation>(SendQuoteForTestsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SendQuoteForTests', 'mutation');
    },
    CreateReferenceNumberTemplate(variables: CreateReferenceNumberTemplateMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateReferenceNumberTemplateMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateReferenceNumberTemplateMutation>(CreateReferenceNumberTemplateDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateReferenceNumberTemplate', 'mutation');
    },
    UpdateReferenceNumberTemplate(variables: UpdateReferenceNumberTemplateMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateReferenceNumberTemplateMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateReferenceNumberTemplateMutation>(UpdateReferenceNumberTemplateDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateReferenceNumberTemplate', 'mutation');
    },
    DeleteReferenceNumberTemplate(variables: DeleteReferenceNumberTemplateMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<DeleteReferenceNumberTemplateMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteReferenceNumberTemplateMutation>(DeleteReferenceNumberTemplateDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'DeleteReferenceNumberTemplate', 'mutation');
    },
    ResetSequenceNumber(variables: ResetSequenceNumberMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ResetSequenceNumberMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ResetSequenceNumberMutation>(ResetSequenceNumberDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ResetSequenceNumber', 'mutation');
    },
    GenerateReferenceNumber(variables: GenerateReferenceNumberMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GenerateReferenceNumberMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<GenerateReferenceNumberMutation>(GenerateReferenceNumberDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GenerateReferenceNumber', 'mutation');
    },
    ListReferenceNumberTemplates(variables: ListReferenceNumberTemplatesQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListReferenceNumberTemplatesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListReferenceNumberTemplatesQuery>(ListReferenceNumberTemplatesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListReferenceNumberTemplates', 'query');
    },
    GetReferenceNumberTemplate(variables: GetReferenceNumberTemplateQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetReferenceNumberTemplateQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetReferenceNumberTemplateQuery>(GetReferenceNumberTemplateDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetReferenceNumberTemplate', 'query');
    },
    GetCurrentSequenceNumber(variables: GetCurrentSequenceNumberQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetCurrentSequenceNumberQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetCurrentSequenceNumberQuery>(GetCurrentSequenceNumberDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetCurrentSequenceNumber', 'query');
    },
    CreateProjectForReferenceNumbers(variables?: CreateProjectForReferenceNumbersMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateProjectForReferenceNumbersMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateProjectForReferenceNumbersMutation>(CreateProjectForReferenceNumbersDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateProjectForReferenceNumbers', 'mutation');
    },
    CreatePersonContactForReferenceNumbers(variables: CreatePersonContactForReferenceNumbersMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePersonContactForReferenceNumbersMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePersonContactForReferenceNumbersMutation>(CreatePersonContactForReferenceNumbersDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePersonContactForReferenceNumbers', 'mutation');
    },
    ListRentalViews(variables?: ListRentalViewsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListRentalViewsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListRentalViewsQuery>(ListRentalViewsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListRentalViews', 'query');
    },
    CreatePurchaseOrderForQuantityValidation(variables?: CreatePurchaseOrderForQuantityValidationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePurchaseOrderForQuantityValidationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePurchaseOrderForQuantityValidationMutation>(CreatePurchaseOrderForQuantityValidationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePurchaseOrderForQuantityValidation', 'mutation');
    },
    CreateRentalPOLineItemForQuantityValidation(variables?: CreateRentalPoLineItemForQuantityValidationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateRentalPoLineItemForQuantityValidationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRentalPoLineItemForQuantityValidationMutation>(CreateRentalPoLineItemForQuantityValidationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateRentalPOLineItemForQuantityValidation', 'mutation');
    },
    UpdateRentalPOLineItemForQuantityValidation(variables?: UpdateRentalPoLineItemForQuantityValidationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateRentalPoLineItemForQuantityValidationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateRentalPoLineItemForQuantityValidationMutation>(UpdateRentalPoLineItemForQuantityValidationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateRentalPOLineItemForQuantityValidation', 'mutation');
    },
    CreateSalesOrderForQuantityValidation(variables?: CreateSalesOrderForQuantityValidationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateSalesOrderForQuantityValidationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateSalesOrderForQuantityValidationMutation>(CreateSalesOrderForQuantityValidationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateSalesOrderForQuantityValidation', 'mutation');
    },
    CreateRentalSOLineItemForQuantityValidation(variables?: CreateRentalSoLineItemForQuantityValidationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateRentalSoLineItemForQuantityValidationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRentalSoLineItemForQuantityValidationMutation>(CreateRentalSoLineItemForQuantityValidationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateRentalSOLineItemForQuantityValidation', 'mutation');
    },
    UpdateRentalSOLineItemForQuantityValidation(variables?: UpdateRentalSoLineItemForQuantityValidationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateRentalSoLineItemForQuantityValidationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateRentalSoLineItemForQuantityValidationMutation>(UpdateRentalSoLineItemForQuantityValidationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateRentalSOLineItemForQuantityValidation', 'mutation');
    },
    CreateRFQ(variables: CreateRfqMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateRfqMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRfqMutation>(CreateRfqDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateRFQ', 'mutation');
    },
    UpdateRFQ(variables: UpdateRfqMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateRfqMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateRfqMutation>(UpdateRfqDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateRFQ', 'mutation');
    },
    GetRFQWithRelationships(variables: GetRfqWithRelationshipsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetRfqWithRelationshipsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRfqWithRelationshipsQuery>(GetRfqWithRelationshipsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetRFQWithRelationships', 'query');
    },
    ListRFQs(variables: ListRfQsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListRfQsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListRfQsQuery>(ListRfQsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListRFQs', 'query');
    },
    CreateQuoteLinkedToRFQ(variables: CreateQuoteLinkedToRfqMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateQuoteLinkedToRfqMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateQuoteLinkedToRfqMutation>(CreateQuoteLinkedToRfqDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateQuoteLinkedToRFQ', 'mutation');
    },
    ListQuotesByRFQId(variables?: ListQuotesByRfqIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListQuotesByRfqIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListQuotesByRfqIdQuery>(ListQuotesByRfqIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListQuotesByRFQId', 'query');
    },
    CreatePimCategoryForRFQ(variables: CreatePimCategoryForRfqMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePimCategoryForRfqMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePimCategoryForRfqMutation>(CreatePimCategoryForRfqDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePimCategoryForRFQ', 'mutation');
    },
    CreatePersonContactForRFQ(variables: CreatePersonContactForRfqMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePersonContactForRfqMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePersonContactForRfqMutation>(CreatePersonContactForRfqDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePersonContactForRFQ', 'mutation');
    },
    CreateQuoteForRFQTest(variables: CreateQuoteForRfqTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateQuoteForRfqTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateQuoteForRfqTestMutation>(CreateQuoteForRfqTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateQuoteForRFQTest', 'mutation');
    },
    CreateQuoteRevisionForRFQTest(variables: CreateQuoteRevisionForRfqTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateQuoteRevisionForRfqTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateQuoteRevisionForRfqTestMutation>(CreateQuoteRevisionForRfqTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateQuoteRevisionForRFQTest', 'mutation');
    },
    SendQuoteForRFQTest(variables: SendQuoteForRfqTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SendQuoteForRfqTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SendQuoteForRfqTestMutation>(SendQuoteForRfqTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SendQuoteForRFQTest', 'mutation');
    },
    AcceptQuoteForRFQTest(variables: AcceptQuoteForRfqTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<AcceptQuoteForRfqTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AcceptQuoteForRfqTestMutation>(AcceptQuoteForRfqTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'AcceptQuoteForRFQTest', 'mutation');
    },
    RejectQuoteForRFQTest(variables: RejectQuoteForRfqTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<RejectQuoteForRfqTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RejectQuoteForRfqTestMutation>(RejectQuoteForRfqTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'RejectQuoteForRFQTest', 'mutation');
    },
    GetQuoteForRFQTest(variables: GetQuoteForRfqTestQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetQuoteForRfqTestQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetQuoteForRfqTestQuery>(GetQuoteForRfqTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetQuoteForRFQTest', 'query');
    },
    GetRFQForQuoteAcceptance(variables: GetRfqForQuoteAcceptanceQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetRfqForQuoteAcceptanceQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRfqForQuoteAcceptanceQuery>(GetRfqForQuoteAcceptanceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetRFQForQuoteAcceptance', 'query');
    },
    GetQuoteRevisionForAcceptanceTest(variables: GetQuoteRevisionForAcceptanceTestQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetQuoteRevisionForAcceptanceTestQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetQuoteRevisionForAcceptanceTestQuery>(GetQuoteRevisionForAcceptanceTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetQuoteRevisionForAcceptanceTest', 'query');
    },
    CreateProjectForSalesOrder(variables?: CreateProjectForSalesOrderMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateProjectForSalesOrderMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateProjectForSalesOrderMutation>(CreateProjectForSalesOrderDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateProjectForSalesOrder', 'mutation');
    },
    CreateSalesOrder(variables?: CreateSalesOrderMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateSalesOrderMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateSalesOrderMutation>(CreateSalesOrderDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateSalesOrder', 'mutation');
    },
    ListSalesOrders(variables: ListSalesOrdersQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListSalesOrdersQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListSalesOrdersQuery>(ListSalesOrdersDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListSalesOrders', 'query');
    },
    CreateRentalSalesOrderLineItem(variables: CreateRentalSalesOrderLineItemMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateRentalSalesOrderLineItemMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRentalSalesOrderLineItemMutation>(CreateRentalSalesOrderLineItemDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateRentalSalesOrderLineItem', 'mutation');
    },
    CreateSaleSalesOrderLineItem(variables: CreateSaleSalesOrderLineItemMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateSaleSalesOrderLineItemMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateSaleSalesOrderLineItemMutation>(CreateSaleSalesOrderLineItemDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateSaleSalesOrderLineItem', 'mutation');
    },
    SoftDeleteSalesOrderLineItem(variables?: SoftDeleteSalesOrderLineItemMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SoftDeleteSalesOrderLineItemMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SoftDeleteSalesOrderLineItemMutation>(SoftDeleteSalesOrderLineItemDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SoftDeleteSalesOrderLineItem', 'mutation');
    },
    GetSalesOrderLineItemById(variables?: GetSalesOrderLineItemByIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetSalesOrderLineItemByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetSalesOrderLineItemByIdQuery>(GetSalesOrderLineItemByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetSalesOrderLineItemById', 'query');
    },
    GetSalesOrderById(variables?: GetSalesOrderByIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetSalesOrderByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetSalesOrderByIdQuery>(GetSalesOrderByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetSalesOrderById', 'query');
    },
    GetSalesOrderByIdWithAllFields(variables?: GetSalesOrderByIdWithAllFieldsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetSalesOrderByIdWithAllFieldsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetSalesOrderByIdWithAllFieldsQuery>(GetSalesOrderByIdWithAllFieldsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetSalesOrderByIdWithAllFields', 'query');
    },
    GetSalesOrderByIdWithPricing(variables?: GetSalesOrderByIdWithPricingQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetSalesOrderByIdWithPricingQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetSalesOrderByIdWithPricingQuery>(GetSalesOrderByIdWithPricingDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetSalesOrderByIdWithPricing', 'query');
    },
    SubmitSalesOrder(variables: SubmitSalesOrderMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SubmitSalesOrderMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SubmitSalesOrderMutation>(SubmitSalesOrderDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SubmitSalesOrder', 'mutation');
    },
    UpdateSalesOrder(variables: UpdateSalesOrderMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateSalesOrderMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateSalesOrderMutation>(UpdateSalesOrderDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateSalesOrder', 'mutation');
    },
    ListFulfilmentsForSalesOrder(variables: ListFulfilmentsForSalesOrderQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListFulfilmentsForSalesOrderQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListFulfilmentsForSalesOrderQuery>(ListFulfilmentsForSalesOrderDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListFulfilmentsForSalesOrder', 'query');
    },
    CreateRentalPriceForSalesOrder(variables: CreateRentalPriceForSalesOrderMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateRentalPriceForSalesOrderMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRentalPriceForSalesOrderMutation>(CreateRentalPriceForSalesOrderDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateRentalPriceForSalesOrder', 'mutation');
    },
    CreateSalePriceForSalesOrder(variables: CreateSalePriceForSalesOrderMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateSalePriceForSalesOrderMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateSalePriceForSalesOrderMutation>(CreateSalePriceForSalesOrderDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateSalePriceForSalesOrder', 'mutation');
    },
    CreatePimCategory(variables: CreatePimCategoryMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreatePimCategoryMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreatePimCategoryMutation>(CreatePimCategoryDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreatePimCategory', 'mutation');
    },
    SoftDeleteSalesOrder(variables?: SoftDeleteSalesOrderMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SoftDeleteSalesOrderMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SoftDeleteSalesOrderMutation>(SoftDeleteSalesOrderDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SoftDeleteSalesOrder', 'mutation');
    },
    CreateSalesOrderWithIntakeForm(variables?: CreateSalesOrderWithIntakeFormMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateSalesOrderWithIntakeFormMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateSalesOrderWithIntakeFormMutation>(CreateSalesOrderWithIntakeFormDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateSalesOrderWithIntakeForm', 'mutation');
    },
    CreateRentalSalesOrderLineItemWithIntakeForm(variables: CreateRentalSalesOrderLineItemWithIntakeFormMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateRentalSalesOrderLineItemWithIntakeFormMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRentalSalesOrderLineItemWithIntakeFormMutation>(CreateRentalSalesOrderLineItemWithIntakeFormDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateRentalSalesOrderLineItemWithIntakeForm', 'mutation');
    },
    CreateSaleSalesOrderLineItemWithIntakeForm(variables: CreateSaleSalesOrderLineItemWithIntakeFormMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateSaleSalesOrderLineItemWithIntakeFormMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateSaleSalesOrderLineItemWithIntakeFormMutation>(CreateSaleSalesOrderLineItemWithIntakeFormDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateSaleSalesOrderLineItemWithIntakeForm', 'mutation');
    },
    GetSalesOrderWithIntakeForm(variables?: GetSalesOrderWithIntakeFormQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetSalesOrderWithIntakeFormQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetSalesOrderWithIntakeFormQuery>(GetSalesOrderWithIntakeFormDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetSalesOrderWithIntakeForm', 'query');
    },
    GetSalesOrderLineItemWithIntakeForm(variables?: GetSalesOrderLineItemWithIntakeFormQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetSalesOrderLineItemWithIntakeFormQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetSalesOrderLineItemWithIntakeFormQuery>(GetSalesOrderLineItemWithIntakeFormDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetSalesOrderLineItemWithIntakeForm', 'query');
    },
    GetIntakeFormSubmissionWithSalesOrder(variables: GetIntakeFormSubmissionWithSalesOrderQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetIntakeFormSubmissionWithSalesOrderQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetIntakeFormSubmissionWithSalesOrderQuery>(GetIntakeFormSubmissionWithSalesOrderDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetIntakeFormSubmissionWithSalesOrder', 'query');
    },
    GetIntakeFormLineItemWithSalesOrderLineItem(variables: GetIntakeFormLineItemWithSalesOrderLineItemQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetIntakeFormLineItemWithSalesOrderLineItemQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetIntakeFormLineItemWithSalesOrderLineItemQuery>(GetIntakeFormLineItemWithSalesOrderLineItemDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetIntakeFormLineItemWithSalesOrderLineItem', 'query');
    },
    SearchDocuments(variables: SearchDocumentsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SearchDocumentsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<SearchDocumentsQuery>(SearchDocumentsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SearchDocuments', 'query');
    },
    GetSearchDocumentById(variables: GetSearchDocumentByIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetSearchDocumentByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetSearchDocumentByIdQuery>(GetSearchDocumentByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetSearchDocumentById', 'query');
    },
    GetBulkSearchDocumentsById(variables: GetBulkSearchDocumentsByIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetBulkSearchDocumentsByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetBulkSearchDocumentsByIdQuery>(GetBulkSearchDocumentsByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetBulkSearchDocumentsById', 'query');
    },
    GetSearchUserState(variables: GetSearchUserStateQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetSearchUserStateQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetSearchUserStateQuery>(GetSearchUserStateDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetSearchUserState', 'query');
    },
    ToggleSearchFavorite(variables: ToggleSearchFavoriteMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ToggleSearchFavoriteMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ToggleSearchFavoriteMutation>(ToggleSearchFavoriteDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ToggleSearchFavorite', 'mutation');
    },
    AddSearchRecent(variables: AddSearchRecentMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<AddSearchRecentMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AddSearchRecentMutation>(AddSearchRecentDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'AddSearchRecent', 'mutation');
    },
    RemoveSearchRecent(variables: RemoveSearchRecentMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<RemoveSearchRecentMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RemoveSearchRecentMutation>(RemoveSearchRecentDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'RemoveSearchRecent', 'mutation');
    },
    ClearSearchRecents(variables: ClearSearchRecentsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ClearSearchRecentsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ClearSearchRecentsMutation>(ClearSearchRecentsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ClearSearchRecents', 'mutation');
    },
    UtilCreatePimCategory(variables: UtilCreatePimCategoryMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UtilCreatePimCategoryMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UtilCreatePimCategoryMutation>(UtilCreatePimCategoryDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UtilCreatePimCategory', 'mutation');
    },
    UtilCreateWorkspace(variables: UtilCreateWorkspaceMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UtilCreateWorkspaceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UtilCreateWorkspaceMutation>(UtilCreateWorkspaceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UtilCreateWorkspace', 'mutation');
    },
    UtilInviteUserToWorkspace(variables: UtilInviteUserToWorkspaceMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UtilInviteUserToWorkspaceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UtilInviteUserToWorkspaceMutation>(UtilInviteUserToWorkspaceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UtilInviteUserToWorkspace', 'mutation');
    },
    UpdateRentalPrice(variables: UpdateRentalPriceMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateRentalPriceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateRentalPriceMutation>(UpdateRentalPriceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateRentalPrice', 'mutation');
    },
    UpdateSalePrice(variables: UpdateSalePriceMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateSalePriceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateSalePriceMutation>(UpdateSalePriceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateSalePrice', 'mutation');
    },
    UpsertTestUser(variables: UpsertTestUserMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpsertTestUserMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpsertTestUserMutation>(UpsertTestUserDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpsertTestUser', 'mutation');
    },
    SyncCurrentUser(variables?: SyncCurrentUserMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<SyncCurrentUserMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SyncCurrentUserMutation>(SyncCurrentUserDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'SyncCurrentUser', 'mutation');
    },
    CreateWorkflowConfiguration(variables: CreateWorkflowConfigurationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateWorkflowConfigurationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateWorkflowConfigurationMutation>(CreateWorkflowConfigurationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateWorkflowConfiguration', 'mutation');
    },
    ListWorkflowConfigurations(variables?: ListWorkflowConfigurationsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListWorkflowConfigurationsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListWorkflowConfigurationsQuery>(ListWorkflowConfigurationsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListWorkflowConfigurations', 'query');
    },
    GetWorkflowConfigurationById(variables: GetWorkflowConfigurationByIdQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetWorkflowConfigurationByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetWorkflowConfigurationByIdQuery>(GetWorkflowConfigurationByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetWorkflowConfigurationById', 'query');
    },
    UpdateWorkflowConfiguration(variables: UpdateWorkflowConfigurationMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateWorkflowConfigurationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateWorkflowConfigurationMutation>(UpdateWorkflowConfigurationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateWorkflowConfiguration', 'mutation');
    },
    DeleteWorkflowConfigurationById(variables: DeleteWorkflowConfigurationByIdMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<DeleteWorkflowConfigurationByIdMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteWorkflowConfigurationByIdMutation>(DeleteWorkflowConfigurationByIdDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'DeleteWorkflowConfigurationById', 'mutation');
    },
    ListWorkspaceMembersTest(variables: ListWorkspaceMembersTestQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListWorkspaceMembersTestQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListWorkspaceMembersTestQuery>(ListWorkspaceMembersTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListWorkspaceMembersTest', 'query');
    },
    updateWorkspaceUserRoles(variables: UpdateWorkspaceUserRolesMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateWorkspaceUserRolesMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateWorkspaceUserRolesMutation>(UpdateWorkspaceUserRolesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'updateWorkspaceUserRoles', 'mutation');
    },
    removeUserFromWorkspace(variables: RemoveUserFromWorkspaceMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<RemoveUserFromWorkspaceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RemoveUserFromWorkspaceMutation>(RemoveUserFromWorkspaceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'removeUserFromWorkspace', 'mutation');
    },
    ArchiveWorkspaceTest(variables: ArchiveWorkspaceTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ArchiveWorkspaceTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ArchiveWorkspaceTestMutation>(ArchiveWorkspaceTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ArchiveWorkspaceTest', 'mutation');
    },
    ArchiveWorkspaceNonAdmin(variables: ArchiveWorkspaceNonAdminMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ArchiveWorkspaceNonAdminMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ArchiveWorkspaceNonAdminMutation>(ArchiveWorkspaceNonAdminDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ArchiveWorkspaceNonAdmin', 'mutation');
    },
    ArchiveWorkspaceNonExistent(variables: ArchiveWorkspaceNonExistentMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ArchiveWorkspaceNonExistentMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ArchiveWorkspaceNonExistentMutation>(ArchiveWorkspaceNonExistentDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ArchiveWorkspaceNonExistent', 'mutation');
    },
    ArchiveWorkspaceAlreadyArchived(variables: ArchiveWorkspaceAlreadyArchivedMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ArchiveWorkspaceAlreadyArchivedMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ArchiveWorkspaceAlreadyArchivedMutation>(ArchiveWorkspaceAlreadyArchivedDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ArchiveWorkspaceAlreadyArchived', 'mutation');
    },
    ArchiveWorkspaceForUnarchiveTest(variables: ArchiveWorkspaceForUnarchiveTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ArchiveWorkspaceForUnarchiveTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ArchiveWorkspaceForUnarchiveTestMutation>(ArchiveWorkspaceForUnarchiveTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ArchiveWorkspaceForUnarchiveTest', 'mutation');
    },
    UnarchiveWorkspaceTest(variables: UnarchiveWorkspaceTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UnarchiveWorkspaceTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UnarchiveWorkspaceTestMutation>(UnarchiveWorkspaceTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UnarchiveWorkspaceTest', 'mutation');
    },
    ArchiveWorkspaceForNonAdminUnarchiveTest(variables: ArchiveWorkspaceForNonAdminUnarchiveTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ArchiveWorkspaceForNonAdminUnarchiveTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ArchiveWorkspaceForNonAdminUnarchiveTestMutation>(ArchiveWorkspaceForNonAdminUnarchiveTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ArchiveWorkspaceForNonAdminUnarchiveTest', 'mutation');
    },
    UnarchiveWorkspaceNonAdmin(variables: UnarchiveWorkspaceNonAdminMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UnarchiveWorkspaceNonAdminMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UnarchiveWorkspaceNonAdminMutation>(UnarchiveWorkspaceNonAdminDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UnarchiveWorkspaceNonAdmin', 'mutation');
    },
    UnarchiveWorkspaceNonExistent(variables: UnarchiveWorkspaceNonExistentMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UnarchiveWorkspaceNonExistentMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UnarchiveWorkspaceNonExistentMutation>(UnarchiveWorkspaceNonExistentDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UnarchiveWorkspaceNonExistent', 'mutation');
    },
    UnarchiveWorkspaceNotArchived(variables: UnarchiveWorkspaceNotArchivedMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UnarchiveWorkspaceNotArchivedMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UnarchiveWorkspaceNotArchivedMutation>(UnarchiveWorkspaceNotArchivedDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UnarchiveWorkspaceNotArchived', 'mutation');
    },
    ArchiveWorkspaceForListTest(variables: ArchiveWorkspaceForListTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ArchiveWorkspaceForListTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ArchiveWorkspaceForListTestMutation>(ArchiveWorkspaceForListTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ArchiveWorkspaceForListTest', 'mutation');
    },
    ListWorkspacesAfterArchive(variables?: ListWorkspacesAfterArchiveQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListWorkspacesAfterArchiveQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListWorkspacesAfterArchiveQuery>(ListWorkspacesAfterArchiveDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListWorkspacesAfterArchive', 'query');
    },
    ArchiveWorkspaceForUnarchiveListTest(variables: ArchiveWorkspaceForUnarchiveListTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ArchiveWorkspaceForUnarchiveListTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ArchiveWorkspaceForUnarchiveListTestMutation>(ArchiveWorkspaceForUnarchiveListTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ArchiveWorkspaceForUnarchiveListTest', 'mutation');
    },
    ListWorkspacesBeforeUnarchive(variables?: ListWorkspacesBeforeUnarchiveQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListWorkspacesBeforeUnarchiveQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListWorkspacesBeforeUnarchiveQuery>(ListWorkspacesBeforeUnarchiveDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListWorkspacesBeforeUnarchive', 'query');
    },
    UnarchiveWorkspaceForListTest(variables: UnarchiveWorkspaceForListTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UnarchiveWorkspaceForListTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UnarchiveWorkspaceForListTestMutation>(UnarchiveWorkspaceForListTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UnarchiveWorkspaceForListTest', 'mutation');
    },
    CreateWorkspaceForSettings(variables?: CreateWorkspaceForSettingsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateWorkspaceForSettingsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateWorkspaceForSettingsMutation>(CreateWorkspaceForSettingsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateWorkspaceForSettings', 'mutation');
    },
    UpdateWorkspaceSettings(variables: UpdateWorkspaceSettingsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateWorkspaceSettingsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateWorkspaceSettingsMutation>(UpdateWorkspaceSettingsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateWorkspaceSettings', 'mutation');
    },
    CreateWorkspaceWithAllFieldsForPatch(variables?: CreateWorkspaceWithAllFieldsForPatchMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateWorkspaceWithAllFieldsForPatchMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateWorkspaceWithAllFieldsForPatchMutation>(CreateWorkspaceWithAllFieldsForPatchDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateWorkspaceWithAllFieldsForPatch', 'mutation');
    },
    UpdateOnlyName(variables: UpdateOnlyNameMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateOnlyNameMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateOnlyNameMutation>(UpdateOnlyNameDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateOnlyName', 'mutation');
    },
    CreateWorkspaceForNonAdminTest(variables?: CreateWorkspaceForNonAdminTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateWorkspaceForNonAdminTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateWorkspaceForNonAdminTestMutation>(CreateWorkspaceForNonAdminTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateWorkspaceForNonAdminTest', 'mutation');
    },
    AttemptUnauthorizedUpdate(variables: AttemptUnauthorizedUpdateMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<AttemptUnauthorizedUpdateMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AttemptUnauthorizedUpdateMutation>(AttemptUnauthorizedUpdateDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'AttemptUnauthorizedUpdate', 'mutation');
    },
    CreateWorkspaceForEmptyNameTest(variables?: CreateWorkspaceForEmptyNameTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateWorkspaceForEmptyNameTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateWorkspaceForEmptyNameTestMutation>(CreateWorkspaceForEmptyNameTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateWorkspaceForEmptyNameTest', 'mutation');
    },
    UpdateWithEmptyName(variables: UpdateWithEmptyNameMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateWithEmptyNameMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateWithEmptyNameMutation>(UpdateWithEmptyNameDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateWithEmptyName', 'mutation');
    },
    UpdateNonExistentWorkspace(variables?: UpdateNonExistentWorkspaceMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateNonExistentWorkspaceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateNonExistentWorkspaceMutation>(UpdateNonExistentWorkspaceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateNonExistentWorkspace', 'mutation');
    },
    CreateInviteOnlyWorkspaceForAccessType(variables?: CreateInviteOnlyWorkspaceForAccessTypeMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateInviteOnlyWorkspaceForAccessTypeMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateInviteOnlyWorkspaceForAccessTypeMutation>(CreateInviteOnlyWorkspaceForAccessTypeDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateInviteOnlyWorkspaceForAccessType', 'mutation');
    },
    UpdateToSameDomain(variables: UpdateToSameDomainMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateToSameDomainMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateToSameDomainMutation>(UpdateToSameDomainDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateToSameDomain', 'mutation');
    },
    CreateSameDomainWorkspace(variables?: CreateSameDomainWorkspaceMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateSameDomainWorkspaceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateSameDomainWorkspaceMutation>(CreateSameDomainWorkspaceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateSameDomainWorkspace', 'mutation');
    },
    UpdateToInviteOnly(variables: UpdateToInviteOnlyMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateToInviteOnlyMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateToInviteOnlyMutation>(UpdateToInviteOnlyDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateToInviteOnly', 'mutation');
    },
    CreateWorkspaceForAccessTypeTest(variables?: CreateWorkspaceForAccessTypeTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateWorkspaceForAccessTypeTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateWorkspaceForAccessTypeTestMutation>(CreateWorkspaceForAccessTypeTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateWorkspaceForAccessTypeTest', 'mutation');
    },
    AttemptUnauthorizedAccessTypeUpdate(variables: AttemptUnauthorizedAccessTypeUpdateMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<AttemptUnauthorizedAccessTypeUpdateMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AttemptUnauthorizedAccessTypeUpdateMutation>(AttemptUnauthorizedAccessTypeUpdateDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'AttemptUnauthorizedAccessTypeUpdate', 'mutation');
    },
    UpdateAccessTypeNonExistent(variables?: UpdateAccessTypeNonExistentMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateAccessTypeNonExistentMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateAccessTypeNonExistentMutation>(UpdateAccessTypeNonExistentDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateAccessTypeNonExistent', 'mutation');
    },
    CreateWorkspaceForSpiceDBTest(variables?: CreateWorkspaceForSpiceDbTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateWorkspaceForSpiceDbTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateWorkspaceForSpiceDbTestMutation>(CreateWorkspaceForSpiceDbTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateWorkspaceForSpiceDBTest', 'mutation');
    },
    UpdateToSameDomainSpiceDB(variables: UpdateToSameDomainSpiceDbMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateToSameDomainSpiceDbMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateToSameDomainSpiceDbMutation>(UpdateToSameDomainSpiceDbDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateToSameDomainSpiceDB', 'mutation');
    },
    ListJoinableAfterSameDomain(variables?: ListJoinableAfterSameDomainQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListJoinableAfterSameDomainQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListJoinableAfterSameDomainQuery>(ListJoinableAfterSameDomainDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListJoinableAfterSameDomain', 'query');
    },
    UpdateToInviteOnlySpiceDB(variables: UpdateToInviteOnlySpiceDbMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateToInviteOnlySpiceDbMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateToInviteOnlySpiceDbMutation>(UpdateToInviteOnlySpiceDbDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateToInviteOnlySpiceDB', 'mutation');
    },
    CreateWorkspaceWithAllFields(variables: CreateWorkspaceWithAllFieldsMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateWorkspaceWithAllFieldsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateWorkspaceWithAllFieldsMutation>(CreateWorkspaceWithAllFieldsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateWorkspaceWithAllFields', 'mutation');
    },
    CreateWorkspaceWithSameDomain(variables: CreateWorkspaceWithSameDomainMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateWorkspaceWithSameDomainMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateWorkspaceWithSameDomainMutation>(CreateWorkspaceWithSameDomainDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateWorkspaceWithSameDomain', 'mutation');
    },
    CreateWorkspaceAutoDomain(variables: CreateWorkspaceAutoDomainMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateWorkspaceAutoDomainMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateWorkspaceAutoDomainMutation>(CreateWorkspaceAutoDomainDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateWorkspaceAutoDomain', 'mutation');
    },
    CreateWorkspaceForList(variables?: CreateWorkspaceForListMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateWorkspaceForListMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateWorkspaceForListMutation>(CreateWorkspaceForListDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateWorkspaceForList', 'mutation');
    },
    ListWorkspaces(variables?: ListWorkspacesQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListWorkspacesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListWorkspacesQuery>(ListWorkspacesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListWorkspaces', 'query');
    },
    CreateWorkspaceForJoinableTest(variables?: CreateWorkspaceForJoinableTestMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateWorkspaceForJoinableTestMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateWorkspaceForJoinableTestMutation>(CreateWorkspaceForJoinableTestDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateWorkspaceForJoinableTest', 'mutation');
    },
    ListJoinableWorkspaces(variables?: ListJoinableWorkspacesQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListJoinableWorkspacesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListJoinableWorkspacesQuery>(ListJoinableWorkspacesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListJoinableWorkspaces', 'query');
    },
    ListMyWorkspaces(variables?: ListMyWorkspacesQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListMyWorkspacesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListMyWorkspacesQuery>(ListMyWorkspacesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListMyWorkspaces', 'query');
    },
    CreateInviteOnlyWorkspace(variables?: CreateInviteOnlyWorkspaceMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateInviteOnlyWorkspaceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateInviteOnlyWorkspaceMutation>(CreateInviteOnlyWorkspaceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateInviteOnlyWorkspace', 'mutation');
    },
    AttemptUnauthorizedJoin(variables: AttemptUnauthorizedJoinMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<AttemptUnauthorizedJoinMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AttemptUnauthorizedJoinMutation>(AttemptUnauthorizedJoinDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'AttemptUnauthorizedJoin', 'mutation');
    },
    JoinNonExistentWorkspace(variables?: JoinNonExistentWorkspaceMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<JoinNonExistentWorkspaceMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<JoinNonExistentWorkspaceMutation>(JoinNonExistentWorkspaceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'JoinNonExistentWorkspace', 'mutation');
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;