import assert from "node:assert/strict";
import { test } from "node:test";

import {
  POLICY_2026,
  POLICY_VERSION,
  calculateAnnualLeave,
  calculateHourlyPay,
  calculateSalary,
  calculateSeverance,
  calculateShutdownAllowance,
  calculateUnemploymentBenefit,
  calculateWeeklyHolidayPay,
  estimateIncomeTax,
  type CalculationResult,
} from "../lib/calculations.ts";

function amountFor(result: CalculationResult, label: string): number {
  const row = result.rows.find((candidate) => candidate.label === label);
  assert.ok(row, `${label} 결과 행이 있어야 합니다.`);
  return row.amount;
}

function assertCommonResult(result: CalculationResult): void {
  assert.equal(typeof result.primary.label, "string");
  assert.equal(typeof result.primary.amount, "number");
  assert.ok(Array.isArray(result.rows));
  assert.ok(Array.isArray(result.assumptions));
  assert.ok(Array.isArray(result.warnings));
  assert.equal(result.policyVersion, POLICY_VERSION);
}

test("2026 정책 상수를 공식 기준으로 고정한다", () => {
  assert.equal(POLICY_2026.minimumWage.hourly, 10_320);
  assert.equal(POLICY_2026.minimumWage.monthlyHours, 209);
  assert.equal(POLICY_2026.minimumWage.monthlyAmount, 2_156_880);
  assert.equal(POLICY_2026.insurance.nationalPension.employeeRate, 0.0475);
  assert.equal(POLICY_2026.insurance.health.employeeRate, 0.03595);
  assert.equal(POLICY_2026.insurance.health.employeeMonthlyMinimum, 10_080);
  assert.equal(POLICY_2026.insurance.health.employeeMonthlyMaximum, 4_591_740);
  assert.equal(POLICY_2026.insurance.longTermCare.contributionRate, 0.009448);
  assert.equal(POLICY_2026.insurance.longTermCare.healthContributionRate, 0.0719);
  assert.equal(POLICY_2026.unemployment.dailyUpper, 68_100);
});

test("급여 계산은 2026년 상반기와 하반기 국민연금 상한을 구분한다", () => {
  const common = {
    basis: "monthly" as const,
    gross: 10_000_000,
    nonTaxableMonthly: 0,
    dependents: 1,
    children: 0,
  };
  const june = calculateSalary({ ...common, effectiveMonth: "2026-06" });
  const july = calculateSalary({ ...common, effectiveMonth: "2026-07" });

  assert.equal(amountFor(june, "국민연금"), 302_575);
  assert.equal(amountFor(july, "국민연금"), 313_025);
  assert.match(june.warnings.join(" "), /6,370,000원/);
  assert.match(july.warnings.join(" "), /6,590,000원/);
  assertCommonResult(june);
});

test("급여 계산은 비과세액과 가족 입력의 모순을 거부한다", () => {
  assert.throws(
    () =>
      calculateSalary({
        basis: "monthly",
        gross: 3_000_000,
        nonTaxableMonthly: 3_000_001,
        dependents: 1,
        children: 0,
        effectiveMonth: "2026-07",
      }),
    /비과세액/,
  );
  assert.throws(
    () =>
      calculateSalary({
        basis: "annual",
        gross: 48_000_000,
        nonTaxableMonthly: 200_000,
        dependents: 1,
        children: 1,
        effectiveMonth: "2026-07",
      }),
    /자녀 수/,
  );
});

test("급여 계산은 건강보험 근로자 부담 상·하한을 적용한다", () => {
  const common = {
    basis: "monthly" as const,
    nonTaxableMonthly: 0,
    dependents: 1,
    children: 0,
    effectiveMonth: "2026-07",
  };
  const low = calculateSalary({ ...common, gross: 100_000 });
  const high = calculateSalary({ ...common, gross: 200_000_000 });

  assert.equal(amountFor(low, "건강보험"), 10_080);
  assert.equal(amountFor(high, "건강보험"), 4_591_740);
  assert.match(low.warnings.join(" "), /하한 10,080원/);
  assert.match(high.warnings.join(" "), /상한 4,591,740원/);
});

