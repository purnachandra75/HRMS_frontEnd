import React, { useState } from 'react';
import { updateEmployeeProfile } from '../services/employeeService';
import '../styles/Modal.css';

function EmployeeEditModal({ employee, onSave, onClose }) {
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: employee.firstName || '',
    lastName: employee.lastName || '',
    email: employee.email || '',
    phone: employee.phone || '',
    gender: employee.gender || '',
    dateOfBirth: employee.dateOfBirth || '',
    bloodGroup: employee.bloodGroup || '',
    maritalStatus: employee.maritalStatus || '',
    nationality: employee.nationality || '',

    // Address Details
    permanentAddress: employee.permanentAddress || '',
    currentAddress: employee.currentAddress || '',
    country: employee.country || '',
    state: employee.state || '',
    city: employee.city || '',
    pincode: employee.pincode || '',

    // Employment Details
    department: employee.department || '',
    designation: employee.designation || '',
    employeeType: employee.employeeType || '',
    dateOfJoining: employee.dateOfJoining || '',
    workLocation: employee.workLocation || '',
    reportingManager: employee.reportingManager || '',
    employeeStatus: employee.employeeStatus || '',
    shiftTiming: employee.shiftTiming || '',
    experience: employee.experience || '',
    employeeCategory: employee.employeeCategory || '',

    // Salary Details
    basicSalary: employee.basicSalary || '',
    bonus: employee.bonus || '',
    ctc: employee.ctc || '',
    pfApplicable: employee.pfApplicable || '',
    pfNumber: employee.pfNumber || '',
    esiApplicable: employee.esiApplicable || '',
    bankName: employee.bankName || '',
    accountNumber: employee.accountNumber || '',
    ifscCode: employee.ifscCode || '',
    branchName: employee.branchName || '',
    panNumber: employee.panNumber || '',
    aadhaarNumber: employee.aadhaarNumber || '',
    uanNumber: employee.uanNumber || '',

    // Education Details
    highestQualification: employee.highestQualification || '',
    universityCollege: employee.universityCollege || '',
    yearOfPassing: employee.yearOfPassing || '',
    percentageCGPA: employee.percentageCGPA || '',

    // Emergency Contact
    emergencyContactName: employee.emergencyContactName || '',
    relationship: employee.relationship || '',
    emergencyContactNumber: employee.emergencyContactNumber || '',
    emergencyAlternateNumber: employee.emergencyAlternateNumber || '',
    emergencyAddress: employee.emergencyAddress || '',

    // System Access
    username: employee.username || '',
    loginAccess: employee.loginAccess || 'enable',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await updateEmployeeProfile(employee.id, formData);
      if (result.success) {
        onSave({ ...employee, ...formData });
        alert('Employee updated successfully');
      } else {
        setError('Failed to update employee');
      }
    } catch (err) {
      setError('An error occurred while saving');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Employee Details</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Personal Information */}
          <div className="modal-section">
            <h4>Personal Information</h4>
            <div className="form-row">
              <div className="form-group">
                <label>First Name:</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Last Name:</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email:</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Phone:</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Gender:</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date of Birth:</label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Blood Group:</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                </select>
              </div>
              <div className="form-group">
                <label>Marital Status:</label>
                <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                </select>
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="modal-section">
            <h4>Employment Details</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Department:</label>
                <input type="text" name="department" value={formData.department} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Designation:</label>
                <input type="text" name="designation" value={formData.designation} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date of Joining:</label>
                <input type="date" name="dateOfJoining" value={formData.dateOfJoining} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Work Location:</label>
                <input type="text" name="workLocation" value={formData.workLocation} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Reporting Manager:</label>
                <input type="text" name="reportingManager" value={formData.reportingManager} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Experience (Years):</label>
                <input type="text" name="experience" value={formData.experience} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="modal-section">
            <h4>Address Details</h4>
            <div className="form-row">
              <div className="form-group">
                <label>City:</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>State:</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Pincode:</label>
                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Salary Details */}
          <div className="modal-section">
            <h4>Salary Details</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Basic Salary:</label>
                <input type="text" name="basicSalary" value={formData.basicSalary} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>CTC:</label>
                <input type="text" name="ctc" value={formData.ctc} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Bank Name:</label>
                <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Account Number:</label>
                <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>PAN Number:</label>
                <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Aadhaar Number:</label>
                <input type="text" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Education Details */}
          <div className="modal-section">
            <h4>Education Details</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Highest Qualification:</label>
                <select name="highestQualification" value={formData.highestQualification} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Bachelor's">Bachelor's</option>
                  <option value="Master's">Master's</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
              <div className="form-group">
                <label>University/College:</label>
                <input type="text" name="universityCollege" value={formData.universityCollege} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="modal-section">
            <h4>Emergency Contact</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Contact Name:</label>
                <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Contact Number:</label>
                <input type="tel" name="emergencyContactNumber" value={formData.emergencyContactNumber} onChange={handleChange} />
              </div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="save-btn">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployeeEditModal;
