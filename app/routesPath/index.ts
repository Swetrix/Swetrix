const routes = Object.freeze({
  signin: '/login',
  signup: '/signup',
  performance: '/performance',
  errorTracking: '/error-tracking',
  confirm_email: '/confirm-email',
  reset_password: '/recovery',
  new_password_form: '/password-reset/:id',
  confirm_share: '/share/:id',
  confirm_subcription: '/projects/:id/subscribers/invite',
  main: '/',
  dashboard: '/dashboard',
  user_settings: '/user-settings',
  verify: '/verify/:id',
  change_email: '/change-email/:id',
  new_project: '/projects/new',
  new_captcha: '/captchas/new',
  project_settings: '/projects/settings/:id',
  captcha_settings: '/captchas/settings/:id',
  project: '/projects/:id',
  captcha: '/captchas/:id',
  billing: '/billing',
  privacy: '/privacy',
  cookiePolicy: '/cookie-policy',
  terms: '/terms',
  contact: '/contact',
  changelog: '/changelog',
  about: '/about',
  create_alert: '/projects/:pid/alerts/create',
  alert_settings: '/projects/:pid/alerts/settings/:id',
  press: '/press',
  transfer_confirm: '/project/transfer/confirm',
  transfer_reject: '/project/transfer/cancel',
  socialised: '/socialised',
  project_protected_password: '/projects/:id/password',
  open: '/open',
  ref: '/ref/:id',
  blog: '/blog',
  imprint: '/imprint',
})

export default routes
