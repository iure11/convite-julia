const INVITATION = Object.freeze({
  id: 'convite-julia-2026',
  recipient: 'Júlia',
  sender: 'Iure',
  sheetName: 'Respostas',
  allowedActivities: ['Jantar/macarrão', 'Barzinho de rock', 'Cafeteria/Padoca']
});

const HEADERS = [
  'Recebido em', 'ID da resposta', 'ID do convite', 'Convidada', 'Remetente',
  'Reação', 'Rolê', 'Data escolhida', 'Data formatada', 'Horário',
  'Preferências', 'Observação', 'Enviado em', 'URL do convite'
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const payload = parsePayload_(e);
    validatePayload_(payload);
    const sheet = getResponseSheet_();
    ensureHeaders_(sheet);

    if (isDuplicate_(sheet, payload.responseId)) {
      return json_({ success: true, message: 'Resposta já registrada', responseId: payload.responseId });
    }

    sheet.appendRow([
      new Date(),
      clean_(payload.responseId, 100),
      clean_(payload.invitationId, 100),
      clean_(payload.recipient, 80),
      clean_(payload.sender, 80),
      clean_(payload.reaction, 120),
      clean_(payload.activity, 80),
      clean_(payload.date, 10),
      clean_(payload.formattedDate, 80),
      clean_(payload.time, 5),
      Array.isArray(payload.preferences) ? payload.preferences.map(function (item) { return clean_(item, 100); }).join(', ') : '',
      clean_(payload.note || '', 250),
      clean_(payload.submittedAt || '', 40),
      clean_(payload.pageUrl || '', 500)
    ]);

    return json_({ success: true, message: 'Resposta registrada', responseId: payload.responseId });
  } catch (error) {
    return json_({ success: false, message: safeErrorMessage_(error) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) throw new Error('EMPTY_BODY');
  try { return JSON.parse(e.postData.contents); }
  catch (_) { throw new Error('INVALID_BODY'); }
}

function validatePayload_(data) {
  if (!data || typeof data !== 'object') throw new Error('INVALID_BODY');
  if (!data.responseId || typeof data.responseId !== 'string') throw new Error('MISSING_ID');
  if (data.invitationId !== INVITATION.id) throw new Error('INVALID_INVITATION');
  if (data.recipient !== INVITATION.recipient || data.sender !== INVITATION.sender) throw new Error('INVALID_PARTICIPANTS');
  if (INVITATION.allowedActivities.indexOf(data.activity) === -1) throw new Error('INVALID_ACTIVITY');
  if (!isValidDate_(data.date)) throw new Error('INVALID_DATE');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(data.time || '')) || data.time < '18:00') throw new Error('INVALID_TIME');
  if (String(data.note || '').length > 250) throw new Error('NOTE_TOO_LONG');
  if (data.preferences !== undefined && !Array.isArray(data.preferences)) throw new Error('INVALID_PREFERENCES');
}

function getResponseSheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  const spreadsheet = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('SHEET_NOT_FOUND');
  return spreadsheet.getSheetByName(INVITATION.sheetName) || spreadsheet.insertSheet(INVITATION.sheetName);
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#4f162a').setFontColor('#ffffff');
  }
}

function isDuplicate_(sheet, responseId) {
  if (sheet.getLastRow() < 2) return false;
  return sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).createTextFinder(responseId).matchEntireCell(true).findNext() !== null;
}

function isValidDate_(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const parts = value.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.getFullYear() === parts[0] && date.getMonth() === parts[1] - 1 && date.getDate() === parts[2];
}

function clean_(value, maxLength) {
  const text = String(value === undefined || value === null ? '' : value).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, maxLength);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function safeErrorMessage_(error) {
  const messages = {
    EMPTY_BODY: 'Nenhuma resposta recebida', INVALID_BODY: 'Formato de resposta inválido', MISSING_ID: 'Identificador ausente',
    INVALID_INVITATION: 'Convite inválido', INVALID_PARTICIPANTS: 'Participantes inválidos', INVALID_ACTIVITY: 'Opção inválida',
    INVALID_DATE: 'Data inválida', INVALID_TIME: 'Horário inválido', NOTE_TOO_LONG: 'Observação muito longa',
    INVALID_PREFERENCES: 'Preferências inválidas', SHEET_NOT_FOUND: 'Planilha não localizada'
  };
  return messages[error && error.message] || 'Não foi possível registrar a resposta';
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
