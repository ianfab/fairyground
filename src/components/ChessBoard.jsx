import React, { useEffect, useRef, useState } from 'react'
import { Chessground } from 'chessgroundx'
import * as pocketutil from 'chessgroundx/pocket'

function ChessBoard({ fen, variant, orientation, showDests, onMove, board, ffish }) {
  const boardRef = useRef(null)
  const pocketTopRef = useRef(null)
  const pocketBottomRef = useRef(null)
  const chessgroundRef = useRef(null)
  const [pocketRoles, setPocketRoles] = useState(null)
  const lastVariantRef = useRef(variant)

  // Convert chessgroundx key to square notation
  const convertKeyToSquare = (key) => {
    const ranks = ['1','2','3','4','5','6','7','8','9',':',';','<','=','>','?','@']
    return key.charAt(0) + (ranks.indexOf(key.charAt(1)) + 1).toString()
  }

  // Convert square notation to chessgroundx key
  const convertSquareToKey = (square) => {
    const ranks = ['1','2','3','4','5','6','7','8','9',':',';','<','=','>','?','@']
    return square.charAt(0) + ranks[parseInt(square.substring(1)) - 1]
  }

  // Get piece roles for pockets
  const getPieceRoles = (pieceLetters) => {
    if (!pieceLetters) return []
    const uniqueLetters = new Set(pieceLetters.toLowerCase().split(''))
    return [...uniqueLetters].map((char) => char + '-piece')
  }

  // Get pocket pieces for display
  const getPocketPieces = (color) => {
    if (!board || !pocketRoles) return new Map()
    
    try {
      const pocketString = board.pocket(color === 'white')
      if (!pocketString) return new Map()
      
      const pieces = new Map()
      for (const char of pocketString) {
        const role = char.toLowerCase() + '-piece'
        const count = pieces.get(role) || 0
        pieces.set(role, count + 1)
      }
      
      console.log(`Pocket pieces for ${color}:`, pieces)
      return pieces
    } catch (e) {
      console.warn('Error getting pocket pieces:', e)
      return new Map()
    }
  }

  // Get board dimensions
  const getDimensions = () => {
    if (!board || !ffish) return { width: 8, height: 8 }

    try {
      // Use ffish API to get board dimensions if available
      if (typeof ffish.boardWidth === 'function' && typeof ffish.boardHeight === 'function') {
        const width = ffish.boardWidth(variant)
        const height = ffish.boardHeight(variant)
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
      return { width: 8, height: 8 }
    }
  }

  // Get legal moves for current position
  const getLegalMoves = () => {
    if (!board) return new Map()

    try {
      const moves = board.legalMoves().split(' ').filter(move => move.length > 0)
      const dests = new Map()

      for (const move of moves) {
        let from, to
        
        if (move.includes('@')) {
          // Drop move
          const parts = move.split('@')
          to = convertSquareToKey(parts[1])
          // For drops, we don't set a 'from' square
          continue
        } else {
          // Regular move
          from = convertSquareToKey(move.substring(0, 2))
          to = convertSquareToKey(move.substring(2, 4))
        }

        if (!dests.has(from)) {
          dests.set(from, [])
        }
        dests.get(from).push(to)
      }

      return dests
    } catch (error) {
      console.error('Failed to get legal moves:', error)
      return new Map()
    }
  }

  // Handle move
  const handleMove = (orig, dest, metadata) => {
    if (!board) return

    try {
      const origSquare = convertKeyToSquare(orig)
      const destSquare = convertKeyToSquare(dest)
      
      let move = origSquare + destSquare
      
      // Handle promotion
      if (metadata.promotion) {
        move += metadata.promotion.charAt(0)
      }

      const success = onMove(move)
      
      if (!success) {
        // Invalid move - revert chessground
        chessgroundRef.current?.set({ fen: fen.split(' ')[0] })
      }
    } catch (error) {
      console.error('Move handling failed:', error)
      chessgroundRef.current?.set({ fen: fen.split(' ')[0] })
    }
  }

  // Handle piece drop
  const handleDrop = (piece, dest, metadata) => {
    if (!board) return

    try {
      const destSquare = convertKeyToSquare(dest)
      let pieceChar = piece.role.charAt(0).toUpperCase()
      
      if (piece.color === 'black') {
        pieceChar = pieceChar.toLowerCase()
      }

      const move = pieceChar + '@' + destSquare
      const success = onMove(move)
      
      if (!success) {
        // Invalid drop - revert chessground
        chessgroundRef.current?.set({ fen: fen.split(' ')[0] })
      }
    } catch (error) {
      console.error('Drop handling failed:', error)
      chessgroundRef.current?.set({ fen: fen.split(' ')[0] })
    }
  }

  // Initialize or update chessground
  useEffect(() => {
    if (!boardRef.current || !fen || !board || !ffish) return

    try {
      const fenBoard = fen.split(' ')[0]
      const dimensions = getDimensions()
      
      console.log(`Setting up chessground for ${variant} with dimensions ${dimensions.width}x${dimensions.height}`)
      
      // Calculate coordinate labels for the board size
      const files = []
      const ranks = []
      
      // Generate file labels (a, b, c, ... or a, b, c, d, e, f, g, h, i, j for 10-wide boards)
      for (let i = 0; i < dimensions.width; i++) {
        files.push(String.fromCharCode(97 + i)) // 'a' = 97
      }
      
      // Generate rank labels (1, 2, 3, ... up to board height)
      for (let i = 1; i <= dimensions.height; i++) {
        ranks.push(i.toString())
      }
      
      // Determine pocket roles
      let newPocketRoles = null
      if (fenBoard.includes('[')) {
        try {
          const wpocket = board.pocket(true)  // white
          const bpocket = board.pocket(false) // black
          
          console.log('White pocket:', wpocket, 'Black pocket:', bpocket)
          
          if (ffish.capturesToHand && ffish.capturesToHand(variant)) {
            // Variants where captured pieces go to hand
            const pieceLetters = fenBoard.replace(/[0-9kK\/\[\]]/g, '')
            const pieceRoles = getPieceRoles(pieceLetters)
            newPocketRoles = {
              white: pieceRoles,
              black: pieceRoles,
            }
            console.log('Captures to hand variant, pocket roles:', newPocketRoles)
          } else {
            // Variants with pre-placed pocket pieces
            newPocketRoles = {
              white: getPieceRoles(wpocket),
              black: getPieceRoles(bpocket),
            }
            console.log('Pre-placed pocket pieces, pocket roles:', newPocketRoles)
          }
        } catch (e) {
          console.warn('Error getting pocket information:', e)
        }
      }

      setPocketRoles(newPocketRoles)

      const config = {
        fen: fenBoard,
        orientation,
        movable: {
          free: false,
          color: board.turn() ? 'white' : 'black',
          dests: showDests ? getLegalMoves() : new Map(),
          events: {
            after: handleMove,
            afterNewPiece: handleDrop,
          },
        },
        draggable: {
          showGhost: true,
        },
        dimensions,
        pocketRoles: newPocketRoles,
        pockets: newPocketRoles ? {
          white: getPocketPieces('white'),
          black: getPocketPieces('black')
        } : undefined,
        notation: 0, // ALGEBRAIC
      }

      // Create chessground if it doesn't exist or variant changed, otherwise update it
      const variantChanged = lastVariantRef.current !== variant
      if (variantChanged) {
        lastVariantRef.current = variant
      }
      
      if (!chessgroundRef.current || variantChanged) {
        // Destroy existing chessground if variant changed
        if (chessgroundRef.current && variantChanged) {
          try {
            chessgroundRef.current.destroy?.()
            chessgroundRef.current = null
          } catch (e) {
            console.warn('Error destroying chessground for variant change:', e)
          }
        }
        
        try {
          chessgroundRef.current = Chessground(
            boardRef.current,
            config,
            pocketTopRef.current,
            pocketBottomRef.current
          )
          console.log('Chessground created successfully for variant:', variant)
          
          // Force redraw after variant change to fix piece alignment
          if (variantChanged) {
            setTimeout(() => {
              if (chessgroundRef.current) {
                chessgroundRef.current.redrawAll()
                console.log('Forced redraw after variant change')
              }
            }, 50)
          }
        } catch (e) {
          console.error('Error creating chessground:', e)
        }
      } else {
        // Update existing chessground
        try {
          chessgroundRef.current.set(config)
          console.log('Chessground updated successfully')
          
          // Update pockets separately if they exist
          if (newPocketRoles) {
            const pockets = {
              white: getPocketPieces('white'),
              black: getPocketPieces('black')
            }
            chessgroundRef.current.set({ 
              pockets,
              pocketRoles: newPocketRoles 
            })
            console.log('Pockets updated:', pockets)
          }
          
        } catch (e) {
          console.error('Error updating chessground:', e)
          // If update fails, recreate
          try {
            chessgroundRef.current.destroy?.()
            chessgroundRef.current = Chessground(
              boardRef.current,
              config,
              pocketTopRef.current,
              pocketBottomRef.current
            )
            console.log('Chessground recreated after update failure')
          } catch (e2) {
            console.error('Error recreating chessground:', e2)
          }
        }
      }

      // Update pocket visibility for all cases
      if (pocketTopRef.current && pocketBottomRef.current) {
        if (newPocketRoles) {
          pocketTopRef.current.style.display = 'flex'
          pocketBottomRef.current.style.display = 'flex'
          console.log('Pockets shown')
        } else {
          pocketTopRef.current.style.display = 'none'
          pocketBottomRef.current.style.display = 'none'
          console.log('Pockets hidden')
        }
      }
    } catch (error) {
      console.error('Error in chessground initialization:', error)
    }

  }, [fen, variant, orientation, showDests, board, ffish])

  // Cleanup
  useEffect(() => {
    return () => {
      if (chessgroundRef.current) {
        chessgroundRef.current.destroy?.()
        chessgroundRef.current = null
      }
    }
  }, [])

  const dimensions = getDimensions()
  const boardClass = `board${dimensions.width}x${dimensions.height}`

  return (
    <div className={`chess-board-wrapper default brownboard ${boardClass}`}>
      <div 
        ref={pocketTopRef} 
        className={`pocket pocket-top ${!pocketRoles ? 'hidden' : ''}`}
      />
      
      <div className="chessground-container">
        <div ref={boardRef} className="chessground-board" />
      </div>
      
      <div 
        ref={pocketBottomRef} 
        className={`pocket pocket-bottom ${!pocketRoles ? 'hidden' : ''}`}
      />
    </div>
  )
}

export default ChessBoard
