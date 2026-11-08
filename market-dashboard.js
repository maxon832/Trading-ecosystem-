
// ==============================================
// TRADESPHERE - LIVE DERIV SYNTHETIC DASHBOARD
// Public market data only. No trading permissions.
// ==============================================

const DERIV_PUBLIC_URL =
  "wss://api.derivws.com/trading/v1/options/ws/public";

const requestedMarkets = [
  { name: "Volatility 75", category: "Volatility" },
  { name: "Volatility 50", category: "Volatility" },
  { name: "Boom 1000", category: "Boom & Crash" },
  { name: "Crash 1000", category: "Boom & Crash" },
  { name: "Crash 500", category: "Boom & Crash" },
  { name: "Step Index", category: "Step" },
  { name: "Boom 500", category: "Boom & Crash" },
  { name: "Volatility 250", category: "Volatility" },
  { name: "Volatility 150", category: "Volatility" },
  { name: "Volatility 100", category: "Volatility" },
  { name: "Volatility 25", category: "Volatility" },
  { name: "Volatility 10", category: "Volatility" }
];

const grid = document.getElementById("liveMarketGrid");
const connectionStatus =
  document.getElementById("liveConnectionStatus");
const statusDot = document.getElementById("liveStatusDot");
const lastUpdate = document.getElementById("liveLastUpdate");
const reconnectButton =
  document.getElementById("refreshLiveMarkets");

let socket = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
let manuallyClosed = false;
let requestNumber = 1;

const marketState = {};

requestedMarkets.forEach(market => {
  marketState[market.name] = {
    symbol: null,
    price: null,
    previousPrice: null,
    pipSize: 2,
    updatedAt: null,
    error: null
  };
});

// ==============================================
// BUILD THE MARKET CARDS
// ==============================================

function renderMarketCards() {
  grid.replaceChildren();

  requestedMarkets.forEach(market => {
    const state = marketState[market.name];

    const card = document.createElement("article");
    card.className = "live-market-card";
    card.id = `market-${market.name.replace(/\s+/g, "-")}`;

    const category = document.createElement("span");
    category.className = "live-market-category";
    category.textContent = market.category;

    const heading = document.createElement("h3");
    heading.textContent = market.name;

    const price = document.createElement("div");
    price.className = "live-market-price";
    price.textContent = "Waiting for tick...";

    const movement = document.createElement("div");
    movement.className = "live-market-movement";
    movement.textContent = "No price movement yet";

    const time = document.createElement("div");
    time.className = "live-market-time";
    time.textContent = "Waiting for market data";

    const symbol = document.createElement("div");
    symbol.className = "live-market-symbol";
    symbol.textContent = "Checking availability...";

    card.append(
      category,
      heading,
      price,
      movement,
      time,
      symbol
    );

    grid.appendChild(card);
  });
}

// ==============================================
// CONNECTION STATUS
// ==============================================

function setConnectionStatus(status, message) {
  connectionStatus.textContent = message;

  statusDot.className = "status-dot";

  if (status === "connected") {
    statusDot.classList.add("connected");
  } else if (status === "disconnected") {
    statusDot.classList.add("disconnected");
  }
}

// ==============================================
// SYMBOL NAME MATCHING
// ==============================================

function normaliseName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\bindex\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}


function findInstrument(activeSymbol) {
  const displayName = normaliseName(
    activeSymbol.underlying_symbol_name ||
    activeSymbol.display_name ||
    ""
  );

  const symbol = String(
    activeSymbol.underlying_symbol ||
    activeSymbol.symbol ||
    ""
  ).toUpperCase();

  return instruments.find(instrument => {
    const requestedName = normaliseName(instrument.name);

    if (displayName === requestedName) {
      return true;
    }

    return instrument.aliases.some(alias =>
      alias.toUpperCase() === symbol
    );
  });
}


// ==============================================
// UPDATE A CARD
// ==============================================

