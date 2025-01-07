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
import { format } from 'date-fns';

export default function AvailabilityPicker({ onTimeSelect, userId }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAvailability = async (date) => {
    setLoading(true);
    setError('');
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await fetch(
        `/api/meetings/availability?userId=${userId}&date=${date.toISOString()}&timezone=${timezone}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }

      const data = await response.json();
      setAvailableSlots(data.availableSlots);
    } catch (err) {
      setError(err.message);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  const handleTimeSelect = (slot) => {
    onTimeSelect(new Date(slot.startTime));
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800 }}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box mb={3}>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={handleDateChange}
            disablePast
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Box>
      </LocalizationProvider>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="h6" gutterBottom>
            Available Time Slots for {format(selectedDate, 'MMMM d, yyyy')}
          </Typography>

          <Grid container spacing={2}>
            {availableSlots.map((slot) => (
              <Grid item xs={12} sm={6} md={4} key={slot.startTime}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => handleTimeSelect(slot)}
                >
                  <Typography>
                    {format(new Date(slot.startTime), 'h:mm a')} - 
                    {format(new Date(slot.endTime), 'h:mm a')}
                  </Typography>
                </Paper>
              </Grid>
            ))}

            {availableSlots.length === 0 && !loading && (
              <Grid item xs={12}>
                <Alert severity="info">
                  No available time slots for this date. Please try another date.
                </Alert>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Box>
  );
}
