package com.salon.eventos.service;

import com.salon.eventos.dto.InvoiceDto;
import com.salon.eventos.dto.PaymentDto;
import com.salon.eventos.entity.Event;
import com.salon.eventos.entity.Invoice;
import com.salon.eventos.entity.Payment;
import com.salon.eventos.repository.EventRepository;
import com.salon.eventos.repository.InvoiceRepository;
import com.salon.eventos.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class InvoiceService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private EventRepository eventRepository;

    public InvoiceDto getByEvent(Long eventId) {
        return invoiceRepository.findByEventId(eventId)
                .map(this::toDto)
                .orElse(null);
    }

    public InvoiceDto createOrUpdate(Long eventId, InvoiceDto dto) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado"));

        Invoice invoice = invoiceRepository.findByEventId(eventId).orElse(new Invoice());
        invoice.setEvent(event);
        invoice.setTotalAmount(dto.getTotalAmount());
        invoice.setDescription(dto.getDescription());
        invoice.setBreakdown(dto.getBreakdown());
        if (invoice.getInvoiceNumber() == null) {
            invoice.setInvoiceNumber("FAC-" + eventId + "-" + System.currentTimeMillis() % 10000);
        }
        return toDto(invoiceRepository.save(invoice));
    }

    public InvoiceDto signInvoice(Long eventId, String signatureData) {
        Invoice invoice = invoiceRepository.findByEventId(eventId)
                .orElseThrow(() -> new RuntimeException("Factura no encontrada"));
        invoice.setSigned(true);
        invoice.setSignedAt(LocalDateTime.now());
        invoice.setSignatureData(signatureData);
        // Marcar presupuesto firmado en el evento
        Event event = eventRepository.findById(eventId).orElse(null);
        if (event != null) {
            event.setBudgetSigned(true);
            eventRepository.save(event);
        }
        return toDto(invoiceRepository.save(invoice));
    }

    public PaymentDto addPayment(Long invoiceId, PaymentDto dto) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Factura no encontrada"));
        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setAmount(dto.getAmount());
        payment.setPaymentDate(dto.getPaymentDate());
        payment.setDescription(dto.getDescription());
        payment.setStatus(dto.getStatus() != null ? dto.getStatus() : "PAGADO");
        payment.setMethod(dto.getMethod());
        return toPaymentDto(paymentRepository.save(payment));
    }

    public void deletePayment(Long paymentId) {
        paymentRepository.deleteById(paymentId);
    }

    private InvoiceDto toDto(Invoice inv) {
        List<Payment> payments = paymentRepository.findByInvoiceId(inv.getId());
        BigDecimal paid = payments.stream()
                .filter(p -> "PAGADO".equals(p.getStatus()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pending = inv.getTotalAmount() != null ? inv.getTotalAmount().subtract(paid) : BigDecimal.ZERO;

        return InvoiceDto.builder()
                .id(inv.getId())
                .eventId(inv.getEvent().getId())
                .invoiceNumber(inv.getInvoiceNumber())
                .totalAmount(inv.getTotalAmount())
                .paidAmount(paid)
                .pendingAmount(pending.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : pending)
                .description(inv.getDescription())
                .breakdown(inv.getBreakdown())
                .signed(inv.isSigned())
                .signedAt(inv.getSignedAt())
                .payments(payments.stream().map(this::toPaymentDto).collect(Collectors.toList()))
                .build();
    }

    private PaymentDto toPaymentDto(Payment p) {
        return PaymentDto.builder()
                .id(p.getId())
                .invoiceId(p.getInvoice().getId())
                .amount(p.getAmount())
                .paymentDate(p.getPaymentDate())
                .description(p.getDescription())
                .status(p.getStatus())
                .method(p.getMethod())
                .build();
    }
}

