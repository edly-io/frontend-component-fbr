import React from 'react';
import {
  Document, Page, StyleSheet, Text, View,
} from '@react-pdf/renderer';
import { CalendarPdfDay, CalendarPdfModel, CalendarPdfRow } from './types';

// Landscape A4: seven columns of session detail need the horizontal room, and
// it matches how printed timetables are read.
const PAGE_SIZE = 'A4';
const PAGE_ORIENTATION = 'landscape';

// Keeps a day heading with at least its first session (see DaySection).
const DAY_HEADING_MIN_PRESENCE_AHEAD = 40;

type ColumnKey = keyof Omit<CalendarPdfRow, 'id'>;

// Percentages so the table always fills the printable width whatever the page
// size is. They total 100.
const COLUMNS: Array<{ key: ColumnKey; label: string; width: string }> = [
  { key: 'time', label: 'Time', width: '14%' },
  { key: 'title', label: 'Session', width: '23%' },
  { key: 'course', label: 'Course', width: '21%' },
  { key: 'instructors', label: 'Instructor(s)', width: '16%' },
  { key: 'location', label: 'Location', width: '12%' },
  { key: 'type', label: 'Type', width: '7%' },
  { key: 'status', label: 'Status', width: '7%' },
];

const MUTED_COLUMNS: ColumnKey[] = ['course', 'location', 'type', 'status'];

const COLORS = {
  ink: '#1f2933',
  muted: '#5c6773',
  border: '#c7ccd1',
  hairline: '#e4e7ea',
  headerBg: '#1e3a5f',
  headerInk: '#ffffff',
  dayBg: '#eef2f6',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 28,
    fontSize: 9,
    color: COLORS.ink,
    fontFamily: 'Helvetica',
  },
  title: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  subtitle: { fontSize: 10, color: COLORS.muted, marginTop: 3 },
  meta: { fontSize: 8, color: COLORS.muted, marginTop: 2 },
  headerBlock: { marginBottom: 10 },
  table: { borderWidth: 1, borderColor: COLORS.border },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.headerBg,
    color: COLORS.headerInk,
  },
  headerCell: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  dayRow: {
    backgroundColor: COLORS.dayBg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 4,
    paddingHorizontal: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayLabel: { fontSize: 9.5, fontFamily: 'Helvetica-Bold' },
  dayCount: { fontSize: 8, color: COLORS.muted },
  row: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
  },
  cell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: COLORS.hairline,
  },
  cellLast: { borderRightWidth: 0 },
  timeText: { fontFamily: 'Helvetica-Bold' },
  mutedText: { color: COLORS.muted },
  empty: {
    marginTop: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: 'center',
    color: COLORS.muted,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 16,
    left: 28,
    right: 28,
    fontSize: 8,
    color: COLORS.muted,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

const pluralizeSessions = (count: number): string => (count === 1 ? ' session' : ' sessions');

const columnStyle = (width: string, index: number) => [
  { width },
  index === COLUMNS.length - 1 ? styles.cellLast : {},
];

const cellTextStyle = (key: ColumnKey) => [
  key === 'time' ? styles.timeText : {},
  MUTED_COLUMNS.includes(key) ? styles.mutedText : {},
];

// `fixed` repeats this row at the top of every page the table flows onto.
const TableHeader = () => (
  <View style={styles.headerRow} fixed>
    {COLUMNS.map((column, index) => (
      <Text key={column.key} style={[styles.headerCell, ...columnStyle(column.width, index)]}>
        {column.label}
      </Text>
    ))}
  </View>
);

// wrap={false} keeps a single session on one page rather than splitting its
// cells across the break. Rows are short enough that this never strands a page.
const SessionRow = ({ row }: { row: CalendarPdfRow }) => (
  <View style={styles.row} wrap={false}>
    {COLUMNS.map((column, index) => (
      <View key={column.key} style={[styles.cell, ...columnStyle(column.width, index)]}>
        <Text style={cellTextStyle(column.key)}>
          {row[column.key] || '—'}
        </Text>
      </View>
    ))}
  </View>
);

// The day heading sticks with at least its first session: `minPresenceAhead`
// pushes the heading to the next page rather than leaving it stranded at the
// foot of this one.
const DaySection = ({ day }: { day: CalendarPdfDay }) => (
  <View>
    <View style={styles.dayRow} minPresenceAhead={DAY_HEADING_MIN_PRESENCE_AHEAD}>
      <Text style={styles.dayLabel}>{day.label}</Text>
      <Text style={styles.dayCount}>
        {day.sessionCount}
        {pluralizeSessions(day.sessionCount)}
      </Text>
    </View>
    {day.rows.map((row) => <SessionRow key={row.id} row={row} />)}
  </View>
);

const CalendarPdfDocument = ({ model }: { model: CalendarPdfModel }) => (
  <Document title={`${model.title} — ${model.rangeLabel}`}>
    <Page size={PAGE_SIZE} orientation={PAGE_ORIENTATION} style={styles.page}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>{model.title}</Text>
        <Text style={styles.subtitle}>
          {model.programName ? `${model.programName} · ` : ''}
          {model.rangeLabel}
        </Text>
        <Text style={styles.meta}>
          {model.sessionCount}
          {pluralizeSessions(model.sessionCount)}
          {model.viewLabel ? ` · ${model.viewLabel} view` : ''}
          {` · Generated ${model.generatedAt}`}
        </Text>
      </View>

      {model.days.length === 0 ? (
        <View style={styles.empty}>
          <Text>No sessions are scheduled in this period.</Text>
        </View>
      ) : (
        <View style={styles.table}>
          <TableHeader />
          {model.days.map((day) => <DaySection key={day.dateKey} day={day} />)}
        </View>
      )}

      <View style={styles.pageNumber} fixed>
        <Text>{model.rangeLabel}</Text>
        <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  </Document>
);

export default CalendarPdfDocument;
