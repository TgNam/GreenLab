export interface ILogService {
  getLogs(targetId: string): Promise<any[]>;
  getActionTypes(): Promise<any>;
  getDetailChanges(logId: string): Promise<any>;
}








