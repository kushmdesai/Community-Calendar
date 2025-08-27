import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, User, X, Loader2, AlertCircle, Share, Mail, MessageCircle, Download } from 'lucide-react';

// Main App Component -- Themed For Hackclub theme
export default function CommunityCalendar() {
  // -- State Management --
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendWaking, setBackendWaking] = useState(false);
  const [error, setError] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [theme, setTheme] = useState('dark');
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

  // -- Constants --
  const API_BASE_URL = 'https://community-calendar-backend-4uff.onrender.com/api';
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // -- API Function --
  const refreshEvents = async () => {
    try {
      setError(null);
      await fetchEvents();
    } catch (err) {
      setError('Failed to refresh events');
      console.error('Error refreshing events:', err);
    }
  }

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/events`);
      if (!response.ok) throw new Error("Failed to fetch Events!");
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create event');
      }
      const newEvent = await response.json();
      setEvents(prev => [...prev, newEvent]);
      await refreshEvents();
      return newEvent;
    } catch (err) {
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
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete event');
      setEvents(prev => prev.filter(event => event.id !== eventId));
      closeModal();
      await refreshEvents();
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update event');
      }
      const updatedEvent = await response.json();
      setEvents(prev => prev.map(event => event.id === eventId ? updatedEvent : event));
      await refreshEvents();
      return updatedEvent;
    } catch (err) {
      setError('Failed to update event');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // -- LIFECYCLE Hooks --
  useEffect(() => {
    let timeoutId;
    async function initBackend() {
      setLoading(true);
      timeoutId = setTimeout(() => setBackendWaking(true), 200);
      try {
        const ping = await fetch("https://community-calendar-backend-4uff.onrender.com/");
        if (!ping.ok) throw new Error("Backend not responding");
        clearTimeout(timeoutId);
        setBackendWaking(false);
        fetchEvents();
        fetchStats();
      } catch (err) {
        console.error(err);
        setError("Could not connect to the backend service.");
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    }
    initBackend();
  }, []);

  useEffect(() => {
    if (events.length >= 0) {
      fetchStats();
    }
  }, [events]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');
    if (eventId && events.length > 0) {
      const eventToOpen = events.find(event => event.id.toString() === eventId);
      if (eventToOpen) {
        setSelectedEvent(eventToOpen);
        setShowModal(true);
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [events]);
  
  // NEW: Effect to handle theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // --- UTILITY & HELPER FUNCTIONS ---
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    for (let i = startingDayOfWeek; i > 0; i--) {
      days.push({ day: prevMonthLastDay - i + 1, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i + 1) });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, isCurrentMonth: true, date: new Date(year, month, day) });
    }
    const totalCells = Math.ceil(days.length / 7) * 7;
    let nextDay = 1;
    while (days.length < totalCells) {
      days.push({ day: nextDay, isCurrentMonth: false, date: new Date(year, month + 1, nextDay) });
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

  const formatDate = (date) => date.toISOString().split('T')[0];
  const isToday = (date) => new Date().toDateString() === date.toDateString();
  const getEventsForDate = (date) => events.filter(event => event.event_date === formatDate(date));

  // --- EVENT HANDLERS ---
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.title && formData.event_date) {
      try {
        const cleanedData = {
          title: formData.title.trim(),
          description: formData.description || null,
          event_date: formData.event_date,
          event_time: formData.event_time || null,
          organizer: formData.organizer || null,
          is_recurring: Boolean(formData.is_recurring),
          recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
          recurrence_interval: formData.is_recurring ? parseInt(formData.recurrence_interval) : null,
          recurrence_end_date: (formData.is_recurring && formData.recurrence_end_date) ? formData.recurrence_end_date : null
        };
        if (editingEvent) {
          await updateEvent(editingEvent.id, cleanedData);
        } else {
          await createEvent(cleanedData);
        }
        closeModal();
      } catch (err) {
        console.error("Submit error:", err);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    setSelectedDate(null);
    setEditingEvent(null);
    setError(null);
    setFormData({ title: '', description: '', event_time: '', organizer: '', event_date: '', is_recurring: false, recurrence_type: 'weekly', recurrence_interval: 1, recurrence_end_date: '' });
  };
  
  const handleDownload = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/calendar/export.ics`);
      if (!response.ok) throw new Error('Failed to export Calendar');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "community-calendar.ics";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Could not download calendar");
    }
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const days = getDaysInMonth(currentDate);
  const eventColors = ['bg-orange', 'bg-yellow', 'bg-green', 'bg-cyan', 'bg-blue', 'bg-purple'];

  // -- RENDER --
  return (
    <div className="min-h-screen bg-background dark:bg-dark-background font-sans text-text dark:text-dark-text transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-10 relative">
          <h1 className="text-5xl md:text-6xl font-bold text-red mb-3 tracking-tight">
            Community Calendar
          </h1>
          <p className="text-xl text-slate dark:text-dark-slate font-medium">
            Share and discover events in your community.
          </p>          
          {backendWaking && (
            <div className="mt-6 bg-orange/10 border-2 border-orange/30 text-orange px-6 py-4 rounded-xl flex items-center justify-center gap-3 max-w-md mx-auto">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-bold">Waking up the server... hang tight!</span>
            </div>
          )}
          {error && (
            <div className="mt-6 bg-red/10 border-2 border-red/30 text-red px-6 py-4 rounded-xl flex items-center justify-center gap-3 max-w-md mx-auto">
              <AlertCircle className="w-5 h-5" />
              <span className="font-bold">{error}</span>
            </div>
          )}
        </header>

        {/* Stats Section */}
        {stats && (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-10'>
            <StatCard icon={<Calendar className='w-8 h-8 text-red' />} title="Total Events" value={stats.total_events} color="red" />
            <StatCard icon={<Clock className='w-8 h-8 text-blue' />} title="This Month" value={stats.events_this_month} color="blue" />
            <StatCard icon={<User className='w-8 h-8 text-green' />} title="Upcoming (30 Days)" value={stats.upcoming_events} color="green" />
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-elevated dark:bg-dark-elevated rounded-xl p-4 shadow-md border border-black/10 dark:border-white/10">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <NavButton onClick={() => navigateMonth(-1)}><ChevronLeft className="w-6 h-6" /></NavButton>
            <h2 className="text-3xl font-bold text-text dark:text-dark-text w-64 text-center">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <NavButton onClick={() => navigateMonth(1)}><ChevronRight className="w-6 h-6" /></NavButton>
          </div>
          <div className='flex items-center gap-4'>
            <ActionButton onClick={handleDownload} color="green" disabled={loading}>
              <Download size={18}/> Export
            </ActionButton>
            <ActionButton onClick={() => setShowModal(true)} color="red" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} Add Event
            </ActionButton>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-elevated dark:bg-dark-elevated rounded-xl shadow-lg overflow-hidden border border-black/10 dark:border-white/10">
          <div className="grid grid-cols-7 bg-slate dark:bg-dark-slate text-background dark:text-dark-text">
            {weekdays.map(day => (
              <div key={day} className="p-4 text-center font-bold text-lg tracking-wide">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((dayData, index) => {
              const dayEvents = getEventsForDate(dayData.date);
              const isTodayFlag = isToday(dayData.date);
              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(dayData)}
                  className={`min-h-36 p-2 border-t border-r border-black/5 dark:border-white/10 cursor-pointer transition-colors duration-200 group relative ${!dayData.isCurrentMonth ? 'bg-slate/5 dark:bg-white/5 text-muted dark:text-dark-muted' : 'bg-background dark:bg-dark-background hover:bg-red/5 dark:hover:bg-red/10'}`}
                >
                  <span className={`text-lg font-bold ${isTodayFlag ? 'bg-red text-white rounded-full flex items-center justify-center w-8 h-8' : ''}`}>
                    {dayData.day}
                  </span>
                  <div className="space-y-1 mt-1">
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <div
                        key={event.id}
                        onClick={(e) => handleEventClick(event, e)}
                        className={`${eventColors[i % eventColors.length]} text-white text-xs p-1.5 rounded-md cursor-pointer truncate transition-transform hover:scale-105`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-slate dark:text-dark-slate font-bold pt-1">+ {dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modals */}
        {showShareModal && selectedEvent && <ShareModal event={selectedEvent} onClose={() => setShowShareModal(false)} />}
        {showModal && <EventModal />}
      </div>
    </div>
  );

  // --- SUB-COMPONENTS ---
  function EventModal() {
    return (
      <div className="fixed inset-0 bg-slate/75 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-elevated dark:bg-dark-elevated rounded-xl p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl border border-black/10 dark:border-white/10 font-sans">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-text dark:text-dark-text">
              {selectedEvent ? 'Event Details' : editingEvent ? 'Edit Event' : 'Create New Event'}
            </h3>
            <button onClick={closeModal} className="p-2 rounded-full hover:bg-slate/10 dark:hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
          </div>

          {selectedEvent ? (
            <div className="space-y-4">
              <h4 className="font-bold text-2xl text-red mb-2">{selectedEvent.title}</h4>
              <InfoRow icon={<Calendar className="text-red" />} text={selectedEvent.event_date} />
              {selectedEvent.event_time && <InfoRow icon={<Clock className="text-blue" />} text={selectedEvent.event_time} />}
              {selectedEvent.organizer && <InfoRow icon={<User className="text-green" />} text={selectedEvent.organizer} />}
              {selectedEvent.description && <p className="text-slate dark:text-dark-slate bg-slate/5 dark:bg-white/5 p-4 rounded-lg leading-relaxed">{selectedEvent.description}</p>}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <ActionButton onClick={() => handleEditEvent(selectedEvent)} color="blue" disabled={loading}>Edit</ActionButton>
                <ActionButton onClick={() => deleteEvent(selectedEvent.id)} color="red" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete'}
                </ActionButton>
                <ActionButton onClick={() => setShowShareModal(true)} color="green" className="col-span-2">
                  <Share className='w-4 h-4 inline mr-2' /> Share
                </ActionButton>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red/10 text-red px-4 py-3 rounded-lg font-bold flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
              <FormInput label="Event Title *" type="text" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Hackathon Kick-off" required />
              <FormTextArea label="Description" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Details about the event..." />
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Date *" type="date" value={formData.event_date} onChange={e => setFormData(p => ({ ...p, event_date: e.target.value }))} required />
                <FormInput label="Time" type="time" value={formData.event_time} onChange={e => setFormData(p => ({ ...p, event_time: e.target.value }))} />
              </div>
              <FormInput label="Organizer" type="text" value={formData.organizer} onChange={e => setFormData(p => ({ ...p, organizer: e.target.value }))} placeholder="e.g., Coding Club" />
              
              <div className="pt-2">
                <label className='flex items-center gap-3 font-bold text-slate dark:text-dark-slate'>
                  <input type="checkbox" checked={formData.is_recurring} onChange={e => setFormData(p => ({ ...p, is_recurring: e.target.checked }))} className='w-5 h-5 text-red border-2 border-slate/30 dark:border-white/30 rounded focus:ring-red bg-transparent' />
                  Recurring Event
                </label>
              </div>
              {formData.is_recurring && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate/5 dark:bg-white/5 rounded-lg border border-slate/10 dark:border-white/10">
                  <FormInput label="Interval" type="number" min="1" value={formData.recurrence_interval} onChange={e => setFormData(p => ({ ...p, recurrence_interval: parseInt(e.target.value) || 1 }))} />
                  <div>
                    <label className="block text-sm font-bold text-slate dark:text-dark-slate mb-1">Period</label>
                    <select value={formData.recurrence_type} onChange={e => setFormData(p => ({ ...p, recurrence_type: e.target.value }))} className="w-full p-3 border-2 border-slate/20 dark:border-white/20 rounded-lg bg-background dark:bg-dark-background focus:ring-2 focus:ring-red focus:border-red transition-all font-medium">
                      <option value="daily">Days</option>
                      <option value="weekly">Weeks</option>
                      <option value="monthly">Months</option>
                      <option value="yearly">Years</option>
                    </select>
                  </div>
                  <FormInput label="End Date" type="date" value={formData.recurrence_end_date} onChange={e => setFormData(p => ({ ...p, recurrence_end_date: e.target.value }))} />
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <ActionButton type="button" onClick={closeModal} color="muted">Cancel</ActionButton>
                <ActionButton type="submit" color="red" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingEvent ? 'Save Changes' : 'Create Event')}
                </ActionButton>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  function ShareModal({ event, onClose }) {
    const shareUrl = `${window.location.origin}${window.location.pathname}?id=${event.id}`;
    const shareText = `Join me for ${event.title} on ${event.event_date}${event.event_time ? ` at ${event.event_time}` : ''}`;

    const copyToClipboard = () => {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Link copied!');
      }, (err) => {
        console.error('Failed to copy:', err);
      });
    };
    
    return (
      <div className='fixed inset-0 bg-slate/75 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center z-60 p-4'>
        <div className='bg-elevated dark:bg-dark-elevated rounded-xl p-6 max-w-sm w-full shadow-xl border border-black/10 dark:border-white/10'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-xl font-bold text-text dark:text-dark-text'>Share Event</h3>
            <button onClick={onClose} className='p-2 rounded-full hover:bg-slate/10 dark:hover:bg-white/10 transition-colors'><X className='w-5 h-5'/></button>
          </div>
          <div className='space-y-3'>
            <ShareButton onClick={copyToClipboard} icon={<Share className='text-red' />}>Copy Link</ShareButton>
            <ShareButton href={`mailto:?subject=${encodeURIComponent(`Invitation: ${event.title}`)}&body=${encodeURIComponent(`${shareText}\n\nView event details: ${shareUrl}`)}`} icon={<Mail className='text-blue' />}>Share via Email</ShareButton>
            <ShareButton href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`} icon={<MessageCircle className='text-green' />}>Share via WhatsApp</ShareButton>
          </div>
        </div>
      </div>
    );
  }
}

// --- HELPER & STYLED COMPONENTS ---
const StatCard = ({ icon, title, value, color }) => (
  <div className={`bg-elevated dark:bg-dark-elevated rounded-xl p-6 shadow-md border border-black/10 dark:border-white/10 transition-transform hover:scale-105 hover:shadow-lg`}>
    <div className='flex items-center gap-4'>
      <div className={`p-3 bg-${color}/10 rounded-xl`}>{icon}</div>
      <div>
        <p className='text-muted dark:text-dark-muted text-sm font-medium uppercase tracking-wide'>{title}</p>
        <p className='text-3xl font-bold text-text dark:text-dark-text'>{value}</p>
      </div>
    </div>
  </div>
);

const NavButton = ({ children, ...props }) => (
  <button {...props} className="p-3 rounded-full bg-slate/10 dark:bg-white/10 hover:bg-slate/20 dark:hover:bg-white/20 transition-colors text-slate dark:text-dark-slate">{children}</button>
);

const ActionButton = ({ children, color, className = '', ...props }) => {
  const colorClasses = {
    red: 'bg-red hover:bg-red/90 text-white',
    green: 'bg-green hover:bg-green/90 text-white',
    blue: 'bg-blue hover:bg-blue/90 text-white',
    muted: 'bg-slate/20 dark:bg-white/20 hover:bg-slate/30 dark:hover:bg-white/30 text-slate dark:text-dark-text',
  };
  return (
    <button {...props} className={`flex items-center justify-center gap-2 px-5 py-2.5 font-bold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${colorClasses[color]} ${className}`}>
      {children}
    </button>
  );
};

const FormInput = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-bold text-slate dark:text-dark-slate mb-1">{label}</label>
    <input {...props} className="w-full p-3 border-2 border-slate/20 dark:border-white/20 rounded-lg bg-background dark:bg-dark-background focus:ring-2 focus:ring-red focus:border-red transition-all font-medium" />
  </div>
);

const FormTextArea = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-bold text-slate dark:text-dark-slate mb-1">{label}</label>
    <textarea {...props} rows={3} className="w-full p-3 border-2 border-slate/20 dark:border-white/20 rounded-lg bg-background dark:bg-dark-background focus:ring-2 focus:ring-red focus:border-red transition-all font-medium" />
  </div>
);

const InfoRow = ({ icon, text }) => (
  <div className="flex items-center gap-3 text-slate dark:text-dark-slate">
    <div className="p-2 bg-slate/10 dark:bg-white/10 rounded-lg">{icon}</div>
    <span className="font-medium text-lg">{text}</span>
  </div>
);

const ShareButton = ({ children, icon, href, ...props }) => {
  const commonProps = {
    ...props,
    className: 'w-full p-3 border-2 border-slate/20 dark:border-white/20 rounded-lg hover:bg-slate/10 dark:hover:bg-white/10 flex items-center gap-3 transition-all duration-200 hover:scale-105 font-bold'
  };
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" {...commonProps}>{icon}{children}</a> : <button type="button" {...commonProps}>{icon}{children}</button>;
};
