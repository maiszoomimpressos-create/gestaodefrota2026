// ==========================================
// FleetControl — lógica da aplicação
// Autenticação e persistência reais via Supabase.
// ==========================================

const supabaseClient = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

// ---------- Elementos ----------
const authScreen = document.getElementById('authScreen');
const appLayout = document.getElementById('appLayout');
const adminLayout = document.getElementById('adminLayout');
const navAdmin = document.getElementById('navAdmin');
const adminBackBtn = document.getElementById('adminBackBtn');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const adminSidebar = document.getElementById('adminSidebar');
const adminSidebarOverlay = document.getElementById('adminSidebarOverlay');
const adminHamburgerBtn = document.getElementById('adminHamburgerBtn');
const adminPageTitle = document.getElementById('adminPageTitle');
const adminPageBreadcrumb = document.getElementById('adminPageBreadcrumb');

// Área Restrita (Admin > Equipe) — reautenticação por senha + permissões
const adminUnlockModal = document.getElementById('adminUnlockModal');
const adminUnlockForm = document.getElementById('adminUnlockForm');
const adminUnlockPassword = document.getElementById('adminUnlockPassword');
const adminUnlockCancelBtn = document.getElementById('adminUnlockCancelBtn');
const adminUnlockSubmitBtn = document.getElementById('adminUnlockSubmitBtn');
const teamAddForm = document.getElementById('teamAddForm');
const teamMemberEmail = document.getElementById('teamMemberEmail');
const teamAddPermissions = document.getElementById('teamAddPermissions');
const teamMembersList = document.getElementById('teamMembersList');

const loginCard = document.getElementById('loginCard');
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const togglePassword = document.getElementById('togglePassword');
const showSignupBtn = document.getElementById('showSignupBtn');

const signupCard = document.getElementById('signupCard');
const signupForm = document.getElementById('signupForm');
const signupBtn = document.getElementById('signupBtn');
const signupCpf = document.getElementById('signupCpf');
const signupName = document.getElementById('signupName');
const signupEmail = document.getElementById('signupEmail');
const signupRg = document.getElementById('signupRg');
const signupBirthDate = document.getElementById('signupBirthDate');
const signupPassword = document.getElementById('signupPassword');
const signupPasswordConfirm = document.getElementById('signupPasswordConfirm');
const toggleSignupPassword = document.getElementById('toggleSignupPassword');
const passwordRequirements = document.getElementById('passwordRequirements');
const showLoginBtn = document.getElementById('showLoginBtn');

// Endereço (aberto sob demanda via Mensagens ou Configurações > Conta)
const addressModal = document.getElementById('addressModal');
const addressForm = document.getElementById('addressForm');
const addressSkipBtn = document.getElementById('addressSkipBtn');
const addressCep = document.getElementById('addressCep');
const addressStreet = document.getElementById('addressStreet');
const addressNumber = document.getElementById('addressNumber');
const addressComplement = document.getElementById('addressComplement');
const addressNeighborhood = document.getElementById('addressNeighborhood');
const addressCity = document.getElementById('addressCity');
const addressState = document.getElementById('addressState');

const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
const forgotModal = document.getElementById('forgotModal');
const forgotForm = document.getElementById('forgotForm');
const forgotSuccess = document.getElementById('forgotSuccess');
const forgotEmail = document.getElementById('forgotEmail');
const forgotCancelBtn = document.getElementById('forgotCancelBtn');
const forgotSubmitBtn = document.getElementById('forgotSubmitBtn');
const forgotOkBtn = document.getElementById('forgotOkBtn');

const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');

const pageTitle = document.getElementById('pageTitle');
const pageBreadcrumb = document.getElementById('pageBreadcrumb');
const toastContainer = document.getElementById('toastContainer');

const createCompanyForm = document.getElementById('createCompanyForm');
const companyDocument = document.getElementById('companyDocument');
const registerVehicleForm = document.getElementById('registerVehicleForm');
const registerVehicleTitle = document.getElementById('registerVehicleTitle');
const registerVehicleDesc = document.getElementById('registerVehicleDesc');
const registerVehicleSubmitBtn = document.getElementById('registerVehicleSubmitBtn');

// Contexto (Minha Conta x Empresas) e lista de veículos
const contextSwitcher = document.getElementById('contextSwitcher');
const vehiclesList = document.getElementById('vehiclesList');
const vehiclesContextLabel = document.getElementById('vehiclesContextLabel');
const btnAddVehicle = document.getElementById('btnAddVehicle');

// Mensagens / Admin / Conta
const messagesList = document.getElementById('messagesList');
const messagesBadge = document.getElementById('messagesBadge');
const notifBadge = document.getElementById('notifBadge');
const adminSection = document.getElementById('adminSection');
const settingsAccountInfo = document.getElementById('settingsAccountInfo');
const settingsAddressPending = document.getElementById('settingsAddressPending');
const settingsCompleteAddressBtn = document.getElementById('settingsCompleteAddressBtn');
const navSettings = document.getElementById('navSettings');
const settingsSubmenu = document.getElementById('settingsSubmenu');
const plansContextLabel = document.getElementById('plansContextLabel');
const planName = document.getElementById('planName');
const planTypeBadge = document.getElementById('planTypeBadge');
const planUsageList = document.getElementById('planUsageList');
const adminStatUsers = document.getElementById('adminStatUsers');
const adminStatCompanies = document.getElementById('adminStatCompanies');
const adminStatVehicles = document.getElementById('adminStatVehicles');
const adminCompaniesTable = document.getElementById('adminCompaniesTable');
const adminUsersTable = document.getElementById('adminUsersTable');
const adminPlansTable = document.getElementById('adminPlansTable');

const PAGE_LABELS = {
  dashboard: { title: 'Dashboard', crumb: 'Início › Dashboard' },
  messages: { title: 'Mensagens', crumb: 'Início › Mensagens' },
  vehicles: { title: 'Veículos', crumb: 'Início › Veículos' },
  registerVehicle: { title: 'Adicionar Veículo', crumb: 'Início › Veículos › Adicionar' },
  createCompany: { title: 'Criar Empresa', crumb: 'Início › Empresa › Criar Empresa' },
  maintenance: { title: 'Manutenções', crumb: 'Início › Manutenções' },
  reports: { title: 'Relatórios', crumb: 'Início › Relatórios' },
  settingsAccount: { title: 'Conta', crumb: 'Início › Configurações › Conta' },
  settingsPlans: { title: 'Planos', crumb: 'Início › Configurações › Planos' },
};

// Rótulos amigáveis para os values das marcas/combustíveis do formulário
// (os <select> usam códigos internos em minúsculo).
const BRAND_LABELS = {
  chevrolet: 'Chevrolet', fiat: 'Fiat', ford: 'Ford', honda: 'Honda', hyundai: 'Hyundai',
  jeep: 'Jeep', mercedes: 'Mercedes-Benz', nissan: 'Nissan', renault: 'Renault',
  toyota: 'Toyota', volkswagen: 'Volkswagen', other: 'Outra',
};

const VEHICLE_STATUS_LABELS = {
  active: 'Ativo', inactive: 'Inativo', sold: 'Vendido', maintenance: 'Em manutenção',
};

const VEHICLE_STATUS_BADGE = {
  active: 'active', inactive: 'pending', sold: 'pending', maintenance: 'maintenance',
};

