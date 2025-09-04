'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultiSelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxSelections?: number
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  className,
  disabled = false,
  maxSelections
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get selected options
  const selectedOptions = options.filter(option => value.includes(option.value))

  // Handle option toggle
  const handleOptionToggle = (optionValue: string) => {
    if (disabled) return

    const isSelected = value.includes(optionValue)
    let newValue: string[]

    if (isSelected) {
      newValue = value.filter(v => v !== optionValue)
    } else {
      if (maxSelections && value.length >= maxSelections) {
        return // Don't add if max selections reached
      }
      newValue = [...value, optionValue]
    }

    onChange(newValue)
  }

  // Remove selected option
  const removeOption = (optionValue: string) => {
    if (disabled) return
    onChange(value.filter(v => v !== optionValue))
  }

  // Clear all selections
  const clearAll = () => {
    if (disabled) return
    onChange([])
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Selected options display */}
      <div
        className={cn(
          "min-h-[48px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent",
          disabled && "bg-gray-50 cursor-not-allowed opacity-50"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1">
          {selectedOptions.length > 0 ? (
            selectedOptions.map(option => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
              >
                {option.label}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeOption(option.value)
                    }}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        
        {/* Clear all button */}
        {selectedOptions.length > 0 && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              clearAll()
            }}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Dropdown arrow */}
        <ChevronDown className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform pointer-events-none",
          isOpen && "rotate-180"
        )} />
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options list */}
          <div className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => {
                const isSelected = value.includes(option.value)
                const isDisabled = option.disabled || (!!maxSelections && value.length >= maxSelections && !isSelected)
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionToggle(option.value)}
                    disabled={isDisabled}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100",
                      isSelected && "bg-blue-50 text-blue-900",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 border border-gray-300 rounded flex items-center justify-center",
                      isSelected && "bg-blue-600 border-blue-600"
                    )}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    {option.label}
                  </button>
                )
              })
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
            )}
          </div>

          {/* Max selections indicator */}
          {maxSelections && (
            <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200">
              {value.length}/{maxSelections} selected
            </div>
          )}
        </div>
      )}
    </div>
  )
}
