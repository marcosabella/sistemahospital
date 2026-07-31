const parseResponse = async response => {
  if (response.ok) return response.json()
  const problem = await response.json().catch(() => null)
  throw new Error(problem?.detail || problem?.title || `Error HTTP ${response.status}`)
}
const authFetch = (url, options = {}) => {
  const token = sessionStorage.getItem('hospital_token')
  return fetch(url, { ...options, headers: { ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
}
export const login = (usuario, password) => fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario, password }) }).then(parseResponse)
export const logout = () => authFetch('/api/auth/logout', { method: 'POST' }).then(response => response.status === 204 ? null : parseResponse(response))
export const loadUsers = () => authFetch('/api/users').then(parseResponse)
export const saveUser = item => send(`/api/users${item.id ? `/${item.id}` : ''}`, item.id ? 'PUT' : 'POST', item)

export const loadHospitalData = () => authFetch('/api/bootstrap').then(parseResponse)
export const loadClinicalHistory = patientId => authFetch(`/api/clinical-records/patients/${patientId}`).then(parseResponse)
export const saveClinicalRecord = item => send('/api/clinical-records', 'POST', item)
export const loadHealthInsurances = () => authFetch('/api/catalogs/health-insurances').then(parseResponse)
export const loadHealthInsuranceLiquidation = (healthInsuranceId, from, to) => {
  const params = new URLSearchParams({ healthInsuranceId, from, to })
  return authFetch(`/api/liquidations/health-insurance?${params}`).then(parseResponse)
}
export const loadAmbulatoryLiquidationReport = (healthInsuranceId, from, to) => {
  const params = new URLSearchParams({ healthInsuranceId, from, to })
  return authFetch(`/api/liquidations/health-insurance/ambulatory-report?${params}`).then(parseResponse)
}
export const loadInternmentLiquidationReport = (healthInsuranceId, from, to) => {
  const params = new URLSearchParams({ healthInsuranceId, from, to })
  return authFetch(`/api/liquidations/health-insurance/internment-report?${params}`).then(parseResponse)
}
export const loadHospitalizationReport = (healthInsuranceId, from, to) => {
  const params = new URLSearchParams({ healthInsuranceId, from, to })
  return authFetch(`/api/liquidations/health-insurance/hospitalization-report?${params}`).then(parseResponse)
}
export const loadImageLiquidationReport = (healthInsuranceId, from, to) => {
  const params = new URLSearchParams({ healthInsuranceId, from, to })
  return authFetch(`/api/liquidations/health-insurance/image-report?${params}`).then(parseResponse)
}
export const loadLaboratoryLiquidationReport = (healthInsuranceId, from, to) => {
  const params = new URLSearchParams({ healthInsuranceId, from, to })
  return authFetch(`/api/liquidations/health-insurance/laboratory-report?${params}`).then(parseResponse)
}
export const loadProfessionalLiquidation = (from, to) => {
  const params = new URLSearchParams({ from, to })
  return authFetch(`/api/liquidations/professionals?${params}`).then(parseResponse)
}
export const loadProfessionalLiquidationByInsurance = (from, to) => {
  const params = new URLSearchParams({ from, to })
  return authFetch(`/api/liquidations/professionals/by-insurance-report?${params}`).then(parseResponse)
}
export const loadProfessionalLiquidationDetail = (professionalId, from, to) => {
  const params = new URLSearchParams({ from, to })
  return authFetch(`/api/liquidations/professionals/${professionalId}/detail?${params}`).then(parseResponse)
}
export const loadPersonnelLiquidation = (from, to) => {
  const params = new URLSearchParams({ from, to })
  return authFetch(`/api/liquidations/personnel?${params}`).then(parseResponse)
}
export const loadPersonnelLiquidationDetail = (from, to) => {
  const params = new URLSearchParams({ from, to })
  return authFetch(`/api/liquidations/personnel/detail?${params}`).then(parseResponse)
}
export const loadCaboDetails = id => authFetch(`/api/cabos/${id}`).then(parseResponse)
export const loadCabosForDebit = (cobroId, fechaPrestacion, obraSocialId, caboId = 0) => {
  const params = new URLSearchParams({ caboId })
  if (fechaPrestacion) params.set('fechaPrestacion', fechaPrestacion)
  if (obraSocialId) params.set('obraSocialId', obraSocialId)
  return authFetch(`/api/cobros/${cobroId}/cabos-debito?${params}`).then(parseResponse)
}

const send = (url, method, body) => authFetch(url, {
  method,
  headers: body ? { 'Content-Type': 'application/json' } : undefined,
  body: body ? JSON.stringify(body) : undefined,
}).then(response => response.status === 204 ? null : parseResponse(response))

export const saveMedication = item => send(`/api/medications${item.id ? `/${item.id}` : ''}`, item.id ? 'PUT' : 'POST', item)
export const deleteMedication = id => send(`/api/medications/${id}`, 'DELETE')
export const saveHealthInsurance = item => send(`/api/health-insurances${item.id ? `/${item.id}` : ''}`, item.id ? 'PUT' : 'POST', item)
export const deleteHealthInsurance = id => send(`/api/health-insurances/${id}`, 'DELETE')
export const saveNomenclature = item => send('/api/nomenclatures', 'POST', item)
export const updateNomenclatureFee = (codigo, arancelAnterior, arancel) => send(`/api/nomenclatures/${encodeURIComponent(codigo)}/fee`, 'PUT', { arancelAnterior, arancel })
export const saveAppointment = item => send(`/api/appointments${item.id ? `/${item.id}` : ''}`, item.id ? 'PUT' : 'POST', { ...item, profesionalCodigo: Number(item.profesionalCodigo), pacienteCodigo: Number(item.pacienteCodigo), duracion: Number(item.duracion) })
export const saveAvailability = item => send('/api/availability', 'POST', { ...item, profesionalCodigo: Number(item.profesionalCodigo), diaSemana: Number(item.diaSemana), duracion: Number(item.duracion) })
export const deleteAvailability = id => send(`/api/availability/${id}`, 'DELETE')
const persistedId = value => Number.isInteger(Number(value)) && Number(value) > 0
export const savePatient = item => send(`/api/patients${persistedId(item.codigo) ? `/${item.codigo}` : ''}`, persistedId(item.codigo) ? 'PUT' : 'POST', item)
export const deletePatient = id => send(`/api/patients/${id}`, 'DELETE')
export const saveProfessional = item => send(`/api/professionals${persistedId(item.codigo) ? `/${item.codigo}` : ''}`, persistedId(item.codigo) ? 'PUT' : 'POST', item)
export const deleteProfessional = id => send(`/api/professionals/${id}`, 'DELETE')
export const savePersonnel = item => send(`/api/personnel${persistedId(item.codigo) ? `/${item.codigo}` : ''}`, persistedId(item.codigo) ? 'PUT' : 'POST', item)
export const deletePersonnel = id => send(`/api/personnel/${id}`, 'DELETE')
export const saveCabo = item => send(`/api/cabos${persistedId(item.id) ? `/${item.id}` : ''}`, persistedId(item.id) ? 'PUT' : 'POST', item)
export const deleteCabo = id => send(`/api/cabos/${id}`, 'DELETE')
export const saveHealthInsurancePayment = item => send(`/api/health-insurance-payments${persistedId(item.id) ? `/${item.id}` : ''}`, persistedId(item.id) ? 'PUT' : 'POST', item)
export const deleteHealthInsurancePayment = id => send(`/api/health-insurance-payments/${id}`, 'DELETE')
