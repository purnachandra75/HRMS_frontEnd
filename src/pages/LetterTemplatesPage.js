import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import {
  getLetterTemplates,
  createLetterTemplate,
  updateLetterTemplate,
  deleteLetterTemplate,
  uploadLetterTemplateLogo,
  fetchLetterTemplateLogoObjectUrl,
  uploadLetterTemplateSignature,
  parseLetterTemplateDocument,
} from '../services/letterTemplateService';
import '../styles/tailwind.css';

const LETTER_TYPES = [
  { value: 'OFFER', label: 'Offer Letter' },
  { value: 'LETTER_OF_INTENT', label: 'Letter of Intent' },
  { value: 'EXPERIENCE', label: 'Experience Letter' },
  { value: 'RELIEVING', label: 'Relieving Letter' },
];

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Text' },
  { value: 'DATE', label: 'Date' },
  { value: 'CURRENCY', label: 'Amount' },
];

const emptyForm = () => ({
  id: null,
  name: '',
  companyName: '',
  addressLine1: '',
  addressLine2: '',
  addressLine3: '',
  phone: '',
  website: '',
  email: '',
  hrName: '',
  isDefault: false,
  bodyContent: '',
  fields: [],
});

// Walks every text node inside `container` (skipping generated ::before/::after content, which
// isn't part of the DOM) to find the character offset of a Range boundary within the container's
// full text - the same technique rich-text editors use to map a Selection back to plain-text
// coordinates, needed here because a paragraph is rendered as multiple <mark>/text fragments once
// fields exist in it.
const getTextOffset = (container, node, nodeOffset) => {
  let offset = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  let current = walker.nextNode();
  while (current) {
    if (current === node) return offset + nodeOffset;
    offset += current.textContent.length;
    current = walker.nextNode();
  }
  return offset;
};

const getSelectionOffsetsWithin = (container) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) return null;

  const start = getTextOffset(container, range.startContainer, range.startOffset);
  const end = getTextOffset(container, range.endContainer, range.endOffset);
  if (start === end) return null;
  return { startOffset: Math.min(start, end), endOffset: Math.max(start, end), text: selection.toString() };
};

const rangesOverlap = (a, b) => a.startOffset < b.endOffset && b.startOffset < a.endOffset;

// Renders one paragraph as an array of {text, field?} segments, sliced at each field's offsets -
// used both to render the highlighted preview and (via join) to reconstruct the plain text.
const buildParagraphSegments = (text, fields) => {
  const sorted = [...fields].sort((a, b) => a.startOffset - b.startOffset);
  const segments = [];
  let cursor = 0;
  for (const field of sorted) {
    if (field.startOffset > cursor) {
      segments.push({ text: text.slice(cursor, field.startOffset) });
    }
    segments.push({ text: text.slice(field.startOffset, field.endOffset), field });
    cursor = field.endOffset;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }
  return segments;
};

// {{fieldKey}} tokens, back-to-front per paragraph so earlier offsets in the same paragraph stay
// valid while later ones are replaced first.
const buildBodyContent = (paragraphs, fields) =>
  paragraphs
    .map((text, paragraphIndex) => {
      const paragraphFields = fields
        .filter((f) => f.paragraphIndex === paragraphIndex)
        .sort((a, b) => b.startOffset - a.startOffset);
      let result = text;
      for (const field of paragraphFields) {
        result = `${result.slice(0, field.startOffset)}{{${field.fieldKey}}}${result.slice(field.endOffset)}`;
      }
      return result;
    })
    .join('\n\n');