const ADMIN_PAGE_LABELS = {
  dashboard: { title: 'Dashboard', crumb: 'Administração › Dashboard' },
  plans: { title: 'Planos', crumb: 'Administração › Planos' },
  apis: { title: 'APIs', crumb: 'Administração › APIs' },
  communication: { title: 'Comunicação', crumb: 'Administração › Comunicação' },
  team: { title: 'Equipe', crumb: 'Administração › Área Restrita › Equipe' },
};

// Telas do admin que existem hoje — toda tela nova do admin deve ganhar um
// código aqui (é o "feature" gravado em admin_permissions). Fonte única
// usada tanto pra montar o formulário de "Adicionar membro" quanto pra
// exibir os checkboxes de cada membro já existente.
const ADMIN_FEATURES = [
  { code: 'dashboard', label: 'Dashboard' },
  { code: 'plans', label: 'Planos' },
  { code: 'apis', label: 'APIs' },
  { code: 'communication', label: 'Comunicação' },
  { code: 'team', label: 'Equipe' },
];

// Itens da "Área Restrita" — exigem reconfirmar a senha antes de entrar,
// além da permissão em si. Cresce conforme novos itens forem adicionados
// nessa seção da sidebar.
const RESTRICTED_ADMIN_FEATURES = new Set(['team']);

// ---------- Toast ----------
function toast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  toastContainer.appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

// ---------- Auth screen <-> App layout <-> Admin layout ----------
function showApp() {
  authScreen.style.display = 'none';
  adminLayout.classList.remove('active');
  appLayout.classList.add('active');
}

function showAuth() {
  appLayout.classList.remove('active');
  adminLayout.classList.remove('active');
  authScreen.style.display = 'flex';
  loginForm.reset();
  showLoginCard();
  restrictedAreaUnlocked = false;
}

// Reconfere no banco a cada tentativa de entrar — não confia só na flag que
// esconde o botão "Administração" na sidebar (achado real: esconder um botão
// no CSS não impede ninguém de chamar showAdminLayout() direto pelo console
// do navegador; a checagem de verdade tem que estar aqui, não só na UI).
async function showAdminLayout() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const { data } = await supabaseClient
    .from('platform_admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!data) {
    toast('Você não tem permissão para acessar a Administração.', 'error');
    return;
  }

  appLayout.classList.remove('active');
  adminLayout.classList.add('active');
  adminSwitchPage('dashboard');
  loadAdminData();
}

navAdmin.addEventListener('click', showAdminLayout);
adminBackBtn.addEventListener('click', showApp);
adminLogoutBtn.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  toast('Você saiu do sistema.', 'success');
});

function showLoginCard() {
  signupCard.style.display = 'none';
  loginCard.style.display = '';
}

function showSignupCard() {
  loginCard.style.display = 'none';
  signupCard.style.display = '';
  signupForm.reset();
  updatePasswordRequirements();
}

showSignupBtn.addEventListener('click', showSignupCard);
showLoginBtn.addEventListener('click', showLoginCard);

async function loadProfile(user) {
  const { data } = await supabaseClient
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single();

  const name = data?.name || user.email;
  userName.textContent = name;
  userAvatar.textContent = name.slice(0, 2).toUpperCase();
}

// ---------- Contexto: Minha Conta (pessoal) x Empresa ----------
// Todo usuário começa (a cada login) no ambiente pessoal. A troca de
// contexto é só em memória — nunca persistida — porque a regra é sempre
// entrar pessoal e o usuário escolher a empresa se quiser.
let currentContext = { type: 'personal' };
let myCompanies = []; // [{ id, name, role }] — empresas ativas do usuário

async function loadMyCompanies() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  // IMPORTANTE: filtrar por user_id explicitamente. A policy de SELECT em
  // company_members também libera ver colegas da mesma empresa (para a UI
  // de gestão de equipe), então sem esse filtro viriam as linhas de TODOS
  // os membros das empresas em que participo, não só as minhas.
  const { data } = await supabaseClient
    .from('company_members')
    .select('company_id, companies(id, name), roles(name)')
    .eq('user_id', user.id)
    .eq('status', 'active');

  myCompanies = (data || [])
    .filter(m => m.companies)
    .map(m => ({ id: m.companies.id, name: m.companies.name, role: m.roles?.name || '' }));

  renderContextSwitcher();
}

function renderContextSwitcher() {
  const options = ['<option value="personal">👤 Minha Conta (Pessoal)</option>']
    .concat(myCompanies.map(c => `<option value="${c.id}">🏢 ${c.name}</option>`));
  contextSwitcher.innerHTML = options.join('');
  contextSwitcher.value = currentContext.type === 'personal' ? 'personal' : currentContext.companyId;
}

function setContext(value) {
  if (value === 'personal') {
    currentContext = { type: 'personal' };
  } else {
    const company = myCompanies.find(c => c.id === value);
    if (!company) return;
    currentContext = { type: 'company', companyId: company.id, companyName: company.name, role: company.role };
  }
  contextSwitcher.value = value;
  updateVehiclesContextLabel();
  loadDashboardStats();
  if (document.getElementById('pageVehicles').classList.contains('active')) {
    loadVehicles();
  }
  if (document.getElementById('pageSettingsPlans').classList.contains('active')) {
    loadPlanInfo();
  }
}

contextSwitcher.addEventListener('change', (e) => setContext(e.target.value));

function updateVehiclesContextLabel() {
  vehiclesContextLabel.textContent = currentContext.type === 'personal'
    ? 'Veículos da sua conta pessoal.'
    : `Veículos da empresa ${currentContext.companyName}.`;
}

async function loadDashboardStats() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  // Contexto selecionado determina o filtro — pessoal e corporativo
  // nunca se misturam (nem no dashboard, nem na contagem do limite).
  let query = supabaseClient.from('vehicles').select('*', { count: 'exact', head: true });
  query = currentContext.type === 'personal'
    ? query.eq('personal_owner_user_id', user.id)
    : query.eq('company_id', currentContext.companyId);

  const { count } = await query;

  const statValue = document.querySelector('#pageDashboard .stat-card .stat-value');
  if (statValue && typeof count === 'number') {
    statValue.textContent = count;
  }
}

// ---------- Veículos (lista do contexto atual) ----------
let currentVehicles = [];
let editingVehicleId = null;

async function loadVehicles() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  vehiclesList.innerHTML = '<div class="empty-state"><div>⏳</div><p>Carregando veículos...</p></div>';

  let query = supabaseClient.from('vehicles').select('*').order('created_at', { ascending: false });
  query = currentContext.type === 'personal'
    ? query.eq('personal_owner_user_id', user.id)
    : query.eq('company_id', currentContext.companyId);

  const { data, error } = await query;
  if (error) {
    toast('Erro ao carregar veículos: ' + error.message, 'error');
    vehiclesList.innerHTML = '';
    return;
  }

  currentVehicles = data || [];
  renderVehicles();
}

function renderVehicles() {
  if (currentVehicles.length === 0) {
    vehiclesList.innerHTML = `
      <div class="empty-state">
        <div>🚗</div>
        <p>${currentContext.type === 'personal'
          ? 'Você ainda não cadastrou nenhum veículo pessoal.'
          : `A empresa ${currentContext.companyName} ainda não tem veículos cadastrados.`}</p>
      </div>`;
    return;
  }

  vehiclesList.innerHTML = currentVehicles.map(v => `
    <div class="vehicle-card">
      <div class="vehicle-card-icon">🚗</div>
      <div class="vehicle-card-info">
        <h4>${BRAND_LABELS[v.brand] || v.brand || 'Marca não informada'} ${v.model}</h4>
        <p>${v.plate}${v.year ? ' · ' + v.year : ''}${v.color ? ' · ' + v.color : ''}</p>
        <span class="status-badge ${VEHICLE_STATUS_BADGE[v.status] || 'active'}">${VEHICLE_STATUS_LABELS[v.status] || v.status}</span>
      </div>
      <div class="vehicle-card-actions">
        <button class="btn-icon-action" data-edit="${v.id}" title="Editar">✎</button>
        <button class="btn-icon-action danger" data-delete="${v.id}" title="Excluir">🗑</button>
      </div>
    </div>
  `).join('');
}

