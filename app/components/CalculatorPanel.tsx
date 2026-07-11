"use client";

import { FormEvent, ReactNode, RefObject, useRef, useState } from "react";
import {
  calculateAnnualLeave,
  calculateHourlyPay,
  calculateSalary,
  calculateSeverance,
  calculateShutdownAllowance,
  calculateUnemploymentBenefit,
  calculateWeeklyHolidayPay,
} from "@/lib/calculations";
import { recordAnonymousMetric } from "@/app/components/AnonymousAnalytics";
import { calculatorBySlug, type CalculatorSlug } from "@/lib/site-content";

type ResultLike = {
  primary: { label: string; amount: number; unit: "원" | "일" | "시간" | "%" | "개월" | "년" };
  rows: Array<{
    label: string;
    amount: number;
    unit: "원" | "일" | "시간" | "%" | "개월" | "년";
    note?: string;
  }>;
  assumptions: string[];
  warnings: string[];
  policyVersion: string;
};

const formatWon = (value: number) => `${Math.round(value).toLocaleString("ko-KR")}원`;

const formatResultValue = (value: number, unit: ResultLike["primary"]["unit"]) => {
  if (unit === "원") return formatWon(value);
  const rounded = Number.isInteger(value) ? value : Number(value.toFixed(1));
  return `${rounded.toLocaleString("ko-KR")}${unit}`;
};

const numberFromInput = (value: string) =>
  Number(value.replace(/[^0-9.-]/g, "")) || 0;

const formatMoneyInput = (value: string) => {
  const digits = value.replace(/[^0-9]/g, "");
  return digits ? Number(digits).toLocaleString("ko-KR") : "";
};

function MoneyField({
  id,
  label,
  value,
  onChange,
  help,
  placeholder,
  required = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const helpId = help ? `${id}-help` : undefined;
  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      <div className="money-input-wrap">
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(formatMoneyInput(event.target.value))}
          inputMode="numeric"
          autoComplete="off"
          aria-describedby={helpId}
          placeholder={placeholder}
          required={required}
        />
        <span aria-hidden="true">원</span>
      </div>
      {help ? (
        <p className="field-help" id={helpId}>
          {help}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  children,
  help,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  help?: string;
}) {
  const helpId = help ? `${id}-help` : undefined;
  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={helpId}
      >
        {children}
      </select>
      {help ? (
        <p className="field-help" id={helpId}>
          {help}
        </p>
      ) : null}
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  help,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  help?: string;
}) {
  const helpId = help ? `${id}-help` : undefined;
  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      <div className="money-input-wrap plain-number-wrap">
        <input
          id={id}
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          min={min}
          max={max}
          step={step}
          aria-describedby={helpId}
          required
        />
        {suffix ? <span aria-hidden="true">{suffix}</span> : null}
      </div>
      {help ? (
        <p className="field-help" id={helpId}>
          {help}
        </p>
      ) : null}
    </div>
  );
}

function DateField({
  id,
  label,
  value,
  onChange,
  help,
  type = "date",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
  type?: "date" | "month";
}) {
  const helpId = help ? `${id}-help` : undefined;
  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={helpId}
        required
      />
      {help ? (
        <p className="field-help" id={helpId}>
          {help}
        </p>
      ) : null}
    </div>
  );
}

function CheckField({
  id,
  checked,
  onChange,
  label,
  help,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  help?: string;
}) {
  return (
    <div className="check-field">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <label htmlFor={id}>
        <strong>{label}</strong>
        {help ? <span>{help}</span> : null}
      </label>
    </div>
  );
}