function updateMarketCard(name) {
  const state = marketState[name];

  const card = document.getElementById(
    `market-${name.replace(/\s+/g, "-")}`
  );

  if (!card) return;

  const priceElement =
    card.querySelector(".live-market-price");

  const movementElement =
    card.querySelector(".live-market-movement");

  const timeElement =
    card.querySelector(".live-market-time");

  const symbolElement =
    card.querySelector(".live-market-symbol");

  card.classList.remove("unavailable", "error");

  if (state.error) {
    card.classList.add("unavailable");

    priceElement.textContent = "Unavailable";
    movementElement.textContent = state.error;
    timeElement.textContent = "No live price received";
    symbolElement.textContent = "Check Deriv availability";
    return;
  }

  if (!state.symbol) {
    priceElement.textContent = "Checking...";
    movementElement.textContent = "Resolving instrument";
    timeElement.textContent = "Waiting for symbol response";
    return;
  }

  symbolElement.textContent = `Deriv symbol: ${state.symbol}`;

  if (state.price === null) {
    priceElement.textContent = "Waiting for tick...";
    movementElement.textContent = "Subscription requested";
    timeElement.textContent = "Awaiting first price";
    return;
  }

  priceElement.textContent =
    Number(state.price).toFixed(state.pipSize);

  movementElement.className = "live-market-movement";

  if (state.previousPrice === null) {
    movementElement.textContent = "Initial price received";
  } else if (state.price > state.previousPrice) {
    movementElement.classList.add("up");
    movementElement.textContent = "↑ Price moved up";
  } else if (state.price < state.previousPrice) {
    movementElement.classList.add("down");
    movementElement.textContent = "↓ Price moved down";
  } else {
    movementElement.textContent = "→ No price change";
  }

  if (state.updatedAt) {
    timeElement.textContent =
      `Updated: ${new Date(state.updatedAt).toLocaleTimeString()}`;
  }
}

// ==============================================
// SUBSCRIBE TO ALL AVAILABLE INDICES
// ==============================================

function subscribeToMarkets(activeSymbols) {
  let availableCount = 0;

  requestedMarkets.forEach(market => {
    const match = findMarketSymbol(
      activeSymbols,
      market.name
    );

    const state = marketState[market.name];

    const actualSymbol = match
      ? (match.underlying_symbol || match.symbol)
      : null;

    if (!match || !actualSymbol) {
      state.symbol = null;
      state.error = "Symbol not found in Deriv response";
      updateMarketCard(market.name);
      return;
    }

    state.symbol = actualSymbol;
    state.error = null;

    availableCount++;

    updateMarketCard(market.name);

    socket.send(JSON.stringify({
      ticks: actualSymbol,
      subscribe: 1,
      req_id: requestNumber++
    }));
  });

  setConnectionStatus(
    "connected",
    `Connected — ${availableCount} of 12 instruments matched`
  );
}

// ==============================================
// HANDLE LIVE PRICE TICKS
// ==============================================

function handleTick(tick) {
  if (!tick || !tick.symbol) return;

  const market = requestedMarkets.find(item => {
    return marketState[item.name].symbol === tick.symbol;
  });

  if (!market) return;

  const state = marketState[market.name];
  const newPrice = Number(tick.quote);

  if (!Number.isFinite(newPrice)) return;

  state.previousPrice = state.price;
  state.price = newPrice;

  if (Number.isInteger(Number(tick.pip_size))) {
    state.pipSize = Math.min(
      10,
      Math.max(0, Number(tick.pip_size))
    );
  }

  state.updatedAt = tick.epoch
    ? Number(tick.epoch) * 1000
    : Date.now();

  state.error = null;

  updateMarketCard(market.name);

  lastUpdate.textContent =
    new Date(state.updatedAt).toLocaleTimeString();
}

// ==============================================
// HANDLE API MESSAGES
// ==============================================

