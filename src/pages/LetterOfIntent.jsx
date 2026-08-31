import { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import AdminLayout from "../components/AdminLayout";
import "../App.css";
import "../styles/tailwind.css";
import { formatDateDDMMYYYY } from "../utils/dateFormat";

import logo from "../assets/ProminentLogo.png";
import sign from "../assets/Sign.jpg";
import watermark from "../assets/p2.jpg";

const company = {
  name: "PROMINENT SCIENTIFIC PVT LTD",
  website: "www.prominentscientific.co.in",
  email: "info@prominentscientific.co.in",
  phone: "+91 7801083072",
  addressLines: [
    "Address: JQ-Chambers, D.No.4-50/5,",
    "Plot No: 5, 4th Floor, Gachibowli,",
    "Hyderabad, Telangana - 500032",
  ],
};

const fields = [
  ["employeeName", "Employee Name"],
  ["houseNumber", "House Number"],
  ["street", "Street"],
  ["mandal", "Mandal"],
  ["district", "District"],
  ["state", "State"],
  ["pincode", "Pincode"],
  ["designation", "Designation"],
  ["joiningDate", "Joining Date", "date"],
  ["annualCtc", "Annual CTC"],
  ["variablePay", "Variable Pay Annual"],
];

const parseAmount = (value) => {
  if (typeof value === "number") return value;
  const amount = Number(String(value || "").replace(/,/g, "").trim());
  return Number.isFinite(amount) ? amount : 0;
};

const formatAmount = (value) => {
  const amount = parseAmount(value);
  if (!amount && value !== 0 && value !== "0") return value || "-";
  return amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
};

const round = (value) => String(Math.round(value));
const annualize = (value) => String(Math.round(parseAmount(value) * 12));

const calculateSalary = (annualCtcValue, variablePayValue) => {
  const annualCtc = parseAmount(annualCtcValue);
  const variablePay = parseAmount(variablePayValue);

  if (annualCtc <= 0) {
    return {
      fixedAnnualPay: "",
      basicPay: "",
      basicPayAnnual: "",
      hra: "",
      hraAnnual: "",
      conveyanceAllowance: "",
      conveyanceAnnual: "",
      medicalAllowance: "",
      medicalAnnual: "",
      specialAllowance: "",
      specialAnnual: "",
      employeePf: "",
      employeePfAnnual: "",
      employerPf: "",
      employerPfAnnual: "",
      professionalTax: "",
      professionalTaxAnnual: "",
      gratuity: "",
      gratuityAnnual: "",
      insurance: "",
      insuranceAnnual: "",
      grossPay: "",
    };
  }

  const fixedAnnualPay = Math.max(annualCtc - Math.max(variablePay, 0), 0);
  const fixedMonthlyPay = fixedAnnualPay / 12;
  const basicPay = round((fixedAnnualPay * 50) / 100 / 12);
  const hra = round((fixedAnnualPay * 20) / 100 / 12);
  const conveyanceAllowance = fixedAnnualPay > 0 ? "1600" : "";
  const medicalAllowance = fixedAnnualPay > 0 ? "1250" : "";
  const employeePf = fixedAnnualPay > 0 ? "1800" : "";
  const employerPf = fixedAnnualPay > 0 ? "1800" : "";
  const professionalTax = fixedAnnualPay > 0 ? "200" : "";
  const insurance = fixedAnnualPay > 0 ? "600" : "";
  const gratuity = round((annualCtc * 2.0533) / 100 / 12);
  const specialAllowance = round(
    Math.max(
      fixedMonthlyPay -
        parseAmount(basicPay) -
        parseAmount(hra) -
        parseAmount(conveyanceAllowance) -
        parseAmount(medicalAllowance),
      0
    )
  );

  return {
    fixedAnnualPay: round(fixedAnnualPay),
    basicPay,
    basicPayAnnual: annualize(basicPay),
    hra,
    hraAnnual: annualize(hra),
    conveyanceAllowance,
    conveyanceAnnual: annualize(conveyanceAllowance),
    medicalAllowance,
    medicalAnnual: annualize(medicalAllowance),
    specialAllowance,
    specialAnnual: annualize(specialAllowance),
    employeePf,
    employeePfAnnual: annualize(employeePf),
    employerPf,
    employerPfAnnual: annualize(employerPf),
    professionalTax,
    professionalTaxAnnual: annualize(professionalTax),
    gratuity,
    gratuityAnnual: annualize(gratuity),
    insurance,
    insuranceAnnual: annualize(insurance),
    grossPay: round(fixedMonthlyPay),
  };
};

const getCurrentDate = () =>
  formatDateDDMMYYYY(new Date());

const formatJoinDate = (value) => {
  if (!value) return "-";
  return formatDateDDMMYYYY(value);
};

function LetterHeader() {
  return (
    <div className="loi-header">
      <img src={logo} alt="" className="loi-logo" />
      <div className="loi-company">
        <strong>{company.name}</strong>
        {company.addressLines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
    </div>
  );
}

function LetterFooter() {
  return (
    <div className="loi-footer">
      <hr />
      <div>Website: {company.website}</div>
      <div>Email: {company.email} Tel: {company.phone}</div>
    </div>
  );
}

function LetterOfIntent({ userName, onLogout }) {
  const pdfRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [form, setForm] = useState({
    employeeName: "",
    houseNumber: "",
    street: "",
    mandal: "",
    district: "",
    state: "",
    pincode: "",
    designation: "",
    joiningDate: "",
    annualCtc: "",
    variablePay: "",
    ...calculateSalary("", ""),
  });

  const updateField = (key) => (event) => {
    const value = event.target.value;
    setForm((current) => {
      const next = { ...current, [key]: value };
      return {
        ...next,
        ...(["annualCtc", "variablePay"].includes(key)
          ? calculateSalary(next.annualCtc, next.variablePay)
          : {}),
      };
    });
  };

  const employeeAddressLines = [
    [form.houseNumber, form.street].filter(Boolean).join(", "),
    [form.mandal, form.district].filter(Boolean).join(", "),
    [form.state, form.pincode].filter(Boolean).join("-"),
  ].filter(Boolean);
  const firstName = form.employeeName.trim().split(/\s+/)[0] || form.employeeName || "-";
  const totalContributionMonthly = parseAmount(form.employerPf);
  const totalContributionAnnual = parseAmount(form.employerPfAnnual);
  const ctcMonthly = Math.max(parseAmount(form.grossPay) - totalContributionMonthly, 0);
  const ctcAnnual = ctcMonthly * 12;
  const totalDeductionMonthly =
    parseAmount(form.professionalTax) +
    parseAmount(form.employeePf) +
    parseAmount(form.gratuity) +
    parseAmount(form.insurance);
  const totalDeductionAnnual =
    parseAmount(form.professionalTaxAnnual) +
    parseAmount(form.employeePfAnnual) +
    parseAmount(form.gratuityAnnual) +
    parseAmount(form.insuranceAnnual);
  const netTakeHomeMonthly = Math.max(ctcMonthly - totalDeductionMonthly, 0);
  const netTakeHomeAnnual = Math.max(ctcAnnual - totalDeductionAnnual, 0);

  const offer = {
    ...form,
    employeeName: form.employeeName || "-",
    designation: form.designation || "-",
    joiningDate: formatJoinDate(form.joiningDate),
    generatedDate: getCurrentDate(),
    annualCtc: formatAmount(form.annualCtc),
    variablePay: formatAmount(form.variablePay),
    basicPay: formatAmount(form.basicPay),
    basicPayAnnual: formatAmount(form.basicPayAnnual),
    hra: formatAmount(form.hra),
    hraAnnual: formatAmount(form.hraAnnual),
    conveyanceAllowance: formatAmount(form.conveyanceAllowance),
    conveyanceAnnual: formatAmount(form.conveyanceAnnual),
    medicalAllowance: formatAmount(form.medicalAllowance),
    medicalAnnual: formatAmount(form.medicalAnnual),
    specialAllowance: formatAmount(form.specialAllowance),
    specialAnnual: formatAmount(form.specialAnnual),
    employeePf: formatAmount(form.employeePf),
    employeePfAnnual: formatAmount(form.employeePfAnnual),
    employerPf: formatAmount(form.employerPf),
    employerPfAnnual: formatAmount(form.employerPfAnnual),
    professionalTax: formatAmount(form.professionalTax),
    professionalTaxAnnual: formatAmount(form.professionalTaxAnnual),
    gratuity: formatAmount(form.gratuity),
    gratuityAnnual: formatAmount(form.gratuityAnnual),
    insurance: formatAmount(form.insurance),
    insuranceAnnual: formatAmount(form.insuranceAnnual),
    grossPay: formatAmount(form.grossPay),
    totalContributionMonthly: formatAmount(totalContributionMonthly),
    totalContributionAnnual: formatAmount(totalContributionAnnual),
    ctcMonthly: formatAmount(ctcMonthly),
    ctcAnnual: formatAmount(ctcAnnual),
    totalDeductionMonthly: formatAmount(totalDeductionMonthly),
    totalDeductionAnnual: formatAmount(totalDeductionAnnual),
    netTakeHomeMonthly: formatAmount(netTakeHomeMonthly),
    netTakeHomeAnnual: formatAmount(netTakeHomeAnnual),
  };

  const generatePDF = async () => {
    if (!form.employeeName.trim()) {
      alert("Please enter employee name");
      return;
    }

    try {
      setIsGenerating(true);
      const pages = pdfRef.current.querySelectorAll(".loi-page");
      const pdf = new jsPDF("p", "mm", "a4");

      for (let index = 0; index < pages.length; index += 1) {
        const canvas = await html2canvas(pages[index], {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
        });
        if (index > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
      }

      pdf.save(`LetterOfIntent_${form.employeeName.replaceAll(" ", "_")}.pdf`);
      alert("Letter of Intent downloaded successfully!");
    } catch (err) {
      console.error("Letter of Intent PDF error:", err);
      alert("Error generating PDF: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AdminLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="essentials"
      title="Generate Letter of Intent"
      subtitle="Enter candidate details and salary to generate a Letter of Intent PDF."
    >
      <div className="letter-generator-page">
        <style>{`
          .loi-pdf-root {
            position: fixed;
            top: -9999px;
            left: -9999px;
            width: 210mm;
            background: #fff;
            color: #111;
            font-family: "Times New Roman", Times, serif;
          }
          .loi-page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm 17mm 14mm;
            position: relative;
            display: flex;
            flex-direction: column;
            page-break-after: always;
            background-color: #fff;
            background-image: url(${watermark});
            background-repeat: no-repeat;
            background-position: center 136mm;
            background-size: 300px;
            overflow: hidden;
            font-size: 16px;
            line-height: 1.24;
          }
          .loi-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 18mm;
          }
          .loi-logo {
            width: 98px;
            height: auto;
          }
          .loi-company {
            width: 74mm;
            color: #0b244a;
            font-size: 16px;
            line-height: 1.25;
          }
          .loi-company span,
          .loi-company strong {
            display: block;
          }
          .loi-title {
            text-align: center;
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 20px;
          }
          .loi-date {
            text-align: right;
            font-weight: 700;
            margin-bottom: 22px;
          }
          .loi-date-preview {
            margin-top: 6px;
            color: #0f766e;
            font-size: 12px;
            font-weight: 700;
          }
          .loi-address {
            margin-bottom: 30px;
            font-weight: 700;
          }
          .loi-address div {
            font-weight: 400;
          }
          .loi-subject {
            text-align: center;
            font-weight: 700;
            margin-bottom: 24px;
          }
          .loi-body p {
            margin: 0 0 15px;
            text-align: justify;
          }
          .loi-signature-block {
            margin-top: 8px;
            font-weight: 700;
          }
          .loi-signature-image {
            width: 105px;
            height: auto;
            margin: 4px 0 2px;
            display: block;
          }
          .loi-acceptance {
            margin-top: 14px;
          }
          .loi-sign-line {
            display: flex;
            justify-content: space-between;
            margin-top: 18px;
            font-weight: 700;
          }
          .loi-footer {
            margin-top: auto;
            color: #0b4c6c;
            text-align: center;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            line-height: 1.25;
          }
          .loi-footer hr {
            border: 0;
            border-top: 1.4px solid #0b7180;
            margin-bottom: 7px;
          }
        `}</style>

        <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-client">Essentials</p>
            <h1 className="text-lg font-semibold text-foreground">Generate Letter of Intent</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter candidate details, Annual CTC, and Variable Pay. The annexure salary tables are calculated automatically.
            </p>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              generatePDF();
            }}
            className="flex flex-col gap-4"
          >
            <div className="text-sm font-semibold text-foreground">Candidate Details</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map(([key, label, type = "text"]) => (
                <div className="flex flex-col gap-1.5" key={key}>
                  <label className="text-sm font-medium text-foreground">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={updateField(key)}
                    placeholder={label}
                    className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                  />
                  {type === "date" && form[key] && (
                    <div className="text-xs text-[#0f766e]">Selected date: {formatDateDDMMYYYY(form[key])}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-2 text-sm font-semibold text-foreground">Salary Preview</div>
            <div className="text-xs text-muted-foreground">Fixed Annual Pay = Annual CTC - Variable Pay</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["fixedAnnualPay", "Fixed Annual Pay"],
                ["basicPay", "Basic Pay Monthly"],
                ["hra", "HRA Monthly"],
                ["specialAllowance", "Special Allowance Monthly"],
                ["grossPay", "Gross Salary Monthly"],
              ].map(([key, label]) => (
                <div className="flex flex-col gap-1.5" key={key}>
                  <label className="text-sm font-medium text-foreground">{label}</label>
                  <input
                    value={formatAmount(form[key])}
                    readOnly
                    placeholder={label}
                    className="h-9 rounded-lg border border-border bg-muted/40 px-3 text-sm text-foreground outline-none"
                  />
                </div>
              ))}
            </div>
            <button
              type="submit"
              disabled={isGenerating}
              className="h-9 w-fit rounded-lg bg-client px-4 text-sm font-medium text-client-foreground hover:bg-client/90 disabled:opacity-60"
            >
              {isGenerating ? "Generating..." : "Generate Letter of Intent"}
            </button>
          </form>
        </section>

        <div ref={pdfRef} className="loi-pdf-root">
          <div className="loi-page">
            <LetterHeader />
            <div className="loi-title">Warm Welcome</div>
            <div className="loi-date">{offer.generatedDate}</div>
            <div className="loi-address">
              {offer.employeeName},
              {employeeAddressLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
            <div className="loi-subject">Subject: Letter of Intent</div>
            <div className="loi-body">
              <p>Dear <strong>{firstName}</strong>,</p>
              <p>We are pleased to offer you employment with <strong>Prominent Scientific Private Limited</strong> as an <strong>{offer.designation}</strong>.</p>
              <p>You will be assigned to work on projects and client engagements as determined by the company from time to time. Your responsibilities, reporting structure, and work location will be communicated upon joining.</p>
              <p>Your <strong>Cost to Company (CTC)</strong> will be <strong>INR Rs. {offer.annualCtc}/-</strong> per annum. The salary structure is described in the Salary Structure <strong>(Annexure-1)</strong>.</p>
              <p>We request you to join our organization on or before <strong>{offer.joiningDate}</strong>. A detailed Appointment Letter containing the terms and conditions of your employment will be issued upon your joining.</p>
              <p>Your employment with Prominent Scientific Private Limited shall be governed by the company's policies and procedures.</p>
              <p>We are confident that your skills, knowledge, and enthusiasm will contribute significantly to the success of our organization. We look forward to welcoming you to the Prominent Scientific family.</p>
              <p>Please sign and return a copy of this letter as a token of your acceptance.</p>
            </div>
            <div className="loi-signature-block">
              <div>Congratulations and Welcome to Prominent Scientific Private Limited!</div>
              <div>For Prominent Scientific Private Limited</div>
              <img src={sign} alt="" className="loi-signature-image" />
              <div>Authorized Signatory</div>
            </div>
            <div className="loi-acceptance">
              <strong>Acceptance</strong>
              <div>I accept the above offer and agree to join Prominent Scientific Private Limited on the date specified.</div>
            </div>
            <div className="loi-sign-line">
              <span>Signature :</span>
              <span>Date :</span>
            </div>
            <LetterFooter />
          </div>

          <div className="loi-page">
            <LetterHeader />
            <div className="loi-annexure-title">Annexure - I</div>
            <div className="loi-annexure-info">
              <p><strong>Name :</strong> {offer.employeeName}</p>
              <p><strong>Designation :</strong> {offer.designation}</p>
              <p><strong>Salary details :</strong></p>
            </div>
            <table className="loi-table">
              <tbody>
                <tr><th>Salary Components</th><th>Per Month ( Rs )</th><th>Per Annum ( Rs )</th></tr>
                <tr><td>Basic Pay</td><td className="loi-amount">{offer.basicPay}</td><td className="loi-amount">{offer.basicPayAnnual}</td></tr>
                <tr><td>House Rent Allowance</td><td className="loi-amount">{offer.hra}</td><td className="loi-amount">{offer.hraAnnual}</td></tr>
                <tr><td>Conveyance Allowance</td><td className="loi-amount">{offer.conveyanceAllowance}</td><td className="loi-amount">{offer.conveyanceAnnual}</td></tr>
                <tr><td>Medical Allowance</td><td className="loi-amount">{offer.medicalAllowance}</td><td className="loi-amount">{offer.medicalAnnual}</td></tr>
                <tr><td>Special Allowance</td><td className="loi-amount">{offer.specialAllowance}</td><td className="loi-amount">{offer.specialAnnual}</td></tr>
                <tr><td>Variable Pay</td><td className="loi-amount">-</td><td className="loi-amount">{offer.variablePay}</td></tr>
                <tr className="loi-total"><td>Gross Salary</td><td className="loi-amount">{offer.grossPay}</td><td className="loi-amount">{offer.annualCtc}</td></tr>
              </tbody>
            </table>
            <div className="loi-bullet">- This compensation is subject to statutory deductions viz. PF (Employee's contribution), Professional tax etc. as per the statutory requirements.</div>
            <div className="loi-annexure-info"><p><strong>Total Compensation details:</strong></p></div>
            <table className="loi-table">
              <tbody>
                <tr><th>Employer's Contribution</th><th>Rs. Monthly Pay</th><th>Rs. Annual Pay</th></tr>
                <tr><td>Employer Pf</td><td className="loi-amount">{offer.employerPf}</td><td className="loi-amount">{offer.employerPfAnnual}</td></tr>
                <tr className="loi-total"><td>Total Contribution</td><td className="loi-amount">{offer.totalContributionMonthly}</td><td className="loi-amount">{offer.totalContributionAnnual}</td></tr>
                <tr><td>Cost to Company: (CTC)</td><td className="loi-amount">{offer.ctcMonthly}</td><td className="loi-amount">{offer.ctcAnnual}</td></tr>
              </tbody>
            </table>
            <table className="loi-table">
              <tbody>
                <tr><th>Deduction:</th><th>Rs. Monthly Pay</th><th>Rs. Annual Pay</th></tr>
                <tr><td>Professional Tax</td><td className="loi-amount">{offer.professionalTax}</td><td className="loi-amount">{offer.professionalTaxAnnual}</td></tr>
                <tr><td>Employee PF</td><td className="loi-amount">{offer.employeePf}</td><td className="loi-amount">{offer.employeePfAnnual}</td></tr>
                <tr><td>Gratuity</td><td className="loi-amount">{offer.gratuity}</td><td className="loi-amount">{offer.gratuityAnnual}</td></tr>
                <tr><td>Insurance</td><td className="loi-amount">{offer.insurance}</td><td className="loi-amount">{offer.insuranceAnnual}</td></tr>
                <tr className="loi-total"><td>Total Deduction</td><td className="loi-amount">{offer.totalDeductionMonthly}</td><td className="loi-amount">{offer.totalDeductionAnnual}</td></tr>
                <tr className="loi-total"><td>Net Take Home</td><td className="loi-amount">{offer.netTakeHomeMonthly}</td><td className="loi-amount">{offer.netTakeHomeAnnual}</td></tr>
              </tbody>
            </table>
            <div className="loi-final-signature">
              <div>Yours Sincerely,</div>
              <img src={sign} alt="" className="loi-signature-image" />
              <strong>P Lokeswari,<br />HR Manager</strong>
            </div>
            <LetterFooter />
          </div>

          <div className="loi-page">
            <LetterHeader />
            <div className="loi-note">
              <strong>Note:</strong> This information is confidential and meant for your reference only. It should not be shared with any of the other employees of Prominent Scientific Pvt Ltd. In case it comes to the attention of the management that this confidentiality is not maintained, it will be viewed seriously by the Management, and this will be treated as a breach of organizational discipline.
            </div>
            <LetterFooter />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default LetterOfIntent;
