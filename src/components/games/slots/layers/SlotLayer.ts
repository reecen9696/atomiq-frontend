import * as PIXI from "pixi.js";
import { BaseLayer } from "./BaseLayer";
import { PATTERN_RULE } from "../data/constants";

// Tween definition
interface Tween {
  object: any;
  property: string;
  propertyBeginValue: number;
  target: number;
  easing: (t: number) => number;
  time: number;
  change: ((t: Tween) => void) | null;
  complete: ((t: Tween) => void) | null;
  start: number;
}

// Reel definition
interface Reel {
  container: PIXI.Container;
  symbols: PIXI.Sprite[];
  position: number;
  prevPosition: number;
  blur: PIXI.BlurFilter;
}

// Callback interface to communicate with parent SlotApp — replaces gameApp global
export interface SlotLayerCallbacks {
  getCurrency: () => any;
  getAutoCount: () => number;
  setAutoCount: (count: number) => void;
  updateLoading: (flag: boolean) => void;
  updateGameState: () => void;
  bet: () => void;
  postMessage: (message: { type: string; data?: string }) => void;
}

export class SlotLayer extends BaseLayer {
  REEL_COUNT = 5;
  REEL_WIDTH = 134.0;
  REEL_HEIGHT = 444.0;
  REEL_OFFSET_X = 143.0;
  REEL_OFFSET_Y = 148.0;

  SYMBOL_COUNT = 11;
  SYMBOL_WIDTH = 112.0;
  SYMBOL_HEIGHT = 118.0;

  MOVE_SYMBOLS = 30;

  slot_textures: PIXI.Texture[] = [];
  coin_textures: PIXI.Texture[] = [];

  spr_platform: PIXI.Sprite | null = null;
  spr_logo: PIXI.Sprite | null = null;
  graphic_line: PIXI.Graphics | null = null;
  container_total: PIXI.Container | null = null;
  container_rule: PIXI.Container | null = null;
  container_result: PIXI.Container | null = null;
  container_freespin: PIXI.Container | null = null;
  container_reel: PIXI.Container | null = null;

  reels: Reel[] = [];
  targets: number[] = [0, 0, 0, 0, 0];
  tweening: Tween[] = [];
  results: number[][] | null = null;
  rewards: any[] | null = null;

  running = false;
  freespin_mode = false;
  freespin_count = 0;

  reward_index = 0;
  total_payout = 0;
  round_payout = 0;

  callbacks: SlotLayerCallbacks | null = null;

  setCallbacks(callbacks: SlotLayerCallbacks) {
    this.callbacks = callbacks;
  }

  init(resource: Record<string, PIXI.Texture>) {
    super.init(resource);

    this.coin_textures = [
      resource.coin_bnb || PIXI.Texture.WHITE,
      resource.coin_btc || PIXI.Texture.WHITE,
      resource.coin_eth || PIXI.Texture.WHITE,
      resource.coin_trx || PIXI.Texture.WHITE,
      resource.coin_usdt || PIXI.Texture.WHITE,
      resource.coin_zelo || PIXI.Texture.WHITE,
    ];

    this.spr_platform = this.addChild(
      this.createSprite(
        resource.platform || PIXI.Texture.WHITE,
        this.GAME_WIDTH / 2,
        this.GAME_HEIGHT / 2 + 31.0,
        0.5,
        0.5,
      ),
    );
    this.spr_logo = this.addChild(
      this.createSprite(
        resource.logo || PIXI.Texture.WHITE,
        this.GAME_WIDTH / 2,
        this.GAME_HEIGHT / 2 - 275.5,
        0.5,
        0.5,
      ),
    );

    this.createSlot(resource);
    this.createGraphic();
    this.createTotalPayout(resource);
    this.createRulePayout(resource);
    this.createResult(resource);
    this.createFreeSpin(resource);
    this.updateMask();
  }

