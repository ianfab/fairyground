import { useState, useEffect, useRef, useCallback } from 'react'

export function useEngine() {
  const [engine, setEngine] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [evaluation, setEvaluation] = useState(null)
  const [bestMove, setBestMove] = useState(null)
  const [principalVariation, setPrincipalVariation] = useState([])
  const [depth, setDepth] = useState(0)
  const [engineOutput, setEngineOutput] = useState([])

  useEffect(() => {
    let mounted = true

    async function loadEngine() {
      try {
        console.log('Loading Stockfish engine...')
        
        // Load the stockfish.js as a script to get the Stockfish constructor
        if (!window.Stockfish) {
          const stockfishScript = document.createElement('script')
          stockfishScript.src = '/lib/stockfish.js'
          
          const scriptPromise = new Promise((resolve, reject) => {
            stockfishScript.onload = resolve
            stockfishScript.onerror = reject
          })
          
          document.head.appendChild(stockfishScript)
          await scriptPromise
          console.log('Stockfish script loaded')
        }
        
        if (!window.Stockfish) {
          throw new Error('Stockfish not available after loading script')
        }
        
        console.log('Initializing Stockfish module...')
        
        // Initialize Stockfish module
        const stockfish = await window.Stockfish()
        console.log('Stockfish module initialized:', stockfish)
        
        setEngineOutput(['=== ENGINE SESSION STARTED ===', 'Stockfish initialized successfully'])
        
        // Set up message listener - the module should have print/printErr functions that we can override
        stockfish.print = stockfish.printErr = (text) => {
          console.log('Engine output:', text)
          
          if (text && typeof text === 'string' && text.trim()) {
            setEngineOutput(prev => {
              const newOutput = [...prev, `OUT: ${text}`]
              return newOutput.slice(-50)
            })
            
            if (text.startsWith('info depth')) {
              parseEngineOutput(text)
            } else if (text.startsWith('bestmove')) {
              const move = text.split(' ')[1]
              if (move !== '(none)') {
                setBestMove(move)
              }
              setIsAnalyzing(false)
            } else if (text === 'readyok') {
              console.log('Engine ready')
            } else if (text === 'uciok') {
              console.log('UCI protocol initialized')
            }
          }
        }
        
        // Initialize engine with proper UCI protocol
        console.log('Sending UCI command to engine')
        stockfish.postMessage("uci")
        setEngineOutput(prev => [...prev, 'SENT: uci'])
        
        // Wait a bit for UCI response before continuing
        setTimeout(() => {
          stockfish.postMessage("setoption name Threads value 1")
          stockfish.postMessage("setoption name Hash value 16")
          stockfish.postMessage("ucinewgame")
          stockfish.postMessage("isready")
          console.log('Sent engine initialization commands')
          setEngineOutput(prev => [...prev, 
            'SENT: setoption name Threads value 1', 
            'SENT: setoption name Hash value 16', 
            'SENT: ucinewgame', 
            'SENT: isready'
          ])
        }, 500)
        
        if (mounted) {
          setEngine(stockfish)
          setIsLoading(false)
          console.log('Stockfish engine loaded successfully')
        }
      } catch (err) {
        console.error('Failed to load engine:', err)
        setEngineOutput(prev => [...prev, `LOAD ERROR: ${err.message}`])
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadEngine()

    return () => {
      mounted = false
      // No need to terminate since we're using the main module directly
    }
  }, [])

  const parseEngineOutput = useCallback((line) => {
    // Parse UCI engine output
    // Example: info depth 10 seldepth 12 multipv 1 score cp 25 nodes 12345 nps 98765 time 125 pv e2e4 e7e5 g1f3
    
    const parts = line.split(' ')
    let currentDepth = 0
    let score = null
    let pv = []
    
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === 'depth' && i + 1 < parts.length) {
        currentDepth = parseInt(parts[i + 1])
      } else if (parts[i] === 'score') {
        if (i + 2 < parts.length) {
          const scoreType = parts[i + 1]
          const scoreValue = parseInt(parts[i + 2])
          
          if (scoreType === 'cp') {
            score = scoreValue / 100 // Convert centipawns to pawns
          } else if (scoreType === 'mate') {
            score = scoreValue > 0 ? `M${scoreValue}` : `M${Math.abs(scoreValue)}`
          }
        }
      } else if (parts[i] === 'pv') {
        pv = parts.slice(i + 1)
        break
      }
    }
    
    if (currentDepth > 0) {
      setDepth(currentDepth)
    }
    if (score !== null) {
      setEvaluation(score)
    }
    if (pv.length > 0) {
      setPrincipalVariation(pv)
    }
  }, [])

  const analyzePosition = useCallback((fen, variant = 'chess') => {
    if (!engine || isAnalyzing) return
    
    console.log(`Starting analysis of ${variant} position: ${fen}`)
    setIsAnalyzing(true)
    setEvaluation(null)
    setBestMove(null)
    setPrincipalVariation([])
    setDepth(0)
    
    // Add to engine output
    setEngineOutput(prev => [...prev, 
      `=== ANALYSIS START (${variant}) ===`, 
      `SENT: position fen ${fen}`,
      `SENT: go depth 15`
    ])
    
    // Set position and start analysis
    try {
      engine.postMessage("stop")
      setTimeout(() => {
        const positionCmd = `position fen ${fen}`
        const goCmd = "go depth 15"
        
        engine.postMessage(positionCmd)
        engine.postMessage(goCmd)
        
        console.log('Sent analysis commands:', positionCmd, goCmd)
      }, 100)
    } catch (error) {
      console.error('Error sending commands to engine:', error)
      setEngineOutput(prev => [...prev, `ERROR: ${error.message}`])
      setIsAnalyzing(false)
    }
  }, [engine, isAnalyzing])

  const stopAnalysis = useCallback(() => {
    if (engine && isAnalyzing) {
      engine.postMessage("stop")
      setIsAnalyzing(false)
    }
  }, [engine, isAnalyzing])

  return {
    engine,
    isLoading,
    isAnalyzing,
    evaluation,
    bestMove,
    principalVariation,
    depth,
    engineOutput,
    analyzePosition,
    stopAnalysis
  }
}
