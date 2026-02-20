import 'express-async-errors';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { departmentsRouter } from './routes/departments';
import { reportTypesRouter } from './routes/reportTypes';
import { meetingTypesRouter } from './routes/meetingTypes';
import { submissionsRouter } from './routes/submissions';
import { meetingInstancesRouter } from './routes/meetingInstances';
import { notificationsRouter } from './routes/notifications';
import { dashboardRouter } from './routes/dashboard';
import { errorHandler } from './middleware/errorHandler';
import { startScheduler } from './jobs/scheduler';

const app: Application = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').trim();
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

app.use(helmet());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/report-types', reportTypesRouter);
app.use('/api/meeting-types', meetingTypesRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/meeting-instances', meetingInstancesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`ReportHub backend running on port ${PORT}`);
  startScheduler();
});

export default app;
