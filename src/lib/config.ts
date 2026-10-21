export const AppConfig = {
  PORTAL_NAME: process.env.PORTAL_NAME || 'E-SPb PPDB',
  SECTOR_NAME: process.env.SECTOR_NAME || 'Sektor Pembelajaran',
  DISTRICT: process.env.DISTRICT || 'Pejabat Pendidikan Daerah Beluran',
  STATE: process.env.STATE || 'Sabah',
  MINISTRY: process.env.MINISTRY || 'Kementerian Pendidikan Malaysia',
  CONTACT_EMAIL: process.env.CONTACT_EMAIL || 'ppd.beluran@moe.gov.my',
  CONTACT_PHONE: process.env.CONTACT_PHONE || '089-511 503',
  ADDRESS: process.env.ADDRESS || 'Pejabat Pendidikan Daerah Beluran, Peti Surat 27, 90107 Beluran, Sabah, Malaysia',
  LOGO_URL: process.env.LOGO_URL || 'https://lh3.googleusercontent.com/d/1uM0wo3a7aAZKBZn6RHkFjF8PtyXwGSQL',
  JATA_NEGARA_URL: process.env.JATA_NEGARA_URL || 'https://lh3.googleusercontent.com/d/1aJu8cjo7In9r4i0BS0V9j5gs8hwYddu1',
  E_KEBERADAAN_URL: process.env.E_KEBERADAAN_URL || 'https://script.google.com/macros/s/AKfycbwDy8XuqQHxgfoptFV_oLNlSiawkdwXk_LC46BKWnsreUW0P7piXMC4cfDC6ENYZl3F/exec',
  CARTA_ORGANISASI_URL: process.env.CARTA_ORGANISASI_URL || 'https://drive.google.com/file/d/1ZSLgfUdeoVafSvHljagRPIXaqRpPxeP4/preview',
  
  SPREADSHEET_ID: process.env.GOOGLE_SPREADSHEET_ID || '',
  DRIVE_ROOT_FOLDER_ID: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '',

  SHEET_HEBAHAN: 'Hebahan',
  SHEET_HERO_ALBUM: 'Hero Album',
  SHEET_AUDIT_LOG: 'Audit Log',
  SHEET_UNITS: 'Units',
  SHEET_UNIT_CATEGORIES: 'UnitCategories',
  SHEET_UNIT_CONTENT: 'UnitContent',
  SHEET_EMPLOYEES: 'Employees',
  SHEET_DOCUMENTS: 'Documents',
  SHEET_SETTINGS: 'Settings',
  SHEET_PERKHIDMATAN: 'Perkhidmatan',

  SESSION_DURATION_HOURS: Number(process.env.SESSION_DURATION_HOURS) || 4,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_MINUTES: 15,
};

export function getPublicPortalMeta() {
  return {
    portalName: AppConfig.PORTAL_NAME,
    sectorName: AppConfig.SECTOR_NAME,
    district: AppConfig.DISTRICT,
    state: AppConfig.STATE,
    ministry: AppConfig.MINISTRY,
    contactEmail: AppConfig.CONTACT_EMAIL,
    contactPhone: AppConfig.CONTACT_PHONE,
    address: AppConfig.ADDRESS,
    espbLogoUrl: AppConfig.LOGO_URL,
    jataNegaraUrl: AppConfig.JATA_NEGARA_URL,
    eKeberadaanUrl: AppConfig.E_KEBERADAAN_URL,
    cartaOrganisasiUrl: AppConfig.CARTA_ORGANISASI_URL,
    currentYear: new Date().getFullYear(),
  };
}
