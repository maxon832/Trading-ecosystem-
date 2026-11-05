
// ======================================
// TRADESPHERE MARKET ANALYSIS
// ======================================

// Mobile navigation
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

// Market filters
const filterButtons = document.querySelectorAll(".market-filter");
const marketCards = document.querySelectorAll(".market-card");

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(item => item.classList.remove("active"));
    button.classList.add("active");

    const selected = button.dataset.filter;

    marketCards.forEach(card => {
      card.style.display =
        selected === "all" || card.dataset.market === selected
          ? "block"
          : "none";
    });
  });
});

// Instrument frameworks
const frameworks = {
  "EUR/USD": {
    description: "A framework for studying the euro against the US dollar.",
    questions: [
      "What is the Daily and H4 market direction?",
      "Are major economic releases approaching?",
      "Where are the significant swing highs and lows?",
      "Has price confirmed a break of structure?",
      "Where is the trade idea invalidated?"
    ]
  },

  "GBP/USD": {
    description: "A framework for analysing sterling against the US dollar.",
    questions: [
      "What is the higher-timeframe trend?",
      "What are the relevant Bank of England and Federal Reserve events?",
      "Has price taken important liquidity?",
      "Is there a clear lower-timeframe confirmation?",
      "Does the potential reward justify the risk?"
    ]
  },

  "USD/JPY": {
    description: "A framework for studying the US dollar against the Japanese yen.",
    questions: [
      "What is the higher-timeframe structure?",
      "Are there relevant central bank announcements?",
      "Where are the important support and resistance levels?",
      "Has price confirmed a directional move?",
      "What would invalidate the setup?"
    ]
  },

  "XAU/USD": {
    description: "A gold analysis framework combining price action and market context.",
    questions: [
      "What is the Daily and H4 directional bias?",
      "Where are the major liquidity pools?",
      "Are there unmitigated order blocks or fair value gaps?",
      "Has price swept liquidity and displaced?",
      "Where is the invalidation level and realistic target?"
    ]
  },

  "XAG/USD": {
    description: "A framework for examining silver price behaviour.",
    questions: [
      "What is the higher-timeframe trend?",
      "Are gold and silver showing similar behaviour?",
      "Where are the key swing levels?",
      "Is volatility changing?",
      "What confirms or invalidates the trade idea?"
    ]
  },

  "Volatility Indices": {
    description: "A technical framework for Deriv synthetic volatility indices.",
    questions: [
      "Which exact volatility index is being analysed?",
      "What is the Daily and H4 structure?",
      "Where are the recent swing highs and lows?",
      "Is there a confirmed BOS or CHoCH?",
      "Does the entry timeframe agree with the higher timeframe?"
    ]
  },

  "Boom & Crash": {
    description: "A framework for studying Boom and Crash synthetic indices.",
    questions: [
      "Which exact Boom or Crash index is being studied?",
      "What is the current structural direction?",
      "How is price behaving around recent highs and lows?",
      "Is the setup based on evidence rather than predicting a spike?",
      "What is the maximum acceptable loss?"
    ]
  },

  "Step Indices": {
    description: "A framework for examining Step Index price movement.",
    questions: [
      "What is the higher-timeframe structure?",
      "Where are the key support and resistance levels?",
      "Is price trending or consolidating?",
      "What lower-timeframe confirmation is present?",
      "Where should the trade idea be invalidated?"
    ]
  }
};

// Framework modal
const frameworkModal = document.getElementById("frameworkModal");
const frameworkTitle = document.getElementById("frameworkTitle");
const frameworkDescription =
  document.getElementById("frameworkDescription");
const frameworkList = document.getElementById("frameworkList");
const closeModal = document.getElementById("closeModal");

document.querySelectorAll(".framework-button").forEach(button => {
  button.addEventListener("click", () => {
    const asset = button.dataset.asset;
    const framework = frameworks[asset];

    if (!framework) return;

    frameworkTitle.textContent = asset;
    frameworkDescription.textContent = framework.description;
    frameworkList.replaceChildren();

    framework.questions.forEach(question => {
      const item = document.createElement("li");
      item.textContent = question;
      frameworkList.appendChild(item);
    });

    frameworkModal.classList.add("show");
    frameworkModal.setAttribute("aria-hidden", "false");
  });
});

function closeFrameworkModal() {
  frameworkModal.classList.remove("show");
  frameworkModal.setAttribute("aria-hidden", "true");
}

closeModal.addEventListener("click", closeFrameworkModal);

frameworkModal.addEventListener("click", event => {
  if (event.target === frameworkModal) {
    closeFrameworkModal();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeFrameworkModal();
  }
});

// ======================================
// ANALYSIS SUMMARY GENERATOR
// ======================================

const generateButton = document.getElementById("generateScenario");
const scenarioOutput = document.getElementById("scenarioOutput");
const saveButton = document.getElementById("saveScenario");

const STORAGE_KEY = "tradesphere_saved_analyses_v1";

let currentAnalysis = null;

function getSavedAnalyses() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not read saved analyses:", error);
    return [];
  }
}

