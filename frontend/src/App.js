import axios from "axios";
import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function SectionCard({ title, children, className = "" }) {
  return (
    <section className={`section-card ${className}`}>
      {title && <h3 className="section-title">{title}</h3>}
      {children}
    </section>
  );
}

function PriorityPill({ priority = "Low" }) {
  const cls =
    priority === "High"
      ? "pill-high"
      : priority === "Medium"
        ? "pill-medium"
        : "pill-low";
  return <span className={`priority-pill ${cls}`}>{priority}</span>;
}

function App() {
  const [stage, setStage] = useState("idle"); // idle | loading | result | error
  const [textMode, setTextMode] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0);

  const analysis = result?.analysis;

  const fakeProgressStart = () => {
    setProgress(0);
    return setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 12 + 4, 92));
    }, 350);
  };

  const finishSuccess = (resData, timer) => {
    clearInterval(timer);
    setProgress(100);
    setTimeout(() => {
      setResult(resData);
      setStage("result");
    }, 250);
  };

  const handleFailure = (err, timer) => {
    clearInterval(timer);
    const msg =
      err?.response?.data?.detail || "Something went wrong. Please try again.";
    setError(msg);
    setStage("error");
  };

  const analyzeFile = useCallback(async (file) => {
    const fd = new FormData();
    fd.append("file", file);

    setStage("loading");
    setError("");
    setFileName(file.name);
    const timer = fakeProgressStart();

    try {
      const res = await axios.post(`${API_URL}/analyze`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      finishSuccess(res.data, timer);
    } catch (err) {
      handleFailure(err, timer);
    }
  }, []);

  const analyzeText = useCallback(async () => {
    if (textInput.trim().length < 10) return;

    setStage("loading");
    setError("");
    setFileName("Direct Text Input");
    const timer = fakeProgressStart();

    try {
      const res = await axios.post(`${API_URL}/analyze-text`, {
        text: textInput,
      });
      finishSuccess(res.data, timer);
    } catch (err) {
      handleFailure(err, timer);
    }
  }, [textInput]);

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (!acceptedFiles.length) return;
      analyzeFile(acceptedFiles[0]);
    },
    [analyzeFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: stage === "loading",
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".tiff", ".bmp"],
    },
  });

  const reset = () => {
    setStage("idle");
    setTextInput("");
    setResult(null);
    setError("");
    setFileName("");
    setProgress(0);
  };

  const scoreColorClass = useMemo(() => {
    const s = analysis?.overall_score ?? 0;
    if (s >= 75) return "score-good";
    if (s >= 45) return "score-mid";
    return "score-low";
  }, [analysis]);

  return (
    <div className="app-shell">
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-logo">CP</div>
          <div>
            <div className="brand-name">ContentPulse</div>
            <div className="brand-sub">Social Content Analyzer</div>
          </div>
        </div>
        <div className="topbar-badge">Demo Ready</div>
      </header>

      <main className="app-main">
        {(stage === "idle" || stage === "error") && (
          <>
            <section className="hero">
              <p className="eyebrow">Creator Tools</p>
              <h1>
                Analyze posts like a pro
                <span className="hero-gradient"> before you publish</span>
              </h1>
              <p className="hero-copy">
                Upload a PDF/image or paste your caption. We extract the text,
                score engagement potential, and suggest improvements for hooks,
                hashtags, and CTA.
              </p>
            </section>

            <div className="toggle-wrap">
              <button
                className={`toggle-btn ${!textMode ? "active" : ""}`}
                onClick={() => setTextMode(false)}
              >
                Upload File
              </button>
              <button
                className={`toggle-btn ${textMode ? "active" : ""}`}
                onClick={() => setTextMode(true)}
              >
                Paste Text
              </button>
            </div>

            {!textMode ? (
              <SectionCard className="upload-card">
                <div
                  {...getRootProps()}
                  className={`dropzone ${isDragActive ? "dropzone-active" : ""}`}
                >
                  <input {...getInputProps()} />
                  <div className="drop-icon">⬆</div>
                  <div className="drop-title">
                    {isDragActive
                      ? "Drop your file here"
                      : "Drag & drop a post file"}
                  </div>
                  <div className="drop-sub">
                    or click to browse · PDF, PNG, JPG, WEBP · Max 10MB
                  </div>
                </div>

                <div className="quick-tags">
                  {["PDF", "PNG", "JPG", "WEBP", "OCR", "Gemini / Mock"].map(
                    (tag) => (
                      <span key={tag} className="chip">
                        {tag}
                      </span>
                    ),
                  )}
                </div>
              </SectionCard>
            ) : (
              <SectionCard className="upload-card" title="Paste post content">
                <textarea
                  className="caption-input"
                  placeholder="Paste your Instagram/LinkedIn/X caption here..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={8}
                />
                <div className="text-actions">
                  <span className="char-count">{textInput.length} chars</span>
                  <button
                    className="primary-btn"
                    onClick={analyzeText}
                    disabled={textInput.trim().length < 10}
                  >
                    Analyze Caption
                  </button>
                </div>
              </SectionCard>
            )}

            {stage === "error" && (
              <div className="error-banner">
                <span>⚠</span>
                <p>{error}</p>
              </div>
            )}

            <div className="mini-grid">
              <SectionCard title="What you’ll get">
                <ul className="mini-list">
                  <li>Engagement score + readability</li>
                  <li>Top strengths and improvement priorities</li>
                  <li>Hashtag ideas + CTA + stronger hook</li>
                </ul>
              </SectionCard>
              <SectionCard title="Best input for OCR">
                <ul className="mini-list">
                  <li>Clear screenshots or scanned docs</li>
                  <li>Avoid heavy background textures</li>
                  <li>Crop UI clutter if possible</li>
                </ul>
              </SectionCard>
            </div>
          </>
        )}

        {stage === "loading" && (
          <div className="loading-panel">
            <div className="loading-ring" />
            <h2>Analyzing your content…</h2>
            <p>{fileName}</p>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="loading-steps">
              <span>Extracting text</span>
              <span>Scoring content</span>
              <span>Generating suggestions</span>
            </div>
          </div>
        )}

        {stage === "result" && analysis && (
          <>
            <div className="result-topbar">
              <div>
                <p className="muted-small">
                  {result?.filename || "Analysis Result"}
                </p>
                <h2 className="result-heading">Content Report</h2>
              </div>
              <button className="ghost-btn" onClick={reset}>
                Analyze Another
              </button>
            </div>

            <div className="dashboard-grid">
              {/* Left: phone preview */}
              <SectionCard title="Post Preview" className="phone-card">
                <div className="phone-shell">
                  <div className="phone-top">
                    <div className="avatar-ring">
                      <div className="avatar-dot" />
                    </div>
                    <div>
                      <div className="phone-user">your_handle</div>
                      <div className="phone-meta">
                        {analysis.content_type || "Post"}
                      </div>
                    </div>
                  </div>

                  <div className="phone-media">
                    <div className="media-gradient" />
                    <div className="media-hook">
                      {analysis.rewritten_hook || "Stronger hook appears here"}
                    </div>
                  </div>

                  <div className="phone-actions">
                    <span>♡</span>
                    <span>💬</span>
                    <span>✈</span>
                    <span className="bookmark">⌁</span>
                  </div>

                  <div className="phone-caption">
                    <strong>contentpulse</strong>{" "}
                    {result?.extracted_text?.slice(0, 180) ||
                      "Caption preview..."}
                    {result?.char_count > 180 ? "…" : ""}
                  </div>

                  <div className="phone-tags">
                    {(analysis.suggested_hashtags || [])
                      .slice(0, 4)
                      .map((h) => (
                        <span key={h}>{h}</span>
                      ))}
                  </div>
                </div>
              </SectionCard>

              {/* Right: score + stats */}
              <SectionCard title="Engagement Score">
                <div className="score-wrap">
                  <div className={`score-bubble ${scoreColorClass}`}>
                    <span className="score-num">
                      {analysis.overall_score ?? "--"}
                    </span>
                    <span className="score-outof">/100</span>
                  </div>

                  <div className="score-meta">
                    <div className="meta-item">
                      <span>Sentiment</span>
                      <strong>{analysis.sentiment || "—"}</strong>
                    </div>
                    <div className="meta-item">
                      <span>Readability</span>
                      <strong>{analysis.readability || "—"}</strong>
                    </div>
                    <div className="meta-item">
                      <span>Words</span>
                      <strong>{analysis.word_count ?? "—"}</strong>
                    </div>
                    <div className="meta-item">
                      <span>Best Platforms</span>
                      <strong>
                        {(analysis.best_platforms || []).join(", ") || "—"}
                      </strong>
                    </div>
                    <div className="meta-item">
                      <span>Best Time</span>
                      <strong>{analysis.optimal_post_time || "—"}</strong>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="dashboard-grid">
              <SectionCard title="What’s Working">
                <ul className="stack-list">
                  {(analysis.strengths || []).map((s, i) => (
                    <li key={i}>
                      <span className="bullet success">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>

              <SectionCard title="Priority Improvements">
                <ul className="stack-list">
                  {(analysis.improvements || []).map((imp, i) => (
                    <li key={i} className="improvement-item">
                      <div className="improvement-head">
                        <PriorityPill priority={imp.priority} />
                        <span>{imp.suggestion}</span>
                      </div>
                      <p>{imp.reason}</p>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </div>

            <div className="dashboard-grid">
              <SectionCard title="Hashtag Ideas">
                <div className="chips-wrap">
                  {(analysis.suggested_hashtags || []).map((tag) => (
                    <span className="chip chip-accent" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="CTA Suggestion">
                <div className="cta-box">
                  <div className="cta-icon">✦</div>
                  <p>
                    {analysis.cta_suggestion ||
                      "Add a stronger CTA to boost comments/saves."}
                  </p>
                </div>
              </SectionCard>
            </div>

            <SectionCard title="Extracted Text">
              <pre className="extracted-text">
                {result?.extracted_text}
                {result?.char_count > 2000
                  ? `\n\n… (${result.char_count - 2000} more chars)`
                  : ""}
              </pre>
            </SectionCard>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
