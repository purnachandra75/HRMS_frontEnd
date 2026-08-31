import { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import AdminLayout from "./components/AdminLayout";
import "./App.css";
import "./styles/tailwind.css";
import { formatDateDDMMYYYY } from "./utils/dateFormat";

import logo from "./assets/ProminentLogo.png";
import sign from "./assets/Sign.jpg";
import watermark from "./assets/p2.jpg";

const company = {
  name: "PROMINENT SCIENTIFIC PVT LTD",
  website: "www.prominentscientific.co.in",
  email: "info@prominentscientific.co.in",
  phone: "+91 7760152730",
  addressLines: [
    "Address: JQ-Chambers, D.No.4-50/5,",
    "Plot No: 5, 4th Floor, Gachibowli,",
    "Hyderabad, Telangana - 500032",
  ],
  address: "Address: JQ-Chambers, D.No.4-50/5, Plot No: 5, 4th Floor, Gachibowli, Hyderabad, Telangana - 500032",
  hrName: "P Lokeswari",
};

const offerFields = [
  ["employeeName", "Employee Name"],
  ["fatherName", "Father Name"],
  ["houseNumber", "House Number"],
  ["street", "Street"],
  ["mandal", "Mandal"],
  ["village", "Village"],
  ["postOffice", "Post Office"],
  ["district", "District"],
  ["state", "State"],
  ["pincode", "Pincode"],
  ["designation", "Designation"],
  ["annualCtc", "Annual CTC"],
  ["variablePay", "Variable Pay Annual"],
  ["workLocation", "Work Location"],
  ["joiningDate", "Joining Date", "date"],
  ["noticePeriod", "Notice Period"],
  ["grade", "Grade"],
];

const salaryFields = [
  ["fixedAnnualPay", "Fixed Annual Pay (CTC - Variable Pay)"],
  ["basicPay", "Basic Pay Monthly"],
  ["basicPayAnnual", "Basic Pay Annual"],
  ["hra", "HRA Monthly"],
  ["hraAnnual", "HRA Annual"],
  ["conveyanceAllowance", "Conveyance Monthly"],
  ["conveyanceAnnual", "Conveyance Annual"],
  ["employeePf", "Employee PF Monthly"],
  ["employeePfAnnual", "Employee PF Annual"],
  ["employerPf", "Employer PF Monthly"],
  ["employerPfAnnual", "Employer PF Annual"],
  ["medicalAllowance", "Medical Monthly"],
  ["medicalAnnual", "Medical Annual"],
  ["specialAllowance", "Special Monthly"],
  ["specialAnnual", "Special Annual"],
  ["professionalTax", "Professional Tax Monthly"],
  ["professionalTaxAnnual", "Professional Tax Annual"],
  ["insurance", "Insurance Monthly"],
  ["insuranceAnnual", "Insurance Annual"],
  ["gratuity", "Gratuity Monthly"],
  ["gratuityAnnual", "Gratuity Annual"],
  ["grossPay", "Gross Pay Monthly"],
];

const getCurrentDate = () => formatDateDDMMYYYY(new Date());

const buildEmployeeAddressLines = (offerLetter) => [
  `H No: ${offerLetter.houseNumber || "-"}, ${offerLetter.street || "-"}, ${offerLetter.mandal || "-"} mandal,`,
  `VTC: ${offerLetter.village || "-"}, PO: ${offerLetter.postOffice || "-"},`,
  `${offerLetter.district || "-"},`,
  `${offerLetter.state || "-"} - ${offerLetter.pincode || "-"}.`,
];

const parseAmount = (value) => {
  if (typeof value === "number") return value;
  const amount = Number(String(value || "").replace(/,/g, "").trim());
  return Number.isFinite(amount) ? amount : 0;
};

const formatAmount = (value) => {
  const amount = parseAmount(value);

  if (!amount && value !== 0 && value !== "0") return value || "-";

  return amount.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
};

const toAmount = (value) => {
  return parseAmount(value);
};

const round = (value) => String(Math.round(value));
const annualize = (value) => String(Math.round(Number(value) * 12));

const getEmptySalary = () => ({
  fixedAnnualPay: "",
  basicPay: "",
  basicPayAnnual: "",
  hra: "",
  hraAnnual: "",
  conveyanceAllowance: "",
  conveyanceAnnual: "",
  employeePf: "",
  employeePfAnnual: "",
  employerPf: "",
  employerPfAnnual: "",
  medicalAllowance: "",
  medicalAnnual: "",
  specialAllowance: "",
  specialAnnual: "",
  professionalTax: "",
  professionalTaxAnnual: "",
  insurance: "",
  insuranceAnnual: "",
  gratuity: "",
  gratuityAnnual: "",
  grossPay: "",
});

const calculateSalary = (annualCtcValue, variablePayValue) => {
  const annualCtc = parseAmount(annualCtcValue);
  const variablePay = parseAmount(variablePayValue);

  if (!Number.isFinite(annualCtc) || annualCtc <= 0) {
    return getEmptySalary();
  }

  const safeVariablePay = Number.isFinite(variablePay) && variablePay > 0 ? variablePay : 0;
  const fixedAnnualPay = Math.max(annualCtc - safeVariablePay, 0);
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
        toAmount(basicPay) -
        toAmount(hra) -
        toAmount(conveyanceAllowance) -
        toAmount(medicalAllowance),
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
    employeePf,
    employeePfAnnual: annualize(employeePf),
    employerPf,
    employerPfAnnual: annualize(employerPf),
    medicalAllowance,
    medicalAnnual: annualize(medicalAllowance),
    specialAllowance,
    specialAnnual: annualize(specialAllowance),
    professionalTax,
    professionalTaxAnnual: annualize(professionalTax),
    insurance,
    insuranceAnnual: annualize(insurance),
    gratuity,
    gratuityAnnual: annualize(gratuity),
    grossPay: round(fixedMonthlyPay),
  };
};

