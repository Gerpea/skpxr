import * as PIXI from 'pixi.js-legacy';
export type { SkiaMapper } from './skia-mapper';
export { ContainerMapper } from './container-mapper';
export { GraphicsMapper } from './graphics-mapper';
export { SpriteMapper } from './sprite-mapper';

import type { SkiaMapper } from './skia-mapper';

export class MapperRegistry {
  private mappers: { instance: SkiaMapper; priority: number }[] = [];

  register(mapper: SkiaMapper): void {
    this.mappers.push({ instance: mapper, priority: mapper.priority });
    this.mappers.sort((a, b) => b.priority - a.priority);
  }

  getMapper(obj: PIXI.DisplayObject): SkiaMapper | null {
    return this.mappers.find(m => m.instance.canHandle(obj))?.instance ?? null;
  }
}