import { useState, useEffect } from 'react';
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
    <div className="calendar-shell">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="calendar-trigger"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span>{formatDateForDisplay(value) || 'Selecione uma data'}</span>
        <CalendarIcon size={18} className={required && !value ? 'text-[var(--negative)]' : 'text-[var(--text-soft)]'} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setIsOpen(false)} />
          <div className="calendar-popover surface-enter" role="dialog" aria-label="Selecionar data">
            <div className="calendar-nav">
              <button onClick={handlePrevMonth} className="icon-button" type="button" aria-label="Mês anterior">
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                }}
                className="calendar-nav__title"
                type="button"
              >
                {getMonthName(currentMonth)}
              </button>
              <button onClick={handleNextMonth} className="icon-button" type="button" aria-label="Próximo mês">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="calendar-weekdays">
              {weekDays.map((day, index) => (
                <div key={index} className="calendar-weekday">
                  {day}
                </div>
              ))}
            </div>

            <div className="calendar-grid">
              {days.map((dayObj, index) => {
                const isCurrentMonthDay = dayObj.isCurrentMonth;
                const isSelectedDay = isSelected(dayObj.date);
                const isTodayDay = isToday(dayObj.date);
                const classes = [
                  'calendar-day',
                  !isCurrentMonthDay ? 'calendar-day--outside' : '',
                  isSelectedDay ? 'calendar-day--selected' : '',
                  isTodayDay && !isSelectedDay ? 'calendar-day--today' : ''
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <button key={index} onClick={() => handleDateSelect(dayObj.date)} type="button" className={classes}>
                    {dayObj.day}
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="calendar-footer">
                <button onClick={handleClear} type="button" className="calendar-clear">
                  <X size={14} />
                  Limpar data
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
