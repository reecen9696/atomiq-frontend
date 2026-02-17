"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import Sketch from "react-p5";
import Matter from "matter-js";
import clsx from "clsx";
import axios from "axios";
import useSound from "use-sound";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthStore } from "@/stores/auth-store";
import { useAtomikAllowance } from "@/components/providers/sdk-provider";
import { useAllowanceForCasino } from "@/lib/sdk/hooks";
// Configuration - using blockchain API  
const Config = {
  Root: {
    blockchainApiUrl:
      process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL || "http://localhost:8080",
  },
};
import Queue from "./utils/Queue";
import "./plinko.css";
import {
  canvasWidth,
  canvasHeight,
  wallWidth,
  ROWS,
  plinkoDistanceX,
  plinkoDistanceY,
  plinkoRadius,
  wallMultipleIndex,
  particleColor,
  payoutDefaultValue,
  pascalTriangleResult,
  payoutResult,
} from "./payout-data";

const useStyles = makeStyles(() => ({
  MainContainer: {
    width: "100%",
    paddingRight: 54,
    "@media (max-width: 940px)": {
      padding: 0,
    },
  },
  GamePanel: {
    width: "100%",
    height: 550,
    borderRadius: 30,
    position: "relative",
    "@media (max-width: 940px)": {
      borderRadius: "0px",
    },
    "@media (max-width: 1362px)": {
      height: "auto",
    },
  },
  HistoryTable: {
    marginTop: "24px",
  },
  GameMainBox: {
    display: "flex",
    alignItems: "start",
    justifyContent: "flex-start",
    gap: 22,
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: "calc(100% - 113px)",
    "@media (max-width: 1560px)": {
      width: "calc(100% - 20px)",
    },
    "@media (max-width: 1362px)": {
      flexDirection: "column-reverse",
      top: 0,
      left: 0,
      width: "100%",
      transform: "translate(0)",
      position: "relative",
    },
  },
  GameControlPanel: {
    background: "transparent",
    width: 401,
    padding: "21px 14px 24px 11px",
    backgroundSize: "100% 100%",
    flex: "none",
    marginTop: 80,
    "@media (max-width: 1560px)": {
      width: 300,
    },
    "@media (max-width: 1362px)": {
      width: "100%",
      background: "unset",
      marginTop: 0,
    },
  },
  BetTypeBox: {
    background: "transparent",
    width: "100%",
    height: 68,
    padding: "11px 38px 10px 23px",
    marginBottom: 11,
    backgroundSize: "100% 100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 11,
    "@media (max-width: 1362px)": {
      background: "transparent",
      borderRadius: "10px",
    },
  },
  TypeButton: {
    flex: 1,
    borderRadius: 10,
    padding: 0,
    background: "transparent",
    height: 43,
    color: "#FFFFFF80",
    fontSize: 16,
    lineHeight: "24px",
    fontWeight: 600,
    textTransform: "none",
    "&.active": {
      background: "#FFFFFF20",
      color: "#FFFFFF",
    },
    "&:hover": {
      background: "#FFFFFF20",
    },
  },
  InputBox: {
    background: "rgba(255, 255, 255, 0.05)",
    width: "100%",
    padding: "14px 32px 15px 24px",
    height: 66,
    backgroundSize: "100% 100%",
    marginBottom: 11,
    borderRadius: "10px",
    "@media (max-width: 1362px)": {
      background: "rgba(255, 255, 255, 0.05)",
      borderRadius: "10px",
    },
  },
  InputLabel: {
    fontSize: 12,
    lineHeight: "18px",
    fontWeight: 700,
    color: "#FFFFFF",
    marginBottom: "2px",
  },
  InputStyle: {
    width: "100%",
    height: 29,
    padding: 0,
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: "27px",
    fontWeight: 600,
    background: "transparent",
    border: "none",
    outline: "none",
    "&::placeholder": {
      color: "#FFFFFF40",
    },
    "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button": {
      WebkitAppearance: "none",
      margin: 0,
    },
  },
  SelectBox: {
    background: "rgba(255, 255, 255, 0.05)",
    width: "100%",
    height: 68,
    padding: "11px 32px 10px 24px",
    marginBottom: 11,
    backgroundSize: "100% 100%",
    borderRadius: "10px",
    "@media (max-width: 1362px)": {
      background: "rgba(255, 255, 255, 0.05)",
      borderRadius: "10px",
    },
  },
  SelectLabel: {
    fontSize: 12,
    lineHeight: "18px",
    fontWeight: 700,
    color: "#FFFFFF",
    marginBottom: "2px",
  },
  BetButton: {
    background: 'url("/assets/images/plinko/betbuttonbg.png")',
    width: "100%",
    height: 68,
    backgroundSize: "100% 100%",
    fontSize: 20,
    lineHeight: "30px",
    fontWeight: 700,
    textTransform: "none",
    "& .MuiButton-label, & span": {
      color: "#FFFFFF !important",
      opacity: "1 !important",
    },
    "&:hover": {
      background: 'url("/assets/images/plinko/betbuttonbg.png")',
      backgroundSize: "100% 100%",
      opacity: 0.9,
    },
    "&:disabled": {
      opacity: 0.6,
      "& .MuiButton-label, & span": {
        color: "#FFFFFF !important",
        opacity: "1 !important",
      },
    },
  },
  CanvasBox: {
    background: 'url("/assets/images/plinko/gamebg.png")',
    width: 700,
    height: 550,
    backgroundSize: "100% 100%",
    position: "relative",
    flex: "none",
    "@media (max-width: 1362px)": {
      background: "#121212",
      width: "100%",
      height: "auto",
      minHeight: 630,
    },
  },
}));

