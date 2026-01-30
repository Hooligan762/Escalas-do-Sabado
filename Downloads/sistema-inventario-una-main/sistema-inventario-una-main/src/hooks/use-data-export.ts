import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface ExportOptions {
  filename?: string;
  title?: string;
  campus?: string;
  includeTimestamp?: boolean;
}

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  format?: (value: any, item?: any) => string;
}

export function useDataExport() {
  const [isExporting, setIsExporting] = useState(false);

  const generateTimestamp = () => {
    return new Date().toISOString().replace(/[:.]/g, '-').split('T');
  };

  const exportToCSV = async (
    data: any[],
    columns: ExportColumn[],
    options: ExportOptions = {}
  ) => {
    setIsExporting(true);
    
    try {
      const headers = columns.map(col => col.header);
      const csvContent = [
        headers.join(','),
        ...data.map(item => 
          columns.map(col => {
            let value = item[col.key] || '';
            if (col.format) {
              value = col.format(value, item);
            }
            // Escape aspas duplas e envolve em aspas se necessário
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      
      const timestamp = generateTimestamp();
      const filename = options.filename || 'export';
      const finalFilename = options.includeTimestamp !== false 
        ? `${filename}_${timestamp[0]}_${timestamp[1].split('.')[0]}.csv`
        : `${filename}.csv`;
      
      link.setAttribute("download", finalFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async (
    data: any[],
    columns: ExportColumn[],
    options: ExportOptions = {}
  ) => {
    setIsExporting(true);
    
    try {
      const headers = columns.map(col => col.header);
      const excelData = data.map(item => 
        columns.map(col => {
          let value = item[col.key] || '';
          if (col.format) {
            value = col.format(value, item);
          }
          return value;
        })
      );

      // Criar workbook e worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...excelData]);

      // Configurar largura das colunas baseada nas definições
      const colWidths = columns.map(col => ({ wch: col.width || 15 }));
      ws['!cols'] = colWidths;

      // Aplicar estilo ao cabeçalho (se suportado)
      const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "366EF7" } },
          font: { color: { rgb: "FFFFFF" } }
        };
      }

      // Adicionar informações do relatório se fornecidas
      const sheetName = options.title || "Dados";
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      // Gerar nome do arquivo
      const timestamp = generateTimestamp();
      const filename = options.filename || 'export';
      const finalFilename = options.includeTimestamp !== false 
        ? `${filename}_${timestamp[0]}_${timestamp[1].split('.')[0]}.xlsx`
        : `${filename}.xlsx`;
      
      XLSX.writeFile(wb, finalFilename);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async (
    data: any[],
    columns: ExportColumn[],
    options: ExportOptions = {}
  ) => {
    setIsExporting(true);
    
    try {
      const doc = new jsPDF('landscape');
      
      // Cabeçalho do documento
      doc.setFontSize(16);
      doc.setTextColor(40);
      const title = options.title || 'Relatório de Dados';
      doc.text(title, 15, 15);
      
      if (options.campus) {
        doc.setFontSize(12);
        doc.setTextColor(60);
        doc.text(`Campus: ${options.campus}`, 15, 25);
      }
      
      // Data de geração
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 15, options.campus ? 35 : 25);

      const tableColumns = columns.map(col => col.header);
      const tableRows = data.map(item => 
        columns.map(col => {
          let value = item[col.key] || '';
          if (col.format) {
            value = col.format(value, item);
          }
          return String(value);
        })
      );

      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: options.campus ? 45 : 35,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
        didDrawPage: (data) => {
          // Rodapé com numeração
          const pageCount = doc.getNumberOfPages();
          const pageNumber = (doc as any).internal.getCurrentPageInfo()?.pageNumber || 1;
          let str = `Página ${pageNumber} de ${pageCount}`;
          doc.setFontSize(10);
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
          const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
          doc.text(str, pageWidth - data.settings.margin.right - 30, pageHeight - 10);
        },
      });

      const timestamp = generateTimestamp();
      const filename = options.filename || 'export';
      const finalFilename = options.includeTimestamp !== false 
        ? `${filename}_${timestamp[0]}_${timestamp[1].split('.')[0]}.pdf`
        : `${filename}.pdf`;
      
      doc.save(finalFilename);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToCSV,
    exportToExcel, 
    exportToPDF,
    isExporting,
  };
}