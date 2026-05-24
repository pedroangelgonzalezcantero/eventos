package com.salon.eventos.service;

import com.salon.eventos.entity.Event;
import com.salon.eventos.entity.NotificationChannel;
import com.salon.eventos.entity.Reminder;
import com.salon.eventos.entity.ReminderTemplate;
import com.salon.eventos.repository.EventRepository;
import com.salon.eventos.repository.ReminderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class ReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReminderScheduler.class);

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private ReminderRepository reminderRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ReminderTemplateService templateService;

    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    /**
     * Ejecutar cada día a las 9:00 AM
     */
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void processReminders() {
        log.info("🔔 Procesando recordatorios automáticos...");

        // 1. Recordatorios manuales por evento (Reminder entity)
        List<Reminder> pendingReminders = reminderRepository.findByActiveTrueAndSentFalse();
        for (Reminder reminder : pendingReminders) {
            try {
                Event event = reminder.getEvent();
                long daysUntil = ChronoUnit.DAYS.between(LocalDate.now(), event.getEventDate());
                if (daysUntil == reminder.getDaysBeforeEvent()) {
                    sendReminder(reminder, event, daysUntil);
                    reminder.setSent(true);
                    reminder.setSentAt(java.time.LocalDateTime.now());
                    reminderRepository.save(reminder);
                }
            } catch (Exception e) {
                log.error("Error procesando recordatorio {}: {}", reminder.getId(), e.getMessage());
            }
        }

        // 2. Recordatorios automáticos basados en plantillas configurables
        checkPendingTasksWithTemplates();
    }

    /**
     * Usa las plantillas de ReminderTemplate para enviar recordatorios automáticos.
     */
    private void checkPendingTasksWithTemplates() {
        List<Event> upcomingEvents = eventRepository.findUpcomingEvents(
                LocalDate.now(), LocalDate.now().plusDays(60));

        List<ReminderTemplate> activeTemplates = templateService.getActiveEntities();

        for (Event event : upcomingEvents) {
            long days = ChronoUnit.DAYS.between(LocalDate.now(), event.getEventDate());
            String email = event.getEmail();
            String phone = event.getPhone();

            for (ReminderTemplate template : activeTemplates) {
                if (template.getDaysBeforeEvent() != days) continue;

                boolean shouldSend = false;
                switch (template.getCategory()) {
                    case "PROTOCOLO":
                        shouldSend = !event.isProtocolCompleted();
                        break;
                    case "MENU":
                        shouldSend = !event.isMenuConfirmed();
                        break;
                    case "ALERGENOS":
                        shouldSend = !event.isAllergensCompleted();
                        break;
                    case "GENERAL":
                        shouldSend = true;
                        break;
                    default:
                        shouldSend = true;
                }

                if (!shouldSend) continue;

                String msg = resolveTemplate(template.getMessageTemplate(), event, days);
                String subject = template.getSubject();

                log.info("📧 Enviando recordatorio '{}' — {}, {} días", template.getCategory(), event.getClientName(), days);

                if (template.getChannel() == NotificationChannel.EMAIL && email != null && !email.isEmpty()) {
                    notificationService.sendEmail(event.getId(), event.getClientName(), email, subject, msg);
                } else if (template.getChannel() == NotificationChannel.SMS && phone != null && !phone.isEmpty()) {
                    notificationService.sendSms(event.getId(), event.getClientName(), phone, msg);
                } else if (template.getChannel() == NotificationChannel.WHATSAPP && phone != null && !phone.isEmpty()) {
                    notificationService.sendWhatsapp(event.getId(), event.getClientName(), phone, msg);
                }
            }
        }
    }

    private String resolveTemplate(String template, Event event, long days) {
        if (template == null) return "";
        return template
                .replace("{cliente}", event.getClientName())
                .replace("{dias}", String.valueOf(days))
                .replace("{tipo}", event.getType().getLabel())
                .replace("{fecha}", event.getEventDate().toString())
                .replace("{portal}", baseUrl + "/mi-evento");
    }

    private void sendReminder(Reminder reminder, Event event, long daysUntil) {
        String msg = resolveTemplate(reminder.getMessageTemplate(), event, daysUntil);

        if (reminder.getChannel() == NotificationChannel.EMAIL) {
            notificationService.sendEmail(event.getId(), event.getClientName(),
                    event.getEmail(), reminder.getSubject(), msg);
        } else if (reminder.getChannel() == NotificationChannel.SMS) {
            notificationService.sendSms(event.getId(), event.getClientName(), event.getPhone(), msg);
        } else if (reminder.getChannel() == NotificationChannel.WHATSAPP) {
            notificationService.sendWhatsapp(event.getId(), event.getClientName(), event.getPhone(), msg);
        }
    }
}
