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

const navVehicles = document.getElementById('navVehicles');
const vehiclesSubmenu = document.getElementById('vehiclesSubmenu');

const createFleetForm = document.getElementById('createFleetForm');
const registerVehicleForm = document.getElementById('registerVehicleForm');

// Mensagens / Admin / Conta
const messagesList = document.getElementById('messagesList');
const messagesBadge = document.getElementById('messagesBadge');
const notifBadge = document.getElementById('notifBadge');
const adminSection = document.getElementById('adminSection');
const settingsAccountInfo = document.getElementById('settingsAccountInfo');
const settingsAddressPending = document.getElementById('settingsAddressPending');
const settingsCompleteAddressBtn = document.getElementById('settingsCompleteAddressBtn');
const adminStatUsers = document.getElementById('adminStatUsers');
const adminStatCompanies = document.getElementById('adminStatCompanies');
const adminStatVehicles = document.getElementById('adminStatVehicles');
const adminCompaniesTable = document.getElementById('adminCompaniesTable');
const adminUsersTable = document.getElementById('adminUsersTable');

const PAGE_LABELS = {
  dashboard: { title: 'Dashboard', crumb: 'Início › Dashboard' },
  messages: { title: 'Mensagens', crumb: 'Início › Mensagens' },
  createFleet: { title: 'Criar Nova Frota', crumb: 'Início › Cadastrar Veículo › Criar Frota' },
  registerVehicle: { title: 'Cadastrar Veículo Particular', crumb: 'Início › Cadastrar Veículo › Particular' },
  maintenance: { title: 'Manutenções', crumb: 'Início › Manutenções' },
  reports: { title: 'Relatórios', crumb: 'Início › Relatórios' },
  settings: { title: 'Configurações', crumb: 'Início › Configurações' },
};

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
}

function showAdminLayout() {
  appLayout.classList.remove('active');
  adminLayout.classList.add('active');
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

async function loadDashboardStats() {
  // Sem filtro: a RLS já restringe automaticamente aos veículos
  // (pessoais + das empresas) que o usuário autenticado pode ver.
  const { count } = await supabaseClient
    .from('vehicles')
    .select('*', { count: 'exact', head: true });

  const statValue = document.querySelector('#pageDashboard .stat-card .stat-value');
  if (statValue && typeof count === 'number') {
    statValue.textContent = count;
  }
}

// ---------- Sessão ----------
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    showApp();
    loadProfile(session.user);
    loadDashboardStats();
    refreshAccountState();
    checkAdminStatus();
  } else {
    showAuth();
  }
});

async function init() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session?.user) {
    showApp();
    loadProfile(session.user);
    loadDashboardStats();
    refreshAccountState();
    checkAdminStatus();
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
async function checkAdminStatus() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const { data } = await supabaseClient
    .from('platform_admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  adminSection.style.display = data ? '' : 'none';
}

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

  if (page === 'messages' || page === 'settings') refreshAccountState();

  closeMobileSidebar();
}

document.querySelectorAll('[data-page]').forEach(el => {
  el.addEventListener('click', () => switchPage(el.dataset.page));
});

// Submenu "Cadastrar Veículo"
navVehicles.addEventListener('click', () => {
  navVehicles.classList.toggle('expanded');
  vehiclesSubmenu.classList.toggle('open');
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

// ---------- Logout ----------
logoutBtn.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  toast('Você saiu do sistema.', 'success');
});

// ---------- Criar Empresa ----------
// (formulário ainda rotulado "Criar Frota" na tela; usa a RPC create_company
//  da Fase 1 — campos de tipo/responsável/base ainda não existem no schema
//  de empresas e serão tratados numa fase futura de UI)
createFleetForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const { error } = await supabaseClient.rpc('create_company', {
    _name: document.getElementById('fleetName').value.trim(),
    _phone: document.getElementById('fleetPhone').value.trim() || null,
  });

  if (error) {
    toast('Erro ao criar empresa: ' + error.message, 'error');
    return;
  }

  toast('Empresa criada com sucesso! Você é o proprietário (COMPANY_OWNER).', 'success');
  createFleetForm.reset();
  switchPage('dashboard');
});

// ---------- Cadastrar Veículo ----------
// Decide automaticamente pessoal x corporativo: se o usuário for
// dono/admin/gestor de alguma empresa, o veículo entra na empresa;
// caso contrário é pessoal. Um seletor explícito de empresa fica para
// a fase de UI (usuário pode ter vínculo com mais de uma empresa).
registerVehicleForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const { data: memberships } = await supabaseClient
    .from('company_members')
    .select('company_id, roles(code)')
    .eq('user_id', user.id)
    .eq('status', 'active');

  const managingCompany = memberships?.find(m =>
    ['COMPANY_OWNER', 'COMPANY_ADMIN', 'FLEET_MANAGER'].includes(m.roles?.code)
  );

  const payload = {
    brand: document.getElementById('vehicleBrand').value,
    model: document.getElementById('vehicleModel').value.trim(),
    year: Number(document.getElementById('vehicleYear').value) || null,
    plate: document.getElementById('vehiclePlate').value.trim(),
    color: document.getElementById('vehicleColor').value.trim(),
    current_odometer: Number(document.getElementById('vehicleKm').value) || 0,
    fuel_type: document.getElementById('vehicleFuel').value || null,
    chassis: document.getElementById('vehicleChassis').value.trim() || null,
  };

  if (managingCompany) {
    payload.company_id = managingCompany.company_id;
  } else {
    payload.personal_owner_user_id = user.id;
  }

  const { error } = await supabaseClient.from('vehicles').insert(payload);
  if (error) {
    toast('Erro ao cadastrar veículo: ' + error.message, 'error');
    return;
  }

  toast('Veículo cadastrado com sucesso!', 'success');
  registerVehicleForm.reset();
  switchPage('dashboard');
  loadDashboardStats();
});
