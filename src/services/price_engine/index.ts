/**
 * PriceEngineService
 *
 * Business Logic Overview:
 * ------------------------
 * This service provides core pricing logic for rental equipment/assets, supporting flexible rental periods
 * and multiple pricing strategies. It calculates the optimal cost for a rental period using three strategies:
 *   1. Exact Split: Breaks the rental period into the largest possible 28-day, 7-day, and 1-day blocks.
 *   2. Round Up to 7 Days: Rounds up any remaining days to the next 7-day block for potential savings.
 *   3. Round Up to 28 Days: Rounds up the entire period to the next 28-day block for potential savings.
 *
 * For each strategy, the service computes the total cost, the rental period breakdown, and the savings compared
 * to paying the 1-day rate for all days. It also provides a forecast function to simulate accumulative cost
 * over a range of days, supporting pricing transparency and customer decision-making.
 *
 * All calculations are performed in cents to avoid floating-point errors. The service is designed to be used
 * by the GraphQL layer via the service layer.
 */

import { addDays, differenceInDays } from 'date-fns';

type RentalPeriod = {
  days28: number;
  days7: number;
  days1: number;
  totalDays: number;
};

type Pricing = {
  pricePer28DaysInCents: number;
  pricePer7DaysInCents: number;
  pricePer1DayInCents: number;
};

type CostOptionDetails = {
  exactSplitDistribution: RentalPeriod;
  optimalSplit: RentalPeriod;
  rates: Pricing;
  plainText: string;
};

type CostOption = {
  strategy: 'exactSplit' | 'roundUpTo7Days' | 'roundUpTo28Days';
  costInCents: number;
  rentalPeriod: RentalPeriod;
  savingsComparedToExactSplitInCents: number;
  savingsComparedToDayRateInCents: number;
  savingsComparedToDayRateInFraction: number; // e.g. 0.25 for 25% savings
  details: CostOptionDetails;
};

function formatRentalPeriodPlainText(
  period: RentalPeriod,
  pricing: Pricing,
): string {
  const parts: string[] = [];
  if (period.days1 > 0) {
    parts.push(
      `${period.days1} x Day Rate (${(pricing.pricePer1DayInCents / 100).toFixed(2)})`,
    );
  }
  if (period.days7 > 0) {
    parts.push(
      `${period.days7} x Week Rate (${(pricing.pricePer7DaysInCents / 100).toFixed(2)})`,
    );
  }
  if (period.days28 > 0) {
    parts.push(
      `${period.days28} x 28 Day Rate (${(pricing.pricePer28DaysInCents / 100).toFixed(2)})`,
    );
  }
  return parts.join(' + ');
}

export class PriceEngineService {
  private calculateRentalPeriod(args: {
    startDate?: Date;
    endDate?: Date;
    totalDays?: number;
  }): RentalPeriod {
    const totalDays =
      args.totalDays ??
      (args.startDate && args.endDate
        ? differenceInDays(args.endDate, args.startDate) + 1
        : 0);
    const days28 = Math.floor(totalDays / 28);
    const days7 = Math.floor((totalDays % 28) / 7);
    const days1 = totalDays % 7;
    return { days28, days7, days1, totalDays };
  }

  private generateDistributionOptions(period: RentalPeriod): RentalPeriod[] {
    return [
      period, // basic
      {
        days28: period.days28,
        days7: period.days7 + 1,
        days1: 0,
        totalDays: period.totalDays,
      }, // round up to next 7-day block
      {
        days28: period.days28 + 1,
        days7: 0,
        days1: 0,
        totalDays: period.totalDays,
      }, // round up to next 28-day block
    ];
  }

  private calculateCost(period: RentalPeriod, pricing: Pricing): number {
    return (
      period.days28 * pricing.pricePer28DaysInCents +
      period.days7 * pricing.pricePer7DaysInCents +
      period.days1 * pricing.pricePer1DayInCents
    );
  }

