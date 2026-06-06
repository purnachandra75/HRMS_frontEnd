import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/employees';

const flattenEmployee = (employee) => {
  if (!employee) return null;

  return {
    id: employee.empId ?? employee.id,
    firstName: employee.firstName || '',
    lastName: employee.lastName || '',
    email: employee.email || '',
    phone: employee.phone || '',
    alternatePhone: employee.alternatePhone || '',
    gender: employee.gender || '',
    dateOfBirth: employee.dateOfBirth || '',
    bloodGroup: employee.bloodGroup || '',
    maritalStatus: employee.maritalStatus || '',
    nationality: employee.nationality || '',
    profilePhoto: employee.profilePhoto || '',

    permanentAddress: employee.addressDetails?.permanentAddress || '',
    currentAddress: employee.addressDetails?.currentAddress || '',
    country: employee.addressDetails?.country || '',
    state: employee.addressDetails?.state || '',
    city: employee.addressDetails?.city || '',
    pincode: employee.addressDetails?.pincode || '',

    department: employee.jobDetails?.department || '',
    designation: employee.jobDetails?.designation || '',
    employeeType: employee.jobDetails?.employeeType || '',
    dateOfJoining: employee.jobDetails?.dateOfJoining || '',
    workLocation: employee.jobDetails?.workLocation || '',
    reportingManager: employee.jobDetails?.reportingManager || '',
    employeeStatus: employee.jobDetails?.employeeStatus || '',
    shiftTiming: employee.jobDetails?.shiftTiming || '',
    experience: employee.jobDetails?.experience || '',
    employeeCategory: employee.jobDetails?.employeeCategory || '',

    basicSalary: employee.salaryDetails?.basicSalary || '',
    bonus: employee.salaryDetails?.bonus || '',
    ctc: employee.salaryDetails?.ctc || '',
    pfApplicable: employee.salaryDetails?.pfApplicable || '',
    pfNumber: employee.salaryDetails?.pfNumber || '',
    esiApplicable: employee.salaryDetails?.esiApplicable || '',
    bankName: employee.salaryDetails?.bankName || '',
    accountNumber: employee.salaryDetails?.accountNumber || '',
    ifscCode: employee.salaryDetails?.ifscCode || '',
    branchName: employee.salaryDetails?.branchName || '',
    panNumber: employee.salaryDetails?.panNumber || '',
    aadhaarNumber: employee.salaryDetails?.aadhaarNumber || '',
    uanNumber: employee.salaryDetails?.uanNumber || '',
    role: employee.role || 'employee',

    highestQualification: employee.educationDetails?.highestQualification || '',
    universityCollege: employee.educationDetails?.universityCollege || '',
    yearOfPassing: employee.educationDetails?.yearOfPassing || '',
    percentageCGPA: employee.educationDetails?.percentageCGPA || '',

    emergencyContactName: employee.emergencyContact?.emergencyContactName || '',
    relationship: employee.emergencyContact?.relationship || '',
    emergencyContactNumber: employee.emergencyContact?.emergencyContactNumber || '',
    emergencyAlternateNumber: employee.emergencyContact?.emergencyAlternateNumber || '',
    emergencyAddress: employee.emergencyContact?.emergencyAddress || '',

    resumeUpload: employee.documentDetails?.resumeUpload || '',
    idProofUpload: employee.documentDetails?.idProofUpload || '',
    addressProofUpload: employee.documentDetails?.addressProofUpload || '',
    educationalCertificates: employee.documentDetails?.educationalCertificates || '',
    experienceCertificates: employee.documentDetails?.experienceCertificates || '',
    passportPhoto: employee.documentDetails?.passportPhoto || '',
  };
};