  onResize(width: number, height: number) {
    const scale_y = height / this.GAME_HEIGHT;
    const scale = scale_y;

    this.scale.set(scale);
    this.x = (width - this.GAME_WIDTH * scale) / 2;
    this.y = (height - this.GAME_HEIGHT * scale) / 2;

    this.updateMask();
  }

  updateTweening() {
    const now = Date.now();
    const remove: Tween[] = [];

    for (let i = 0; i < this.tweening.length; i++) {
      const t = this.tweening[i];
      const phase = Math.min(1, (now - t.start) / t.time);
      t.object[t.property] = this.lerp(
        t.propertyBeginValue,
        t.target,
        t.easing(phase),
      );

      if (t.change) t.change(t);

      if (phase === 1) {
        t.object[t.property] = t.target;
        if (t.complete) t.complete(t);
        remove.push(t);
      }
    }

    for (let i = 0; i < remove.length; i++) {
      this.tweening.splice(this.tweening.indexOf(remove[i]), 1);
    }
  }

  updateAnimation() {
    for (let i = 0; i < this.reels.length; i++) {
      const r = this.reels[i];
      r.blur.blurY = (r.position - r.prevPosition) * 30;
      r.prevPosition = r.position;

      for (let j = 0; j < r.symbols.length; j++) {
        const s = r.symbols[j];
        const prevy = s.y;
        s.y =
          (((r.position + j) % r.symbols.length) - 0.5) * this.REEL_OFFSET_Y;
        if (s.y < 0 && prevy > this.REEL_OFFSET_Y) {
          if (
            Math.floor(r.position) >= this.targets[i] - 3 &&
            Math.floor(r.position) < this.targets[i]
          ) {
            const result = this.getResult();
            if (result) {
              const symbol_index =
                result[this.targets[i] - Math.floor(r.position) - 1][i];
              s.texture = this.slot_textures[symbol_index];
            }
          } else {
            if (this.freespin_mode) {
              s.texture =
                this.slot_textures[
                  Math.floor(Math.random() * (this.slot_textures.length - 1))
                ];
            } else {
              s.texture =
                this.slot_textures[
                  Math.floor(Math.random() * this.slot_textures.length)
                ];
            }
          }

          s.x = this.REEL_WIDTH / 2;
          s.anchor.set(0.5, 0.5);
        }
      }
    }
  }

  createSlot(resource: Record<string, PIXI.Texture>) {
    this.slot_textures = [
      resource.slot_1 || PIXI.Texture.WHITE,
      resource.slot_2 || PIXI.Texture.WHITE,
      resource.slot_3 || PIXI.Texture.WHITE,
      resource.slot_4 || PIXI.Texture.WHITE,
      resource.slot_5 || PIXI.Texture.WHITE,
      resource.slot_6 || PIXI.Texture.WHITE,
      resource.slot_7 || PIXI.Texture.WHITE,
      resource.slot_8 || PIXI.Texture.WHITE,
      resource.slot_9 || PIXI.Texture.WHITE,
      resource.slot_wild || PIXI.Texture.WHITE,
      resource.slot_scatter || PIXI.Texture.WHITE,
    ];

    this.container_reel = new PIXI.Container();

    for (let i = 0; i < this.REEL_COUNT; i++) {
      const rc = new PIXI.Container();
      rc.x = this.GAME_WIDTH / 2 - 351.5 + i * this.REEL_OFFSET_X;
      rc.y = this.GAME_HEIGHT / 2 - 163.0;
      this.container_reel.addChild(rc);

      const reel: Reel = {
        container: rc,
        symbols: [],
        position: 0,
        prevPosition: 0,
        blur: new PIXI.BlurFilter(),
      };
      reel.blur.blurX = 0;
      reel.blur.blurY = 0;
      rc.filters = [reel.blur];

      for (let j = 0; j < 4; j++) {
        const symbol = this.createSprite(
          this.slot_textures[
            Math.floor(Math.random() * this.slot_textures.length)
          ],
          this.REEL_WIDTH / 2,
          (j - 0.5) * this.REEL_OFFSET_Y,
          0.5,
          0.5,
          0.5,
        );
        reel.symbols.push(symbol);
        rc.addChild(symbol);
      }
      this.reels.push(reel);
    }

    this.addChild(this.container_reel);
  }

