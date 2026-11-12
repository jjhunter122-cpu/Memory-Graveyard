import { Actor, CollisionType, Color, Sprite, type Scene, type ImageSource } from 'excalibur';
import type { SceneryLayer, SceneryPreset } from '../scenery';

export interface SceneryTextures {
  scenery: Map<string, ImageSource>;
}

/**
 * Paints one scenery preset as a set of world-space actors. Layers are scaled
 * to a fraction of the level height and repeated horizontally, which is enough
 * to cover a long run of acts.
 */
export function addSceneryPreset(
  scene: Scene,
  preset: SceneryPreset,
  textures: SceneryTextures,
  widthPx: number,
  heightPx: number,
  zBase: number,
  opacityScale = 1,
): Actor[] {
  const actors: Actor[] = [];
  for (const layer of preset.layers) {
    const texture = textures.scenery.get(layer.image);
    if (!texture) {
      continue;
    }
    actors.push(
      ...addSceneryLayer(scene, layer, texture, widthPx, heightPx, zBase, opacityScale),
    );
  }
  return actors;
}

function addSceneryLayer(
  scene: Scene,
  layer: SceneryLayer,
  texture: ImageSource,
  widthPx: number,
  heightPx: number,
  zBase: number,
  opacityScale: number,
): Actor[] {
  const height = Math.max(1, Math.round(heightPx * (layer.height ?? 1)));
  const width = Math.max(1, Math.round((texture.width / texture.height) * height));
  const repeat = layer.repeat !== false;
  const count = repeat ? Math.max(1, Math.ceil(widthPx / width)) : 1;
  const stripWidth = count * width;
  const startX = (widthPx - stripWidth) / 2;
  const anchor = layer.anchor ?? 'center';
  const centerY =
    (anchor === 'top' ? height / 2 : anchor === 'bottom' ? heightPx - height / 2 : heightPx / 2) +
    (layer.offsetY ?? 0);

  const opacity = clamp((layer.opacity ?? 1) * opacityScale, 0, 1);
  const tint = Color.fromHex(layer.tint ?? '#ffffff');
  const actors: Actor[] = [];

  for (let index = 0; index < count; index += 1) {
    const actor = new Actor({
      x: startX + index * width + width / 2,
      y: centerY,
      width,
      height,
      collisionType: CollisionType.PreventCollision,
      z: zBase,
    });
    actor.graphics.use(
      new Sprite({
        image: texture,
        destSize: { width, height },
        tint,
        opacity,
      }),
    );
    scene.add(actor);
    actors.push(actor);
  }

  return actors;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
