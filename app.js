// ============================================================
// APP.JS - Frontend Logic
// Papan Nilai Pramuka
// ============================================================

// ============================================================
// TAB SWITCHING
// ============================================================
function switchTab(btn, name) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));
  document.getElementById("tab-" + name).classList.add("active");
  btn.classList.add("active");
}

// ============================================================
// REFRESH BUTTON - with spin animation & debounce
// ============================================================
let _refreshing = false;
async function refreshData(btn) {
  if (_refreshing) return;
  _refreshing = true;
  const icon = btn.querySelector("i");
  icon.classList.add("fa-spin");
  btn.disabled = true;
  await loadData();
  icon.classList.remove("fa-spin");
  btn.disabled = false;
  _refreshing = false;
}

// ============================================================
// PUBLIC PAGE - Load & Render Data
// ============================================================
async function loadData() {
  showSkeletonTable();
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getData" })
    });
    const json = await res.json();
    if (json.success) {
      renderTable(json.data);
      _lombaData = json.data;
      renderLombaTable("bodyTongkatPutra", json.data, "tongkat", [
        { key: "simpul", label: "Simpul", max: 40 },
        { key: "kreatifitas", label: "Kreatifitas", max: 30 },
        { key: "kekuatan", label: "Kekuatan", max: 20 },
        { key: "kerapian", label: "Kerapian", max: 10 }
      ], 7, "Putra");
      renderLombaTable("bodyTongkatPutri", json.data, "tongkat", [
        { key: "simpul", label: "Simpul", max: 40 },
        { key: "kreatifitas", label: "Kreatifitas", max: 30 },
        { key: "kekuatan", label: "Kekuatan", max: 20 },
        { key: "kerapian", label: "Kerapian", max: 10 }
      ], 7, "Putri");
      renderLombaTable("bodySemaphorePutra", json.data, "semaphore", [
        { key: "ketepatan", label: "Ketepatan", max: 60 },
        { key: "kecepatan", label: "Kecepatan", max: 40 }
      ], 5, "Putra");
      renderLombaTable("bodySemaphorePutri", json.data, "semaphore", [
        { key: "ketepatan", label: "Ketepatan", max: 60 },
        { key: "kecepatan", label: "Kecepatan", max: 40 }
      ], 5, "Putri");
      renderLombaTable("bodyYelPutra", json.data, "yel", [
        { key: "kreatifitas", label: "Kreatifitas", max: 60 },
        { key: "kekompakan", label: "Kekompakan", max: 40 }
      ], 5, "Putra");
      renderLombaTable("bodyYelPutri", json.data, "yel", [
        { key: "kreatifitas", label: "Kreatifitas", max: 60 },
        { key: "kekompakan", label: "Kekompakan", max: 40 }
      ], 5, "Putri");
      renderStats(json.data);
      renderPodium(json.data);
      renderPeserta(json.data);
      document.getElementById("lastUpdate").textContent =
        "Terakhir diperbarui: " + new Date().toLocaleTimeString("id-ID");
      hidePageLoader();
    }
  } catch (e) {
    hidePageLoader();
    document.getElementById("tableBody").innerHTML =
      `<tr><td colspan="15" class="loading-row" style="color:#e53935">
        <i class="fa-solid fa-triangle-exclamation"></i> Gagal memuat data. Pastikan API_URL sudah dikonfigurasi.
      </td></tr>`;
  }
}

function hidePageLoader() {
  const loader = document.getElementById("pageLoader");
  if (!loader) return;
  loader.classList.add("loader-hide");
  setTimeout(() => loader.style.display = "none", 500);
}

function showSkeletonTable() {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;
  const skeletonRow = (cols) => `<tr class="skeleton-row">${
    Array.from({length: cols}, (_, i) =>
      `<td><div class="skeleton-cell" style="width:${[30,80,50,50,50,50,55,50,50,55,50,50,55,60,40][i] || 50}%"></div></td>`
    ).join("")
  }</tr>`;
  tbody.innerHTML = Array.from({length: 5}, () => skeletonRow(15)).join("");
}

// ============================================================
// FILTER LOMBA (search per tab)
// ============================================================
let _lombaData = [];

