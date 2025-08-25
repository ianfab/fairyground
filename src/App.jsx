import React, { useState, useEffect, useCallback } from 'react'
import ChessBoard from './components/ChessBoard'
import Controls from './components/Controls'
import ErrorBoundary from './components/ErrorBoundary'
import { useFfish } from './hooks/useFfish'
import { useVariants } from './hooks/useVariants'
import { useEngine } from './hooks/useEngine'

function App() {
  const { ffish, isLoading: ffishLoading } = useFfish()
  const { variants, loadVariants } = useVariants()
  const { 
    engine, 
    isLoading: engineLoading, 
    isAnalyzing, 
    evaluation, 
    bestMove, 
    principalVariation, 
    depth,
    engineOutput,
    analyzePosition, 
    stopAnalysis 
  } = useEngine()
  
  const [currentVariant, setCurrentVariant] = useState('chess')
  const [board, setBoard] = useState(null)
  const [fen, setFen] = useState('')
  const [moves, setMoves] = useState('')
  const [gameStatus, setGameStatus] = useState('')
  const [orientation, setOrientation] = useState('white')
  const [showDests, setShowDests] = useState(true)

  const initializeBoard = useCallback((variant) => {
    if (!ffish) return

    try {
      // Clean up previous board
      if (board) {
        try {
          board.delete()
        } catch (e) {
          console.warn('Error deleting previous board:', e)
        }
        setBoard(null)
      }

      // Validate variant first
      const availableVariants = ffish.variants()
      if (!availableVariants.includes(variant)) {
        console.error(`Unknown variant: ${variant}. Available variants:`, availableVariants.slice(0, 10), '...')
        console.log(`Total available variants: ${availableVariants.length}`)
        return
      }

      // Get starting FEN for the variant
      let startingFen
      try {
        startingFen = ffish.startingFen(variant)
      } catch (e) {
        console.error(`Failed to get starting FEN for ${variant}:`, e)
        return
      }

      // Create new board
      const newBoard = new ffish.Board(
        variant,
        startingFen,
        false // Fischer Random
      )
      
      setBoard(newBoard)
      setFen(newBoard.fen())
      setMoves('')
      setGameStatus('')
      
      console.log(`Initialized ${variant} board with FEN: ${startingFen}`)
    } catch (error) {
      console.error('Failed to initialize board:', error)
      // Reset to chess if variant initialization fails
      if (variant !== 'chess') {
        console.log('Falling back to chess variant')
        setTimeout(() => initializeBoard('chess'), 100)
      }
    }
  }, [ffish, board])

  // Initialize board when ffish is ready
  useEffect(() => {
    if (ffish && !board) {
      console.log('ffish loaded, initializing board and loading variants')
      initializeBoard(currentVariant)
      loadVariants()
    }
  }, [ffish, board, currentVariant, loadVariants, initializeBoard])

  const handleVariantChange = useCallback((variant) => {
    if (variant === currentVariant) return // Prevent unnecessary re-initialization
    
    console.log(`Switching from ${currentVariant} to ${variant}`)
    setCurrentVariant(variant)
    
    // Small delay to ensure state is updated
    setTimeout(() => {
      initializeBoard(variant)
    }, 50)
  }, [currentVariant, initializeBoard])

  const handleMove = useCallback((move) => {
    if (!board) return false

    try {
      console.log('Attempting move:', move)
      
      // Check if move is legal
      const legalMoves = board.legalMoves().split(' ')
      console.log('Legal moves:', legalMoves)
      
      if (!legalMoves.includes(move)) {
        console.log('Illegal move attempted:', move)
        return false
      }
      
      const success = board.push(move)
      if (success) {
        const newFen = board.fen()
        console.log('Move successful, new FEN:', newFen)
        setFen(newFen)
        updateGameStatus()
        
        // Update move history - create move list from current moves + new move
        const currentMoves = moves.trim()
        const newMoves = currentMoves ? `${currentMoves} ${move}` : move
        setMoves(newMoves)
        
        // Trigger engine analysis of new position
        if (analyzePosition) {
          setTimeout(() => analyzePosition(newFen, currentVariant), 100)
        }
        
        return true
      }
      return false
    } catch (error) {
      console.error('Move failed:', error)
      return false
    }
  }, [board, currentVariant, analyzePosition, moves])

  const handleUndo = useCallback(() => {
    // Check if there are moves to undo
    const currentMoves = moves.trim()
    if (!board || !currentMoves) return

    try {
      board.pop()
      const newFen = board.fen()
      setFen(newFen)
      
      // Update move history by removing the last move
      const moveList = currentMoves.split(' ')
      moveList.pop()
      setMoves(moveList.join(' '))
      
      updateGameStatus()
    } catch (error) {
      console.error('Undo failed:', error)
    }
  }, [board, moves])

  const handleReset = useCallback(() => {
    if (!board) return
    
    try {
      board.reset()
      setFen(board.fen())
      setMoves('')
      setGameStatus('')
    } catch (error) {
      console.error('Reset failed:', error)
    }
  }, [board])

  const handleSetPosition = useCallback((newFen, newMoves = '') => {
    if (!board || !ffish) return

    try {
      // Validate FEN
      const validation = ffish.validateFen(newFen, currentVariant, false)
      if (validation < 0) {
        console.error('Invalid FEN')
        return
      }

      // Set position
      board.setFen(newFen)
      
      // Apply moves if provided
      if (newMoves.trim()) {
        const moveList = newMoves.trim().split(/\s+/)
        for (const move of moveList) {
          if (!board.push(move)) {
            console.error(`Invalid move: ${move}`)
            break
          }
        }
      }
      
      setFen(board.fen())
      setMoves(newMoves)
      updateGameStatus()
    } catch (error) {
      console.error('Set position failed:', error)
    }
  }, [board, ffish, currentVariant])

  const updateGameStatus = useCallback(() => {
    if (!board) return

    try {
      let status = ''
      
      if (board.isGameOver()) {
        const result = board.result()
        status = `Game Over: ${result}`
      } else if (board.isCheck()) {
        status = `${board.turn() ? 'White' : 'Black'} is in check`
      } else {
        status = `${board.turn() ? 'White' : 'Black'} to move`
      }
      
      setGameStatus(status)
      
      // Start engine analysis for non-game-over positions
      if (!board.isGameOver() && engine && !engineLoading) {
        analyzePosition(board.fen(), currentVariant)
      }
    } catch (error) {
      console.error('Status update failed:', error)
    }
  }, [board, engine, engineLoading, analyzePosition, currentVariant])

  const getBoardDimensions = useCallback(() => {
    if (!board || !ffish) return { width: 8, height: 8 }

    try {
      // Use ffish API to get board dimensions if available
      if (typeof ffish.boardWidth === 'function' && typeof ffish.boardHeight === 'function') {
        const width = ffish.boardWidth(currentVariant)
        const height = ffish.boardHeight(currentVariant)
        return { width, height }
      }
      
      // Fallback: parse FEN to get dimensions
      const fenBoard = board.fen().split(' ')[0]
      const ranks = fenBoard.split('/').length
      
      // Get files from the first rank
      const firstRank = fenBoard.split('/')[0]
      let files = 0
      
      for (let i = 0; i < firstRank.length; i++) {
        const char = firstRank[i]
        if (char >= '1' && char <= '9') {
          files += parseInt(char)
        } else if (char !== '[' && char !== ']') {
          files += 1
        }
      }

      return { width: files, height: ranks }
    } catch (error) {
      console.error('Failed to get dimensions:', error)
      // Return default 8x8 for standard chess
      return { width: 8, height: 8 }
    }
  }, [board, ffish, currentVariant])

  if (ffishLoading) {
    return (
      <div className="app">
        <div className="loading">
          <div>Loading chess engine...</div>
          <div style={{fontSize: '0.8rem', marginTop: '10px'}}>
            Check browser console for loading details
          </div>
        </div>
      </div>
    )
  }

  if (!ffish) {
    return (
      <div className="app">
        <div className="loading">
          <div>Failed to load chess engine</div>
          <div style={{fontSize: '0.8rem', marginTop: '10px'}}>
            Check browser console for errors
          </div>
        </div>
      </div>
    )
  }

  const dimensions = getBoardDimensions()
  const boardClass = `board${dimensions.width}x${dimensions.height}`

  return (
    <div className="app">
      <header className="header">
        <h1>Fairyground - Modern Chess Variants</h1>
      </header>
      
      <main className={`main-content ${boardClass}`}>
        <div className="board-section">
          <ErrorBoundary onReset={() => handleVariantChange('chess')}>
            <ChessBoard
              fen={fen}
              variant={currentVariant}
              orientation={orientation}
              showDests={showDests}
              onMove={handleMove}
              board={board}
              ffish={ffish}
            />
          </ErrorBoundary>
        </div>
        
        <div className="controls-section">
          <Controls
            variants={variants}
            currentVariant={currentVariant}
            onVariantChange={handleVariantChange}
            fen={fen}
            moves={moves}
            onSetPosition={handleSetPosition}
            onUndo={handleUndo}
            onReset={handleReset}
            onFlip={() => setOrientation(o => o === 'white' ? 'black' : 'white')}
            showDests={showDests}
            onShowDestsChange={setShowDests}
            gameStatus={gameStatus}
            engine={{
              isLoading: engineLoading,
              isAnalyzing,
              evaluation,
              bestMove,
              principalVariation,
              depth,
              engineOutput,
              onAnalyze: () => board && analyzePosition(board.fen(), currentVariant),
              onStop: stopAnalysis
            }}
          />
        </div>
      </main>
      
      <footer className="status-bar">
        <div>{gameStatus}</div>
        <div>ffish-es6 • chessgroundx • React</div>
      </footer>
    </div>
  )
}

export default App