function ResultPanel({
  result,
  resultRef,
  error,
}: {
  result: ResultLike | null;
  resultRef: RefObject<HTMLHeadingElement | null>;
  error: string;
}) {
  if (!result) {
    return (
      <aside className="result-panel result-primer" aria-label="계산 전 안내">
        <div className="primer-index">PAYLAB / VERIFIED</div>
        <h2>숫자만큼 근거도 선명하게</h2>
        <p>
          계산 후에는 예상 금액과 함께 사용한 요율, 상·하한, 포함하지 않은 조건을
          한 화면에서 확인할 수 있습니다.
        </p>
        <ul className="primer-list">
          <li>입력값은 서버에 저장하지 않음</li>
          <li>기준일이 있는 정책은 적용 월 반영</li>
          <li>공식 자료와 계산 가정 공개</li>
        </ul>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
      </aside>
    );
  }

  const primaryValue = formatResultValue(result.primary.amount, result.primary.unit);

  return (
    <aside className="result-panel result-ready" aria-live="polite">
      <div className="result-topline">
        <span>예상 결과</span>
        <span>{result.policyVersion}</span>
      </div>
      <h2 ref={resultRef} tabIndex={-1}>
        {result.primary.label}
      </h2>
      <div className="result-primary">{primaryValue}</div>
      <div className="result-rule" aria-hidden="true" />
      <table className="result-table">
        <caption>계산 결과 상세</caption>
        <tbody>
          {result.rows.map((row, index) => (
            <tr key={`${row.label}-${index}`}>
              <th scope="row">{row.label}</th>
              <td>
                {formatResultValue(row.amount, row.unit)}
                {row.note ? <small className="result-row-note">{row.note}</small> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {result.warnings.length ? (
        <div className="result-warning">
          <strong>확인해 주세요</strong>
          <ul>
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <details className="assumptions">
        <summary>계산에 사용한 가정</summary>
        <ul>
          {result.assumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
      </details>
    </aside>
  );
}

function CalculatorFrame({
  slug,
  children,
  onSubmit,
  result,
  resultRef,
  error,
  compact,
}: {
  slug: CalculatorSlug;
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  result: ResultLike | null;
  resultRef: RefObject<HTMLHeadingElement | null>;
  error: string;
  compact?: boolean;
}) {
  const meta = calculatorBySlug[slug];
  return (
    <div className={`calculator-workspace${compact ? " calculator-workspace-compact" : ""}`}>
      <form className="calculator-form" onSubmit={onSubmit} noValidate={false}>
        <div className="form-heading">
          <span>{meta.index} / {meta.group}</span>
          <h2>{meta.question}</h2>
          <p>{meta.description}</p>
        </div>
        <div className="form-fields">{children}</div>
        {error ? (
          <p className="form-error mobile-only-error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="calculate-button" type="submit">
          계산하기
          <span aria-hidden="true">→</span>
        </button>
        <p className="privacy-note">
          <span className="status-dot" aria-hidden="true" /> 입력값은 이 브라우저 안에서만
          계산됩니다.
        </p>
      </form>
      <ResultPanel result={result} resultRef={resultRef} error={error} />
    </div>
  );
}

function useCalculatorResult(slug: CalculatorSlug) {
  const [result, setResult] = useState<ResultLike | null>(null);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLHeadingElement>(null);

  const run = (calculate: () => ResultLike) => {
    try {
      const nextResult = calculate();
      setResult(nextResult);
      setError("");
      recordAnonymousMetric("calculation", `/calculators/${slug}`);
      window.setTimeout(() => resultRef.current?.focus(), 0);
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "입력값을 다시 확인해 주세요.");
    }
  };

  return { result, error, resultRef, run };
}

function SalaryCalculator({ compact }: { compact?: boolean }) {
  const [basis, setBasis] = useState<"monthly" | "annual">("monthly");
  const [gross, setGross] = useState("3,500,000");
  const [nonTaxable, setNonTaxable] = useState("0");
  const [dependents, setDependents] = useState("1");
  const [children, setChildren] = useState("0");
  const [effectiveMonth, setEffectiveMonth] = useState("2026-07");
  const state = useCalculatorResult("salary");

  return (
    <CalculatorFrame
      slug="salary"
      compact={compact}
      result={state.result}
      resultRef={state.resultRef}
      error={state.error}
      onSubmit={(event) => {
        event.preventDefault();
        state.run(() =>
          calculateSalary({
            basis,
            gross: numberFromInput(gross),
            nonTaxableMonthly: numberFromInput(nonTaxable),
            dependents: Number(dependents),
            children: Number(children),
            effectiveMonth,
          }),
        );
      }}
    >
      <div className="segmented-control" aria-label="급여 입력 기준">
        <button
          type="button"
          className={basis === "monthly" ? "active" : ""}
          aria-pressed={basis === "monthly"}
          onClick={() => setBasis("monthly")}
        >
          월급
        </button>
        <button
          type="button"
          className={basis === "annual" ? "active" : ""}
          aria-pressed={basis === "annual"}
          onClick={() => setBasis("annual")}
        >
          연봉
        </button>
      </div>
      <MoneyField
        id="salary-gross"
        label={basis === "monthly" ? "세전 월급" : "세전 연봉"}
        value={gross}
        onChange={setGross}
        placeholder={basis === "monthly" ? "3,500,000" : "42,000,000"}
      />
      <div className="field-grid">
        <MoneyField
          id="salary-nontaxable"
          label="월 비과세액"
          value={nonTaxable}
          onChange={setNonTaxable}
          help="급여명세서상 비과세 식대 등이 있을 때만 입력하세요."
        />
        <DateField
          id="salary-month"
          type="month"
          label="급여 귀속월"
          value={effectiveMonth}
          onChange={setEffectiveMonth}
          help="국민연금 상·하한이 7월부터 달라집니다."
        />
      </div>
      <div className="field-grid">
        <SelectField
          id="salary-dependents"
          label="공제대상 가족 수"
          value={dependents}
          onChange={setDependents}
          help="본인을 포함한 예상 인원입니다."
        >
          {[1, 2, 3, 4, 5, 6].map((value) => (
            <option key={value} value={value}>
              {value}명
            </option>
          ))}
        </SelectField>
        <SelectField
          id="salary-children"
          label="자녀 공제 인원"
          value={children}
          onChange={setChildren}
        >
          {[0, 1, 2, 3].map((value) => (
            <option key={value} value={value}>
              {value === 0 ? "없음" : value === 3 ? "3명 이상" : `${value}명`}
            </option>
          ))}
        </SelectField>
      </div>
    </CalculatorFrame>
  );
}

function HourlyCalculator() {
  const [hourlyWage, setHourlyWage] = useState("10,320");
  const [weeklyHours, setWeeklyHours] = useState("40");
  const [workdays, setWorkdays] = useState("5");
  const [attended, setAttended] = useState(true);
  const state = useCalculatorResult("hourly");

  return (
    <CalculatorFrame
      slug="hourly"
      result={state.result}
      resultRef={state.resultRef}
      error={state.error}
      onSubmit={(event) => {
        event.preventDefault();
        state.run(() =>
          calculateHourlyPay({
            hourlyWage: numberFromInput(hourlyWage),
            weeklyHours: Number(weeklyHours),
            workdaysPerWeek: Number(workdays),
            attendedAllDays: attended,
          }),
        );
      }}
    >
      <MoneyField id="hourly-wage" label="시급" value={hourlyWage} onChange={setHourlyWage} />
      <div className="field-grid">
        <NumberField
          id="hourly-hours"
          label="주 소정근로시간"
          value={weeklyHours}
          onChange={setWeeklyHours}
          min={1}
          max={40}
          step={0.5}
          suffix="시간"
          help="연장·야간근로를 제외한 약정 시간입니다."
        />
        <SelectField id="hourly-days" label="주 근무일수" value={workdays} onChange={setWorkdays}>
          {[1, 2, 3, 4, 5, 6].map((value) => (
            <option key={value} value={value}>
              {value}일
            </option>
          ))}
        </SelectField>
      </div>
      <CheckField
        id="hourly-attended"
        checked={attended}
        onChange={setAttended}
        label="이번 주 소정근로일을 모두 근무했어요"
        help="주휴수당 발생 여부를 판단하는 조건입니다."
      />
    </CalculatorFrame>
  );
}

function SeveranceCalculator() {
  const [hireDate, setHireDate] = useState("2024-01-01");
  const [retirementDate, setRetirementDate] = useState("2026-07-01");
  const [wages, setWages] = useState("10,500,000");
  const [bonus, setBonus] = useState("0");
  const [leaveAllowance, setLeaveAllowance] = useState("0");
  const [ordinaryDaily, setOrdinaryDaily] = useState("");
  const [weeklyHours, setWeeklyHours] = useState("40");
  const state = useCalculatorResult("severance");

  return (
    <CalculatorFrame
      slug="severance"
      result={state.result}
      resultRef={state.resultRef}
      error={state.error}
      onSubmit={(event) => {
        event.preventDefault();
        state.run(() =>
          calculateSeverance({
            hireDate,
            retirementDate,
            lastThreeMonthsWages: numberFromInput(wages),
            annualBonus: numberFromInput(bonus),
            annualLeaveAllowance: numberFromInput(leaveAllowance),
            ordinaryDailyWage: numberFromInput(ordinaryDaily) || undefined,
            weeklyHours: Number(weeklyHours),
          }),
        );
      }}
    >
      <div className="field-grid">
        <DateField id="severance-start" label="입사일" value={hireDate} onChange={setHireDate} />
        <DateField
          id="severance-end"
          label="근로관계 종료일"
          value={retirementDate}
          onChange={setRetirementDate}
          help="마지막 근무일의 다음 날을 입력하세요."
        />
      </div>
      <MoneyField
        id="severance-wages"
        label="퇴직 전 3개월 임금 총액"
        value={wages}
        onChange={setWages}
        help="기본급과 매월 지급된 수당을 합한 금액입니다."
      />
      <div className="field-grid">
        <MoneyField id="severance-bonus" label="연간 상여금 총액" value={bonus} onChange={setBonus} />
        <MoneyField
          id="severance-leave"
          label="연간 연차수당"
          value={leaveAllowance}
          onChange={setLeaveAllowance}
        />
      </div>
      <details className="advanced-fields">
        <summary>고급 조건</summary>
        <div className="field-grid">
          <MoneyField
            id="severance-ordinary"
            label="1일 통상임금"
            value={ordinaryDaily}
            onChange={setOrdinaryDaily}
            required={false}
            help="평균임금보다 높을 때 적용합니다."
          />
          <NumberField
            id="severance-hours"
            label="4주 평균 주 소정근로시간"
            value={weeklyHours}
            onChange={setWeeklyHours}
            min={1}
            max={40}
            suffix="시간"
          />
        </div>
      </details>
    </CalculatorFrame>
  );
}

function UnemploymentCalculator() {
  const [wage, setWage] = useState("3,000,000");
  const [days, setDays] = useState("92");
  const [dailyHours, setDailyHours] = useState("8");
  const [ageGroup, setAgeGroup] = useState<"under50" | "over50">("under50");
  const [period, setPeriod] = useState<"under1" | "1to3" | "3to5" | "5to10" | "over10">("1to3");
  const state = useCalculatorResult("unemployment");

  return (
    <CalculatorFrame
      slug="unemployment"
      result={state.result}
      resultRef={state.resultRef}
      error={state.error}
      onSubmit={(event) => {
        event.preventDefault();
        state.run(() =>
          calculateUnemploymentBenefit({
            averageMonthlyWage: numberFromInput(wage),
            referenceDays: Number(days),
            dailyHours: Number(dailyHours),
            ageGroup,
            insuredPeriod: period,
          }),
        );
      }}
    >
      <MoneyField id="unemployment-wage" label="퇴직 전 월평균 임금" value={wage} onChange={setWage} />
      <div className="field-grid">
        <NumberField
          id="unemployment-days"
          label="최근 3개월 총일수"
          value={days}
          onChange={setDays}
          min={89}
          max={92}
          suffix="일"
        />
        <NumberField
          id="unemployment-hours"
          label="1일 소정근로시간"
          value={dailyHours}
          onChange={setDailyHours}
          min={1}
          max={8}
          suffix="시간"
          help="하한액 계산에 사용합니다."
        />
      </div>
      <div className="field-grid">
        <SelectField id="unemployment-age" label="퇴직 당시 연령" value={ageGroup} onChange={(value) => setAgeGroup(value as typeof ageGroup)}>
          <option value="under50">50세 미만</option>
          <option value="over50">50세 이상 또는 장애인</option>
        </SelectField>
        <SelectField id="unemployment-period" label="고용보험 피보험기간" value={period} onChange={(value) => setPeriod(value as typeof period)}>
          <option value="under1">1년 미만</option>
          <option value="1to3">1년 이상 3년 미만</option>
          <option value="3to5">3년 이상 5년 미만</option>
          <option value="5to10">5년 이상 10년 미만</option>
          <option value="over10">10년 이상</option>
        </SelectField>
      </div>
    </CalculatorFrame>
  );
}

function AnnualLeaveCalculator() {
  const [hireDate, setHireDate] = useState("2025-07-01");
  const [asOfDate, setAsOfDate] = useState("2026-07-11");
  const [fivePlus, setFivePlus] = useState(true);
  const [weeklyHours, setWeeklyHours] = useState("40");
  const [attendance, setAttendance] = useState("100");
  const [fullMonths, setFullMonths] = useState(true);
  const state = useCalculatorResult("annual-leave");

  return (
    <CalculatorFrame
      slug="annual-leave"
      result={state.result}
      resultRef={state.resultRef}
      error={state.error}
      onSubmit={(event) => {
        event.preventDefault();
        state.run(() =>
          calculateAnnualLeave({
            hireDate,
            asOfDate,
            workplaceAtLeastFive: fivePlus,
            weeklyHours: Number(weeklyHours),
            attendanceRate: Number(attendance) / 100,
            fullMonthAttendance: fullMonths,
          }),
        );
      }}
    >
      <div className="field-grid">
        <DateField id="leave-start" label="입사일" value={hireDate} onChange={setHireDate} />
        <DateField id="leave-asof" label="기준일" value={asOfDate} onChange={setAsOfDate} />
      </div>
      <div className="field-grid">
        <NumberField
          id="leave-hours"
          label="주 소정근로시간"
          value={weeklyHours}
          onChange={setWeeklyHours}
          min={1}
          max={40}
          suffix="시간"
        />
        <NumberField
          id="leave-attendance"
          label="첫 1년 출근율"
          value={attendance}
          onChange={setAttendance}
          min={0}
          max={100}
          suffix="%"
        />
      </div>
      <CheckField
        id="leave-five"
        checked={fivePlus}
        onChange={setFivePlus}
        label="상시근로자 5인 이상 사업장이에요"
        help="법정 연차는 원칙적으로 5인 이상 사업장에 적용됩니다."
      />
      <CheckField
        id="leave-months"
        checked={fullMonths}
        onChange={setFullMonths}
        label="1년 미만 기간의 각 월을 개근했어요"
      />
    </CalculatorFrame>
  );
}

function WeeklyHolidayCalculator() {
  const [wage, setWage] = useState("10,320");
  const [hours, setHours] = useState("20");
  const [attended, setAttended] = useState(true);
  const state = useCalculatorResult("weekly-holiday");

  return (
    <CalculatorFrame
      slug="weekly-holiday"
      result={state.result}
      resultRef={state.resultRef}
      error={state.error}
      onSubmit={(event) => {
        event.preventDefault();
        state.run(() =>
          calculateWeeklyHolidayPay({
            hourlyWage: numberFromInput(wage),
            weeklyHours: Number(hours),
            attendedAllDays: attended,
          }),
        );
      }}
    >
      <MoneyField id="weekly-wage" label="시급" value={wage} onChange={setWage} />
      <NumberField
        id="weekly-hours"
        label="주 소정근로시간"
        value={hours}
        onChange={setHours}
        min={1}
        max={40}
        step={0.5}
        suffix="시간"
      />
      <CheckField
        id="weekly-attended"
        checked={attended}
        onChange={setAttended}
        label="이번 주 소정근로일을 모두 근무했어요"
      />
    </CalculatorFrame>
  );
}

function ShutdownCalculator() {
  const [average, setAverage] = useState("100,000");
  const [ordinary, setOrdinary] = useState("");
  const [days, setDays] = useState("10");
  const state = useCalculatorResult("shutdown");

  return (
    <CalculatorFrame
      slug="shutdown"
      result={state.result}
      resultRef={state.resultRef}
      error={state.error}
      onSubmit={(event) => {
        event.preventDefault();
        state.run(() =>
          calculateShutdownAllowance({
            averageDailyWage: numberFromInput(average),
            ordinaryDailyWage: numberFromInput(ordinary) || undefined,
            shutdownDays: Number(days),
          }),
        );
      }}
    >
      <MoneyField id="shutdown-average" label="1일 평균임금" value={average} onChange={setAverage} />
      <div className="field-grid">
        <MoneyField
          id="shutdown-ordinary"
          label="1일 통상임금"
          value={ordinary}
          onChange={setOrdinary}
          required={false}
          help="모르면 비워둘 수 있습니다."
        />
        <NumberField
          id="shutdown-days"
          label="휴업일수"
          value={days}
          onChange={setDays}
          min={1}
          max={365}
          suffix="일"
        />
      </div>
    </CalculatorFrame>
  );
}

export function CalculatorPanel({
  slug,
  compact = false,
}: {
  slug: CalculatorSlug;
  compact?: boolean;
}) {
  switch (slug) {
    case "salary":
      return <SalaryCalculator compact={compact} />;
    case "hourly":
      return <HourlyCalculator />;
    case "severance":
      return <SeveranceCalculator />;
    case "unemployment":
      return <UnemploymentCalculator />;
    case "annual-leave":
      return <AnnualLeaveCalculator />;
    case "weekly-holiday":
      return <WeeklyHolidayCalculator />;
    case "shutdown":
      return <ShutdownCalculator />;
  }
}
