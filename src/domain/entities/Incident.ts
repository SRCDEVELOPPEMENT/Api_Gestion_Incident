import { Task } from './Task';
import { Site } from './Site';
import { Attachment } from './Attachment';
import { Personne } from './Personne';
import { IncidentComment } from './IncidentComment';
import { SubCategory } from './SubCategory';
import { Category } from './Category';
import { SubProcess } from './SubProcess';

export interface Incident {
  id: string;
  userId: number;
  reference: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  reporterId: string;
  subProcessId?: string;
  subCategoryId: string;
  processDomainId?: string;
  dueDate: Date;
  reporterName: string; // ✅ nouveau
  glpiTicketId: number | null; // ✅ nouveau
  scope?: string | null;
  urgency: 'Faible' | 'Moyenne' | 'Haute' | 'Immédiate';
  criticality: 'Faible' | 'Moyenne' | 'Haute' | 'Critique';
  serviceEmitter?: string | null;
  // Relations
  categoryId: string;
  category?: Category[];
  subCategory?: SubCategory[];
  subProcess?: SubProcess[];
  otherSubCategory?: string | null;
  comments?: string | null;
  tasks?: Task[];
  sites?: Site[];
  incidentComments?: IncidentComment[];
  impactedSites: {
    id: number;
    name: string;
  }[];
  processDomain?: string | null;
  personnes?: Personne[];
  attachments?: Attachment[];
  rootCause?: string | null;
  proposedSolution?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  // Premium: assigned GLPI users (array of GLPIUser objects)
  glpiUsers?: any[];
}

export type CreateIncidentDTO = {
  reference?: string; // ⬅️ optionnel (backend only)
  description: string;
  subProcessId?: string; // ✅ OPTIONNEL
  subCategoryId?: string;
  reporterName: string;
  glpiTicketId?: number | null;
  siteIds: string[];
  impactedSiteIds: string[];
  //assignedUserIds?: string[];
    // ✅ NOUVEAU
  personneIds?: number[];
  categoryId: string;
  otherSubCategory?: string;
  processDomainId?: string;
  dueDate: string;
  scope: string;
  urgency: 'Faible' | 'Moyenne' | 'Haute' | 'Immédiate';
  criticality: 'Faible' | 'Moyenne' | 'Haute' | 'Critique';
  rootCause?: string;
  proposedSolution?: string;
  // Premium: utilisateurs GLPI assignés
  glpiUserIds?: number[];
};

export type UpdateIncidentDTO = Partial<{
  description: string;
  subProcessId?: string;
  subCategoryId: string;
  categoryId: string;
  processDomainId?: string;
  dueDate: string;
  scope: string;
  reporterName: string;
  glpiTicketId: number | null;
  urgency: 'Faible' | 'Moyenne' | 'Haute' | 'Immédiate';
  criticality: 'Faible' | 'Moyenne' | 'Haute' | 'Critique';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
  // ✅ relations modifiables
  siteIds: string[];
  impactedSiteIds: string[];       // ✅ NOUVEAU
  //assignedUserIds?: string[];
   // ✅ NOUVEAU
  personneIds?: number[];
  attachments?: {
    fileName: string;
    url: string;
  }[];
  rootCause?: string;
  proposedSolution?: string;
}>;