enum BET_TYPE {
  manual = "manual",
  auto = "auto",
}

enum RISKS {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

interface BetResponse {
  status: string;
  result: {
    bucket: number;
    path: number[];
    multiplier: number;
    outcome: string;
  };
}

interface Particle {
  body: Matter.Body;
  bucketIndex: number;
  balance: number;
  isGrowing: boolean;
  r: number;
  display: (p5: any) => void;
  grow: () => void;
  destroy: () => void;
}

interface PlinkoBody {
  body: Matter.Body;
  r: number;
  display: (p5: any) => void;
}

interface WallBody {
  body: Matter.Body;
  w: number;
  h: number;
  display: (p5: any) => void;
  destroy: () => void;
}

interface RippleEffect {
  id: string;
  body: Matter.Body;
  r: number;
  maxR: number;
  origin: number;
  display: (p5: any) => void;
}

const Plinko = () => {
  const classes = useStyles();
  const { publicKey, signMessage } = useWallet();
  const { isConnected, user, updateVaultInfo, openWalletModal } = useAuthStore();
  
  // Initialize allowance service for wallet signatures
  const allowanceService = useAtomikAllowance();
  const allowance = useAllowanceForCasino(
    publicKey?.toBase58() ?? null,
    allowanceService
  );

  // Game state
  const [betType, setBetType] = useState<BET_TYPE>(BET_TYPE.manual);
  const [remainAutoRound, setRemainAutoRound] = useState(0);
  const [playLoading, setPlayLoading] = useState(false);
  const [betAmount, setBetAmount] = useState(0.01);
  const [risk, setRisk] = useState<RISKS>(RISKS.LOW);
  const [rowCount, setRowCount] = useState(ROWS.max);
  const [autoCount, setAutoCount] = useState(1);
  const [betResponse, setBetResponse] = useState<BetResponse | null>(null);

  // Physics engine refs
  const engineRef = useRef<Matter.Engine | null>(null);
  const worldRef = useRef<Matter.World | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const plinkosRef = useRef<PlinkoBody[]>([]);
  const wallsRef = useRef<WallBody[]>([]);
  const ripplesRef = useRef<RippleEffect[]>([]);
  const buttonsRef = useRef<any[]>([]);
  const engineStopFlagRef = useRef(false);
  const autoStopFlagRef = useRef(false);
  const queueRef = useRef(new Queue());
  const payoutGroupRef = useRef<HTMLDivElement>(null);

  // Sound effects
  const [playStart] = useSound("/assets/sounds/plinko/start.mp3");
  const [playPin] = useSound("/assets/sounds/plinko/pin.mp3");
  const [playWin] = useSound("/assets/sounds/plinko/win.mp3");
  const [playLost] = useSound("/assets/sounds/plinko/lost.mp3");

  const setting = {
    min: 0.01,
    max: 20,
  };

  // Matter.js setup
  const Engine = Matter.Engine;
  const World = Matter.World;
  const Bodies = Matter.Bodies;
  const Body = Matter.Body;

  // Particle class for balls
  class ParticleClass implements Particle {
    body: Matter.Body;
    bucketIndex: number;
    balance: number;
    isGrowing: boolean;
    r: number;

    constructor(x: number, y: number, r: number, bucketIndex: number, balance: number, color: any) {
      const options = {
        restitution: 0.6,
        collisionFilter: {
          group: -1,
        },
      };
      this.body = Bodies.circle(x, y, r, options);
      this.r = r;
      this.bucketIndex = bucketIndex;
      this.balance = balance;
      this.isGrowing = false;
      World.add(worldRef.current!, this.body);
    }

    display(p5: any) {
      const pos = this.body.position;
      const angle = this.body.angle;
      p5.push();
      p5.translate(pos.x, pos.y);
      p5.rotate(angle);
      p5.noStroke();
      const riskColor = risk.toLowerCase();
      const colors = particleColor[riskColor as keyof typeof particleColor];
      const gradient = p5.drawingContext.createRadialGradient(0, 0, 0, 0, 0, this.r);
      gradient.addColorStop(
        0,
        `rgb(${colors.r1}, ${colors.g1}, ${colors.b1})`
      );
      gradient.addColorStop(
        1,
        `rgb(${colors.r2}, ${colors.g2}, ${colors.b2})`
      );
      p5.drawingContext.fillStyle = gradient;
      p5.ellipse(0, 0, this.r * 2);
      p5.pop();
    }

    grow() {
      this.isGrowing = true;
    }

    destroy() {
      World.remove(worldRef.current!, this.body);
    }
  }

  // Plinko peg class
  class PlinkoClass implements PlinkoBody {
    body: Matter.Body;
    r: number;

    constructor(x: number, y: number, r: number) {
      const options = {
        restitution: 1,
        friction: 0,
        isStatic: true,
      };
      this.body = Bodies.circle(x, y, r, options);
      this.r = r;
      World.add(worldRef.current!, this.body);
    }

    display(p5: any) {
      const pos = this.body.position;
      const angle = this.body.angle;
      p5.push();
      p5.translate(pos.x, pos.y);
      p5.rotate(angle);
      p5.noStroke();
      p5.fill(255, 255, 255);
      p5.ellipse(0, 0, this.r * 2);
      p5.pop();
    }
  }

  // Wall class
  class WallClass implements WallBody {
    body: Matter.Body;
    w: number;
    h: number;

    constructor(x1: number, y1: number, x2: number, y2: number) {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const distance = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
      const options = {
        restitution: 1,
        friction: 0,
        isStatic: true,
        angle: angle,
      };
      this.body = Bodies.rectangle((x1 + x2) / 2, (y1 + y2) / 2, distance, wallWidth, options);
      this.w = distance;
      this.h = wallWidth;
      World.add(worldRef.current!, this.body);
    }

    display(p5: any) {
      const pos = this.body.position;
      const angle = this.body.angle;
      p5.push();
      p5.translate(pos.x, pos.y);
      p5.rotate(angle);
      p5.noStroke();
      p5.fill(255, 255, 255);
      p5.rectMode(p5.CENTER);
      p5.rect(0, 0, this.w, this.h);
      p5.pop();
    }

    destroy() {
      World.remove(worldRef.current!, this.body);
    }
  }

  // Ripple effect class
  // Ripple class matching original exactly
  class RippleClass implements RippleEffect {
    id: string;
    body: Matter.Body;
    r: number;
    maxR: number;
    origin: number;

    constructor(id: string, body: Matter.Body, r: number, origin: number) {
      const options = {
        restitution: 1,
        friction: 0,
        isStatic: true,
      };
      this.id = id;
      this.r = r;
      this.origin = origin;
      this.body = body;
      this.maxR = origin + 10; // for compatibility
    }

    display(p5: any) {
      const pos = this.body.position;
      const angle = this.body.angle;

      p5.push();
      p5.translate(pos.x, pos.y);
      p5.rotate(angle);
      p5.imageMode(p5.CENTER);
      p5.noStroke();
      p5.fill(
        255 - (this.r - this.origin) * 13,
        255 - (this.r - this.origin) * 13,
        255 - (this.r - this.origin) * 13,
      );
      p5.ellipseMode(p5.RADIUS);
      p5.ellipse(0, 0, this.r, this.r);
      p5.pop();

      this.r += 0.4;
    }
  }

  // Initialize physics engine
  const setupPhysics = useCallback((p5: any) => {
    // Initialize Matter.js seed for consistent physics
    (Matter.Common as any)._seed = 12345678;
    
    engineRef.current = Engine.create({});
    engineRef.current.world.gravity.y = 1.5;
    worldRef.current = engineRef.current.world;

    // Initialize plinkos/pegs
    initializePlinkos();
  }, [rowCount]);

  // Initialize plinkos based on row count
  const initializePlinkos = useCallback(() => {
    const startX = (canvasWidth - (rowCount + 1) * plinkoDistanceX[rowCount]) / 2;

    // Clear existing plinkos
    plinkosRef.current.forEach((p) => World.remove(worldRef.current!, p.body));
    plinkosRef.current = [];

    // Add plinkos
    for (let i = 0; i < rowCount; i++) {
      for (let j = 0; j < i + 3; j++) {
        plinkosRef.current.push(
          new PlinkoClass(
            startX +
              ((rowCount - (i + 1)) * plinkoDistanceX[rowCount]) / 2 +
              j * plinkoDistanceX[rowCount],
            50 + i * plinkoDistanceY[rowCount],
            plinkoRadius[rowCount]
          )
        );
      }
    }

    // Clear existing walls
    wallsRef.current.forEach((w) => w.destroy());
    wallsRef.current = [];

    // Add walls
    wallsRef.current.push(
      new WallClass(
        startX +
          ((rowCount - 1) * plinkoDistanceX[rowCount]) / 2 -
          wallWidth -
          plinkoRadius[rowCount],
        50,
        startX - wallWidth - plinkoRadius[rowCount],
        50 + (rowCount - 1) * plinkoDistanceY[rowCount]
      )
    );
    wallsRef.current.push(
      new WallClass(
        startX +
          ((rowCount + 3) * plinkoDistanceX[rowCount]) / 2 +
          plinkoRadius[rowCount] +
          wallWidth,
        50,
        startX +
          (rowCount + 1) * plinkoDistanceX[rowCount] +
          plinkoRadius[rowCount] +
          wallWidth,
        50 + (rowCount - 1) * plinkoDistanceY[rowCount]
      )
    );
  }, [rowCount]);

  // Draw payout buttons
  useEffect(() => {
    const drawPayoutButtons = () => {
      if (!payoutGroupRef.current) return;

      const payoutGroup = payoutGroupRef.current;
      let flag = 1;
      if (window.innerWidth <= 685) {
        flag = 700 / payoutGroup.clientWidth;
      }

      // Clear all children
      payoutGroup.innerHTML = "";
      buttonsRef.current = [];

      // Add payout buttons
      const payoutLength = payoutDefaultValue[rowCount - 8][risk].length;
      for (let i = 0; i < payoutLength; i++) {
        const r =
          211 -
          (i < (payoutLength - 1) / 2 ? i : payoutLength - 1 - i) *
            ((56 / payoutLength) * 2);
        const g =
          44 +
          (i < (payoutLength - 1) / 2 ? i : payoutLength - 1 - i) *
            ((126 / payoutLength) * 2);
        const b =
          230 -
          (i < (payoutLength - 1) / 2 ? i : payoutLength - 1 - i) *
            ((49 / payoutLength) * 2);
        const payoutValue =
          "" +
          payoutDefaultValue[rowCount - 8][risk][i] +
          (flag >= 1.8 && payoutDefaultValue[rowCount - 8][risk][i] >= 100
            ? ""
            : "×");

        const payoutButton = document.createElement("div");
        payoutButton.className = "payout-btn";
        payoutButton.id = `payout-btn-${i}`;
        payoutButton.style.width = `${(plinkoDistanceX[rowCount] - (plinkoRadius[rowCount] - 4) * 2) / flag}px`;
        payoutButton.style.margin = `0px ${(plinkoRadius[rowCount] - 4) / flag}px`;
        payoutButton.style.background = `rgb(${r}, ${g}, ${b})`;
        payoutButton.innerHTML = `<span>${payoutValue}</span>`;

        buttonsRef.current.push(payoutButton);
        payoutGroup.appendChild(payoutButton);
      }
    };

    drawPayoutButtons();

    // Handle window resize
    const handleResize = () => drawPayoutButtons();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [rowCount, risk]);

  // Handle bet
  const handleBet = async () => {
    if (!isConnected || !user || !publicKey) {
      console.error("Not connected or wallet not available");
      openWalletModal();
      return;
    }

    if (!user.vaultAddress) {
      console.error("No vault address found");
      return;
    }

    if (betAmount < setting.min || betAmount > setting.max) {
      console.error("Invalid bet amount");
      return;
    }

    if (playLoading) return;

    setPlayLoading(true);

    try {
      playStart();

      // Get allowance nonce/play session
      const playSession = allowance.getCachedPlaySession();
      if (!playSession || !playSession.nonce) {
        console.error("No valid play session found");
        setPlayLoading(false);
        return;
      }

      // Construct auth data similar to Dice game
      const userData = {
        _id: publicKey.toBase58(),
        vaultAddress: user.vaultAddress,
      };

      const requestData = {
        player_id: userData._id,
        player_address: publicKey.toBase58(),
        vault_address: userData.vaultAddress,
        bet_amount: betAmount,
        rows: rowCount,
        risk: risk.toLowerCase(),
        token: {
          symbol: "SOL",
        },
        allowance_nonce: playSession.nonce,
      };

      console.log("📤 Plinko request:", requestData);

      const response = await axios.post(
        `${Config.Root.blockchainApiUrl}/api/plinko/play`,
        requestData
      );

      console.log("✅ Plinko response:", response.data);

      if (response.data && response.data.status === "complete") {
        setBetResponse(response.data);
        
        // Update vault balance
        if (updateVaultInfo && user?.vaultAddress) {
          const currentBalance = user.vaultBalance || 0;
          const winAmount = betAmount * response.data.result.multiplier;
          const newBalance = response.data.result.outcome === 'win' ? 
            currentBalance + (winAmount - betAmount) : 
            currentBalance - betAmount;
          updateVaultInfo(user.vaultAddress, newBalance);
        }

        // Drop ball - allow immediate next bet
        dropBall(response.data.result.bucket);
        setPlayLoading(false);
      } else {
        console.error("❌ Invalid response format:", response.data);
        setPlayLoading(false);
      }
    } catch (error: any) {
      console.error("❌ Plinko bet error:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: `${Config.Root.blockchainApiUrl}/api/plinko/play`,
      });
      setPlayLoading(false);
    }
  };

  // Auto bet - fires multiple bets with 1s intervals
  const handleAutoBet = () => {
    setRemainAutoRound(autoCount);
    autoStopFlagRef.current = false;
    const remainCount = autoCount;
    for (let i = 0; i < remainCount; i++) {
      setTimeout(() => {
        if (!autoStopFlagRef.current) handleBet();
      }, i * 1000);
    }
  };

  const handleStopAutoBet = () => {
    autoStopFlagRef.current = true;
    setRemainAutoRound(0);
  };

  // Drop ball - matches original startPlinko()
  const dropBall = (bucketIndex: number) => {
    const tmpCurRows = rowCount;
    const startX = canvasWidth / 2 - plinkoDistanceX[tmpCurRows] + 1;
    
    // Use bucket position arrays for proper path if available
    const bucketPositions = payoutResult[tmpCurRows]?.[bucketIndex];
    let dropX = startX;
    
    if (bucketPositions && bucketPositions.length > 0) {
      const randomIdx = Math.floor(Math.random() * bucketPositions.length);
      dropX = startX + bucketPositions[randomIdx];
    } else {
      // Fallback: small random offset from center
      dropX = canvasWidth / 2 + (Math.random() - 0.5) * 20;
    }
    
    const particle = new ParticleClass(
      dropX,
      5,
      plinkoRadius[tmpCurRows] * 1.6,
      bucketIndex,
      betAmount,
      particleColor[risk.toLowerCase() as keyof typeof particleColor]
    );
    particlesRef.current.push(particle);

    // Add collision ripple listener for this ball drop
    if (engineRef.current) {
      const collisionHandler = (event: any) => {
        for (let i = 0; i < event.pairs.length; i++) {
          const pair = event.pairs[i];
          const findItem = ripplesRef.current.find((item) => item?.id === pair?.id);
          if (findItem) return;
          
          const pairBody = [pair.bodyA, pair.bodyB];
          let pairIndex = -1;
          
          // Match original: check isStatic and "Circle Body" label
          if (pair.bodyA.isStatic && pair.bodyA.label === "Circle Body") {
            pairIndex = 0;
          } else if (pair.bodyB.isStatic && pair.bodyA.label === "Circle Body") {
            pairIndex = 1;
          }
          
          if (pairIndex >= 0) {
            let flag = 0;
            for (let j = 0; j < ripplesRef.current.length; j++) {
              if (
                ripplesRef.current[j] &&
                (ripplesRef.current[j] as any).body?.position?.x === pairBody[pairIndex].position.x &&
                (ripplesRef.current[j] as any).body?.position?.y === pairBody[pairIndex].position.y
              ) {
                ripplesRef.current[j].r = plinkoRadius[rowCount];
                flag = 1;
              }
            }
            if (flag === 0) {
              playPin();
              ripplesRef.current.push(
                new RippleClass(
                  pair.id,
                  pairBody[pairIndex],
                  plinkoRadius[rowCount],
                  plinkoRadius[rowCount] + 10
                )
              );
            }
          }
        }
      };
      Matter.Events.on(engineRef.current, "collisionStart", collisionHandler);
    }
  };

  // p5 setup
  const setup = (p5: any, canvasParentRef: Element) => {
    p5.createCanvas(canvasWidth, canvasHeight).parent(canvasParentRef);
    setupPhysics(p5);
  };

  // p5 draw - matches original draw() exactly
  const draw = (p5: any) => {
    p5.clear(0, 0, 0, 0);

    if (engineRef.current && !engineStopFlagRef.current) {
      Engine.update(engineRef.current, 1000 / 60);
    }

    // Draw ripples (before plinkos, like original)
    for (let i = 0; i < ripplesRef.current.length; i++) {
      const ripple = ripplesRef.current[i];
      if (ripple) {
        ripple.display(p5);
        if (ripple.r >= plinkoRadius[rowCount] + 10) {
          ripplesRef.current[i] = null as any;
        }
      }
    }

    // Draw plinkos
    plinkosRef.current.forEach((plinko) => plinko.display(p5));

    // Draw particles
    for (let i = 0; i < particlesRef.current.length; i++) {
      if (particlesRef.current[i] != null) {
        particlesRef.current[i].display(p5);

        // Case of particle falls down the ground (matches original: canvasHeight - particle.r)
        if (particlesRef.current[i].body.position.y >= canvasHeight - particlesRef.current[i].r) {
          // Calculate payoutId from X position like original
          const startX =
            (canvasWidth -
              (rowCount + 1) * plinkoDistanceX[rowCount]) / 2;
          const payoutId = Math.floor(
            (particlesRef.current[i].body.position.x - startX) / plinkoDistanceX[rowCount]
          );
          const balance = particlesRef.current[i].balance;

          particlesRef.current[i].destroy();
          particlesRef.current[i] = null as any;

          // Animate payout button (matches original jQuery behavior)
          const btn = document.getElementById(`payout-btn-${payoutId}`);
          if (btn) {
            btn.style.transform = "translateY(7px)";
            setTimeout(() => {
              btn.style.transform = "";
            }, 100);
          }

          // Win processing
          const clampedPayoutId = Math.max(0, Math.min(payoutId, payoutDefaultValue[rowCount - ROWS.min][risk].length - 1));
          const payout = payoutDefaultValue[rowCount - ROWS.min][risk][clampedPayoutId];
          if (payout > 1) {
            playWin();
          } else if (payout === 1) {
            playWin();
          } else {
            playLost();
          }

          // Decrement auto round counter
          if (betType === BET_TYPE.auto) {
            setRemainAutoRound((prev) => Math.max(0, prev - 1));
          }
        }
      }
    }
  };

  // Auto count validation
  useEffect(() => {
    if (autoCount < 1) {
      setAutoCount(1);
    }
  }, [autoCount]);

  // Reinitialize on row count change
  useEffect(() => {
    if (worldRef.current) {
      initializePlinkos();
    }
  }, [rowCount, initializePlinkos]);

  return (
    <Box className={classes.MainContainer}>
      <Box className={classes.GamePanel}>
        <Box className={classes.GameMainBox}>
          {/* Game Controls */}
          <Box className={classes.GameControlPanel}>
            {/* Bet Type Selector */}
            <Box className={classes.BetTypeBox}>
              <Button
                className={clsx(classes.TypeButton, {
                  active: betType === BET_TYPE.manual,
                })}
                onClick={() => setBetType(BET_TYPE.manual)}
              >
                Manual
              </Button>
              <Button
                className={clsx(classes.TypeButton, {
                  active: betType === BET_TYPE.auto,
                })}
                onClick={() => setBetType(BET_TYPE.auto)}
              >
                Auto
              </Button>
            </Box>

            {/* Bet Amount Input */}
            <Box className={classes.InputBox}>
              <Typography className={classes.InputLabel}>Bet Amount</Typography>
              <input
                className={classes.InputStyle}
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                min={setting.min}
                max={setting.max}
                step={0.01}
              />
            </Box>

            {/* Risk Selector */}
            <Box className={classes.SelectBox}>
              <Typography className={classes.SelectLabel}>Risk</Typography>
              <FormControl fullWidth variant="standard">
                <Select
                  value={risk}
                  onChange={(e) => setRisk(e.target.value as RISKS)}
                  disableUnderline
                  sx={{
                    color: "#FFFFFF",
                    fontSize: 18,
                    fontWeight: 600,
                    ".MuiSelect-icon": { color: "#FFFFFF" },
                  }}
                >
                  <MenuItem value={RISKS.LOW}>Low</MenuItem>
                  <MenuItem value={RISKS.MEDIUM}>Medium</MenuItem>
                  <MenuItem value={RISKS.HIGH}>High</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Rows Selector */}
            <Box className={classes.SelectBox}>
              <Typography className={classes.SelectLabel}>Rows</Typography>
              <FormControl fullWidth variant="standard">
                <Select
                  value={rowCount}
                  onChange={(e) => setRowCount(e.target.value as number)}
                  disableUnderline
                  sx={{
                    color: "#FFFFFF",
                    fontSize: 18,
                    fontWeight: 600,
                    ".MuiSelect-icon": { color: "#FFFFFF" },
                  }}
                >
                  {Array.from(
                    { length: ROWS.max - ROWS.min + 1 },
                    (_, i) => ROWS.min + i
                  ).map((row) => (
                    <MenuItem key={row} value={row}>
                      {row}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Auto Count (if auto mode) */}
            {betType === BET_TYPE.auto && (
              <Box className={classes.InputBox}>
                <Typography className={classes.InputLabel}>
                  Number of Bets
                </Typography>
                <input
                  className={classes.InputStyle}
                  type="number"
                  value={autoCount}
                  onChange={(e) =>
                    setAutoCount(parseInt(e.target.value) || 1)
                  }
                  min={1}
                  max={100}
                  step={1}
                />
              </Box>
            )}

            {/* Bet Button */}
            {betType === BET_TYPE.manual && (
              <Button
                className={classes.BetButton}
                onClick={handleBet}
                disabled={playLoading || !isConnected}
                sx={{
                  color: "#FFFFFF !important",
                  "& .MuiButton-label": { color: "#FFFFFF !important" },
                }}
              >
                {playLoading ? "Playing..." : "Bet"}
              </Button>
            )}
            {betType === BET_TYPE.auto && remainAutoRound <= 0 && (
              <Button
                className={classes.BetButton}
                onClick={handleAutoBet}
                disabled={!isConnected}
                sx={{
                  color: "#FFFFFF !important",
                  "& .MuiButton-label": { color: "#FFFFFF !important" },
                }}
              >
                Start Auto Bet
              </Button>
            )}
            {betType === BET_TYPE.auto && remainAutoRound > 0 && (
              <Button
                className={classes.BetButton}
                onClick={handleStopAutoBet}
                sx={{
                  color: "#FFFFFF !important",
                  "& .MuiButton-label": { color: "#FFFFFF !important" },
                }}
              >
                Stop Auto Bet ({remainAutoRound})
              </Button>
            )}
          </Box>

          {/* Game Canvas */}
          <Box className={classes.CanvasBox}>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Sketch setup={setup} draw={draw} />
              <div
                ref={payoutGroupRef}
                id="payout_group"
                className="payout-group"
              />
            </div>
          </Box>
        </Box>
      </Box>

      {/* History Table would go here */}
      {/* <Box className={classes.HistoryTable}>
        <HistoryBox />
      </Box> */}
    </Box>
  );
};

export default Plinko;