  createGraphic() {
    this.graphic_line = new PIXI.Graphics();
    this.addChild(this.graphic_line);
  }

  createTotalPayout(resource: Record<string, PIXI.Texture>) {
    this.container_total = new PIXI.Container();
    this.container_total.setTransform(
      this.GAME_WIDTH / 2 - 159.0,
      this.GAME_HEIGHT / 2 - 183.0 - 21.0,
    );

    this.container_total.addChild(
      this.createSprite(resource.bg_total, 0, 0, 0.0, 0.0, 1.0, { tag: "bg" }),
    );

    const style = new PIXI.TextStyle({
      fontFamily: "Styrene A Web",
      fontStyle: "normal",
      fontWeight: "700",
      fontSize: 14,
      fill: 0xffffff,
      lineHeight: 18,
      align: "center",
    });
    this.container_total.addChild(
      this.createText(
        "TOTAL PAYOUT 0.00000000",
        style,
        143.0,
        21.0,
        0.5,
        0.5,
        1.0,
        { tag: "text" },
      ),
    );
    this.container_total.addChild(
      this.createSprite(this.currencyTexture(), 271.0, 21.0, 0.5, 0.5, 1.0, {
        tag: "coin",
      }),
    );
    this.addChild(this.container_total);
  }

  createRulePayout(resource: Record<string, PIXI.Texture>) {
    this.container_rule = new PIXI.Container();
    this.container_rule.setTransform(
      this.GAME_WIDTH / 2 - 120.5,
      this.GAME_HEIGHT / 2 + 250.0 - 24.5,
    );

    this.container_rule.addChild(
      this.createSprite(resource.bg_rule, 0, 0, 0.0, 0.0, 1.0, { tag: "bg" }),
    );

    const style = new PIXI.TextStyle({
      fontFamily: "Styrene A Web",
      fontStyle: "normal",
      fontWeight: "700",
      fontSize: 18,
      fill: 0xffffff,
      lineHeight: 23,
      align: "center",
    });
    this.container_rule.addChild(
      this.createText("0.00000000", style, 105.0, 24.5, 0.5, 0.5, 1.0, {
        tag: "text",
      }),
    );
    this.container_rule.addChild(
      this.createSprite(this.currencyTexture(), 184.0, 24.5, 0.5, 0.5, 1.0, {
        tag: "coin",
      }),
    );
    this.container_rule.visible = false;
    this.addChild(this.container_rule);
  }

  createResult(resource: Record<string, PIXI.Texture>) {
    this.container_result = new PIXI.Container();
    this.container_result.setTransform(
      this.GAME_WIDTH / 2 - 120.5,
      this.GAME_HEIGHT / 2 + 57.0 - 87.0,
    );

    this.container_result.addChild(
      this.createSprite(resource.bg_result, 0, 0, 0.0, 0.0, 1.0, {
        tag: "bg",
      }),
    );

    const style = new PIXI.TextStyle({
      fontFamily: "Styrene A Web",
      fontStyle: "normal",
      fontWeight: "800",
      fontSize: 36,
      fill: 0xffffff,
      lineHeight: 44,
      align: "center",
    });
    this.container_result.addChild(
      this.createText("0.06X", style, 120.5, 60.0, 0.5, 0.5, 1.0, {
        tag: "multiplier",
      }),
    );

    const style1 = new PIXI.TextStyle({
      fontFamily: "Styrene A Web",
      fontStyle: "normal",
      fontWeight: "700",
      fontSize: 18,
      fill: 0xffffff,
      lineHeight: 23,
      align: "center",
    });
    this.container_result.addChild(
      this.createText("0.00000000", style1, 105.0, 120.0, 0.5, 0.5, 1.0, {
        tag: "payout",
      }),
    );
    this.container_result.addChild(
      this.createSprite(this.currencyTexture(), 184.0, 120.0, 0.5, 0.5, 1.0, {
        tag: "coin",
      }),
    );
    this.container_result.visible = false;
    this.addChild(this.container_result);
  }

