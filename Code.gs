/**
 * ============================================================================
 * E-SPb PPDB — Sektor Pembelajaran PPD Beluran
 * Production Consolidated Server Runtime v2.0
 * Database-driven architecture with full CMS & Google Drive Integration
 * ============================================================================
 */

/**
 * ============================================================================
 * INSIALISASI GOOGLE DRIVE & DATABASE (FUNGSI UTAMA MANUAL APPS SCRIPT)
 * Jalankan fungsi ini terus dari editor Apps Script:
 * 1. Pilih 'setupMyGoogleDrive' pada dropdown fungsi di bar atas editor.
 * 2. Klik butang 'Run' (Jalankan).
 * 3. Berikan kebenaran (Review permissions) kepada akaun Google anda.
 * Sistem akan mencipta semua folder Unit/Sektor, Hebahan, Hero Album, Pegawai, Dokumen,
 * serta fail Google Spreadsheet ESPB_Master_Database di Google Drive anda secara automatik!
 * ============================================================================
 */
function setupMyGoogleDrive() {
  return runSetup();
}

// ============================================================================
// 1. CONFIGURATION
// ============================================================================
const AppConfig = (function() {
  const DEFAULTS = {
    PORTAL_NAME: 'E-SPb PPDB',
    SECTOR_NAME: 'Sektor Pembelajaran',
    DISTRICT: 'Pejabat Pendidikan Daerah Beluran',
    STATE: 'Sabah',
    MINISTRY: 'Kementerian Pendidikan Malaysia',
    CONTACT_EMAIL: 'ppd.beluran@moe.gov.my',
    CONTACT_PHONE: '089-511 503',
    ADDRESS: 'Pejabat Pendidikan Daerah Beluran, Peti Surat 27, 90107 Beluran, Sabah, Malaysia',
    LOGO_URL: 'https://lh3.googleusercontent.com/d/1uM0wo3a7aAZKBZn6RHkFjF8PtyXwGSQL',
    JATA_NEGARA_URL: 'https://lh3.googleusercontent.com/d/1aJu8cjo7In9r4i0BS0V9j5gs8hwYddu1',
    E_KEBERADAAN_URL: 'https://script.google.com/macros/s/AKfycbwDy8XuqQHxgfoptFV_oLNlSiawkdwXk_LC46BKWnsreUW0P7piXMC4cfDC6ENYZl3F/exec',
    CARTA_ORGANISASI_URL: 'https://drive.google.com/file/d/1plKZgpVPVOWggd_LS1O9TabTHYkqeU_T/view?usp=sharing',
    SPREADSHEET_ID: '',
    DRIVE_ROOT_FOLDER_ID: '',
    DRIVE_IMAGES_FOLDER_ID: '',
    DRIVE_DOCUMENTS_FOLDER_ID: '',
    DRIVE_DATABASE_FOLDER_ID: '',
    DRIVE_UNITS_FOLDER_ID: '',
    DRIVE_HEBAHAN_FOLDER_ID: '',
    DRIVE_HERO_FOLDER_ID: '',
    DRIVE_EMPLOYEES_FOLDER_ID: '',
    DRIVE_UPLOADS_FOLDER_ID: '',
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
    SESSION_DURATION_HOURS: 1,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_MINUTES: 15,
    CACHE_TTL_PUBLIC_DATA: 60,
    CACHE_TTL_DRIVE_DOCS: 1800
  };

  function get(key) {
    if (key === 'CARTA_ORGANISASI_URL' || key === 'E_KEBERADAAN_URL') {
      try {
        if (typeof SettingsRepository !== 'undefined' && SettingsRepository.getSetting) {
          var sheetVal = SettingsRepository.getSetting(key);
          if (sheetVal && String(sheetVal).trim() !== '') return String(sheetVal).trim();
        }
      } catch (e) {}
    }
    try {
      var props = PropertiesService.getScriptProperties();
      var val = props.getProperty(key);
      if (val !== null && val !== undefined && val !== '') return val;
    } catch (e) {}
    return DEFAULTS[key] !== undefined ? DEFAULTS[key] : '';
  }

  function set(key, value) {
    PropertiesService.getScriptProperties().setProperty(key, String(value));
  }

  function getAll() {
    var result = {};
    var keys = Object.keys(DEFAULTS);
    for (var i = 0; i < keys.length; i++) {
      result[keys[i]] = get(keys[i]);
    }
    return result;
  }

  function getPublicPortalMeta() {
    var heroTitle = '';
    var heroDescription = '';
    var cartaOrganisasiUrl = '';
    try {
      heroTitle = SettingsRepository.getSetting('HERO_TITLE');
      heroDescription = SettingsRepository.getSetting('HERO_DESCRIPTION');
      cartaOrganisasiUrl = SettingsRepository.getSetting('CARTA_ORGANISASI_URL');
    } catch(e) {}
    
    return {
      portalName: get('PORTAL_NAME'),
      sectorName: get('SECTOR_NAME'),
      district: get('DISTRICT'),
      state: get('STATE'),
      ministry: get('MINISTRY'),
      contactEmail: get('CONTACT_EMAIL'),
      phone: get('CONTACT_PHONE'),
      address: get('ADDRESS'),
      espbLogoUrl: get('LOGO_URL'),
      jataNegaraUrl: get('JATA_NEGARA_URL'),
      eKeberadaanUrl: get('E_KEBERADAAN_URL'),
      cartaOrganisasiUrl: cartaOrganisasiUrl || get('CARTA_ORGANISASI_URL'),
      currentYear: new Date().getFullYear(),
      heroTitle: heroTitle || 'Pendidikan Bermutu,<br>Insan Terdidik,<br>Negara Sejahtera.',
      heroDescription: heroDescription || 'Melestarikan sistem pendidikan yang berkualiti untuk membangunkan potensi individu bagi memenuhi aspirasi negara di daerah Beluran.'
    };
  }

  return { get: get, set: set, getAll: getAll, getPublicPortalMeta: getPublicPortalMeta, DEFAULTS: DEFAULTS };
})();

// ============================================================================
// 2. RESPONSE UTILITIES
// ============================================================================
const ResponseUtils = (function() {
  function success(data, message) {
    return { success: true, data: data !== undefined ? data : null, message: message || 'Operasi berjaya.', error: null };
  }
  function error(message, errorCode, details) {
    return { success: false, data: null, message: message || 'Ralat berlaku.', error: { code: errorCode || 'INTERNAL_ERROR', details: details || null } };
  }
  function unauthorized(message) {
    return error(message || 'Akses tidak sah. Sila log masuk semula.', 'UNAUTHORIZED');
  }
  function validationError(message, fields) {
    return error(message || 'Maklumat tidak sah.', 'VALIDATION_ERROR', fields);
  }
  return { success: success, error: error, unauthorized: unauthorized, validationError: validationError };
})();

// ============================================================================
// 3. LOGGING & AUDIT
// ============================================================================
const LoggerUtils = (function() {
  function info(context, message, meta) { console.log('[INFO] [' + context + '] ' + message + (meta ? ' | ' + (meta instanceof Error ? meta.stack || meta.message : JSON.stringify(meta)) : '')); }
  function warn(context, message, meta) { console.warn('[WARN] [' + context + '] ' + message + (meta ? ' | ' + (meta instanceof Error ? meta.stack || meta.message : JSON.stringify(meta)) : '')); }
  function error(context, message, errorObj) { console.error('[ERROR] [' + context + '] ' + message + ' | ' + (errorObj ? errorObj.stack || errorObj.message || errorObj : '')); }
  function audit(action, userIdentifier, status, details) {
    try {
      var sheetId = AppConfig.get('SPREADSHEET_ID');
      if (!sheetId) return;
      var ss = SpreadsheetApp.openById(sheetId);
      var sheet = ss.getSheetByName(AppConfig.get('SHEET_AUDIT_LOG'));
      if (!sheet) {
        sheet = ss.insertSheet(AppConfig.get('SHEET_AUDIT_LOG'));
        sheet.appendRow(['Timestamp', 'Action', 'User Identifier', 'Status', 'Details']);
        sheet.setFrozenRows(1);

      }
      
      var activeUser = '';
      try { activeUser = Session.getActiveUser().getEmail(); } catch(err) {}
      var finalUser = activeUser || userIdentifier || 'ADMIN';
      
      sheet.appendRow([new Date(), String(action || '').toUpperCase(), String(finalUser), String(status || 'INFO').toUpperCase(), String(details || '').slice(0, 500)]);
    } catch (e) {}
  }
  return { info: info, warn: warn, error: error, audit: audit };
})();

// ============================================================================
// 4. VALIDATION UTILITIES
// ============================================================================
const ValidationUtils = (function() {
  var ALLOWED_MIMES = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
  var DOC_MIMES = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx'
  };

  function sanitizeString(value, maxLength) {
    if (!value) return '';
    var str = String(value).trim().replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '');
    str = str.replace(/<[^>]*>?/gm, ''); // Strip all HTML tags
    return maxLength && str.length > maxLength ? str.slice(0, maxLength) : str;
  }
  function sanitizeUrl(url) {
    if (!url) return '';
    var trimmed = String(url).trim();
    return /^https?:\/\/[^\s<>"'`]+$/i.test(trimmed) ? trimmed : '';
  }
  function parseValidDate(val) {
    if (!val) return null;
    var d = new Date(val);
    return (d instanceof Date && !isNaN(d.getTime())) ? d : null;
  }
  function validateImageMime(mime) {
    return ALLOWED_MIMES[String(mime || '').toLowerCase().trim()] || null;
  }
  function validateDocMime(mime) {
    return DOC_MIMES[String(mime || '').toLowerCase().trim()] || null;
  }
  function validateAnnouncementPayload(data) {
    var errors = {};
    var clean = {};
    if (!data || typeof data !== 'object') return { isValid: false, errors: { form: 'Data tidak sah' }, cleanData: {} };
    clean.title = sanitizeString(data.title, 250);
    if (!clean.title) errors.title = 'Tajuk hebahan wajib diisi.';
    clean.date = parseValidDate(data.date);
    if (!clean.date) errors.date = 'Tarikh yang sah diperlukan.';
    clean.category = sanitizeString(data.category, 60) || 'Hebahan';
    clean.excerpt = sanitizeString(data.excerpt, 1500);
    if (!clean.excerpt) errors.excerpt = 'Ringkasan hebahan wajib diisi.';
    clean.link = sanitizeUrl(data.link);
    clean.image = sanitizeUrl(data.image);
    clean.id = sanitizeString(data.id, 64);
    return { isValid: Object.keys(errors).length === 0, errors: errors, cleanData: clean };
  }
  function generateId(prefix) {
    return (prefix || 'ID') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
  }
  return {
    sanitizeString: sanitizeString, sanitizeUrl: sanitizeUrl, parseValidDate: parseValidDate,
    validateImageMime: validateImageMime, validateDocMime: validateDocMime,
    validateAnnouncementPayload: validateAnnouncementPayload, generateId: generateId
  };
})();

// ============================================================================
// 5. SECURITY & SESSION MANAGEMENT
// ============================================================================
const Security = (function() {
  function hashPassword(password, salt) {
    var s = salt || AppConfig.get('AUTH_SALT');
    var input = String(password) + s;
    var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
    return raw.map(function(b) { return ('0' + ((b < 0 ? b + 256 : b).toString(16))).slice(-2); }).join('');
  }
  function generateSessionToken(role) {
    var salt = AppConfig.get('AUTH_SALT');
    var now = Date.now();
    var expiry = now + (Number(AppConfig.get('SESSION_DURATION_HOURS')) || 4) * 3600 * 1000;
    var payload = { role: role || 'admin', iat: now, exp: expiry, nonce: Utilities.getUuid() };
    var payloadStr = Utilities.base64EncodeWebSafe(JSON.stringify(payload));
    var sig = Utilities.computeHmacSha256Signature(payloadStr, salt).map(function(b) { return ('0' + ((b < 0 ? b + 256 : b).toString(16))).slice(-2); }).join('');
    return payloadStr + '.' + sig;
  }
  function verifySessionToken(token) {
    if (!token || typeof token !== 'string') return { valid: false, role: '', message: 'Sesi tidak wujud.' };
    var parts = token.split('.');
    if (parts.length !== 2) return { valid: false, role: '', message: 'Format sesi tidak sah.' };
    var salt = AppConfig.get('AUTH_SALT');
    var expectedSig = Utilities.computeHmacSha256Signature(parts[0], salt).map(function(b) { return ('0' + ((b < 0 ? b + 256 : b).toString(16))).slice(-2); }).join('');
    if (parts[1] !== expectedSig) return { valid: false, role: '', message: 'Integriti token gagal.' };
    try {
      var payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
      if (Date.now() > payload.exp) return { valid: false, role: '', message: 'Sesi telah luput.' };
      return { valid: true, role: payload.role || 'admin' };
    } catch (e) {
      return { valid: false, role: '', message: 'Data sesi rosak.' };
    }
  }
  function checkRateLimit(id) {
    var cache = CacheService.getScriptCache();
    if (cache.get('lockout_' + id)) return { allowed: false, remainingAttempts: 0 };
    var count = Number(cache.get('attempts_' + id) || 0);
    var max = Number(AppConfig.get('MAX_LOGIN_ATTEMPTS')) || 5;
    return { allowed: count < max, remainingAttempts: Math.max(0, max - count) };
  }
  function recordFailedAttempt(id) {
    var cache = CacheService.getScriptCache();
    var count = Number(cache.get('attempts_' + id) || 0) + 1;
    var max = Number(AppConfig.get('MAX_LOGIN_ATTEMPTS')) || 5;
    if (count >= max) {
      cache.put('lockout_' + id, 'locked', (Number(AppConfig.get('LOCKOUT_MINUTES')) || 15) * 60);
      cache.remove('attempts_' + id);
    } else {
      cache.put('attempts_' + id, String(count), 900);
    }
  }
  function clearRateLimit(id) {
    var cache = CacheService.getScriptCache();
    cache.remove('attempts_' + id);
    cache.remove('lockout_' + id);
  }
  return { generateSessionToken: generateSessionToken, verifySessionToken: verifySessionToken, checkRateLimit: checkRateLimit, recordFailedAttempt: recordFailedAttempt, clearRateLimit: clearRateLimit };
})();

// ============================================================================
// 6. DATABASE HELPER — Generic sheet operations
// ============================================================================
const DatabaseHelper = (function() {
  var ssCache_ = null;

  function getSpreadsheet() {
    if (ssCache_) return ssCache_;
    var sheetId = AppConfig.get('SPREADSHEET_ID');
    if (sheetId) {
      try {
        ssCache_ = SpreadsheetApp.openById(sheetId);
        return ssCache_;
      } catch (e) {
        ssCache_ = null;
      }
    }
    // Auto-recovery / Self-healing: if SPREADSHEET_ID is missing or invalid, run setup automatically!
    try {
      Logger.log('SPREADSHEET_ID tidak ditemui atau tidak sah. Menjalankan auto-inisialisasi setupMyGoogleDrive()...');
      runSetup();
      sheetId = AppConfig.get('SPREADSHEET_ID');
      if (sheetId) {
        ssCache_ = SpreadsheetApp.openById(sheetId);
        return ssCache_;
      }
    } catch (err) {
      Logger.log('Ralat auto-inisialisasi spreadsheet: ' + err.toString());
    }
    throw new Error('SPREADSHEET_ID belum ditetapkan. Sila jalankan fungsi setupMyGoogleDrive() dari menu editor Apps Script.');
  }

  function getOrCreateSheet(name, headers) {
    var ss = getSpreadsheet();
    var s = ss.getSheetByName(name);
    if (!s) {
      s = ss.insertSheet(name);
      if (headers && headers.length) { s.appendRow(headers); s.setFrozenRows(1); }
    }
    return s;
  }

  function getColumnMap(sheet) {
    var lastCol = sheet.getLastColumn();
    if (lastCol < 1) return {};
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var map = {};
    for (var i = 0; i < headers.length; i++) {
      if (headers[i]) map[String(headers[i]).trim()] = i;
    }
    return map;
  }

  function getAllRows(sheetName, headers) {
    var sheet = getOrCreateSheet(sheetName, headers);
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    var lastCol = sheet.getLastColumn();
    if (lastCol < 1) return [];
    var colMap = getColumnMap(sheet);
    var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    var results = [];
    for (var r = 0; r < data.length; r++) {
      var obj = {};
      for (var c = 0; c < headerRow.length; c++) {
        var key = String(headerRow[c]).trim();
        if (key) obj[key] = data[r][c];
      }
      obj._rowIndex = r + 2;
      results.push(obj);
    }
    return results;
  }

  function findRowByColumn(sheetName, columnName, value) {
    var sheet = getOrCreateSheet(sheetName);
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return null;
    var colMap = getColumnMap(sheet);
    var colIdx = colMap[columnName];
    if (colIdx === undefined) return null;
    var values = sheet.getRange(2, colIdx + 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][0]).trim() === String(value).trim()) {
        return i + 2; // 1-indexed row number
      }
    }
    return null;
  }

  function withLock(callback) {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) throw new Error('Sistem sedang sibuk. Sila cuba seketika lagi.');
    try { return callback(); } finally { lock.releaseLock(); }
  }

  function invalidateCache(keys) {
    try {
      var cache = CacheService.getScriptCache();
      if (Array.isArray(keys)) {
        for (var i = 0; i < keys.length; i++) cache.remove(keys[i]);
      } else {
        cache.remove(keys);
      }
    } catch(e) {}
  }
  function insertMappedRow(sheet, dataMap) {
    var colMap = getColumnMap(sheet);
    var lastCol = sheet.getLastColumn();
    if (lastCol < 1) return;
    var newRow = new Array(lastCol).fill('');
    for (var key in dataMap) {
      if (colMap[key] !== undefined) newRow[colMap[key]] = dataMap[key];
    }
    sheet.appendRow(newRow);
  }

  return { getSpreadsheet: getSpreadsheet, getOrCreateSheet: getOrCreateSheet, getColumnMap: getColumnMap, getAllRows: getAllRows, findRowByColumn: findRowByColumn, withLock: withLock, invalidateCache: invalidateCache, insertMappedRow: insertMappedRow };
})();

