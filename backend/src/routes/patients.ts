import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller';

const router = Router();

router.get('/profile/:userId', PatientController.getProfile);

export default router;
