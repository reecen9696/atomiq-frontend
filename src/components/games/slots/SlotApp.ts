import * as PIXI from "pixi.js";
import { Resource } from "./data/resources";
import { SlotLayer, SlotLayerCallbacks } from "./layers/SlotLayer";

/**
 * SlotApp wraps a PIXI.Application via composition (not inheritance)
 * to avoid PixiJS 7.4 plugin-injected property issues with TS class fields.
 */
export class SlotApp {
  private app: PIXI.Application;
  private ticker: PIXI.Ticker;

  private canvas_width = 0;
  private canvas_height = 0;

  layer_slot: SlotLayer | null = null;

  currency: any = null;
  betAmount = 0;
  betLines = 0;
  autoCount = 0;
  isAuth = false;

  started = false;

  private animationFn: (() => void) | null = null;
  private tweeningFn: (() => void) | null = null;
  private messageHandler:
    | ((message: { type: string; data?: any }) => void)
    | null = null;

  constructor(option: Partial<PIXI.IApplicationOptions>) {
    this.app = new PIXI.Application(option);
    this.ticker = PIXI.Ticker.shared;
  }

  /** Expose the canvas element for DOM insertion */
  get view(): HTMLCanvasElement {
    return this.app.view as HTMLCanvasElement;
  }

  setMessageHandler(handler: (message: { type: string; data?: any }) => void) {
    this.messageHandler = handler;
  }

  onResize(width: number, height: number) {
    if (this.canvas_width === width && this.canvas_height === height) return;

    this.canvas_width = width;
    this.canvas_height = height;

    if (this.layer_slot !== null) this.layer_slot.onResize(width, height);

    this.app.renderer.resize(width, height);
  }

  startGame() {
    this.layer_slot = new SlotLayer();
    this.app.stage.addChild(this.layer_slot);

    // Wire up callbacks so SlotLayer can communicate back
    const callbacks: SlotLayerCallbacks = {
      getCurrency: () => this.currency,
      getAutoCount: () => this.autoCount,
      setAutoCount: (count: number) => {
        this.autoCount = count;
      },
      updateLoading: (flag: boolean) => this.updateLoading(flag),
      updateGameState: () => this.updateGameState(),
      bet: () => this.bet(),
      postMessage: (message) => this.postMessage(message),
    };
    this.layer_slot.setCallbacks(callbacks);

    const keys: string[] = [];
    Resource.forEach((resource) => {
      PIXI.Assets.add(resource.key, resource.src);
      keys.push(resource.key);
    });

    PIXI.Assets.load(keys, (progress: number) => {
      console.log("Loading slot assets:", Math.round(progress * 100) + "%");
    })
      .then((textures: Record<string, PIXI.Texture>) => {
        console.log("Slot assets loaded successfully");
        this.started = true;

        if (this.layer_slot !== null) this.layer_slot.init(textures);

        this.animationFn = () => {
          if (this.layer_slot !== null) this.layer_slot.updateAnimation();
        };
        this.tweeningFn = () => {
          if (this.layer_slot !== null) this.layer_slot.updateTweening();
        };
        this.ticker.add(this.animationFn);
        this.ticker.add(this.tweeningFn);
      })
      .catch((error: Error) => {
        console.error("Failed to load slot assets:", error);
        // Create fallback textures
        const fallbackTextures: Record<string, PIXI.Texture> = {};
        Resource.forEach((resource) => {
          fallbackTextures[resource.key] = PIXI.Texture.WHITE;
        });

        this.started = true;
        if (this.layer_slot !== null) this.layer_slot.init(fallbackTextures);
      });
  }

  destroy(removeView?: boolean) {
    if (this.animationFn) this.ticker.remove(this.animationFn);
    if (this.tweeningFn) this.ticker.remove(this.tweeningFn);
    this.app.destroy(removeView);
  }

  bet() {
    if (!this.isAuth) return;

    if (this.autoCount < 0) {
      if (this.layer_slot !== null) this.layer_slot.running = false;
      return;
    }

    this.updateLoading(true);
    this.autoCount--;

    // Notify parent component to make the bet API call
    this.postMessage({ type: "playzelo-Slot-PlaceBet" });
  }

  showResult(roundData: number[][], rewardData: any[]) {
    if (this.layer_slot !== null) {
      this.layer_slot.showResult(roundData, rewardData);
    }
  }

  updateCurrency(currency: any) {
    this.currency = currency;
  }

  updateBetAmount(betAmount: number) {
    this.betAmount = betAmount;
  }

  updateBetLines(lines: number) {
    this.betLines = lines;
  }

  updateAutoCount(autoCount: number) {
    this.autoCount = autoCount;
  }

  updateAuth(isAuth: boolean) {
    this.isAuth = isAuth;
  }

  updateGameState() {
    this.postMessage({ type: "playzelo-Slot-UpdateGameState", data: "" });
  }

  updateLoading(flag: boolean) {
    this.postMessage({ type: "playzelo-Slot-UpdateLoading", data: flag });
  }

  postMessage(message: { type: string; data?: any }) {
    if (this.messageHandler) {
      this.messageHandler(message);
    }
  }
}