// ============================================================================
// 7. SETTINGS REPOSITORY
// ============================================================================
const SettingsRepository = (function() {
  var HEADERS = ['key', 'value', 'description', 'updatedAt'];

  function getSetting(key) {
    var rows = DatabaseHelper.getAllRows(AppConfig.get('SHEET_SETTINGS'), HEADERS);
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].key).trim() === String(key).trim()) return String(rows[i].value || '');
    }
    return '';
  }

  function setSetting(key, value, description) {
    return DatabaseHelper.withLock(function() {
      var sheetName = AppConfig.get('SHEET_SETTINGS');
      var sheet = DatabaseHelper.getOrCreateSheet(sheetName, HEADERS);
      var rowNum = DatabaseHelper.findRowByColumn(sheetName, 'key', key);
      if (rowNum) {
        var colMap = DatabaseHelper.getColumnMap(sheet);
        sheet.getRange(rowNum, colMap['value'] + 1).setValue(String(value));
        sheet.getRange(rowNum, colMap['updatedAt'] + 1).setValue(new Date());
      } else {
        DatabaseHelper.insertMappedRow(sheet, {
          key: key, value: String(value), description: description || '', updatedAt: new Date()
        });
      }
      return true;
    });
  }

  function getAllSettings() {
    var rows = DatabaseHelper.getAllRows(AppConfig.get('SHEET_SETTINGS'), HEADERS);
    var result = {};
    for (var i = 0; i < rows.length; i++) {
      result[String(rows[i].key)] = String(rows[i].value || '');
    }
    return result;
  }

  return { getSetting: getSetting, setSetting: setSetting, getAllSettings: getAllSettings };
})();

// ============================================================================
// 8. SHEET REPOSITORY — Hebahan & Hero Album (preserved existing)
// ============================================================================
const SheetRepository = (function() {
  function getAllAnnouncements(useCache) {
    var cache = CacheService.getScriptCache();
    if (useCache !== false) {
      var cached = cache.get('cache_announcements');
      if (cached) { try { return JSON.parse(cached); } catch (e) {} }
    }
    var sheet = DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_HEBAHAN'), ['ID', 'Tarikh', 'Kategori', 'Tajuk', 'Ringkasan', 'Pautan', 'Gambar URL', 'Dicipta Pada']);
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    var colMap = DatabaseHelper.getColumnMap(sheet);
    var rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

    var tIdx = colMap['Tajuk'] !== undefined ? colMap['Tajuk'] : 3;
    var dIdx = colMap['Tarikh'] !== undefined ? colMap['Tarikh'] : 1;
    var cIdx = colMap['Kategori'] !== undefined ? colMap['Kategori'] : 2;
    var eIdx = colMap['Ringkasan'] !== undefined ? colMap['Ringkasan'] : 4;
    var lIdx = colMap['Pautan'] !== undefined ? colMap['Pautan'] : 5;
    var gIdx = colMap['Gambar URL'] !== undefined ? colMap['Gambar URL'] : 6;

    var items = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (!r[tIdx] || String(r[tIdx]).trim() === '') continue;
      var rawDate = r[dIdx];
      var df = '', iso = '';
      if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
        df = Utilities.formatDate(rawDate, Session.getScriptTimeZone(), 'dd MMM yyyy').toUpperCase();
        iso = Utilities.formatDate(rawDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else {
        df = String(rawDate || '');
        iso = String(rawDate || '').split('T')[0];
      }
      items.push({
        id: String(r[0] || '').trim(), date: df, dateRaw: iso,
        category: String(r[cIdx] || 'Hebahan').trim(), title: String(r[tIdx] || '').trim(),
        excerpt: String(r[eIdx] || '').trim(), link: String(r[lIdx] || '').trim(),
        image: String(r[gIdx] || '').trim()
      });
    }
    items.reverse();
    try { cache.put('cache_announcements', JSON.stringify(items), Number(AppConfig.get('CACHE_TTL_PUBLIC_DATA')) || 600); } catch (e) {}
    return items;
  }

  function insertAnnouncement(data) {
    return DatabaseHelper.withLock(function() {
      var sheet = DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_HEBAHAN'));
      var id = Utilities.getUuid();
      DatabaseHelper.insertMappedRow(sheet, {
        'ID': id, 'Tarikh': data.date, 'Kategori': data.category, 'Tajuk': data.title,
        'Ringkasan': data.excerpt, 'Pautan': data.link || '', 'Gambar URL': data.image || '', 'Dicipta Pada': new Date()
      });
      DatabaseHelper.invalidateCache('cache_announcements');
      return id;
    });
  }

  function updateAnnouncement(id, data) {
    return DatabaseHelper.withLock(function() {
      var sheet = DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_HEBAHAN'));
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) return false;
      var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < values.length; i++) {
        if (String(values[i][0]).trim() === String(id).trim()) {
          sheet.getRange(i + 2, 2, 1, 6).setValues([[data.date, data.category, data.title, data.excerpt, data.link || '', data.image || '']]);
          DatabaseHelper.invalidateCache('cache_announcements');
          return true;
        }
      }
      return false;
    });
  }

  function deleteAnnouncement(id) {
    return DatabaseHelper.withLock(function() {
      var sheet = DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_HEBAHAN'));
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) return false;
      var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < values.length; i++) {
        if (String(values[i][0]).trim() === String(id).trim()) {
          sheet.deleteRow(i + 2);
          DatabaseHelper.invalidateCache('cache_announcements');
          return true;
        }
      }
      return false;
    });
  }

  function getHeroAlbum(useCache) {
    var cache = CacheService.getScriptCache();
    if (useCache !== false) {
      var c = cache.get('cache_album');
      if (c) { try { return JSON.parse(c); } catch (e) {} }
    }
    var sheet = DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_HERO_ALBUM'), ['ID', 'URL Gambar', 'Susunan', 'Nama Fail', 'Dicipta Pada']);
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    var rows = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    var album = rows.filter(function(r) { return r[1] && String(r[1]).trim() !== ''; })
      .sort(function(a, b) { return Number(a[2] || 0) - Number(b[2] || 0); })
      .map(function(r) { return { id: String(r[0] || '').trim(), url: String(r[1] || '').trim(), order: Number(r[2] || 0), fileName: String(r[3] || '').trim() }; })
      .slice(0, 10);
    try { cache.put('cache_album', JSON.stringify(album), Number(AppConfig.get('CACHE_TTL_PUBLIC_DATA')) || 600); } catch (e) {}
    return album;
  }

  function saveHeroAlbum(images) {
    return DatabaseHelper.withLock(function() {
      var sheet = DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_HERO_ALBUM'));
      var lastRow = sheet.getLastRow();
      if (lastRow >= 2) sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
      if (images && images.length) {
        var rows = images.slice(0, 10).map(function(img, idx) { return [Utilities.getUuid(), String(img.url || '').trim(), idx + 1, String(img.fileName || '').trim(), new Date()]; });
        sheet.getRange(2, 1, rows.length, 5).setValues(rows);
      }
      DatabaseHelper.invalidateCache('cache_album');
      return true;
    });
  }

  function clearHeroAlbum() {
    return DatabaseHelper.withLock(function() {
      var sheet = DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_HERO_ALBUM'));
      var lastRow = sheet.getLastRow();
      if (lastRow >= 2) sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
      DatabaseHelper.invalidateCache('cache_album');
      return true;
    });
  }

  return { getAllAnnouncements: getAllAnnouncements, insertAnnouncement: insertAnnouncement, updateAnnouncement: updateAnnouncement, deleteAnnouncement: deleteAnnouncement, getHeroAlbum: getHeroAlbum, saveHeroAlbum: saveHeroAlbum, clearHeroAlbum: clearHeroAlbum };
})();

// ============================================================================
// 8B. QUICK ACCESS REPOSITORY
// ============================================================================
const QuickAccessRepository = (function() {
  function getServices(useCache) {
    var cache = CacheService.getScriptCache();
    if (useCache !== false) {
      var cached = cache.get('cache_quick_access');
      if (cached) { try { return JSON.parse(cached); } catch(e){} }
    }
    
    var sheetName = AppConfig.get('SHEET_PERKHIDMATAN') || 'Perkhidmatan';
    var headers = ['Tajuk', 'Penerangan', 'Ikon', 'Pautan', 'Luaran', 'Susunan'];
    var sheet = DatabaseHelper.getOrCreateSheet(sheetName, headers);
    
    var lastRow = sheet.getLastRow();
    var defaultItems = [
      { title: 'Carta Organisasi', description: 'Struktur kepimpinan dan pegawai Sektor Pembelajaran PPD Beluran.', icon: 'sitemap', link: AppConfig.get('CARTA_ORGANISASI_URL'), external: true, order: 1 },
      { title: 'E-Keberadaan Pegawai', description: 'Sistem pelaporan keberadaan dan pergerakan rasmi sektor.', icon: 'laptop', link: AppConfig.get('E_KEBERADAAN_URL'), external: true, order: 2 },
      { title: 'Bimbingan SISC+', description: 'Khidmat bimbingan pedagogi berfokus untuk sekolah daerah Beluran.', icon: 'users', link: '#unit', external: false, order: 3 },
      { title: 'DELIMa & Digital KPM', description: 'Pelantar pembelajaran digital kebangsaan bagi guru dan murid.', icon: 'globe', link: 'https://d2.delima.edu.my', external: true, order: 4 }
    ];
    
    if (lastRow < 2) {
      DatabaseHelper.withLock(function() {
        for (var i = 0; i < defaultItems.length; i++) {
          var row = [
            defaultItems[i].title,
            defaultItems[i].description,
            defaultItems[i].icon,
            defaultItems[i].link,
            defaultItems[i].external ? 'Ya' : 'Tidak',
            defaultItems[i].order
          ];
          sheet.appendRow(row);
        }
      });
      return defaultItems;
    }
    
    var colMap = DatabaseHelper.getColumnMap(sheet);
    var rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    
    var tIdx = colMap['Tajuk'] !== undefined ? colMap['Tajuk'] : 0;
    var dIdx = colMap['Penerangan'] !== undefined ? colMap['Penerangan'] : 1;
    var iIdx = colMap['Ikon'] !== undefined ? colMap['Ikon'] : 2;
    var lIdx = colMap['Pautan'] !== undefined ? colMap['Pautan'] : 3;
    var eIdx = colMap['Luaran'] !== undefined ? colMap['Luaran'] : 4;
    var oIdx = colMap['Susunan'] !== undefined ? colMap['Susunan'] : 5;
    
    var items = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (!r[tIdx]) continue;
      items.push({
        title: String(r[tIdx] || '').trim(),
        description: String(r[dIdx] || '').trim(),
        icon: String(r[iIdx] || '').trim(),
        link: String(r[lIdx] || '').trim(),
        external: String(r[eIdx] || '').toUpperCase() === 'YA',
        order: Number(r[oIdx]) || 99
      });
    }
    
    items.sort(function(a, b) { return a.order - b.order; });
    try { cache.put('cache_quick_access', JSON.stringify(items), Number(AppConfig.get('CACHE_TTL_PUBLIC_DATA')) || 600); } catch(e){}
    return items;
  }
  
  return { getServices: getServices };
})();

