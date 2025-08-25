import { useState, useEffect } from 'react'

export function useFfish() {
  const [ffish, setFfish] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function loadFfish() {
      try {
        console.log('Loading ffish-es6...')
        
        // Dynamic import of ffish-es6
        const Module = await import('ffish-es6')
        console.log('ffish-es6 module imported:', Module)
        
        // Initialize the module
        console.log('Initializing ffish module...')
        const loadedModule = await Module.default()
        console.log('ffish module initialized:', loadedModule)
        
        if (mounted) {
          setFfish(loadedModule)
          setIsLoading(false)
          console.log('ffish-es6 loaded successfully')
          
          // Make it available globally for debugging
          window.ffish = loadedModule
          
          // Test basic functionality
          console.log('Testing ffish functionality...')
          const testBoard = new loadedModule.Board('chess')
          console.log('Test board created:', testBoard)
          console.log('Starting FEN:', testBoard.fen())
          
          // Log available variants
          const variants = loadedModule.variants()
          console.log('Available variants:', variants.slice(0, 10), `... (${variants.length} total)`)
          
          testBoard.delete()
        }
      } catch (err) {
        console.error('Failed to load ffish-es6:', err)
        console.error('Error stack:', err.stack)
        if (mounted) {
          setError(err)
          setIsLoading(false)
        }
      }
    }

    loadFfish()

    return () => {
      mounted = false
    }
  }, [])

  return { ffish, isLoading, error }
}
