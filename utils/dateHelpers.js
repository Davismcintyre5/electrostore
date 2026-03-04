class DateHelpers {
  // Format date to ISO string (YYYY-MM-DD)
  formatToISODate(date = new Date()) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  // Get start of day
  startOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Get end of day
  endOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  // Get start of week (Monday)
  startOfWeek(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  // Get end of week (Sunday)
  endOfWeek(date = new Date()) {
    const d = this.startOfWeek(date);
    d.setDate(d.getDate() + 6);
    return this.endOfDay(d);
  }

  // Get start of month
  startOfMonth(date = new Date()) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  // Get end of month
  endOfMonth(date = new Date()) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  // Get start of year
  startOfYear(date = new Date()) {
    const d = new Date(date);
    return new Date(d.getFullYear(), 0, 1);
  }

  // Get end of year
  endOfYear(date = new Date()) {
    const d = new Date(date);
    return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
  }

  // Add days to date
  addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  // Add months to date
  addMonths(date, months) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  // Add years to date
  addYears(date, years) {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
  }

  // Get difference in days
  diffInDays(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get difference in hours
  diffInHours(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60));
  }

  // Check if date is within range
  isWithinRange(date, startDate, endDate) {
    const d = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return d >= start && d <= end;
  }

  // Get date range array
  getDateRange(startDate, endDate) {
    const dates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }

  // Format date for display
  formatDate(date, format = 'DD/MM/YYYY') {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year);
  }

  // Get relative time (e.g., "2 hours ago")
  getRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  // Check if date is today
  isToday(date) {
    const today = new Date();
    const d = new Date(date);
    return d.toDateString() === today.toDateString();
  }

  // Check if date is this week
  isThisWeek(date) {
    const d = new Date(date);
    const start = this.startOfWeek();
    const end = this.endOfWeek();
    return d >= start && d <= end;
  }

  // Check if date is this month
  isThisMonth(date) {
    const d = new Date(date);
    const start = this.startOfMonth();
    const end = this.endOfMonth();
    return d >= start && d <= end;
  }

  // Get quarter number (1-4)
  getQuarter(date = new Date()) {
    const d = new Date(date);
    return Math.floor(d.getMonth() / 3) + 1;
  }

  // Get fiscal year (assuming fiscal year starts in July)
  getFiscalYear(date = new Date()) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    return month >= 6 ? year + 1 : year;
  }

  // Parse date string (handles various formats)
  parseDate(dateString) {
    if (!dateString) return null;
    
    // Try parsing as ISO
    let date = new Date(dateString);
    if (!isNaN(date)) return date;
    
    // Try parsing DD/MM/YYYY
    const parts = dateString.split(/[/-]/);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      date = new Date(year, month - 1, day);
      if (!isNaN(date)) return date;
    }
    
    return null;
  }
}

module.exports = new DateHelpers();