  createFreeSpin(resource: Record<string, PIXI.Texture>) {
    this.container_freespin = new PIXI.Container();
    this.container_freespin.setTransform(
      this.GAME_WIDTH / 2 - 183.5,
      this.GAME_HEIGHT / 2 + 57.0 - 72.5,
    );

    this.container_freespin.addChild(
      this.createSprite(resource.free_spin, 0, 0, 0.0, 0.0, 1.0, {
        tag: "bg",
      }),
    );

    const style = new PIXI.TextStyle({
      fontFamily: "Styrene A Web",
      fontStyle: "normal",
      fontWeight: "700",
      fontSize: 24,
      fill: 0xffffff,
      lineHeight: 44,
      align: "center",
    });
    this.container_freespin.addChild(
      this.createText("5 FREE SPINS", style, 183.5, 43.0, 0.5, 0.5, 1.0, {
        tag: "multiplier",
      }),
    );
    this.container_freespin.visible = false;
    this.addChild(this.container_freespin);
  }

  updateMask() {
    if (this.container_reel === null) return;

    const mask = new PIXI.Graphics();
    mask.beginFill(0x000000);
    mask.drawRect(
      this.x + 179.0 * this.scale.x,
      this.y + 203.0 * this.scale.y,
      706.0 * this.scale.x,
      440.0 * this.scale.y,
    );
    this.container_reel.mask = mask;
    mask.endFill();
  }

  drawLine(pattern: number) {
    if (!this.graphic_line) return;
    this.graphic_line.clear();
    this.graphic_line.lineStyle(3, 0xffffff, 1);
    for (let index = 0; index < PATTERN_RULE[pattern].length; index++) {
      const px =
        this.GAME_WIDTH / 2 -
        351.5 +
        PATTERN_RULE[pattern][index][1] * this.REEL_OFFSET_X +
        this.REEL_WIDTH / 2;
      const py =
        this.GAME_HEIGHT / 2 -
        163.0 +
        (PATTERN_RULE[pattern][index][0] + 0.5) * this.REEL_OFFSET_Y;

      if (index === 0) {
        this.graphic_line.moveTo(px, py);
      } else {
        this.graphic_line.lineTo(px, py);
      }
    }
  }

  drawLines() {
    if (!this.graphic_line || !this.rewards) return;
    this.graphic_line.clear();
    this.graphic_line.lineStyle(3, 0xffffff, 1);
    for (let i = 0; i < this.rewards.length; i++) {
      const pattern = this.rewards[i][2];

      for (let index = 0; index < PATTERN_RULE[pattern].length; index++) {
        const px =
          this.GAME_WIDTH / 2 -
          351.5 +
          PATTERN_RULE[pattern][index][1] * this.REEL_OFFSET_X +
          this.REEL_WIDTH / 2;
        const py =
          this.GAME_HEIGHT / 2 -
          163.0 +
          (PATTERN_RULE[pattern][index][0] + 0.5) * this.REEL_OFFSET_Y;

        if (index === 0) {
          this.graphic_line.moveTo(px, py);
        } else {
          this.graphic_line.lineTo(px, py);
        }
      }
    }
  }

  clearLine() {
    if (this.graphic_line) this.graphic_line.clear();
  }

  tweenTo(
    object: any,
    property: string,
    target: number,
    time: number,
    easing: (t: number) => number,
    onChange: ((t: Tween) => void) | null,
    onComplete: ((t: Tween) => void) | null,
  ): Tween {
    const tween: Tween = {
      object,
      property,
      propertyBeginValue: object[property],
      target,
      easing,
      time,
      change: onChange,
      complete: onComplete,
      start: Date.now(),
    };

    this.tweening.push(tween);
    return tween;
  }

