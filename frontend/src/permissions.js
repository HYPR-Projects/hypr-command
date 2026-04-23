// ══════════════════════════════════════════════════════════════════════════════
// PERMISSIONS SYSTEM - HYPR Command
// ══════════════════════════════════════════════════════════════════════════════

export const ADMINS = [
  'matheus.machado@hypr.mobi',
  'cesar.moura@hypr.mobi',
  'adrian.ferguson@hypr.mobi',
  'mateus.lambranho@hypr.mobi',
  'gian.nardo@hypr.mobi',
];

export const SALES_TEAM = [
  'danilo.pereira@hypr.mobi',
  'eduarda.bolzan@hypr.mobi',
  'camila.tenorio@hypr.mobi',
  'egle.stein@hypr.mobi',
  'alexandra.perez@hypr.mobi',
  'karol.siqueira@hypr.mobi',
  'pablo.souza@hypr.mobi',
  'larissa.reis@hypr.mobi',
  'marcelo.nogueira@hypr.mobi',
];

/**
 * Verifica se o usuário tem acesso ao Proposal Builder
 * @param {string} email - Email do usuário
 * @returns {boolean}
 */
export const hasProposalAccess = (email) => {
  if (!email) return false;
  return ADMINS.includes(email) || SALES_TEAM.includes(email);
};

/**
 * Verifica se o usuário é admin (tem acesso total ao sistema)
 * @param {string} email - Email do usuário
 * @returns {boolean}
 */
export const isAdmin = (email) => {
  if (!email) return false;
  return ADMINS.includes(email);
};

/**
 * Verifica se o usuário é vendedor (CP)
 * @param {string} email - Email do usuário
 * @returns {boolean}
 */
export const isSalesTeam = (email) => {
  if (!email) return false;
  return SALES_TEAM.includes(email);
};
