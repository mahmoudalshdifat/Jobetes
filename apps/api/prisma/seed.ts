import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed patient: Layla Haddad (Arabic locale, typical Jordanian demographic)
  const layla = await prisma.patient.upsert({
    where: { phone: '+962799123456' },
    update: {},
    create: {
      firstName: 'Layla',
      lastName: 'Haddad',
      dateOfBirth: new Date('1971-05-12'),
      gender: 'female',
      preferredLocale: 'ar',
      phone: '+962799123456',
      email: 'layla.haddad@example.com',
    },
  });

  // Seed patient: Hans Müller (German locale)
  const hans = await prisma.patient.upsert({
    where: { phone: '+491701234567' },
    update: {},
    create: {
      firstName: 'Hans',
      lastName: 'Müller',
      dateOfBirth: new Date('1965-03-22'),
      gender: 'male',
      preferredLocale: 'de',
      phone: '+491701234567',
      email: 'hans.mueller@example.de',
    },
  });

  // Seed consent for Layla
  const laylaConsent = await prisma.consent.create({
    data: {
      privacyPolicyVersion: '2026-05-04',
      acceptedAt: new Date(),
      presentedLocale: 'ar',
      termsOfService: true,
      privacyPolicy: true,
      processingHealthData: true,
      crossBorderTransfer: true,
      marketingOptIn: false,
      familyAccessOptIn: false,
    },
  });

  // Seed intake for Layla
  const laylaIntake = await prisma.intake.create({
    data: {
      patientId: layla.id,
      consentId: laylaConsent.id,
      payload: {
        firstName: 'Layla',
        lastName: 'Haddad',
        dateOfBirth: '1971-05-12',
        gender: 'female',
        preferredLocale: 'ar',
        phone: '+962799123456',
        primarySymptoms: ['abdominal_pain', 'bloating'],
        severity: 6,
        symptomDurationDays: 14,
        currentMedications: ['omeprazole'],
        knownAllergies: ['penicillin'],
        knownConditions: ['gastritis'],
        ramadanContext: true,
        isFasting: true,
        prefersDoctorGender: 'male',
      },
      severity: 6,
      symptomDurationDays: 14,
      ramadanContext: true,
      isFasting: true,
      prefersDoctorGender: 'male',
    },
  });

  // Seed triage for Layla's intake
  await prisma.triage.create({
    data: {
      intakeId: laylaIntake.id,
      urgency: 'soon',
      redFlags: ['persistent_pain', 'medication_failure'],
      topicsForConsultation: ['gastroenterology', 'dietary_advice'],
      patientFriendlySummary:
        'Your stomach pain has lasted two weeks and your current medication is not helping. A gastroenterologist should examine you within a few days.',
      disclaimer:
        'This is not a medical diagnosis. If you experience severe or worsening symptoms, call emergency services (911 in Jordan, 112 in Germany).',
      provider: 'google',
      model: 'gemini-2.0-flash',
      promptVersion: 'v1.2',
      latencyMs: 1200,
    },
  });

  // Seed appointment for Layla
  await prisma.appointment.create({
    data: {
      patientId: layla.id,
      status: 'confirmed',
      requestedAt: new Date(),
      scheduledAt: new Date(Date.now() + 86400000 * 3), // 3 days from now
      notes: 'Patient prefers afternoon slots during Ramadan.',
    },
  });

  // Seed audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorRole: 'patient',
        actorId: layla.id,
        event: 'intake.created',
        resourceId: laylaIntake.id,
      },
      {
        actorRole: 'system',
        actorId: 'triage-worker',
        event: 'triage.completed',
        resourceId: laylaIntake.id,
      },
      {
        actorRole: 'doctor',
        actorId: 'dr-mahmoud',
        event: 'appointment.confirmed',
        resourceId: layla.id,
        metadata: { scheduledAt: new Date(Date.now() + 86400000 * 3).toISOString() },
      },
    ],
  });

  // Seed message (doctor → patient)
  await prisma.message.create({
    data: {
      patientId: layla.id,
      fromRole: 'doctor',
      body: 'Your appointment is confirmed for Thursday at 16:00. Please bring your current medication list.',
      locale: 'ar',
    },
  });

  // Seed staff: Dr. Mahmoud Al-Shdaifat
  await prisma.staff.upsert({
    where: { supabaseUserId: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      supabaseUserId: '00000000-0000-0000-0000-000000000001',
      fullName: 'Dr. Mahmoud Al-Shdaifat',
      email: 'dr.mahmoud@jobetes.diggai.de',
      role: 'doctor',
    },
  });

  console.log(`✅ Seeded ${2} patients, ${1} intakes, ${1} triages, ${1} appointments, ${3} audit logs, ${1} messages, ${1} staff`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
