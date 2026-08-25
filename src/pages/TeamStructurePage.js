import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getAllEmployees } from '../services/employeeService';
import {
  getOrgHierarchy,
  getProjects,
  getProject,
  createProject,
  updateProjectStatus,
  deleteProject,
  addProjectMember,
  updateProjectMember,
  removeProjectMember,
} from '../services/projectService';
import '../styles/Dashboard.css';
import '../styles/Leave.css';
import '../styles/TeamStructure.css';

const employeeName = (emp) => `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || `Employee #${emp.id}`;

function TeamStructurePage({ userName, onLogout }) {
  const [hierarchy, setHierarchy] = useState({ projects: [], bench: [] });
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [projectDetail, setProjectDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [newProject, setNewProject] = useState({ name: '', description: '', projectManagerId: '' });
  const [memberForm, setMemberForm] = useState({ employeeId: '', teamLeadId: '' });

  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [hierarchyData, projectList, employeeList] = await Promise.all([
        getOrgHierarchy(),
        getProjects(),
        getAllEmployees(),
      ]);
      const nextHierarchy = hierarchyData || { projects: [], bench: [] };
      setHierarchy(nextHierarchy);
      setProjects(projectList || []);
      setEmployees(employeeList || []);

      // Keep the current selection if it's still around; otherwise default to the first
      // active project (falling back to the first project of any status) so the org chart
      // isn't blank on first load.
      setSelectedProjectId((prevId) => {
        const stillExists = (nextHierarchy.projects || []).some((p) => p.id === prevId);
        if (stillExists) return prevId;
        const firstActive = (nextHierarchy.projects || []).find((p) => (p.status || 'Active') !== 'Completed');
        const fallback = firstActive || (nextHierarchy.projects || [])[0];
        return fallback ? fallback.id : null;
      });
    } catch (err) {
      console.error('Failed to load team structure', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refreshExpandedProject = async (projectId) => {
    const detail = await getProject(projectId);
    setProjectDetail(detail);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) {
      alert('Project name is required');
      return;
    }
    try {
      await createProject({
        name: newProject.name.trim(),
        description: newProject.description || null,
        projectManagerId: newProject.projectManagerId ? Number(newProject.projectManagerId) : null,
      });
      setNewProject({ name: '', description: '', projectManagerId: '' });
      await loadAll();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to create project');
    }
  };

  const handleToggleStatus = async (project) => {
    const nextStatus = project.status === 'Completed' ? 'Active' : 'Completed';
    try {
      await updateProjectStatus(project.id, nextStatus);
      await loadAll();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to update project status');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Delete this project? This removes all its member assignments.')) return;
    try {
      await deleteProject(id);
      if (expandedProjectId === id) {
        setExpandedProjectId(null);
        setProjectDetail(null);
      }
      await loadAll();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to delete project');
    }
  };

  const toggleExpand = async (id) => {
    if (expandedProjectId === id) {
      setExpandedProjectId(null);
      setProjectDetail(null);
      return;
    }
    setExpandedProjectId(id);
    setMemberForm({ employeeId: '', teamLeadId: '' });
    setDetailLoading(true);
    try {
      const detail = await getProject(id);
      setProjectDetail(detail);
    } catch (err) {
      console.error('Failed to load project detail', err);
      setProjectDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberForm.employeeId) {
      alert('Choose an employee to add');
      return;
    }
    try {
      await addProjectMember(expandedProjectId, {
        employeeId: Number(memberForm.employeeId),
        teamLeadId: memberForm.teamLeadId ? Number(memberForm.teamLeadId) : null,
      });
      setMemberForm({ employeeId: '', teamLeadId: '' });
      await refreshExpandedProject(expandedProjectId);
      await loadAll();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to add member');
    }
  };

  const handleChangeTeamLead = async (membershipId, teamLeadId) => {
    try {
      await updateProjectMember(expandedProjectId, membershipId, {
        teamLeadId: teamLeadId ? Number(teamLeadId) : null,
      });
      await refreshExpandedProject(expandedProjectId);
      await loadAll();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to update reporting line');
    }
  };

  const handleRemoveMember = async (membershipId) => {
    if (!window.confirm('Remove this person from the project? They will move back to the bench if this was their only project.')) return;
    try {
      await removeProjectMember(expandedProjectId, membershipId);
      await refreshExpandedProject(expandedProjectId);
      await loadAll();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to remove member');
    }
  };

  const currentMembers = projectDetail?.members || [];
  const openMembers = currentMembers.filter((m) => !m.endDate);
  const memberEmployeeIds = new Set(openMembers.map((m) => m.employee.empId));
  const availableEmployees = employees.filter((e) => !memberEmployeeIds.has(e.id));
  const teamLeadOptions = openMembers.filter((m) => String(m.employee.empId) !== String(memberForm.employeeId));

  const activeHierarchyProjects = hierarchy.projects.filter((p) => (p.status || 'Active') !== 'Completed');
  const completedHierarchyProjects = hierarchy.projects.filter((p) => p.status === 'Completed');
  const selectedProject = hierarchy.projects.find((p) => p.id === selectedProjectId) || null;

  const personLabel = (person) =>
    person ? `${person.name}${person.designation ? ` · ${person.designation}` : ''}` : '';

  return (
    <AdminLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="team-structure"
      title="Team Structure"
      subtitle="See project managers, team leads, and who reports to whom - plus who's currently on the bench."
    >
      {loading ? (
        <p>Loading team structure...</p>
      ) : (
        <>
          <section className="team-structure-section">
            <h3>Org Chart</h3>
            {hierarchy.projects.length === 0 ? (
              <p>No projects yet. Create one below to start building the hierarchy.</p>
            ) : (
              <>
                <div className="team-structure-project-picker">
                  <div className="team-structure-picker-group">
                    <span className="picker-label">Active Projects</span>
                    <div className="team-structure-chip-row">
                      {activeHierarchyProjects.length === 0 && (
                        <span className="team-structure-empty">None</span>
                      )}
                      {activeHierarchyProjects.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`team-structure-project-chip${selectedProjectId === p.id ? ' selected' : ''}`}
                          onClick={() => setSelectedProjectId(p.id)}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="team-structure-picker-group">
                    <span className="picker-label">Completed Projects</span>
                    <div className="team-structure-chip-row">
                      {completedHierarchyProjects.length === 0 && (
                        <span className="team-structure-empty">None</span>
                      )}
                      {completedHierarchyProjects.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`team-structure-project-chip completed${selectedProjectId === p.id ? ' selected' : ''}`}
                          onClick={() => setSelectedProjectId(p.id)}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {!selectedProject ? (
                  <p>Select a project above to see its team.</p>
                ) : (
                  <div className="team-structure-project-card">
                    <div className="team-structure-project-header">
                      <span className="team-structure-project-name">{selectedProject.name}</span>
                      <span className={`status-tag${selectedProject.status === 'Completed' ? ' completed' : ''}`}>
                        {selectedProject.status || 'Active'}
                      </span>
                    </div>
                    <div className="team-structure-tree">
                      <div className="team-structure-node pm-node">
                        <span className="node-role">PM</span>
                        <span className="node-name">
                          {selectedProject.projectManager ? personLabel(selectedProject.projectManager) : 'Unassigned'}
                        </span>
                      </div>

                      {selectedProject.teamLeads.map((group) => (
                        <div key={group.teamLead.empId} className="team-structure-branch">
                          <div className="team-structure-node tl-node">
                            <span className="node-role">TL</span>
                            <span className="node-name">{personLabel(group.teamLead)}</span>
                          </div>
                          <div className="team-structure-members">
                            {group.members.length === 0 ? (
                              <span className="team-structure-empty">No reports yet</span>
                            ) : (
                              group.members.map((m) => (
                                <div key={m.empId} className="team-structure-node member-node">
                                  <span className="node-name">{personLabel(m)}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))}

                      {selectedProject.directReports.length > 0 && (
                        <div className="team-structure-branch">
                          <div className="team-structure-node tl-node muted">
                            <span className="node-role">Direct</span>
                            <span className="node-name">Reports to PM</span>
                          </div>
                          <div className="team-structure-members">
                            {selectedProject.directReports.map((m) => (
                              <div key={m.empId} className="team-structure-node member-node">
                                <span className="node-name">{personLabel(m)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="team-structure-section">
            <h3>Bench ({hierarchy.bench.length})</h3>
            {hierarchy.bench.length === 0 ? (
              <p>Everyone is currently assigned to a project.</p>
            ) : (
              <div className="team-structure-bench-grid">
                {hierarchy.bench.map((emp) => (
                  <div key={emp.empId} className="team-structure-bench-chip">
                    {emp.name}
                    {emp.designation ? ` · ${emp.designation}` : ''}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="team-structure-section">
            <h3>Create Project</h3>
            <form onSubmit={handleCreateProject} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Project Name</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Project Manager</label>
                  <select
                    value={newProject.projectManagerId}
                    onChange={(e) => setNewProject({ ...newProject, projectManagerId: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{employeeName(emp)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Description</label>
                  <input
                    type="text"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                  <button type="submit" className="create-btn">Create Project</button>
                </div>
              </div>
            </form>
          </section>

          <section className="team-structure-section">
            <h3>Manage Projects</h3>
            {projects.length === 0 ? (
              <p>No projects created yet.</p>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Manager</th>
                    <th>Status</th>
                    <th>Members</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <React.Fragment key={project.id}>
                      <tr>
                        <td>{project.name}</td>
                        <td>{project.projectManager ? project.projectManager.name : '—'}</td>
                        <td>{project.status}</td>
                        <td>{project.memberCount}</td>
                        <td>
                          <button type="button" className="small-button" onClick={() => toggleExpand(project.id)}>
                            {expandedProjectId === project.id ? 'Close' : 'Manage'}
                          </button>{' '}
                          <button type="button" className="small-button" onClick={() => handleToggleStatus(project)}>
                            {project.status === 'Completed' ? 'Reactivate' : 'Mark Completed'}
                          </button>{' '}
                          <button type="button" className="small-button reject" onClick={() => handleDeleteProject(project.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                      {expandedProjectId === project.id && (
                        <tr>
                          <td colSpan="5">
                            {detailLoading ? (
                              <p>Loading members...</p>
                            ) : (
                              <div className="team-structure-manage-panel">
                                <table className="report-table">
                                  <thead>
                                    <tr>
                                      <th>Member</th>
                                      <th>Reports To</th>
                                      <th>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {currentMembers.map((m) => (
                                      <tr key={m.membershipId}>
                                        <td>
                                          {m.employee.name}
                                          {m.employee.positionLevel === 'TEAM_LEAD' ? ' (TL)' : ''}
                                          {m.endDate ? (
                                            <span className="team-structure-ended-tag"> · Ended {m.endDate}</span>
                                          ) : null}
                                        </td>
                                        <td>
                                          {m.endDate ? (
                                            <span className="team-structure-empty">
                                              {m.teamLead ? m.teamLead.name : 'Project Manager'}
                                            </span>
                                          ) : (
                                            <select
                                              value={m.teamLead ? m.teamLead.empId : ''}
                                              onChange={(e) => handleChangeTeamLead(m.membershipId, e.target.value)}
                                            >
                                              <option value="">Project Manager</option>
                                              {openMembers
                                                .filter((other) => other.employee.empId !== m.employee.empId)
                                                .map((other) => (
                                                  <option key={other.employee.empId} value={other.employee.empId}>
                                                    {other.employee.name}
                                                  </option>
                                                ))}
                                            </select>
                                          )}
                                        </td>
                                        <td>
                                          <button
                                            type="button"
                                            className="small-button reject"
                                            onClick={() => handleRemoveMember(m.membershipId)}
                                          >
                                            Remove
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                    {currentMembers.length === 0 && (
                                      <tr><td colSpan="3">No members yet.</td></tr>
                                    )}
                                  </tbody>
                                </table>

                                <form onSubmit={handleAddMember} className="profile-form" style={{ marginTop: '12px' }}>
                                  <div className="form-row">
                                    <div className="form-group">
                                      <label>Add Employee</label>
                                      <select
                                        value={memberForm.employeeId}
                                        onChange={(e) => setMemberForm({ ...memberForm, employeeId: e.target.value })}
                                      >
                                        <option value="">Select employee</option>
                                        {availableEmployees.map((emp) => (
                                          <option key={emp.id} value={emp.id}>{employeeName(emp)}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="form-group">
                                      <label>Reports To</label>
                                      <select
                                        value={memberForm.teamLeadId}
                                        onChange={(e) => setMemberForm({ ...memberForm, teamLeadId: e.target.value })}
                                      >
                                        <option value="">Project Manager</option>
                                        {teamLeadOptions.map((m) => (
                                          <option key={m.employee.empId} value={m.employee.empId}>
                                            {m.employee.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                                      <button type="submit" className="small-button">Add</button>
                                    </div>
                                  </div>
                                </form>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </AdminLayout>
  );
}

export default TeamStructurePage;
