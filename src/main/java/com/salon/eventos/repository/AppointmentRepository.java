package com.salon.eventos.repository;

import com.salon.eventos.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    /** Citas en un rango de fechas, ordenadas por fecha y hora */
    List<Appointment> findByAppointmentDateBetweenOrderByAppointmentDateAscStartTimeAsc(
            LocalDate from, LocalDate to);

    /** Citas de una trabajadora en un día concreto */
    List<Appointment> findByWorkerIdAndAppointmentDateOrderByStartTimeAsc(
            Long workerId, LocalDate date);
}

