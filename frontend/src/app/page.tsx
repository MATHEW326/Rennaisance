"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { 
  Search, 
  Terminal as TerminalIcon, 
  BookOpen, 
  ShieldAlert, 
  Link as LinkIcon, 
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Cpu,
  Sparkles,
  ArrowUpRight,
  Layers,
  Info,
  Maximize2,
  X,
  Sun,
  Moon,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";

interface ResearchResult {
  status: string;
  report: string;
  critique: string;
  sources: string[];
  skipped_sources: [string, string][];
  source_contents?: Record<string, string>;
  claims?: Record<string, {
    assertion: string;
    source_url: string;
    excerpt: string;
    opposing: string;
    quality_score: string;
    confidence_rating: string;
  }>;
}


const stepDetails = [
  {
    phase: "01",
    name: "Planner",
    subName: "Deconstruct",
    color: "gold",
    desc: "The Planner agent dissects your topic into multiple target inquiries targeting historical, scientific, and logical angles.",
    logs: [
      "Planner initialised.",
      "Analyzing topic complexity...",
      "Generating 3 target inquiry routes:",
      "-> [Route 1]: Live empirical studies",
      "-> [Route 2]: Mechanistic/biochemical pathways",
      "-> [Route 3]: Meta-analyses consensus",
      "Planner tasks dispatched."
    ]
  },
  {
    phase: "02",
    name: "Crawler",
    subName: "Deep Scrape",
    color: "gold",
    desc: "Runs concurrent web searches and crawls full target web pages, filtering text into high-density semantic chunks.",
    logs: [
      "Crawler spawned on 3 threads.",
      "Querying Google Search engine API...",
      "URLs retrieved: 14 candidates.",
      "Fetching page content for candidate 1-6...",
      "Success: 120,400 bytes scraped.",
      "Extracting text tokens; density: 84%",
      "Buffer synced with Writer memory desk."
    ]
  },
  {
    phase: "03",
    name: "Writer",
    subName: "Synthesis",
    color: "gold",
    desc: "The Writer agent compiles the extracted facts, logs the bibliographic reference list, and drafts the initial thesis document.",
    logs: [
      "Writer session initiated.",
      "Consolidating 14 research vectors...",
      "Drafting Section 1: Clinical Observations",
      "Drafting Section 2: Methodological Review",
      "Generating bibliographies (MLA/IEEE formats)",
      "Initial report compiled (4,200 words)",
      "Draft sent to Critic agent desk."
    ]
  },
  {
    phase: "04",
    name: "Critic",
    subName: "Adversarial Audit",
    color: "terracotta",
    desc: "A Critic agent evaluates the draft, searches for cognitive biases, isolates unverified claims, and suggests counter-queries.",
    logs: [
      "Critic audit active (Red Team).",
      "Reviewing Section 1 for confirmation bias...",
      "Warning: Claim in line 42 lacks citation.",
      "Locating potential confounding variables...",
      "CRITIQUE ISSUED: Found 2 logical gaps.",
      "Refinement queries proposed to fill missing data."
    ]
  },
  {
    phase: "05",
    name: "Refiner",
    subName: "Refinement Loop",
    color: "gold",
    desc: "Executes secondary scraping runs to fill gaps identified by the Critic before outputting the final verified analysis.",
    logs: [
      "Refiner session started.",
      "Reading Critic critique reports...",
      "Executing secondary searches for gaps...",
      "Scraping additional 4 reference papers...",
      "Integrating updated research findings...",
      "Report finalized and audited. Engine Idle."
    ]
  }
];

