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
  Moon
} from "lucide-react";

interface ResearchResult {
  status: string;
  report: string;
  critique: string;
  sources: string[];
  skipped_sources: [string, string][];
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

  // Slideshow & Quote interval timer
  useEffect(() => {
    if (hasInitiated) return;
    const interval = setInterval(() => {
      setSlideshowIndex((prev) => (prev + 1) % 3);
      setQuoteIndex((prev) => (prev + 1) % quotesList.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [hasInitiated]);

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
      const response = await fetch("http://127.0.0.1:8000/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
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

  const resetWorkspace = () => {
    setQuery("");
    setLogs([]);
    setResult(null);
    setError(null);
  };

  const sampleQueries = [
    "Is dark chocolate actually beneficial for cardiovascular health?",
    "How do microplastics cross the blood-brain barrier and what are the biological implications?",
    "What is the scientific consensus on blue light exposure and its direct impact on sleep latency?"
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-gold selection:text-background paper-texture flex flex-col justify-between transition-colors duration-300 relative">

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
                  Self-Skeptical Investigation Agent
                </div>
                <h1 className="text-6xl sm:text-7xl font-normal leading-[1.03] tracking-normal text-center" style={{ fontFamily: "var(--font-signature)" }}>
                  Research that challenges <br />
                  its own assumptions.
                </h1>
                <p className="text-sm text-foreground/90 font-normal max-w-xl leading-relaxed mt-2 mx-auto">
                  Renaissance is a cognitive investigation suite that scrapes the live web, compiles raw evidence under strict token budgets, drafts findings, and then subjects them to a rigorous red-team critique to isolate logical gaps before refining its conclusions.
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
                      className="w-full min-h-[90px] px-2 py-1 bg-transparent text-foreground focus:outline-none font-serif text-lg placeholder:text-muted-custom/50 resize-none leading-relaxed text-left"
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
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-custom/75 flex items-center justify-center gap-1.5">
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
                      <span className="font-serif text-sm text-foreground/80 group-hover:text-foreground transition-colors pr-4">
                        "{q}"
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-gold group-hover:text-terracotta transition-colors shrink-0" />
                    </button>
                  ))}
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
                  
                  {/* Desktop Layout - All panels displayed in a clean, editorial configuration */}
                  <div className="hidden lg:grid grid-cols-1 gap-6">
                    
                    {/* Primary Report */}
                    <article className="bg-card border border-border-custom p-8 sm:p-12 shadow-sm relative transition-colors duration-300">
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

                      <div className="prose prose-neutral max-w-none text-foreground text-sm leading-relaxed font-light dark:prose-invert">
                        <ReactMarkdown
                          components={{
                            h1: ({node, ...props}) => <h1 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4 border-b border-border-subtle pb-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="font-serif text-xl font-normal text-foreground mt-8 mb-4" {...props} />,
                            h3: ({node, ...props}) => <h3 className="font-sans text-xs font-bold text-gold-dark tracking-wider uppercase mt-6 mb-2" {...props} />,
                            p: ({node, ...props}) => <p className="mb-4 text-foreground/85 leading-relaxed font-light" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-5 space-y-2 text-foreground/80" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-5 space-y-2 text-foreground/80" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                            code: ({node, ...props}) => <code className="font-mono text-xs bg-foreground/5 px-1 py-0.5 text-foreground" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-gold pl-4 italic text-foreground/75 my-4 bg-gold/5 py-2 pr-2" {...props} />,
                            a: ({node, ...props}) => <a className="text-foreground underline hover:text-gold transition-colors font-medium break-all" target="_blank" rel="noopener noreferrer" {...props} />
                          }}
                        >
                          {/* Strip default title header from output to prevent double header display */}
                          {result.report.replace(/^#\s+Research\s+Report/i, "").replace(/^#\s+.*?\n/i, "")}
                        </ReactMarkdown>
                      </div>
                    </article>

                    {/* Adversarial Critique (Red Team) */}
                    <div className="bg-card border border-terracotta/25 shadow-sm overflow-hidden transition-colors duration-300">
                      <div className="bg-terracotta/5 border-b border-terracotta/15 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-terracotta">
                          <ShieldAlert className="w-4 h-4" />
                          Adversarial Audit &amp; Gap Critique
                        </div>
                        <span className="text-[9px] bg-terracotta/10 text-terracotta px-2 py-0.5 font-mono uppercase tracking-widest font-semibold">
                          RED TEAM CHECK
                        </span>
                      </div>
                      <div className="p-6 sm:p-8 text-sm sm:text-base font-serif italic text-foreground/90 bg-terracotta/[0.01] leading-relaxed font-light whitespace-pre-wrap">
                        {result.critique}
                      </div>
                    </div>

                    {/* Sources Audited */}
                    <div className="bg-card border border-border-custom shadow-sm overflow-hidden transition-colors duration-300">
                      <div className="bg-foreground/5 border-b border-border-subtle px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-custom">
                          <LinkIcon className="w-4 h-4 text-gold" />
                          Investigated Literature &amp; URLs ({result.sources.length + result.skipped_sources.length})
                        </div>
                      </div>
                      <div className="p-6 bg-card flex flex-col gap-6 text-xs transition-colors duration-300">
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
                                  <a href={src} target="_blank" rel="noopener noreferrer" className="text-foreground/75 hover:text-foreground hover:underline break-all font-mono text-[11px] bg-foreground/[0.02] px-2 py-1 border border-border-custom flex-1">
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
                            <h4 className="font-bold text-terracotta mb-3 uppercase tracking-widest text-[9px] flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-terracotta" />
                              Skipped / Connection Failed
                            </h4>
                            <ul className="space-y-2">
                              {result.skipped_sources.map(([url, reason], i) => (
                                <li key={i} className="flex flex-col md:flex-row gap-1 md:items-center bg-terracotta/5 p-2 border border-terracotta/10">
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-muted-custom hover:text-foreground underline break-all font-mono text-[11px] flex-1">
                                    {url}
                                  </a>
                                  <span className="text-[10px] text-terracotta font-mono italic px-2">
                                    [{reason}]
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

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
                        <div className="prose prose-neutral max-w-none text-foreground text-xs leading-relaxed font-light dark:prose-invert">
                          <ReactMarkdown>{result.report.replace(/^#\s+Research\s+Report/i, "").replace(/^#\s+.*?\n/i, "")}</ReactMarkdown>
                        </div>
                      </article>
                    )}

                    {activeTab === "critique" && (
                      <div className="bg-card border border-terracotta/20 shadow-sm p-6">
                        <h3 className="font-bold text-xs uppercase text-terracotta tracking-wider mb-4 flex items-center gap-1.5 border-b border-terracotta/10 pb-2">
                          <ShieldAlert className="w-4 h-4" />
                          Red Team Critique
                        </h3>
                        <p className="text-sm font-serif italic text-foreground/95 leading-relaxed whitespace-pre-wrap">
                          {result.critique}
                        </p>
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
                                <a href={src} target="_blank" rel="noopener noreferrer" className="text-foreground/70 hover:text-foreground underline break-all font-mono text-[10px]">
                                  {src}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {result.skipped_sources.length > 0 && (
                          <div className="border-t border-border-subtle pt-4">
                            <h4 className="font-bold text-terracotta mb-3 uppercase tracking-widest text-[9px] flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-terracotta" />
                              Skipped / Failed
                            </h4>
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
                  <h3 className="font-serif text-lg text-muted-custom/60">Awaiting Inquiry</h3>
                  <p className="text-xs text-muted-custom/40 mt-2 max-w-xs leading-relaxed font-light">
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
                          <span className="text-[8px] font-mono text-muted-custom/60 uppercase">({step.subName})</span>
                        </div>
                        <p className="text-[11px] text-muted-custom leading-relaxed font-light mt-1">
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

            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border-custom py-8 px-6 sm:px-12 bg-background/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-muted-custom font-medium transition-colors duration-300 relative z-10">
        <div>
          &copy; {new Date().getFullYear()} Renaissance. All rights reserved.
        </div>
        <div className="flex gap-4">
          <span>Adversarial verification desk</span>
          <span>|</span>
          <span>Polymath Engine v1.2</span>
        </div>
      </footer>
      
    </div>
  );
}
