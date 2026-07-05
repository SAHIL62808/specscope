/* =========================================================================
   CONFIG — read this before you deploy
   =========================================================================
   1. Get a free API key at https://aistudio.google.com/apikey
   2. Paste it below as GEMINI_API_KEY.
   3. IMPORTANT — this is a static site with no backend, so this key will
      be visible to anyone who views the page source. To stop strangers
      from using YOUR key:
         - In Google AI Studio / Google Cloud Console, open the key's
           settings and add an "HTTP referrer" restriction limited to
           your GitHub Pages domain (e.g. https://yourusername.github.io/*)
         - The free tier has a daily request limit — the referrer lock
           keeps that limit for your visitors, not randoms who found the key.
   4. If you'd rather not expose any key at all, an alternative is to ask
      each visitor to paste their own free Gemini key (stored only in
      their browser, never sent anywhere but Google). Ask if you want that
      version instead — it's a small change to this file.
   ========================================================================= */
const GEMINI_API_KEY = "AQ.Ab8RN6KXfaUSujLcF9tBcUZ_ewIPmobFMP2No65EjGRo7H3sLw";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/* ---------------------------------------------------------------------- */

const state = {
  deviceType: null,
  currency: "₹",
  useCase: null,
};

function setupChipGroup(groupSelector, stateKey, onChange) {
  const group = document.querySelector(`[data-group="${groupSelector}"]`);
  if (!group) return;
  const chips = group.querySelectorAll(".chip, .curr-chip");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      state[stateKey] = chip.dataset.value;
      if (onChange) onChange(chip.dataset.value);
    });
  });
}

setupChipGroup("deviceType", "deviceType");
setupChipGroup("useCase", "useCase");
setupChipGroup("currency", "currency", (value) => {
  document.getElementById("budget-symbol").textContent = value;
});

// default currency selected
document.querySelector('.curr-chip[data-value="₹"]').classList.add("active");

// sync range <-> number budget inputs
const budgetRange = document.getElementById("budget-range");
const budgetNumber = document.getElementById("budget-number");
budgetNumber.value = budgetRange.value;

budgetRange.addEventListener("input", () => {
  budgetNumber.value = budgetRange.value;
});
budgetNumber.addEventListener("input", () => {
  const val = Number(budgetNumber.value);
  if (!Number.isNaN(val)) {
    budgetRange.value = Math.min(val, Number(budgetRange.max));
  }
});

/* ---------------------------------------------------------------------- */

const form = document.getElementById("scope-form");
const runBtn = document.getElementById("run-btn");
const formError = document.getElementById("form-error");
const readoutBody = document.getElementById("readout-body");
const readoutId = document.getElementById("readout-id");

let scanCount = 0;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.textContent = "";

  if (!state.deviceType) {
    formError.textContent = "Pick a device type before running the diagnostic.";
    return;
  }
  if (!state.useCase) {
    formError.textContent = "Pick what it's mainly for before running the diagnostic.";
    return;
  }

  const budget = budgetNumber.value || budgetRange.value;
  const notes = document.getElementById("extra-notes").value.trim();

  if (GEMINI_API_KEY === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
    formError.textContent = "Site owner: add your free Gemini API key in script.js before this goes live.";
    return;
  }

  runBtn.disabled = true;
  runBtn.querySelector(".run-btn-label").textContent = "SCANNING…";
  scanCount += 1;
  readoutId.textContent = `SCAN-${String(scanCount).padStart(2, "0")}`;
  readoutBody.innerHTML = `<div class="scan-loading">Running comparison against your parameters</div>`;

  try {
    const result = await runDiagnostic({ ...state, budget, notes });
    renderReadout(result);
  } catch (err) {
    console.error(err);
    readoutBody.innerHTML = `<p class="readout-note" style="border-color:var(--danger);color:var(--danger)">
      Diagnostic failed: ${escapeHtml(err.message || "unknown error")}.
      If you're the site owner, check that your API key is valid, unrestricted for this domain, and under its daily quota.
    </p>`;
  } finally {
    runBtn.disabled = false;
    runBtn.querySelector(".run-btn-label").textContent = "RUN DIAGNOSTIC";
  }
});

async function runDiagnostic({ deviceType, currency, useCase, budget, notes }) {
  const prompt = buildPrompt({ deviceType, currency, useCase, budget, notes });

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1200 },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(`API returned ${response.status}. ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  const cleaned = text.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Couldn't parse the diagnostic response. Try running it again.");
  }
  return parsed;
}

function buildPrompt({ deviceType, currency, useCase, budget, notes }) {
  return `You are a blunt, expert electronics consultant helping a real shopper choose a device.

Shopper's parameters:
- Device type: ${deviceType}
- Budget: approximately ${currency}${budget} (this is a real constraint, do not suggest things far above it)
- Primary use case: ${useCase}
- Additional notes: ${notes || "none given"}

Give specific, current, real product recommendations suited to this budget and region implied by the currency. Avoid vague advice like "look for a good processor" — name actual chipsets, RAM amounts, or models where relevant.

Respond with ONLY valid JSON (no markdown fences, no commentary before or after), matching exactly this shape:

{
  "top_picks": [
    {"name": "specific model or close model family", "price_range": "approx price range in the given currency", "why": "1-2 sentences on why this fits their budget and use case"}
  ],
  "specs_to_check": ["short spec-check item", "..."],
  "avoid": ["a common trap or overrated spec for this budget/use case", "..."],
  "budget_note": "one practical sentence about stretching, saving, or timing this budget"
}

Include 2-3 top_picks, 3-5 specs_to_check, and 2-3 avoid items.`;
}

function renderReadout(result) {
  const { top_picks = [], specs_to_check = [], avoid = [], budget_note } = result;

  let html = "";

  if (top_picks.length) {
    html += `<div class="readout-section">
      <p class="readout-section-title">TOP MATCHES</p>
      ${top_picks.map((p) => `
        <div class="pick-card">
          <p class="pick-name">${escapeHtml(p.name || "")}</p>
          <p class="pick-price">${escapeHtml(p.price_range || "")}</p>
          <p class="pick-why">${escapeHtml(p.why || "")}</p>
        </div>
      `).join("")}
    </div>`;
  }

  if (specs_to_check.length) {
    html += `<div class="readout-section">
      <p class="readout-section-title">SPECS WORTH CHECKING</p>
      <ul class="readout-list">
        ${specs_to_check.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
      </ul>
    </div>`;
  }

  if (avoid.length) {
    html += `<div class="readout-section">
      <p class="readout-section-title">SKIP THIS NOISE</p>
      <ul class="readout-list avoid">
        ${avoid.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
      </ul>
    </div>`;
  }

  if (budget_note) {
    html += `<div class="readout-section">
      <p class="readout-section-title">BUDGET NOTE</p>
      <p class="readout-note">${escapeHtml(budget_note)}</p>
    </div>`;
  }

  readoutBody.innerHTML = html || `<p class="readout-placeholder">No result came back — try running the diagnostic again.</p>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
