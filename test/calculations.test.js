const moment = require("moment");
const { LbpPriceService } = require("../main");

describe("LbpPriceService", () => {
  // project token info
  const projectTokenTotalSupply = 1_000_000;
  const projectTokenInitialLbpAmount = 100_000;

  // funding token info
  const fundingTokenInitialLbpAmount = 5_000;
  const pricePerFundingToken = 1; // this would be retrieved from an API

  // lbp config
  const startWeightProjectToken = 0.8;
  const endWeightProjectToken = 0.1;
  const startDate = new Date("2021-01-20T12:00:00");
  const endDate = new Date("2021-01-22T12:00:00");
  const lbpDurationInHours = moment
    .duration(moment(endDate).diff(moment(startDate)))
    .asHours();

  const lbpPriceService = new LbpPriceService(
    projectTokenTotalSupply,
    projectTokenInitialLbpAmount,
    fundingTokenInitialLbpAmount,
    startWeightProjectToken,
    endWeightProjectToken,
    startDate,
    endDate,
    pricePerFundingToken
  );

  describe("#getPriceAtWeight", () => {
    describe("at lbp start", () => {
      it("returns the correct initial price for the project token", () => {
        const expectedTokenPrice = 0.2;

        const price = lbpPriceService.getPriceAtWeight(
          projectTokenInitialLbpAmount,
          fundingTokenInitialLbpAmount,
          startWeightProjectToken
        );

        expect(price).toBeCloseTo(expectedTokenPrice);
      });
    });

    describe("at lbp end without any token sales", () => {
      it("projects the correct final price for the project token", () => {
        const expectedTokenPrice = 0.0056;

        const price = lbpPriceService.getPriceAtWeight(
          projectTokenInitialLbpAmount,
          fundingTokenInitialLbpAmount,
          endWeightProjectToken
        );

        expect(price).toBeCloseTo(expectedTokenPrice);
      });
    });
  });

  describe("#getProjectTokenWeightAtTime", () => {
    describe("at start of LBP", () => {
      it("returns the correct weight for the project token", () => {
        const projectTokenWeight =
          lbpPriceService.getProjectTokenWeightAtTime(startDate);

        expect(projectTokenWeight).toBeCloseTo(startWeightProjectToken);
      });
    });

    describe("halfway through the lbp", () => {
      const halfwayThrough = new Date("2021-01-21T12:00:00");

      it("returns the correct weight for the project token", () => {
        const expectedWeight = 0.45;

        const projectTokenWeight =
          lbpPriceService.getProjectTokenWeightAtTime(halfwayThrough);

        expect(projectTokenWeight).toBeCloseTo(expectedWeight);
      });
    });

    describe("at the end of the lbp", () => {
      it("returns the correct weight for the project token", () => {
        const expectedWeight = 0.1;

        const projectTokenWeight =
          lbpPriceService.getProjectTokenWeightAtTime(endDate);

        expect(projectTokenWeight).toBeCloseTo(expectedWeight);
      });
    });
  });

  describe("#getMarketCap", () => {
    describe("at lbp start", () => {
      it("returns the correct initial mcap for the project token", () => {
        const expectedMarketCap = 200_000;

        const marketCap = lbpPriceService.getMarketCap(
          projectTokenInitialLbpAmount,
          fundingTokenInitialLbpAmount,
          startWeightProjectToken
        );

        expect(marketCap).toEqual(expectedMarketCap);
      });
    });

    describe("at lbp end without any token sales", () => {
      it("projects the correct mcap for the project token", () => {
        const expectedMarketCap = 5556;

        const marketCap = lbpPriceService.getMarketCap(
          projectTokenInitialLbpAmount,
          fundingTokenInitialLbpAmount,
          endWeightProjectToken,
          pricePerFundingToken
        );

        expect(marketCap).toEqual(expectedMarketCap);
      });
    });

    describe("halfway through the lbp", () => {
      const deltaProjectTokens = -20_000;
      const deltaFundingTokens = 8_000;
      const currentProjectTokenWeight = 0.45;

      it("returns the correct market cap for the project token", () => {
        const expectedMarketCap = 132_955;

        const marketCap = lbpPriceService.getMarketCap(
          projectTokenInitialLbpAmount + deltaProjectTokens,
          fundingTokenInitialLbpAmount + deltaFundingTokens,
          currentProjectTokenWeight,
          pricePerFundingToken
        );

        expect(marketCap).toEqual(expectedMarketCap);
      });
    });
  });

  describe("#getInterpolatedPriceDatapoints", () => {
    describe("at lbp start", () => {
      it("returns the correct number of interpolated prices for the project token", () => {
        const { prices } = lbpPriceService.getInterpolatedPriceDatapoints(
          projectTokenInitialLbpAmount,
          fundingTokenInitialLbpAmount,
          startDate
        );

        expect(prices.length).toEqual(lbpDurationInHours);
      });
    });

    describe("halfway through the lbp auction with fantasy numbers", () => {
      const hoursPassed = 12;
      const deltaProjectTokens = -20_000;
      const deltaFundingTokens = 8_000;

      it("returns the correct number of interpolated prices for the project token", () => {
        const outstandingTimeDatapoints = lbpDurationInHours - hoursPassed;

        const { prices } = lbpPriceService.getInterpolatedPriceDatapoints(
          projectTokenInitialLbpAmount + deltaProjectTokens,
          fundingTokenInitialLbpAmount + deltaFundingTokens,
          moment(startDate).add(hoursPassed, "hours").toDate()
        );

        expect(prices.length).toEqual(outstandingTimeDatapoints);
      });
    });
  });

  describe("#getHoursPassed", () => {
    describe("at lbp start", () => {
      it("returns zero", () => {
        const expectedHoursPassed = 0;

        const hoursPassed = lbpPriceService.getHoursPassed(startDate);

        expect(hoursPassed).toEqual(expectedHoursPassed);
      });
    });

    describe("halfway through the lbp", () => {
      const halfwayThroughDate = new Date("2021-01-21T12:00:00");

      it("returns half the duration of the lbp", () => {
        const expectedHoursPassed = 24;

        const hoursPassed = lbpPriceService.getHoursPassed(halfwayThroughDate);

        expect(hoursPassed).toEqual(expectedHoursPassed);
      });
    });

    describe("at the end of lbp", () => {
      it("returns the full duration of lbp", () => {
        const expectedHoursPassed = 48;

        const hoursPassed = lbpPriceService.getHoursPassed(endDate);

        expect(hoursPassed).toEqual(expectedHoursPassed);
      });
    });
  });

  describe("#getFundsRaised", () => {
    const fundingTokenInPool = 15000;

    it("returns the amount of funding", () => {
      const fundingVolume = lbpPriceService.getFundsRaised(fundingTokenInPool);

      expect(fundingVolume).toEqual(
        fundingTokenInPool - fundingTokenInitialLbpAmount
      );
    });
  });
});