vehiclesList.addEventListener('click', (e) => {
  const editBtn = e.target.closest('[data-edit]');
  const delBtn = e.target.closest('[data-delete]');
  if (editBtn) {
    const vehicle = currentVehicles.find(v => v.id === editBtn.dataset.edit);
    if (vehicle) openEditVehicleForm(vehicle);
  } else if (delBtn) {
    deleteVehicle(delBtn.dataset.delete);
  }
});

async function deleteVehicle(id) {
  const vehicle = currentVehicles.find(v => v.id === id);
  const label = vehicle ? `${BRAND_LABELS[vehicle.brand] || vehicle.brand || ''} ${vehicle.model} (${vehicle.plate})`.trim() : 'este veículo';

  if (!confirm(`Excluir ${label}? Essa ação não pode ser desfeita.`)) return;

  const { error } = await supabaseClient.from('vehicles').delete().eq('id', id);
  if (error) {
    toast('Erro ao excluir veículo: ' + error.message, 'error');
    return;
  }

  toast('Veículo excluído.', 'success');
  loadVehicles();
  loadDashboardStats();
}

function openAddVehicleForm() {
  editingVehicleId = null;
  registerVehicleForm.reset();
  lookupPlateStatus.textContent = '';
  switchPage('registerVehicle');

  const title = 'Adicionar Veículo';
  pageTitle.textContent = title;
  registerVehicleTitle.textContent = title;
  registerVehicleDesc.textContent = currentContext.type === 'personal'
    ? 'Adicione um veículo à sua conta pessoal.'
    : `Adicione um veículo à empresa ${currentContext.companyName}.`;
  registerVehicleSubmitBtn.textContent = 'Cadastrar Veículo';
}

function openEditVehicleForm(vehicle) {
  editingVehicleId = vehicle.id;
  document.getElementById('vehicleBrand').value = vehicle.brand || '';
  document.getElementById('vehicleModel').value = vehicle.model || '';
  document.getElementById('vehicleYear').value = vehicle.year || '';
  document.getElementById('vehiclePlate').value = vehicle.plate || '';
  document.getElementById('vehicleColor').value = vehicle.color || '';
  document.getElementById('vehicleKm').value = vehicle.current_odometer || '';
  document.getElementById('vehicleFuel').value = vehicle.fuel_type || '';
  document.getElementById('vehicleChassis').value = vehicle.chassis || '';
  document.getElementById('vehicleRenavam').value = vehicle.renavam || '';
  lookupPlateStatus.textContent = '';
  switchPage('registerVehicle');

  const title = 'Editar Veículo';
  pageTitle.textContent = title;
  registerVehicleTitle.textContent = title;
  registerVehicleDesc.textContent = `Atualize os dados de ${vehicle.model}.`;
  registerVehicleSubmitBtn.textContent = 'Salvar Alterações';
}

btnAddVehicle.addEventListener('click', openAddVehicleForm);

// ---------- Sessão ----------
async function bootstrapSession(user) {
  showApp();
  currentContext = { type: 'personal' };
  loadProfile(user);
  await loadMyCompanies();
  updateVehiclesContextLabel();
  loadDashboardStats();
  refreshAccountState();
  checkAdminStatus();
}

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    bootstrapSession(session.user);
  } else {
    showAuth();
  }
});

async function init() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session?.user) {
    bootstrapSession(session.user);
  } else {
    showAuth();
  }
}
init();

// ---------- Login ----------
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  loginBtn.disabled = true;
  loginBtn.textContent = 'Entrando...';

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  loginBtn.disabled = false;
  loginBtn.textContent = 'Entrar';

  if (error) {
    toast(error.message === 'Invalid login credentials'
      ? 'E-mail ou senha inválidos.'
      : error.message, 'error');
    return;
  }
  toast('Login realizado com sucesso!', 'success');
});

// ---------- Mostrar/ocultar senha ----------
togglePassword.addEventListener('click', () => {
  const isHidden = loginPassword.type === 'password';
  loginPassword.type = isHidden ? 'text' : 'password';
  togglePassword.textContent = isHidden ? '🙈' : '👁';
});

// ---------- Esqueci minha senha ----------
function openForgotModal() {
  forgotModal.classList.add('active');
  forgotForm.style.display = '';
  forgotSuccess.classList.remove('show');
  forgotEmail.value = loginEmail.value.trim();
}

function closeForgotModal() {
  forgotModal.classList.remove('active');
}

forgotPasswordBtn.addEventListener('click', openForgotModal);
forgotCancelBtn.addEventListener('click', closeForgotModal);
forgotOkBtn.addEventListener('click', closeForgotModal);

forgotModal.addEventListener('click', (e) => {
  if (e.target === forgotModal) closeForgotModal();
});

forgotSubmitBtn.addEventListener('click', async () => {
  const email = forgotEmail.value.trim();
  if (!email) {
    toast('Informe um e-mail válido.', 'error');
    return;
  }

  forgotSubmitBtn.disabled = true;
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.href,
  });
  forgotSubmitBtn.disabled = false;

  if (error) {
    toast(error.message, 'error');
    return;
  }

  forgotForm.style.display = 'none';
  forgotSuccess.classList.add('show');
});

// ---------- Cadastro (Criar conta) ----------
const PASSWORD_RULES = {
  length: (v) => v.length >= 8,
  lower: (v) => /[a-z]/.test(v),
  upper: (v) => /[A-Z]/.test(v),
  number: (v) => /[0-9]/.test(v),
  special: (v) => /[^A-Za-z0-9]/.test(v),
};

function updatePasswordRequirements() {
  const value = signupPassword.value;
  let allMet = true;
  passwordRequirements.querySelectorAll('li[data-rule]').forEach((li) => {
    const rule = li.dataset.rule;
    const met = PASSWORD_RULES[rule](value);
    li.classList.toggle('met', met);
    li.querySelector('.req-icon').textContent = met ? '✓' : '○';
    if (!met) allMet = false;
  });
  return allMet;
}

signupPassword.addEventListener('input', updatePasswordRequirements);

// Máscara de CPF (000.000.000-00). Validação real (dígito verificador
// e consulta a base oficial) fica para a integração com API futura.
signupCpf.addEventListener('input', () => {
  let digits = signupCpf.value.replace(/\D/g, '').slice(0, 11);
  digits = digits.replace(/(\d{3})(\d)/, '$1.$2');
  digits = digits.replace(/(\d{3})(\d)/, '$1.$2');
  digits = digits.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  signupCpf.value = digits;
});

