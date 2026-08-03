import { useEffect, useMemo, useState } from "react";
import hospitalCrossUrl from "../public/cruz hospital.png";
import {
  login as authenticate,
  logout as endSession,
  loadUsers,
  saveUser as persistUser,
  saveRole as persistRole,
  deleteHealthInsurance as removeHealthInsurance,
  deleteMedication as removeMedication,
  deleteAvailability as removeAvailability,
  deletePatient as removePatient,
  deleteProfessional as removeProfessional,
  deletePersonnel as removePersonnel,
  deleteCabo as removeCabo,
  deleteHealthInsurancePayment as removeHealthInsurancePayment,
  loadCaboDetails,
  loadCabosPage,
  loadCabosForDebit,
  loadHospitalData,
  loadClinicalHistory,
  saveClinicalRecord,
  loadHealthInsuranceLiquidation,
  loadAmbulatoryLiquidationReport,
  loadInternmentLiquidationReport,
  loadHospitalizationReport,
  loadImageLiquidationReport,
  loadLaboratoryLiquidationReport,
  loadHealthInsurances,
  loadProfessionalLiquidation,
  loadProfessionalLiquidationByInsurance,
  loadProfessionalLiquidationDetail,
  loadPersonnelLiquidation,
  loadPersonnelLiquidationDetail,
  saveHealthInsurance as persistHealthInsurance,
  saveMedication as persistMedication,
  saveNomenclature as persistNomenclature,
  saveAppointment as persistAppointment,
  saveAvailability as persistAvailability,
  savePatient as persistPatient,
  saveProfessional as persistProfessional,
  savePersonnel as persistPersonnel,
  saveCabo as persistCabo,
  saveHealthInsurancePayment as persistHealthInsurancePayment,
  updateNomenclatureFee,
} from "./api";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  HeartPulse,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  UsersRound,
  X,
  BriefcaseMedical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  BadgePercent,
  UserCog,
  Pill,
  Building2,
  BookOpen,
  ClipboardPlus,
  FlaskConical,
  Activity,
  BadgeDollarSign,
  Clock,
  CalendarPlus,
  CalendarX,
  ReceiptText,
  ChevronDown,
} from "lucide-react";

const emptyPatient = {
  codigo: "",
  dni: "",
  nombre: "",
  apellido: "",
  nacimiento: "",
  sexo: "",
  estadoCivil: "",
  ocupacion: "",
  telefono: "",
  celular: "",
  calle: "",
  numero: "",
  idLocalidad: "",
  localidad: "",
  codigoPostal: "",
  partido: "",
  provincia: "",
  obraSocial: "",
  numeroAfiliado: "",
  beneficiario: "",
  parentesco: "",
};

const emptyProfessional = {
  codigo: "",
  dni: "",
  nombre: "",
  apellido: "",
  telefono: "",
  celular: "",
  matricula: "",
  autogestion: "",
  especialidad: "",
  calle: "",
  numero: "",
  idLocalidad: "",
  localidad: "",
  codigoPostal: "",
  partido: "",
  provincia: "",
};

const emptyPersonnel = {
  codigo: "",
  dni: "",
  nombre: "",
  apellido: "",
  telefono: "",
  celular: "",
  area: "",
  calle: "",
  numero: "",
  idLocalidad: "",
  localidad: "",
  codigoPostal: "",
  partido: "",
  provincia: "",
};

const emptyMedication = { id: "", producto: "", presentacion: "", precio: "" };
const emptyHealthInsurance = {
  codigo: "",
  descripcion: "",
  sigla: "",
  calle: "",
  numero: "",
  localidad: "",
  codigoPostal: "",
};
const emptyNomenclature = { id: "", codigo: "", descripcion: "", arancel: "" };
const emptyCabo = {
  id: "",
  fecha: new Date().toISOString().slice(0, 10),
  numero: "",
  codigoRefes: "10140352231197",
  pacienteCodigo: "",
  dni: "",
  nombre: "",
  edad: "",
  sexo: "",
  beneficiario: "",
  parentesco: "",
  obraSocial: "",
  rnos: "",
  tipoAtencion: "Consulta",
  fechaAlta: "",
  prestaciones: [],
  diagnosticos: [],
  medicamentos: [],
  laboratorio: [],
};
const emptyCobroOS = {
  id: "",
  obraSocialCodigo: "",
  obraSocial: "",
  numeroFactura: "",
  estado: "GENERADA",
  fechaPrestacion: "",
  fechaPresentacion: "",
  fechaCobro: "",
  importeFacturado: "",
  importeCobrado: "",
  debitos: [],
};
const weekDays = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const emptyAppointment = {
  id: "",
  fecha: new Date().toISOString().slice(0, 10),
  hora: "",
  duracion: "30",
  profesionalCodigo: "",
  pacienteCodigo: "",
  motivo: "",
  estado: "Programado",
  observaciones: "",
};
const defaultSpecialties = [
  "Clínica médica",
  "Cardiología",
  "Pediatría",
  "Traumatología",
  "Ginecología",
  "Neurología",
];
const defaultAreas = [
  "Administración",
  "Enfermería",
  "Farmacia",
  "Laboratorio",
  "Mantenimiento",
  "Recepción",
];
const PAGE_SIZE = 15;

const formatDate = (value) => {
  if (!value) return "—";
  const match = String(value).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
};

function usePagination(items, resetKeys = []) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  useEffect(() => setPage(1), resetKeys);
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);
  return {
    page,
    pages,
    setPage,
    pageItems: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  };
}

function Pagination({ page, pages, total, onChange }) {
  if (!total) return null;
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-slate-500">
        Mostrando {start}-{end} de {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} /> Anterior
        </button>
        <span className="px-2 font-semibold text-slate-600">
          Página {page} de {pages}
        </span>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page === pages}
          className="secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

const normalizeOption = (value, options) => {
  if (value == null) return "";
  const normalized = String(value).trim().toLocaleLowerCase("es");
  return (
    options.find((option) => option.toLocaleLowerCase("es") === normalized) ||
    ""
  );
};

const normalizePatient = (patient) => ({
  ...patient,
  sexo:
    normalizeOption(patient.sexo, ["Femenino", "Masculino"]) ||
    ({ 1: "Masculino", 2: "Femenino" }[patient.sexoCodigo] ?? ""),
  beneficiario:
    normalizeOption(patient.beneficiario, [
      "Titular",
      "Familiar",
      "Adherente",
      "Otro",
    ]) ||
    ({ 1: "Titular", 2: "Familiar", 3: "Adherente", 4: "Otro" }[
      patient.beneficiarioCodigo
    ] ??
      ""),
  parentesco:
    normalizeOption(patient.parentesco, ["Cónyuge", "Hijo/a", "Otro"]) ||
    ({ 1: "Cónyuge", 2: "Hijo/a", 3: "Otro" }[patient.parentescoCodigo] ?? ""),
});
const normalizeAppointment = (item) => ({ ...item, profesionalCodigo: String(item.profesionalCodigo ?? ""), pacienteCodigo: String(item.pacienteCodigo ?? ""), hora: String(item.hora || "").slice(0, 5) });
const normalizeAvailability = (item) => ({ ...item, profesionalCodigo: String(item.profesionalCodigo ?? ""), desde: String(item.desde || "").slice(0, 5), hasta: String(item.hasta || "").slice(0, 5) });

function Brand({ compact = false, sidebar = false, login = false }) {
  return (
    <div className={`flex min-w-0 items-center ${login ? "flex-col justify-center gap-4 text-center" : sidebar ? "gap-2.5" : "gap-3"}`}>
      <div className={`grid shrink-0 place-items-center rounded-xl text-white shadow-lg shadow-hospital-900/15 ${login ? "size-14 bg-white/15 ring-1 ring-white/20" : sidebar ? "size-11 bg-white/15 ring-1 ring-white/20" : "size-11 bg-hospital-600"}`}>
        <HeartPulse size={login ? 31 : 25} strokeWidth={2.2} />
      </div>
      {!compact && (
        <div className={`min-w-0 ${login ? "text-center" : "text-left"}`}>
          <p className={`${login ? "text-2xl leading-tight text-white sm:text-3xl" : sidebar ? "text-sm leading-snug text-white" : "text-lg leading-tight text-slate-800"} font-bold tracking-tight`}>
            Hospital Municipal Luis Rivero
          </p>
          <p className={`${login ? "mt-2 text-xs tracking-[.2em] text-cyan-100" : sidebar ? "mt-1 text-[9px] leading-4 tracking-[.11em] text-cyan-100" : "text-[11px] tracking-[.18em] text-hospital-600"} font-semibold uppercase`}>
            Salud pública · Gestión hospitalaria
          </p>
        </div>
      )}
    </div>
  );
}

