import { Task } from './Task';
import { Site } from './Site';
import { User } from './User';
import { Attachment } from './Attachment';

export interface Incident {
  id: string;
  reference: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  reporterId: string;
  subProcessId?: string;
  subCategoryId: string;
  processDomainId?: string;
  dueDate: Date;
  scope?: string | null;
  urgency: 'Faible' | 'Moyenne' | 'Haute' | 'Immédiate';
  criticality: 'Faible' | 'Moyenne' | 'Haute' | 'Critique';

  // Relations
  categoryId: string;
  tasks?: Task[];
  sites?: Site[];
  //impactedSites?: Site[];
  impactedSites: {
    id: number;
    name: string;
  }[];
  assignedUsers?: User[]; // Users assigned to the incident
  attachments?: Attachment[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type CreateIncidentDTO = {
  reference?: string; // ⬅️ optionnel (backend only)
  description: string;
  subProcessId?: string; // ✅ OPTIONNEL
  subCategoryId?: string;
  siteIds: string[];
  impactedSiteIds: string[];
  assignedUserIds?: string[];
  categoryId: string;
  otherSubCategory?: string;
  processDomainId?: string;
  dueDate: string;
  scope: string;
  urgency: 'Faible' | 'Moyenne' | 'Haute' | 'Immédiate';
  criticality: 'Faible' | 'Moyenne' | 'Haute' | 'Critique';
};

export type UpdateIncidentDTO = Partial<{
  description: string;
  subProcessId?: string;
  subCategoryId: string;
  categoryId: string;
  processDomainId?: string;
  dueDate: string;
  scope: string;
  urgency: 'Faible' | 'Moyenne' | 'Haute' | 'Immédiate';
  criticality: 'Faible' | 'Moyenne' | 'Haute' | 'Critique';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
  // ✅ relations modifiables
  siteIds: string[];
  impactedSiteIds: string[];       // ✅ NOUVEAU
  assignedUserIds?: string[];
  attachments?: {
    fileName: string;
    url: string;
  }[];
}>;
