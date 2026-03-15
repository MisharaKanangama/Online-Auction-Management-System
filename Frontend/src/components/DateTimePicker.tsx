import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import dayjs from 'dayjs';
import { Calendar, Clock } from 'lucide-react';

interface DateTimePickerProps {
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  showTimeSelect?: boolean;
  timeFormat?: string;
  dateFormat?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  selectedDate,
  onChange,
  placeholder = "Select date and time",
  minDate,
  maxDate,
  showTimeSelect = true,
  timeFormat = "HH:mm",
  dateFormat = "MMM dd, yyyy HH:mm",
  className = "",
  disabled = false,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateChange = (date: Date | null) => {
    console.log('DateTimePicker - Date selected:', date);
    console.log('DateTimePicker - Date as ISO string:', date?.toISOString());
    console.log('DateTimePicker - Date as local string:', date?.toLocaleString());
    onChange(date);
  };

  const formatDisplayValue = (date: Date | null): string => {
    if (!date) return '';
    return dayjs(date).format('MMM DD, YYYY hh:mm A');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          showTimeSelect={showTimeSelect}
          timeFormat={timeFormat}
          dateFormat={dateFormat}
          placeholderText={placeholder}
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled}
          required={required}
          open={isOpen}
          onSelect={() => setIsOpen(false)}
          onClickOutside={() => setIsOpen(false)}
          className="w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          wrapperClassName="w-full"
          popperClassName="z-50"
          showPopperArrow={false}
          timeIntervals={1}
          timeCaption="Time"
          customInput={
            <div className="relative">
              <input
                type="text"
                value={formatDisplayValue(selectedDate)}
                placeholder={placeholder}
                readOnly
                className="w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                required={required}
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              {showTimeSelect && (
                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              )}
            </div>
          }
        />
      </div>
      
      {/* Debug info (remove in production) */}
      {selectedDate && (
        <div className="mt-1 text-xs text-gray-500">
          <div>Local: {selectedDate.toLocaleString()}</div>
          <div>UTC: {selectedDate.toISOString()}</div>
          <div>DayJS: {dayjs(selectedDate).format('YYYY-MM-DD HH:mm:ss')}</div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
