'use client'

import { useEffect, useState, useRef } from 'react'
import Radar from 'radar-sdk-js'

interface AddressAutocompleteProps {
  onSelect: (address: {
    street: string
    city: string
    state: string
    zip: string
  }) => void
  defaultValue?: string
}

export default function AddressAutocomplete({ onSelect, defaultValue = '' }: AddressAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_RADAR_API_KEY) {
      Radar.initialize(process.env.NEXT_PUBLIC_RADAR_API_KEY)
    }
  }, [])

  // --- FIX: Sync internal state when parent data loads ---
  useEffect(() => {
    if (defaultValue) {
        setQuery(defaultValue)
    }
  }, [defaultValue])
  // ------------------------------------------------------

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [wrapperRef])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (value.length > 2) {
      Radar.autocomplete({
        query: value,
        limit: 5,
        country: 'US'
      })
      .then((result: any) => {
        if (result.addresses) {
          setSuggestions(result.addresses)
          setShowSuggestions(true)
        }
      })
      .catch((err: any) => {
        console.error("Radar Error:", err)
      })
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSelect = (address: any) => {
    const display = `${address.number} ${address.street}, ${address.city}, ${address.stateCode}`
    setQuery(display)
    setShowSuggestions(false)

    onSelect({
      street: `${address.number} ${address.street}`,
      city: address.city,
      state: address.stateCode,
      zip: address.postalCode
    })
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-bold mb-2">Search Address</label>
      <input
        type="text"
        value={query}
        onChange={handleInput}
        placeholder="Start typing your address..."
        className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        autoComplete="off"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-xl max-h-60 overflow-y-auto">
          {suggestions.map((item: any, index: number) => (
            <li 
              key={index}
              onClick={() => handleSelect(item)}
              className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-b-0 border-gray-100"
            >
              <div className="font-bold text-gray-800">
                {item.number} {item.street}
              </div>
              <div className="text-xs text-gray-500">
                {item.city}, {item.stateCode} {item.postalCode}
              </div>
            </li>
          ))}
          <li className="p-2 bg-gray-50 text-xs text-right text-gray-400">
            Powered by Radar
          </li>
        </ul>
      )}
    </div>
  )
}