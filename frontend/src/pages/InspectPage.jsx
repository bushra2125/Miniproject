/**
 * InspectPage.jsx — AI Fruit Inspection
 * Handles image upload, preview, validation, and API integration
 * with POST /api/fruits/analyze.
 *
 * Honest about model status — never fabricates predictions.
 */
import { useState, useRef, useCallback } from 'react';
import { analyzeImage } from '../api';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB   = 10;

const QUALITY_STYLES = {
  Healthy: { badge: 'badge-healthy', icon: '✅' },
  Damaged: { badge: 'badge-damaged', icon: '⚠️' },
  Rotten:  { badge: 'badge-rotten',  icon: '🚫' },
};

function formatFileSize(bytes) {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FruitResultCard({ result, index }) {
  const conf    = typeof result.confidence === 'number' ? result.confidence : 0;
  const pct     = Math.round(conf * 100);
  const style   = QUALITY_STYLES[result.quality] || { badge: 'badge-unknown', icon: '❓' };

  return (
    <div
      className="fruit-result-row"
      role="listitem"
      aria-label={`Fruit ${index + 1}: ${result.fruit_type || 'Unknown'}, ${result.quality || 'Unknown'}, confidence ${pct}%`}
    >
      <div className="fruit-result-num" aria-hidden="true">{index + 1}</div>
      <div className="fruit-result-info">
        <div className="fruit-result-type">
          <span aria-hidden="true">{style.icon} </span>
          {result.fruit_type || 'Unknown'}
        </div>
        <div className="fruit-result-conf">Confidence: {pct}%</div>
      </div>
      <span className={`badge ${style.badge}`}>{result.quality || 'Unknown'}</span>
    </div>
  );
}

export default function InspectPage() {
  const [file,         setFile]         = useState(null);
  const [preview,      setPreview]      = useState(null);
  const [dragOver,     setDragOver]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [result,       setResult]       = useState(null);  // API response
  const [error,        setError]        = useState(null);  // error string
  const [validationErr, setValidationErr] = useState(null);

  const fileInputRef = useRef(null);

  const resetResult = () => {
    setResult(null);
    setError(null);
    setValidationErr(null);
  };

  const handleFile = useCallback((selectedFile) => {
    resetResult();

    if (!selectedFile) return;

    // Validate type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setValidationErr(
        `Unsupported file type "${selectedFile.type}". Please upload a JPEG, PNG, or WebP image.`
      );
      return;
    }

    // Validate size
    if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
      setValidationErr(`File too large (${formatFileSize(selectedFile.size)}). Maximum allowed size is ${MAX_SIZE_MB} MB.`);
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
  }, []);

  const onInputChange = (e) => {
    handleFile(e.target.files?.[0] || null);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0] || null);
  };

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  const clearImage = () => {
    setFile(null);
    if (preview) { URL.revokeObjectURL(preview); setPreview(null); }
    resetResult();
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError(null);

    const { data, error: apiError } = await analyzeImage(file);

    setLoading(false);

    if (apiError) {
      setError(apiError);
    } else {
      setResult(data);
    }
  };

  const hasResults     = result && result.model_loaded && result.results?.length > 0;
  const modelNotLoaded = result && !result.model_loaded;

  return (
    <div className="page-content animate-in">
      <div className="page-header">
        <h1 className="page-title">AI Fruit Inspection</h1>
        <p className="page-subtitle">
          Upload a fruit image to receive quality classification and count detection.
        </p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* ── Left: Upload + Preview ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Image Upload</div>
                <div className="card-subtitle">JPEG, PNG or WebP · Max {MAX_SIZE_MB} MB</div>
              </div>
              {file && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={clearImage}
                  id="clear-image-btn"
                  aria-label="Clear selected image"
                >
                  ✕ Clear
                </button>
              )}
            </div>
            <div className="card-body">
              {/* Validation error */}
              {validationErr && (
                <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
                  <span className="alert-icon">⚠</span>
                  <div className="alert-content">
                    <div className="alert-title">Invalid File</div>
                    <div className="alert-body">{validationErr}</div>
                  </div>
                </div>
              )}

              {!file ? (
                /* Drop zone */
                <label
                  className={`upload-zone${dragOver ? ' drag-over' : ''}`}
                  htmlFor="fruit-image-input"
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  aria-label="Image upload area. Click or drag and drop an image here."
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                >
                  <input
                    id="fruit-image-input"
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onInputChange}
                    aria-label="Select fruit image to analyze"
                  />
                  <div className="upload-zone-icon" aria-hidden="true">🖼️</div>
                  <div className="upload-zone-title">Drop your image here</div>
                  <div className="upload-zone-sub">or click to browse files from your device</div>
                  <div className="upload-zone-formats">
                    {['JPEG', 'PNG', 'WebP'].map(f => (
                      <span key={f} className="format-tag">.{f.toLowerCase()}</span>
                    ))}
                  </div>
                </label>
              ) : (
                /* Image preview */
                <div className="image-preview-container">
                  <img src={preview} alt={`Preview of ${file.name}`} />
                  <div className="image-preview-overlay" aria-hidden="true">
                    <span style={{ color: 'white', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      🔍 Ready to analyze
                    </span>
                  </div>
                  <div className="image-preview-info">
                    <span className="image-preview-filename" title={file.name}>{file.name}</span>
                    <span className="image-preview-size">{formatFileSize(file.size)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Analyze button */}
          <button
            id="analyze-btn"
            className="btn btn-primary btn-lg"
            onClick={handleAnalyze}
            disabled={!file || loading}
            aria-busy={loading}
            aria-label="Analyze the selected fruit image"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading
              ? <><span className="spinner" aria-hidden="true" /> Analyzing…</>
              : '🔬 Analyze Image'
            }
          </button>

          {!file && !loading && (
            <p style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Select an image above, then click Analyze to run the inspection.
            </p>
          )}
        </div>

        {/* ── Right: Results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Inspection Results</div>
                <div className="card-subtitle">AI classification output</div>
              </div>
            </div>
            <div className="card-body">
              {/* Loading state */}
              {loading && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-10) 0',
                  }}
                  role="status"
                  aria-live="polite"
                  aria-label="Analyzing image, please wait"
                >
                  <span
                    className="spinner spinner-dark"
                    style={{ width: 40, height: 40, borderWidth: 3 }}
                    aria-hidden="true"
                  />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
                      Analyzing image…
                    </p>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                      Sending to the AI backend for processing
                    </p>
                  </div>
                </div>
              )}

              {/* Network / server error */}
              {!loading && error && (
                <div className="alert alert-error" role="alert">
                  <span className="alert-icon">🔴</span>
                  <div className="alert-content">
                    <div className="alert-title">Analysis Failed</div>
                    <div className="alert-body">{error}</div>
                  </div>
                </div>
              )}

              {/* Model not loaded — honest state */}
              {!loading && !error && modelNotLoaded && (
                <div>
                  <div className="alert alert-warning" role="status">
                    <span className="alert-icon">🤖</span>
                    <div className="alert-content">
                      <div className="alert-title">AI Model Not Available</div>
                      <div className="alert-body">{result.message}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--color-text)' }}>
                      How to enable AI predictions:
                    </p>
                    <ol style={{ paddingLeft: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <li>Train or obtain a fruit classification model</li>
                      <li>Place the model file in <code>backend/ml_models/</code></li>
                      <li>Set <code>MODEL_PATH</code> in <code>backend/.env</code></li>
                      <li>Implement <code>analyze_image()</code> in <code>ai_service.py</code></li>
                      <li>Restart the backend server</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Success: results available */}
              {!loading && !error && hasResults && (
                <div className="animate-in" role="region" aria-label="Inspection results">
                  {/* Summary metrics */}
                  <div className="result-grid" style={{ marginBottom: 'var(--space-5)' }}>
                    <div className="result-item">
                      <div className="result-item-label">Fruits Detected</div>
                      <div className="result-item-value" aria-label={`${result.fruit_count} fruits detected`}>
                        {result.fruit_count}
                      </div>
                      <div className="result-item-sub">total count</div>
                    </div>
                    <div className="result-item">
                      <div className="result-item-label">Categories Found</div>
                      <div className="result-item-value">
                        {[...new Set(result.results.map(r => r.fruit_type))].length}
                      </div>
                      <div className="result-item-sub">fruit types</div>
                    </div>
                    <div className="result-item">
                      <div className="result-item-label">Avg. Confidence</div>
                      <div className="result-item-value">
                        {Math.round(
                          result.results.reduce((s, r) => s + (r.confidence || 0), 0) /
                          result.results.length * 100
                        )}%
                      </div>
                      <div className="result-item-sub">across all detections</div>
                    </div>
                  </div>

                  {/* Per-fruit results */}
                  <div className="card-title" style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                    Per-Fruit Results
                  </div>
                  <div
                    style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}
                    role="list"
                    aria-label="Per-fruit inspection results"
                  >
                    {result.results.map((r, i) => (
                      <FruitResultCard key={i} result={r} index={i} />
                    ))}
                  </div>

                  <div className="alert alert-success" role="status" style={{ marginTop: 'var(--space-4)' }}>
                    <span className="alert-icon">✅</span>
                    <div className="alert-content">
                      <div className="alert-title">Inspection Complete</div>
                      <div className="alert-body">{result.message || 'Inspection completed successfully.'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty state — no image selected yet */}
              {!loading && !error && !result && (
                <div className="empty-state">
                  <div className="empty-state-icon">🔬</div>
                  <div className="empty-state-title">No Results Yet</div>
                  <div className="empty-state-body">
                    Upload a fruit image on the left and click <strong>Analyze Image</strong> to
                    run the AI inspection. Results will appear here.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info card */}
          <div className="card">
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>
                Supported Outputs
              </p>
              {[
                ['Fruit Category', 'Type of fruit detected (e.g. Apple, Mango)'],
                ['Quality Class', 'Healthy, Damaged, or Rotten'],
                ['Confidence Score', 'Model certainty for each detection (0–100%)'],
                ['Fruit Count', 'Total number of fruits identified in the image'],
              ].map(([label, desc]) => (
                <div key={label} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--green-500)', marginTop: 2, flexShrink: 0 }}>✓</span>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{label}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginLeft: 6 }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
