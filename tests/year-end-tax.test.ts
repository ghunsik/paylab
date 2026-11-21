import assert from "node:assert/strict";
import { test } from "node:test";

import { YEAR_END_2026 } from "../lib/year-end-policy.ts";
import {
  calculateYearEndTax,
  cardDeductionFor,
  childTaxCreditFor,
  computeYearEndTax,
  earnedIncomeTaxCredit,
  estimateAnnualInsurance,
  type YearEndTaxInput,
} from "../lib/year-end-tax.ts";

const base: YearEndTaxInput = {
  totalSalary: 50_000_000,
  dependents: 1,
  childrenAll: 0,
  children: 0,
  seniors: 0,
  disabled: 0,
  marriedThisYear: false,
  nationalPension: 2_250_000,
  healthAndEmploymentInsurance: 2_400_000,
  creditCard: 0,
  debitAndCash: 0,
  marketAndTransit: 0,
  medicalSelf: 0,
  medicalFamily: 0,
  education: 0,
  protectionInsurance: 0,
  donation: 0,
  hometownDonation: 0,
  monthlyRent: 0,
  pensionSavings: 0,
  irp: 0,
  housingSubscription: 0,
  housingLoanRepayment: 0,
};

test("총급여 5,000만원 1인 가구의 결정세액을 단계별로 계산한다", () => {
  const tax = computeYearEndTax(base);

  // 근로소득공제: 1,200만 + (5,000만 − 4,500만) × 5%
  assert.equal(tax.earnedIncomeDeduction, 12_250_000);
  assert.equal(tax.taxBase, 31_600_000);
  // 3,160만 × 15% − 126만
  assert.equal(tax.calculatedTax, 3_480_000);
  // 한도 74만 − (5,000만 − 3,300만) × 0.8% = 60.4만 → 최소 66만
  assert.equal(tax.earnedIncomeCredit, 660_000);
  assert.equal(tax.determinedIncomeTax, 2_820_000);
  assert.equal(tax.determinedLocalTax, 282_000);
  assert.equal(tax.usedStandardCredit, false);
});

test("근로소득 세액공제 한도는 총급여 구간마다 줄어든다", () => {
  const large = 10_000_000;
  assert.equal(earnedIncomeTaxCredit(large, 33_000_000, YEAR_END_2026), 740_000);
  assert.equal(earnedIncomeTaxCredit(large, 40_000_000, YEAR_END_2026), 684_000);
  assert.equal(earnedIncomeTaxCredit(large, 70_000_000, YEAR_END_2026), 660_000);
  assert.equal(earnedIncomeTaxCredit(large, 80_000_000, YEAR_END_2026), 500_000);
  assert.equal(earnedIncomeTaxCredit(large, 130_000_000, YEAR_END_2026), 200_000);
  // 산출세액 130만원 이하는 55%
  assert.equal(earnedIncomeTaxCredit(1_000_000, 30_000_000, YEAR_END_2026), 550_000);
});

test("자녀 세액공제는 1명 25만, 2명 55만, 3명 95만원이다", () => {
  assert.equal(childTaxCreditFor(0, YEAR_END_2026), 0);
  assert.equal(childTaxCreditFor(1, YEAR_END_2026), 250_000);
  assert.equal(childTaxCreditFor(2, YEAR_END_2026), 550_000);
  assert.equal(childTaxCreditFor(3, YEAR_END_2026), 950_000);
  assert.equal(childTaxCreditFor(4, YEAR_END_2026), 1_350_000);
});

test("카드 사용액이 총급여의 25%를 넘지 못하면 공제가 없다", () => {
  const result = calculateYearEndTax({ ...base, creditCard: 12_500_000 });
  assert.equal(result.rows.some((row) => row.label === "신용카드 등 공제"), false);
  assert.match(result.warnings.join(" "), /25%를 넘지 않아/);
});

test("카드 공제는 낮은 공제율 수단부터 문턱을 채운다", () => {
  // 문턱 1,250만: 신용카드 1,500만 중 250만 × 15%, 체크 500만 × 30%, 전통시장 100만 × 40%
  const deduction = cardDeductionFor(
    {
      totalSalary: 50_000_000,
      creditCard: 15_000_000,
      debitAndCash: 5_000_000,
      marketAndTransit: 1_000_000,
      childrenAll: 0,
    },
    YEAR_END_2026,
  );
  assert.equal(deduction, 375_000 + 1_500_000 + 400_000);
});