const buildEmployeePayload = (profileData) => ({
  firstName: profileData.firstName || null,
  lastName: profileData.lastName || null,
  email: profileData.email || null,
  phone: profileData.phone || null,
  alternatePhone: profileData.alternatePhone || null,
  gender: profileData.gender || null,
  dateOfBirth: profileData.dateOfBirth || null,
  bloodGroup: profileData.bloodGroup || null,
  maritalStatus: profileData.maritalStatus || null,
  nationality: profileData.nationality || null,
  profilePhoto: profileData.profilePhoto || null,
  addressDetails: {
    permanentAddress: profileData.permanentAddress || null,
    currentAddress: profileData.currentAddress || null,
    country: profileData.country || null,
    state: profileData.state || null,
    city: profileData.city || null,
    pincode: profileData.pincode || null,
  },
  role: profileData.role || 'employee',
  password: profileData.password || null,
  jobDetails: {
    department: profileData.department || null,
    designation: profileData.designation || null,
    employeeType: profileData.employeeType || null,
    dateOfJoining: profileData.dateOfJoining || null,
    workLocation: profileData.workLocation || null,
    reportingManager: profileData.reportingManager || null,
    employeeStatus: profileData.employeeStatus || null,
    shiftTiming: profileData.shiftTiming || null,
    experience: profileData.experience || null,
    employeeCategory: profileData.employeeCategory || null,
  },
  salaryDetails: {
    basicSalary: profileData.basicSalary || null,
    bonus: profileData.bonus || null,
    ctc: profileData.ctc || null,
    pfApplicable: profileData.pfApplicable || null,
    pfNumber: profileData.pfNumber || null,
    esiApplicable: profileData.esiApplicable || null,
    bankName: profileData.bankName || null,
    accountNumber: profileData.accountNumber || null,
    ifscCode: profileData.ifscCode || null,
    branchName: profileData.branchName || null,
    panNumber: profileData.panNumber || null,
    aadhaarNumber: profileData.aadhaarNumber || null,
    uanNumber: profileData.uanNumber || null,
  },
  educationDetails: {
    highestQualification: profileData.highestQualification || null,
    universityCollege: profileData.universityCollege || null,
    yearOfPassing: profileData.yearOfPassing || null,
    percentageCGPA: profileData.percentageCGPA || null,
  },
  emergencyContact: {
    emergencyContactName: profileData.emergencyContactName || null,
    relationship: profileData.relationship || null,
    emergencyContactNumber: profileData.emergencyContactNumber || null,
    emergencyAlternateNumber: profileData.emergencyAlternateNumber || null,
    emergencyAddress: profileData.emergencyAddress || null,
  },
  documentDetails: {
    resumeUpload: profileData.resumeUpload || null,
    idProofUpload: profileData.idProofUpload || null,
    addressProofUpload: profileData.addressProofUpload || null,
    educationalCertificates: profileData.educationalCertificates || null,
    experienceCertificates: profileData.experienceCertificates || null,
    passportPhoto: profileData.passportPhoto || null,
  },
});

export const getAllEmployees = async () => {
  const response = await axios.get(API_BASE_URL);
  return response.data.map(flattenEmployee);
};

export const getEmployeeById = async (employeeId) => {
  const response = await axios.get(`${API_BASE_URL}/${employeeId}`);
  return flattenEmployee(response.data);
};

export const getEmployeeProfile = async (userId) => getEmployeeById(userId);

export const updateEmployeeProfile = async (userId, profileData) => {
  const payload = buildEmployeePayload(profileData);
  const response = await axios.put(`${API_BASE_URL}/${userId}`, payload);
  return {
    success: true,
    message: 'Profile updated successfully',
    employee: flattenEmployee(response.data),
  };
};

export const createEmployee = async (profileData) => {
  const payload = buildEmployeePayload(profileData);
  const response = await axios.post(API_BASE_URL, payload);
  return {
    success: true,
    message: 'Employee created successfully',
    employee: flattenEmployee(response.data),
  };
};

export const deleteEmployee = async (employeeId) => {
  await axios.delete(`${API_BASE_URL}/${employeeId}`);
  return { success: true, message: 'Employee deleted successfully' };
};

