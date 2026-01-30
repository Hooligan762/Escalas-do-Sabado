export type Technician = string;

export const technicians: Technician[] = ['Ismael', 'Batista', 'Geraldo', 'Bernardo'];

export type ScheduleStatus = Technician | 'Não Necessário';

export type Schedule = Record<string, ScheduleStatus | undefined>;

export type AnalyticsData = {
  name: Technician;
  shifts: number;
}[];
