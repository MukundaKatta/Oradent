import { emitNotification } from '../websocket/liveUpdates';

type NotificationType = 'appointment' | 'billing' | 'ai' | 'system';

export function sendPracticeNotification(
  practiceId: string,
  type: NotificationType,
  title: string,
  message: string
) {
  emitNotification(practiceId, { type, title, message });
}

export function notifyAppointmentReminder(
  practiceId: string,
  patientName: string,
  time: string
) {
  sendPracticeNotification(
    practiceId,
    'appointment',
    'Upcoming Appointment',
    `${patientName} has an appointment at ${time}`
  );
}

export function notifyPaymentReceived(
  practiceId: string,
  patientName: string,
  amount: string
) {
  sendPracticeNotification(
    practiceId,
    'billing',
    'Payment Received',
    `${patientName} paid ${amount}`
  );
}

export function notifyAIAnalysisComplete(
  practiceId: string,
  patientName: string,
  imageType: string
) {
  sendPracticeNotification(
    practiceId,
    'ai',
    'AI Analysis Complete',
    `${imageType} analysis for ${patientName} is ready for review`
  );
}
