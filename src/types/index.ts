export interface PortalMeta {
  portalName: string;
  sectorName: string;
  district: string;
  state: string;
  ministry: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  espbLogoUrl: string;
  jataNegaraUrl: string;
  eKeberadaanUrl: string;
  cartaOrganisasiUrl: string;
  currentYear: number;
}

export interface HeroSlide {
  id: string;
  imageUrl: string;
  order: number;
  fileName: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  date: string;
  category: string;
  title: string;
  summary: string;
  link?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface UnitCategory {
  categoryId: string;
  categoryName: string;
  description: string;
  icon: string;
  displayOrder: number;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface Unit {
  unitId: string;
  unitCode: string;
  unitName: string;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  categoryId: string;
  logoFileId?: string;
  bannerFileId?: string;
  externalLink?: string;
  displayOrder: number;
  status: 'active' | 'inactive';
  hasDocuments: boolean;
  driveFolderId?: string;
  createdAt?: string;
  updatedAt?: string;
  docsCount?: number;
}

export interface UnitContent {
  contentId: string;
  unitId: string;
  sectionType: 'responsibility' | 'service' | 'custom';
  title: string;
  content: string;
  imageFileId?: string;
  documentFileId?: string;
  linkUrl?: string;
  displayOrder: number;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface Employee {
  employeeId: string;
  unitId: string;
  name: string;
  position: string;
  photoFileId?: string;
  photoUrl?: string;
  email: string;
  phone: string;
  accessRole: 'admin' | 'staff';
  displayOrder: number;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentRecord {
  documentId: string;
  unitId: string;
  title: string;
  description: string;
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  category: string;
  displayOrder: number;
  status: 'active' | 'inactive';
  uploadedAt: string;
  updatedAt?: string;
  viewUrl?: string;
  downloadUrl?: string;
  thumbUrl?: string;
}

export interface QuickAccessService {
  title: string;
  description: string;
  icon: string;
  link: string;
  external: boolean;
  order: number;
}

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  user: string;
  status: string;
  details: string;
}

export interface SystemInfo {
  unitCount: number;
  employeeCount: number;
  documentCount: number;
  announcementCount: number;
  auditLogs: AuditLogEntry[];
}

export interface SessionUser {
  role: 'admin' | 'staff';
  email?: string;
  exp: number;
  iat: number;
}

export interface InitialPortalData {
  heroAlbum: HeroSlide[];
  announcements: Announcement[];
  unitsHierarchy: {
    category: UnitCategory;
    units: Unit[];
  }[];
  quickAccess: QuickAccessService[];
  unitRegistry: Unit[];
  navigationData: {
    categories: UnitCategory[];
    units: Unit[];
  };
  meta: PortalMeta;
}

export interface UnitPortalData {
  unit: Unit;
  responsibilities: string[];
  services: string[];
  customContent: UnitContent[];
  employees: Employee[];
  documents: DocumentRecord[];
}

export type AdminTab =
  | 'hebahan'
  | 'album'
  | 'units'
  | 'content'
  | 'employees'
  | 'documents'
  | 'system';
