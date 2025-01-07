import { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Button,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import MeetingsCalendar from '@/components/MeetingsCalendar';
import MeetingsList from '@/components/MeetingsList';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`meetings-tabpanel-${index}`}
      aria-labelledby={`meetings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MeetingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // TODO: Replace with actual user ID from authentication
  const userId = '123';

  const fetchMeetings = async () => {
    if (!userId) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/meetings?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch meetings');
      }
      const data = await response.json();
      setMeetings(data.meetings || []);
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setError('Failed to load meetings');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
    // Set up polling for real-time updates
    const interval = setInterval(fetchMeetings, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [userId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleNewMeeting = () => {
    router.push('/meetings/new');
  };

  const handleDelete = async (meetingId) => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete meeting');
      }

      // Update local state immediately
      setMeetings(prevMeetings => prevMeetings.filter(m => m.id !== meetingId));
      
      // Then refresh to ensure sync with server
      setTimeout(fetchMeetings, 500);
    } catch (err) {
      console.error('Error deleting meeting:', err);
      setError(err.message);
    }
  };

  return (
    <Layout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Meetings
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewMeeting}
          >
            New Meeting
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Calendar View" />
            <Tab label="List View" />
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TabPanel value={activeTab} index={0}>
              <MeetingsCalendar 
                userId={userId}
                meetings={meetings}
                onDelete={handleDelete}
                onRefresh={fetchMeetings}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <MeetingsList 
                meetings={meetings}
                onDelete={handleDelete}
                onRefresh={fetchMeetings}
              />
            </TabPanel>
          </>
        )}
      </Box>
    </Layout>
  );
}