function handleMessage(event) {
  let data;

  try {
    data = JSON.parse(event.data);
  } catch (error) {
    console.error("Invalid Deriv response:", error);
    return;
  }

  if (data.error) {
    console.error("Deriv API error:", data.error.message);

    if (data.echo_req && data.echo_req.ticks) {
      const failedSymbol = data.echo_req.ticks;

      requestedMarkets.forEach(market => {
        const state = marketState[market.name];

        if (state.symbol === failedSymbol) {
          state.error = data.error.message;
          updateMarketCard(market.name);
        }
      });
    }

    return;
  }

  
if (data.msg_type === "active_symbols") {
  const symbols = data.active_symbols;

  if (!Array.isArray(symbols)) {
    console.error(
      "[TradeSphere] Invalid active_symbols response:",
      data
    );

    setConnectionStatus(
      "disconnected",
      "Invalid instrument list received"
    );

    return;
  }

  console.log(
    "[TradeSphere] Total Deriv instruments:",
    symbols.length
  );

  // Show all relevant synthetic instruments for diagnosis.
  const syntheticMarkets = symbols.filter(item =>
    item.market === "synthetic_index"
  );

  console.table(
    syntheticMarkets.map(item => ({
      name: item.underlying_symbol_name,
      symbol: item.underlying_symbol,
      market: item.market,
      subgroup: item.subgroup,
      pipSize: item.pip_size
    }))
  );

  subscribeToMarkets(symbols);
}


// ==============================================
// CONNECT TO DERIV
// ==============================================

function connectToDeriv() {
  manuallyClosed = false;

  clearTimeout(reconnectTimer);

  if (
  socket &&
  (
    socket.readyState === WebSocket.OPEN ||
    socket.readyState === WebSocket.CONNECTING
  )
) {
  socket.onopen = null;
  socket.onmessage = null;
  socket.onerror = null;
  socket.onclose = null;
  socket.close();
  }

  setConnectionStatus(
    "connecting",
    "Connecting to Deriv..."
  );

  requestedMarkets.forEach(market => {
    marketState[market.name].symbol = null;
    marketState[market.name].error = null;
    updateMarketCard(market.name);
  });

  lastUpdate.textContent = "Waiting for data";

  try {
    socket = new WebSocket(DERIV_PUBLIC_URL);
  } catch (error) {
    console.error("WebSocket creation failed:", error);
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    reconnectAttempts = 0;

    setConnectionStatus(
      "connected",
      "Connected — requesting available instruments"
    );

    socket.send(JSON.stringify({
      active_symbols: "brief",
      req_id: requestNumber++
    }));
  };

  socket.onmessage = handleMessage;

  socket.onerror = error => {
    console.error("Deriv WebSocket error:", error);
    setConnectionStatus(
      "disconnected",
      "Connection error"
    );
  };

  socket.onclose = () => {
    setConnectionStatus(
      "disconnected",
      "Connection lost"
    );

    if (!manuallyClosed) {
      scheduleReconnect();
    }
  };
}

// ==============================================
// AUTOMATIC RECONNECTION
// ==============================================

function scheduleReconnect() {
  if (manuallyClosed || reconnectTimer) return;

  reconnectAttempts++;

  const delay = Math.min(
    30000,
    2000 * Math.pow(2, reconnectAttempts - 1)
  );

  setConnectionStatus(
    "disconnected",
    `Reconnecting in ${Math.round(delay / 1000)} seconds...`
  );

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectToDeriv();
  }, delay);
}

// ==============================================
// MANUAL RECONNECT
// ==============================================

reconnectButton.addEventListener("click", () => {
  manuallyClosed = true;
  clearTimeout(reconnectTimer);
  reconnectTimer = null;

  reconnectAttempts = 0;

  if (socket) {
    socket.onclose = null;
    socket.close();
  }

  connectToDeriv();
});

// ==============================================
// START DASHBOARD
// ==============================================

renderMarketCards();
connectToDeriv();

// Stop reconnect attempts when the page is leaving.
window.addEventListener("beforeunload", () => {
  manuallyClosed = true;
  clearTimeout(reconnectTimer);

  if (socket) {
    socket.onclose = null;
    socket.close();
  }
});
                         