test("카드 기본 한도는 자녀 수에 따라 2명까지 늘어난다", () => {
  const spend = {
    totalSalary: 50_000_000,
    creditCard: 40_000_000,
    debitAndCash: 0,
    marketAndTransit: 0,
  };
  assert.equal(cardDeductionFor({ ...spend, childrenAll: 0 }, YEAR_END_2026), 3_000_000);
  assert.equal(cardDeductionFor({ ...spend, childrenAll: 1 }, YEAR_END_2026), 3_500_000);
  assert.equal(cardDeductionFor({ ...spend, childrenAll: 2 }, YEAR_END_2026), 4_000_000);
  assert.equal(cardDeductionFor({ ...spend, childrenAll: 3 }, YEAR_END_2026), 4_000_000);

  const highEarner = { ...spend, totalSalary: 80_000_000, creditCard: 60_000_000 };
  assert.equal(cardDeductionFor({ ...highEarner, childrenAll: 0 }, YEAR_END_2026), 2_500_000);
  assert.equal(cardDeductionFor({ ...highEarner, childrenAll: 2 }, YEAR_END_2026), 3_000_000);
});

test("전통시장·대중교통분은 기본 한도를 넘어도 추가 한도만큼 더 공제된다", () => {
  // 신용카드 초과분 2,750만 × 15% = 412.5만(기본 한도 300만 초과), 전통시장 500만 × 40% = 200만
  const deduction = cardDeductionFor(
    {
      totalSalary: 50_000_000,
      creditCard: 40_000_000,
      debitAndCash: 0,
      marketAndTransit: 5_000_000,
      childrenAll: 0,
    },
    YEAR_END_2026,
  );
  assert.equal(deduction, 3_000_000 + 2_000_000);
});

test("의료비는 총급여의 3%를 넘는 부분만, 일반 가족분은 700만원까지 공제한다", () => {
  // 문턱 150만. 가족 100만은 문턱에 50만 모자라므로 본인 100만에서 50만을 뺀다.
  const small = computeYearEndTax({ ...base, medicalSelf: 1_000_000, medicalFamily: 1_000_000 });
  assert.equal(small.specialCredits, 75_000);

  // 가족 1,000만 − 150만 = 850만 → 한도 700만
  const capped = computeYearEndTax({ ...base, medicalFamily: 10_000_000 });
  assert.equal(capped.specialCredits, 1_050_000);

  const under = calculateYearEndTax({ ...base, medicalSelf: 1_000_000 });
  assert.match(under.warnings.join(" "), /3%를 넘지 않아/);
});

test("6세 이하 등 한도 없는 의료비는 일반 가족의 700만원 한도를 적용하지 않는다", () => {
  // 총급여 5,000만원 × 3% = 150만원. (1,000만 − 150만) × 15% = 127.5만원.
  const unlimited = computeYearEndTax({ ...base, medicalSelf: 10_000_000 });
  const ordinary = computeYearEndTax({ ...base, medicalFamily: 10_000_000 });
  assert.equal(unlimited.specialCredits, 1_275_000);
  assert.equal(ordinary.specialCredits, 1_050_000);
  assert.equal(ordinary.determinedIncomeTax - unlimited.determinedIncomeTax, 225_000);

  // 일반 가족분이 문턱을 먼저 채우면 한도 없는 의료비는 전액 남는다.
  const mixed = computeYearEndTax({ ...base, medicalSelf: 2_000_000, medicalFamily: 8_500_000 });
  assert.equal(mixed.specialCredits, 1_350_000);
});

test("고향사랑기부금은 10만원까지 전액, 10만~20만원 40%, 초과분 15%를 공제한다", () => {
  assert.equal(computeYearEndTax({ ...base, hometownDonation: 100_000 }).hometownCredit, 90_909);
  assert.equal(computeYearEndTax({ ...base, hometownDonation: 200_000 }).hometownCredit, 130_909);
  assert.equal(computeYearEndTax({ ...base, hometownDonation: 300_000 }).hometownCredit, 145_909);
});

