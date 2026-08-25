import axios from 'axios';

const API_ROOT = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const API_BASE_URL = `${API_ROOT}/api/projects`;

export const getOrgHierarchy = async () => {
  const response = await axios.get(`${API_BASE_URL}/hierarchy`);
  return response.data;
};

export const getProjects = async () => {
  const response = await axios.get(API_BASE_URL);
  return response.data;
};

export const getProject = async (projectId) => {
  const response = await axios.get(`${API_BASE_URL}/${projectId}`);
  return response.data;
};

export const createProject = async (project) => {
  const response = await axios.post(API_BASE_URL, project);
  return response.data;
};

export const updateProject = async (projectId, project) => {
  const response = await axios.put(`${API_BASE_URL}/${projectId}`, project);
  return response.data;
};

export const updateProjectStatus = async (projectId, status) => {
  const response = await axios.patch(`${API_BASE_URL}/${projectId}/status`, { status });
  return response.data;
};

export const deleteProject = async (projectId) => {
  const response = await axios.delete(`${API_BASE_URL}/${projectId}`);
  return response.data;
};

export const addProjectMember = async (projectId, member) => {
  const response = await axios.post(`${API_BASE_URL}/${projectId}/members`, member);
  return response.data;
};

export const updateProjectMember = async (projectId, membershipId, member) => {
  const response = await axios.put(`${API_BASE_URL}/${projectId}/members/${membershipId}`, member);
  return response.data;
};

export const removeProjectMember = async (projectId, membershipId) => {
  const response = await axios.delete(`${API_BASE_URL}/${projectId}/members/${membershipId}`);
  return response.data;
};

export const getEligibleManagers = async () => {
  const response = await axios.get(`${API_BASE_URL}/eligible-managers`);
  return response.data;
};

export const getEligibleTeamLeads = async () => {
  const response = await axios.get(`${API_BASE_URL}/eligible-team-leads`);
  return response.data;
};