toggleSignupPassword.addEventListener('click', () => {
  const isHidden = signupPassword.type === 'password';
  signupPassword.type = isHidden ? 'text' : 'password';
  toggleSignupPassword.textContent = isHidden ? '🙈' : '👁';
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const cpfDigits = signupCpf.value.replace(/\D/g, '');
  const name = signupName.value.trim();
  const email = signupEmail.value.trim();
  const rg = signupRg.value.trim();
  const birthDate = signupBirthDate.value;
  const password = signupPassword.value;
  const passwordConfirm = signupPasswordConfirm.value;

  // Validação básica de formato do CPF (11 dígitos). O dígito
  // verificador e a consulta oficial ficam para a integração com API.
  if (cpfDigits.length !== 11) {
    toast('Informe um CPF válido (11 dígitos).', 'error');
    return;
  }
  if (!updatePasswordRequirements()) {
    toast('A senha não atende a todos os requisitos.', 'error');
    return;
  }
  if (password !== passwordConfirm) {
    toast('As senhas não coincidem.', 'error');
    return;
  }

  signupBtn.disabled = true;
  signupBtn.textContent = 'Criando conta...';

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        cpf: cpfDigits,
        rg: rg || null,
        birth_date: birthDate || null,
      },
    },
  });

  signupBtn.disabled = false;
  signupBtn.textContent = 'Criar conta';

  if (error) {
    const msg = error.message === 'User already registered'
      ? 'Este e-mail já está cadastrado.'
      : error.message;
    toast(msg, 'error');
    return;
  }

  // Etapa 1 concluída e salva. Se já vier com sessão ativa, o próprio
  // onAuthStateChange assume e — ao detectar endereço vazio — abre a
  // Etapa 2 automaticamente. Sem sessão (confirmação de e-mail pendente),
  // avisamos e voltamos ao login; a Etapa 2 aparece no primeiro login.
  if (data.session) {
    toast('Conta criada com sucesso!', 'success');
  } else {
    toast('Conta criada! Verifique seu e-mail para confirmar. Depois de entrar, você completa o endereço (ou pula) em Mensagens.', 'success');
    showLoginCard();
  }
});

// ---------- Mensagens / Conta — pendência de endereço ----------
// O prompt automático foi trocado por um item persistente em "Mensagens"
// (e em Configurações > Conta), que só some quando o endereço é
// realmente preenchido — não é mais um popup único e descartável.
let currentUserRow = null;

async function refreshAccountState() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const { data } = await supabaseClient
    .from('users')
    .select('name, email, status, cep, street, city, created_at')
    .eq('id', user.id)
    .single();

  currentUserRow = data;
  renderMessages();
  renderSettingsAccount();
}

function hasIncompleteAddress() {
  return !!currentUserRow && !currentUserRow.cep && !currentUserRow.street && !currentUserRow.city;
}

function renderMessages() {
  const pending = hasIncompleteAddress();

  messagesBadge.style.display = pending ? '' : 'none';
  notifBadge.style.display = pending ? '' : 'none';

  if (!pending) {
    messagesList.innerHTML = `
      <div class="messages-empty">
        <div>✅</div>
        <p>Nenhuma mensagem pendente no momento.</p>
      </div>`;
    return;
  }

  messagesList.innerHTML = `
    <div class="message-card warning">
      <div class="message-card-icon">📍</div>
      <div class="message-card-body">
        <h4>Cadastro incompleto</h4>
        <p>Falta preencher seu endereço. Isso leva menos de um minuto e pode ser feito quando quiser.</p>
        <button class="btn btn-secondary" style="width:auto" id="messagesCompleteAddressBtn">Completar agora</button>
      </div>
    </div>`;

  document.getElementById('messagesCompleteAddressBtn').addEventListener('click', openAddressModal);
}

function renderSettingsAccount() {
  if (!currentUserRow) return;
  settingsAccountInfo.innerHTML = `
    <div><h5>Nome</h5><p>${currentUserRow.name || '—'}</p></div>
    <div><h5>E-mail</h5><p>${currentUserRow.email || '—'}</p></div>
    <div><h5>Status</h5><p>${currentUserRow.status || '—'}</p></div>
  `;
  settingsAddressPending.style.display = hasIncompleteAddress() ? '' : 'none';
}

// ---------- Configurações > Planos ----------
// Mostra o plano do contexto atual (pessoal ou empresa) e o quanto já foi
// usado dos limites — os números vêm de `plans`/`plan_limits`, nunca fixos
// no código (mesma regra usada na validação do backend).
function planUsageBarHtml(label, used, limit, enabled) {
  const unlimited = !enabled || limit == null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const near = !unlimited && used >= limit;
  return `
    <div class="plan-usage-item">
      <div class="plan-usage-item-head">
        <span>${label}</span>
        <span>${unlimited ? `${used} (sem limite)` : `${used} de ${limit}`}</span>
      </div>
      ${unlimited ? '' : `
        <div class="plan-usage-bar">
          <div class="plan-usage-bar-fill${near ? ' full' : ''}" style="width:${pct}%"></div>
        </div>
      `}
    </div>`;
}

async function loadPlanInfo() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  plansContextLabel.textContent = currentContext.type === 'personal'
    ? 'Plano da sua conta pessoal.'
    : `Plano da empresa ${currentContext.companyName}.`;

  planName.textContent = '—';
  planTypeBadge.textContent = '—';
  planUsageList.innerHTML = '';

  let plan = null;
  if (currentContext.type === 'personal') {
    const { data } = await supabaseClient
      .from('users')
      .select('plan_id, plans(id, name, code, type)')
      .eq('id', user.id)
      .single();
    plan = data?.plans || null;
  } else {
    const { data } = await supabaseClient
      .from('companies')
      .select('plan_id, plans(id, name, code, type)')
      .eq('id', currentContext.companyId)
      .single();
    plan = data?.plans || null;
  }

  if (!plan) {
    planName.textContent = 'Nenhum plano atribuído';
    return;
  }

  planName.textContent = plan.name;
  planTypeBadge.textContent = plan.type === 'PERSONAL' ? 'Pessoal' : 'Empresa';

  const { data: limits } = await supabaseClient
    .from('plan_limits')
    .select('resource, limit_value, enabled')
    .eq('plan_id', plan.id);

  const vehiclesLimit = limits?.find(l => l.resource === 'vehicles') || null;

  let vehiclesQuery = supabaseClient.from('vehicles').select('*', { count: 'exact', head: true });
  vehiclesQuery = currentContext.type === 'personal'
    ? vehiclesQuery.eq('personal_owner_user_id', user.id)
    : vehiclesQuery.eq('company_id', currentContext.companyId);
  const { count: vehiclesUsed } = await vehiclesQuery;

  let html = planUsageBarHtml('Veículos', vehiclesUsed || 0, vehiclesLimit?.limit_value ?? null, vehiclesLimit?.enabled ?? false);

  if (currentContext.type === 'company') {
    const usersLimit = limits?.find(l => l.resource === 'users') || null;
    const { count: usersUsed } = await supabaseClient
      .from('company_members')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', currentContext.companyId)
      .eq('status', 'active');
    html += planUsageBarHtml('Usuários', usersUsed || 0, usersLimit?.limit_value ?? null, usersLimit?.enabled ?? false);
  }

  planUsageList.innerHTML = html;
}

settingsCompleteAddressBtn.addEventListener('click', openAddressModal);

// ---------- Modal de endereço (aberto sob demanda: Mensagens ou Conta) ----------
function openAddressModal() {
  addressModal.classList.add('active');
}

function closeAddressModal() {
  addressModal.classList.remove('active');
}

addressSkipBtn.addEventListener('click', closeAddressModal);

addressModal.addEventListener('click', (e) => {
  if (e.target === addressModal) closeAddressModal();
});

