import type { FastifyInstance } from 'fastify';
import { DOCTOR_PROFILE } from '../doctor-profile.js';

export async function registerDoctorRoutes(app: FastifyInstance): Promise<void> {
  app.get('/doctor/profile', async () => DOCTOR_PROFILE);
}