test("월세 세액공제는 총급여 5,500만원 이하 17%, 8,000만원 초과는 대상이 아니다", () => {
  const low = computeYearEndTax({ ...base, monthlyRent: 12_000_000 });
  assert.equal(low.rentCredit, 1_700_000);

  const middle = computeYearEndTax({ ...base, totalSalary: 70_000_000, monthlyRent: 6_000_000 });
  assert.equal(middle.rentCredit, 900_000);

  const high = calculateYearEndTax({ ...base, totalSalary: 90_000_000, monthlyRent: 6_000_000 });
  assert.equal(high.rows.some((row) => row.label === "월세 세액공제"), false);
  assert.match(high.warnings.join(" "), /월세 세액공제를 적용하지 않았습니다/);
});

test("특별재난지역 적격 기부만 있으면 20만원 초과분에 30%를 적용한다", () => {
  const disaster = computeYearEndTax({ ...base, hometownDonation: 1_000_000, hometownDonationRegion: "disaster" });
  // 10만 × 100/110 + 10만 × 40% + 80만 × 30%
  assert.equal(disaster.hometownCredit, 370_909);
  assert.equal(computeYearEndTax({ ...base, hometownDonation: 200_000, hometownDonationRegion: "disaster" }).hometownCredit, 130_909);
  assert.equal(computeYearEndTax({ ...base, hometownDonation: 100_000, hometownDonationRegion: "disaster" }).hometownCredit, 90_909);
  const ordinary = computeYearEndTax({ ...base, hometownDonation: 1_000_000 });
  assert.equal(disaster.hometownCredit - ordinary.hometownCredit, 120_000);
  assert.equal(calculateYearEndTax({ ...base, hometownDonation: 0, hometownDonationRegion: "mixed" }).primary.amount, calculateYearEndTax(base).primary.amount);
  assert.equal(computeYearEndTax({ ...base, hometownDonation: 100_000, hometownDonationRegion: "mixed" }).hometownCredit, 90_909);
  assert.equal(computeYearEndTax({ ...base, hometownDonation: 200_000, hometownDonationRegion: "mixed" }).hometownCredit, 130_909);
  assert.throws(() => calculateYearEndTax({ ...base, hometownDonation: 200_001, hometownDonationRegion: "mixed" }), /20만원/);
  assert.throws(() => calculateYearEndTax({ ...base, hometownDonation: 1_000_000, hometownDonationRegion: "mixed" }), /홈택스/);
});

test("연금계좌는 연금저축 600만, IRP 합산 900만원까지 공제한다", () => {
  const savingsOnly = computeYearEndTax({ ...base, pensionSavings: 8_000_000 });
  assert.equal(savingsOnly.pensionCredit, 900_000);

  const combined = computeYearEndTax({
    ...base,
    totalSalary: 60_000_000,
    nationalPension: 2_850_000,
    pensionSavings: 6_000_000,
    irp: 5_000_000,
  });
  assert.equal(combined.pensionCredit, 1_080_000);
});

test("주택청약과 전세대출 상환액은 합쳐서 400만원까지 소득공제한다", () => {
  const subscription = computeYearEndTax({ ...base, housingSubscription: 5_000_000 });
  assert.equal(subscription.housingDeduction, 1_200_000);

  const both = computeYearEndTax({
    ...base,
    housingSubscription: 3_000_000,
    housingLoanRepayment: 12_000_000,
  });
  assert.equal(both.housingDeduction, 4_000_000);

  const overCutoff = computeYearEndTax({
    ...base,
    totalSalary: 75_000_000,
    housingSubscription: 3_000_000,
  });
  assert.equal(overCutoff.housingDeduction, 0);
});

test("세액공제 합계가 산출세액을 넘어도 결정세액은 0원 아래로 내려가지 않는다", () => {
  const tax = computeYearEndTax({
    ...base,
    totalSalary: 30_000_000,
    nationalPension: 1_350_000,
    healthAndEmploymentInsurance: 1_400_000,
    dependents: 4,
    childrenAll: 3,
    children: 3,
    pensionSavings: 6_000_000,
    monthlyRent: 10_000_000,
  });
  assert.equal(tax.determinedIncomeTax, 0);
  assert.equal(tax.determinedLocalTax, 0);
});