// Máscara de CEP (00000-000). Reservado para, no futuro, ao perder o
// foco aqui, chamar a API do Google (Places/Geocoding) e autopreencher
// logradouro, bairro, cidade e estado.
addressCep.addEventListener('input', () => {
  let digits = addressCep.value.replace(/\D/g, '').slice(0, 8);
  digits = digits.replace(/(\d{5})(\d)/, '$1-$2');
  addressCep.value = digits;
});

addressForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const { error } = await supabaseClient
    .from('users')
    .update({
      cep: addressCep.value.replace(/\D/g, '') || null,
      street: addressStreet.value.trim() || null,
      address_number: addressNumber.value.trim() || null,
      complement: addressComplement.value.trim() || null,
      neighborhood: addressNeighborhood.value.trim() || null,
      city: addressCity.value.trim() || null,
      state: addressState.value || null,
    })
    .eq('id', user.id);

  if (error) {
    toast('Erro ao salvar endereço: ' + error.message, 'error');
    return;
  }

  toast('Endereço salvo com sucesso!', 'success');
  closeAddressModal();
  refreshAccountState();
});

// ---------- Administração (somente MASTER_ADMIN) ----------
// myAdminPermissions e restrictedAreaUnlocked ficam só em memória — nunca
// persistidos — porque a checagem de verdade é sempre refeita no banco
// (RLS): esconder um item aqui é UX, não é a barreira de segurança.
let myAdminPermissions = new Set();
let restrictedAreaUnlocked = false;
let pendingAdminPage = null;

async function checkAdminStatus() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const { data } = await supabaseClient
    .from('platform_admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  adminSection.style.display = data ? '' : 'none';

  if (data) {
    await loadMyAdminPermissions(user.id);
  } else {
    myAdminPermissions = new Set();
  }
}

async function loadMyAdminPermissions(userId) {
  const { data } = await supabaseClient
    .from('admin_permissions')
    .select('feature')
    .eq('user_id', userId);

  myAdminPermissions = new Set((data || []).map(p => p.feature));
  applyAdminPermissionsToSidebar();
}

// Mostra na sidebar do admin só as telas que essa pessoa tem permissão de
// ver. Novas telas do admin precisam entrar em ADMIN_FEATURES pra aparecer
// aqui também.
function applyAdminPermissionsToSidebar() {
  adminLayout.querySelectorAll('.sidebar-item[data-adminpage]').forEach((item) => {
    const feature = item.dataset.adminpage;
    item.style.display = myAdminPermissions.has(feature) ? '' : 'none';
  });
}

// ---------- Área Restrita — reautenticação por senha ----------
function openAdminUnlockModal() {
  adminUnlockForm.reset();
  adminUnlockModal.classList.add('active');
  adminUnlockPassword.focus();
}

function closeAdminUnlockModal() {
  adminUnlockModal.classList.remove('active');
  pendingAdminPage = null;
}

adminUnlockCancelBtn.addEventListener('click', closeAdminUnlockModal);
adminUnlockModal.addEventListener('click', (e) => {
  if (e.target === adminUnlockModal) closeAdminUnlockModal();
});

adminUnlockForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const password = adminUnlockPassword.value;

  adminUnlockSubmitBtn.disabled = true;
  adminUnlockSubmitBtn.textContent = 'Confirmando...';

  // Reautentica com a senha atual — não abre sessão nova, só confirma que
  // quem está no teclado agora sabe a senha de quem está logado.
  const { error } = await supabaseClient.auth.signInWithPassword({ email: user.email, password });

  adminUnlockSubmitBtn.disabled = false;
  adminUnlockSubmitBtn.textContent = 'Confirmar';

  if (error) {
    toast('Senha incorreta.', 'error');
    return;
  }

  restrictedAreaUnlocked = true;
  const target = pendingAdminPage;
  closeAdminUnlockModal();
  if (target) adminSwitchPage(target);
});

