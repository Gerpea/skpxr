// src/utils/blend-modes.ts
import * as PIXI from 'pixi.js-legacy';
import type { CanvasKit } from 'canvaskit-wasm';

export function mapBlendMode(pixiMode: number, ck: CanvasKit): any {
  switch (pixiMode) {
    case PIXI.BLEND_MODES.NORMAL: return ck.BlendMode.SrcOver;
    case PIXI.BLEND_MODES.ADD: return ck.BlendMode.Plus;
    case PIXI.BLEND_MODES.MULTIPLY: return ck.BlendMode.Multiply;
    case PIXI.BLEND_MODES.SCREEN: return ck.BlendMode.Screen;
    case PIXI.BLEND_MODES.OVERLAY: return ck.BlendMode.Overlay;
    case PIXI.BLEND_MODES.DARKEN: return ck.BlendMode.Darken;
    case PIXI.BLEND_MODES.LIGHTEN: return ck.BlendMode.Lighten;
    case PIXI.BLEND_MODES.COLOR_DODGE: return ck.BlendMode.ColorDodge;
    case PIXI.BLEND_MODES.COLOR_BURN: return ck.BlendMode.ColorBurn;
    case PIXI.BLEND_MODES.HARD_LIGHT: return ck.BlendMode.HardLight;
    case PIXI.BLEND_MODES.SOFT_LIGHT: return ck.BlendMode.SoftLight;
    case PIXI.BLEND_MODES.DIFFERENCE: return ck.BlendMode.Difference;
    case PIXI.BLEND_MODES.EXCLUSION: return ck.BlendMode.Exclusion;
    case PIXI.BLEND_MODES.HUE: return ck.BlendMode.Hue;
    case PIXI.BLEND_MODES.SATURATION: return ck.BlendMode.Saturation;
    case PIXI.BLEND_MODES.COLOR: return ck.BlendMode.Color;
    case PIXI.BLEND_MODES.LUMINOSITY: return ck.BlendMode.Luminosity;
    case PIXI.BLEND_MODES.SRC_IN: return ck.BlendMode.SrcIn;
    case PIXI.BLEND_MODES.SRC_OUT: return ck.BlendMode.SrcOut;
    case PIXI.BLEND_MODES.SRC_ATOP: return ck.BlendMode.SrcATop;
    case PIXI.BLEND_MODES.DST_OVER: return ck.BlendMode.DstOver;
    case PIXI.BLEND_MODES.DST_IN: return ck.BlendMode.DstIn;
    case PIXI.BLEND_MODES.DST_OUT: return ck.BlendMode.DstOut;
    case PIXI.BLEND_MODES.DST_ATOP: return ck.BlendMode.DstATop;
    case PIXI.BLEND_MODES.XOR: return ck.BlendMode.Xor;
    case PIXI.BLEND_MODES.ERASE: return ck.BlendMode.DstOut; // Approximation for Erase
    default: return ck.BlendMode.SrcOver;
  }
}