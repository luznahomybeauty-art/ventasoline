// ============================================
// LUZ GOMEZ - BACKEND Google Apps Script
// Sheet ID: 1cG8fwZgLigjCPUp_gyNc1qtTzEG4DB6GCw-rucEYi4g
// Drive ID: 1rg-kFBpm7hMfQBGsQ5f74enZGJlmLIrk
// ============================================

const SPREADSHEET_ID = '1cG8fwZgLigjCPUp_gyNc1qtTzEG4DB6GCw-rucEYi4g';
const DRIVE_ROOT_ID = '1rg-kFBpm7hMfQBGsQ5f74enZGJlmLIrk';
const SELLER_EMAIL = 'luznahomybeauty@gmail.com';
const SELLER_WHATSAPP = '573213092850';
const SELLER_WHATSAPP_DISPLAY = '+57 321 3092850';
const HOJAS = ['Config','Vendedores','Clientes','Categorias','Productos','Comentarios','Testimonios','Promociones','Pedidos','Galeria','Sesiones'];
const CARPETAS = ['categorias','productos','galeria','testimonios','promociones','temp','config'];

function getDb() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getHoja(nombre) {
  const db = getDb();
  let hoja = db.getSheetByName(nombre);
  if (!hoja) {
    hoja = db.insertSheet(nombre);
  }
  return hoja;
}

// ==========================================
// UTILIDADES
// ==========================================

/** Genera un ID único */
function generateId(prefijo) {
  return prefijo + '_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/** Genera token UUID */
function generateToken() {
  return Utilities.getUuid();
}

/** Hashea contraseña con SHA-256 */
function hashPassword(password) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  return bytes.map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

/** Convierte valores de Sheets a booleano */
function isTruthy(value) {
  return value === true || String(value).toLowerCase() === 'true';
}

/** Normaliza números/enlaces de WhatsApp a formato wa.me internacional */
function normalizeWhatsAppLink(value) {
  var raw = String(value || '').trim();
  if (!raw) return 'https://wa.me/' + SELLER_WHATSAPP;
  var digits = raw.replace(/\D/g, '');
  if (digits === '3213092850' || digits === '3118744555' || digits === '31187445555' || digits === '573118744555') digits = SELLER_WHATSAPP;
  if (digits.length === 10 && digits.charAt(0) === '3') digits = '57' + digits;
  if (!digits) digits = SELLER_WHATSAPP;
  return 'https://wa.me/' + digits;
}

function normalizeColombiaText(value) {
  var oldCountry = 'pe' + 'ru';
  var oldCapital = 'Li' + 'ma';
  return String(value || '')
    .replace(new RegExp(oldCountry + 'ano', 'gi'), 'colombiano')
    .replace(new RegExp(oldCountry + 'ana', 'gi'), 'colombiana')
    .replace(new RegExp(oldCountry + 'anos', 'gi'), 'colombianos')
    .replace(new RegExp(oldCountry + 'anas', 'gi'), 'colombianas')
    .replace(new RegExp(oldCountry, 'gi'), 'Colombia')
    .replace(new RegExp(oldCapital, 'gi'), 'Colombia');
}

/** Valida contraseña hash o texto plano antiguo; si es texto plano, migra a hash */
function checkAndMigratePassword(vendedor, password) {
  var hashed = hashPassword(password);
  if (vendedor.password_hash === hashed) return true;
  if (vendedor.password_hash === password) {
    getHoja('Vendedores').getRange(vendedor._row, 4).setValue(hashed);
    return true;
  }
  return false;
}

/** Obtiene URL de thumbnail de Drive */
function getDriveThumbnailUrl(driveId, ancho) {
  if (!driveId) return '';
  ancho = ancho || 400;
  return 'https://drive.google.com/thumbnail?id=' + driveId + '&sz=w' + ancho;
}

/** Obtiene URL original de Drive */
function getDriveFileUrl(driveId) {
  if (!driveId) return '';
  return 'https://drive.google.com/uc?export=view&id=' + driveId;
}

/** URL directa para reproductor HTML5 */
function getDriveVideoUrl(driveId) {
  if (!driveId) return '';
  return 'https://drive.google.com/uc?export=download&id=' + driveId;
}

/** Convierte un dataURL/base64 recibido desde fetch en Blob */
function dataUrlToBlob(fileData) {
  var dataUrl = fileData.dataUrl || fileData.base64 || '';
  var contentType = fileData.type || 'application/octet-stream';
  var name = fileData.name || ('archivo_' + Date.now());
  var base64 = dataUrl.indexOf(',') >= 0 ? dataUrl.split(',')[1] : dataUrl;
  var bytes = Utilities.base64Decode(base64);
  return Utilities.newBlob(bytes, contentType, name);
}

/** Asegura columnas nuevas sin tocar datos existentes */
function ensureColumns(hojaNombre, columns) {
  var hoja = getHoja(hojaNombre);
  if (hoja.getLastRow() === 0) hoja.appendRow(columns);
  var lastColumn = Math.max(hoja.getLastColumn(), 1);
  var headers = hoja.getRange(1, 1, 1, lastColumn).getValues()[0];
  for (var i = 0; i < columns.length; i++) {
    if (headers.indexOf(columns[i]) === -1) {
      hoja.getRange(1, hoja.getLastColumn() + 1).setValue(columns[i]);
      headers.push(columns[i]);
    }
  }
}

function ensureSchema() {
  ensureColumns('Comentarios', ['id','producto_id','cliente_id','cliente_nombre','calificacion','comentario','fecha','visible','leido','respuesta_admin']);
  ensureColumns('Categorias', ['id','nombre','slug','descripcion','icono','imagen_drive_id','video_drive_id','orden','activa']);
  ensureColumns('Promociones', ['id','titulo','descripcion','descuento_porcentaje','fecha_inicio','fecha_fin','imagen_drive_id','video_drive_id','activa']);
  ensureColumns('Testimonios', ['id','cliente_nombre','cliente_ciudad','texto','imagen_drive_id','calificacion','orden','activo','video_drive_id','fecha']);
  ensureColumns('Galeria', ['id','imagen_drive_id','titulo','orden','activo','video_drive_id','tipo','categoria_galeria']);
  ensureColumns('Productos', ['id','categoria_id','nombre','descripcion','precio','precio_antiguo','imagen_drive_id','imagenes_extra_ids','video_drive_id','badge','rating','resenas_count','stock','activo','destacado','fecha_creacion','fecha_actualizacion']);
  ensureColumns('Pedidos', ['id','cliente_id','cliente_nombre','cliente_telefono','items_json','total','estado','fecha_creacion','fecha_actualizacion','whatsapp_mensaje','leido_vendedor','notificado_email']);
}

function getHeaderMap(hoja) {
  var headers = hoja.getRange(1, 1, 1, Math.max(hoja.getLastColumn(), 1)).getValues()[0];
  var map = {};
  for (var i = 0; i < headers.length; i++) map[headers[i]] = i + 1;
  return map;
}

function setField(hojaNombre, rowNumber, field, value) {
  var hoja = getHoja(hojaNombre);
  ensureColumns(hojaNombre, [field]);
  var map = getHeaderMap(hoja);
  hoja.getRange(rowNumber, map[field]).setValue(value);
}

function appendObject(hojaNombre, obj, requiredColumns) {
  ensureColumns(hojaNombre, requiredColumns);
  var hoja = getHoja(hojaNombre);
  var headers = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  var row = [];
  for (var i = 0; i < headers.length; i++) row.push(obj[headers[i]] !== undefined ? obj[headers[i]] : '');
  hoja.appendRow(row);
}

function getActiveVisibleComentarios(productoId) {
  ensureColumns('Comentarios', ['leido','respuesta_admin']);
  var rows = getAllRows('Comentarios');
  var filtrados = [];
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].producto_id === productoId && isTruthy(rows[i].visible)) filtrados.push(rows[i]);
  }
  filtrados.sort(function(a,b) { return new Date(b.fecha) - new Date(a.fecha); });
  return filtrados;
}

