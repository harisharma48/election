// ============================================================
//  Nepal Federal Parliament Election — Vote Tracker
//  script.js
// ============================================================

// ──────────────────────────────────────────────────────────────
//  🔥 FIREBASE CONFIGURATION
//  Replace these with your own Firebase project credentials.
//  Go to https://console.firebase.google.com
//    → Create project → Project Settings → Your apps → Web app
// ──────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY_HERE",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID_HERE",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID_HERE",
  appId:             "YOUR_APP_ID_HERE"
};

// ──────────────────────────────────────────────────────────────
//  NEPAL GEOGRAPHIC DATA
//  Structure: province → district → array of constituency numbers
// ──────────────────────────────────────────────────────────────
const nepalData = {
  "Province 1 (Koshi)": {
    "Taplejung":       [1, 2],
    "Panchthar":       [1, 2],
    "Ilam":            [1, 2, 3],
    "Jhapa":           [1, 2, 3, 4, 5],
    "Morang":          [1, 2, 3, 4, 5, 6],
    "Sunsari":         [1, 2, 3, 4, 5],
    "Dhankuta":        [1, 2],
    "Terhathum":       [1],
    "Sankhuwasabha":   [1, 2],
    "Bhojpur":         [1, 2],
    "Solukhumbu":      [1],
    "Okhaldhunga":     [1],
    "Khotang":         [1, 2],
    "Udayapur":        [1, 2, 3]
  },
  "Province 2 (Madhesh)": {
    "Saptari":         [1, 2, 3],
    "Siraha":          [1, 2, 3],
    "Dhanusha":        [1, 2, 3, 4, 5],
    "Mahottari":       [1, 2, 3, 4],
    "Sarlahi":         [1, 2, 3, 4, 5],
    "Rautahat":        [1, 2, 3, 4],
    "Bara":            [1, 2, 3, 4, 5],
    "Parsa":           [1, 2, 3, 4]
  },
  "Bagmati Province": {
    "Sindhuli":        [1, 2],
    "Ramechhap":       [1, 2],
    "Dolakha":         [1, 2],
    "Sindhupalchok":   [1, 2, 3],
    "Kavrepalanchok":  [1, 2, 3],
    "Lalitpur":        [1, 2, 3],
    "Bhaktapur":       [1, 2],
    "Kathmandu":       [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "Nuwakot":         [1, 2],
    "Rasuwa":          [1],
    "Dhading":         [1, 2],
    "Makwanpur":       [1, 2, 3],
    "Chitwan":         [1, 2, 3, 4]
  },
  "Gandaki Province": {
    "Gorkha":          [1, 2],
    "Manang":          [1],
    "Mustang":         [1],
    "Myagdi":          [1],
    "Kaski":           [1, 2, 3, 4],
    "Lamjung":         [1, 2],
    "Tanahun":         [1, 2],
    "Nawalpur":        [1, 2],
    "Syangja":         [1, 2],
    "Parbat":          [1],
    "Baglung":         [1, 2]
  },
  "Lumbini Province": {
    "Nawalparasi (E)": [1],
    "Rupandehi":       [1, 2, 3, 4, 5, 6],
    "Kapilvastu":      [1, 2, 3],
    "Arghakhanchi":    [1, 2],
    "Gulmi":           [1, 2],
    "Palpa":           [1, 2],
    "Dang":            [1, 2, 3, 4],
    "Rolpa":           [1, 2],
    "Pyuthan":         [1, 2],
    "Rukum (East)":    [1],
    "Banke":           [1, 2, 3],
    "Bardiya":         [1, 2, 3]
  },
  "Karnali Province": {
    "Dolpa":           [1],
    "Mugu":            [1],
    "Humla":           [1],
    "Jumla":           [1],
    "Kalikot":         [1],
    "Dailekh":         [1, 2],
    "Jajarkot":        [1],
    "Rukum (West)":    [1],
    "Salyan":          [1, 2],
    "Surkhet":         [1, 2]
  },
  "Sudurpashchim Province": {
    "Bajura":          [1],
    "Bajhang":         [1],
    "Achham":          [1, 2],
    "Doti":            [1],
    "Dadeldhura":      [1],
    "Baitadi":         [1, 2],
    "Darchula":        [1],
    "Kanchanpur":      [1, 2, 3],
    "Kailali":         [1, 2, 3, 4, 5]
  }
};

// ──────────────────────────────────────────────────────────────
//  FIREBASE INITIALISATION
// ──────────────────────────────────────────────────────────────
const IS_CONFIGURED =
  firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" &&
  firebaseConfig.projectId !== "YOUR_PROJECT_ID_HERE";

let db = null;
let unsubscribeSnapshot = null;   // active real-time listener

if (IS_CONFIGURED) {
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();

    // Enable offline persistence so the app works with spotty internet
    db.enablePersistence({ synchronizeTabs: true })
      .catch(err => {
        if (err.code === "failed-precondition") {
          console.warn("Persistence failed: multiple tabs open.");
        } else if (err.code === "unimplemented") {
          console.warn("Persistence not available in this browser.");
        }
      });

  } catch (e) {
    console.error("Firebase init error:", e);
    showToast("Firebase initialisation failed. Check console for details.", "error");
  }
} else {
  // Show the prominent warning banner
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("config-warning").style.display = "block";
  });
}

