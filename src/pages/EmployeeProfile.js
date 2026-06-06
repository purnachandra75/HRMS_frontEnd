import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createEmployee, getEmployeeProfile, getEmployeeById, updateEmployeeProfile } from '../services/employeeService';
import '../styles/Profile.css';

function EmployeeProfile({ userId, userRole, onLogout }) {
  const location = useLocation();
  const params = useParams();
  const isCreateMode = userRole === 'admin' && location.pathname.endsWith('/new');
  const profileId = isCreateMode ? null : params.id ? Number(params.id) : userId;
  const isAdminView = userRole === 'admin' && params.id !== undefined && !isCreateMode;
  const [employee, setEmployee] = useState(isCreateMode ? {} : null);
  const [loading, setLoading] = useState(isCreateMode ? false : true);
  const [isEditing, setIsEditing] = useState(isCreateMode);
  const [activeSection, setActiveSection] = useState('personal');
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const canEdit = true;

  // Define all sections in order
  const sections = [
    { id: 'personal', label: 'Personal Details', icon: '👤' },
    { id: 'address', label: 'Address Details', icon: '📍' },
    { id: 'job', label: 'Job Details', icon: '💼' },
    { id: 'salary', label: 'Salary Details', icon: '💰' },
    { id: 'education', label: 'Education Details', icon: '🎓' },
    { id: 'documents', label: 'Document Details', icon: '📄' },
    { id: 'emergency', label: 'Emergency Contact', icon: '🚨' },
  ];

  useEffect(() => {
    if (!isCreateMode) {
      loadEmployee();
    }
  }, [profileId]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('edit') === 'true' && canEdit) {
      setIsEditing(true);
    }
  }, [location.search, canEdit]);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      const data = isAdminView ? await getEmployeeById(profileId) : await getEmployeeProfile(profileId);
      setEmployee(data);
      setFormData(data);
    } catch (err) {
      setError('Failed to load employee details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isCreateMode) {
        const result = await createEmployee(formData);
        if (result.success) {
          setEmployee(result.employee);
          setIsEditing(false);
          alert('Employee created successfully!');
          navigate('/admin');
        } else {
          throw new Error(result.message);
        }
      } else {
        const result = await updateEmployeeProfile(profileId, formData);
        if (result.success) {
          setEmployee(result.employee);
          setIsEditing(false);
          alert('Profile updated successfully!');
        } else {
          throw new Error(result.message);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to save profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isCreateMode) {
      navigate('/admin');
      return;
    }
    setFormData(employee);
    setIsEditing(false);
  };

  const goToNextSection = () => {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id);
    }
  };

  const goToPreviousSection = () => {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (error) return <div className="profile-error">{error}</div>;
  if (!employee && !isCreateMode) return <div className="profile-error">No employee data found</div>;

  const currentSectionIndex = sections.findIndex(s => s.id === activeSection);
  const canGoNext = currentSectionIndex < sections.length - 1;
  const canGoPrevious = currentSectionIndex > 0;
  const sectionReadOnly = !isAdminView && !isCreateMode && (activeSection === 'job' || activeSection === 'salary');

  const renderSectionView = (id) => {
    const F = (label, value) => (
      <div className="info-item"><strong>{label}</strong> {value || '—'}</div>
    );

    switch (id) {
      case 'personal':
        return (
          <div className="profile-section">
            <h2>Personal Details</h2>
            <div className="quick-info">
              {F('First Name:', employee.firstName)}
              {F('Last Name:', employee.lastName)}
              {F('Email:', employee.email)}
              {F('Phone:', employee.phone)}
              {F('Alternate Phone:', employee.alternatePhone)}
              {F('Date of Birth:', employee.dateOfBirth)}
              {F('Gender:', employee.gender)}
              {F('Blood Group:', employee.bloodGroup)}
              {F('Marital Status:', employee.maritalStatus)}
              {F('Nationality:', employee.nationality)}
            </div>
          </div>
        );
      case 'address':
        return (
          <div className="profile-section">
            <h2>Address Details</h2>
            <div className="quick-info">
              {F('Permanent Address:', employee.permanentAddress)}
              {F('Current Address:', employee.currentAddress)}
              {F('Country:', employee.country)}
              {F('State:', employee.state)}
              {F('City:', employee.city)}
              {F('Pincode:', employee.pincode)}
            </div>
          </div>
        );
      case 'job':
        return (
          <div className="profile-section">
            <h2>Job Details</h2>
            <div className="quick-info">
              {F('Department:', employee.department)}
              {F('Designation:', employee.designation)}
              {F('Employee Type:', employee.employeeType)}
              {F('Date of Joining:', employee.dateOfJoining)}
              {F('Work Location:', employee.workLocation)}
              {F('Reporting Manager:', employee.reportingManager)}
              {F('Employee Status:', employee.employeeStatus)}
              {F('Shift Timing:', employee.shiftTiming)}
              {F('Years of Experience:', employee.experience)}
              {F('Employee Category:', employee.employeeCategory)}
            </div>
          </div>
        );
      case 'salary':
        return (
          <div className="profile-section">
            <h2>Salary Details</h2>
            <div className="quick-info">
              {F('Basic Salary:', employee.basicSalary)}
              {F('Bonus:', employee.bonus)}
              {F('CTC:', employee.ctc)}
              {F('PF Applicable:', employee.pfApplicable)}
              {F('PF Number:', employee.pfNumber)}
              {F('ESI Applicable:', employee.esiApplicable)}
              {F('Bank Name:', employee.bankName)}
              {F('Account Number:', employee.accountNumber)}
              {F('IFSC Code:', employee.ifscCode)}
              {F('Branch Name:', employee.branchName)}
            </div>
          </div>
        );
      case 'education':
        return (
          <div className="profile-section">
            <h2>Education Details</h2>
            <div className="quick-info">
              {F('Highest Qualification:', employee.highestQualification)}
              {F('Field of Study:', employee.fieldOfStudy)}
              {F('University/School:', employee.university)}
              {F('Grade/GPA:', employee.grade)}
              {F('Year of Completion:', employee.yearOfCompletion)}
              {F('Certifications:', employee.certifications)}
            </div>
          </div>
        );
      case 'documents':
        return (
          <div className="profile-section">
            <h2>Document Details</h2>
            <div className="quick-info">
              {F('PAN Number:', employee.panNumber)}
              {F('Aadhaar Number:', employee.aadhaarNumber)}
              {F('UAN Number:', employee.uanNumber)}
              {F('Passport Number:', employee.passportNumber)}
              {F('Driving License:', employee.drivingLicense)}
              {F('License Expiry Date:', employee.licenseExpiryDate)}
            </div>
          </div>
        );
      case 'emergency':
        return (
          <div className="profile-section">
            <h2>Emergency Contact Details</h2>
            <div className="quick-info">
              {F('Primary Contact Name:', employee.emergencyContactName)}
              {F('Relationship:', employee.emergencyContactRelation)}
              {F('Phone Number:', employee.emergencyContactPhone)}
              {F('Email:', employee.emergencyContactEmail)}
              {F('Address:', employee.emergencyContactAddress)}
              {F('Secondary Contact Name:', employee.emergencyContactName2)}
              {F('Relationship (2):', employee.emergencyContactRelation2)}
              {F('Phone Number (2):', employee.emergencyContactPhone2)}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="profile-container">
      {/* Header */}
      <header className="profile-header">
        <h1>{isCreateMode ? 'Create Employee' : isAdminView ? 'Employee Details' : 'Employee Profile'}</h1>
        <div className="header-actions">
          <span className="employee-name">{employee.firstName} {employee.lastName}</span>
          {(isAdminView || isCreateMode) && (
            <button className="cancel-btn" onClick={() => navigate('/admin')}>
              Back to Dashboard
            </button>
          )}
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {!isEditing ? (
        // View Mode - show sidebar and view sections; edit button placed below header on right
        <div className="profile-content">
          <aside className="profile-sidebar">
            <div className="sidebar-header">
              <h3>Profile Sections</h3>
            </div>
            <nav className="sidebar-menu">
              {sections.map((section) => (
                <button
                  key={section.id}
                  className={`menu-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="menu-icon">{section.icon}</span>
                  <span className="menu-label">{section.label}</span>
                </button>
              ))}
            </nav>
            <div className="sidebar-footer">
              <p className="section-counter">
                {currentSectionIndex + 1} / {sections.length}
              </p>
            </div>
          </aside>

          <main className="profile-main">
            {canEdit && (
              <div className="edit-button-container">
                <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
              </div>
            )}
            {renderSectionView(activeSection)}
          </main>
        </div>
      ) : (
        // Edit Mode - Sidebar with Sections
        <div className="profile-content">
          {/* Sidebar Menu */}
          <aside className="profile-sidebar">
            <div className="sidebar-header">
              <h3>Profile Sections</h3>
            </div>
            <nav className="sidebar-menu">
              {sections.map((section) => (
                <button
                  key={section.id}
                  className={`menu-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="menu-icon">{section.icon}</span>
                  <span className="menu-label">{section.label}</span>
                </button>
              ))}
            </nav>
            <div className="sidebar-footer">
              <p className="section-counter">
                {currentSectionIndex + 1} / {sections.length}
              </p>
            </div>
          </aside>

          {/* Main Content */}
          <main className="profile-main">
            {/* Personal Details Section */}
            {activeSection === 'personal' && (
              <section className="profile-section">
                <h2>Personal Details</h2>
                <form className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName || ''}
                        onChange={handleInputChange}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName || ''}
                        onChange={handleInputChange}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  {isCreateMode && (
                    <div className="form-row">
                      <div className="form-group">
                        <label>Role *</label>
                        <select
                          name="role"
                          value={formData.role || 'employee'}
                          onChange={handleInputChange}
                        >
                          <option value="employee">Employee</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Password *</label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password || ''}
                          onChange={handleInputChange}
                          placeholder="Set a password"
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                        placeholder="Enter email"
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleInputChange}
                        placeholder="Enter phone"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Alternate Phone</label>
                      <input
                        type="tel"
                        name="alternatePhone"
                        value={formData.alternatePhone || ''}
                        onChange={handleInputChange}
                        placeholder="Enter alternate phone"
                      />
                    </div>
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Gender</label>
                      <select
                        name="gender"
                        value={formData.gender || ''}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Blood Group</label>
                      <select
                        name="bloodGroup"
                        value={formData.bloodGroup || ''}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Marital Status</label>
                      <select
                        name="maritalStatus"
                        value={formData.maritalStatus || ''}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Nationality</label>
                      <input
                        type="text"
                        name="nationality"
                        value={formData.nationality || ''}
                        onChange={handleInputChange}
                        placeholder="Enter nationality"
                      />
                    </div>
                  </div>
                </form>
              </section>
            )}

            {/* Address Details Section */}
            {activeSection === 'address' && (
              <section className="profile-section">
                <h2>Address Details</h2>
                <form className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Permanent Address</label>
                      <textarea
                        name="permanentAddress"
                        value={formData.permanentAddress || ''}
                        onChange={handleInputChange}
                        placeholder="Enter permanent address"
                        rows="3"
                      ></textarea>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Current Address</label>
                      <textarea
                        name="currentAddress"
                        value={formData.currentAddress || ''}
                        onChange={handleInputChange}
                        placeholder="Enter current address"
                        rows="3"
                      ></textarea>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country || ''}
                        onChange={handleInputChange}
                        placeholder="Enter country"
                      />
                    </div>
                    <div className="form-group">
                      <label>State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state || ''}
                        onChange={handleInputChange}
                        placeholder="Enter state"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city || ''}
                        onChange={handleInputChange}
                        placeholder="Enter city"
                      />
                    </div>
                    <div className="form-group">
                      <label>Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode || ''}
                        onChange={handleInputChange}
                        placeholder="Enter pincode"
                      />
                    </div>
                  </div>
                </form>
              </section>
            )}

            {/* Job Details Section */}
            {activeSection === 'job' && (
              <section className="profile-section">
                <h2>Job Details</h2>
                {sectionReadOnly && (
                  <p className="section-note">Job details are not editable in this profile editor.</p>
                )}
                <form className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Department</label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department || ''}
                        onChange={handleInputChange}
                        placeholder="Enter department"
                        disabled={sectionReadOnly}
                      />
                    </div>
                    <div className="form-group">
                      <label>Designation</label>
                      <input
                        type="text"
                        name="designation"
                        value={formData.designation || ''}
                        onChange={handleInputChange}
                        placeholder="Enter designation"
                        disabled={sectionReadOnly}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Employee Type</label>
                      <select
                        name="employeeType"
                        value={formData.employeeType || ''}
                        onChange={handleInputChange}
                        disabled={sectionReadOnly}
                      >
                        <option value="">Select Type</option>
                        <option value="Full Time">Full Time</option>
                        <option value="Part Time">Part Time</option>
                        <option value="Contract">Contract</option>
                        <option value="Temporary">Temporary</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Date of Joining</label>
                      <input
                        type="date"
                        name="dateOfJoining"
                        value={formData.dateOfJoining || ''}
                        onChange={handleInputChange}
                        disabled={sectionReadOnly}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Work Location</label>
                      <input
                        type="text"
                        name="workLocation"
                        value={formData.workLocation || ''}
                        onChange={handleInputChange}
                        placeholder="Enter work location"
                        disabled={sectionReadOnly}
                      />
                    </div>
                    <div className="form-group">
                      <label>Reporting Manager</label>
                      <input
                        type="text"
                        name="reportingManager"
                        value={formData.reportingManager || ''}
                        onChange={handleInputChange}
                        placeholder="Enter reporting manager"
                        disabled={sectionReadOnly}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Employee Status</label>
                      <select
                        name="employeeStatus"
                        value={formData.employeeStatus || ''}
                        onChange={handleInputChange}
                        disabled={sectionReadOnly}
                      >
                        <option value="">Select Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Shift Timing</label>
                      <select
                        name="shiftTiming"
                        value={formData.shiftTiming || ''}
                        onChange={handleInputChange}
                        disabled={sectionReadOnly}
                      >
                        <option value="">Select Shift</option>
                        <option value="Morning">Morning</option>
                        <option value="Evening">Evening</option>
                        <option value="Night">Night</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Years of Experience</label>
                      <input
                        type="number"
                        name="experience"
                        value={formData.experience || ''}
                        onChange={handleInputChange}
                        placeholder="Enter years"
                        disabled={sectionReadOnly}
                      />
                    </div>
                    <div className="form-group">
                      <label>Employee Category</label>
                      <input
                        type="text"
                        name="employeeCategory"
                        value={formData.employeeCategory || ''}
                        onChange={handleInputChange}
                        placeholder="Enter category"
                        disabled={sectionReadOnly}
                      />
                    </div>
                  </div>
                </form>
              </section>
            )}

            {/* Salary Details Section */}
            {activeSection === 'salary' && (
              <section className="profile-section">
                <h2>Salary Details</h2>
                {sectionReadOnly && (
                  <p className="section-note">Salary details are not editable in this profile editor.</p>
                )}
                <form className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Basic Salary</label>
                      <input
                        type="number"
                        name="basicSalary"
                        value={formData.basicSalary || ''}
                        onChange={handleInputChange}
                        placeholder="Enter basic salary"
                        disabled={sectionReadOnly}
                      />
                    </div>
                    <div className="form-group">
                      <label>Bonus</label>
                      <input
                        type="number"
                        name="bonus"
                        value={formData.bonus || ''}
                        onChange={handleInputChange}
                        placeholder="Enter bonus"
                        disabled={sectionReadOnly}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>CTC (Cost to Company)</label>
                      <input
                        type="number"
                        name="ctc"
                        value={formData.ctc || ''}
                        onChange={handleInputChange}
                        placeholder="Enter CTC"
                        disabled={sectionReadOnly}
                      />
                    </div>
                    <div className="form-group">
                      <label>PF Applicable</label>
                      <select
                        name="pfApplicable"
                        value={formData.pfApplicable || ''}
                        onChange={handleInputChange}
                        disabled={sectionReadOnly}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>PF Number</label>
                      <input
                        type="text"
                        name="pfNumber"
                        value={formData.pfNumber || ''}
                        onChange={handleInputChange}
                        placeholder="Enter PF number"
                        disabled={sectionReadOnly}
                      />
                    </div>
                    <div className="form-group">
                      <label>ESI Applicable</label>
                      <select
                        name="esiApplicable"
                        value={formData.esiApplicable || ''}
                        onChange={handleInputChange}
                        disabled={sectionReadOnly}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Bank Name</label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName || ''}
                        onChange={handleInputChange}
                        placeholder="Enter bank name"
                        disabled={sectionReadOnly}
                      />
                    </div>
                    <div className="form-group">
                      <label>Account Number</label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber || ''}
                        onChange={handleInputChange}
                        placeholder="Enter account number"
                        disabled={sectionReadOnly}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>IFSC Code</label>
                      <input
                        type="text"
                        name="ifscCode"
                        value={formData.ifscCode || ''}
                        onChange={handleInputChange}
                        placeholder="Enter IFSC code"
                        disabled={sectionReadOnly}
                      />
                    </div>
                    <div className="form-group">
                      <label>Branch Name</label>
                      <input
                        type="text"
                        name="branchName"
                        value={formData.branchName || ''}
                        onChange={handleInputChange}
                        placeholder="Enter branch name"
                        disabled={sectionReadOnly}
                      />
                    </div>
                  </div>
                </form>
              </section>
            )}

            {/* Education Details Section */}
            {activeSection === 'education' && (
              <section className="profile-section">
                <h2>Education Details</h2>
                <form className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Highest Qualification</label>
                      <input
                        type="text"
                        name="highestQualification"
                        value={formData.highestQualification || ''}
                        onChange={handleInputChange}
                        placeholder="E.g., Bachelor's, Master's"
                      />
                    </div>
                    <div className="form-group">
                      <label>Field of Study</label>
                      <input
                        type="text"
                        name="fieldOfStudy"
                        value={formData.fieldOfStudy || ''}
                        onChange={handleInputChange}
                        placeholder="E.g., Computer Science"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>University/School</label>
                      <input
                        type="text"
                        name="university"
                        value={formData.university || ''}
                        onChange={handleInputChange}
                        placeholder="Enter university name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Grade/GPA</label>
                      <input
                        type="text"
                        name="grade"
                        value={formData.grade || ''}
                        onChange={handleInputChange}
                        placeholder="Enter grade or GPA"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Year of Completion</label>
                      <input
                        type="number"
                        name="yearOfCompletion"
                        value={formData.yearOfCompletion || ''}
                        onChange={handleInputChange}
                        placeholder="YYYY"
                      />
                    </div>
                    <div className="form-group">
                      <label>Certifications</label>
                      <textarea
                        name="certifications"
                        value={formData.certifications || ''}
                        onChange={handleInputChange}
                        placeholder="List any certifications"
                        rows="2"
                      ></textarea>
                    </div>
                  </div>
                </form>
              </section>
            )}

            {/* Document Details Section */}
            {activeSection === 'documents' && (
              <section className="profile-section">
                <h2>Document Details</h2>
                <form className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>PAN Number</label>
                      <input
                        type="text"
                        name="panNumber"
                        value={formData.panNumber || ''}
                        onChange={handleInputChange}
                        placeholder="Enter PAN number"
                      />
                    </div>
                    <div className="form-group">
                      <label>Aadhaar Number</label>
                      <input
                        type="text"
                        name="aadhaarNumber"
                        value={formData.aadhaarNumber || ''}
                        onChange={handleInputChange}
                        placeholder="Enter Aadhaar number"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>UAN Number</label>
                      <input
                        type="text"
                        name="uanNumber"
                        value={formData.uanNumber || ''}
                        onChange={handleInputChange}
                        placeholder="Enter UAN number"
                      />
                    </div>
                    <div className="form-group">
                      <label>Passport Number</label>
                      <input
                        type="text"
                        name="passportNumber"
                        value={formData.passportNumber || ''}
                        onChange={handleInputChange}
                        placeholder="Enter passport number"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Driving License</label>
                      <input
                        type="text"
                        name="drivingLicense"
                        value={formData.drivingLicense || ''}
                        onChange={handleInputChange}
                        placeholder="Enter driving license number"
                      />
                    </div>
                    <div className="form-group">
                      <label>License Expiry Date</label>
                      <input
                        type="date"
                        name="licenseExpiryDate"
                        value={formData.licenseExpiryDate || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </form>
              </section>
            )}

            {/* Emergency Contact Section */}
            {activeSection === 'emergency' && (
              <section className="profile-section">
                <h2>Emergency Contact Details</h2>
                <form className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Primary Contact Name</label>
                      <input
                        type="text"
                        name="emergencyContactName"
                        value={formData.emergencyContactName || ''}
                        onChange={handleInputChange}
                        placeholder="Enter contact name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Relationship</label>
                      <select
                        name="emergencyContactRelation"
                        value={formData.emergencyContactRelation || ''}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Relationship</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Child">Child</option>
                        <option value="Friend">Friend</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        name="emergencyContactPhone"
                        value={formData.emergencyContactPhone || ''}
                        onChange={handleInputChange}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        name="emergencyContactEmail"
                        value={formData.emergencyContactEmail || ''}
                        onChange={handleInputChange}
                        placeholder="Enter email"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Address</label>
                      <textarea
                        name="emergencyContactAddress"
                        value={formData.emergencyContactAddress || ''}
                        onChange={handleInputChange}
                        placeholder="Enter address"
                        rows="3"
                      ></textarea>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Secondary Contact Name</label>
                      <input
                        type="text"
                        name="emergencyContactName2"
                        value={formData.emergencyContactName2 || ''}
                        onChange={handleInputChange}
                        placeholder="Enter secondary contact name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Relationship</label>
                      <select
                        name="emergencyContactRelation2"
                        value={formData.emergencyContactRelation2 || ''}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Relationship</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Child">Child</option>
                        <option value="Friend">Friend</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        name="emergencyContactPhone2"
                        value={formData.emergencyContactPhone2 || ''}
                        onChange={handleInputChange}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </form>
              </section>
            )}

            {/* Navigation Buttons */}
            <div className="section-navigation">
              <button
                className="nav-btn prev-btn"
                onClick={goToPreviousSection}
                disabled={!canGoPrevious}
              >
                ← Previous
              </button>
              <span className="section-info">
                {sections[currentSectionIndex].label} ({currentSectionIndex + 1}/{sections.length})
              </span>
              <button
                className="nav-btn next-btn"
                onClick={goToNextSection}
                disabled={!canGoNext}
              >
                Next →
              </button>
            </div>

            <div className="edit-actions">
              <button type="button" className="cancel-btn" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="save-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

export default EmployeeProfile;
