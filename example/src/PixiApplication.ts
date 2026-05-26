import * as PIXI from 'pixi.js-legacy';

export class PixiApplication {
  public readonly app: PIXI.Application;
  public readonly canvas: HTMLCanvasElement;

  constructor(container: HTMLElement, width = 800, height = 600) {
    this.app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x1099bb,
      forceCanvas: true,          
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true
    });

    this.canvas = this.app.view as HTMLCanvasElement;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    
    container.appendChild(this.canvas);
  }

  get stage(): PIXI.Container {
    return this.app.stage;
  }

  get ticker(): PIXI.Ticker {
    return this.app.ticker;
  }

  public resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
  }

  public destroy(): void {
    this.app.destroy(true, { children: true, texture: true, baseTexture: true });
    this.canvas.remove();
  }
}