// ──────────────────────────────────────────────────────────────
//  ONLINE / OFFLINE INDICATOR
// ──────────────────────────────────────────────────────────────
function updateConnectionStatus() {
  const dot   = document.getElementById("connection-dot");
  const label = document.getElementById("connection-label");
  if (navigator.onLine) {
    dot.classList.remove("offline");
    label.textContent = "Online";
  } else {
    dot.classList.add("offline");
    label.textContent = "Offline — using cached data";
    showToast("You are offline. Showing cached data.", "info");
  }
}

window.addEventListener("online",  () => { updateConnectionStatus(); showToast("Back online!", "success"); });
window.addEventListener("offline", updateConnectionStatus);

// ──────────────────────────────────────────────────────────────
//  TOAST HELPER
// ──────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = ""; }, 3500);
}

// ──────────────────────────────────────────────────────────────
//  CASCADING DROPDOWNS
// ──────────────────────────────────────────────────────────────
function populateProvinces() {
  const sel = document.getElementById("province-select");
  Object.keys(nepalData).forEach(province => {
    const opt = document.createElement("option");
    opt.value = province;
    opt.textContent = province;
    sel.appendChild(opt);
  });
}

function onProvinceChange() {
  const province = document.getElementById("province-select").value;
  const distSel  = document.getElementById("district-select");
  const conSel   = document.getElementById("constituency-select");

  distSel.innerHTML = '<option value="">-- Select District --</option>';
  conSel.innerHTML  = '<option value="">-- Select Constituency --</option>';
  conSel.disabled   = true;
  document.getElementById("search-btn").disabled = true;

  if (!province) {
    distSel.disabled = true;
    return;
  }

  distSel.disabled = false;
  const districts = Object.keys(nepalData[province]);
  districts.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    distSel.appendChild(opt);
  });
}

function onDistrictChange() {
  const province = document.getElementById("province-select").value;
  const district = document.getElementById("district-select").value;
  const conSel   = document.getElementById("constituency-select");

  conSel.innerHTML = '<option value="">-- Select Constituency --</option>';
  document.getElementById("search-btn").disabled = true;

  if (!district) {
    conSel.disabled = true;
    return;
  }

  conSel.disabled = false;
  const nums = nepalData[province][district];
  nums.forEach(n => {
    const opt = document.createElement("option");
    opt.value = n;
    opt.textContent = `Constituency ${n}`;
    conSel.appendChild(opt);
  });
}

function onConstituencyChange() {
  const val = document.getElementById("constituency-select").value;
  document.getElementById("search-btn").disabled = !val;
}

