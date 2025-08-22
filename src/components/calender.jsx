import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, User, X, Loader2, AlertCircle } from 'lucide-react';

export default function CommunityCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_time: '',
    organizer: '',
    event_date: ''
  });

  const API_BASE_URL = 'http://localhost:8000/api';

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // API Functions
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/events`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError('Failed to load events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create event');
      }
      
      const newEvent = await response.json();
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (err) {
      setError('Failed to create event');
      console.error('Error creating event:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (err) {
      setError('Failed to delete event');
      console.error('Error deleting event:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

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
    return events.filter(event => event.event_date === formatDate(date));
  };

  const handleDayClick = (dayData) => {
    setSelectedDate(dayData.date);
    setFormData(prev => ({ ...prev, event_date: formatDate(dayData.date) }));
    setSelectedEvent(null);
    setShowModal(true);
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.title && formData.event_date) {
      try {
        await createEvent(formData);
        setFormData({ title: '', description: '', event_time: '', organizer: '', event_date: '' });
        setShowModal(false);
        setSelectedDate(null);
      } catch (err) {
        // Error is already handled in createEvent function
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    setSelectedDate(null);
    setError(null);
    setFormData({ title: '', description: '', event_time: '', organizer: '', event_date: '' });
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
          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-2 rounded-lg flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
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
            onClick={() => {
              setSelectedEvent(null);
              setSelectedDate(null);
              setShowModal(true);
            }}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
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
                        {event.event_time && <div className="opacity-90">{event.event_time}</div>}
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
                    <span className="font-semibold">{selectedEvent.event_date}</span>
                  </div>
                  {selectedEvent.event_time && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Clock className="w-5 h-5 text-purple-500" />
                      <span>{selectedEvent.event_time}</span>
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
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={closeModal}
                      className="flex-1 py-3 px-6 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => deleteEvent(selectedEvent.id)}
                      disabled={loading}
                      className="flex-1 py-3 px-6 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Delete Event'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}
                  
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
                      value={formData.event_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
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
                      value={formData.event_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, event_time: e.target.value }))}
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
                      disabled={loading}
                      className="flex-1 py-3 px-6 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !formData.title || !formData.event_date}
                      className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        'Create Event'
                      )}
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