  backout(amount: number): (t: number) => number {
    return (t: number) => --t * t * ((amount + 1) * t + amount) + 1;
  }

  lerp(a1: number, a2: number, t: number): number {
    return a1 * (1 - t) + a2 * t;
  }

  currencyTexture(): PIXI.Texture {
    const currency = this.callbacks?.getCurrency();

    if (!currency || !currency.coinType || !this.coin_textures) {
      return this.coin_textures?.[4] || PIXI.Texture.WHITE;
    }

    switch (currency.coinType) {
      case "BNB":
        return this.coin_textures[0] || PIXI.Texture.WHITE;
      case "BTC":
        return this.coin_textures[1] || PIXI.Texture.WHITE;
      case "ETH":
        return this.coin_textures[2] || PIXI.Texture.WHITE;
      case "TRX":
        return this.coin_textures[3] || PIXI.Texture.WHITE;
      case "USDT":
        return this.coin_textures[4] || PIXI.Texture.WHITE;
      case "ZELO":
        return this.coin_textures[5] || PIXI.Texture.WHITE;
      default:
        return this.coin_textures[4] || PIXI.Texture.WHITE;
    }
  }

  getResult(): number[][] | null {
    if (this.freespin_mode && this.rewards) {
      return (
        this.rewards[0][3][this.freespin_count - 1]?.freeFairResult ?? null
      );
    }
    return this.results;
  }

  getRewards(): any[] {
    if (this.freespin_mode && this.rewards) {
      return this.rewards[0][3][this.freespin_count - 1]?.freeRewardData ?? [];
    }
    return this.rewards ?? [];
  }

  showResult(results: number[][], rewards: any[]) {
    this.results = results;
    this.rewards = rewards;

    this.startPlay();
    this.callbacks?.postMessage({ type: "playzelo-Slot-Sound", data: "reel" });
  }

  startPlay() {
    this.running = true;

    this.clearLine();
    this.showRoundPayout(false);

    for (let i = 0; i < this.reels.length; i++) {
      const r = this.reels[i];
      this.targets[i] = r.position + this.MOVE_SYMBOLS + i * 5;
      const time = 1200 + i * 200;
      this.tweenTo(
        r,
        "position",
        this.targets[i],
        time,
        this.backout(0.4),
        null,
        i === this.reels.length - 1 ? this.reelsComplete : null,
      );
    }
  }

  reelsComplete(this: Tween) {
    const self: SlotLayer = (this.object as any).container.parent
      .parent as SlotLayer;
    const rewards = self.getRewards();

    if (rewards.length === 0) {
      if (self.freespin_mode) self.startFreeSpin();

      if (!self.freespin_mode) {
        const autoCount = self.callbacks?.getAutoCount() ?? -1;
        if (autoCount < 0) {
          if (self.round_payout > 0) {
            self.showRoundPayout(true);
            self.callbacks?.postMessage({
              type: "playzelo-Slot-Sound",
              data: "win",
            });
          }
          self.callbacks?.updateLoading(false);
          self.round_payout = 0;
        }

        self.callbacks?.updateGameState();
        self.callbacks?.bet();
      }
    } else {
      self.reward_index = 0;
      if (!self.freespin_mode && self.isFreeSpin()) {
        self.showFreespin();
        self.freespin_mode = true;
      } else {
        self.showReward();
      }
    }
  }