function filterLomba(cat) {
  const input = document.getElementById("search" + cap(cat));
  const q = (input?.value || "").toLowerCase();
  const clearBtn = document.getElementById("clear" + cap(cat));
  if (clearBtn) clearBtn.style.display = q ? "flex" : "none";

  const fields = {
    tongkat:   [{ key:"simpul",max:40},{key:"kreatifitas",max:30},{key:"kekuatan",max:20},{key:"kerapian",max:10}],
    semaphore: [{ key:"ketepatan",max:60},{key:"kecepatan",max:40}],
    yel:       [{ key:"kreatifitas",max:60},{key:"kekompakan",max:40}],
  };
  const colspans = { tongkat:7, semaphore:5, yel:5 };

  const filtered = q
    ? _lombaData.filter(r =>
        r.nomorRegu.toLowerCase().includes(q) ||
        (r.namaSekolah||"").toLowerCase().includes(q))
    : _lombaData;

  const putra = filtered.filter(r => (r.jenisRegu||"Putra") === "Putra");
  const putri = filtered.filter(r => (r.jenisRegu||"") === "Putri");

  renderLombaTable("body"+cap(cat)+"Putra", putra, cat, fields[cat], colspans[cat], null);
  renderLombaTable("body"+cap(cat)+"Putri", putri, cat, fields[cat], colspans[cat], null);
}

function clearLombaSearch(cat) {
  const input = document.getElementById("search" + cap(cat));
  if (input) input.value = "";
  filterLomba(cat);
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ============================================================
// DAFTAR PESERTA
// ============================================================
let _pesertaData = [];
let _pesertaJenis = "semua";

function renderPeserta(data) {
  _pesertaData = [...data].sort((a, b) => a.no - b.no);
  filterPeserta();
}

function filterPeserta() {
  const q = (document.getElementById("pesertaSearch")?.value || "").toLowerCase();
  const btnClear = document.getElementById("btnClearSearch");
  if (btnClear) btnClear.style.display = q ? "flex" : "none";

  const filtered = _pesertaData.filter(r => {
    const matchJenis = _pesertaJenis === "semua" || (r.jenisRegu || "Putra") === _pesertaJenis;
    const matchQ = !q ||
      r.nomorRegu.toLowerCase().includes(q) ||
      (r.namaSekolah || "").toLowerCase().includes(q);
    return matchJenis && matchQ;
  });

  const count = document.getElementById("pesertaCount");
  if (count) count.textContent = `${filtered.length} regu ditemukan`;

  const tbody = document.getElementById("bodyPeserta");
  if (!tbody) return;
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="loading-row">Tidak ada data yang cocok.</td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map((r, i) => `
    <tr>
      <td style="text-align:center;font-weight:600">${r.no}</td>
      <td class="td-regu">${r.nomorRegu}</td>
      <td style="text-align:center">
        <span class="badge-jenis ${(r.jenisRegu||'Putra') === 'Putri' ? 'putri' : 'putra'}">
          ${(r.jenisRegu||'Putra') === 'Putri' ? '🔴 Putri' : '🔵 Putra'}
        </span>
      </td>
      <td>${r.namaSekolah || '<span style="color:#bbb">-</span>'}</td>
    </tr>`).join("");
}

function setFilterJenis(btn, jenis) {
  _pesertaJenis = jenis;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  filterPeserta();
}

function clearSearch() {
  document.getElementById("pesertaSearch").value = "";
  filterPeserta();
}

// ============================================================
// RENDER REKAP TABLE
// ============================================================
function renderTable(data) {
  const sorted = [...data].sort((a, b) => b.totalAkhir - a.totalAkhir);
  const tbody = document.getElementById("tableBody");

  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="15" class="loading-row">Belum ada data nilai.</td></tr>`;
    return;
  }
  // Hitung rank per lomba untuk badge di rekap
  const rankTongkat   = getRankMap(data, r => r.tongkat.total);
  const rankSemaphore = getRankMap(data, r => r.semaphore.total);
  const rankYel       = getRankMap(data, r => r.yel.total);

  tbody.innerHTML = sorted.map((r, i) => {
    const rank = i + 1;
    const rankClass = rank <= 3 ? `rank-${rank}` : "rank-other";
    return `
    <tr class="${rank <= 3 ? 'top-row' : ''}">
      <td>${r.no}</td>
      <td class="td-regu">${r.nomorRegu} <span class="badge-jenis-sm ${r.jenisRegu === 'Putri' ? 'putri' : 'putra'}">${r.jenisRegu || 'Putra'}</span><br/><span style="font-size:.7rem;color:#888;font-weight:400">${r.namaSekolah || ''}</span></td>
      <td>${scoreCell(r.tongkat.simpul, 40)}</td>
      <td>${scoreCell(r.tongkat.kreatifitas, 30)}</td>
      <td>${scoreCell(r.tongkat.kekuatan, 20)}</td>
      <td>${scoreCell(r.tongkat.kerapian, 10)}</td>
      <td class="sub-total-cell tongkat-color">${r.tongkat.total}<br/><span class="rank-mini rank-mini-${rankTongkat[r.nomorRegu]}">#${rankTongkat[r.nomorRegu]}</span></td>
      <td>${scoreCell(r.semaphore.ketepatan, 60)}</td>
      <td>${scoreCell(r.semaphore.kecepatan, 40)}</td>
      <td class="sub-total-cell semaphore-color">${r.semaphore.total}<br/><span class="rank-mini rank-mini-${rankSemaphore[r.nomorRegu]}">#${rankSemaphore[r.nomorRegu]}</span></td>
      <td>${scoreCell(r.yel.kreatifitas, 60)}</td>
      <td>${scoreCell(r.yel.kekompakan, 40)}</td>
      <td class="sub-total-cell yel-color">${r.yel.total}<br/><span class="rank-mini rank-mini-${rankYel[r.nomorRegu]}">#${rankYel[r.nomorRegu]}</span></td>
      <td class="total-cell">${r.totalAkhir}</td>
      <td><span class="rank-badge ${rankClass}">${rank}</span></td>
    </tr>`;
  }).join("");
}

// ============================================================
// RENDER PER-LOMBA TABLE
// ============================================================
function renderLombaTable(tbodyId, data, category, fields, colspan, jenisFilter) {
  const filtered = jenisFilter ? data.filter(r => (r.jenisRegu || "Putra") === jenisFilter) : data;  const sorted = [...filtered].sort((a, b) => b[category].total - a[category].total);
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="loading-row">Belum ada data.</td></tr>`;
    return;
  }
  // Tampilkan semua, highlight top 6
  tbody.innerHTML = sorted.map((r, i) => {
    const rank = i + 1;
    const rankClass = rank <= 3 ? `rank-${rank}` : rank <= 6 ? "rank-top6" : "rank-other";
    const maxTotal = fields.reduce((s, f) => s + f.max, 0);
    const pct = Math.round((r[category].total / maxTotal) * 100);
    return `
    <tr class="${rank <= 6 ? 'top6-row' : ''} ${rank <= 3 ? 'top-row' : ''}">
      <td><span class="rank-badge ${rankClass}">${rank}</span></td>
      <td class="td-regu">${r.nomorRegu}<br/><span class="regu-sekolah">${r.namaSekolah || ''}</span></td>
      ${fields.map(f => `<td>${scoreCell(r[category][f.key], f.max)}</td>`).join("")}
      <td>
        <div class="total-lomba">
          <span class="total-num">${r[category].total}</span>
          <div class="total-bar-wrap"><div class="total-bar-fill" style="width:${pct}%"></div></div>
          <span class="total-pct">${pct}%</span>
        </div>
      </td>
    </tr>`;
  }).join("");
}

