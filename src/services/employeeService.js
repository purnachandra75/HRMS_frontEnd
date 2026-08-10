import axios from 'axios';

const API_ROOT = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const API_BASE_URL = `${API_ROOT}/api/employees`;

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
    workStatus: employee.jobDetails?.workStatus || 'Bench',
    currentProjectName: employee.jobDetails?.currentProjectName || '',
    currentProjectManager: employee.jobDetails?.currentProjectManager || '',
    currentProjectStartDate: employee.jobDetails?.currentProjectStartDate || '',

    projectHistory: Array.isArray(employee.projectHistory)
      ? employee.projectHistory.map((entry) => ({
          id: entry.id,
          projectName: entry.projectName || '',
          projectManager: entry.projectManager || '',
          startDate: entry.startDate || '',
          endDate: entry.endDate || '',
        }))
      : [],

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

    resumeUpload:
      employee.documentDetails?.resumeUploadName ||
      employee.documentDetails?.resumeUpload ||
      employee.resumeUploadName ||
      employee.resumeUpload ||
      '',
    idProofUpload:
      employee.documentDetails?.idProofUploadName ||
      employee.documentDetails?.idProofUpload ||
      employee.idProofUploadName ||
      employee.idProofUpload ||
      '',
    addressProofUpload:
      employee.documentDetails?.addressProofUploadName ||
      employee.documentDetails?.addressProofUpload ||
      employee.addressProofUploadName ||
      employee.addressProofUpload ||
      '',
    educationalCertificates:
      employee.documentDetails?.educationalCertificatesName ||
      employee.documentDetails?.educationalCertificates ||
      employee.educationalCertificatesName ||
      employee.educationalCertificates ||
      '',
    experienceCertificates:
      employee.documentDetails?.experienceCertificatesName ||
      employee.documentDetails?.experienceCertificates ||
      employee.experienceCertificatesName ||
      employee.experienceCertificates ||
      '',
    passportPhoto:
      employee.documentDetails?.passportPhotoName ||
      employee.documentDetails?.passportPhoto ||
      employee.passportPhotoName ||
      employee.passportPhoto ||
      '',
    tenthCertificate:
      employee.documentDetails?.tenthCertificateName ||
      employee.documentDetails?.tenthCertificate ||
      employee.tenthCertificateName ||
      employee.tenthCertificate ||
      '',
    intermediateMarksheet:
      employee.documentDetails?.intermediateMarksheetName ||
      employee.documentDetails?.intermediateMarksheet ||
      employee.intermediateMarksheetName ||
      employee.intermediateMarksheet ||
      '',
    provisionalCertificate:
      employee.documentDetails?.provisionalCertificateName ||
      employee.documentDetails?.provisionalCertificate ||
      employee.provisionalCertificateName ||
      employee.provisionalCertificate ||
      '',
    originalDegree:
      employee.documentDetails?.originalDegreeName ||
      employee.documentDetails?.originalDegree ||
      employee.originalDegreeName ||
      employee.originalDegree ||
      '',
    aadhaarUpload:
      employee.documentDetails?.aadhaarUploadName ||
      employee.documentDetails?.aadhaarUpload ||
      employee.aadhaarUploadName ||
      employee.aadhaarUpload ||
      '',
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
    workStatus: profileData.workStatus || null,
    currentProjectName: profileData.workStatus === 'Project' ? (profileData.currentProjectName || null) : null,
    currentProjectManager: profileData.workStatus === 'Project' ? (profileData.currentProjectManager || null) : null,
    currentProjectStartDate: profileData.workStatus === 'Project' ? (profileData.currentProjectStartDate || null) : null,
  },
  projectHistory: Array.isArray(profileData.projectHistory)
    ? profileData.projectHistory
        .filter((entry) => (entry.projectName || '').trim() || (entry.projectManager || '').trim())
        .map((entry) => ({
          projectName: entry.projectName || null,
          projectManager: entry.projectManager || null,
          startDate: entry.startDate || null,
          endDate: entry.endDate || null,
        }))
    : [],
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
});