function Landing({ onAdminAccess }) {
  return (
    <main className="min-h-screen bg-[#f4f8f8] text-slate-800">
      <header className="relative z-20 border-b border-white/60 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
          <Brand />
          <div className="flex items-center gap-6">
            <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-500 xl:flex" aria-label="Navegación institucional">
              <a href="#especialidades" className="hover:text-hospital-600">Especialidades</a>
              <a href="#servicios" className="hover:text-hospital-600">Servicios</a>
              <a href="#equipo" className="hover:text-hospital-600">Nuestro equipo</a>
              <a href="#contacto" className="hover:text-hospital-600">Contacto</a>
            </nav>
            <button onClick={onAdminAccess} className="secondary hidden sm:inline-flex">
              <ShieldCheck size={18} /> Acceso institucional
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-hospital-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,.16),transparent_34%)]" />
        <div className="relative mx-auto grid min-h-[680px] max-w-[1600px] lg:grid-cols-[1.02fr_.98fr]">
          <div className="flex items-center px-6 py-20 sm:px-12 lg:px-20 xl:px-28">
            <div className="max-w-2xl text-white">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-cyan-50">
                <HeartPulse size={16} /> Salud pública municipal
              </div>
              <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl xl:text-7xl">
                Hospital Municipal
                <span className="mt-2 block text-cyan-300">Luis Rivero</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-cyan-50/75 sm:text-xl">
                Tecnología y compromiso al servicio de una atención más cercana,
                organizada y humana para toda la comunidad.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <button onClick={onAdminAccess} className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-white px-7 text-base font-bold text-hospital-900 shadow-xl shadow-black/15 transition hover:-translate-y-0.5 hover:bg-cyan-50">
                  Ingresar al sistema <ChevronRight size={20} />
                </button>
                <div className="flex min-h-14 items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-5 text-sm text-cyan-50/80">
                  <ShieldCheck size={20} className="text-cyan-300" /> Acceso exclusivo para personal autorizado
                </div>
              </div>
            </div>
          </div>
          <div className="relative min-h-[430px] lg:min-h-full">
            <img
              src="/hospital-hero.jpg"
              alt="Profesional de la salud en un entorno hospitalario"
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-hospital-900/10 via-transparent to-hospital-900/60 lg:bg-gradient-to-r lg:from-hospital-900 lg:via-hospital-900/15 lg:to-transparent" />
            <div className="absolute bottom-8 left-6 right-6 rounded-2xl border border-white/20 bg-white/90 p-5 shadow-2xl backdrop-blur sm:left-auto sm:right-10 sm:max-w-sm">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-hospital-600">Nuestra misión</p>
              <p className="mt-2 font-semibold leading-6 text-slate-700">
                Brindar atención integral con calidad, equidad y vocación de servicio.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1400px] gap-6 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-20">
        <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <div className="grid size-12 place-items-center rounded-2xl bg-hospital-50 text-hospital-600"><UserCog size={24} /></div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-hospital-600">Disponible ahora</p>
          <h2 className="mt-2 text-2xl font-bold">Sistema de gestión administrativa</h2>
          <p className="mt-3 leading-7 text-slate-500">Turnos, pacientes, profesionales y gestión hospitalaria centralizados en un entorno seguro.</p>
          <button onClick={onAdminAccess} className="primary mt-7">Acceso administrador <ChevronRight size={18} /></button>
        </article>
        <article className="rounded-3xl border border-dashed border-slate-300 bg-slate-100/70 p-7 sm:p-9">
          <div className="grid size-12 place-items-center rounded-2xl bg-white text-slate-400"><UserRound size={24} /></div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-slate-400">Próximamente</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-600">Portal del Paciente</h2>
          <p className="mt-3 leading-7 text-slate-500">Un espacio para consultar, solicitar y gestionar turnos, con acceso simple a la información de cada paciente.</p>
          <span className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-white px-5 text-sm font-bold text-slate-400">En desarrollo</span>
        </article>
      </section>

      <section id="especialidades" className="scroll-mt-24 bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-hospital-600">Atención médica</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Nuestras especialidades</h2>
            <p className="mt-4 leading-7 text-slate-500">Este espacio está preparado para presentar las especialidades médicas disponibles y orientar a cada paciente.</p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["Especialidad médica", "Especialidad médica", "Especialidad médica", "Especialidad médica"].map((label, index) => (
              <article key={index} className="rounded-2xl border border-slate-200 p-6">
                <div className="grid size-11 place-items-center rounded-xl bg-hospital-50 text-hospital-600"><Stethoscope size={21} /></div>
                <h3 className="mt-5 font-bold text-slate-700">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">Información a completar.</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="servicios" className="scroll-mt-24 py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-hospital-600">Cuidado integral</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Servicios del hospital</h2>
              <p className="mt-4 leading-7 text-slate-500">Una sección flexible para comunicar prestaciones, horarios de atención, requisitos y canales de acceso.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {["Servicio asistencial", "Servicio de diagnóstico", "Atención a la comunidad"].map((label, index) => (
                <article key={label} className="rounded-2xl bg-hospital-900 p-6 text-white">
                  <Activity size={25} className="text-cyan-300" />
                  <h3 className="mt-5 font-bold">{label}</h3>
                  <p className="mt-2 text-sm leading-6 text-cyan-50/60">Descripción pendiente de completar.</p>
                  <span className="mt-5 block text-xs font-bold uppercase tracking-[.14em] text-cyan-300">0{index + 1}</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="equipo" className="scroll-mt-24 bg-white py-16 lg:py-24">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-12">
          <div className="rounded-3xl bg-hospital-50 p-8 sm:p-12">
            <div className="grid size-14 place-items-center rounded-2xl bg-white text-hospital-600 shadow-sm"><UsersRound size={28} /></div>
            <p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-hospital-600">Profesionales comprometidos</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Nuestro equipo</h2>
            <p className="mt-5 leading-8 text-slate-600">Preparado para presentar autoridades, profesionales de la salud y equipos de apoyo que forman parte del Hospital Municipal Luis Rivero.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {["Dirección", "Equipo médico", "Enfermería", "Personal de apoyo"].map((role) => (
              <div key={role} className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                <div><UserRound className="mx-auto text-slate-300" size={30} /><p className="mt-3 font-semibold text-slate-500">{role}</p><p className="mt-1 text-xs text-slate-400">Contenido a incorporar</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contacto" className="scroll-mt-24 bg-hospital-900 py-16 text-white lg:py-24">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:px-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-300">Información útil</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Contacto</h2>
            <p className="mt-4 max-w-lg leading-7 text-cyan-50/65">Aquí se podrán publicar la dirección, teléfonos, correo institucional, horarios de atención y canales de emergencia.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {["Dirección y ubicación", "Teléfonos de contacto", "Correo institucional", "Horarios de atención"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <MapPin size={20} className="text-cyan-300" />
                <p className="mt-4 font-bold">{item}</p>
                <p className="mt-1 text-sm text-cyan-50/50">Información pendiente</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <footer className="border-t border-slate-200 bg-white px-6 py-7 text-center text-sm text-slate-500">
        Hospital Municipal Luis Rivero · Atención y compromiso con nuestra comunidad
      </footer>
    </main>
  );
}

function DatabaseLoadingModal({ error, onRetry, autoRetry = false }) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="database-loading-title"
      aria-live="polite"
    >
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-7 text-center shadow-2xl sm:p-9">
        {error ? (
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-red-600">
            <X size={32} />
          </div>
        ) : (
          <div className="relative mx-auto grid size-20 place-items-center">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-hospital-100 border-t-hospital-600" />
            <Building2 className="text-hospital-700" size={30} />
          </div>
        )}
        <h2 id="database-loading-title" className="mt-5 text-xl font-bold text-slate-800">
          {error ? "No pudimos cargar los datos" : "Accediendo a la base de datos"}
        </h2>
        <p className="mt-3 leading-6 text-slate-500">
          {error || "Estamos preparando la información del sistema. Este proceso puede demorar unos segundos."}
        </p>
        {error && autoRetry && (
          <p className="mt-3 text-sm font-semibold text-hospital-700">
            El sistema volverá a intentarlo automáticamente en unos segundos.
          </p>
        )}
        {!error && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-hospital-700">
            <span className="size-2 animate-pulse rounded-full bg-hospital-500" />
            Por favor, esperá y no cierres esta ventana
          </div>
        )}
        {error && onRetry && (
          <button type="button" onClick={onRetry} className="primary mt-6 w-full">
            Reintentar conexión
          </button>
        )}
      </div>
    </div>
  );
}

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim())
      return setError("Ingresá tu usuario y contraseña para continuar.");
    setLoading(true); setError("");
    try { const session = await authenticate(username.trim(), password); sessionStorage.setItem("hospital_token", session.token); sessionStorage.setItem("hospital_user", JSON.stringify(session.user)); onLogin(session.user); }
    catch { setError("Usuario o contraseña incorrectos."); }
    finally { setLoading(false); }
  };
  return (
    <main className="login-screen grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      {loading && <DatabaseLoadingModal />}
      <section className="relative hidden overflow-hidden login-pattern p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex justify-center">
          <Brand login />
        </div>
        <div className="relative z-10 max-w-xl">
          <h1 className="text-5xl font-bold leading-[1.08] tracking-tight">
            Cuidamos la gestión.
            <br />
            Vos cuidás a las personas.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-cyan-50/80">
            Una plataforma segura y simple para centralizar la atención de
            pacientes.
          </p>
        </div>
        <div>
          <p className="text-sm text-cyan-50/65">
            Información protegida · Acceso institucional
          </p>
          <p className="mt-2 text-sm font-semibold text-cyan-50/85">
            Desarrollado por Marcos Abella · Analista de Sistemas
          </p>
          <p className="mt-6 text-right text-xs font-medium tracking-wide text-cyan-100/60">
            Versión 0.1.0
          </p>
        </div>
      </section>
      <section className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-12 lg:hidden">
            <Brand />
          </div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-hospital-600">
            Bienvenido
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">
            Ingresá a tu cuenta
          </h2>
          <p className="mt-3 text-slate-500">
            Accedé al sistema de gestión del hospital.
          </p>
          <form className="mt-9 space-y-5" onSubmit={submit}>
            <Field label="Nombre de usuario">
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="usuario"
                className="control"
              />
            </Field>
            <Field label="Contraseña">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresá tu contraseña"
                  className="control pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-hospital-700"
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </Field>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <button disabled={loading} className="primary w-full disabled:cursor-wait disabled:opacity-70">
              {loading ? "Conectando..." : "Ingresar al sistema"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function Field({ label, required, error, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 block text-xs font-medium text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="grid size-10 place-items-center rounded-xl bg-hospital-50 text-hospital-600">
          <Icon size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
        {children}
      </div>
    </section>
  );
}

function FormTabs({ tabs, active, onChange }) {
  return (
    <div
      className="mb-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm"
      role="tablist"
      aria-label="Secciones del formulario"
    >
      <div className="flex min-w-max gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active === id}
            aria-controls={`panel-${id}`}
            onClick={() => onChange(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors sm:px-5 ${active === id ? "bg-hospital-600 text-white shadow-sm" : "text-slate-500 hover:bg-hospital-50 hover:text-hospital-700"}`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RadioGroup({ label, name, options, value, onChange, className = "" }) {
  return (
    <fieldset className={className}>
      <legend className="mb-2 text-sm font-semibold text-slate-700">
        {label}
      </legend>
      <div className="flex min-h-11 flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
        {options.map((o) => (
          <label
            key={o}
            className="flex items-center gap-2 text-sm text-slate-600"
          >
            <input
              type="radio"
              name={name}
              checked={value === o}
              onChange={() => onChange(o)}
              className="accent-hospital-600"
            />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CreateOptionModal({
  title,
  label,
  placeholder,
  value,
  error,
  onChange,
  onCancel,
  onConfirm,
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-option-title"
    >
      <button
        type="button"
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-slate-900/50 backdrop-blur-[2px]"
        aria-label="Cerrar modal"
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h3 id="create-option-title" className="font-bold text-slate-800">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              El nuevo valor quedará disponible y seleccionado.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X size={19} />
          </button>
        </div>
        <div className="p-5 sm:p-6">
          <Field label={label} required error={error}>
            <input
              autoFocus
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onConfirm();
                }
              }}
              placeholder={placeholder}
              className={`control uppercase ${error ? "invalid" : ""}`}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
          <button type="button" onClick={onCancel} className="secondary">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} className="primary">
            <Plus size={17} /> Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

function InsuranceSearchModal({
  items,
  query,
  onQueryChange,
  onSelect,
  onCancel,
}) {
  const matches = items
    .filter((item) =>
      `${item.descripcion} ${item.sigla} ${item.codigo}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    )
    .slice(0, 30);
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="insurance-search-title"
    >
      <button
        type="button"
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-slate-900/50 backdrop-blur-[2px]"
        aria-label="Cerrar búsqueda"
      />
      <div className="relative flex max-h-[min(680px,calc(100vh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h3
              id="insurance-search-title"
              className="font-bold text-slate-800"
            >
              Buscar obra social
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Buscá por nombre, sigla o código y seleccioná un resultado.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X size={19} />
          </button>
        </div>
        <div className="border-b border-slate-100 p-5 sm:px-6">
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />
            <input
              autoFocus
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Nombre, sigla o código..."
              className="control pl-11"
            />
          </div>
        </div>
        <div className="min-h-56 overflow-y-auto p-3 sm:p-4">
          {matches.length ? (
            matches.map((item) => (
              <button
                key={item.codigo}
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3 text-left hover:bg-hospital-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-700">
                    {item.descripcion}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Código {item.codigo}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-hospital-50 px-3 py-1 text-xs font-bold text-hospital-700">
                  {item.sigla || "Sin sigla"}
                </span>
              </button>
            ))
          ) : (
            <div className="grid min-h-52 place-items-center text-center">
              <div>
                <Search className="mx-auto text-slate-300" size={34} />
                <p className="mt-3 font-semibold text-slate-600">
                  {items.length
                    ? "No encontramos coincidencias"
                    : "No hay obras sociales cargadas"}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {items.length
                    ? "Probá con otro criterio."
                    : "Cargá una obra social desde su módulo."}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
          <button type="button" onClick={onCancel} className="secondary">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function LocationSearchModal({
  items,
  query,
  onQueryChange,
  onSelect,
  onCancel,
}) {
  const normalized = query.trim().toLowerCase();
  const matches = items
    .filter((item) =>
      `${item.nombre} ${item.departamento} ${item.provincia}`
        .toLowerCase()
        .includes(normalized),
    )
    .slice(0, 50);
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-search-title"
    >
      <button
        type="button"
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-slate-900/50 backdrop-blur-[2px]"
        aria-label="Cerrar búsqueda"
      />
      <div className="relative flex max-h-[min(720px,calc(100vh-2rem))] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h3 id="location-search-title" className="font-bold text-slate-800">
              Buscar localidad
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Buscá por localidad, departamento o provincia.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X size={19} />
          </button>
        </div>
        <div className="border-b border-slate-100 p-5 sm:px-6">
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />
            <input
              autoFocus
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Ej. Morón, Buenos Aires..."
              className="control pl-11"
            />
          </div>
        </div>
        <div className="min-h-56 overflow-y-auto p-3 sm:p-4">
          {matches.length ? (
            matches.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                className="w-full rounded-xl px-4 py-3 text-left hover:bg-hospital-50"
              >
                <p className="font-semibold text-slate-700">{item.nombre}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.departamento} · {item.provincia}
                </p>
              </button>
            ))
          ) : (
            <div className="grid min-h-52 place-items-center text-center">
              <div>
                <Search className="mx-auto text-slate-300" size={34} />
                <p className="mt-3 font-semibold text-slate-600">
                  No encontramos localidades
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Probá con otro criterio.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
          <button type="button" onClick={onCancel} className="secondary">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function PatientForm({
  initial = emptyPatient,
  readOnly = false,
  healthInsurances,
  locations,
  onCancel,
  onSaved,
}) {
  const [data, setData] = useState(initial);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("datos");
  const [insuranceSearchOpen, setInsuranceSearchOpen] = useState(false);
  const [insuranceQuery, setInsuranceQuery] = useState("");
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const age = useMemo(() => {
    if (!data.nacimiento) return "";
    const d = new Date(`${data.nacimiento}T00:00:00`);
    const now = new Date();
    let n = now.getFullYear() - d.getFullYear();
    if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) n--;
    return n >= 0 ? n : "";
  }, [data.nacimiento]);
  const set = (key) => (e) => setData({ ...data, [key]: e.target.value });
  const selectInsurance = (insurance) => {
    setData((current) => ({ ...current, obraSocial: insurance.descripcion }));
    setInsuranceSearchOpen(false);
    setInsuranceQuery("");
  };
  const selectLocation = (location) => {
    setData((current) => ({
      ...current,
      idLocalidad: location.id,
      localidad: location.nombre,
      partido: location.departamento,
      provincia: location.provincia,
    }));
    setLocationSearchOpen(false);
    setLocationQuery("");
  };
  const save = (e) => {
    e.preventDefault();
    if (readOnly) return onCancel();
    const next = {};
    if (!data.dni.trim()) next.dni = "Ingresá el DNI.";
    if (!data.nombre.trim()) next.nombre = "Ingresá el nombre.";
    if (!data.apellido.trim()) next.apellido = "Ingresá el apellido.";
    if (!data.nacimiento) next.nacimiento = "Seleccioná la fecha.";
    setErrors(next);
    if (Object.keys(next).length) return setActiveTab("datos");
    onSaved({
      ...data,
      codigo: data.codigo || `PAC-${String(Date.now()).slice(-5)}`,
      edad: age,
    });
  };
  const tabs = [
    { id: "datos", label: "Datos personales", icon: UserRound },
    { id: "domicilio", label: "Domicilio", icon: MapPin },
    { id: "cobertura", label: "Cobertura médica", icon: Stethoscope },
  ];
  const modeTitle = readOnly
    ? "Detalle del paciente"
    : data.codigo
      ? "Modificar paciente"
      : "Nueva ficha de paciente";
  return (
    <form onSubmit={save}>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            {modeTitle}
          </h2>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="secondary">
            {readOnly ? "Volver" : "Cancelar"}
          </button>
          {!readOnly && <button className="primary">Guardar paciente</button>}
        </div>
      </div>
      <FormTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <fieldset disabled={readOnly} id={`panel-${activeTab}`} role="tabpanel">
        {activeTab === "datos" && (
          <Section
            icon={UserRound}
            title="Datos personales"
            description="Información de identificación y contacto"
          >
            <Field label="Código de paciente">
              <input
                value={data.codigo || "Se asigna al guardar"}
                disabled
                className="control disabled"
              />
            </Field>
            <Field label="DNI" required error={errors.dni}>
              <input
                value={data.dni}
                onChange={set("dni")}
                inputMode="numeric"
                placeholder="Ej. 30123456"
                className={`control ${errors.dni ? "invalid" : ""}`}
              />
            </Field>
            <Field label="Nombre" required error={errors.nombre}>
              <input
                value={data.nombre}
                onChange={set("nombre")}
                placeholder="Nombre"
                className={`control uppercase ${errors.nombre ? "invalid" : ""}`}
              />
            </Field>
            <Field label="Apellido" required error={errors.apellido}>
              <input
                value={data.apellido}
                onChange={set("apellido")}
                placeholder="Apellido"
                className={`control uppercase ${errors.apellido ? "invalid" : ""}`}
              />
            </Field>
            <Field
              label="Fecha de nacimiento"
              required
              error={errors.nacimiento}
            >
              <input
                type="date"
                value={data.nacimiento}
                onChange={set("nacimiento")}
                className={`control ${errors.nacimiento ? "invalid" : ""}`}
              />
            </Field>
            <Field label="Edad">
              <input
                value={age === "" ? "—" : `${age} años`}
                disabled
                className="control disabled"
              />
            </Field>
            <RadioGroup
              label="Sexo"
              name="sexo"
              options={["Femenino", "Masculino"]}
              value={data.sexo}
              onChange={(v) => setData({ ...data, sexo: v })}
              className="sm:col-span-2"
            />
            <Field label="Estado civil">
              <select
                value={data.estadoCivil}
                onChange={set("estadoCivil")}
                className="control"
              >
                <option value="">Seleccionar</option>
                <option>Soltero/a</option>
                <option>Casado/a</option>
                <option>Divorciado/a</option>
                <option>Viudo/a</option>
              </select>
            </Field>
            <Field label="Ocupación">
              <input
                value={data.ocupacion}
                onChange={set("ocupacion")}
                placeholder="Ocupación"
                className="control uppercase"
              />
            </Field>
            <Field label="Teléfono fijo">
              <input
                value={data.telefono}
                onChange={set("telefono")}
                placeholder="011 4444-5555"
                className="control"
              />
            </Field>
            <Field label="Celular">
              <input
                value={data.celular}
                onChange={set("celular")}
                placeholder="11 5555-6666"
                className="control"
              />
            </Field>
          </Section>
        )}
        {activeTab === "domicilio" && (
          <Section
            icon={MapPin}
            title="Domicilio"
            description="Dirección de residencia del paciente"
          >
            <Field label="Calle" className="lg:col-span-2">
              <input
                value={data.calle}
                onChange={set("calle")}
                placeholder="Nombre de la calle"
                className="control uppercase"
              />
            </Field>
            <Field label="Número">
              <input
                value={data.numero}
                onChange={set("numero")}
                placeholder="1234"
                className="control"
              />
            </Field>
            <Field label="Código postal">
              <input
                value={data.codigoPostal}
                onChange={set("codigoPostal")}
                placeholder="B1704"
                className="control uppercase"
              />
            </Field>
            <Field label="Localidad" className="lg:col-span-2">
              <div className="flex gap-2">
                <input
                  value={data.localidad}
                  readOnly
                  placeholder="Seleccionar localidad"
                  className="control bg-slate-50 uppercase"
                />
                <button
                  type="button"
                  onClick={() => setLocationSearchOpen(true)}
                  className="icon-button"
                  title="Buscar localidad"
                  aria-label="Buscar localidad"
                >
                  <Search size={19} />
                </button>
              </div>
            </Field>
            <Field label="Departamento">
              <input
                value={data.partido}
                readOnly
                placeholder="Se completa automáticamente"
                className="control disabled uppercase"
              />
            </Field>
            <Field label="Provincia">
              <input
                value={data.provincia}
                readOnly
                placeholder="Se completa automáticamente"
                className="control disabled uppercase"
              />
            </Field>
          </Section>
        )}
        {activeTab === "cobertura" && (
          <Section
            icon={Stethoscope}
            title="Cobertura médica"
            description="Obra social y condición del beneficiario"
          >
            <Field label="Obra social" className="lg:col-span-2">
              <div className="flex gap-2">
                <input
                  value={data.obraSocial}
                  readOnly
                  placeholder="Ninguna obra social seleccionada"
                  className="control bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setInsuranceSearchOpen(true)}
                  className="icon-button"
                  title="Buscar obra social"
                  aria-label="Buscar obra social"
                >
                  <Search size={19} />
                </button>
              </div>
            </Field>
            <Field label="Número de afiliado" className="lg:col-span-2">
              <input
                value={data.numeroAfiliado}
                onChange={set("numeroAfiliado")}
                placeholder="Número de credencial"
                className="control"
              />
            </Field>
            <RadioGroup
              label="Tipo de beneficiario"
              name="beneficiario"
              options={["Titular", "Familiar", "Adherente", "Otro"]}
              value={data.beneficiario}
              onChange={(v) => setData({ ...data, beneficiario: v })}
              className="sm:col-span-2"
            />
            <RadioGroup
              label="Parentesco"
              name="parentesco"
              options={["Cónyuge", "Hijo/a", "Otro"]}
              value={data.parentesco}
              onChange={(v) => setData({ ...data, parentesco: v })}
              className="sm:col-span-2"
            />
          </Section>
        )}
      </fieldset>
      {!readOnly && (
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="secondary">
            Cancelar
          </button>
          <button className="primary">Guardar paciente</button>
        </div>
      )}
      {insuranceSearchOpen && (
        <InsuranceSearchModal
          items={healthInsurances}
          query={insuranceQuery}
          onQueryChange={setInsuranceQuery}
          onSelect={selectInsurance}
          onCancel={() => {
            setInsuranceSearchOpen(false);
            setInsuranceQuery("");
          }}
        />
      )}
      {locationSearchOpen && (
        <LocationSearchModal
          items={locations}
          query={locationQuery}
          onQueryChange={setLocationQuery}
          onSelect={selectLocation}
          onCancel={() => {
            setLocationSearchOpen(false);
            setLocationQuery("");
          }}
        />
      )}
    </form>
  );
}

function PatientList({ patients, onNew, onView, onEdit, onDelete, onHistory, canCreate, canEdit, canDelete }) {
  const [query, setQuery] = useState("");
  const filtered = patients.filter((p) =>
    `${p.nombre} ${p.apellido} ${p.dni} ${p.codigo}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const pagination = usePagination(filtered, [query]);
  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Pacientes
          </h2>
        </div>
        {canCreate && <button onClick={onNew} className="primary">
          <Plus size={18} /> Nuevo paciente
        </button>}
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="relative max-w-md">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, DNI o código..."
              className="control pl-11"
            />
          </div>
        </div>
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Paciente</th>
                  <th className="px-6 py-4">DNI</th>
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Cobertura</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageItems.map((p) => (
                  <tr key={p.codigo} className="border-t border-slate-100">
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {p.apellido}, {p.nombre}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{p.dni}</td>
                    <td className="px-6 py-4 text-slate-500">{p.codigo}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {p.obraSocial || "Sin cobertura"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        {onHistory && <button
                          onClick={() => onHistory(p)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-cyan-50 hover:text-cyan-700"
                          title="Historia clínica"
                        >
                          <BookOpen size={18} />
                        </button>}
                        <button
                          onClick={() => onView(p)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-hospital-50 hover:text-hospital-600"
                          title="Consultar"
                        >
                          <Eye size={18} />
                        </button>
                        {canEdit && <button
                          onClick={() => onEdit(p)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                          title="Modificar"
                        >
                          <Pencil size={18} />
                        </button>}
                        {canDelete && <button
                          onClick={() => onDelete(p)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Borrar"
                        >
                          <Trash2 size={18} />
                        </button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-[320px] place-items-center p-8 text-center">
            <div>
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-hospital-50 text-hospital-600">
                <UsersRound size={30} />
              </div>
              <h3 className="mt-5 font-bold text-slate-700">
                {query
                  ? "No encontramos pacientes"
                  : "Todavía no hay pacientes"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {query
                  ? "Probá con otro nombre, DNI o código."
                  : "Creá la primera ficha para comenzar a gestionar pacientes."}
              </p>
              {!query && canCreate && (
                <button
                  onClick={onNew}
                  className="mt-5 text-sm font-bold text-hospital-600 hover:text-hospital-700"
                >
                  Crear paciente
                </button>
              )}
            </div>
          </div>
        )}
        <Pagination {...pagination} total={filtered.length} onChange={pagination.setPage} />
      </section>
    </>
  );
}

function ProfessionalForm({
  initial = emptyProfessional,
  readOnly = false,
  specialties,
  locations,
  onAddSpecialty,
  onCancel,
  onSaved,
}) {
  const [data, setData] = useState(initial);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("datos");
  const [specialtyModalOpen, setSpecialtyModalOpen] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [specialtyError, setSpecialtyError] = useState("");
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const set = (key) => (e) => setData({ ...data, [key]: e.target.value });
  const selectLocation = (location) => {
    setData((current) => ({
      ...current,
      idLocalidad: location.id,
      localidad: location.nombre,
      partido: location.departamento,
      provincia: location.provincia,
    }));
    setLocationSearchOpen(false);
    setLocationQuery("");
  };
  const save = (e) => {
    e.preventDefault();
    if (readOnly) return onCancel();
    const next = {};
    if (!data.dni.trim()) next.dni = "Ingresá el DNI.";
    if (!data.nombre.trim()) next.nombre = "Ingresá el nombre.";
    if (!data.apellido.trim()) next.apellido = "Ingresá el apellido.";
    if (!data.matricula.trim())
      next.matricula = "Ingresá la matrícula profesional.";
    if (!data.especialidad) next.especialidad = "Seleccioná una especialidad.";
    if (
      data.autogestion !== "" &&
      (+data.autogestion < 0 || +data.autogestion > 100)
    )
      next.autogestion = "Debe ser un valor entre 0 y 100.";
    setErrors(next);
    if (Object.keys(next).length) return setActiveTab("datos");
    onSaved({
      ...data,
      codigo: data.codigo || `PRO-${String(Date.now()).slice(-5)}`,
    });
  };
  const modeTitle = readOnly
    ? "Detalle del profesional"
    : data.codigo
      ? "Modificar profesional"
      : "Nuevo profesional";
  const tabs = [
    { id: "datos", label: "Datos profesionales", icon: BriefcaseMedical },
    { id: "domicilio", label: "Domicilio", icon: MapPin },
  ];
  const input = (key, placeholder = "", extra = {}) => (
    <input
      value={data[key]}
      onChange={set(key)}
      placeholder={placeholder}
      disabled={readOnly || extra.disabled}
      type={extra.type || "text"}
      min={extra.min}
      max={extra.max}
      className={`control ${readOnly || extra.disabled ? "disabled" : ""} ${errors[key] ? "invalid" : ""} ${extra.uppercase ? "uppercase" : ""}`}
    />
  );
  const addSpecialty = () => {
    const value = newSpecialty.trim();
    if (!value)
      return setSpecialtyError("Ingresá el nombre de la especialidad.");
    const existing = specialties.find(
      (item) => item.toLocaleLowerCase() === value.toLocaleLowerCase(),
    );
    const selected = existing || value;
    if (!existing) onAddSpecialty(value);
    setData((current) => ({ ...current, especialidad: selected }));
    setErrors((current) => ({ ...current, especialidad: "" }));
    setNewSpecialty("");
    setSpecialtyError("");
    setSpecialtyModalOpen(false);
  };
  return (
    <>
      <form onSubmit={save}>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
              {modeTitle}
            </h2>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="secondary">
              {readOnly ? "Volver" : "Cancelar"}
            </button>
            {!readOnly && (
              <button className="primary">Guardar profesional</button>
            )}
          </div>
        </div>
        <FormTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <div id={`panel-${activeTab}`} role="tabpanel">
          {activeTab === "datos" && (
            <Section
              icon={BriefcaseMedical}
              title="Datos del profesional"
              description="Identificación, contacto y ejercicio profesional"
            >
              <Field label="Código profesional">
                {input("codigo", "Se asigna al guardar", { disabled: true })}
              </Field>
              <Field label="DNI" required error={errors.dni}>
                {input("dni", "Ej. 30123456")}
              </Field>
              <Field label="Nombre" required error={errors.nombre}>
                {input("nombre", "Nombre", { uppercase: true })}
              </Field>
              <Field label="Apellido" required error={errors.apellido}>
                {input("apellido", "Apellido", { uppercase: true })}
              </Field>
              <Field label="Teléfono fijo">
                {input("telefono", "011 4444-5555")}
              </Field>
              <Field label="Celular">{input("celular", "11 5555-6666")}</Field>
              <Field
                label="Matrícula profesional"
                required
                error={errors.matricula}
              >
                {input("matricula", "Ej. MP 12345", { uppercase: true })}
              </Field>
              <Field
                label="Porcentaje de autogestión"
                error={errors.autogestion}
              >
                <div className="relative">
                  {input("autogestion", "0", {
                    type: "number",
                    min: 0,
                    max: 100,
                  })}
                  <BadgePercent
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={19}
                  />
                </div>
              </Field>
              <Field
                label="Especialidad"
                required
                error={errors.especialidad}
                className="sm:col-span-2 lg:col-span-2"
              >
                <div className="flex gap-2">
                  <select
                    value={data.especialidad}
                    onChange={set("especialidad")}
                    disabled={readOnly}
                    className={`control ${readOnly ? "disabled" : ""} ${errors.especialidad ? "invalid" : ""}`}
                  >
                    <option value="">Seleccionar especialidad</option>
                    {specialties.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => setSpecialtyModalOpen(true)}
                      className="icon-button"
                      title="Nueva especialidad"
                      aria-label="Nueva especialidad"
                    >
                      <Plus size={19} />
                    </button>
                  )}
                </div>
              </Field>
            </Section>
          )}
          {activeTab === "domicilio" && (
            <Section
              icon={MapPin}
              title="Domicilio del profesional"
              description="Dirección y ubicación de contacto"
            >
              <Field label="Calle" className="lg:col-span-2">
                {input("calle", "Nombre de la calle", { uppercase: true })}
              </Field>
              <Field label="Número">{input("numero", "1234")}</Field>
              <Field label="Código postal">
                {input("codigoPostal", "B1704", { uppercase: true })}
              </Field>
              <Field label="Localidad" className="lg:col-span-2">
                <div className="flex gap-2">
                  <input
                    value={data.localidad}
                    readOnly
                    placeholder="Seleccionar localidad"
                    className="control bg-slate-50 uppercase"
                  />
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => setLocationSearchOpen(true)}
                      className="icon-button"
                      title="Buscar localidad"
                      aria-label="Buscar localidad"
                    >
                      <Search size={19} />
                    </button>
                  )}
                </div>
              </Field>
              <Field label="Departamento">
                {input("partido", "Se completa automáticamente", {
                  uppercase: true,
                  disabled: true,
                })}
              </Field>
              <Field label="Provincia">
                {input("provincia", "Se completa automáticamente", {
                  uppercase: true,
                  disabled: true,
                })}
              </Field>
            </Section>
          )}
        </div>
        {!readOnly && (
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="secondary">
              Cancelar
            </button>
            <button className="primary">Guardar profesional</button>
          </div>
        )}
      </form>
      {specialtyModalOpen && (
        <CreateOptionModal
          title="Nueva especialidad"
          label="Nombre de la especialidad"
          placeholder="Ej. Dermatología"
          value={newSpecialty}
          error={specialtyError}
          onChange={(value) => {
            setNewSpecialty(value);
            setSpecialtyError("");
          }}
          onCancel={() => {
            setSpecialtyModalOpen(false);
            setNewSpecialty("");
            setSpecialtyError("");
          }}
          onConfirm={addSpecialty}
        />
      )}
      {locationSearchOpen && (
        <LocationSearchModal
          items={locations}
          query={locationQuery}
          onQueryChange={setLocationQuery}
          onSelect={selectLocation}
          onCancel={() => {
            setLocationSearchOpen(false);
            setLocationQuery("");
          }}
        />
      )}
    </>
  );
}

function PersonnelForm({
  initial = emptyPersonnel,
  readOnly = false,
  areas,
  locations,
  onAddArea,
  onCancel,
  onSaved,
}) {
  const [data, setData] = useState(initial);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("datos");
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [newArea, setNewArea] = useState("");
  const [areaError, setAreaError] = useState("");
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const set = (key) => (e) => setData({ ...data, [key]: e.target.value });
  const selectLocation = (location) => {
    setData((current) => ({
      ...current,
      idLocalidad: location.id,
      localidad: location.nombre,
      partido: location.departamento,
      provincia: location.provincia,
    }));
    setLocationSearchOpen(false);
    setLocationQuery("");
  };
  const save = (e) => {
    e.preventDefault();
    if (readOnly) return onCancel();
    const next = {};
    if (!data.dni.trim()) next.dni = "Ingresá el DNI.";
    if (!data.nombre.trim()) next.nombre = "Ingresá el nombre.";
    if (!data.apellido.trim()) next.apellido = "Ingresá el apellido.";
    if (!data.area) next.area = "Seleccioná un área.";
    setErrors(next);
    if (Object.keys(next).length) return setActiveTab("datos");
    onSaved({
      ...data,
      codigo: data.codigo || `PER-${String(Date.now()).slice(-5)}`,
    });
  };
  const modeTitle = readOnly
    ? "Detalle del personal"
    : data.codigo
      ? "Modificar personal"
      : "Nuevo personal";
  const tabs = [
    { id: "datos", label: "Datos personales", icon: UserCog },
    { id: "domicilio", label: "Domicilio", icon: MapPin },
  ];
  const input = (key, placeholder = "", extra = {}) => (
    <input
      value={data[key]}
      onChange={set(key)}
      placeholder={placeholder}
      disabled={readOnly || extra.disabled}
      className={`control ${readOnly || extra.disabled ? "disabled" : ""} ${errors[key] ? "invalid" : ""} ${extra.uppercase ? "uppercase" : ""}`}
    />
  );
  const addArea = () => {
    const value = newArea.trim();
    if (!value) return setAreaError("Ingresá el nombre del área.");
    const existing = areas.find(
      (item) => item.toLocaleLowerCase() === value.toLocaleLowerCase(),
    );
    const selected = existing || value;
    if (!existing) onAddArea(value);
    setData((current) => ({ ...current, area: selected }));
    setErrors((current) => ({ ...current, area: "" }));
    setNewArea("");
    setAreaError("");
    setAreaModalOpen(false);
  };
  return (
    <>
      <form onSubmit={save}>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
              {modeTitle}
            </h2>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="secondary">
              {readOnly ? "Volver" : "Cancelar"}
            </button>
            {!readOnly && <button className="primary">Guardar personal</button>}
          </div>
        </div>
        <FormTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <div id={`panel-${activeTab}`} role="tabpanel">
          {activeTab === "datos" && (
            <Section
              icon={UserCog}
              title="Datos del personal"
              description="Identificación, contacto y área de trabajo"
            >
              <Field label="Código de personal">
                {input("codigo", "Se asigna al guardar", { disabled: true })}
              </Field>
              <Field label="DNI" required error={errors.dni}>
                {input("dni", "Ej. 30123456")}
              </Field>
              <Field label="Nombre" required error={errors.nombre}>
                {input("nombre", "Nombre", { uppercase: true })}
              </Field>
              <Field label="Apellido" required error={errors.apellido}>
                {input("apellido", "Apellido", { uppercase: true })}
              </Field>
              <Field label="Teléfono fijo">
                {input("telefono", "011 4444-5555")}
              </Field>
              <Field label="Celular">{input("celular", "11 5555-6666")}</Field>
              <Field
                label="Área"
                required
                error={errors.area}
                className="sm:col-span-2"
              >
                <div className="flex gap-2">
                  <select
                    value={data.area}
                    onChange={set("area")}
                    disabled={readOnly}
                    className={`control ${readOnly ? "disabled" : ""} ${errors.area ? "invalid" : ""}`}
                  >
                    <option value="">Seleccionar área</option>
                    {areas.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => setAreaModalOpen(true)}
                      className="icon-button"
                      title="Nueva área"
                      aria-label="Nueva área"
                    >
                      <Plus size={19} />
                    </button>
                  )}
                </div>
              </Field>
            </Section>
          )}
          {activeTab === "domicilio" && (
            <Section
              icon={MapPin}
              title="Domicilio del personal"
              description="Dirección y ubicación de contacto"
            >
              <Field label="Calle" className="lg:col-span-2">
                {input("calle", "Nombre de la calle", { uppercase: true })}
              </Field>
              <Field label="Número">{input("numero", "1234")}</Field>
              <Field label="Código postal">
                {input("codigoPostal", "B1704", { uppercase: true })}
              </Field>
              <Field label="Localidad" className="lg:col-span-2">
                <div className="flex gap-2">
                  <input
                    value={data.localidad}
                    readOnly
                    placeholder="Seleccionar localidad"
                    className="control bg-slate-50 uppercase"
                  />
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => setLocationSearchOpen(true)}
                      className="icon-button"
                      title="Buscar localidad"
                      aria-label="Buscar localidad"
                    >
                      <Search size={19} />
                    </button>
                  )}
                </div>
              </Field>
              <Field label="Departamento">
                {input("partido", "Se completa automáticamente", {
                  uppercase: true,
                  disabled: true,
                })}
              </Field>
              <Field label="Provincia">
                {input("provincia", "Se completa automáticamente", {
                  uppercase: true,
                  disabled: true,
                })}
              </Field>
            </Section>
          )}
        </div>
        {!readOnly && (
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="secondary">
              Cancelar
            </button>
            <button className="primary">Guardar personal</button>
          </div>
        )}
      </form>
      {areaModalOpen && (
        <CreateOptionModal
          title="Nueva área"
          label="Nombre del área"
          placeholder="Ej. Recursos Humanos"
          value={newArea}
          error={areaError}
          onChange={(value) => {
            setNewArea(value);
            setAreaError("");
          }}
          onCancel={() => {
            setAreaModalOpen(false);
            setNewArea("");
            setAreaError("");
          }}
          onConfirm={addArea}
        />
      )}
      {locationSearchOpen && (
        <LocationSearchModal
          items={locations}
          query={locationQuery}
          onQueryChange={setLocationQuery}
          onSelect={selectLocation}
          onCancel={() => {
            setLocationSearchOpen(false);
            setLocationQuery("");
          }}
        />
      )}
    </>
  );
}

function PersonnelList({ personnel, onNew, onView, onEdit, onDelete }) {
  const [query, setQuery] = useState("");
  const filtered = personnel.filter((p) =>
    `${p.nombre} ${p.apellido} ${p.dni} ${p.area}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const pagination = usePagination(filtered, [query]);
  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Personal
          </h2>
        </div>
        <button onClick={onNew} className="primary">
          <Plus size={18} /> Nuevo personal
        </button>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="relative max-w-md">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, DNI o área..."
              className="control pl-11"
            />
          </div>
        </div>
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Personal</th>
                  <th className="px-6 py-4">DNI</th>
                  <th className="px-6 py-4">Área</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageItems.map((p) => (
                  <tr key={p.codigo} className="border-t border-slate-100">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-700">
                        {p.apellido}, {p.nombre}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{p.dni}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-hospital-50 px-3 py-1 text-xs font-semibold text-hospital-700">
                        {p.area}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {p.celular || p.telefono || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => onView(p)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-hospital-50 hover:text-hospital-600"
                          title="Consultar"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => onEdit(p)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                          title="Modificar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => onDelete(p)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Borrar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-[320px] place-items-center p-8 text-center">
            <div>
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-hospital-50 text-hospital-600">
                <UserCog size={30} />
              </div>
              <h3 className="mt-5 font-bold text-slate-700">
                {query
                  ? "No encontramos personal"
                  : "Todavía no hay personal registrado"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {query
                  ? "Probá con otro nombre, DNI o área."
                  : "Registrá a la primera persona para comenzar."}
              </p>
              {!query && (
                <button
                  onClick={onNew}
                  className="mt-5 text-sm font-bold text-hospital-600 hover:text-hospital-700"
                >
                  Crear personal
                </button>
              )}
            </div>
          </div>
        )}
        <Pagination {...pagination} total={filtered.length} onChange={pagination.setPage} />
      </section>
    </>
  );
}

function ProfessionalList({ professionals, onNew, onView, onEdit, onDelete }) {
  const [query, setQuery] = useState("");
  const filtered = professionals.filter((p) =>
    `${p.nombre} ${p.apellido} ${p.dni} ${p.matricula} ${p.especialidad}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const pagination = usePagination(filtered, [query]);
  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Profesionales
          </h2>
        </div>
        <button onClick={onNew} className="primary">
          <Plus size={18} /> Nuevo profesional
        </button>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="relative max-w-md">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, DNI, matrícula o especialidad..."
              className="control pl-11"
            />
          </div>
        </div>
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Profesional</th>
                  <th className="px-6 py-4">DNI</th>
                  <th className="px-6 py-4">Matrícula</th>
                  <th className="px-6 py-4">Especialidad</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageItems.map((p) => (
                  <tr key={p.codigo} className="border-t border-slate-100">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-700">
                        {p.apellido}, {p.nombre}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{p.dni}</td>
                    <td className="px-6 py-4 text-slate-500">{p.matricula}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-hospital-50 px-3 py-1 text-xs font-semibold text-hospital-700">
                        {p.especialidad}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {p.celular || p.telefono || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => onView(p)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-hospital-50 hover:text-hospital-600"
                          title="Consultar"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => onEdit(p)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                          title="Modificar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => onDelete(p)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Borrar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-[320px] place-items-center p-8 text-center">
            <div>
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-hospital-50 text-hospital-600">
                <BriefcaseMedical size={30} />
              </div>
              <h3 className="mt-5 font-bold text-slate-700">
                {query
                  ? "No encontramos profesionales"
                  : "Todavía no hay profesionales"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {query
                  ? "Probá con otro nombre, DNI, matrícula o especialidad."
                  : "Registrá al primer profesional para comenzar."}
              </p>
              {!query && (
                <button
                  onClick={onNew}
                  className="mt-5 text-sm font-bold text-hospital-600 hover:text-hospital-700"
                >
                  Crear profesional
                </button>
              )}
            </div>
          </div>
        )}
        <Pagination {...pagination} total={filtered.length} onChange={pagination.setPage} />
      </section>
    </>
  );
}

function MedicationForm({ initial = emptyMedication, onCancel, onSaved }) {
  const [data, setData] = useState(initial);
  const [errors, setErrors] = useState({});
  const set = (key) => (e) => setData({ ...data, [key]: e.target.value });
  const save = (e) => {
    e.preventDefault();
    const next = {};
    if (!data.producto.trim())
      next.producto = "Ingresá el nombre del producto.";
    if (!data.presentacion.trim())
      next.presentacion = "Ingresá la presentación.";
    if (data.precio === "" || Number(data.precio) < 0)
      next.precio = "Ingresá un precio válido.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onSaved({
      ...data,
      id: data.id || `MED-${String(Date.now()).slice(-5)}`,
      precio: Number(data.precio),
    });
  };
  return (
    <form onSubmit={save}>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            {data.id ? "Editar medicamento" : "Nuevo medicamento"}
          </h2>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="secondary">
            Cancelar
          </button>
          <button className="primary">Guardar medicamento</button>
        </div>
      </div>
      <Section
        icon={Pill}
        title="Datos del medicamento"
        description="Producto, presentación y precio"
      >
        <Field
          label="Producto"
          required
          error={errors.producto}
          className="sm:col-span-2"
        >
          <input
            autoFocus
            value={data.producto}
            onChange={set("producto")}
            placeholder="Ej. Paracetamol"
            className={`control uppercase ${errors.producto ? "invalid" : ""}`}
          />
        </Field>
        <Field label="Presentación" required error={errors.presentacion}>
          <input
            value={data.presentacion}
            onChange={set("presentacion")}
            placeholder="Ej. Caja x 20 comprimidos"
            className={`control uppercase ${errors.presentacion ? "invalid" : ""}`}
          />
        </Field>
        <Field label="Precio" required error={errors.precio}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
              $
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={data.precio}
              onChange={set("precio")}
              placeholder="0,00"
              className={`control pl-8 ${errors.precio ? "invalid" : ""}`}
            />
          </div>
        </Field>
      </Section>
    </form>
  );
}

function MedicationList({ medications, onNew, onEdit, onDelete }) {
  const [query, setQuery] = useState("");
  const filtered = medications.filter((m) =>
    `${m.producto} ${m.presentacion}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const pagination = usePagination(filtered, [query]);
  const money = (value) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value);
  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Medicamentos
          </h2>
        </div>
        <button onClick={onNew} className="primary">
          <Plus size={18} /> Nuevo medicamento
        </button>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="relative max-w-xl">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por producto o presentación..."
              className="control pl-11"
            />
          </div>
        </div>
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Presentación</th>
                  <th className="px-6 py-4 text-right">Precio</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageItems.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {m.producto}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {m.presentacion}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-700">
                      {money(m.precio)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => onEdit(m)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => onDelete(m)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Borrar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-[320px] place-items-center p-8 text-center">
            <div>
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-hospital-50 text-hospital-600">
                <Pill size={30} />
              </div>
              <h3 className="mt-5 font-bold text-slate-700">
                {query
                  ? "No encontramos medicamentos"
                  : "Todavía no hay medicamentos"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {query
                  ? "Probá con otro producto o presentación."
                  : "Registrá el primer medicamento para comenzar."}
              </p>
              {!query && (
                <button
                  onClick={onNew}
                  className="mt-5 text-sm font-bold text-hospital-600 hover:text-hospital-700"
                >
                  Crear medicamento
                </button>
              )}
            </div>
          </div>
        )}
        <Pagination {...pagination} total={filtered.length} onChange={pagination.setPage} />
      </section>
    </>
  );
}

function HealthInsuranceForm({
  initial = emptyHealthInsurance,
  onCancel,
  onSaved,
}) {
  const [data, setData] = useState(initial);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("datos");
  const set = (key) => (e) => setData({ ...data, [key]: e.target.value });
  const save = (e) => {
    e.preventDefault();
    const next = {};
    if (!data.descripcion.trim()) next.descripcion = "Ingresá la descripción.";
    if (!data.sigla.trim()) next.sigla = "Ingresá la sigla.";
    setErrors(next);
    if (Object.keys(next).length) return setActiveTab("datos");
    onSaved({
      ...data,
      codigo: data.codigo || `OS-${String(Date.now()).slice(-5)}`,
    });
  };
  const tabs = [
    { id: "datos", label: "Datos", icon: Building2 },
    { id: "domicilio", label: "Domicilio", icon: MapPin },
  ];
  return (
    <form onSubmit={save}>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            {data.codigo ? "Editar obra social" : "Nueva obra social"}
          </h2>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="secondary">
            Cancelar
          </button>
          <button className="primary">Guardar obra social</button>
        </div>
      </div>
      <FormTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <div id={`panel-${activeTab}`} role="tabpanel">
        {activeTab === "datos" && (
          <Section
            icon={Building2}
            title="Datos de la obra social"
            description="Identificación institucional"
          >
            <Field label="Código">
              <input
                value={data.codigo || "Se asigna al guardar"}
                disabled
                className="control disabled"
              />
            </Field>
            <Field label="Sigla" required error={errors.sigla}>
              <input
                value={data.sigla}
                onChange={set("sigla")}
                placeholder="Ej. OSDE"
                className={`control uppercase ${errors.sigla ? "invalid" : ""}`}
              />
            </Field>
            <Field
              label="Descripción"
              required
              error={errors.descripcion}
              className="sm:col-span-2"
            >
              <input
                autoFocus
                value={data.descripcion}
                onChange={set("descripcion")}
                placeholder="Nombre completo de la obra social"
                className={`control uppercase ${errors.descripcion ? "invalid" : ""}`}
              />
            </Field>
          </Section>
        )}
        {activeTab === "domicilio" && (
          <Section
            icon={MapPin}
            title="Domicilio"
            description="Dirección de la sede o delegación"
          >
            <Field label="Calle" className="sm:col-span-2">
              <input
                value={data.calle}
                onChange={set("calle")}
                placeholder="Nombre de la calle"
                className="control uppercase"
              />
            </Field>
            <Field label="Número">
              <input
                value={data.numero}
                onChange={set("numero")}
                placeholder="1234"
                className="control uppercase"
              />
            </Field>
            <Field label="Código postal">
              <input
                value={data.codigoPostal}
                onChange={set("codigoPostal")}
                placeholder="B1704"
                className="control uppercase"
              />
            </Field>
            <Field label="Localidad" className="sm:col-span-2">
              <input
                value={data.localidad}
                onChange={set("localidad")}
                placeholder="Localidad"
                className="control uppercase"
              />
            </Field>
          </Section>
        )}
      </div>
    </form>
  );
}

function HealthInsuranceList({ healthInsurances, onNew, onEdit, onDelete }) {
  const [query, setQuery] = useState("");
  const filtered = healthInsurances.filter((item) =>
    `${item.descripcion} ${item.sigla} ${item.codigo} ${item.localidad}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const pagination = usePagination(filtered, [query]);
  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Obras sociales
          </h2>
        </div>
        <button onClick={onNew} className="primary">
          <Plus size={18} /> Nueva obra social
        </button>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="relative max-w-xl">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, sigla, código o localidad..."
              className="control pl-11"
            />
          </div>
        </div>
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Obra social</th>
                  <th className="px-6 py-4">Sigla</th>
                  <th className="px-6 py-4">Domicilio</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageItems.map((item) => (
                  <tr key={item.codigo} className="border-t border-slate-100">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-700">
                        {item.descripcion}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.codigo}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-hospital-50 px-3 py-1 text-xs font-semibold text-hospital-700">
                        {item.sigla}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {[
                        item.calle && `${item.calle} ${item.numero}`.trim(),
                        item.localidad,
                        item.codigoPostal,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => onEdit(item)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Borrar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-[320px] place-items-center p-8 text-center">
            <div>
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-hospital-50 text-hospital-600">
                <Building2 size={30} />
              </div>
              <h3 className="mt-5 font-bold text-slate-700">
                {query
                  ? "No encontramos obras sociales"
                  : "Todavía no hay obras sociales"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {query
                  ? "Probá con otro nombre, sigla, código o localidad."
                  : "Registrá la primera obra social para comenzar."}
              </p>
              {!query && (
                <button
                  onClick={onNew}
                  className="mt-5 text-sm font-bold text-hospital-600 hover:text-hospital-700"
                >
                  Crear obra social
                </button>
              )}
            </div>
          </div>
        )}
        <Pagination {...pagination} total={filtered.length} onChange={pagination.setPage} />
      </section>
    </>
  );
}

function NomenclatureForm({ onCancel, onSaved }) {
  const [data, setData] = useState(emptyNomenclature);
  const [errors, setErrors] = useState({});
  const set = (key) => (e) => setData({ ...data, [key]: e.target.value });
  const save = (e) => {
    e.preventDefault();
    const next = {};
    if (!data.codigo.trim()) next.codigo = "Ingresá el código.";
    if (!data.descripcion.trim()) next.descripcion = "Ingresá la descripción.";
    if (data.arancel === "" || Number(data.arancel) < 0)
      next.arancel = "Ingresá un arancel válido.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onSaved({
      ...data,
      id: `NOM-${Date.now()}`,
      arancel: Number(data.arancel),
    });
  };
  return (
    <form onSubmit={save}>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Agregar código
          </h2>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="secondary">
            Cancelar
          </button>
          <button className="primary">Guardar código</button>
        </div>
      </div>
      <Section
        icon={BookOpen}
        title="Datos del código"
        description="Código, descripción y valor arancelario"
      >
        <Field label="Código" required error={errors.codigo}>
          <input
            autoFocus
            value={data.codigo}
            onChange={set("codigo")}
            placeholder="Ej. 01.01.01"
            className={`control uppercase ${errors.codigo ? "invalid" : ""}`}
          />
        </Field>
        <Field
          label="Descripción"
          required
          error={errors.descripcion}
          className="sm:col-span-2"
        >
          <input
            value={data.descripcion}
            onChange={set("descripcion")}
            placeholder="Descripción de la prestación"
            className={`control uppercase ${errors.descripcion ? "invalid" : ""}`}
          />
        </Field>
        <Field label="Arancel" required error={errors.arancel}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
              $
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={data.arancel}
              onChange={set("arancel")}
              placeholder="0,00"
              className={`control pl-8 ${errors.arancel ? "invalid" : ""}`}
            />
          </div>
        </Field>
      </Section>
    </form>
  );
}

function FeeEditor({ value, onSave }) {
  const [amount, setAmount] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  useEffect(() => setAmount(value ?? ""), [value]);
  const changed = amount !== "" && Number(amount) >= 0 && Number(amount) !== Number(value);
  const save = async () => {
    setSaving(true);
    try { await onSave(Number(amount)); } catch { /* El contenedor muestra el error. */ } finally { setSaving(false); }
  };
  return <div className="flex min-w-48 items-center justify-end gap-2"><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span><input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="control w-32 pl-7 text-right" aria-label="Arancel" /></div><button type="button" onClick={save} disabled={!changed || saving} className="primary shrink-0 disabled:cursor-not-allowed disabled:opacity-40">{saving ? "..." : "Guardar"}</button></div>;
}

function NomenclatureList({ nomenclatures, cieCodes, laboratoryCodes, onNew, onFeeChange }) {
  const [activeTab, setActiveTab] = useState("nphpgd");
  const [query, setQuery] = useState("");
  const tabs = [
    { id: "nphpgd", label: "NPHPGD" },
    { id: "cie10", label: "CIE 10" },
    { id: "laboratory", label: "Nomenclador de laboratorio" },
  ];
  const records =
    activeTab === "nphpgd"
      ? nomenclatures
      : activeTab === "cie10"
        ? cieCodes
        : laboratoryCodes;
  const filtered = records.filter((item) =>
    `${item.codigo} ${item.descripcion}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const pagination = usePagination(filtered, [query, activeTab]);
  const hasFee = activeTab !== "cie10";
  const money = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount)
      ? new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
        }).format(amount)
      : "—";
  };
  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Nomenclador
          </h2>
        </div>
        {activeTab === "nphpgd" && (
          <button onClick={onNew} className="primary">
            <Plus size={18} /> Agregar código
          </button>
        )}
      </div>
      <div className="mb-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <div className="flex min-w-max gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setQuery("");
              }}
              className={`rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${activeTab === tab.id ? "bg-hospital-600 text-white shadow-sm" : "text-slate-500 hover:bg-hospital-50 hover:text-hospital-700"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-xl">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por código o descripción..."
              className="control pl-11"
            />
          </div>
          <p className="shrink-0 text-sm font-semibold text-emerald-600">
            {filtered.length}{" "}
            {filtered.length === 1
              ? "registro encontrado"
              : "registros encontrados"}
          </p>
        </div>
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Descripción</th>
                  {hasFee && <th className="px-6 py-4 text-right">Arancel</th>}
                </tr>
              </thead>
              <tbody>
                {pagination.pageItems.map((item) => (
                  <tr
                    key={item.id || item.codigo}
                    className="border-t border-slate-100"
                  >
                    <td className="px-6 py-4 font-semibold text-hospital-700">
                      {item.codigo}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.descripcion}
                    </td>
                    {hasFee && <td className="px-6 py-3"><FeeEditor value={item.arancel} onSave={(arancel) => onFeeChange(item, arancel)} /></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-[300px] place-items-center p-8 text-center">
            <div>
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-hospital-50 text-hospital-600">
                <BookOpen size={30} />
              </div>
              <h3 className="mt-5 font-bold text-slate-700">
                {query
                  ? "No encontramos códigos"
                  : "No hay registros en este nomenclador"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {query
                  ? "Probá con otro código o descripción."
                  : activeTab === "nphpgd"
                    ? "Agregá el primer código para comenzar."
                    : "Los registros se mostrarán cuando estén disponibles."}
              </p>
              {!query && activeTab === "nphpgd" && (
                <button
                  onClick={onNew}
                  className="mt-5 text-sm font-bold text-hospital-600"
                >
                  Agregar código
                </button>
              )}
            </div>
          </div>
        )}
        <Pagination {...pagination} total={filtered.length} onChange={pagination.setPage} />
      </section>
    </>
  );
}

function CatalogSearchModal({ catalog, catalogLabel, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const results = normalizedQuery
    ? catalog
        .filter((item) =>
          normalizedQuery
            .split(/\s+/)
            .every((term) =>
              Object.values(item)
                .join(" ")
                .toLocaleLowerCase("es")
                .includes(term),
            ),
        )
        .slice(0, 50)
    : catalog.slice(0, 50);
  const code = (item) => item.codigo || item.producto || item.id || "—";
  const description = (item) =>
    item.descripcion || item.presentacion || item.producto || "Sin descripción";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-search-title"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div>
            <p className="text-sm font-semibold text-hospital-600">
              Selección de registro
            </p>
            <h3
              id="catalog-search-title"
              className="mt-1 text-xl font-bold text-slate-800"
            >
              Buscar en {catalogLabel}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Buscá por código, descripción o nombre y seleccioná un resultado.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button"
            aria-label="Cerrar búsqueda"
          >
            <X size={20} />
          </button>
        </div>
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Buscar en ${catalogLabel}...`}
              className="control pl-11"
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {results.length} {results.length === 1 ? "resultado" : "resultados"}
          </p>
        </div>
        <div className="min-h-[280px] overflow-auto">
          {results.length ? (
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Código / Producto</th>
                  <th className="px-5 py-3">Descripción / Presentación</th>
                  <th className="px-5 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, index) => (
                  <tr
                    key={item.id || item.codigo || `${item.producto}-${index}`}
                    className="border-t border-slate-100 hover:bg-hospital-50/50"
                  >
                    <td className="px-5 py-4 font-semibold text-hospital-700">
                      {code(item)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {description(item)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelect(item)}
                        className="primary"
                      >
                        Seleccionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="grid min-h-[280px] place-items-center p-8 text-center">
              <div>
                <Search className="mx-auto text-slate-300" size={36} />
                <p className="mt-3 font-semibold text-slate-700">
                  No encontramos registros
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {catalog.length
                    ? "Probá con otro criterio de búsqueda."
                    : `No hay datos cargados en ${catalogLabel}.`}
                </p>
              </div>
            </div>
          )}
        </div>
        {catalog.length > 50 && (
          <p className="border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
            Se muestran hasta 50 resultados. Refiná la búsqueda para encontrar
            el registro.
          </p>
        )}
      </div>
    </div>
  );
}

function ProfessionalSearchModal({ professionals, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("es");
  const results = professionals.filter((item) =>
    `${item.apellido} ${item.nombre} ${item.dni} ${item.matricula} ${item.especialidad}`
      .toLocaleLowerCase("es").includes(normalized),
  ).slice(0, 50);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-slate-100 p-6"><div><p className="text-sm font-semibold text-hospital-600">Equipo médico</p><h3 className="mt-1 text-xl font-bold text-slate-800">Buscar profesional</h3><p className="mt-1 text-sm text-slate-500">Buscá por nombre, DNI, matrícula o especialidad.</p></div><button type="button" onClick={onClose} className="icon-button" aria-label="Cerrar"><X size={20} /></button></div>
      <div className="border-b border-slate-100 p-5"><div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={19} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, matrícula o especialidad..." className="control pl-11" /></div></div>
      <div className="min-h-[260px] overflow-y-auto">{results.length ? <table className="w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Profesional</th><th className="px-5 py-3">Matrícula</th><th className="px-5 py-3">Especialidad</th><th className="px-5 py-3 text-right">Acción</th></tr></thead><tbody>{results.map((item) => <tr key={item.codigo} className="border-t border-slate-100"><td className="px-5 py-4 font-semibold text-slate-700">{item.apellido}, {item.nombre}</td><td className="px-5 py-4 text-slate-500">{item.matricula || "—"}</td><td className="px-5 py-4 text-slate-500">{item.especialidad || "—"}</td><td className="px-5 py-4 text-right"><button type="button" onClick={() => onSelect(item)} className="primary">Seleccionar</button></td></tr>)}</tbody></table> : <div className="grid min-h-[260px] place-items-center text-center text-slate-500">No encontramos profesionales.</div>}</div>
    </div>
  </div>;
}

function CaboItems({
  title,
  icon,
  items,
  columns,
  onChange,
  readOnly,
  catalog = [],
  catalogLabel = "catálogo",
  toRecord,
  lockedKeys = [],
  professionals = [],
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [professionalTarget, setProfessionalTarget] = useState(null);
  const update = (index, key, value) =>
    onChange(
      items.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  const addFromCatalog = (item) => {
    onChange([...items, toRecord(item)]);
    setSearchOpen(false);
  };
  const selectProfessional = (professional) => {
    const { index, key } = professionalTarget;
    const label = `${professional.apellido}, ${professional.nombre}`;
    onChange(items.map((item, i) => i === index ? { ...item, [key]: label, [`${key}Id`]: professional.codigo } : item));
    setProfessionalTarget(null);
  };
  return (
    <Section
      icon={icon}
      title={title}
      description={`Seleccioná registros cargados en el módulo de ${catalogLabel}`}
    >
      <div className="sm:col-span-2 lg:col-span-4">
        {!readOnly && (
          <div className="mb-4 flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Agregar desde {catalogLabel}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                El registro seleccionado se incorporará a la grilla.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="primary shrink-0"
            >
              <Search size={17} /> Buscar y seleccionar
            </button>
          </div>
        )}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-3">
                    {column.label}
                  </th>
                ))}
                {!readOnly && (
                  <th className="px-4 py-3 text-right">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((item, index) => (
                  <tr key={index} className="border-t border-slate-100">
                    {columns.map((column) => {
                      const locked = lockedKeys.includes(column.key);
                      const professionalField = column.key === "profesional1" || column.key === "profesional2";
                      return (
                        <td key={column.key} className="p-2">
                          {professionalField ? <div className="flex min-w-56 items-center gap-2"><span className={`control flex min-h-11 items-center ${!item[column.key] ? "text-slate-400" : "font-semibold text-slate-700"}`}>{item[column.key] || "Sin asignar"}</span>{!readOnly && <button type="button" onClick={() => setProfessionalTarget({ index, key: column.key })} className="primary shrink-0" title={`Buscar ${column.label.toLowerCase()}`}><Search size={17} /></button>}</div> : <input
                            type={column.key === "cantidad" ? "number" : "text"}
                            min={column.key === "cantidad" ? 1 : undefined}
                            value={item[column.key] ?? ""}
                            onChange={(e) =>
                              update(index, column.key, e.target.value)
                            }
                            disabled={readOnly || locked}
                            placeholder={column.label}
                            className={`control ${readOnly || locked ? "disabled" : ""}`}
                          />}
                        </td>
                      );
                    })}
                    {!readOnly && (
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            onChange(items.filter((_, i) => i !== index))
                          }
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          aria-label="Quitar registro"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + (readOnly ? 0 : 1)}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    Sin registros cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {searchOpen && (
          <CatalogSearchModal
            catalog={catalog}
            catalogLabel={catalogLabel}
            onSelect={addFromCatalog}
            onClose={() => setSearchOpen(false)}
          />
        )}
        {professionalTarget && <ProfessionalSearchModal professionals={professionals} onSelect={selectProfessional} onClose={() => setProfessionalTarget(null)} />}
      </div>
    </Section>
  );
}

function PatientSearchModal({ patients, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const results = normalizedQuery
    ? patients
        .filter((patient) => {
          const description =
            `${patient.nombre} ${patient.apellido} ${patient.dni}`.toLocaleLowerCase(
              "es",
            );
          return normalizedQuery
            .split(/\s+/)
            .every((term) => description.includes(term));
        })
        .slice(0, 50)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-search-title"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div>
            <p className="text-sm font-semibold text-hospital-600">
              Selección de beneficiario
            </p>
            <h3
              id="patient-search-title"
              className="mt-1 text-xl font-bold text-slate-800"
            >
              Buscar paciente
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Ingresá nombre, apellido o número de documento.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button"
            aria-label="Cerrar búsqueda"
          >
            <X size={20} />
          </button>
        </div>
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ej.: García, Ana o 30123456"
              className="control pl-11"
            />
          </div>
        </div>
        <div className="min-h-[260px] overflow-y-auto">
          {!normalizedQuery ? (
            <div className="grid min-h-[260px] place-items-center p-8 text-center">
              <div>
                <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-hospital-50 text-hospital-600">
                  <Search size={26} />
                </div>
                <p className="mt-4 font-semibold text-slate-700">
                  Escribí para iniciar la búsqueda
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  No se cargan pacientes hasta ingresar un criterio.
                </p>
              </div>
            </div>
          ) : results.length ? (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Paciente</th>
                  <th className="px-5 py-3">Documento</th>
                  <th className="px-5 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {results.map((patient) => (
                  <tr
                    key={patient.codigo || patient.dni}
                    className="border-t border-slate-100"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-700">
                        {patient.apellido}, {patient.nombre}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Código {patient.codigo || "—"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{patient.dni}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelect(patient)}
                        className="primary"
                      >
                        Seleccionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="grid min-h-[260px] place-items-center p-8 text-center">
              <div>
                <p className="font-semibold text-slate-700">
                  No encontramos pacientes
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Revisá el nombre, apellido o documento ingresado.
                </p>
              </div>
            </div>
          )}
        </div>
        {results.length === 50 && (
          <p className="border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
            Se muestran los primeros 50 resultados. Refiná la búsqueda para
            encontrar al paciente.
          </p>
        )}
      </div>
    </div>
  );
}

function CaboForm({
  initial = emptyCabo,
  readOnly = false,
  patients,
  professionals,
  healthInsurances,
  medications,
  nomenclatures,
  cieCodes,
  laboratoryCodes,
  onCancel,
  onSaved,
}) {
  const [data, setData] = useState(initial);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("datos");
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const set = (key) => (e) =>
    setData((current) => ({ ...current, [key]: e.target.value }));
  const selectPatient = (patient) => {
    setData((current) => ({
      ...current,
      pacienteCodigo: patient.codigo,
      dni: patient.dni,
      nombre: `${patient.apellido}, ${patient.nombre}`,
      edad: patient.edad ?? "",
      sexo: patient.sexo,
      beneficiario: patient.beneficiario,
      parentesco: patient.parentesco,
      obraSocial: patient.obraSocial,
    }));
    setErrors((current) => ({ ...current, dni: "" }));
    setPatientSearchOpen(false);
  };
  const selectInsurance = (e) => {
    const insurance = healthInsurances.find(
      (item) => item.codigo === e.target.value,
    );
    setData((current) => ({
      ...current,
      obraSocial: insurance?.descripcion || "",
      rnos: insurance?.codigo || "",
    }));
  };
  const save = (e) => {
    e.preventDefault();
    if (readOnly) return onCancel();
    const next = {};
    if (!data.fecha) next.fecha = "Seleccioná la fecha.";
    if (!data.dni.trim()) next.dni = "Seleccioná un beneficiario.";
    if (!data.tipoAtencion)
      next.tipoAtencion = "Seleccioná el tipo de atención.";
    setErrors(next);
    if (next.fecha || next.dni) return setActiveTab("datos");
    if (next.tipoAtencion) return setActiveTab("atencion");
    onSaved({
      ...data,
      id: data.id || `CABO-${Date.now()}`,
      numero: data.numero || String(Date.now()).slice(-8),
    });
  };
  const tabs = [
    { id: "datos", label: "Datos y beneficiario", icon: UserRound },
    { id: "atencion", label: "Atención y diagnóstico", icon: Activity },
    { id: "medicamentos", label: "Medicamentos", icon: Pill },
    { id: "laboratorio", label: "Laboratorio", icon: FlaskConical },
  ];
  const input = (key, options = {}) => (
    <input
      type={options.type || "text"}
      value={data[key]}
      onChange={set(key)}
      disabled={readOnly || options.disabled}
      className={`control ${readOnly || options.disabled ? "disabled" : ""} ${errors[key] ? "invalid" : ""}`}
    />
  );
  return (
    <form onSubmit={save}>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            {readOnly
              ? "Consulta de Cabo"
              : data.id
                ? "Modificar Cabo"
                : "Nuevo Cabo"}
          </h2>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="secondary">
            {readOnly ? "Volver" : "Cancelar"}
          </button>
          {!readOnly && <button className="primary">Guardar Cabo</button>}
        </div>
      </div>
      <FormTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <div id={`panel-${activeTab}`} role="tabpanel">
        {activeTab === "datos" && (
          <div className="space-y-5">
            <Section
              icon={ClipboardPlus}
              title="Datos CABOS"
              description="Identificación del comprobante"
            >
              <Field label="Fecha" required error={errors.fecha}>
                {input("fecha", { type: "date" })}
              </Field>
              <Field label="Número Cabo">
                {input("numero", { disabled: true })}
              </Field>
              <Field label="Código HPdGD REFES" className="sm:col-span-2">
                {input("codigoRefes", { disabled: true })}
              </Field>
            </Section>
            <Section
              icon={UserRound}
              title="Datos del beneficiario"
              description="Paciente y condición ante el seguro de salud"
            >
              <Field
                label="Paciente"
                required
                error={errors.dni}
                className="sm:col-span-2"
              >
                <div
                  className={`flex min-h-11 items-center justify-between gap-3 rounded-xl border bg-slate-50 p-2 pl-3.5 ${errors.dni ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                >
                  <span
                    className={`min-w-0 truncate text-sm ${data.nombre ? "font-semibold text-slate-700" : "text-slate-400"}`}
                  >
                    {data.nombre
                      ? `${data.nombre} · DNI ${data.dni}`
                      : "Ningún paciente seleccionado"}
                  </span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => setPatientSearchOpen(true)}
                      className="primary shrink-0"
                    >
                      <Search size={17} />{" "}
                      {data.nombre ? "Cambiar" : "Buscar paciente"}
                    </button>
                  )}
                </div>
              </Field>
              <Field label="DNI">{input("dni", { disabled: true })}</Field>
              <Field label="Edad">{input("edad", { disabled: true })}</Field>
              <Field label="Nombre" className="sm:col-span-2">
                {input("nombre", { disabled: true })}
              </Field>
              <Field label="Sexo">{input("sexo", { disabled: true })}</Field>
              <Field label="Tipo de beneficiario">
                {input("beneficiario", { disabled: true })}
              </Field>
              <Field label="Parentesco">
                {input("parentesco", { disabled: true })}
              </Field>
            </Section>
            <Section
              icon={Building2}
              title="Agente del Seguro de Salud"
              description="Obra social y Registro Nacional de Obras Sociales"
            >
              <Field label="Obra social" className="sm:col-span-2">
                <select
                  value={
                    healthInsurances.find(
                      (item) => item.descripcion === data.obraSocial,
                    )?.codigo || ""
                  }
                  onChange={selectInsurance}
                  disabled={readOnly}
                  className={`control ${readOnly ? "disabled" : ""}`}
                >
                  <option value="">Sin obra social</option>
                  {healthInsurances.map((item) => (
                    <option key={item.codigo} value={item.codigo}>
                      {item.descripcion}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="RNOS">{input("rnos", { disabled: true })}</Field>
            </Section>
          </div>
        )}
        {activeTab === "atencion" && (
          <div className="space-y-5">
            <Section
              icon={Activity}
              title="Tipo de atención"
              description="Clasificación de la prestación"
            >
              <RadioGroup
                label="Atención"
                name="tipoAtencion"
                options={["Consulta", "Práctica", "Imagen", "Internación"]}
                value={data.tipoAtencion}
                onChange={(value) =>
                  !readOnly &&
                  setData((current) => ({ ...current, tipoAtencion: value }))
                }
                className="sm:col-span-2"
              />
              <Field label="Fecha de alta de internación">
                <input
                  type="date"
                  value={data.fechaAlta}
                  onChange={set("fechaAlta")}
                  disabled={readOnly || data.tipoAtencion !== "Internación"}
                  className={`control ${readOnly || data.tipoAtencion !== "Internación" ? "disabled" : ""}`}
                />
              </Field>
            </Section>
            <CaboItems
              title="Códigos NHPdGD"
              icon={BookOpen}
              items={data.prestaciones}
              onChange={(items) =>
                setData((current) => ({ ...current, prestaciones: items }))
              }
              readOnly={readOnly}
              professionals={professionals}
              catalog={nomenclatures}
              catalogLabel="Nomenclador NHPdGD"
              toRecord={(item) => ({
                codigo: item.codigo,
                descripcion: item.descripcion,
                arancel: Number(item.arancel || 0),
                cantidad: 1,
                profesional1: "",
                profesional2: "",
              })}
              lockedKeys={["codigo", "descripcion"]}
              columns={[
                { key: "codigo", label: "Código" },
                { key: "descripcion", label: "Descripción" },
                { key: "cantidad", label: "Cantidad" },
                { key: "profesional1", label: "Profesional principal" },
                { key: "profesional2", label: "Segundo profesional" },
              ]}
            />
            <CaboItems
              title="Diagnóstico de egreso CIE 10"
              icon={Stethoscope}
              items={data.diagnosticos}
              onChange={(items) =>
                setData((current) => ({ ...current, diagnosticos: items }))
              }
              readOnly={readOnly}
              catalog={cieCodes}
              catalogLabel="Nomenclador CIE 10"
              toRecord={(item) => ({
                codigo: item.codigo,
                descripcion: item.descripcion,
                observaciones: "",
              })}
              lockedKeys={["codigo", "descripcion"]}
              columns={[
                { key: "codigo", label: "Código" },
                { key: "descripcion", label: "Descripción" },
                { key: "observaciones", label: "Observaciones" },
              ]}
            />
          </div>
        )}
        {activeTab === "medicamentos" && (
          <CaboItems
            title="Medicamentos"
            icon={Pill}
            items={data.medicamentos}
            onChange={(items) =>
              setData((current) => ({ ...current, medicamentos: items }))
            }
            readOnly={readOnly}
            catalog={medications}
            catalogLabel="Medicamentos"
            toRecord={(item) => ({
              medicamentoId: item.id,
              producto: item.producto,
              presentacion: item.presentacion,
              cantidad: 1,
            })}
            lockedKeys={["producto", "presentacion"]}
            columns={[
              { key: "producto", label: "Producto" },
              { key: "presentacion", label: "Presentación" },
              { key: "cantidad", label: "Cantidad" },
            ]}
          />
        )}
        {activeTab === "laboratorio" && (
          <CaboItems
            title="Prácticas de laboratorio"
            icon={FlaskConical}
            items={data.laboratorio}
            onChange={(items) =>
              setData((current) => ({ ...current, laboratorio: items }))
            }
            readOnly={readOnly}
            catalog={laboratoryCodes}
            catalogLabel="Nomenclador de Laboratorio"
            toRecord={(item) => ({
              laboratorioId: item.id,
              codigo: item.codigo,
              descripcion: item.descripcion,
              arancel: Number(item.arancel || 0),
              cantidad: 1,
            })}
            lockedKeys={["codigo", "descripcion"]}
            columns={[
              { key: "codigo", label: "Código" },
              { key: "descripcion", label: "Descripción" },
              { key: "cantidad", label: "Cantidad" },
            ]}
          />
        )}
      </div>
      {patientSearchOpen && (
        <PatientSearchModal
          patients={patients}
          onSelect={selectPatient}
          onClose={() => setPatientSearchOpen(false)}
        />
      )}
    </form>
  );
}

function CaboList({ cabos, onNew, onView, onEdit, onDelete, onLoadOlder, loadingOlder, hasMoreCabos }) {
  const [patient, setPatient] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [healthInsurance, setHealthInsurance] = useState("");
  const [remoteResults, setRemoteResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const insuranceOptions = useMemo(
    () => [...new Set(cabos.map((item) => item.obraSocial).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")),
    [cabos],
  );
  const hasFilters = Boolean(patient || dateFrom || dateTo || healthInsurance);
  useEffect(() => {
    if (!hasFilters) {
      setRemoteResults([]);
      setSearching(false);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await loadCabosPage(null, 500, { patient: patient.trim(), dateFrom, dateTo, healthInsurance });
        if (active) setRemoteResults(result.items || []);
      } catch {
        if (active) setRemoteResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [patient, dateFrom, dateTo, healthInsurance, hasFilters]);
  const normalizedPatient = patient.trim().toLocaleLowerCase("es");
  const filtered = (hasFilters ? remoteResults : cabos).filter((item) => {
    const matchesPatient = !normalizedPatient || `${item.nombre} ${item.dni}`.toLocaleLowerCase("es").includes(normalizedPatient);
    const matchesFrom = !dateFrom || (item.fecha && item.fecha >= dateFrom);
    const matchesTo = !dateTo || (item.fecha && item.fecha <= dateTo);
    const matchesInsurance = !healthInsurance || item.obraSocial === healthInsurance;
    return matchesPatient && matchesFrom && matchesTo && matchesInsurance;
  });
  const pagination = usePagination(filtered, [patient, dateFrom, dateTo, healthInsurance]);
  const clearFilters = () => { setPatient(""); setDateFrom(""); setDateTo(""); setHealthInsurance(""); };
  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Cabos
          </h2>
        </div>
        <button onClick={onNew} className="primary">
          <Plus size={18} /> Nuevo Cabo
        </button>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-4 border-b border-slate-100 p-5 md:grid-cols-2 xl:grid-cols-5">
          <Field label="Paciente o DNI" className="xl:col-span-2">
            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={19}
              />
              <input
                value={patient}
                onChange={(e) => setPatient(e.target.value)}
                placeholder="Nombre, apellido o DNI..."
                className="control pl-11"
              />
            </div>
          </Field>
          <Field label="Fecha desde"><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="control" /></Field>
          <Field label="Fecha hasta"><input type="date" min={dateFrom || undefined} value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="control" /></Field>
          <Field label="Obra social"><select value={healthInsurance} onChange={(e) => setHealthInsurance(e.target.value)} className="control"><option value="">Todas</option>{insuranceOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
          {hasFilters && <button type="button" onClick={clearFilters} className="secondary md:col-span-2 xl:col-span-5 xl:justify-self-end"><X size={16} /> Limpiar filtros</button>}
        </div>
        {searching ? (
          <div className="grid min-h-[240px] place-items-center text-sm font-semibold text-slate-400">Buscando Cabos en la base de datos...</div>
        ) : filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Número</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Beneficiario</th>
                  <th className="px-6 py-4">Atención</th>
                  <th className="px-6 py-4">Obra social</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageItems.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-6 py-4 font-semibold text-hospital-700">
                      {item.numero}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                      {formatDate(item.fecha)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-700">
                        {item.nombre}
                      </p>
                      <p className="text-xs text-slate-400">DNI {item.dni}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-hospital-50 px-3 py-1 text-xs font-semibold text-hospital-700">
                        {item.tipoAtencion}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {item.obraSocial || "Sin cobertura"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => onView(item)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-hospital-50 hover:text-hospital-600"
                          title="Consultar"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                          title="Modificar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Borrar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-[320px] place-items-center p-8 text-center">
            <div>
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-hospital-50 text-hospital-600">
                <ClipboardPlus size={30} />
              </div>
              <h3 className="mt-5 font-bold text-slate-700">
                {hasFilters
                  ? "No encontramos comprobantes"
                  : "Todavía no hay Cabos registrados"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {hasFilters
                  ? "Probá con otros datos de búsqueda."
                  : "Creá el primer comprobante para iniciar el proceso de atención."}
              </p>
            </div>
          </div>
        )}
        <Pagination {...pagination} total={filtered.length} onChange={pagination.setPage} />
        {!hasFilters && hasMoreCabos && (
          <div className="flex justify-center border-t border-slate-100 p-4">
            <button type="button" onClick={onLoadOlder} disabled={loadingOlder} className="secondary disabled:cursor-wait disabled:opacity-60">
              {loadingOlder ? "Cargando registros anteriores..." : "Cargar 500 Cabos anteriores"}
            </button>
          </div>
        )}
        {!hasFilters && !hasMoreCabos && cabos.length >= 500 && <p className="border-t border-slate-100 p-4 text-center text-sm text-slate-400">Se cargaron todos los Cabos registrados.</p>}
      </section>
    </>
  );
}

function DebitRegistration({
  obraSocial,
  fechaPrestacion,
  cabos,
  procedureRows = [],
  value,
  readOnly,
  onCancel,
  onConfirm,
}) {
  const [query, setQuery] = useState("");
  const money = (amount) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(Number(amount) || 0);
  const savedDebits = Array.isArray(value) ? value : [];
  const selectedPeriod = String(fechaPrestacion || "").slice(0, 7);
  const eligibleRows = useMemo(
    () => procedureRows.length ? procedureRows : savedDebits.length ? savedDebits : (Array.isArray(cabos) ? cabos : [])
        .filter((cabo) => {
          const caboDate = cabo.fechaAlta || cabo.fecha || "";
          return cabo.obraSocial === obraSocial &&
            (!selectedPeriod || String(caboDate).slice(0, 7) === selectedPeriod);
        })
        .flatMap((cabo) =>
          (Array.isArray(cabo.prestaciones) ? cabo.prestaciones : []).map(
            (practica, index) => {
              const key = `${cabo.id || cabo.numero}-${practica.codigo}-${index}`;
              const saved = savedDebits.find((item) => item.key === key);
              return {
                key,
                idPractica: practica.codigo,
                idCabo: cabo.id,
                numeroCabo: cabo.numero,
                fechaPrestacion: cabo.fechaAlta || cabo.fecha || "",
                profesional:
                  [practica.profesional1, practica.profesional2]
                    .filter(Boolean)
                    .join(" / ") || "Sin profesional asignado",
                practica: practica.descripcion,
                montoCabo:
                  Number(practica.arancel || 0) *
                  Number(practica.cantidad || 1),
                montoDebito: saved?.montoDebito ?? "",
              };
            },
          ),
        ),
    [cabos, obraSocial, selectedPeriod, value, procedureRows],
  );
  const [rows, setRows] = useState(eligibleRows);
  const filtered = rows.filter((row) =>
    `${row.numeroCabo} ${row.profesional} ${row.practica}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const updateDebit = (key, amount) =>
    setRows((current) =>
      current.map((row) =>
        row.key === key ? { ...row, montoDebito: amount } : row,
      ),
    );
  const confirm = () =>
    onConfirm(
      rows
        .filter((row) => row.montoDebito !== "" && Number(row.montoDebito) > 0)
        .map((row) => ({ ...row, montoDebito: Number(row.montoDebito) })),
    );
  const debitTotal = rows.reduce(
    (total, row) => total + Number(row.montoDebito || 0),
    0,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="debit-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div>
            <p className="text-sm font-semibold text-hospital-600">
              Facturación y recupero
            </p>
            <h2
              id="debit-title"
              className="mt-1 text-2xl font-bold text-slate-800"
            >
              Registro de Débitos
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Asigná el importe debitado a cada práctica presentada.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Obra social">
              <input value={obraSocial} disabled className="control disabled" />
            </Field>
            <Field label="Ingrese N° Cabo">
              <div className="relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por N° de Cabo, profesional o práctica"
                  className="control pl-11"
                />
              </div>
            </Field>
          </div>
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nro Cabo</th>
                  <th className="px-4 py-3">Fecha prestación</th>
                  <th className="px-4 py-3">Profesional</th>
                  <th className="px-4 py-3">Práctica</th>
                  <th className="px-4 py-3 text-right">Monto Cabo</th>
                  <th className="px-4 py-3 text-right">Monto Débito</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length ? (
                  filtered.map((row) => (
                    <tr key={row.key} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-hospital-700">
                        {row.numeroCabo}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatDate(row.fechaPrestacion)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.profesional}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="mr-2 text-xs font-semibold text-slate-400">
                          {row.idPractica}
                        </span>
                        {row.practica}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">
                        {money(row.montoCabo)}
                      </td>
                      <td className="w-44 px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          max={row.montoCabo || undefined}
                          value={row.montoDebito}
                          onChange={(event) =>
                            updateDebit(row.key, event.target.value)
                          }
                          disabled={readOnly}
                          aria-label={`Monto débito Cabo ${row.numeroCabo}`}
                          className={`control text-right ${readOnly ? "disabled" : ""}`}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      {rows.length
                        ? "No hay resultados para el filtro ingresado."
                        : "No hay Cabos con prácticas registrados para esta obra social."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <p className="text-sm font-semibold text-slate-600">
            Total debitado:{" "}
            <span className="ml-1 text-base text-hospital-700">
              {money(debitTotal)}
            </span>
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="secondary flex-1 sm:flex-none"
            >
              {readOnly ? "Cerrar" : "Cancelar"}
            </button>
            {!readOnly && (
              <button
                type="button"
                onClick={confirm}
                className="primary flex-1 sm:flex-none"
              >
                Guardar débitos
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CobroOSForm({
  initial = emptyCobroOS,
  readOnly = false,
  healthInsurances,
  cabos,
  onCancel,
  onSaved,
}) {
  const [data, setData] = useState(initial);
  const [errors, setErrors] = useState({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [insuranceQuery, setInsuranceQuery] = useState("");
  const [debitsOpen, setDebitsOpen] = useState(false);
  const [debitRows, setDebitRows] = useState([]);
  const [debitsLoading, setDebitsLoading] = useState(false);
  const hasAmountDifference =
    data.importeFacturado !== "" &&
    data.importeCobrado !== "" &&
    Math.abs(Number(data.importeFacturado) - Number(data.importeCobrado)) >= 0.01;
  const set = (key) => (event) =>
    setData((current) => ({ ...current, [key]: event.target.value }));
  const selectInsurance = (item) => {
    setData((current) => ({
      ...current,
      obraSocialId: item.id,
      obraSocialCodigo: item.codigo,
      obraSocial: item.descripcion,
    }));
    setErrors((current) => ({ ...current, obraSocial: "" }));
    setSearchOpen(false);
    setInsuranceQuery("");
  };
  const openDebits = async () => {
    if (!Number.isInteger(Number(data.id))) {
      setDebitsOpen(true);
      return;
    }
    setDebitsLoading(true);
    try {
      setDebitRows(await loadCabosForDebit(data.id, data.fechaPrestacion, data.obraSocialId, 0));
      setDebitsOpen(true);
    } catch (error) {
      setErrors((current) => ({ ...current, debitos: error.message }));
    } finally {
      setDebitsLoading(false);
    }
  };
  const save = (event) => {
    event.preventDefault();
    if (readOnly) return onCancel();
    const next = {};
    if (!data.obraSocial) next.obraSocial = "Seleccioná una obra social.";
    if (!data.numeroFactura.trim())
      next.numeroFactura = "Ingresá el número de factura.";
    if (data.importeFacturado === "" || Number(data.importeFacturado) < 0)
      next.importeFacturado = "Ingresá un importe válido.";
    if (data.importeCobrado !== "" && Number(data.importeCobrado) < 0)
      next.importeCobrado = "Ingresá un importe válido.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onSaved({
      ...data,
      id: data.id || `COBRO-${Date.now()}`,
      importeFacturado: Number(data.importeFacturado),
      importeCobrado: Number(data.importeCobrado || 0),
    });
  };
  const moneyField = (key, error) => (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
        $
      </span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={data[key]}
        onChange={set(key)}
        disabled={readOnly}
        className={`control pl-8 ${readOnly ? "disabled" : ""} ${error ? "invalid" : ""}`}
      />
    </div>
  );
  return (
    <>
      <form onSubmit={save}>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {readOnly
                ? "Consulta de cobro"
                : data.id
                  ? "Modificar cobro"
                  : "Nuevo cobro a obra social"}
            </h2>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="secondary">
              {readOnly ? "Volver" : "Cancelar"}
            </button>
            {!readOnly && <button className="primary">Guardar cobro</button>}
          </div>
        </div>
        <Section
          icon={Building2}
          title="Obra social y factura"
          description="Identificación de la liquidación"
        >
          <Field
            label="Obra social"
            required
            error={errors.obraSocial}
            className="sm:col-span-2"
          >
            <div
              className={`flex items-center gap-2 rounded-xl border bg-slate-50 p-2 pl-3.5 ${errors.obraSocial ? "border-red-400" : "border-slate-200"}`}
            >
              <span
                className={`min-w-0 flex-1 truncate text-sm ${data.obraSocial ? "font-semibold text-slate-700" : "text-slate-400"}`}
              >
                {data.obraSocial || "Ninguna obra social seleccionada"}
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="primary shrink-0"
                >
                  <Search size={17} /> Buscar
                </button>
              )}
            </div>
          </Field>
          <Field label="N° de factura" required error={errors.numeroFactura}>
            <input
              value={data.numeroFactura}
              onChange={set("numeroFactura")}
              disabled={readOnly}
              className={`control ${readOnly ? "disabled" : ""} ${errors.numeroFactura ? "invalid" : ""}`}
            />
          </Field>
          <Field label="Estado">
            <select
              value={data.estado}
              onChange={set("estado")}
              disabled={readOnly}
              className={`control ${readOnly ? "disabled" : ""}`}
            >
              <option>GENERADA</option>
              <option>PRESENTADA</option>
              <option>COBRADA</option>
            </select>
          </Field>
        </Section>
        <Section
          icon={CalendarDays}
          title="Períodos y montos"
          description="Fechas mensuales e importes de la gestión"
        >
          <Field label="Fecha de prestación">
            <input
              type="date"
              value={data.fechaPrestacion}
              onChange={set("fechaPrestacion")}
              disabled={readOnly}
              className={`control ${readOnly ? "disabled" : ""}`}
            />
          </Field>
          <Field label="Fecha de presentación">
            <input
              type="date"
              value={data.fechaPresentacion}
              onChange={set("fechaPresentacion")}
              disabled={readOnly}
              className={`control ${readOnly ? "disabled" : ""}`}
            />
          </Field>
          <Field label="Fecha de cobro">
            <input
              type="date"
              value={data.fechaCobro}
              onChange={set("fechaCobro")}
              disabled={readOnly}
              className={`control ${readOnly ? "disabled" : ""}`}
            />
          </Field>
          <Field
            label="Importe facturado"
            required
            error={errors.importeFacturado}
          >
            {moneyField("importeFacturado", errors.importeFacturado)}
          </Field>
          <Field label="Importe cobrado" error={errors.importeCobrado}>
            {moneyField("importeCobrado", errors.importeCobrado)}
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={openDebits}
              disabled={debitsLoading || !hasAmountDifference}
              className="secondary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {debitsLoading ? "Buscando Cabos..." : `Registrar débitos (${data.debitos.length})`}
            </button>
            {!hasAmountDifference && (
              <p className="mt-1 text-xs text-slate-500">
                Se habilita cuando el importe facturado y el cobrado no coinciden.
              </p>
            )}
            {errors.debitos && <p className="mt-1 text-xs text-red-600">{errors.debitos}</p>}
          </div>
        </Section>
        {debitsOpen && (
          <DebitRegistration
            obraSocial={data.obraSocial}
            fechaPrestacion={data.fechaPrestacion}
            cabos={cabos}
            procedureRows={debitRows}
            value={data.debitos}
            readOnly={readOnly}
            onCancel={() => setDebitsOpen(false)}
            onConfirm={(debitos) => {
              setData((current) => ({ ...current, debitos }));
              setDebitsOpen(false);
            }}
          />
        )}
      </form>
      {searchOpen && (
        <InsuranceSearchModal
          items={healthInsurances}
          query={insuranceQuery}
          onQueryChange={setInsuranceQuery}
          onSelect={selectInsurance}
          onCancel={() => {
            setSearchOpen(false);
            setInsuranceQuery("");
          }}
        />
      )}
    </>
  );
}

function CobroOSList({ records, onNew, onView, onEdit, onDelete }) {
  const [query, setQuery] = useState("");
  const filtered = records.filter((item) =>
    `${item.obraSocial} ${item.numeroFactura} ${item.estado} ${item.fechaPrestacion}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const pagination = usePagination(filtered, [query]);
  const money = (value) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value || 0);
  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Gestión de Cobro Obra Social
          </h2>
        </div>
        <button onClick={onNew} className="primary">
          <Plus size={18} /> Nuevo cobro
        </button>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="relative max-w-xl">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por obra social, factura, estado o período..."
              className="control pl-11"
            />
          </div>
        </div>
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Obra social</th>
                  <th className="px-5 py-4">Factura</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Facturado</th>
                  <th className="px-5 py-4 text-right">Cobrado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageItems.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {item.obraSocial}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {item.numeroFactura}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-hospital-50 px-3 py-1 text-xs font-bold text-hospital-700">
                        {item.estado}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {money(item.importeFacturado)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {money(item.importeCobrado)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => onView(item)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-hospital-50 hover:text-hospital-600"
                          title="Consultar"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                          title="Modificar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Borrar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-[320px] place-items-center p-8 text-center">
            <div>
              <BadgeDollarSign
                className="mx-auto text-hospital-600"
                size={42}
              />
              <h3 className="mt-4 font-bold text-slate-700">
                {query
                  ? "No encontramos cobros"
                  : "Todavía no hay cobros registrados"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {query
                  ? "Probá con otro criterio."
                  : "Creá el primer registro de cobro a obra social."}
              </p>
            </div>
          </div>
        )}
        <Pagination
          {...pagination}
          total={filtered.length}
          onChange={pagination.setPage}
        />
      </section>
    </>
  );
}

function AvailabilityManager({ professionals, availability, onAdd, onDelete }) {
  const [professionalCode, setProfessionalCode] = useState(
    String(professionals[0]?.codigo ?? ""),
  );
  const [draft, setDraft] = useState({
    diaSemana: "1",
    desde: "08:00",
    hasta: "12:00",
    duracion: "30",
  });
  const rows = availability.filter(
    (item) => item.profesionalCodigo === professionalCode,
  );
  const add = async () => {
    if (!professionalCode || draft.desde >= draft.hasta) return;
    await onAdd({
        ...draft,
        profesionalCodigo: professionalCode,
        diaSemana: Number(draft.diaSemana),
        duracion: Number(draft.duracion),
    });
  };
  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-hospital-50 text-hospital-600">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Nueva disponibilidad</h3>
            <p className="text-xs text-slate-500">
              Definí días y franjas habituales.
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <Field label="Profesional" required>
            <select
              value={professionalCode}
              onChange={(e) => setProfessionalCode(e.target.value)}
              className="control"
            >
              <option value="">Seleccionar</option>
              {professionals.map((p) => (
                <option key={p.codigo} value={p.codigo}>
                  {p.apellido}, {p.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Día">
            <select
              value={draft.diaSemana}
              onChange={(e) =>
                setDraft({ ...draft, diaSemana: e.target.value })
              }
              className="control"
            >
              {weekDays.slice(1, 7).map((day, index) => (
                <option key={day} value={index + 1}>
                  {day}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Desde">
              <input
                type="time"
                value={draft.desde}
                onChange={(e) => setDraft({ ...draft, desde: e.target.value })}
                className="control"
              />
            </Field>
            <Field label="Hasta">
              <input
                type="time"
                value={draft.hasta}
                onChange={(e) => setDraft({ ...draft, hasta: e.target.value })}
                className="control"
              />
            </Field>
          </div>
          <Field label="Duración del turno">
            <select
              value={draft.duracion}
              onChange={(e) => setDraft({ ...draft, duracion: e.target.value })}
              className="control"
            >
              <option value="15">15 minutos</option>
              <option value="20">20 minutos</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">60 minutos</option>
            </select>
          </Field>
          <button
            type="button"
            onClick={add}
            disabled={!professionalCode}
            className="primary w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} /> Agregar franja
          </button>
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h3 className="font-bold text-slate-800">Agenda semanal</h3>
          <p className="mt-1 text-sm text-slate-500">
            Horarios configurados para el profesional seleccionado.
          </p>
        </div>
        {rows.length ? (
          <div className="divide-y divide-slate-100">
            {rows
              .sort(
                (a, b) =>
                  a.diaSemana - b.diaSemana || a.desde.localeCompare(b.desde),
              )
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-700">
                      {weekDays[item.diaSemana]}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.desde} a {item.hasta} · turnos de {item.duracion}{" "}
                      min
                    </p>
                  </div>
                  <button
                    onClick={() => onDelete(item)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Eliminar franja"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <CalendarX className="mx-auto text-slate-300" size={40} />
              <p className="mt-3 font-semibold text-slate-600">
                Sin disponibilidad configurada
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Seleccioná un profesional y agregá su primera franja.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function AppointmentForm({
  patients,
  professionals,
  availability,
  appointments,
  initial,
  onCancel,
  onSave,
}) {
  const [data, setData] = useState(initial || emptyAppointment);
  const [errors, setErrors] = useState({});
  const [professionalSearchOpen, setProfessionalSearchOpen] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const selected = initial?.fecha ? new Date(`${initial.fecha}T12:00:00`) : new Date();
    return new Date(selected.getFullYear(), selected.getMonth(), 1);
  });
  const selectedProfessional = professionals.find(
    (item) => String(item.codigo) === String(data.profesionalCodigo),
  );
  const selectedPatient = patients.find(
    (item) => String(item.codigo) === String(data.pacienteCodigo),
  );
  const toMinutes = (value) => {
    const [hours, minutes] = String(value).split(":").map(Number);
    return hours * 60 + minutes;
  };
  const toTime = (minutes) =>
    `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  const professionalAvailability = availability
    .filter(
      (item) =>
        String(item.profesionalCodigo) === String(data.profesionalCodigo),
    )
    .sort(
      (a, b) =>
        a.diaSemana - b.diaSemana || a.desde.localeCompare(b.desde),
    );
  const enabledWeekDays = new Set(
    professionalAvailability.map((item) => Number(item.diaSemana)),
  );
  const calendarStart = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1 - calendarMonth.getDay(),
  );
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
  const toDateValue = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const selectedDay = data.fecha
    ? new Date(`${data.fecha}T12:00:00`).getDay()
    : -1;
  const availableSlots = professionalAvailability
    .filter((item) => item.diaSemana === selectedDay)
    .flatMap((item) => {
      const slots = [];
      const duration = Number(item.duracion);
      for (
        let start = toMinutes(item.desde);
        start + duration <= toMinutes(item.hasta);
        start += duration
      ) {
        const hora = toTime(start);
        const occupied = appointments.some((appointment) => {
          const appointmentStart = toMinutes(appointment.hora);
          const appointmentFinish = appointmentStart + Number(appointment.duracion);
          return (
            appointment.id !== data.id &&
            appointment.estado !== "Cancelado" &&
            String(appointment.profesionalCodigo) === String(data.profesionalCodigo) &&
            appointment.fecha === data.fecha &&
            start < appointmentFinish &&
            start + duration > appointmentStart
          );
        });
        if (!occupied) slots.push({ hora, duracion: duration });
      }
      return slots;
    })
    .filter(
      (slot, index, slots) =>
        slots.findIndex((item) => item.hora === slot.hora) === index,
    );
  const set = (key) => (event) =>
    setData({ ...data, [key]: event.target.value });
  const save = (event) => {
    event.preventDefault();
    const next = {};
    if (!data.profesionalCodigo)
      next.profesionalCodigo = "Seleccioná un profesional.";
    if (!data.pacienteCodigo) next.pacienteCodigo = "Seleccioná un paciente.";
    if (!data.fecha) next.fecha = "Seleccioná una fecha.";
    if (!data.hora) next.hora = "Seleccioná un horario.";
    const day = selectedDay;
    const start = data.hora ? toMinutes(data.hora) : 0;
    const finish = start + Number(data.duracion);
    const enabled = availability.some(
      (item) =>
        String(item.profesionalCodigo) === String(data.profesionalCodigo) &&
        item.diaSemana === day &&
        start >= toMinutes(item.desde) &&
        finish <= toMinutes(item.hasta),
    );
    if (data.fecha && data.hora && data.profesionalCodigo && !enabled)
      next.hora = "El profesional no atiende en esa fecha y hora.";
    const collision = appointments.some((item) => {
      const itemStart = toMinutes(item.hora);
      const itemFinish = itemStart + Number(item.duracion);
      return (
        item.id !== data.id &&
        item.estado !== "Cancelado" &&
        String(item.profesionalCodigo) === String(data.profesionalCodigo) &&
        item.fecha === data.fecha &&
        start < itemFinish &&
        finish > itemStart
      );
    });
    if (collision) next.hora = "Ese horario ya está ocupado.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave({
      ...data,
      id: data.id || null,
      duracion: Number(data.duracion),
    });
  };
  return (
    <form onSubmit={save}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {data.id ? "Modificar turno" : "Nuevo turno"}
          </h2>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="secondary">Cancelar</button>
          <button className="primary">Guardar turno</button>
        </div>
      </div>
      <Section
        icon={CalendarPlus}
        title="Datos del turno"
        description="Paciente, profesional y horario de atención"
      >
        <Field
          label="Profesional"
          required
          error={errors.profesionalCodigo}
          className="sm:col-span-2"
        >
          <div className="flex gap-2">
            <input
              readOnly
              value={selectedProfessional ? `${selectedProfessional.apellido}, ${selectedProfessional.nombre} · ${selectedProfessional.especialidad || "Sin especialidad"}` : ""}
              placeholder="Ningún profesional seleccionado"
              className={`control min-w-0 flex-1 ${errors.profesionalCodigo ? "invalid" : ""}`}
            />
            <button type="button" onClick={() => setProfessionalSearchOpen(true)} className="secondary shrink-0">
              <Search size={17} /> Buscar
            </button>
          </div>
        </Field>
        {selectedProfessional && (
          <div className="sm:col-span-2 rounded-xl border border-hospital-100 bg-hospital-50 p-4">
            <p className="text-sm font-bold text-hospital-700">
              Disponibilidad del profesional
            </p>
            {professionalAvailability.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {professionalAvailability.map((item) => (
                  <span
                    key={item.id}
                    className="rounded-lg bg-white px-3 py-2 text-sm text-slate-600 shadow-sm"
                  >
                    <strong>{weekDays[item.diaSemana]}</strong> · {item.desde} a {item.hasta} · {item.duracion} min
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-amber-700">
                Este profesional no tiene disponibilidad configurada.
              </p>
            )}
          </div>
        )}
        <Field
          label="Paciente"
          required
          error={errors.pacienteCodigo}
          className="sm:col-span-2"
        >
          <div className="flex gap-2">
            <input
              readOnly
              value={selectedPatient ? `${selectedPatient.apellido}, ${selectedPatient.nombre} · DNI ${selectedPatient.dni}` : ""}
              placeholder="Ningún paciente seleccionado"
              className={`control min-w-0 flex-1 ${errors.pacienteCodigo ? "invalid" : ""}`}
            />
            <button type="button" onClick={() => setPatientSearchOpen(true)} className="secondary shrink-0">
              <Search size={17} /> Buscar
            </button>
          </div>
        </Field>
        <Field label="Fecha" required error={errors.fecha} className="sm:col-span-2">
          <div className={`overflow-hidden rounded-2xl border bg-white ${errors.fecha ? "border-red-400" : "border-slate-200"}`}>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <button type="button" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Mes anterior"><ChevronLeft size={18} /></button>
              <p className="font-bold capitalize text-slate-700">{calendarMonth.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}</p>
              <button type="button" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Mes siguiente"><ChevronRight size={18} /></button>
            </div>
            <div className="grid grid-cols-7 px-3 pt-3 text-center text-xs font-bold uppercase text-slate-400">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => <span key={day} className="py-1">{day}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1 p-3 pt-1">
              {calendarDays.map((date) => {
                const value = toDateValue(date);
                const inMonth = date.getMonth() === calendarMonth.getMonth();
                const enabled = Boolean(data.profesionalCodigo) && enabledWeekDays.has(date.getDay());
                const selected = data.fecha === value;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!enabled}
                    title={!data.profesionalCodigo ? "Seleccioná primero un profesional" : enabled ? "Día de atención disponible" : "El profesional no atiende este día"}
                    onClick={() => {
                      setData((current) => ({ ...current, fecha: value, hora: "" }));
                      setErrors((current) => ({ ...current, fecha: undefined }));
                    }}
                    className={`h-10 rounded-lg text-sm font-semibold transition ${selected ? "bg-hospital-600 text-white shadow-sm" : enabled ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "cursor-not-allowed bg-slate-50 text-slate-300"} ${inMonth ? "" : "opacity-40"}`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              <span className="flex items-center gap-2"><span className="size-3 rounded bg-emerald-100" /> Día de atención</span>
              <span className="flex items-center gap-2"><span className="size-3 rounded bg-slate-100" /> No disponible</span>
              {!data.profesionalCodigo && <span className="font-semibold text-amber-700">Seleccioná un profesional para habilitar sus fechas.</span>}
            </div>
          </div>
        </Field>
        <Field label="Hora" required error={errors.hora}>
          <select
            value={data.hora}
            onChange={(event) => {
              const slot = availableSlots.find(
                (item) => item.hora === event.target.value,
              );
              setData((current) => ({
                ...current,
                hora: event.target.value,
                duracion: slot?.duracion || current.duracion,
              }));
            }}
            disabled={!data.profesionalCodigo || !data.fecha}
            className={`control ${errors.hora ? "invalid" : ""}`}
          >
            <option value="">
              {!data.profesionalCodigo
                ? "Primero seleccioná un profesional"
                : !data.fecha
                  ? "Primero seleccioná una fecha"
                  : availableSlots.length
                    ? "Seleccionar horario disponible"
                    : "No hay horarios disponibles para esta fecha"}
            </option>
            {availableSlots.map((slot) => (
              <option key={slot.hora} value={slot.hora}>
                {slot.hora} · {slot.duracion} minutos
              </option>
            ))}
          </select>
        </Field>
        <Field label="Duración">
          <input
            readOnly
            value={data.hora ? `${data.duracion} minutos` : "Se asigna con el horario"}
            className="control bg-slate-50"
          />
        </Field>
        <Field label="Estado">
          <select
            value={data.estado}
            onChange={set("estado")}
            className="control"
          >
            <option>Programado</option>
            <option>Confirmado</option>
            <option>En espera</option>
            <option>En atención</option>
            <option>Atendido</option>
            <option>Ausente</option>
            <option>Cancelado</option>
          </select>
        </Field>
        <Field label="Motivo" className="sm:col-span-2">
          <input
            value={data.motivo}
            onChange={set("motivo")}
            placeholder="Motivo de la consulta"
            className="control"
          />
        </Field>
        <Field label="Observaciones" className="sm:col-span-2">
          <textarea
            value={data.observaciones}
            onChange={set("observaciones")}
            rows="3"
            className="control resize-y"
          />
        </Field>
      </Section>
      {professionalSearchOpen && (
        <ProfessionalSearchModal
          professionals={professionals}
          onSelect={(professional) => {
            setData((current) => ({
              ...current,
              profesionalCodigo: String(professional.codigo),
              fecha:
                String(current.profesionalCodigo) === String(professional.codigo)
                  ? current.fecha
                  : "",
              hora:
                String(current.profesionalCodigo) === String(professional.codigo)
                  ? current.hora
                  : "",
            }));
            setErrors((current) => ({ ...current, profesionalCodigo: undefined }));
            setProfessionalSearchOpen(false);
          }}
          onClose={() => setProfessionalSearchOpen(false)}
        />
      )}
      {patientSearchOpen && (
        <PatientSearchModal
          patients={patients}
          onSelect={(patient) => {
            setData((current) => ({
              ...current,
              pacienteCodigo: String(patient.codigo),
            }));
            setErrors((current) => ({ ...current, pacienteCodigo: undefined }));
            setPatientSearchOpen(false);
          }}
          onClose={() => setPatientSearchOpen(false)}
        />
      )}
    </form>
  );
}

function AppointmentsModule({
  patients,
  professionals,
  appointments,
  setAppointments,
  availability,
  setAvailability,
  onNotice,
  currentUser,
  onOpenHistory,
  canEditAppointments,
}) {
  const today = new Date().toISOString().slice(0, 10);
  const isLinkedProfessional = Boolean(currentUser?.profesionalId) && !currentUser?.administrador;
  const [tab, setTab] = useState(isLinkedProfessional ? "today" : "agenda"),
    [editing, setEditing] = useState(null),
    [date, setDate] = useState(today),
    [professional, setProfessional] = useState(isLinkedProfessional ? String(currentUser.profesionalId) : "");
  if (editing)
    return (
      <AppointmentForm
        patients={patients}
        professionals={professionals}
        availability={availability}
        appointments={appointments}
        initial={editing === "new" ? null : editing}
        onCancel={() => setEditing(null)}
        onSave={async (item) => {
          try {
            const saved = normalizeAppointment(await persistAppointment(item));
            setAppointments((current) => current.some((x) => x.id === saved.id) ? current.map((x) => x.id === saved.id ? saved : x) : [...current, saved]);
            setEditing(null);
            onNotice("Turno guardado correctamente.");
          } catch (error) { onNotice(`No se pudo guardar el turno: ${error.message}`); }
        }}
      />
    );
  const filtered = appointments
    .filter(
      (item) =>
        item.fecha === (tab === "today" ? today : date) &&
        (!professional || String(item.profesionalCodigo) === String(professional)),
    )
    .sort((a, b) => a.hora.localeCompare(b.hora));
  const patientName = (code) => {
    const p = patients.find((x) => String(x.codigo) === String(code));
    return p ? `${p.apellido}, ${p.nombre}` : "Paciente no disponible";
  };
  const professionalName = (code) => {
    const p = professionals.find((x) => String(x.codigo) === String(code));
    return p ? `${p.apellido}, ${p.nombre}` : "Profesional no disponible";
  };
  const changeStatus = async (item, estado) => {
    try {
      const saved = normalizeAppointment(await persistAppointment({ ...item, estado }));
      setAppointments((current) => current.map((appointment) => appointment.id === saved.id ? saved : appointment));
      onNotice(`Turno actualizado a ${estado}.`);
    } catch (error) { onNotice(`No se pudo actualizar el turno: ${error.message}`); }
  };
  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Turnos</h2>
        </div>
        {tab === "agenda" && !isLinkedProfessional && (
          <button onClick={() => setEditing("new")} className="primary">
            <CalendarPlus size={18} /> Nuevo turno
          </button>
        )}
      </div>
      <div className="mb-6 flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          onClick={() => setTab("today")}
          className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === "today" ? "bg-hospital-600 text-white" : "text-slate-500"}`}
        >
          Turnos de hoy
        </button>
        <button
          onClick={() => setTab("agenda")}
          className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === "agenda" ? "bg-hospital-600 text-white" : "text-slate-500"}`}
        >
          Agenda completa
        </button>
        {!isLinkedProfessional && <button
          onClick={() => setTab("availability")}
          className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === "availability" ? "bg-hospital-600 text-white" : "text-slate-500"}`}
        >
          Disponibilidad
        </button>}
      </div>
      {tab === "availability" ? (
        <AvailabilityManager
          professionals={professionals}
          availability={availability}
          onAdd={async (item) => {
            try { const saved = normalizeAvailability(await persistAvailability(item)); setAvailability((current) => [...current, saved]); onNotice("Disponibilidad guardada correctamente."); }
            catch (error) { onNotice(`No se pudo guardar la disponibilidad: ${error.message}`); }
          }}
          onDelete={async (item) => {
            try { await removeAvailability(item.id); setAvailability((current) => current.filter((row) => row.id !== item.id)); onNotice("Disponibilidad eliminada correctamente."); }
            catch (error) { onNotice(`No se pudo eliminar la disponibilidad: ${error.message}`); }
          }}
        />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {tab === "agenda" ? <div className={`grid gap-4 border-b border-slate-100 p-5 ${isLinkedProfessional ? "sm:grid-cols-1" : "sm:grid-cols-2"}`}>
            <Field label="Fecha">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="control"
              />
            </Field>
            {!isLinkedProfessional && <Field label="Profesional">
              <select
                value={professional}
                onChange={(e) => setProfessional(e.target.value)}
                className="control"
              >
                <option value="">Todos los profesionales</option>
                {professionals.map((p) => (
                  <option key={p.codigo} value={p.codigo}>
                    {p.apellido}, {p.nombre}
                  </option>
                ))}
              </select>
            </Field>}
          </div> : <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-hospital-50 p-5"><div><p className="font-bold text-hospital-800">Agenda de hoy</p><p className="text-sm text-hospital-700">{new Intl.DateTimeFormat("es-AR", { weekday:"long", day:"2-digit", month:"long", year:"numeric" }).format(new Date())}</p></div><span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-hospital-700">{filtered.length} turno{filtered.length === 1 ? "" : "s"}</span></div>}
          {filtered.length ? (
            <div className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
                >
                  <div className="w-20 shrink-0 text-xl font-bold text-hospital-700">
                    {item.hora}
                  </div>
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={() => onOpenHistory?.(item.pacienteCodigo)} className="font-bold text-slate-700 hover:text-hospital-700 hover:underline" title="Abrir historia clínica">
                      {patientName(item.pacienteCodigo)}
                    </button>
                    <p className="mt-1 text-sm text-slate-500">
                      {professionalName(item.profesionalCodigo)} ·{" "}
                      {item.motivo || "Consulta"} · {item.duracion} min
                    </p>
                  </div>
                  {canEditAppointments && item.fecha === today ? <select value={item.estado} onChange={(event) => changeStatus(item,event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-hospital-500" title="Cambio rápido de estado">
                    {["Programado","Confirmado","En espera","En atención","Atendido","Ausente","Cancelado"].map((estado)=><option key={estado}>{estado}</option>)}
                  </select> : <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${item.estado === "Cancelado" ? "bg-red-50 text-red-600" : item.estado === "Atendido" ? "bg-emerald-50 text-emerald-700" : "bg-hospital-50 text-hospital-700"}`}
                  >
                    {item.estado}
                  </span>}
                  {onOpenHistory && <button type="button" onClick={() => onOpenHistory(item.pacienteCodigo)} className="rounded-lg p-2 text-slate-400 hover:bg-cyan-50 hover:text-cyan-700" title="Historia clínica"><BookOpen size={18}/></button>}
                  {!isLinkedProfessional && <button
                    onClick={() => setEditing(item)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                  >
                    <Pencil size={18} />
                  </button>}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid min-h-72 place-items-center p-8 text-center">
              <div>
                <CalendarDays className="mx-auto text-hospital-600" size={42} />
                <h3 className="mt-4 font-bold text-slate-700">
                  No hay turnos para esta fecha
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {isLinkedProfessional ? "No tenés pacientes asignados para esta fecha." : "Podés crear uno nuevo desde el botón superior."}
                </p>
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}

function HealthInsuranceLiquidation({ healthInsurances, onClose, onNotice }) {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 8)}01`;
  const [healthInsuranceId, setHealthInsuranceId] = useState("");
  const [insuranceModalOpen, setInsuranceModalOpen] = useState(false);
  const [insuranceSearch, setInsuranceSearch] = useState("");
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [attentionFilter, setAttentionFilter] = useState("Todos");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportPickerOpen, setReportPickerOpen] = useState(false);
  const allPrintReports = ["ambulatory", "internment", "image", "laboratory", "hospitalization", "invoice"];
  const [selectedPrintReports, setSelectedPrintReports] = useState(allPrintReports);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [page, setPage] = useState(1);
  const [caboDetail, setCaboDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [availableInsurances, setAvailableInsurances] = useState(healthInsurances);
  const [insurancesLoading, setInsurancesLoading] = useState(false);
  useEffect(() => {
    if (healthInsurances.length) {
      setAvailableInsurances(healthInsurances);
      return;
    }
    let active = true;
    setInsurancesLoading(true);
    loadHealthInsurances()
      .then((items) => { if (active) setAvailableInsurances(items); })
      .catch((error) => { if (active) onNotice(`No se pudieron cargar las obras sociales: ${error.message}`); })
      .finally(() => { if (active) setInsurancesLoading(false); });
    return () => { active = false; };
  }, [healthInsurances]);
  const selectedInsurance = availableInsurances.find((item) => String(item.id) === String(healthInsuranceId));
  const filteredInsurances = availableInsurances.filter((item) =>
    `${item.codigo || ""} ${item.sigla || ""} ${item.descripcion || ""}`
      .toLocaleLowerCase("es")
      .includes(insuranceSearch.trim().toLocaleLowerCase("es")),
  );

  const money = (value) => new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS",
  }).format(Number(value || 0));
  const formatDate = (value) => {
    if (!value) return "—";
    const [year, month, day] = value.slice(0, 10).split("-");
    return `${day}/${month}/${year}`;
  };
  const visibleRows = attentionFilter === "Todos"
    ? rows
    : rows.filter((row) => row.tipoAtencion === attentionFilter);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const paginatedRows = visibleRows.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [attentionFilter, rows]);
  const totals = visibleRows.reduce((result, row) => {
    const amount = Number(row.importeTotal || 0);
    if (row.tipoAtencion === "Internación") result.internment += amount;
    else result.outpatient += amount;
    result.general += amount;
    return result;
  }, { outpatient: 0, internment: 0, general: 0 });

  const searchLiquidation = async () => {
    if (!healthInsuranceId || !from || !to || from > to) {
      onNotice("Seleccioná una obra social y un período válido.");
      return;
    }
    setLoading(true);
    try {
      setRows(await loadHealthInsuranceLiquidation(healthInsuranceId, from, to));
    } catch (error) {
      onNotice(`No se pudo obtener la liquidación: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const showCaboDetail = async (row) => {
    setDetailLoading(true);
    setCaboDetail({ row, data: null });
    try {
      const data = await loadCaboDetails(row.numeroOrden);
      setCaboDetail({ row, data });
    } catch (error) {
      setCaboDetail(null);
      onNotice(`No se pudo cargar el detalle del cabo: ${error.message}`);
    } finally {
      setDetailLoading(false);
    }
  };
  const printAmbulatoryReport = async (reportsToPrint, manualInvoiceNumber = "") => {
    if (!healthInsuranceId || !from || !to || from > to) {
      onNotice("Seleccioná una obra social y un período válido.");
      return;
    }
    const selectedReports = new Set(reportsToPrint);
    const includeAmbulatory = selectedReports.has("ambulatory");
    const includeInternment = selectedReports.has("internment");
    const includeImage = selectedReports.has("image");
    const includeLaboratory = selectedReports.has("laboratory");
    const includeHospitalization = selectedReports.has("hospitalization");
    const includeInvoice = selectedReports.has("invoice");
    const emptyReport = { insurance: selectedInsurance || {}, rows: [] };
    const printFrame = document.createElement("iframe");
    printFrame.setAttribute("aria-hidden", "true");
    printFrame.style.position = "fixed";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    printFrame.style.visibility = "hidden";
    document.body.appendChild(printFrame);
    const reportWindow = printFrame.contentWindow;
    if (!reportWindow) {
      printFrame.remove();
      onNotice("No se pudo abrir la vista de impresión.");
      return;
    }
    setReportLoading(true);
    const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
    const amount = (value) => new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0));
    const formatDni = (value) => {
      const numericValue = Number(String(value ?? "").replace(/\D/g, ""));
      return Number.isFinite(numericValue) && numericValue ? new Intl.NumberFormat("es-AR").format(numericValue) : escapeHtml(value || "-");
    };
    try {
      const [report, internmentReport, imageReport, laboratoryReport, hospitalizationReport] = await Promise.all([
        includeAmbulatory || includeInvoice ? loadAmbulatoryLiquidationReport(healthInsuranceId, from, to) : Promise.resolve(emptyReport),
        includeInternment || includeInvoice ? loadInternmentLiquidationReport(healthInsuranceId, from, to) : Promise.resolve(emptyReport),
        includeImage || includeInvoice ? loadImageLiquidationReport(healthInsuranceId, from, to) : Promise.resolve(emptyReport),
        includeLaboratory || includeInvoice ? loadLaboratoryLiquidationReport(healthInsuranceId, from, to) : Promise.resolve(emptyReport),
        includeHospitalization ? loadHospitalizationReport(healthInsuranceId, from, to) : Promise.resolve(emptyReport),
      ]);
      const reportRows = report.rows || [];
      const insurance = report.insurance || internmentReport.insurance || imageReport.insurance || laboratoryReport.insurance || selectedInsurance || {};
      const rowsPerPage = 34;
      const pages = reportRows.length ? Array.from(
        { length: Math.ceil(reportRows.length / rowsPerPage) },
        (_, index) => reportRows.slice(index * rowsPerPage, (index + 1) * rowsPerPage),
      ) : [];
      const totals = reportRows.reduce((result, row) => ({
        honorarios: result.honorarios + Number(row.honorarios || 0),
        gastos: result.gastos + Number(row.gastos || 0),
        total: result.total + Number(row.importeTotal || 0),
      }), { honorarios: 0, gastos: 0, total: 0 });
      const address = [insurance.calle, insurance.numero, insurance.localidad, insurance.cp].filter(Boolean).join(" - ");
      const emittedAt = new Intl.DateTimeFormat("es-AR").format(new Date());
      const pageHtml = pages.map((pageRows, pageIndex) => {
        const body = pageRows.length ? pageRows.map((row) => `<tr>
          <td class="center">${escapeHtml(row.numeroCabo)}</td><td class="center">${formatDni(row.dni)}</td>
          <td>${escapeHtml(row.paciente)}</td><td class="center">${escapeHtml(row.codigo)}</td><td class="center">${escapeHtml(row.cantidad)}</td>
          <td class="number">${amount(row.honorarios)}</td><td class="number">${amount(row.gastos)}</td><td class="number">${amount(row.importeTotal)}</td>
        </tr>`).join("") : '<tr><td colspan="8" class="empty">Sin prestaciones ambulatorias para el período seleccionado.</td></tr>';
        const totalBlock = pageIndex === pages.length - 1 ? `<div class="totals">
          <div class="total-row"><strong>A CARGO DEL BENEFICIARIO</strong><span>${amount(0)}</span><span>${amount(0)}</span><span>${amount(0)}</span></div>
          <div class="total-row"><strong>A CARGO DE LA OBRA SOCIAL</strong><span>${amount(totals.honorarios)}</span><span>${amount(totals.gastos)}</span><span>${amount(totals.total)}</span></div>
        </div>` : "";
        return `<section class="report-page"><header>
          <img src="${escapeHtml(hospitalCrossUrl)}" alt="Hospital" />
          <div class="institution"><strong>HOSPITAL MUNICIPAL LUIS O. RIVERO</strong><span>Mariano Moreno 140 - Jovita - 6127 - (Cba)</span><span>Tel. (03385) - 498205 &nbsp;&nbsp; Código 04.330953</span></div>
          <div class="report-meta"><strong>Rendición de Atención Ambulatoria</strong><span>Fecha de emisión: ${emittedAt}</span><span>Página ${pageIndex + 1} de ${pages.length}</span></div>
        </header><div class="insurance"><div><b>OBRA SOCIAL:</b> ${escapeHtml(insurance.sigla || "")}</div><div><b>${escapeHtml(insurance.descripcion || "")}</b></div><div>${escapeHtml(address)}</div><div><b>CÓDIGO:</b> ${escapeHtml(insurance.codigo || "")}</div><div><b>PERÍODO:</b> ${formatDate(from)} al ${formatDate(to)}</div></div>
        <table><thead><tr><th>N° CABO</th><th>D.N.I.</th><th>Nombre Paciente</th><th>N.N.N.</th><th>C.T.</th><th>Importe<br/>Honorarios</th><th>Importe<br/>Gastos</th><th>Importe<br/>Total</th></tr></thead><tbody>${body}</tbody></table>${totalBlock}</section>`;
      }).join("");
      const internmentRows = internmentReport.rows || [];
      const internmentPages = Array.from(
        { length: Math.ceil(internmentRows.length / rowsPerPage) },
        (_, index) => internmentRows.slice(index * rowsPerPage, (index + 1) * rowsPerPage),
      );
      const internmentTotals = internmentRows.reduce((result, row) => ({
        honorarios: result.honorarios + Number(row.honorarios || 0),
        gastos: result.gastos + Number(row.gastos || 0),
        total: result.total + Number(row.importeTotal || 0),
      }), { honorarios: 0, gastos: 0, total: 0 });
      const internmentPageHtml = internmentPages.map((pageRows, pageIndex) => {
        const body = pageRows.map((row) => `<tr>
          <td class="center">${escapeHtml(row.numeroCabo)}</td><td class="center">${formatDni(row.dni)}</td>
          <td>${escapeHtml(row.paciente)}</td><td class="center">${escapeHtml(row.cantidad)}</td>
          <td class="number">${amount(row.honorarios)}</td><td class="number">${amount(row.gastos)}</td><td class="number">${amount(row.importeTotal)}</td>
        </tr>`).join("");
        const totalBlock = pageIndex === internmentPages.length - 1 ? `<div class="totals">
          <div class="total-row"><strong>A CARGO DEL BENEFICIARIO</strong><span>${amount(0)}</span><span>${amount(0)}</span><span>${amount(0)}</span></div>
          <div class="total-row"><strong>A CARGO DE LA OBRA SOCIAL</strong><span>${amount(internmentTotals.honorarios)}</span><span>${amount(internmentTotals.gastos)}</span><span>${amount(internmentTotals.total)}</span></div>
        </div>` : "";
        return `<section class="report-page"><header>
          <img src="${escapeHtml(hospitalCrossUrl)}" alt="Hospital" />
          <div class="institution"><strong>HOSPITAL MUNICIPAL LUIS O. RIVERO</strong><span>Mariano Moreno 140 - Jovita - 6127 - (Cba)</span><span>Tel. (03385) - 498205 &nbsp;&nbsp; Código 04.330953</span></div>
          <div class="report-meta"><strong>Rendición de Internaciones</strong><span>Fecha de emisión: ${emittedAt}</span><span>Página ${pageIndex + 1} de ${internmentPages.length}</span></div>
        </header><div class="insurance"><div><b>OBRA SOCIAL:</b> ${escapeHtml(insurance.sigla || "")}</div><div><b>${escapeHtml(insurance.descripcion || "")}</b></div><div>${escapeHtml(address)}</div><div><b>CÓDIGO:</b> ${escapeHtml(insurance.codigo || "")}</div><div><b>PERÍODO:</b> ${formatDate(from)} al ${formatDate(to)}</div></div>
        <table class="internment"><thead><tr><th>N° CABO</th><th>D.N.I.</th><th>Nombre Paciente</th><th>C.T.</th><th>Importe<br/>Honorarios</th><th>Importe<br/>Gastos</th><th>Importe<br/>Total</th></tr></thead><tbody>${body}</tbody></table>${totalBlock}</section>`;
      }).join("");
      const imageRows = imageReport.rows || [];
      const imagePages = Array.from(
        { length: Math.ceil(imageRows.length / rowsPerPage) },
        (_, index) => imageRows.slice(index * rowsPerPage, (index + 1) * rowsPerPage),
      );
      const imageTotals = imageRows.reduce((result, row) => ({
        honorarios: result.honorarios + Number(row.honorarios || 0),
        gastos: result.gastos + Number(row.gastos || 0),
        total: result.total + Number(row.importeTotal || 0),
      }), { honorarios: 0, gastos: 0, total: 0 });
      const imagePageHtml = imagePages.map((pageRows, pageIndex) => {
        const body = pageRows.map((row) => `<tr>
          <td class="center">${escapeHtml(row.numeroCabo)}</td><td class="center">${formatDni(row.dni)}</td>
          <td>${escapeHtml(row.paciente)}</td><td class="center">${escapeHtml(row.codigo)}</td><td class="center">${escapeHtml(row.cantidad)}</td>
          <td class="number">${amount(row.honorarios)}</td><td class="number">${amount(row.gastos)}</td><td class="number">${amount(row.importeTotal)}</td>
        </tr>`).join("");
        const totalBlock = pageIndex === imagePages.length - 1 ? `<div class="totals">
          <div class="total-row"><strong>A CARGO DEL BENEFICIARIO</strong><span>${amount(0)}</span><span>${amount(0)}</span><span>${amount(0)}</span></div>
          <div class="total-row"><strong>A CARGO DE LA OBRA SOCIAL</strong><span>${amount(imageTotals.honorarios)}</span><span>${amount(imageTotals.gastos)}</span><span>${amount(imageTotals.total)}</span></div>
        </div>` : "";
        return `<section class="report-page"><header>
          <img src="${escapeHtml(hospitalCrossUrl)}" alt="Hospital" />
          <div class="institution"><strong>HOSPITAL MUNICIPAL LUIS O. RIVERO</strong><span>Mariano Moreno 140 - Jovita - 6127 - (Cba)</span><span>Tel. (03385) - 498205 &nbsp;&nbsp; Código 04.330953</span></div>
          <div class="report-meta"><strong>Rendición de Imagen</strong><span>Fecha de emisión: ${emittedAt}</span><span>Página ${pageIndex + 1} de ${imagePages.length}</span></div>
        </header><div class="insurance"><div><b>OBRA SOCIAL:</b> ${escapeHtml(insurance.sigla || "")}</div><div><b>${escapeHtml(insurance.descripcion || "")}</b></div><div>${escapeHtml(address)}</div><div><b>CÓDIGO:</b> ${escapeHtml(insurance.codigo || "")}</div><div><b>PERÍODO:</b> ${formatDate(from)} al ${formatDate(to)}</div></div>
        <table><thead><tr><th>N° CABO</th><th>D.N.I.</th><th>Nombre Paciente</th><th>N.N.N.</th><th>C.T.</th><th>Importe<br/>Honorarios</th><th>Importe<br/>Gastos</th><th>Importe<br/>Total</th></tr></thead><tbody>${body}</tbody></table>${totalBlock}</section>`;
      }).join("");
      const laboratoryRows = laboratoryReport.rows || [];
      const laboratoryGroups = Object.values(laboratoryRows.reduce((groups, row) => {
        const key = String(row.numeroCabo);
        if (!groups[key]) groups[key] = { numeroCabo: row.numeroCabo, paciente: row.paciente, dni: row.dni, rows: [] };
        groups[key].rows.push(row);
        return groups;
      }, {}));
      const laboratoryPages = laboratoryGroups.reduce((result, group) => {
        const groupSize = group.rows.length + 2;
        const currentPage = result[result.length - 1];
        const currentSize = currentPage?.reduce((sum, item) => sum + item.rows.length + 2, 0) || 0;
        if (!currentPage || currentSize + groupSize > 30) result.push([group]);
        else currentPage.push(group);
        return result;
      }, []);
      const laboratoryTotal = laboratoryRows.reduce((sum, row) => sum + Number(row.importeTotal || 0), 0);
      const laboratoryPageHtml = laboratoryPages.map((pageGroups, pageIndex) => {
        const body = pageGroups.map((group) => {
          const subtotal = group.rows.reduce((sum, row) => sum + Number(row.importeTotal || 0), 0);
          const lines = group.rows.map((row, rowIndex) => `<tr>
            <td class="center">${rowIndex === 0 ? escapeHtml(group.numeroCabo) : ""}</td>
            <td>${escapeHtml(row.codigo ? `${row.codigo} - ${row.laboratorio}` : row.laboratorio)}</td>
            <td class="number">${amount(row.importeTotal)}</td>
          </tr>`).join("");
          return `<tr class="laboratory-patient"><td colspan="3"><strong>Paciente:</strong> ${escapeHtml(group.paciente)} &nbsp;&nbsp; <strong>D.N.I.:</strong> ${formatDni(group.dni)}</td></tr>${lines}
            <tr class="laboratory-subtotal"><td colspan="2">Sub Total:</td><td class="number">${amount(subtotal)}</td></tr>`;
        }).join("");
        const totalBlock = pageIndex === laboratoryPages.length - 1
          ? `<div class="laboratory-total"><strong>TOTAL:</strong><span>${amount(laboratoryTotal)}</span></div>` : "";
        return `<section class="report-page"><header>
          <img src="${escapeHtml(hospitalCrossUrl)}" alt="Hospital" />
          <div class="institution"><strong>HOSPITAL MUNICIPAL LUIS O. RIVERO</strong><span>Mariano Moreno 140 - Jovita - 6127 - (Cba)</span><span>Tel. (03385) - 498205 &nbsp;&nbsp; Código 04.330953</span></div>
          <div class="report-meta"><strong>Rendición de Laboratorio</strong><span>Fecha de emisión: ${emittedAt}</span><span>Página ${pageIndex + 1} de ${laboratoryPages.length}</span></div>
        </header><div class="insurance"><div><b>OBRA SOCIAL:</b> ${escapeHtml(insurance.sigla || "")}</div><div><b>${escapeHtml(insurance.descripcion || "")}</b></div><div>${escapeHtml(address)}</div><div><b>CÓDIGO:</b> ${escapeHtml(insurance.codigo || "")}</div><div><b>PERÍODO:</b> ${formatDate(from)} al ${formatDate(to)}</div></div>
        <table class="laboratory"><thead><tr><th>N° CABO</th><th>Laboratorio</th><th>Importe Total</th></tr></thead><tbody>${body}</tbody></table>${totalBlock}</section>`;
      }).join("");
      const calculateAge = (birthDate, referenceDate) => {
        if (!birthDate || !referenceDate) return "-";
        const birth = new Date(`${birthDate.slice(0, 10)}T00:00:00`);
        const reference = new Date(`${referenceDate.slice(0, 10)}T00:00:00`);
        let age = reference.getFullYear() - birth.getFullYear();
        if (reference.getMonth() < birth.getMonth() || (reference.getMonth() === birth.getMonth() && reference.getDate() < birth.getDate())) age -= 1;
        return age;
      };
      const hospitalizationGroups = Object.values((hospitalizationReport.rows || []).reduce((groups, row) => {
        const key = String(row.numeroCabo);
        if (!groups[key]) groups[key] = { ...row, diagnoses: [] };
        if (row.diagnosticoCodigo && !groups[key].diagnoses.some((item) => item.codigo === row.diagnosticoCodigo)) {
          groups[key].diagnoses.push({ codigo: row.diagnosticoCodigo, descripcion: row.diagnosticoDescripcion, observaciones: row.diagnosticoObservaciones });
        }
        return groups;
      }, {}));
      const hospitalizationPageHtml = hospitalizationGroups.map((row, pageIndex) => {
        const domicile = [row.calle, row.numero, row.localidad, row.cp].filter(Boolean).join(" - ");
        const diagnoses = row.diagnoses.length ? row.diagnoses : [{ codigo: "-", descripcion: "Sin diagnóstico registrado", observaciones: "" }];
        const admission = new Date(`${row.fechaIngreso}T00:00:00`);
        const discharge = new Date(`${row.fechaAlta}T00:00:00`);
        const stayDays = Math.max(1, Math.ceil((discharge - admission) / 86400000));
        return `<section class="report-page hospitalization-page"><header>
          <img src="${escapeHtml(hospitalCrossUrl)}" alt="Hospital" />
          <div class="institution"><strong>HOSPITAL MUNICIPAL LUIS O. RIVERO</strong><span>Mariano Moreno 140 - Jovita - 6127 - (Cba)</span><span>Tel. (03385) - 498205 &nbsp;&nbsp; Código 04.330953</span></div>
          <div class="report-meta"><strong>Informe de Hospitalización</strong><span>Fecha de emisión: ${emittedAt}</span><span>Página ${pageIndex + 1} de ${hospitalizationGroups.length}</span></div>
        </header>
          <div class="hospitalization-title"><strong>INFORME DE HOSPITALIZACIÓN</strong><span>Rendición Individual N° ${escapeHtml(row.numeroCabo)}</span></div>
          <div class="form-grid institution-data"><b>ESTABLECIMIENTO</b><span>HOSPITAL MUNICIPAL LUIS O. RIVERO</span><b>OBRA SOCIAL</b><span>${escapeHtml(insurance.descripcion || "")}</span><b>CÓDIGO</b><span>${escapeHtml(insurance.codigo || "")}</span></div>
          <div class="form-grid patient-data"><b>N° BENEFICIARIO</b><span>${escapeHtml(row.numeroBeneficiario || "-")}</span><b>APELLIDO Y NOMBRE</b><span>${escapeHtml(row.paciente || "-")}</span><b>N° DOCUMENTO</b><span>${formatDni(row.dni)}</span><b>FECHA NACIMIENTO</b><span>${formatDate(row.fechaNacimiento)}</span><b>OCUPACIÓN</b><span>${escapeHtml(row.ocupacion || "-")}</span><b>SEXO</b><span>${escapeHtml(row.sexo || "-")}</span><b>EDAD</b><span>${calculateAge(row.fechaNacimiento, row.fechaIngreso)}</span><b>ESTADO CIVIL</b><span>${escapeHtml(row.estadoCivil || "Sin especificar")}</span><b>TELÉFONO</b><span>${escapeHtml(row.telefono || "-")}</span><b>DOMICILIO HABITUAL COMPLETO</b><span>${escapeHtml(domicile || "-")}</span></div>
          <table class="stay-table"><thead><tr><th></th><th>FECHA</th><th>HORA</th><th>SECTOR - SERVICIO</th><th>TIPO DE PENSIÓN</th><th>DÍAS INT.</th></tr></thead><tbody><tr><th>INGRESO</th><td>${formatDate(row.fechaIngreso)}</td><td></td><td>Internación</td><td></td><td rowspan="2">${stayDays}</td></tr><tr><th>EGRESO</th><td>${formatDate(row.fechaAlta)}</td><td></td><td></td><td></td></tr></tbody></table>
          <div class="certification"><b>CERTIFICACIÓN DE INTERNACIÓN</b><div>FIRMA BENEFICIARIO O FAMILIAR</div><div>ACLARACIÓN</div></div>
          <div class="hospitalization-options"><b>EGRESO POR:</b><span>☐ ALTA</span><span>☐ TRASLADO</span><span>☐ FALLECIMIENTO</span><span>☐ OTROS</span></div>
          <div class="diagnosis-box"><b>DIAGNÓSTICO PRINCIPAL</b>${diagnoses.map((item) => `<div><strong>${escapeHtml(item.codigo)}</strong><span>${escapeHtml(item.descripcion)}</span><small>${escapeHtml(item.observaciones || "")}</small></div>`).join("")}</div>
          <div class="hospitalization-notes"><b>OBSERVACIONES:</b><span></span></div>
          <div class="doctor-signature">FIRMA Y ACLARACIÓN MÉDICO RESPONSABLE</div>
        </section>`;
      }).join("");
      const invoiceLines = [
        ["TOTAL DE PRESTACIONES AMBULATORIAS", totals],
        ["TOTAL DE PRESTACIONES IMÁGENES", imageTotals],
        ["TOTAL DE INTERNACIONES", internmentTotals],
        ["TOTAL LABORATORIO", { honorarios: 0, gastos: laboratoryTotal, total: laboratoryTotal }],
      ];
      const invoiceHonorarios = invoiceLines.reduce((sum, [, values]) => sum + Number(values.honorarios || 0), 0);
      const invoiceGastos = invoiceLines.reduce((sum, [, values]) => sum + Number(values.gastos || 0), 0);
      const invoiceTotal = invoiceHonorarios + invoiceGastos;
      const fromDate = new Date(`${from}T00:00:00`);
      const toDate = new Date(`${to}T00:00:00`);
      const sameMonth = fromDate.getMonth() === toDate.getMonth() && fromDate.getFullYear() === toDate.getFullYear();
      const billingPeriod = sameMonth
        ? new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(fromDate).toLocaleUpperCase("es-AR")
        : `${formatDate(from)} AL ${formatDate(to)}`;
      const invoicePageHtml = includeInvoice && invoiceTotal > 0 ? `<section class="report-page invoice-page"><header>
        <img src="${escapeHtml(hospitalCrossUrl)}" alt="Hospital" />
        <div class="institution"><strong>HOSPITAL MUNICIPAL LUIS O. RIVERO</strong><span>Mariano Moreno 140 - Jovita - 6127 - (Cba)</span><span>Tel. (03385) - 498205 &nbsp;&nbsp; Código 04.330953</span></div>
        <div class="report-meta"><strong>Factura N° ${escapeHtml(manualInvoiceNumber)}</strong><span>Fecha de emisión: ${emittedAt}</span><span>Página 1 de 1</span></div>
      </header><div class="insurance invoice-insurance"><div><b>OBRA SOCIAL:</b> ${escapeHtml(insurance.sigla || "")}</div><div><b>${escapeHtml(insurance.descripcion || "")}</b></div><div>${escapeHtml(address)}</div><div><b>CÓDIGO:</b> ${escapeHtml(insurance.codigo || "")}</div></div>
      <div class="billing-period"><strong>FACTURACIÓN CORRESPONDIENTE AL MES DE:</strong><span>${escapeHtml(billingPeriod)}</span></div>
      <table class="invoice-table"><colgroup><col/><col style="width:32mm"/><col style="width:32mm"/></colgroup><thead><tr><th>CONCEPTO</th><th colspan="2">A CARGO DE LA OBRA SOCIAL</th></tr><tr><th></th><th>HONORARIOS</th><th>GASTOS</th></tr></thead><tbody>
        ${invoiceLines.map(([label, values]) => `<tr><td>${label}</td><td class="number">${amount(values.honorarios)}</td><td class="number">${amount(values.gastos)}</td></tr>`).join("")}
      </tbody></table>
      <div class="invoice-summary"><div><strong>SUBTOTAL</strong><span>${amount(invoiceHonorarios)}</span><span>${amount(invoiceGastos)}</span></div><div class="invoice-grand-total"><strong>TOTAL GENERAL</strong><span>${amount(invoiceTotal)}</span></div></div>
      </section>` : "";
      const selectedReportHtml = `${includeAmbulatory ? pageHtml : ""}${includeInternment ? internmentPageHtml : ""}${includeImage ? imagePageHtml : ""}${includeLaboratory ? laboratoryPageHtml : ""}${includeHospitalization ? hospitalizationPageHtml : ""}${invoicePageHtml}`;
      if (!selectedReportHtml) {
        printFrame.remove();
        onNotice("Los reportes seleccionados no tienen datos para el período indicado.");
        return;
      }
      reportWindow.document.open();
      reportWindow.document.write(`<!doctype html><html><head><meta charset="UTF-8"><title>Rendición de Atención Ambulatoria</title><style>
        @page{size:A4 portrait;margin:0}*{box-sizing:border-box}body{margin:0;background:#eee;font-family:Arial,sans-serif;color:#111;font-size:9px}.report-page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;padding:10mm 9mm 9mm;page-break-after:always}.report-page:last-child{page-break-after:auto}header{height:31mm;display:grid;grid-template-columns:26mm 1fr 66mm;align-items:center;border-bottom:1.5px solid #111;padding-bottom:3mm}header img{max-width:22mm;max-height:25mm;object-fit:contain}.institution{display:flex;flex-direction:column;gap:2px;font-size:9px}.institution strong{font-size:13px}.report-meta{display:flex;flex-direction:column;text-align:right;gap:3px}.report-meta strong{font-size:15px;line-height:1.1}.insurance{display:grid;grid-template-columns:1fr auto;gap:2px 12px;padding:4mm 1mm 3mm;border-bottom:1.5px solid #111;font-size:9px}.insurance div:nth-child(2),.insurance div:nth-child(3){grid-column:1}.insurance div:nth-child(4){grid-column:2;grid-row:1}.insurance div:nth-child(5){grid-column:2;grid-row:2;text-align:right}table{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:3mm}th,td{padding:1.2mm 1mm;height:5.4mm}th{border:1px solid #555;background:#eee;text-align:center;font-size:8px}td{border:0}th:nth-child(1){width:13mm}th:nth-child(2){width:20mm}th:nth-child(3){width:52mm}th:nth-child(4){width:15mm}th:nth-child(5){width:9mm}th:nth-child(n+6){width:24mm}.center{text-align:center}.number{text-align:right;font-variant-numeric:tabular-nums}.empty{text-align:center;height:25mm;color:#555}.totals{margin-top:5mm;width:100%;border-top:1px solid #333;border-bottom:1px solid #333}.total-row{display:grid;grid-template-columns:minmax(0,1fr) repeat(3,24mm);min-height:7mm;align-items:center;border-bottom:1px solid #777}.total-row:last-child{border-bottom:0}.total-row>*{height:100%;display:flex;align-items:center;justify-content:flex-end;padding:1.5mm}.total-row strong{justify-content:flex-end;padding-right:4mm;font-size:8px}.total-row span{border-left:1px solid #777}@media print{body{background:#fff}.report-page{margin:0}}
        th:nth-child(3){width:63mm}.internment th:nth-child(1){width:13mm}.internment th:nth-child(2){width:20mm}.internment th:nth-child(3){width:78mm}.internment th:nth-child(4){width:9mm}.internment th:nth-child(n+5){width:24mm}.totals{border-bottom:0}.total-row{border-bottom:0}.total-row span{border-left:0}.laboratory th:nth-child(1){width:25mm}.laboratory th:nth-child(2){width:143mm}.laboratory th:nth-child(3){width:24mm}.laboratory-patient td{padding-top:3mm;font-size:9px}.laboratory-subtotal td{padding-top:1mm;font-weight:bold}.laboratory-subtotal td:nth-child(1){text-align:right;padding-right:4mm}.laboratory-total{display:grid;grid-template-columns:minmax(0,1fr) 24mm;margin-top:4mm;border-top:1px solid #333;padding-top:1.5mm}.laboratory-total strong{text-align:right;padding-right:4mm}.laboratory-total span{text-align:right;padding-right:1mm;font-weight:bold}.invoice-insurance{grid-template-rows:auto auto auto}.billing-period{display:flex;align-items:center;gap:8mm;margin:13mm 4mm 7mm;font-size:10px}.billing-period span{font-weight:bold}.invoice-table th:first-child{width:auto}.invoice-table th:nth-child(2),.invoice-table th:nth-child(3){width:32mm}.invoice-table tbody td{height:9mm}.invoice-table tbody td:first-child{padding-left:5mm;font-weight:bold}.invoice-summary{margin-top:8mm;border-top:1px solid #333}.invoice-summary>div{display:grid;grid-template-columns:minmax(0,1fr) 32mm 32mm;align-items:center;min-height:8mm}.invoice-summary strong{text-align:right;padding-right:5mm}.invoice-summary span{text-align:right;padding-right:1mm;font-weight:bold}.invoice-summary .invoice-grand-total{grid-template-columns:minmax(0,1fr) 64mm;border-top:1px solid #333;font-size:11px}.invoice-grand-total span{text-align:right}
        .hospitalization-page{position:relative;padding:8mm;font-size:8px}.hospitalization-page header{margin-bottom:3mm}.hospitalization-title{display:flex;justify-content:space-between;align-items:end;border:2px solid #111;padding:2.5mm 3mm;font-size:11px}.hospitalization-title strong{font-size:15px}.form-grid{display:grid;grid-template-columns:34mm 1fr 25mm 42mm;border:1px solid #111;border-top:0}.form-grid>*{padding:1.5mm;border-right:1px solid #777;border-bottom:1px solid #777;min-height:6mm}.form-grid>*:nth-child(4n){border-right:0}.institution-data{grid-template-columns:34mm 1fr 25mm 42mm}.institution-data b:nth-of-type(2){grid-column:1}.institution-data span:nth-of-type(2){grid-column:2}.patient-data{grid-template-columns:34mm 55mm 28mm 1fr}.patient-data b:last-of-type{grid-column:1}.patient-data span:last-child{grid-column:2/5}.stay-table{margin-top:3mm}.stay-table th,.stay-table td{border:1px solid #555;height:8mm;text-align:center}.stay-table th:nth-child(n){width:auto}.certification{display:grid;grid-template-columns:1fr 55mm 40mm;border:1px solid #111;border-top:0;min-height:23mm}.certification>*{padding:2mm;border-right:1px solid #777}.hospitalization-options{display:flex;gap:9mm;padding:3mm;border:1px solid #111;border-top:0}.diagnosis-box{min-height:38mm;border:1px solid #111;border-top:0;padding:3mm}.diagnosis-box>b{display:block;margin-bottom:3mm}.diagnosis-box>div{display:grid;grid-template-columns:18mm 1fr;gap:2mm;margin-bottom:2mm}.diagnosis-box small{grid-column:2;color:#444}.hospitalization-notes{display:flex;gap:3mm;min-height:22mm;border:1px solid #111;border-top:0;padding:3mm}.doctor-signature{margin:15mm 0 0 auto;width:70mm;border-top:1px solid #111;padding-top:2mm;text-align:center}
      </style></head><body>${selectedReportHtml}<script>window.addEventListener('afterprint',()=>window.frameElement?.remove());window.addEventListener('load',()=>setTimeout(()=>{window.focus();window.print()},250));<\/script></body></html>`);
      reportWindow.document.close();
    } catch (error) {
      printFrame.remove();
      onNotice(`No se pudo generar la rendición ambulatoria: ${error.message}`);
    } finally {
      setReportLoading(false);
    }
  };
  const clear = () => {
    setHealthInsuranceId("");
    setInsuranceSearch("");
    setFrom(monthStart);
    setTo(today);
    setAttentionFilter("Todos");
    setRows([]);
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Liquidación Obra Social</h2>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(240px,1fr)_160px_160px_170px_auto] lg:items-end">
          <label className="text-sm font-semibold text-slate-600">
            Obra social
            <span className="mt-2 flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-hospital-500">
              <input readOnly value={selectedInsurance?.descripcion || ""} placeholder="Buscar obra social" className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-normal text-slate-700 outline-none" />
              <button type="button" onClick={() => setInsuranceModalOpen(true)} className="grid w-12 place-items-center border-l border-slate-200 text-hospital-600 hover:bg-hospital-50" aria-label="Buscar obra social">
                <Search size={19} />
              </button>
            </span>
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Desde
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-hospital-500" />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Hasta
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-hospital-500" />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Tipo de atención
            <select value={attentionFilter} onChange={(event) => setAttentionFilter(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal text-slate-700 outline-none focus:border-hospital-500">
              <option value="Todos">Todos</option>
              <option value="Ambulatoria">Ambulatoria</option>
              <option value="Internación">Internación</option>
            </select>
          </label>
          <button onClick={searchLiquidation} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-hospital-600 px-5 py-2.5 font-semibold text-white hover:bg-hospital-700 disabled:opacity-60">
            <Search size={18} /> {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>{["N° orden", "Fecha", "N° beneficiario", "Apellido y nombre", "Atención", "Honorarios", "Gastos", "Importe total", "Detalle"].map((title) => <th key={title} className="px-4 py-3 font-bold">{title}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.map((row) => (
                <tr key={row.numeroOrden} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-700">{row.numeroOrden}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(row.fecha)}</td>
                  <td className="px-4 py-3 text-slate-600">{row.numeroBeneficiario || "—"}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{row.beneficiario}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-hospital-50 px-2.5 py-1 text-xs font-semibold text-hospital-700">{row.tipoAtencion}</span></td>
                  <td className="px-4 py-3 text-right text-slate-600">{money(row.honorarios)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{money(row.gastos)}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">{money(row.importeTotal)}</td>
                  <td className="px-4 py-3 text-center"><button type="button" onClick={() => showCaboDetail(row)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold text-hospital-700 hover:bg-hospital-50"><Eye size={17} /> Ver</button></td>
                </tr>
              ))}
              {!loading && visibleRows.length === 0 && <tr><td colSpan="9" className="px-6 py-16 text-center text-slate-400">{rows.length ? "No hay resultados para el tipo de atención seleccionado." : "Seleccioná una obra social y un período para consultar la liquidación."}</td></tr>}
            </tbody>
          </table>
        </div>
        {visibleRows.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, visibleRows.length)} de {visibleRows.length} registros</p>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 disabled:opacity-40">Anterior</button>
              <span className="px-2 text-sm font-semibold text-slate-600">Página {page} de {totalPages}</span>
              <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[['Prestaciones ambulatorias', totals.outpatient], ['Internaciones', totals.internment], ['Total general', totals.general]].map(([label, value], index) => (
          <div key={label} className={`rounded-2xl border p-4 ${index === 2 ? "border-hospital-200 bg-hospital-50" : "border-slate-200 bg-white"}`}>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-bold text-slate-800">{money(value)}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <button onClick={clear} className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
        <button onClick={() => setReportPickerOpen(true)} disabled={!rows.length || reportLoading} className="rounded-xl bg-hospital-600 px-4 py-2.5 font-semibold text-white hover:bg-hospital-700 disabled:opacity-40">{reportLoading ? "Preparando reporte..." : "Imprimir liquidación"}</button>
        <button onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-100">Cerrar</button>
      </div>

      {reportPickerOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="report-picker-title">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <h3 id="report-picker-title" className="text-xl font-bold text-slate-800">Seleccionar reportes</h3>
              <p className="mt-1 text-sm text-slate-500">Elegí qué documentos querés incluir en la impresión.</p>
            </div>
            <div className="space-y-3 p-6">
              {[
                ["ambulatory", "Rendición de Atención Ambulatoria"],
                ["internment", "Rendición de Internaciones"],
                ["image", "Rendición de Imagen"],
                ["laboratory", "Rendición de Laboratorio"],
                ["hospitalization", "Informe de Hospitalización"],
                ["invoice", "Factura"],
              ].map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selectedPrintReports.includes(value)}
                    onChange={() => setSelectedPrintReports((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])}
                    className="h-4 w-4 accent-hospital-600"
                  />
                  <span className="font-semibold text-slate-700">{label}</span>
                </label>
              ))}
              {selectedPrintReports.includes("invoice") && (
                <label className="block rounded-xl border border-hospital-200 bg-hospital-50 p-4">
                  <span className="text-sm font-semibold text-slate-700">
                    Número de factura <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(event) => setInvoiceNumber(event.target.value)}
                    placeholder="Ingresá el número de factura"
                    autoFocus
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-hospital-500"
                  />
                  {!invoiceNumber.trim() && <span className="mt-2 block text-xs font-semibold text-red-600">Este dato es obligatorio para imprimir la factura.</span>}
                </label>
              )}
              <button
                type="button"
                onClick={() => setSelectedPrintReports(selectedPrintReports.length === allPrintReports.length ? [] : allPrintReports)}
                className="text-sm font-semibold text-hospital-700 hover:text-hospital-800"
              >
                {selectedPrintReports.length === allPrintReports.length ? "Quitar selección" : "Seleccionar todos"}
              </button>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button type="button" onClick={() => setReportPickerOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-white">Cancelar</button>
              <button
                type="button"
                disabled={!selectedPrintReports.length || (selectedPrintReports.includes("invoice") && !invoiceNumber.trim())}
                onClick={() => { const selection = [...selectedPrintReports]; const number = invoiceNumber.trim(); setReportPickerOpen(false); printAmbulatoryReport(selection, number); }}
                className="rounded-xl bg-hospital-600 px-4 py-2.5 font-semibold text-white hover:bg-hospital-700 disabled:opacity-40"
              >
                Generar impresión
              </button>
            </div>
          </div>
        </div>
      )}

      {insuranceModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="insurance-modal-title">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 id="insurance-modal-title" className="text-lg font-bold text-slate-800">Buscar obra social</h3>
                <p className="text-sm text-slate-500">Seleccioná una obra social para la liquidación.</p>
              </div>
              <button type="button" onClick={() => setInsuranceModalOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="border-b border-slate-100 p-4">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-hospital-500">
                <Search size={18} className="text-slate-400" />
                <input autoFocus value={insuranceSearch} onChange={(event) => setInsuranceSearch(event.target.value)} placeholder="Buscar por nombre, sigla o código..." className="w-full py-2.5 text-sm outline-none" />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {insurancesLoading && <p className="px-4 py-12 text-center text-sm text-slate-400">Cargando obras sociales...</p>}
              {!insurancesLoading && filteredInsurances.map((item) => (
                <button key={item.id} type="button" onClick={() => { setHealthInsuranceId(String(item.id)); setInsuranceModalOpen(false); setInsuranceSearch(""); }} className="flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3 text-left hover:bg-hospital-50">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-700">{item.descripcion}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{item.sigla || "Sin sigla"}</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">{item.codigo || "—"}</span>
                </button>
              ))}
              {!insurancesLoading && filteredInsurances.length === 0 && <p className="px-4 py-12 text-center text-sm text-slate-400">No se encontraron obras sociales.</p>}
            </div>
          </div>
        </div>
      )}
      {caboDetail && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">
          <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div><p className="text-xs font-bold uppercase tracking-wide text-hospital-600">Detalle del cabo</p><h3 className="text-xl font-bold text-slate-800">Cabo N° {caboDetail.row.numeroOrden}</h3><p className="text-sm text-slate-500">{caboDetail.row.beneficiario} · {formatDate(caboDetail.row.fecha)}</p></div>
              <button type="button" onClick={() => setCaboDetail(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {detailLoading ? <p className="py-16 text-center text-slate-400">Cargando detalle...</p> : caboDetail.data && (
                <div className="space-y-6">
                  <div><h4 className="mb-2 font-bold text-slate-700">Prestaciones</h4><div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[620px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Código</th><th className="px-4 py-3">Descripción</th><th className="px-4 py-3">Cantidad</th><th className="px-4 py-3">Profesional</th><th className="px-4 py-3 text-right">Importe</th></tr></thead><tbody className="divide-y divide-slate-100">{caboDetail.data.prestaciones.map((item, index) => <tr key={`${item.codigo}-${index}`}><td className="px-4 py-3 font-semibold">{item.codigo}</td><td className="px-4 py-3">{item.descripcion}</td><td className="px-4 py-3">{item.cantidad}</td><td className="px-4 py-3">{item.profesional1 || "—"}</td><td className="px-4 py-3 text-right font-semibold">{money(item.arancel)}</td></tr>)}</tbody></table></div></div>
                  <div className="grid gap-5 md:grid-cols-3">
                    {[['Diagnósticos', caboDetail.data.diagnosticos, (item) => `${item.codigo} · ${item.descripcion}`], ['Medicamentos', caboDetail.data.medicamentos, (item) => `${item.producto} · Cant. ${item.cantidad}`], ['Laboratorio', caboDetail.data.laboratorio, (item) => `${item.codigo || ''} ${item.descripcion}`]].map(([title, items, render]) => <div key={title}><h4 className="mb-2 font-bold text-slate-700">{title}</h4><div className="space-y-2">{items.length ? items.map((item, index) => <div key={index} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{render(item)}</div>) : <p className="rounded-xl border border-dashed border-slate-200 p-3 text-sm text-slate-400">Sin registros</p>}</div></div>)}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end border-t border-slate-200 p-4"><button type="button" onClick={() => setCaboDetail(null)} className="rounded-xl bg-slate-800 px-4 py-2.5 font-semibold text-white">Cerrar</button></div>
          </div>
        </div>
      )}
    </section>
  );
}

function ProfessionalLiquidation({ onClose, onNotice }) {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(`${today.slice(0, 8)}01`);
  const [to, setTo] = useState(today);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailMode, setDetailMode] = useState("practices");
  const [detailInsuranceFilter, setDetailInsuranceFilter] = useState("Todas");
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const money = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(value || 0));
  const formatDate = (value) => value ? value.slice(0, 10).split("-").reverse().join("/") : "—";
  const totalProduced = rows.reduce((sum, row) => sum + Number(row.producido || 0), 0);
  const totalToPay = rows.reduce((sum, row) => sum + Number(row.totalCobrar || 0), 0);
  const groupedDetail = useMemo(() => Object.values((detail?.rows || []).reduce((groups, item) => {
    const key = item.obraSocial || "Sin obra social";
    if (!groups[key]) groups[key] = { obraSocial: key, cabos: new Set(), facturas: new Set(), producido: 0, debitos: 0 };
    groups[key].cabos.add(item.numeroCabo);
    if (item.numeroFactura) groups[key].facturas.add(item.numeroFactura);
    groups[key].producido += Number(item.importe || 0);
    groups[key].debitos += Number(item.debito || 0);
    return groups;
  }, {})).map((group) => ({ ...group, cabos: group.cabos.size, facturas: group.facturas.size })), [detail]);
  const detailInsuranceOptions = useMemo(() => [...new Set((detail?.rows || []).map((item) => item.obraSocial || "Sin obra social"))].sort((a, b) => a.localeCompare(b, "es")), [detail]);
  const filteredPracticeDetail = detailInsuranceFilter === "Todas"
    ? (detail?.rows || [])
    : (detail?.rows || []).filter((item) => (item.obraSocial || "Sin obra social") === detailInsuranceFilter);

  const search = async () => {
    if (!from || !to || from > to) return onNotice("Seleccioná un período válido.");
    setLoading(true);
    try { setRows(await loadProfessionalLiquidation(from, to)); setPage(1); }
    catch (error) { onNotice(`No se pudo obtener la liquidación: ${error.message}`); }
    finally { setLoading(false); }
  };
  const showDetail = async (professional) => {
    setDetailMode("practices");
    setDetailInsuranceFilter("Todas");
    setDetail({ professional, rows: null });
    setDetailLoading(true);
    try { setDetail({ professional, rows: await loadProfessionalLiquidationDetail(professional.id, from, to) }); }
    catch (error) { setDetail(null); onNotice(`No se pudo cargar el detalle: ${error.message}`); }
    finally { setDetailLoading(false); }
  };
  const printProfessionalReport = async () => {
    if (!rows.length) return;
    const printFrame = document.createElement("iframe");
    printFrame.setAttribute("aria-hidden", "true");
    printFrame.style.position = "fixed";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    printFrame.style.visibility = "hidden";
    document.body.appendChild(printFrame);
    const reportWindow = printFrame.contentWindow;
    if (!reportWindow) { printFrame.remove(); return onNotice("No se pudo abrir la vista de impresión."); }
    const issuedAt = new Intl.DateTimeFormat("es-AR").format(new Date());
    const reportMoney = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(Number(value || 0));
    const totals = rows.reduce((result, item) => ({
      produced: result.produced + Number(item.producido || 0),
      discount: result.discount + Number(item.descuento18 || 0),
      net: result.net + Number(item.neto82 || 0),
      payable: result.payable + Number(item.totalCobrar || 0),
    }), { produced: 0, discount: 0, net: 0, payable: 0 });
    const reportRows = rows.map((item) => `<tr><td>${item.profesional}</td><td>${reportMoney(item.producido)}</td><td>${reportMoney(item.descuento18)}</td><td>${reportMoney(item.neto82)}</td><td>${Number(item.porcentajeCobro || 0).toFixed(2)}%</td><td>${reportMoney(item.totalCobrar)}</td></tr>`).join("");
    let insuranceRows;
    try { insuranceRows = await loadProfessionalLiquidationByInsurance(from, to); }
    catch (error) { printFrame.remove(); return onNotice(`No se pudo generar el detalle por obra social: ${error.message}`); }
    const escapeReportHtml = (value) => String(value ?? "").replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
    const insuranceGroups = Object.values(insuranceRows.reduce((groups, item) => {
      const key = String(item.idRegistro);
      if (!groups[key]) groups[key] = { id: item.idRegistro, obraSocial: item.obraSocial || "Sin obra social", numeroFactura: item.numeroFactura || "-", importeFacturado: item.importeFacturado, importeCobrado: item.importeCobrado, rows: [] };
      groups[key].rows.push(item);
      return groups;
    }, {}));
    const pageCapacity = 36;
    const insurancePages = [];
    let currentPage = [];
    let remainingCapacity = pageCapacity;
    insuranceGroups.forEach((group) => {
      let rowIndex = 0;
      let fragmentIndex = 0;
      while (rowIndex < group.rows.length) {
        const headerSize = 4;
        const footerSize = 2;
        if (remainingCapacity < headerSize + 1) {
          insurancePages.push(currentPage);
          currentPage = [];
          remainingCapacity = pageCapacity;
        }
        const pendingRows = group.rows.length - rowIndex;
        const rowsWithoutFooter = Math.max(1, remainingCapacity - headerSize);
        const availableRows = pendingRows + footerSize <= rowsWithoutFooter
          ? pendingRows
          : rowsWithoutFooter;
        const fragmentRows = group.rows.slice(rowIndex, rowIndex + availableRows);
        rowIndex += fragmentRows.length;
        const isLastFragment = rowIndex >= group.rows.length;
        currentPage.push({ ...group, rows: fragmentRows, continued: fragmentIndex > 0, isLastFragment, allRows: group.rows });
        remainingCapacity -= headerSize + fragmentRows.length + (isLastFragment ? footerSize : 0);
        fragmentIndex += 1;
        if (!isLastFragment || remainingCapacity < 5) {
          insurancePages.push(currentPage);
          currentPage = [];
          remainingCapacity = pageCapacity;
        }
      }
    });
    if (currentPage.length) insurancePages.push(currentPage);
    const insurancePageHtml = insurancePages.map((groups, pageIndex) => `<section class="report-page insurance-page">
      <header class="rendition-header"><img src="${hospitalCrossUrl}" alt="Hospital"><div class="institution"><strong>HOSPITAL MUNICIPAL LUIS O. RIVERO</strong><span>Mariano Moreno 140 - Jovita - 6127 - (Cba)</span><span>Tel. (03385) - 498205 &nbsp;&nbsp; Código 04.330953</span></div><div class="report-meta"><strong>Liquidación para Profesionales por Obra Social</strong><span>Fecha de emisión: ${issuedAt}</span><span>Página ${pageIndex + 1} de ${insurancePages.length}</span><span>Período: ${formatDate(from)} al ${formatDate(to)}</span></div></header>
      ${groups.map((group) => {
        const groupTotals = group.allRows.reduce((result, item) => ({ produced: result.produced + Number(item.producido || 0), discount: result.discount + Number(item.descuento18 || 0), net: result.net + Number(item.neto82 || 0), payable: result.payable + Number(item.totalCobrar || 0) }), { produced: 0, discount: 0, net: 0, payable: 0 });
        return `<article class="insurance-block"><div class="insurance-block-title"><strong>${escapeReportHtml(group.obraSocial)}${group.continued ? " (continuación)" : ""}</strong><span>Factura N°: <b>${escapeReportHtml(group.numeroFactura)}</b></span><span>Facturado: <b>${reportMoney(group.importeFacturado)}</b></span><span>Cobrado: <b>${reportMoney(group.importeCobrado)}</b></span></div><table class="insurance-table"><thead><tr><th>Nombre Profesional</th><th>Producido</th><th>Descuento 18%</th><th>Neto 82%</th><th>% por cobrar</th><th>Total a cobrar</th></tr></thead><tbody>${group.rows.map((item) => `<tr><td>${escapeReportHtml(item.profesional)}</td><td>${reportMoney(item.producido)}</td><td>${reportMoney(item.descuento18)}</td><td>${reportMoney(item.neto82)}</td><td>${Number(item.porcentajeCobro || 0).toFixed(2)}%</td><td>${reportMoney(item.totalCobrar)}</td></tr>`).join("")}</tbody>${group.isLastFragment ? `<tfoot><tr><td>TOTAL</td><td>${reportMoney(groupTotals.produced)}</td><td>${reportMoney(groupTotals.discount)}</td><td>${reportMoney(groupTotals.net)}</td><td></td><td>${reportMoney(groupTotals.payable)}</td></tr></tfoot>` : ""}</table></article>`;
      }).join("")}</section>`).join("");
    reportWindow.document.open();
    reportWindow.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title></title><style>
      @page { size: A4 portrait; margin: 0; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #111; font: 10px Arial, Helvetica, sans-serif; background:#eee; }
      .report-page { width:210mm; min-height:297mm; margin:0 auto; padding:10mm 9mm 6mm; background:#fff; page-break-after:always; }
      .report-page:last-child { page-break-after:auto; }
      .header { display: grid; grid-template-columns: 1.15fr .85fr; gap: 24px; align-items: start; padding-bottom: 15px; }
      .hospital { display: flex; align-items: flex-start; gap: 13px; }
      .logo { width: 78px; height: 78px; object-fit: contain; }
      .hospital h1 { margin: 0 0 6px; font-size: 17px; line-height: 1.1; text-transform: uppercase; }
      .hospital p, .meta p { margin: 2px 0; }
      .meta { text-align: right; }
      .meta h2 { margin: 0 0 9px; font-size: 27px; line-height: 1.08; }
      .period { margin-top: 5px !important; }
      table { width: 100%; border-collapse: collapse; }
      thead { display: table-header-group; }
      tr { break-inside: avoid; }
      th { padding: 7px 5px; border-bottom: 1px solid #333; text-align: right; font-size: 9px; }
      th:first-child, td:first-child { text-align: left; }
      td { padding: 5px; border-bottom: 1px solid #ddd; text-align: right; white-space: nowrap; }
      td:first-child { width: 34%; white-space: normal; font-weight: 600; }
      tfoot td { padding-top: 8px; border-top: 1.5px solid #111; border-bottom: 0; font-weight: 700; }
      .footer { margin-top: 12px; text-align: right; color: #555; }
      .rendition-header { height:31mm; display:grid; grid-template-columns:26mm 1fr 70mm; align-items:center; border-bottom:1.5px solid #111; padding-bottom:3mm; margin-bottom:4mm; }
      .rendition-header img { max-width:22mm; max-height:25mm; object-fit:contain; }
      .institution { display:flex; flex-direction:column; gap:2px; font-size:9px; }
      .institution strong { font-size:13px; }
      .report-meta { display:flex; flex-direction:column; text-align:right; gap:2px; }
      .report-meta strong { font-size:14px; line-height:1.1; }
      .insurance-block { margin-bottom:4mm; break-inside:auto; }
      .insurance-block-title { break-after:avoid; }
      .insurance-table tr { break-inside:avoid; }
      .insurance-block-title { display:grid; grid-template-columns:1fr repeat(3,auto); gap:3mm 7mm; align-items:center; padding:2mm 2.5mm; border:1px solid #555; background:#f1f1f1; }
      .insurance-block-title>strong { font-size:12px; }
      .insurance-table { margin-top:0; }
      .insurance-table, .insurance-table thead, .insurance-table tbody, .insurance-table tfoot { display:block; width:100%; }
      .insurance-table tr { display:grid; grid-template-columns:minmax(0,2fr) repeat(5,minmax(0,1fr)); width:100%; break-inside:avoid; }
      .insurance-table th { background:#eee; border:1px solid #777; }
      .insurance-table th, .insurance-table td { width:auto !important; min-width:0; white-space:normal; }
      .insurance-table td { padding:1.2mm; border-bottom:1px solid #ddd; }
      .insurance-table tfoot td { border-top:1px solid #333; }
      @media print { body { background:#fff; } .report-page { margin:0; } }
    </style></head><body>
      <section class="report-page"><header class="header"><div class="hospital"><img class="logo" src="${hospitalCrossUrl}" alt="Cruz Hospital"><div><h1>Hospital Municipal<br>Luis O. Rivero</h1><p>Mariano Moreno 140</p><p>Jovita - 6127 - (Cba)</p><p>Tel: (03385) - 498205</p><p>Código: 04.330953</p></div></div><div class="meta"><h2>Liquidación de<br>Profesionales</h2><p><strong>Emitido:</strong> ${issuedAt}</p><p>Página 1</p><p class="period">Período: ${formatDate(from)} al ${formatDate(to)}</p></div></header>
      <table><thead><tr><th>Nombre Profesional</th><th>Producido</th><th>Descuento 18%</th><th>Neto 82%</th><th>% por cobrar</th><th>Total a cobrar</th></tr></thead><tbody>${reportRows}</tbody><tfoot><tr><td>TOTAL</td><td>${reportMoney(totals.produced)}</td><td>${reportMoney(totals.discount)}</td><td>${reportMoney(totals.net)}</td><td></td><td>${reportMoney(totals.payable)}</td></tr></tfoot></table>
      <p class="footer">Profesionales incluidos: ${rows.length}</p></section>${insurancePageHtml}<script>window.addEventListener('afterprint',()=>window.frameElement?.remove());window.addEventListener('load',()=>setTimeout(()=>{window.focus();window.print()},250));<\/script>
    </body></html>`);
    reportWindow.document.close();
  };

  return <section className="space-y-5">
    <div><h2 className="text-2xl font-bold text-slate-800">Liquidación Profesionales</h2></div>
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-[180px_180px_auto] sm:items-end">
        <label className="text-sm font-semibold text-slate-600">Desde<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-hospital-500" /></label>
        <label className="text-sm font-semibold text-slate-600">Hasta<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-hospital-500" /></label>
        <button onClick={search} disabled={loading} className="flex w-fit items-center gap-2 rounded-xl bg-hospital-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50"><Search size={18} />{loading ? "Buscando..." : "Buscar"}</button>
      </div>
    </div>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>{["Detalle", "Cod.", "Profesional", "Monto producido", "Desc. 18%", "82%", "% cobro", "Total a cobrar"].map((x) => <th key={x} className="px-4 py-3">{x}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100">{visibleRows.map((row) => <tr key={row.id} className="hover:bg-slate-50"><td className="px-4 py-3"><button onClick={() => showDetail(row)} className="rounded-lg p-2 text-hospital-700 hover:bg-hospital-50"><Eye size={18} /></button></td><td className="px-4 py-3 font-semibold">{row.id}</td><td className="px-4 py-3 font-semibold text-slate-700">{row.profesional}</td><td className="px-4 py-3 text-right">{money(row.producido)}</td><td className="px-4 py-3 text-right text-red-600">{money(row.descuento18)}</td><td className="px-4 py-3 text-right">{money(row.neto82)}</td><td className="px-4 py-3 text-center font-semibold">{Number(row.porcentajeCobro || 0).toFixed(2)}%</td><td className="px-4 py-3 text-right font-bold text-slate-800">{money(row.totalCobrar)}</td></tr>)}{!loading && !rows.length && <tr><td colSpan="8" className="py-16 text-center text-slate-400">Seleccioná el período a liquidar.</td></tr>}</tbody></table></div>
      {!!rows.length && <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-500">Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, rows.length)} de {rows.length}</p><div className="flex items-center gap-2"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Anterior</button><span className="text-sm font-semibold">Página {page} de {totalPages}</span><button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Siguiente</button></div></div>}
    </div>
    <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Monto total producido</p><p className="mt-2 text-xl font-bold">{money(totalProduced)}</p></div><div className="rounded-2xl border border-hospital-200 bg-hospital-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Total a pagar</p><p className="mt-2 text-xl font-bold">{money(totalToPay)}</p></div></div>
    <div className="flex justify-end gap-3 rounded-2xl border bg-white p-4"><button onClick={printProfessionalReport} disabled={!rows.length} className="rounded-xl bg-hospital-600 px-4 py-2.5 font-semibold text-white disabled:opacity-40">Imprimir liquidación</button><button onClick={onClose} className="rounded-xl border px-4 py-2.5 font-semibold">Cerrar</button></div>
    {detail && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4"><div className="flex max-h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b p-5"><div><p className="text-xs font-bold uppercase text-hospital-600">Detalle producido</p><h3 className="text-xl font-bold">{detail.professional.profesional}</h3><p className="text-sm text-slate-500">Período {formatDate(from)} al {formatDate(to)}</p></div><button onClick={() => setDetail(null)} className="p-2 text-slate-400"><X /></button></div><div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3"><button onClick={() => setDetailMode("practices")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${detailMode === "practices" ? "bg-hospital-600 text-white" : "bg-slate-100 text-slate-600"}`}>Por práctica</button><button onClick={() => setDetailMode("insurance")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${detailMode === "insurance" ? "bg-hospital-600 text-white" : "bg-slate-100 text-slate-600"}`}>Por obra social</button>{detailMode === "practices" && <select value={detailInsuranceFilter} onChange={(event) => setDetailInsuranceFilter(event.target.value)} className="ml-auto min-w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-hospital-500"><option value="Todas">Todas las obras sociales</option>{detailInsuranceOptions.map((insurance) => <option key={insurance} value={insurance}>{insurance}</option>)}</select>}</div><div className="overflow-auto p-5">{detailLoading ? <p className="py-16 text-center text-slate-400">Cargando detalle...</p> : detailMode === "practices" ? <table className="w-full min-w-[850px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>{["Cabo", "Fecha cobro", "Obra social", "Factura", "Código", "Práctica", "Cantidad", "Importe", "Débito"].map(x => <th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody className="divide-y">{filteredPracticeDetail.map((item, i) => <tr key={i}><td className="px-3 py-3 font-semibold">{item.numeroCabo}</td><td className="px-3 py-3">{formatDate(item.fechaCobro)}</td><td className="px-3 py-3">{item.obraSocial}</td><td className="px-3 py-3">{item.numeroFactura}</td><td className="px-3 py-3">{item.codigo}</td><td className="px-3 py-3">{item.practica}</td><td className="px-3 py-3">{item.cantidad}</td><td className="px-3 py-3 text-right">{money(item.importe)}</td><td className="px-3 py-3 text-right">{money(item.debito)}</td></tr>)}{!filteredPracticeDetail.length && <tr><td colSpan="9" className="py-12 text-center text-slate-400">No hay prácticas para la obra social seleccionada.</td></tr>}</tbody></table> : <table className="w-full min-w-[680px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Obra social</th><th className="px-4 py-3 text-center">Cabos</th><th className="px-4 py-3 text-center">Facturas</th><th className="px-4 py-3 text-right">Producido</th><th className="px-4 py-3 text-right">Débitos</th><th className="px-4 py-3 text-right">Neto</th></tr></thead><tbody className="divide-y">{groupedDetail.map((group) => <tr key={group.obraSocial}><td className="px-4 py-3 font-semibold text-slate-700">{group.obraSocial}</td><td className="px-4 py-3 text-center">{group.cabos}</td><td className="px-4 py-3 text-center">{group.facturas}</td><td className="px-4 py-3 text-right">{money(group.producido)}</td><td className="px-4 py-3 text-right text-red-600">{money(group.debitos)}</td><td className="px-4 py-3 text-right font-bold">{money(group.producido - group.debitos)}</td></tr>)}</tbody></table>}</div><div className="flex justify-end border-t p-4"><button onClick={() => setDetail(null)} className="rounded-xl bg-slate-800 px-4 py-2.5 font-semibold text-white">Cerrar</button></div></div></div>}
  </section>;
}

function PersonnelLiquidation({ onClose, onNotice }) {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(`${today.slice(0, 8)}01`);
  const [to, setTo] = useState(today);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const money = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(value || 0));
  const formatDate = (value) => value ? value.slice(0, 10).split("-").reverse().join("/") : "—";
  const summary = rows[0] || {};
  const search = async () => {
    if (!from || !to || from > to) return onNotice("Seleccioná un período válido.");
    setLoading(true);
    try { setRows(await loadPersonnelLiquidation(from, to)); }
    catch (error) { onNotice(`No se pudo obtener la liquidación: ${error.message}`); }
    finally { setLoading(false); }
  };
  const showDetail = async (person) => {
    setDetail({ person, rows: null }); setDetailLoading(true);
    try { setDetail({ person, rows: await loadPersonnelLiquidationDetail(from, to) }); }
    catch (error) { setDetail(null); onNotice(`No se pudo cargar el detalle: ${error.message}`); }
    finally { setDetailLoading(false); }
  };
  const printReport = () => {
    if (!rows.length) return;
    const printFrame = document.createElement("iframe");
    printFrame.setAttribute("aria-hidden", "true");
    printFrame.style.position = "fixed";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    printFrame.style.visibility = "hidden";
    document.body.appendChild(printFrame);
    const reportWindow = printFrame.contentWindow;
    if (!reportWindow) {
      printFrame.remove();
      onNotice("El navegador bloqueó la ventana de impresión.");
      return;
    }
    const issuedAt = new Intl.DateTimeFormat("es-AR").format(new Date());
    const reportMoney = (value) => new Intl.NumberFormat("es-AR", {
      style: "currency", currency: "ARS", minimumFractionDigits: 2,
    }).format(Number(value || 0));
    const personnelRows = rows.map((item) => `
      <tr><td>${item.personal}</td><td>${reportMoney(item.totalCobrar)}</td></tr>
    `).join("");
    reportWindow.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title></title><style>
      @page { size: A4 portrait; margin: 0; }
      * { box-sizing: border-box; }
      body { margin: 0; padding: 14mm 14mm 12mm; color: #111; font-family: Arial, Helvetica, sans-serif; font-size: 12px; }
      .header { display: grid; grid-template-columns: 1.15fr .85fr; gap: 30px; align-items: start; padding-bottom: 16px; }
      .hospital { display: flex; align-items: flex-start; gap: 14px; }
      .hospital-logo { width: 82px; height: 82px; flex: 0 0 auto; object-fit: contain; }
      .hospital h1 { margin: 0 0 7px; font-size: 18px; line-height: 1.1; text-transform: uppercase; }
      .hospital p, .report-meta p { margin: 2px 0; }
      .report-meta { text-align: right; }
      .report-meta h2 { margin: 0 0 10px; font-size: 28px; line-height: 1.1; }
      .summary { width: 100%; margin: 10px 0 18px; border-collapse: collapse; }
      .summary th { border-bottom: 1px solid #444; padding: 7px 10px; text-align: right; font-size: 11px; }
      .summary th:first-child, .summary td:first-child { text-align: left; }
      .summary td { padding: 7px 10px; text-align: right; font-weight: 700; }
      .autogestion { display: flex; justify-content: space-between; gap: 20px; margin: 5px 0 12px; padding-bottom: 7px; border-bottom: 1px solid #444; font-weight: 700; }
      .personnel { width: 100%; border-collapse: collapse; }
      .personnel thead { display: table-header-group; }
      .personnel th { padding: 7px 0; border-bottom: 1px solid #444; text-align: left; }
      .personnel th:last-child { text-align: right; }
      .personnel td { padding: 6px 0; border-bottom: 1px solid #ddd; }
      .personnel td:last-child { text-align: right; font-weight: 700; }
      .period { margin-top: 5px; color: #333; }
      .footer { margin-top: 16px; text-align: right; font-size: 10px; color: #555; }
      @media print { html, body { width: 210mm; min-height: 297mm; } .no-print { display: none; } }
    </style></head><body>
      <header class="header">
        <div class="hospital"><img class="hospital-logo" src="${hospitalCrossUrl}" alt="Cruz Hospital"><div><h1>Hospital Municipal<br>Luis O. Rivero</h1><p>Mariano Moreno 140</p><p>Jovita - 6127 - (Cba)</p><p>Tel: (03385) - 498205</p><p>Código: 04.330953</p></div></div>
        <div class="report-meta"><h2>Liquidación de<br>Personal</h2><p><strong>Emitido:</strong> ${issuedAt}</p><p>Página 1</p><p class="period">Período: ${formatDate(from)} al ${formatDate(to)}</p></div>
      </header>
      <table class="summary"><thead><tr><th>Importe Total Cobrado a Obras Sociales</th><th>Bruto</th><th>18%</th><th>Neto</th></tr></thead><tbody><tr><td></td><td>${reportMoney(summary.brutoCobrado)}</td><td>${reportMoney(summary.fondo18)}</td><td>${reportMoney(summary.neto82)}</td></tr></tbody></table>
      <div class="autogestion"><span>Importe correspondiente por autogestión:</span><span>${reportMoney(summary.fondoPersonal10)}</span></div>
      <table class="personnel"><thead><tr><th>Personal</th><th>Correspondiente por Autogestión al Personal</th></tr></thead><tbody>${personnelRows}</tbody></table>
      <p class="footer">Total de personal: ${summary.totalPersonal || rows.length}</p>
      <script>window.addEventListener('afterprint',()=>window.frameElement?.remove());window.addEventListener('load',()=>setTimeout(()=>{window.focus();window.print()},250));<\/script>
    </body></html>`);
    reportWindow.document.close();
  };
  return <section className="space-y-5">
    <div><h2 className="text-2xl font-bold text-slate-800">Liquidación Personal</h2></div>
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="grid gap-4 sm:grid-cols-[180px_180px_auto] sm:items-end"><label className="text-sm font-semibold text-slate-600">Desde<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none" /></label><label className="text-sm font-semibold text-slate-600">Hasta<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none" /></label><button onClick={search} disabled={loading} className="flex w-fit items-center gap-2 rounded-xl bg-hospital-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50"><Search size={18} />{loading ? "Buscando..." : "Buscar"}</button></div></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><div className="rounded-2xl border bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Bruto cobrado</p><p className="mt-2 text-xl font-bold">{money(summary.brutoCobrado)}</p></div><div className="rounded-2xl border bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Descuento 18%</p><p className="mt-2 text-xl font-bold text-red-600">{money(summary.fondo18)}</p></div><div className="rounded-2xl border bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Neto 82%</p><p className="mt-2 text-xl font-bold">{money(summary.neto82)}</p></div><div className="rounded-2xl border border-hospital-200 bg-hospital-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Fondo Personal 10%</p><p className="mt-2 text-xl font-bold">{money(summary.fondoPersonal10)}</p></div><div className="rounded-2xl border bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Personal incluido</p><p className="mt-2 text-xl font-bold">{summary.totalPersonal || 0}</p></div></div>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>{["Detalle", "Cod.", "DNI", "Personal", "Bruto cobrado", "Desc. 18%", "Neto 82%", "Fondo 10%", "Total a cobrar"].map(x => <th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody className="divide-y">{rows.map(row => <tr key={row.id} className="hover:bg-slate-50"><td className="px-4 py-3"><button onClick={() => showDetail(row)} className="rounded-lg p-2 text-hospital-700 hover:bg-hospital-50"><Eye size={18} /></button></td><td className="px-4 py-3 font-semibold">{row.id}</td><td className="px-4 py-3">{row.dni || "—"}</td><td className="px-4 py-3 font-semibold text-slate-700">{row.personal}</td><td className="px-4 py-3 text-right">{money(row.brutoCobrado)}</td><td className="px-4 py-3 text-right text-red-600">{money(row.fondo18)}</td><td className="px-4 py-3 text-right">{money(row.neto82)}</td><td className="px-4 py-3 text-right">{money(row.fondoPersonal10)}</td><td className="px-4 py-3 text-right font-bold">{money(row.totalCobrar)}</td></tr>)}{!loading && !rows.length && <tr><td colSpan="9" className="py-16 text-center text-slate-400">Seleccioná el período a liquidar.</td></tr>}</tbody></table></div></div>
    <div className="flex justify-end gap-3 rounded-2xl border bg-white p-4"><button onClick={printReport} disabled={!rows.length} className="rounded-xl bg-hospital-600 px-4 py-2.5 font-semibold text-white disabled:opacity-40">Imprimir liquidación</button><button onClick={onClose} className="rounded-xl border px-4 py-2.5 font-semibold">Cerrar</button></div>
    {detail && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4"><div className="flex max-h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b p-5"><div><p className="text-xs font-bold uppercase text-hospital-600">Origen del fondo común</p><h3 className="text-xl font-bold">{detail.person.personal}</h3><p className="text-sm text-slate-500">Parte individual: {money(detail.person.totalCobrar)}</p></div><button onClick={() => setDetail(null)} className="p-2 text-slate-400"><X /></button></div><div className="overflow-auto p-5">{detailLoading ? <p className="py-16 text-center text-slate-400">Cargando detalle...</p> : <table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>{["Fecha cobro", "Obra social", "Factura", "Facturado", "Cobrado"].map(x => <th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody className="divide-y">{(detail.rows || []).map(item => <tr key={item.id}><td className="px-4 py-3">{formatDate(item.fechaCobro)}</td><td className="px-4 py-3 font-semibold">{item.obraSocial}</td><td className="px-4 py-3">{item.numeroFactura}</td><td className="px-4 py-3 text-right">{money(item.importeFacturado)}</td><td className="px-4 py-3 text-right font-bold">{money(item.importeCobrado)}</td></tr>)}</tbody></table>}</div><div className="flex justify-end border-t p-4"><button onClick={() => setDetail(null)} className="rounded-xl bg-slate-800 px-4 py-2.5 font-semibold text-white">Cerrar</button></div></div></div>}
  </section>;
}

function ClinicalHistory({ patients, initialPatient, professionals, canCreate, onNotice }) {
  const [patient, setPatient] = useState(initialPatient || null);
  const [patientPickerOpen, setPatientPickerOpen] = useState(!initialPatient);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("records");
  const [caboDetail, setCaboDetail] = useState(null);
  const [caboDetailLoading, setCaboDetailLoading] = useState(false);
  const money = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(value || 0));
  const localNow = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };
  const emptyRecord = () => ({ pacienteId: patient?.codigo || 0, profesionalId: "", turnoId: "", caboId: "", fechaAtencion: localNow(), descripcion: "", pedidosMedicos: "", laboratorio: "" });
  const [record, setRecord] = useState(emptyRecord);
  const load = async (selected = patient) => {
    if (!selected?.codigo) return;
    setLoading(true);
    try { setHistory(await loadClinicalHistory(selected.codigo)); }
    catch (error) { onNotice(`No se pudo cargar la historia clínica: ${error.message}`); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (patient?.codigo) load(patient); }, [patient?.codigo]);
  useEffect(() => {
    if (!initialPatient) return;
    setPatient(initialPatient);
    setPatientPickerOpen(false);
  }, [initialPatient]);
  const choosePatient = (selected) => {
    setPatient(selected);
    setRecord({ ...emptyRecord(), pacienteId: selected.codigo });
    setPatientPickerOpen(false);
    setCreating(false);
    setActiveTab("records");
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!record.descripcion.trim()) return onNotice("Ingresá la descripción de la atención.");
    try {
      await saveClinicalRecord({
        ...record,
        pacienteId: Number(patient.codigo),
        profesionalId: record.profesionalId ? Number(record.profesionalId) : null,
        turnoId: record.turnoId ? Number(record.turnoId) : null,
        caboId: record.caboId ? Number(record.caboId) : null,
      });
      setCreating(false);
      setRecord({ ...emptyRecord(), pacienteId: patient.codigo });
      await load(patient);
      onNotice("Registro agregado a la historia clínica.");
    } catch (error) { onNotice(`No se pudo guardar el registro clínico: ${error.message}`); }
  };
  const showCaboDetail = async (cabo) => {
    setCaboDetail({ cabo, data: null });
    setCaboDetailLoading(true);
    try { setCaboDetail({ cabo, data: await loadCaboDetails(cabo.id) }); }
    catch (error) { setCaboDetail(null); onNotice(`No se pudo cargar el detalle del Cabo: ${error.message}`); }
    finally { setCaboDetailLoading(false); }
  };
  if (!patient) return <section className="space-y-5"><div className="flex items-center justify-between"><h2 className="text-2xl font-bold text-slate-800">Historia Clínica</h2><button onClick={() => setPatientPickerOpen(true)} className="primary"><Search size={18}/> Seleccionar paciente</button></div><div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-center"><div><BookOpen className="mx-auto text-hospital-600" size={42}/><p className="mt-4 font-bold text-slate-700">Seleccioná un paciente para consultar su historia clínica</p></div></div>{patientPickerOpen && <PatientSearchModal patients={patients} onSelect={choosePatient} onClose={() => setPatientPickerOpen(false)}/>}</section>;
  const patientData = history?.patient || patient;
  return <section className="space-y-5">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><h2 className="text-2xl font-bold text-slate-800">Historia Clínica</h2><p className="mt-1 text-slate-500">{patientData.apellido}, {patientData.nombre} · DNI {patientData.dni || "—"}</p></div><div className="flex gap-3"><button onClick={() => setPatientPickerOpen(true)} className="secondary"><Search size={17}/> Cambiar paciente</button>{canCreate && <button onClick={() => { setRecord({ ...emptyRecord(), pacienteId: patient.codigo }); setCreating(true); }} className="primary"><ClipboardPlus size={18}/> Nueva atención</button>}</div></div>
    {loading ? <div className="rounded-2xl border bg-white p-16 text-center text-slate-400">Cargando historia clínica...</div> : <>
      <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Registros clínicos</p><p className="mt-2 text-2xl font-bold">{history?.records?.length || 0}</p></div><div className="rounded-2xl border bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Turnos</p><p className="mt-2 text-2xl font-bold">{history?.appointments?.length || 0}</p></div><div className="rounded-2xl border bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Cabos asociados</p><p className="mt-2 text-2xl font-bold">{history?.cabos?.length || 0}</p></div></div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 p-1.5">
          {[["records", "Evoluciones y atenciones", history?.records?.length || 0], ["appointments", "Turnos", history?.appointments?.length || 0], ["cabos", "Cabos", history?.cabos?.length || 0]].map(([id, label, count]) => <button key={id} type="button" onClick={() => setActiveTab(id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${activeTab === id ? "bg-white text-hospital-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{label}<span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === id ? "bg-hospital-100" : "bg-slate-200"}`}>{count}</span></button>)}
        </div>
        {activeTab === "records" && <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Fecha y hora</th><th className="px-4 py-3">Profesional</th><th className="px-4 py-3">Descripción</th><th className="px-4 py-3">Pedidos médicos</th><th className="px-4 py-3">Laboratorio</th><th className="px-4 py-3">Vínculos</th><th className="px-4 py-3">Registrado por</th></tr></thead><tbody className="divide-y divide-slate-100">{(history?.records || []).map((item) => <tr key={item.id} className="align-top hover:bg-slate-50"><td className="whitespace-nowrap px-4 py-3 font-semibold text-hospital-700">{String(item.fechaAtencion).replace("T", " ")}</td><td className="px-4 py-3">{item.profesional || "No especificado"}</td><td className="max-w-sm whitespace-pre-wrap px-4 py-3 text-slate-700">{item.descripcion}</td><td className="max-w-xs whitespace-pre-wrap px-4 py-3 text-slate-600">{item.pedidosMedicos || "—"}</td><td className="max-w-xs whitespace-pre-wrap px-4 py-3 text-slate-600">{item.laboratorio || "—"}</td><td className="whitespace-nowrap px-4 py-3 text-slate-500">{item.turnoId ? `Turno #${item.turnoId}` : ""}{item.turnoId && item.caboId ? " · " : ""}{item.caboId ? `Cabo #${item.caboId}` : ""}{!item.turnoId && !item.caboId ? "—" : ""}</td><td className="px-4 py-3 text-slate-500">{item.registradoPor || "Usuario"}</td></tr>)}{!history?.records?.length && <tr><td colSpan="7" className="p-14 text-center text-slate-400">Todavía no hay evoluciones registradas.</td></tr>}</tbody></table></div>}
        {activeTab === "appointments" && <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Hora</th><th className="px-4 py-3">Profesional</th><th className="px-4 py-3">Motivo</th><th className="px-4 py-3">Observaciones</th><th className="px-4 py-3">Estado</th></tr></thead><tbody className="divide-y divide-slate-100">{(history?.appointments || []).map((item) => <tr key={item.id} className="hover:bg-slate-50"><td className="whitespace-nowrap px-4 py-3 font-semibold">{formatDate(item.fecha)}</td><td className="px-4 py-3">{item.hora}</td><td className="px-4 py-3">{item.profesional || "Sin profesional"}</td><td className="px-4 py-3">{item.motivo || "—"}</td><td className="max-w-sm px-4 py-3 text-slate-500">{item.observaciones || "—"}</td><td className="px-4 py-3"><span className="rounded-full bg-hospital-50 px-3 py-1 text-xs font-semibold text-hospital-700">{item.estado}</span></td></tr>)}{!history?.appointments?.length && <tr><td colSpan="6" className="p-14 text-center text-slate-400">Sin turnos registrados.</td></tr>}</tbody></table></div>}
        {activeTab === "cabos" && <div className="overflow-x-auto"><table className="w-full min-w-[1280px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Cabo</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Atención</th><th className="px-4 py-3">Obra social</th><th className="px-4 py-3">Profesionales</th><th className="px-4 py-3">Prestaciones</th><th className="px-4 py-3">Diagnósticos</th><th className="px-4 py-3">Laboratorio</th><th className="px-4 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{(history?.cabos || []).map((item) => <tr key={item.id} className="align-top hover:bg-slate-50"><td className="whitespace-nowrap px-4 py-3 font-semibold text-hospital-700">N° {item.numero}</td><td className="whitespace-nowrap px-4 py-3">{formatDate(item.fecha)}</td><td className="px-4 py-3">{item.tipoAtencion}</td><td className="px-4 py-3">{item.obraSocial || "Sin cobertura"}</td><td className="max-w-xs px-4 py-3">{item.profesionales || "No especificado"}</td><td className="max-w-sm px-4 py-3 text-slate-600">{item.prestaciones || "—"}</td><td className="max-w-sm px-4 py-3 text-slate-600">{item.diagnosticos || "—"}</td><td className="max-w-sm px-4 py-3 text-slate-600">{item.laboratorio || "—"}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => showCaboDetail(item)} className="rounded-lg p-2 text-hospital-700 hover:bg-hospital-50" title="Ver detalle del Cabo"><Eye size={18}/></button></td></tr>)}{!history?.cabos?.length && <tr><td colSpan="9" className="p-14 text-center text-slate-400">Sin Cabos asociados.</td></tr>}</tbody></table></div>}
      </div>
    </>}
    {caboDetail && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4"><div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b p-5"><div><p className="text-xs font-bold uppercase text-hospital-600">Detalle del Cabo</p><h3 className="text-xl font-bold">Cabo N° {caboDetail.cabo.numero}</h3><p className="text-sm text-slate-500">{formatDate(caboDetail.cabo.fecha)} · {caboDetail.cabo.tipoAtencion} · {caboDetail.cabo.obraSocial || "Sin cobertura"}</p></div><button type="button" onClick={() => setCaboDetail(null)} className="p-2 text-slate-400"><X/></button></div><div className="min-h-0 flex-1 overflow-y-auto p-5">{caboDetailLoading ? <p className="py-16 text-center text-slate-400">Cargando detalle...</p> : caboDetail.data && <div className="space-y-6"><div><h4 className="mb-2 font-bold text-slate-700">Prestaciones</h4><div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[850px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Código</th><th className="px-4 py-3">Descripción</th><th className="px-4 py-3">Cantidad</th><th className="px-4 py-3">Profesional 1</th><th className="px-4 py-3">Profesional 2</th><th className="px-4 py-3 text-right">Arancel</th></tr></thead><tbody className="divide-y">{caboDetail.data.prestaciones.map((item, index) => <tr key={`${item.codigo}-${index}`}><td className="px-4 py-3 font-semibold">{item.codigo}</td><td className="px-4 py-3">{item.descripcion}</td><td className="px-4 py-3">{item.cantidad}</td><td className="px-4 py-3">{item.profesional1 || "—"}</td><td className="px-4 py-3">{item.profesional2 || "—"}</td><td className="px-4 py-3 text-right">{money(item.arancel)}</td></tr>)}{!caboDetail.data.prestaciones.length && <tr><td colSpan="6" className="p-8 text-center text-slate-400">Sin prestaciones.</td></tr>}</tbody></table></div></div><div className="grid gap-5 lg:grid-cols-3">{[["Diagnósticos", caboDetail.data.diagnosticos, (item) => `${item.codigo} · ${item.descripcion}${item.observaciones ? ` — ${item.observaciones}` : ""}`], ["Medicamentos", caboDetail.data.medicamentos, (item) => `${item.producto}${item.presentacion ? ` · ${item.presentacion}` : ""} · Cantidad ${item.cantidad}`], ["Laboratorio", caboDetail.data.laboratorio, (item) => `${item.codigo || ""} ${item.descripcion} · Cantidad ${item.cantidad} · ${money(item.monto)}`]].map(([title, items, render]) => <section key={title} className="rounded-xl border p-4"><h4 className="font-bold text-slate-700">{title}</h4><div className="mt-3 space-y-2">{items.length ? items.map((item, index) => <p key={index} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{render(item)}</p>) : <p className="text-sm text-slate-400">Sin registros.</p>}</div></section>)}</div></div>}</div><div className="flex justify-end border-t p-4"><button type="button" onClick={() => setCaboDetail(null)} className="primary">Cerrar</button></div></div></div>}
    {creating && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4"><form onSubmit={submit} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b p-5"><div><p className="text-xs font-bold uppercase text-hospital-600">Historia clínica</p><h3 className="text-xl font-bold">Nueva atención</h3></div><button type="button" onClick={() => setCreating(false)} className="p-2 text-slate-400"><X/></button></div><div className="grid gap-4 p-5 sm:grid-cols-2"><Field label="Fecha y hora" required><input type="datetime-local" value={record.fechaAtencion} onChange={(e) => setRecord({...record,fechaAtencion:e.target.value})} className="control"/></Field><Field label="Profesional"><select value={record.profesionalId} onChange={(e) => setRecord({...record,profesionalId:e.target.value})} className="control"><option value="">Sin especificar</option>{professionals.map((item) => <option key={item.codigo} value={item.codigo}>{item.apellido}, {item.nombre}</option>)}</select></Field><Field label="Turno relacionado"><select value={record.turnoId} onChange={(e) => setRecord({...record,turnoId:e.target.value})} className="control"><option value="">Sin vincular</option>{(history?.appointments || []).map((item) => <option key={item.id} value={item.id}>{formatDate(item.fecha)} {item.hora} · {item.profesional}</option>)}</select></Field><Field label="Cabo relacionado"><select value={record.caboId} onChange={(e) => setRecord({...record,caboId:e.target.value})} className="control"><option value="">Sin vincular</option>{(history?.cabos || []).map((item) => <option key={item.id} value={item.id}>Cabo {item.numero} · {formatDate(item.fecha)}</option>)}</select></Field><Field label="Descripción de la atención" required className="sm:col-span-2"><textarea rows="5" value={record.descripcion} onChange={(e) => setRecord({...record,descripcion:e.target.value})} className="control resize-y" placeholder="Evolución, evaluación y conducta..."/></Field><Field label="Pedidos médicos" className="sm:col-span-2"><textarea rows="3" value={record.pedidosMedicos} onChange={(e) => setRecord({...record,pedidosMedicos:e.target.value})} className="control resize-y"/></Field><Field label="Indicaciones de laboratorio" className="sm:col-span-2"><textarea rows="3" value={record.laboratorio} onChange={(e) => setRecord({...record,laboratorio:e.target.value})} className="control resize-y"/></Field></div><div className="flex justify-end gap-3 border-t p-4"><button type="button" onClick={() => setCreating(false)} className="secondary">Cancelar</button><button className="primary">Guardar en historia clínica</button></div></form></div>}
    {patientPickerOpen && <PatientSearchModal patients={patients} onSelect={choosePatient} onClose={() => setPatientPickerOpen(false)}/>}</section>;
}

const permissionModules = [
  ["appointments", "Turnos"], ["cabos", "CABOS"], ["cobros-os", "Cobros O. Social"],
  ["liquidacion-obra-social", "Liquidación Obra Social"], ["liquidacion-profesionales", "Liquidación Profesionales"], ["liquidacion-personal", "Liquidación Personal"],
  ["patients", "Pacientes"], ["clinical-history", "Historia Clínica"], ["professionals", "Profesionales"], ["personnel", "Personal"], ["medications", "Medicamentos"],
  ["health-insurances", "Obras sociales"], ["nomenclature", "Nomenclador"], ["users", "Usuarios y permisos"],
];
const permissionActions = [["view", "Ver"], ["create", "Crear"], ["edit", "Editar"], ["delete", "Eliminar"], ["print", "Imprimir"]];

function UserProfessionalSearchModal({ professionals, onSelect, onClear, onClose }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase();
  const matches = professionals.filter((item) =>
    `${item.apellido} ${item.nombre} ${item.dni || ""} ${item.matricula || ""}`
      .toLocaleLowerCase()
      .includes(normalized),
  );
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="professional-search-title">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b px-5 py-4 sm:px-6">
          <div><h3 id="professional-search-title" className="font-bold text-slate-800">Buscar profesional</h3><p className="mt-1 text-sm text-slate-500">Buscá por nombre, apellido, DNI o matrícula.</p></div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Cerrar"><X size={19}/></button>
        </header>
        <div className="border-b p-5 sm:px-6"><div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={19}/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} className="control pl-11" placeholder="Nombre, DNI o matrícula..."/></div></div>
        <div className="min-h-56 flex-1 overflow-y-auto p-3 sm:p-4">
          {matches.length ? matches.map((item) => <button key={item.id} type="button" onClick={() => onSelect(item)} className="w-full rounded-xl px-4 py-3 text-left hover:bg-hospital-50"><strong className="block text-slate-700">{item.apellido}, {item.nombre}</strong><span className="mt-1 block text-xs text-slate-500">{item.dni ? `DNI ${item.dni}` : "DNI no informado"}{item.matricula ? ` · Matrícula ${item.matricula}` : ""}</span></button>) : <div className="grid min-h-52 place-items-center text-center text-slate-400"><div><Search className="mx-auto" size={34}/><p className="mt-3 font-semibold">No encontramos profesionales</p></div></div>}
        </div>
        <footer className="flex flex-wrap justify-between gap-3 border-t bg-slate-50 px-5 py-4 sm:px-6"><button type="button" onClick={onClear} className="secondary">Quitar vinculación</button><button type="button" onClick={onClose} className="secondary">Cancelar</button></footer>
      </div>
    </div>
  );
}

function UsersManagement({ onNotice }) {
  const [data,setData]=useState({users:[],permissions:[],roles:[],rolePermissions:[],userRoles:[],professionals:[]});
  const [selected,setSelected]=useState(null),[selectedRole,setSelectedRole]=useState(null),[loading,setLoading]=useState(true),[professionalSearchOpen,setProfessionalSearchOpen]=useState(false);
  const refresh=()=>{setLoading(true);loadUsers().then(setData).catch((e)=>onNotice(`No se pudieron cargar los usuarios: ${e.message}`)).finally(()=>setLoading(false));};
  useEffect(refresh,[]);
  const edit=(user)=>{setProfessionalSearchOpen(false);setSelected({...user,password:"",rolIds:data.userRoles.filter((item)=>Number(item.idUsuario)===Number(user.id)).map((item)=>Number(item.idRol)),permisos:data.permissions.filter((p)=>Number(p.idUsuario)===Number(user.id)).map((p)=>({modulo:p.modulo,accion:p.accion}))});};
  const create=()=>{setProfessionalSearchOpen(false);setSelected({usuario:"",nombre:"",password:"",activo:true,administrador:false,profesionalId:"",rolIds:[],permisos:[]});};
  const togglePermission=(setter,modulo,accion)=>setter((current)=>{const exists=current.permisos.some((p)=>p.modulo===modulo&&p.accion===accion);return{...current,permisos:exists?current.permisos.filter((p)=>p.modulo!==modulo||p.accion!==accion):[...current.permisos,{modulo,accion}]};});
  const save=async()=>{if(!selected.usuario.trim()||selected.usuario.includes("@")||(!selected.id&&selected.password.length<8))return onNotice("Ingresá un usuario sin @ y una contraseña de al menos 8 caracteres.");try{await persistUser({...selected,profesionalId:selected.profesionalId?Number(selected.profesionalId):null});setSelected(null);refresh();onNotice("Usuario, profesional y roles guardados correctamente.");}catch(e){onNotice(`No se pudo guardar el usuario: ${e.message}`);}};
  const editRole=(role)=>setSelectedRole({...role,permisos:data.rolePermissions.filter((p)=>Number(p.idRol)===Number(role.id)).map((p)=>({modulo:p.modulo,accion:p.accion}))});
  const createRole=()=>setSelectedRole({nombre:"",descripcion:"",activo:true,permisos:[]});
  const saveSelectedRole=async()=>{if(!selectedRole.nombre.trim())return onNotice("Ingresá el nombre del grupo.");try{await persistRole(selectedRole);setSelectedRole(null);refresh();onNotice("Grupo de usuarios guardado correctamente.");}catch(e){onNotice(`No se pudo guardar el grupo: ${e.message}`);}};
  const PermissionMatrix=({value,setter})=><div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left">Módulo</th>{permissionActions.map(([,label])=><th key={label} className="px-3 py-3">{label}</th>)}</tr></thead><tbody>{permissionModules.map(([modulo,label])=><tr key={modulo} className="border-t"><td className="px-4 py-3 font-semibold">{label}</td>{permissionActions.map(([accion])=><td key={accion} className="text-center"><input type="checkbox" checked={value.permisos.some((p)=>p.modulo===modulo&&p.accion===accion)} onChange={()=>togglePermission(setter,modulo,accion)}/></td>)}</tr>)}</tbody></table></div>;
  if(selectedRole)return <section className="space-y-5"><div className="flex items-center justify-between"><h2 className="text-2xl font-bold">{selectedRole.id?"Modificar grupo":"Nuevo grupo"}</h2><button onClick={()=>setSelectedRole(null)} className="secondary">Volver</button></div><div className="grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2"><Field label="Nombre del grupo"><input value={selectedRole.nombre} onChange={(e)=>setSelectedRole({...selectedRole,nombre:e.target.value})} className="control"/></Field><Field label="Descripción"><input value={selectedRole.descripcion||""} onChange={(e)=>setSelectedRole({...selectedRole,descripcion:e.target.value})} className="control"/></Field><label className="flex items-center gap-2"><input type="checkbox" checked={selectedRole.activo} onChange={(e)=>setSelectedRole({...selectedRole,activo:e.target.checked})}/> Grupo activo</label></div><PermissionMatrix value={selectedRole} setter={setSelectedRole}/><div className="flex justify-end"><button onClick={saveSelectedRole} className="primary">Guardar grupo</button></div></section>;
  if(selected) {
    const linkedProfessional=data.professionals.find((item)=>Number(item.id)===Number(selected.profesionalId));
    return <section className="space-y-5">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">{selected.id?"Modificar usuario":"Nuevo usuario"}</h2><button onClick={()=>setSelected(null)} className="secondary">Volver</button></div>
      <div className="grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2">
        <Field label="Nombre de usuario"><input value={selected.usuario} onChange={(e)=>setSelected({...selected,usuario:e.target.value.replace(/\s/g,"")})} className="control"/></Field>
        <Field label="Nombre y apellido"><input value={selected.nombre} onChange={(e)=>setSelected({...selected,nombre:e.target.value})} className="control"/></Field>
        <Field label={selected.id?"Nueva contraseña (opcional)":"Contraseña"}><input type="password" value={selected.password} onChange={(e)=>setSelected({...selected,password:e.target.value})} className="control"/></Field>
        <Field label="Profesional vinculado"><div className="flex gap-2"><input readOnly value={linkedProfessional?`${linkedProfessional.apellido}, ${linkedProfessional.nombre}${linkedProfessional.matricula?` · Mat. ${linkedProfessional.matricula}`:""}`:""} placeholder="Sin profesional vinculado" className="control bg-slate-50"/><button type="button" onClick={()=>setProfessionalSearchOpen(true)} className="icon-button" title="Buscar profesional" aria-label="Buscar profesional"><Search size={19}/></button></div></Field>
        <div className="flex items-center gap-6"><label className="flex gap-2"><input type="checkbox" checked={selected.activo} onChange={(e)=>setSelected({...selected,activo:e.target.checked})}/> Activo</label><label className="flex gap-2"><input type="checkbox" checked={selected.administrador} onChange={(e)=>setSelected({...selected,administrador:e.target.checked})}/> Administrador</label></div>
      </div>
      <div className="rounded-2xl border bg-white p-5"><h3 className="font-bold text-slate-800">Grupos asignados</h3><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.roles.map((role)=><label key={role.id} className="flex gap-3 rounded-xl border p-3"><input type="checkbox" checked={selected.rolIds.includes(Number(role.id))} onChange={()=>setSelected((current)=>({...current,rolIds:current.rolIds.includes(Number(role.id))?current.rolIds.filter((id)=>id!==Number(role.id)):[...current.rolIds,Number(role.id)]}))}/><span><strong className="block">{role.nombre}</strong><small className="text-slate-500">{role.descripcion}</small></span></label>)}</div></div>
      {selected.administrador&&<div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">El administrador tiene acceso total. Los grupos y permisos quedan guardados si luego cambia a usuario común.</div>}
      <div><h3 className="mb-3 font-bold text-slate-800">Permisos individuales adicionales</h3><PermissionMatrix value={selected} setter={setSelected}/></div>
      <div className="flex justify-end"><button onClick={save} className="primary">Guardar usuario</button></div>
      {professionalSearchOpen&&<UserProfessionalSearchModal professionals={data.professionals} onSelect={(professional)=>{setSelected((current)=>({...current,profesionalId:professional.id}));setProfessionalSearchOpen(false);}} onClear={()=>{setSelected((current)=>({...current,profesionalId:""}));setProfessionalSearchOpen(false);}} onClose={()=>setProfessionalSearchOpen(false)}/>} 
    </section>;
  }
  return <section className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold">Usuarios y permisos</h2><div className="flex gap-3"><button onClick={createRole} className="secondary"><UsersRound size={18}/> Nuevo grupo</button><button onClick={create} className="primary"><Plus size={18}/> Nuevo usuario</button></div></div><div className="grid gap-5 xl:grid-cols-[1fr_340px]"><div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50"><tr><th className="px-5 py-3 text-left">Usuario</th><th className="px-5 py-3 text-left">Nombre</th><th className="px-5 py-3 text-left">Profesional</th><th className="px-5 py-3">Grupos</th><th></th></tr></thead><tbody>{data.users.map((user)=>{const professional=data.professionals.find((item)=>Number(item.id)===Number(user.profesionalId));const roleNames=data.userRoles.filter((item)=>Number(item.idUsuario)===Number(user.id)).map((item)=>data.roles.find((role)=>Number(role.id)===Number(item.idRol))?.nombre).filter(Boolean);return <tr key={user.id} className="border-t"><td className="px-5 py-4 font-bold">{user.usuario}</td><td className="px-5 py-4">{user.nombre}</td><td className="px-5 py-4">{professional?`${professional.apellido}, ${professional.nombre}`:"—"}</td><td className="px-5 py-4 text-center">{user.administrador?"Administrador":roleNames.join(", ")||"Sin grupo"}</td><td className="px-5 py-4 text-right"><button onClick={()=>edit(user)} className="font-semibold text-hospital-700">Editar</button></td></tr>})}{!loading&&!data.users.length&&<tr><td colSpan="5" className="p-10 text-center text-slate-400">Sin usuarios.</td></tr>}</tbody></table></div><aside className="rounded-2xl border bg-white p-5"><div className="flex items-center justify-between"><h3 className="font-bold">Grupos</h3><button onClick={createRole} className="text-sm font-semibold text-hospital-700">Agregar</button></div><div className="mt-4 space-y-2">{data.roles.map((role)=><button key={role.id} onClick={()=>editRole(role)} className="w-full rounded-xl border p-3 text-left hover:bg-slate-50"><strong className="block">{role.nombre}</strong><span className="text-xs text-slate-500">{role.descripcion||"Sin descripción"}</span></button>)}</div></aside></div></section>;
}

function Dashboard({ onLogout, currentUser }) {
  const can = (target, action = "view") => Boolean(currentUser?.administrador) || (currentUser?.permissions || []).some((permission) => permission.modulo === target && permission.accion === action);
  const initialModule = permissionModules.find(([id]) => can(id))?.[0] || "patients";
  const [collapsed, setCollapsed] = useState(false),
    [mobileOpen, setMobileOpen] = useState(false),
    [liquidacionesOpen, setLiquidacionesOpen] = useState(false),
    [module, setModule] = useState(initialModule),
    [view, setView] = useState("list"),
    [patients, setPatients] = useState([]),
    [professionals, setProfessionals] = useState([]),
    [personnel, setPersonnel] = useState([]),
    [medications, setMedications] = useState([]),
    [healthInsurances, setHealthInsurances] = useState([]),
    [nomenclatures, setNomenclatures] = useState([]),
    [cieCodes, setCieCodes] = useState([]),
    [laboratoryCodes, setLaboratoryCodes] = useState([]),
    [cabos, setCabos] = useState([]),
    [hasMoreCabos, setHasMoreCabos] = useState(false),
    [loadingOlderCabos, setLoadingOlderCabos] = useState(false),
    [cobrosOS, setCobrosOS] = useState([]),
    [selectedPatient, setSelectedPatient] = useState(null),
    [selectedProfessional, setSelectedProfessional] = useState(null),
    [selectedPersonnel, setSelectedPersonnel] = useState(null),
    [selectedMedication, setSelectedMedication] = useState(null),
    [selectedHealthInsurance, setSelectedHealthInsurance] = useState(null),
    [selectedCabo, setSelectedCabo] = useState(null),
    [selectedCobroOS, setSelectedCobroOS] = useState(null),
    [helpOpen, setHelpOpen] = useState(false),
    [initialLoading, setInitialLoading] = useState(true),
    [initialLoadError, setInitialLoadError] = useState(""),
    [initialLoadAttempt, setInitialLoadAttempt] = useState(0),
    [notice, setNotice] = useState("");
  const [specialties, setSpecialties] = useState(defaultSpecialties),
    [areas, setAreas] = useState(defaultAreas),
    [locations, setLocations] = useState([]);
  const [appointments, setAppointments] = useState([]),
    [availability, setAvailability] = useState([]);
  useEffect(() => {
    let active = true;
    let retryTimer;
    setInitialLoading(true);
    setInitialLoadError("");
    loadHospitalData()
      .then((data) => {
        if (!active) return;
        setPatients(data.patients.map(normalizePatient));
        setProfessionals(data.professionals);
        setPersonnel(data.personnel);
        setMedications(data.medications);
        setHealthInsurances(data.healthInsurances);
        setNomenclatures(data.nomenclatures);
        setCieCodes(data.cieCodes);
        setLaboratoryCodes(data.laboratoryCodes);
        setSpecialties(data.specialties.map((item) => item.descripcion));
        setAreas(data.areas.map((item) => item.descripcion));
        setLocations(data.locations || []);
        const initialCabos = data.cabos || [];
        setCabos(
          initialCabos.map((item) => ({
            ...item,
            edad: item.edad ?? "",
            prestaciones: [],
            diagnosticos: [],
            medicamentos: [],
            laboratorio: [],
          })),
        );
        setHasMoreCabos(initialCabos.length >= 500);
        const debitsByCobro = (data.cobroDebits || []).reduce((groups, debit) => {
          const key = String(debit.cobroId);
          (groups[key] ||= []).push({ ...debit, key: `DEBIT-${debit.id}` });
          return groups;
        }, {});
        setCobrosOS((data.cobrosOS || []).map((record) => ({
          ...record,
          debitos: debitsByCobro[String(record.id)] || [],
        })));
        setAppointments((data.appointments || []).map(normalizeAppointment));
        setAvailability((data.availability || []).map(normalizeAvailability));
        setInitialLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        setInitialLoading(false);
        setInitialLoadError(`No se pudo conectar con la base de datos. ${error.message}`);
        retryTimer = window.setTimeout(
          () => setInitialLoadAttempt((attempt) => attempt + 1),
          5000,
        );
      });
    return () => {
      active = false;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [initialLoadAttempt]);
  const goTo = (next) => {
    if (!can(next)) { setNotice("No tenés permiso para acceder a este módulo."); return; }
    setModule(next);
    setView("list");
    setSelectedPatient(null);
    setSelectedProfessional(null);
    setSelectedPersonnel(null);
    setSelectedMedication(null);
    setSelectedHealthInsurance(null);
    setSelectedCabo(null);
    setSelectedCobroOS(null);
    setMobileOpen(false);
  };
  const Sidebar = () => (
    <aside
      className={`${collapsed ? "w-[88px]" : "w-72"} flex h-full flex-col border-r border-slate-200 bg-white transition-[width] duration-300`}
    >
      <div className={`flex h-24 shrink-0 items-center border-b border-hospital-900/15 bg-hospital-700 ${collapsed ? "justify-center px-3" : "px-4"}`}>
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          className={`rounded-xl text-left transition-colors hover:bg-white/10 ${collapsed ? "p-1" : "w-full p-1.5"}`}
          title={collapsed ? "Expandir menú" : "Contraer menú"}
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
        >
          <Brand compact={collapsed} sidebar />
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3 text-sm">
        {!collapsed && (
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-slate-400">
            Gestión
          </p>
        )}
        <button
          onClick={() => goTo("appointments")}
          hidden={!can("appointments")}
          className={`flex w-full items-center rounded-xl py-2.5 ${module === "appointments" ? "bg-hospital-50 text-hospital-700" : "text-slate-500 hover:bg-slate-50"} ${collapsed ? "justify-center" : "gap-3 px-3"}`}
        >
          <CalendarDays size={21} />
          {!collapsed && <span className="font-semibold">Turnos</span>}
        </button>
        <button
          onClick={() => goTo("cabos")}
          hidden={!can("cabos")}
          className={`flex w-full items-center rounded-xl py-2.5 ${module === "cabos" ? "bg-hospital-50 text-hospital-700" : "text-slate-500 hover:bg-slate-50"} ${collapsed ? "justify-center" : "gap-3 px-3"}`}
        >
          <ClipboardPlus size={21} />
          {!collapsed && <span className="font-semibold">Cabos</span>}
        </button>
        <button
          onClick={() => goTo("cobros-os")}
          hidden={!can("cobros-os")}
          className={`flex w-full items-center rounded-xl py-2.5 ${module === "cobros-os" ? "bg-hospital-50 text-hospital-700" : "text-slate-500 hover:bg-slate-50"} ${collapsed ? "justify-center" : "gap-3 px-3"}`}
        >
          <BadgeDollarSign size={21} />
          {!collapsed && (
            <span className="font-semibold">Cobros O. Social</span>
          )}
        </button>
        <div>
          <button
            onClick={() => {
              if (collapsed) setCollapsed(false);
              setLiquidacionesOpen((current) => !current);
            }}
            className={`flex w-full items-center rounded-xl py-2.5 ${module.startsWith("liquidacion-") ? "bg-hospital-50 text-hospital-700" : "text-slate-500 hover:bg-slate-50"} ${collapsed ? "justify-center" : "gap-3 px-3"}`}
            aria-expanded={liquidacionesOpen}
            hidden={!permissionModules.filter(([id]) => id.startsWith("liquidacion-")).some(([id]) => can(id))}
          >
            <ReceiptText size={21} />
            {!collapsed && (
              <>
                <span className="flex-1 text-left font-semibold">Liquidaciones</span>
                <ChevronDown
                  size={17}
                  className={`transition-transform ${liquidacionesOpen ? "rotate-180" : ""}`}
                />
              </>
            )}
          </button>
          {!collapsed && liquidacionesOpen && (
            <div className="ml-5 mt-1 space-y-1 border-l border-slate-200 pl-3">
              {[
                ["liquidacion-obra-social", "Liquidación Obra Social"],
                ["liquidacion-profesionales", "Liquidación Profesionales"],
                ["liquidacion-personal", "Liquidación Personal"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  hidden={!can(id)}
                  onClick={() => goTo(id)}
                  className={`w-full whitespace-nowrap rounded-lg px-3 py-1.5 text-left text-xs font-medium ${module === id ? "bg-hospital-50 text-hospital-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => goTo("patients")}
          hidden={!can("patients")}
          className={`flex w-full items-center rounded-xl py-2.5 ${module === "patients" ? "bg-hospital-50 text-hospital-700" : "text-slate-500 hover:bg-slate-50"} ${collapsed ? "justify-center" : "gap-3 px-3"}`}
        >
          <UsersRound size={21} />
          {!collapsed && <span className="font-semibold">Pacientes</span>}
        </button>
        <button
          onClick={() => goTo("clinical-history")}
          hidden={!can("clinical-history")}
          className={`flex w-full items-center rounded-xl py-2.5 ${module === "clinical-history" ? "bg-hospital-50 text-hospital-700" : "text-slate-500 hover:bg-slate-50"} ${collapsed ? "justify-center" : "gap-3 px-3"}`}
        >
          <BookOpen size={21} />
          {!collapsed && <span className="font-semibold">Historia Clínica</span>}
        </button>
        <button
          onClick={() => goTo("professionals")}
          hidden={!can("professionals")}
          className={`flex w-full items-center rounded-xl py-2.5 ${module === "professionals" ? "bg-hospital-50 text-hospital-700" : "text-slate-500 hover:bg-slate-50"} ${collapsed ? "justify-center" : "gap-3 px-3"}`}
        >
          <BriefcaseMedical size={21} />
          {!collapsed && <span className="font-semibold">Profesionales</span>}
        </button>
        <button
          onClick={() => goTo("personnel")}
          hidden={!can("personnel")}
          className={`flex w-full items-center rounded-xl py-2.5 ${module === "personnel" ? "bg-hospital-50 text-hospital-700" : "text-slate-500 hover:bg-slate-50"} ${collapsed ? "justify-center" : "gap-3 px-3"}`}
        >
          <UserCog size={21} />
          {!collapsed && <span className="font-semibold">Personal</span>}
        </button>
        <button
          onClick={() => goTo("medications")}
          hidden={!can("medications")}
          className={`flex w-full items-center rounded-xl py-2.5 ${module === "medications" ? "bg-hospital-50 text-hospital-700" : "text-slate-500 hover:bg-slate-50"} ${collapsed ? "justify-center" : "gap-3 px-3"}`}
        >
          <Pill size={21} />
          {!collapsed && <span className="font-semibold">Medicamentos</span>}
        </button>
        <button
          onClick={() => goTo("health-insurances")}
          hidden={!can("health-insurances")}
          className={`flex w-full items-center rounded-xl py-2.5 ${module === "health-insurances" ? "bg-hospital-50 text-hospital-700" : "text-slate-500 hover:bg-slate-50"} ${collapsed ? "justify-center" : "gap-3 px-3"}`}
        >
          <Building2 size={21} />
          {!collapsed && <span className="font-semibold">Obras sociales</span>}
        </button>
        <button
          onClick={() => goTo("nomenclature")}
          hidden={!can("nomenclature")}
          className={`flex w-full items-center rounded-xl py-2.5 ${module === "nomenclature" ? "bg-hospital-50 text-hospital-700" : "text-slate-500 hover:bg-slate-50"} ${collapsed ? "justify-center" : "gap-3 px-3"}`}
        >
          <BookOpen size={21} />
          {!collapsed && <span className="font-semibold">Nomenclador</span>}
        </button>
        {can("users") && <button
          onClick={() => goTo("users")}
          className={`flex w-full items-center rounded-xl py-2.5 ${module === "users" ? "bg-hospital-50 text-hospital-700" : "text-slate-500 hover:bg-slate-50"} ${collapsed ? "justify-center" : "gap-3 px-3"}`}
        >
          <ShieldCheck size={21} />
          {!collapsed && <span className="font-semibold">Usuarios y permisos</span>}
        </button>}
      </nav>
      <div className="border-t border-hospital-900/15 bg-hospital-700 p-3">
        <button
          onClick={onLogout}
          className={`flex w-full items-center rounded-xl py-2.5 text-sm text-cyan-50 hover:bg-red-500/20 hover:text-white ${collapsed ? "justify-center" : "gap-3 px-3"}`}
        >
          <LogOut size={20} />
          {!collapsed && <span className="font-semibold">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
  const saved = (p) => {
    setPatients((current) =>
      current.some((x) => x.codigo === p.codigo)
        ? current.map((x) => (x.codigo === p.codigo ? p : x))
        : [p, ...current],
    );
    setView("list");
    setSelectedPatient(null);
    setNotice(`Paciente ${p.nombre} ${p.apellido} guardado correctamente.`);
    setTimeout(() => setNotice(""), 4000);
  };
  const deletePatient = async (p) => {
    if (!window.confirm(`¿Borrar a ${p.nombre} ${p.apellido}?`)) return;
    try { await removePatient(p.codigo); }
    catch (error) { setNotice(`No se pudo borrar el paciente: ${error.message}`); return; }
    setPatients((current) => current.filter((x) => x.codigo !== p.codigo));
    setNotice("Paciente eliminado correctamente.");
    setTimeout(() => setNotice(""), 4000);
  };
  const patientContent =
    view === "list" ? (
      <PatientList
        patients={patients}
        canCreate={can("patients", "create")}
        canEdit={can("patients", "edit")}
        canDelete={can("patients", "delete")}
        onNew={() => {
          setSelectedPatient(null);
          setView("form");
        }}
        onView={(p) => {
          setSelectedPatient(p);
          setView("detail");
        }}
        onEdit={(p) => {
          setSelectedPatient(p);
          setView("form");
        }}
        onDelete={deletePatient}
        onHistory={can("clinical-history") ? (p) => {
          setSelectedPatient(p);
          setModule("clinical-history");
          setView("list");
        } : null}
      />
    ) : (
      <PatientForm
        initial={selectedPatient || emptyPatient}
        readOnly={view === "detail"}
        healthInsurances={healthInsurances}
        locations={locations}
        onCancel={() => {
          setView("list");
          setSelectedPatient(null);
        }}
        onSaved={async (item) => {
          try { saved(normalizePatient(await persistPatient(item))); }
          catch (error) { setNotice(`No se pudo guardar el paciente: ${error.message}`); }
        }}
      />
    );
  const savedProfessional = (p) => {
    setProfessionals((current) =>
      current.some((x) => x.codigo === p.codigo)
        ? current.map((x) => (x.codigo === p.codigo ? p : x))
        : [p, ...current],
    );
    setView("list");
    setSelectedProfessional(null);
    setNotice(`Profesional ${p.nombre} ${p.apellido} guardado correctamente.`);
    setTimeout(() => setNotice(""), 4000);
  };
  const deleteProfessional = async (p) => {
    if (!window.confirm(`¿Borrar a ${p.nombre} ${p.apellido}?`)) return;
    try { await removeProfessional(p.codigo); }
    catch (error) { setNotice(`No se pudo borrar el profesional: ${error.message}`); return; }
    setProfessionals((current) => current.filter((x) => x.codigo !== p.codigo));
    setNotice("Profesional eliminado correctamente.");
    setTimeout(() => setNotice(""), 4000);
  };
  const professionalContent =
    view === "list" ? (
      <ProfessionalList
        professionals={professionals}
        onNew={() => {
          setSelectedProfessional(null);
          setView("form");
        }}
        onView={(p) => {
          setSelectedProfessional(p);
          setView("detail");
        }}
        onEdit={(p) => {
          setSelectedProfessional(p);
          setView("form");
        }}
        onDelete={deleteProfessional}
      />
    ) : (
      <ProfessionalForm
        initial={selectedProfessional || emptyProfessional}
        readOnly={view === "detail"}
        specialties={specialties}
        locations={locations}
        onAddSpecialty={(value) =>
          setSpecialties((current) => [...current, value])
        }
        onCancel={() => {
          setView("list");
          setSelectedProfessional(null);
        }}
        onSaved={async (item) => {
          try { savedProfessional(await persistProfessional(item)); }
          catch (error) { setNotice(`No se pudo guardar el profesional: ${error.message}`); }
        }}
      />
    );
  const savedPersonnel = (p) => {
    setPersonnel((current) =>
      current.some((x) => x.codigo === p.codigo)
        ? current.map((x) => (x.codigo === p.codigo ? p : x))
        : [p, ...current],
    );
    setView("list");
    setSelectedPersonnel(null);
    setNotice(`Personal ${p.nombre} ${p.apellido} guardado correctamente.`);
    setTimeout(() => setNotice(""), 4000);
  };
  const deletePersonnel = async (p) => {
    if (!window.confirm(`¿Borrar a ${p.nombre} ${p.apellido}?`)) return;
    try { await removePersonnel(p.codigo); }
    catch (error) { setNotice(`No se pudo borrar el personal: ${error.message}`); return; }
    setPersonnel((current) => current.filter((x) => x.codigo !== p.codigo));
    setNotice("Personal eliminado correctamente.");
    setTimeout(() => setNotice(""), 4000);
  };
  const rawPersonnelContent =
    view === "list" ? (
      <PersonnelList
        personnel={personnel}
        onNew={() => {
          setSelectedPersonnel(null);
          setView("form");
        }}
        onView={(p) => {
          setSelectedPersonnel(p);
          setView("detail");
        }}
        onEdit={(p) => {
          setSelectedPersonnel(p);
          setView("form");
        }}
        onDelete={deletePersonnel}
      />
    ) : (
      <PersonnelForm
        initial={selectedPersonnel || emptyPersonnel}
        readOnly={view === "detail"}
        areas={areas}
        locations={locations}
        onAddArea={(value) => setAreas((current) => [...current, value])}
        onCancel={() => {
          setView("list");
          setSelectedPersonnel(null);
        }}
        onSaved={async (item) => {
          try { savedPersonnel(await persistPersonnel(item)); }
          catch (error) { setNotice(`No se pudo guardar el personal: ${error.message}`); }
        }}
      />
    );
  const savedMedication = async (medication) => {
    try {
      const saved = await persistMedication(medication);
      setMedications((current) =>
        current.some((x) => x.id === saved.id)
          ? current.map((x) => (x.id === saved.id ? saved : x))
          : [saved, ...current],
      );
      setView("list");
      setSelectedMedication(null);
      setNotice(`Medicamento ${saved.producto} guardado correctamente.`);
    } catch (error) {
      setNotice(`No se pudo guardar: ${error.message}`);
    }
    setTimeout(() => setNotice(""), 4000);
  };
  const deleteMedication = async (medication) => {
    if (!window.confirm(`¿Borrar ${medication.producto}?`)) return;
    try {
      await removeMedication(medication.id);
      setMedications((current) =>
        current.filter((x) => x.id !== medication.id),
      );
      setNotice("Medicamento eliminado correctamente.");
    } catch (error) {
      setNotice(`No se pudo borrar: ${error.message}`);
    }
    setTimeout(() => setNotice(""), 4000);
  };
  const medicationContent =
    view === "list" ? (
      <MedicationList
        medications={medications}
        onNew={() => {
          setSelectedMedication(null);
          setView("form");
        }}
        onEdit={(medication) => {
          setSelectedMedication(medication);
          setView("form");
        }}
        onDelete={deleteMedication}
      />
    ) : (
      <MedicationForm
        initial={selectedMedication || emptyMedication}
        onCancel={() => {
          setView("list");
          setSelectedMedication(null);
        }}
        onSaved={savedMedication}
      />
    );
  const savedHealthInsurance = async (item) => {
    try {
      const saved = await persistHealthInsurance(item);
      setHealthInsurances((current) =>
        current.some((x) => x.id === saved.id)
          ? current.map((x) => (x.id === saved.id ? saved : x))
          : [saved, ...current],
      );
      setView("list");
      setSelectedHealthInsurance(null);
      setNotice(`Obra social ${saved.descripcion} guardada correctamente.`);
    } catch (error) {
      setNotice(`No se pudo guardar: ${error.message}`);
    }
    setTimeout(() => setNotice(""), 4000);
  };
  const deleteHealthInsurance = async (item) => {
    if (!window.confirm(`¿Borrar ${item.descripcion}?`)) return;
    try {
      await removeHealthInsurance(item.id);
      setHealthInsurances((current) => current.filter((x) => x.id !== item.id));
      setNotice("Obra social eliminada correctamente.");
    } catch (error) {
      setNotice(`No se pudo borrar: ${error.message}`);
    }
    setTimeout(() => setNotice(""), 4000);
  };
  const healthInsuranceContent =
    view === "list" ? (
      <HealthInsuranceList
        healthInsurances={healthInsurances}
        onNew={() => {
          setSelectedHealthInsurance(null);
          setView("form");
        }}
        onEdit={(item) => {
          setSelectedHealthInsurance(item);
          setView("form");
        }}
        onDelete={deleteHealthInsurance}
      />
    ) : (
      <HealthInsuranceForm
        initial={selectedHealthInsurance || emptyHealthInsurance}
        onCancel={() => {
          setView("list");
          setSelectedHealthInsurance(null);
        }}
        onSaved={savedHealthInsurance}
      />
    );
  const savedNomenclature = async (item) => {
    try {
      const saved = await persistNomenclature(item);
      setNomenclatures((current) => [saved, ...current]);
      setView("list");
      setNotice(`Código ${saved.codigo} guardado correctamente.`);
    } catch (error) {
      setNotice(`No se pudo guardar: ${error.message}`);
    }
    setTimeout(() => setNotice(""), 4000);
  };
  const saveNomenclatureFee = async (item, arancel) => {
    try {
      await updateNomenclatureFee(item.codigo, item.arancel ?? null, arancel);
      const update = (record) => record.codigo === item.codigo && Number(record.arancel) === Number(item.arancel) ? { ...record, arancel } : record;
      setNomenclatures((current) => current.map(update));
      setLaboratoryCodes((current) => current.map(update));
      setNotice(`Arancel ${item.codigo} actualizado correctamente.`);
    } catch (error) {
      setNotice(`No se pudo actualizar el arancel: ${error.message}`);
      throw error;
    } finally {
      setTimeout(() => setNotice(""), 4000);
    }
  };
  const nomenclatureContent =
    view === "list" ? (
      <NomenclatureList
        nomenclatures={nomenclatures}
        cieCodes={cieCodes}
        laboratoryCodes={laboratoryCodes}
        onNew={() => setView("form")}
        onFeeChange={saveNomenclatureFee}
      />
    ) : (
      <NomenclatureForm
        onCancel={() => setView("list")}
        onSaved={savedNomenclature}
      />
    );
  const savedCabo = (item) => {
    setCabos((current) =>
      current.some((x) => x.id === item.id)
        ? current.map((x) => (x.id === item.id ? item : x))
        : [item, ...current],
    );
    setView("list");
    setSelectedCabo(null);
    setNotice(`Cabo ${item.numero} guardado correctamente.`);
    setTimeout(() => setNotice(""), 4000);
  };
  const deleteCabo = async (item) => {
    if (!window.confirm(`¿Borrar el Cabo ${item.numero}?`)) return;
    try { await removeCabo(item.id); }
    catch (error) { setNotice(`No se pudo borrar el Cabo: ${error.message}`); return; }
    setCabos((current) => current.filter((x) => x.id !== item.id));
    setNotice("Cabo eliminado correctamente.");
    setTimeout(() => setNotice(""), 4000);
  };
  const openCabo = async (item, nextView) => {
    setNotice(`Cargando detalle del Cabo ${item.numero}...`);
    try {
      const details = await loadCaboDetails(item.id);
      const complete = { ...item, ...details };
      setCabos((current) => current.map((cabo) => cabo.id === item.id ? complete : cabo));
      setSelectedCabo(complete);
      setView(nextView);
      setNotice("");
    } catch (error) {
      setNotice(`No se pudo cargar el detalle del Cabo: ${error.message}`);
      setTimeout(() => setNotice(""), 5000);
    }
  };
  const loadOlderCabos = async () => {
    if (loadingOlderCabos || !hasMoreCabos || !cabos.length) return;
    setLoadingOlderCabos(true);
    try {
      const oldestId = Math.min(...cabos.map((item) => Number(item.id)).filter(Number.isFinite));
      const result = await loadCabosPage(oldestId, 500);
      const older = (result.items || []).map((item) => ({
        ...item,
        edad: item.edad ?? "",
        prestaciones: [],
        diagnosticos: [],
        medicamentos: [],
        laboratorio: [],
      }));
      setCabos((current) => {
        const existing = new Set(current.map((item) => String(item.id)));
        return [...current, ...older.filter((item) => !existing.has(String(item.id)))];
      });
      setHasMoreCabos(Boolean(result.hasMore));
      setNotice(`${older.length} Cabos anteriores cargados.`);
      setTimeout(() => setNotice(""), 4000);
    } catch (error) {
      setNotice(`No se pudieron cargar los Cabos anteriores: ${error.message}`);
      setTimeout(() => setNotice(""), 5000);
    } finally {
      setLoadingOlderCabos(false);
    }
  };
  const caboContent =
    view === "list" ? (
      <CaboList
        cabos={cabos}
        onNew={() => {
          setSelectedCabo(null);
          setView("form");
        }}
        onView={(item) => openCabo(item, "detail")}
        onEdit={(item) => openCabo(item, "form")}
        onDelete={deleteCabo}
        onLoadOlder={loadOlderCabos}
        loadingOlder={loadingOlderCabos}
        hasMoreCabos={hasMoreCabos}
      />
    ) : (
      <CaboForm
        initial={selectedCabo || emptyCabo}
        readOnly={view === "detail"}
        patients={patients}
        professionals={professionals}
        healthInsurances={healthInsurances}
        medications={medications}
        nomenclatures={nomenclatures}
        cieCodes={cieCodes}
        laboratoryCodes={laboratoryCodes}
        onCancel={() => {
          setView("list");
          setSelectedCabo(null);
        }}
        onSaved={async (item) => {
          try { savedCabo(await persistCabo(item)); }
          catch (error) { setNotice(`No se pudo guardar el Cabo: ${error.message}`); }
        }}
      />
    );
  const savedCobroOS = (item) => {
    setCobrosOS((current) =>
      current.some((record) => record.id === item.id)
        ? current.map((record) => (record.id === item.id ? item : record))
        : [item, ...current],
    );
    setView("list");
    setSelectedCobroOS(null);
    setNotice(`Cobro de factura ${item.numeroFactura} guardado correctamente.`);
    setTimeout(() => setNotice(""), 4000);
  };
  const deleteCobroOS = async (item) => {
    if (
      !window.confirm(`¿Borrar el cobro de la factura ${item.numeroFactura}?`)
    )
      return;
    try { await removeHealthInsurancePayment(item.id); }
    catch (error) { setNotice(`No se pudo borrar el cobro: ${error.message}`); return; }
    setCobrosOS((current) => current.filter((record) => record.id !== item.id));
    setNotice("Cobro eliminado correctamente.");
    setTimeout(() => setNotice(""), 4000);
  };
  const cobroOSContent =
    view === "list" ? (
      <CobroOSList
        records={cobrosOS}
        onNew={() => {
          setSelectedCobroOS(null);
          setView("form");
        }}
        onView={(item) => {
          setSelectedCobroOS(item);
          setView("detail");
        }}
        onEdit={(item) => {
          setSelectedCobroOS(item);
          setView("form");
        }}
        onDelete={deleteCobroOS}
      />
    ) : (
      <CobroOSForm
        initial={selectedCobroOS || emptyCobroOS}
        readOnly={view === "detail"}
        healthInsurances={healthInsurances}
        cabos={cabos}
        onCancel={() => {
          setView("list");
          setSelectedCobroOS(null);
        }}
        onSaved={async (item) => {
          try { savedCobroOS(await persistHealthInsurancePayment(item)); }
          catch (error) { setNotice(`No se pudo guardar el cobro: ${error.message}`); }
        }}
      />
    );
  const appointmentContent = (
    <AppointmentsModule
      patients={patients}
      professionals={professionals}
      appointments={appointments}
      setAppointments={setAppointments}
      availability={availability}
      setAvailability={setAvailability}
      currentUser={currentUser}
      canEditAppointments={can("appointments", "edit")}
      onOpenHistory={can("clinical-history") ? (patientCode) => {
        const patient = patients.find((item) => String(item.codigo) === String(patientCode));
        if (!patient) { setNotice("No se encontró el paciente del turno."); return; }
        setSelectedPatient(patient);
        setModule("clinical-history");
        setView("list");
      } : null}
      onNotice={(message) => {
        setNotice(message);
        setTimeout(() => setNotice(""), 4000);
      }}
    />
  );
  const clinicalHistoryContent = (
    <ClinicalHistory
      patients={patients}
      initialPatient={selectedPatient}
      professionals={professionals}
      canCreate={can("clinical-history", "create")}
      onNotice={(message) => { setNotice(message); setTimeout(() => setNotice(""), 5000); }}
    />
  );
  const personnelContent =
    module === "users"
      ? <UsersManagement onNotice={(message)=>{setNotice(message);setTimeout(()=>setNotice(""),4000);}} />
      : module === "appointments"
      ? appointmentContent
      : module === "clinical-history"
        ? clinicalHistoryContent
      : module === "medications"
        ? medicationContent
        : module === "health-insurances"
          ? healthInsuranceContent
          : module === "nomenclature"
            ? nomenclatureContent
            : module === "cabos"
              ? caboContent
              : module === "cobros-os"
                ? cobroOSContent
                : rawPersonnelContent;
  const liquidationLabels = {
    "liquidacion-obra-social": "Liquidación Obra Social",
    "liquidacion-profesionales": "Liquidación Profesionales",
    "liquidacion-personal": "Liquidación Personal",
  };
  const helpGuides = {
    appointments: { title: "Turnos", intro: "Consultá la agenda, registrá turnos y administrá la disponibilidad profesional.", steps: [["Elegí fecha y profesional", "Revisá los horarios disponibles y los turnos asignados."], ["Creá el turno", "Seleccioná un horario, buscá al paciente y completá el motivo."], ["Gestioná la agenda", "Modificá, cancelá o actualizá el estado desde las acciones."]], tip: "Si no aparece un horario, verificá la disponibilidad configurada del profesional." },
    cabos: { title: "Cabos", intro: "Registrá y consultá las atenciones realizadas a cada paciente.", steps: [["Buscá el cabo", "Usá los filtros para localizarlo por número, paciente o período."], ["Completá la atención", "Cargá datos generales, prácticas, profesionales, diagnósticos y medicamentos."], ["Revisá antes de guardar", "Controlá obra social, beneficiario e importes asociados."]], tip: "Evitá repetir una práctica salvo que haya sido realizada más de una vez y corresponda registrar su cantidad." },
    "cobros-os": { title: "Cobros de Obra Social", intro: "Administrá facturas, pagos y débitos informados por las obras sociales.", steps: [["Seleccioná la obra social", "Localizá la entidad y el comprobante que vas a registrar."], ["Cargá el cobro", "Indicá fechas, factura, importe facturado y monto cobrado."], ["Registrá débitos", "Agregá los descuentos informados para obtener el neto real."]], tip: "La fecha de cobro determina en qué período se consideran los importes para las liquidaciones." },
    "liquidacion-obra-social": { title: "Liquidación de Obra Social", intro: "Consultá prestaciones e importes que corresponden a una obra social en un período.", steps: [["Elegí obra social y período", "También podés filtrar por tipo de atención."], ["Revisá cabos y totales", "Abrí el detalle de cada cabo para comprobar sus conceptos."], ["Generá la impresión", "Seleccioná las rendiciones y facturas que necesitás incluir."]], tip: "Los reportes sin datos no se generan al imprimir todas las rendiciones." },
    "liquidacion-profesionales": { title: "Liquidación de Profesionales", intro: "Calculá lo producido y el importe a cobrar por cada profesional.", steps: [["Definí el período", "La búsqueda toma los cobros registrados dentro de esas fechas."], ["Revisá los cálculos", "Controlá producido, descuento, porcentaje de cobro y total."], ["Consultá el detalle", "Analizalo por práctica o agrupado por obra social antes de imprimir."]], tip: "El porcentaje de cobro surge de la configuración registrada para cada profesional." },
    "liquidacion-personal": { title: "Liquidación de Personal", intro: "Distribuí entre el personal el porcentaje correspondiente del neto cobrado.", steps: [["Elegí el período", "Se calcula el bruto cobrado por las obras sociales."], ["Controlá el fondo", "Revisá el descuento del 18%, el neto y el 10% destinado al personal."], ["Revisá e imprimí", "Verificá la distribución en partes iguales antes de generar el PDF."]], tip: "Confirmá que todos los cobros del período estén registrados antes de liquidar." },
    patients: { title: "Pacientes", intro: "Administrá los datos personales, de contacto y cobertura de los pacientes.", steps: [["Buscá al paciente", "Usá nombre, DNI, código u obra social."], ["Creá o modificá", "Completá los campos obligatorios y la información de afiliación."], ["Consultá el detalle", "Verificá los datos registrados antes de utilizarlos en una atención."]], tip: "Comprobá el DNI antes de crear un paciente para evitar registros duplicados." },
    "clinical-history": { title: "Historia Clínica", intro: "Consultá en un solo lugar los antecedentes de atención del paciente.", steps: [["Seleccioná al paciente", "Accedé desde el módulo o desde la acción disponible en Pacientes."], ["Revisá sus antecedentes", "Consultá turnos, profesionales, Cabos, prestaciones, diagnósticos y laboratorio."], ["Registrá la atención", "Agregá la evolución, pedidos médicos y solicitudes de laboratorio."]], tip: "Cada registro queda asociado al usuario que lo creó y no reemplaza los datos originales de Turnos o Cabos." },
    professionals: { title: "Profesionales", intro: "Gestioná profesionales, matrículas, especialidades y porcentajes de cobro.", steps: [["Buscá al profesional", "Filtrá por nombre, DNI, matrícula o especialidad."], ["Completá sus datos", "Registrá identificación, contacto, matrícula y especialidad."], ["Configurá el porcentaje", "Indicá el porcentaje usado en su liquidación."]], tip: "La configuración del profesional impacta directamente en la liquidación correspondiente." },
    personnel: { title: "Personal", intro: "Administrá la nómina de personal incluida en la distribución de liquidaciones.", steps: [["Buscá a la persona", "Filtrá por nombre, DNI, código o área."], ["Registrá sus datos", "Completá identificación, contacto, domicilio y área."], ["Mantené la nómina actualizada", "Corregí o eliminá registros que ya no correspondan."]], tip: "La cantidad de personas registradas interviene en el reparto de la liquidación de personal." },
    medications: { title: "Medicamentos", intro: "Mantené actualizado el catálogo utilizado en las atenciones.", steps: [["Buscá el medicamento", "Localizalo por código o descripción."], ["Creá o editá", "Registrá una descripción clara y el código correspondiente."], ["Eliminá con precaución", "Comprobá que el registro no sea necesario para nuevas cargas."]], tip: "Usá descripciones uniformes para facilitar la búsqueda durante la carga de cabos." },
    "health-insurances": { title: "Obras Sociales", intro: "Gestioná las entidades de cobertura disponibles en el sistema.", steps: [["Buscá la entidad", "Filtrá por código, sigla o denominación."], ["Completá los datos", "Registrá identificación, contacto y demás información requerida."], ["Mantenela actualizada", "Revisá sus datos antes de facturar o liquidar."]], tip: "Evitar duplicados garantiza que cobros, cabos y liquidaciones queden agrupados correctamente." },
    nomenclature: { title: "Nomenclador", intro: "Consultá y administrá códigos, descripciones y valores de las prácticas.", steps: [["Buscá la práctica", "Usá el código o parte de su descripción."], ["Revisá sus valores", "Controlá honorarios, gastos y demás importes configurados."], ["Actualizá con cuidado", "Verificá la vigencia antes de modificar un valor."]], tip: "Los valores del nomenclador afectan los cálculos de prestaciones y liquidaciones." },
    users: { title: "Usuarios y Permisos", intro: "Creá usuarios internos y definí qué módulos y acciones pueden utilizar.", steps: [["Creá el usuario", "Ingresá un nombre de usuario, nombre completo y contraseña."], ["Asigná permisos", "Habilitá consulta, creación, edición, eliminación e impresión por módulo."], ["Revisá el acceso", "Guardá y comprobá el perfil con una nueva sesión."]], tip: "Otorgá únicamente los permisos necesarios para las tareas de cada usuario." },
  };
  const helpGuide = helpGuides[module] || { title: "Ayuda", intro: "Información de uso del módulo actual.", steps: [], tip: "Consultá con el administrador ante cualquier duda." };
  const helpDialog = helpOpen && (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" role="presentation" onMouseDown={() => setHelpOpen(false)}>
      <section className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="help-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between bg-hospital-700 px-6 py-5 text-white">
          <div className="flex gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15"><CircleHelp size={22} /></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-cyan-100">Ayuda del módulo</p><h2 id="help-title" className="mt-1 text-xl font-bold">{helpGuide.title}</h2></div>
          </div>
          <button onClick={() => setHelpOpen(false)} className="rounded-lg p-2 text-cyan-50 hover:bg-white/10" aria-label="Cerrar ayuda"><X size={20} /></button>
        </header>
        <div className="space-y-5 p-6 text-sm text-slate-600">
          <p>{helpGuide.intro}</p>
          <ol className="space-y-3">
            {helpGuide.steps.map(([title, description], index) => <li key={title} className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-hospital-100 font-bold text-hospital-700">{index + 1}</span><span><strong className="text-slate-700">{title}.</strong> {description}</span></li>)}
          </ol>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800"><strong>Importante:</strong> {helpGuide.tip}</div>
        </div>
        <footer className="flex justify-end border-t border-slate-100 px-6 py-4"><button onClick={() => setHelpOpen(false)} className="primary">Entendido</button></footer>
      </section>
    </div>
  );
  const liquidationContent = module === "liquidacion-obra-social" ? (
    <HealthInsuranceLiquidation
      healthInsurances={healthInsurances}
      onClose={() => goTo("patients")}
      onNotice={(message) => {
        setNotice(message);
        setTimeout(() => setNotice(""), 4000);
      }}
    />
  ) : module === "liquidacion-profesionales" ? (
    <ProfessionalLiquidation
      onClose={() => goTo("patients")}
      onNotice={(message) => {
        setNotice(message);
        setTimeout(() => setNotice(""), 4000);
      }}
    />
  ) : module === "liquidacion-personal" ? (
    <PersonnelLiquidation
      onClose={() => goTo("patients")}
      onNotice={(message) => {
        setNotice(message);
        setTimeout(() => setNotice(""), 4000);
      }}
    />
  ) : liquidationLabels[module] ? (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-hospital-600">Liquidaciones</p>
      <h2 className="mt-1 text-2xl font-bold text-slate-800">
        {liquidationLabels[module]}
      </h2>
      <p className="mt-2 text-slate-500">
        Módulo disponible para incorporar el flujo de liquidación.
      </p>
    </section>
  ) : null;
  if (module !== "patients")
    return (
      <div className="flex min-h-screen bg-slate-50">
        {(initialLoading || initialLoadError) && (
          <DatabaseLoadingModal
            error={initialLoadError}
            autoRetry
            onRetry={() => setInitialLoadAttempt((attempt) => attempt + 1)}
          />
        )}
        <div className="hidden lg:block">
          <div className="fixed inset-y-0 left-0">
            <Sidebar />
          </div>
          <div className={collapsed ? "w-[88px]" : "w-72"} />
        </div>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-slate-900/40"
            />
            <div className="relative h-full w-72">
              <Sidebar />
            </div>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <header className="app-topbar flex h-24 shrink-0 items-center justify-between border-b px-5 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-slate-500 lg:hidden"
              >
                <Menu />
              </button>
              <div>
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <CalendarDays size={12} /> Miércoles, 29 de julio
                </p>
                <h1 className="font-bold text-slate-800">Panel principal</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setHelpOpen(true)} className="rounded-xl p-2.5 text-slate-500" title="Ayuda del módulo">
                <CircleHelp size={21} />
              </button>
              <button hidden className="relative rounded-xl p-2.5 text-slate-500">
                <Bell size={21} />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-hospital-100 text-hospital-700">
                  <UserRound size={20} />
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-bold text-slate-700">{currentUser?.nombre || currentUser?.usuario || "Usuario"}</p>
                  <p className="text-xs text-slate-400">{currentUser?.usuario || ""} · {currentUser?.administrador ? "Administrador" : "Usuario del sistema"}</p>
                </div>
              </div>
            </div>
          </header>
          {helpDialog}
          {notice && (
            <div className="fixed right-5 top-24 z-30 flex items-center gap-3 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl">
              {notice}
              <button onClick={() => setNotice("")}>
                <X size={17} />
              </button>
            </div>
          )}
          <main className="mx-auto max-w-[1500px] p-5 lg:p-8">
            {liquidationContent || (module === "professionals"
              ? professionalContent
              : personnelContent)}
          </main>
        </div>
      </div>
    );
  return (
    <div className="flex min-h-screen bg-slate-50">
      {(initialLoading || initialLoadError) && (
        <DatabaseLoadingModal
          error={initialLoadError}
          autoRetry
          onRetry={() => setInitialLoadAttempt((attempt) => attempt + 1)}
        />
      )}
      <div className="hidden lg:block">
        <div className="fixed inset-y-0 left-0">
          <Sidebar />
        </div>
        <div className={collapsed ? "w-[88px]" : "w-72"} />
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-900/40"
          />
          <div className="relative h-full w-72">
            <Sidebar />
          </div>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="app-topbar flex h-24 shrink-0 items-center justify-between border-b px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-500 lg:hidden"
            >
              <Menu />
            </button>
            <div>
              <p className="flex items-center gap-1 text-xs text-slate-400">
                <CalendarDays size={12} /> Miércoles, 29 de julio
              </p>
              <h1 className="font-bold text-slate-800">Panel principal</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => setHelpOpen(true)} className="rounded-xl p-2.5 text-slate-500" title="Ayuda del módulo">
              <CircleHelp size={21} />
            </button>
            <button hidden className="relative rounded-xl p-2.5 text-slate-500">
              <Bell size={21} />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-hospital-100 text-hospital-700">
                <UserRound size={20} />
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-700">{currentUser?.nombre || currentUser?.usuario || "Usuario"}</p>
                <p className="text-xs text-slate-400">{currentUser?.usuario || ""} · {currentUser?.administrador ? "Administrador" : "Usuario del sistema"}</p>
              </div>
            </div>
          </div>
        </header>
        {helpDialog}
        {notice && (
          <div className="fixed right-5 top-24 z-30 flex items-center gap-3 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl">
            {notice}
            <button onClick={() => setNotice("")}>
              <X size={17} />
            </button>
          </div>
        )}
        <main className="mx-auto max-w-[1500px] p-5 lg:p-8">
          {patientContent}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState(() => sessionStorage.getItem("hospital_token") ? "dashboard" : "login");
  const [currentUser, setCurrentUser] = useState(() => { try { return JSON.parse(sessionStorage.getItem("hospital_user") || "null"); } catch { return null; } });
  if (screen === "dashboard")
    return <Dashboard currentUser={currentUser} onLogout={async () => { try { await endSession(); } catch { /* La sesión local se cierra igualmente. */ } sessionStorage.removeItem("hospital_token"); sessionStorage.removeItem("hospital_user"); setCurrentUser(null); setScreen("login"); }} />;
  return <Login onLogin={(user) => { setCurrentUser(user); setScreen("dashboard"); }} />;
}
