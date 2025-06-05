import React, { useState, useEffect, useRef } from "react";

const DatePicker = ({ value, onChange }) => {
    const today = new Date();
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    const [selectedDate, setSelectedDate] = useState(value || null);
    const [inputValue, setInputValue] = useState(
        value ? value.toLocaleDateString("en-GB") : ""
    );

    const [showCalendar, setShowCalendar] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showYearPicker, setShowYearPicker] = useState(false);

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const years = Array.from(
        { length: today.getFullYear() - 2000 + 1 },
        (_, i) => 2000 + i
    );

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                if (inputRef.current) {
                    validateAndSetDate(inputRef.current.value);
                }
                setShowCalendar(false);
                setShowMonthPicker(false);
                setShowYearPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const formatInput = (val) => {
        val = val.replace(/\D/g, "").slice(0, 8);
        return val.replace(/^(\d{0,2})(\d{0,2})(\d{0,4})$/, (_, d, m, y) =>
            [d, m, y].filter(Boolean).join("/")
        );
    };

    const validateAndSetDate = (str) => {
        const val = str.replace(/\D/g, "");
        if (val.length !== 8) {
            setSelectedDate(null);
            setInputValue("");
            onChange && onChange(null);
            return;
        }
        const [dd, mm, yyyy] = [
            parseInt(val.slice(0, 2)),
            parseInt(val.slice(2, 4)),
            parseInt(val.slice(4))
        ];

        const maxDay = new Date(yyyy, mm, 0).getDate();
        const currentYear = new Date().getFullYear();

        const isValid =
            mm >= 1 && mm <= 12 &&
            dd >= 1 && dd <= maxDay &&
            yyyy <= currentYear;

        if (isValid) {
            const parsed = new Date(yyyy, mm - 1, dd);
            setSelectedDate(parsed);
            setCurrentMonth(parsed.getMonth());
            setCurrentYear(parsed.getFullYear());
            setInputValue(parsed.toLocaleDateString("en-GB"));
            onChange && onChange(parsed);
        } else {
            setSelectedDate(null);
            setInputValue("");
            onChange && onChange(null);
        }
    };

    const handleInputChange = (e) => {
        const raw = e.target.value;
        const prev = inputValue;

        const selectionStart = e.target.selectionStart;
        const isDeleting = prev.length > raw.length;

        const formatted = formatInput(raw);

        // Calculate new cursor position
        let newCursor = selectionStart;

        if (!isDeleting) {
            // We're inserting — move past slashes automatically
            if (formatted[selectionStart - 1] === '/' && raw.length < formatted.length) {
                newCursor++;
            }
        }

        setInputValue(formatted);

        requestAnimationFrame(() => {
            if (inputRef.current) {
                inputRef.current.setSelectionRange(newCursor, newCursor);
            }
        });
    };




    const handleDateClick = (day) => {
        const date = new Date(currentYear, currentMonth, day);
        setSelectedDate(date);
        const formatted = date.toLocaleDateString("en-GB");
        setInputValue(formatted);
        onChange && onChange(date);
        setShowCalendar(false);
    };

    const prevMonth = () => {
        setCurrentMonth((prev) => (prev === 0 ? 11 : prev - 1));
        if (currentMonth === 0) setCurrentYear((y) => y - 1);
    };

    const nextMonth = () => {
        setCurrentMonth((prev) => (prev === 11 ? 0 : prev + 1));
        if (currentMonth === 11) setCurrentYear((y) => y + 1);
    };

    return (
        <div ref={wrapperRef} className="relative font-mono">
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onClick={() => setShowCalendar(true)}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                    const allowedKeys = ["Backspace", "ArrowLeft", "ArrowRight", "Tab", "Delete", "Enter"];
                    const isNumber = /^[0-9]$/.test(e.key);
                    const isControl = allowedKeys.includes(e.key);

                    if (!isNumber && !isControl) e.preventDefault();

                    if (e.key === "Enter") validateAndSetDate(inputValue);
                }}
                inputMode="numeric"
                maxLength={10}
                className="bg-[#111816] text-[#a4bbb0] text-center placeholder-[#a4bbb0] border-2 border-transparent px-3 py-[6px] rounded-md focus:border-[#6bff7a] focus:outline-none cursor-text w-[140px]"
                placeholder="DD/MM/YYYY"
            />

            {showCalendar && (
                <div className="absolute z-10 mt-2 bg-[#111816] text-white rounded-md w-72 p-4 shadow-custom">
                    <div className="flex justify-between items-center mb-3">
                        <button onClick={prevMonth} className="text-[#6bff7a] hover:text-[#67ff76ce] not-last:px-2">&lt;</button>

                        <div className="flex space-x-2 text-white text-sm">
                            <button
                                onClick={() => {
                                    setShowMonthPicker(prev => !prev);
                                    setShowYearPicker(false);
                                }}
                                className="hover:text-[#6bff7a]"
                            >
                                {monthNames[currentMonth]}
                            </button>
                            <button
                                onClick={() => {
                                    setShowYearPicker(prev => !prev);
                                    setShowMonthPicker(false);
                                }}
                                className="hover:text-[#6bff7a]"
                            >
                                {currentYear}
                            </button>
                        </div>

                        <button onClick={nextMonth} className="text-[#6bff7a] hover:text-[#67ff76ce] px-2">&gt;</button>
                    </div>

                    {showMonthPicker && (
                        <div className="bg-[#0d1311] rounded-md grid grid-cols-3 gap-2 my-3 py-3 px-3">
                            {monthNames.map((month, i) => (
                                <button
                                    key={month}
                                    onClick={() => {
                                        setCurrentMonth(i);
                                        setShowMonthPicker(false);

                                        const newDate = new Date(currentYear, i, selectedDate?.getDate() || 1);
                                        setSelectedDate(newDate);
                                        setInputValue(newDate.toLocaleDateString("en-GB"));
                                        onChange && onChange(newDate);
                                    }}
                                    className="text-sm text-[#a4bbb0] hover:text-[#6bff7a]"
                                >
                                    {month}
                                </button>
                            ))}
                        </div>
                    )}

                    {showYearPicker && (
                        <div className="bg-[#0d1311] rounded-md grid grid-cols-4 gap-2 max-h-32 overflow-y-auto my-3 py-3 px-3 custom-scrollbar">
                            {years.map((year) => (
                                <button
                                    key={year}
                                    onClick={() => {
                                        setCurrentYear(year);
                                        setShowYearPicker(false);

                                        const newDate = new Date(year, currentMonth, selectedDate?.getDate() || 1);
                                        setSelectedDate(newDate);
                                        setInputValue(newDate.toLocaleDateString("en-GB"));
                                        onChange && onChange(newDate);
                                    }}
                                    className="text-sm text-[#a4bbb0] hover:text-[#6bff7a]"
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-7 text-xs text-white mb-1">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                            <div key={d} className="text-center">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {[...Array(firstDayOfMonth)].map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {[...Array(daysInMonth)].map((_, day) => (
                            <button
                                key={day + 1}
                                onClick={() => handleDateClick(day + 1)}
                                className={`text-sm rounded-md w-8 h-8 border-2 border-transparent hover:bg-[#111816] hover:border-[#6bff7a] hover:text-[#6bff7a] ${selectedDate?.getDate() === day + 1 &&
                                    currentMonth === selectedDate.getMonth() &&
                                    currentYear === selectedDate.getFullYear()
                                    ? "bg-[#6bff7a] text-[#111816]"
                                    : "text-[#a4bbb0]"
                                    }`}
                            >
                                {day + 1}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #0d1311;
                    border-radius: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #2b473e;
                    border-radius: 6px;
                    border: 2px solid #0d1311;
                }
            `}</style>
        </div>
    );
};

export default DatePicker;