  showReward() {
    const rewards = this.getRewards();

    this.total_payout += rewards[this.reward_index][0];
    this.round_payout += rewards[this.reward_index][0];

    this.drawLine(rewards[this.reward_index][2]);
    this.showRule(true);
    this.showRulePayout(true);
    this.showTotalPayout();

    this.callbacks?.postMessage({
      type: "playzelo-Slot-Sound",
      data: "match",
    });

    setTimeout(() => {
      this.reward_index++;
      if (this.reward_index >= rewards.length) {
        this.showRule(false);
        this.showRulePayout(false);
        if (this.freespin_mode) this.startFreeSpin();

        if (!this.freespin_mode) {
          const autoCount = this.callbacks?.getAutoCount() ?? -1;
          if (autoCount < 0) {
            this.drawLines();
            this.showRoundPayout(true);
            this.callbacks?.postMessage({
              type: "playzelo-Slot-Sound",
              data: "win",
            });
            this.callbacks?.updateLoading(false);
            this.round_payout = 0;
          }
          this.callbacks?.updateGameState();
          this.callbacks?.bet();
        }
      } else {
        this.showReward();
      }
    }, 1500);
  }

  showRule(bShow: boolean) {
    const alpha = bShow ? 0.5 : 1.0;

    for (let i = 0; i < this.reels.length; i++) {
      const r = this.reels[i];
      for (let j = 0; j < r.symbols.length; j++) {
        r.symbols[j].alpha = alpha;
      }
    }

    if (!bShow) return;

    const reward = this.getRewards()[this.reward_index][1];
    for (let i = 0; i < reward.length; i++) {
      const reel_index = reward[i][0];
      const symbol_index = reward[i][1];

      for (let j = 0; j < this.reels[reel_index].symbols.length; j++) {
        const symbol = this.reels[reel_index].symbols[j];
        if (
          Math.floor(symbol.y) ===
          (symbol_index + 0.5) * this.REEL_OFFSET_Y
        ) {
          symbol.alpha = 1.0;
        }
      }
    }
  }

  showRulePayout(visible: boolean) {
    if (!this.container_rule) return;
    this.container_rule.visible = visible;

    if (!visible) return;

    const rewards = this.getRewards();
    this.container_rule.y =
      this.GAME_HEIGHT / 2 -
      163.0 +
      (PATTERN_RULE[rewards[this.reward_index][2]][2][0] + 0.5) *
        this.REEL_OFFSET_Y -
      24.5;

    const text_value = rewards[this.reward_index][0].toFixed(8);
    this.container_rule.children.forEach((element: any) => {
      if (element.userData !== null && element.userData.tag === "text") {
        element.text = text_value;
      }
    });
  }

  showRoundPayout(visible: boolean) {
    if (!this.container_result) return;
    this.container_result.visible = visible;

    if (!visible) return;

    const text_multiplier = this.round_payout.toFixed(2) + "X";
    const text_value = this.round_payout.toFixed(8);
    this.container_result.children.forEach((element: any) => {
      if (element.userData !== null) {
        if (element.userData.tag === "multiplier") {
          element.text = text_multiplier;
        } else if (element.userData.tag === "payout") {
          element.text = text_value;
        }
      }
    });
  }

  showTotalPayout() {
    if (!this.container_total) return;
    const text_total = "TOTAL PAYOUT " + this.total_payout.toFixed(8);
    this.container_total.children.forEach((element: any) => {
      if (element.userData !== null && element.userData.tag === "text") {
        element.text = text_total;
      }
    });
  }

  isFreeSpin(): boolean {
    return this.rewards?.[0]?.[0] === "freespin";
  }

  showFreespin() {
    if (!this.rewards) return;
    this.drawLine(this.rewards[0][2]);
    this.showRule(true);
    if (this.container_freespin) {
      this.container_freespin.visible = true;
    }

    setTimeout(() => {
      this.freespin_count = 0;
      this.hideFreespin();
      this.showRule(false);
      this.startFreeSpin();
    }, 2000);
  }

  hideFreespin() {
    if (this.container_freespin) {
      this.container_freespin.visible = false;
    }
  }

  startFreeSpin() {
    this.freespin_count++;
    if (!this.rewards || this.freespin_count > this.rewards[0][3].length) {
      this.freespin_count = 0;
      this.freespin_mode = false;
      return;
    }

    this.startPlay();
  }
}
