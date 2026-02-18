"use client";

import { Box, Button, Slider } from "@mui/material";
import { makeStyles } from "@mui/styles";
import clsx from "clsx";
import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useSound from "use-sound";
import axios from "axios";
import { Theme } from "@mui/material/styles";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthStore } from "@/stores/auth-store";
import { useAtomikAllowance } from "@/components/providers/sdk-provider";
import { useAllowanceForCasino } from "@/lib/sdk/hooks";
import { useBalance } from "@/hooks/useBalance";
import { toast } from "@/lib/toast";

import DiceL from "./utils/DiceL";
import DiceR from "./utils/DiceR";
import HistoryItem from "./utils/HistoryItem";
import EmptyItem from "./utils/EmptyItem";

import "./dice.css";

// Configuration - using blockchain API
const Config = {
  Root: {
    blockchainApiUrl:
      process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL || "http://localhost:8080",
  },
};

// Calculate multiplier based on target and condition (95% RTP)
const calculateMultiplier = (target: number, isOver: boolean): number => {
  const winChance = isOver ? (100 - target) / 100 : (target - 1) / 100;
  return winChance > 0 ? 0.95 / winChance : 0;
};

const calculateChance = (target: number, isOver: boolean): number => {
  return isOver ? 100 - target : target - 1;
};

