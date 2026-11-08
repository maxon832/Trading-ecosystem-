
/* =====================================================
   TRADESPHERE - DERIV LIVE MARKET DASHBOARD
   Version: 2.0
   Public market data only
===================================================== */

(() => {
  "use strict";

  /* ================================================
     CONFIGURATION
  ================================================ */

  const CONFIG = {
    websocketURL:
      "wss://api.derivws.com/trading/v1/options/ws/public",

    reconnectDelay: 3000,
    maximumReconnectDelay: 30000,
    pingInterval: 30000
  };


  /* ================================================
     REQUESTED INSTRUMENTS

     Aliases are matched against Deriv's actual
     active_symbols response.
  ================================================ */

  const requestedMarkets = [
    {
      id: "vol75",
      name: "Volatility 75",
      aliases: ["R_75", "Volatility 75", "Volatility 75 Index"]
    },
    {
      id: "vol50",
      name: "Volatility 50",
      aliases: ["R_50", "Volatility 50", "Volatility 50 Index"]
    },
    {
      id: "boom1000",
      name: "Boom 1000",
      aliases: ["BOOM1000", "Boom 1000", "Boom 1000 Index"]
    },
    {
      id: "crash1000",
      name: "Crash 1000",
      aliases: ["CRASH1000", "Crash 1000", "Crash 1000 Index"]
    },
    {
      id: "crash500",
      name: "Crash 500",
      aliases: ["CRASH500", "Crash 500", "Crash 500 Index"]
    },
    {
      id: "step",
      name: "Step Index",
      aliases: ["stpRNG", "Step Index", "Step"]
    },
    {
      id: "boom500",
      name: "Boom 500",
      aliases: ["BOOM500", "Boom 500", "Boom 500 Index"]
    },
    {
      id: "vol250",
      name: "Volatility 250",
      aliases: ["R_250", "Volatility 250", "Volatility 250 Index"]
    },
    {
      id: "vol150",
      name: "Volatility 150",
      aliases: ["R_150", "Volatility 150", "Volatility 150 Index"]
    },
    {
      id: "vol100",
      name: "Volatility 100",
      aliases: ["R_100", "Volatility 100", "Volatility 100 Index"]
    },
    {
      id: "vol25",
      name: "Volatility 25",
      aliases: ["R_25", "Volatility 25", "Volatility 25 Index"]
    },
    {
      id: "vol10",
      name: "Volatility 10",
      aliases: ["R_10", "Volatility 10", "Volatility 10 Index"]
    }
  ];


  /* ================================================
     STATE
  ================================================ */

  let socket = null;

  let reconnectTimer = null;
  let pingTimer = null;

  let reconnectAttempts = 0;
  let connectionGeneration = 0;
  let nextRequestId = 100;

  let isManuallyClosing = false;
  let activeSymbolsLoaded = false;

  const matchedMarkets = new Map();
  const subscriptions = new Map();
  const requestMarkets = new Map();


  /* ================================================
     DOM ELEMENTS
  ================================================ */

  const elements = {
    grid: document.getElementById("liveMarketGrid"),

    connection:
      document.getElementById("liveConnectionStatus"),

    dot:
      document.getElementById("liveStatusDot"),

    count:
      document.getElementById("instrumentCount"),

    lastUpdate:
      document.getElementById("liveLastUpdate"),

    message:
      document.getElementById("dashboardMessage"),

    reconnect:
      document.getElementById("refreshLiveMarkets")
  };


  /* ================================================
     BASIC UTILITIES
  ================================================ */

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }


  function send(data) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    socket.send(JSON.stringify(data));
    return true;
  }


  function setStatus(text, state = "connecting") {

    if (elements.connection) {
      elements.connection.textContent = text;
    }

    if (elements.dot) {
      elements.dot.className = "status-dot " + state;
    }
  }


  function setMessage(text) {
    if (elements.message) {
      elements.message.textContent = text;
    }
  }


  function updateMatchedCount() {

    if (elements.count) {
      elements.count.textContent =
        `${matchedMarkets.size}/${requestedMarkets.length}`;
    }
  }


  function updateLastUpdate() {

    if (elements.lastUpdate) {

      elements.lastUpdate.textContent =
        "Last update: " +
        new Date().toLocaleTimeString();
    }
  }


  /* ================================================
     DASHBOARD STYLES

     Keeps the market cards readable even if
     older dashboard styles were inconsistent.
  ================================================ */

  function installDashboardStyles() {

    if (document.getElementById("tradesphereLiveStyles")) {
      return;
    }

    const style = document.createElement("style");

    style.id = "tradesphereLiveStyles";

    style.textContent = `
      #liveMarketGrid {
        display: grid;
        grid-template-columns:
          repeat(auto-fit, minmax(170px, 1fr));
        gap: 14px;
        width: 100%;
        margin: 22px 0;
      }

      .ts-live-card {
        min-width: 0;
        min-height: 120px;
        padding: 17px;
        border-radius: 12px;
        background: #10251c;
        border: 1px solid #1d3b2d;
        transition: border-color .2s ease;
      }

      .ts-live-card:hover {
        border-color: #20c78a;
      }

      .ts-live-name {
        color: #e4eee8;
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 5px;
      }

      .ts-live-category {
        color: #829b8d;
        font-size: 10px;
        margin-bottom: 17px;
      }

      .ts-live-price {
        color: #ffffff;
        font-size: 21px;
        font-weight: 700;
        overflow-wrap: anywhere;
      }

      .ts-live-change {
        font-size: 11px;
        margin-top: 6px;
        color: #91a99a;
      }

      .ts-live-change.up {
        color: #20c78a;
      }

      .ts-live-change.down {
        color: #ff7777;
      }

      .ts-live-note {
        color: #91a99a;
        font-size: 10px;
        margin-top: 7px;
      }

      .ts-live-card.error {
        border-color: #754c40;
      }

      .ts-live-card.received {
        border-color: #226c4a;
      }

      .status-dot.connected {
        background: #20c78a;
        box-shadow: 0 0 8px #20c78a;
      }

      .status-dot.connecting {
        background: #e7b84c;
      }

      .status-dot.error {
        background: #ff6868;
      }

      @media(max-width: 600px) {
        #liveMarketGrid {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 9px;
        }

        .ts-live-card {
          padding: 12px;
          min-height: 112px;
        }

        .ts-live-price {
          font-size: 17px;
        }
      }
    `;

    document.head.appendChild(style);
  }


  /* ================================================
     CREATE MARKET CARDS
  ================================================ */

  function createMarketCards() {

    if (!elements.grid) {
      console.error(
        "TradeSphere: liveMarketGrid element not found."
      );
      return;
    }

    elements.grid.replaceChildren();

    requestedMarkets.forEach(market => {

      const card = document.createElement("article");

      card.className = "ts-live-card";
      card.id = `market-${market.id}`;

      const name = document.createElement("div");
      name.className = "ts-live-name";
      name.textContent = market.name;

      const category = document.createElement("div");
      category.className = "ts-live-category";
      category.textContent = "Deriv Synthetic Index";

      const price = document.createElement("div");
      price.className = "ts-live-price";
      price.id = `price-${market.id}`;
      price.textContent = "--";

      const change = document.createElement("div");
      change.className = "ts-live-change";
      change.id = `change-${market.id}`;
      change.textContent = "Waiting for price";

      const note = document.createElement("div");
      note.className = "ts-live-note";
      note.id = `note-${market.id}`;
      note.textContent = "Waiting for connection";

      card.append(
        name,
        category,
        price,
        change,
        note
      );

      elements.grid.appendChild(card);
    });
  }


  /* ================================================
     UPDATE CARD
  ================================================ */

  function updateCardNote(id, text, error = false) {

    const note = document.getElementById(`note-${id}`);
    const card = document.getElementById(`market-${id}`);

    if (note) {
      note.textContent = text;
    }

    if (card) {
      card.classList.toggle("error", error);
    }
  }


  function displayPrice(market, tick) {

    const priceElement =
      document.getElementById(`price-${market.id}`);

    const changeElement =
      document.getElementById(`change-${market.id}`);

    const card =
      document.getElementById(`market-${market.id}`);

    if (!priceElement || !changeElement) {
      return;
    }

    const quote = Number(tick.quote);

    if (!Number.isFinite(quote)) {
      return;
    }

    const previous = market.previousPrice;

    const precision = Number.isInteger(Number(tick.pip_size))
      ? Math.min(Math.max(Number(tick.pip_size), 0), 12)
      : 8;

    priceElement.textContent =
      quote.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: precision
      });

    if (previous !== null && previous !== undefined) {

      const difference = quote - previous;

      const direction =
        difference > 0 ? "up" :
        difference < 0 ? "down" : "";

      const arrow =
        difference > 0 ? "▲" :
        difference < 0 ? "▼" : "—";

      changeElement.className =
        "ts-live-change " + direction;

      changeElement.textContent =
        `${arrow} ${difference >= 0 ? "+" : ""}` +
        difference.toFixed(precision);

    } else {

      changeElement.className = "ts-live-change";
      changeElement.textContent = "Live price received";
    }

    market.previousPrice = quote;
    market.hasPrice = true;

    if (card) {
      card.classList.add("received");
    }

    updateCardNote(
      market.id,
      `Live • ${new Date().toLocaleTimeString()}`
    );

    updateLastUpdate();
    updateLiveSummary();
  }


  /* ================================================
     LIVE PRICE SUMMARY
  ================================================ */

  function updateLiveSummary() {

    const received = requestedMarkets.filter(
      market => market.hasPrice
    ).length;

    const matched = matchedMarkets.size;

    if (elements.message) {

      if (received === requestedMarkets.length) {

        setMessage(
          `All ${received} requested instruments are receiving live prices.`
        );

      } else if (received > 0) {

        setMessage(
          `${received}/${requestedMarkets.length} instruments receiving live prices. ` +
          `${matched}/${requestedMarkets.length} instruments matched.`
        );

      } else if (matched > 0) {

        setMessage(
          `${matched}/${requestedMarkets.length} instruments matched. ` +
          "Waiting for first live ticks."
        );

      }
    }
  }


  /* ================================================
     MATCH DERIV SYMBOLS
  ================================================ */

  function getSymbolData(item) {

    return {
      symbol: String(item.symbol || ""),
      displayName: String(
        item.display_name ||
        item.underlying_symbol ||
        item.symbol ||
        ""
      ),
      marketName: String(
        item.market_display_name || ""
      ),
      submarketName: String(
        item.submarket_display_name || ""
      )
    };
  }


  function matchInstrument(market, symbols) {

    const aliases = market.aliases.map(normalize);

    const candidates = symbols.map(getSymbolData);

    // Exact matching first. Avoid fuzzy matching
    // unrelated instruments with similar names.

    for (const candidate of candidates) {

      const fields = [
        normalize(candidate.symbol),
        normalize(candidate.displayName),
        normalize(candidate.marketName),
        normalize(candidate.submarketName)
      ];

      const matched = aliases.some(alias =>
        fields.includes(alias)
      );

      if (matched && candidate.symbol) {
        return candidate.symbol;
      }
    }

    return null;
  }


  /* ================================================
     REQUEST TICK SUBSCRIPTIONS
  ================================================ */

  function subscribeToMarkets(symbols) {

    requestedMarkets.forEach(market => {

      const symbol = matchInstrument(market, symbols);

      if (!symbol) {

        updateCardNote(
          market.id,
          "Not found in Deriv active symbols",
          true
        );

        return;
      }

      if (matchedMarkets.has(market.id)) {
        return;
      }

      market.symbol = symbol;
      market.previousPrice = null;
      market.hasPrice = false;

      matchedMarkets.set(market.id, market);

      updateCardNote(
        market.id,
        `Matched: ${symbol} • Requesting live price`
      );

      const reqId = nextRequestId++;

      requestMarkets.set(reqId, market);

      const sent = send({
        ticks: symbol,
        subscribe: 1,
        req_id: reqId
      });

      if (sent) {
        subscriptions.set(symbol, market);
      } else {
        updateCardNote(
          market.id,
          "Subscription request failed",
          true
        );
      }

    });

    updateMatchedCount();

    const matched = matchedMarkets.size;

    if (matched === 0) {

      setStatus("Connected — no instruments matched", "error");

      setMessage(
        "Deriv connection is open, but none of the requested instruments matched. Check the active_symbols response."
      );

    } else {

      setStatus("Connected — receiving market data", "connected");

      setMessage(
        `${matched}/12 instruments matched. Waiting for live prices.`
      );
    }
  }


  /* ================================================
     HANDLE ACTIVE SYMBOL RESPONSE
  ================================================ */

  function handleActiveSymbols(data) {

    const symbols = data.active_symbols;

    if (!Array.isArray(symbols)) {

      setMessage(
        "Deriv responded, but its active symbols list was not recognised."
      );

      return;
    }

    activeSymbolsLoaded = true;

    console.log(
      "TradeSphere: Deriv active symbols received:",
      symbols
    );

    subscribeToMarkets(symbols);
  }


  /* ================================================
     HANDLE LIVE TICK
  ================================================ */

  function handleTick(data) {

    const tick = data.tick;

    if (!tick) {
      return;
    }

    let market = subscriptions.get(tick.symbol);

    if (!market && data.req_id) {
      market = requestMarkets.get(data.req_id);
    }

    if (!market) {
      return;
    }

    displayPrice(market, tick);
  }


  /* ================================================
     HANDLE API ERRORS
  ================================================ */

  function handleAPIError(data) {

    const errorMessage =
      data.error?.message ||
      "Unknown Deriv API error";

    console.error(
      "TradeSphere Deriv API error:",
      data.error
    );

    const market = requestMarkets.get(data.req_id);

    if (market) {

      updateCardNote(
        market.id,
        errorMessage,
        true
      );

    } else {

      setMessage(
        "Deriv API error: " + errorMessage
      );
    }

    if (!activeSymbolsLoaded) {
      setStatus("Deriv API error", "error");
    }
  }


  /* ================================================
     HANDLE ALL WEBSOCKET MESSAGES
  ================================================ */

  function handleMessage(event) {

    let data;

    try {
      data = JSON.parse(event.data);
    } catch (error) {

      console.error(
        "TradeSphere: Invalid WebSocket response",
        error
      );

      return;
    }

    if (data.error) {
      handleAPIError(data);
      return;
    }

    switch (data.msg_type) {

      case "active_symbols":
        handleActiveSymbols(data);
        break;

      case "tick":
        handleTick(data);
        break;

      case "ping":
        break;

      default:
        console.log(
          "TradeSphere: Deriv response",
          data
        );
    }
  }


  /* ================================================
     CLEAN UP OLD CONNECTION
  ================================================ */

  function clearConnectionTimers() {

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  }


  function resetMarketState() {

    matchedMarkets.clear();
    subscriptions.clear();
    requestMarkets.clear();

    activeSymbolsLoaded = false;

    requestedMarkets.forEach(market => {

      market.symbol = null;
      market.previousPrice = null;
      market.hasPrice = false;

      const price =
        document.getElementById(`price-${market.id}`);

      const change =
        document.getElementById(`change-${market.id}`);

      if (price) price.textContent = "--";

      if (change) {
        change.textContent = "Waiting for price";
        change.className = "ts-live-change";
      }

      updateCardNote(
        market.id,
        "Waiting for connection"
      );

    });

    updateMatchedCount();
  }


  /* ================================================
     AUTOMATIC RECONNECTION
  ================================================ */

  function scheduleReconnect(generation) {

    if (isManuallyClosing || generation !== connectionGeneration) {
      return;
    }

    if (reconnectTimer) {
      return;
    }

    reconnectAttempts++;

    const delay = Math.min(
      CONFIG.reconnectDelay *
        Math.pow(2, reconnectAttempts - 1),
      CONFIG.maximumReconnectDelay
    );

    setStatus("Connection lost — reconnecting", "error");

    setMessage(
      `Reconnecting in ${Math.round(delay / 1000)} seconds...`
    );

    reconnectTimer = setTimeout(() => {

      reconnectTimer = null;

      if (generation === connectionGeneration) {
        connectToDeriv();
      }

    }, delay);
  }


  /* ================================================
     MAIN CONNECTION
  ================================================ */

  function connectToDeriv() {

    isManuallyClosing = false;

    clearConnectionTimers();

    connectionGeneration++;

    const generation = connectionGeneration;

    if (socket) {

      const oldSocket = socket;

      socket = null;

      oldSocket.onclose = null;
      oldSocket.onerror = null;
      oldSocket.onmessage = null;
      oldSocket.onopen = null;

      try {
        oldSocket.close();
      } catch (error) {
        console.warn(error);
      }
    }

    resetMarketState();

    setStatus("Connecting to Deriv...", "connecting");

    setMessage("Opening Deriv public market-data connection...");

    if (!("WebSocket" in window)) {

      setStatus("WebSocket not supported", "error");

      setMessage(
        "Your browser does not support WebSocket connections."
      );

      return;
    }

    let newSocket;

    try {

      newSocket = new WebSocket(CONFIG.websocketURL);

      socket = newSocket;

    } catch (error) {

      console.error(
        "TradeSphere connection error:",
        error
      );

      setStatus("Connection failed", "error");

      scheduleReconnect(generation);

      return;
    }


  /* CONNECTION OPEN */

    newSocket.onopen = () => {

      if (generation !== connectionGeneration) {
        return;
      }

      reconnectAttempts = 0;

      setStatus("Connected — requesting instruments", "connected");

      setMessage(
        "Connected successfully. Requesting Deriv active symbols..."
      );

      const sent = send({
        active_symbols: "full",
        req_id: 1
      });

      if (!sent) {
        setMessage(
          "Connection opened, but active symbols request could not be sent."
        );
      }

      // Keep the connection alive.

      pingTimer = setInterval(() => {

        if (
          socket === newSocket &&
          newSocket.readyState === WebSocket.OPEN
        ) {
          send({ ping: 1 });
        }

      }, CONFIG.pingInterval);

    };
    
    /* INCOMING DATA */

    newSocket.onmessage = event => {

      if (generation !== connectionGeneration) {
        return;
      }

      handleMessage(event);

    };


    /* CONNECTION ERROR */

    newSocket.onerror = error => {

      console.error(
        "TradeSphere WebSocket error:",
        error
      );

      if (generation === connectionGeneration) {

        setStatus("Connection error", "error");

        setMessage(
          "A WebSocket error occurred. Waiting for reconnection..."
        );
      }

    };

  /* CONNECTION CLOSED */

    newSocket.onclose = event => {

      if (generation !== connectionGeneration) {
        return;
      }

      clearConnectionTimers();

      socket = null;

      console.warn(
        "TradeSphere WebSocket closed:",
        event.code,
        event.reason
      );

      if (isManuallyClosing) {
        return;
      }

      scheduleReconnect(generation);

    };

  }

 /* ================================================
     MANUAL RECONNECT BUTTON
  ================================================ */

  if (elements.reconnect) {

    elements.reconnect.addEventListener(
      "click",
      () => {

        reconnectAttempts = 0;

        connectToDeriv();

      }
    );
  }

 /* ================================================
     NETWORK RECOVERY
  ================================================ */

  window.addEventListener("online", () => {

    if (!socket || socket.readyState !== WebSocket.OPEN) {

      reconnectAttempts = 0;

      connectToDeriv();
    }

  });


  window.addEventListener("offline", () => {

    setStatus("Device offline", "error");

    setMessage(
      "Your internet connection is unavailable."
    );

  });

 /* ================================================
     INITIALISE DASHBOARD
  ================================================ */

  function initialise() {

    installDashboardStyles();

    createMarketCards();

    updateMatchedCount();

    setStatus("Starting dashboard...", "connecting");

    connectToDeriv();

  }


  initialise();

 /* ================================================
     CLEAN UP WHEN PAGE IS CLOSED
  ================================================ */

  window.addEventListener("pagehide", () => {

    isManuallyClosing = true;

    connectionGeneration++;

    clearConnectionTimers();

    if (socket) {

      const oldSocket = socket;

      socket = null;

      oldSocket.onclose = null;

      try {
        oldSocket.close();
      } catch (error) {
        console.warn(error);
      }
    }

  });


})();