function applyProductRating(producto) {
  var comentarios = getActiveVisibleComentarios(producto.id);
  if (comentarios.length) {
    var total = 0;
    for (var i = 0; i < comentarios.length; i++) total += Number(comentarios[i].calificacion) || 0;
    producto.rating = Math.round((total / comentarios.length) * 10) / 10;
    producto.resenas_count = comentarios.length;
  }
  return producto;
}

/** Formato fecha dd/mm/yyyy */
function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') date = new Date(date);
  var d = date.getDate().toString().padStart(2,'0');
  var m = (date.getMonth()+1).toString().padStart(2,'0');
  var y = date.getFullYear();
  return d + '/' + m + '/' + y;
}

/** Formato moneda */
function formatCurrency(amount) {
  return '$ ' + Number(amount || 0).toFixed(2);
}

/** Obtiene fila de hoja como objeto (por ID en columna A) */
function getRowById(hojaNombre, id) {
  var hoja = getHoja(hojaNombre);
  var data = hoja.getDataRange().getValues();
  var headers = data[0];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = data[i][j];
      }
      obj._row = i + 1;
      return obj;
    }
  }
  return null;
}

/** Obtiene todas las filas de una hoja como array de objetos */
function getAllRows(hojaNombre) {
  var hoja = getHoja(hojaNombre);
  var data = hoja.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var results = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    obj._row = i + 1;
    results.push(obj);
  }
  return results;
}

/** Obtiene carpetas de Drive (cache) */
function getDriveFolders() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('drive_folders');
  if (cached) return JSON.parse(cached);
  
  var root = DriveApp.getFolderById(DRIVE_ROOT_ID);
  var folders = root.getFolders();
  var map = {};
  while (folders.hasNext()) {
    var f = folders.next();
    map[f.getName()] = f.getId();
  }
  cache.put('drive_folders', JSON.stringify(map), 3600);
  return map;
}

/** Obtiene o crea carpeta en Drive */
function getOrCreateFolder(nombre) {
  var folders = getDriveFolders();
  if (folders[nombre]) return folders[nombre];
  
  var root = DriveApp.getFolderById(DRIVE_ROOT_ID);
  var folder = root.createFolder(nombre);
  folder.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
  
  // Limpiar cache
  CacheService.getScriptCache().remove('drive_folders');
  return folder.getId();
}

/** Sube archivo a carpeta de Drive, retorna {id, url, thumbnail} */
function uploadToDrive(blob, carpetaNombre, nombreArchivo) {
  var folderId = getOrCreateFolder(carpetaNombre);
  var folder = DriveApp.getFolderById(folderId);
  var file = folder.createFile(blob);
  if (nombreArchivo) file.setName(nombreArchivo);
  file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
  return {
    id: file.getId(),
    url: getDriveFileUrl(file.getId()),
    thumbnail: getDriveThumbnailUrl(file.getId(), 800)
  };
}

/** Sube un video pequeño a Drive */
function uploadVideo(blob, nombreArchivo, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    return {success:true, data: uploadToDrive(blob, 'productos', nombreArchivo || ('video_' + Date.now()))};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Elimina archivo de Drive */
function deleteFromDrive(driveId) {
  try {
    DriveApp.getFileById(driveId).setTrashed(true);
    return true;
  } catch(e) {
    return false;
  }
}

// ==========================================
// INICIALIZACIÓN DE BASE DE DATOS
// ==========================================

/** Crea toda la estructura si no existe */
function initDatabase() {
  var db = getDb();
  
  // Crear hojas con encabezados
  var encabezados = {
    'Config': ['clave','valor'],
    'Vendedores': ['id','nombre','correo','password_hash','pin_acceso','activo','fecha_registro'],
    'Clientes': ['id','nombre','correo','telefono','fecha_registro','ultima_visita','visitas_total'],
    'Categorias': ['id','nombre','slug','descripcion','icono','imagen_drive_id','video_drive_id','orden','activa'],
    'Productos': ['id','categoria_id','nombre','descripcion','precio','precio_antiguo','imagen_drive_id','imagenes_extra_ids','video_drive_id','badge','rating','resenas_count','stock','activo','destacado','fecha_creacion','fecha_actualizacion'],
    'Comentarios': ['id','producto_id','cliente_id','cliente_nombre','calificacion','comentario','fecha','visible','leido','respuesta_admin'],
    'Testimonios': ['id','cliente_nombre','cliente_ciudad','texto','imagen_drive_id','calificacion','orden','activo','video_drive_id','fecha'],
    'Promociones': ['id','titulo','descripcion','descuento_porcentaje','fecha_inicio','fecha_fin','imagen_drive_id','video_drive_id','activa'],
    'Pedidos': ['id','cliente_id','cliente_nombre','cliente_telefono','items_json','total','estado','fecha_creacion','fecha_actualizacion','whatsapp_mensaje','leido_vendedor','notificado_email'],
    'Galeria': ['id','imagen_drive_id','titulo','orden','activo','video_drive_id','tipo','categoria_galeria'],
    'Sesiones': ['token','usuario_tipo','usuario_id','fecha_expiracion']
  };
  
  for (var i = 0; i < HOJAS.length; i++) {
    var nombre = HOJAS[i];
    var hoja = db.getSheetByName(nombre);
    if (!hoja) {
      hoja = db.insertSheet(nombre);
      hoja.appendRow(encabezados[nombre]);
      hoja.getRange(1, 1, 1, encabezados[nombre].length).setFontWeight('bold');
    } else if (hoja.getLastRow() === 0) {
      hoja.appendRow(encabezados[nombre]);
      hoja.getRange(1, 1, 1, encabezados[nombre].length).setFontWeight('bold');
    }
  }
  ensureSchema();
  
  // Crear carpetas en Drive
  for (var j = 0; j < CARPETAS.length; j++) {
    getOrCreateFolder(CARPETAS[j]);
  }
  
  // Crear vendedor por defecto si no existe
  var vendedores = getAllRows('Vendedores');
  if (vendedores.length === 0) {
    getHoja('Vendedores').appendRow([
      'VEN001',
      'Luz Gomez',
      'luz@email.com',
      hashPassword('admin123'),
      '1234',
      true,
      new Date().toISOString()
    ]);
  }
  
  // Crear config por defecto si está vacía
  var config = getAllRows('Config');
  if (config.length === 0) {
    var defaults = [
      ['nombre_tienda','Luz Gomez'],
      ['telefono', SELLER_WHATSAPP_DISPLAY],
      ['whatsapp_link','https://wa.me/' + SELLER_WHATSAPP],
      ['correo_tienda', SELLER_EMAIL],
      ['instagram','@luzgomez.artesanal'],
      ['facebook','Luz Gomez Artesanal'],
      ['tiktok','@luzgomez.artesanal'],
      ['moneda','$'],
      ['envio_nacional','true'],
      ['mensaje_bienvenida','¡Bienvenida a Luz Gomez!'],
      ['anos_experiencia','8'],
      ['descripcion_tienda','Emprendimiento familiar colombiano dedicado a crear productos únicos con amor, creatividad y la mejor calidad.']
    ];
    var hojaConfig = getHoja('Config');
    for (var k = 0; k < defaults.length; k++) {
      hojaConfig.appendRow(defaults[k]);
    }
  }
  
  // Limpiar cache
  CacheService.getScriptCache().removeAll([]);
  
  Logger.log('✅ Base de datos inicializada correctamente');
  return {success: true, message: 'Base de datos inicializada'};
}

/** Configura triggers diarios */
function setupTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'cleanupExpiredSessions') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('cleanupExpiredSessions').timeBased().everyDays(1).create();
  Logger.log('✅ Triggers configurados');
}