function OfferHeader() {
  return (
    <div className="offer-header">
      <table width="100%">
        <tbody>
          <tr>
            <td width="20%" valign="top">
              <img src={logo} className="offer-logo" alt="" />
            </td>
            <td width="80%" valign="top">
              <div className="offer-company-info">
                <h4>{company.name}</h4>
                {company.addressLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function OfferFooter() {
  return (
    <div className="offer-footer">
      <hr />
      <div>Website: {company.website}</div>
      <div>Email: {company.email} Tel: {company.phone}</div>
    </div>
  );
}

function OfferLetterForm({ userName, onLogout }) {
  const pdfRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [offerLetter, setOfferLetter] = useState({
    employeeName: "",
    fatherName: "",
    houseNumber: "",
    street: "",
    mandal: "",
    village: "",
    postOffice: "",
    district: "",
    state: "",
    pincode: "",
    designation: "",
    joiningDate: "",
    annualCtc: "",
    noticePeriod: "",
    workLocation: "",
    grade: "",
    fixedAnnualPay: "",
    basicPay: "",
    basicPayAnnual: "",
    hra: "",
    hraAnnual: "",
    conveyanceAllowance: "",
    conveyanceAnnual: "",
    employeePf: "",
    employeePfAnnual: "",
    employerPf: "",
    employerPfAnnual: "",
    medicalAllowance: "",
    medicalAnnual: "",
    specialAllowance: "",
    specialAnnual: "",
    professionalTax: "",
    professionalTaxAnnual: "",
    insurance: "",
    insuranceAnnual: "",
    variablePay: "",
    gratuity: "",
    gratuityAnnual: "",
    grossPay: "",
  });

  const updateField = (key) => (event) => {
    const value = event.target.value;

    setOfferLetter((current) => {
      const next = {
        ...current,
        [key]: value,
      };

      return {
        ...next,
        ...(["annualCtc", "variablePay"].includes(key)
          ? calculateSalary(next.annualCtc, next.variablePay)
          : {}),
      };
    });
  };

  const totalContributionMonthly = toAmount(offerLetter.employerPf);
  const totalContributionAnnual = toAmount(offerLetter.employerPfAnnual);
  const ctcMonthly = Math.max(toAmount(offerLetter.grossPay) - totalContributionMonthly, 0);
  const ctcAnnual = ctcMonthly * 12;
  const totalDeductionMonthly =
    toAmount(offerLetter.professionalTax) +
    toAmount(offerLetter.employeePf) +
    toAmount(offerLetter.gratuity) +
    toAmount(offerLetter.insurance);
  const totalDeductionAnnual =
    toAmount(offerLetter.professionalTaxAnnual) +
    toAmount(offerLetter.employeePfAnnual) +
    toAmount(offerLetter.gratuityAnnual) +
    toAmount(offerLetter.insuranceAnnual);
  const netTakeHomeMonthly = Math.max(ctcMonthly - totalDeductionMonthly, 0);
  const netTakeHomeAnnual = Math.max(ctcAnnual - totalDeductionAnnual, 0);

  const offer = {
    ...offerLetter,
    employeeName: offerLetter.employeeName || "-",
    fatherName: offerLetter.fatherName || "-",
    employeeAddressLines: buildEmployeeAddressLines(offerLetter),
    designation: offerLetter.designation || "-",
    joiningDate: offerLetter.joiningDate ? formatDateDDMMYYYY(offerLetter.joiningDate) : "-",
    annualCtc: formatAmount(offerLetter.annualCtc),
    noticePeriod: offerLetter.noticePeriod || "30 days",
    workLocation: offerLetter.workLocation || "Hyderabad",
    generatedDate: getCurrentDate(),
    grade: offerLetter.grade || "-",
    fixedAnnualPay: formatAmount(offerLetter.fixedAnnualPay),
    basicPay: formatAmount(offerLetter.basicPay),
    basicPayAnnual: formatAmount(offerLetter.basicPayAnnual),
    hra: formatAmount(offerLetter.hra),
    hraAnnual: formatAmount(offerLetter.hraAnnual),
    conveyanceAllowance: formatAmount(offerLetter.conveyanceAllowance),
    conveyanceAnnual: formatAmount(offerLetter.conveyanceAnnual),
    employeePf: formatAmount(offerLetter.employeePf),
    employeePfAnnual: formatAmount(offerLetter.employeePfAnnual),
    employerPf: formatAmount(offerLetter.employerPf),
    employerPfAnnual: formatAmount(offerLetter.employerPfAnnual),
    medicalAllowance: formatAmount(offerLetter.medicalAllowance),
    medicalAnnual: formatAmount(offerLetter.medicalAnnual),
    specialAllowance: formatAmount(offerLetter.specialAllowance),
    specialAnnual: formatAmount(offerLetter.specialAnnual),
    professionalTax: formatAmount(offerLetter.professionalTax),
    professionalTaxAnnual: formatAmount(offerLetter.professionalTaxAnnual),
    insurance: formatAmount(offerLetter.insurance),
    insuranceAnnual: formatAmount(offerLetter.insuranceAnnual),
    variablePay: formatAmount(offerLetter.variablePay),
    gratuity: formatAmount(offerLetter.gratuity),
    gratuityAnnual: formatAmount(offerLetter.gratuityAnnual),
    grossPay: formatAmount(offerLetter.grossPay),
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
    if (!offerLetter.employeeName.trim()) {
      alert("Please enter employee name");
      return;
    }

    try {
      setIsGenerating(true);
      const pages = pdfRef.current.querySelectorAll(".offer-page");
      const pdf = new jsPDF("p", "mm", "a4");

      for (let index = 0; index < pages.length; index += 1) {
        const canvas = await html2canvas(pages[index], {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
        });
        const imgData = canvas.toDataURL("image/png");

        if (index > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
      }

      pdf.save(`OfferLetter_${offerLetter.employeeName.replaceAll(" ", "_")}.pdf`);
      alert("Offer letter downloaded successfully!");
    } catch (err) {
      console.error("PDF Generation Error:", err);
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
      title="Generate Offer Letter"
      subtitle="Enter employee details and salary to generate an Offer Letter PDF."
    >
      <div className="letter-generator-page offer-letter-page">
      <style>{`
        .offer-pdf-root {
          position: fixed;
          top: -9999px;
          left: -9999px;
          width: 210mm;
          background: #ffffff;
          color: #000000;
          font-family: Arial, Helvetica, sans-serif;
        }

        .offer-page {
          width: 210mm;
          min-height: 297mm;
          padding: 15mm 21mm 14mm;
          position: relative;
          display: flex;
          flex-direction: column;
          page-break-after: always;
          background-color: #ffffff;
          background-image: url(${watermark});
          background-repeat: no-repeat;
          background-position: center center;
          background-size: 300px;
          font-size: 14px;
          line-height: 1.6;
          overflow: hidden;
        }

        .offer-header {
          padding-bottom: 5px;
        }

        .offer-logo {
          width: 90px;
          height: auto;
        }

        .offer-company-info {
          text-align: right;
          color: #1f75a8;
          font-size: 12px;
          line-height: 1.3;
        }

        .offer-company-info h4 {
          color: #1f75a8;
          margin: 0 0 7px;
          font-size: 14px;
          font-weight: bold;
        }

        .offer-title,
        .offer-page-title {
          text-align: center;
          font-weight: bold;
          text-decoration: underline;
        }

        .offer-title {
          margin: 12px 0 18px;
          font-size: 18px;
        }

        .offer-page-title {
          font-size: 18px;
          margin: 12px 0 18px;
        }

        .offer-date-block {
          text-align: right;
          font-size: 14px;
          font-weight: 800;
         
        }

        .offer-greeting {
          margin: 15px 0;
          font-size: 14px;
        }

        .offer-content,
        .offer-terms {
          text-align: justify;
          margin: 10px 0 15px;
          font-size: 14px;
          line-height: 1.6;
        }

        .offer-details {
          margin: 20px 0;
          font-size: 14px;
          line-height: 1.6;
        }

        .offer-detail-row {
          margin-bottom: 10px;
          
          font-weight: 700;
        }

        .offer-label {
          display: inline-block;
          width: 180px;
          font-weight: 800;
          
        }

        .offer-colon {
          display: inline-block;
          width: 20px;
          
          font-weight: 800;
        }

        .offer-value {
          
          font-weight: 600;
        }

        .offer-value-emphasis {
         
          font-weight: 800;
        }

        .offer-signature {
          margin-top: 15px;
          text-align: right;
          font-size: 14px;
        }

        .offer-signature-image {
          width: 90px;
          height: auto;
        }

        .offer-section-title {
          font-weight: bold;
          font-size: 14px;
          margin: 18px 0 12px;
        }

        .offer-employee-table,
        .offer-salary-table {
          border-collapse: collapse;
          width: 100%;
        }

        .offer-employee-table td,
        .offer-salary-table td,
        .offer-salary-table th {
          border: 1px solid #000;
          padding: 3px;
          font-size: 13px;
        }

        .offer-salary-table th {
          background: #f2f2f2;
          text-align: center;
        }

        .offer-salary-page {
          padding: 15mm 21mm 14mm;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 14px;
          line-height: 1.25;
        }

        .offer-salary-page .offer-section-title {
          display: inline-block;
          margin: 18px 0 12px;
          border-bottom: 2px solid #000;
          font-size: 15px;
          font-weight: 700;
        }

        .offer-annexure-title {
          margin: 16px 0 14px;
          text-align: center;
          font-size: 15px;
          font-weight: bold;
        }

        .offer-salary-intro {
          margin: 16px 0 18px;
          font-size: 15px;
        }

        .offer-salary-page .offer-employee-table td,
        .offer-salary-page .offer-salary-table td,
        .offer-salary-page .offer-salary-table th {
          border: 1.2px solid #000;
          padding: 4px 6px;
          font-size: 14px;
          line-height: 1.15;
        }

        .offer-salary-page .offer-salary-table th {
          font-size: 14px;
          font-weight: bold;
          background: #ffffff;
          text-align: left;
        }

        .offer-employee-lines {
          margin-bottom: 14px;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.25;
        }

        .offer-employee-line-label {
          display: inline-block;
          width: 145px;
        }

        .offer-employee-line-colon {
          display: inline-block;
          width: 14px;
        }

        .offer-annexure-employee-table {
          width: 78%;
          margin: 0 auto 24px;
        }

        .offer-salary-table {
          width: 88%;
          margin: 0 auto 12px;
        }

        .offer-total-row td {
          font-weight: bold;
        }

        .offer-amount {
          text-align: right;
        }

        .offer-salary-employee-summary {
          margin: 0 0 18px;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.35;
        }

        .offer-salary-employee-summary span {
          display: inline-block;
          width: 108px;
        }

        .offer-salary-table .offer-table-title {
          font-weight: 700;
        }

        .offer-salary-note {
          width: 88%;
          margin: 22px auto 0;
          font-size: 13px;
          line-height: 1.35;
        }

        .offer-salary-note ul {
          margin: 0;
          padding-left: 20px;
        }

        .offer-footer {
          margin-top: auto;
          color: #5aa9d6;
          text-align: center;
          font-size: 10px;
          padding-top: 10px;
          line-height: 1.35;
        }

        .offer-footer hr,
        .offer-footer-line {
          border: 0;
          border-top: 1px solid #5aa9d6;
          margin-bottom: 8px;
        }

        .offer-section {
          margin-bottom: 18px;
        }

        .offer-section-heading {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 10px;
        }

        .offer-page ul {
          margin: 0 0 10px 30px;
          padding-left: 20px;
        }

        .offer-page li {
          margin-bottom: 8px;
          font-size: 14px;
          line-height: 1.5;
          text-align: justify;
        }

        .offer-content-small {
          position: relative;
          z-index: 2;
          font-size: 14px;
          line-height: 1.6;
        }

        .offer-content-terms {
          font-size: 14px;
          line-height: 1.6;
        }

        .offer-content-terms h3 {
          margin-top: 18px;
          margin-bottom: 10px;
          font-size: 14px;
          font-weight: bold;
        }

        .offer-note-section {
          margin-top: 20px;
          font-size: 12px;
          line-height: 1.6;
        }

        .offer-note-title {
          font-weight: bold;
          margin-bottom: 10px;
        }

        .offer-declaration {
          margin-top: 40px;
          font-size: 12px;
        }

        .offer-line {
          display: inline-block;
          width: 120px;
          border-bottom: 1px solid #000;
          margin-left: 5px;
        }
      `}</style>

      <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-client">Offer Letter Generator</p>
          <h1 className="text-lg font-semibold text-foreground">Generate Offer Letter</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter Annual CTC and Variable Pay. The salary breakup below recalculates automatically from the fixed annual pay.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            generatePDF();
          }}
          className="flex flex-col gap-4"
        >
          <div className="text-sm font-semibold text-foreground">Employee Details</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offerFields.map(([key, label, type = "text"]) => (
              <div className="flex flex-col gap-1.5" key={key}>
                <label className="text-sm font-medium text-foreground">{label}</label>
                <input
                  type={type}
                  value={offerLetter[key]}
                  onChange={updateField(key)}
                  placeholder={label}
                  className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </div>
            ))}
          </div>

          <div className="mt-2 text-sm font-semibold text-foreground">Salary Breakup</div>
          <div className="text-xs text-muted-foreground">Fixed Annual Pay = Annual CTC - Variable Pay</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {salaryFields.map(([key, label]) => (
              <div className="flex flex-col gap-1.5" key={key}>
                <label className="text-sm font-medium text-foreground">{label}</label>
                <input
                  value={offerLetter[key]}
                  placeholder={label}
                  readOnly
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
            {isGenerating ? "Generating..." : "Generate Offer Letter"}
          </button>
        </form>
      </section>

      <div ref={pdfRef} className="offer-pdf-root">
              <div className="offer-page">
                <OfferHeader />
                <div className="offer-title">LETTER OF EMPLOYMENT</div>
                <table width="100%">
                  <tbody>
                    <tr>
                      <td width="60%" valign="top">
                        <b>{offer.employeeName}</b>
                        <br />
                        S/O {offer.fatherName}
                        <br />
                        {offer.employeeAddressLines.map((line) => (
                          <span key={line}>
                            {line}
                            <br />
                          </span>
                        ))}
                      </td>
                      <td width="40%" valign="top">
                        <div className="offer-date-block">
                          <div><b>Date :</b> {offer.generatedDate}</div>
                          
                          <div className="offer-value-emphasis">{offer.workLocation}</div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="offer-greeting">Dear {offer.employeeName},</div>
                <div className="offer-content">
                  Congratulations! Subsequent to the discussions we had with you recently, it is a sincere
                  pleasure to make you an offer in our organization. Please find the details below.
                </div>
                <div className="offer-details">
                  <div className="offer-detail-row"><span className="offer-label">Position</span><span className="offer-colon">:</span><span className="offer-value">{offer.designation}</span></div>
                  <div className="offer-detail-row"><span className="offer-label">Date of Joining</span><span className="offer-colon">:</span><span className="offer-value offer-value-emphasis">{offer.joiningDate}</span></div>
                  <div className="offer-detail-row"><span className="offer-label">Gross Salary</span><span className="offer-colon">:</span><span className="offer-value">{offer.annualCtc}</span></div>
                  <div className="offer-detail-row"><span className="offer-label">Notice Period</span><span className="offer-colon">:</span><span className="offer-value">{offer.noticePeriod}</span></div>
                  <div className="offer-detail-row">
                    <span className="offer-label">Place of Work</span>
                    <span className="offer-colon">:</span>
                    Your initial place will be in <span className="offer-value offer-value-emphasis">{offer.workLocation}</span>. However, your services are transferable
                    and you may be assigned to any location in India or abroad where the company or any one
                    of its associate or customers conducts the business.
                  </div>
                </div>
                <div className="offer-terms">
                  You are required to sign a copy of this letter confirming the acceptance of the terms of offer
                  and policies existing and modified from time to time. If this does not reach us within 5 days,
                  then this offer of employment is liable to be invalid.
                  <br /><br />
                  Please find the details of the terms and conditions of this offer attached. Please note that
                  this is intended to be kept strictly and confidential.
                </div>
                <div className="offer-signature">
                 <b>Yours Sincerely,</b>
                  <br /><br />
                  <img src={sign} className="offer-signature-image" alt="" />
                  <br />
                  <b>HR Manager</b>
                 <b><div>{company.hrName}</div></b> 
                  
                </div>
                <OfferFooter />
              </div>

              <div className="offer-page offer-salary-page">
                <OfferHeader />
                <div className="offer-section-title">Details of Employee</div>
                <div className="offer-salary-employee-summary">
                  <div><span>Name</span>: {offer.employeeName}</div>
                  <div><span>Designation</span>: {offer.designation}</div>
                </div>
                <div className="offer-section-title">Details of Salary</div>
                <div className="offer-salary-intro">
                  Your Compensation and Benefits structure is given below for your reference
                </div>
                <div className="offer-annexure-title">Annexure: Compensation Break-up Detail</div>
                <table className="offer-employee-table offer-annexure-employee-table">
                  <tbody>
                    <tr><td width="30%"><b>Name</b></td><td>{offer.employeeName}</td></tr>
                    <tr><td><b>Designation</b></td><td>{offer.designation}</td></tr>
                    <tr><td><b>Grade</b></td><td>{offer.grade}</td></tr>
                  </tbody>
                </table>
                <table className="offer-salary-table">
                  <tbody>
                    <tr><th width="60%" className="offer-table-title">Pay Heads</th><th width="20%">Rs. Monthly Pay</th><th width="20%">Rs. Annual Pay</th></tr>
                    <tr><td>Basic Pay</td><td className="offer-amount">{offer.basicPay}</td><td className="offer-amount">{offer.basicPayAnnual}</td></tr>
                    <tr><td>Home Rent Allowance</td><td className="offer-amount">{offer.hra}</td><td className="offer-amount">{offer.hraAnnual}</td></tr>
                    <tr><td>Conveyance Allowance</td><td className="offer-amount">{offer.conveyanceAllowance}</td><td className="offer-amount">{offer.conveyanceAnnual}</td></tr>
                    <tr><td>Medical Allowance</td><td className="offer-amount">{offer.medicalAllowance}</td><td className="offer-amount">{offer.medicalAnnual}</td></tr>
                    <tr><td>Special Allowance</td><td className="offer-amount">{offer.specialAllowance}</td><td className="offer-amount">{offer.specialAnnual}</td></tr>
                    <tr><td>Variable Pay</td><td className="offer-amount">-</td><td className="offer-amount">{offer.variablePay}</td></tr>
                    <tr className="offer-total-row"><td>Gross Salary</td><td className="offer-amount">{offer.grossPay}</td><td className="offer-amount">{offer.annualCtc}</td></tr>
                  </tbody>
                </table>

                <table className="offer-salary-table">
                  <tbody>
                    <tr><th width="60%" className="offer-table-title">Employer's Contribution</th><th width="20%">Rs. Monthly Pay</th><th width="20%">Rs. Annual Pay</th></tr>
                    <tr><td>Employer Pf</td><td className="offer-amount">{offer.employerPf}</td><td className="offer-amount">{offer.employerPfAnnual}</td></tr>
                    <tr className="offer-total-row"><td>Total Contribution</td><td className="offer-amount">{offer.totalContributionMonthly}</td><td className="offer-amount">{offer.totalContributionAnnual}</td></tr>
                    <tr><td>Cost to Company: (CTC)</td><td className="offer-amount">{offer.ctcMonthly}</td><td className="offer-amount">{offer.ctcAnnual}</td></tr>
                  </tbody>
                </table>

                <table className="offer-salary-table">
                  <tbody>
                    <tr><th width="60%" className="offer-table-title">Deduction:</th><th width="20%">Rs. Monthly Pay</th><th width="20%">Rs. Annual Pay</th></tr>
                    <tr><td>Professional Tax</td><td className="offer-amount">{offer.professionalTax}</td><td className="offer-amount">{offer.professionalTaxAnnual}</td></tr>
                    <tr><td>Employee PF</td><td className="offer-amount">{offer.employeePf}</td><td className="offer-amount">{offer.employeePfAnnual}</td></tr>
                    <tr><td>Gratuity</td><td className="offer-amount">{offer.gratuity}</td><td className="offer-amount">{offer.gratuityAnnual}</td></tr>
                    <tr><td>Insurance</td><td className="offer-amount">{offer.insurance}</td><td className="offer-amount">{offer.insuranceAnnual}</td></tr>
                    <tr className="offer-total-row"><td>Total Deduction</td><td className="offer-amount">{offer.totalDeductionMonthly}</td><td className="offer-amount">{offer.totalDeductionAnnual}</td></tr>
                    <tr className="offer-total-row"><td>Net Take Home</td><td className="offer-amount">{offer.netTakeHomeMonthly}</td><td className="offer-amount">{offer.netTakeHomeAnnual}</td></tr>
                  </tbody>
                </table>

                <div className="offer-salary-note">
                  <ul>
                    <li>Notional sum indicating contribution of 5.31% of your basic towards provision of Gratuity. Employees will be eligible for payment of gratuity as per the Prominent Policy for the same.</li>
                  </ul>
                </div>
                <OfferFooter />
              </div>
              

              <div className="offer-page">
                <OfferHeader />
                <div className="offer-salary-note">
                  <ul>
                    <li>Please note that your compensation is personal to you and you are requested not to share details of the same with others.</li>
                     <li>Please note that the above stack is applicable for all Indian passport holders. In case you are a non-Indian passport holder, request you to immediately declare the same to the hiring team. The hiring team will accordingly issue the offer letter guided by the International Worker rules.</li>
                  </ul>
                  
                </div>
                <div className="offer-page-title">TERMS AND CONDITIONS</div>
                <div className="offer-content-small">
                  <div className="offer-section"><div className="offer-section-heading">1. WORKING HOURS</div><ul><li>The Company works 7 days a week, twenty-four hours a day.</li><li>You will be expected to attend office and work during the hours assigned to you by your superiors.</li><li>This may include night shifts.</li><li>You will be required to work 5 days a week, and your weekly off may not necessarily be on Saturday and Sunday.</li></ul></div>
                  <div className="offer-section"><div className="offer-section-heading">2. TERMS OF EMPLOYMENT</div><ul><li>Your employment will begin with a probation period of 6 months starting from your date of joining.</li><li>During the probation period, your performance and suitability for the role will be assessed.</li><li>Upon successful completion of the probation period, your employment will be confirmed in writing.</li><li>The Company reserves the right to extend the probation period if performance expectations are not met.</li></ul></div>
                  <div className="offer-section"><div className="offer-section-heading">3. CONFIDENTIALITY</div><ul><li>You will be required to execute a confidentiality agreement at the time of joining regarding your employment and the business matters of the company.</li><li>Any breach of confidentiality, including unauthorized sharing of proprietary documents, client information, trade secrets, or intellectual property, will be subject to strict legal and disciplinary action, including immediate termination of employment.</li><li>Employees must return all Company-owned confidential materials, including electronic devices, reports, emails, and project files, before exiting the organization.</li></ul></div>
                  <div className="offer-section"><div className="offer-section-heading">4. AUTHENTICITY</div><ul><li>This offer is subject to the authenticity of the information and documentation provided by you.</li><li>If any information is found to be false or misleading, at any point, the Company reserves the right to terminate employment immediately without any notice or severance benefits.</li></ul></div>
                </div>
                <OfferFooter />
              </div>

              <div className="offer-page">
                <OfferHeader />
                <div className="offer-section"><div className="offer-section-heading">5. DOCUMENTS REQUIRED</div><ul><li>Our offer is subject to the completion of separation formalities at your previous employer.</li><li>At the time of joining, you are required to produce the following documents (Photocopies), as applicable.<ul><li>Copy of Passport</li><li>Proof of Date of Birth Certificate</li><li>All Educational Certificates</li><li>Recent 4 Passport-size photographs</li></ul></li><li>The original documents will be returned to you on the same day after verification.</li></ul></div>
                <div className="offer-section"><div className="offer-section-heading">6. REMUNERATION</div><ul><li>Upon successful completion of the training, your fixed salary as per the offer letter will be applicable.</li><li>Salary will be paid monthly, and all deductions, including taxes, PF, gratuity and statutory contributions, will be applied as per applicable laws.</li></ul></div>
                <div className="offer-section"><div className="offer-section-heading">7. FLEXIBLE BENEFITS</div><ul><li>Under Flexible Benefits, you will be eligible to claim actual expenses under Medical Expenses and Leave Travel Assistance.</li><li>Any balance amount after reimbursement under any of the mentioned benefits will be paid as Flexible Benefit Allowance.</li><li>Employees may opt for additional benefit plans based on their preference, subject to approval from the Company and budget considerations.</li></ul></div>
                <div className="offer-section"><div className="offer-section-heading">8. HEALTH INSURANCE</div><ul><li>You and your dependents will be covered under the Company's Medical Insurance Policy.</li><li>The Company facilitates annual health check-ups and wellness programs to promote Employee well-being.</li></ul></div>
                <div className="offer-section"><div className="offer-section-heading">9. PERSONAL ACCIDENT INSURANCE</div><ul><li>You will be covered under the Group Personal Accident Insurance Plan up to a maximum of Rs. 1 Lakh (Rupees One Lakh Only).</li><li>Coverage amounts and specific policy terms will be shared upon joining, and Employees may opt to increase their coverage by paying additional premiums.</li></ul></div>
                <OfferFooter />
              </div>

              <div className="offer-page">
                <OfferHeader />
                <div className="offer-content-terms">
                  <ul><li>In the event of an accident, Employees must notify the HR department immediately to initiate the claims process.</li></ul>
                  <h3>10. LEAVE POLICY</h3>
                  <ul><li>After Probation Period, any absence during your probation period will be unpaid. You are eligible for Privilege Leave of 20 Days and Casual Leave of 12 Days per calendar year on a pro-rata basis.</li><li>You are also entitled to all the Public Holidays notified by the Company.</li><li>Leave should be taken at times mutually agreed between you and the Head of the Department.</li><li>Employees joining after January 1st will have leave entitlement allocated on a pro-rata basis.</li></ul>
                  <h3>11. OTHER BENEFITS</h3>
                  <ul><li>Employees are eligible for any benefits given by the company.</li></ul>
                  <h3>12. PERFORMANCE BONUS</h3>
                  <ul><li>Employees will be eligible for an annual performance-linked bonus.</li><li>Bonus amounts are determined by:<ul><li>Individual contributions to business success</li><li>Client feedback and project completion rates</li><li>Innovation and leadership demonstrated within the team</li></ul></li><li>Employees failing to meet performance expectations may receive a reduced bonus.</li></ul>
                  <h3>13. REPORTING DATE</h3>
                  <ul><li>If the above terms and conditions are acceptable to you, you are required to join duty on or before <strong>{offer.joiningDate}</strong>.</li><li>You are also requested to sign and return the copy of the offer letter as a token of acceptance.</li><li>Any delay in joining due to unforeseen circumstances must be communicated in advance and approved by the hiring manager.</li></ul>
                  <h3>14. ON SEPARATION</h3>
                  <ul><li>At the time of leaving the organization, you must immediately hand over all correspondence, specifications, formulae, books, documents, cost data, market data, literature, drawings, effects, or records belonging to the organization.</li><li>You shall not make or retain any copies of these items.</li></ul>
                </div>
                <OfferFooter />
              </div>

              <div className="offer-page">
                <OfferHeader />
                <div className="offer-content-terms">
                  <div className="offer-section"><div className="offer-section-heading">15. NOTICE PERIOD</div><ul><li>Your employment is terminable by either party with a notice period. The notice period varies according to your status in employment as follows:<ul><li>During Probation Period: 7 days</li><li>After Confirmation: 30 days</li></ul></li><li>You are responsible for knowledge transfer of all duties you are handling to a person identified by management before you are relieved.</li><li>The organization has the right to terminate your services without reason on the grounds of indiscipline, default, negligence, or breach of terms.</li><li>The company may relieve an employee before the expiry of the notice period by compensating for the remaining period.</li><li>If termination is due to ethical/moral grounds, the company is not bound to provide compensation or a reason for termination.</li></ul></div>
                  <div className="offer-section"><div className="offer-section-heading">16. PAST RECORD</div><ul><li>All details furnished by you in your CV/documents are liable to be verified at any time during your employment.</li><li>If a mismatch of facts is found, you are liable for termination from service at any time without notice.</li><li>The company may choose to verify all your credentials as deemed necessary by the organization and the client.</li></ul></div>
                  <div className="offer-section"><div className="offer-section-heading">17. CONFIDENTIAL INFORMATION</div><ul><li>You shall not, at any time, without the consent of the functional head, disclose, divulge, or make public any information regarding the company's affairs or research.</li></ul></div>
                  <div className="offer-section"><div className="offer-section-heading">18. VARIABLE PAY POLICY SUMMARY AND COMPUTATION</div><ul><li>Variable pay is a variable component in your salary stack which would be paid out on a quarterly basis.</li><li>You will be covered under a variable pay program, which would entitle you to receive variable pay of {offer.variablePay} per annum, subject to individual group/function and organization level achievement parameters.</li></ul></div>
                </div>
                <OfferFooter />
              </div>

              <div className="offer-page">
                <OfferHeader />
                <div className="offer-note-section">
                  <ul><li>The Variable pay program may be changed, altered, or modified in part or full from time to time, at the sole discretion of the management.</li></ul>
                  <div className="offer-note-title">NOTE:</div>
                  <ul><li>This offer is subject to the authenticity of the information and documentation provided by you.</li><li>If the information is found to be false or untrue, the company reserves the right to immediately terminate your services.</li></ul>
                </div>
                <div className="offer-declaration">
                  <strong>Declaration:</strong> I, <strong>{offer.employeeName}</strong> acknowledge and agree to abide by these terms and conditions.
                </div>
                <div className="offer-note-section"><strong>Signature:</strong><span className="offer-line"></span></div>
                <div className="offer-note-section"><strong>Date:</strong><span className="offer-line"></span></div>
                <OfferFooter />
              </div>
      </div>
      </div>
    </AdminLayout>
  );
}

export default OfferLetterForm;