export default function Home() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    openai: "",
    groq: "",
    gemini: "",
    mistral: "",
    tavily: ""
  });
  const [showKey, setShowKey] = useState({
    openai: false,
    groq: false,
    gemini: false,
    mistral: false,
    tavily: false
  });

  const [selectedCitationUrl, setSelectedCitationUrl] = useState<string | null>(null);
  const [showCitationInspector, setShowCitationInspector] = useState(false);

  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [showClaimInspector, setShowClaimInspector] = useState(false);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [showCritique, setShowCritique] = useState(true);
  const [showSources, setShowSources] = useState(true);
  const [activeTab, setActiveTab] = useState<"report" | "critique" | "sources">("report");
  const theme = "light";
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [activeAnatomyStep, setActiveAnatomyStep] = useState(0);
  const [demoStep, setDemoStep] = useState<"draft" | "critique" | "verdict">("draft");
  const [quoteIndex, setQuoteIndex] = useState(0);

  const logsEndRef = useRef<HTMLDivElement>(null);


  const hasInitiated = loading || logs.length > 0 || result || error;

  const quotesList = [
    { text: "Doubt is the origin of wisdom.", author: "RENÉ DESCARTES" },
    { text: "Simplicity is the ultimate sophistication.", author: "LEONARDO DA VINCI" },
    { text: "Measure what is measurable, and make measurable what is not.", author: "GALILEO GALILEI" },
    { text: "The noblest pleasure is the joy of understanding.", author: "LEONARDO DA VINCI" },
    { text: "Doubt everything at least once, even the statement: two times two makes four.", author: "GEORG CHRISTOPH LICHTENBERG" },
    { text: "We cannot teach people anything; we can only help them discover it within themselves.", author: "GALILEO GALILEI" }
  ];

  // Initialize theme as light
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  // Load API keys from localStorage on mount
  useEffect(() => {
    try {
      const savedKeys = localStorage.getItem("renaissance_api_keys");
      if (savedKeys) {
        setApiKeys(JSON.parse(savedKeys));
      }
    } catch (e) {
      console.error("Error loading API keys from localStorage:", e);
    }
  }, []);

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("renaissance_api_keys", JSON.stringify(apiKeys));
      setShowSettings(false);
    } catch (e) {
      console.error("Error saving API keys to localStorage:", e);
    }
  };

  // Slideshow & Quote interval timer
  useEffect(() => {
    if (hasInitiated) return;
    const interval = setInterval(() => {
      setSlideshowIndex((prev) => (prev + 1) % 3);
      setQuoteIndex((prev) => (prev + 1) % quotesList.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [hasInitiated]);

  // Load historical sessions from localStorage on mount and restore active session
  useEffect(() => {
    setLoadingSessions(true);
    try {
      const localData = localStorage.getItem("renaissance_sessions");
      if (localData) {
        const loadedSessions = JSON.parse(localData);
        setSessions(loadedSessions);
        
        const activeId = localStorage.getItem("renaissance_active_session_id");
        if (activeId) {
          const session = loadedSessions.find((s: any) => s.id === activeId);
          if (session) {
            setQuery(session.query);
            setResult({
              status: "success",
              report: session.report,
              critique: session.critique,
              sources: session.sources,
              skipped_sources: session.skipped_sources,
              source_contents: session.source_contents,
              claims: session.claims
            });
            setLogs([
              "Restored active research workspace from storage.",
              `Topic: "${session.query}"`
            ]);
            setActiveSessionId(activeId);
          }
        }
      }
    } catch (err) {
      console.error("Error loading saved sessions from localStorage:", err);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  // Auto save session when research pipeline completes
  useEffect(() => {
    if (result && result.status === "success" && !activeSessionId) {
      const alreadyExists = sessions.some(s => s.query.trim().toLowerCase() === query.trim().toLowerCase());
      if (!alreadyExists) {
        const newSession = {
          id: Math.random().toString(36).substring(2, 9),
          query: query,
          report: result.report,
          critique: result.critique,
          sources: result.sources,
          skipped_sources: result.skipped_sources,
          source_contents: result.source_contents,
          claims: result.claims,
          createdAt: {
            seconds: Math.floor(Date.now() / 1000)
          }
        };
        const updated = [newSession, ...sessions];
        setSessions(updated);
        localStorage.setItem("renaissance_sessions", JSON.stringify(updated));
        setActiveSessionId(newSession.id);
        localStorage.setItem("renaissance_active_session_id", newSession.id);
      }
    }
  }, [result, activeSessionId, sessions, query]);

  const loadSavedSession = (session: any) => {
    setQuery(session.query);
    setResult({
      status: "success",
      report: session.report,
      critique: session.critique,
      sources: session.sources,
      skipped_sources: session.skipped_sources,
      source_contents: session.source_contents,
      claims: session.claims
    });
    setLogs([
      "Loading research from library...",
      `Query: "${session.query}"`,
      "Successfully loaded saved report.",
      "Successfully loaded critic critique.",
      "Successfully loaded crawled urls. Audit complete."
    ]);
    setActiveSessionId(session.id);
    localStorage.setItem("renaissance_active_session_id", session.id);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this research report from your library?")) return;
    try {
      const updated = sessions.filter(s => s.id !== sessionId);
      setSessions(updated);
      localStorage.setItem("renaissance_sessions", JSON.stringify(updated));
      if (activeSessionId === sessionId) {
        resetWorkspace();
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  // Auto scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setLogs([]);
    setResult(null);
    setError(null);
    setActiveTab("report");

    try {
      let backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      if (backendUrl.endsWith("/api/research")) {
        backendUrl = backendUrl.substring(0, backendUrl.length - "/api/research".length);
      }
      if (backendUrl.endsWith("/")) {
        backendUrl = backendUrl.slice(0, -1);
      }
      const response = await fetch(`${backendUrl}/api/research`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query: searchQuery,
          api_keys: apiKeys
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body received from server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (!part.trim()) continue;

          const lines = part.split("\n");
          let eventType = "log";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.substring(7).trim();
            } else if (line.startsWith("data: ")) {
              dataStr = line.substring(6).trim();
            }
          }

          if (dataStr) {
            try {
              const parsedData = JSON.parse(dataStr);
              if (eventType === "log") {
                setLogs((prev) => [...prev, parsedData]);
              } else if (eventType === "result") {
                setResult(parsedData);
                setLoading(false);
              } else if (eventType === "error") {
                setError(parsedData);
                setLoading(false);
              }
            } catch (err) {
              console.error("Error parsing event stream payload:", err);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const selectSampleQuery = (q: string) => {
    setQuery(q);
    handleSearch(q);
  };
  const markdownComponents = {
    h1: ({children}: any) => <h1 className="font-serif text-2xl font-bold text-foreground mt-8 mb-4 border-b border-border-subtle pb-2">{children}</h1>,
    h2: ({children}: any) => <h2 className="font-serif text-xl font-semibold text-foreground mt-8 mb-4">{children}</h2>,
    h3: ({children}: any) => <h3 className="font-sans text-xs font-bold text-gold-dark tracking-wider uppercase mt-6 mb-2">{children}</h3>,
    p: ({children}: any) => <p className="mb-4 text-foreground/95 leading-relaxed font-normal">{children}</p>,
    ul: ({children}: any) => <ul className="list-disc pl-5 mb-5 space-y-2 text-foreground/90 font-normal">{children}</ul>,
    ol: ({children}: any) => <ol className="list-decimal pl-5 mb-5 space-y-2 text-foreground/90 font-normal">{children}</ol>,
    li: ({children}: any) => <li className="pl-1 text-foreground/90 font-normal">{children}</li>,
    strong: ({children}: any) => <strong className="font-bold text-foreground">{children}</strong>,
    code: ({children}: any) => <code className="font-mono text-xs bg-foreground/5 px-1 py-0.5 text-foreground">{children}</code>,
    blockquote: ({children}: any) => <blockquote className="border-l-2 border-gold pl-4 italic text-foreground/90 my-4 bg-gold/5 py-2 pr-2 font-normal">{children}</blockquote>,
    a: ({href, children}: any) => {
      console.log("[DEBUG markdownComponents.a] href received:", JSON.stringify(href));
      if (href && href.startsWith("cite:")) {
        const citeUrl = href.substring(5);
        console.log("[DEBUG cite] extracted URL:", JSON.stringify(citeUrl));
        return (
          <button
            type="button"
            onClick={() => {
              console.log("[DEBUG cite click] opening URL:", citeUrl);
              window.open(citeUrl, "_blank", "noopener,noreferrer");
            }}
            className="inline-flex items-center gap-0.5 text-xs text-gold hover:text-gold-dark hover:underline bg-gold/5 border border-gold/20 px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer"
          >
            {children}
          </button>
        );
      }
      if (href && href.startsWith("claim:")) {
        const claimId = href.substring(6);
        return (
          <span
            onClick={(e) => {
              e.preventDefault();
              setSelectedClaimId(claimId);
              setShowClaimInspector(true);
            }}
            className="inline decoration-dotted decoration-2 decoration-gold/80 hover:bg-gold/10 cursor-pointer transition-colors duration-200 font-medium px-0.5 rounded-sm border-b border-dashed border-gold/60 text-foreground"
            title="Click to audit this claim"
          >
            {children}
          </span>
        );
      }
      return (
        <a 
          className="text-foreground underline hover:text-gold transition-colors font-medium break-all" 
          target="_blank" 
          rel="noopener noreferrer" 
          href={href}
        >
          {children}
        </a>
      );
    }
  };

  const processReportText = (text: string) => {
    return text
      .replace(/^#\s+Research\s+Report/i, "")
      .replace(/^#\s+.*?\n/i, "")
      .replace(/\((Source|source):\s*(https?:\/\/[^\s)]+)\)/g, "([🔗 Cite](cite:$2))")
      .replace(/\[(Source|source):\s*(https?:\/\/[^\s\]]+)\]/g, "[[🔗 Cite](cite:$2)]")
      .replace(/<claim\s+id="([^"]+)"[^>]*>(.*?)<\/claim>/g, "[$2](claim:$1)");
  };

  const resetWorkspace = () => {
    setQuery("");
    setLogs([]);
    setResult(null);
    setError(null);
    setActiveSessionId(null);
    localStorage.removeItem("renaissance_active_session_id");
  };

  const sampleQueries = [
    "Does chronic cortisol elevation directly cause neurodegeneration in the hippocampus, or are there confounding factors?",
    "What is the true efficacy of mindfulness-based stress reduction (MBSR) programs when accounting for placebo and publication bias?",
    "Are the physiological effects of acute stress definitively linked to long-term autoimmune disease flare-ups?"
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-gold selection:text-background paper-texture flex flex-col justify-between transition-colors duration-300 relative">

      {/* Settings Floating Button */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-12 z-50">
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 bg-card/85 hover:bg-gold/10 backdrop-blur-md border border-border-custom px-4 py-2 text-xs uppercase tracking-widest font-bold text-foreground transition-all duration-300 cursor-pointer shadow-sm"
        >
          <Settings className="w-4 h-4 text-gold" />
          Settings
        </button>
      </div>

      {/* API Keys Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border-custom w-full max-w-lg p-6 sm:p-8 shadow-2xl relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar animate-fade-in">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-muted-custom hover:text-foreground transition-colors border-0 bg-transparent cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gold flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                Control Desk
              </div>
              <h2 className="font-serif text-2xl font-normal text-foreground">API Configuration</h2>
              <p className="text-xs text-muted-custom leading-relaxed font-light">
                Configure your own API keys. These are stored locally in your browser and are sent only to your Renaissance research backend.
              </p>
            </div>

            <form onSubmit={handleSaveKeys} className="flex flex-col gap-5">
              <div className="space-y-4 font-sans">
                {/* OpenAI Key */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-foreground">OpenAI API Key</label>
                  <div className="relative flex items-center">
                    <input
                      type={showKey.openai ? "text" : "password"}
                      value={apiKeys.openai}
                      onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                      placeholder="sk-..."
                      className="text-xs bg-background border border-border-custom pl-3 pr-10 py-2.5 w-full outline-none text-foreground placeholder:text-muted-custom/70 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey({ ...showKey, openai: !showKey.openai })}
                      className="absolute right-3 text-muted-custom hover:text-foreground transition-colors border-0 bg-transparent cursor-pointer"
                    >
                      {showKey.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[9px] text-muted-custom/85">Required for running GPT-4o-mini as a backup model.</span>
                </div>

                {/* Groq Key */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-foreground">Groq API Key</label>
                  <div className="relative flex items-center">
                    <input
                      type={showKey.groq ? "text" : "password"}
                      value={apiKeys.groq}
                      onChange={(e) => setApiKeys({ ...apiKeys, groq: e.target.value })}
                      placeholder="gsk_..."
                      className="text-xs bg-background border border-border-custom pl-3 pr-10 py-2.5 w-full outline-none text-foreground placeholder:text-muted-custom/70 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey({ ...showKey, groq: !showKey.groq })}
                      className="absolute right-3 text-muted-custom hover:text-foreground transition-colors border-0 bg-transparent cursor-pointer"
                    >
                      {showKey.groq ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[9px] text-muted-custom/85">Required for running the primary Llama-3.3-70b research agent.</span>
                </div>

                {/* Gemini Key */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-foreground">Gemini API Key</label>
                  <div className="relative flex items-center">
                    <input
                      type={showKey.gemini ? "text" : "password"}
                      value={apiKeys.gemini}
                      onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                      placeholder="AIzaSy..."
                      className="text-xs bg-background border border-border-custom pl-3 pr-10 py-2.5 w-full outline-none text-foreground placeholder:text-muted-custom/70 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey({ ...showKey, gemini: !showKey.gemini })}
                      className="absolute right-3 text-muted-custom hover:text-foreground transition-colors border-0 bg-transparent cursor-pointer"
                    >
                      {showKey.gemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[9px] text-muted-custom/85">Required for running Gemini-1.5-flash fallback agent.</span>
                </div>

                {/* Mistral Key */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-foreground">Mistral API Key</label>
                  <div className="relative flex items-center">
                    <input
                      type={showKey.mistral ? "text" : "password"}
                      value={apiKeys.mistral}
                      onChange={(e) => setApiKeys({ ...apiKeys, mistral: e.target.value })}
                      placeholder="your-key..."
                      className="text-xs bg-background border border-border-custom pl-3 pr-10 py-2.5 w-full outline-none text-foreground placeholder:text-muted-custom/70 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey({ ...showKey, mistral: !showKey.mistral })}
                      className="absolute right-3 text-muted-custom hover:text-foreground transition-colors border-0 bg-transparent cursor-pointer"
                    >
                      {showKey.mistral ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[9px] text-muted-custom/85">Optional fallback for Mistral Large models.</span>
                </div>

                {/* Tavily Key */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-foreground">Tavily API Key</label>
                  <div className="relative flex items-center">
                    <input
                      type={showKey.tavily ? "text" : "password"}
                      value={apiKeys.tavily}
                      onChange={(e) => setApiKeys({ ...apiKeys, tavily: e.target.value })}
                      placeholder="tvly-..."
                      className="text-xs bg-background border border-border-custom pl-3 pr-10 py-2.5 w-full outline-none text-foreground placeholder:text-muted-custom/70 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey({ ...showKey, tavily: !showKey.tavily })}
                      className="absolute right-3 text-muted-custom hover:text-foreground transition-colors border-0 bg-transparent cursor-pointer"
                    >
                      {showKey.tavily ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[9px] text-muted-custom/85">Required for web search capability.</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t border-border-subtle pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="text-[10px] uppercase tracking-widest font-bold border border-border-custom hover:border-foreground px-4 py-2.5 transition-all duration-300 cursor-pointer bg-transparent text-muted-custom hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-[10px] uppercase tracking-widest font-bold bg-foreground text-background hover:bg-gold hover:text-background px-5 py-2.5 transition-all duration-300 cursor-pointer border-0"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Immersive Baroque Ceiling Fresco Background */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.25] dark:opacity-[0.14] bg-[url('/baroque_ceiling_fresco.png')] bg-cover bg-center bg-no-repeat mix-blend-multiply dark:mix-blend-normal transition-opacity duration-300"
        style={{ filter: "sepia(0.08) contrast(1.05)" }}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center relative z-10">
        
        {!hasInitiated ? (
          /* Landing Screen (Awaiting Inquiry) */
          <div className="max-w-[1100px] mx-auto w-full px-6 py-10 sm:py-16 flex flex-col items-center justify-center">
            
            {/* Inline keyframe definitions for the quote transitions */}
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(4px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in {
                animation: fadeIn 0.6s ease-out forwards;
              }
            `}</style>

            {/* Centered Branding, Form & Catalyst Queries */}
            <div className="w-full flex flex-col gap-8 items-center text-center">
              <div className="flex flex-col gap-4 items-center">
                <div
                  className="text-5xl sm:text-6xl font-normal tracking-normal cursor-pointer leading-tight"
                  style={{ fontFamily: "var(--font-signature)" }}
                  onClick={resetWorkspace}
                >
                  Renaissance
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/15 text-gold-dark text-[10px] font-bold uppercase tracking-widest rounded-none border border-gold/30">
                  <Cpu className="w-3.5 h-3.5" />
                  Doubt-Driven Research Assistant
                </div>
                <h1 className="text-5xl sm:text-6xl font-normal leading-[1.1] tracking-normal text-center animate-fade-in" style={{ fontFamily: "var(--font-signature)" }}>
                  The search engine that <br />
                  doubts itself.
                </h1>
                <p className="text-sm text-foreground/90 font-normal max-w-xl leading-relaxed mt-2 mx-auto font-light">
                  Most AI search engines suffer from confirmation bias—they only find evidence that supports your query. Renaissance is different: it researches your topic, writes a draft, conducts an adversarial critique on its own work, and hunts for the contrarian facts other AIs miss.
                </p>
              </div>

              {/* Inquiry Input Box */}
              <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full max-w-4xl">
                <div className="editorial-border bg-card p-3 shadow-md flex flex-col gap-2 transition-colors duration-300">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-custom px-2 pt-1">
                    <Search className="w-3.5 h-3.5" />
                    State your inquiry
                  </div>
                  <div className="relative flex items-end">
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g., 'Is there empirical evidence supporting the physiological benefits of cold water immersion?'"
                      className="w-full min-h-[90px] px-2 py-1 bg-transparent text-foreground focus:outline-none font-serif text-lg placeholder:text-muted-custom/70 resize-none leading-relaxed text-left"
                    />
                    <button
                      type="submit"
                      disabled={!query.trim()}
                      className="bg-foreground hover:bg-terracotta disabled:bg-neutral-300 text-background p-3 transition-all duration-300 cursor-pointer flex items-center justify-center shrink-0 self-end mb-1 mr-1"
                      title="Begin Investigation"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </form>

              {/* Inquiry Catalysts (Templates) */}
              <div className="flex flex-col gap-3 w-full max-w-4xl">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-custom/85 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-gold" />
                  Inquiry Catalysts (Click to investigate)
                </div>
                <div className="flex flex-col gap-2">
                  {sampleQueries.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectSampleQuery(q)}
                      className="group flex justify-between items-center text-left text-xs bg-card hover:bg-gold/10 border border-border-custom p-3 transition-all duration-300 shadow-sm cursor-pointer"
                    >
                      <span className="font-serif text-sm text-foreground/90 group-hover:text-foreground transition-colors pr-4">
                        "{q}"
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-gold group-hover:text-terracotta transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Stepper & Comparison Grid */}
              <div className="w-full max-w-4xl mt-12 flex flex-col gap-10 text-left">
                
                {/* Stepper (The Magic Trick) */}
                <div className="flex flex-col gap-5 border border-border-custom bg-card/25 p-6 shadow-sm">
                  <div className="flex flex-col gap-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gold">Case Study in Action</div>
                    <h2 className="font-serif text-xl font-normal text-foreground">The Self-Skeptical Method</h2>
                    <p className="text-xs text-muted-custom leading-relaxed">
                      Watch how Renaissance cross-examines its own research. Select a step below to see how it resolves confirmation bias on the question: 
                      <span className="italic font-medium text-foreground/90"> "Is dark chocolate actually beneficial for cardiovascular health?"</span>
                    </p>
                  </div>

                  {/* Steps Navigation */}
                  <div className="grid grid-cols-3 gap-2 border border-border-custom bg-card/50 p-1 mt-2">
                    <button
                      type="button"
                      onClick={() => setDemoStep("draft")}
                      className={`py-3 px-2 text-center flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 ${
                        demoStep === "draft" 
                          ? "bg-foreground text-background font-bold shadow-sm" 
                          : "text-muted-custom hover:text-foreground hover:bg-foreground/5"
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-widest font-mono font-semibold opacity-75">Step 01</span>
                      <span className="text-xs font-serif font-normal">Initial Draft</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoStep("critique")}
                      className={`py-3 px-2 text-center flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 ${
                        demoStep === "critique" 
                          ? "bg-terracotta text-white font-bold shadow-sm" 
                          : "text-muted-custom hover:text-foreground hover:bg-foreground/5"
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-widest font-mono font-semibold opacity-75">Step 02</span>
                      <span className="text-xs font-serif font-normal text-terracotta">Critic Audit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoStep("verdict")}
                      className={`py-3 px-2 text-center flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 ${
                        demoStep === "verdict" 
                          ? "bg-gold text-background font-bold shadow-sm" 
                          : "text-muted-custom hover:text-foreground hover:bg-foreground/5"
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-widest font-mono font-semibold opacity-75">Step 03</span>
                      <span className="text-xs font-serif font-normal text-gold-dark">Refined Verdict</span>
                    </button>
                  </div>

                  {/* Step Content Card */}
                  <div className="bg-card border border-border-custom p-6 min-h-[220px] transition-all duration-300 flex flex-col justify-between shadow-sm relative overflow-hidden">
                    
                    {demoStep === "draft" && (
                      <div className="animate-fade-in flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                          <div className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 border border-blue-200">
                            Standard AI Output (Confirmatory Bias)
                          </div>
                          <span className="text-[10px] font-mono text-muted-custom">Hypothesis: Positive</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <h4 className="font-serif text-lg text-foreground font-normal">"Yes, dark chocolate improves heart health by lowering blood pressure due to flavanols."</h4>
                          <p className="text-xs text-foreground/90 leading-relaxed font-light">
                            Dark chocolate is rich in flavanols (especially epicatechin), which stimulate nitric oxide production in blood vessels, causing vasodilation and reduced blood pressure. Dozens of published randomized trials confirm flavanols reduce cardiovascular risk.
                          </p>
                        </div>
                        <div className="text-[10px] text-amber-700 bg-amber-50 p-2 border border-amber-200/50 mt-2 font-mono">
                          ⚠️ Flaw: Immediately accepts positive findings; ignores study duration, funding source, and caloric offset.
                        </div>
                      </div>
                    )}

                    {demoStep === "critique" && (
                      <div className="animate-fade-in flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-terracotta/20 pb-3">
                          <div className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-terracotta bg-terracotta/5 px-2 py-0.5 border border-terracotta/20">
                            Red-Team Critique (Skeptical Engine)
                          </div>
                          <span className="text-[10px] font-mono text-terracotta">Audit Result: 2 Gaps Found</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <h4 className="font-serif text-lg text-terracotta font-normal">"Flaw detected: Surrogate endpoint fixation, selection bias, and industry funding conflicts."</h4>
                          <p className="text-xs text-foreground/85 leading-relaxed font-light italic">
                            Critique: The cited studies are short-term (average 2–12 weeks) and measure surrogate markers (e.g., blood pressure, FMD) rather than actual clinical endpoints (heart attacks, mortality). 70% of trials were funded by major chocolate manufacturers (e.g., Mars, Inc.). Caloric density and sugar offsets are completely ignored.
                          </p>
                        </div>
                        <div className="text-[10px] text-terracotta bg-terracotta/5 p-2 border border-terracotta/15 mt-2 font-mono">
                          🔥 Action: Triggering targeted fallback search for long-term health outcomes and industry funding bias.
                        </div>
                      </div>
                    )}

                    {demoStep === "verdict" && (
                      <div className="animate-fade-in flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-gold/20 pb-3">
                          <div className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-gold-dark bg-gold/10 px-2 py-0.5 border border-gold/30">
                            Nuanced Refined Verdict (The Reality)
                          </div>
                          <span className="text-[10px] font-mono text-gold-dark font-semibold">Confidence: Medium-Low</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <h4 className="font-serif text-lg text-foreground font-normal">"Marginally positive for temporary surrogate markers, but zero evidence for long-term heart disease reduction."</h4>
                          <p className="text-xs text-foreground/90 leading-relaxed font-light">
                            While dark chocolate causes temporary, modest reductions in blood pressure, there is zero clinical evidence that eating it prevents actual cardiovascular events or mortality. Caloric offset from sugar and fat makes it a neutral-to-negative lifestyle addition unless strictly portion-controlled.
                          </p>
                        </div>
                        <div className="text-[10px] text-emerald-800 bg-emerald-50 p-2 border border-emerald-200/50 mt-2 font-mono">
                          ✅ Outcome: Exposes the exact limits of science instead of generating a biased summary.
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Comparison Section (Renaissance vs. Deep Research) */}
                <div className="flex flex-col gap-5 mt-4">
                  <div className="flex flex-col gap-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gold">Direct Comparison</div>
                    <h2 className="font-serif text-xl font-normal text-foreground">Why Renaissance?</h2>
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      Unlike traditional search bots that fetch pages matching your query terms, Renaissance uses an adversarial loop built to challenge assumptions.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card border border-border-custom p-6 shadow-sm flex flex-col gap-4 transition-colors duration-300">
                      <h3 className="font-serif text-base text-foreground/90 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
                        ChatGPT + Deep Research
                      </h3>
                      <ul className="text-xs space-y-3 text-foreground/90 font-normal">
                        <li className="flex gap-2 items-start">
                          <span className="text-red-500 font-bold font-mono">✗</span>
                          <span><strong>Confirmation Bias</strong>: Focuses search and summaries on <strong>proving</strong> your query statement correct.</span>
                        </li>
                        <li className="flex gap-2 items-start">
                          <span className="text-red-500 font-bold font-mono">✗</span>
                          <span><strong>Consensus Fixation</strong>: Ignores conflicting study data in favor of writing a smooth, high-level summary.</span>
                        </li>
                        <li className="flex gap-2 items-start">
                          <span className="text-red-500 font-bold font-mono">✗</span>
                          <span><strong>Absolute Certainty</strong>: Writes reports in an authoritative tone, hiding gaps and unknowns.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-card border border-gold/30 p-6 shadow-sm flex flex-col gap-4 transition-colors duration-300 bg-gold/[0.02]">
                      <h3 className="font-serif text-base text-gold-dark font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gold"></span>
                        Renaissance
                      </h3>
                      <ul className="text-xs space-y-3 text-foreground/90 font-normal">
                        <li className="flex gap-2 items-start">
                          <span className="text-gold font-bold font-mono">✓</span>
                          <span><strong>Self-Skeptical Search</strong>: Specifically designs search queries to look for contrarian facts and counterarguments.</span>
                        </li>
                        <li className="flex gap-2 items-start">
                          <span className="text-gold font-bold font-mono">✓</span>
                          <span><strong>Adversarial Audit</strong>: Runs an independent critic loop to call out logical leaps and funding conflicts.</span>
                        </li>
                        <li className="flex gap-2 items-start">
                          <span className="text-gold font-bold font-mono">✓</span>
                          <span><strong>Calibrated Confidence</strong>: Formulates what is strictly known vs. unknown and states exactly what triggers would change its mind.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        ) : (
          /* Active Investigation Workspace */
          <div className="max-w-[1600px] mx-auto w-full px-6 py-6 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10">
            
            {/* Left Side: Agent Dashboard (Search Input, Logs, Sources) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Inquiry Status Card */}
              <div className="bg-card border border-border-custom p-5 shadow-sm flex flex-col gap-4 transition-colors duration-300">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-custom">
                    Active Investigation
                  </div>
                  {loading ? (
                    <span className="text-[9px] bg-gold/20 text-gold-dark border border-gold/30 px-2 py-0.5 uppercase tracking-widest font-bold animate-pulse">
                      Analyzing Web
                    </span>
                  ) : error ? (
                    <span className="text-[9px] bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 px-2 py-0.5 uppercase tracking-widest font-bold">
                      Failed
                    </span>
                  ) : (
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 px-2 py-0.5 uppercase tracking-widest font-bold">
                      Audited
                    </span>
                  )}
                </div>
                
                <div className="font-serif text-base text-foreground leading-relaxed">
                  "{query}"
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={resetWorkspace}
                    className="text-xs uppercase tracking-wider font-semibold text-gold hover:text-gold-dark transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    ← Back to Desk
                  </button>
                </div>
              </div>

              {/* Investigation Terminal Logs */}
              <div className="bg-[#1A1A1A] dark:bg-[#0D0F12] text-[#FAF8F5] dark:text-[#E2DFDA] p-5 shadow-xl editorial-border relative overflow-hidden flex flex-col gap-4 transition-colors duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-radial-gradient from-gold/10 to-transparent pointer-events-none" />
                
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60 dark:text-[#E2DFDA]/60">
                    <TerminalIcon className="w-3.5 h-3.5 text-gold" />
                    Verification Logs
                  </div>
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />}
                </div>

                <div className="h-[260px] overflow-y-auto font-mono text-[10.5px] leading-relaxed space-y-2 pr-2 custom-scrollbar text-white/85 dark:text-[#E2DFDA]/85">
                  {logs.map((log, idx) => {
                    let isDone = log.includes("Success") || log.includes("complete") || log.includes("updated");
                    let isError = log.includes("❌") || log.includes("Error") || log.includes("failed");
                    let isStep = log.includes("STEP") || log.includes("====");
                    
                    return (
                      <div 
                        key={idx} 
                        className={`whitespace-pre-wrap transition-all duration-300 border-l pl-2 ${
                          isStep 
                            ? "font-bold text-white dark:text-[#E2DFDA] border-gold mt-3" 
                            : isError 
                            ? "text-terracotta border-terracotta bg-terracotta/5 p-1" 
                            : isDone 
                            ? "text-emerald-400 border-emerald-500" 
                            : "text-white/60 dark:text-[#E2DFDA]/60 border-white/10"
                        }`}
                      >
                        {log}
                      </div>
                    );
                  })}
                  
                  {loading && logs.length === 0 && (
                    <div className="text-white/40 italic animate-pulse">
                      Spawning planning agents, formulating search indices...
                    </div>
                  )}

                  {error && (
                    <div className="flex gap-2 items-start text-terracotta border-l border-terracotta pl-2 bg-terracotta/5 p-2 font-sans text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">Execution Fault</div>
                        <div className="font-mono text-[9px] mt-1">{error}</div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={logsEndRef} />
                </div>
              </div>

              {/* Research Library List (Sidebar) */}
              <div className="bg-card border border-border-custom p-5 shadow-sm flex flex-col gap-4 transition-colors duration-300">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-custom flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-gold" />
                    Research Library ({sessions.length})
                  </div>
                </div>
                
                {loadingSessions ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-gold" />
                  </div>
                ) : sessions.length > 0 ? (
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => loadSavedSession(session)}
                        className={`group flex justify-between items-center text-left text-xs p-2.5 border transition-all duration-300 shadow-sm cursor-pointer ${
                          activeSessionId === session.id
                            ? "bg-gold/10 border-gold"
                            : "bg-card hover:bg-gold/5 border-border-custom"
                        }`}
                      >
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1 pr-2">
                          <span className="font-serif text-xs text-foreground/90 font-medium truncate group-hover:text-foreground">
                            {session.query}
                          </span>
                          <span className="text-[8px] text-muted-custom font-mono">
                            {session.createdAt ? new Date(session.createdAt.seconds * 1000).toLocaleDateString() : "Just now"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(e, session.id!)}
                          className="opacity-0 group-hover:opacity-100 hover:text-terracotta text-muted-custom p-1 transition-opacity duration-300"
                          title="Delete from Library"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-custom/80 italic font-light text-center py-4">
                    Your library is empty. Run queries to save them.
                  </p>
                )}
              </div>

              {/* Mobile Tab Selectors for Right Side (only visible on mobile/tablet) */}
              <div className="flex border border-border-custom bg-card p-1 lg:hidden transition-colors duration-300">
                <button
                  onClick={() => setActiveTab("report")}
                  className={`flex-1 text-center py-2 text-xs font-semibold uppercase tracking-wider ${activeTab === "report" ? "bg-foreground text-background" : "text-muted-custom"}`}
                >
                  Report
                </button>
                <button
                  onClick={() => setActiveTab("critique")}
                  className={`flex-1 text-center py-2 text-xs font-semibold uppercase tracking-wider ${activeTab === "critique" ? "bg-foreground text-background" : "text-muted-custom"}`}
                >
                  Critique
                </button>
                <button
                  onClick={() => setActiveTab("sources")}
                  className={`flex-1 text-center py-2 text-xs font-semibold uppercase tracking-wider ${activeTab === "sources" ? "bg-foreground text-background" : "text-muted-custom"}`}
                >
                  Sources
                </button>
              </div>
            </div>

            {/* Right Side: Primary Results Desk (Report, Critique, Sources) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {loading && !result ? (
                <div className="flex-1 min-h-[500px] flex flex-col items-center justify-center bg-card border border-border-custom p-12 text-center shadow-sm transition-colors duration-300">
                  <div className="relative w-16 h-16 flex items-center justify-center mb-6">
                    <Loader2 className="w-12 h-12 animate-spin text-gold" />
                    <div className="absolute inset-0 rounded-full border border-dashed border-border-custom animate-reverse-spin" />
                  </div>
                  <h3 className="font-serif text-2xl italic">Synthesizing Live Evidence</h3>
                  <p className="text-xs text-muted-custom mt-3 max-w-sm leading-relaxed font-light">
                    Consulting multiple search routes, scraping text extracts, analyzing evidence density, and auditing logical coherence using adversarial checks.
                  </p>
                </div>
              ) : result ? (
                <div className="flex flex-col gap-6">
                  
                  {/* Desktop Tab Selector (Horizontal tabs) */}
                  <div className="hidden lg:flex border border-border-custom bg-card p-1 transition-colors duration-300">
                    <button
                      onClick={() => setActiveTab("report")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-200 border-0 cursor-pointer ${
                        activeTab === "report" 
                          ? "bg-foreground text-background" 
                          : "text-muted-custom hover:text-foreground hover:bg-foreground/[0.02]"
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Investigation Report
                    </button>
                    <button
                      onClick={() => setActiveTab("critique")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-200 border-0 cursor-pointer ${
                        activeTab === "critique" 
                          ? "bg-foreground text-background" 
                          : "text-muted-custom hover:text-foreground hover:bg-foreground/[0.02]"
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-terracotta" />
                      Adversarial Audit &amp; Critique
                    </button>
                    <button
                      onClick={() => setActiveTab("sources")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-200 border-0 cursor-pointer ${
                        activeTab === "sources" 
                          ? "bg-foreground text-background" 
                          : "text-muted-custom hover:text-foreground hover:bg-foreground/[0.02]"
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-gold" />
                      Literature &amp; Sources ({result.sources.length + result.skipped_sources.length})
                    </button>
                  </div>

                  {/* Desktop Layout - Conditionally display panel based on activeTab */}
                  <div className="hidden lg:grid grid-cols-1 gap-6">
                    
                    {/* Primary Report */}
                    {activeTab === "report" && (
                      <article className="bg-card border border-border-custom p-8 sm:p-12 shadow-sm relative transition-colors duration-300 min-h-[500px]">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-no-repeat pointer-events-none" style={{ backgroundImage: "linear-gradient(135deg, transparent 50%, rgba(197, 168, 128, 0.08) 50%)" }} />
                        
                        <div className="flex flex-col gap-3 border-b border-border-subtle pb-6 mb-8">
                          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-gold-dark uppercase">
                            <BookOpen className="w-3.5 h-3.5 text-gold" />
                            Investigation Report
                          </div>
                          <h2 className="font-serif text-3xl sm:text-4xl font-normal leading-tight">
                            {result.report.split("\n")[2]?.replace("#", "").replace(/\*\*/g, "").trim() || "Analysis Findings"}
                          </h2>
                        </div>

                        <div className="prose prose-neutral max-w-none text-foreground text-[15px] leading-relaxed dark:prose-invert max-h-[550px] overflow-y-auto pr-4 font-normal">
                          <ReactMarkdown components={markdownComponents}>
                            {processReportText(result.report)}
                          </ReactMarkdown>
                        </div>
                      </article>
                    )}

                    {/* Adversarial Critique (Red Team) */}
                    {activeTab === "critique" && (
                      <div className="bg-card border border-terracotta/25 shadow-sm overflow-hidden transition-colors duration-300 min-h-[500px]">
                        <div className="bg-terracotta/5 border-b border-terracotta/15 px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-terracotta">
                            <ShieldAlert className="w-4 h-4" />
                            Adversarial Audit &amp; Gap Critique
                          </div>
                          <span className="text-[9px] bg-terracotta/10 text-terracotta px-2 py-0.5 font-mono uppercase tracking-widest font-semibold">
                            RED TEAM CHECK
                          </span>
                        </div>
                        <div className="p-6 sm:p-8 text-[15px] sm:text-base font-serif italic text-foreground bg-terracotta/[0.01] leading-relaxed whitespace-pre-wrap max-h-[550px] overflow-y-auto pr-4 custom-scrollbar font-normal">
                          {result.critique}
                        </div>
                      </div>
                    )}

                    {/* Sources Audited */}
                    {activeTab === "sources" && (
                      <div className="bg-card border border-border-custom shadow-sm overflow-hidden transition-colors duration-300 min-h-[500px]">
                        <div className="bg-foreground/5 border-b border-border-subtle px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-custom">
                            <LinkIcon className="w-4 h-4 text-gold" />
                            Investigated Literature &amp; URLs ({result.sources.length + result.skipped_sources.length})
                          </div>
                        </div>
                        <div className="p-6 bg-card flex flex-col gap-6 text-xs transition-colors duration-300 max-h-[550px] overflow-y-auto pr-4 custom-scrollbar">
                          {/* Successful */}
                          <div>
                            <h4 className="font-bold text-gold-dark mb-3 uppercase tracking-widest text-[9px] flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Successfully Scraped &amp; Ingested
                            </h4>
                            {result.sources.length > 0 ? (
                              <ul className="space-y-2">
                                {result.sources.map((src, i) => (
                                  <li key={i} className="flex gap-2 items-center">
                                    <a href={src} target="_blank" rel="noopener noreferrer" className="text-foreground/85 hover:text-foreground hover:underline break-all font-mono text-[11px] bg-foreground/[0.02] px-2 py-1 border border-border-custom flex-1">
                                      {src}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted-custom italic font-light">No full pages scraped.</p>
                            )}
                          </div>

                          {/* Failed / Skipped */}
                          {result.skipped_sources.length > 0 && (
                            <div className="border-t border-border-subtle pt-4">
                              <h4 className="font-bold text-terracotta mb-2 uppercase tracking-widest text-[9px] flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-terracotta" />
                                Skipped / Connection Failed
                              </h4>
                              <p className="text-[10.5px] text-muted-custom/90 leading-relaxed font-light mb-3 italic bg-terracotta/[0.02] p-2 border border-terracotta/10">
                                💡 <strong>Note:</strong> Automated crawlers can sometimes be blocked by firewalls or cloudflare protection even if the site is working. We advise verifying the source manually by clicking the link.
                              </p>
                              <ul className="space-y-2">
                                {result.skipped_sources.map(([url, reason], i) => (
                                  <li key={i} className="flex flex-col md:flex-row gap-1 md:items-center bg-terracotta/5 p-2 border border-terracotta/10">
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-muted-custom hover:text-foreground underline break-all font-mono text-[11px] flex-1">
                                      {url}
                                    </a>
                                    <span className="text-[10px] text-terracotta font-mono italic px-2 flex-1 break-words">
                                      [{reason}]
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Mobile Layout - Switched via Tabs */}
                  <div className="lg:hidden">
                    {activeTab === "report" && (
                      <article className="bg-card border border-border-custom p-6 shadow-sm">
                        <div className="flex flex-col gap-2 border-b border-border-subtle pb-4 mb-6">
                          <h2 className="font-serif text-2xl font-normal leading-tight">
                            {result.report.split("\n")[2]?.replace("#", "").replace(/\*\*/g, "").trim() || "Analysis Findings"}
                          </h2>
                        </div>
                        <div className="prose prose-neutral max-w-none text-foreground text-[14px] leading-relaxed dark:prose-invert font-normal">
                          <ReactMarkdown components={markdownComponents}>
                            {processReportText(result.report)}
                          </ReactMarkdown>
                        </div>
                      </article>
                    )}

                    {activeTab === "critique" && (
                      <div className="bg-card border border-terracotta/20 shadow-sm p-6">
                        <h3 className="font-bold text-xs uppercase text-terracotta tracking-wider mb-4 flex items-center gap-1.5 border-b border-terracotta/10 pb-2">
                          <ShieldAlert className="w-4 h-4" />
                          Red Team Critique
                        </h3>
                        <div className="prose prose-neutral max-w-none text-foreground text-[14.5px] leading-relaxed dark:prose-invert font-normal">
                          <ReactMarkdown components={markdownComponents}>
                            {processReportText(result.critique)}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {activeTab === "sources" && (
                      <div className="bg-card border border-border-custom shadow-sm p-6 flex flex-col gap-5 text-xs">
                        <div>
                          <h4 className="font-bold text-gold-dark mb-3 uppercase tracking-widest text-[9px] flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            Successfully Scraped
                          </h4>
                          <ul className="space-y-2">
                            {result.sources.map((src, i) => (
                              <li key={i} className="flex gap-2">
                                <a href={src} target="_blank" rel="noopener noreferrer" className="text-foreground/85 hover:text-foreground underline break-all font-mono text-[10px]">
                                  {src}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {result.skipped_sources.length > 0 && (
                          <div className="border-t border-border-subtle pt-4">
                            <h4 className="font-bold text-terracotta mb-2 uppercase tracking-widest text-[9px] flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-terracotta" />
                              Skipped / Failed
                            </h4>
                            <p className="text-[10px] text-muted-custom/90 leading-relaxed font-light mb-3 italic bg-terracotta/[0.02] p-2 border border-terracotta/10">
                              💡 <strong>Note:</strong> Automated crawlers can sometimes be blocked by firewalls or cloudflare protection even if the site is working. We advise verifying the source manually by clicking the link.
                            </p>
                            <ul className="space-y-2">
                              {result.skipped_sources.map(([url, reason], i) => (
                                <li key={i} className="flex flex-col bg-terracotta/5 p-2 border border-terracotta/10">
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-muted-custom hover:text-foreground underline break-all font-mono text-[10px]">
                                    {url}
                                  </a>
                                  <span className="text-[9px] text-terracotta font-mono italic mt-1">
                                    Reason: {reason}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                </div>
              ) : (
                /* Fallback empty workspace */
                <div className="flex-1 min-h-[500px] flex flex-col items-center justify-center border border-dashed border-border-custom p-12 text-center bg-card/40">
                  <HelpCircle className="w-8 h-8 text-gold mb-4" />
                  <h3 className="font-serif text-lg text-muted-custom/80">Awaiting Inquiry</h3>
                  <p className="text-xs text-muted-custom/80 mt-2 max-w-xs leading-relaxed font-light">
                    Submit a query to trigger the research agent workspace.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Interactive Process Anatomy Section (Visible on landing page) */}
      {!hasInitiated && (
        <section className="bg-card border-t border-b border-border-custom py-16 px-6 sm:px-12 w-full transition-colors duration-300 relative z-10">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-12">
            <div className="flex flex-col gap-2 max-w-xl">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gold">
                Cognitive Pipeline Spec
              </div>
              <h2 className="text-4xl font-normal" style={{ fontFamily: "var(--font-signature)" }}>
                Anatomy of an Investigation
              </h2>
              <p className="text-xs text-foreground/90 leading-relaxed font-normal">
                Traditional AI query pipelines generate naive answers immediately. Renaissance executes an iterative, adversarial cycle to assure data precision.
              </p>
            </div>

            {/* Split Layout: Interactive Steps List (Left) + Sandbox Terminal (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Left Column: Interactive Steps List */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {stepDetails.map((step, idx) => {
                  const isActive = activeAnatomyStep === idx;
                  const borderClass = step.color === "terracotta"
                    ? (isActive ? "border-terracotta bg-terracotta/5 dark:bg-terracotta/5" : "border-terracotta/20 hover:border-terracotta/50")
                    : (isActive ? "border-gold bg-gold/5 dark:bg-gold/5" : "border-border-custom hover:border-gold/30");
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveAnatomyStep(idx)}
                      onMouseEnter={() => setActiveAnatomyStep(idx)}
                      className={`editorial-border p-5 shadow-sm flex items-start gap-4 cursor-pointer transition-all duration-300 ${borderClass}`}
                    >
                      <div className={`text-3xl font-sans font-extralight tracking-tight ${step.color === "terracotta" ? "text-terracotta" : "text-gold"}`}>
                        {step.phase}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider">{step.name}</h4>
                          <span className="text-[8px] font-mono text-foreground/70 uppercase">({step.subName})</span>
                        </div>
                        <p className="text-[11px] text-foreground/90 leading-relaxed font-normal mt-1">
                          {step.desc}
                        </p>
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full self-center ${isActive ? (step.color === "terracotta" ? "bg-terracotta" : "bg-gold") : "bg-transparent"} transition-all duration-300`} />
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Sandbox Terminal Console */}
              <div className="lg:col-span-5 bg-[#121518] dark:bg-[#090B0D] text-[#E2DFDA] border border-[#C5A880]/30 shadow-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[420px] transition-colors duration-300">
                {/* Vintage grid paper effect inside terminal */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#C5A880_1px,transparent_1px)] bg-[size:16px_16px]" />
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3 z-10">
                  <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-[#E2DFDA]/65">
                    <span className="w-2 h-2 rounded-full bg-terracotta animate-pulse" />
                    AGENTS_DESK_SIMULATION://{stepDetails[activeAnatomyStep].name.toUpperCase()}
                  </div>
                  <div className="text-[8px] font-mono text-gold uppercase font-bold tracking-widest">
                    ACTIVE MONITOR
                  </div>
                </div>

                {/* Agent SVG schematic illustration representation */}
                <div className="w-full h-[160px] border border-white/5 bg-black/25 flex items-center justify-center relative overflow-hidden z-10 my-3">
                  {/* Grid overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
                  
                  {activeAnatomyStep === 0 && (
                    /* Planner diagram: Central query branching */
                    <svg className="w-full h-full p-2" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="150" cy="75" r="12" stroke="var(--gold)" strokeWidth="1.5" fill="none" />
                      <circle cx="150" cy="75" r="4" fill="var(--gold)" />
                      
                      <line x1="150" y1="75" x2="60" y2="40" stroke="#E2DFDA" strokeWidth="0.75" strokeDasharray="3 3" />
                      <line x1="150" y1="75" x2="240" y2="40" stroke="#E2DFDA" strokeWidth="0.75" strokeDasharray="3 3" />
                      <line x1="150" y1="75" x2="150" y2="120" stroke="#E2DFDA" strokeWidth="0.75" strokeDasharray="3 3" />
                      
                      <circle cx="60" cy="40" r="6" stroke="var(--gold)" strokeWidth="1" fill="none" />
                      <circle cx="240" cy="40" r="6" stroke="var(--gold)" strokeWidth="1" fill="none" />
                      <circle cx="150" cy="120" r="6" stroke="var(--gold)" strokeWidth="1" fill="none" />
                      
                      <text x="60" y="25" fill="#E2DFDA" opacity="0.6" fontSize="7" fontFamily="monospace" textAnchor="middle">Query: Clinical trials</text>
                      <text x="240" y="25" fill="#E2DFDA" opacity="0.6" fontSize="7" fontFamily="monospace" textAnchor="middle">Query: Mechanism</text>
                      <text x="150" y="135" fill="#E2DFDA" opacity="0.6" fontSize="7" fontFamily="monospace" textAnchor="middle">Query: Meta-analyses</text>
                      
                      <path d="M 100,75 A 50,50 0 0,1 200,75" stroke="var(--terracotta)" strokeWidth="0.75" fill="none" strokeDasharray="5 2" />
                    </svg>
                  )}

                  {activeAnatomyStep === 1 && (
                    /* Crawler diagram: scrolling network/targets */
                    <svg className="w-full h-full p-2" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
                      <line x1="20" y1="75" x2="280" y2="75" stroke="#E2DFDA" strokeWidth="0.5" opacity="0.2" />
                      <path d="M 30,30 Q 80,120 150,50 T 270,120" stroke="var(--gold)" strokeWidth="1.5" fill="none" className="animated-dash" />
                      
                      <rect x="50" y="90" width="45" height="15" stroke="var(--gold)" strokeWidth="1" fill="none" />
                      <text x="72" y="100" fill="#E2DFDA" fontSize="6" fontFamily="monospace" textAnchor="middle">PUBMED</text>
                      
                      <rect x="132" y="30" width="45" height="15" stroke="var(--gold)" strokeWidth="1" fill="none" />
                      <text x="154" y="40" fill="#E2DFDA" fontSize="6" fontFamily="monospace" textAnchor="middle">NATURE</text>
                      
                      <rect x="210" y="100" width="45" height="15" stroke="var(--gold)" strokeWidth="1" fill="none" />
                      <text x="232" y="110" fill="#E2DFDA" fontSize="6" fontFamily="monospace" textAnchor="middle">CELL</text>

                      <circle cx="150" cy="75" r="3" fill="var(--terracotta)" />
                      <circle cx="150" cy="75" r="8" stroke="var(--terracotta)" strokeWidth="0.75" fill="none" opacity="0.5" />
                    </svg>
                  )}

                  {activeAnatomyStep === 2 && (
                    /* Writer diagram: document structure layout */
                    <svg className="w-full h-full p-2" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
                      <rect x="110" y="20" width="80" height="110" stroke="var(--gold)" strokeWidth="1" fill="none" />
                      <line x1="120" y1="35" x2="180" y2="35" stroke="#E2DFDA" strokeWidth="1" opacity="0.7" />
                      <line x1="120" y1="50" x2="160" y2="50" stroke="#E2DFDA" strokeWidth="1" opacity="0.7" />
                      
                      <line x1="120" y1="70" x2="180" y2="70" stroke="var(--gold)" strokeWidth="0.75" opacity="0.5" />
                      <line x1="120" y1="80" x2="175" y2="80" stroke="var(--gold)" strokeWidth="0.75" opacity="0.5" />
                      <line x1="120" y1="90" x2="180" y2="90" stroke="var(--gold)" strokeWidth="0.75" opacity="0.5" />

                      <line x1="120" y1="110" x2="150" y2="110" stroke="var(--terracotta)" strokeWidth="1" opacity="0.8" />
                      
                      <circle cx="70" cy="75" r="4" fill="var(--gold)" />
                      <line x1="74" y1="75" x2="110" y2="75" stroke="var(--gold)" strokeWidth="0.75" />
                      
                      <circle cx="230" cy="55" r="4" fill="var(--gold)" />
                      <line x1="190" y1="55" x2="226" y2="55" stroke="var(--gold)" strokeWidth="0.75" />
                    </svg>
                  )}

                  {activeAnatomyStep === 3 && (
                    /* Critic diagram: targets, hazards, scans */
                    <svg className="w-full h-full p-2" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="150" cy="75" r="50" stroke="var(--terracotta)" strokeWidth="1.2" fill="none" />
                      <circle cx="150" cy="75" r="30" stroke="var(--terracotta)" strokeWidth="0.75" fill="none" strokeDasharray="4 2" />
                      
                      <line x1="150" y1="15" x2="150" y2="135" stroke="var(--terracotta)" strokeWidth="0.5" opacity="0.5" />
                      <line x1="90" y1="75" x2="210" y2="75" stroke="var(--terracotta)" strokeWidth="0.5" opacity="0.5" />
                      
                      <path d="M 150,75 L 185,40" stroke="var(--terracotta)" strokeWidth="1.5" />
                      <polygon points="150,75 185,40 200,60" fill="var(--terracotta)" opacity="0.15" />
                      
                      <rect x="195" y="20" width="80" height="25" stroke="var(--terracotta)" strokeWidth="0.75" fill="none" />
                      <text x="235" y="35" fill="var(--terracotta)" fontSize="7" fontFamily="monospace" textAnchor="middle">BIAS AUDIT</text>

                      <circle cx="80" cy="110" r="3" fill="var(--gold)" />
                    </svg>
                  )}

                  {activeAnatomyStep === 4 && (
                    /* Refiner diagram: Feedback flow back to core doc */
                    <svg className="w-full h-full p-2" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="150" cy="75" r="35" stroke="var(--gold)" strokeWidth="1" fill="none" />
                      <path d="M 150,30 A 45,45 0 1,1 105,75" stroke="var(--gold)" strokeWidth="1.5" fill="none" className="animated-dash" />
                      
                      <circle cx="150" cy="30" r="4" fill="var(--terracotta)" />
                      <circle cx="105" cy="75" r="4" fill="var(--gold)" />
                      
                      <line x1="150" y1="75" x2="150" y2="115" stroke="#E2DFDA" strokeWidth="0.75" strokeDasharray="3 3" />
                      <rect x="130" y="115" width="40" height="15" stroke="var(--gold)" strokeWidth="0.75" fill="none" />
                      <text x="150" y="125" fill="#E2DFDA" fontSize="7" fontFamily="monospace" textAnchor="middle">FINAL DOC</text>
                    </svg>
                  )}
                </div>

                {/* Console Log Printout */}
                <div className="flex-1 font-mono text-[10.5px] leading-relaxed text-[#E2DFDA]/90 flex flex-col gap-1.5 overflow-y-auto pr-1 max-h-[170px] custom-scrollbar z-10">
                  {stepDetails[activeAnatomyStep].logs.map((log, lIdx) => (
                    <div key={lIdx} className="flex gap-2 items-start border-l border-white/10 pl-2">
                      <span className="text-gold select-none">&gt;</span>
                      <span className="text-white/80 dark:text-[#E2DFDA]/85">{log}</span>
                    </div>
                  ))}
                  <div className="flex gap-1.5 items-center mt-1">
                    <span className="text-gold animate-pulse">&gt;</span>
                    <span className="w-1.5 h-3 bg-gold/70 animate-pulse"></span>
                  </div>
                </div>
              </div>

              {/* Research Library List (Landing Page) */}
              {sessions.length > 0 && (
                <div className="flex flex-col gap-3 w-full max-w-4xl border-t border-border-custom pt-8 mt-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-custom/85 flex items-center justify-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-gold" />
                    Personal Research Library ({sessions.length})
                  </div>
                  
                  {loadingSessions ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-gold" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-left">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => loadSavedSession(session)}
                          className="group flex justify-between items-start bg-card hover:bg-gold/10 border border-border-custom p-4 transition-all duration-300 shadow-sm cursor-pointer animate-fade-in"
                        >
                          <div className="flex flex-col gap-2 min-w-0 flex-1 pr-4">
                            <span className="font-serif text-sm text-foreground group-hover:text-foreground font-bold line-clamp-2">
                              {session.query ? `"${session.query}"` : "Untitled Session"}
                            </span>
                            <span className="text-[10px] text-foreground/70 font-mono font-medium">
                              Saved: {session.createdAt ? new Date(session.createdAt.seconds * 1000).toLocaleDateString() : "Just now"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSession(e, session.id!)}
                              className="opacity-0 group-hover:opacity-100 hover:text-terracotta text-muted-custom/80 p-1.5 transition-opacity duration-300"
                              title="Delete Report"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <ArrowUpRight className="w-4 h-4 text-gold group-hover:text-terracotta transition-colors shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </section>
      )}

      {/* Claim Inspector Drawer */}
      {showClaimInspector && selectedClaimId && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-card border-l border-border-custom shadow-2xl z-50 flex flex-col justify-between animate-fade-in font-sans">
          
          {/* Header */}
          <div className="p-5 border-b border-border-subtle flex justify-between items-center bg-card/60 backdrop-blur-md">
            <div className="flex flex-col gap-1">
              <div className="text-[9px] font-bold uppercase tracking-widest text-gold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Claim Auditing Desk
              </div>
              <h3 className="font-serif text-lg font-normal text-foreground">Evidence Verification</h3>
            </div>
            <button
              onClick={() => {
                setShowClaimInspector(false);
                setSelectedClaimId(null);
              }}
              className="text-muted-custom hover:text-foreground transition-colors border-0 bg-transparent cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Excerpt Body */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 text-left">
            {/* The Assertion */}
            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-mono uppercase text-muted-custom">Assertion Claim</div>
              <div className="text-sm font-serif italic text-foreground bg-gold/[0.02] border border-gold/10 p-4 leading-relaxed">
                "{result?.claims?.[selectedClaimId]?.assertion || selectedClaimId}"
              </div>
            </div>

            {/* Supporting Excerpt */}
            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-mono uppercase text-muted-custom">Retrieved Supporting Excerpt</div>
              {result?.claims?.[selectedClaimId]?.excerpt ? (
                <div className="text-xs text-foreground/85 leading-relaxed font-mono bg-card border border-border-custom p-4 whitespace-pre-wrap max-h-[180px] overflow-y-auto custom-scrollbar">
                  {result.claims[selectedClaimId].excerpt}
                </div>
              ) : (
                <div className="text-xs text-muted-custom/80 italic p-4 bg-foreground/[0.01] border border-dashed border-border-custom text-center">
                  No explicit context excerpt recorded for this claim.
                </div>
              )}
            </div>

            {/* Opposing Evidence */}
            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-mono uppercase text-muted-custom">Opposing / Contradicting Evidence</div>
              {result?.claims?.[selectedClaimId]?.opposing && result.claims[selectedClaimId].opposing.toLowerCase() !== "none found" ? (
                <div className="text-xs text-terracotta/90 leading-relaxed font-mono bg-terracotta/[0.02] border border-terracotta/10 p-4 whitespace-pre-wrap max-h-[150px] overflow-y-auto custom-scrollbar">
                  {result.claims[selectedClaimId].opposing}
                </div>
              ) : (
                <div className="text-xs text-emerald-600 font-mono bg-emerald-500/5 border border-emerald-500/10 p-3 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[9px] w-fit">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  No Contradictions Ingested
                </div>
              )}
            </div>

            {/* Meta scores: Quality & Confidence */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 bg-foreground/[0.01] border border-border-custom p-3.5">
                <span className="text-[9px] font-mono uppercase text-muted-custom">Source Trust Score</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  result?.claims?.[selectedClaimId]?.quality_score?.toLowerCase()?.includes("high") ? "text-emerald-600" :
                  result?.claims?.[selectedClaimId]?.quality_score?.toLowerCase()?.includes("low") ? "text-terracotta" : "text-gold"
                }`}>
                  {result?.claims?.[selectedClaimId]?.quality_score || "Medium"}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 bg-foreground/[0.01] border border-border-custom p-3.5">
                <span className="text-[9px] font-mono uppercase text-muted-custom">Consensus Confidence</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  result?.claims?.[selectedClaimId]?.confidence_rating?.toLowerCase()?.includes("high") ? "text-emerald-600" :
                  result?.claims?.[selectedClaimId]?.confidence_rating?.toLowerCase()?.includes("low") ? "text-terracotta" : "text-gold"
                }`}>
                  {result?.claims?.[selectedClaimId]?.confidence_rating || "Medium"}
                </span>
              </div>
            </div>

            {/* Source Reference Link */}
            {result?.claims?.[selectedClaimId]?.source_url && (
              <div className="flex flex-col gap-2">
                <div className="text-[10px] font-mono uppercase text-muted-custom">Source Document</div>
                <a
                  href={result.claims[selectedClaimId].source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-gold hover:text-gold-dark underline truncate bg-foreground/[0.02] p-3 border border-border-custom block"
                >
                  {result.claims[selectedClaimId].source_url}
                </a>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-5 border-t border-border-subtle bg-background/50 flex gap-3">
            {result?.claims?.[selectedClaimId]?.source_url && (
              <a
                href={result.claims[selectedClaimId].source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-[10px] uppercase tracking-widest font-bold bg-foreground text-background hover:bg-gold hover:text-background py-3 transition-all duration-300"
              >
                Inspect Original Source
              </a>
            )}
            <button
              onClick={() => {
                setShowClaimInspector(false);
                setSelectedClaimId(null);
              }}
              className="text-[10px] uppercase tracking-widest font-bold border border-border-custom px-5 py-3 transition-all duration-300 cursor-pointer bg-transparent text-muted-custom hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Citation Inspector Drawer */}
      {showCitationInspector && selectedCitationUrl && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-card border-l border-border-custom shadow-2xl z-50 flex flex-col justify-between animate-fade-in font-sans">
          
          {/* Header */}
          <div className="p-5 border-b border-border-subtle flex justify-between items-center bg-card/60 backdrop-blur-md">
            <div className="flex flex-col gap-1">
              <div className="text-[9px] font-bold uppercase tracking-widest text-gold flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                Evidence Explorer
              </div>
              <h3 className="font-serif text-lg font-normal text-foreground">Verified Excerpt</h3>
            </div>
            <button
              onClick={() => {
                setShowCitationInspector(false);
                setSelectedCitationUrl(null);
              }}
              className="text-muted-custom hover:text-foreground transition-colors border-0 bg-transparent cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Excerpt Body */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-5 text-left">
            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-mono uppercase text-muted-custom">Source URL</div>
              <a
                href={selectedCitationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-gold hover:text-gold-dark underline break-all bg-foreground/[0.02] p-3 border border-border-custom block"
              >
                {selectedCitationUrl}
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-mono uppercase text-muted-custom">Retrieved Context Chunks</div>
              {result?.source_contents?.[selectedCitationUrl] ? (
                <div className="text-xs text-foreground/85 leading-relaxed font-mono bg-card border border-border-custom p-4 whitespace-pre-wrap max-h-[350px] overflow-y-auto custom-scrollbar">
                  {result.source_contents[selectedCitationUrl]}
                </div>
              ) : (
                <div className="text-xs text-muted-custom/80 italic p-4 bg-foreground/[0.01] border border-dashed border-border-custom text-center">
                  Full context excerpt not cached for this source. Please visit the URL link above to verify.
                </div>
              )}
            </div>

            <div className="text-[10px] text-muted-custom leading-normal border-t border-border-subtle pt-4 font-mono">
              💡 <strong>Audit Trail:</strong> The excerpt displayed above represents the exact semantic passage downloaded and indexed by the Crawler during the investigation.
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-5 border-t border-border-subtle bg-background/50 flex gap-3">
            <a
              href={selectedCitationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center text-[10px] uppercase tracking-widest font-bold bg-foreground text-background hover:bg-gold hover:text-background py-3 transition-all duration-300"
            >
              Visit Source Website
            </a>
            <button
              onClick={() => {
                setShowCitationInspector(false);
                setSelectedCitationUrl(null);
              }}
              className="text-[10px] uppercase tracking-widest font-bold border border-border-custom px-5 py-3 transition-all duration-300 cursor-pointer bg-transparent text-muted-custom hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border-custom py-8 px-6 sm:px-12 bg-background/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-muted-custom font-medium transition-colors duration-300 relative z-10">
        <div>
          &copy; {new Date().getFullYear()} Renaissance. All rights reserved.
        </div>
      </footer>
      
    </div>
  );
}