test("항목별 공제가 없으면 표준세액공제 13만원을 쓴다", () => {
  const tax = computeYearEndTax({ ...base, healthAndEmploymentInsurance: 0 });
  assert.equal(tax.usedStandardCredit, true);
  assert.equal(tax.standardCredit, 130_000);
});

test("표준세액공제 경로에서도 주택청약저축을 유지하고 전세대출은 제외한다", () => {
  const tax = computeYearEndTax({
    ...base,
    healthAndEmploymentInsurance: 0,
    housingSubscription: 3_000_000,
    housingLoanRepayment: 100_000,
  });
  assert.equal(tax.usedStandardCredit, true);
  assert.equal(tax.housingDeduction, 1_200_000);
  // 5,000만 − 근로소득공제 1,225만 − 인적 150만 − 연금 225만 − 청약 120만
  assert.equal(tax.taxBase, 32_800_000);
  // 3,280만 × 15% − 126만 − 근로세액공제 66만 − 표준 13만
  assert.equal(tax.determinedIncomeTax, 2_870_000);

  const overSalary = computeYearEndTax({
    ...base,
    totalSalary: 75_000_000,
    healthAndEmploymentInsurance: 0,
    housingSubscription: 3_000_000,
  });
  assert.equal(overSalary.usedStandardCredit, true);
  assert.equal(overSalary.housingDeduction, 0);
});

test("전세대출 공제가 유리하면 특별소득공제 경로의 합산 한도 400만원을 적용한다", () => {
  const tax = computeYearEndTax({
    ...base,
    healthAndEmploymentInsurance: 0,
    housingSubscription: 3_000_000,
    housingLoanRepayment: 12_000_000,
  });
  assert.equal(tax.usedStandardCredit, false);
  assert.equal(tax.housingDeduction, 4_000_000);
  assert.equal(tax.standardCredit, 0);
});

test("이미 낸 세금과 비교해 환급액 또는 추가 납부액을 보여준다", () => {
  const refund = calculateYearEndTax({ ...base, withheldIncomeTax: 3_000_000 });
  assert.equal(refund.primary.label, "예상 환급액");
  // (300만 + 30만) − (282만 + 28.2만)
  assert.equal(refund.primary.amount, 198_000);

  const extra = calculateYearEndTax({ ...base, withheldIncomeTax: 2_500_000 });
  assert.equal(extra.primary.label, "예상 추가 납부액");
  assert.equal(extra.primary.amount, 352_000);

  const unknown = calculateYearEndTax(base);
  assert.match(unknown.primary.label, /결정세액/);
  assert.equal(unknown.primary.amount, 3_102_000);
});

test("결혼 세액공제와 인적 추가공제를 반영한다", () => {
  const married = computeYearEndTax({ ...base, marriedThisYear: true });
  assert.equal(married.marriageCredit, 500_000);

  const family = computeYearEndTax({ ...base, dependents: 3, seniors: 1, disabled: 1 });
  assert.equal(family.personalDeduction, 4_500_000 + 1_000_000 + 2_000_000);
});

test("가족 수 입력의 모순을 거부한다", () => {
  assert.throws(() => calculateYearEndTax({ ...base, childrenAll: 1 }), /자녀 수/);
  assert.throws(
    () => calculateYearEndTax({ ...base, dependents: 3, childrenAll: 1, children: 2 }),
    /전체 자녀 수/,
  );
  assert.throws(() => calculateYearEndTax({ ...base, totalSalary: 0 }), /총급여/);
  assert.throws(() => calculateYearEndTax({ ...base, creditCard: -1 }), /신용카드/);
});

test("4대보험료 자동 추정은 12개월 요율을 더한다", () => {
  const estimate = estimateAnnualInsurance(60_000_000);
  // 월 500만 × 4.75% × 12
  assert.equal(estimate.nationalPension, 2_850_000);
  // 건강 179,750 + 장기요양 23,620 + 고용 45,000 = 248,370 × 12
  assert.equal(estimate.healthAndEmploymentInsurance, 2_980_440);

  // 월 1,000만원은 국민연금 상한(1~6월 637만, 7~12월 659만)에 걸린다.
  const capped = estimateAnnualInsurance(120_000_000);
  assert.equal(capped.nationalPension, 302_575 * 6 + 313_025 * 6);
});
