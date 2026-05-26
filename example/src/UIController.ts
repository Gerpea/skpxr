export class UIController {
  private generateBtn: HTMLButtonElement;
  private exportBtn: HTMLButtonElement;
  private statusEl: HTMLElement;

  constructor() {
    this.generateBtn = document.getElementById('btn-generate') as HTMLButtonElement;
    this.exportBtn = document.getElementById('btn-export') as HTMLButtonElement;
    this.statusEl = document.getElementById('status') as HTMLElement;
    
    this.validateElements();
  }

  private validateElements(): void {
    if (!this.generateBtn || !this.exportBtn || !this.statusEl) {
      throw new Error('UI elements not found. Ensure index.html matches expected IDs.');
    }
  }

  public enableControls(): void {
    this.generateBtn.disabled = false;
    this.exportBtn.disabled = false;
  }

  public onGenerate(callback: () => void): void {
    this.generateBtn.addEventListener('click', callback);
  }

  public onExport(callback: () => Promise<void>): void {
    this.exportBtn.addEventListener('click', async () => {
      this.exportBtn.disabled = true;
      this.updateStatus('⏳ Exporting...');
      try {
        await callback();
        this.updateStatus('✅ Export complete');
      } catch (err) {
        console.error('Export failed:', err);
        this.updateStatus('❌ Export failed');
      } finally {
        this.exportBtn.disabled = false;
      }
    });
  }

  public updateStatus(message: string): void {
    this.statusEl.textContent = message;
  }
}