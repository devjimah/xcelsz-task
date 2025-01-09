const db = require('../models');
const { Meeting, Notification } = db;
const { Op } = db.Sequelize;
const { startOfDay, endOfDay, addMinutes, parseISO } = require('date-fns');

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
    const { userId, date } = req.query;
    const selectedDate = parseISO(date);
    
    // Get the start and end of the selected date
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);

    // Get all meetings for the user on the selected date
    const meetings = await Meeting.findAll({
      where: {
        [Op.or]: [
          { hostId: userId },
          { participantId: userId }
        ],
        startTime: {
          [Op.between]: [dayStart, dayEnd]
        }
      },
      order: [['startTime', 'ASC']]
    });

    // Business hours: 9 AM to 5 PM
    const businessStart = 9;
    const businessEnd = 17;
    const slotDuration = 30; // minutes
    const availableSlots = [];

    // Set up the start time at 9 AM
    let currentTime = new Date(selectedDate);
    currentTime.setHours(businessStart, 0, 0, 0);
    
    // Set up the end time at 5 PM
    const endTime = new Date(selectedDate);
    endTime.setHours(businessEnd, 0, 0, 0);

    // Generate 30-minute slots
    while (currentTime < endTime) {
      const slotEnd = addMinutes(currentTime, slotDuration);

      // Check if this slot conflicts with any existing meetings
      const hasConflict = meetings.some(meeting => {
        const meetingStart = new Date(meeting.startTime);
        const meetingEnd = addMinutes(meetingStart, meeting.duration);
        
        return (
          (currentTime >= meetingStart && currentTime < meetingEnd) ||
          (slotEnd > meetingStart && slotEnd <= meetingEnd)
        );
      });

      if (!hasConflict) {
        availableSlots.push({
          startTime: currentTime.toISOString(),
          endTime: slotEnd.toISOString()
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
