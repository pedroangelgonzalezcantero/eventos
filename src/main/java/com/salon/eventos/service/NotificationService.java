package com.salon.eventos.service;

import com.salon.eventos.entity.NotificationChannel;
import com.salon.eventos.entity.NotificationLog;
import com.salon.eventos.repository.NotificationLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private NotificationLogRepository logRepository;

    @Value("${spring.mail.username:noreply@salon.com}")
    private String fromEmail;

    @Value("${twilio.account.sid:}")
    private String twilioSid;

    @Value("${twilio.auth.token:}")
    private String twilioToken;

    @Value("${twilio.from.phone:}")
    private String twilioPhone;

    @Value("${twilio.from.whatsapp:}")
    private String twilioWhatsapp;

    public void sendEmail(Long eventId, String clientName, String toEmail, String subject, String message) {
        String status = "SIMULATED";
        String error = null;

        if (mailSender != null && toEmail != null && !toEmail.isEmpty()) {
            try {
                SimpleMailMessage mail = new SimpleMailMessage();
                mail.setFrom(fromEmail);
                mail.setTo(toEmail);
                mail.setSubject(subject);
                mail.setText(message);
                mailSender.send(mail);
                status = "SENT";
                log.info("📧 Email enviado a {} para evento {}", toEmail, eventId);
            } catch (Exception e) {
                status = "FAILED";
                error = e.getMessage();
                log.error("❌ Error enviando email a {}: {}", toEmail, e.getMessage());
            }
        } else {
            log.info("📧 [SIMULADO] Email a {}: {} | {}", toEmail, subject, message);
        }

        saveLog(eventId, clientName, NotificationChannel.EMAIL, toEmail, message, status, error);
    }

    public void sendSms(Long eventId, String clientName, String toPhone, String message) {
        String status = "SIMULATED";
        String error = null;

        if (!twilioSid.isEmpty() && !twilioToken.isEmpty() && toPhone != null) {
            try {
                // Twilio REST API via HTTP (sin SDK para mantener dependencias mínimas)
                sendTwilioMessage(toPhone, twilioPhone, message);
                status = "SENT";
                log.info("📱 SMS enviado a {} para evento {}", toPhone, eventId);
            } catch (Exception e) {
                status = "FAILED";
                error = e.getMessage();
                log.error("❌ Error enviando SMS a {}: {}", toPhone, e.getMessage());
            }
        } else {
            log.info("📱 [SIMULADO] SMS a {}: {}", toPhone, message);
        }

        saveLog(eventId, clientName, NotificationChannel.SMS, toPhone, message, status, error);
    }

    public void sendWhatsapp(Long eventId, String clientName, String toPhone, String message) {
        String status = "SIMULATED";
        String error = null;

        if (!twilioSid.isEmpty() && !twilioToken.isEmpty() && toPhone != null) {
            try {
                String whatsappTo = toPhone.startsWith("whatsapp:") ? toPhone : "whatsapp:" + toPhone;
                sendTwilioMessage(whatsappTo, twilioWhatsapp, message);
                status = "SENT";
                log.info("💬 WhatsApp enviado a {} para evento {}", toPhone, eventId);
            } catch (Exception e) {
                status = "FAILED";
                error = e.getMessage();
                log.error("❌ Error enviando WhatsApp a {}: {}", toPhone, e.getMessage());
            }
        } else {
            log.info("💬 [SIMULADO] WhatsApp a {}: {}", toPhone, message);
        }

        saveLog(eventId, clientName, NotificationChannel.WHATSAPP, toPhone, message, status, error);
    }

    private void sendTwilioMessage(String to, String from, String body) throws Exception {
        // Implementación básica HTTP a la API de Twilio
        String url = "https://api.twilio.com/2010-04-01/Accounts/" + twilioSid + "/Messages.json";
        String data = "To=" + java.net.URLEncoder.encode(to, "UTF-8") +
                "&From=" + java.net.URLEncoder.encode(from, "UTF-8") +
                "&Body=" + java.net.URLEncoder.encode(body, "UTF-8");

        java.net.URL apiUrl = new java.net.URL(url);
        java.net.HttpURLConnection conn = (java.net.HttpURLConnection) apiUrl.openConnection();
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");

        String auth = twilioSid + ":" + twilioToken;
        String encodedAuth = java.util.Base64.getEncoder().encodeToString(auth.getBytes("UTF-8"));
        conn.setRequestProperty("Authorization", "Basic " + encodedAuth);

        try (java.io.OutputStream os = conn.getOutputStream()) {
            os.write(data.getBytes("UTF-8"));
        }

        int code = conn.getResponseCode();
        if (code < 200 || code >= 300) {
            throw new RuntimeException("Twilio API error: " + code);
        }
    }

    private void saveLog(Long eventId, String clientName, NotificationChannel channel,
                          String recipient, String message, String status, String error) {
        NotificationLog logEntry = NotificationLog.builder()
                .eventId(eventId)
                .eventClientName(clientName)
                .channel(channel)
                .recipient(recipient)
                .message(message)
                .status(status)
                .errorMessage(error)
                .build();
        logRepository.save(logEntry);
    }
}

