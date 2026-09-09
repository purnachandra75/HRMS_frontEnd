import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Screenshots one (possibly very tall) off-screen div and slices it across as many A4 pages as
// needed. Used for custom-body letters (arbitrary length, uploaded-document content) instead of
// the fixed one-div-per-page layout the hardcoded legal letters use, since arbitrary content
// won't fit a fixed page count. Same technique already used by PfGeneratorPage.js's payslip PDF.
export async function generatePagedPdf(element, filename) {
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = 210;
  const pageHeight = 297;
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}

// Replaces every {{fieldKey}} token in a template's bodyContent with the entered value, and
// splits back into paragraphs (bodyContent paragraphs are joined with "\n\n" when saved).
export function mergeTemplateBody(bodyContent, values) {
  const merged = (bodyContent || "").replace(/\{\{(\w+)\}\}/g, (match, key) =>
    values[key] !== undefined && values[key] !== "" ? values[key] : match
  );
  return merged.split(/\n\n+/).filter((p) => p.trim().length > 0);
}