const normalizeDepartment = (department) => {
  if (!department) return null;
  const value = department.trim();
  if (/^non\s*it$/i.test(value)) return 'Non IT';
  if (/^it$/i.test(value)) return 'IT';
  if (/^hr$/i.test(value)) return 'HR';
  if (/^admin$/i.test(value)) return 'Admin';
  return value;
};

const normalizeStatus = (status) => {
  if (!status) return null;
  const lower = status.trim().toLowerCase();
  if (lower === 'active') return 'Active';
  if (lower === 'inactive') return 'Inactive';
  return status.trim();
};

export const getEmployeesPage = async ({ page = 1, size = 2, department = '', employeeType = '', status = '', searchQuery = '', joinedFrom = '', joinedTo = '' }) => {
  const params = {
    page: Math.max(0, page - 1),
    size,
  };

  const normalizedDepartment = normalizeDepartment(department);
  const normalizedStatus = normalizeStatus(status);
  const trimmedEmployeeType = employeeType ? employeeType.trim() : '';

  if (normalizedDepartment) params.department = normalizedDepartment;
  if (trimmedEmployeeType) params.employeeType = trimmedEmployeeType;
  if (normalizedStatus) params.status = normalizedStatus;
  if (joinedFrom) params.joinedFrom = joinedFrom;
  if (joinedTo) params.joinedTo = joinedTo;

  let requestUrl = API_BASE_URL;
  if (searchQuery) {
    requestUrl = `${API_ROOT}/api/employee/getemployee`;
    params.search = searchQuery.trim();
  }

  console.debug('[employeeService] getEmployeesPage', requestUrl, params);
  const response = await axios.get(requestUrl, { params });
  const data = response.data;

  let employees = [];
  let total = null;
  let pageSize = size;
  let totalPages = null;

  if (Array.isArray(data)) {
    employees = data.map(flattenEmployee);
  } else {
    if (Array.isArray(data.content)) {
      employees = data.content.map(flattenEmployee);
    } else if (Array.isArray(data.employees)) {
      employees = data.employees.map(flattenEmployee);
    }

    total = data.totalElements ?? data.total ?? data.totalCount ?? data.totalEmployees ?? null;
    pageSize = data.size ?? data.pageable?.pageSize ?? size;
    totalPages = data.totalPages ?? data.pageable?.totalPages ?? (total !== null ? Math.ceil(total / pageSize) : null);
  }

  return { employees, total, pageSize, totalPages };
};

export const getAllEmployees = async () => {
  const allEmployees = [];
  let page = 0;
  let lastPage = false;

  while (!lastPage) {
    const response = await axios.get(API_BASE_URL, {
      params: {
        page,
        size: 1000,
      },
    });
    const data = response.data;

    if (Array.isArray(data)) {
      return data.map(flattenEmployee);
    }

    const pageItems = Array.isArray(data.content)
      ? data.content
      : Array.isArray(data.employees)
      ? data.employees
      : [];

    allEmployees.push(...pageItems.map(flattenEmployee));

    lastPage = data.last === true || pageItems.length === 0;
    page += 1;

    if (page > 50) {
      break;
    }
  }

  return allEmployees;
};

export const getEmployeeById = async (employeeId) => {
  const response = await axios.get(`${API_BASE_URL}/${employeeId}`);
  return flattenEmployee(response.data);
};

export const getEmployeeProfile = async (userId) => getEmployeeById(userId);

export const uploadEmployeeDocument = async (employeeId, fieldName, file) => {
  const docType = mapFieldNameToDocType(fieldName);
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_BASE_URL}/${employeeId}/document/${docType}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

const mapFieldNameToDocType = (fieldName) => {
  const mapping = {
    resumeUpload: 'resume',
    idProofUpload: 'idproof',
    addressProofUpload: 'addressproof',
    educationalCertificates: 'education',
    experienceCertificates: 'experience',
    passportPhoto: 'passport',
    tenthCertificate: 'tenthCertificate',
    intermediateMarksheet: 'intermediateMarksheet',
    provisionalCertificate: 'provisionalCertificate',
    originalDegree: 'originalDegree',
    aadhaarUpload: 'aadhaarUpload',
  };
  return mapping[fieldName] || fieldName;
};

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