// ============================================================================
// 9. DRIVE REPOSITORY (Enhanced with complete Unit/Sektor Folder Hierarchy)
// ============================================================================
const DriveRepository = (function() {
  var ROOT_FOLDER_NAME = 'ESPB_Portal_PPD_Beluran';
  var DB_FOLDER_NAME = '01_Pangkalan_Data';
  var UNITS_FOLDER_NAME = '02_Unit_Sektor';
  var HEBAHAN_FOLDER_NAME = '03_Hebahan';
  var HERO_FOLDER_NAME = '04_Hero_Album';
  var EMPLOYEES_FOLDER_NAME = '05_Pegawai_Staf';
  var DOCUMENTS_FOLDER_NAME = '06_Dokumen_Umum';
  var UPLOADS_FOLDER_NAME = '07_Muat_Naik_Umum';

  var UNIT_FOLDER_NAMES = {
    'unit-bm': '01_Unit_Bahasa_Melayu',
    'unit-bi': '02_Unit_Bahasa_Inggeris',
    'unit-sains': '03_Unit_Sains',
    'unit-matematik': '04_Unit_Matematik',
    'unit-sejarah': '05_Unit_Sejarah',
    'pemulihan-khas': '06_Unit_Pemulihan_Khas',
    'pendidikan-islam': '07_Unit_Pendidikan_Islam',
    'pendidikan-khas': '08_Unit_Pendidikan_Khas',
    'ustp': '09_Unit_Sumber_Teknologi_Pendidikan'
  };

  function setPublicViewSharing(driveItem) {
    if (!driveItem) return;
    try {
      driveItem.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e1) {
      try {
        driveItem.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (e2) {
        Logger.log('Gagal menetapkan perkongsian fail: ' + (e2.message || e2));
      }
    }
  }

  function getOrCreateFolder(parentFolder, folderName) {
    var iter = parentFolder.getFoldersByName(folderName);
    if (iter.hasNext()) {
      var existing = iter.next();
      setPublicViewSharing(existing);
      return existing;
    }
    var created = parentFolder.createFolder(folderName);
    setPublicViewSharing(created);
    return created;
  }

  function getRootFolder() {
    var rootId = AppConfig.get('DRIVE_ROOT_FOLDER_ID');
    if (rootId) {
      try {
        var f = DriveApp.getFolderById(rootId);
        if (f) return f;
      } catch (e) {}
    }
    var iter = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
    var rootFolder;
    if (iter.hasNext()) {
      rootFolder = iter.next();
    } else {
      rootFolder = DriveApp.createFolder(ROOT_FOLDER_NAME);
    }
    setPublicViewSharing(rootFolder);
    AppConfig.set('DRIVE_ROOT_FOLDER_ID', rootFolder.getId());
    return rootFolder;
  }

  function getDatabaseFolder() {
    var folderId = AppConfig.get('DRIVE_DATABASE_FOLDER_ID');
    if (folderId) {
      try { return DriveApp.getFolderById(folderId); } catch (e) {}
    }
    var root = getRootFolder();
    var folder = getOrCreateFolder(root, DB_FOLDER_NAME);
    AppConfig.set('DRIVE_DATABASE_FOLDER_ID', folder.getId());
    return folder;
  }

  function getUnitSektorFolder() {
    var folderId = AppConfig.get('DRIVE_UNITS_FOLDER_ID');
    if (folderId) {
      try { return DriveApp.getFolderById(folderId); } catch (e) {}
    }
    var root = getRootFolder();
    var folder = getOrCreateFolder(root, UNITS_FOLDER_NAME);
    AppConfig.set('DRIVE_UNITS_FOLDER_ID', folder.getId());
    return folder;
  }

  function getHebahanFolder() {
    var folderId = AppConfig.get('DRIVE_HEBAHAN_FOLDER_ID');
    if (folderId) {
      try { return DriveApp.getFolderById(folderId); } catch (e) {}
    }
    var root = getRootFolder();
    var folder = getOrCreateFolder(root, HEBAHAN_FOLDER_NAME);
    AppConfig.set('DRIVE_HEBAHAN_FOLDER_ID', folder.getId());
    return folder;
  }

  function getHeroAlbumFolder() {
    var folderId = AppConfig.get('DRIVE_HERO_FOLDER_ID');
    if (folderId) {
      try { return DriveApp.getFolderById(folderId); } catch (e) {}
    }
    var root = getRootFolder();
    var folder = getOrCreateFolder(root, HERO_FOLDER_NAME);
    AppConfig.set('DRIVE_HERO_FOLDER_ID', folder.getId());
    return folder;
  }

  function getEmployeesFolder() {
    var folderId = AppConfig.get('DRIVE_EMPLOYEES_FOLDER_ID');
    if (folderId) {
      try { return DriveApp.getFolderById(folderId); } catch (e) {}
    }
    var root = getRootFolder();
    var folder = getOrCreateFolder(root, EMPLOYEES_FOLDER_NAME);
    AppConfig.set('DRIVE_EMPLOYEES_FOLDER_ID', folder.getId());
    return folder;
  }

  function getDocumentsFolder(subfolder) {
    var folderId = AppConfig.get('DRIVE_DOCUMENTS_FOLDER_ID');
    var folder;
    if (folderId) {
      try { folder = DriveApp.getFolderById(folderId); } catch (e) {}
    }
    if (!folder) {
      var root = getRootFolder();
      folder = getOrCreateFolder(root, DOCUMENTS_FOLDER_NAME);
      AppConfig.set('DRIVE_DOCUMENTS_FOLDER_ID', folder.getId());
    }
    if (subfolder) return getOrCreateFolder(folder, subfolder);
    return folder;
  }

  function getUploadFolder() {
    var folderId = AppConfig.get('DRIVE_UPLOADS_FOLDER_ID');
    if (folderId) {
      try { return DriveApp.getFolderById(folderId); } catch (e) {}
    }
    var root = getRootFolder();
    var folder = getOrCreateFolder(root, UPLOADS_FOLDER_NAME);
    AppConfig.set('DRIVE_UPLOADS_FOLDER_ID', folder.getId());
    return folder;
  }

  function getUnitFolder(unitId, unitName) {
    var parent = getUnitSektorFolder();
    var folderName = UNIT_FOLDER_NAMES[unitId];
    if (!folderName) {
      var clean = (unitName || unitId || 'Unit')
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      folderName = 'Unit_' + clean;
    }
    return getOrCreateFolder(parent, folderName);
  }

  function getImagesFolder(subfolder) {
    if (subfolder === 'Hero_Album') return getHeroAlbumFolder();
    if (subfolder === 'Hebahan') return getHebahanFolder();
    if (subfolder === 'Employee_Photos') return getEmployeesFolder();
    if (subfolder) return getOrCreateFolder(getUploadFolder(), subfolder);
    return getUploadFolder();
  }

  function provisionAllFolders() {
    var root = getRootFolder();
    var dbFolder = getDatabaseFolder();
    var unitsParentFolder = getUnitSektorFolder();
    var hebahanFolder = getHebahanFolder();
    var heroFolder = getHeroAlbumFolder();
    var empFolder = getEmployeesFolder();
    var docFolder = getDocumentsFolder();
    var uploadFolder = getUploadFolder();

    var unitFoldersMap = {};
    var uKeys = Object.keys(UNIT_FOLDER_NAMES);
    for (var i = 0; i < uKeys.length; i++) {
      var uId = uKeys[i];
      unitFoldersMap[uId] = getOrCreateFolder(unitsParentFolder, UNIT_FOLDER_NAMES[uId]);
    }

    return {
      root: root,
      database: dbFolder,
      unitSektor: unitsParentFolder,
      unitFolders: unitFoldersMap,
      hebahan: hebahanFolder,
      heroAlbum: heroFolder,
      employees: empFolder,
      documents: docFolder,
      uploads: uploadFolder
    };
  }

  function saveBase64Image(uploadPayload, targetFolder) {
    if (!uploadPayload || !uploadPayload.data) throw new Error('Tiada data imej.');
    var contentType = uploadPayload.contentType || 'image/jpeg';
    var ext = ValidationUtils.validateImageMime(contentType);
    if (!ext) throw new Error('Format imej tidak sah (JPEG/PNG/WEBP dibenarkan).');

    var raw = String(uploadPayload.data);
    if (raw.indexOf(',') !== -1) raw = raw.split(',')[1];
    var bytes = Utilities.base64Decode(raw);
    if (bytes.length > 5 * 1024 * 1024) throw new Error('Saiz imej melebihi had 5MB.');

    var fileName = 'espb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8) + '.' + ext;
    var blob = Utilities.newBlob(bytes, contentType, fileName);
    var folder = targetFolder || getUploadFolder();
    var file = folder.createFile(blob);
    setPublicViewSharing(file);
    var fileId = file.getId();
    return { fileId: fileId, url: 'https://lh3.googleusercontent.com/d/' + fileId, fileName: fileName };
  }

  function saveBase64File(uploadPayload, targetFolder) {
    if (!uploadPayload || !uploadPayload.data) throw new Error('Tiada data fail.');
    var contentType = uploadPayload.contentType || 'application/pdf';
    var raw = String(uploadPayload.data);
    if (raw.indexOf(',') !== -1) raw = raw.split(',')[1];
    var bytes = Utilities.base64Decode(raw);
    if (bytes.length > 25 * 1024 * 1024) throw new Error('Saiz fail melebihi had 25MB.');

    var fileName = uploadPayload.fileName || ('espb_doc_' + Date.now() + '.pdf');
    var blob = Utilities.newBlob(bytes, contentType, fileName);
    var folder = targetFolder || getDocumentsFolder();
    var file = folder.createFile(blob);
    setPublicViewSharing(file);
    var fileId = file.getId();
    var fileSize = file.getSize();
    return {
      fileId: fileId, fileName: fileName, fileSize: fileSize,
      sizeFormatted: fileSize > 1048576 ? (fileSize / 1048576).toFixed(1) + ' MB' : (fileSize / 1024).toFixed(0) + ' KB',
      viewUrl: 'https://drive.google.com/file/d/' + fileId + '/preview',
      directUrl: 'https://drive.google.com/uc?export=download&id=' + fileId,
      thumbUrl: 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w600'
    };
  }

  function getFileInfoById(fileId) {
    try {
      var file = DriveApp.getFileById(fileId);
      return {
        id: file.getId(), name: file.getName(), size: file.getSize(),
        sizeFormatted: file.getSize() > 1048576 ? (file.getSize() / 1048576).toFixed(1) + ' MB' : (file.getSize() / 1024).toFixed(0) + ' KB',
        mimeType: file.getMimeType(),
        thumbUrl: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w600',
        viewUrl: 'https://drive.google.com/file/d/' + file.getId() + '/preview',
        directUrl: 'https://drive.google.com/uc?export=download&id=' + file.getId()
      };
    } catch (e) {
      return null;
    }
  }

  function getFolderDocuments(folderId) {
    var folder = null;
    try {
      if (folderId && folderId.length > 10) folder = DriveApp.getFolderById(folderId);
    } catch (e) {}
    if (!folder) return [];
    var files = folder.getFiles();
    var items = [];
    while (files.hasNext()) {
      var f = files.next();
      var id = f.getId();
      var name = f.getName();
      var cat = 'Dokumen';
      if (/borang/i.test(name)) cat = 'Borang';
      else if (/panduan|instrumen/i.test(name)) cat = 'Panduan';
      else if (/laporan|manual/i.test(name)) cat = 'Laporan';
      var isImage = /jpg|jpeg|png|gif|webp/i.test(name) || (f.getMimeType && f.getMimeType().indexOf('image/') === 0);
      var sizeFormatted = '';
      try {
        var sizeBytes = f.getSize();
        sizeFormatted = (sizeBytes > 1048576) ? (sizeBytes / 1048576).toFixed(1) + ' MB' : (sizeBytes / 1024).toFixed(0) + ' KB';
      } catch (e) {
        sizeFormatted = 'N/A'; // Native Google Docs throw an error on getSize()
      }

      items.push({
        id: id, name: name, category: cat, isImage: isImage,
        sizeFormatted: sizeFormatted,
        thumbUrl: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w600',
        viewUrl: 'https://drive.google.com/file/d/' + id + '/preview',
        directUrl: 'https://drive.google.com/uc?export=download&id=' + id
      });
    }
    return items;
  }

  return {
    getOrCreateFolder: getOrCreateFolder,
    getRootFolder: getRootFolder,
    getDatabaseFolder: getDatabaseFolder,
    getUnitSektorFolder: getUnitSektorFolder,
    getHebahanFolder: getHebahanFolder,
    getHeroAlbumFolder: getHeroAlbumFolder,
    getEmployeesFolder: getEmployeesFolder,
    getDocumentsFolder: getDocumentsFolder,
    getUploadFolder: getUploadFolder,
    getUnitFolder: getUnitFolder,
    getImagesFolder: getImagesFolder,
    provisionAllFolders: provisionAllFolders,
    saveBase64Image: saveBase64Image,
    saveBase64File: saveBase64File,
    getFileInfoById: getFileInfoById,
    getFolderDocuments: getFolderDocuments,
    setPublicViewSharing: setPublicViewSharing
  };
})();

function setPublicViewSharing(driveItem) {
  return DriveRepository.setPublicViewSharing(driveItem);
}

// ============================================================================
// 10. UNIT REPOSITORY — Database-driven units
// ============================================================================
const UnitRepository = (function() {
  var UNIT_HEADERS = ['unitId', 'unitCode', 'unitName', 'title', 'tagline', 'description', 'icon', 'categoryId', 'logoFileId', 'bannerFileId', 'externalLink', 'displayOrder', 'status', 'hasDocuments', 'driveFolderId', 'createdAt', 'updatedAt'];
  var CAT_HEADERS = ['categoryId', 'categoryName', 'description', 'icon', 'displayOrder', 'status', 'createdAt', 'updatedAt'];
  var CONTENT_HEADERS = ['contentId', 'unitId', 'sectionType', 'title', 'content', 'imageFileId', 'documentFileId', 'linkUrl', 'displayOrder', 'status', 'createdAt', 'updatedAt'];

  // Folders are now resolved purely from the database or STATIC_UNIT_REGISTRY

  function getActiveUnits(useCache) {
    var cache = CacheService.getScriptCache();
    if (useCache !== false) {
      var cached = cache.get('cache_units_v6');
      if (cached) { try { return JSON.parse(cached); } catch (e) {} }
    }
    var rows = DatabaseHelper.getAllRows(AppConfig.get('SHEET_UNITS'), UNIT_HEADERS);
    var units = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (String(r.status) === 'inactive') continue;
      
      var uId = String(r.unitId || '').trim().toLowerCase();
      var folderId = String(r.driveFolderId || '').trim();
      var hasDocs = String(r.hasDocuments) === 'true' || r.hasDocuments === true;
      
      units.push({
        unitId: String(r.unitId || ''), unitCode: String(r.unitCode || ''),
        unitName: String(r.unitName || ''), title: String(r.title || ''),
        tagline: String(r.tagline || ''), description: String(r.description || ''),
        icon: String(r.icon || 'folder'), categoryId: String(r.categoryId || ''),
        logoFileId: String(r.logoFileId || ''), bannerFileId: String(r.bannerFileId || ''),
        externalLink: String(r.externalLink || ''),
        displayOrder: Number(r.displayOrder || 0), status: String(r.status || 'active'),
        hasDocuments: hasDocs,
        driveFolderId: folderId
      });
    }
    units.sort(function(a, b) { return a.displayOrder - b.displayOrder; });
    try { cache.put('cache_units_v6', JSON.stringify(units), Number(AppConfig.get('CACHE_TTL_PUBLIC_DATA')) || 600); } catch (e) {}
    return units;
  }

  function getAllUnits() {
    var rows = DatabaseHelper.getAllRows(AppConfig.get('SHEET_UNITS'), UNIT_HEADERS);
    return rows.map(function(r) {
      var uId = String(r.unitId || '').trim().toLowerCase();
      var folderId = String(r.driveFolderId || '').trim();
      var hasDocs = String(r.hasDocuments) === 'true' || r.hasDocuments === true;
      
      return {
        unitId: String(r.unitId || ''), unitCode: String(r.unitCode || ''),
        unitName: String(r.unitName || ''), title: String(r.title || ''),
        tagline: String(r.tagline || ''), description: String(r.description || ''),
        icon: String(r.icon || 'folder'), categoryId: String(r.categoryId || ''),
        logoFileId: String(r.logoFileId || ''), bannerFileId: String(r.bannerFileId || ''),
        externalLink: String(r.externalLink || ''),
        displayOrder: Number(r.displayOrder || 0), status: String(r.status || 'active'),
        hasDocuments: hasDocs,
        driveFolderId: folderId, 
        _rowIndex: r._rowIndex
      };
    }).sort(function(a, b) { return a.displayOrder - b.displayOrder; });
  }

  function getUnitById(unitId) {
    var rows = DatabaseHelper.getAllRows(AppConfig.get('SHEET_UNITS'), UNIT_HEADERS);
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].unitId).trim() === String(unitId).trim()) {
        var r = rows[i];
        var uId = String(r.unitId || '').trim().toLowerCase();
        var folderId = String(r.driveFolderId || '').trim();
        var hasDocs = String(r.hasDocuments) === 'true' || r.hasDocuments === true;
        
        return {
          unitId: String(r.unitId || ''), unitCode: String(r.unitCode || ''),
          unitName: String(r.unitName || ''), title: String(r.title || ''),
          tagline: String(r.tagline || ''), description: String(r.description || ''),
          icon: String(r.icon || 'folder'), categoryId: String(r.categoryId || ''),
          logoFileId: String(r.logoFileId || ''), bannerFileId: String(r.bannerFileId || ''),
          externalLink: String(r.externalLink || ''),
          displayOrder: Number(r.displayOrder || 0), status: String(r.status || 'active'),
          hasDocuments: hasDocs,
          driveFolderId: folderId, 
          _rowIndex: r._rowIndex
        };
      }
    }
    return null;
  }

  function saveUnit(data) {
    return DatabaseHelper.withLock(function() {
      var sheetName = AppConfig.get('SHEET_UNITS');
      var sheet = DatabaseHelper.getOrCreateSheet(sheetName, UNIT_HEADERS);
      var now = new Date();
      if (data.unitId && DatabaseHelper.findRowByColumn(sheetName, 'unitId', data.unitId)) {
        // Update existing
        var rowNum = DatabaseHelper.findRowByColumn(sheetName, 'unitId', data.unitId);
        var colMap = DatabaseHelper.getColumnMap(sheet);
        var fields = ['unitCode', 'unitName', 'title', 'tagline', 'description', 'icon', 'categoryId', 'logoFileId', 'bannerFileId', 'externalLink', 'displayOrder', 'status', 'hasDocuments', 'driveFolderId'];
        for (var i = 0; i < fields.length; i++) {
          if (data[fields[i]] !== undefined && colMap[fields[i]] !== undefined) {
            var val = data[fields[i]];
            if (typeof val === 'string') {
              // Strip formulas and scripts
              if (val.startsWith('=')) val = "'" + val;
              val = ValidationUtils.sanitizeString(val, 2000);
            }
            sheet.getRange(rowNum, colMap[fields[i]] + 1).setValue(val);
          }
        }
        sheet.getRange(rowNum, colMap['updatedAt'] + 1).setValue(now);
        DatabaseHelper.invalidateCache(['cache_units', 'cache_units_hierarchy']);
        return data.unitId;
      } else {
        // Insert new
        var unitId = data.unitId || ValidationUtils.generateId('UNIT');
        if (!data.driveFolderId) {
          try {
            var uFolder = DriveRepository.getUnitFolder(unitId, data.unitName);
            data.driveFolderId = uFolder.getId();
          } catch(e) {}
        }
        DatabaseHelper.insertMappedRow(sheet, {
          unitId: unitId, unitCode: data.unitCode || '', unitName: data.unitName || '', title: data.title || '',
          tagline: data.tagline || '', description: data.description || '', icon: data.icon || 'folder',
          categoryId: data.categoryId || '', logoFileId: data.logoFileId || '', bannerFileId: data.bannerFileId || '',
          externalLink: data.externalLink || '', displayOrder: Number(data.displayOrder || 0),
          status: data.status || 'active', hasDocuments: data.hasDocuments || false,
          driveFolderId: data.driveFolderId || '', createdAt: now, updatedAt: now
        });
        DatabaseHelper.invalidateCache(['cache_units', 'cache_units_hierarchy']);
        return unitId;
      }
    });
  }

  function deleteUnit(unitId) {
    return DatabaseHelper.withLock(function() {
      var sheetName = AppConfig.get('SHEET_UNITS');
      var sheet = DatabaseHelper.getOrCreateSheet(sheetName, UNIT_HEADERS);
      var rowNum = DatabaseHelper.findRowByColumn(sheetName, 'unitId', unitId);
      if (rowNum) {
        var colMap = DatabaseHelper.getColumnMap(sheet);
        sheet.getRange(rowNum, colMap['status'] + 1).setValue('inactive');
        sheet.getRange(rowNum, colMap['updatedAt'] + 1).setValue(new Date());
        DatabaseHelper.invalidateCache(['cache_units', 'cache_units_hierarchy']);
        return true;
      }
      return false;
    });
  }

  // Categories
  function getCategories() {
    var rows = DatabaseHelper.getAllRows(AppConfig.get('SHEET_UNIT_CATEGORIES'), CAT_HEADERS);
    return rows.filter(function(r) { return String(r.status) !== 'inactive'; })
      .map(function(r) {
        return {
          categoryId: String(r.categoryId || ''), categoryName: String(r.categoryName || ''),
          description: String(r.description || ''), icon: String(r.icon || 'folder'),
          displayOrder: Number(r.displayOrder || 0), status: String(r.status || 'active')
        };
      })
      .sort(function(a, b) { return a.displayOrder - b.displayOrder; });
  }

  function saveCategory(data) {
    return DatabaseHelper.withLock(function() {
      var sheetName = AppConfig.get('SHEET_UNIT_CATEGORIES');
      var sheet = DatabaseHelper.getOrCreateSheet(sheetName, CAT_HEADERS);
      var now = new Date();
      if (data.categoryId && DatabaseHelper.findRowByColumn(sheetName, 'categoryId', data.categoryId)) {
        var rowNum = DatabaseHelper.findRowByColumn(sheetName, 'categoryId', data.categoryId);
        var colMap = DatabaseHelper.getColumnMap(sheet);
        var fields = ['categoryName', 'description', 'icon', 'displayOrder', 'status'];
        for (var i = 0; i < fields.length; i++) {
          if (data[fields[i]] !== undefined && colMap[fields[i]] !== undefined) {
            var val = data[fields[i]];
            if (typeof val === 'string') {
              // Strip formulas and scripts
              if (val.startsWith('=')) val = "'" + val;
              val = ValidationUtils.sanitizeString(val, 2000);
            }
            sheet.getRange(rowNum, colMap[fields[i]] + 1).setValue(val);
          }
        }
        sheet.getRange(rowNum, colMap['updatedAt'] + 1).setValue(now);
      } else {
        var catId = data.categoryId || ValidationUtils.generateId('CAT');
        DatabaseHelper.insertMappedRow(sheet, {
          categoryId: catId, categoryName: data.categoryName || '', description: data.description || '',
          icon: data.icon || 'folder', displayOrder: Number(data.displayOrder || 0),
          status: data.status || 'active', createdAt: now, updatedAt: now
        });
      }
      DatabaseHelper.invalidateCache(['cache_units', 'cache_units_hierarchy']);
      return true;
    });
  }

  // Unit Content
  function getUnitContent(unitId) {
    var rows = DatabaseHelper.getAllRows(AppConfig.get('SHEET_UNIT_CONTENT'), CONTENT_HEADERS);
    return rows.filter(function(r) { return String(r.unitId).trim() === String(unitId).trim() && String(r.status) !== 'inactive'; })
      .map(function(r) {
        return {
          contentId: String(r.contentId || ''), unitId: String(r.unitId || ''),
          sectionType: String(r.sectionType || ''), title: String(r.title || ''),
          content: String(r.content || ''), imageFileId: String(r.imageFileId || ''),
          documentFileId: String(r.documentFileId || ''), linkUrl: String(r.linkUrl || ''),
          displayOrder: Number(r.displayOrder || 0), status: String(r.status || 'active')
        };
      })
      .sort(function(a, b) { return a.displayOrder - b.displayOrder; });
  }

  function saveUnitContent(data) {
    return DatabaseHelper.withLock(function() {
      var sheetName = AppConfig.get('SHEET_UNIT_CONTENT');
      var sheet = DatabaseHelper.getOrCreateSheet(sheetName, CONTENT_HEADERS);
      var now = new Date();
      if (data.contentId && DatabaseHelper.findRowByColumn(sheetName, 'contentId', data.contentId)) {
        var rowNum = DatabaseHelper.findRowByColumn(sheetName, 'contentId', data.contentId);
        var colMap = DatabaseHelper.getColumnMap(sheet);
        var fields = ['unitId', 'sectionType', 'title', 'content', 'imageFileId', 'documentFileId', 'linkUrl', 'displayOrder', 'status'];
        for (var i = 0; i < fields.length; i++) {
          if (data[fields[i]] !== undefined && colMap[fields[i]] !== undefined) {
            var val = data[fields[i]];
            if (typeof val === 'string') {
              // Strip formulas and scripts
              if (val.startsWith('=')) val = "'" + val;
              val = ValidationUtils.sanitizeString(val, 2000);
            }
            sheet.getRange(rowNum, colMap[fields[i]] + 1).setValue(val);
          }
        }
        sheet.getRange(rowNum, colMap['updatedAt'] + 1).setValue(now);
      } else {
        var contentId = data.contentId || ValidationUtils.generateId('CNT');
        DatabaseHelper.insertMappedRow(sheet, {
          contentId: contentId, unitId: data.unitId || '', sectionType: data.sectionType || '',
          title: data.title || '', content: data.content || '', imageFileId: data.imageFileId || '',
          documentFileId: data.documentFileId || '', linkUrl: data.linkUrl || '',
          displayOrder: Number(data.displayOrder || 0), status: data.status || 'active',
          createdAt: now, updatedAt: now
        });
      }
      return true;
    });
  }

  function deleteUnitContent(contentId) {
    return DatabaseHelper.withLock(function() {
      var sheetName = AppConfig.get('SHEET_UNIT_CONTENT');
      var sheet = DatabaseHelper.getOrCreateSheet(sheetName, CONTENT_HEADERS);
      var rowNum = DatabaseHelper.findRowByColumn(sheetName, 'contentId', contentId);
      if (rowNum) {
        var colMap = DatabaseHelper.getColumnMap(sheet);
        sheet.getRange(rowNum, colMap['status'] + 1).setValue('inactive');
        sheet.getRange(rowNum, colMap['updatedAt'] + 1).setValue(new Date());
        return true;
      }
      return false;
    });
  }

  return {
    getActiveUnits: getActiveUnits, getAllUnits: getAllUnits, getUnitById: getUnitById,
    saveUnit: saveUnit, deleteUnit: deleteUnit,
    getCategories: getCategories, saveCategory: saveCategory,
    getUnitContent: getUnitContent, saveUnitContent: saveUnitContent, deleteUnitContent: deleteUnitContent,
    UNIT_HEADERS: UNIT_HEADERS, CAT_HEADERS: CAT_HEADERS, CONTENT_HEADERS: CONTENT_HEADERS
  };
})();

