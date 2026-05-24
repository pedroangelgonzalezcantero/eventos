package com.salon.eventos.controller;

import com.salon.eventos.dto.ReminderTemplateDto;
import com.salon.eventos.service.ReminderTemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reminder-templates")
@PreAuthorize("hasRole('OFFICE')")
public class ReminderTemplateController {

    @Autowired
    private ReminderTemplateService service;

    @GetMapping
    public ResponseEntity<List<ReminderTemplateDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReminderTemplateDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<ReminderTemplateDto> create(@RequestBody ReminderTemplateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReminderTemplateDto> update(@PathVariable Long id,
                                                       @RequestBody ReminderTemplateDto dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

