import { leaveTypes } from '../config/leaveConfig';
import { calculateDaysBetween } from '../utils/leaveUtils';

export default function LeaveRequestForm({ formData, onChange, onSubmit, onBack }) {
  const requestDays = calculateDaysBetween(formData.fromDate, formData.toDate);

  return (
    <section className="section-box request-section">
      <div className="section-header">
        <div>
          <h2>Apply Leave Request</h2>
          <p>Select leave type, choose dates, and add a reason.</p>
        </div>
      </div>
      <div className="request-form">
        <div className="form-row">
          <label htmlFor="leaveType">Leave Type</label>
          <select 
            id="leaveType" 
            value={formData.type || ''} 
            onChange={(event) => onChange({ ...formData, type: event.target.value })}
          >
            <option value="">Select leave type</option>
            {Object.entries(leaveTypes).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row date-row">
          <div>
            <label htmlFor="fromDate">From</label>
            <input 
              id="fromDate" 
              type="date" 
              value={formData.fromDate || ''} 
              onChange={(event) => onChange({ ...formData, fromDate: event.target.value })} 
              placeholder="dd-mm-yyyy"
            />
          </div>
          <div>
            <label htmlFor="toDate">To</label>
            <input 
              id="toDate" 
              type="date" 
              value={formData.toDate || ''} 
              onChange={(event) => onChange({ ...formData, toDate: event.target.value })} 
              placeholder="dd-mm-yyyy"
            />
          </div>
        </div>
        <div className="form-row">
          <label>Days</label>
          <input type="text" value={requestDays || ''} readOnly placeholder="Calculated from dates" />
        </div>
        <div className="form-row full-width">
          <label htmlFor="leaveReason">Reason</label>
          <textarea 
            id="leaveReason" 
            value={formData.reason || ''} 
            onChange={(event) => onChange({ ...formData, reason: event.target.value })} 
            placeholder="Describe why you need this leave" 
          />
        </div>
        <button className="primary-button" onClick={onSubmit}>
          Send Leave Request
        </button>
      </div>
    </section>
  );
}