// ============================================================
// HELPERS
// ============================================================
function getRankMap(data, scoreFn) {
  const sorted = [...data].sort((a, b) => scoreFn(b) - scoreFn(a));
  const map = {};
  sorted.forEach((r, i) => { map[r.nomorRegu] = i + 1; });
  return map;
}

function scoreCell(val, max) {
  const pct = Math.min(100, Math.round((val / max) * 100));
  return `<div class="score-bar">
    ${val}
    <div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div>
  </div>`;
}

function getSekolahRanking(data) {
  // Gabungkan nilai putra + putri per sekolah
  const map = {};
  data.forEach(r => {
    const raw = (r.namaSekolah || r.nomorRegu).trim();
    const key = raw.toLowerCase(); // normalisasi agar beda kapitalisasi/spasi tetap digabung
    if (!map[key]) {
      map[key] = { namaSekolah: raw, total: 0, regu: [] };
    } else if (!map[key].namaSekolah && raw) {
      // Gunakan nama non-kosong jika sebelumnya kosong
      map[key].namaSekolah = raw;
    }
    map[key].total += r.totalAkhir;
    map[key].regu.push(r);
  });
  return Object.values(map).sort((a, b) => b.total - a.total);
}

function renderStats(data) {
  const sorted = getSekolahRanking(data);
  document.getElementById("totalRegu").textContent = data.length;
  document.getElementById("juara1").textContent = sorted[0]?.namaSekolah || "-";
  document.getElementById("juara2").textContent = sorted[1]?.namaSekolah || "-";
  document.getElementById("juara3").textContent = sorted[2]?.namaSekolah || "-";
}