// ============================================================================
// 11. EMPLOYEE REPOSITORY
// ============================================================================
const EmployeeRepository = (function() {
  var HEADERS = ['employeeId', 'unitId', 'name', 'position', 'photoFileId', 'email', 'phone', 'accessRole', 'displayOrder', 'status', 'createdAt', 'updatedAt'];

  function getActiveEmployees(unitId) {
    var rows = DatabaseHelper.getAllRows(AppConfig.get('SHEET_EMPLOYEES'), HEADERS);
    return rows.filter(function(r) {
      var statusOk = String(r.status) !== 'inactive';
      var unitOk = !unitId || String(r.unitId).trim() === String(unitId).trim();
      return statusOk && unitOk;
    }).map(function(r) {
      return {
        employeeId: String(r.employeeId || ''), unitId: String(r.unitId || ''),
        name: String(r.name || ''), position: String(r.position || ''),
        photoFileId: String(r.photoFileId || ''), email: String(r.email || ''),
        phone: String(r.phone || ''), accessRole: String(r.accessRole || 'staff'),
        displayOrder: Number(r.displayOrder || 0), status: String(r.status || 'active')
      };
    }).sort(function(a, b) { return a.displayOrder - b.displayOrder; });
  }

  function getAllEmployees() {
    var rows = DatabaseHelper.getAllRows(AppConfig.get('SHEET_EMPLOYEES'), HEADERS);
    return rows.map(function(r) {
      return {
        employeeId: String(r.employeeId || ''), unitId: String(r.unitId || ''),
        name: String(r.name || ''), position: String(r.position || ''),
        photoFileId: String(r.photoFileId || ''), email: String(r.email || ''),
        phone: String(r.phone || ''), accessRole: String(r.accessRole || 'staff'),
        displayOrder: Number(r.displayOrder || 0), status: String(r.status || 'active'),
        _rowIndex: r._rowIndex
      };
    }).sort(function(a, b) { return a.displayOrder - b.displayOrder; });
  }

  function saveEmployee(data) {
    return DatabaseHelper.withLock(function() {
      var sheetName = AppConfig.get('SHEET_EMPLOYEES');
      var sheet = DatabaseHelper.getOrCreateSheet(sheetName, HEADERS);
      var now = new Date();
      if (data.employeeId && DatabaseHelper.findRowByColumn(sheetName, 'employeeId', data.employeeId)) {
        var rowNum = DatabaseHelper.findRowByColumn(sheetName, 'employeeId', data.employeeId);
        var colMap = DatabaseHelper.getColumnMap(sheet);
        var fields = ['unitId', 'name', 'position', 'photoFileId', 'email', 'phone', 'accessRole', 'displayOrder', 'status'];
        for (var i = 0; i < fields.length; i++) {
          if (data[fields[i]] !== undefined && colMap[fields[i]] !== undefined) {
            var val = data[fields[i]];
            if (typeof val === 'string') {
              // Strip formulas and scripts
              if (val.startsWith('=')) val = "'" + val;
              val = ValidationUtils.sanitizeString(val, 2000);
            }
            sheet.getRange(rowNum, colMap[fields[i]] + 1).setValue(val);
          }
        }
        sheet.getRange(rowNum, colMap['updatedAt'] + 1).setValue(now);
        return data.employeeId;
      } else {
        var empId = data.employeeId || ValidationUtils.generateId('EMP');
        DatabaseHelper.insertMappedRow(sheet, {
          employeeId: empId, unitId: data.unitId || '', name: data.name || '',
          position: data.position || '', photoFileId: data.photoFileId || '',
          email: data.email || '', phone: data.phone || '', accessRole: data.accessRole || 'staff',
          displayOrder: Number(data.displayOrder || 0), status: data.status || 'active',
          createdAt: now, updatedAt: now
        });
        return empId;
      }
    });
  }

  function deleteEmployee(employeeId) {
    return DatabaseHelper.withLock(function() {
      var sheetName = AppConfig.get('SHEET_EMPLOYEES');
      var sheet = DatabaseHelper.getOrCreateSheet(sheetName, HEADERS);
      var rowNum = DatabaseHelper.findRowByColumn(sheetName, 'employeeId', employeeId);
      if (rowNum) {
        var colMap = DatabaseHelper.getColumnMap(sheet);
        sheet.getRange(rowNum, colMap['status'] + 1).setValue('inactive');
        sheet.getRange(rowNum, colMap['updatedAt'] + 1).setValue(new Date());
        return true;
      }
      return false;
    });
  }

  return { getActiveEmployees: getActiveEmployees, getAllEmployees: getAllEmployees, saveEmployee: saveEmployee, deleteEmployee: deleteEmployee, HEADERS: HEADERS };
})();

// ============================================================================
// 12. DOCUMENT REPOSITORY
// ============================================================================
const DocumentRepository = (function() {
  var HEADERS = ['documentId', 'unitId', 'title', 'description', 'fileId', 'fileName', 'fileType', 'fileSize', 'category', 'displayOrder', 'status', 'uploadedAt', 'updatedAt'];

  function getActiveDocuments(unitId) {
    var rows = DatabaseHelper.getAllRows(AppConfig.get('SHEET_DOCUMENTS'), HEADERS);
    return rows.filter(function(r) {
      var statusOk = String(r.status) !== 'inactive';
      var unitOk = !unitId || String(r.unitId).trim() === String(unitId).trim();
      return statusOk && unitOk;
    }).map(function(r) {
      var fid = String(r.fileId || '');
      return {
        documentId: String(r.documentId || ''), unitId: String(r.unitId || ''),
        title: String(r.title || r.fileName || ''), description: String(r.description || ''),
        fileId: fid, fileName: String(r.fileName || ''),
        fileType: String(r.fileType || 'pdf'), fileSize: String(r.fileSize || ''),
        category: String(r.category || 'Dokumen'),
        displayOrder: Number(r.displayOrder || 0), status: String(r.status || 'active'),
        thumbUrl: fid ? 'https://drive.google.com/thumbnail?id=' + fid + '&sz=w600' : '',
        viewUrl: fid ? 'https://drive.google.com/file/d/' + fid + '/preview' : '',
        directUrl: fid ? 'https://drive.google.com/uc?export=download&id=' + fid : '',
        sizeFormatted: String(r.fileSize || '')
      };
    }).sort(function(a, b) { return a.displayOrder - b.displayOrder; });
  }

  function getAllDocuments() {
    var rows = DatabaseHelper.getAllRows(AppConfig.get('SHEET_DOCUMENTS'), HEADERS);
    return rows.map(function(r) {
      var fid = String(r.fileId || '');
      return {
        documentId: String(r.documentId || ''), unitId: String(r.unitId || ''),
        title: String(r.title || r.fileName || ''), description: String(r.description || ''),
        fileId: fid, fileName: String(r.fileName || ''),
        fileType: String(r.fileType || 'pdf'), fileSize: String(r.fileSize || ''),
        category: String(r.category || 'Dokumen'),
        displayOrder: Number(r.displayOrder || 0), status: String(r.status || 'active'),
        thumbUrl: fid ? 'https://drive.google.com/thumbnail?id=' + fid + '&sz=w600' : '',
        viewUrl: fid ? 'https://drive.google.com/file/d/' + fid + '/preview' : '',
        directUrl: fid ? 'https://drive.google.com/uc?export=download&id=' + fid : '',
        sizeFormatted: String(r.fileSize || ''), _rowIndex: r._rowIndex
      };
    }).sort(function(a, b) { return a.displayOrder - b.displayOrder; });
  }

  function saveDocument(data) {
    return DatabaseHelper.withLock(function() {
      var sheetName = AppConfig.get('SHEET_DOCUMENTS');
      var sheet = DatabaseHelper.getOrCreateSheet(sheetName, HEADERS);
      var now = new Date();
      if (data.documentId && DatabaseHelper.findRowByColumn(sheetName, 'documentId', data.documentId)) {
        var rowNum = DatabaseHelper.findRowByColumn(sheetName, 'documentId', data.documentId);
        var colMap = DatabaseHelper.getColumnMap(sheet);
        var fields = ['unitId', 'title', 'description', 'fileId', 'fileName', 'fileType', 'fileSize', 'category', 'displayOrder', 'status'];
        for (var i = 0; i < fields.length; i++) {
          if (data[fields[i]] !== undefined && colMap[fields[i]] !== undefined) {
            var val = data[fields[i]];
            if (typeof val === 'string') {
              // Strip formulas and scripts
              if (val.startsWith('=')) val = "'" + val;
              val = ValidationUtils.sanitizeString(val, 2000);
            }
            sheet.getRange(rowNum, colMap[fields[i]] + 1).setValue(val);
          }
        }
        sheet.getRange(rowNum, colMap['updatedAt'] + 1).setValue(now);
        return data.documentId;
      } else {
        var docId = data.documentId || ValidationUtils.generateId('DOC');
        DatabaseHelper.insertMappedRow(sheet, {
          documentId: docId,
          unitId: data.unitId || '',
          title: data.title || '',
          description: data.description || '',
          fileId: data.fileId || '',
          fileName: data.fileName || '',
          fileType: data.fileType || 'pdf',
          fileSize: data.fileSize || '',
          category: data.category || 'Dokumen',
          displayOrder: Number(data.displayOrder || 0),
          status: data.status || 'active',
          uploadedAt: now,
          updatedAt: now
        });
        return docId;
      }
    });
  }

  function deleteDocument(documentId) {
    return DatabaseHelper.withLock(function() {
      var sheetName = AppConfig.get('SHEET_DOCUMENTS');
      var sheet = DatabaseHelper.getOrCreateSheet(sheetName, HEADERS);
      var rowNum = DatabaseHelper.findRowByColumn(sheetName, 'documentId', documentId);
      if (rowNum) {
        sheet.deleteRow(rowNum);
        return true;
      }
      return false;
    });
  }

  return { getActiveDocuments: getActiveDocuments, getAllDocuments: getAllDocuments, saveDocument: saveDocument, deleteDocument: deleteDocument, HEADERS: HEADERS };
})();

