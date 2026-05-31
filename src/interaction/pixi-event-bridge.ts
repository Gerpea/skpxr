// src/interaction/PixiEventBridge.ts
import * as PIXI from 'pixi.js-legacy';
import { TH } from '../utils';

export interface FederatedEventLike {
  type: string;
  target: PIXI.DisplayObject | null;
  currentTarget: PIXI.DisplayObject | null;
  global: PIXI.Point;
  nativeEvent: PointerEvent;
  stopped: boolean;
  defaultPrevented: boolean;
  data: any;
  stopPropagation(): void;
  preventDefault(): void;
  /** Matches Pixi's FederatedPointerEvent.getLocalPosition() */
  getLocalPosition(displayObject: PIXI.DisplayObject, point?: PIXI.Point): PIXI.Point;
}

export class PixiEventBridge {
  static createEvent(
    type: string,
    target: PIXI.DisplayObject | null,
    global: { x: number; y: number },
    native: PointerEvent
  ): FederatedEventLike {
    const event: FederatedEventLike = {
      type,
      target,
      currentTarget: target,
      global: new PIXI.Point(global.x, global.y),
      nativeEvent: native,
      stopped: false,
      defaultPrevented: false,
      data: null as any,
      stopPropagation() {
        this.stopped = true;
      },
      preventDefault() {
        this.defaultPrevented = true;
      },

      // ✅ Dynamically calculates local coordinates relative to ANY display object
      getLocalPosition(displayObject: PIXI.DisplayObject, point?: PIXI.Point): PIXI.Point {
        let matrix = TH.identity();
        let current: PIXI.DisplayObject | null = displayObject;
        const stack: Float32Array[] = [];

        // Walk up the tree to collect all local transforms
        while (current) {
          stack.push(TH.pixiToSkiaMatrix(current.transform));
          current = current.parent;
        }

        // Multiply from root down to build the full world matrix
        for (let i = stack.length - 1; i >= 0; i--) {
          matrix = TH.multiply(matrix, stack[i]);
        }

        // Inverse transform the global click coordinates
        const local = TH.inverseTransformPoint(matrix, global.x, global.y);
        const out = point || new PIXI.Point();
        out.set(local.x, local.y);
        return out;
      },
    };

    event.data = event; // Pixi expects event.data to reference itself
    return event;
  }

  static dispatch(
    type: string,
    target: PIXI.DisplayObject | null,
    global: { x: number; y: number },
    native: PointerEvent
  ): void {
    if (!target) return;

    const event = this.createEvent(type, target, global, native);

    let current: PIXI.DisplayObject | null = target;
    while (current && !event.stopped) {
      event.currentTarget = current;
      current.emit(type, event);
      current = current.parent;
    }
  }

  static isInteractive(obj: PIXI.DisplayObject): boolean {
    const mode = (obj as any).eventMode;
    const interactive = (obj as any).interactive;

    if (mode === 'none') return false;
    if (mode === 'static' || mode === 'dynamic') return true;
    if (interactive === true) return true;

    return false;
  }
}
