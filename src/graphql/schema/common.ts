import { scalarType, objectType, enumType, inputObjectType } from 'nexus';
import {
  GraphQLDateTime,
  GraphQLDate,
  GraphQLJSON,
  GraphQLJSONObject,
  GraphQLBigInt,
} from 'graphql-scalars';

export const DateTime = scalarType({
  ...GraphQLDateTime,
  asNexusMethod: 'dateTime',
});

export const JSONScalar = scalarType(GraphQLJSON);
export const JSONObjectScalar = scalarType(GraphQLJSONObject);
export const BigIntScalar = scalarType(GraphQLBigInt);

export const DateScalar = scalarType({
  ...GraphQLDate,
  asNexusMethod: 'date',
});

export const PaginationInfo = objectType({
  name: 'PaginationInfo',
  definition(t) {
    t.nonNull.int('number');
    t.nonNull.int('size');
    t.nonNull.int('totalItems');
    t.nonNull.int('totalPages');
  },
});

export const PageInfoInput = inputObjectType({
  name: 'PageInfoInput',
  definition(t) {
    t.int('size');
    t.int('number');
  },
});

export const PaginationOrder = enumType({
  name: 'PaginationOrder',
  members: ['ASC', 'DESC'],
});