// ──────────────────────────────────────────────────────────────
//  FIRESTORE HELPERS
// ──────────────────────────────────────────────────────────────

/** Returns the Firestore document ID for a constituency */
function constituencyDocId(province, district, number) {
  // Sanitize: replace spaces and special chars with underscores
  const sanitize = s => s.replace(/[\s()\/\\#.[\]*?]/g, "_");
  return `${sanitize(province)}_${sanitize(district)}_${number}`;
}

/** Returns a CollectionReference to the candidates subcollection */
function candidatesRef(docId) {
  return db.collection("constituencies").doc(docId).collection("candidates");
}

// ──────────────────────────────────────────────────────────────
//  SEARCH — load candidates with real-time listener
// ──────────────────────────────────────────────────────────────
let currentDocId = null;

function searchConstituency() {
  if (!IS_CONFIGURED) {
    showToast("Firebase is not configured. Please update firebaseConfig in script.js.", "error");
    return;
  }

  const province     = document.getElementById("province-select").value;
  const district     = document.getElementById("district-select").value;
  const constituency = document.getElementById("constituency-select").value;

  if (!province || !district || !constituency) {
    showToast("Please select Province, District, and Constituency.", "info");
    return;
  }

  const docId = constituencyDocId(province, district, constituency);
  currentDocId = docId;

  // Show results section and add-candidate section
  document.getElementById("results-section").style.display = "block";
  document.getElementById("add-section").style.display = "block";

  // Update title
  document.getElementById("results-title").textContent =
    `${district} — Constituency ${constituency} (${province})`;

  // Show loading row
  setLoadingRow(true);

  // Cancel any previous listener
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }
  if (unsubscribePredictions) {
    unsubscribePredictions();
    unsubscribePredictions = null;
  }

  // Attach real-time listener
  unsubscribeSnapshot = candidatesRef(docId)
    .orderBy("votes", "desc")
    .onSnapshot(
      snapshot => {
        setLoadingRow(false);
        renderCandidates(snapshot);
      },
      err => {
        setLoadingRow(false);
        console.error("Snapshot error:", err);
        showToast("Failed to load candidates: " + err.message, "error");
        renderEmpty();
      }
    );
}

// ──────────────────────────────────────────────────────────────
//  RENDER CANDIDATES TABLE
// ──────────────────────────────────────────────────────────────
function renderCandidates(snapshot) {
  const tbody = document.getElementById("candidates-tbody");
  tbody.innerHTML = "";

  if (snapshot.empty) {
    renderEmpty();
    updateSummaryBar(0, 0, "—");
    return;
  }

  const candidates = [];
  snapshot.forEach(doc => candidates.push({ id: doc.id, ...doc.data() }));

  // Sort by votes descending (already ordered by Firestore, but keep safe)
  candidates.sort((a, b) => (b.votes || 0) - (a.votes || 0));

  const totalVotes = candidates.reduce((s, c) => s + (c.votes || 0), 0);

  candidates.forEach((c, i) => {
    const rank = i + 1;
    const voteShare = totalVotes > 0 ? ((c.votes || 0) / totalVotes * 100).toFixed(1) : 0;
    const rankClass = rank === 1 ? "rank-1" : rank === 2 ? "rank-2" : rank === 3 ? "rank-3" : "rank-other";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="rank-badge ${rankClass}">${rank}</span></td>
      <td><strong>${escapeHtml(c.name || "—")}</strong></td>
      <td>${escapeHtml(c.party || "—")}</td>
      <td>
        <span class="vote-count">${(c.votes || 0).toLocaleString()}</span>
      </td>
      <td>
        <div>${voteShare}%</div>
        <div class="progress-bar-wrap">
          <div class="progress-bar" style="width:${voteShare}%"></div>
        </div>
      </td>
      <td>
        <button class="btn btn-warning btn-sm update-btn"
                data-id="${escapeHtml(c.id)}"
                data-votes="${c.votes || 0}">
          ✏️ Update
        </button>
      </td>
    `;
    // Store the candidate name on the button element to avoid inline JS escaping issues
    tr.querySelector(".update-btn").dataset.name = c.name || "";
    tbody.appendChild(tr);
  });

  currentCandidatesForPrediction = candidates;
  document.getElementById("predict-btn-wrap").style.display = "block";

  const winnerName = candidates.length > 0 ? candidates[0].name : "—";
  updateSummaryBar(candidates.length, totalVotes, winnerName);

  if (currentDocId) {
    listenToPredictions(currentDocId, candidates);
  }
}

function renderEmpty() {
  document.getElementById("candidates-tbody").innerHTML =
    `<tr class="no-data"><td colspan="6">No candidates found for this constituency. Add one below.</td></tr>`;
}
function setLoadingRow(show) {
  const tbody = document.getElementById("candidates-tbody");
  if (show) {
    tbody.innerHTML = `
      <tr id="loading-row">
        <td colspan="6">
          <div class="spinner"></div>
          <span style="margin-left:10px;color:#666">Loading candidates…</span>
        </td>
      </tr>`;
  }
}

function updateSummaryBar(candidateCount, totalVotes, winnerName) {
  const bar = document.getElementById("summary-bar");
  bar.innerHTML = `
    <div class="summary-item">Candidates: <span>${candidateCount}</span></div>
    <div class="summary-item">🏆 Winning: <span>${escapeHtml(winnerName || "—")}</span></div>
  `;
}

// ──────────────────────────────────────────────────────────────
//  VOTE PREDICTION SYSTEM
// ──────────────────────────────────────────────────────────────
let currentCandidatesForPrediction = [];
let unsubscribePredictions = null;

/** Returns a CollectionReference to the predictions subcollection */
function predictionsRef(docId) {
  return db.collection("constituencies").doc(docId).collection("predictions");
}

function openPredictionModal() {
  if (!IS_CONFIGURED) {
    showToast("Firebase is not configured.", "error");
    return;
  }
  if (currentCandidatesForPrediction.length === 0) {
    showToast("No candidates to predict for.", "info");
    return;
  }

  const form = document.getElementById("prediction-candidates-form");
  form.innerHTML = "";
  currentCandidatesForPrediction.forEach(c => {
    const row = document.createElement("div");
    row.className = "prediction-candidate-row";
    row.innerHTML = `
      <div class="prediction-candidate-label">
        <strong>${escapeHtml(c.name || "—")}</strong>
        <small>${escapeHtml(c.party || "—")}</small>
      </div>
      <input type="number" min="0" data-cid="${escapeHtml(c.id)}" placeholder="0" />
    `;
    form.appendChild(row);
  });

  document.getElementById("pred-name").value = "";
  document.getElementById("pred-contact").value = "";
  document.getElementById("prediction-modal-overlay").classList.add("open");
}

function closePredictionModal() {
  document.getElementById("prediction-modal-overlay").classList.remove("open");
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById("prediction-modal-overlay")) {
    closePredictionModal();
  }
}

async function submitPrediction() {
  const DEADLINE = new Date("2026-03-05T23:59:59");
  if (new Date() > DEADLINE) {
    showToast("Prediction period has ended (deadline was March 5, 2026)", "error");
    return;
  }

  const name    = document.getElementById("pred-name").value.trim();
  const contact = document.getElementById("pred-contact").value.trim();

  if (!name || !contact) {
    showToast("Please enter your name and contact number.", "info");
    return;
  }

  const inputs = document.querySelectorAll("#prediction-candidates-form input[data-cid]");
  const predictions = {};
  let allFilled = true;

  inputs.forEach(input => {
    const val = input.value.trim();
    if (val === "" || isNaN(parseInt(val, 10)) || parseInt(val, 10) < 0) {
      allFilled = false;
    } else {
      predictions[input.dataset.cid] = parseInt(val, 10);
    }
  });

  if (!allFilled) {
    showToast("Please enter predicted votes for all candidates.", "info");
    return;
  }

  if (!currentDocId) {
    showToast("No constituency selected.", "error");
    return;
  }

  try {
    await predictionsRef(currentDocId).add({
      name,
      contact,
      predictions,
      submittedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    closePredictionModal();
    showToast("Your prediction has been submitted!", "success");
  } catch (err) {
    console.error("Prediction error:", err);
    showToast("Failed to submit prediction: " + err.message, "error");
  }
}

function updatePredictionWinners(predictionDocs, candidates) {
  const section = document.getElementById("prediction-winners-section");
  const list    = document.getElementById("prediction-winners-list");
  section.style.display = "block";

  if (!predictionDocs || predictionDocs.length === 0 || candidates.length === 0) {
    list.innerHTML = '<p class="prediction-no-match">No exact prediction matches yet.</p>';
    return;
  }

  const actualVotes = {};
  candidates.forEach(c => { actualVotes[c.id] = c.votes || 0; });

  const winners = predictionDocs.filter(pred => {
    const predVotes = pred.predictions || {};
    return candidates.every(c => {
      return Object.prototype.hasOwnProperty.call(predVotes, c.id) &&
             predVotes[c.id] === actualVotes[c.id];
    });
  });

  if (winners.length === 0) {
    list.innerHTML = '<p class="prediction-no-match">No exact prediction matches yet.</p>';
  } else {
    list.innerHTML = winners.map(w =>
      `<div class="prediction-winner-item">🎉 Exact match! <strong>${escapeHtml(w.name)}</strong> (${escapeHtml(w.contact)}) predicted all votes correctly!</div>`
    ).join("");
  }
}

function listenToPredictions(docId, candidates) {
  if (unsubscribePredictions) {
    unsubscribePredictions();
    unsubscribePredictions = null;
  }
  unsubscribePredictions = predictionsRef(docId).onSnapshot(
    snapshot => {
      const docs = [];
      snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
      // Use the global so we always compare against the latest vote counts,
      // not a stale snapshot from when this listener was established.
      updatePredictionWinners(docs, currentCandidatesForPrediction);
    },
    err => { console.error("Predictions snapshot error:", err); }
  );
}

// ──────────────────────────────────────────────────────────────
//  UPDATE VOTES
// ──────────────────────────────────────────────────────────────
async function promptUpdateVotes(candidateId, name, currentVotes) {
  if (!IS_CONFIGURED) {
    showToast("Firebase is not configured.", "error");
    return;
  }

  const input = prompt(`Update votes for "${name}"\nCurrent votes: ${currentVotes}\n\nEnter new vote count:`, currentVotes);
  if (input === null) return;     // user cancelled

  const newVotes = parseInt(input, 10);
  if (isNaN(newVotes) || newVotes < 0) {
    showToast("Invalid vote count. Please enter a non-negative number.", "error");
    return;
  }

  try {
    await candidatesRef(currentDocId).doc(candidateId).update({ votes: newVotes });
    showToast(`Votes for "${name}" updated to ${newVotes.toLocaleString()}.`, "success");
  } catch (err) {
    console.error("Update error:", err);
    showToast("Failed to update votes: " + err.message, "error");
  }
}

// ──────────────────────────────────────────────────────────────
//  ADD CANDIDATE
// ──────────────────────────────────────────────────────────────
async function addCandidate() {
  if (!IS_CONFIGURED) {
    showToast("Firebase is not configured.", "error");
    return;
  }

  if (!currentDocId) {
    showToast("Please search for a constituency first.", "info");
    return;
  }

  const name  = document.getElementById("new-name").value.trim();
  const party = document.getElementById("new-party").value.trim();

  if (!name || !party) {
    showToast("Please enter both candidate name and party.", "info");
    return;
  }

  try {
    await candidatesRef(currentDocId).add({
      name,
      party,
      votes: 0,
      addedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById("new-name").value  = "";
    document.getElementById("new-party").value = "";
    showToast(`Candidate "${name}" added successfully.`, "success");
  } catch (err) {
    console.error("Add candidate error:", err);
    showToast("Failed to add candidate: " + err.message, "error");
  }
}

// ──────────────────────────────────────────────────────────────
//  UTILITY: HTML escape
// ──────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ──────────────────────────────────────────────────────────────
//  SAMPLE DATA INITIALISATION
//  Call this from the browser console: initializeSampleData()
//  This will pre-populate Firestore with sample candidates for
//  Kathmandu-1, Kathmandu-2, and Lalitpur-1.
// ──────────────────────────────────────────────────────────────
window.initializeSampleData = async function () {
  if (!IS_CONFIGURED) {
    console.error("❌ Firebase is not configured. Update firebaseConfig in script.js first.");
    return;
  }

  const sampleConstituencies = [
    {
      province: "Bagmati Province",
      district:  "Kathmandu",
      number:    1,
      candidates: [
        { name: "Ram Bahadur Thapa",  party: "CPN-UML",       votes: 25480 },
        { name: "Sita Devi Rana",     party: "Nepali Congress", votes: 23150 },
        { name: "Hari Prasad Sharma", party: "CPN (Maoist)",   votes: 8900  },
        { name: "Gita Kumari KC",     party: "Rastriya Swatantra Party", votes: 15320 }
      ]
    },
    {
      province: "Bagmati Province",
      district:  "Kathmandu",
      number:    2,
      candidates: [
        { name: "Suresh Ale Magar",   party: "CPN-UML",        votes: 19870 },
        { name: "Nirmala Bhatta",     party: "Nepali Congress", votes: 22100 },
        { name: "Bishnu Raj Pokhrel", party: "CPN (Maoist)",    votes: 7600  }
      ]
    },
    {
      province: "Bagmati Province",
      district:  "Lalitpur",
      number:    1,
      candidates: [
        { name: "Krishna Bahadur Mahara", party: "CPN (Maoist)", votes: 18000 },
        { name: "Pramila Rana",           party: "Nepali Congress", votes: 16500 },
        { name: "Yogesh Bhattarai",       party: "CPN-UML",      votes: 14800 }
      ]
    }
  ];

  console.log("⏳ Initialising sample data…");

  for (const c of sampleConstituencies) {
    const docId = constituencyDocId(c.province, c.district, c.number);
    const ref   = candidatesRef(docId);

    // Check if data already exists
    const existing = await ref.limit(1).get();
    if (!existing.empty) {
      console.log(`⚠️  ${c.district}-${c.number} already has data. Skipping.`);
      continue;
    }

    const batch = db.batch();
    c.candidates.forEach(cand => {
      const docRef = ref.doc();
      batch.set(docRef, {
        name:    cand.name,
        party:   cand.party,
        votes:   cand.votes,
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();
    console.log(`✅  ${c.district}-${c.number} — ${c.candidates.length} candidates added.`);
  }

  console.log("🎉 Sample data initialisation complete!");
  console.log("   → Select 'Bagmati Province' → 'Kathmandu' → Constituency 1, 2, or");
  console.log("     'Bagmati Province' → 'Lalitpur' → Constituency 1 to see the data.");
};

// ──────────────────────────────────────────────────────────────
//  ROTATING AD BANNER
// ──────────────────────────────────────────────────────────────
const AD_ROTATION_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

let adList          = [];
let currentAdIndex  = 0;
let adRotationTimer = null;
let adBannerClosed  = false;

function loadAds() {
  if (!IS_CONFIGURED) return;

  db.collection("ads").where("active", "==", true).orderBy("createdAt")
    .onSnapshot(
      snapshot => {
        adList = [];
        snapshot.forEach(doc => adList.push({ id: doc.id, ...doc.data() }));

        if (adList.length > 0 && !adBannerClosed) {
          currentAdIndex = 0;
          displayAd(currentAdIndex);

          if (adRotationTimer) clearInterval(adRotationTimer);
          adRotationTimer = setInterval(() => {
            if (!adBannerClosed && adList.length > 1) {
              currentAdIndex = (currentAdIndex + 1) % adList.length;
              rotateAd(currentAdIndex);
            }
          }, AD_ROTATION_INTERVAL_MS);
        } else if (adList.length === 0) {
          document.getElementById("ad-banner").style.display = "none";
        }
      },
      err => { console.error("Ads snapshot error:", err); }
    );
}

function displayAd(index) {
  const ad = adList[index];
  if (!ad) return;
  document.getElementById("ad-link").href  = ad.linkUrl  || "#";
  document.getElementById("ad-image").src  = ad.imageUrl || "";
  document.getElementById("ad-image").alt  = ad.altText  || "Advertisement";
  document.getElementById("ad-banner").style.display = "block";
}

function rotateAd(index) {
  const img = document.getElementById("ad-image");
  img.classList.add("fade-out");
  setTimeout(() => {
    displayAd(index);
    img.classList.remove("fade-out");
  }, 500);
}

function closeAdBanner() {
  adBannerClosed = true;
  document.getElementById("ad-banner").style.display = "none";
  if (adRotationTimer) {
    clearInterval(adRotationTimer);
    adRotationTimer = null;
  }
}

/** Console helper: addAd("https://example.com/banner.jpg", "https://example.com", "Visit our store!") */
window.addAd = async function(imageUrl, linkUrl, altText) {
  if (!IS_CONFIGURED) { console.error("❌ Firebase is not configured."); return; }
  try {
    const docRef = await db.collection("ads").add({
      imageUrl,
      linkUrl,
      altText:   altText || "",
      active:    true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("✅ Ad added with ID:", docRef.id);
  } catch (err) { console.error("Failed to add ad:", err); }
};

/** Console helper: removeAd("adDocId") */
window.removeAd = async function(adId) {
  if (!IS_CONFIGURED) { console.error("❌ Firebase is not configured."); return; }
  try {
    await db.collection("ads").doc(adId).delete();
    console.log("✅ Ad removed:", adId);
  } catch (err) { console.error("Failed to remove ad:", err); }
};

// ──────────────────────────────────────────────────────────────
//  ADMIN SECTION (commented out by default)
//  Uncomment the block below to enable admin-only write access.
//  Requires Firebase Authentication to be set up.
// ──────────────────────────────────────────────────────────────
/*
let currentUser = null;

function adminLogin() {
  const email    = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(userCred => {
      currentUser = userCred.user;
      document.getElementById("admin-panel").style.display = "none";
      document.getElementById("admin-status").textContent  = "Admin: " + email;
      showToast("Logged in as admin.", "success");
      enableWriteControls(true);
    })
    .catch(err => showToast("Login failed: " + err.message, "error"));
}

function adminLogout() {
  firebase.auth().signOut().then(() => {
    currentUser = null;
    enableWriteControls(false);
    showToast("Logged out.", "info");
  });
}

function enableWriteControls(enabled) {
  document.querySelectorAll(".btn-warning, #add-section .btn-success")
    .forEach(btn => { btn.disabled = !enabled; });
}

// On page load, disable write controls for non-admins
firebase.auth().onAuthStateChanged(user => {
  currentUser = user;
  enableWriteControls(!!user);
});
*/

// ──────────────────────────────────────────────────────────────
//  INITIALISE ON PAGE LOAD
// ──────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  populateProvinces();
  updateConnectionStatus();
  loadAds();

  document.getElementById("province-select")
    .addEventListener("change", onProvinceChange);
  document.getElementById("district-select")
    .addEventListener("change", onDistrictChange);
  document.getElementById("constituency-select")
    .addEventListener("change", onConstituencyChange);

  // Event delegation for Update buttons — avoids inline JS with user data
  document.getElementById("candidates-tbody").addEventListener("click", e => {
    const btn = e.target.closest(".update-btn");
    if (!btn) return;
    promptUpdateVotes(btn.dataset.id, btn.dataset.name, parseInt(btn.dataset.votes, 10) || 0);
  });
});
