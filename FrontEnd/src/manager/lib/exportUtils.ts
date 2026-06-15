import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export type ExportFormat = 'PDF' | 'CSV' | 'Excel' | string;

export interface ExportConfig {
  filename: string;
  title: string;
  headers: string[];
  data: any[][];
  jsonData: any[];
}

export const exportData = (format: ExportFormat, config: ExportConfig) => {
  const { filename, title, headers, data, jsonData } = config;

  if (format === 'PDF') {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

    autoTable(doc, {
      startY: 40,
      head: [headers],
      body: data,
      headStyles: { fillColor: [79, 70, 229] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    doc.save(`${filename}.pdf`);
  } else if (format === 'CSV') {
    const csvHeaders = headers.join(',');
    const rows = data.map(row => 
      row.map(value => `"${value}"`).join(',')
    ).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${csvHeaders}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (format === 'Excel') {
    const ws = XLSX.utils.json_to_sheet(jsonData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
};