function LetterTemplatesPage({ userName, onLogout }) {
  const [letterType, setLetterType] = useState(LETTER_TYPES[0].value);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [thumbnails, setThumbnails] = useState({});

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [logoFile, setLogoFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // Populated only when the admin uploads a new document in this editing session - see the
  // "edit body only via re-upload" note on openEditForm below. Until then form.bodyContent/fields
  // (carried over unchanged from the template being edited) are what actually gets saved.
  const [docParagraphs, setDocParagraphs] = useState([]);
  const [docFields, setDocFields] = useState([]);
  const [parsingDoc, setParsingDoc] = useState(false);
  const [pendingSelection, setPendingSelection] = useState(null);
  const [pendingLabel, setPendingLabel] = useState('');
  const [pendingType, setPendingType] = useState('TEXT');
  const paragraphRefs = useRef({});

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getLetterTemplates(letterType);
      setTemplates(data);

      const entries = await Promise.all(
        data
          .filter((t) => t.hasLogo)
          .map(async (t) => [t.id, await fetchLetterTemplateLogoObjectUrl(t.id)])
      );
      setThumbnails(Object.fromEntries(entries));
    } catch (err) {
      console.error('Failed to load letter templates:', err);
      setError(err.message || 'Failed to load letter templates');
    } finally {
      setLoading(false);
    }
  }, [letterType]);

  useEffect(() => {
    loadTemplates();
    setShowForm(false);
    setForm(emptyForm());
  }, [loadTemplates]);

  const resetDocState = () => {
    setDocParagraphs([]);
    setDocFields([]);
    setParsingDoc(false);
    setPendingSelection(null);
    setPendingLabel('');
    setPendingType('TEXT');
  };

  const openCreateForm = () => {
    setForm(emptyForm());
    setLogoFile(null);
    setSignatureFile(null);
    resetDocState();
    setStatusMessage('');
    setError('');
    setShowForm(true);
  };

  // Body content isn't re-opened for fine-grained editing here - the offsets used to mark fields
  // are only meaningful against the exact paragraph text they were captured from, and bodyContent
  // as stored already has those spans replaced with {{fieldKey}} tokens. To change an existing
  // custom body, upload a corrected document instead (see handleDocumentUpload), which replaces
  // form.bodyContent/fields entirely; leaving the upload box untouched keeps the existing body as-is.
  const openEditForm = (template) => {
    setForm({
      id: template.id,
      name: template.name || '',
      companyName: template.companyName || '',
      addressLine1: template.addressLine1 || '',
      addressLine2: template.addressLine2 || '',
      addressLine3: template.addressLine3 || '',
      phone: template.phone || '',
      website: template.website || '',
      email: template.email || '',
      hrName: template.hrName || '',
      isDefault: Boolean(template.isDefault),
      bodyContent: template.bodyContent || '',
      fields: template.fields || [],
    });
    setLogoFile(null);
    setSignatureFile(null);
    resetDocState();
    setStatusMessage('');
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm());
    setLogoFile(null);
    setSignatureFile(null);
    resetDocState();
  };

  const handleFieldChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleDocumentUpload = async (file) => {
    if (!file) return;
    setParsingDoc(true);
    setError('');
    try {
      const parsed = await parseLetterTemplateDocument(file);
      setDocParagraphs(parsed.paragraphs || []);
      setDocFields(parsed.suggestedFields || []);
      setPendingSelection(null);
    } catch (err) {
      console.error('Failed to parse uploaded document:', err);
      setError(err.message || 'Failed to read the uploaded document');
    } finally {
      setParsingDoc(false);
    }
  };

  const handleParagraphMouseUp = (paragraphIndex) => {
    const container = paragraphRefs.current[paragraphIndex];
    if (!container) return;
    const offsets = getSelectionOffsetsWithin(container);
    if (!offsets) {
      setPendingSelection(null);
      return;
    }
    const overlapsExisting = docFields
      .filter((f) => f.paragraphIndex === paragraphIndex)
      .some((f) => rangesOverlap(f, offsets));
    if (overlapsExisting) {
      setPendingSelection(null);
      return;
    }
    setPendingLabel('');
    setPendingType('TEXT');
    setPendingSelection({ paragraphIndex, ...offsets });
  };

  const handleAddManualField = () => {
    if (!pendingSelection || !pendingLabel.trim()) return;
    const fieldKey = `field${docFields.length + 1}_${Date.now().toString(36)}`;
    setDocFields((current) => [
      ...current,
      { ...pendingSelection, fieldKey, label: pendingLabel.trim(), fieldType: pendingType },
    ]);
    setPendingSelection(null);
    setPendingLabel('');
    window.getSelection()?.removeAllRanges();
  };

  const handleRemoveDocField = (fieldKey) => {
    setDocFields((current) => current.filter((f) => f.fieldKey !== fieldKey));
  };

  const handleUpdateDocFieldLabel = (fieldKey, label) => {
    setDocFields((current) => current.map((f) => (f.fieldKey === fieldKey ? { ...f, label } : f)));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Template name is required');
      return;
    }

    setSaving(true);
    setError('');
    setStatusMessage('');
    try {
      const bodyContent = docParagraphs.length > 0 ? buildBodyContent(docParagraphs, docFields) : form.bodyContent;
      const fields = docParagraphs.length > 0
        ? docFields.map(({ fieldKey, label, fieldType }) => ({ fieldKey, label, fieldType }))
        : form.fields;
      const payload = { ...form, letterType, bodyContent, fields };
      const saved = form.id
        ? await updateLetterTemplate(form.id, payload)
        : await createLetterTemplate(payload);

      if (logoFile) {
        await uploadLetterTemplateLogo(saved.id, logoFile);
      }
      if (signatureFile) {
        await uploadLetterTemplateSignature(saved.id, signatureFile);
      }

      setStatusMessage('Template saved successfully.');
      closeForm();
      await loadTemplates();
    } catch (err) {
      console.error('Failed to save letter template:', err);
      setError(err.message || 'Failed to save letter template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template) => {
    if (!window.confirm(`Delete template "${template.name}"? This cannot be undone.`)) return;
    setError('');
    setStatusMessage('');
    try {
      await deleteLetterTemplate(template.id);
      setStatusMessage('Template deleted.');
      await loadTemplates();
    } catch (err) {
      console.error('Failed to delete letter template:', err);
      setError(err.message || 'Failed to delete letter template');
    }
  };

  return (
    <AdminLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="essentials"
      title="Letter Templates"
      subtitle="Manage the branding (company info, logo, signature) used to generate each type of HR letter."
    >
      <div className="flex flex-col gap-5">
        {(error || statusMessage) && (
          <div
            className={`rounded-lg border px-3 py-2 text-sm ${
              error
                ? 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]'
                : 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]'
            }`}
          >
            {error || statusMessage}
          </div>
        )}

        <div className="flex flex-wrap gap-2 rounded-xl border border-border/80 bg-card p-3 shadow-sm">
          {LETTER_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setLetterType(type.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                letterType === type.value
                  ? 'bg-client text-client-foreground'
                  : 'border border-border bg-white text-foreground hover:bg-muted'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">
              {LETTER_TYPES.find((t) => t.value === letterType)?.label} Templates
            </h3>
            <button
              type="button"
              onClick={openCreateForm}
              className="h-9 rounded-lg bg-client px-3 text-sm font-medium text-client-foreground hover:bg-client/90"
            >
              + Add Template
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading templates...</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No templates yet. Add one so this letter type can be generated.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <div key={template.id} className="flex flex-col gap-2 rounded-lg border border-border bg-white p-3">
                  <div className="flex items-center gap-2">
                    {thumbnails[template.id] && (
                      <img src={thumbnails[template.id]} alt="" className="h-8 w-8 rounded border border-border object-contain" />
                    )}
                    <span className="text-sm font-semibold text-foreground">{template.name}</span>
                    {template.isDefault && (
                      <span className="rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#15803d]">
                        Default
                      </span>
                    )}
                    {template.bodyContent && (
                      <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#1d4ed8]">
                        Custom content
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{template.companyName || 'No company name set'}</div>
                  <div className="mt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(template)}
                      className="h-8 rounded-md border border-border bg-white px-2.5 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(template)}
                      className="h-8 rounded-md border border-[#fecaca] bg-[#fef2f2] px-2.5 text-xs font-medium text-[#b91c1c] hover:bg-[#fee2e2]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={closeForm}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-lg flex-col gap-4 rounded-xl border border-border/80 bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-base font-semibold text-foreground">
                {form.id ? 'Edit Template' : 'Add Template'}
              </h2>

              <form onSubmit={handleSave} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Template Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="e.g. Hyderabad Head Office"
                    className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                  />
                </div>
                <div className="flex flex-col gap-1.5 rounded-lg border border-dashed border-border bg-muted/20 p-3">
                  <label className="text-sm font-medium text-foreground">Import from Word document (.docx)</label>
                  <p className="text-xs text-muted-foreground">
                    Upload an existing letter to reuse its wording. After it's read, mark the parts that
                    should be filled in per employee (name, designation, CTC, dates, ...) - some are
                    suggested automatically; select any other text to mark it manually.
                  </p>
                  <input
                    type="file"
                    accept=".docx"
                    disabled={parsingDoc}
                    onChange={(e) => handleDocumentUpload(e.target.files[0])}
                    className="text-xs text-muted-foreground"
                  />
                  {parsingDoc && <p className="text-xs text-muted-foreground">Reading document...</p>}

                  {docParagraphs.length === 0 && form.bodyContent && (
                    <p className="text-xs text-[#1d4ed8]">
                      This template already has custom content. Uploading a document here will replace it.
                    </p>
                  )}

                  {docParagraphs.length > 0 && (
                    <div className="mt-2 flex flex-col gap-3 rounded-lg border border-border bg-white p-3">
                      <div className="flex flex-col gap-2">
                        {docParagraphs.map((text, paragraphIndex) => {
                          const paragraphFields = docFields.filter((f) => f.paragraphIndex === paragraphIndex);
                          const segments = buildParagraphSegments(text, paragraphFields);
                          return (
                            <p
                              key={paragraphIndex}
                              ref={(el) => { paragraphRefs.current[paragraphIndex] = el; }}
                              onMouseUp={() => handleParagraphMouseUp(paragraphIndex)}
                              className="text-sm leading-relaxed text-foreground"
                            >
                              {segments.map((segment, segmentIndex) =>
                                segment.field ? (
                                  <mark
                                    key={segmentIndex}
                                    className="field-mark rounded bg-[#fef08a] px-0.5"
                                    data-label={segment.field.label}
                                  >
                                    {segment.text}
                                  </mark>
                                ) : (
                                  <React.Fragment key={segmentIndex}>{segment.text}</React.Fragment>
                                )
                              )}
                            </p>
                          );
                        })}
                      </div>
                      <style>{`
                        .field-mark { position: relative; }
                        .field-mark::after {
                          content: attr(data-label);
                          display: inline-block;
                          margin-left: 4px;
                          font-size: 10px;
                          font-weight: 600;
                          color: #92400e;
                          vertical-align: super;
                        }
                      `}</style>

                      {pendingSelection && (
                        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-client/30 bg-client/5 p-2">
                          <div className="text-xs text-muted-foreground">
                            Selected: <strong>&ldquo;{pendingSelection.text}&rdquo;</strong>
                          </div>
                          <input
                            type="text"
                            value={pendingLabel}
                            onChange={(e) => setPendingLabel(e.target.value)}
                            placeholder="Field label, e.g. Employee Name"
                            className="h-8 flex-1 min-w-[160px] rounded-md border border-border bg-white px-2 text-xs outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                          />
                          <select
                            value={pendingType}
                            onChange={(e) => setPendingType(e.target.value)}
                            className="h-8 rounded-md border border-border bg-white px-2 text-xs outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                          >
                            {FIELD_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleAddManualField}
                            disabled={!pendingLabel.trim()}
                            className="h-8 rounded-md bg-client px-2.5 text-xs font-medium text-client-foreground hover:bg-client/90 disabled:opacity-60"
                          >
                            Mark as field
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingSelection(null)}
                            className="h-8 rounded-md border border-border bg-white px-2.5 text-xs font-medium text-foreground hover:bg-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5">
                        <div className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                          Fields ({docFields.length})
                        </div>
                        {docFields.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No fields marked yet. Select text above to mark one.
                          </p>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {docFields.map((f) => (
                              <div key={f.fieldKey} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={f.label}
                                  onChange={(e) => handleUpdateDocFieldLabel(f.fieldKey, e.target.value)}
                                  className="h-8 flex-1 rounded-md border border-border bg-white px-2 text-xs outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                                />
                                <span className="text-[10px] uppercase text-muted-foreground">{f.fieldType}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDocField(f.fieldKey)}
                                  className="rounded-md border border-[#fecaca] bg-[#fef2f2] p-1 text-[#b91c1c] hover:bg-[#fee2e2]"
                                  aria-label={`Remove ${f.label}`}
                                >
                                  <X className="size-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Company Name</label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => handleFieldChange('companyName', e.target.value)}
                    className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Address Line 1</label>
                  <input
                    type="text"
                    value={form.addressLine1}
                    onChange={(e) => handleFieldChange('addressLine1', e.target.value)}
                    className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Address Line 2</label>
                  <input
                    type="text"
                    value={form.addressLine2}
                    onChange={(e) => handleFieldChange('addressLine2', e.target.value)}
                    className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Address Line 3</label>
                  <input
                    type="text"
                    value={form.addressLine3}
                    onChange={(e) => handleFieldChange('addressLine3', e.target.value)}
                    className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Phone</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Website</label>
                    <input
                      type="text"
                      value={form.website}
                      onChange={(e) => handleFieldChange('website', e.target.value)}
                      className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <input
                    type="text"
                    value={form.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">HR Signatory Name</label>
                  <input
                    type="text"
                    value={form.hrName}
                    onChange={(e) => handleFieldChange('hrName', e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Logo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files[0] || null)}
                      className="text-xs text-muted-foreground"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Signature</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSignatureFile(e.target.files[0] || null)}
                      className="text-xs text-muted-foreground"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => handleFieldChange('isDefault', e.target.checked)}
                  />
                  Use as the default template for {LETTER_TYPES.find((t) => t.value === letterType)?.label}
                </label>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-client px-4 py-2 text-sm font-medium text-client-foreground hover:bg-client/90 disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default LetterTemplatesPage;
