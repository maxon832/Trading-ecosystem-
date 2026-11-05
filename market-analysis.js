
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

// Market category filters
const filterButtons = document.querySelectorAll(".market-filter");
const marketCards = document.querySelectorAll(".market-card");

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(item => item.classList.remove("active"));
    button.classList.add("active");

    const selected = button.dataset.filter;

    marketCards.forEach(card => {
      const matches =
        selected === "all" || card.dataset.market === selected;

      card.style.display = matches ? "block" : "none";
    });
  });
});

// Educational framework information
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

const frameworkModal = document.getElementById("frameworkModal");
const frameworkTitle = document.getElementById("frameworkTitle");
const frameworkDescription = document.getElementById("frameworkDescription");
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

// Analysis summary generator
const generateButton = document.getElementById("generateScenario");
const scenarioOutput = document.getElementById("scenarioOutput");

generateButton.addEventListener("click", () => {
  const asset = document.getElementById("scenarioAsset").value.trim();
  const timeframe = document.getElementById("scenarioTimeframe").value;
  const bias = document.getElementById("scenarioBias").value;
  const setup = document.getElementById("scenarioSetup").value;
  const notes = document.getElementById("scenarioNotes").value.trim();

  if (!asset || !timeframe || !bias || !setup || !notes) {
    scenarioOutput.style.display = "block";
    scenarioOutput.textContent =
      "Complete all fields before creating your analysis summary.";
    return;
  }

  scenarioOutput.replaceChildren();

  const heading = document.createElement("h3");
  heading.textContent = "Your analysis summary";

  const details = [
    `Instrument: ${asset}`,
    `Timeframe: ${timeframe}`,
    `Market bias: ${bias}`,
    `Potential setup: ${setup}`,
    `Your analysis: ${notes}`
  ];

  scenarioOutput.appendChild(heading);

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
});

document.getElementById("currentYear").textContent =
  new Date().getFullYear();
  
