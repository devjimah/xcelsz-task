const db = require('../models');
const { Meeting, Notification } = db;
const { Op } = db.Sequelize;
const { zonedTimeToUtc, utcToZonedTime } = require('date-fns-tz');
const { startOfDay, endOfDay, addMinutes, format, parseISO } = require('date-fns');

exports.getMeetings = async (req, res) => {
  try {
    const { userId } = req.query;
    const meetings = await Meeting.findAll({
      where: {
        [Op.or]: [
          { hostId: userId },
          { participantId: userId }
        ]
      },
      order: [['startTime', 'ASC']]
    });
    res.json({ meetings });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
};

exports.getMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.json({ meeting });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ error: 'Failed to fetch meeting' });
  }
};

exports.createMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.create(req.body);
    
    // Create notification for participant
    await Notification.create({
      userId: meeting.participantId,
      type: 'MEETING_CREATED',
      title: 'New Meeting Invitation',
      message: `You have been invited to "${meeting.title}"`,
      relatedId: meeting.id,
      read: false
    });

    res.status(201).json({ meeting });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
};

exports.updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findByPk(id);
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    await meeting.update(req.body);

    // Create notification for update
    await Notification.create({
      userId: meeting.participantId,
      type: 'MEETING_UPDATED',
      title: 'Meeting Updated',
      message: `The meeting "${meeting.title}" has been updated`,
      relatedId: meeting.id,
      read: false
    });

    res.json({ meeting });
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findByPk(id);
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Create notification for cancellation
    await Notification.create({
      userId: meeting.participantId,
      type: 'MEETING_CANCELLED',
      title: 'Meeting Cancelled',
      message: `The meeting "${meeting.title}" has been cancelled`,
      relatedId: meeting.id,
      read: false
    });

    await meeting.destroy();
    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    const { userId, date, timezone = 'UTC' } = req.query;
    
    // Parse the date and get start/end of day in user's timezone
    const selectedDate = parseISO(date);
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);
    
    // Convert to UTC for database query
    const utcStart = zonedTimeToUtc(dayStart, timezone);
    const utcEnd = zonedTimeToUtc(dayEnd, timezone);

    // Get all meetings for the user on the selected date
    const meetings = await Meeting.findAll({
      where: {
        [Op.or]: [
          { hostId: userId },
          { participantId: userId }
        ],
        startTime: {
          [Op.between]: [utcStart, utcEnd]
        }
      },
      order: [['startTime', 'ASC']]
    });

    // Generate time slots in user's timezone
    const businessStart = 9; // 9 AM
    const businessEnd = 17;  // 5 PM
    const slotDuration = 30; // 30 minutes
    const availableSlots = [];

    // Start time in user's timezone
    let currentTime = new Date(selectedDate);
    currentTime.setHours(businessStart, 0, 0, 0);
    
    // End time in user's timezone
    const endTime = new Date(selectedDate);
    endTime.setHours(businessEnd, 0, 0, 0);

    while (currentTime < endTime) {
      const slotEnd = addMinutes(currentTime, slotDuration);
      
      // Convert current slot to UTC for comparison
      const slotStartUTC = zonedTimeToUtc(currentTime, timezone);
      const slotEndUTC = zonedTimeToUtc(slotEnd, timezone);

      // Check for conflicts
      const hasConflict = meetings.some(meeting => {
        const meetingStart = new Date(meeting.startTime);
        const meetingEnd = addMinutes(meetingStart, meeting.duration);
        
        return (
          (slotStartUTC >= meetingStart && slotStartUTC < meetingEnd) ||
          (slotEndUTC > meetingStart && slotEndUTC <= meetingEnd)
        );
      });

      if (!hasConflict) {
        availableSlots.push({
          startTime: slotStartUTC.toISOString(),
          endTime: slotEndUTC.toISOString()
        });
      }

      currentTime = slotEnd;
    }

    res.json({ availableSlots });
  } catch (error) {
    console.error('Error getting availability:', error);
    res.status(500).json({ error: 'Failed to get availability' });
  }
};
