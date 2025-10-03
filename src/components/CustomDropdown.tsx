'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'

interface DropdownOption {
  value: string
  label: string
  disabled?: boolean
}

interface CustomDropdownProps {
  name: string
  value: string
  onChange: (e: { target: { name: string; value: string } }) => void
  options: DropdownOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export default function CustomDropdown({
  name,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className = ""
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(option => option.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelect = (option: DropdownOption) => {
    if (option.disabled) return
    
    onChange({
      target: {
        name,
        value: option.value
      }
    })
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        setIsOpen(!isOpen)
        break
      case 'Escape':
        setIsOpen(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          const currentIndex = options.findIndex(opt => opt.value === value)
          const nextIndex = Math.min(currentIndex + 1, options.length - 1)
          handleSelect(options[nextIndex])
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          const currentIndex = options.findIndex(opt => opt.value === value)
          const prevIndex = Math.max(currentIndex - 1, 0)
          handleSelect(options[prevIndex])
        }
        break
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full px-3 py-2.5 text-sm border rounded-lg shadow-sm bg-white text-left
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
          transition-colors duration-200
          ${disabled 
            ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200' 
            : 'text-gray-900 border-gray-300 hover:border-gray-400 cursor-pointer'
          }
          ${isOpen && !disabled ? 'ring-2 ring-green-500 border-green-500' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
      >
        <div className="flex items-center justify-between">
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDownIcon 
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="py-1" role="listbox">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                disabled={option.disabled}
                className={`
                  w-full px-3 py-2 text-sm text-left transition-colors duration-150
                  ${option.disabled 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-900 hover:bg-gray-50 cursor-pointer'
                  }
                  ${option.value === value 
                    ? 'bg-green-50 text-green-700 font-medium' 
                    : ''
                  }
                `}
                role="option"
                aria-selected={option.value === value}
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  {option.value === value && (
                    <CheckIcon className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
