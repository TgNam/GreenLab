package vn.greenlab.utils;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * Utility class for Excel export operations
 */
public class ExcelUtils {

    /**
     * Export data to Excel file
     * 
     * @param <T> The type of data objects
     * @param fieldMapping Map of field names to translated column names (maintains order)
     * @param fieldExtractors Map of field names to extractor functions
     * @param dataList List of data objects to export
     * @param sheetName Name of the Excel sheet (optional, defaults to "Sheet1")
     * @return byte array representing the Excel file
     * @throws IOException if an I/O error occurs
     */
    public static <T> byte[] exportToExcel(
            Map<String, String> fieldMapping,
            Map<String, Function<T, Object>> fieldExtractors,
            List<T> dataList,
            String sheetName) throws IOException {
        
        if (fieldMapping == null || fieldMapping.isEmpty()) {
            throw new IllegalArgumentException("fieldMapping cannot be null or empty");
        }
        if (fieldExtractors == null || fieldExtractors.isEmpty()) {
            throw new IllegalArgumentException("fieldExtractors cannot be null or empty");
        }
        if (dataList == null) {
            throw new IllegalArgumentException("dataList cannot be null");
        }

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet(sheetName != null ? sheetName : "Sheet1");

        // Create styles
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle cellStyle = createCellStyle(workbook);
        CellStyle dateTimeStyle = createDateTimeStyle(workbook, cellStyle);
        CellStyle dateOnlyStyle = createDateOnlyStyle(workbook, cellStyle);

        // Create header row
        Row headerRow = sheet.createRow(0);
        int colIndex = 0;
        for (String fieldName : fieldMapping.keySet()) {
            Cell cell = headerRow.createCell(colIndex++);
            cell.setCellValue(fieldMapping.get(fieldName));
            cell.setCellStyle(headerStyle);
        }

        // Create data rows
        int rowNum = 1;
        for (T data : dataList) {
            Row row = sheet.createRow(rowNum++);
            colIndex = 0;
            for (String fieldName : fieldMapping.keySet()) {
                Cell cell = row.createCell(colIndex++);
                Function<T, Object> extractor = fieldExtractors.get(fieldName);
                Object value = extractor != null ? extractor.apply(data) : null;

                setCellValue(cell, value, cellStyle, dateTimeStyle, dateOnlyStyle);
            }
        }

        // Auto-size columns
        int numColumns = fieldMapping.size();
        for (int i = 0; i < numColumns; i++) {
            sheet.autoSizeColumn(i);
            int width = sheet.getColumnWidth(i);
            if (width < 2000) {
                sheet.setColumnWidth(i, 2000);
            } else if (width > 15000) {
                sheet.setColumnWidth(i, 15000);
            }
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();

        return outputStream.toByteArray();
    }

    /**
     * Export data to Excel file with default sheet name "Sheet1"
     */
    public static <T> byte[] exportToExcel(
            Map<String, String> fieldMapping,
            Map<String, Function<T, Object>> fieldExtractors,
            List<T> dataList) throws IOException {
        return exportToExcel(fieldMapping, fieldExtractors, dataList, "Sheet1");
    }

    /**
     * Create header cell style
     */
    private static CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setFontHeightInPoints((short) 11);
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setBorderBottom(BorderStyle.THIN);
        headerStyle.setBorderTop(BorderStyle.THIN);
        headerStyle.setBorderLeft(BorderStyle.THIN);
        headerStyle.setBorderRight(BorderStyle.THIN);
        headerStyle.setAlignment(HorizontalAlignment.CENTER);
        headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        return headerStyle;
    }

    /**
     * Create default cell style
     */
    private static CellStyle createCellStyle(Workbook workbook) {
        CellStyle cellStyle = workbook.createCellStyle();
        cellStyle.setBorderBottom(BorderStyle.THIN);
        cellStyle.setBorderTop(BorderStyle.THIN);
        cellStyle.setBorderLeft(BorderStyle.THIN);
        cellStyle.setBorderRight(BorderStyle.THIN);
        cellStyle.setWrapText(true);
        return cellStyle;
    }

    /**
     * Create date-time cell style
     */
    private static CellStyle createDateTimeStyle(Workbook workbook, CellStyle baseStyle) {
        CellStyle dateTimeStyle = workbook.createCellStyle();
        dateTimeStyle.cloneStyleFrom(baseStyle);
        CreationHelper createHelper = workbook.getCreationHelper();
        dateTimeStyle.setDataFormat(createHelper.createDataFormat().getFormat("dd/MM/yyyy HH:mm"));
        return dateTimeStyle;
    }

    /**
     * Create date-only cell style
     */
    private static CellStyle createDateOnlyStyle(Workbook workbook, CellStyle baseStyle) {
        CellStyle dateOnlyStyle = workbook.createCellStyle();
        dateOnlyStyle.cloneStyleFrom(baseStyle);
        CreationHelper createHelper = workbook.getCreationHelper();
        dateOnlyStyle.setDataFormat(createHelper.createDataFormat().getFormat("dd/MM/yyyy"));
        return dateOnlyStyle;
    }

    /**
     * Set cell value with appropriate formatting
     */
    private static void setCellValue(Cell cell, Object value, 
                                     CellStyle cellStyle, 
                                     CellStyle dateTimeStyle, 
                                     CellStyle dateOnlyStyle) {
        if (value == null) {
            cell.setCellValue("");
            cell.setCellStyle(cellStyle);
        } else if (value instanceof Long && isTimestamp((Long) value)) {
            Date date = new Date((Long) value);
            cell.setCellValue(date);
            if (isDateOnly((Long) value)) {
                cell.setCellStyle(dateOnlyStyle);
            } else {
                cell.setCellStyle(dateTimeStyle);
            }
        } else if (value instanceof Boolean) {
            cell.setCellValue((Boolean) value ? "Có" : "Không");
            cell.setCellStyle(cellStyle);
        } else if (value instanceof Number) {
            cell.setCellValue(((Number) value).doubleValue());
            cell.setCellStyle(cellStyle);
        } else {
            cell.setCellValue(value.toString());
            cell.setCellStyle(cellStyle);
        }
    }

    /**
     * Check if a Long value is a valid timestamp
     */
    private static boolean isTimestamp(Long value) {
        return value != null && value > 0 && value < 4102444800000L;
    }

    /**
     * Check if a timestamp represents a date-only value (time is midnight)
     */
    private static boolean isDateOnly(Long value) {
        if (value == null) {
            return false;
        }
        Date date = new Date(value);
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);
        return cal.get(Calendar.HOUR_OF_DAY) == 0 &&
                cal.get(Calendar.MINUTE) == 0 &&
                cal.get(Calendar.SECOND) == 0;
    }
}
