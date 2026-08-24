import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import authRouter from './routes/auth';
import doctorsRouter from './routes/doctors';
import appointmentsRouter from './routes/appointments';
import patientsRouter from './routes/patients';
import notificationsRouter from './routes/notifications';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/notifications', notificationsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Medsync backend running on port ${PORT}`);
});
