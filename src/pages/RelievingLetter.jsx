import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import AdminLayout from "../components/AdminLayout";

import defaultLogo from "../assets/ProminentLogo.png";
import defaultSign from "../assets/Sign.jpg";
import watermark from "../assets/p2.jpg";
import { formatDateDDMMYYYY } from "../utils/dateFormat";
import { apiFetch } from "../utils/apiClient";
import {
  getLetterTemplates,
  fetchLetterTemplateLogoObjectUrl,
  fetchLetterTemplateSignatureObjectUrl,
} from "../services/letterTemplateService";
import { generatePagedPdf, mergeTemplateBody } from "../utils/generatePagedPdf";
import "../styles/tailwind.css";

function RelievingLetter({ userName, onLogout }) {
  const pdfRef = useRef();
  const [employeeId, setEmployeeId] = useState("");
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [manualRelievingDate, setManualRelievingDate] = useState("");
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateLogoUrl, setTemplateLogoUrl] = useState(null);
  const [templateSignatureUrl, setTemplateSignatureUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadTemplates = async () => {
      setTemplatesLoading(true);
      try {
        const data = await getLetterTemplates('RELIEVING');
        if (cancelled) return;
        setTemplates(data);
        const preferred = data.find((t) => t.isDefault) || data[0] || null;
        setSelectedTemplateId(preferred ? preferred.id : '');
      } catch (err) {
        console.error('Failed to load relieving letter templates:', err);
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    };

    loadTemplates();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let logoUrl = null;
    let signatureUrl = null;

    const loadImages = async () => {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (!template) {
        setTemplateLogoUrl(null);
        setTemplateSignatureUrl(null);
        return;
      }
      if (template.hasLogo) logoUrl = await fetchLetterTemplateLogoObjectUrl(template.id);
      if (template.hasSignature) signatureUrl = await fetchLetterTemplateSignatureObjectUrl(template.id);
      if (!cancelled) {
        setTemplateLogoUrl(logoUrl);
        setTemplateSignatureUrl(signatureUrl);
      }
    };

    loadImages();
    return () => {
      cancelled = true;
      if (logoUrl) window.URL.revokeObjectURL(logoUrl);
      if (signatureUrl) window.URL.revokeObjectURL(signatureUrl);
    };
  }, [templates, selectedTemplateId]);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || null;
  const company = {
    name: selectedTemplate?.companyName || '',
    website: selectedTemplate?.website || '',
    email: selectedTemplate?.email || '',
    phone: selectedTemplate?.phone || '',
    addressLines: selectedTemplate
      ? [selectedTemplate.addressLine1, selectedTemplate.addressLine2, selectedTemplate.addressLine3].filter(Boolean)
      : [],
    hrName: selectedTemplate?.hrName || '',
  };
  const logoSrc = templateLogoUrl || defaultLogo;
  const signSrc = templateSignatureUrl || defaultSign;

  const customBodyRef = useRef();
  const [customFieldValues, setCustomFieldValues] = useState({});
  const hasCustomBody = Boolean(selectedTemplate?.fields?.length);

  const updateCustomField = (fieldKey) => (event) => {
    const value = event.target.value;
    setCustomFieldValues((current) => ({ ...current, [fieldKey]: value }));
  };

  const normalizeEmployee = (data) => ({
    employeeId: data.employeeId ?? data.empId ?? data.id ?? employeeId.trim(),
    employeeName: data.employeeName || data.employeeFullName || [data.firstName, data.lastName].filter(Boolean).join(" ") || "N/A",
    designation: data.designation || data.jobDetails?.designation || "N/A",
    joiningDate: formatDateDDMMYYYY(data.joiningDate || data.dateOfJoining || data.jobDetails?.dateOfJoining || "N/A"),
    currentDate: formatDateDDMMYYYY(data.currentDate || new Date()),
  });

  const searchEmployee = async () => {
    if (!employeeId.trim()) {
      setError("Please enter Employee ID");
      setEmployee(null);
      return;
    }

    const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    const url = `${apiBase}/api/employee/${employeeId.trim()}`;
    setIsSearching(true);
    setError("");
    setEmployee(null);
    setManualRelievingDate("");

    try {
      const response = await apiFetch(url);
      if (!response.ok) throw new Error("Employee not found");
      const data = await response.json();
      setEmployee(normalizeEmployee(data));
    } catch (err) {
      console.error("Relieving letter employee lookup failed:", err);
      setError("Employee not found");
    } finally {
      setIsSearching(false);
    }
  };

  const generatePDF = async () => {
    if (!selectedTemplate) {
      alert("Please select a letter template first");
      return;
    }
    if (!employee || !employeeId.trim()) {
      alert("Please search and select an employee first");
      return;
    }
    if (!manualRelievingDate) {
      alert("Please enter a relieving date to continue");
      return;
    }

    if (hasCustomBody) {
      try {
        await generatePagedPdf(customBodyRef.current, `RelievingLetter_${employee.employeeId}.pdf`);
        alert("PDF downloaded successfully!");
      } catch (err) {
        console.error("PDF Generation Error:", err);
        alert("Error generating PDF: " + err.message);
      }
      return;
    }

    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`RelievingLetter_${employee.employeeId}.pdf`);
      alert("PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("Error generating PDF: " + err.message);
    }
  };

  const getCurrentDate = () => {
    if (employee?.currentDate) return employee.currentDate;
    return formatDateDDMMYYYY(new Date());
  };

  const letterContent = (
    <div className="flex flex-col gap-5">
      <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-client">Essentials</p>
          <h1 className="text-lg font-semibold text-foreground">Generate Relieving Letter</h1>
          <p className="mt-1 text-sm text-muted-foreground">Search by employee ID, verify the employee details, then generate the PDF.</p>
        </div>

        {!templatesLoading && templates.length === 0 ? (
          <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
            No Relieving Letter templates yet.{' '}
            <Link to="/admin/essentials/templates" className="font-medium underline">
              Create one in Essentials → Letter Templates
            </Link>{' '}
            before generating a letter.
          </div>
        ) : (
        <>
        {templates.length > 1 && (
          <div className="mb-3 flex flex-col gap-1.5 sm:w-72">
            <label className="text-sm font-medium text-foreground">Template</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(Number(e.target.value))}
              className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}
        {hasCustomBody && (
          <div className="mb-3 flex flex-col gap-3 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] p-3">
            <div className="text-sm font-semibold text-foreground">
              Fill in details for "{selectedTemplate.name}"
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {selectedTemplate.fields.map((f) => (
                <div className="flex flex-col gap-1.5" key={f.fieldKey}>
                  <label className="text-sm font-medium text-foreground">{f.label}</label>
                  <input
                    type={f.fieldType === 'DATE' ? 'date' : f.fieldType === 'CURRENCY' ? 'number' : 'text'}
                    value={customFieldValues[f.fieldKey] || ''}
                    onChange={updateCustomField(f.fieldKey)}
                    placeholder={f.label}
                    className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Enter Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="h-9 max-w-xs flex-1 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
          />
          <button
            type="button"
            onClick={searchEmployee}
            disabled={isSearching}
            className="h-9 rounded-lg bg-client px-4 text-sm font-medium text-client-foreground hover:bg-client/90 disabled:opacity-60"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>
        <div className="mt-4">
          {error && (
            <p className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</p>
          )}
          {employee && (
            <>
              <div className="rounded-xl border border-border/80 bg-background p-4">
                <h3 className="text-sm font-semibold text-foreground">Employee Found</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Name', value: employee.employeeName },
                    { label: 'Employee ID', value: employee.employeeId },
                    { label: 'Designation', value: employee.designation },
                    { label: 'Joining Date', value: employee.joiningDate },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{item.label}</div>
                      <div className="mt-0.5 text-sm text-foreground">{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Relieving Date</label>
                  <input
                    type="date"
                    value={manualRelievingDate}
                    onChange={(e) => setManualRelievingDate(e.target.value)}
                    className="h-9 w-fit rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                  />
                </div>
                <button
                  type="button"
                  onClick={generatePDF}
                  disabled={!manualRelievingDate}
                  className="mt-4 h-9 rounded-lg bg-client px-4 text-sm font-medium text-client-foreground hover:bg-client/90 disabled:opacity-60"
                >
                  Generate Relieving Letter
                </button>
              </div>

            {/* Hidden PDF template for generation only - Not visible to user */}
            <div ref={pdfRef} style={{ position: "fixed", top: "-9999px", left: "-9999px", width: "210mm", minHeight: "297mm", padding: "15mm", backgroundImage: `url(${watermark})`, backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "300px", backgroundColor: "white" }}>
              <div style={{ overflow: "hidden" }}>
                <img src={logoSrc} alt="" style={{ width: "90px", float: "left" }} />
                <div style={{ float: "right", textAlign: "right", color: "#0d2d73", fontSize: "13px" }}>
                  <strong>{company.name}</strong><br />
                  {company.addressLines.map((line) => (
                    <React.Fragment key={line}>{line}<br /></React.Fragment>
                  ))}
                </div>
              </div>
              <br /><br /><br />
              <h2 style={{ textAlign: "center", textDecoration: "underline" }}>RELIEVING LETTER</h2>
              <div><h3>{company.name}</h3><h4>HR Department</h4><p>{company.addressLines.map((line) => (
                <React.Fragment key={line}>{line}<br /></React.Fragment>
              ))}</p></div>
              <div style={{ marginTop: "20px", fontWeight: "bold" }}>Date: {getCurrentDate()}</div>
              <div style={{ marginTop: "35px", fontWeight: "bold" }}>TO <span style={{ textTransform: "uppercase" }}>{employee.employeeName}</span></div>
              <div style={{ marginTop: "25px", lineHeight: 1.6, textAlign: "justify" }}>
                This is to certify that <strong>Mr/Ms. {employee.employeeName}</strong>, Employee ID <strong>{employee.employeeId}</strong>, worked with {company.name} as an {employee.designation} from <strong>{employee.joiningDate}</strong> to <strong>{formatDateDDMMYYYY(manualRelievingDate)}</strong>.
                <br /><br />
               During her employment, she discharged her duties with commitment and professionalism. She has completed all the required formalities and is hereby relieved from the services of the company with effective {formatDateDDMMYYYY(manualRelievingDate)}.
                <br /><br />
                We thank her for the services rendered to the organization and wish her success in her future career.
              </div>
              <div style={{ marginTop: "30px" }}>For <strong>{company.name}</strong><br /><br /><strong>{company.hrName}</strong><br />HR Manager<br /><br /><img src={signSrc} alt="" style={{ width: "90px" }} /></div>
              <div style={{ position: "absolute", left: "12px", right: "12px", bottom: "10px", textAlign: "center" }}><hr /><div style={{ fontSize: "10px" }}>Website: {company.website}<br />Email: {company.email}<br />Tel: {company.phone}</div></div>
            </div>

            {hasCustomBody && (
              <div
                ref={customBodyRef}
                style={{
                  position: "fixed", top: "-9999px", left: "-9999px", width: "210mm",
                  padding: "15mm", backgroundImage: `url(${watermark})`, backgroundRepeat: "no-repeat",
                  backgroundPosition: "center 150mm", backgroundSize: "300px", backgroundColor: "white",
                }}
              >
                <div style={{ overflow: "hidden" }}>
                  <img src={logoSrc} alt="" style={{ width: "90px", float: "left" }} />
                  <div style={{ float: "right", textAlign: "right", color: "#0d2d73", fontSize: "13px" }}>
                    <strong>{company.name}</strong><br />
                    {company.addressLines.map((line) => (
                      <React.Fragment key={line}>{line}<br /></React.Fragment>
                    ))}
                  </div>
                </div>
                <br /><br /><br />
                <h2 style={{ textAlign: "center", textDecoration: "underline" }}>RELIEVING LETTER</h2>
                <div style={{ marginTop: 25, lineHeight: 1.6, textAlign: "justify" }}>
                  {mergeTemplateBody(selectedTemplate?.bodyContent, customFieldValues).map((paragraph, index) => (
                    <p key={index} style={{ margin: "0 0 14px" }}>{paragraph}</p>
                  ))}
                </div>
                <div style={{ marginTop: "30px" }}>For <strong>{company.name}</strong><br /><br /><strong>{company.hrName}</strong><br />HR Manager<br /><br /><img src={signSrc} alt="" style={{ width: "90px" }} /></div>
                <div style={{ marginTop: 40, textAlign: "center" }}><hr /><div style={{ fontSize: "10px" }}>Website: {company.website}<br />Email: {company.email}<br />Tel: {company.phone}</div></div>
              </div>
            )}
          </>
        )}
      </div>
      </>
      )}
      </section>
    </div>
  );

  return (
    <AdminLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="essentials"
      title="Generate Relieving Letter"
      subtitle="Search by employee ID and generate a relieving letter PDF."
    >
      {letterContent}
    </AdminLayout>
  );
}

export default RelievingLetter;
