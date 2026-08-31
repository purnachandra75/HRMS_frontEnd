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
import '../styles/tailwind.css';

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
        <p className="text-sm text-muted-foreground">Loading team structure...</p>
      ) : (
        <div className="flex flex-col gap-5">
          <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
            <h3 className="text-base font-semibold text-foreground">Org Chart</h3>
            {hierarchy.projects.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No projects yet. Create one below to start building the hierarchy.</p>
            ) : (
              <>
                <div className="mt-4 flex flex-col gap-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Active Projects</span>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {activeHierarchyProjects.length === 0 && <span className="text-sm text-muted-foreground">None</span>}
                      {activeHierarchyProjects.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedProjectId(p.id)}
                          className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                            selectedProjectId === p.id
                              ? 'border-client bg-client text-client-foreground'
                              : 'border-border bg-white text-foreground hover:bg-muted'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Completed Projects</span>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {completedHierarchyProjects.length === 0 && <span className="text-sm text-muted-foreground">None</span>}
                      {completedHierarchyProjects.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedProjectId(p.id)}
                          className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                            selectedProjectId === p.id
                              ? 'border-client bg-client text-client-foreground'
                              : 'border-border bg-muted/60 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {!selectedProject ? (
                  <p className="mt-4 text-sm text-muted-foreground">Select a project above to see its team.</p>
                ) : (
                  <div className="mt-4 rounded-xl border border-border/80 bg-background p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{selectedProject.name}</span>
                      <span
                        className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold ${
                          selectedProject.status === 'Completed'
                            ? 'border-border bg-muted text-muted-foreground'
                            : 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]'
                        }`}
                      >
                        {selectedProject.status || 'Active'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-client/30 bg-client/10 px-3 py-1.5">
                        <span className="text-[11px] font-semibold uppercase text-client">PM</span>
                        <span className="text-sm font-medium text-foreground">
                          {selectedProject.projectManager ? personLabel(selectedProject.projectManager) : 'Unassigned'}
                        </span>
                      </div>

                      {selectedProject.teamLeads.map((group) => (
                        <div key={group.teamLead.empId} className="ml-4 flex flex-col gap-2 border-l border-border pl-4">
                          <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5">
                            <span className="text-[11px] font-semibold uppercase text-muted-foreground">TL</span>
                            <span className="text-sm font-medium text-foreground">{personLabel(group.teamLead)}</span>
                          </div>
                          <div className="ml-4 flex flex-wrap gap-2 border-l border-border pl-4">
                            {group.members.length === 0 ? (
                              <span className="text-sm text-muted-foreground">No reports yet</span>
                            ) : (
                              group.members.map((m) => (
                                <div key={m.empId} className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground">
                                  {personLabel(m)}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))}

                      {selectedProject.directReports.length > 0 && (
                        <div className="ml-4 flex flex-col gap-2 border-l border-border pl-4">
                          <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5">
                            <span className="text-[11px] font-semibold uppercase text-muted-foreground">Direct</span>
                            <span className="text-sm font-medium text-muted-foreground">Reports to PM</span>
                          </div>
                          <div className="ml-4 flex flex-wrap gap-2 border-l border-border pl-4">
                            {selectedProject.directReports.map((m) => (
                              <div key={m.empId} className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground">
                                {personLabel(m)}
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

          <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
            <h3 className="text-base font-semibold text-foreground">Bench ({hierarchy.bench.length})</h3>
            {hierarchy.bench.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Everyone is currently assigned to a project.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {hierarchy.bench.map((emp) => (
                  <div key={emp.empId} className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground">
                    {emp.name}
                    {emp.designation ? ` · ${emp.designation}` : ''}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
            <h3 className="text-base font-semibold text-foreground">Create Project</h3>
            <form onSubmit={handleCreateProject} className="mt-4 flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Project Manager</label>
                <select
                  value={newProject.projectManagerId}
                  onChange={(e) => setNewProject({ ...newProject, projectManagerId: e.target.value })}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{employeeName(emp)}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Description</label>
                <input
                  type="text"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </div>
              <button
                type="submit"
                className="h-9 rounded-lg bg-client px-4 text-sm font-medium text-client-foreground hover:bg-client/90"
              >
                Create Project
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
            <h3 className="text-base font-semibold text-foreground">Manage Projects</h3>
            {projects.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No projects created yet.</p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-xl border border-border/80">
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 700 }}>
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/40">
                        {['Project', 'Manager', 'Status', 'Members', 'Action'].map((col) => (
                          <th key={col} className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project) => (
                        <React.Fragment key={project.id}>
                          <tr className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-3 text-sm font-medium text-foreground">{project.name}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{project.projectManager ? project.projectManager.name : '—'}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{project.status}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{project.memberCount}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(project.id)}
                                  className="rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                                >
                                  {expandedProjectId === project.id ? 'Close' : 'Manage'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(project)}
                                  className="rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                                >
                                  {project.status === 'Completed' ? 'Reactivate' : 'Mark Completed'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProject(project.id)}
                                  className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-2.5 py-1 text-xs font-medium text-[#b91c1c] hover:bg-[#fee2e2]"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedProjectId === project.id && (
                            <tr>
                              <td colSpan={5} className="bg-muted/20 px-4 py-4">
                                {detailLoading ? (
                                  <p className="text-sm text-muted-foreground">Loading members...</p>
                                ) : (
                                  <div className="flex flex-col gap-4">
                                    <div className="overflow-hidden rounded-lg border border-border/80 bg-card">
                                      <table className="w-full text-left" style={{ minWidth: 480 }}>
                                        <thead>
                                          <tr className="border-b border-border/80 bg-muted/40">
                                            {['Member', 'Reports To', 'Action'].map((col) => (
                                              <th key={col} className="h-10 px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                                                {col}
                                              </th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {currentMembers.map((m) => (
                                            <tr key={m.membershipId} className="border-b border-border/60 last:border-0">
                                              <td className="px-3 py-2 text-sm text-foreground">
                                                {m.employee.name}
                                                {m.employee.positionLevel === 'TEAM_LEAD' ? ' (TL)' : ''}
                                                {m.endDate ? (
                                                  <span className="text-xs text-muted-foreground"> · Ended {m.endDate}</span>
                                                ) : null}
                                              </td>
                                              <td className="px-3 py-2 text-sm">
                                                {m.endDate ? (
                                                  <span className="text-muted-foreground">
                                                    {m.teamLead ? m.teamLead.name : 'Project Manager'}
                                                  </span>
                                                ) : (
                                                  <select
                                                    value={m.teamLead ? m.teamLead.empId : ''}
                                                    onChange={(e) => handleChangeTeamLead(m.membershipId, e.target.value)}
                                                    className="h-8 rounded-md border border-border bg-white px-2 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
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
                                              <td className="px-3 py-2">
                                                <button
                                                  type="button"
                                                  onClick={() => handleRemoveMember(m.membershipId)}
                                                  className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-2.5 py-1 text-xs font-medium text-[#b91c1c] hover:bg-[#fee2e2]"
                                                >
                                                  Remove
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                          {currentMembers.length === 0 && (
                                            <tr>
                                              <td colSpan={3} className="px-3 py-3 text-sm text-muted-foreground">No members yet.</td>
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>

                                    <form onSubmit={handleAddMember} className="flex flex-wrap items-end gap-3">
                                      <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Add Employee</label>
                                        <select
                                          value={memberForm.employeeId}
                                          onChange={(e) => setMemberForm({ ...memberForm, employeeId: e.target.value })}
                                          className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                                        >
                                          <option value="">Select employee</option>
                                          {availableEmployees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>{employeeName(emp)}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Reports To</label>
                                        <select
                                          value={memberForm.teamLeadId}
                                          onChange={(e) => setMemberForm({ ...memberForm, teamLeadId: e.target.value })}
                                          className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                                        >
                                          <option value="">Project Manager</option>
                                          {teamLeadOptions.map((m) => (
                                            <option key={m.employee.empId} value={m.employee.empId}>
                                              {m.employee.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <button
                                        type="submit"
                                        className="h-9 rounded-lg border border-border bg-white px-3 text-sm font-medium text-foreground hover:bg-muted"
                                      >
                                        Add
                                      </button>
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
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </AdminLayout>
  );
}

export default TeamStructurePage;