  public forecastPricing(args: {
    startDate: Date;
    rentalEndDate?: Date;
    numberOfDaysToForcast: number;
    pricePer1DayInCents: number;
    pricePer7DaysInCents: number;
    pricePer28DaysInCents: number;
  }) {
    const {
      startDate,
      numberOfDaysToForcast,
      pricePer1DayInCents,
      pricePer7DaysInCents,
      pricePer28DaysInCents,
      rentalEndDate,
    } = args;
    let accumulativeCost = 0;
    const days = [];

    for (let i = 0; i <= numberOfDaysToForcast; i++) {
      const endDate = addDays(startDate, i);
      const isPastRentalTerm = rentalEndDate ? endDate > rentalEndDate : false;
      const costOption = this.calculateOptimalCost({
        startDate,
        endDate,
        pricePer1DayInCents,
        pricePer7DaysInCents,
        pricePer28DaysInCents,
      });

      accumulativeCost = isPastRentalTerm
        ? accumulativeCost
        : costOption.costInCents;

      days.push({
        day: i,
        endDate,
        accumulativeCostInCents: accumulativeCost,
        ...costOption,
      });
    }

    return {
      days,
      accumulativeCostInCents: accumulativeCost,
    };
  }

  public calculateOptimalCost(args: {
    startDate?: Date;
    endDate?: Date;
    totalDays?: number; // optional, can be calculated from startDate and endDate
    pricePer1DayInCents: number;
    pricePer7DaysInCents: number;
    pricePer28DaysInCents: number;
  }): CostOption {
    const period = this.calculateRentalPeriod({
      startDate: args.startDate,
      endDate: args.endDate,
      totalDays: args.totalDays,
    });
    const pricing: Pricing = {
      pricePer1DayInCents: args.pricePer1DayInCents,
      pricePer7DaysInCents: args.pricePer7DaysInCents,
      pricePer28DaysInCents: args.pricePer28DaysInCents,
    };

    const distributions = this.generateDistributionOptions(period);

    const exactSplitCost = this.calculateCost(distributions[0], pricing);

    // Calculate total days for the rental period
    const totalDays = period.totalDays;
    const allDayRateCost = totalDays * pricing.pricePer1DayInCents;

    const options: CostOption[] = [
      {
        strategy: 'exactSplit',
        costInCents: exactSplitCost,
        rentalPeriod: distributions[0],
        savingsComparedToExactSplitInCents: 0,
        savingsComparedToDayRateInCents: allDayRateCost - exactSplitCost,
        savingsComparedToDayRateInFraction:
          allDayRateCost === 0
            ? 0
            : (allDayRateCost - exactSplitCost) / allDayRateCost,
        details: {
          exactSplitDistribution: distributions[0],
          optimalSplit: distributions[0],
          rates: pricing,
          plainText: formatRentalPeriodPlainText(distributions[0], pricing),
        },
      },
      {
        strategy: 'roundUpTo7Days',
        costInCents: this.calculateCost(distributions[1], pricing),
        rentalPeriod: distributions[1],
        savingsComparedToExactSplitInCents:
          exactSplitCost - this.calculateCost(distributions[1], pricing),
        savingsComparedToDayRateInCents:
          allDayRateCost - this.calculateCost(distributions[1], pricing),
        savingsComparedToDayRateInFraction:
          allDayRateCost === 0
            ? 0
            : (allDayRateCost - this.calculateCost(distributions[1], pricing)) /
              allDayRateCost,
        details: {
          exactSplitDistribution: distributions[0],
          optimalSplit: distributions[1],
          rates: pricing,
          plainText: formatRentalPeriodPlainText(distributions[1], pricing),
        },
      },
      {
        strategy: 'roundUpTo28Days',
        costInCents: this.calculateCost(distributions[2], pricing),
        rentalPeriod: distributions[2],
        savingsComparedToExactSplitInCents:
          exactSplitCost - this.calculateCost(distributions[2], pricing),
        savingsComparedToDayRateInCents:
          allDayRateCost - this.calculateCost(distributions[2], pricing),
        savingsComparedToDayRateInFraction:
          allDayRateCost === 0
            ? 0
            : (allDayRateCost - this.calculateCost(distributions[2], pricing)) /
              allDayRateCost,
        details: {
          exactSplitDistribution: distributions[0],
          optimalSplit: distributions[2],
          rates: pricing,
          plainText: formatRentalPeriodPlainText(distributions[2], pricing),
        },
      },
    ];

    return options.reduce((best, current) =>
      current.costInCents <= best.costInCents ? current : best,
    );
  }
}

export const createPriceEngineService = async (config: {}) => {
  return new PriceEngineService();
};