const useStyles = makeStyles((theme: Theme) => ({
  MainContainer: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingRight: "0px",
    "@media (max-width: 940px)": {
      padding: "0px",
    },
  },
  GamePanelBox: {
    width: "100%",
    height: "650px",
    borderRadius: "0px",
    backgroundImage: 'url("/assets/images/dice/background.png")',
    backgroundSize: "100% 100%",
    backgroundPosition: "center",
    position: "relative",
    overflow: "hidden",
    transform: "scale(1.0)",
    transformOrigin: "top center",
    "@media (max-width: 940px)": {
      borderRadius: "0px",
      transform: "scale(0.9)",
    },
    "@media (max-width: 681px)": {
      height: "550px",
      transform: "scale(0.8)",
    },
  },
  DicePanelBox: {
    position: "absolute",
    backgroundImage: 'url("/assets/images/dice/PanelBg.png")',
    width: "460px",
    height: "660px",
    top: "65px",
    backgroundSize: "cover",
    left: "calc((100% - 460px) / 2)",
    "@media (max-width: 681px)": {
      backgroundImage: 'url("/assets/images/dice/PanelBgMobile.png")',
      width: "calc(100vw - 30px)",
      left: "15px",
      backgroundSize: "100% 100%",
      height: "420px",
    },
  },
  WolfImage: {
    position: "absolute",
    width: "284px",
    top: "331px",
    left: "calc((100% - 284px) / 2 - 460px)",
  },
  ManImage: {
    position: "absolute",
    width: "717px",
    top: "8px",
    right: "calc((100% - 717px) / 2 - 363px)",
  },
  HistoryBox: {
    width: "100%",
    display: "flex",
    gap: "5px",
    height: "42px",
    overflow: "hidden",
    justifyContent: "flex-end",
    "@media (max-width: 681px)": {
      height: "34px",
    },
  },
  DiceBox: {
    width: "100%",
    backgroundImage: 'url("/assets/images/dice/DicePanel.png")',
    height: "200px",
    backgroundSize: "100% 100%",
    marginTop: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    overflow: "hidden",
    "@media (max-width: 681px)": {
      marginTop: "12px",
      height: "160px",
    },
  },
  Dices: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  BottomBox: {
    width: "140px",
    height: "7px",
    background: "#FDF6CB",
    "@media (max-width: 681px)": {
      width: "120px",
      height: "6px",
    },
  },
  SubBox: {
    marginTop: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    "@media (max-width: 681px)": {
      marginTop: "6px",
    },
  },
  MultipleBox: {
    width: "calc(50% - 4px)",
    height: "31px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0px 14px",
    backgroundImage: 'url("/assets/images/dice/MultipleBg.png")',
    backgroundSize: "100% 100%",
    "&>span": {
      fontFamily: "'Styrene A Web'",
      fontStyle: "normal",
      fontWeight: 700,
      fontSize: "12px",
      lineHeight: "15px",
      color: "#FFFFFF",
    },
    "@media (max-width: 681px)": {
      height: "24px",
    },
  },
  ChanceBox: {
    width: "calc(50% - 4px)",
    height: "31px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0px 14px",
    backgroundImage: 'url("/assets/images/dice/ChanceBg.png")',
    backgroundSize: "100% 100%",
    "&>span": {
      fontFamily: "'Styrene A Web'",
      fontStyle: "normal",
      fontWeight: 700,
      fontSize: "12px",
      lineHeight: "15px",
      color: "#FFFFFF",
    },
    "@media (max-width: 681px)": {
      height: "24px",
    },
  },
  PayoutBox: {
    width: "100%",
    height: "31px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0px 14px",
    backgroundImage: 'url("/assets/images/dice/PayoutBg.png")',
    backgroundSize: "100% 100%",
    "&>span": {
      fontFamily: "'Styrene A Web'",
      fontStyle: "normal",
      fontWeight: 700,
      fontSize: "12px",
      lineHeight: "15px",
      color: "#FFFFFF",
    },
    "@media (max-width: 681px)": {
      height: "25px",
    },
  },
  DeactiveUnderBox: {
    backgroundImage: 'url("/assets/images/dice/UnderBg1.png") !important',
    opacity: "0.5",
  },
  UnderBox: {
    width: "calc(50% - 4px)",
    height: "40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "0px 10px",
    backgroundImage: 'url("/assets/images/dice/UnderBg.png")',
    backgroundSize: "100% 100%",
    "&>span": {
      fontFamily: "'Styrene A Web'",
      fontStyle: "normal",
      fontWeight: 700,
      fontSize: "14px",
      lineHeight: "18px",
      color: "#FFFFFF",
    },
    "&>label": {
      fontFamily: "'Styrene A Web'",
      fontStyle: "normal",
      fontWeight: 700,
      fontSize: "10px",
      lineHeight: "9px",
      color: "#FFFFFF",
    },
    "@media (max-width: 681px)": {
      height: "32px",
    },
  },
  DeactiveOverBox: {
    backgroundImage: 'url("/assets/images/dice/OverBg1.png") !important',
  },
  OverBox: {
    width: "calc(50% - 4px)",
    height: "40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "0px 10px",
    backgroundImage: 'url("/assets/images/dice/OverBg.png")',
    backgroundSize: "100% 100%",
    "&>span": {
      fontFamily: "'Styrene A Web'",
      fontStyle: "normal",
      fontWeight: 700,
      fontSize: "14px",
      lineHeight: "18px",
      color: "#FFFFFF",
    },
    "&>label": {
      fontFamily: "'Styrene A Web'",
      fontStyle: "normal",
      fontWeight: 700,
      fontSize: "10px",
      lineHeight: "9px",
      color: "#FFFFFF",
    },
    "@media (max-width: 681px)": {
      height: "32px",
    },
  },
  SliderBox: {
    marginTop: "8px",
    width: "100%",
    height: "42px",
    backgroundColor: "#424253",
    padding: "12px 22px 0px 22px",
    "@media (max-width: 681px)": {
      height: "35px",
      padding: "10px 17px 0px 17px",
      marginTop: "6px",
    },
  },
  CustomSlider: {
    padding: "0px",
    height: "6px",
    "& .MuiSlider-thumb": {
      width: "32px",
      height: "36px",
      backgroundImage: 'url("/assets/images/dice/Spin-Thumb.png")',
      backgroundSize: "100% 100%",
      color: "transparent",
      "&:focus, &:hover, &.Mui-active": {
        boxShadow: "unset",
      },
      "&:before": {
        content: "unset",
      },
      "@media (max-width: 681px)": {
        width: "28px",
        height: "32px",
      },
    },
    "& .MuiSlider-rail": {
      color: "#101013",
    },
  },
  PlayButton: {
    width: "100%",
    height: "38px",
    backgroundImage: 'url("/assets/images/dice/PlayBg.png")',
    backgroundSize: "100% 100%",
    fontFamily: "'Styrene A Web'",
    fontStyle: "normal",
    fontWeight: 700,
    fontSize: "14px",
    lineHeight: "18px",
    textAlign: "center",
    textTransform: "uppercase",
    color: "#FFFFFF !important",
    "&:hover": {
      color: "#FFFFFF !important",
    },
    "&:disabled": {
      color: "#CCCCCC !important",
    },
    "@media (max-width: 681px)": {
      height: "32px",
    },
  },
  AmountInputBox: {
    backgroundImage: 'url("/assets/images/dice/InputBg.png")',
    backgroundSize: "100% 100%",
    height: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    "@media (max-width: 681px)": {
      height: "28px",
    },
  },
  AmountInput: {
    width: "calc(100% - 221px)",
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontFamily: "'Styrene A Web'",
    fontStyle: "normal",
    fontWeight: 700,
    fontSize: "14px",
    lineHeight: "18px",
    textTransform: "uppercase",
    color: "#FFFFFF",
    marginLeft: "5px",
  },
  CoinItem: {
    marginLeft: "16px",
    width: "35px",
    marginTop: "3px",
  },
  AmountActionBox: {
    display: "flex",
    height: "100%",
  },
  AmountActionButton: {
    backgroundColor: "#4D3C6A",
    width: "55px",
    minWidth: "55px",
    borderRadius: "0px",
    fontFamily: "'Styrene A Web'",
    fontStyle: "normal",
    fontWeight: 700,
    fontSize: "14px",
    lineHeight: "16px",
    textTransform: "uppercase",
    color: "#FFFFFF",
    height: "100%",
  },
  AmountMiddleButton: {
    backgroundColor: "#734FA1",
  },
  HistoryTable: {
    marginTop: "24px",
  },
  MainPanelBox: {
    position: "relative",
    width: "100%",
    height: "100%",
    padding: "24px 61px 0px 63px",
    "@media (max-width: 681px)": {
      padding: "18px 15px 0px",
    },
  },
}));

