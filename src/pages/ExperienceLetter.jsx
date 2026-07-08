import React, { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import logo from "../assets/ProminentLogo.png";
import sign from "../assets/Sign.jpg";
import watermark from "../assets/p2.jpg";
import { formatDateDDMMYYYY } from "../utils/dateFormat";

function ExperienceLetter() {
  const pdfRef = useRef();
  const [employeeId, setEmployeeId] = useState("");
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [manualRelievingDate, setManualRelievingDate] = useState("");

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

    const url = `http://localhost:8080/api/employee/${employeeId.trim()}/experience`;
    setIsSearching(true);
    setError("");
    setEmployee(null);
    setManualRelievingDate("");

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Employee not found");
      const data = await response.json();
      setEmployee(normalizeEmployee(data));
    } catch (err) {
      console.error("Experience letter employee lookup failed:", err);
      setError("Employee not found");
    } finally {
      setIsSearching(false);
    }
  };

  const generatePDF = async () => {
    if (!employee || !employeeId.trim()) {
      alert("Please search and select an employee first");
      return;
    }
    if (!manualRelievingDate) {
      alert("Please enter a relieving date to continue");
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
      pdf.save(`ExperienceLetter_${employee.employeeId}.pdf`);
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

  return (
    <div className="letter-generator-page">
      <section className="letter-search-card">
        <div className="letter-search-header">
          <p className="eyebrow">Essentials</p>
          <h1>Generate Experience Letter</h1>
          <p>Search by employee ID, verify the employee details, then generate the PDF.</p>
        </div>
      <div className="letter-action-row">
        <input
          type="text"
          className="letter-search-input"
          placeholder="Enter Employee ID"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        />
        <button type="button" className="search-button" onClick={searchEmployee} disabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </button>
      </div>
      <div className="letter-result-area">
        {error && <p className="letter-error">{error}</p>}
        {employee && (
          <>
            <div className="employee-found-card">
              <h3>Employee Found</h3>
              <div className="employee-found-grid">
                <p><strong>Name</strong><span>{employee.employeeName}</span></p>
                <p><strong>Employee ID</strong><span>{employee.employeeId}</span></p>
                <p><strong>Designation</strong><span>{employee.designation}</span></p>
                <p><strong>Joining Date</strong><span>{employee.joiningDate}</span></p>
              </div>
              <div className="field-group letter-date-row">
                <label>Relieving Date</label>
                <input
                  type="date"
                  className="letter-date-input"
                  value={manualRelievingDate}
                  onChange={(e) => setManualRelievingDate(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="generate-button"
                onClick={generatePDF}
                disabled={!manualRelievingDate}
              >
                Generate Experience Letter
              </button>
            </div>

            {/* Hidden PDF template for generation only - Not visible to user */}
            <div ref={pdfRef} style={{ position: "fixed", top: "-9999px", left: "-9999px", width: "210mm", minHeight: "297mm", padding: "15mm", backgroundImage: `url(${watermark})`, backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "300px", backgroundColor: "white" }}>
              <div style={{ overflow: "hidden" }}>
                <img src={logo} alt="" style={{ width: "90px", float: "left" }} />
                <div style={{ float: "right", textAlign: "right", color: "#0d2d73", fontSize: "13px" }}>
                  <strong>PROMINENT SCIENTIFIC PVT LTD</strong><br />
                  Address: JQ-Chambers, D.No.4-50/5<br />
                  Plot No:5, 4th Floor, Gachibowli<br />
                  Hyderabad, Telangana - 500032
                </div>
              </div>
              <br /><br /><br />
              <h2 style={{ textAlign: "center", textDecoration: "underline" }}>EXPERIENCE LETTER</h2>
              <div><h3>PROMINENT SCIENTIFIC</h3><h4>HR Department</h4><p>JQ-Chambers, D.No.4-50/5<br />Plot No:5, 4th Floor<br />Gachibowli, Hyderabad<br />Telangana - 500032</p></div>
              <div style={{ marginTop: "20px", fontWeight: "bold" }}>Date: {getCurrentDate()}</div>
              <div style={{ marginTop: "35px", fontWeight: "bold" }}>TO <span style={{ textTransform: "uppercase" }}>{employee.employeeName}</span></div>
              <div style={{ marginTop: "25px", lineHeight: 1.6, textAlign: "justify" }}>
                This is to certify that <strong>Mr/Ms. {employee.employeeName}</strong>, Employee ID <strong>{employee.employeeId}</strong>, worked with Prominent Scientific as an {employee.designation} from <strong>{employee.joiningDate}</strong> to <strong>{formatDateDDMMYYYY(manualRelievingDate)}</strong>.
                <br /><br />
                During his/her tenure with the organization, he/she was responsible for carrying out assigned duties and responsibilities with sincerity, dedication and professionalism.
                <br /><br />
                We appreciate his/her contribution to the organization and wish success in future endeavors.
              </div>
              <div style={{ marginTop: "30px" }}>For <strong>Prominent Scientific Pvt Ltd</strong><br /><br /><strong>P Lokeswari</strong><br />HR Manager<br /><br /><img src={sign} alt="" style={{ width: "90px" }} /></div>
              <div style={{ position: "absolute", left: "12px", right: "12px", bottom: "10px", textAlign: "center" }}><hr /><div style={{ fontSize: "10px" }}>Website: www.prominentscientific.co.in<br />Email: info@prominentscientific.co.in<br />Tel: +91 7760152730</div></div>
            </div>
          </>
        )}
      </div>
      </section>
    </div>
  );
}

export default ExperienceLetter;
