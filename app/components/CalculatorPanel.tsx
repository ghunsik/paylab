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
import { FIRST_SUPPORTED_MONTH, LAST_SUPPORTED_MONTH, type PolicyYear } from "@/lib/policy";
import { calculateYearEndTax, estimateAnnualInsurance } from "@/lib/year-end-tax";
import { recordAnonymousMetric } from "@/app/components/AnonymousAnalytics";
import type { CalculatorSlug } from "@/lib/site-content";

type ResultLike = {
  primary: {
    label: string;
    amount: number;
    unit: "원" | "일" | "시간" | "%" | "개월" | "년";
    note?: string;
  };
  rows: Array<{
    label: string;
    amount: number;
    unit: "원" | "일" | "시간" | "%" | "개월" | "년";
    kind?: "income" | "deduction" | "subtotal" | "total" | "info";
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

/** 오늘 날짜가 지원 범위 안이면 그 달을, 아니면 범위의 끝을 기본값으로 쓴다. */
function defaultMonth(): string {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (month < FIRST_SUPPORTED_MONTH) return FIRST_SUPPORTED_MONTH;
  if (month > LAST_SUPPORTED_MONTH) return LAST_SUPPORTED_MONTH;
  return month;
}

function defaultYear(): PolicyYear {
  return new Date().getFullYear() >= 2027 ? 2027 : 2026;
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function YearField({
  id,
  label,
  value,
  onChange,
  help,
}: {
  id: string;
  label: string;
  value: PolicyYear;
  onChange: (value: PolicyYear) => void;
  help?: string;
}) {
  return (
    <SelectField
      id={id}
      label={label}
      value={String(value)}
      onChange={(next) => onChange(Number(next) as PolicyYear)}
      help={help}
    >
      <option value="2026">2026년</option>
      <option value="2027">2027년</option>
    </SelectField>
  );
}

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
      <div className="unit-input">
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
      <div className="unit-input">
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
  min,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
  type?: "date" | "month";
  min?: string;
  max?: string;
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
        min={min}
        max={max}
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
}: {
  result: ResultLike | null;
  resultRef: RefObject<HTMLHeadingElement | null>;
}) {
  if (!result) {
    return (
      <aside className="result result-empty" aria-label="계산 결과">
        <strong>결과가 여기에 나옵니다</strong>
        <p>값을 넣고 계산하기를 누르면 금액과 항목별 내역, 계산에 쓴 가정을 보여줍니다.</p>
      </aside>
    );
  }

  return (
    <aside className="result" aria-live="polite">
      <h2 ref={resultRef} tabIndex={-1}>
        {result.primary.label}
      </h2>
      <p className="result-amount">
        <span>{formatResultValue(result.primary.amount, result.primary.unit)}</span>
      </p>
      {result.primary.note ? <p className="result-sub">{result.primary.note}</p> : null}
      <table className="result-table">
        <caption>계산 내역</caption>
        <tbody>
          {result.rows.map((row, index) => (
            <tr key={`${row.label}-${index}`} className={row.kind ? `row-${row.kind}` : undefined}>
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
          <strong>확인할 점</strong>
          <ul>
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <details className="assumptions">
        <summary>이 계산에 쓴 가정 보기</summary>
        <ul>
          {result.assumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
      </details>
      <p className="result-version">기준 데이터 {result.policyVersion}</p>
    </aside>
  );
}

function CalculatorFrame({
  children,
  onSubmit,
  result,
  resultRef,
  error,
  submitLabel = "계산하기",
}: {
  slug: CalculatorSlug;
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  result: ResultLike | null;
  resultRef: RefObject<HTMLHeadingElement | null>;
  error: string;
  compact?: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="calc">
      <form className="calc-form" onSubmit={onSubmit}>
        <div className="calc-fields">{children}</div>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="calc-button" type="submit">
          {submitLabel}
        </button>
        <p className="calc-note">입력한 값은 이 브라우저 안에서만 계산하고 저장하지 않습니다.</p>
      </form>
      <ResultPanel result={result} resultRef={resultRef} />
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
  const [effectiveMonth, setEffectiveMonth] = useState(defaultMonth);
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
      <div className="toggle" role="group" aria-label="급여 입력 기준">
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
          min={FIRST_SUPPORTED_MONTH}
          max={LAST_SUPPORTED_MONTH}
          help="2027년 1월부터 국민연금·장기요양보험료율이 오릅니다."
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

function YearEndTaxCalculator() {
  const [salary, setSalary] = useState("45,000,000");
  const [withheld, setWithheld] = useState("");
  const [dependents, setDependents] = useState("1");
  const [childrenAll, setChildrenAll] = useState("0");
  const [children, setChildren] = useState("0");
  const [seniors, setSeniors] = useState("0");
  const [disabled, setDisabled] = useState("0");
  const [married, setMarried] = useState(false);
  const [autoInsurance, setAutoInsurance] = useState(true);
  const [pension, setPension] = useState("");
  const [insurance, setInsurance] = useState("");
  const [creditCard, setCreditCard] = useState("");
  const [debit, setDebit] = useState("");
  const [market, setMarket] = useState("");
  const [medicalSelf, setMedicalSelf] = useState("");
  const [medicalFamily, setMedicalFamily] = useState("");
  const [education, setEducation] = useState("");
  const [protection, setProtection] = useState("");
  const [donation, setDonation] = useState("");
  const [hometown, setHometown] = useState("");
  const [rent, setRent] = useState("");
  const [pensionSavings, setPensionSavings] = useState("");
  const [irp, setIrp] = useState("");
  const [subscription, setSubscription] = useState("");
  const [loan, setLoan] = useState("");
  const state = useCalculatorResult("year-end-tax");

  const counts = (maximum: number) =>
    Array.from({ length: maximum + 1 }, (_, value) => (
      <option key={value} value={value}>
        {value === 0 ? "없음" : `${value}명`}
      </option>
    ));

  return (
    <CalculatorFrame
      slug="year-end-tax"
      result={state.result}
      resultRef={state.resultRef}
      error={state.error}
      onSubmit={(event) => {
        event.preventDefault();
        state.run(() => {
          const totalSalary = numberFromInput(salary);
          const estimated = estimateAnnualInsurance(totalSalary);
          return calculateYearEndTax({
            totalSalary,
            withheldIncomeTax: withheld.trim() ? numberFromInput(withheld) : undefined,
            dependents: Number(dependents),
            childrenAll: Number(childrenAll),
            children: Number(children),
            seniors: Number(seniors),
            disabled: Number(disabled),
            marriedThisYear: married,
            nationalPension: autoInsurance ? estimated.nationalPension : numberFromInput(pension),
            healthAndEmploymentInsurance: autoInsurance
              ? estimated.healthAndEmploymentInsurance
              : numberFromInput(insurance),
            creditCard: numberFromInput(creditCard),
            debitAndCash: numberFromInput(debit),
            marketAndTransit: numberFromInput(market),
            medicalSelf: numberFromInput(medicalSelf),
            medicalFamily: numberFromInput(medicalFamily),
            education: numberFromInput(education),
            protectionInsurance: numberFromInput(protection),
            donation: numberFromInput(donation),
            hometownDonation: numberFromInput(hometown),
            monthlyRent: numberFromInput(rent),
            pensionSavings: numberFromInput(pensionSavings),
            irp: numberFromInput(irp),
            housingSubscription: numberFromInput(subscription),
            housingLoanRepayment: numberFromInput(loan),
          });
        });
      }}
    >
      <MoneyField
        id="yearend-salary"
        label="2026년 총급여"
        value={salary}
        onChange={setSalary}
        help="1년 동안 받은 세전 급여에서 비과세(식대 등)를 뺀 금액입니다."
      />
      <MoneyField
        id="yearend-withheld"
        label="이미 낸 소득세 (선택)"
        value={withheld}
        onChange={setWithheld}
        required={false}
        help="급여명세서의 소득세를 1~12월 합한 금액입니다. 지방소득세는 빼고 넣으세요. 비워 두면 결정세액만 계산합니다."
      />

      <div className="field-section">
        <h3>가족</h3>
        <div className="calc-fields">
          <div className="field-grid">
            <SelectField
              id="yearend-dependents"
              label="기본공제 인원"
              value={dependents}
              onChange={setDependents}
              help="본인을 포함해 내가 공제받는 가족 수"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((value) => (
                <option key={value} value={value}>
                  {value}명
                </option>
              ))}
            </SelectField>
            <SelectField
              id="yearend-children-all"
              label="그중 자녀 (20세 이하)"
              value={childrenAll}
              onChange={setChildrenAll}
              help="카드 공제 한도가 자녀 수만큼 늘어납니다."
            >
              {counts(5)}
            </SelectField>
          </div>
          <SelectField
            id="yearend-children"
            label="자녀 중 2016년 이전에 태어난 자녀"
            value={children}
            onChange={setChildren}
            help="2026년 귀속 자녀세액공제 대상입니다. 2017년 이후 출생 자녀는 아동수당을 받는 동안 제외됩니다."
          >
            {counts(5)}
          </SelectField>
          <details className="more-fields">
            <summary>70세 이상·장애인 가족, 올해 결혼</summary>
            <div className="calc-fields">
              <div className="field-grid">
                <SelectField id="yearend-seniors" label="70세 이상" value={seniors} onChange={setSeniors}>
                  {counts(4)}
                </SelectField>
                <SelectField id="yearend-disabled" label="장애인" value={disabled} onChange={setDisabled}>
                  {counts(4)}
                </SelectField>
              </div>
              <CheckField
                id="yearend-married"
                checked={married}
                onChange={setMarried}
                label="2026년에 혼인신고를 했어요"
                help="결혼 세액공제 50만원(생애 한 번)을 적용합니다."
              />
            </div>
          </details>
        </div>
      </div>

      <div className="field-section">
        <h3>4대보험료</h3>
        <div className="calc-fields">
          <CheckField
            id="yearend-auto-insurance"
            checked={autoInsurance}
            onChange={setAutoInsurance}
            label="총급여로 자동 계산"
            help="정확한 금액을 알면 체크를 풀고 직접 넣으세요."
          />
          {autoInsurance ? null : (
            <div className="field-grid">
              <MoneyField
                id="yearend-pension"
                label="국민연금 (연간)"
                value={pension}
                onChange={setPension}
                required={false}
              />
              <MoneyField
                id="yearend-insurance"
                label="건강·장기요양·고용보험 (연간)"
                value={insurance}
                onChange={setInsurance}
                required={false}
              />
            </div>
          )}
        </div>
      </div>

      <div className="field-section">
        <h3>카드·현금영수증</h3>
        <p>1년 사용액을 수단별로 나눠 넣으세요. 홈택스 연말정산 미리보기에서 확인할 수 있습니다.</p>
        <div className="calc-fields">
          <MoneyField id="yearend-credit" label="신용카드" value={creditCard} onChange={setCreditCard} required={false} />
          <div className="field-grid">
            <MoneyField id="yearend-debit" label="체크카드·현금영수증" value={debit} onChange={setDebit} required={false} />
            <MoneyField id="yearend-market" label="전통시장·대중교통" value={market} onChange={setMarket} required={false} />
          </div>
        </div>
      </div>

      <details className="more-fields">
        <summary>의료비·교육비·보험료·기부금</summary>
        <div className="calc-fields">
          <div className="field-grid">
            <MoneyField
              id="yearend-medical-self"
              label="의료비: 본인·65세 이상·장애인"
              value={medicalSelf}
              onChange={setMedicalSelf}
              required={false}
              help="실손보험금으로 돌려받은 금액은 빼고 넣으세요."
            />
            <MoneyField
              id="yearend-medical-family"
              label="의료비: 그 밖의 가족"
              value={medicalFamily}
              onChange={setMedicalFamily}
              required={false}
              help="연 700만원까지만 공제됩니다."
            />
          </div>
          <div className="field-grid">
            <MoneyField
              id="yearend-education"
              label="교육비"
              value={education}
              onChange={setEducation}
              required={false}
              help="자녀는 1명당 초중고 300만원, 대학 900만원까지만 넣으세요."
            />
            <MoneyField
              id="yearend-protection"
              label="보장성 보험료"
              value={protection}
              onChange={setProtection}
              required={false}
              help="연 100만원까지 공제됩니다."
            />
          </div>
          <div className="field-grid">
            <MoneyField id="yearend-donation" label="기부금" value={donation} onChange={setDonation} required={false} />
            <MoneyField id="yearend-hometown" label="고향사랑기부금" value={hometown} onChange={setHometown} required={false} />
          </div>
        </div>
      </details>

      <details className="more-fields">
        <summary>월세·전세대출·청약·연금저축</summary>
        <div className="calc-fields">
          <MoneyField
            id="yearend-rent"
            label="월세 (1년 합계)"
            value={rent}
            onChange={setRent}
            required={false}
            help="무주택 세대주이고 총급여 8,000만원 이하일 때 연 1,000만원까지 공제됩니다."
          />
          <div className="field-grid">
            <MoneyField
              id="yearend-loan"
              label="전세대출 원리금 상환액"
              value={loan}
              onChange={setLoan}
              required={false}
            />
            <MoneyField
              id="yearend-subscription"
              label="주택청약 납입액"
              value={subscription}
              onChange={setSubscription}
              required={false}
              help="총급여 7,000만원 이하 무주택 세대주"
            />
          </div>
          <div className="field-grid">
            <MoneyField
              id="yearend-pension-savings"
              label="연금저축 납입액"
              value={pensionSavings}
              onChange={setPensionSavings}
              required={false}
              help="연 600만원까지"
            />
            <MoneyField
              id="yearend-irp"
              label="IRP 납입액"
              value={irp}
              onChange={setIrp}
              required={false}
              help="연금저축과 합쳐 900만원까지"
            />
          </div>
        </div>
      </details>
    </CalculatorFrame>
  );
}

function HourlyCalculator() {
  const [hourlyWage, setHourlyWage] = useState("10,320");
  const [weeklyHours, setWeeklyHours] = useState("40");
  const [workdays, setWorkdays] = useState("5");
  const [attended, setAttended] = useState(true);
  const [year, setYear] = useState<PolicyYear>(defaultYear);
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
            year,
          }),
        );
      }}
    >
      <div className="field-grid">
        <MoneyField id="hourly-wage" label="시급" value={hourlyWage} onChange={setHourlyWage} />
        <YearField
          id="hourly-year"
          label="적용 연도"
          value={year}
          onChange={setYear}
          help="이 연도의 최저임금과 비교합니다."
        />
      </div>
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
  const [retirementDate, setRetirementDate] = useState(todayIso);
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
      <details className="more-fields">
        <summary>통상임금·근로시간 직접 입력</summary>
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
  const [separationYear, setSeparationYear] = useState<PolicyYear>(defaultYear);
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
            separationYear,
          }),
        );
      }}
    >
      <div className="field-grid">
        <MoneyField id="unemployment-wage" label="퇴직 전 월평균 임금" value={wage} onChange={setWage} />
        <YearField
          id="unemployment-year"
          label="퇴사한 연도"
          value={separationYear}
          onChange={setSeparationYear}
          help="상한액과 하한액이 연도마다 다릅니다."
        />
      </div>
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
  const [asOfDate, setAsOfDate] = useState(todayIso);
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
  const [year, setYear] = useState<PolicyYear>(defaultYear);
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
            year,
          }),
        );
      }}
    >
      <div className="field-grid">
        <MoneyField id="weekly-wage" label="시급" value={wage} onChange={setWage} />
        <YearField
          id="weekly-year"
          label="적용 연도"
          value={year}
          onChange={setYear}
          help="이 연도의 최저임금과 비교합니다."
        />
      </div>
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
    case "year-end-tax":
      return <YearEndTaxCalculator />;
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
