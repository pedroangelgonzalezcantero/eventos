package com.salon.eventos.service;

import com.salon.eventos.entity.Event;
import com.salon.eventos.entity.Guest;
import com.salon.eventos.entity.GuestTable;
import com.salon.eventos.repository.EventRepository;
import com.salon.eventos.repository.GuestRepository;
import com.salon.eventos.repository.GuestTableRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;

/**
 * Servicio para generar y leer Excel de mesas e invitados.
 *
 * FORMATO COLUMNAR (igual que la plantilla original del usuario):
 *   Fila 1 â†’ A1 = Nombre pareja/evento,  C1 = SalÃ³n
 *   Fila 2 â†’ Cabeceras: A2=MESA NUPCIAL, B2=MESA 1, C2=MESA 2 â€¦
 *   Fila 3+ â†’ Invitados por columna (cada columna = una mesa)
 */
@Service
@Slf4j
public class TableExcelService {

    private static final String TEMPLATE_PATH = "Ejemplo plantilla mesas.xlsx";

    @Autowired private EventRepository      eventRepo;
    @Autowired private GuestTableRepository tableRepo;
    @Autowired private GuestRepository      guestRepo;

    // â”€â”€â”€ DESCARGA DE PLANTILLA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public byte[] generateTemplate(Long eventId) throws IOException {
        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado: " + eventId));

        XSSFWorkbook wb;
        ClassPathResource resource = new ClassPathResource(TEMPLATE_PATH);

        if (resource.exists()) {
            try (InputStream is = resource.getInputStream()) {
                wb = new XSSFWorkbook(is);
                personalizeColumnarTemplate(wb, event);
            }
        } else {
            log.warn("Plantilla '{}' no encontrada en classpath; generando nueva.", TEMPLATE_PATH);
            wb = createFreshColumnarTemplate(event);
        }

