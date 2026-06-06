# Quick Reference - All Form Fields

## Field Reference by Section

### 📋 SECTION 1: PERSONAL INFORMATION (12 fields)
```
employeeId          → Employee ID (text)
firstName           → First Name (text) *required
lastName            → Last Name (text)
email               → Email Address (email) *required
phone               → Mobile Number (tel)
alternatePhone      → Alternate Mobile (tel)
gender              → Gender (select: Male/Female/Other)
dateOfBirth         → Date of Birth (date)
bloodGroup          → Blood Group (select: O+, O-, A+, A-, B+, B-, AB+, AB-)
maritalStatus       → Marital Status (select: Single/Married/Divorced/Widowed)
nationality         → Nationality (text)
profilePhoto        → Profile Photo (file upload)
```

---

### 🏠 SECTION 2: ADDRESS DETAILS (6 fields)
```
permanentAddress    → Permanent Address (textarea)
currentAddress      → Current Address (textarea)
country             → Country (text)
state               → State/Province (text)
city                → City (text)
pincode             → Postal/ZIP Code (text)
```

---

### 💼 SECTION 3: EMPLOYMENT DETAILS (10 fields)
```
department          → Department (text)
designation         → Designation/Job Title (text)
employeeType        → Employee Type (radio: Full Time/Part Time/Contract/Intern)
dateOfJoining       → Date of Joining (date)
workLocation        → Work Location (text)
reportingManager    → Reporting Manager (text)
employeeStatus      → Employee Status (select: Active/Inactive/On Leave/Terminated)
shiftTiming         → Shift Timing (select: Morning/Afternoon/Evening/Night/Flexible)
experience          → Years of Experience (text)
employeeCategory    → Employee Category (text)
```

---

### 💰 SECTION 4: SALARY DETAILS (13 fields)
```
basicSalary         → Basic Salary (text - number)
bonus               → Bonus Amount (text - number)
ctc                 → CTC - Cost to Company (text - number)
pfApplicable        → PF Applicable (radio: Yes/No)
pfNumber            → PF Account Number (text)
esiApplicable       → ESI Applicable (radio: Yes/No)
bankName            → Bank Name (text)
accountNumber       → Bank Account Number (text)
ifscCode            → IFSC Code (text)
branchName          → Bank Branch Name (text)
panNumber           → PAN Number (text - tax ID)
aadhaarNumber       → Aadhaar Number (text - government ID)
uanNumber           → UAN Number (text - PF ID)
```

---

### 🎓 SECTION 5: EDUCATION DETAILS (4 fields)
```
highestQualification → Highest Qualification (select: 10th/12th/Diploma/Bachelor's/Master's/PhD)
universityCollege    → University/College Name (text)
yearOfPassing        → Year of Passing (text - year)
percentageCGPA       → Percentage/CGPA (text - decimal)
```

---

### 🚨 SECTION 6: EMERGENCY CONTACT DETAILS (5 fields)
```
emergencyContactName      → Emergency Contact Name (text)
relationship              → Relationship (text)
emergencyContactNumber    → Emergency Contact Number (tel)
emergencyAlternateNumber  → Alternate Contact Number (tel)
emergencyAddress          → Emergency Address (textarea)
```

---

### 📄 SECTION 7: DOCUMENT DETAILS (6 fields - File Uploads)
```
resumeUpload              → Resume/CV (.pdf, .doc, .docx)
idProofUpload             → ID Proof (.pdf, .jpg, .png)
addressProofUpload        → Address Proof (.pdf, .jpg, .png)
educationalCertificates   → Educational Certificates (.pdf)
experienceCertificates    → Experience Certificates (.pdf)
passportPhoto             → Passport Photo (.jpg, .png, .gif)
```

---

### 🔐 SECTION 8: SYSTEM ACCESS DETAILS (4 fields)
```
username                  → Username (text)
role                      → Role (select: employee/admin) - Read-only
loginAccess               → Login Access (radio: enable/disable)
```

---

## Field Types Reference

### Input Types Used

**Text Input**
```javascript
<input type="text" name="firstName" />
```
Fields: firstName, lastName, phone, department, designation, reportingManager, workLocation, experience, employeeCategory, city, state, country, nationality, basicSalary, bonus, ctc, bankName, accountNumber, ifscCode, branchName, panNumber, aadhaarNumber, uanNumber, pfNumber, yearOfPassing, percentageCGPA, emergencyContactName, relationship, username

**Email Input**
```javascript
<input type="email" name="email" />
```
Fields: email

**Telephone Input**
```javascript
<input type="tel" name="phone" />
```
Fields: phone, alternatePhone, emergencyContactNumber, emergencyAlternateNumber

**Date Input**
```javascript
<input type="date" name="dateOfBirth" />
```
Fields: dateOfBirth, dateOfJoining

**Select (Dropdown)**
```javascript
<select name="gender">
  <option value="Male">Male</option>
  <option value="Female">Female</option>
  <option value="Other">Other</option>
</select>
```
Fields: gender, bloodGroup, maritalStatus, employeeStatus, shiftTiming, highestQualification, role

**Radio Buttons**
```javascript
<input type="radio" name="employeeType" value="Full Time" />
```
Fields: employeeType, pfApplicable, esiApplicable, loginAccess

**Textarea**
```javascript
<textarea name="permanentAddress"></textarea>
```
Fields: permanentAddress, currentAddress, emergencyAddress

**File Upload**
```javascript
<input type="file" name="resumeUpload" />
```
Fields: resumeUpload, idProofUpload, addressProofUpload, educationalCertificates, experienceCertificates, passportPhoto, profilePhoto

