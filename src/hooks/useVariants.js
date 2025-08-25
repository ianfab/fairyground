import { useState, useCallback } from 'react'

export function useVariants() {
  const [variants, setVariants] = useState([])

  const loadVariants = useCallback(async () => {
    try {
      // First, get the list of actually available variants from ffish
      if (!window.ffish) {
        console.warn('ffish not available yet')
        return
      }
      
      const availableVariants = window.ffish.variants()
      console.log('Available variants from ffish:', availableVariants.length, 'variants')
      
      // Then load the variant metadata
      const response = await fetch('/variantsettings.txt')
      const text = await response.text()
      
      const variantList = []
      const lines = text.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('#') || !line.trim()) continue
        
        const parts = line.split('|')
        if (parts.length >= 4) {
          const [id, category, displayName, description] = parts
          const variantId = id.trim()
          
          // Only include variants that are actually available in ffish
          if (availableVariants.includes(variantId)) {
            variantList.push({
              id: variantId,
              category: category.trim(),
              displayName: displayName.trim(),
              description: description.trim()
            })
          } else {
            console.log(`Skipping variant ${variantId} - not available in ffish`)
          }
        }
      }
      
      setVariants(variantList)
      console.log(`Loaded ${variantList.length} available variants (filtered from ${availableVariants.length} total ffish variants)`)
    } catch (error) {
      console.error('Failed to load variants:', error)
      
      // Fallback: use built-in variants that we know exist
      if (window.ffish) {
        const availableVariants = window.ffish.variants()
        const basicVariants = ['chess', 'crazyhouse', 'atomic', 'kingofthehill', '3check', 'racingkings']
        const fallbackVariants = basicVariants
          .filter(v => availableVariants.includes(v))
          .map(v => ({
            id: v,
            category: 'Chess Variants',
            displayName: v.charAt(0).toUpperCase() + v.slice(1),
            description: `${v} variant`
          }))
        
        setVariants(fallbackVariants)
      }
    }
  }, [])

  const loadCustomVariants = useCallback(async (iniContent) => {
    try {
      if (window.ffish) {
        console.log('Loading custom variants from INI content...')
        window.ffish.loadVariantConfig(iniContent)
        
        // After loading custom variants, refresh the variant list
        console.log('Custom variants loaded, refreshing variant list...')
        
        // Small delay to ensure variants are registered
        setTimeout(() => {
          loadVariants()
        }, 100)
      } else {
        console.error('ffish not available for loading custom variants')
      }
    } catch (error) {
      console.error('Failed to load custom variants:', error)
    }
  }, [loadVariants])

  return { variants, loadVariants, loadCustomVariants }
}
