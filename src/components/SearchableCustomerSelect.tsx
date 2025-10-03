'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline'

interface Customer {
  id: string
  name: string
}

interface SearchableCustomerSelectProps {
  name: string
  value: string
  onChange: (e: { target: { name: string; value: string } }) => void
  customers: Customer[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export default function SearchableCustomerSelect({
  name,
  value,
  onChange,
  customers,
  placeholder = "Search and select customer",
  disabled = false,
  className = ""
}: SearchableCustomerSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedCustomer = customers?.find(customer => customer.id === value)

  // Filter customers based on search term
  const filteredCustomers = customers?.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (customer: Customer) => {
    onChange({
      target: {
        name,
        value: customer.id
      }
    })
    setIsOpen(false)
    setSearchTerm('')
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredCustomers[highlightedIndex]) {
          handleSelect(filteredCustomers[highlightedIndex])
        } else if (filteredCustomers.length === 1) {
          handleSelect(filteredCustomers[0])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex(prev => 
            prev < filteredCustomers.length - 1 ? prev + 1 : 0
          )
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCustomers.length - 1
          )
        }
        break
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setHighlightedIndex(-1)
  }

  const handleButtonClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        setSearchTerm('')
        setHighlightedIndex(-1)
      }
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={handleButtonClick}
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
          <span className={selectedCustomer ? 'text-gray-900' : 'text-gray-500'}>
            {selectedCustomer ? selectedCustomer.name : placeholder}
          </span>
          <ChevronDownIcon 
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search customers..."
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-60 overflow-auto">
            {filteredCustomers.length > 0 ? (
              <div className="py-1" role="listbox">
                {filteredCustomers.map((customer, index) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleSelect(customer)}
                    className={`
                      w-full px-3 py-2 text-sm text-left transition-colors duration-150
                      text-gray-900 hover:bg-gray-50 cursor-pointer
                      ${customer.id === value 
                        ? 'bg-green-50 text-green-700 font-medium' 
                        : ''
                      }
                      ${index === highlightedIndex 
                        ? 'bg-gray-100' 
                        : ''
                      }
                    `}
                    role="option"
                    aria-selected={customer.id === value}
                  >
                    <div className="flex items-center justify-between">
                      <span>{customer.name}</span>
                      {customer.id === value && (
                        <CheckIcon className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                {searchTerm ? 'No customers found matching your search' : 'No customers available'}
              </div>
            )}
          </div>

          {/* Footer with count */}
          {filteredCustomers.length > 0 && (
            <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
              {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