// ============================================================================
// 13. SERVICES
// ============================================================================

// --- Auth Service (preserved) ---
const AuthService = (function() {
  function login(passphrase) {
    try {
      var id = 'admin_login';
      var rate = Security.checkRateLimit(id);
      if (!rate.allowed) return ResponseUtils.error('Akaun disekat sementara (15 minit) akibat percubaan gagal berulang.', 'ACCOUNT_LOCKED');
      if (!passphrase || typeof passphrase !== 'string') {
        Security.recordFailedAttempt(id);
        return ResponseUtils.validationError('Sila masukkan kata laluan.');
      }
      var inputHash = Security.hashPassword(passphrase.trim());
      var expectedHash = String(AppConfig.get('ADMIN_PASS_HASH')).trim().toLowerCase();
      var isMatch = (inputHash.toLowerCase() === expectedHash);
      if (!isMatch) {
        Security.recordFailedAttempt(id);
        var updated = Security.checkRateLimit(id);
        LoggerUtils.audit('LOGIN_FAILED', 'ADMIN', 'FAILURE', 'Kata laluan salah.');
        return ResponseUtils.error('Kata laluan tidak sah. Baki percubaan: ' + updated.remainingAttempts, 'INVALID_CREDENTIALS');
      }
      Security.clearRateLimit(id);
      var token = Security.generateSessionToken('admin');
      LoggerUtils.audit('LOGIN_SUCCESS', 'ADMIN', 'SUCCESS', 'Log masuk berjaya.');
      return ResponseUtils.success({ token: token, role: 'admin', expiresInHours: 4 }, 'Log masuk berjaya.');
    } catch (e) {
      return ResponseUtils.error('Ralat pengesahan pengguna.');
    }
  }
  function verifySession(token) {
    var c = Security.verifySessionToken(token);
    return c.valid ? ResponseUtils.success({ valid: true, role: c.role }) : ResponseUtils.unauthorized(c.message);
  }

  function loginWithGoogle() {
    try {
      var email = Session.getActiveUser().getEmail();
      if (!email) {
        return ResponseUtils.error('Gagal membaca e-mel Google Workspace. Sila benarkan akses, atau pastikan anda menggunakan akaun @moe.gov.my.', 'NO_EMAIL');
      }

      var employeesSheet = DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_EMPLOYEES'));
      var data = employeesSheet.getDataRange().getValues();
      var isAdmin = false;
      
      if (data.length > 1) {
        var headers = data[0];
        var emailIdx = headers.indexOf('email');
        var roleIdx = headers.indexOf('accessRole');
        var statusIdx = headers.indexOf('status');
        
        if (emailIdx > -1 && roleIdx > -1) {
          for (var i = 1; i < data.length; i++) {
            if (String(data[i][emailIdx]).trim().toLowerCase() === email.toLowerCase() &&
                String(data[i][roleIdx]).trim().toLowerCase() === 'admin' &&
                String(data[i][statusIdx]).trim().toLowerCase() !== 'inactive') {
              isAdmin = true;
              break;
            }
          }
        }
      }

      // Hardcode fallback just in case the sheet is empty or admin is locked out
      if (email.toLowerCase() === 'admin@moe.gov.my') {
        isAdmin = true;
      }

      if (isAdmin) {
        var token = Security.generateSessionToken(email);
        LoggerUtils.audit('LOGIN_SUCCESS', email, 'SUCCESS', 'Log masuk Admin Google Workspace berjaya.');
        return ResponseUtils.success({ token: token, role: 'admin', expiresInHours: 1 }, 'Log masuk berjaya.');
      } else {
        LoggerUtils.audit('LOGIN_FAILED', email, 'FAILURE', 'Akses ditolak (bukan pentadbir).');
        return ResponseUtils.error('Akaun anda (' + email + ') tidak didaftarkan sebagai Pentadbir Sistem.', 'UNAUTHORIZED');
      }
    } catch (e) {
      return ResponseUtils.error('Ralat pengesahan Google Workspace: ' + e.message);
    }
  }

  return { loginWithGoogle: loginWithGoogle, verifySession: verifySession };
})();

// --- Announcement Service (preserved) ---
const AnnouncementService = (function() {
  function getPublicAnnouncements(limit) {
    try { return SheetRepository.getAllAnnouncements(true).slice(0, limit || 6); } catch (e) { return []; }
  }
  function getAdminAnnouncements(token) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    try { return ResponseUtils.success(SheetRepository.getAllAnnouncements(false)); } catch (e) { return ResponseUtils.error('Gagal memuatkan hebahan.'); }
  }
  function saveAnnouncement(token, data) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    var v = ValidationUtils.validateAnnouncementPayload(data);
    if (!v.isValid) return ResponseUtils.validationError('Maklumat tidak lengkap.', v.errors);
    try {
      if (v.cleanData.id) {
        SheetRepository.updateAnnouncement(v.cleanData.id, v.cleanData);
        LoggerUtils.audit('UPDATE_HEBAHAN', 'ADMIN', 'SUCCESS', 'Dikemas kini: ' + v.cleanData.title);
      } else {
        SheetRepository.insertAnnouncement(v.cleanData);
        LoggerUtils.audit('CREATE_HEBAHAN', 'ADMIN', 'SUCCESS', 'Dicipta: ' + v.cleanData.title);
      }
      return ResponseUtils.success(null, 'Hebahan berjaya disimpan.');
    } catch (e) {
      return ResponseUtils.error('Gagal menyimpan: ' + e.message);
    }
  }
  function deleteAnnouncement(token, id) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    try {
      SheetRepository.deleteAnnouncement(id);
      LoggerUtils.audit('DELETE_HEBAHAN', 'ADMIN', 'SUCCESS', 'ID: ' + id);
      return ResponseUtils.success(null, 'Hebahan berjaya dipadam.');
    } catch (e) {
      return ResponseUtils.error('Gagal memadam.');
    }
  }
  return { getPublicAnnouncements: getPublicAnnouncements, getAdminAnnouncements: getAdminAnnouncements, saveAnnouncement: saveAnnouncement, deleteAnnouncement: deleteAnnouncement };
})();

// --- Album Service (preserved) ---
const AlbumService = (function() {
  function getPublicHeroAlbum() {
    try {
      var a = SheetRepository.getHeroAlbum(true);
      if (a && a.length > 0) return a;
    } catch (e) {}
    return [{ id: 'default', url: AppConfig.get('LOGO_URL'), order: 1, fileName: 'Logo ESPB' }];
  }
  function getAdminHeroAlbum(token) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    return ResponseUtils.success(SheetRepository.getHeroAlbum(false));
  }
  function saveHeroAlbum(token, images) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    if (!Array.isArray(images)) return ResponseUtils.validationError('Format album tidak sah.');
    var clean = images.filter(function(img) { return img && img.url && img.url.startsWith('http'); }).slice(0, 10).map(function(img) {
      return { url: ValidationUtils.sanitizeUrl(img.url), fileName: ValidationUtils.sanitizeString(img.fileName, 100) || 'Gambar Album' };
    });
    SheetRepository.saveHeroAlbum(clean);
    LoggerUtils.audit('SAVE_HERO_ALBUM', 'ADMIN', 'SUCCESS', clean.length + ' keping gambar.');
    return ResponseUtils.success(clean, 'Album hero berjaya disimpan.');
  }
  function clearHeroAlbum(token) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    SheetRepository.clearHeroAlbum();
    LoggerUtils.audit('CLEAR_HERO_ALBUM', 'ADMIN', 'SUCCESS', 'Album dikosongkan.');
    return ResponseUtils.success(null, 'Album hero dikosongkan.');
  }
  return { getPublicHeroAlbum: getPublicHeroAlbum, getAdminHeroAlbum: getAdminHeroAlbum, saveHeroAlbum: saveHeroAlbum, clearHeroAlbum: clearHeroAlbum };
})();

// --- Unit Service (REWRITTEN — database-driven) ---
const UnitService = (function() {
  const STATIC_UNIT_REGISTRY = {
    // SISC+
    'unit-bm': {
      unitId: 'unit-bm', unitName: 'Bahasa Melayu',
      title: 'Bahasa Melayu \u2013 SISC+ Sektor Pembelajaran',
      tagline: 'Sokongan instruksional bagi pengajaran dan pembelajaran Bahasa Melayu di sekolah-sekolah daerah Beluran.',
      description: 'Bahasa Melayu di bawah SISC+ bertanggungjawab menyediakan bimbingan instruksional pedagogi kepada guru-guru Bahasa Melayu di sekolah-sekolah daerah Beluran.',
      icon: 'book-open', categoryId: 'sisc', hasDocuments: true,
      driveFolderId: '159M4lHFo2ev-qx5ZgH1LbxIGEKHsgOXE',
      externalLink: '', logoFileId: '', bannerFileId: '',
      displayOrder: 1, status: 'active'
    },
    'unit-bi': {
      unitId: 'unit-bi', unitName: 'Bahasa Inggeris',
      title: 'Bahasa Inggeris \u2013 SISC+ Sektor Pembelajaran',
      tagline: 'Sokongan instruksional bagi pengajaran dan pembelajaran Bahasa Inggeris di sekolah-sekolah daerah Beluran.',
      description: 'Bahasa Inggeris di bawah SISC+ bertanggungjawab menyediakan bimbingan instruksional pedagogi kepada guru-guru Bahasa Inggeris di sekolah-sekolah daerah Beluran.',
      icon: 'globe', categoryId: 'sisc', hasDocuments: true,
      driveFolderId: '1Zhp0HQm1-oDXzdPYlv1Ug4TIjyN7C4h1',
      externalLink: '', logoFileId: '', bannerFileId: '',
      displayOrder: 2, status: 'active'
    },
    'unit-sejarah': {
      unitId: 'unit-sejarah', unitName: 'Sejarah',
      title: 'Sejarah \u2013 SISC+ Sektor Pembelajaran',
      tagline: 'Sokongan instruksional pengajaran dan penghayatan Sejarah kebangsaan.',
      description: 'Sejarah menyediakan bimbingan instruksional pedagogi kepada guru-guru Sejarah di sekolah-sekolah daerah Beluran.',
      icon: 'landmark', categoryId: 'sisc', hasDocuments: false,
      driveFolderId: '',
      externalLink: '', logoFileId: '', bannerFileId: '',
      displayOrder: 3, status: 'active'
    },
    'unit-sains': {
      unitId: 'unit-sains', unitName: 'Sains', title: 'Sains', tagline: 'Sokongan instruksional, STEM dan amali PdPc Sains di daerah Beluran.', description: 'Sokongan instruksional, STEM dan amali PdPc Sains di daerah Beluran.', icon: 'flask', categoryId: 'sisc', hasDocuments: false, externalLink: 'https://mylink.la/spb_beluran2020', driveFolderId: '', displayOrder: 4, status: 'active'
    },
    'unit-matematik': {
      unitId: 'unit-matematik', unitName: 'Matematik', title: 'Matematik', tagline: 'Sokongan instruksional dan penyelesaian masalah berfikir aras tinggi (KBAT).', description: 'Sokongan instruksional dan penyelesaian masalah berfikir aras tinggi (KBAT).', icon: 'calculator', categoryId: 'sisc', hasDocuments: false, externalLink: 'https://mylink.la/spb_beluran2020', driveFolderId: '', displayOrder: 5, status: 'active'
    },

    // UNIT-UNIT SEKTOR PEMBELAJARAN (formerly Sokongan)
    'unit-bahasa': {
      unitId: 'unit-bahasa', unitName: 'UNIT BAHASA', title: 'UNIT BAHASA', tagline: 'Pengurusan dan sokongan Unit Bahasa.', description: 'Pengurusan dan sokongan program Unit Bahasa.', icon: 'book', categoryId: 'sokongan', hasDocuments: true, driveFolderId: '', externalLink: '', displayOrder: 6, status: 'active'
    },
    'unit-sains-matematik': {
      unitId: 'unit-sains-matematik', unitName: 'UNIT SAINS DAN MATEMATIK', title: 'UNIT SAINS DAN MATEMATIK', tagline: 'Pengurusan dan sokongan Sains dan Matematik.', description: 'Pengurusan dan sokongan program Sains dan Matematik.', icon: 'flask', categoryId: 'sokongan', hasDocuments: true, driveFolderId: '', externalLink: '', displayOrder: 7, status: 'active'
    },
    'unit-pendidikan-islam': {
      unitId: 'unit-pendidikan-islam', unitName: 'UNIT PENDIDIKAN ISLAM', title: 'UNIT PENDIDIKAN ISLAM', tagline: 'Pengurusan dan sokongan Pendidikan Islam.', description: 'Pengurusan dan sokongan Pendidikan Islam.', icon: 'moon', categoryId: 'sokongan', hasDocuments: true, driveFolderId: '', externalLink: '', displayOrder: 8, status: 'active'
    },
    'unit-pendidikan-khas': {
      unitId: 'unit-pendidikan-khas', unitName: 'UNIT PENDIDIKAN KHAS', title: 'UNIT PENDIDIKAN KHAS', tagline: 'Pengurusan dan sokongan Pendidikan Khas.', description: 'Pengurusan dan sokongan Pendidikan Khas.', icon: 'users', categoryId: 'sokongan', hasDocuments: true, driveFolderId: '', externalLink: '', displayOrder: 9, status: 'active'
    },
    'unit-pemulihan-khas': {
      unitId: 'unit-pemulihan-khas', unitName: 'UNIT PEMULIHAN KHAS', title: 'UNIT PEMULIHAN KHAS', tagline: 'Pengurusan dan sokongan Pemulihan Khas.', description: 'Pengurusan dan sokongan Pemulihan Khas.', icon: 'heart', categoryId: 'sokongan', hasDocuments: true, driveFolderId: '', externalLink: '', displayOrder: 10, status: 'active'
    },
    'unit-ustp': {
      unitId: 'unit-ustp', unitName: 'UNIT SUMBER DAN TEKNOLOGI PENDIDIKAN', title: 'UNIT SUMBER DAN TEKNOLOGI PENDIDIKAN', tagline: 'Pengurusan dan sokongan Sumber Teknologi Pendidikan.', description: 'Pengurusan dan sokongan Sumber Teknologi Pendidikan.', icon: 'monitor', categoryId: 'sokongan', hasDocuments: true, driveFolderId: '', externalLink: '', displayOrder: 11, status: 'active'
    },
    'unit-tvet': {
      unitId: 'unit-tvet', unitName: 'TVET', title: 'TVET', tagline: 'Pengurusan dan sokongan TVET.', description: 'Pengurusan dan sokongan TVET.', icon: 'tool', categoryId: 'sokongan', hasDocuments: true, driveFolderId: '', externalLink: '', displayOrder: 12, status: 'active'
    },
    'unit-sains-sosial': {
      unitId: 'unit-sains-sosial', unitName: 'SAINS SOSIAL', title: 'SAINS SOSIAL', tagline: 'Pengurusan dan sokongan Sains Sosial.', description: 'Pengurusan dan sokongan Sains Sosial.', icon: 'users', categoryId: 'sokongan', hasDocuments: true, driveFolderId: '', externalLink: '', displayOrder: 13, status: 'active'
    }
  };

  function getMergedActiveUnits(includeDocsCount) {
    var units = UnitRepository.getActiveUnits(includeDocsCount);
    var dbIds = {};
    for (var i = 0; i < units.length; i++) dbIds[units[i].unitId] = true;
    for (var key in STATIC_UNIT_REGISTRY) {
      if (!dbIds[key]) {
        units.push(STATIC_UNIT_REGISTRY[key]);
      }
    }
    units.sort(function(a, b) { return (a.displayOrder || 99) - (b.displayOrder || 99); });
    return units;
  }
  function getUnitsHierarchy() {
    var cache = CacheService.getScriptCache();
    var cached = cache.get('cache_units_hierarchy_v6');
    if (cached) { try { return JSON.parse(cached); } catch (e) {} }

    var categories = UnitRepository.getCategories();
    var units = getMergedActiveUnits(false);
    var hierarchy = [];
    for (var c = 0; c < categories.length; c++) {
      var cat = categories[c];
      var catUnits = units.filter(function(u) { return u.categoryId === cat.categoryId; });
      hierarchy.push({
        category: cat.categoryName,
        icon: cat.icon,
        description: cat.description,
        units: catUnits.map(function(u) {
          return {
            id: u.unitId, name: u.unitName, description: u.tagline,
            link: (u.externalLink && u.externalLink.trim() !== '') ? u.externalLink.trim() : ('?page=unit&id=' + u.unitId), 
            external: (u.externalLink && u.externalLink.trim() !== ''), 
            icon: u.icon,
            badge: null
          };
        })
      });
    }
    try { cache.put('cache_units_hierarchy_v6', JSON.stringify(hierarchy), Number(AppConfig.get('CACHE_TTL_PUBLIC_DATA')) || 600); } catch (e) {}
    return hierarchy;
  }

  function getQuickAccessServices() {
    return QuickAccessRepository.getServices(true);
  }

  function getUnitRegistry() {
    var units = getMergedActiveUnits(true);
    return units.map(function(u) {
      return { id: u.unitId, name: u.unitName, icon: u.icon, categoryGroup: u.categoryId, hasDocuments: u.hasDocuments, badge: null };
    });
  }

  function getUnitPortalData(unitId) {
    var key = String(unitId || '').toLowerCase();
    var unit = UnitRepository.getUnitById(key);

    if (!unit) {
      if (STATIC_UNIT_REGISTRY[key]) {
        unit = STATIC_UNIT_REGISTRY[key];
      } else {
        return {
          unit: {
            id: key, name: 'Unit Tidak Ditemui', title: 'Unit Tidak Ditemui',
            tagline: 'Unit yang diminta tidak wujud dalam sistem.',
            description: 'Sila kembali ke halaman Unit Sektor untuk melihat senarai penuh unit yang tersedia.',
            icon: 'alert-circle', hasDocuments: false, responsibilities: [], services: [], notFound: true
          },
          documents: [], employees: []
        };
      }
    }

    var folderId = String(unit.driveFolderId || '').trim();
    var hasDocs = String(unit.hasDocuments) === 'true' || unit.hasDocuments === true || folderId !== '';

    // Get content sections for responsibilities and services
    var content = UnitRepository.getUnitContent(key);
    var responsibilities = [];
    var services = [];
    for (var i = 0; i < content.length; i++) {
      if (content[i].sectionType === 'responsibility') {
        responsibilities.push(content[i].title || content[i].content);
      } else if (content[i].sectionType === 'service') {
        services.push(content[i].title || content[i].content);
      }
    }

    // Get documents
    var docs = [];
    if (hasDocs) {
      var dbDocs = DocumentRepository.getActiveDocuments(key);
      var driveDocs = [];
      if (folderId) {
        try {
          driveDocs = DriveRepository.getFolderDocuments(folderId);
        } catch (e) {
          LoggerUtils.warn('UnitService', 'Drive folder error for ' + key, e);
        }
      }
      
      var docMap = {};
      for (var i = 0; i < dbDocs.length; i++) {
        var fid = dbDocs[i].fileId || dbDocs[i].id;
        if (fid) docMap[fid] = true;
        docs.push(dbDocs[i]);
      }
      for (var j = 0; j < driveDocs.length; j++) {
        var did = driveDocs[j].id || driveDocs[j].fileId;
        if (did && !docMap[did]) {
          docs.push(driveDocs[j]);
        }
      }
    }

    // Get employees
    var employees = EmployeeRepository.getActiveEmployees(key);

    return {
      unit: {
        id: unit.unitId, name: unit.unitName, title: unit.title,
        tagline: unit.tagline, description: unit.description, icon: unit.icon,
        categoryGroup: unit.categoryId, hasDocuments: hasDocs,
        externalLink: unit.externalLink || null,
        driveFolderId: folderId,
        logoUrl: unit.logoFileId ? 'https://lh3.googleusercontent.com/d/' + unit.logoFileId : '',
        bannerUrl: unit.bannerFileId ? 'https://lh3.googleusercontent.com/d/' + unit.bannerFileId : '',
        badge: null,
        responsibilities: responsibilities, services: services
      },
      documents: docs,
      employees: employees
    };
  }

  // Navigation data for dynamic menu building
  function getNavigationData() {
    var categories = UnitRepository.getCategories();
    var units = getMergedActiveUnits(true);
    var nav = [];
    for (var c = 0; c < categories.length; c++) {
      var cat = categories[c];
      var catUnits = units.filter(function(u) { return u.categoryId === cat.categoryId; });
      nav.push({
        label: cat.categoryName,
        units: catUnits.map(function(u) {
          return { id: u.unitId, name: u.unitName, hasDocuments: u.hasDocuments, externalLink: u.externalLink || '' };
        })
      });
    }
    return nav;
  }

  return { getUnitsHierarchy: getUnitsHierarchy, getQuickAccessServices: getQuickAccessServices, getUnitPortalData: getUnitPortalData, getUnitRegistry: getUnitRegistry, getNavigationData: getNavigationData };
})();

