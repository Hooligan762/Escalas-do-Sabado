'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Save, X, Trash2, Settings2, FolderOpen, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Category, Sector } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ManagementViewProps {
  categories: Category[];
  sectors: Sector[];
  user?: { name: string; campus: string | { id: string | number; name: string }; role: 'admin' | 'tecnico' }; // Adiciona informações do usuário
  onAddCategory: (name: string) => void;
  onDeleteCategory: (id: string | number) => void;
  onEditCategory: (id: string | number, newName: string) => void;
  onAddSector: (name: string) => void;
  onDeleteSector: (id: string | number) => void;
  onEditSector: (id: string | number, newName: string) => void;
}

export default function ManagementView({
  categories,
  sectors,
  user,
  onAddCategory,
  onDeleteCategory,
  onEditCategory,
  onAddSector,
  onDeleteSector,
  onEditSector,
}: ManagementViewProps) {
  const { toast } = useToast();

  // 🔍 Monitorar mudanças nas props para debug
  React.useEffect(() => {
    console.log('🔄 [ManagementView] Props atualizadas:', {
      categoriesLength: categories.length,
      sectorsLength: sectors.length,
      userRole: user?.role,
      userCampus: user?.campus,
      timestamp: new Date().toISOString()
    });
  }, [categories, sectors, user]);

  // Estados para categorias
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [editingCategoryId, setEditingCategoryId] = React.useState<string | number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = React.useState('');

  // Estados para setores
  const [newSectorName, setNewSectorName] = React.useState('');
  const [editingSectorId, setEditingSectorId] = React.useState<string | number | null>(null);
  const [editingSectorName, setEditingSectorName] = React.useState('');

  // Funções para categorias
  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nome da categoria não pode estar vazio.',
      });
      return;
    }

    if (categories.some(c => c.name && name && c.name.toLowerCase() === name.toLowerCase())) {
      toast({
        variant: 'destructive',
        title: 'Categoria Duplicada',
        description: 'Já existe uma categoria com este nome.',
      });
      return;
    }

    onAddCategory(name);
    setNewCategoryName('');
    toast({
      title: 'Categoria Adicionada',
      description: `A categoria "${name}" foi criada com sucesso.`,
    });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const handleSaveCategory = () => {
    const name = editingCategoryName.trim();
    if (!name) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nome da categoria não pode estar vazio.',
      });
      return;
    }

    if (categories.some(c => c.id !== editingCategoryId && c.name && name && c.name.toLowerCase() === name.toLowerCase())) {
      toast({
        variant: 'destructive',
        title: 'Categoria Duplicada',
        description: 'Já existe uma categoria com este nome.',
      });
      return;
    }

    onEditCategory(editingCategoryId!, name);
    setEditingCategoryId(null);
    setEditingCategoryName('');
    toast({
      title: 'Categoria Atualizada',
      description: `A categoria foi renomeada para "${name}".`,
    });
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const handleDeleteCategory = (category: Category) => {
    if (window.confirm(`Tem certeza que deseja excluir a categoria "${category.name}"? Esta ação não pode ser desfeita.`)) {
      onDeleteCategory(category.id);
      toast({
        title: 'Categoria Excluída',
        description: `A categoria "${category.name}" foi removida.`,
      });
    }
  };

  // Funções para setores
  const handleAddSector = () => {
    const name = newSectorName.trim();
    if (!name) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nome do setor não pode estar vazio.',
      });
      return;
    }

    if (sectors.some(s => s.name && name && s.name.toLowerCase() === name.toLowerCase())) {
      toast({
        variant: 'destructive',
        title: 'Setor Duplicado',
        description: 'Já existe um setor com este nome.',
      });
      return;
    }

    onAddSector(name);
    setNewSectorName('');
    toast({
      title: 'Setor Adicionado',
      description: `O setor "${name}" foi criado com sucesso.`,
    });
  };

  const handleEditSector = (sector: Sector) => {
    setEditingSectorId(sector.id);
    setEditingSectorName(sector.name);
  };

  const handleSaveSector = () => {
    const name = editingSectorName.trim();
    if (!name) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nome do setor não pode estar vazio.',
      });
      return;
    }

    if (sectors.some(s => s.id !== editingSectorId && s.name && name && s.name.toLowerCase() === name.toLowerCase())) {
      toast({
        variant: 'destructive',
        title: 'Setor Duplicado',
        description: 'Já existe um setor com este nome.',
      });
      return;
    }

    onEditSector(editingSectorId!, name);
    setEditingSectorId(null);
    setEditingSectorName('');
    toast({
      title: 'Setor Atualizado',
      description: `O setor foi renomeado para "${name}".`,
    });
  };

  const handleCancelSectorEdit = () => {
    setEditingSectorId(null);
    setEditingSectorName('');
  };

  const handleDeleteSector = (sector: Sector) => {
    if (window.confirm(`Tem certeza que deseja excluir o setor "${sector.name}"? Esta ação não pode ser desfeita.`)) {
      onDeleteSector(sector.id);
      toast({
        title: 'Setor Excluído',
        description: `O setor "${sector.name}" foi removido.`,
      });
    }
  };

  const isAdmin = user?.role === 'admin';
  // Extrair nome do campus (pode ser string ou objeto)
  const campusName = typeof user?.campus === 'object' ? user.campus?.name : user?.campus || 'Sistema';

  // Para técnico e admin: mostrar categorias
  const groupedCategories = React.useMemo(() => {
    console.log('🔍 [ManagementView] Processando categorias:', {
      isAdmin,
      campusName,
      totalCategorias: categories.length,
      primeiras3: categories.slice(0, 3).map(c => ({ 
        name: c.name, 
        campus: c.campus,
        campusType: typeof c.campus
      }))
    });
    
    if (!isAdmin) {
      // 🔒 TÉCNICO: Retorna TODAS categorias (filtro já foi feito no backend)
      const result = categories
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(c => ({
          id: c.id,
          name: c.name,
          campusName: typeof c.campus === 'object' ? c.campus?.name : c.campus || campusName,
        }));
      
      console.log('✅ [ManagementView] Técnico: retornando todas categorias (já filtradas no backend):', {
        totalRetornado: result.length,
        categorias: result.map(c => c.name)
      });
      
      return result;
    }
    
    // 👑 ADMIN: mostrar todas sem duplicatas
    console.log('👑 [ManagementView] Admin: removendo duplicatas');
    const seen = new Set<string>();
    return categories
      .filter(c => {
        const key = `${c.name}-${c.campus?.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(c => ({
        id: c.id,
        name: c.name,
        campusName: c.campus?.name || 'Sem Campus',
      }));
  }, [categories, isAdmin, campusName]);

  // Para técnico e admin: mostrar setores
  const groupedSectors = React.useMemo(() => {
    console.log('🔍 [ManagementView] Processando setores:', {
      isAdmin,
      campusName,
      totalSetores: sectors.length,
      primeiros3: sectors.slice(0, 3).map(s => ({ 
        name: s.name, 
        campus: s.campus,
        campusType: typeof s.campus
      }))
    });
    
    if (!isAdmin) {
      // 🔒 TÉCNICO: Retorna TODOS setores (filtro já foi feito no backend)
      const result = sectors
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(s => ({
          id: s.id,
          name: s.name,
          campusName: typeof s.campus === 'object' ? s.campus?.name : s.campus || campusName,
        }));
      
      console.log('✅ [ManagementView] Técnico: retornando todos setores (já filtrados no backend):', {
        totalRetornado: result.length,
        setores: result.map(s => s.name)
      });
      
      return result;
    }
    
    // 👑 ADMIN: mostrar todos sem duplicatas
    console.log('👑 [ManagementView] Admin: removendo duplicatas');
    const seen = new Set<string>();
    return sectors
      .filter(s => {
        const key = `${s.name}-${s.campus?.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(s => ({
        id: s.id,
        name: s.name,
        campusName: s.campus?.name || 'Sem Campus',
      }));
  }, [sectors, isAdmin, campusName]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Settings2 className="h-8 w-8" />
          Gerenciamento {isAdmin ? 'do Sistema' : `- Campus ${campusName}`}
        </h1>
        <p className="text-green-100">
          {isAdmin
            ? 'Gerencie categorias e setores de todos os campus. Adicione, edite ou remova itens conforme necessário.'
            : `Gerencie categorias e setores do seu campus (${campusName}). Adicione, edite ou remova itens conforme necessário.`
          }
        </p>
        {!isAdmin && (
          <div className="mt-3 p-3 bg-white/20 rounded-lg border border-white/30">
            <p className="text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-green-300 rounded-full"></span>
              🏢 Campus: {campusName} | 
              📁 {categories.length} categoria(s) | 
              🏢 {sectors.length} setor(es) | 
              🔒 Dados isolados por campus
            </p>
            <p className="text-xs mt-1 text-green-200">
              Os itens criados aqui ficarão visíveis apenas para usuários do campus {campusName}
            </p>
          </div>
        )}
      </div>

      {/* Tabs para Setores e Categorias - ORDEM INVERTIDA */}
      <Tabs defaultValue="sectors" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sectors" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Setores
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categorias
          </TabsTrigger>
        </TabsList>

        {/* Gerenciamento de Setores */}
        <TabsContent value="sectors">
          <div className="space-y-4">
            {/* Adicionar Novo Setor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Adicionar Novo Setor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do setor..."
                    value={newSectorName}
                    onChange={(e) => setNewSectorName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSector()}
                  />
                  <Button onClick={handleAddSector} disabled={!newSectorName.trim()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Setores */}
            <Card>
              <CardHeader>
                <CardTitle>Setores Existentes ({groupedSectors.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Campus</TableHead>
                        <TableHead className="w-[200px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedSectors.length > 0 ? groupedSectors.map((sector) => (
                        <TableRow key={sector.id}>
                          <TableCell>
                            {editingSectorId === sector.id ? (
                              <Input
                                value={editingSectorName}
                                onChange={(e) => setEditingSectorName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveSector();
                                  if (e.key === 'Escape') handleCancelSectorEdit();
                                }}
                                autoFocus
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{sector.name}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{sector.campusName}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {editingSectorId === sector.id ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSaveSector}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancelSectorEdit}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditSector(sector)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteSector(sector)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            Nenhum setor encontrado. Adicione um setor acima.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Gerenciamento de Categorias */}
        <TabsContent value="categories">
          <div className="space-y-4">
            {/* Adicionar Nova Categoria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Adicionar Nova Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome da categoria..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Categorias */}
            <Card>
              <CardHeader>
                <CardTitle>Categorias Existentes ({groupedCategories.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Campus</TableHead>
                        <TableHead className="w-[200px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedCategories.length > 0 ? groupedCategories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell>
                            {editingCategoryId === category.id ? (
                              <Input
                                value={editingCategoryName}
                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveCategory();
                                  if (e.key === 'Escape') handleCancelCategoryEdit();
                                }}
                                autoFocus
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{category.name}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{category.campusName}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {editingCategoryId === category.id ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSaveCategory}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancelCategoryEdit}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditCategory(category)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteCategory(category)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            Nenhuma categoria encontrada. Adicione uma categoria acima.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dicas de Uso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💡 Dicas de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">📁 Categorias</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Representam tipos de equipamentos (Desktop, Notebook, etc.)</li>
                <li>• São usadas no formulário de adição de equipamentos</li>
                <li>• {isAdmin ? 'Afetam todos os campus' : `Específicas para o campus ${campusName}`}</li>
                <li>• Não podem ser excluídas se houver equipamentos vinculados</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🏢 Setores</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Representam departamentos ou áreas (TI, Administração, etc.)</li>
                <li>• São usados para localizar equipamentos fisicamente</li>
                <li>• {isAdmin ? 'Afetam todos os campus' : `Específicos para o campus ${campusName}`}</li>
                <li>• Não podem ser excluídos se houver equipamentos vinculados</li>
              </ul>
            </div>
          </div>
          {!isAdmin && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>ℹ️ Informação:</strong> Como usuário do campus {campusName}, você pode gerenciar categorias e setores
                que serão utilizados pelos equipamentos do seu campus. Para alterações globais no sistema,
                entre em contato com um administrador.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
