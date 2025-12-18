import { PriceEngineService } from '../';

describe('PriceEngineService', () => {
  const service = new PriceEngineService();

  it('calculates optimal cost for a 3-day rental', () => {
    const result = service.calculateOptimalCost({
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-03'),
      pricePer1DayInCents: 100,
      pricePer7DaysInCents: 500,
      pricePer28DaysInCents: 1500,
    });
    // 3 days * 100 = 300, which is less than a week or month
    expect(result.costInCents).toBe(300);
    expect(result.strategy).toBe('exactSplit');
    expect(result.rentalPeriod).toEqual({
      days1: 3,
      days7: 0,
      days28: 0,
      totalDays: 3,
    });
    expect(result.savingsComparedToExactSplitInCents).toBe(0);

    // New details assertions
    expect(result.details).toBeDefined();
    expect(result.details.optimalSplit).toEqual({
      days1: 3,
      days7: 0,
      days28: 0,
      totalDays: 3,
    });
    expect(result.details.exactSplitDistribution).toEqual({
      days1: 3,
      days7: 0,
      days28: 0,
      totalDays: 3,
    });
    expect(result.details.rates).toEqual({
      pricePer1DayInCents: 100,
      pricePer7DaysInCents: 500,
      pricePer28DaysInCents: 1500,
    });
    expect(result.details.plainText).toBe('3 x Day Rate (1.00)');
  });

  it('calculates optimal cost for a 7-day rental (should prefer week)', () => {
    const result = service.calculateOptimalCost({
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-07'),
      pricePer1DayInCents: 100,
      pricePer7DaysInCents: 500,
      pricePer28DaysInCents: 1500,
    });
    // 7 days * 100 = 700, 1 week = 500, 1 month = 1500
    expect(result.costInCents).toBe(500);
    expect(result.strategy).toBe('exactSplit');
    expect(result.rentalPeriod).toEqual({
      days1: 0,
      days7: 1,
      days28: 0,
      totalDays: 7,
    });
    expect(result.savingsComparedToExactSplitInCents).toBe(0);

    expect(result.details).toBeDefined();
    expect(result.details.optimalSplit).toEqual({
      days1: 0,
      days7: 1,
      days28: 0,
      totalDays: 7,
    });
    expect(result.details.exactSplitDistribution).toEqual({
      days1: 0,
      days7: 1,
      days28: 0,
      totalDays: 7,
    });
    expect(result.details.rates).toEqual({
      pricePer1DayInCents: 100,
      pricePer7DaysInCents: 500,
      pricePer28DaysInCents: 1500,
    });
    expect(result.details.plainText).toBe('1 x Week Rate (5.00)');
  });

  it('calculates optimal cost for a 28-day rental (should prefer month)', () => {
    const result = service.calculateOptimalCost({
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-28'),
      pricePer1DayInCents: 100,
      pricePer7DaysInCents: 500,
      pricePer28DaysInCents: 1500,
    });
    // 28 days * 100 = 2800, 4 weeks = 2000, 1 month = 1500
    expect(result.costInCents).toBe(1500);
    expect(result.strategy).toBe('exactSplit');
    expect(result.rentalPeriod).toEqual({
      days1: 0,
      days7: 0,
      days28: 1,
      totalDays: 28,
    });
    expect(result.savingsComparedToExactSplitInCents).toBe(0);

    expect(result.details.plainText).toBe('1 x 28 Day Rate (15.00)');
  });

  it('calculates optimal cost for a 35-day rental (1 month, 1 week, 0 days)', () => {
    const result = service.calculateOptimalCost({
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-02-04'),
      pricePer1DayInCents: 100,
      pricePer7DaysInCents: 500,
      pricePer28DaysInCents: 1500,
    });
    // 35 days: 1 month (28d) + 1 week (7d)
    // basic: 1*1500 + 1*500 + 0*100 = 2000
    // weekRounded: 1*1500 + 2*500 = 2500
    // monthRounded: 2*1500 = 3000
    expect(result.costInCents).toBe(2000);
    expect(result.strategy).toBe('exactSplit');
    expect(result.rentalPeriod).toEqual({
      days1: 0,
      days7: 1,
      days28: 1,
      totalDays: 35,
    });
    expect(result.savingsComparedToExactSplitInCents).toBe(0);

    expect(result.details.plainText).toBe(
      '1 x Week Rate (5.00) + 1 x 28 Day Rate (15.00)',
    );
  });

  it('calculates optimal cost for a 0-day rental (startDate == endDate)', () => {
    const result = service.calculateOptimalCost({
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-01'),
      pricePer1DayInCents: 100,
      pricePer7DaysInCents: 500,
      pricePer28DaysInCents: 1500,
    });
    // 1 day rental (differenceInDays + 1)
    expect(result.costInCents).toBe(100);
    expect(result.strategy).toBe('exactSplit');
    expect(result.rentalPeriod).toEqual({
      days1: 1,
      days7: 0,
      days28: 0,
      totalDays: 1,
    });
    expect(result.savingsComparedToExactSplitInCents).toBe(0);

    expect(result.details.plainText).toBe('1 x Day Rate (1.00)');
  });

  it('calculates optimal cost for a period not a multiple of week/month', () => {
    const result = service.calculateOptimalCost({
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-10'),
      pricePer1DayInCents: 100,
      pricePer7DaysInCents: 500,
      pricePer28DaysInCents: 1500,
    });
    // 10 days: 1 week + 3 days
    // basic: 1*500 + 3*100 = 800
    // weekRounded: 2*500 = 1000
    // monthRounded: 1*1500 = 1500
    expect(result.costInCents).toBe(800);
    expect(result.strategy).toBe('exactSplit');
    expect(result.rentalPeriod).toEqual({
      days1: 3,
      days7: 1,
      days28: 0,
      totalDays: 10,
    });
    expect(result.savingsComparedToExactSplitInCents).toBe(0);

    expect(result.details.plainText).toBe(
      '3 x Day Rate (1.00) + 1 x Week Rate (5.00)',
    );
  });

  it('calculates optimal cost for a 9-day rental with week rounding optimal', () => {
    const result = service.calculateOptimalCost({
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-09'),
      pricePer1DayInCents: 600,
      pricePer7DaysInCents: 1000,
      pricePer28DaysInCents: 5000,
    });
    // 9 days: exactSplit = 1*1000 + 2*600 = 2200
    // roundUpTo7Days = 2*1000 = 2000 (cheaper)
    // roundUpTo28Days = 1*5000 = 5000
    expect(result.costInCents).toBe(2000);
    expect(result.strategy).toBe('roundUpTo7Days');
    expect(result.rentalPeriod).toEqual({
      days1: 0,
      days7: 2,
      days28: 0,
      totalDays: 9,
    });
    expect(result.savingsComparedToExactSplitInCents).toBe(200);

    expect(result.details.plainText).toBe('2 x Week Rate (10.00)');
  });

  it('calculates optimal cost for a 20-day rental with 28-day rounding optimal', () => {
    const result = service.calculateOptimalCost({
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-20'),
      pricePer1DayInCents: 1000,
      pricePer7DaysInCents: 3000,
      pricePer28DaysInCents: 8000,
    });
    // 20 days: exactSplit = 2*3000 + 6*1000 = 12000
    // roundUpTo7Days = 3*3000 = 9000
    // roundUpTo28Days = 1*2000 = 2000 (cheapest)
    expect(result.costInCents).toBe(8000);
    expect(result.strategy).toBe('roundUpTo28Days');
    expect(result.rentalPeriod).toEqual({
      days1: 0,
      days7: 0,
      days28: 1,
      totalDays: 20,
    });
    expect(result.savingsComparedToExactSplitInCents).toBe(4000);

    expect(result.details.plainText).toBe('1 x 28 Day Rate (80.00)');
  });

  it('forcastPricing returns correct daily breakdown and accumulative cost', () => {
    const startDate = new Date('2025-01-01');
    const numberOfDaysToForcast = 1000;
    const pricePer1DayInCents = 100;
    const pricePer7DaysInCents = 500;
    const pricePer28DaysInCents = 1500;

    const result = service.forecastPricing({
      startDate,
      numberOfDaysToForcast,
      pricePer1DayInCents,
      pricePer7DaysInCents,
      pricePer28DaysInCents,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.days)).toBe(true);
    expect(result.days.length).toBe(numberOfDaysToForcast + 1);
  });
});