// --- Employee Service (NEW) ---
const EmployeeService = (function() {
  function getAdminEmployees(token) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    try {
      var employees = EmployeeRepository.getAllEmployees();
      var units = UnitRepository.getActiveUnits(true);
      var unitMap = {};
      for (var i = 0; i < units.length; i++) unitMap[units[i].unitId] = units[i].unitName;
      for (var j = 0; j < employees.length; j++) {
        employees[j].unitName = unitMap[employees[j].unitId] || employees[j].unitId;
        if (employees[j].photoFileId) {
          employees[j].photoUrl = 'https://lh3.googleusercontent.com/d/' + employees[j].photoFileId;
        }
      }
      return ResponseUtils.success(employees);
    } catch (e) {
      return ResponseUtils.error('Gagal memuatkan senarai pegawai: ' + e.message);
    }
  }
  function saveEmployee(token, data) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    if (!data || !data.name) return ResponseUtils.validationError('Nama pegawai wajib diisi.');
    try {
      var id = EmployeeRepository.saveEmployee(data);
      LoggerUtils.audit(data.employeeId ? 'UPDATE_EMPLOYEE' : 'CREATE_EMPLOYEE', 'ADMIN', 'SUCCESS', (data.employeeId ? 'Dikemas kini: ' : 'Dicipta: ') + data.name);
      return ResponseUtils.success({ employeeId: id }, 'Maklumat pegawai berjaya disimpan.');
    } catch (e) {
      return ResponseUtils.error('Gagal menyimpan: ' + e.message);
    }
  }
  function deleteEmployee(token, employeeId) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    try {
      EmployeeRepository.deleteEmployee(employeeId);
      LoggerUtils.audit('DELETE_EMPLOYEE', 'ADMIN', 'SUCCESS', 'ID: ' + employeeId);
      return ResponseUtils.success(null, 'Pegawai berjaya dinyahaktifkan.');
    } catch (e) {
      return ResponseUtils.error('Gagal memadam pegawai.');
    }
  }
  return { getAdminEmployees: getAdminEmployees, saveEmployee: saveEmployee, deleteEmployee: deleteEmployee };
})();

// --- Document Management Service (NEW) ---
const DocumentManagementService = (function() {
  function getAdminDocuments(token, unitId) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    try {
      var docs = unitId ? DocumentRepository.getActiveDocuments(unitId) : DocumentRepository.getAllDocuments();
      return ResponseUtils.success(docs);
    } catch (e) {
      return ResponseUtils.error('Gagal memuatkan dokumen: ' + e.message);
    }
  }
  function saveDocument(token, data) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    if (!data || !data.title) return ResponseUtils.validationError('Tajuk dokumen wajib diisi.');
    try {
      var id = DocumentRepository.saveDocument(data);
      LoggerUtils.audit(data.documentId ? 'UPDATE_DOCUMENT' : 'CREATE_DOCUMENT', 'ADMIN', 'SUCCESS', data.title);
      return ResponseUtils.success({ documentId: id }, 'Dokumen berjaya disimpan.');
    } catch (e) {
      return ResponseUtils.error('Gagal menyimpan dokumen: ' + e.message);
    }
  }
  function deleteDocument(token, documentId) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    try {
      var docs = DocumentRepository.getAllDocuments();
      var doc = docs.find(function(d) { return d.documentId === documentId; });
      
      if (doc && doc.fileId) {
        try {
          var fId = doc.fileId;
          var match = fId.match(/[-\w]{25,}/);
          if (match) fId = match[0];
          var file = DriveApp.getFileById(fId);
          file.setTrashed(true);
        } catch(fe) {
          Logger.log('Gagal memadam fail dari Drive: ' + fe.message);
        }
      }

      DocumentRepository.deleteDocument(documentId);
      LoggerUtils.audit('DELETE_DOCUMENT', 'ADMIN', 'SUCCESS', 'ID: ' + documentId);
      return ResponseUtils.success(null, 'Dokumen berjaya dipadam.');
    } catch (e) {
      return ResponseUtils.error('Gagal memadam dokumen: ' + e.message);
    }
  }

  function syncDriveFiles(token) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    try {
      var targetFolder = DriveRepository.getDocumentsFolder();
      var files = targetFolder.getFiles();
      var existingDocs = DocumentRepository.getAllDocuments();
      var existingFileIds = {};
      for (var i = 0; i < existingDocs.length; i++) {
        var fId = existingDocs[i].fileId;
        if (fId) {
          existingFileIds[fId] = true;
          var match = fId.match(/[-\w]{25,}/);
          if (match) existingFileIds[match[0]] = true;
        }
      }
      
      var newFilesAdded = 0;
      while (files.hasNext()) {
        var file = files.next();
        if (file.isTrashed()) continue;
        var fid = file.getId();
        if (!existingFileIds[fid]) {
          var data = {
            documentId: ValidationUtils.generateId('DOC'),
            title: file.getName().replace(/\.[^/.]+$/, ''),
            fileId: fid,
            fileName: file.getName(),
            fileSize: (file.getSize() / 1024 / 1024).toFixed(2) + ' MB',
            category: 'Umum',
            unitId: 'umum',
            status: 'active'
          };
          DocumentRepository.saveDocument(data);
          newFilesAdded++;
        }
      }
      return ResponseUtils.success({ added: newFilesAdded }, newFilesAdded + ' fail baharu telah diselaraskan.');
    } catch (e) {
      return ResponseUtils.error('Gagal menyelaraskan fail: ' + e.message);
    }
  }
  function uploadDocumentFile(token, payload) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    try {
      var targetFolder = payload && payload.unitId
        ? DriveRepository.getUnitFolder(payload.unitId, payload.unitName)
        : DriveRepository.getDocumentsFolder();
      var saved = DriveRepository.saveBase64File(payload, targetFolder);
      LoggerUtils.audit('UPLOAD_DOCUMENT', 'ADMIN', 'SUCCESS', saved.fileName);
      return ResponseUtils.success(saved, 'Fail dokumen berjaya dimuat naik.');
    } catch (e) {
      return ResponseUtils.error('Gagal muat naik fail: ' + e.message);
    }
  }
  return { getAdminDocuments: getAdminDocuments, saveDocument: saveDocument, deleteDocument: deleteDocument, uploadDocumentFile: uploadDocumentFile, syncDriveFiles: syncDriveFiles };
})();

// --- Unit Admin Service (NEW) ---
const UnitAdminService = (function() {
  function getAdminUnits(token) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    try {
      var units = UnitRepository.getAllUnits();
      var categories = UnitRepository.getCategories();
      return ResponseUtils.success({ units: units, categories: categories });
    } catch (e) {
      return ResponseUtils.error('Gagal memuatkan unit: ' + e.message);
    }
  }
  function saveUnit(token, data) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    if (!data || !data.unitName) return ResponseUtils.validationError('Nama unit wajib diisi.');
    try {
      var id = UnitRepository.saveUnit(data);
      LoggerUtils.audit(data.unitId ? 'UPDATE_UNIT' : 'CREATE_UNIT', 'ADMIN', 'SUCCESS', data.unitName);
      return ResponseUtils.success({ unitId: id }, 'Unit berjaya disimpan.');
    } catch (e) {
      return ResponseUtils.error('Gagal menyimpan unit: ' + e.message);
    }
  }
  function deleteUnit(token, unitId) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    try {
      UnitRepository.deleteUnit(unitId);
      LoggerUtils.audit('DELETE_UNIT', 'ADMIN', 'SUCCESS', 'ID: ' + unitId);
      return ResponseUtils.success(null, 'Unit berjaya dinyahaktifkan.');
    } catch (e) {
      return ResponseUtils.error('Gagal memadam unit.');
    }
  }
  function getAdminUnitContent(token, unitId) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    try {
      var content = UnitRepository.getUnitContent(unitId);
      return ResponseUtils.success(content);
    } catch (e) {
      return ResponseUtils.error('Gagal memuatkan kandungan unit: ' + e.message);
    }
  }
  function saveUnitContent(token, data) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    try {
      UnitRepository.saveUnitContent(data);
      LoggerUtils.audit('SAVE_UNIT_CONTENT', 'ADMIN', 'SUCCESS', data.title || data.sectionType);
      return ResponseUtils.success(null, 'Kandungan unit berjaya disimpan.');
    } catch (e) {
      return ResponseUtils.error('Gagal menyimpan kandungan: ' + e.message);
    }
  }
  function deleteUnitContent(token, contentId) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    try {
      UnitRepository.deleteUnitContent(contentId);
      return ResponseUtils.success(null, 'Kandungan berjaya dipadam.');
    } catch (e) {
      return ResponseUtils.error('Gagal memadam kandungan.');
    }
  }
  function saveCategory(token, data) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    try {
      UnitRepository.saveCategory(data);
      return ResponseUtils.success(null, 'Kategori berjaya disimpan.');
    } catch (e) {
      return ResponseUtils.error('Gagal menyimpan kategori: ' + e.message);
    }
  }
  function addHebahan(token, payload) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    try {
      var id = SheetRepository.insertAnnouncement(payload);
      LoggerUtils.audit('CREATE_HEBAHAN', 'ADMIN', 'SUCCESS', payload.title);
      return ResponseUtils.success({ id: id }, 'Hebahan berjaya disimpan.');
    } catch (e) {
      LoggerUtils.error('INSERT_HEBAHAN', e);
      return ResponseUtils.error('Gagal menyimpan hebahan.', 'INSERT_ERROR', e.message);
    }
  }
  return { getAdminUnits: getAdminUnits, saveUnit: saveUnit, deleteUnit: deleteUnit, getAdminUnitContent: getAdminUnitContent, saveUnitContent: saveUnitContent, deleteUnitContent: deleteUnitContent, saveCategory: saveCategory, addHebahan: addHebahan };
})();

// --- File Service (enhanced) ---
const FileService = (function() {
  function uploadImage(token, payload) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
    try {
      var targetFolder = null;
      if (payload && payload.targetType === 'hero') {
        targetFolder = DriveRepository.getHeroAlbumFolder();
      } else if (payload && payload.targetType === 'hebahan') {
        targetFolder = DriveRepository.getHebahanFolder();
      } else if (payload && payload.targetType === 'employee') {
        targetFolder = DriveRepository.getEmployeesFolder();
      } else if (payload && payload.unitId) {
        targetFolder = DriveRepository.getUnitFolder(payload.unitId, payload.unitName);
      } else {
        targetFolder = DriveRepository.getUploadFolder();
      }
      var saved = DriveRepository.saveBase64Image(payload, targetFolder);
      LoggerUtils.audit('UPLOAD_IMAGE', 'ADMIN', 'SUCCESS', saved.fileName);
      return ResponseUtils.success(saved, 'Imej berjaya dimuat naik ke Drive.');
    } catch (e) {
      return ResponseUtils.error('Gagal muat naik: ' + e.message);
    }
  }
  return { uploadImage: uploadImage };
})();

