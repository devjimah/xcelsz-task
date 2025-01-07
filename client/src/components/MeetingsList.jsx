import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  IconButton, 
  Stack,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import UpdateMeetingForm from './UpdateMeetingForm';

export default function MeetingsList({ meetings = [], onDelete, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  const handleDelete = async (id) => {
    setError('');
    setLoading(true);
    try {
      // Update UI optimistically
      const meetingToDelete = meetings.find(m => m.id === id);
      const meetingTitle = meetingToDelete?.title || 'Meeting';

      // Call delete endpoint
      const response = await fetch(`/api/meetings/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to cancel meeting');
      }

      // Trigger refresh through parent
      onDelete?.(id);
    } catch (err) {
      console.error('Error deleting meeting:', err);
      setError(`Failed to cancel ${meetingTitle}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, updatedData) => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`/api/meetings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update meeting');
      }

      // Close form and refresh meetings
      setShowUpdateForm(false);
      setSelectedMeeting(null);
      onRefresh?.();
    } catch (err) {
      console.error('Error updating meeting:', err);
      setError(`Failed to update meeting: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (meeting) => {
    setSelectedMeeting(meeting);
    setShowUpdateForm(true);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Scheduled Meetings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your upcoming meetings
            </Typography>
          </Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={loading}
            sx={{ textTransform: 'none' }}
          >
            Refresh
          </Button>
        </Box>

        <Divider />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : meetings.length === 0 ? (
          <Box 
            sx={{ 
              py: 6, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              bgcolor: 'grey.50',
              borderRadius: 2
            }}
          >
            <EventIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No meetings scheduled
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Schedule a meeting to get started
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {meetings.map((meeting) => (
              <Card 
                key={meeting.id} 
                sx={{ 
                  borderRadius: 2,
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="div">
                        {meeting.title}
                      </Typography>
                      <Box>
                        <IconButton 
                          onClick={() => handleEditClick(meeting)}
                          color="primary"
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDelete(meeting.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    {meeting.description && (
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <DescriptionIcon sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          {meeting.description}
                        </Typography>
                      </Box>
                    )}

                    <Stack direction="row" spacing={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EventIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="body2">
                          {format(new Date(meeting.startTime), 'PPP')}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTimeIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="body2">
                          {format(new Date(meeting.startTime), 'p')} ({meeting.duration} mins)
                        </Typography>
                      </Box>
                    </Stack>

                    <Chip 
                      label={meeting.status} 
                      color={meeting.status === 'scheduled' ? 'success' : 'default'}
                      size="small"
                      sx={{ alignSelf: 'flex-start' }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>

      {selectedMeeting && (
        <UpdateMeetingForm
          meeting={selectedMeeting}
          open={showUpdateForm}
          onClose={() => {
            setShowUpdateForm(false);
            setSelectedMeeting(null);
          }}
          onUpdate={(data) => handleUpdate(selectedMeeting.id, data)}
        />
      )}
    </Box>
  );
}
