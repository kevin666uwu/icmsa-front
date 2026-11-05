import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../services/api.js";

const emptyUser = { name: "", email: "", password: "", role: "member", status: "active" };
const EMPTY_PROCESS_OVERVIEW = { responsible: [], related: [] };

export default function OrganizationPage({ access }) {
  const isAdmin = access?.role === "super_admin";
  const [data, setData] = useState({ units: [], positions: [], memberships: [], users: [], process_overview: {} });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [unitName, setUnitName] = useState("");
  const [parentId, setParentId] = useState("");
  const [positionName, setPositionName] = useState("");
  const [positionUnitId, setPositionUnitId] = useState("");
  const [parentPositionId, setParentPositionId] = useState("");
  const [userForm, setUserForm] = useState(emptyUser);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [openPosition, setOpenPosition] = useState(null);
  const [editingProcesses, setEditingProcesses] = useState(false);
  const [processDraft, setProcessDraft] = useState({ responsible: [], related: [] });
  const [draggedProcessId, setDraggedProcessId] = useState(null);
  const [savingProcesses, setSavingProcesses] = useState(false);
  const [openProcessesImmediately, setOpenProcessesImmediately] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch("/api/v1/organization/kpis");
      setData(response);
    } catch (e) {
      setError(e.message || "No fue posible cargar el organigrama.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const occupantByPosition = useMemo(() => {
    const map = new Map();
    for (const item of data.memberships || []) {
      const person = (data.users || []).find(candidate => candidate.id === item.user_id);
      if (person && !map.has(item.position_id)) map.set(item.position_id, person);
    }
    return map;
  }, [data]);

  const unitById = useMemo(() => new Map((data.units || []).map(unit => [unit.id, unit])), [data.units]);
  const activePositions = useMemo(() => (data.positions || []).filter(position => position.active), [data.positions]);
  const positionChildren = parentIdValue => activePositions.filter(position =>
    (position.parent_position_id || null) === (parentIdValue || null)
  );

  const overviewFor = userId => {
    if (!userId) return EMPTY_PROCESS_OVERVIEW;
    return data.process_overview?.[String(userId)] || data.process_overview?.[userId] || EMPTY_PROCESS_OVERVIEW;
  };

  async function createUnit(e) {
    e.preventDefault(); setError(""); setNotice("");
    try {
      await apiFetch("/api/v1/organization/units", {
        method: "POST",
        body: JSON.stringify({ name: unitName, parent_id: parentId ? Number(parentId) : null }),
      });
      setUnitName(""); setParentId(""); setNotice("Área creada."); await load();
    } catch (e) { setError(e.message); }
  }

  async function createPosition(e) {
    e.preventDefault(); setError(""); setNotice("");
    try {
      await apiFetch("/api/v1/organization/positions", {
        method: "POST",
        body: JSON.stringify({
          name: positionName,
          org_unit_id: Number(positionUnitId),
          parent_position_id: parentPositionId ? Number(parentPositionId) : null,
        }),
      });
      setPositionName(""); setPositionUnitId(""); setParentPositionId("");
      setNotice("Puesto creado."); await load();
    } catch (e) { setError(e.message); }
  }

  async function createUser(e) {
    e.preventDefault(); setError(""); setNotice("");
    try {
      await apiFetch("/api/v1/organization/users", { method: "POST", body: JSON.stringify(userForm) });
      setUserForm(emptyUser); setNotice("Usuario creado."); await load();
    } catch (e) { setError(e.message); }
  }

  async function assignPosition(e) {
    e.preventDefault(); setError(""); setNotice("");
    try {
      await apiFetch("/api/v1/organization/users/" + selectedUser + "/position", {
        method: "PUT", body: JSON.stringify({ position_id: Number(selectedPosition) }),
      });
      setNotice("Puesto asignado."); await load();
    } catch (e) { setError(e.message); }
  }

  function PositionCard({ position }) {
    const occupant = occupantByPosition.get(position.id);
    const overview = overviewFor(occupant?.id);
    const area = unitById.get(position.org_unit_id)?.name || "Sin área";

    function openDetail() {
      setOpenProcessesImmediately(false);
      setOpenPosition(position);
    }

    function openProcessEditor(event) {
      event.stopPropagation();
      setOpenProcessesImmediately(true);
      setOpenPosition(position);
    }

    return <div className="org-node-card">
      <button type="button" className="org-node-main" onClick={openDetail}>
        <strong>{occupant?.name || "Vacante"}</strong>
        <span>{position.name}</span>
        <small>{area}</small>
        <div className="org-node-counts">
          <span><b>{overview.responsible.length}</b> Procesos del usuario</span>
          <span><b>{overview.related.length}</b> Procesos relacionados</span>
        </div>
      </button>
      {isAdmin && occupant && <button type="button" className="org-node-edit-processes" onClick={openProcessEditor}>
        Editar procesos
      </button>}
    </div>;
  }

  function PositionTree({ position }) {
    const children = positionChildren(position.id);
    return <div className="org-tree-node">
      <PositionCard position={position} />
      {children.length > 0 && <div className="org-tree-children">
        {children.map(child => <PositionTree key={child.id} position={child} />)}
      </div>}
    </div>;
  }

  const selectedOccupant = openPosition ? occupantByPosition.get(openPosition.id) : null;
  const selectedOverview = overviewFor(selectedOccupant?.id);
  const [editPositionName, setEditPositionName] = useState("");
  const [editPositionUnitId, setEditPositionUnitId] = useState("");
  const [editParentPositionId, setEditParentPositionId] = useState("");
  const [editOccupantId, setEditOccupantId] = useState("");

  useEffect(() => {
    if (!openPosition) return;
    setEditPositionName(openPosition.name || "");
    setEditPositionUnitId(String(openPosition.org_unit_id || ""));
    setEditParentPositionId(openPosition.parent_position_id ? String(openPosition.parent_position_id) : "");
    setEditOccupantId(selectedOccupant ? String(selectedOccupant.id) : "");
    setProcessDraft({
      responsible: selectedOverview.responsible.map(process => process.id),
      related: selectedOverview.related.map(process => process.id),
    });
    setEditingProcesses(openProcessesImmediately);
  }, [openPosition, openProcessesImmediately, selectedOccupant, selectedOverview.responsible, selectedOverview.related]);

  const processById = useMemo(
    () => new Map((data.processes || []).map(process => [process.id, process])),
    [data.processes],
  );

  const availableProcessIds = (data.processes || [])
    .map(process => process.id)
    .filter(processId =>
      !processDraft.responsible.includes(processId) &&
      !processDraft.related.includes(processId)
    );

  function moveProcess(processId, lane) {
    const numericId = Number(processId);
    setProcessDraft(current => ({
      responsible: lane === "responsible"
        ? [...current.responsible.filter(id => id !== numericId), numericId]
        : current.responsible.filter(id => id !== numericId),
      related: lane === "related"
        ? [...current.related.filter(id => id !== numericId), numericId]
        : current.related.filter(id => id !== numericId),
    }));
  }

  function dropProcess(event, lane) {
    event.preventDefault();
    const processId = Number(event.dataTransfer.getData("text/process-id") || draggedProcessId);
    if (processId) moveProcess(processId, lane);
    setDraggedProcessId(null);
  }

  async function saveProcessAssignments() {
    if (!selectedOccupant) return;
    setSavingProcesses(true); setError(""); setNotice("");
    try {
      await apiFetch("/api/v1/organization/users/" + selectedOccupant.id + "/processes", {
        method: "PUT",
        body: JSON.stringify({
          responsible_ids: processDraft.responsible,
          related_ids: processDraft.related,
        }),
      });
      setNotice("Procesos del usuario actualizados.");
      setEditingProcesses(false);
      await load();
    } catch (e) {
      setError(e.message || "No fue posible actualizar los procesos.");
    } finally {
      setSavingProcesses(false);
    }
  }

  async function savePositionEdits(e) {
    e.preventDefault(); setError(""); setNotice("");
    try {
      await apiFetch("/api/v1/organization/positions/" + openPosition.id + "/editor", {
        method: "PUT",
        body: JSON.stringify({
          name: editPositionName,
          org_unit_id: Number(editPositionUnitId),
          parent_position_id: editParentPositionId ? Number(editParentPositionId) : null,
          occupant_id: editOccupantId ? Number(editOccupantId) : null,
        }),
      });
      setNotice("Puesto actualizado.");
      setOpenPosition(null);
      await load();
    } catch (e) { setError(e.message || "No fue posible guardar el puesto."); }
  }

  if (loading) return <div className="dashboard-state" role="status"><div className="spinner"/><p>Cargando organización…</p></div>;

  return <div className="organization-page icmsa-kpis-org">
    <header className="knowledge-hero">
      <span className="portal-kicker">GOBIERNO DE PROCESOS</span>
      <h2>Organigrama</h2>
      <p>{isAdmin
        ? "Administra usuarios, áreas, puestos y asignaciones desde una sola pantalla, como en KPIs Web."
        : "Consulta el organigrama y los procesos asociados a cada puesto."}</p>
    </header>

    {error && <p className="form-error" role="alert">{error}</p>}
    {notice && <p className="org-notice" role="status">{notice}</p>}

    {isAdmin && <section className="org-admin-grid">
      <form className="org-admin-card" onSubmit={createUser}><h3>Agregar usuario</h3>
        <label>Nombre<input required value={userForm.name} onChange={e => setUserForm(value => ({ ...value, name: e.target.value }))} /></label>
        <label>Correo<input required type="email" value={userForm.email} onChange={e => setUserForm(value => ({ ...value, email: e.target.value }))} /></label>
        <label>Contraseña temporal<input required minLength={12} type="password" value={userForm.password} onChange={e => setUserForm(value => ({ ...value, password: e.target.value }))} /></label>
        <label>Rol<select value={userForm.role} onChange={e => setUserForm(value => ({ ...value, role: e.target.value }))}><option value="member">Miembro</option><option value="admin">Administrador (acceso total)</option></select></label>
        <button className="button">Crear usuario</button>
      </form>

      <form className="org-admin-card org-area-card" onSubmit={createUnit}><h3>Agregar área</h3>
        <label>Nombre<input required value={unitName} onChange={e => setUnitName(e.target.value)} /></label>
        <label>Área superior<select value={parentId} onChange={e => setParentId(e.target.value)}><option value="">Sin área superior</option>{(data.units || []).filter(item => item.active).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <div className="org-existing-units">
          <small>Áreas existentes</small>
          <div>{(data.units || []).filter(item => item.active).length
            ? (data.units || []).filter(item => item.active).map(item => <span key={item.id}>{item.name}</span>)
            : <em>Aún no hay áreas creadas.</em>}</div>
        </div>
        <button className="button">Crear área</button>
      </form>

      <form className="org-admin-card" onSubmit={createPosition}><h3>Agregar puesto</h3>
        <label>Área<select required value={positionUnitId} onChange={e => setPositionUnitId(e.target.value)}><option value="">Seleccionar área</option>{(data.units || []).filter(item => item.active).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Puesto<input required value={positionName} onChange={e => setPositionName(e.target.value)} placeholder="Supervisor, Analista…" /></label>
        <label>Reporta a<select value={parentPositionId} onChange={e => setParentPositionId(e.target.value)}><option value="">Nivel superior / raíz</option>{activePositions.map(item => <option key={item.id} value={item.id}>{item.name} · {occupantByPosition.get(item.id)?.name || "Vacante"}</option>)}</select></label>
        <button className="button">Crear puesto</button>
      </form>

      <form className="org-admin-card" onSubmit={assignPosition}><h3>Asignar persona</h3>
        <label>Usuario<select required value={selectedUser} onChange={e => setSelectedUser(e.target.value)}><option value="">Seleccionar usuario</option>{(data.users || []).filter(item => item.status === "active").map(item => <option key={item.id} value={item.id}>{item.name}{item.email ? " · " + item.email : ""}</option>)}</select></label>
        <label>Puesto<select required value={selectedPosition} onChange={e => setSelectedPosition(e.target.value)}><option value="">Seleccionar puesto</option>{activePositions.map(item => {
          const occupant = occupantByPosition.get(item.id);
          const isCurrentUser = occupant && String(occupant.id) === String(selectedUser);
          const status = occupant ? (isCurrentUser ? "Asignado a este usuario" : "Ocupado por " + occupant.name) : "Vacante";
          return <option key={item.id} value={item.id}>{item.name} · {unitById.get(item.org_unit_id)?.name || "Área"} · {status}</option>;
        })}</select></label>
        <button className="button">Asignar puesto</button>
      </form>
    </section>}

    <section className="org-chart">
      <div className="org-chart-head">
        <div><span className="portal-kicker">ESTRUCTURA ACTUAL</span><h3>Organigrama jerárquico</h3></div>
        <span>{(data.users || []).filter(item => item.status === "active").length} personas</span>
      </div>
      <p className="org-chart-help">Selecciona un puesto para consultar sus procesos responsables y relacionados.</p>
      <div className="org-tree">
        {positionChildren(null).length
          ? positionChildren(null).map(position => <PositionTree key={position.id} position={position} />)
          : <div className="empty-card">Aún no hay puestos de nivel raíz. {isAdmin ? "Define la jerarquía desde Agregar puesto." : ""}</div>}
      </div>
    </section>

    {openPosition && <div className="org-modal-backdrop" role="presentation" onMouseDown={() => setOpenPosition(null)}>
      <section className="org-modal" role="dialog" aria-modal="true" aria-label="Procesos del puesto" onMouseDown={event => event.stopPropagation()}>
        <button className="org-modal-close" type="button" onClick={() => setOpenPosition(null)}>×</button>
        <span className="portal-kicker">{unitById.get(openPosition.org_unit_id)?.name || "ORGANIZACIÓN"}</span>
        <h3>{selectedOccupant?.name || "Vacante"}</h3>
        <p className="org-modal-position">{openPosition.name}</p>
        {isAdmin && <form className="org-inline-editor" onSubmit={savePositionEdits}>
          <h4>Editar puesto</h4>
          <label>Nombre del puesto<input required value={editPositionName} onChange={e => setEditPositionName(e.target.value)} /></label>
          <label>Área<select required value={editPositionUnitId} onChange={e => setEditPositionUnitId(e.target.value)}>
            {(data.units || []).filter(item => item.active).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select></label>
          <label>Reporta a<select value={editParentPositionId} onChange={e => setEditParentPositionId(e.target.value)}>
            <option value="">Nivel superior / raíz</option>
            {activePositions.filter(item => item.id !== openPosition.id).map(item => <option key={item.id} value={item.id}>{item.name} · {occupantByPosition.get(item.id)?.name || "Vacante"}</option>)}
          </select></label>
          <label>Ocupante<select value={editOccupantId} onChange={e => setEditOccupantId(e.target.value)}>
            <option value="">Vacante</option>
            {(data.users || []).filter(item => item.status === "active").map(item => <option key={item.id} value={item.id}>{item.name}{item.email ? " · " + item.email : ""}</option>)}
          </select></label>
          <button className="button" type="submit">Guardar cambios</button>
        </form>}

        <div className="org-process-title-row">
          <div>
            <span className="portal-kicker">PROCESOS</span>
            <h4>Participación en procesos</h4>
          </div>
          {isAdmin && selectedOccupant && <button
            type="button"
            className="org-edit-processes"
            onClick={() => setEditingProcesses(value => !value)}
          >{editingProcesses ? "Cancelar edición" : "Editar procesos"}</button>}
        </div>

        {!editingProcesses && <div className="org-process-columns">
          <div><h4>Procesos del usuario <span>{selectedOverview.responsible.length}</span></h4>
            {selectedOverview.responsible.length ? selectedOverview.responsible.map(process => <div className="org-process-item" key={process.id}><strong>{process.name}</strong><small>Responsable · {process.permission}</small></div>) : <p className="muted">No tiene procesos como responsable.</p>}
          </div>
          <div><h4>Procesos relacionados con el usuario <span>{selectedOverview.related.length}</span></h4>
            {selectedOverview.related.length ? selectedOverview.related.map(process => <div className="org-process-item" key={process.id}><strong>{process.name}</strong><small>Involucrado · {process.permission}</small></div>) : <p className="muted">No tiene procesos relacionados.</p>}
          </div>
        </div>}

        {editingProcesses && <div className="org-process-dnd">
          <p className="org-dnd-help">Arrastra cada proceso a la columna que corresponda. “Procesos del usuario” lo asigna como responsable; “Relacionados” lo registra como involucrado.</p>
          <div className="org-process-lanes">
            {[
              ["available", "Lista de procesos", availableProcessIds],
              ["responsible", "Procesos del usuario", processDraft.responsible],
              ["related", "Procesos relacionados", processDraft.related],
            ].map(([lane, title, ids]) => <section
              key={lane}
              className={"org-process-lane org-process-lane-" + lane}
              onDragOver={event => event.preventDefault()}
              onDrop={event => dropProcess(event, lane)}
            >
              <header><strong>{title}</strong><span>{ids.length}</span></header>
              <div className="org-process-lane-list">
                {ids.length ? ids.map(processId => {
                  const process = processById.get(processId) || { id: processId, name: "Proceso #" + processId };
                  return <article
                    key={processId}
                    className="org-process-drag-card"
                    draggable
                    onDragStart={event => {
                      setDraggedProcessId(processId);
                      event.dataTransfer.setData("text/process-id", String(processId));
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => setDraggedProcessId(null)}
                  >
                    <span className="org-drag-handle" aria-hidden="true">⋮⋮</span>
                    <strong>{process.name}</strong>
                  </article>;
                }) : <div className="org-process-drop-empty">Suelta procesos aquí</div>}
              </div>
            </section>)}
          </div>
          <div className="org-process-dnd-actions">
            <button type="button" className="button" disabled={savingProcesses} onClick={saveProcessAssignments}>
              {savingProcesses ? "Guardando…" : "Guardar procesos"}
            </button>
          </div>
        </div>}
      </section>
    </div>}
  </div>;
}
