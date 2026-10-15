// config/baskets.ts
// Full thematic basket definitions for Basket Factory
// Each basket = picks-and-shovels, not logo chasing. Built for SPAXX + CSP wheel.

export type Holding = {
  symbol: string;        // TradingView / Yahoo ticker
  display: string;       // Human name
  weight: number;        // % allocation (sum 100)
  role: string;          // Badge: what it actually does
  thesis: string;        // 1-line why it wins
  putTarget: string;     // US ticker with liquid options for CSPs
  tickerLabel?: string;      // Override display in Ticker column (e.g. "BTC" instead of "BTC-USD")
  tickerTooltip?: string;    // Tooltip for ticker column (e.g. "Bitcoin/USD Coin Metrics")
  override52wHigh?: number;  // Override 52W high returned by API
  override52wLow?: number;   // Override 52W low returned by API
  noCsp?: boolean;           // Exclude from CSP calculator dropdown (e.g. spot crypto)
};

export type Basket = {
  id: string;
  name: string;
  emoji: string;
  thesis: string;
  thesisLong: string;
  holdings: Holding[];
  scenarioTicker: string; // main ticker for -30% scenario test
};

export const BASKETS: Record<string, Basket> = {
  "face-computer": {
    id: "face-computer",
    name: "Face Computer",
    emoji: "👓",
    thesis: "Don't buy the logo. Buy the lens maker and the chip maker.",
    thesisLong: "Meta proved face computers work: 7M Ray-Ban Meta sold in 2025 vs 2M in 2023-24. But Apple (2027) and Google Android XR (Fall 2026) will compete. Own the frame monopoly + on-face chip and you win regardless of which logo wins.",
    scenarioTicker: "META",
    holdings: [
      { symbol: "EL.PA", display: "EssilorLuxottica", weight: 30, role: "Frame Monopoly", thesis: "Owns Ray-Ban, Oakley. Every pair = their lens + frame", putTarget: "ESLOY" },
      { symbol: "QCOM", display: "Qualcomm", weight: 20, role: "On-Face Chip", thesis: "AR1 Gen 1 powers Ray-Ban Meta Gen2/3 & Samsung XR Jinju", putTarget: "QCOM" },
      { symbol: "AVGO", display: "Broadcom", weight: 20, role: "Off-Face Brain", thesis: "AI networking for data centers streaming 24/7 glasses video", putTarget: "AVGO" },
      { symbol: "SMH", display: "VanEck Semi ETF", weight: 20, role: "Chip Basket", thesis: "TSM/NVDA/AVGO basket - wins regardless of glasses brand", putTarget: "SMH" },
      { symbol: "META", display: "Meta", weight: 10, role: "Platform", thesis: "Platform owner, capped at 10% to avoid concentration", putTarget: "META" },
    ],
  },

  "defense": {
    id: "defense",
    name: "Defense",
    emoji: "🛡️",
    thesis: "In a multi-polar world, primes get paid regardless of who wins.",
    thesisLong: "Defense budget is ~$900B+ and growing. Missiles, jets, ships, drones are consumables now. Own the prime contractors, not the battlefield.",
    scenarioTicker: "LMT",
    holdings: [
      { symbol: "LMT", display: "Lockheed Martin", weight: 25, role: "F-35 / Prime", thesis: "F-35, Javelin, HIMARS - backlog 2+ years", putTarget: "LMT" },
      { symbol: "RTX", display: "RTX Corp", weight: 25, role: "Missiles / Engines", thesis: "Patriot, AMRAAM, Pratt & Whitney engines", putTarget: "RTX" },
      { symbol: "NOC", display: "Northrop Grumman", weight: 20, role: "Stealth / B-21", thesis: "B-21 Raider, drones, space", putTarget: "NOC" },
      { symbol: "HII", display: "Huntington Ingalls", weight: 15, role: "Shipyards", thesis: "Only builder of US nuclear carriers + subs", putTarget: "HII" },
      { symbol: "PPA", display: "Aero & Defense ETF", weight: 15, role: "Diversifier", thesis: "ITA/PPA covers GD, LHX, LDOS tail", putTarget: "PPA" },
    ],
  },

  "nuclear": {
    id: "nuclear",
    name: "Nuclear",
    emoji: "☢️",
    thesis: "AI needs 24/7 power. Solar + wind can't do it. Nuclear is back.",
    thesisLong: "Data centers need baseload. SMRs for AI, uranium shortage, US reshoring. From miner to utility - own the fuel cycle.",
    scenarioTicker: "CCJ",
    holdings: [
      { symbol: "CCJ", display: "Cameco", weight: 30, role: "Uranium Miner", thesis: "World's largest public uranium producer", putTarget: "CCJ" },
      { symbol: "UEC", display: "Uranium Energy", weight: 20, role: "US Uranium", thesis: "US-only uranium + now producing", putTarget: "UEC" },
      { symbol: "SMR", display: "NuScale", weight: 20, role: "SMR Reactor", thesis: "Only NRC-approved SMR design", putTarget: "SMR" },
      { symbol: "CEG", display: "Constellation Energy", weight: 15, role: "Nuclear Utility", thesis: "Largest US nuclear fleet, powering MSFT AI", putTarget: "CEG" },
      { symbol: "URA", display: "Global X Uranium ETF", weight: 15, role: "Fuel Cycle ETF", thesis: "Covers Kazatomprom tail + enrichers", putTarget: "URA" },
    ],
  },

  "memory": {
    id: "memory",
    name: "Memory",
    emoji: "💾",
    thesis: "AI is memory-hungry. HBM is the new oil.",
    thesisLong: "Every AI accelerator needs HBM3e. 3 players control 95% of DRAM. MU is the only US player. AI supercycle = memory supercycle.",
    scenarioTicker: "MU",
    holdings: [
      { symbol: "MU", display: "Micron", weight: 35, role: "US Memory", thesis: "Only US DRAM + leading HBM3e", putTarget: "MU" },
      { symbol: "005930.KS", display: "Samsung Electronics", weight: 25, role: "DRAM King", thesis: "Largest DRAM + NAND, HBM leader", putTarget: "SSNLF" },
      { symbol: "000660.KS", display: "SK Hynix", weight: 20, role: "HBM Leader", thesis: "#1 HBM market share, supplies NVDA", putTarget: "HXSCF" },
      { symbol: "WDC", display: "Western Digital", weight: 10, role: "HDD / Storage", thesis: "Nearline HDD for data centers", putTarget: "WDC" },
      { symbol: "SNDK", display: "SanDisk", weight: 10, role: "NAND", thesis: "NAND flash pure-play spin-off", putTarget: "SNDK" },
    ],
  },

  "energy": {
    id: "energy",
    name: "Energy",
    emoji: "⚡",
    thesis: "All-of-the-above energy wins. Electrons are the new oil.",
    thesisLong: "AI data centers + reshoring + EVs = electricity demand growing first time in 20 years. Own both fossil cash flow and electrification.",
    scenarioTicker: "XOM",
    holdings: [
      { symbol: "XOM", display: "Exxon Mobil", weight: 25, role: "Oil Major", thesis: "Cash cow, buybacks, low breakeven", putTarget: "XOM" },
      { symbol: "CVX", display: "Chevron", weight: 20, role: "Oil + Gas", thesis: "Permian + LNG leverage", putTarget: "CVX" },
      { symbol: "ENPH", display: "Enphase", weight: 20, role: "Solar Inverter", thesis: "Microinverters, high margin", putTarget: "ENPH" },
      { symbol: "FSLR", display: "First Solar", weight: 15, role: "US Solar Panels", thesis: "Only large US panel maker, IRA beneficiary", putTarget: "FSLR" },
      { symbol: "XLE", display: "Energy Select ETF", weight: 20, role: "Diversifier", thesis: "Covers SLB, EOG, COP tail", putTarget: "XLE" },
    ],
  },

  "semi-chips": {
    id: "semi-chips",
    name: "Semi Chips",
    emoji: "🧠",
    thesis: "Chips win regardless of which app wins.",
    thesisLong: "The ultimate picks-and-shovels: NVDA designs, TSM fabs, ASML prints. If AI works, these get paid first. Expanded to cover the full stack — designers, fabs, IP, analog, and infrastructure.",
    scenarioTicker: "NVDA",
    holdings: [
      { symbol: "NVDA", display: "Nvidia", weight: 20, role: "GPU King", thesis: "AI training monopoly, CUDA moat", putTarget: "NVDA" },
      { symbol: "TSM", display: "TSMC", weight: 15, role: "Leading Fab", thesis: "Makes every AI chip, you already trade it", putTarget: "TSM" },
      { symbol: "ASML", display: "ASML", weight: 10, role: "Lithography", thesis: "Only EUV machines in the world", putTarget: "ASML" },
      { symbol: "AVGO", display: "Broadcom", weight: 8, role: "Custom ASIC + Network", thesis: "Google TPU + AI networking", putTarget: "AVGO" },
      { symbol: "AMD", display: "Advanced Micro Devices", weight: 8, role: "CPU/GPU #2", thesis: "NVDA challenger, data center GPU + server CPU share gains", putTarget: "AMD" },
      { symbol: "QCOM", display: "Qualcomm", weight: 7, role: "Mobile + Edge AI", thesis: "Snapdragon dominates mobile, AR/edge AI chip wins", putTarget: "QCOM" },
      { symbol: "ARM", display: "Arm Holdings", weight: 7, role: "CPU Architecture IP", thesis: "Royalties on every smartphone + growing data center share", putTarget: "ARM" },
      { symbol: "TXN", display: "Texas Instruments", weight: 6, role: "Analog Leader", thesis: "Industrial + auto analog chips, 80%+ gross margin business", putTarget: "TXN" },
      { symbol: "MRVL", display: "Marvell Technology", weight: 5, role: "Data Center Networking", thesis: "Custom AI ASICs + optical networking for hyperscalers", putTarget: "MRVL" },
      { symbol: "INTC", display: "Intel", weight: 5, role: "CPU + IDM Turnaround", thesis: "18A process node + US fab capacity is strategic asset", putTarget: "INTC" },
      { symbol: "SMH", display: "Semi ETF", weight: 5, role: "Tail Coverage", thesis: "Covers KLAC, LRCX, AMAT equipment tail", putTarget: "SMH" },
      { symbol: "UMC", display: "United Microelectronics", weight: 2, role: "Mature Node Fab", thesis: "Low-cost trailing-edge foundry, auto + IoT chips", putTarget: "UMC" },
      { symbol: "GFS", display: "GlobalFoundries", weight: 2, role: "US Fab / CHIPS Act", thesis: "CHIPS Act beneficiary, defense + auto specialty nodes", putTarget: "GFS" },
    ],
  },

  "healthcare": {
    id: "healthcare",
    name: "Healthcare",
    emoji: "🧬",
    thesis: "Aging + GLP-1 + robotics = secular growth.",
    thesisLong: "US is 65+ boom, GLP-1 is biggest drug class ever, robotic surgery growing 15%+ yr. Own cash flow + growth.",
    scenarioTicker: "LLY",
    holdings: [
      { symbol: "LLY", display: "Eli Lilly", weight: 25, role: "GLP-1 Leader", thesis: "Zepbound/Mounjaro monopoly with NVO", putTarget: "LLY" },
      { symbol: "UNH", display: "UnitedHealth", weight: 20, role: "Insurance + Care", thesis: "Largest insurer + Optum care delivery", putTarget: "UNH" },
      { symbol: "ISRG", display: "Intuitive Surgical", weight: 20, role: "Robotic Surgery", thesis: "Da Vinci monopoly, razor/blade", putTarget: "ISRG" },
      { symbol: "ABBV", display: "AbbVie", weight: 15, role: "Pharma Cash", thesis: "Skyrizi/Humira cash cow, Allergan aesthetics", putTarget: "ABBV" },
      { symbol: "XLV", display: "Healthcare ETF", weight: 20, role: "Diversifier", thesis: "Covers JNJ, MRK, PFE tail", putTarget: "XLV" },
    ],
  },

  "oil-refiner": {
    id: "oil-refiner",
    name: "Oil Refiner",
    emoji: "🛢️",
    thesis: "Refiners print money on crack spreads. Own the margin, not the barrel.",
    thesisLong: "Independent refiners earn on the spread between crude input cost and finished product prices — not on crude itself. When supply is tight and product demand is firm, crack spreads widen and these companies generate exceptional cash flow. US refining capacity is structurally limited after post-COVID closures, creating a durable margin floor.",
    scenarioTicker: "MPC",
    holdings: [
      { symbol: "MPC", display: "Marathon Petroleum", weight: 25, role: "Largest Refiner", thesis: "Largest US refiner, crack spread leverage", putTarget: "MPC" },
      { symbol: "VLO", display: "Valero Energy", weight: 20, role: "Top Refiner", thesis: "Best-in-class refinery complexity, low-cost operator", putTarget: "VLO" },
      { symbol: "PSX", display: "Phillips 66", weight: 15, role: "Diversified", thesis: "Refining + midstream + chemicals diversification", putTarget: "PSX" },
      { symbol: "DINO", display: "HF Sinclair", weight: 15, role: "Mid-Continent", thesis: "Rocky Mountain + Southwest refining footprint", putTarget: "DINO" },
      { symbol: "PBF", display: "PBF Energy", weight: 15, role: "East Coast", thesis: "East Coast leverage, high beta to cracks", putTarget: "PBF" },
      { symbol: "DK", display: "Delek US", weight: 10, role: "Small Cap", thesis: "Small cap refiner, Permian logistics upside", putTarget: "DK" },
    ],
  },

  "ai-racks": {
    id: "ai-racks",
    name: "AI Racks",
    emoji: "🗄️",
    thesis: "AI inference explodes. Own the rack builders and the switches between them.",
    thesisLong: "Every LLM deployment needs physical racks of GPUs, cooling, and networking. DELL and SMCI integrate NVDA GB200 clusters. HPE owns enterprise. ANET and CSCO connect them. PSTG stores the weights. Infrastructure wins regardless of which model wins.",
    scenarioTicker: "DELL",
    holdings: [
      { symbol: "DELL", display: "Dell Technologies", weight: 25, role: "Server King", thesis: "#1 server shipper, main NVDA GB200 rack integrator", putTarget: "DELL" },
      { symbol: "SMCI", display: "Super Micro", weight: 25, role: "Custom Racks", thesis: "Fastest custom liquid-cooled AI rack builder", putTarget: "SMCI" },
      { symbol: "HPE", display: "Hewlett Packard Ent", weight: 20, role: "Enterprise", thesis: "HPE GreenLake + enterprise AI servers", putTarget: "HPE" },
      { symbol: "ANET", display: "Arista Networks", weight: 15, role: "Networking", thesis: "Data center switches that connect the racks", putTarget: "ANET" },
      { symbol: "CSCO", display: "Cisco", weight: 10, role: "Network", thesis: "AI fabric + networking for AI clusters", putTarget: "CSCO" },
      { symbol: "NTAP", display: "NetApp", weight: 5, role: "Storage", thesis: "All-flash storage for AI workloads, enterprise NAS/SAN", putTarget: "NTAP" },
    ],
  },

  "neocloud": {
    id: "neocloud",
    name: "Neocloud",
    emoji: "☁️",
    thesis: "Hyperscalers can't build fast enough. Neoclouds rent GPU clusters by the hour.",
    thesisLong: "AI startups need H100/GB200 now — not in 3 years when hyperscaler capacity expands. Neoclouds fill that gap: CoreWeave for pure GPU cloud, OCI for enterprise, Nebius for EU, plus the Bitcoin miners pivoting their power infrastructure to AI compute.",
    scenarioTicker: "CRWV",
    holdings: [
      { symbol: "CRWV", display: "CoreWeave", weight: 25, role: "GPU King", thesis: "Pure-play GPU cloud, largest H100/GB200 fleet for rent", putTarget: "CRWV" },
      { symbol: "ORCL", display: "Oracle", weight: 20, role: "Enterprise Cloud", thesis: "OCI - massive NVDA buyer, enterprise neocloud", putTarget: "ORCL" },
      { symbol: "NBIS", display: "Nebius Group", weight: 20, role: "EU Neocloud", thesis: "Ex-Yandex, EU GPU cloud builder", putTarget: "NBIS" },
      { symbol: "IREN", display: "Iris Energy", weight: 15, role: "BTC + AI", thesis: "Bitcoin miner pivoting to AI cloud", putTarget: "IREN" },
      { symbol: "APLD", display: "Applied Digital", weight: 10, role: "Data Center", thesis: "Data center REIT for AI/neocloud", putTarget: "APLD" },
      { symbol: "CLSK", display: "CleanSpark", weight: 10, role: "Infra", thesis: "Power + infra for AI cloud", putTarget: "CLSK" },
    ],
  },

  "quantum": {
    id: "quantum",
    name: "Quantum",
    emoji: "⚛️",
    thesis: "Quantum computing is pre-revenue — own the pure-plays before the breakout.",
    thesisLong: "Quantum advantage is coming: IonQ, Rigetti, and D-Wave each bet on different physics. QUBT adds photonics. ARQQ plays quantum encryption. High-risk, high-upside basket — size accordingly.",
    scenarioTicker: "IONQ",
    holdings: [
      { symbol: "IONQ", display: "IonQ", weight: 25, role: "Ion Trap Leader", thesis: "Leading trapped-ion quantum, pure-play", putTarget: "IONQ" },
      { symbol: "RGTI", display: "Rigetti Computing", weight: 20, role: "Superconducting", thesis: "Superconducting quantum processors", putTarget: "RGTI" },
      { symbol: "QUBT", display: "Quantum Computing Inc", weight: 20, role: "Photonics", thesis: "Photonic quantum + quantum sensing", putTarget: "QUBT" },
      { symbol: "QBTS", display: "D-Wave Quantum", weight: 15, role: "Annealing", thesis: "Quantum annealing commercial leader", putTarget: "QBTS" },
      { symbol: "QMCO", display: "Quantum Corp", weight: 10, role: "Storage", thesis: "Quantum-adjacent data storage + legacy", putTarget: "QMCO" },
      { symbol: "ARQQ", display: "Arqit Quantum", weight: 10, role: "Encryption", thesis: "Quantum encryption / QKD", putTarget: "ARQQ" },
    ],
  },

  "crypto": {
    id: "crypto",
    name: "Crypto",
    emoji: "₿",
    thesis: "Own the picks-and-shovels of crypto: exchanges, treasuries, stablecoin infra — plus spot BTC and ETH.",
    thesisLong: "Crypto infrastructure wins regardless of which coin wins the cycle. COIN is the regulated exchange. CRCL is stablecoin rails. MSTR and BMNR are leveraged BTC/ETH treasury plays. IBIT gives spot BTC in a wrapper. BTC-USD and ETH-USD anchor with direct coin exposure.",
    scenarioTicker: "COIN",
    holdings: [
      { symbol: "BMNR", display: "BitMine Immersion", weight: 20, role: "ETH Treasury", thesis: "Largest ETH treasury company, Tom Lee chair", putTarget: "BMNR" },
      { symbol: "COIN", display: "Coinbase", weight: 20, role: "Exchange", thesis: "Largest US crypto exchange, custody + trading fees", putTarget: "COIN" },
      { symbol: "CRCL", display: "Circle", weight: 15, role: "Stablecoin", thesis: "USDC issuer, stablecoin infra play", putTarget: "CRCL" },
      { symbol: "IBIT", display: "iShares Bitcoin Trust", weight: 15, role: "BTC ETF", thesis: "BlackRock spot BTC ETF, tracks BTC", putTarget: "IBIT" },
      { symbol: "MSTR", display: "MicroStrategy / Strategy", weight: 15, role: "BTC Treasury", thesis: "Largest corporate BTC holder, leveraged BTC play", putTarget: "MSTR" },
      {
        symbol: "BTC-USD", display: "Bitcoin", weight: 8, role: "Spot BTC",
        thesis: "Coin Metrics spot BTC price",
        putTarget: "BTC-USD",
        tickerLabel: "BTC",
        tickerTooltip: "Bitcoin/USD Coin Metrics",
        override52wHigh: 126184.05,
        override52wLow: 57717.55,
        noCsp: true,
      },
      {
        symbol: "ETH-USD", display: "Ethereum", weight: 7, role: "Spot ETH",
        thesis: "Coin Metrics spot ETH price",
        putTarget: "ETH-USD",
        tickerLabel: "ETH",
        tickerTooltip: "Ether/USD Coin Metrics",
        override52wHigh: 4265.11,
        override52wLow: 1506.51,
        noCsp: true,
      },
    ],
  },
};

export const BASKET_IDS = Object.keys(BASKETS) as (keyof typeof BASKETS)[];

export const DEFAULT_BASKET_ID = "face-computer";