function storeAnalyses(analyses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
    return true;
  } catch (error) {
    console.error("Could not save analyses:", error);
    alert("Unable to save. Your browser storage may be full or unavailable.");
    return false;
  }
}

generateButton.addEventListener("click", () => {
  const asset = document.getElementById("scenarioAsset").value.trim();
  const timeframe =
    document.getElementById("scenarioTimeframe").value;
  const bias = document.getElementById("scenarioBias").value;
  const setup = document.getElementById("scenarioSetup").value;
  const notes = document.getElementById("scenarioNotes").value.trim();

  if (!asset || !timeframe || !bias || !setup || !notes) {
    scenarioOutput.style.display = "block";
    scenarioOutput.textContent =
      "Complete all fields before creating your analysis summary.";

    saveButton.disabled = true;
    currentAnalysis = null;
    return;
  }

  currentAnalysis = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
    asset,
    timeframe,
    bias,
    setup,
    notes,
    createdAt: new Date().toISOString()
  };

  scenarioOutput.replaceChildren();

  const heading = document.createElement("h3");
  heading.textContent = "Your analysis summary";
  scenarioOutput.appendChild(heading);

  const details = [
    `Instrument: ${asset}`,
    `Timeframe: ${timeframe}`,
    `Market bias: ${bias}`,
    `Potential setup: ${setup}`,
    `Your analysis: ${notes}`
  ];

  details.forEach(detail => {
    const paragraph = document.createElement("p");
    paragraph.textContent = detail;
    scenarioOutput.appendChild(paragraph);
  });

  const disclaimer = document.createElement("p");
  disclaimer.textContent =
    "This is your manually entered analysis, not a verified signal or live market assessment.";
  scenarioOutput.appendChild(disclaimer);

  scenarioOutput.style.display = "block";
  saveButton.disabled = false;
});

// ======================================
// SAVE AND DISPLAY ANALYSES
// ======================================

const savedAnalysesContainer =
  document.getElementById("savedAnalyses");

const savedCount = document.getElementById("savedCount");

function renderSavedAnalyses() {
  const analyses = getSavedAnalyses();

  savedCount.textContent =
    `${analyses.length} saved`;

  savedAnalysesContainer.replaceChildren();

  if (analyses.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-saved";
    empty.textContent = "You haven't saved any analyses yet.";
    savedAnalysesContainer.appendChild(empty);
    return;
  }

  analyses.slice().reverse().forEach(analysis => {
    const card = document.createElement("article");
    card.className = "saved-analysis-card";

    const heading = document.createElement("h4");
    heading.textContent = analysis.asset;

    const date = document.createElement("p");
    date.className = "saved-date";
    date.textContent =
      "Saved: " + new Date(analysis.createdAt).toLocaleString();

    const details = [
      `Timeframe: ${analysis.timeframe}`,
      `Bias: ${analysis.bias}`,
      `Setup: ${analysis.setup}`,
      `Analysis: ${analysis.notes}`
    ];

    card.appendChild(heading);
    card.appendChild(date);

    details.forEach(detail => {
      const paragraph = document.createElement("p");
      paragraph.textContent = detail;
      card.appendChild(paragraph);
    });

    const actions = document.createElement("div");
    actions.className = "saved-actions";

    const loadButton = document.createElement("button");
    loadButton.textContent = "Load analysis";
    loadButton.dataset.action = "load";
    loadButton.dataset.id = analysis.id;

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-saved";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = analysis.id;

    actions.appendChild(loadButton);
    actions.appendChild(deleteButton);
    card.appendChild(actions);

    savedAnalysesContainer.appendChild(card);
  });
}

// Save current analysis
saveButton.addEventListener("click", () => {
  if (!currentAnalysis) return;

  const analyses = getSavedAnalyses();

  analyses.push(currentAnalysis);

  if (storeAnalyses(analyses)) {
    saveButton.disabled = true;
    saveButton.textContent = "Analysis saved ✓";
    renderSavedAnalyses();
  }
});

// Load or delete saved analysis
savedAnalysesContainer.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  const analyses = getSavedAnalyses();
  const selected = analyses.find(item => item.id === id);

  if (!selected) return;

  if (action === "delete") {
    const confirmed = confirm(
      `Delete the saved analysis for ${selected.asset}?`
    );

    if (!confirmed) return;

    const updated = analyses.filter(item => item.id !== id);

    if (storeAnalyses(updated)) {
      renderSavedAnalyses();
    }
  }

  if (action === "load") {
    document.getElementById("scenarioAsset").value = selected.asset;
    document.getElementById("scenarioTimeframe").value =
      selected.timeframe;
    document.getElementById("scenarioBias").value = selected.bias;
    document.getElementById("scenarioSetup").value = selected.setup;
    document.getElementById("scenarioNotes").value = selected.notes;

    currentAnalysis = { ...selected };

    const event = new Event("click");
    generateButton.dispatchEvent(event);

    document.getElementById("scenarioNotes").scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
});

// Initial page setup
renderSavedAnalyses();

document.getElementById("currentYear").textContent =
  new Date().getFullYear();