// ============================================================================
// 14. SYSTEM SETUP & SEED DATA
// ============================================================================
function runSetup() {
  Logger.log('===========================================================');
  Logger.log('  MEMULAKAN INSIALISASI GOOGLE DRIVE & DATABASE ESPB v2.0  ');
  Logger.log('===========================================================');
  try {
    // 1. Provision all folders hierarchical
    Logger.log('1. Mencipta struktur folder mengikut Unit & Sektor di Google Drive...');
    var folders = DriveRepository.provisionAllFolders();
    Logger.log('   -> Folder Utama: ' + folders.root.getName() + ' (' + folders.root.getUrl() + ')');
    Logger.log('   -> 01_Pangkalan_Data: ' + folders.database.getId());
    Logger.log('   -> 02_Unit_Sektor: ' + folders.unitSektor.getId());
    Logger.log('   -> 03_Hebahan: ' + folders.hebahan.getId());
    Logger.log('   -> 04_Hero_Album: ' + folders.heroAlbum.getId());
    Logger.log('   -> 05_Pegawai_Staf: ' + folders.employees.getId());
    Logger.log('   -> 06_Dokumen_Umum: ' + folders.documents.getId());
    Logger.log('   -> 07_Muat_Naik_Umum: ' + folders.uploads.getId());

    // 2. Create or verify Master Spreadsheet inside 01_Pangkalan_Data
    Logger.log('2. Menyemak Google Spreadsheet Master Database...');
    var ssId = AppConfig.get('SPREADSHEET_ID');
    var ss = null;
    if (ssId) {
      try { 
        ss = SpreadsheetApp.openById(ssId); 
        // Test if user has EDIT access by setting the locale to itself
        ss.setSpreadsheetLocale(ss.getSpreadsheetLocale());
      } catch(e) { 
        ss = null; 
      }
    }
    if (!ss) {
      var dbFiles = folders.database.getFilesByName('ESPB_Master_Database');
      if (dbFiles.hasNext()) {
        var existingFile = dbFiles.next();
        try {
          ss = SpreadsheetApp.openById(existingFile.getId());
          // Test if user has EDIT access by setting the locale to itself
          ss.setSpreadsheetLocale(ss.getSpreadsheetLocale());
          AppConfig.set('SPREADSHEET_ID', ss.getId());
          Logger.log('   -> Spreadsheet sedia ada ditemui: ' + ss.getId());
        } catch(e) {
          Logger.log('   -> Fail ditemui tetapi ralat akses / format: ' + e.message);
          ss = null;
        }
      }
    }
    if (!ss) {
      ss = SpreadsheetApp.create('ESPB_Master_Database');
      var ssFile = DriveApp.getFileById(ss.getId());
      folders.database.addFile(ssFile);
      try { DriveApp.getRootFolder().removeFile(ssFile); } catch(e) {}
      try { setPublicViewSharing(ssFile); } catch(e) {}
      AppConfig.set('SPREADSHEET_ID', ss.getId());
      Logger.log('   -> Spreadsheet baharu berjaya dicipta di 01_Pangkalan_Data: ' + ss.getId());
    }

    // 3. Create all required sheets
    Logger.log('3. Menyemak lembaran kerja (sheets)...');
    DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_SETTINGS'), ['key', 'value', 'description', 'updatedAt']);
    DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_HEBAHAN'), ['ID', 'Tarikh', 'Kategori', 'Tajuk', 'Ringkasan', 'Pautan', 'Gambar URL', 'Dicipta Pada']);
    DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_HERO_ALBUM'), ['ID', 'URL Gambar', 'Susunan', 'Nama Fail', 'Dicipta Pada']);
    DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_AUDIT_LOG'), ['Timestamp', 'Action', 'User Identifier', 'Status', 'Details']);
    DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_UNITS'), UnitRepository.UNIT_HEADERS);
    DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_UNIT_CATEGORIES'), UnitRepository.CAT_HEADERS);
    DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_UNIT_CONTENT'), UnitRepository.CONTENT_HEADERS);
    DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_EMPLOYEES'), EmployeeRepository.HEADERS);
    DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_DOCUMENTS'), DocumentRepository.HEADERS);

    // 4. Seed categories if empty
    var existingCats = UnitRepository.getCategories();
    if (existingCats.length === 0) {
      Logger.log('4. Seeding kategori Unit Sektor...');
      seedCategories_();
    }

    // 5. Seed units if empty, OR update existing units with their dedicated Drive folder IDs
    var existingUnits = UnitRepository.getAllUnits();
    if (existingUnits.length === 0) {
      Logger.log('5. Seeding 9 Unit Sektor dengan folder Drive masing-masing...');
      seedUnits_(folders.unitFolders);
    } else {
      Logger.log('5. Mengemas kini ID folder Drive untuk unit sedia ada...');
      syncUnitDriveFolders_(folders.unitFolders);
    }

    // 6. Seed initial media if empty
    seedInitialMediaIfEmpty_();

    // 7. Config setup (Legacy auth removed)
    DatabaseHelper.invalidateCache(['cache_units', 'cache_units_hierarchy', 'cache_announcements', 'cache_hero_album']);

    LoggerUtils.audit('SYSTEM_SETUP', 'ADMIN', 'SUCCESS', 'Persediaan Google Drive & Pangkalan Data selesai.');
    Logger.log('===========================================================');
    Logger.log('  PERSEDIAAN BERJAYA DISELESAIKAN!');
    Logger.log('  Root Folder: ' + folders.root.getUrl());
    Logger.log('  Database Sheet: ' + ss.getUrl());
    Logger.log('===========================================================');

    return {
      status: 'success',
      message: 'Folder Google Drive & Pangkalan Data berjaya dicipta dan dihubungkan!',
      spreadsheetUrl: ss.getUrl(),
      spreadsheetId: ss.getId(),
      rootFolderUrl: folders.root.getUrl(),
      rootFolderId: folders.root.getId()
    };
  } catch (e) {
    Logger.log('RALAT PERSEDIAAN: ' + e.toString());
    throw new Error('Ralat semasa persediaan Google Drive: ' + e.message);
  }
}

function syncUnitDriveFolders_(unitFoldersMap) {
  try {
    var sheet = DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_UNITS'), UnitRepository.UNIT_HEADERS);
    var colMap = DatabaseHelper.getColumnMap(sheet);
    var folderColIdx = colMap['driveFolderId'] + 1;
    var rows = DatabaseHelper.getAllRows(AppConfig.get('SHEET_UNITS'), UnitRepository.UNIT_HEADERS);

    for (var i = 0; i < rows.length; i++) {
      var u = rows[i];
      var folder = unitFoldersMap ? unitFoldersMap[u.unitId] : null;
      if (!folder) {
        folder = DriveRepository.getUnitFolder(u.unitId, u.unitName);
      }
      if (folder) {
        sheet.getRange(u._rowIndex, folderColIdx).setValue(folder.getId());
      }
    }
  } catch (e) {
    Logger.log('Ralat syncUnitDriveFolders_: ' + e.toString());
  }
}

function seedInitialMediaIfEmpty_() {
  try {
    var now = new Date();
    var hebahanSheet = DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_HEBAHAN'));
    if (hebahanSheet.getLastRow() < 2) {
      hebahanSheet.appendRow([
        ValidationUtils.generateId('HEB'),
        now,
        'Rasmi',
        'Pelancaran Portal Rasmi E-SPb Sektor Pembelajaran PPD Beluran',
        'Selamat datang ke Portal Rasmi E-SPb Sektor Pembelajaran Pejabat Pendidikan Daerah Beluran. Portal ini menghimpunkan maklumat terkini, perkongsian instruksional dan repositori dokumen unit-unit sektor.',
        '',
        AppConfig.get('LOGO_URL'),
        now
      ]);
    }
    var albumSheet = DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_HERO_ALBUM'));
    if (albumSheet.getLastRow() < 2) {
      albumSheet.appendRow([
        ValidationUtils.generateId('ALB'),
        AppConfig.get('LOGO_URL'),
        1,
        'Banner Rasmi E-SPb Beluran',
        now
      ]);
    }
  } catch(e) {}
}

function seedCategories_() {
  var now = new Date();
  var sheet = DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_UNIT_CATEGORIES'), UnitRepository.CAT_HEADERS);
  var cats = [
    ['CAT_SISC', 'SISC+ (School Improvement Specialist Coaches)', 'Bimbingan dan sokongan pedagogi berterusan kepada guru-guru sekolah daerah Beluran.', 'users', 1, 'active', now, now],
    ['CAT_SOKONGAN', 'Unit-unit Sokongan & Pengurusan Pembelajaran', 'Penyelarasan program kurikulum khusus, bantuan pembelajaran dan teknologi pendidikan.', 'folder', 2, 'active', now, now]
  ];
  for (var i = 0; i < cats.length; i++) sheet.appendRow(cats[i]);
}

function seedUnits_(unitFoldersMap) {
  var now = new Date();
  var sheet = DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_UNITS'), UnitRepository.UNIT_HEADERS);
  var contentSheet = DatabaseHelper.getOrCreateSheet(AppConfig.get('SHEET_UNIT_CONTENT'), UnitRepository.CONTENT_HEADERS);
  var units = [
    { id: 'unit-bm', code: 'BM', name: 'Unit Bahasa Melayu', title: 'Unit Bahasa Melayu – SISC+ Sektor Pembelajaran', tagline: 'Sokongan instruksional bagi pengajaran dan pembelajaran Bahasa Melayu di sekolah-sekolah daerah Beluran.', desc: 'Unit Bahasa Melayu di bawah SISC+ bertanggungjawab menyediakan bimbingan instruksional pedagogi kepada guru-guru Bahasa Melayu di sekolah-sekolah daerah Beluran.', icon: 'book-open', cat: 'CAT_SISC', order: 1, hasDocs: true, resp: ['Bimbingan instruksional guru Bahasa Melayu (pencerapan PdPc)', 'Bengkel pemantapan pedagogi dan strategi pengajaran', 'Program peningkatan literasi dan LINUS Bahasa Melayu', 'Penyelarasan bahan pengajaran dan kurikulum DSKP', 'Pelaporan data pencapaian murid dalam Bahasa Melayu'], serv: ['Bimbingan pedagogi guru secara berfokus', 'Bengkel dan latihan dalam perkhidmatan (LDP)', 'Perkongsian profesional dan PLC'] },
    { id: 'unit-bi', code: 'BI', name: 'Unit Bahasa Inggeris', title: 'Unit Bahasa Inggeris – SISC+ Sektor Pembelajaran', tagline: 'Sokongan instruksional dan peningkatan kecekapan pedagogi Bahasa Inggeris di daerah Beluran.', desc: 'Unit Bahasa Inggeris menyediakan bimbingan pedagogi kepada guru-guru Bahasa Inggeris di daerah Beluran.', icon: 'globe', cat: 'CAT_SISC', order: 2, hasDocs: true, resp: ['Bimbingan instruksional guru Bahasa Inggeris', 'Program CEFR dan penjajaran kurikulum', 'Pelaksanaan Highly Immersive Programme (HIP)', 'Bengkel pemantapan pengajaran bahasa', 'Pemantauan pencapaian profisiensi murid'], serv: ['Bimbingan pedagogi guru secara berfokus', 'Program HIP (Highly Immersive Programme)', 'Bengkel penulisan dan komunikasi bahasa'] },
    { id: 'unit-sains', code: 'SN', name: 'Unit Sains', title: 'Unit Sains – SISC+ Sektor Pembelajaran', tagline: 'Sokongan instruksional, STEM dan amali pengajaran dan pembelajaran Sains di daerah Beluran.', desc: 'Unit Sains bertanggungjawab membimbing guru-guru Sains dalam pedagogi berkesan termasuk pendekatan STEM.', icon: 'flask', cat: 'CAT_SISC', order: 3, hasDocs: false, ext: 'https://mylink.la/spb_beluran2020', resp: ['Bimbingan instruksional guru Sains', 'Program pendekatan STEM dan amali sains', 'Peningkatan kemahiran proses sains (KPS)', 'Penerapan KBAT dalam PdPc Sains', 'Pelaporan dan pemantauan pencapaian murid'], serv: ['Bimbingan pedagogi guru Sains', 'Bengkel STEM dan inovasi pedagogi', 'Program peningkatan amali sains'] },
    { id: 'unit-matematik', code: 'MT', name: 'Unit Matematik', title: 'Unit Matematik – SISC+ Sektor Pembelajaran', tagline: 'Sokongan instruksional dan penyelesaian masalah berfikir aras tinggi (KBAT) dalam Matematik.', desc: 'Unit Matematik membimbing guru-guru Matematik di daerah Beluran dalam meningkatkan kualiti pengajaran.', icon: 'calculator', cat: 'CAT_SISC', order: 4, hasDocs: false, ext: 'https://mylink.la/spb_beluran2020', resp: ['Bimbingan instruksional guru Matematik', 'Program peningkatan numerasi dan LINUS Matematik', 'Penerapan KBAT dan penyelesaian masalah', 'Bengkel pedagogi Matematik berasaskan aktiviti', 'Pemantauan dan pelaporan pencapaian murid'], serv: ['Bimbingan pedagogi guru Matematik', 'Program Peningkatan Numerasi', 'Bengkel dan latihan KBAT Matematik'] },
    { id: 'unit-sejarah', code: 'SJ', name: 'Unit Sejarah', title: 'Unit Sejarah – SISC+ Sektor Pembelajaran', tagline: 'Sokongan instruksional bagi pengajaran dan penghayatan Sejarah kebangsaan di daerah Beluran.', desc: 'Unit Sejarah membimbing guru-guru Sejarah dalam meningkatkan keberkesanan pengajaran.', icon: 'landmark', cat: 'CAT_SISC', order: 5, hasDocs: false, resp: ['Bimbingan instruksional guru Sejarah', 'Program pemantapan pedagogi pengajaran Sejarah', 'Penghayatan jati diri dan semangat patriotik', 'Bengkel sumber primer dan kajian tempatan', 'Pemantauan kemahiran pemikiran sejarah murid'], serv: ['Bimbingan pedagogi guru Sejarah', 'Program Penghayatan Sejarah', 'Bengkel sumber dan kaedah kajian tempatan'] },
    { id: 'pemulihan-khas', code: 'PK', name: 'Unit Pemulihan Khas', title: 'Unit Pemulihan Khas – Sektor Pembelajaran', tagline: 'Merancang, Mengurus, Menyelaras dan Menilai Pelaksanaan Program Pemulihan Khas Daerah Beluran.', desc: 'Unit Pemulihan Khas memastikan murid yang menghadapi kesukaran asas literasi dan numerasi Tahap 1 dibimbing dengan pedagogi khusus yang berkesan.', icon: 'refresh', cat: 'CAT_SOKONGAN', order: 6, hasDocs: true, resp: ['Penyelarasan dan pemantauan program Pemulihan Khas', 'Pengurusan instrumen penilaian (saringan dan diagnostik)', 'Bimbingan guru Pemulihan Khas di sekolah', 'Pengurusan repositori dokumen DSKP dan garis panduan', 'Pelaporan data murid Pemulihan Khas'], serv: ['Repositori dokumen rasmi dan DSKP', 'Instrumen penilaian saringan dan diagnostik', 'Bimbingan pedagogi guru Pemulihan Khas'] },
    { id: 'pendidikan-islam', code: 'PI', name: 'Unit Pendidikan Islam', title: 'Unit Pendidikan Islam – Sektor Pembelajaran', tagline: 'Penyelarasan kurikulum Pendidikan Islam, j-QAF dan aktiviti dakwah sekolah daerah Beluran.', desc: 'Unit Pendidikan Islam bertanggungjawab menyelaras pelaksanaan kurikulum Pendidikan Islam dan Moral, program j-QAF.', icon: 'mosque', cat: 'CAT_SOKONGAN', order: 7, hasDocs: false, resp: ['Penyelarasan kurikulum Pendidikan Islam dan Moral', 'Pelaksanaan program j-QAF (Jawi, Quran, Arab, Fardu Ain)', 'Pengurusan aktiviti keagamaan dan dakwah sekolah', 'Pemantauan dan bimbingan guru Pendidikan Islam', 'Pengurusan kelas KAFA dan program kokurikulum Islam'], serv: ['Program j-QAF dan kelas Al-Quran', 'Aktiviti dakwah dan keagamaan sekolah', 'Bengkel dan latihan guru Pendidikan Islam'] },
    { id: 'pendidikan-khas', code: 'PKh', name: 'Unit Pendidikan Khas', title: 'Unit Pendidikan Khas – Sektor Pembelajaran', tagline: 'Sokongan pendidikan inklusif bagi Murid Berkeperluan Pendidikan Khas (MBPK) di daerah Beluran.', desc: 'Unit Pendidikan Khas menyediakan sokongan pendidikan inklusif dan khusus kepada MBPK.', icon: 'accessibility', cat: 'CAT_SOKONGAN', order: 8, hasDocs: false, resp: ['Pemantauan program Pendidikan Khas Integrasi (PPKI)', 'Bimbingan guru Pendidikan Khas', 'Pengurusan Rancangan Pendidikan Individu (RPI)', 'Penyelarasan Program Pendidikan Inklusif (PPI)', 'Pelaporan data murid berkeperluan khas'], serv: ['Sokongan pelaksanaan pendidikan inklusif', 'Bimbingan penyediaan RPI', 'Bengkel dan latihan guru Pendidikan Khas'] },
    { id: 'ustp', code: 'USTP', name: 'Unit Sumber & Teknologi Pendidikan', title: 'Unit Sumber & Teknologi Pendidikan – Sektor Pembelajaran', tagline: 'Pengurusan pusat sumber sekolah, bahan pembelajaran digital dan DELIMa di daerah Beluran.', desc: 'USTP bertanggungjawab menyelaras pengurusan PSS, pelantar digital DELIMa, dan bahan bantu mengajar digital.', icon: 'tv', cat: 'CAT_SOKONGAN', order: 9, hasDocs: false, resp: ['Pengurusan Pusat Sumber Sekolah (PSS)', 'Penyelarasan penggunaan pelantar DELIMa', 'Pengurusan bahan bantu mengajar (BBM) digital', 'Program celik teknologi pendidikan guru', 'Pemantauan Nilam dan galakan membaca'], serv: ['Pelantar DELIMa dan sumber digital KPM', 'Pengurusan Pusat Sumber Sekolah', 'Bengkel teknologi pendidikan guru'] }
  ];

  for (var i = 0; i < units.length; i++) {
    var u = units[i];
    var folder = unitFoldersMap ? unitFoldersMap[u.id] : null;
    var folderId = folder ? folder.getId() : '';
    sheet.appendRow([u.id, u.code, u.name, u.title, u.tagline, u.desc, u.icon, u.cat, '', '', u.ext || '', u.order, 'active', u.hasDocs, folderId, now, now]);

    // Seed responsibilities as content
    for (var r = 0; r < u.resp.length; r++) {
      contentSheet.appendRow([ValidationUtils.generateId('CNT'), u.id, 'responsibility', u.resp[r], '', '', '', '', r + 1, 'active', now, now]);
    }
    // Seed services as content
    for (var s = 0; s < u.serv.length; s++) {
      contentSheet.appendRow([ValidationUtils.generateId('CNT'), u.id, 'service', u.serv[s], '', '', '', '', s + 1, 'active', now, now]);
    }
  }
}

