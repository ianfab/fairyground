import React, { useState } from 'react'

function Controls({ 
  variants, 
  currentVariant, 
  onVariantChange, 
  fen, 
  moves, 
  onSetPosition, 
  onUndo, 
  onReset, 
  onFlip, 
  showDests, 
  onShowDestsChange, 
  gameStatus,
  engine 
}) {
  const [fenInput, setFenInput] = useState('')
  const [movesInput, setMovesInput] = useState('')

  const handleVariantSelect = (e) => {
    onVariantChange(e.target.value)
  }

  const handleSetPosition = () => {
    if (fenInput.trim()) {
      onSetPosition(fenInput.trim(), movesInput.trim())
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      if (window.ffish) {
        window.ffish.loadVariantConfig(text)
        console.log('Custom variants loaded from file')
      }
    } catch (error) {
      console.error('Failed to load variants file:', error)
    }
  }

  const copyFenToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fen)
      console.log('FEN copied to clipboard')
    } catch (error) {
      console.error('Failed to copy FEN:', error)
    }
  }

  // Group variants by category
  const variantsByCategory = variants.reduce((acc, variant) => {
    if (!acc[variant.category]) {
      acc[variant.category] = []
    }
    acc[variant.category].push(variant)
    return acc
  }, {})

  return (
    <div className="controls">
      <div className="control-group">
        <h3>Variant Selection</h3>
        
        <div className="form-row">
          <label>Variants.ini File:</label>
          <input
            type="file"
            accept=".ini,.txt"
            onChange={handleFileUpload}
          />
        </div>

        <div className="form-row">
          <label>Chess Variant:</label>
          <select value={currentVariant} onChange={handleVariantSelect}>
            {Object.entries(variantsByCategory).map(([category, categoryVariants]) => (
              <optgroup key={category} label={category}>
                {categoryVariants.map((variant) => (
                  <option 
                    key={variant.id} 
                    value={variant.id}
                    title={variant.description}
                  >
                    {variant.displayName}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="control-group">
        <h3>Position Setup</h3>
        
        <div className="form-row">
          <label>FEN:</label>
          <input
            type="text"
            className="fen-input"
            placeholder="Enter FEN position..."
            value={fenInput}
            onChange={(e) => setFenInput(e.target.value)}
          />
        </div>

        <div className="form-row">
          <label>Moves:</label>
          <input
            type="text"
            placeholder="e2e4 e7e5..."
            value={movesInput}
            onChange={(e) => setMovesInput(e.target.value)}
          />
        </div>

        <div className="button-group">
          <button onClick={handleSetPosition}>Set Position</button>
          <button onClick={copyFenToClipboard}>Copy FEN</button>
        </div>
      </div>

      <div className="control-group">
        <h3>Game Controls</h3>
        
        <div className="button-group">
          <button onClick={onReset}>Reset</button>
          <button onClick={onUndo}>Undo</button>
          <button onClick={onFlip}>Flip Board</button>
        </div>

        <div className="form-row horizontal">
          <label>
            <input
              type="checkbox"
              checked={showDests}
              onChange={(e) => onShowDestsChange(e.target.checked)}
            />
            Show Legal Moves
          </label>
        </div>
      </div>

      <div className="control-group">
        <h3>Current Position</h3>
        
        <div className="form-row">
          <label>Current FEN:</label>
          <div className="moves-display" style={{ maxHeight: '100px' }}>
            {fen}
          </div>
        </div>

        <div className="form-row">
          <label>Status:</label>
          <div className="moves-display">
            {gameStatus}
          </div>
        </div>

        <div className="form-row">
          <label>Moves:</label>
          <div className="moves-display">
            {moves || 'No moves yet'}
          </div>
        </div>
      </div>

      <div className="control-group">
        <h3>Engine Analysis</h3>
        {engine ? (
          <>
            <div className="form-row">
              <span>Status: {engine.isLoading ? 'Loading...' : engine.isAnalyzing ? 'Analyzing...' : 'Ready'}</span>
            </div>
            {engine.depth > 0 && (
              <div className="form-row">
                <span>Depth: {engine.depth}</span>
              </div>
            )}
            {engine.evaluation !== null && (
              <div className="form-row">
                <span>Eval: {typeof engine.evaluation === 'string' ? engine.evaluation : engine.evaluation.toFixed(2)}</span>
              </div>
            )}
            {engine.bestMove && (
              <div className="form-row">
                <span>Best: {engine.bestMove}</span>
              </div>
            )}
            {engine.principalVariation.length > 0 && (
              <div className="form-row">
                <div className="moves-display">
                  PV: {engine.principalVariation.slice(0, 10).join(' ')}
                </div>
              </div>
            )}
            <div className="button-group">
              <button 
                onClick={engine.onAnalyze}
                disabled={engine.isLoading || engine.isAnalyzing}
              >
                Analyze
              </button>
              <button 
                onClick={engine.onStop}
                disabled={engine.isLoading || !engine.isAnalyzing}
              >
                Stop
              </button>
            </div>
            
            <div className="form-row">
              <label>Engine Output ({engine.engineOutput ? engine.engineOutput.length : 0} lines):</label>
              <textarea
                readOnly
                className="engine-output"
                style={{ 
                  width: '100%', 
                  height: '120px', 
                  fontSize: '0.8rem', 
                  fontFamily: 'monospace',
                  background: '#f5f5f5',
                  border: '1px solid #ddd',
                  padding: '5px'
                }}
                value={engine.engineOutput && engine.engineOutput.length > 0 
                  ? engine.engineOutput.slice(-10).join('\n') 
                  : 'No engine output yet. Click "Analyze" to start analysis.'}
              />
            </div>
          </>
        ) : (
          <div>Engine not available</div>
        )}
      </div>

      <div className="control-group">
        <h3>About</h3>
        <p style={{ fontSize: '0.85rem', lineHeight: '1.4', color: '#666' }}>
          Modern chess variants platform powered by ffish-es6, fairy-stockfish.wasm, 
          and chessgroundx. Play and analyze hundreds of chess variants.
        </p>
        
        <div style={{ marginTop: '1rem' }}>
          <a 
            href="https://github.com/ianfab/fairyground" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: '#4a90e2', 
              textDecoration: 'none', 
              fontSize: '0.85rem' 
            }}
          >
            View Source Code →
          </a>
        </div>
      </div>
    </div>
  )
}

export default Controls
