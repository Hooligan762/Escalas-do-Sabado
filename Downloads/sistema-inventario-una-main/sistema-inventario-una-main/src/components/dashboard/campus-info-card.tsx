"use client";

import { CampusIconComponent, getCampusIconByName } from '@/lib/campus-icons';
import { Card, CardContent } from '@/components/ui/card';
import type { User } from '@/lib/types';

interface CampusInfoCardProps {
  user: User;
}

export function CampusInfoCard({ user }: CampusInfoCardProps) {
  // user.campus pode ser string ou objeto { id, name }
  const userCampusName = typeof user.campus === 'object' ? user.campus?.name : user.campus;
  const campusIcon = getCampusIconByName(userCampusName || '');
  
  if (!campusIcon) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <CampusIconComponent 
            campusName={userCampusName || ''} 
            size="lg"
          />
          <div>
            <h3 className="font-semibold text-gray-900">
              {campusIcon.name}
            </h3>
            <p className="text-sm text-gray-600">
              {campusIcon.description}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Logado como: {user.name} ({user.role})
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}