test("소득세 근사치는 자녀세액공제를 연간 한 번만 적용한다", () => {
  const common = {
    monthlyTaxableIncome: 8_000_000,
    dependents: 4,
    annualInsuranceContributions: 4_000_000,
  };
  const noChild = estimateIncomeTax({ ...common, eligibleChildren: 0 });
  const oneChild = estimateIncomeTax({ ...common, eligibleChildren: 1 });

  assert.equal(noChild.annualIncomeTax - oneChild.annualIncomeTax, 250_000);
  assert.match(oneChild.warnings.join(" "), /공식 근로소득 간이세액표/);
});

test("주 40시간 최저임금은 공식 월 209시간 금액으로 환산한다", () => {
  const result = calculateHourlyPay({
    hourlyWage: 10_320,
    weeklyHours: 40,
    workdaysPerWeek: 5,
    attendedAllDays: true,
  });

  assert.equal(result.primary.amount, 2_156_880);
  assert.equal(amountFor(result, "월 환산 유급시간"), 209);
  assert.equal(amountFor(result, "주휴수당"), 82_560);
  assertCommonResult(result);
});

test("시급 계산은 최저임금 미달과 연장근로 미반영을 경고한다", () => {
  const result = calculateHourlyPay({
    hourlyWage: 10_000,
    weeklyHours: 45,
    workdaysPerWeek: 5,
    attendedAllDays: true,
  });
  assert.match(result.warnings.join(" "), /최저임금/);
  assert.match(result.warnings.join(" "), /가산수당/);
});

test("퇴직금 계산은 월말을 보정한 직전 3개 달력월을 사용한다", () => {
  const result = calculateSeverance({
    hireDate: "2025-05-31",
    retirementDate: "2026-05-31",
    lastThreeMonthsWages: 9_000_000,
    annualBonus: 0,
    annualLeaveAllowance: 0,
    weeklyHours: 40,
  });

  assert.equal(amountFor(result, "계속근로일수"), 365);
  assert.equal(amountFor(result, "평균임금 산정기간"), 92);
  assert.equal(result.primary.amount, 2_934_783);
  assertCommonResult(result);
});

test("퇴직금은 평균임금보다 큰 통상임금을 적용한다", () => {
  const result = calculateSeverance({
    hireDate: "2025-07-01",
    retirementDate: "2026-07-01",
    lastThreeMonthsWages: 9_000_000,
    annualBonus: 0,
    annualLeaveAllowance: 0,
    ordinaryDailyWage: 110_000,
    weeklyHours: 40,
  });

  assert.equal(amountFor(result, "적용 1일 임금"), 110_000);
  assert.equal(result.primary.amount, 3_300_000);
});

test("구직급여 하한액은 1일 소정근로시간에 비례한다", () => {
  const common = {
    averageMonthlyWage: 1_000_000,
    referenceDays: 92,
    ageGroup: "under50" as const,
    insuredPeriod: "1to3" as const,
  };
  const eightHours = calculateUnemploymentBenefit({ ...common, dailyHours: 8 });
  const fourHours = calculateUnemploymentBenefit({ ...common, dailyHours: 4 });

  assert.equal(amountFor(eightHours, "1일 하한액"), 66_048);
  assert.equal(eightHours.primary.amount, 66_048);
  assert.equal(amountFor(fourHours, "1일 하한액"), 33_024);
  assert.equal(fourHours.primary.amount, 33_024);
});

test("구직급여 상한과 50세 이상 장기가입 급여일수를 적용한다", () => {
  const result = calculateUnemploymentBenefit({
    averageMonthlyWage: 10_000_000,
    referenceDays: 92,
    dailyHours: 8,
    ageGroup: "over50",
    insuredPeriod: "over10",
  });

  assert.equal(result.primary.amount, 68_100);
  assert.equal(amountFor(result, "소정급여일수"), 270);
  assert.equal(amountFor(result, "총 예상 구직급여"), 18_387_000);
  assertCommonResult(result);
});