// ============================================================================
// 15. MASTER ROUTER & HTTP CONTROLLER
// ============================================================================
function doGet(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var page = String(params.page || params.p || 'portal').toLowerCase().trim();
    var unitId = String(params.id || 'pemulihan-khas').toLowerCase().trim();

    var cacheKey = 'ESPB_CACHE_V2_' + page + '_' + unitId;
    var cachedHtml = CacheService.getScriptCache().get(cacheKey);
    var htmlOutput;
    
    var meta = AppConfig.getPublicPortalMeta();
    var pageTitle = meta.portalName + ' | ' + meta.sectorName;
    if (page === 'admin') pageTitle = 'Pentadbiran Sistem | ' + meta.portalName;
    else if (page === 'unit') {
      try {
        var u = UnitService.getUnitPortalData(unitId);
        pageTitle = u.unit.name + ' | ' + meta.portalName;
      } catch(ex) {}
    }

    if (cachedHtml && !params.nocache) {
      htmlOutput = HtmlService.createHtmlOutput(cachedHtml);
    } else {
      var templateName = 'Index';
      var template = HtmlService.createTemplateFromFile(templateName);
      
      var bootstrapData = {};
      try {
         var res = PublicPortalService.getInitialPortalData();
         if (res && res.data) bootstrapData = res.data;
      } catch (e) {}

      var initialUnitData = null;
      if (page === 'unit') {
         try {
            var uRes = PublicPortalService.getUnitPortalData(unitId);
            if (uRes && uRes.data) initialUnitData = uRes.data;
         } catch (e) {}
      }

      template.portalName = meta.portalName;
      template.sectorName = meta.sectorName;
      template.district = meta.district;
      template.state = meta.state;
      template.ministry = meta.ministry;
      template.contactEmail = meta.contactEmail;
      template.phone = meta.phone;
      template.address = meta.address;
      template.espbLogoUrl = meta.espbLogoUrl;
      template.jataNegaraUrl = meta.jataNegaraUrl;
      template.eKeberadaanUrl = meta.eKeberadaanUrl;
      template.cartaOrganisasiUrl = meta.cartaOrganisasiUrl;
      template.currentYear = meta.currentYear;
      template.activePage = page;
      template.activeUnitId = unitId;
      template.initialPortalDataStr = JSON.stringify(bootstrapData);
      template.initialUnitDataStr = initialUnitData ? JSON.stringify(initialUnitData) : 'null';
  
      htmlOutput = template.evaluate();
      
      try {
        CacheService.getScriptCache().put(cacheKey, htmlOutput.getContent(), 1800);
      } catch (err) {}
    }

    return htmlOutput
      .setTitle(pageTitle)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover')
      .addMetaTag('apple-mobile-web-app-capable', 'yes')
      .addMetaTag('mobile-web-app-capable', 'yes');

  } catch (error) {
    LoggerUtils.error('Router.doGet', 'Fatal error', error);
    return HtmlService.createHtmlOutput(
      '<div style="font-family:sans-serif;padding:40px;text-align:center;">' +
      '<h2 style="color:#0A2342;">Portal E-SPb PPDB</h2>' +
      '<p>Sistem sedang diselenggara. Sila muat semula halaman.</p>' +
      '<small style="color:#64748B;">Ralat: ' + (error.message || error) + '</small>' +
      '</div>'
    );
  }
}

function include(filename, data) {
  try {
    var template = HtmlService.createTemplateFromFile(filename);
    var meta = AppConfig.getPublicPortalMeta();
    var keys = Object.keys(meta);
    for (var i = 0; i < keys.length; i++) template[keys[i]] = meta[keys[i]];
    if (data) {
      var dKeys = Object.keys(data);
      for (var j = 0; j < dKeys.length; j++) template[dKeys[j]] = data[dKeys[j]];
    }
    return template.evaluate().getContent();
  } catch (e) {
    try {
      return HtmlService.createHtmlOutputFromFile(filename).getContent();
    } catch (e2) {
      return '<div style="padding:24px;text-align:center;background:#fef2f2;color:#991b1b;border:1px dashed #f87171;margin:20px;border-radius:10px;">' +
        '<strong>Komponen \'' + filename + '\' Tidak Ditemui</strong><br>' +
        '<p style="font-size:0.85rem;color:#4b5563;margin-top:6px;">Sila pastikan fail HTML bernama <code>' + filename + '</code> telah dicipta.</p>' +
        '</div>';
    }
  }
}

// ============================================================================
// 16. RPC CLIENT BRIDGES
// ============================================================================

// --- File Data & Base64 Handler (Supports Images & PDF.js Rendering) ---
function getFileData(fileId) {
  try {
    if (!fileId) throw new Error('ID fail tidak sah.');
    var file = DriveApp.getFileById(fileId);

    // Pastikan tetapan perkongsian (fallback ANYONE_WITH_LINK -> DOMAIN_WITH_LINK)
    try { setPublicViewSharing(file); } catch (e) {}

    var mime = '';
    try { mime = file.getMimeType() || ''; } catch (e) {}
    var name = '';
    try { name = file.getName() || ''; } catch (e) {}
    var size = 0;
    try { size = file.getSize(); } catch (e) { size = 0; }

    var isImage = (mime && mime.indexOf('image/') === 0) || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name);
    var isPdf = (mime === 'application/pdf') || /\.pdf$/i.test(name);
    var previewUrl = 'https://drive.google.com/file/d/' + fileId + '/preview';
    var directUrl = 'https://drive.google.com/uc?export=download&id=' + fileId;

    var MAX_SIZE = 8 * 1024 * 1024; // Had maksimum 8MB untuk penghantaran base64

    // Jika fail melebihi had 8MB, maklumkan client untuk sediakan pautan buka di tab baharu
    if (size > MAX_SIZE) {
      return ResponseUtils.success({
        fileId: fileId,
        fileName: name,
        mimeType: mime,
        size: size,
        isImage: isImage,
        isPdf: isPdf,
        tooLarge: true,
        dataUri: null,
        base64: null,
        previewUrl: previewUrl,
        directUrl: directUrl
      });
    }

    // Jika imej atau PDF, ambil blob dan enkrod base64 di pelayan
    if (isImage || isPdf) {
      var blob = file.getBlob();
      var bytes = blob.getBytes();
      var b64 = Utilities.base64Encode(bytes);
      var contentType = blob.getContentType() || mime || (isPdf ? 'application/pdf' : 'image/jpeg');

      return ResponseUtils.success({
        fileId: fileId,
        fileName: name,
        mimeType: contentType,
        size: size,
        isImage: isImage,
        isPdf: isPdf,
        tooLarge: false,
        base64: b64,
        dataUri: 'data:' + contentType + ';base64,' + b64,
        previewUrl: previewUrl,
        directUrl: directUrl
      });
    }

    // Dokumen lain (Word, Excel, PPTX, Arkib dsb.)
    return ResponseUtils.success({
      fileId: fileId,
      fileName: name,
      mimeType: mime,
      size: size,
      isImage: false,
      isPdf: false,
      tooLarge: false,
      dataUri: null,
      base64: null,
      previewUrl: previewUrl,
      directUrl: directUrl
    });
  } catch (e) {
    return ResponseUtils.error('Gagal memuatkan data fail dari Google Drive: ' + (e.message || e));
  }
}

// Alias untuk keserasian fungsi sedia ada
function getFilePreview(fileId) {
  return getFileData(fileId);
}

function getImageBase64(fileId) {
  try {
    if (!fileId) throw new Error('ID fail tidak sah.');
    var res = getFileData(fileId);
    if (res && res.success && res.data && res.data.dataUri) {
      return ResponseUtils.success(res.data.dataUri);
    }
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    var b64 = Utilities.base64Encode(blob.getBytes());
    var mime = blob.getContentType() || 'image/jpeg';
    return ResponseUtils.success('data:' + mime + ';base64,' + b64);
  } catch (e) {
    return ResponseUtils.error('Gagal mendapatkan fallback base64: ' + (e.message || e));
  }
}

// --- Portal (Public) ---
function getInitialPortalData() {
  try {
    return ResponseUtils.success({
      heroAlbum: AlbumService.getPublicHeroAlbum(),
      announcements: AnnouncementService.getPublicAnnouncements(6),
      unitsHierarchy: UnitService.getUnitsHierarchy(),
      quickAccess: UnitService.getQuickAccessServices(),
      unitRegistry: UnitService.getUnitRegistry(),
      navigationData: UnitService.getNavigationData(),
      meta: AppConfig.getPublicPortalMeta()
    });
  } catch (e) {
    return ResponseUtils.error('Gagal memuatkan data portal: ' + e.message);
  }
}

function getUnitPortalData(unitId) {
  try { return ResponseUtils.success(UnitService.getUnitPortalData(unitId)); }
  catch (e) { return ResponseUtils.error('Gagal memuatkan unit: ' + e.message); }
}

// --- Auth ---
function authenticateAdmin(passphrase) { return AuthService.login(passphrase); }
function loginWithGoogle() { return AuthService.loginWithGoogle(); }
function verifyAdminSession(token) { return AuthService.verifySession(token); }


// --- Announcements (Admin) ---
function getAdminAnnouncements(token) { return AnnouncementService.getAdminAnnouncements(token); }
function saveAnnouncement(token, data) { return AnnouncementService.saveAnnouncement(token, data); }
function deleteAnnouncement(token, id) { return AnnouncementService.deleteAnnouncement(token, id); }

// --- Hero Album (Admin) ---
function getAdminHeroAlbum(token) { return AlbumService.getAdminHeroAlbum(token); }
function saveHeroAlbum(token, images) { return AlbumService.saveHeroAlbum(token, images); }
function clearHeroAlbum(token) { return AlbumService.clearHeroAlbum(token); }

// --- File Upload ---
function uploadImage(token, payload) { return FileService.uploadImage(token, payload); }

// --- Units (Public + Admin) ---
function getUnitRegistry() { return ResponseUtils.success(UnitService.getUnitRegistry()); }
function getAdminUnits(token) { return UnitAdminService.getAdminUnits(token); }
function getAdminUnitContent(token, unitId) { return UnitAdminService.getAdminUnitContent(token, unitId); }
function saveUnitContent(token, data) { return UnitAdminService.saveUnitContent(token, data); }
function deleteUnitContent(token, contentId) { return UnitAdminService.deleteUnitContent(token, contentId); }
function saveUnitCategory(token, data) { return UnitAdminService.saveCategory(token, data); }

// --- Employees (Admin) ---
function getAdminEmployees(token) { return EmployeeService.getAdminEmployees(token); }
function saveEmployee(token, data) { return EmployeeService.saveEmployee(token, data); }
function deleteEmployee(token, employeeId) { return EmployeeService.deleteEmployee(token, employeeId); }

// --- Documents (Admin) ---
function getAdminDocuments(token, unitId) { return DocumentManagementService.getAdminDocuments(token, unitId); }
function saveDocumentRecord(token, data) { return DocumentManagementService.saveDocument(token, data); }
function deleteDocumentRecord(token, docId) { return DocumentManagementService.deleteDocument(token, docId); }
function uploadDocumentFile(token, payload) { return DocumentManagementService.uploadDocumentFile(token, payload); }
function syncDriveFiles(token) { return DocumentManagementService.syncDriveFiles(token); }

// --- System ---
function runSystemSetup(token) {
  if (token) {
    var c = Security.verifySessionToken(token);
    if (!c.valid) return ResponseUtils.unauthorized(c.message);
  }
  try {
    var result = runSetup();
    return ResponseUtils.success({ message: result }, 'Setup selesai.');
  } catch (e) {
    return ResponseUtils.error('Ralat setup: ' + e.message);
  }
}

function getSystemInfo(token) {
  var c = Security.verifySessionToken(token);
  if (!c.valid) return ResponseUtils.unauthorized(c.message);
  try {
    var rootId = AppConfig.get('DRIVE_ROOT_FOLDER_ID');
    var rootUrl = rootId ? ('https://drive.google.com/drive/folders/' + rootId) : '';
    var ssId = AppConfig.get('SPREADSHEET_ID');
    var ssUrl = ssId ? ('https://docs.google.com/spreadsheets/d/' + ssId + '/edit') : '';
    
    var auditLogs = [];
    var auditRows = DatabaseHelper.getAllRows(AppConfig.get('SHEET_AUDIT_LOG'), ['Timestamp', 'Action', 'User Identifier', 'Status', 'Details']) || [];
    auditRows.reverse();
    if (auditRows.length > 20) auditRows = auditRows.slice(0, 20);
    auditLogs = auditRows.map(function(r) {
      var ts = r['Timestamp'];
      if (ts && typeof ts.toISOString === 'function') {
        ts = ts.toISOString();
      } else if (ts && typeof ts.toString === 'function') {
        ts = ts.toString();
      } else {
        ts = '';
      }
      return {
        timestamp: ts,
        action: r['Action'] || '',
        user: r['User Identifier'] || '',
        status: r['Status'] || '',
        details: r['Details'] || ''
      };
    });

    return ResponseUtils.success({
      unitCount: UnitRepository.getActiveUnits(true).length,
      employeeCount: EmployeeRepository.getActiveEmployees().length,
      documentCount: DocumentRepository.getActiveDocuments().length,
      announcementCount: SheetRepository.getAllAnnouncements(true).length,
      auditLogs: auditLogs
    });
  } catch (e) {
    return ResponseUtils.error('Gagal mendapatkan maklumat sistem: ' + e.message);
  }
}