function renderPodium(data) {
  // Gunakan hasil ranking yang sama untuk stats dan podium
  const sorted = getSekolahRanking(data);
  if (!sorted.length) return;
  document.getElementById("podiumSection").style.display = "block";

  const fmt = (s) => s ? s.namaSekolah : "-";
  const fmtScore = (s) => s ? `${s.total} poin` : "0";
  if (sorted[0]) { document.getElementById("p1name").textContent = fmt(sorted[0]); document.getElementById("p1score").textContent = fmtScore(sorted[0]); }
  if (sorted[1]) { document.getElementById("p2name").textContent = fmt(sorted[1]); document.getElementById("p2score").textContent = fmtScore(sorted[1]); }
  if (sorted[2]) { document.getElementById("p3name").textContent = fmt(sorted[2]); document.getElementById("p3score").textContent = fmtScore(sorted[2]); }

  // Mini podium per lomba — tetap per regu (putra/putri terpisah)
  const lombas = [
    { key: "tongkat",   label: "Kreasi Tongkat",  icon: "fa-wand-magic-sparkles", color: "#1b4332", fn: r => r.tongkat.total },
    { key: "semaphore", label: "SESANDI (Semaphore-Morse)",  icon: "fa-flag",                color: "#1d3557", fn: r => r.semaphore.total },
    { key: "yel",       label: "Yel-Yel",          icon: "fa-music",               color: "#7b2d00", fn: r => r.yel.total },
  ];
  document.getElementById("miniPodiumGrid").innerHTML = lombas.map(l => {
    const putra = [...data].filter(r => (r.jenisRegu||"Putra") === "Putra").sort((a,b) => l.fn(b)-l.fn(a));
    const putri = [...data].filter(r => r.jenisRegu === "Putri").sort((a,b) => l.fn(b)-l.fn(a));
    const miniRows = (arr) => [0,1,2,3,4,5].map(i => arr[i] ? `
      <div class="mini-podium-row rank-row-${i < 3 ? i+1 : 'other'}">
        <span class="rank-badge ${i < 3 ? 'rank-'+(i+1) : 'rank-top6'}">${i+1}</span>
        <span class="mini-regu">${arr[i].nomorRegu}</span>
        <span class="mini-score">${l.fn(arr[i])}</span>
      </div>` : "").join("");
    return `
    <div class="mini-podium-card" style="border-top:4px solid ${l.color}">
      <div class="mini-podium-title" style="color:${l.color}"><i class="fa-solid ${l.icon}"></i> ${l.label}</div>
      <div style="font-size:.72rem;font-weight:700;color:#1565c0;margin:6px 0 2px">🔵 PUTRA</div>
      ${miniRows(putra)}
      <div style="font-size:.72rem;font-weight:700;color:#c62828;margin:8px 0 2px">🔴 PUTRI</div>
      ${miniRows(putri)}
    </div>`;
  }).join("");
}

function openAddForm() {
  resetForm();
  document.getElementById("formTitle").textContent = "Tambah Data Regu";
  const card = document.getElementById("formCard");
  card.style.display = "block";
  card.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeForm() {
  document.getElementById("formCard").style.display = "none";
  resetForm();
}
function checkLogin() {
  if (sessionStorage.getItem("adminAuth") === "true") {
    showAdminPanel();
    loadAdminData();
  }
}

async function doLogin() {
  const pw = document.getElementById("passwordInput").value;
  if (!pw) {
    showLoginMsg("error", "Password tidak boleh kosong.");
    return;
  }

  setLoginLoading(true);
  hideLoginMsg();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "login", password: pw })
    });
    const json = await res.json();
    if (json.success) {
      showLoginMsg("success");
      sessionStorage.setItem("adminAuth", "true");
      setTimeout(() => {
        showAdminPanel();
        loadAdminData();
      }, 900);
    } else {
      setLoginLoading(false);
      showLoginMsg("error", "Password salah! Silakan coba lagi.");
      document.getElementById("passwordInput").select();
    }
  } catch (e) {
    // Fallback offline
    if (pw === "admin123") {
      showLoginMsg("success");
      sessionStorage.setItem("adminAuth", "true");
      setTimeout(() => {
        showAdminPanel();
        loadAdminData();
      }, 900);
    } else {
      setLoginLoading(false);
      showLoginMsg("error", "Password salah! Silakan coba lagi.");
      document.getElementById("passwordInput").select();
    }
  }
}

