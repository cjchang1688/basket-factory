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
    thesisLong: "The ultimate picks-and-shovels: NVDA designs, TSM fabs, ASML prints. If AI works, these get paid first.",
    scenarioTicker: "NVDA",
    holdings: [
      { symbol: "NVDA", display: "Nvidia", weight: 30, role: "GPU King", thesis: "AI training monopoly, CUDA moat", putTarget: "NVDA" },
      { symbol: "TSM", display: "TSMC", weight: 25, role: "The Fab", thesis: "Makes every AI chip, you already trade it", putTarget: "TSM" },
      { symbol: "ASML", display: "ASML", weight: 20, role: "Lithography", thesis: "Only EUV machines in the world", putTarget: "ASML" },
      { symbol: "AVGO", display: "Broadcom", weight: 15, role: "Custom ASIC + Network", thesis: "Google TPU + AI networking", putTarget: "AVGO" },
      { symbol: "SMH", display: "Semi ETF", weight: 10, role: "Tail Coverage", thesis: "Covers AMD, KLAC, LRCX tail", putTarget: "SMH" },
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
};

export const BASKET_IDS = Object.keys(BASKETS) as (keyof typeof BASKETS)[];

export const DEFAULT_BASKET_ID = "face-computer";
