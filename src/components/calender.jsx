import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, User, X } from 'lucide-react';

export default function CommunityCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time: '',
    organizer: '',
    date: ''
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonth.getDate() - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonth.getDate() - i)
      });
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day)
      });
    }
    
    // Next month's leading days
    const totalCells = Math.ceil(days.length / 7) * 7;
    let nextDay = 1;
    for (let i = days.length; i < totalCells; i++) {
      days.push({
        day: nextDay,
        isCurrentMonth: false,
        date: new Date(year, month + 1, nextDay)
      });
      nextDay++;
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getEventsForDate = (date) => {
    return events.filter(event => event.date === formatDate(date));
  };

  const handleDayClick = (dayData) => {
    setSelectedDate(dayData.date);
    setFormData(prev => ({ ...prev, date: formatDate(dayData.date) }));
    setShowModal(true);
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title && formData.date) {
      const newEvent = {
        id: Date.now(),
        ...formData
      };
      setEvents(prev => [...prev, newEvent]);
      setFormData({ title: '', description: '', time: '', organizer: '', date: '' });
      setShowModal(false);
      setSelectedDate(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    setSelectedDate(null);
    setFormData({ title: '', description: '', time: '', organizer: '', date: '' });
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            Community Calendar
          </h1>
          <p className="text-xl text-purple-100">
            Share events with your community
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-semibold text-white">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Add Event
          </button>
        </div>

        {/* Calendar */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 bg-gradient-to-r from-purple-600 to-indigo-600">
            {weekdays.map(day => (
              <div key={day} className="p-4 text-center text-white font-semibold text-lg">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {days.map((dayData, index) => {
              const dayEvents = getEventsForDate(dayData.date);
              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(dayData)}
                  className={`
                    min-h-32 p-3 border border-gray-100 cursor-pointer transition-all duration-300 hover:bg-gradient-to-br hover:from-purple-50 hover:to-indigo-50 hover:scale-105 hover:shadow-lg hover:z-10 relative
                    ${!dayData.isCurrentMonth ? 'text-gray-400 bg-gray-50/50' : ''}
                    ${isToday(dayData.date) ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white' : 'bg-white'}
                  `}
                >
                  <div className={`font-semibold text-lg mb-2 ${isToday(dayData.date) ? 'text-white' : ''}`}>
                    {dayData.day}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => handleEventClick(event, e)}
                        className="bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs p-2 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md"
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        {event.time && <div className="opacity-90">{event.time}</div>}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 font-medium">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {selectedEvent ? 'Event Details' : 'Create New Event'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedEvent ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="w-5 h-5 text-purple-500" />
                    <span className="font-semibold">{selectedEvent.date}</span>
                  </div>
                  {selectedEvent.time && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Clock className="w-5 h-5 text-purple-500" />
                      <span>{selectedEvent.time}</span>
                    </div>
                  )}
                  {selectedEvent.organizer && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <User className="w-5 h-5 text-purple-500" />
                      <span>{selectedEvent.organizer}</span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-lg text-gray-800 mb-2">
                      {selectedEvent.title}
                    </h4>
                    <p className="text-gray-600">{selectedEvent.description}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter event title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      rows={3}
                      placeholder="Event description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organizer
                    </label>
                    <input
                      type="text"
                      value={formData.organizer}
                      onChange={(e) => setFormData(prev => ({ ...prev, organizer: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Your name or organization"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 py-3 px-6 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg"
                    >
                      Create Event
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}