function setLoginLoading(on) {
  const btn = document.getElementById("btnLogin");
  document.getElementById("btnLoginContent").style.display = on ? "none" : "inline-flex";
  document.getElementById("btnLoginLoading").style.display = on ? "inline-flex" : "none";
  btn.disabled = on;
  document.getElementById("passwordInput").disabled = on;
}

function showLoginMsg(type, msg) {
  if (type === "success") {
    document.getElementById("loginSuccess").style.display = "flex";
    document.getElementById("loginError").style.display = "none";
  } else {
    document.getElementById("loginError").style.display = "flex";
    document.getElementById("loginErrorMsg").textContent = msg || "Password salah!";
    document.getElementById("loginSuccess").style.display = "none";
    // shake animation
    const card = document.querySelector(".login-card");
    card.classList.remove("shake");
    void card.offsetWidth; // reflow
    card.classList.add("shake");
  }
}

function hideLoginMsg() {
  document.getElementById("loginError").style.display = "none";
  document.getElementById("loginSuccess").style.display = "none";
}

function doLogout() {
  sessionStorage.removeItem("adminAuth");
  document.getElementById("adminPanel").style.display = "none";
  document.getElementById("loginOverlay").style.display = "flex";
  document.getElementById("passwordInput").value = "";
}

function showAdminPanel() {
  document.getElementById("loginOverlay").style.display = "none";
  document.getElementById("adminPanel").style.display = "block";
}

// ============================================================
// ADMIN - Data Management
// ============================================================
let adminData = [];

async function loadAdminData() {
  const tbody = document.getElementById("adminTableBody");
  tbody.innerHTML = `<tr><td colspan="8" class="loading-row"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>`;
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getData" })
    });
    const json = await res.json();
    if (json.success) {
      adminData = json.data;
      renderAdminTable(adminData);
    } else {
      tbody.innerHTML = `<tr><td colspan="9" class="loading-row" style="color:#e53935"><i class="fa-solid fa-triangle-exclamation"></i> Gagal memuat: ${json.message}</td></tr>`;
    }
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="9" class="loading-row" style="color:#e53935"><i class="fa-solid fa-triangle-exclamation"></i> Tidak dapat terhubung ke server. Periksa API_URL.</td></tr>`;
  }
}

function renderAdminTable(data) {
  const tbody = document.getElementById("adminTableBody");
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="loading-row">Belum ada data.</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((r, i) => `
    <tr>
      <td>${r.no}</td>
      <td style="font-weight:700">${r.nomorRegu}</td>
      <td><span class="badge-jenis ${r.jenisRegu === 'Putri' ? 'putri' : 'putra'}">${r.jenisRegu === 'Putri' ? '🔴 Putri' : '🔵 Putra'}</span></td>
      <td style="font-size:.82rem">${r.namaSekolah || '-'}</td>
      <td>${r.tongkat.total} / 100</td>
      <td>${r.semaphore.total} / 100</td>
      <td>${r.yel.total} / 100</td>
      <td style="font-weight:700;color:var(--green-dark)">${r.totalAkhir}</td>
      <td>
        <button class="btn-edit" onclick="editRow(${i})"><i class="fa-solid fa-pen"></i> Edit</button>
        <button class="btn-delete" onclick="deleteRow(${i})"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join("");
}