test("연차는 30일 나눗셈이 아닌 달력월과 입사기념일로 계산한다", () => {
  const oneMonth = calculateAnnualLeave({
    hireDate: "2026-01-31",
    asOfDate: "2026-02-28",
    workplaceAtLeastFive: true,
    weeklyHours: 40,
    attendanceRate: 1,
    fullMonthAttendance: true,
  });
  const anniversaryEve = calculateAnnualLeave({
    hireDate: "2024-03-01",
    asOfDate: "2025-02-28",
    workplaceAtLeastFive: true,
    weeklyHours: 40,
    attendanceRate: 1,
    fullMonthAttendance: true,
  });
  const anniversary = calculateAnnualLeave({
    hireDate: "2024-03-01",
    asOfDate: "2025-03-01",
    workplaceAtLeastFive: true,
    weeklyHours: 40,
    attendanceRate: 1,
    fullMonthAttendance: true,
  });
  const thirdAnniversary = calculateAnnualLeave({
    hireDate: "2023-03-01",
    asOfDate: "2026-03-01",
    workplaceAtLeastFive: true,
    weeklyHours: 40,
    attendanceRate: 1,
    fullMonthAttendance: true,
  });

  assert.equal(oneMonth.primary.amount, 1);
  assert.equal(anniversaryEve.primary.amount, 11);
  assert.equal(anniversary.primary.amount, 15);
  assert.equal(thirdAnniversary.primary.amount, 16);
  assertCommonResult(oneMonth);
});

test("연차는 적용 제외 조건과 역전 날짜를 처리한다", () => {
  const smallWorkplace = calculateAnnualLeave({
    hireDate: "2025-01-01",
    asOfDate: "2026-01-01",
    workplaceAtLeastFive: false,
    weeklyHours: 40,
    attendanceRate: 1,
    fullMonthAttendance: true,
  });
  assert.equal(smallWorkplace.primary.amount, 0);
  assert.match(smallWorkplace.warnings.join(" "), /5인 미만/);
  assert.throws(
    () =>
      calculateAnnualLeave({
        hireDate: "2026-02-01",
        asOfDate: "2026-01-31",
        workplaceAtLeastFive: true,
        weeklyHours: 40,
        attendanceRate: 1,
        fullMonthAttendance: true,
      }),
    /기준일/,
  );
});

test("주휴수당은 주 40시간에서 8시간분을 계산한다", () => {
  const eligible = calculateWeeklyHolidayPay({
    hourlyWage: 10_320,
    weeklyHours: 40,
    attendedAllDays: true,
  });
  const shortHours = calculateWeeklyHolidayPay({
    hourlyWage: 10_320,
    weeklyHours: 14.5,
    attendedAllDays: true,
  });

  assert.equal(eligible.primary.amount, 82_560);
  assert.equal(amountFor(eligible, "주휴 산정시간"), 8);
  assert.equal(shortHours.primary.amount, 0);
  assert.match(shortHours.warnings.join(" "), /15시간 미만/);
  assertCommonResult(eligible);
});

test("휴업수당은 평균임금 70%와 더 낮은 통상임금을 비교한다", () => {
  const ordinaryApplied = calculateShutdownAllowance({
    averageDailyWage: 100_000,
    ordinaryDailyWage: 60_000,
    shutdownDays: 10,
  });
  const averageApplied = calculateShutdownAllowance({
    averageDailyWage: 100_000,
    shutdownDays: 10,
  });

  assert.equal(ordinaryApplied.primary.amount, 600_000);
  assert.equal(averageApplied.primary.amount, 700_000);
  assert.throws(
    () =>
      calculateShutdownAllowance({
        averageDailyWage: 100_000,
        shutdownDays: -1,
      }),
    /휴업일수/,
  );
  assertCommonResult(ordinaryApplied);
});
