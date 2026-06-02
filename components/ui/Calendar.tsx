'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { fieldInputClass } from './Field';

interface CalendarProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (date: string) => void;
  onClear?: () => void;
  required?: boolean;
}

interface DayCell {
  day: number;
  isCurrentMonth: boolean;
  date: Date;
}

export function Calendar({ value, onChange, onClear, required = false }: CalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (value) {
      const [year, month] = value.split('-').map(Number);
      return new Date(year, month - 1, 1);
    }
    return new Date();
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
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

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  };

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMonthName = (date: Date) => {
    const name = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const getDaysInMonth = (date: Date): DayCell[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days: DayCell[] = [];

    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, isCurrentMonth: false, date: new Date(year, month - 1, daysInPrevMonth - i) });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, isCurrentMonth: true, date: new Date(year, month, day) });
    }
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ day, isCurrentMonth: false, date: new Date(year, month + 1, day) });
    }
    return days;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onChange(formatDateForInput(date));
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedDate(null);
    if (onClear) onClear();
    else onChange('');
    setIsOpen(false);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(fieldInputClass, 'flex items-center justify-between text-left')}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className={value ? 'text-white' : 'text-white/35'}>
          {formatDateForDisplay(value) || 'Selecione uma data'}
        </span>
        <CalendarIcon
          size={18}
          className={required && !value ? 'text-[oklch(0.8_0.2_14)]' : 'text-white/40'}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[55]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              role="dialog"
              aria-label="Selecionar data"
              className="glass-strong edge-light absolute right-0 z-[56] mt-2 w-[min(18rem,calc(100vw-3rem))] rounded-2xl p-3 shadow-[var(--shadow-glass)] sm:left-0 sm:right-auto"
            >
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="grid size-8 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                  }}
                  className="rounded-lg px-3 py-1 text-sm font-semibold text-white/90 hover:bg-white/5"
                >
                  {getMonthName(currentMonth)}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="grid size-8 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
                  aria-label="Próximo mês"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="mb-1 grid grid-cols-7 gap-1">
                {weekDays.map((d, i) => (
                  <div key={i} className="grid h-8 place-items-center text-[0.7rem] font-semibold text-white/35">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((cell, index) => {
                  const selectedDay = isSelected(cell.date);
                  const todayDay = isToday(cell.date) && !selectedDay;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleDateSelect(cell.date)}
                      className={cn(
                        'num grid h-9 place-items-center rounded-lg text-sm transition-colors',
                        !cell.isCurrentMonth && 'text-white/25',
                        cell.isCurrentMonth && !selectedDay && 'text-white/80 hover:bg-white/10',
                        selectedDay &&
                          'bg-[linear-gradient(135deg,oklch(0.64_0.25_286),oklch(0.58_0.24_295))] font-semibold text-white shadow-[0_6px_18px_-6px_oklch(0.64_0.25_286/0.8)]',
                        todayDay && 'ring-1 ring-[oklch(0.7_0.18_286/0.6)]',
                      )}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <div className="mt-2 border-t border-[var(--color-edge)] pt-2">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs text-white/50 hover:bg-white/5 hover:text-white"
                  >
                    <X size={13} /> Limpar data
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
