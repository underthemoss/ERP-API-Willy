import { objectType, interfaceType, unionType, enumType } from 'nexus';
import { DateTime } from './common';

export const ServiceTransactionTypes = enumType({
  name: 'ServiceTransactionTypes',
  members: ['MAINTENANCE', 'HAULING', 'CUSTOM'],
});

export const TransactionStatusType = enumType({
  name: 'TransactionStatusType',
  members: ['TODO', 'DOING', 'DONE'],
});

export const TransactionType = enumType({
  name: 'TransactionType',
  members: ['RENTAL', 'SALE', 'SERVICE'],
});

export const Comment = objectType({
  name: 'Comment',
  definition(t) {
    t.id('id');
  },
});

export const RentalTransaction = objectType({
  name: 'RentalTransaction',
  definition(t) {
    t.implements(BaseTransaction);
    t.field('startDate', { type: DateTime });
    t.field('endDate', { type: DateTime });
    t.id('pimId');
    t.id('assetId');
    t.int('pricePerDayInCents');
    t.int('pricePerWeekInCents');
    t.int('pricePerMonthInCents');
    t.string('pickUpLocation');
    t.string('dropOffLocation');
  },
});

export const SaleTransaction = objectType({
  name: 'SaleTransaction',
  definition(t) {
    t.implements(BaseTransaction);
    t.int('quantity');
    t.string('product');
    t.int('priceInCents');
  },
});

export const ServiceTask = objectType({
  name: 'ServiceTask',
  definition(t) {
    t.string('taskDetails');
    t.boolean('completed');
  },
});

export const ServiceTransaction = objectType({
  name: 'ServiceTransaction',
  definition(t) {
    t.implements(BaseTransaction);
    t.string('assignee');
    t.string('location');
    t.int('costInCents');
    t.list.nonNull.field('tasks', { type: ServiceTask });
  },
});

export const TransactionLogEntry = objectType({
  name: 'TransactionLogEntry',
  definition(t) {
    t.string('action');
    t.string('oldValue');
    t.string('newValue');
    t.string('col');
    t.id('userId');
  },
});

export const TransactionStatus = objectType({
  name: 'TransactionStatus',
  definition(t) {
    t.id('id');
    t.string('name');
    t.field('type', { type: TransactionStatusType });
    t.string('colourCode');
    t.id('workflowId');
  },
});

export const Workflow = objectType({
  name: 'Workflow',
  definition(t) {
    t.id('id');
    t.string('name');
    t.list.nonNull.field('statuses', { type: TransactionStatus });
  },
});

export const BaseTransaction = interfaceType({
  name: 'BaseTransaction',
  resolveType: (source) => {
    switch (source.type) {
      case 'RENTAL':
        return RentalTransaction.name;
      case 'SALE':
        return SaleTransaction.name;
      case 'SERVICE':
        return ServiceTransaction.name;
      default:
        throw new Error('Unknown transaction type');
    }
  },
  definition(t) {
    t.nonNull.id('id');
    t.id('workspaceId');
    t.id('workflowId');
    t.id('statusId');
    t.field('type', { type: TransactionType });
    t.id('projectId');
    t.id('createdBy');
    t.field('createdAt', { type: DateTime });
    t.field('updatedAt', { type: DateTime });
    t.id('lastUpdatedBy');
    t.string('notes');
    t.list.nonNull.field('comments', { type: Comment });
    t.list.field('history', { type: TransactionLogEntry });
  },
});

export const Transaction = unionType({
  name: 'Transaction',
  resolveType: (source) => {
    switch (source.type) {
      case 'RENTAL':
        return RentalTransaction.name;
      case 'SALE':
        return SaleTransaction.name;
      case 'SERVICE':
        return ServiceTransaction.name;
      default:
        throw new Error('Unknown transaction type');
    }
  },
  definition(t) {
    t.members(RentalTransaction, SaleTransaction, ServiceTransaction);
  },
});
