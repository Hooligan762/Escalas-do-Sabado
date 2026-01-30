"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, 
  FileDown, 
  FileText, 
  Settings,
  Loader2
} from 'lucide-react';
import { useDataExport } from '@/hooks/use-data-export';

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  format?: (value: any, item?: any) => string;
  enabled?: boolean;
}

interface ExportButtonProps {
  data: any[];
  columns: ExportColumn[];
  filename?: string;
  title?: string;
  campus?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showAdvanced?: boolean;
}

export function ExportButton({
  data,
  columns,
  filename = 'export',
  title = 'Dados',
  campus,
  variant = 'outline',
  size = 'default',
  showAdvanced = true
}: ExportButtonProps) {
  const { exportToCSV, exportToExcel, exportToPDF, isExporting } = useDataExport();
  const [showAdvancedDialog, setShowAdvancedDialog] = useState(false);
  const [customFilename, setCustomFilename] = useState(filename);
  const [selectedColumns, setSelectedColumns] = useState<ExportColumn[]>(
    columns.map(col => ({ ...col, enabled: col.enabled !== false }))
  );

  const handleQuickExport = async (format: 'csv' | 'excel' | 'pdf') => {
    const enabledColumns = columns.filter(col => col.enabled !== false);
    const options = {
      filename,
      title,
      campus,
      includeTimestamp: true
    };

    switch (format) {
      case 'csv':
        await exportToCSV(data, enabledColumns, options);
        break;
      case 'excel':
        await exportToExcel(data, enabledColumns, options);
        break;
      case 'pdf':
        await exportToPDF(data, enabledColumns, options);
        break;
    }
  };

  const handleAdvancedExport = async (format: 'csv' | 'excel' | 'pdf') => {
    const enabledColumns = selectedColumns.filter(col => col.enabled);
    const options = {
      filename: customFilename,
      title,
      campus,
      includeTimestamp: true
    };

    switch (format) {
      case 'csv':
        await exportToCSV(data, enabledColumns, options);
        break;
      case 'excel':
        await exportToExcel(data, enabledColumns, options);
        break;
      case 'pdf':
        await exportToPDF(data, enabledColumns, options);
        break;
    }

    setShowAdvancedDialog(false);
  };

  const toggleColumn = (index: number) => {
    setSelectedColumns(prev => prev.map((col, i) => 
      i === index ? { ...col, enabled: !col.enabled } : col
    ));
  };

  const toggleAllColumns = (enabled: boolean) => {
    setSelectedColumns(prev => prev.map(col => ({ ...col, enabled })));
  };

  if (isExporting) {
    return (
      <Button variant={variant} size={size} disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Exportando...
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Exportação Rápida</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleQuickExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport('excel')}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </DropdownMenuItem>
          
          {showAdvanced && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowAdvancedDialog(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Opções Avançadas
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de opções avançadas */}
      <Dialog open={showAdvancedDialog} onOpenChange={setShowAdvancedDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Opções de Exportação</DialogTitle>
            <DialogDescription>
              Personalize sua exportação selecionando as colunas e configurações.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Nome do arquivo */}
            <div className="space-y-2">
              <Label htmlFor="filename">Nome do arquivo</Label>
              <Input
                id="filename"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                placeholder="Nome do arquivo"
              />
            </div>

            {/* Seleção de colunas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Colunas para exportar</Label>
                <div className="space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleAllColumns(true)}
                  >
                    Todas
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleAllColumns(false)}
                  >
                    Nenhuma
                  </Button>
                </div>
              </div>
              
              <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-2">
                {selectedColumns.map((column, index) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`column-${index}`}
                      checked={column.enabled}
                      onCheckedChange={() => toggleColumn(index)}
                    />
                    <Label 
                      htmlFor={`column-${index}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {column.header}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Botões de exportação */}
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleAdvancedExport('csv')}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleAdvancedExport('excel')}
                className="flex-1"
              >
                <FileDown className="h-4 w-4 mr-1" />
                Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleAdvancedExport('pdf')}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}