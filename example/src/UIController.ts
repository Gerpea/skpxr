export class UIController {
  private generateBtn: HTMLButtonElement;
  private spriteBtn: HTMLButtonElement; // 🆕
  private exportBtn: HTMLButtonElement;
  private statusEl: HTMLElement;

  constructor() {
    this.generateBtn = document.getElementById('btn-generate') as HTMLButtonElement;
    this.spriteBtn = document.getElementById('btn-sprite') as HTMLButtonElement; // 🆕
    this.exportBtn = document.getElementById('btn-export') as HTMLButtonElement;
    this.statusEl = document.getElementById('status') as HTMLElement;
    this.validateElements();
  }

  private validateElements(): void {
    if (!this.generateBtn || !this.spriteBtn || !this.exportBtn || !this.statusEl) { // 🆕
      throw new Error('UI elements not found. Ensure index.html matches expected IDs.');
    }
  }

  public enableControls(): void {
    this.generateBtn.disabled = false;
    this.spriteBtn.disabled = false; // 🆕
    this.exportBtn.disabled = false;
  }

  public onGenerate(callback: () => void): void {
    this.generateBtn.addEventListener('click', callback);
  }

  // 🆕 New handler
  public onAddSprite(callback: () => void): void {
    this.spriteBtn.addEventListener('click', callback);
  }

  public onExport(callback: () => Promise<void>): void {
    this.exportBtn.addEventListener('click', async () => {
      this.exportBtn.disabled = true;
      this.updateStatus('⏳ Exporting...');
      try {
        await callback();
        this.updateStatus('✅ Export complete', 'success');
      } catch (err) {
        console.error('Export failed:', err);
        this.updateStatus('❌ Export failed', 'error');
      } finally {
        this.exportBtn.disabled = false;
      }
    });
  }

  public updateStatus(message: string, type: 'default' | 'success' | 'error' = 'default'): void {
    this.statusEl.textContent = message;
    this.statusEl.className = `status ${type}`;
  }
}