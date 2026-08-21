import { Router } from 'express';
import { DoctorController } from '../controllers/doctor.controller';

const router = Router();

router.get('/', DoctorController.list);
router.get('/:id', DoctorController.get);
router.post('/', DoctorController.create);
router.put('/:id', DoctorController.update);
router.get('/:id/availability', DoctorController.getAvailability);
router.post('/:id/leave', DoctorController.setLeave);
router.post('/:id/leave-range', DoctorController.setLeaveRange);
router.post('/:id/cancel-leave', DoctorController.cancelLeave);
router.get('/:id/leaves', DoctorController.getLeaveHistory);

export default router;
