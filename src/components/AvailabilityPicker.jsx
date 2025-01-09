import { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Button, 
  Typography, 
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, parseISO } from 'date-fns';
import apiClient from '@/utils/apiClient';

export default function AvailabilityPicker({ onTimeSelect, userId }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAvailability = async (date) => {
    setLoading(true);
    setError('');
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const response = await apiClient.get(`meetings/availability?userId=${userId}&date=${formattedDate}`);
      console.log('API Response:', response); // Debug log
      
      // Safely access the data and handle potential undefined values
      const slots = response?.data?.availableSlots || [];
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Failed to fetch available time slots');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate && userId) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate, userId]);

  const handleDateChange = (newDate) => {
    if (newDate) {
      setSelectedDate(newDate);
    }
  };

  const handleTimeSelect = (slot) => {
    if (slot?.startTime) {
      onTimeSelect(parseISO(slot.startTime));
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label="Select Date"
          value={selectedDate}
          onChange={handleDateChange}
          disablePast
          sx={{ width: '100%', mb: 3 }}
        />
      </LocalizationProvider>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h6" sx={{ mb: 2 }}>
        Available Time Slots for {format(selectedDate, 'MMMM d, yyyy')}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : availableSlots.length > 0 ? (
        <Grid container spacing={2}>
          {availableSlots.map((slot, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => handleTimeSelect(slot)}
                sx={{
                  py: 2,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                  }
                }}
              >
                {format(parseISO(slot.startTime), 'h:mm a')}
              </Button>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper 
          sx={{ 
            p: 3, 
            textAlign: 'center',
            bgcolor: 'grey.50'
          }}
        >
          <Typography color="text.secondary">
            No available time slots for this date
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
