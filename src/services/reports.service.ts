import fs from 'node:fs';
import path from 'node:path';

export interface IncidentReport {
  id: string;
  reporterId: string;
  reporterTag: string;
  accused: string;
  sessionTime: string;
  videoUrl: string;
  description: string;
  createdAt: string;
  status: 'PENDING' | 'PENALIZED' | 'DISMISSED';
  resolvedBy?: string;
  resolutionReason?: string;
  resolvedAt?: string;
}

export class ReportsService {
  private filePath: string;
  private reports: Map<string, IncidentReport> = new Map();

  constructor() {
    this.filePath = path.resolve(process.cwd(), 'data', 'reports.json');
    this.load();
  }

  private load(): void {
    try {
      if (!fs.existsSync(this.filePath)) {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf-8');
        return;
      }

      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const data = JSON.parse(raw) as IncidentReport[];
      for (const r of data) {
        this.reports.set(r.id, r);
      }
    } catch (err) {
      console.error('Error cargando data/reports.json:', err);
    }
  }

  private save(): void {
    try {
      const data = Array.from(this.reports.values());
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error guardando data/reports.json:', err);
    }
  }

  public createReport(data: {
    reporterId: string;
    reporterTag: string;
    accused: string;
    sessionTime: string;
    videoUrl: string;
    description: string;
  }): IncidentReport {
    const id = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
    const report: IncidentReport = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    };

    this.reports.set(id, report);
    this.save();
    return report;
  }

  public getReport(id: string): IncidentReport | undefined {
    return this.reports.get(id);
  }

  public resolveReport(
    id: string,
    status: 'PENALIZED' | 'DISMISSED',
    resolvedBy: string,
    resolutionReason: string
  ): IncidentReport | null {
    const report = this.reports.get(id);
    if (!report) return null;

    report.status = status;
    report.resolvedBy = resolvedBy;
    report.resolutionReason = resolutionReason;
    report.resolvedAt = new Date().toISOString();

    this.save();
    return report;
  }
}

export const reportsService = new ReportsService();
