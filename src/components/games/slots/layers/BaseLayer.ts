import * as PIXI from "pixi.js";

export class BaseLayer extends PIXI.Container {
  GAME_WIDTH = 1061;
  GAME_HEIGHT = 726;

  init(_resource: Record<string, PIXI.Texture>) {
    this.sortableChildren = true;
  }

  onResize(_width: number, _height: number) {
    // Override in subclasses
  }

  createSprite(
    texture: PIXI.Texture,
    x: number,
    y: number,
    anchorX = 0,
    anchorY = 0,
    scale = 1.0,
    userData: Record<string, string> | null = null,
  ): PIXI.Sprite {
    const sprite = PIXI.Sprite.from(texture);
    sprite.setTransform(x, y);
    sprite.anchor.set(anchorX, anchorY);
    sprite.scale.set(scale);
    (sprite as any).userData = userData;
    return sprite;
  }

  createText(
    str: string,
    style: PIXI.TextStyle | Partial<PIXI.ITextStyle>,
    x: number,
    y: number,
    anchorX = 0,
    anchorY = 0,
    alpha = 1,
    userData: Record<string, string> | null = null,
  ): PIXI.Text {
    const text = new PIXI.Text(str, style);
    text.setTransform(x, y);
    text.anchor.set(anchorX, anchorY);
    text.alpha = alpha;
    (text as any).userData = userData;
    text.resolution = 2;
    return text;
  }
}
