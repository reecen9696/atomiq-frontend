"use client";

import { Box, Button, Slider } from "@mui/material";
import { makeStyles } from "@mui/styles";
import clsx from "clsx";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import useSound from "use-sound";
import axios from "axios";
import { Theme } from "@mui/material/styles";

import DiceL from "./utils/DiceL";
import DiceR from "./utils/DiceR";
import HistoryItem from "./utils/HistoryItem";
import EmptyItem from "./utils/EmptyItem";
import HistoryBox from "./utils/HistoryBox";

import "./dice.css";

// Configuration - hardcoded for now
const Config = {
  Root: {
    blockchainApiUrl:
      process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL || "http://localhost:3001",
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
    paddingRight: "50px",
    "@media (max-width: 940px)": {
      padding: "0px",
    },
  },
  GamePanelBox: {
    width: "100%",
    height: "829px",
    borderRadius: "30px",
    backgroundImage: 'url("/assets/images/dice/background.png")',
    backgroundSize: "cover",
    backgroundPosition: "50% 50%",
    position: "relative",
    overflow: "hidden",
    "@media (max-width: 940px)": {
      borderRadius: "0px",
    },
    "@media (max-width: 681px)": {
      height: "641px",
    },
  },
  DicePanelBox: {
    position: "absolute",
    backgroundImage: 'url("/assets/images/dice/PanelBg.png")',
    width: "586px",
    height: "842px",
    top: "65px",
    backgroundSize: "cover",
    left: "calc((100% - 586px) / 2)",
    "@media (max-width: 681px)": {
      backgroundImage: 'url("/assets/images/dice/PanelBgMobile.png")',
      width: "calc(100vw - 30px)",
      left: "15px",
      backgroundSize: "100% 100%",
      height: "552px",
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
    height: "230.7px",
    backgroundSize: "100% 100%",
    marginTop: "21px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    overflow: "hidden",
    "@media (max-width: 681px)": {
      marginTop: "17px",
      height: "184px",
    },
  },
  Dices: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  BottomBox: {
    width: "190px",
    height: "9px",
    background: "#FDF6CB",
    "@media (max-width: 681px)": {
      width: "150px",
      height: "7px",
    },
  },
  SubBox: {
    marginTop: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    "@media (max-width: 681px)": {
      marginTop: "9px",
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
      height: "25px",
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
    height: "55px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "0px 14px",
    backgroundImage: 'url("/assets/images/dice/UnderBg.png")',
    backgroundSize: "100% 100%",
    "&>span": {
      fontFamily: "'Styrene A Web'",
      fontStyle: "normal",
      fontWeight: 700,
      fontSize: "17px",
      lineHeight: "22px",
      color: "#FFFFFF",
    },
    "&>label": {
      fontFamily: "'Styrene A Web'",
      fontStyle: "normal",
      fontWeight: 700,
      fontSize: "12px",
      lineHeight: "11px",
      color: "#FFFFFF",
    },
    "@media (max-width: 681px)": {
      height: "44px",
    },
  },
  DeactiveOverBox: {
    backgroundImage: 'url("/assets/images/dice/OverBg1.png") !important',
  },
  OverBox: {
    width: "calc(50% - 4px)",
    height: "55px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "0px 14px",
    backgroundImage: 'url("/assets/images/dice/OverBg.png")',
    backgroundSize: "100% 100%",
    "&>span": {
      fontFamily: "'Styrene A Web'",
      fontStyle: "normal",
      fontWeight: 700,
      fontSize: "17px",
      lineHeight: "22px",
      color: "#FFFFFF",
    },
    "&>label": {
      fontFamily: "'Styrene A Web'",
      fontStyle: "normal",
      fontWeight: 700,
      fontSize: "12px",
      lineHeight: "11px",
      color: "#FFFFFF",
    },
    "@media (max-width: 681px)": {
      height: "44px",
    },
  },
  SliderBox: {
    marginTop: "12px",
    width: "100%",
    height: "54px",
    backgroundColor: "#424253",
    padding: "16px 16px 0px 22px",
    "@media (max-width: 681px)": {
      height: "43px",
      padding: "12px 13px 0px 17px",
      marginTop: "9px",
    },
  },
  CustomSlider: {
    padding: "0px",
    height: "8px",
    "& .MuiSlider-thumb": {
      width: "44px",
      height: "50px",
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
        width: "35px",
        height: "40px",
      },
    },
    "& .MuiSlider-rail": {
      color: "#101013",
    },
  },
  PlayButton: {
    width: "100%",
    height: "51px",
    backgroundImage: 'url("/assets/images/dice/PlayBg.png")',
    backgroundSize: "100% 100%",
    fontFamily: "'Styrene A Web'",
    fontStyle: "normal",
    fontWeight: 700,
    fontSize: "17px",
    lineHeight: "22px",
    textAlign: "center",
    textTransform: "uppercase",
    color: "#FFFFFF",
    "@media (max-width: 681px)": {
      height: "41px",
    },
  },
  AmountInputBox: {
    backgroundImage: 'url("/assets/images/dice/InputBg.png")',
    backgroundSize: "100% 100%",
    height: "46px",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    "@media (max-width: 681px)": {
      height: "37px",
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
    fontSize: "17px",
    lineHeight: "21px",
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

  // Mock data - replace with actual store/context
  const authData = mockAuthData;
  const settingData = mockSettingData;

  // Audio hooks - using placeholder sounds for now
  const [playBgSound, bgSoundOption] = useSound(
    "/assets/sounds/bitkong/bg.mp3",
    { volume: 0.3 },
  );
  const [playClickSound] = useSound("/assets/sounds/bitkong/cell-click.mp3", { volume: 0.5 });
  const [playLostSound] = useSound("/assets/sounds/bitkong/lost.mp3", { volume: 0.7 });
  const [playProfitSound] = useSound("/assets/sounds/bitkong/profit.mp3", { volume: 0.7 });

  const setting = { max: 1000, min: 1 };
  const [targetValue, setTargetValue] = useState(50);
  const [isOver, setIsOver] = useState(true);
  const [betAmount, setBetAmount] = useState(10);
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
    if (betResponse !== null && betResponse.game_id !== processedBetRef.current) {
      processedBetRef.current = betResponse.game_id;
      
      const animContainer =
        document.getElementsByClassName("DiceAnimContainer")[0];
      if (settingData.animation && animContainer) {
        // Remove any existing animation class first
        animContainer.classList.remove("DiceAnimate");
        // Force a reflow to ensure the class removal takes effect
        animContainer.offsetHeight;
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

      setHistoryData(prevHistory => [...prevHistory, history]);

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
        setBetAmount(betAmount / 2);
        break;
      case 1:
        setBetAmount(betAmount * 2);
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

    if (!authData.isAuth) {
      console.log("❌ User not authenticated");
      toast.warning("Please login and try again");
      return;
    }

    if (targetValue < 1 || targetValue > 99) {
      console.log("❌ Invalid target:", targetValue);
      toast.error("Target must be between 1 and 99");
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
      const requestData = {
        player_id: authData.userData._id,
        bet_amount: betAmount,
        target: targetValue,
        condition: isOver ? "over" : "under",
        token: {
          symbol: "SOL",
        },
      };

      const apiUrl = `${Config.Root.blockchainApiUrl}/api/dice/play`;

      console.log("📤 Sending HTTP request to:", apiUrl);
      console.log("📦 Request data:", JSON.stringify(requestData, null, 2));

      let response;
      try {
        response = await axios.post(apiUrl, requestData);
        console.log("✅ HTTP Response received:", response.data);
      } catch (networkError: any) {
        console.warn("⚠️ Backend not available, using mock response:", networkError.message);
        // Use mock response when backend is not available
        const mockRoll = Math.floor(Math.random() * 100) + 1;
        const mockOutcome = isOver 
          ? (mockRoll > targetValue ? "win" : "loss")
          : (mockRoll < targetValue ? "win" : "loss");
        
        const mockResult = {
          game_id: "mock-game-" + Date.now(),
          target: targetValue,
          condition: isOver ? "over" as const : "under" as const,
          roll: mockRoll,
          outcome: mockOutcome as "win" | "loss",
          payment: {
            bet_amount: betAmount,
            payout_amount: mockOutcome === "win" ? betAmount * multiplier : 0
          }
        };
        
        response = { data: { status: "complete", result: mockResult } };
        console.log("🎲 Mock game result:", mockResult);
        
        // Show demo mode notification
        const message = `🎮 Demo Mode: ${mockOutcome === "win" ? "You won!" : "Try again!"} (Roll: ${mockRoll})`;
        if (mockOutcome === "win") {
          toast.success(message);
        } else {
          toast.info(message);
        }
      }
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
      toast.error(error.response?.data || error.message || "Failed to play dice");
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
                <span>{Number(betAmount * multiplier).toFixed(2)}</span>
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
      <Box className={classes.HistoryTable}>
        <HistoryBox />
      </Box>
    </Box>
  );
};

export default Dice;