// ==========================================
// AUTENTICACIÓN
// ==========================================

/** Login de vendedor con correo y contraseña */
function doLogin(tipo, correo, password) {
  try {
    if (tipo !== 'vendedor') return {success:false, error:'Tipo no válido'};
    
    var vendedores = getAllRows('Vendedores');
    var vendedor = null;
    for (var i = 0; i < vendedores.length; i++) {
      if (String(vendedores[i].correo).trim().toLowerCase() === String(correo).trim().toLowerCase() && isTruthy(vendedores[i].activo)) {
        vendedor = vendedores[i];
        break;
      }
    }
    
    if (!vendedor) return {success:false, error:'Correo no registrado o inactivo'};
    if (!checkAndMigratePassword(vendedor, password)) return {success:false, error:'Contraseña incorrecta'};
    
    var token = generateToken();
    var expiracion = new Date(Date.now() + 24*60*60*1000).toISOString();
    
    getHoja('Sesiones').appendRow([token, 'vendedor', vendedor.id, expiracion]);
    
    return {
      success: true,
      data: {
        token: token,
        tipo: 'vendedor',
        id: vendedor.id,
        nombre: vendedor.nombre
      }
    };
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Login de vendedor con PIN */
function doLoginWithPin(pin) {
  try {
    var vendedores = getAllRows('Vendedores');
    var vendedor = null;
    for (var i = 0; i < vendedores.length; i++) {
      if (String(vendedores[i].pin_acceso).trim() === String(pin).trim() && isTruthy(vendedores[i].activo)) {
        vendedor = vendedores[i];
        break;
      }
    }
    
    if (!vendedor) return {success:false, error:'PIN incorrecto o vendedor inactivo'};
    
    var token = generateToken();
    var expiracion = new Date(Date.now() + 24*60*60*1000).toISOString();
    
    getHoja('Sesiones').appendRow([token, 'vendedor', vendedor.id, expiracion]);
    
    return {
      success: true,
      data: {
        token: token,
        tipo: 'vendedor',
        id: vendedor.id,
        nombre: vendedor.nombre
      }
    };
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Registro o login de cliente */
function doRegisterCliente(nombre, correo, telefono) {
  try {
    if (!nombre || !correo || !telefono) return {success:false, error:'Todos los campos son obligatorios'};
    
    var clientes = getAllRows('Clientes');
    var existente = null;
    for (var i = 0; i < clientes.length; i++) {
      if (clientes[i].correo === correo) {
        existente = clientes[i];
        break;
      }
    }
    
    var clienteId;
    
    if (existente) {
      // Actualizar última visita
      clienteId = existente.id;
      var hoja = getHoja('Clientes');
      hoja.getRange(existente._row, 6).setValue(new Date().toISOString());
      hoja.getRange(existente._row, 7).setValue(Number(existente.visitas_total || 0) + 1);
    } else {
      // Crear nuevo
      clienteId = generateId('CLI');
      getHoja('Clientes').appendRow([
        clienteId, nombre, correo, telefono,
        new Date().toISOString(), new Date().toISOString(), 1
      ]);
    }
    
    // Crear sesión
    var token = generateToken();
    var expiracion = new Date(Date.now() + 30*24*60*60*1000).toISOString(); // 30 días para clientes
    getHoja('Sesiones').appendRow([token, 'cliente', clienteId, expiracion]);
    
    return {
      success: true,
      data: {
        token: token,
        tipo: 'cliente',
        id: clienteId,
        nombre: nombre
      }
    };
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Valida sesión activa */
function validateSession(token) {
  try {
    if (!token) return {success:false, error:'No hay token'};
    
    var sesiones = getAllRows('Sesiones');
    var sesion = null;
    for (var i = 0; i < sesiones.length; i++) {
      if (sesiones[i].token === token) {
        sesion = sesiones[i];
        break;
      }
    }
    
    if (!sesion) return {success:false, error:'Sesión no encontrada'};
    
    var expiracion = new Date(sesion.fecha_expiracion);
    if (expiracion < new Date()) {
      // Eliminar sesión expirada
      getHoja('Sesiones').deleteRow(sesion._row);
      return {success:false, error:'Sesión expirada'};
    }
    
    return {
      success: true,
      data: {
        tipo: sesion.usuario_tipo,
        id: sesion.usuario_id
      }
    };
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Cerrar sesión */
function doLogout(token) {
  try {
    var sesiones = getAllRows('Sesiones');
    for (var i = 0; i < sesiones.length; i++) {
      if (sesiones[i].token === token) {
        getHoja('Sesiones').deleteRow(sesiones[i]._row);
        break;
      }
    }
    return {success:true};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Limpia sesiones expiradas (trigger diario) */
function cleanupExpiredSessions() {
  var sesiones = getAllRows('Sesiones');
  var hoja = getHoja('Sesiones');
  var eliminadas = 0;
  // Iterar de abajo hacia arriba para no afectar los índices
  for (var i = sesiones.length - 1; i >= 0; i--) {
    if (new Date(sesiones[i].fecha_expiracion) < new Date()) {
      hoja.deleteRow(sesiones[i]._row);
      eliminadas++;
    }
  }
  Logger.log('Sesiones expiradas eliminadas: ' + eliminadas);
}

// ==========================================
// CONFIGURACIÓN
// ==========================================

/** Obtiene toda la config como objeto */
function getConfig() {
  try {
    var rows = getAllRows('Config');
    var config = {};
    for (var i = 0; i < rows.length; i++) {
      config[rows[i].clave] = rows[i].valor;
    }
    config.whatsapp_link = normalizeWhatsAppLink(config.whatsapp_link || config.telefono || SELLER_WHATSAPP);
    if (!config.moneda || String(config.moneda).charAt(0).toUpperCase() === 'S') config.moneda = '$';
    if (config.descripcion_tienda) config.descripcion_tienda = normalizeColombiaText(config.descripcion_tienda);
    if (!config.telefono || ['3213092850', '573213092850', '3118744555', '31187445555', '573118744555'].indexOf(String(config.telefono).replace(/\D/g, '')) !== -1) {
      config.telefono = SELLER_WHATSAPP_DISPLAY;
    }
    if (!config.correo_tienda) config.correo_tienda = SELLER_EMAIL;
    return {success:true, data: config};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Actualiza un valor de config (solo vendedor) */
function updateConfig(clave, valor, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success) return {success:false, error:'Sesión inválida'};
    if (auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    if (clave === 'whatsapp_link' || clave === 'telefono') {
      valor = clave === 'whatsapp_link' ? normalizeWhatsAppLink(valor) : valor;
    }
    if (clave === 'moneda' && String(valor).charAt(0).toUpperCase() === 'S') valor = '$';
    if (clave === 'descripcion_tienda') valor = normalizeColombiaText(valor);
    var rows = getAllRows('Config');
    var hoja = getHoja('Config');
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].clave === clave) {
        hoja.getRange(rows[i]._row, 2).setValue(valor);
        return {success:true};
      }
    }
    // Si no existe, crearla
    hoja.appendRow([clave, valor]);
    return {success:true};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

// ==========================================
// CATEGORÍAS
// ==========================================

/** Obtiene categorías activas ordenadas */
function getCategorias() {
  try {
    ensureColumns('Categorias', ['video_drive_id']);
    var rows = getAllRows('Categorias');
    var filtradas = [];
    for (var i = 0; i < rows.length; i++) {
      if (isTruthy(rows[i].activa)) {
        filtradas.push(rows[i]);
      }
    }
    filtradas.sort(function(a,b) { return Number(a.orden || 99) - Number(b.orden || 99); });
    
    // Agregar URLs de imagen
    for (var j = 0; j < filtradas.length; j++) {
      filtradas[j].imagen_url = getDriveThumbnailUrl(filtradas[j].imagen_drive_id, 500);
      filtradas[j].imagen_url_grande = getDriveFileUrl(filtradas[j].imagen_drive_id);
      filtradas[j].video_url = getDriveFileUrl(filtradas[j].video_drive_id);
      filtradas[j].video_direct_url = getDriveVideoUrl(filtradas[j].video_drive_id);
    }
    
    return {success:true, data: filtradas};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Crea categoría (vendedor) */
function createCategoria(data, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var id = generateId('CAT');
    var slug = data.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
    
    // Calcular orden
    var existentes = getAllRows('Categorias');
    var orden = existentes.length + 1;
    
    getHoja('Categorias').appendRow([
      id, data.nombre, slug, data.descripcion || '', data.icono || '📦',
      data.imagen_drive_id || '', data.video_drive_id || '', orden, true
    ]);
    var newRow = getHoja('Categorias').getLastRow();
    setField('Categorias', newRow, 'video_drive_id', data.video_drive_id || '');
    setField('Categorias', newRow, 'orden', orden);
    setField('Categorias', newRow, 'activa', true);
    
    return {success:true, data:{id:id, slug:slug}};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Actualiza categoría (vendedor) */
function updateCategoria(id, data, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var row = getRowById('Categorias', id);
    if (!row) return {success:false, error:'Categoría no encontrada'};
    
    var hoja = getHoja('Categorias');
    if (data.nombre !== undefined) {
      hoja.getRange(row._row, 2).setValue(data.nombre);
      var slug = data.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
      hoja.getRange(row._row, 3).setValue(slug);
    }
    if (data.descripcion !== undefined) setField('Categorias', row._row, 'descripcion', data.descripcion);
    if (data.icono !== undefined) setField('Categorias', row._row, 'icono', data.icono);
    if (data.imagen_drive_id !== undefined) setField('Categorias', row._row, 'imagen_drive_id', data.imagen_drive_id);
    if (data.video_drive_id !== undefined) setField('Categorias', row._row, 'video_drive_id', data.video_drive_id);
    if (data.orden !== undefined) setField('Categorias', row._row, 'orden', data.orden);
    if (data.activa !== undefined) setField('Categorias', row._row, 'activa', data.activa);
    
    return {success:true};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Elimina categoría (soft delete, vendedor) */
function deleteCategoria(id, token) {
  return updateCategoria(id, {activa: false}, token);
}

/** Sube imagen de categoría */
function uploadCategoriaImagen(blob, categoriaId, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var result = uploadToDrive(blob, 'categorias', 'cat_' + categoriaId + '.jpg');
    updateCategoria(categoriaId, {imagen_drive_id: result.id}, token);
    
    return {success:true, data: result};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Sube imagen de categoría desde dataURL/base64 */
function uploadCategoriaImagenBase64(fileData, categoriaId, token) {
  return uploadCategoriaImagen(dataUrlToBlob(fileData), categoriaId, token);
}

/** Sube video de categoría desde dataURL/base64 */
function uploadCategoriaVideoBase64(fileData, categoriaId, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    var result = uploadToDrive(dataUrlToBlob(fileData), 'categorias', 'cat_video_' + categoriaId + '_' + Date.now());
    updateCategoria(categoriaId, {video_drive_id: result.id}, token);
    return {success:true, data: result};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

// ==========================================
// PRODUCTOS
// ==========================================

/** Obtiene productos con filtros y paginación */
function getProductos(filters) {
  try {
    filters = filters || {};
    var rows = getAllRows('Productos');
    var filtrados = [];
    
    for (var i = 0; i < rows.length; i++) {
      var p = rows[i];
      if (!isTruthy(p.activo)) continue;
      if (filters.destacado && !isTruthy(p.destacado)) continue;
      if (filters.categoria_slug && filters.categoria_slug !== 'all') {
        // Buscar categoría
        var cat = getRowById('Categorias', p.categoria_id);
        if (!cat || cat.slug !== filters.categoria_slug) continue;
      }
      if (filters.buscar) {
        var busqueda = filters.buscar.toLowerCase();
        if (p.nombre.toLowerCase().indexOf(busqueda) === -1) continue;
      }
      filtrados.push(p);
    }
    
    // Ordenar por fecha de creación descendente
    filtrados.sort(function(a,b) {
      var da = new Date(a.fecha_creacion || 0);
      var db = new Date(b.fecha_creacion || 0);
      return db - da;
    });
    
    // Agregar info de categoría y URLs
    for (var j = 0; j < filtrados.length; j++) {
      var catInfo = getRowById('Categorias', filtrados[j].categoria_id);
      filtrados[j].categoria_nombre = catInfo ? catInfo.nombre : '';
      filtrados[j].categoria_slug = catInfo ? catInfo.slug : '';
      filtrados[j].imagen_url = getDriveThumbnailUrl(filtrados[j].imagen_drive_id, 400);
      
      // Procesar imágenes extra
      var extras = [];
      if (filtrados[j].imagenes_extra_ids) {
        var ids = filtrados[j].imagenes_extra_ids.toString().split(',');
        for (var k = 0; k < ids.length; k++) {
          if (ids[k].trim()) {
            extras.push({
              id: ids[k].trim(),
              url: getDriveThumbnailUrl(ids[k].trim(), 800)
            });
          }
        }
      }
      filtrados[j].imagenes_extra = extras;
      filtrados[j].video_url = filtrados[j].video_drive_id ? getDriveFileUrl(filtrados[j].video_drive_id) : '';
      filtrados[j].video_direct_url = getDriveVideoUrl(filtrados[j].video_drive_id);
      applyProductRating(filtrados[j]);
    }
    
    // Paginación
    var pagina = Number(filters.pagina) || 1;
    var porPagina = Number(filters.por_pagina) || 12;
    var inicio = (pagina - 1) * porPagina;
    var fin = inicio + porPagina;
    var paginados = filtrados.slice(inicio, fin);
    
    return {
      success: true,
      data: {
        productos: paginados,
        total: filtrados.length,
        pagina: pagina,
        por_pagina: porPagina,
        total_paginas: Math.ceil(filtrados.length / porPagina)
      }
    };
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Obtiene productos destacados */
function getProductosDestacados() {
  return getProductos({destacado: true, por_pagina: 8});
}

/** Obtiene producto por ID */
function getProductoById(id) {
  try {
    var row = getRowById('Productos', id);
    if (!row) return {success:false, error:'Producto no encontrado'};
    
    var catInfo = getRowById('Categorias', row.categoria_id);
    row.categoria_nombre = catInfo ? catInfo.nombre : '';
    row.categoria_slug = catInfo ? catInfo.slug : '';
    row.imagen_url = getDriveThumbnailUrl(row.imagen_drive_id, 800);
    row.imagen_url_grande = getDriveFileUrl(row.imagen_drive_id);
    
    var extras = [];
    if (row.imagenes_extra_ids) {
      var ids = row.imagenes_extra_ids.toString().split(',');
      for (var i = 0; i < ids.length; i++) {
        if (ids[i].trim()) {
          extras.push({
            id: ids[i].trim(),
            url: getDriveThumbnailUrl(ids[i].trim(), 800),
            url_grande: getDriveFileUrl(ids[i].trim())
          });
        }
      }
    }
    row.imagenes_extra = extras;
    row.video_url = row.video_drive_id ? getDriveFileUrl(row.video_drive_id) : '';
    row.video_direct_url = getDriveVideoUrl(row.video_drive_id);
    row.comentarios = getActiveVisibleComentarios(row.id);
    applyProductRating(row);
    
    return {success:true, data: row};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Crea producto (vendedor) */
function createProducto(data, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var id = generateId('PROD');
    var ahora = new Date().toISOString();
    
    getHoja('Productos').appendRow([
      id, data.categoria_id || '', data.nombre || '', data.descripcion || '',
      Number(data.precio) || 0, Number(data.precio_antiguo) || '',
      data.imagen_drive_id || '', data.imagenes_extra_ids || '',
      data.video_drive_id || '', data.badge || '',
      Number(data.rating) || 0, Number(data.resenas_count) || 0,
      Number(data.stock) || 0, true,
      data.destacado === true || data.destacado === 'true' ? true : false,
      ahora, ahora
    ]);
    
    // Crear subcarpeta en Drive
    try {
      var productosFolder = DriveApp.getFolderById(getOrCreateFolder('productos'));
      productosFolder.createFolder(id).setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
      CacheService.getScriptCache().remove('drive_folders');
    } catch(e) {}
    
    return {success:true, data:{id:id}};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Actualiza producto (vendedor) */
function updateProducto(id, data, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var row = getRowById('Productos', id);
    if (!row) return {success:false, error:'Producto no encontrado'};
    
    var hoja = getHoja('Productos');
    var campos = {
      2: 'categoria_id', 3: 'nombre', 4: 'descripcion',
      5: 'precio', 6: 'precio_antiguo', 7: 'imagen_drive_id',
      8: 'imagenes_extra_ids', 9: 'video_drive_id', 10: 'badge',
      11: 'rating', 12: 'resenas_count', 13: 'stock',
      14: 'activo', 15: 'destacado'
    };
    
    for (var col in campos) {
      if (data[campos[col]] !== undefined) {
        var val = data[campos[col]];
        if (['precio','precio_antiguo','rating','resenas_count','stock'].indexOf(campos[col]) !== -1) {
          val = Number(val) || 0;
        }
        if (campos[col] === 'activo' || campos[col] === 'destacado') {
          val = val === true || val === 'true';
        }
        hoja.getRange(row._row, Number(col)).setValue(val);
      }
    }
    
    // Actualizar fecha de actualización
    hoja.getRange(row._row, 17).setValue(new Date().toISOString());
    
    return {success:true};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Elimina producto (soft delete, vendedor) */
function deleteProducto(id, token) {
  return updateProducto(id, {activo: false}, token);
}

/** Sube imagen de producto */
function uploadProductoImagen(blob, productoId, esPrincipal, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var carpeta = 'productos';
    var nombre = 'prod_' + productoId + '_' + Date.now() + '.jpg';
    
    // Intentar subir a subcarpeta del producto
    try {
      var productosFolder = DriveApp.getFolderById(getOrCreateFolder('productos'));
      var subfolders = productosFolder.getFoldersByName(productoId);
      if (subfolders.hasNext()) {
        var sub = subfolders.next();
        var file = sub.createFile(blob);
        file.setName(nombre);
        file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
        
        var result = {
          id: file.getId(),
          url: getDriveFileUrl(file.getId()),
          thumbnail: getDriveThumbnailUrl(file.getId(), 800)
        };
        
        if (esPrincipal === true || esPrincipal === 'true') {
          updateProducto(productoId, {imagen_drive_id: result.id}, token);
        } else {
          // Agregar a imágenes extra
          var prod = getRowById('Productos', productoId);
          var extras = prod.imagenes_extra_ids ? prod.imagenes_extra_ids.toString() : '';
          if (extras) extras += ',';
          extras += result.id;
          updateProducto(productoId, {imagenes_extra_ids: extras}, token);
        }
        
        return {success:true, data: result};
      }
    } catch(e) {}
    
    // Fallback: subir a carpeta general
    var result = uploadToDrive(blob, carpeta, nombre);
    
    if (esPrincipal === true || esPrincipal === 'true') {
      updateProducto(productoId, {imagen_drive_id: result.id}, token);
    } else {
      var prod2 = getRowById('Productos', productoId);
      var extras2 = prod2.imagenes_extra_ids ? prod2.imagenes_extra_ids.toString() : '';
      if (extras2) extras2 += ',';
      extras2 += result.id;
      updateProducto(productoId, {imagenes_extra_ids: extras2}, token);
    }
    
    return {success:true, data: result};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Sube imagen de producto desde dataURL/base64 */
function uploadProductoImagenBase64(fileData, productoId, esPrincipal, token) {
  return uploadProductoImagen(dataUrlToBlob(fileData), productoId, esPrincipal, token);
}

/** Sube video de producto */
function uploadProductoVideo(blob, productoId, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var nombre = 'video_' + productoId + '_' + Date.now() + '.mp4';
    var result = uploadToDrive(blob, 'productos', nombre);
    updateProducto(productoId, {video_drive_id: result.id}, token);
    
    return {success:true, data: result};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Sube video de producto desde dataURL/base64 */
function uploadProductoVideoBase64(fileData, productoId, token) {
  return uploadProductoVideo(dataUrlToBlob(fileData), productoId, token);
}

/** Elimina archivo de Drive (vendedor) */
function deleteArchivoDrive(driveId, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var eliminado = deleteFromDrive(driveId);
    return {success:true, data:{eliminado: eliminado}};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Cuenta total de productos activos */
function getProductsCount() {
  try {
    var rows = getAllRows('Productos');
    var count = 0;
    for (var i = 0; i < rows.length; i++) {
      if (isTruthy(rows[i].activo)) count++;
    }
    return {success:true, data: count};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

// ==========================================
// COMENTARIOS
// ==========================================

/** Obtiene comentarios visibles de un producto */
function getComentariosByProducto(productoId) {
  try {
    return {success:true, data: getActiveVisibleComentarios(productoId)};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Crea comentario (cualquier cliente) */
function createComentario(data) {
  try {
    ensureColumns('Comentarios', ['leido','respuesta_admin']);
    if (!data.producto_id || !data.cliente_nombre || !data.comentario) {
      return {success:false, error:'Faltan datos obligatorios'};
    }
    
    var id = generateId('COM');
    getHoja('Comentarios').appendRow([
      id, data.producto_id, data.cliente_id || '', data.cliente_nombre,
      Number(data.calificacion) || 5, data.comentario, new Date().toISOString(), true, false, ''
    ]);
    
    return {success:true};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Obtiene comentarios recientes para moderación (vendedor) */
function getComentariosPendientes(token) {
  try {
    ensureColumns('Comentarios', ['leido','respuesta_admin']);
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var rows = getAllRows('Comentarios');
    var pendientes = [];
    for (var i = 0; i < rows.length; i++) {
      pendientes.push(rows[i]);
    }
    pendientes.sort(function(a,b) { return new Date(b.fecha) - new Date(a.fecha); });
    
    // Agregar nombre de producto
    for (var j = 0; j < pendientes.length; j++) {
      var prod = getRowById('Productos', pendientes[j].producto_id);
      pendientes[j].producto_nombre = prod ? prod.nombre : 'Producto eliminado';
    }
    
    return {success:true, data: pendientes};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Obtiene comentarios no leídos para la campana */
function getComentariosNoLeidos(token) {
  try {
    ensureColumns('Comentarios', ['leido','respuesta_admin']);
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    var rows = getAllRows('Comentarios');
    var items = [];
    for (var i = 0; i < rows.length; i++) {
      if (!isTruthy(rows[i].leido)) {
        var prod = getRowById('Productos', rows[i].producto_id);
        rows[i].producto_nombre = prod ? prod.nombre : 'Producto eliminado';
        items.push(rows[i]);
      }
    }
    items.sort(function(a,b) { return new Date(b.fecha) - new Date(a.fecha); });
    return {success:true, data: items.slice(0, 20)};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Marca un comentario como leído */
function marcarComentarioLeido(id, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    var row = getRowById('Comentarios', id);
    if (!row) return {success:false, error:'Comentario no encontrado'};
    setField('Comentarios', row._row, 'leido', true);
    return {success:true};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Marca todos los comentarios de la campana como leídos */
function marcarComentariosLeidos(token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    var rows = getAllRows('Comentarios');
    for (var i = 0; i < rows.length; i++) {
      if (!isTruthy(rows[i].leido)) setField('Comentarios', rows[i]._row, 'leido', true);
    }
    return {success:true};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Notificaciones unificadas: comentarios y pedidos nuevos */
function getNotificacionesVendedor(token) {
  try {
    ensureColumns('Pedidos', ['leido_vendedor','notificado_email']);
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    var items = [];
    var comentarios = getAllRows('Comentarios');
    for (var i = 0; i < comentarios.length; i++) {
      if (!isTruthy(comentarios[i].leido)) {
        var prod = getRowById('Productos', comentarios[i].producto_id);
        items.push({
          tipo: 'comentario',
          id: comentarios[i].id,
          titulo: prod ? prod.nombre : 'Producto',
          texto: comentarios[i].cliente_nombre + ': ' + comentarios[i].comentario,
          fecha: comentarios[i].fecha
        });
      }
    }
    var pedidos = getAllRows('Pedidos');
    for (var j = 0; j < pedidos.length; j++) {
      if (!isTruthy(pedidos[j].leido_vendedor)) {
        items.push({
          tipo: 'pedido',
          id: pedidos[j].id,
          titulo: 'Nuevo pedido',
          texto: pedidos[j].cliente_nombre + ' - $ ' + Number(pedidos[j].total || 0).toLocaleString('es-CO', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
          fecha: pedidos[j].fecha_creacion
        });
      }
    }
    items.sort(function(a,b) { return new Date(b.fecha) - new Date(a.fecha); });
    return {success:true, data: items.slice(0, 25)};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

function marcarNotificacionesLeidas(token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    var comentarios = getAllRows('Comentarios');
    for (var i = 0; i < comentarios.length; i++) {
      if (!isTruthy(comentarios[i].leido)) setField('Comentarios', comentarios[i]._row, 'leido', true);
    }
    var pedidos = getAllRows('Pedidos');
    for (var j = 0; j < pedidos.length; j++) {
      if (!isTruthy(pedidos[j].leido_vendedor)) setField('Pedidos', pedidos[j]._row, 'leido_vendedor', true);
    }
    return {success:true};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Responde un comentario y lo deja visible para el cliente */
function responderComentario(id, respuesta, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    var row = getRowById('Comentarios', id);
    if (!row) return {success:false, error:'Comentario no encontrado'};
    setField('Comentarios', row._row, 'respuesta_admin', respuesta || '');
    setField('Comentarios', row._row, 'visible', true);
    setField('Comentarios', row._row, 'leido', true);
    return {success:true};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Aprueba comentario (vendedor) */
function aprobarComentario(id, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var row = getRowById('Comentarios', id);
    if (!row) return {success:false, error:'Comentario no encontrado'};
    
    setField('Comentarios', row._row, 'visible', true);
    setField('Comentarios', row._row, 'leido', true);
    return {success:true};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Rechaza comentario (vendedor) */
function rechazarComentario(id, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var row = getRowById('Comentarios', id);
    if (!row) return {success:false, error:'Comentario no encontrado'};
    
    getHoja('Comentarios').deleteRow(row._row);
    return {success:true};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

// ==========================================
// TESTIMONIOS
// ==========================================

/** Obtiene testimonios activos */
function getTestimonios() {
  try {
    ensureColumns('Testimonios', ['video_drive_id','fecha']);
    var rows = getAllRows('Testimonios');
    var filtrados = [];
    for (var i = 0; i < rows.length; i++) {
      if (isTruthy(rows[i].activo)) {
        filtrados.push(rows[i]);
      }
    }
    filtrados.sort(function(a,b) { return Number(a.orden || 99) - Number(b.orden || 99); });
    
    for (var j = 0; j < filtrados.length; j++) {
      filtrados[j].imagen_url = getDriveThumbnailUrl(filtrados[j].imagen_drive_id, 100);
      filtrados[j].video_url = getDriveFileUrl(filtrados[j].video_drive_id);
      filtrados[j].video_direct_url = getDriveVideoUrl(filtrados[j].video_drive_id);
    }
    
    return {success:true, data: filtrados};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Crea testimonio (vendedor) */
function createTestimonio(data, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var id = generateId('TES');
    var existentes = getAllRows('Testimonios');
    var orden = existentes.length + 1;
    
    getHoja('Testimonios').appendRow([
      id, data.cliente_nombre || '', data.cliente_ciudad || '', data.texto || '',
      data.imagen_drive_id || '', Number(data.calificacion) || 5, orden, true,
      data.video_drive_id || '', new Date().toISOString()
    ]);
    var testimonioRow = getHoja('Testimonios').getLastRow();
    setField('Testimonios', testimonioRow, 'video_drive_id', data.video_drive_id || '');
    setField('Testimonios', testimonioRow, 'fecha', new Date().toISOString());
    
    return {success:true, data:{id:id}};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Actualiza testimonio (vendedor) */
function updateTestimonio(id, data, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var row = getRowById('Testimonios', id);
    if (!row) return {success:false, error:'Testimonio no encontrado'};
    
    var hoja = getHoja('Testimonios');
    if (data.cliente_nombre !== undefined) hoja.getRange(row._row, 2).setValue(data.cliente_nombre);
    if (data.cliente_ciudad !== undefined) hoja.getRange(row._row, 3).setValue(data.cliente_ciudad);
    if (data.texto !== undefined) hoja.getRange(row._row, 4).setValue(data.texto);
    if (data.imagen_drive_id !== undefined) hoja.getRange(row._row, 5).setValue(data.imagen_drive_id);
    if (data.calificacion !== undefined) hoja.getRange(row._row, 6).setValue(Number(data.calificacion));
    if (data.orden !== undefined) hoja.getRange(row._row, 7).setValue(Number(data.orden));
    if (data.activo !== undefined) hoja.getRange(row._row, 8).setValue(data.activo);
    if (data.video_drive_id !== undefined) setField('Testimonios', row._row, 'video_drive_id', data.video_drive_id);
    
    return {success:true};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Elimina testimonio (vendedor) */
function deleteTestimonio(id, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var row = getRowById('Testimonios', id);
    if (!row) return {success:false, error:'Testimonio no encontrado'};
    
    if (row.imagen_drive_id) deleteFromDrive(row.imagen_drive_id);
    getHoja('Testimonios').deleteRow(row._row);
    return {success:true};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Sube imagen de testimonio */
function uploadTestimonioImagen(blob, testimonioId, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var result = uploadToDrive(blob, 'testimonios', 'tes_' + testimonioId + '.jpg');
    updateTestimonio(testimonioId, {imagen_drive_id: result.id}, token);
    return {success:true, data: result};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Sube imagen de testimonio desde dataURL/base64 */
function uploadTestimonioImagenBase64(fileData, testimonioId, token) {
  return uploadTestimonioImagen(dataUrlToBlob(fileData), testimonioId, token);
}

function uploadTestimonioVideoBase64(fileData, testimonioId, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    var result = uploadToDrive(dataUrlToBlob(fileData), 'testimonios', 'tes_video_' + testimonioId + '_' + Date.now());
    updateTestimonio(testimonioId, {video_drive_id: result.id}, token);
    return {success:true, data: result};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

// ==========================================
// PROMOCIONES
// ==========================================

/** Obtiene promoción activa */
function getPromocionActiva() {
  try {
    ensureColumns('Promociones', ['video_drive_id']);
    var rows = getAllRows('Promociones');
    var hoy = new Date();
    for (var i = 0; i < rows.length; i++) {
      if (isTruthy(rows[i].activa) &&
          new Date(rows[i].fecha_fin) >= hoy) {
        rows[i].imagen_url = getDriveThumbnailUrl(rows[i].imagen_drive_id, 800);
        rows[i].video_url = getDriveFileUrl(rows[i].video_drive_id);
        rows[i].video_direct_url = getDriveVideoUrl(rows[i].video_drive_id);
        return {success:true, data: rows[i]};
      }
    }
    return {success:true, data: null};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Obtiene todas las promociones (vendedor) */
function getPromociones(token) {
  try {
    ensureColumns('Promociones', ['video_drive_id']);
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var rows = getAllRows('Promociones');
    for (var i = 0; i < rows.length; i++) {
      rows[i].imagen_url = getDriveThumbnailUrl(rows[i].imagen_drive_id, 400);
      rows[i].video_url = getDriveFileUrl(rows[i].video_drive_id);
      rows[i].video_direct_url = getDriveVideoUrl(rows[i].video_drive_id);
      rows[i].es_activa = isTruthy(rows[i].activa) && new Date(rows[i].fecha_fin) >= new Date();
    }
    return {success:true, data: rows};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Crea promoción (vendedor) */
function createPromocion(data, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var id = generateId('PRO');
    getHoja('Promociones').appendRow([
      id, data.titulo || '', data.descripcion || '',
      Number(data.descuento_porcentaje) || 0,
      data.fecha_inicio || '', data.fecha_fin || '',
      data.imagen_drive_id || '', data.video_drive_id || '', true
    ]);
    var promoRow = getHoja('Promociones').getLastRow();
    setField('Promociones', promoRow, 'video_drive_id', data.video_drive_id || '');
    setField('Promociones', promoRow, 'activa', true);
    return {success:true, data:{id:id}};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Actualiza promoción (vendedor) */
function updatePromocion(id, data, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var row = getRowById('Promociones', id);
    if (!row) return {success:false, error:'Promoción no encontrada'};
    
    var hoja = getHoja('Promociones');
    if (data.titulo !== undefined) hoja.getRange(row._row, 2).setValue(data.titulo);
    if (data.descripcion !== undefined) hoja.getRange(row._row, 3).setValue(data.descripcion);
    if (data.descuento_porcentaje !== undefined) hoja.getRange(row._row, 4).setValue(Number(data.descuento_porcentaje));
    if (data.fecha_inicio !== undefined) hoja.getRange(row._row, 5).setValue(data.fecha_inicio);
    if (data.fecha_fin !== undefined) hoja.getRange(row._row, 6).setValue(data.fecha_fin);
    if (data.imagen_drive_id !== undefined) hoja.getRange(row._row, 7).setValue(data.imagen_drive_id);
    if (data.video_drive_id !== undefined) setField('Promociones', row._row, 'video_drive_id', data.video_drive_id);
    if (data.activa !== undefined) setField('Promociones', row._row, 'activa', data.activa);
    
    return {success:true};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Elimina promoción (vendedor) */
function deletePromocion(id, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    var row = getRowById('Promociones', id);
    if (!row) return {success:false, error:'Promoción no encontrada'};
    if (row.imagen_drive_id) deleteFromDrive(row.imagen_drive_id);
    getHoja('Promociones').deleteRow(row._row);
    return {success:true};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Sube imagen de promoción */
function uploadPromocionImagen(blob, promocionId, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    var result = uploadToDrive(blob, 'promociones', 'promo_' + promocionId + '.jpg');
    updatePromocion(promocionId, {imagen_drive_id: result.id}, token);
    return {success:true, data: result};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Sube imagen de promoción desde dataURL/base64 */
function uploadPromocionImagenBase64(fileData, promocionId, token) {
  return uploadPromocionImagen(dataUrlToBlob(fileData), promocionId, token);
}

function uploadPromocionVideoBase64(fileData, promocionId, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    var result = uploadToDrive(dataUrlToBlob(fileData), 'promociones', 'promo_video_' + promocionId + '_' + Date.now());
    updatePromocion(promocionId, {video_drive_id: result.id}, token);
    return {success:true, data: result};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

// ==========================================
// GALERÍA
// ==========================================

/** Obtiene galería activa */
function getGaleria() {
  try {
    ensureColumns('Galeria', ['video_drive_id','tipo','categoria_galeria']);
    var rows = getAllRows('Galeria');
    var filtradas = [];
    for (var i = 0; i < rows.length; i++) {
      if (isTruthy(rows[i].activo)) {
        filtradas.push(rows[i]);
      }
    }
    filtradas.sort(function(a,b) { return Number(a.orden || 99) - Number(b.orden || 99); });
    for (var j = 0; j < filtradas.length; j++) {
      filtradas[j].imagen_url = getDriveThumbnailUrl(filtradas[j].imagen_drive_id, 600);
      filtradas[j].video_url = getDriveFileUrl(filtradas[j].video_drive_id);
      filtradas[j].video_direct_url = getDriveVideoUrl(filtradas[j].video_drive_id);
      filtradas[j].tipo = filtradas[j].tipo || (filtradas[j].video_drive_id ? 'video' : 'imagen');
    }
    return {success:true, data: filtradas};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Agrega item a galería (vendedor) */
function addGaleriaItem(data, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var id = generateId('GAL');
    var existentes = getAllRows('Galeria');
    var orden = existentes.length + 1;
    
    getHoja('Galeria').appendRow([
      id, data.imagen_drive_id || '', data.titulo || '', orden, true
    ]);
    var galeriaRow = getHoja('Galeria').getLastRow();
    setField('Galeria', galeriaRow, 'video_drive_id', data.video_drive_id || '');
    setField('Galeria', galeriaRow, 'tipo', data.tipo || (data.video_drive_id ? 'video' : 'imagen'));
    setField('Galeria', galeriaRow, 'categoria_galeria', data.categoria_galeria || '');
    setField('Galeria', galeriaRow, 'orden', orden);
    setField('Galeria', galeriaRow, 'activo', true);
    return {success:true, data:{id:id}};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Elimina item de galería (vendedor) */
function deleteGaleriaItem(id, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    var row = getRowById('Galeria', id);
    if (!row) return {success:false, error:'Item no encontrado'};
    if (row.imagen_drive_id) deleteFromDrive(row.imagen_drive_id);
    getHoja('Galeria').deleteRow(row._row);
    return {success:true};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Sube imagen de galería */
function uploadGaleriaImagen(blob, galeriaId, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    var result = uploadToDrive(blob, 'galeria', 'gal_' + galeriaId + '.jpg');
    var row = getRowById('Galeria', galeriaId);
    if (row) {
      setField('Galeria', row._row, 'imagen_drive_id', result.id);
      setField('Galeria', row._row, 'tipo', 'imagen');
    }
    return {success:true, data: result};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Sube imagen de galería desde dataURL/base64 */
function uploadGaleriaImagenBase64(fileData, galeriaId, token) {
  return uploadGaleriaImagen(dataUrlToBlob(fileData), galeriaId, token);
}

function uploadGaleriaVideoBase64(fileData, galeriaId, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    var result = uploadToDrive(dataUrlToBlob(fileData), 'galeria', 'gal_video_' + galeriaId + '_' + Date.now());
    var row = getRowById('Galeria', galeriaId);
    if (row) {
      setField('Galeria', row._row, 'video_drive_id', result.id);
      setField('Galeria', row._row, 'tipo', 'video');
    }
    return {success:true, data: result};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

// ==========================================
// PEDIDOS
// ==========================================

function notifyOrderByEmail(order) {
  try {
    var subject = 'Nuevo pedido Luz Gomez: ' + order.id;
    var body = [
      'Nuevo pedido recibido.',
      '',
      'Pedido: ' + order.id,
      'Cliente: ' + order.cliente_nombre,
      'Telefono: ' + order.cliente_telefono,
      'Total: $ ' + Number(order.total || 0).toLocaleString('es-CO', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
      '',
      'Detalle:',
      order.whatsapp_mensaje || order.items_json
    ].join('\n');
    MailApp.sendEmail(SELLER_EMAIL, subject, body);
    return true;
  } catch(e) {
    Logger.log('No se pudo enviar correo de pedido: ' + e);
    return false;
  }
}

/** Crea pedido desde carrito */
function createPedido(data) {
  try {
    ensureColumns('Pedidos', ['leido_vendedor','notificado_email']);
    if (!data.cliente_id || !data.cliente_nombre || !data.cliente_telefono || !data.items_json) {
      return {success:false, error:'Faltan datos del pedido'};
    }
    
    var id = generateId('PED');
    var ahora = new Date().toISOString();
    
    var pedido = {
      id: id,
      cliente_id: data.cliente_id,
      cliente_nombre: data.cliente_nombre,
      cliente_telefono: data.cliente_telefono,
      items_json: data.items_json,
      total: Number(data.total) || 0,
      estado: 'pendiente',
      fecha_creacion: ahora,
      fecha_actualizacion: ahora,
      whatsapp_mensaje: data.whatsapp_mensaje || ''
    };
    var emailSent = notifyOrderByEmail(pedido);
    appendObject('Pedidos', {
      id: pedido.id, cliente_id: pedido.cliente_id, cliente_nombre: pedido.cliente_nombre,
      cliente_telefono: pedido.cliente_telefono, items_json: pedido.items_json, total: pedido.total,
      estado: pedido.estado, fecha_creacion: pedido.fecha_creacion, fecha_actualizacion: pedido.fecha_actualizacion,
      whatsapp_mensaje: pedido.whatsapp_mensaje, leido_vendedor: false, notificado_email: emailSent
    }, ['id','cliente_id','cliente_nombre','cliente_telefono','items_json','total','estado','fecha_creacion','fecha_actualizacion','whatsapp_mensaje','leido_vendedor','notificado_email']);
    /*
    getHoja('Pedidos').appendRow([
      id, data.cliente_id, data.cliente_nombre, data.cliente_telefono,
      data.items_json, Number(data.total) || 0, 'pendiente',
      ahora, ahora, data.whatsapp_mensaje || ''
    ]);
    */
    
    return {success:true, data:{id:id}};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Obtiene todos los pedidos (vendedor) */
function getPedidos(token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var rows = getAllRows('Pedidos');
    rows.sort(function(a,b) { return new Date(b.fecha_creacion) - new Date(a.fecha_creacion); });
    return {success:true, data: rows};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Actualiza estado de pedido (vendedor) */
function updatePedidoEstado(id, estado, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var row = getRowById('Pedidos', id);
    if (!row) return {success:false, error:'Pedido no encontrado'};
    
    getHoja('Pedidos').getRange(row._row, 7).setValue(estado);
    getHoja('Pedidos').getRange(row._row, 9).setValue(new Date().toISOString());
    return {success:true};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

/** Obtiene pedidos de un cliente (vendedor) */
function getPedidosByCliente(clienteId, token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var rows = getAllRows('Pedidos');
    var filtrados = [];
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].cliente_id === clienteId) filtrados.push(rows[i]);
    }
    return {success:true, data: filtrados};
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

// ==========================================
// ESTADÍSTICAS DASHBOARD
// ==========================================

function getDashboardStats(token) {
  try {
    var auth = validateSession(token);
    if (!auth.success || auth.data.tipo !== 'vendedor') return {success:false, error:'Sin permisos'};
    
    var productos = getAllRows('Productos');
    var categorias = getAllRows('Categorias');
    var clientes = getAllRows('Clientes');
    var pedidos = getAllRows('Pedidos');
    var comentarios = getAllRows('Comentarios');
    
    var totalProductos = 0, totalCategorias = 0, totalClientes = 0;
    var pedidosPendientes = 0, comentariosPendientes = 0, pedidosNuevos = 0;
    var ingresosMes = 0, productosSinStock = 0;
    
    for (var i = 0; i < productos.length; i++) {
      if (isTruthy(productos[i].activo)) {
        totalProductos++;
        if (Number(productos[i].stock) <= 0) productosSinStock++;
      }
    }
    for (var j = 0; j < categorias.length; j++) {
      if (isTruthy(categorias[j].activa)) totalCategorias++;
    }
    totalClientes = clientes.length;
    
    var ahora = new Date();
    var mesActual = ahora.getMonth();
    var anioActual = ahora.getFullYear();
    
    for (var k = 0; k < pedidos.length; k++) {
      if (pedidos[k].estado === 'pendiente') pedidosPendientes++;
      if (!isTruthy(pedidos[k].leido_vendedor)) pedidosNuevos++;
      var fecha = new Date(pedidos[k].fecha_creacion);
      if (fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual) {
        if (pedidos[k].estado !== 'cancelado') {
          ingresosMes += Number(pedidos[k].total) || 0;
        }
      }
    }
    
    for (var l = 0; l < comentarios.length; l++) {
      if (!isTruthy(comentarios[l].leido)) {
        comentariosPendientes++;
      }
    }
    pedidos.sort(function(a,b) { return new Date(b.fecha_creacion) - new Date(a.fecha_creacion); });
    
    return {
      success: true,
      data: {
        total_productos: totalProductos,
        total_categorias: totalCategorias,
        total_clientes: totalClientes,
        total_pedidos: pedidos.length,
        pedidos_pendientes: pedidosPendientes,
        ingresos_mes: ingresosMes,
        productos_sin_stock: productosSinStock,
        comentarios_pendientes: comentariosPendientes,
        pedidos_nuevos: pedidosNuevos,
        ultimos_pedidos: pedidos.slice(0, 5)
      }
    };
  } catch(e) {
    return {success:false, error: e.toString()};
  }
}

// ==========================================
// HANDLERS HTTP
// ==========================================

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Luz Gomez | Artesanías, Ropa & Regalos con Amor')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var params = body.params || {};
    
    var publicActions = [
      'doLogin','doLoginWithPin','doRegisterCliente','getConfig',
      'getCategorias','getProductos','getProductosDestacados','getProductoById',
      'getComentariosByProducto','createComentario','getTestimonios',
      'getPromocionActiva','getGaleria','createPedido','getProductsCount'
    ];
    
    var protectedActions = [
      'validateSession','doLogout','updateConfig',
      'createCategoria','updateCategoria','deleteCategoria',
      'uploadCategoriaImagenBase64','uploadCategoriaVideoBase64',
      'createProducto','updateProducto','deleteProducto','deleteArchivoDrive',
      'uploadProductoImagenBase64','uploadProductoVideoBase64',
      'getComentariosPendientes','getComentariosNoLeidos','getNotificacionesVendedor','marcarComentarioLeido','marcarComentariosLeidos','marcarNotificacionesLeidas','responderComentario','aprobarComentario','rechazarComentario',
      'createTestimonio','updateTestimonio','deleteTestimonio',
      'uploadTestimonioImagenBase64','uploadTestimonioVideoBase64',
      'getPromociones','createPromocion','updatePromocion','deletePromocion',
      'uploadPromocionImagenBase64','uploadPromocionVideoBase64',
      'addGaleriaItem','deleteGaleriaItem',
      'uploadGaleriaImagenBase64','uploadGaleriaVideoBase64',
      'getPedidos','updatePedidoEstado','getPedidosByCliente',
      'getDashboardStats'
    ];
    
    if (typeof this[action] !== 'function') {
      return ContentService.createTextOutput(JSON.stringify({success:false, error:'Acción no encontrada: ' + action}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var result;
    
    if (publicActions.indexOf(action) !== -1) {
      result = this[action].apply(this, Object.values(params));
    } else if (protectedActions.indexOf(action) !== -1) {
      var session = validateSession(params.token);
      if (!session.success) {
        return ContentService.createTextOutput(JSON.stringify({success:false, error:'Sesión inválida'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      result = this[action].apply(this, Object.values(params));
    } else {
      return ContentService.createTextOutput(JSON.stringify({success:false, error:'Acción no autorizada'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({success:false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