interface DiceGameResult {
  game_id: string;
  roll: number;
  target: number;
  condition: "over" | "under";
  outcome: "win" | "loss";
  payment: {
    bet_amount: number;
    payout_amount: number;
  };
}

interface HistoryData {
  countL: number;
  countR: number;
  win: boolean;
}

// Mock authentication and settings - replace with actual store/context
const mockAuthData = {
  isAuth: true,
  userData: {
    _id: "mock-user-id",
    currency: "SOL",
  },
};

const mockSettingData = {
  animation: true,
  sound: true,
  backgroundSound: true,
  effectSound: true,
};

const Dice: React.FC = () => {
  const classes = useStyles();
  const wallet = useWallet();
  const { publicKey, signMessage } = wallet;
  const { isConnected, openWalletModal, user, updateVaultInfo } =
    useAuthStore();

  // Phase 4.2: Initialize allowance service for wallet signatures
  const allowanceService = useAtomikAllowance();
  const allowance = useAllowanceForCasino(
    publicKey?.toBase58() ?? null,
    allowanceService,
  );

  // Replace mock data with actual wallet/auth data
  const authData = {
    isAuth: isConnected && publicKey && user,
    userData: {
      _id: publicKey?.toBase58() || "mock-user-id",
      currency: "SOL",
      vaultAddress: user?.vaultAddress,
    },
  };
  const settingData = mockSettingData;

  // Audio hooks - using placeholder sounds for now
  const [playBgSound, bgSoundOption] = useSound(
    "/assets/sounds/bitkong/bg.mp3",
    { volume: 0.3 },
  );
  const [playClickSound] = useSound("/assets/sounds/bitkong/cell-click.mp3", {
    volume: 0.5,
  });
  const [playLostSound] = useSound("/assets/sounds/bitkong/lost.mp3", {
    volume: 0.7,
  });
  const [playProfitSound] = useSound("/assets/sounds/bitkong/profit.mp3", {
    volume: 0.7,
  });

  const setting = { max: 100, min: 0.01 };
  const [targetValue, setTargetValue] = useState(50);
  const [isOver, setIsOver] = useState(true);
  const [betAmount, setBetAmount] = useState(0.1);
  const multiplier = calculateMultiplier(targetValue, isOver);
  const winChance = calculateChance(targetValue, isOver);

  const [betResponse, setBetResponse] = useState<DiceGameResult | null>(null);
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [diceData, setDiceData] = useState({ l: 6, r: 6 });
  const [playLoading, setPlayLoading] = useState(false);

  const diceBottomRef = useRef<HTMLDivElement>(null);
  const processedBetRef = useRef<string | null>(null);

  // Log configuration on mount
  useEffect(() => {
    console.log("🎲 Dice Game Component Mounted");
    console.log("🔧 Configuration:", {
      blockchainApiUrl: Config.Root.blockchainApiUrl,
      isAuthenticated: authData.isAuth,
      userId: authData.userData?._id,
      currency: "SOL (hardcoded)",
    });
    console.log("📍 Full Config:", Config.Root);
  }, []);

  useEffect(() => {
    return () => {
      bgSoundOption.stop();
    };
  }, [bgSoundOption]);

  useEffect(() => {
    if (settingData.sound && settingData.backgroundSound) {
      playBgSound();
    }
    if (!settingData.sound || !settingData.backgroundSound) {
      bgSoundOption.stop();
    }
    return () => {
      bgSoundOption.stop();
    };
  }, [settingData.sound, settingData.backgroundSound]);

  useEffect(() => {
    if (betAmount > setting.max) {
      setBetAmount(setting.max);
    } else if (betAmount < setting.min) {
      setBetAmount(setting.min);
    }
  }, [betAmount]);

  useEffect(() => {
    if (
      betResponse !== null &&
      betResponse.game_id !== processedBetRef.current
    ) {
      processedBetRef.current = betResponse.game_id;

      // ✅ Update balance based on bet outcome
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        const won = betResponse.outcome === "win";
        const payoutAmount = betResponse.payment?.payout_amount || 0;
        const betAmountNum = betResponse.payment?.bet_amount || 0;

        // Get current balance directly from fresh store state
        const currentVaultBalance = currentUser.vaultBalance || 0;
        const vaultAddress = currentUser.vaultAddress || "";

        if (won) {
          // Win: add net profit (payout - original bet)
          const netProfit = payoutAmount - betAmountNum;
          const newBalance = currentVaultBalance + netProfit;
          updateVaultInfo(vaultAddress, newBalance);
        } else {
          // Loss: subtract bet amount
          const newBalance = currentVaultBalance - betAmountNum;
          updateVaultInfo(vaultAddress, newBalance);
        }
      }

      const animContainer =
        document.getElementsByClassName("DiceAnimContainer")[0];
      if (settingData.animation && animContainer) {
        // Remove any existing animation class first
        animContainer.classList.remove("DiceAnimate");
        // Force a reflow to ensure the class removal takes effect
        (animContainer as HTMLElement).offsetHeight;
        // Add the animation class
        animContainer.classList.add("DiceAnimate");
      }

      // Convert roll 1-100 to two dice (1-6 each)
      const roll = betResponse.roll;
      const diceL = Math.floor(((roll - 1) % 36) / 6) + 1;
      const diceR = ((roll - 1) % 6) + 1;

      const history: HistoryData = {
        countL: diceL,
        countR: diceR,
        win: betResponse.outcome === "win",
      };
      setDiceData({ l: diceL, r: diceR });

      setHistoryData((prevHistory) => [...prevHistory, history]);

      playEffectSound(
        betResponse.outcome === "win" ? playProfitSound : playLostSound,
      );

      setTimeout(
        () => {
          setPlayLoading(false);
          if (diceBottomRef.current) {
            if (betResponse.outcome === "win") {
              diceBottomRef.current.style.backgroundColor = "#FDF6CB";
            } else {
              diceBottomRef.current.style.backgroundColor = "#F00";
            }
          }
        },
        settingData.animation ? 300 : 0,
      );
    }
  }, [
    betResponse,
    settingData.animation,
    playProfitSound,
    playLostSound,
    updateVaultInfo,
  ]);

  const handleChangeSlider = (event: Event, value: number | number[]) => {
    const numValue = Array.isArray(value) ? value[0] : value;
    setTargetValue(Math.max(1, Math.min(99, Math.round(numValue))));
    playEffectSound(playClickSound);
  };

  const handleBetAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBetAmount(Number(e.target.value));
  };

  const handleAmountAction = (type: number) => {
    switch (type) {
      case 0:
        setBetAmount(
          Math.max(setting.min, parseFloat((betAmount / 2).toFixed(3))),
        );
        break;
      case 1:
        setBetAmount(
          Math.min(setting.max, parseFloat((betAmount * 2).toFixed(3))),
        );
        break;
      case 2:
        setBetAmount(setting.max);
        break;
      default:
        break;
    }
  };

  const setOver = (flag: boolean) => {
    setIsOver(flag);
    playEffectSound(playClickSound);
  };

  const handlePlay = async () => {
    console.log("🎲 DICE PLAY BUTTON CLICKED!");

    if (!isConnected || !publicKey) {
      console.log("❌ Wallet not connected");
      openWalletModal();
      return;
    }

    // Check if user has enough balance
    if (!user?.vaultBalance || user.vaultBalance < betAmount) {
      toast.error(
        "Insufficient funds",
        "Please fund your wallet to continue playing.",
      );
      return;
    }

    // Phase 4.2: Check wallet supports message signing
    if (!signMessage) {
      console.error("Wallet does not support message signing");
      return;
    }

    if (!authData.userData.vaultAddress) {
      console.log("❌ No vault address found");
      console.error(
        "Vault not found. Please create a vault first or try refreshing the page.",
      );
      return;
    }

    if (targetValue < 1 || targetValue > 99) {
      console.log("❌ Invalid target:", targetValue);
      console.error("Target must be between 1 and 99");
      return;
    }

    playEffectSound(playClickSound);
    const animContainer =
      document.getElementsByClassName("DiceAnimContainer")[0];
    if (animContainer) {
      animContainer.classList.remove("DiceAnimate");
    }
    if (diceBottomRef.current) {
      diceBottomRef.current.style.backgroundColor = "#FDF6CB";
    }
    setPlayLoading(true);

    // Reset processed bet reference for new game
    processedBetRef.current = null;

    try {
      // Phase 4.2: Get current play session for nonce
      const playSession = allowance.getCachedPlaySession();
      if (!playSession) {
        // Check if session exists but expired
        const cachedData = localStorage.getItem(
          `atomik:playSession:${publicKey?.toBase58()}`,
        );
        if (cachedData) {
          toast.error(
            "Play session expired",
            "Please click the timer button in the top-right corner to extend your session.",
          );
        } else {
          toast.error(
            "No active play session",
            "Please approve an allowance first by clicking the wallet icon.",
          );
        }
        setPlayLoading(false);
        return;
      }

      const requestData = {
        player_id: authData.userData._id,
        player_address: publicKey?.toBase58(),
        vault_address: authData.userData.vaultAddress,
        bet_amount: betAmount,
        target: targetValue,
        condition: isOver ? "over" : "under",
        token: {
          symbol: "SOL",
        },
        allowance_nonce: playSession.nonce,
      };

      const apiUrl = `${Config.Root.blockchainApiUrl}/api/dice/play`;

      console.log("📤 Sending HTTP request to:", apiUrl);
      console.log("📦 Request data:", JSON.stringify(requestData, null, 2));

      const response = await axios.post(apiUrl, requestData);
      console.log("✅ HTTP Response received:", response.data);
      console.log("📊 Game Result:", {
        game_id: response.data.result?.game_id,
        roll: response.data.result?.roll,
        target: response.data.result?.target,
        condition: response.data.result?.condition,
        outcome: response.data.result?.outcome,
        bet_amount: response.data.result?.payment?.bet_amount,
        payout_amount: response.data.result?.payment?.payout_amount,
      });

      if (response.data.status === "complete" && response.data.result) {
        setBetResponse(response.data.result);
      } else {
        console.error("❌ Invalid response format:", response.data);
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      console.error("❌ Dice play error:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: `${Config.Root.blockchainApiUrl}/api/dice/play`,
      });
      console.error(
        "Failed to play dice:",
        error.response?.data || error.message,
      );
      setPlayLoading(false);
    }
  };

  const playEffectSound = (soundPlay: () => void) => {
    if (settingData.sound && settingData.effectSound) {
      // Small delay to prevent multiple rapid sound triggers
      setTimeout(soundPlay, 10);
    }
  };

  return (
    <Box className={classes.MainContainer}>
      <Box className={classes.GamePanelBox}>
        {/* Settings component will be added later */}
        <img
          src="/assets/images/dice/wolf.png"
          alt="wolf"
          className={classes.WolfImage}
        />
        <img
          src="/assets/images/dice/man.png"
          alt="man"
          className={classes.ManImage}
        />
        <Box className={classes.DicePanelBox}>
          <Box className={classes.MainPanelBox}>
            <Box className={clsx(classes.HistoryBox, "HistoryContainer")}>
              <AnimatePresence>
                {historyData.length > 0 ? (
                  historyData.slice(-10).map((item, index) => (
                    <motion.div
                      key={`history-${historyData.length - 10 + index}`}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                    >
                      <HistoryItem {...item} index={index} />
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EmptyItem countL={6} countR={6} />
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
            <Box className={classes.DiceBox}>
              <Box className={clsx(classes.Dices, "DiceAnimContainer")}>
                <DiceL count={diceData.l} />
                <DiceR count={diceData.r} />
              </Box>
              <Box className={classes.BottomBox} ref={diceBottomRef}></Box>
            </Box>
            <Box className={classes.SubBox}>
              <Box className={classes.MultipleBox}>
                <span>MULTIPLIER</span>
                <span>x{multiplier.toFixed(2)}</span>
              </Box>
              <Box className={classes.ChanceBox}>
                <span>CHANCE</span>
                <span>{winChance.toFixed(2)}%</span>
              </Box>
            </Box>
            <Box className={classes.SubBox}>
              <Box className={classes.PayoutBox}>
                <span>PAYOUT</span>
                <span>{Number(betAmount * multiplier).toFixed(3)} SOL</span>
              </Box>
            </Box>
            <Box className={classes.SubBox}>
              <Button
                className={clsx(
                  classes.UnderBox,
                  isOver ? classes.DeactiveUnderBox : "",
                )}
                onClick={() => setOver(false)}
              >
                <span>UNDER {targetValue}</span>
                <label>x{multiplier.toFixed(2)}</label>
              </Button>
              <Button
                className={clsx(
                  classes.OverBox,
                  !isOver ? classes.DeactiveOverBox : "",
                )}
                onClick={() => setOver(true)}
              >
                <span>OVER {targetValue}</span>
                <label>x{multiplier.toFixed(2)}</label>
              </Button>
            </Box>
            <Box className={classes.SliderBox}>
              <Slider
                valueLabelDisplay="auto"
                step={1}
                min={1}
                max={99}
                track={false}
                className={classes.CustomSlider}
                value={targetValue}
                onChange={handleChangeSlider}
              />
            </Box>
            <Box className={classes.SubBox}>
              <Button
                disabled={playLoading}
                className={classes.PlayButton}
                onClick={handlePlay}
              >
                {playLoading ? "PLAYING..." : "PLAY"}
              </Button>
            </Box>
            <Box className={clsx(classes.SubBox, classes.AmountInputBox)}>
              <img
                src={`/assets/images/coins/sol.svg`}
                alt="SOL"
                className={classes.CoinItem}
              />
              <input
                className={classes.AmountInput}
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                value={betAmount}
                onChange={handleBetAmount}
              />
              <Box className={classes.AmountActionBox}>
                <Button
                  onClick={() => handleAmountAction(0)}
                  className={classes.AmountActionButton}
                >
                  1/2
                </Button>
                <Button
                  onClick={() => handleAmountAction(1)}
                  className={clsx(
                    classes.AmountActionButton,
                    classes.AmountMiddleButton,
                  )}
                >
                  2X
                </Button>
                <Button
                  onClick={() => handleAmountAction(2)}
                  className={classes.AmountActionButton}
                >
                  Max
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dice;
