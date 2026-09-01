import { apiFetch } from '../utils/apiClient';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const parseErrorMessage = async (response, fallback) => {
  try {
    const errorData = await response.json();
    return errorData.message || errorData.error || fallback;
  } catch (e) {
    return fallback;
  }
};

// Employee's own tickets.
export const getMyTickets = async () => {
  const response = await apiFetch(`${API_BASE_URL}/api/tickets/my`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Failed to load tickets'));
  }
  return response.json();
};

export const createTicket = async ({ subject, description }) => {
  const response = await apiFetch(`${API_BASE_URL}/api/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, description }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Failed to raise ticket'));
  }
  return response.json();
};

// Client admin's view - scoped server-side to the admin's own client.
export const getClientTickets = async () => {
  const response = await apiFetch(`${API_BASE_URL}/api/tickets`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Failed to load tickets'));
  }
  return response.json();
};

export const updateTicketStatus = async (ticketId, { status, adminResponse }) => {
  const response = await apiFetch(`${API_BASE_URL}/api/tickets/${ticketId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, adminResponse }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Failed to update ticket'));
  }
  return response.json();
};