function editRow(i) {
  const r = adminData[i];
  document.getElementById("formTitle").textContent = "Edit Data Regu";
  document.getElementById("editRowIndex").value = r.sheetRow; // nomor baris sheet aktual
  document.getElementById("fNo").value = r.no;
  document.getElementById("fRegu").value = r.nomorRegu;
  document.getElementById("fJenisRegu").value = r.jenisRegu || "Putra";
  document.getElementById("fNamaSekolah").value = r.namaSekolah || "";
  document.getElementById("fSimpul").value = r.tongkat.simpul;
  document.getElementById("fKreatifitasTongkat").value = r.tongkat.kreatifitas;
  document.getElementById("fKekuatan").value = r.tongkat.kekuatan;
  document.getElementById("fKerapian").value = r.tongkat.kerapian;
  document.getElementById("fKetepatanSemaphore").value = r.semaphore.ketepatan;
  document.getElementById("fKecepatanSemaphore").value = r.semaphore.kecepatan;
  document.getElementById("fKreatifitasYel").value = r.yel.kreatifitas;
  document.getElementById("fKekompakan").value = r.yel.kekompakan;
  const card = document.getElementById("formCard");
  card.style.display = "block";
  card.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function saveData() {
  const no = document.getElementById("fNo").value;
  const regu = document.getElementById("fRegu").value;
  if (!no || !regu) { showMsg("No dan Nomor Regu wajib diisi!", "error"); return; }

  // Loading state
  setSaveLoading(true);

  const payload = {
    action: "saveData",
    data: {
      no: parseInt(no),
      nomorRegu: regu,
      jenisRegu: document.getElementById("fJenisRegu").value,
      namaSekolah: document.getElementById("fNamaSekolah").value.trim(),
      simpul: parseFloat(document.getElementById("fSimpul").value) || 0,
      kreatifitasTongkat: parseFloat(document.getElementById("fKreatifitasTongkat").value) || 0,
      kekuatan: parseFloat(document.getElementById("fKekuatan").value) || 0,
      kerapian: parseFloat(document.getElementById("fKerapian").value) || 0,
      ketepatanSemaphore: parseFloat(document.getElementById("fKetepatanSemaphore").value) || 0,
      kecepatanSemaphore: parseFloat(document.getElementById("fKecepatanSemaphore").value) || 0,
      kreatifitasYel: parseFloat(document.getElementById("fKreatifitasYel").value) || 0,
      kekompakan: parseFloat(document.getElementById("fKekompakan").value) || 0,
      sheetRow: document.getElementById("editRowIndex").value || null
    }
  };

  try {
    const res = await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
    const json = await res.json();
    if (json.success) {
      showMsg("✅ Data berhasil disimpan!", "success");
      setTimeout(() => {
        setSaveLoading(false);
        closeForm();
        loadAdminData();
      }, 800);
    } else {
      setSaveLoading(false);
      showMsg(json.message || "Gagal menyimpan.", "error");
    }
  } catch (e) {
    setSaveLoading(false);
    showMsg("Gagal terhubung ke server.", "error");
  }
}

function setSaveLoading(on) {
  const btn = document.getElementById("btnSave");
  const btnCancel = document.getElementById("btnCancel");
  if (!btn) return;
  document.getElementById("btnSaveContent").style.display = on ? "none" : "inline-flex";
  document.getElementById("btnSaveLoading").style.display = on ? "inline-flex" : "none";
  btn.disabled = on;
  if (btnCancel) btnCancel.disabled = on;
}

async function deleteRow(i) {
  if (!confirm(`Hapus data ${adminData[i].nomorRegu}?`)) return;
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "deleteRow", sheetRow: adminData[i].sheetRow })
    });
    const json = await res.json();
    if (json.success) { loadAdminData(); }
    else { alert("Gagal menghapus: " + json.message); }
  } catch (e) {
    alert("Gagal menghapus data.");
  }
}

function resetForm() {
  document.getElementById("formTitle").textContent = "Tambah Data Regu";
  document.getElementById("editRowIndex").value = "";
  ["fNo","fRegu","fSimpul","fKreatifitasTongkat","fKekuatan","fKerapian",
   "fKetepatanSemaphore","fKecepatanSemaphore",
   "fKreatifitasYel","fKekompakan"].forEach(id => {
    document.getElementById(id).value = "";
  });
  document.getElementById("fJenisRegu").value = "Putra";
  document.getElementById("fNamaSekolah").value = "";
  const msg = document.getElementById("formMsg");
  if (msg) msg.style.display = "none";
}

function showMsg(msg, type) {
  const el = document.getElementById("formMsg");
  el.textContent = msg;
  el.className = "form-msg " + type;
  el.style.display = "block";
  setTimeout(() => el.style.display = "none", 3000);
}

// Clamp input value to max
function clamp(input, max) {
  if (parseFloat(input.value) > max) input.value = max;
  if (parseFloat(input.value) < 0) input.value = 0;
}
