const moment = require("moment");

class LbpPriceService {
  constructor(
    projectTokenTotalSupply,
    projectTokenInitialLbpAmount,
    fundingTokenInitialLbpAmount,
    startWeightProjectToken,
    endWeightProjectToken,
    startDate,
    endDate,
    pricePerFundingToken
  ) {
    this.projectTokenTotalSupply = projectTokenTotalSupply;
    this.projectTokenInitialLbpAmount = projectTokenInitialLbpAmount;
    this.fundingTokenInitialLbpAmount = fundingTokenInitialLbpAmount;
    this.startWeightProjectToken = startWeightProjectToken;
    this.endWeightProjectToken = endWeightProjectToken;
    this.startDate = startDate;
    this.endDate = endDate;
    this.roundedStartDate = moment(this.startDate).startOf("hour");
    this.roundedEndDate = moment(this.endDate).startOf("hour");
    this.lbpDurationInHours =
      (this.roundedEndDate - this.roundedStartDate) / 36e5;
    this.pricePerFundingToken = pricePerFundingToken;
  }

  getMarketCap(projectTokenInPool, fundingTokenInPool, projectTokenWeight) {
    const projectTokenMcap =
      this.getPriceAtWeight(...arguments, this.pricePerFundingToken) *
      this.projectTokenTotalSupply;

    return Math.round(projectTokenMcap);
  }

  getPriceAtWeight(projectTokenInPool, fundingTokenInPool, projectTokenWeight) {
    const fundingTokenValue = fundingTokenInPool * this.pricePerFundingToken;
    const scalingFactor = projectTokenWeight / (1 - projectTokenWeight);
    const projectTokenValue = scalingFactor * fundingTokenValue;
    const pricePerProjectToken = projectTokenValue / projectTokenInPool;

    return pricePerProjectToken;
  }

  getInterpolatedPriceDatapoints(
    projectTokenInPool,
    fundingTokenInPool,
    currentTime
  ) {
    const prices = [];
    const labels = [];

    const hoursPassedSinceStart = this.getHoursPassed(currentTime);
    const hoursLeft = this.lbpDurationInHours - hoursPassedSinceStart;

    for (let hoursPassed = 0; hoursPassed < hoursLeft; hoursPassed++) {
      const time = moment(currentTime).add(hoursPassed, "hours");
      const projectTokenWeight = this.getProjectTokenWeightAtTime(
        time.toDate()
      );
      const currentProjectTokenPrice = this.getPriceAtWeight(
        projectTokenInPool,
        fundingTokenInPool,
        projectTokenWeight,
        this.pricePerFundingToken
      );

      labels.push(time.startOf("hour"));
      prices.push(currentProjectTokenPrice);
    }

    return { prices, labels };
  }

  getProjectTokenWeightAtTime(currentTime) {
    const hoursPassedSinceStart = this.getHoursPassed(currentTime);

    const totalWeightDifference =
      this.startWeightProjectToken - this.endWeightProjectToken;
    const weightChangePerHour = totalWeightDifference / this.lbpDurationInHours;
    const weightChange = hoursPassedSinceStart * weightChangePerHour;

    return this.startWeightProjectToken - weightChange;
  }

  getHoursPassed(currentTime) {
    const roundedCurrentTime = moment(currentTime).startOf("hour");
    return moment
      .duration(roundedCurrentTime.diff(this.roundedStartDate))
      .asHours();
  }

  getFundsRaised(fundingTokenInPool) {
    return (
      (fundingTokenInPool - this.fundingTokenInitialLbpAmount) *
      this.pricePerFundingToken
    );
  }
}

module.exports = { LbpPriceService };
