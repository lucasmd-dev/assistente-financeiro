import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';

const Calendar = ({ value, onChange, onClear, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      const [year, month] = value.split('-').map(Number);
      return new Date(year, month - 1, 1);
    }
    return new Date();
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    if (value) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return null;
  });

  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
      setCurrentMonth(new Date(year, month - 1, 1));
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  };

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMonthName = (date) => {
    const name = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, daysInPrevMonth - i)
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day)
      });
    }

    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month + 1, day)
      });
    }

    return days;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    onChange(formatDateForInput(date));
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleClear = () => {
    setSelectedDate(null);
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
    setIsOpen(false);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="relative">
      <div className="relative group">
        <input
          type="text"
          readOnly
          value={formatDateForDisplay(value)}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full bg-black/40 border rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 cursor-pointer pr-10 transition-colors duration-200 ${
            required && !value 
              ? 'border-rose-500/50 hover:border-rose-500' 
              : 'border-white/10 hover:border-white/20'
          } ${isOpen ? 'border-blue-500 ring-1 ring-blue-500/50' : ''}`}
          placeholder="Selecione uma data"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-hover:text-white">
          <CalendarIcon size={18} className="text-zinc-500" />
        </div>
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[55]" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-[60] w-[320px] max-w-[calc(100vw-2rem)] p-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-white/5 rounded-lg transition text-zinc-400 hover:text-white"
                type="button"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                }}
                className="text-sm font-bold text-white hover:text-blue-400 transition"
                type="button"
              >
                {getMonthName(currentMonth)}
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-white/5 rounded-lg transition text-zinc-400 hover:text-white"
                type="button"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className={`text-center text-xs font-bold py-2 ${
                    index === 0 || index === 6 ? 'text-rose-500' : 'text-zinc-500'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((dayObj, index) => {
                const isCurrentMonthDay = dayObj.isCurrentMonth;
                const isSelectedDay = isSelected(dayObj.date);
                const isTodayDay = isToday(dayObj.date);

                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(dayObj.date)}
                    type="button"
                    className={`
                      aspect-square p-1 rounded-lg text-sm font-medium transition-all relative
                      ${!isCurrentMonthDay 
                        ? 'text-zinc-700 hover:bg-white/5 hover:text-zinc-500' 
                        : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                      }
                      ${isSelectedDay 
                        ? '!bg-blue-600 !text-white shadow-lg shadow-blue-900/50 scale-105 z-10' 
                        : ''
                      }
                      ${isTodayDay && !isSelectedDay 
                        ? 'border border-blue-500/50 text-blue-400' 
                        : ''
                      }
                    `}
                  >
                    {dayObj.day}
                    {isTodayDay && !isSelectedDay && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="mt-5 pt-4 border-t border-white/5">
                <button
                  onClick={handleClear}
                  type="button"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                >
                  <X size={14} />
                  Limpar Data
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Calendar;
