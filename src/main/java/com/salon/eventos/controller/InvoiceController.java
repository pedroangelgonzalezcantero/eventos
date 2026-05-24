package com.salon.eventos.controller;

import com.salon.eventos.dto.InvoiceDto;
import com.salon.eventos.dto.PaymentDto;
import com.salon.eventos.service.InvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/events/{eventId}/invoice")
public class InvoiceController {

    @Autowired
    private InvoiceService invoiceService;

    @GetMapping
    @PreAuthorize("hasAnyRole('OFFICE','CLIENT')")
    public ResponseEntity<InvoiceDto> getInvoice(@PathVariable Long eventId) {
        InvoiceDto dto = invoiceService.getByEvent(eventId);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.noContent().build();
    }

    @PostMapping
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<InvoiceDto> createOrUpdate(@PathVariable Long eventId,
                                                      @RequestBody InvoiceDto dto) {
        return ResponseEntity.ok(invoiceService.createOrUpdate(eventId, dto));
    }

    @PostMapping("/sign")
    @PreAuthorize("hasAnyRole('OFFICE','CLIENT')")
    public ResponseEntity<InvoiceDto> sign(@PathVariable Long eventId,
                                            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(invoiceService.signInvoice(eventId, body.get("signatureData")));
    }

    @PostMapping("/{invoiceId}/payments")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<PaymentDto> addPayment(@PathVariable Long eventId,
                                                  @PathVariable Long invoiceId,
                                                  @RequestBody PaymentDto dto) {
        return ResponseEntity.ok(invoiceService.addPayment(invoiceId, dto));
    }

    @DeleteMapping("/{invoiceId}/payments/{paymentId}")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Void> deletePayment(@PathVariable Long eventId,
                                               @PathVariable Long invoiceId,
                                               @PathVariable Long paymentId) {
        invoiceService.deletePayment(paymentId);
        return ResponseEntity.noContent().build();
    }
}