async function loadAdminData() {
  const [{ count: usersCount }, { count: companiesCount }, { count: vehiclesCount }] = await Promise.all([
    supabaseClient.from('users').select('*', { count: 'exact', head: true }),
    supabaseClient.from('companies').select('*', { count: 'exact', head: true }),
    supabaseClient.from('vehicles').select('*', { count: 'exact', head: true }),
  ]);

  adminStatUsers.textContent = usersCount ?? '—';
  adminStatCompanies.textContent = companiesCount ?? '—';
  adminStatVehicles.textContent = vehiclesCount ?? '—';

  const { data: companies } = await supabaseClient
    .from('companies')
    .select('name, status, created_at, plans(name)')
    .order('created_at', { ascending: false })
    .limit(20);

  adminCompaniesTable.innerHTML = (companies || []).map(c => `
    <tr>
      <td>${c.name}</td>
      <td>${c.plans?.name || '—'}</td>
      <td><span class="status-badge active">${c.status}</span></td>
      <td>${new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
    </tr>
  `).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--clr-gray-300)">Nenhuma empresa cadastrada.</td></tr>';

  const { data: users } = await supabaseClient
    .from('users')
    .select('name, email, status, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  adminUsersTable.innerHTML = (users || []).map(u => `
    <tr>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td><span class="status-badge active">${u.status}</span></td>
      <td>${new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
    </tr>
  `).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--clr-gray-300)">Nenhum usuário cadastrado.</td></tr>';
}

// ---------- Admin > Planos ----------
function formatPlanLimit(limits, planId, resource) {
  const limit = limits.find(l => l.plan_id === planId && l.resource === resource);
  if (!limit) return '—';
  return limit.enabled ? limit.limit_value : 'Sem limite';
}

async function loadAdminPlans() {
  const [{ data: plans }, { data: limits }] = await Promise.all([
    supabaseClient.from('plans').select('id, name, code, type, active').order('type').order('code'),
    supabaseClient.from('plan_limits').select('plan_id, resource, limit_value, enabled'),
  ]);

  adminPlansTable.innerHTML = (plans || []).map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.type === 'PERSONAL' ? 'Pessoal' : 'Empresa'}</td>
      <td>${formatPlanLimit(limits || [], p.id, 'vehicles')}</td>
      <td>${formatPlanLimit(limits || [], p.id, 'users')}</td>
      <td><span class="status-badge ${p.active ? 'active' : 'pending'}">${p.active ? 'Ativo' : 'Inativo'}</span></td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--clr-gray-300)">Nenhum plano cadastrado.</td></tr>';
}

// ---------- Navegação entre páginas ----------
function switchPage(page) {
  document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('page' + page.charAt(0).toUpperCase() + page.slice(1));
  if (target) target.classList.add('active');

  document.querySelectorAll('.sidebar-item[data-page]').forEach(i => i.classList.toggle('active', i.dataset.page === page));
  document.querySelectorAll('.sidebar-subitem').forEach(i => i.classList.toggle('active', i.dataset.page === page));

  const meta = PAGE_LABELS[page] || { title: page, crumb: page };
  pageTitle.textContent = meta.title;
  pageBreadcrumb.textContent = meta.crumb;

  if (page === 'messages' || page === 'settingsAccount') refreshAccountState();
  if (page === 'settingsPlans') loadPlanInfo();
  if (page === 'vehicles') loadVehicles();
  if (page === 'dashboard') loadDashboardStats();

  closeMobileSidebar();
}

document.querySelectorAll('[data-page]').forEach(el => {
  el.addEventListener('click', () => switchPage(el.dataset.page));
});

// Submenu "Configurações"
navSettings.addEventListener('click', () => {
  navSettings.classList.toggle('expanded');
  settingsSubmenu.classList.toggle('open');
});

// ---------- Navegação entre páginas (Admin) ----------
function adminSwitchPage(page) {
  adminLayout.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('adminPage' + page.charAt(0).toUpperCase() + page.slice(1));
  if (target) target.classList.add('active');

  adminLayout.querySelectorAll('.sidebar-item[data-adminpage]').forEach(i => i.classList.toggle('active', i.dataset.adminpage === page));

  const meta = ADMIN_PAGE_LABELS[page] || { title: page, crumb: page };
  adminPageTitle.textContent = meta.title;
  adminPageBreadcrumb.textContent = meta.crumb;

  if (page === 'apis') loadAutosaveKeySettings();
  if (page === 'plans') loadAdminPlans();
  if (page === 'team') loadTeam();
  if (page === 'communication') loadWhatsappRecipients();

  closeAdminMobileSidebar();
}

adminLayout.querySelectorAll('[data-adminpage]').forEach(el => {
  el.addEventListener('click', () => {
    const page = el.dataset.adminpage;
    // Área Restrita: pede senha de novo antes de entrar, uma vez por sessão.
    if (RESTRICTED_ADMIN_FEATURES.has(page) && !restrictedAreaUnlocked) {
      pendingAdminPage = page;
      openAdminUnlockModal();
      return;
    }
    adminSwitchPage(page);
  });
});

// ---------- Admin > APIs: chaves de integração (AUTOSAVE) ----------
// Guardadas em `integration_settings` (RLS: só MASTER_ADMIN lê/escreve) —
// nunca hardcoded aqui. As Edge Functions leem essas linhas com o service
// role, então salvar aqui já vale pra próxima chamada, sem precisar rodar
// `supabase secrets set` nem redeploy de nada. Uma linha por recurso — o
// AUTOSAVE exige uma chave por recurso (vehicles/customers), não dá pra
// unificar isso do lado de lá.
function setupIntegrationKeyField(rowName, ids) {
  const form = document.getElementById(ids.form);
  const input = document.getElementById(ids.input);
  const toggle = document.getElementById(ids.toggle);
  const status = document.getElementById(ids.status);
  const updatedAt = document.getElementById(ids.updatedAt);
  const saveBtn = document.getElementById(ids.saveBtn);

  toggle.addEventListener('click', () => {
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    toggle.textContent = isHidden ? '🙈' : '👁';
  });

  async function load() {
    status.textContent = 'Carregando...';
    status.className = 'status-badge pending';

    const { data, error } = await supabaseClient
      .from('integration_settings')
      .select('api_key, updated_at')
      .eq('name', rowName)
      .maybeSingle();

    if (error) {
      // Mais comum: usuário logado não é MASTER_ADMIN e a RLS bloqueou —
      // a tela Admin já devia ser inacessível pra esse caso, mas por
      // segurança a chave nunca aparece se a leitura falhar por qualquer motivo.
      status.textContent = 'Erro ao carregar';
      status.className = 'status-badge maintenance';
      updatedAt.textContent = error.message;
      return;
    }

    input.value = data?.api_key || '';
    input.type = 'password';
    toggle.textContent = '👁';

    if (data?.api_key) {
      status.textContent = 'Configurada';
      status.className = 'status-badge active';
      updatedAt.textContent = data.updated_at
        ? 'Atualizada em ' + new Date(data.updated_at).toLocaleString('pt-BR')
        : '';
    } else {
      status.textContent = 'Não configurada';
      status.className = 'status-badge pending';
      updatedAt.textContent = '';
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const apiKey = input.value.trim();
    if (!apiKey) {
      toast('Cole a chave antes de salvar.', 'error');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';

    const { error } = await supabaseClient
      .from('integration_settings')
      .upsert({ name: rowName, api_key: apiKey, updated_by: user.id, updated_at: new Date().toISOString() }, { onConflict: 'name' });

    saveBtn.disabled = false;
    saveBtn.textContent = 'Salvar chave';

    if (error) {
      toast('Erro ao salvar a chave: ' + error.message, 'error');
      return;
    }

    toast('Chave salva com sucesso!', 'success');
    load();
  });

  return { load };
}

const autosaveVehiclesKeyField = setupIntegrationKeyField('AUTOSAVE', {
  form: 'autosaveKeyForm', input: 'autosaveApiKey', toggle: 'toggleAutosaveKey',
  status: 'autosaveKeyStatus', updatedAt: 'autosaveKeyUpdatedAt', saveBtn: 'autosaveKeySaveBtn',
});

const autosaveCustomersKeyField = setupIntegrationKeyField('AUTOSAVE_CUSTOMERS', {
  form: 'autosaveCustomersKeyForm', input: 'autosaveCustomersApiKey', toggle: 'toggleAutosaveCustomersKey',
  status: 'autosaveCustomersKeyStatus', updatedAt: 'autosaveCustomersKeyUpdatedAt', saveBtn: 'autosaveCustomersKeySaveBtn',
});

function loadAutosaveKeySettings() {
  autosaveVehiclesKeyField.load();
  autosaveCustomersKeyField.load();
}

// ---------- Admin > Comunicação ----------
// Abas (só WhatsApp por enquanto, desenhado pra caber mais canais depois
// sem reescrever a navegação). "channel" é o data-commtab do botão, cada um
// tem um painel com o mesmo sufixo em CamelCase (whatsapp -> commTabWhatsapp).
document.querySelectorAll('.comm-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.comm-tab').forEach((t) => t.classList.toggle('active', t === tab));
    const channel = tab.dataset.commtab;
    document.querySelectorAll('.comm-tab-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === 'commTab' + channel.charAt(0).toUpperCase() + channel.slice(1));
    });
  });
});
document.querySelector('.comm-tab.active')?.click();

// Número de WhatsApp por tipo de aviso (`whatsapp_notification_recipients`,
// RLS: só MASTER_ADMIN). Lista dirigida pelos DADOS, não pelo código — um
// tipo de aviso novo é uma linha nova no banco, nunca precisa mexer aqui.
// Quem for disparar um aviso lê o `phone_number` desta tabela pelo
// `type_key` dele, igual ao padrão já usado pra chave de API do AUTOSAVE.
const whatsappRecipientsList = document.getElementById('whatsappRecipientsList');

async function loadWhatsappRecipients() {
  whatsappRecipientsList.innerHTML = '<div class="empty-state"><div>⏳</div><p>Carregando...</p></div>';

  const { data, error } = await supabaseClient
    .from('whatsapp_notification_recipients')
    .select('id, type_key, label, description, phone_number')
    .order('label');

  if (error) {
    whatsappRecipientsList.innerHTML = `<div class="empty-state"><div>⚠</div><p>Erro ao carregar: ${error.message}</p></div>`;
    return;
  }

  if (!data || data.length === 0) {
    whatsappRecipientsList.innerHTML = '<div class="empty-state"><div>💬</div><p>Nenhum tipo de aviso cadastrado ainda.</p></div>';
    return;
  }

  whatsappRecipientsList.innerHTML = data.map((row) => `
    <div class="whatsapp-recipient-row" data-id="${row.id}">
      <div class="form-group">
        <label class="form-label">${row.label}</label>
        <input
          class="form-input whatsapp-recipient-input"
          type="tel"
          placeholder="5511999999999"
          value="${row.phone_number || ''}"
        >
        ${row.description ? `<small style="display:block; margin-top:4px; color:var(--clr-gray-300);">${row.description}</small>` : ''}
      </div>
      <button type="button" class="btn btn-secondary whatsapp-recipient-save" style="width:auto">Salvar</button>
    </div>
  `).join('');
}

whatsappRecipientsList.addEventListener('click', async (e) => {
  const btn = e.target.closest('.whatsapp-recipient-save');
  if (!btn) return;

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const row = btn.closest('.whatsapp-recipient-row');
  const id = row.dataset.id;
  const input = row.querySelector('.whatsapp-recipient-input');
  const phone = input.value.trim().replace(/\D/g, '');

  if (phone && phone.length < 10) {
    toast('Número inválido — use DDI+DDD+número, só dígitos (ex: 5511999999999).', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Salvando...';

  const { error } = await supabaseClient
    .from('whatsapp_notification_recipients')
    .update({ phone_number: phone || null, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq('id', id);

  btn.disabled = false;
  btn.textContent = 'Salvar';

  if (error) {
    toast('Erro ao salvar: ' + error.message, 'error');
    return;
  }

  input.value = phone;
  toast('Número salvo com sucesso!', 'success');
});

// ---------- Sidebar mobile ----------
function openMobileSidebar() {
  sidebar.classList.add('mobile-open');
  sidebarOverlay.classList.add('active');
}
function closeMobileSidebar() {
  sidebar.classList.remove('mobile-open');
  sidebarOverlay.classList.remove('active');
}
hamburgerBtn.addEventListener('click', openMobileSidebar);
sidebarOverlay.addEventListener('click', closeMobileSidebar);

// ---------- Sidebar mobile (Admin) ----------
function openAdminMobileSidebar() {
  adminSidebar.classList.add('mobile-open');
  adminSidebarOverlay.classList.add('active');
}
function closeAdminMobileSidebar() {
  adminSidebar.classList.remove('mobile-open');
  adminSidebarOverlay.classList.remove('active');
}
adminHamburgerBtn.addEventListener('click', openAdminMobileSidebar);
adminSidebarOverlay.addEventListener('click', closeAdminMobileSidebar);

// ---------- Logout ----------
logoutBtn.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  toast('Você saiu do sistema.', 'success');
});

// ---------- Criar Empresa ----------
// Usa a RPC create_company (Fase 1), que já cria a empresa e vincula quem
// chamou como COMPANY_OWNER atomicamente, no plano COMPANY_FREE (upgrade
// de plano fica para uma fase futura). Só os campos que existem de fato em
// `companies` — sem tipo/responsável/base, que nunca foram persistidos.
companyDocument.addEventListener('input', () => {
  let digits = companyDocument.value.replace(/\D/g, '').slice(0, 14);
  digits = digits.replace(/(\d{2})(\d)/, '$1.$2');
  digits = digits.replace(/(\d{3})(\d)/, '$1.$2');
  digits = digits.replace(/(\d{3})(\d)/, '$1/$2');
  digits = digits.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  companyDocument.value = digits;
});

createCompanyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const { data, error } = await supabaseClient.rpc('create_company', {
    _name: document.getElementById('companyName').value.trim(),
    _legal_name: document.getElementById('companyLegalName').value.trim() || null,
    _document: companyDocument.value.replace(/\D/g, '') || null,
    _email: document.getElementById('companyEmail').value.trim() || null,
    _phone: document.getElementById('companyPhone').value.trim() || null,
  });

  if (error) {
    const msg = error.message.includes('companies_document_unique')
      ? 'Já existe uma empresa cadastrada com este CNPJ.'
      : 'Erro ao criar empresa: ' + error.message;
    toast(msg, 'error');
    return;
  }

  toast('Empresa criada com sucesso! Você é o proprietário.', 'success');
  createCompanyForm.reset();

  // Já entra automaticamente no ambiente da empresa recém-criada.
  await loadMyCompanies();
  setContext(data.id);
  switchPage('vehicles');
});

// ---------- Buscar dados da placa (integração AUTOSAVE) ----------
// Chama a Edge Function `lookup-plate` (supabase/functions/lookup-plate) em
// vez do AUTOSAVE direto — ela é quem guarda a x-api-key como secret, o
// frontend nunca vê essa chave. Preenche marca/modelo/ano/cor/combustível/
// chassi automaticamente; o usuário só confere e completa o resto.
const lookupPlateBtn = document.getElementById('lookupPlateBtn');
const lookupPlateStatus = document.getElementById('lookupPlateStatus');

const BRAND_SELECT_BY_NAME = {
  CHEVROLET: 'chevrolet',
  FIAT: 'fiat',
  FORD: 'ford',
  HONDA: 'honda',
  HYUNDAI: 'hyundai',
  JEEP: 'jeep',
  'MERCEDES-BENZ': 'mercedes',
  MERCEDES: 'mercedes',
  NISSAN: 'nissan',
  RENAULT: 'renault',
  TOYOTA: 'toyota',
  VOLKSWAGEN: 'volkswagen',
  VW: 'volkswagen',
};

const FUEL_SELECT_BY_NAME = {
  FLEX: 'flex',
  GASOLINA: 'gasolina',
  ETANOL: 'etanol',
  ALCOOL: 'etanol',
  DIESEL: 'diesel',
  ELETRICO: 'eletrico',
  HIBRIDO: 'hibrido',
};

lookupPlateBtn?.addEventListener('click', async () => {
  const plateInput = document.getElementById('vehiclePlate');
  const plate = plateInput.value.trim();

  if (!plate) {
    toast('Digite a placa antes de buscar.', 'error');
    return;
  }

  lookupPlateBtn.disabled = true;
  lookupPlateBtn.textContent = 'Buscando...';
  lookupPlateStatus.textContent = '';

  try {
    const { data, error } = await supabaseClient.functions.invoke('lookup-plate', {
      body: { plate },
    });

    if (error) {
      toast('Erro ao buscar a placa: ' + error.message, 'error');
      lookupPlateStatus.textContent = 'Não foi possível buscar — preencha manualmente.';
      return;
    }

    if (!data?.found || !data.vehicle) {
      lookupPlateStatus.textContent = 'Placa não encontrada — preencha manualmente.';
      return;
    }

    const v = data.vehicle;

    if (v.brand) {
      const brandValue = BRAND_SELECT_BY_NAME[v.brand.toUpperCase()] || 'other';
      document.getElementById('vehicleBrand').value = brandValue;
    }
    if (v.model) document.getElementById('vehicleModel').value = v.model;
    if (v.year) document.getElementById('vehicleYear').value = v.year;
    if (v.color) document.getElementById('vehicleColor').value = v.color;
    if (v.chassis) document.getElementById('vehicleChassis').value = v.chassis;
    if (v.fuel_type) {
      const fuelValue = FUEL_SELECT_BY_NAME[v.fuel_type.toUpperCase()];
      if (fuelValue) document.getElementById('vehicleFuel').value = fuelValue;
    }

    lookupPlateStatus.textContent = 'Dados preenchidos automaticamente — confira antes de salvar.';
    toast('Placa encontrada! Dados preenchidos.', 'success');
  } catch (err) {
    toast('Erro ao buscar a placa: ' + err.message, 'error');
    lookupPlateStatus.textContent = 'Não foi possível buscar — preencha manualmente.';
  } finally {
    lookupPlateBtn.disabled = false;
    lookupPlateBtn.textContent = 'Buscar';
  }
});

// ---------- Cadastrar / Editar Veículo ----------
// O contexto selecionado é quem decide onde o veículo é gravado — nunca
// mais uma decisão automática por o usuário administrar (ou não) alguma
// empresa. "Minha Conta" → pessoal; empresa selecionada → corporativo.
registerVehicleForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const payload = {
    brand: document.getElementById('vehicleBrand').value,
    model: document.getElementById('vehicleModel').value.trim(),
    year: Number(document.getElementById('vehicleYear').value) || null,
    plate: document.getElementById('vehiclePlate').value.trim().toUpperCase(),
    color: document.getElementById('vehicleColor').value.trim() || null,
    current_odometer: Number(document.getElementById('vehicleKm').value) || 0,
    fuel_type: document.getElementById('vehicleFuel').value || null,
    chassis: document.getElementById('vehicleChassis').value.trim() || null,
    renavam: document.getElementById('vehicleRenavam').value.trim() || null,
  };

  if (editingVehicleId) {
    const { error } = await supabaseClient.from('vehicles').update(payload).eq('id', editingVehicleId);
    if (error) {
      toast('Erro ao salvar alterações: ' + error.message, 'error');
      return;
    }
    toast('Veículo atualizado com sucesso!', 'success');
  } else {
    if (currentContext.type === 'company') {
      payload.company_id = currentContext.companyId;
    } else {
      payload.personal_owner_user_id = user.id;
    }

    const { error } = await supabaseClient.from('vehicles').insert(payload);
    if (error) {
      // O limite de veículos do plano é validado no banco (trigger
      // check_vehicle_plan_limit) — a mensagem já vem pronta para o usuário.
      toast(
        error.message.includes('Limite de veículos')
          ? error.message
          : 'Erro ao cadastrar veículo: ' + error.message,
        'error'
      );
      return;
    }
    toast('Veículo cadastrado com sucesso!', 'success');
  }

  registerVehicleForm.reset();
  editingVehicleId = null;
  switchPage('vehicles');
  loadDashboardStats();
});

// ---------- Admin > Equipe (Área Restrita) ----------
// Preenche os checkboxes do formulário "Adicionar membro" a partir de
// ADMIN_FEATURES, pra não duplicar a lista em dois lugares do HTML.
teamAddPermissions.innerHTML = ADMIN_FEATURES.map(f => `
  <label><input type="checkbox" value="${f.code}"> ${f.label}</label>
`).join('');

async function loadTeam() {
  teamMembersList.innerHTML = '<div class="empty-state"><div>⏳</div><p>Carregando equipe...</p></div>';

  const [{ data: members, error: membersError }, { data: perms }] = await Promise.all([
    supabaseClient.from('platform_admins').select('user_id, users(name, email)'),
    supabaseClient.from('admin_permissions').select('user_id, feature'),
  ]);

  if (membersError) {
    toast('Erro ao carregar a equipe: ' + membersError.message, 'error');
    teamMembersList.innerHTML = '';
    return;
  }

  renderTeam(members || [], perms || []);
}

function renderTeam(members, perms) {
  if (members.length === 0) {
    teamMembersList.innerHTML = `
      <div class="empty-state">
        <div>👥</div>
        <p>Nenhum membro na equipe ainda.</p>
      </div>`;
    return;
  }

  teamMembersList.innerHTML = members.map(m => {
    const name = m.users?.name || '—';
    const email = m.users?.email || '—';
    const initials = name.slice(0, 2).toUpperCase();
    const granted = new Set(perms.filter(p => p.user_id === m.user_id).map(p => p.feature));

    const checks = ADMIN_FEATURES.map(f => `
      <label>
        <input type="checkbox" data-user="${m.user_id}" data-feature="${f.code}" ${granted.has(f.code) ? 'checked' : ''}>
        ${f.label}
      </label>
    `).join('');

    return `
      <div class="team-member-card">
        <div class="team-member-avatar">${initials}</div>
        <div class="team-member-info">
          <h4>${name}</h4>
          <span>${email}</span>
        </div>
        <div class="team-member-permissions">${checks}</div>
        <button class="btn-icon-action danger" data-remove-member="${m.user_id}" title="Remover da equipe">🗑</button>
      </div>`;
  }).join('');
}

// Concede/revoga permissão marcando/desmarcando o checkbox (presença da
// linha em admin_permissions = permissão concedida).
teamMembersList.addEventListener('change', async (e) => {
  const cb = e.target.closest('input[type="checkbox"][data-feature]');
  if (!cb) return;

  const targetUserId = cb.dataset.user;
  const feature = cb.dataset.feature;

  if (cb.checked) {
    const { error } = await supabaseClient
      .from('admin_permissions')
      .insert({ user_id: targetUserId, feature });
    if (error) {
      toast('Erro ao conceder permissão: ' + error.message, 'error');
      cb.checked = false;
      return;
    }
    toast('Permissão concedida.', 'success');
  } else {
    const { error } = await supabaseClient
      .from('admin_permissions')
      .delete()
      .eq('user_id', targetUserId)
      .eq('feature', feature);
    if (error) {
      toast('Erro ao revogar permissão: ' + error.message, 'error');
      cb.checked = true;
      return;
    }
    toast('Permissão revogada.', 'success');
  }

  // Se mexi nas minhas próprias permissões, minha sidebar tem que refletir
  // isso na hora (posso ter acabado de tirar minha própria visão de uma tela).
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (user && targetUserId === user.id) {
    await loadMyAdminPermissions(user.id);
  }
});

// Remove alguém da equipe por completo (platform_admins + permissões).
teamMembersList.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-remove-member]');
  if (!btn) return;

  const targetUserId = btn.dataset.removeMember;
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (user && targetUserId === user.id) {
    toast('Você não pode remover a si mesmo da equipe.', 'error');
    return;
  }

  if (!confirm('Remover esta pessoa da equipe? Ela perde todo o acesso ao painel administrativo.')) return;

  await supabaseClient.from('admin_permissions').delete().eq('user_id', targetUserId);
  const { error } = await supabaseClient.from('platform_admins').delete().eq('user_id', targetUserId);

  if (error) {
    toast('Erro ao remover da equipe: ' + error.message, 'error');
    return;
  }

  toast('Membro removido da equipe.', 'success');
  loadTeam();
});

// Adiciona alguém que já tem conta no FleetControl à equipe do admin,
// já com as permissões marcadas no formulário.
teamAddForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = teamMemberEmail.value.trim();
  const features = Array.from(teamAddPermissions.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);

  const { data: foundUser } = await supabaseClient
    .from('users')
    .select('id, name, email')
    .eq('email', email)
    .maybeSingle();

  if (!foundUser) {
    toast('Nenhuma conta encontrada com esse e-mail. A pessoa precisa se cadastrar no FleetControl primeiro.', 'error');
    return;
  }

  const { data: masterRole } = await supabaseClient
    .from('roles')
    .select('id')
    .eq('code', 'MASTER_ADMIN')
    .single();

  const { error: adminError } = await supabaseClient
    .from('platform_admins')
    .insert({ user_id: foundUser.id, role_id: masterRole.id });

  // Já fazer parte da equipe não é erro fatal aqui — só seguimos pra
  // atualizar as permissões marcadas.
  if (adminError && !adminError.message.toLowerCase().includes('duplicate')) {
    toast('Erro ao adicionar à equipe: ' + adminError.message, 'error');
    return;
  }

  if (features.length > 0) {
    const rows = features.map(feature => ({ user_id: foundUser.id, feature }));
    const { error: permError } = await supabaseClient.from('admin_permissions').insert(rows);
    if (permError && !permError.message.toLowerCase().includes('duplicate')) {
      toast('Membro adicionado, mas houve erro ao conceder permissões: ' + permError.message, 'error');
    }
  }

  toast(`${foundUser.name} adicionado(a) à equipe!`, 'success');
  teamAddForm.reset();
  loadTeam();
});
