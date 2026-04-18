// ============================================================
// SETUP.GS - Google Apps Script Backend
// Penilaian Pramuka - Lomba Regu
// ============================================================

const SHEET_NAME = "NILAI";
const HEADERS = [
  "NO", "NOMOR REGU", "JENIS_REGU", "NAMA_SEKOLAH",
  // KREASI TONGKAT
  "SIMPUL", "KREATIFITAS_TONGKAT", "KEKUATAN", "KERAPIAN",
  // SESANDI (SEMAPHORE-MORSE)
  "KETEPATAN_SEMAPHORE", "KECEPATAN_SEMAPHORE",
  // YEL-YEL
  "KREATIFITAS_YEL", "KEKOMPAKAN"
];

// Ambil password dari Script Properties (bisa diubah tanpa deploy ulang)
function getAdminPassword() {
  const stored = PropertiesService.getScriptProperties().getProperty("ADMIN_PASSWORD");
  return stored || "admin1234";
}

function getPrintPassword() {
  const stored = PropertiesService.getScriptProperties().getProperty("PRINT_PASSWORD");
  return stored || "cetak1234";
}

// Jalankan fungsi ini dari editor Apps Script untuk ganti password admin
function gantiPassword() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt("Ganti Password Admin", "Masukkan password baru (min. 4 karakter):", ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() === ui.Button.OK) {
    const newPw = result.getResponseText().trim();
    if (newPw.length < 4) { ui.alert("❌ Password minimal 4 karakter!"); return; }
    PropertiesService.getScriptProperties().setProperty("ADMIN_PASSWORD", newPw);
    ui.alert("✅ Password Admin berhasil diubah!");
  }
}

// Jalankan fungsi ini dari editor Apps Script untuk ganti password cetak
function gantiPasswordCetak() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt("Ganti Password Cetak", "Masukkan password cetak baru (min. 4 karakter):", ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() === ui.Button.OK) {
    const newPw = result.getResponseText().trim();
    if (newPw.length < 4) { ui.alert("❌ Password minimal 4 karakter!"); return; }
    PropertiesService.getScriptProperties().setProperty("PRINT_PASSWORD", newPw);
    ui.alert("✅ Password Cetak berhasil diubah!");
  }
}

// ============================================================
// SETUP SPREADSHEET
// ============================================================
function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // Set headers
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

  // Style header
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setBackground("#1a472a");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");

  // Freeze header row
  sheet.setFrozenRows(1);

  // Set column widths
  sheet.setColumnWidth(1, 50);
  sheet.setColumnWidth(2, 120);
  for (let i = 3; i <= HEADERS.length; i++) {
    sheet.setColumnWidth(i, 100);
  }

  // Add sample data
  const sampleData = [
    [1, "REGU 01", 35, 25, 18, 9, 55, 38, 50, 35, 55, 38],
    [2, "REGU 02", 38, 28, 17, 8, 58, 36, 52, 33, 58, 36],
    [3, "REGU 03", 32, 22, 16, 7, 52, 34, 48, 31, 52, 34],
  ];
  sheet.getRange(2, 1, sampleData.length, HEADERS.length).setValues(sampleData);

  SpreadsheetApp.getUi().alert("Setup selesai! Sheet NILAI berhasil dibuat.");
}

// ============================================================
// WEB APP HANDLER
// ============================================================
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile("index")
    .setTitle("Nilai Bakat Pestama II 2026")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  const params = JSON.parse(e.postData.contents);
  const action = params.action;

  if (action === "login") return login(params);
  if (action === "loginPrint") return loginPrint(params);
  if (action === "getData") return getData();
  if (action === "saveData") return saveData(params);
  if (action === "deleteRow") return deleteRow(params);

  return jsonResponse({ success: false, message: "Action tidak dikenal" });
}

// ============================================================
// FUNCTIONS
// ============================================================
function login(params) {
  if (params.password === getAdminPassword()) {
    return jsonResponse({ success: true, message: "Login berhasil" });
  }
  return jsonResponse({ success: false, message: "Password salah" });
}

function loginPrint(params) {
  if (params.password === getPrintPassword()) {
    return jsonResponse({ success: true, message: "Akses cetak diberikan" });
  }
  return jsonResponse({ success: false, message: "Password cetak salah" });
}

function getData() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return jsonResponse({ success: true, data: [] });

    const rawData = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
    const result = rawData
      .map((row, idx) => ({ row, sheetRow: idx + 2 }))   // tandai nomor baris SEBELUM filter
      .filter(({ row }) => row[0] !== "" && row[1] !== "")
      .map(({ row, sheetRow }) => ({
        sheetRow,
        no: row[0],
        nomorRegu: row[1],
        jenisRegu: row[2] || "Putra",
        namaSekolah: row[3] || "",
        tongkat: {
          simpul: row[4] || 0,
          kreatifitas: row[5] || 0,
          kekuatan: row[6] || 0,
          kerapian: row[7] || 0,
          total: (row[4]||0)+(row[5]||0)+(row[6]||0)+(row[7]||0)
        },
        semaphore: {
          ketepatan: row[8] || 0,
          kecepatan: row[9] || 0,
          total: (row[8]||0)+(row[9]||0)
        },
        yel: {
          kreatifitas: row[10] || 0,
          kekompakan: row[11] || 0,
          total: (row[10]||0)+(row[11]||0)
        },
        totalAkhir: (row[4]||0)+(row[5]||0)+(row[6]||0)+(row[7]||0)+
                    (row[8]||0)+(row[9]||0)+
                    (row[10]||0)+(row[11]||0)
      }));

    return jsonResponse({ success: true, data: result });
  } catch (err) {
    return jsonResponse({ success: false, message: err.toString() });
  }
}

function saveData(params) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const d = params.data;
    const rowData = [
      d.no, d.nomorRegu, d.jenisRegu || "Putra", d.namaSekolah || "",
      d.simpul, d.kreatifitasTongkat, d.kekuatan, d.kerapian,
      d.ketepatanSemaphore, d.kecepatanSemaphore,
      d.kreatifitasYel, d.kekompakan
    ];

    if (d.sheetRow) {
      // UPDATE: tulis langsung ke baris sheet yang tepat
      const targetRow = parseInt(d.sheetRow);
      const lastRow = sheet.getLastRow();
      if (targetRow >= 2 && targetRow <= lastRow) {
        sheet.getRange(targetRow, 1, 1, HEADERS.length).setValues([rowData]);
      } else {
        // Baris tidak ditemukan, append sebagai data baru
        sheet.getRange(sheet.getLastRow() + 1, 1, 1, HEADERS.length).setValues([rowData]);
      }
    } else {
      // INSERT: tambah baris baru
      sheet.getRange(sheet.getLastRow() + 1, 1, 1, HEADERS.length).setValues([rowData]);
    }

    return jsonResponse({ success: true, message: "Data berhasil disimpan" });
  } catch (err) {
    return jsonResponse({ success: false, message: err.toString() });
  }
}

function deleteRow(params) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const targetRow = parseInt(params.sheetRow);
    if (targetRow >= 2) {
      sheet.deleteRow(targetRow);
    }
    return jsonResponse({ success: true, message: "Data berhasil dihapus" });
  } catch (err) {
    return jsonResponse({ success: false, message: err.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
