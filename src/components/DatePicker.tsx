'use client'

import { useState, useRef, useEffect } from 'react'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface DatePickerProps {
  name: string
  value: string
  onChange: (e: { target: { name: string; value: string } }) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minDate?: string
  maxDate?: string
}

export default function DatePicker({
  name,
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className = "",
  minDate,
  maxDate
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedDate = value ? new Date(value) : null

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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatInputValue = (date: Date) => {
    // Use local timezone to avoid date shifting
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const isDateDisabled = (date: Date) => {
    if (minDate && date < new Date(minDate)) return true
    if (maxDate && date > new Date(maxDate)) return true
    return false
  }

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return
    
    onChange({
      target: {
        name,
        value: formatInputValue(date)
      }
    })
    setIsOpen(false)
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const handleToday = () => {
    const today = new Date()
    if (!isDateDisabled(today)) {
      handleDateSelect(today)
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const days = getDaysInMonth(currentMonth)

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
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
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-disabled={disabled}
      >
        <div className="flex items-center justify-between">
          <span className={selectedDate ? 'text-gray-900' : 'text-gray-500'}>
            {selectedDate ? formatDate(selectedDate) : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 text-gray-400" />
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 min-w-[280px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
            </button>
            <h3 className="text-sm font-medium text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRightIcon className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-xs text-gray-500 text-center py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="h-8" />
              }

              const isDisabled = isDateDisabled(day)
              const isSelected = isDateSelected(day)
              const isTodayDate = isToday(day)

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  disabled={isDisabled}
                  className={`
                    h-8 w-8 text-xs rounded transition-colors
                    ${isDisabled 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-900 hover:bg-gray-100 cursor-pointer'
                    }
                    ${isSelected 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : ''
                    }
                    ${isTodayDate && !isSelected 
                      ? 'bg-green-100 text-green-700 font-medium' 
                      : ''
                    }
                  `}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>

          {/* Today button */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={handleToday}
              disabled={isDateDisabled(new Date())}
              className="w-full text-xs text-green-600 hover:text-green-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
