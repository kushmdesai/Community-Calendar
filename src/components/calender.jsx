import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, User, X, Loader2, AlertCircle, Share, Mail, MessageCircle, Download } from 'lucide-react';

export default function CommunityCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalDate, setShareModalData] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_time: '',
    organizer: '',
    event_date: '',
    is_recurring: false,
    recurrence_type: 'weekly',
    recurrence_interval: 1,
    recurrence_end_date: ''
  });

  const API_BASE_URL = 'http://localhost:8000/api';

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // API Functions

  const refreshEvent = async () =>{
    try {
      setError(null);
      await fetchEvents();
    } catch (err) {
      setError('Failed to refresh events')
      console.error('Error refreshing events:', err)
    }
  }
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
      
      console.log("Sending POST request with:", eventData);
      
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server responded with error:", errorData);
        throw new Error(errorData.detail || 'Failed to create event');
      }
      
      const newEvent = await response.json();
      console.log("Event created successfully:", newEvent);
      setEvents(prev => [...prev, newEvent]);
      await refreshEvent()
      return newEvent;
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event: ' + err.message);
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
      closeModal()
      await refreshEvent()
    } catch (err) {
      setError('Failed to delete event');
      console.error('Error deleting event:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (eventId, eventData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      }); // Added missing semicolon

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update event');
      }

      const updatedEvent = await response.json(); // Fixed semicolon
      setEvents(prev => prev.map(event =>
        event.id === eventId ? updatedEvent : event
      ));
      await refreshEvent()
      return updatedEvent; // Fixed: was returning updateEvent function instead of updatedEvent
    } catch (err) {
      setError('Failed to update event');
      console.error('Error updating event:', err); // Added missing semicolon
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date,
      event_time: event.event_time || '',
      organizer: event.organizer || '',
      is_recurring: event.is_recurring || false,
      recurrence_type: event.recurrence_type || 'weekly',
      recurrence_interval: event.recurrence_interval || 1,
      recurrence_end_date: event.recurrence_end_date || ''
    });
    setSelectedEvent(null);
    setShowModal(true);
  };

  // Load events on component mount
  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, []);

  useEffect(() => {
    if (events.length >= 0) {
      fetchStats();
    }
  }, [events])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');

    if (eventId && eventId.length > 0) {
      const eventToOpen = events.find(event => event.id.toString() === eventId);

      if (eventToOpen) {
        setSelectedEvent(eventToOpen);
        setShowModal(true);
      };
    };
  }, [events]);

  const generateShareableLink = (event) => {
    const baseUrl = window.location.origin;
    const eventParams = new URLSearchParams({
      id: event.id
    });
    return `${baseUrl}/share-event?${eventParams.toString()}`;
  }

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
  
  // Debug: Log the form data being sent
  console.log("Form data being sent:", formData);
  
  if (formData.title && formData.event_date) {
    try {
      // Clean the data before sending
      const cleanedData = {
        title: formData.title.trim(),
        description: formData.description || null,
        event_date: formData.event_date, // Should be YYYY-MM-DD format
        event_time: formData.event_time || null, // Should be HH:MM format or null
        organizer: formData.organizer || null,
        is_recurring: Boolean(formData.is_recurring),
        recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
        recurrence_interval: formData.is_recurring ? parseInt(formData.recurrence_interval) : null,
        recurrence_end_date: (formData.is_recurring && formData.recurrence_end_date) ? formData.recurrence_end_date : null
      };
      
      console.log("Cleaned data being sent:", cleanedData);
      
      if (editingEvent) {
        await updateEvent(editingEvent.id, cleanedData);
      } else {
        await createEvent(cleanedData);
      }
      
      // Reset form
      setFormData({
        title: '', 
        description: '', 
        event_time: '', 
        organizer: '', 
        event_date: '',
        is_recurring: false,
        recurrence_type: 'weekly',
        recurrence_interval: 1,
        recurrence_end_date: ''
      });
      setShowModal(false);
      setSelectedDate(null);
      setEditingEvent(null);
    } catch (err) {
      console.error("Submit error:", err);
      // Error is already handled in createEvent function
    }
  } else {
    console.error("Missing required fields:", {
      title: formData.title,
      event_date: formData.event_date
    });
  }
};

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    setSelectedDate(null);
    setEditingEvent(null);
    setError(null);
    setFormData({ 
      title: '', 
      description: '',
       event_time: '',
       organizer: '', 
       event_date: '',
       is_recurring: false,
       recurrence_type: 'weekly',
       recurrence_interval: 1,
       recurrence_end_date: ''
      });
  };

  const days = getDaysInMonth(currentDate);

  const fetchStats = async () => {
    try{
      const response = await fetch(`${API_BASE_URL}/stats`);
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
        return statsData;
      }
    } catch (err) {
      console.error('Error fetching ststs:', err)
    }
  }

  const ShareModal = ({ event, isOpen, onClose}) => {
    const shareUrl = generateShareableLink(event);
    const shareText = `Join me for ${event.title} on ${event.event_date}${event.event_time ? ` at ${event.event_time}` : ''}`;

    const copyToClipboard = async () => {
      try{
        await navigator.clipboard.writeText(shareUrl)
        alert('Link copied to clipboard');
      } catch (err) {
        console.error('failed to copy:', err)
      }
    };

    const shareViaEmail = () => {
      const subject = encodeURIComponent(`Invitation: ${event.title}`);
      const body = encodeURIComponent(`${shareText}\n\nView event details: ${shareUrl}`);
      window.open(`mailto:?subject=${subject}&body=${body}`)
    };

    const shareViaWhatsApp =() => {
      const text = encodeURIComponent(`${shareText}\n${shareUrl}`)
      window.open(`https://wa.me/?text=${text}`)
    };

    if (!isOpen) return null;

    return (
      <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60 p-4'>
        <div className='bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-xl font-bold text-gray-800'>Share Event</h3>
            <button onClick={onClose} className='p-2 rounded-full hover:bg-gray-100'>
              <X className='w-5 h-5'/>
            </button>
          </div>

          <div className='space-y-3'>
            <button
              onClick={copyToClipboard}
              className='w-full p-3 border boder-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-3'
            >
              <Share className='w-5 h-5 text-purple-500' />
              Copy Link
            </button>

            <button
              onClick={shareViaEmail}
              className='w-full p-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-3'
            >
              <Mail className='w-5 h-5 text-blue-500' />
              Share Via Email
            </button>

            <button
              onClick={shareViaWhatsApp}  
              className='w-full p-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-3'
            >
              <MessageCircle className='w-5 h-5 text-green-500'/>
              Share via WhatsApp
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/calendar/export.ics`);
      if (!response.ok) throw new Error('Failed to export Calendar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "calender.ics";
      document.body.append(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert("Could not download calendar")
    }
  }

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

        {/* Stats Section */}
        {stats && (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            <div className='bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20'>
              <div className='flex items-center gap-3'>
                <Calendar className='w-8 h-8 text-orange-300' />
                <div>
                  <p className='text-white/80 text-sm'>Total Events</p>
                  <p className='text-3xl font-bold text-white'>{stats.total_events}</p>
                </div>
              </div>
            </div>

            <div className='bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20'>
              <div className='flex items-center gap-3'>
                <Clock className='w-8 h-8 text-blue-300' />
                <div>
                  <p className='text-white/80 text-sm'>This Month</p>
                  <p className='text-3xl font-bold text-white'>{stats.events_this_month}</p>
                </div>
              </div>
            </div>

            <div className='bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20'>
              <div className='flex items-center gap-3'>
                <User className='w-8 h-8 text-green-300' />
                <div>
                  <p className='text-white/80 text-sm'>Upcoming (30 Days)</p>
                  <p className='text-3xl font-bold text-white'>{stats.upcoming_events}</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
          <div className='flex items-center gap-4'>
              <button
                onClick={handleDownload}
                className='flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 border border-emerald-400/20 '
              >
                <Download size={16} className='transition-transform duration-300 group-hover:translate-y-0.5'/>
                Export Calendar
              </button>
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
                        <div className="font-medium truncate">{event.title}{event.is_recurring && <span className='text-yellow-200'>🔄</span>}</div>
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
        {showShareModal && selectedEvent && (
          <ShareModal
            event={selectedEvent}
            isOpen={(showShareModal)}
            onClose={() => setShowShareModal(false)}
          />
        )}
        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {selectedEvent ? 'Event Details' : editingEvent ? 'Edit Event' : 'Create New Event'}
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
                      onClick={() => setShowShareModal(true)}
                      className='flex-1 py-3 px-6 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg'
                    >
                      <Share className='w-5 h-5 inline mr-2' />
                      Share Event
                    </button>
                    <button
                      onClick={() => handleEditEvent(selectedEvent)}
                      disabled={loading}
                      className='flex-1 py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      Edit Event
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
                    <label className='flex items-center gap-3 text-sm font-medium text-gray-700'>
                      <input 
                        type="checkbox"
                        checked={formData.is_recurring}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked}))}
                        className='w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500'
                      />
                      Recurring Event
                    </label>
                  </div>

                  {formData.is_recurring && (
                    <>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Repeat Every
                          </label>
                          <input 
                            type="number"
                            min="1"
                            max="365"
                            value={formData.recurrence_interval}
                            onChange={(e) => setFormData(prev => ({ ...prev, recurrence_interval: parseInt(e.target.value) || 1}))}
                            className='w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Period
                          </label>
                          <select
                            value={formData.recurrence_type}
                            onChange={(e) => setFormData( prev => ({...prev, recurrence_type:e.target.value}))}
                            className='w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all'
                          >
                            <option value="daily">Day(s)</option>
                            <option value="weekly">Week(s)</option>
                            <option value="monthly">Month(s)</option>
                            <option value="yearly">Year(s)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          End date (optional)
                        </label>
                        <input
                          type="date"
                          value={formData.recurrence_end_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurrence_end_date: e.target.value}))}
                          className='w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all'
                        />
                      </div>
                    </>
                  )}

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
                        editingEvent ? 'Update Event' : 'Create Event'
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