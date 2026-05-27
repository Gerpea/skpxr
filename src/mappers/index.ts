import * as PIXI from 'pixi.js-legacy';
import type { SkiaMapper } from './SkiaMapper';

export type { SkiaMapper } from './SkiaMapper';
export { ContainerMapper } from './ContainerMapper';
export { GraphicsMapper } from './GraphicsMapper';
export { SpriteMapper } from './SpriteMapper';

export class MapperRegistry {
  private mappers: Array<{ instance: SkiaMapper; priority: number }> = [];

  register(mapper: SkiaMapper): void {
    this.mappers.push({ instance: mapper, priority: mapper.priority });
    this.mappers.sort((a, b) => b.priority - a.priority);
  }

  getMapper(obj: PIXI.DisplayObject): SkiaMapper | null {
    const found = this.mappers.find(m => m.instance.canHandle(obj));
    return found?.instance ?? null;
  }

  getAll(): SkiaMapper[] {
    return this.mappers.map(m => m.instance);
  }
}