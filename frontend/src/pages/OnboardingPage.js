import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Stepper, Step, StepLabel, Button, 
  Paper, TextField, RadioGroup, FormControlLabel, Radio,
  CircularProgress, List, ListItem, ListItemIcon, ListItemText,
  Divider, Card, CardContent, Grid
} from '@mui/material';
import { 
  CheckCircle, HelpOutline, Mic, Send, 
  School, PlayCircleOutline, Language, Storage
} from '@mui/icons-material';
import api from '../services/api';

const steps = ['Welcome', 'Data Integration', 'Website Builder', 'Training Course', 'Demo Environment'];

const OnboardingPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [welcomeData, setWelcomeData] = useState(null);
  const [integrationMethod, setIntegrationMethod] = useState('text');
  const [hasEMR, setHasEMR] = useState(false);
  const [integrationResult, setIntegrationResult] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [demoData, setDemoData] = useState(null);

  useEffect(() => {
    if (activeStep === 0) fetchWelcome();
    if (activeStep === 3) fetchCourse();
    if (activeStep === 4) fetchDemo();
  }, [activeStep]);

  const fetchWelcome = async () => {
    try {
      setLoading(true);
      const response = await api.get('/onboarding/welcome');
      setWelcomeData(response.data);
    } catch (err) {
      console.error("Welcome fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await api.get('/onboarding/training-course');
      setCourseData(response.data);
    } catch (err) {
      console.error("Course fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDemo = async () => {
    try {
      setLoading(true);
      const response = await api.get('/onboarding/demo-environment');
      setDemoData(response.data);
    } catch (err) {
      console.error("Demo fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleIntegrate = async () => {
    try {
      setLoading(true);
      const response = await api.post('/onboarding/integrate-data', {
        has_emr: hasEMR,
        integration_method: integrationMethod,
        content: "Sample data for integration"
      });
      setIntegrationResult(response.data);
      handleNext();
    } catch (err) {
      console.error("Integration error", err);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h5" gutterBottom>{welcomeData?.message}</Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Let's get you started with a few simple steps to set up your clinic.
            </Typography>
            <List>
              {welcomeData?.guidelines.map((text, index) => (
                <ListItem key={index}>
                  <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
                  <ListItemText primary={text} />
                </ListItem>
              ))}
            </List>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Does your hospital use an EMR system?</Typography>
            <RadioGroup value={hasEMR} onChange={(e) => setHasEMR(e.target.value === 'true')}>
              <FormControlLabel value={true} control={<Radio />} label="Yes, we have an EMR system" />
              <FormControlLabel value={false} control={<Radio />} label="No, we are starting fresh" />
            </RadioGroup>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>How would you like to integrate your data?</Typography>
            <RadioGroup value={integrationMethod} onChange={(e) => setIntegrationMethod(e.target.value)}>
              <FormControlLabel value="text" control={<Radio />} label="Type in clinical data" />
              <FormControlLabel value="voice" control={<Radio />} label="Record a voice note" />
            </RadioGroup>
            
            <Box sx={{ mt: 3, p: 2, bgcolor: '#f0f7ff', borderRadius: 2 }}>
              <Typography variant="body2" color="textSecondary">
                <HelpOutline sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                Our AI is very kind and will guide you through a series of questions to help us predict your clinic's needs accurately.
              </Typography>
            </Box>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Language sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>Does your clinic have a website?</Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              A professional website helps patients find you and book appointments easily.
            </Typography>
            <Button variant="outlined" sx={{ mr: 2 }}>Yes, we have one</Button>
            <Button variant="contained" color="secondary" startIcon={<Send />}>
              No, help me build one with AI
            </Button>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h5" gutterBottom>{courseData?.course_title}</Typography>
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
              Total Duration: {courseData?.duration}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {courseData?.modules.map((module) => (
                <Grid item xs={12} md={6} key={module.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6">{module.title}</Typography>
                      <Typography variant="caption" color="primary">{module.duration}</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>{module.content}</Typography>
                      <Button size="small" startIcon={<PlayCircleOutline />} sx={{ mt: 1 }}>Start Module</Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      case 4:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Practice in the Demo Environment</Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {demoData?.message}
            </Typography>
            <Typography variant="subtitle2" gutterBottom>Practice Patients:</Typography>
            <List>
              {demoData?.demo_patients.map((p) => (
                <ListItem key={p.id} divider>
                  <ListItemText 
                    primary={p.name} 
                    secondary={`Condition: ${p.condition} | Risk: ${p.risk}`} 
                  />
                  <Button variant="outlined" size="small">Treat Patient</Button>
                </ListItem>
              ))}
            </List>
            <Box sx={{ mt: 3, p: 2, bgcolor: '#fff4e5', borderRadius: 2 }}>
              <Typography variant="body2">
                <strong>Pro Tip:</strong> Try recording vitals for John Doe to see how the risk score updates in real-time.
              </Typography>
            </Box>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" align="center" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
          Afribok Onboarding
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ py: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 300, py: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderStepContent(activeStep)
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          <Box>
            {activeStep === 1 ? (
              <Button variant="contained" onClick={handleIntegrate} color="primary">
                Integrate Data
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={activeStep === steps.length - 1 ? () => window.location.href = '/dashboard' : handleNext}
                color="primary"
              >
                {activeStep === steps.length - 1 ? 'Finish & Go to Dashboard' : 'Next'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default OnboardingPage;
