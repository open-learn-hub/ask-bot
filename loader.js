const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const CONTENT_DIR = path.join(__dirname, 'content');

const GDOC_PATTERN = /docs\.google\.com\/document\/d\/([^/?#]+)/;
const GSHEET_PATTERN = /docs\.google\.com\/spreadsheets\/d\/([^/?#]+)/;

// Build Google auth client once at startup (if credentials provided)
let googleAuth = null;
if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  googleAuth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/documents.readonly',
      'https://www.googleapis.com/auth/spreadsheets.readonly',
    ],
  });
}

function extractDocText(document) {
  const segments = [];
  for (const element of document.body.content || []) {
    if (!element.paragraph) continue;
    for (const pe of element.paragraph.elements || []) {
      if (pe.textRun && pe.textRun.content) {
        segments.push(pe.textRun.content);
      }
    }
  }
  return segments.join('');
}

async function loadGoogleDoc(docId) {
  if (!googleAuth) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not configured');
  const docs = google.docs({ version: 'v1', auth: googleAuth });
  const res = await docs.documents.get({ documentId: docId });
  return extractDocText(res.data);
}

async function loadGoogleSheet(sheetId) {
  if (!googleAuth) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not configured');
  const sheets = google.sheets({ version: 'v4', auth: googleAuth });
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const sheetNames = meta.data.sheets.map((s) => s.properties.title);

  const results = await Promise.all(
    sheetNames.map(async (name) => {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: name,
      });
      const rows = res.data.values || [];
      return `Sheet: ${name}\n${rows.map((r) => r.join('\t')).join('\n')}`;
    })
  );
  return results.join('\n\n');
}

async function loadSource(source) {
  source = source.trim();

  const docMatch = source.match(GDOC_PATTERN);
  if (docMatch) return loadGoogleDoc(docMatch[1]);

  const sheetMatch = source.match(GSHEET_PATTERN);
  if (sheetMatch) return loadGoogleSheet(sheetMatch[1]);

  // Local file
  const filePath = path.join(CONTENT_DIR, source);
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === '.docx') {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  if (ext === '.xlsx' || ext === '.xls') {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    return workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      return `Sheet: ${name}\n${XLSX.utils.sheet_to_csv(sheet)}`;
    }).join('\n\n');
  }

  return fs.readFileSync(filePath, 'utf8');
}

module.exports = { loadSource };
