import { 
  Building2, 
  TreePine, 
  Train, 
  Heart, 
  Mountain, 
  Gem, 
  Crown, 
  Trophy, 
  Compass,
  Shield
} from 'lucide-react';

export interface CampusIcon {
  id: string;
  name: string;
  icon: any;
  color: string;
  bgColor: string;
  avatarGradient: string;
  description: string;
}

export const campusIcons: CampusIcon[] = [
  {
    id: 'admin-campus',
    name: 'Administrador',
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    avatarGradient: 'from-purple-500 to-purple-600',
    description: 'Administração Central'
  },
  {
    id: 'campus-1',
    name: 'Aimorés',
    icon: Mountain,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    avatarGradient: 'from-green-500 to-green-600',
    description: 'Campus Aimorés - Região das Montanhas'
  },
  {
    id: 'campus-2', 
    name: 'Barro Preto',
    icon: Building2,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    avatarGradient: 'from-gray-500 to-gray-600',
    description: 'Campus Barro Preto - Centro Urbano'
  },
  {
    id: 'campus-3',
    name: 'Linha Verde',
    icon: TreePine,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    avatarGradient: 'from-emerald-500 to-emerald-600',
    description: 'Campus Linha Verde - Região Ecológica'
  },
  {
    id: 'campus-4',
    name: 'Liberdade',
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    avatarGradient: 'from-red-500 to-red-600',
    description: 'Campus Liberdade - Coração de BH'
  },
  {
    id: 'campus-5',
    name: 'Barreiro',
    icon: Train,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    avatarGradient: 'from-blue-500 to-blue-600',
    description: 'Campus Barreiro - Região Industrial'
  },
  {
    id: 'campus-6',
    name: 'Guajajaras',
    icon: Gem,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    avatarGradient: 'from-indigo-500 to-indigo-600',
    description: 'Campus Guajajaras - Centro Histórico'
  },
  {
    id: 'campus-7',
    name: 'Complexo João Pinheiro',
    icon: Crown,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    avatarGradient: 'from-yellow-500 to-yellow-600',
    description: 'Campus Complexo João Pinheiro'
  },
  {
    id: 'campus-8',
    name: 'Raja Gabaglia',
    icon: Trophy,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    avatarGradient: 'from-orange-500 to-orange-600',
    description: 'Campus Raja Gabaglia - Zona Sul'
  },
  {
    id: 'campus-9',
    name: 'Polo UNA BH Centro',
    icon: Compass,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    avatarGradient: 'from-cyan-500 to-cyan-600',
    description: 'Campus Polo UNA BH Centro - Centro da Cidade'
  }
];

// Função para obter ícone por ID do campus
export function getCampusIcon(campusId: string): CampusIcon | null {
  return campusIcons.find(icon => icon.id === campusId) || null;
}

// Função para obter ícone por nome do campus
export function getCampusIconByName(campusName: string): CampusIcon | null {
  return campusIcons.find(icon => icon.name === campusName) || null;
}

// Componente para renderizar ícone do campus
interface CampusIconComponentProps {
  campusId?: string;
  campusName?: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  variant?: 'default' | 'avatar';
  className?: string;
}

export function CampusIconComponent({ 
  campusId, 
  campusName, 
  size = 'md',
  showName = false,
  variant = 'default',
  className = ''
}: CampusIconComponentProps) {
  const campusIcon = campusId 
    ? getCampusIcon(campusId) 
    : campusName 
    ? getCampusIconByName(campusName)
    : null;

  if (!campusIcon) {
    return null;
  }

  const IconComponent = campusIcon.icon;
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  const containerClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  // Para avatars, usar apenas o ícone sem container
  if (variant === 'avatar') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <IconComponent className={`text-white ${sizeClasses[size]}`} />
        {showName && (
          <span className="text-sm font-medium text-gray-700">
            {campusIcon.name}
          </span>
        )}
      </div>
    );
  }

  // Versão padrão com container colorido
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className={`${campusIcon.bgColor} ${containerClasses[size]} rounded-lg flex items-center justify-center`}>
        <IconComponent className={`${campusIcon.color} ${sizeClasses[size]}`} />
      </div>
      {showName && (
        <span className="text-sm font-medium text-gray-700">
          {campusIcon.name}
        </span>
      )}
    </div>
  );
}