        if (wb.getSheetIndex("Instrucciones") < 0) {
            addInstructionsSheet(wb);
        }

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            wb.write(out);
            wb.close();
            return out.toByteArray();
        }
    }

    /**
     * Personaliza la plantilla existente:
     *   A1 â†’ nombre del evento/pareja
     *   C1 â†’ salÃ³n
     */
    private void personalizeColumnarTemplate(XSSFWorkbook wb, Event event) {
        Sheet sheet = wb.getSheetAt(0);
        if (sheet == null) return;

        Row infoRow = sheet.getRow(0);
        if (infoRow == null) infoRow = sheet.createRow(0);

        Cell nameCell = infoRow.getCell(0);
        if (nameCell == null) nameCell = infoRow.createCell(0);
        nameCell.setCellValue(buildEventName(event));

        Cell venueCell = infoRow.getCell(2);
        if (venueCell == null) venueCell = infoRow.createCell(2);
        venueCell.setCellValue(event.getVenue() != null ? event.getVenue() : "");
    }

    /**
     * Crea una plantilla nueva con el formato columnar exacto del usuario.
     */
    private XSSFWorkbook createFreshColumnarTemplate(Event event) {
        XSSFWorkbook wb    = new XSSFWorkbook();
        XSSFSheet    sheet = wb.createSheet("Mesas");

        CellStyle infoStyle   = createInfoStyle(wb);
        CellStyle salonStyle  = createSalonStyle(wb);
        CellStyle headerStyle = createHeaderStyle(wb);
        CellStyle guestStyle  = createGuestStyle(wb);

        // Mesas: nupcial + 15 numeradas
        String[] mesaNames = new String[16];
        mesaNames[0] = "MESA NUPCIAL\n(SOLO BODAS)";
        for (int i = 1; i <= 15; i++) mesaNames[i] = "MESA " + i;

        for (int c = 0; c < mesaNames.length; c++) {
            sheet.setColumnWidth(c, 20 * 256);
        }

        // Fila 0: info evento
        Row r0 = sheet.createRow(0);
        r0.setHeightInPoints(20);
        Cell nc = r0.createCell(0);
        nc.setCellValue(buildEventName(event));
        nc.setCellStyle(infoStyle);
        Cell vc = r0.createCell(2);
        vc.setCellValue(event.getVenue() != null ? event.getVenue() : "");
        vc.setCellStyle(salonStyle);

        // Fila 1: cabeceras de mesas
        Row r1 = sheet.createRow(1);
        r1.setHeightInPoints(30);
        for (int c = 0; c < mesaNames.length; c++) {
            Cell hc = r1.createCell(c);
            hc.setCellValue(mesaNames[c]);
            hc.setCellStyle(headerStyle);
        }

        // Filas 2-31: celdas vacÃ­as para invitados
        for (int row = 2; row <= 31; row++) {
            Row r = sheet.createRow(row);
            r.setHeightInPoints(16);
            for (int c = 0; c < mesaNames.length; c++) {
                r.createCell(c).setCellStyle(guestStyle);
            }
        }

        return wb;
    }

    // â”€â”€â”€ IMPORTACIÃ“N DE EXCEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public record ImportResult(
        int tablesCreated,
        int guestsCreated,
        int tablesSkipped,
        int guestsSkipped,          // ya estaban en BD (no se tocan, sus alergias se conservan)
        List<String> errors,
        List<String> warnings,
        List<TableSummary> tableSummaries
    ) {}

    /** Resumen por mesa */
    public record TableSummary(
        String tableName,
        int inExcel,      // total de invitados (incluyendo nombres repetidos) en el Excel
        int alreadyInDb,  // ya estaban en BD con esa cantidad â†’ conservados tal cual
        int added         // invitados nuevos creados en esta importaciÃ³n
    ) {}

    /**
     * Importa mesas e invitados desde un Excel en formato columnar.
     *
     * Reglas:
     *  â‘  Pueden existir varias personas con el mismo nombre en la misma mesa  (son personas distintas)
     *  â‘¡ Se usa conteo: si Excel tiene 3 "Pedro" en MESA 1 y BD tiene 2 â†’ se aÃ±ade 1 mÃ¡s
     *  â‘¢ Si ya existe el mismo nÃºmero o mÃ¡s en BD â†’ no se aÃ±ade ninguno (preservando alergias/dieta)
     */
    @Transactional
    public ImportResult importFromExcel(MultipartFile file, Long eventId) throws IOException {
        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado: " + eventId));

        List<String> errors    = new ArrayList<>();
        List<String> warnings  = new ArrayList<>();
        List<TableSummary> summaries = new ArrayList<>();

        String fn = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (!fn.endsWith(".xlsx") && !fn.endsWith(".xls")) {
            errors.add("El archivo debe ser un Excel (.xlsx o .xls)");
            return new ImportResult(0, 0, 0, 0, errors, warnings, summaries);
        }

        Workbook wb;
        try (InputStream is = file.getInputStream()) {
            wb = WorkbookFactory.create(is);
        } catch (Exception e) {
            errors.add("No se pudo leer el archivo Excel: " + e.getMessage());
            return new ImportResult(0, 0, 0, 0, errors, warnings, summaries);
        }

        Sheet sheet = findDataSheet(wb);
        if (sheet == null) {
            errors.add("No se encontrÃ³ hoja de datos en el Excel.");
            wb.close();
            return new ImportResult(0, 0, 0, 0, errors, warnings, summaries);
        }

        int headerRowIdx = findHeaderRow(sheet);
        if (headerRowIdx < 0) {
            errors.add("No se encontrÃ³ la fila de cabeceras con los nombres de mesas. "
                     + "AsegÃºrate de usar la plantilla descargada.");
            wb.close();
            return new ImportResult(0, 0, 0, 0, errors, warnings, summaries);
        }

        Row headerRow = sheet.getRow(headerRowIdx);
        int lastCol   = headerRow.getLastCellNum();

        // Mapa columna â†’ nombre de mesa
        Map<Integer, String> colToMesa = new LinkedHashMap<>();
        for (int c = 0; c < lastCol; c++) {
            String mesaName = getCellString(headerRow.getCell(c)).trim()
                              .replaceAll("[\r\n]+", " ").trim();
            if (!mesaName.isEmpty()) colToMesa.put(c, mesaName);
        }

        if (colToMesa.isEmpty()) {
            errors.add("La fila de cabeceras no contiene nombres de mesas.");
            wb.close();
            return new ImportResult(0, 0, 0, 0, errors, warnings, summaries);
        }

        // Cargar mesas existentes
        Map<String, GuestTable> existingTables = new HashMap<>();
        tableRepo.findByEventIdOrderByPositionAscNameAsc(eventId)
                 .forEach(t -> existingTables.put(normalizeKey(t.getName()), t));

        int tablesCreated = 0, guestsCreated = 0, tablesSkipped = 0, guestsSkipped = 0;
        int position = (int) tableRepo.count() + 1;

        // â”€â”€ Procesar columna a columna â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        for (Map.Entry<Integer, String> entry : colToMesa.entrySet()) {
            int    col      = entry.getKey();
            String mesaName = entry.getValue();
            String mesaKey  = normalizeKey(mesaName);
            // -- 1. Recoger nombres del Excel PRIMERO (antes de crear la mesa)
            // Solo procesar la mesa si tiene al menos un invitado en el Excel
            Map<String, Integer> excelCount    = new LinkedHashMap<>();
            Map<String, String>  excelOriginal = new LinkedHashMap<>();

            for (int r = headerRowIdx + 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                String guestName = getCellString(row.getCell(col)).trim();
                if (guestName.isEmpty()) continue;
                String key = normalizeKey(guestName);
                excelCount.merge(key, 1, Integer::sum);
                excelOriginal.putIfAbsent(key, guestName);
            }

            int totalInExcel = excelCount.values().stream().mapToInt(Integer::intValue).sum();

            // Columna vacia: no crear la mesa, ignorarla
            if (totalInExcel == 0) continue;

            // -- 2. Obtener o crear la mesa (solo si tiene invitados)
            GuestTable table;
            if (existingTables.containsKey(mesaKey)) {
                table = existingTables.get(mesaKey);
                tablesSkipped++;
            } else {
                table = GuestTable.builder()
                        .event(event).name(mesaName).position(position++).build();
                table = tableRepo.save(table);
                existingTables.put(mesaKey, table);
                tablesCreated++;
            }

            // -- 3. Contar cuantos de cada nombre ya existen en BD para esta mesa
            Map<String, Integer> dbCount = new HashMap<>();
            guestRepo.findByTableIdOrderByGuestNameAsc(table.getId())
                     .forEach(g -> dbCount.merge(normalizeKey(g.getGuestName()), 1, Integer::sum));

            // -- 4. Determinar cuantos anadir por cada nombre
            int mesaAdded       = 0;
            int mesaAlreadyInDb = 0;

            for (Map.Entry<String, Integer> nameEntry : excelCount.entrySet()) {
                String normName   = nameEntry.getKey();
                int    inExcel    = nameEntry.getValue();
                int    inDb       = dbCount.getOrDefault(normName, 0);
                int    toAdd      = Math.max(0, inExcel - inDb);
                int    alreadyOk  = Math.min(inExcel, inDb);

                mesaAlreadyInDb += alreadyOk;
                guestsSkipped   += alreadyOk;

                if (toAdd > 0) {
                    String originalName = excelOriginal.get(normName);
                    for (int i = 0; i < toAdd; i++) {
                        guestRepo.save(Guest.builder()
                                .table(table)
                                .guestName(originalName)
                                .build());
                        mesaAdded++;
                        guestsCreated++;
                    }
                }
            }

            summaries.add(new TableSummary(mesaName, totalInExcel, mesaAlreadyInDb, mesaAdded));
        }

        wb.close();
        return new ImportResult(tablesCreated, guestsCreated, tablesSkipped,
                                guestsSkipped, errors, warnings, summaries);
    }


    // â”€â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private Sheet findDataSheet(Workbook wb) {
        for (int i = 0; i < wb.getNumberOfSheets(); i++) {
            String name = wb.getSheetName(i).toLowerCase();
            if (!name.contains("instruc") && !name.contains("ayuda") && !name.contains("help")) {
                return wb.getSheetAt(i);
            }
        }
        return wb.getNumberOfSheets() > 0 ? wb.getSheetAt(0) : null;
    }

    /**
     * Detecta la fila de cabeceras: primera fila que tenga al menos una celda con "MESA"
     * o que tenga mÃºltiples celdas repartidas en columnas diferentes (patrÃ³n columnar).
     */
    private int findHeaderRow(Sheet sheet) {
        int maxScan = Math.min(5, sheet.getLastRowNum());
        for (int r = 0; r <= maxScan; r++) {
            Row row = sheet.getRow(r);
            if (row == null) continue;

            List<String> vals = new ArrayList<>();
            for (Cell c : row) {
                String v = getCellString(c).trim().toUpperCase()
                           .replaceAll("[\r\n]+"," ");
                if (!v.isEmpty()) vals.add(v);
            }
            if (vals.isEmpty()) continue;

            boolean hasMesa = vals.stream().anyMatch(v ->
                    v.contains("MESA") || v.contains("TABLE") || v.contains("PRESIDENCI"));
            if (hasMesa) return r;
        }
        return -1;
    }

    private String normalizeKey(String s) {
        if (s == null) return "";
        return s.trim().toLowerCase()
                .replaceAll("[\r\n]+"," ")
                .replaceAll("[Ã¡Ã Ã¤Ã¢]","a").replaceAll("[Ã©Ã¨Ã«Ãª]","e")
                .replaceAll("[Ã­Ã¬Ã¯Ã®]","i").replaceAll("[Ã³Ã²Ã¶Ã´]","o")
                .replaceAll("[ÃºÃ¹Ã¼Ã»]","u").replaceAll("[Ã±]","n")
                .replaceAll("\\s+"," ").trim();
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue();
            case NUMERIC -> {
                double d = cell.getNumericCellValue();
                yield d == Math.floor(d) ? String.valueOf((long) d) : String.valueOf(d);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try { yield cell.getStringCellValue(); }
                catch (Exception e) { yield String.valueOf(cell.getNumericCellValue()); }
            }
            default -> "";
        };
    }

    private String buildEventName(Event event) {
        return (event.getClientName() != null && !event.getClientName().isEmpty())
                ? event.getClientName() : "Evento #" + event.getId();
    }

    // â”€â”€â”€ ESTILOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private CellStyle createInfoStyle(XSSFWorkbook wb) {
        CellStyle s = wb.createCellStyle();
        XSSFFont  f = wb.createFont();
        f.setBold(true); f.setFontHeightInPoints((short) 12);
        s.setFont(f);
        s.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setAlignment(HorizontalAlignment.LEFT);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        return s;
    }

    private CellStyle createSalonStyle(XSSFWorkbook wb) {
        CellStyle s = wb.createCellStyle();
        XSSFFont  f = wb.createFont();
        f.setBold(true); f.setFontHeightInPoints((short) 11);
        s.setFont(f);
        s.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setAlignment(HorizontalAlignment.CENTER);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        return s;
    }

    private CellStyle createHeaderStyle(XSSFWorkbook wb) {
        CellStyle s = wb.createCellStyle();
        XSSFFont  f = wb.createFont();
        f.setBold(true); f.setFontHeightInPoints((short) 10);
        s.setFont(f);
        s.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setAlignment(HorizontalAlignment.CENTER);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        s.setWrapText(true);
        s.setBorderBottom(BorderStyle.THIN);
        s.setBorderTop(BorderStyle.THIN);
        s.setBorderLeft(BorderStyle.THIN);
        s.setBorderRight(BorderStyle.THIN);
        return s;
    }

    private CellStyle createGuestStyle(XSSFWorkbook wb) {
        CellStyle s = wb.createCellStyle();
        s.setBorderBottom(BorderStyle.HAIR);
        s.setBorderTop(BorderStyle.HAIR);
        s.setBorderLeft(BorderStyle.HAIR);
        s.setBorderRight(BorderStyle.HAIR);
        return s;
    }

    private void addInstructionsSheet(XSSFWorkbook wb) {
        XSSFSheet sheet = wb.createSheet("Instrucciones");
        sheet.setColumnWidth(0, 90 * 256);
        CellStyle titleStyle = createInfoStyle(wb);
        CellStyle normal     = wb.createCellStyle();
        String[] lines = {
            "INSTRUCCIONES DE USO â€” PLANTILLA MESAS",
            "",
            "FORMATO DEL EXCEL:",
            "  â€¢ Fila 1: Nombre de la pareja (col A) y salÃ³n (col C) â€” solo informativo",
            "  â€¢ Fila 2 (amarilla): Nombres de las mesas â€” MESA NUPCIAL, MESA 1, MESA 2...",
            "  â€¢ Filas siguientes: Un invitado por celda, en la columna de su mesa",
            "",
            "EJEMPLO:",
            "  MESA NUPCIAL  |  MESA 1      |  MESA 2",
            "  Pedro         |  Ana GarcÃ­a  |  Luis",
            "  MarÃ­a         |  Carlos      |  Elena",
            "                |  SofÃ­a       |",
            "",
            "NOTAS:",
            "  â€¢ Cada COLUMNA = una mesa. Cada FILA dentro de esa columna = un invitado.",
            "  â€¢ Puedes dejar columnas vacÃ­as si una mesa no tiene invitados todavÃ­a.",
            "  â€¢ No modifiques los nombres de las columnas (fila amarilla).",
            "  â€¢ Guarda como .xlsx antes de importar.",
        };
        for (int i = 0; i < lines.length; i++) {
            Row row = sheet.createRow(i);
            Cell c  = row.createCell(0);
            c.setCellValue(lines[i]);
            c.setCellStyle(i == 0 ? titleStyle : normal);
        }
    }
}