---

## Field Access by User Role

### 👤 Employee Can:
- ✅ View all 8 sections
- ✅ Edit all personal fields
- ✅ Upload documents
- ✅ View employment details
- ❌ Cannot edit employment details (admin only)
- ❌ Cannot edit system access

### 👨‍💼 Admin Can:
- ✅ View all employee fields
- ✅ Edit key sections in modal:
  - Personal Information
  - Employment Details
  - Address Details
  - Salary Details
  - Education Details
  - Emergency Contact
- ✅ Delete employees
- ❌ Cannot edit full document section in modal

---

## Default Values & Options

### Dropdown Options

**Gender**
- Male
- Female
- Other

**Blood Group**
- O+, O-
- A+, A-
- B+, B-
- AB+, AB-

**Marital Status**
- Single
- Married
- Divorced
- Widowed

**Employee Type**
- Full Time
- Part Time
- Contract
- Intern

**Employee Status**
- Active
- Inactive
- On Leave
- Terminated

**Shift Timing**
- Morning
- Afternoon
- Evening
- Night
- Flexible

**Highest Qualification**
- 10th
- 12th
- Diploma
- Bachelor's
- Master's
- PhD

**Role**
- employee (default)
- admin

**Login Access**
- enable (default)
- disable

---

## Validation Rules

### Required Fields (Mandatory)
- `firstName` - Must not be empty
- `email` - Valid email format required

### Optional Fields
- All other fields are optional

### Field Formats
- **Phone**: Accepts various phone formats
- **Email**: Must be valid email format
- **Date**: YYYY-MM-DD format
- **Pincode**: Any numeric or alphanumeric value
- **Salary**: Numeric values only
- **Experience**: Numeric values (years)

---

## Data Storage Structure

### JavaScript Object
```javascript
{
  // Personal Information
  employeeId: "2",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "555-1234",
  // ... continues for all 60+ fields
}
```

### Local Storage (Login State)
```javascript
{
  id: 2,
  role: "employee",
  name: "John Doe"
}
```

---

## API Integration Template

### Update Endpoint
```javascript
PATCH /api/employees/{employeeId}
Content-Type: application/json

{
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  // ... all fields
}
```

### Response
```javascript
{
  success: true,
  message: "Employee updated successfully",
  employee: { /* updated data */ }
}
```

---

## Common Operations

### Get All Fields for Display
```javascript
const allFields = Object.keys(profileData);
// Returns: [employeeId, firstName, lastName, email, ...]
```

### Check If Field Is Updated
```javascript
if (newData[fieldName] !== oldData[fieldName]) {
  // Field was updated
}
```

### Build Form FormData
```javascript
const formData = new FormData();
Object.keys(profileData).forEach(key => {
  if (profileData[key]) {
    formData.append(key, profileData[key]);
  }
});
```

---

## Field Statistics

| Metric | Count |
|--------|-------|
| Total Fields | 60+ |
| Total Sections | 8 |
| Text Fields | 35+ |
| Dropdown Fields | 7 |
| Radio Button Groups | 4 |
| Textarea Fields | 3 |
| Date Fields | 2 |
| File Upload Fields | 6 |
| Required Fields | 2 |
| Optional Fields | 58+ |

---

## Quick Copy-Paste: State Initialization

```javascript
const [profileData, setProfileData] = useState({
  // Personal Information
  employeeId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  alternatePhone: '',
  gender: '',
  dateOfBirth: '',
  bloodGroup: '',
  maritalStatus: '',
  nationality: '',
  profilePhoto: '',
  password: '',
  confirmPassword: '',

  // Address Details
  permanentAddress: '',
  currentAddress: '',
  country: '',
  state: '',
  city: '',
  pincode: '',

  // Employment Details
  department: '',
  designation: '',
  employeeType: '',
  dateOfJoining: '',
  workLocation: '',
  reportingManager: '',
  employeeStatus: '',
  shiftTiming: '',
  experience: '',
  employeeCategory: '',

  // Salary Details
  basicSalary: '',
  bonus: '',
  ctc: '',
  pfApplicable: '',
  pfNumber: '',
  esiApplicable: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  branchName: '',
  panNumber: '',
  aadhaarNumber: '',
  uanNumber: '',

  // Education Details
  highestQualification: '',
  universityCollege: '',
  yearOfPassing: '',
  percentageCGPA: '',

  // Emergency Contact Details
  emergencyContactName: '',
  relationship: '',
  emergencyContactNumber: '',
  emergencyAlternateNumber: '',
  emergencyAddress: '',

  // Document Details
  resumeUpload: '',
  idProofUpload: '',
  addressProofUpload: '',
  educationalCertificates: '',
  experienceCertificates: '',
  passportPhoto: '',

  // System Access Details
  username: '',
  role: 'employee',
  loginAccess: 'enable',
});
```

---

## Troubleshooting

### Field Not Showing in Form?
1. Check state has field name
2. Check field name in input/select match
3. Check field name spelling

### File Upload Not Working?
1. Check file type allowed in accept attribute
2. Check handleFileChange function called
3. Check file size limits

### Dropdown Not Showing Options?
1. Check all option values are strings
2. Check select element has correct name attribute
3. Check onChange handler properly bound

### Data Not Saving?
1. Check updateEmployeeProfile function called
2. Check form submit handler preventing default
3. Check all required fields filled
4. Check console for errors

---

**Reference Version**: 2.0  
**Last Updated**: June 1, 2026  
**Total Fields Documented**: 60+
