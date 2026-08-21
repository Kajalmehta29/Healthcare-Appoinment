import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';

const router = Router();

router.get('/', AppointmentController.list);
router.get('/:id', AppointmentController.get);
router.post('/hold', AppointmentController.hold);
router.post('/:id/confirm', AppointmentController.confirm);
router.post('/:id/reschedule', AppointmentController.reschedule);
router.post('/:id/cancel', AppointmentController.cancel);
router.post('/:id/consultation', AppointmentController.submitConsultation);

export default router;
