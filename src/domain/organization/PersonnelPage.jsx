import { useMemo, useState } from 'react';
import ResourcePage from '../ResourcePage.jsx';

const employeeLabels = { active: 'Activo', inactive: 'Inactivo', leave: 'En licencia', terminated: 'Baja' };
const attendanceLabels = { present: 'Asistencia', late: 'Retardo', absent: 'Falta', justified: 'Justificada', leave: 'Permiso', vacation: 'Vacaciones' };

export default function PersonnelPage({ access }) {
  const [tab, setTab] = useState('employees');
  const employeeSpec = access.resources?.employees;
  const attendanceSpec = access.resources?.attendance_records;
  const specs = useMemo(() => {
    const { user_id: ACCOUNT, first_name, last_name, second_last_name, ...basicFields } = employeeSpec?.fields || {};
    const employees = employeeSpec && { ...employeeSpec, fields: {
      ...(first_name && { first_name: { ...first_name, label: 'Nombre' } }),
      ...(last_name && { last_name: { ...last_name, label: 'Primer apellido' } }),
      ...(second_last_name && { second_last_name: { ...second_last_name, label: 'Segundo apellido' } }),
      ...basicFields, status: { ...basicFields.status, choice_labels: employeeLabels },
    } };
    const attendance = attendanceSpec && { ...attendanceSpec, fields: {
      ...attendanceSpec.fields, status: { ...attendanceSpec.fields.status, choice_labels: attendanceLabels },
    } };
    const vacations = attendance && { ...attendance, title: 'Vacaciones', fields: {
      employee_id: attendance.fields.employee_id,
      date: attendance.fields.date,
      status: { ...attendance.fields.status, choices: ['vacation'], default: 'vacation' },
      notes: attendance.fields.notes,
    } };
    return { employees, attendance, vacations };
  }, [employeeSpec, attendanceSpec]);
  return <section className="personnel-page">
    <div className="page-heading"><div><p className="eyebrow">Administración</p><h1>Personal</h1><p>Datos básicos y seguimiento del personal de la institución.</p></div></div>
    <div className="personnel-tabs" role="tablist" aria-label="Gestión de personal">
      {[
        ['employees', 'Datos básicos', employeeSpec],
        ['attendance', 'Asistencia', attendanceSpec],
        ['vacations', 'Vacaciones', attendanceSpec],
      ].filter(([, , spec]) => spec).map(([key, label]) => <button key={key} type="button"
        role="tab" id={'personnel-tab-' + key} aria-controls="personnel-panel" aria-selected={tab === key}
        onClick={() => setTab(key)}>{label}</button>)}
    </div>
    <div id="personnel-panel" role="tabpanel" aria-labelledby={'personnel-tab-' + tab}>
      {specs[tab] ? <ResourcePage key={tab} name={tab === 'employees' ? 'employees' : 'attendance_records'}
        spec={specs[tab]} access={access} showDetails={false}
        fixedStatus={tab === 'vacations' ? 'vacation' : undefined}
        visibleFields={tab === 'employees' ? ['employee_number', 'first_name', 'last_name', 'second_last_name', 'email', 'phone', 'status'] : undefined}
        description={tab === 'employees'
          ? 'Registra nombre, contacto, número de empleado, fecha de ingreso y estado. La asignación de área y puesto se realiza en Organigrama.'
          : tab === 'vacations' ? 'Registra cada día de vacaciones por persona. Los días quedan integrados en su historial de asistencia.'
          : 'Registra asistencias, entradas, salidas, retardos, faltas y permisos por persona y fecha.'} />
        : <p role="status">No tienes acceso a estos registros de personal.</p>}
    </div>
  </section>;
}
