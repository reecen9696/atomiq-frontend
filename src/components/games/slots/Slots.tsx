"use client";

import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  Typography,
  SelectChangeEvent,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material/styles";
import { useEffect, useState, useRef, useCallback } from "react";
import clsx from "clsx";
import useSound from "use-sound";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthStore } from "@/stores/auth-store";
import { useAtomikAllowance } from "@/components/providers/sdk-provider";
import { useAllowanceForCasino } from "@/lib/sdk/hooks";
import { toast } from "@/lib/toast";
import { gameApiClient, validateBet } from "@/lib/security";
import { useBetGuard } from "@/hooks/useBetGuard";
import { useBetCooldown } from "@/hooks/useBetCooldown";
import { SlotApp } from "./SlotApp";
import { TOTAL_LINES, BET_TYPE } from "./data/constants";

const Config = {
  Root: {
    blockchainApiUrl:
      process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL || "http://localhost:8080",
  },
};

const useStyles = makeStyles((_theme: Theme) => ({
  MainContainer: {
    width: "100%",
    paddingRight: 54,
    "@media (max-width: 940px)": {
      padding: 0,
    },
  },
  GamePanel: {
    width: "100%",
    height: 620,
    borderRadius: 20,
    backgroundImage: 'url("/assets/images/slot/background.jpg")',
    backgroundSize: "cover",
    backgroundPosition: "50% 50%",
    position: "relative",
    overflow: "hidden",
    "@media (max-width: 940px)": {
      borderRadius: "0px",
    },
    "@media (max-width: 1362px)": {
      height: "auto",
    },
  },
  GameMainBox: {
    display: "flex",
    alignItems: "start",
    justifyContent: "flex-start",
    gap: 0,
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: 1100,
    "@media (max-width: 1715px)": {
      width: 1000,
    },
    "@media (max-width: 1507px)": {
      width: 900,
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
    marginTop: 40,
    background: 'url("/assets/images/slot/panelbg.png")',
    width: 300,
    padding: "16px 12px 18px 10px",
    backgroundSize: "100% 100%",
    flex: "none",
    "@media (max-width: 1715px)": {
      width: 260,
      marginTop: 35,
    },
    "@media (max-width: 1507px)": {
      marginTop: 30,
    },
    "@media (max-width: 1362px)": {
      width: "100%",
      background: "#1f1e25",
    },
    "@media (max-width: 940px)": {
      marginTop: 15,
    },
  },
  BetTypeBox: {
    background: 'url("/assets/images/slot/selectbg.png")',
    width: "100%",
    height: 68,
    padding: "11px 38px 10px 23px",
    marginBottom: 11,
    gap: 9,
    display: "flex",
    backgroundSize: "100% 100%",
  },
  BetTypeButton: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    fontFamily: "Styrene A Web",
    fontSize: 14,
    lineHeight: "18px",
    fontWeight: 700,
    color: "#FFF",
    textTransform: "uppercase" as const,
    background: "transparent",
  },
  SelectedBg: {
    background: "linear-gradient(48.57deg, #5A45D1 24.42%, #BA6AFF 88.19%)",
  },
  BetAmountBox: {
    marginBottom: 15,
  },
  CommonLabel: {
    fontFamily: "Styrene A Web",
    fontSize: 14,
    lineHeight: "18px",
    color: "#FFF",
    fontWeight: 400,
    textTransform: "uppercase" as const,
    marginBottom: 8,
  },
  InputBackground: {
    background: 'url("/assets/images/slot/inputbg.png")',
    backgroundSize: "100% 100%",
    width: "100%",
    height: 55,
  },
  BetButton: {
    background: 'url("/assets/images/slot/betbuttonbg.png")',
    backgroundSize: "100% 100%",
    width: "100%",
    height: 70,
    fontFamily: "Styrene A Web",
    fontWeight: 700,
    fontSize: 21,
    lineHeight: "27px",
    color: "#FFF",
    textTransform: "uppercase" as const,
  },
  InputBox: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingLeft: 15,
    paddingTop: 2,
  },
  CurrencyIcon: {
    width: 25,
    height: 25,
  },
  BetAmountInput: {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#FFFFFF",
    fontFamily: "Styrene A Web",
    fontWeight: 700,
    fontSize: 14,
    lineHeight: "18px",
    paddingLeft: 8,
    height: "100%",
  },
  AmountActionBox: {
    display: "flex",
    height: "100%",
  },
  AmountActionButton: {
    backgroundColor: "#4D3C6A",
    width: 55,
    minWidth: 55,
    borderRadius: 0,
    fontFamily: "Styrene A Web",
    fontStyle: "normal",
    fontWeight: 700,
    fontSize: 14,
    lineHeight: "16px",
    textTransform: "uppercase" as const,
    color: "#FFF",
    height: "100%",
  },
  AmountMiddleButton: {
    backgroundColor: "#734FA1",
  },
  CustomSelect: {
    boxSizing: "border-box" as const,
    width: "100%",
    height: 55,
    border: "none",
    borderRadius: 0,
    background: "transparent",
    color: "#FFF",
    "&>svg.MuiSvgIcon-root": {
      color: "#FFF",
    },
    "&>.MuiSelect-select": {
      background: "transparent",
      color: "#FFF",
      fontSize: 14,
      fontWeight: 700,
      padding: "0px 10px",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 5,
    },
    "&>.Mui-disabled": {
      WebkitTextFillColor: "unset",
      opacity: "0.6",
    },
  },
  CustomMenuItem: {
    color: "#FFF",
    display: "flex",
    gap: 5,
    fontSize: 14,
    fontWeight: 700,
  },
  GamePlayBox: {
    width: 750,
    height: 560,
    backgroundSize: "100% 100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column" as const,
    "@media (max-width: 1715px)": {
      width: 680,
      height: 510,
    },
    "@media (max-width: 1507px)": {
      width: 600,
      height: 450,
    },
    "@media (max-width: 1362px)": {
      width: "calc(100vw - 280px)",
      height: "calc((100vw - 280px) * 0.74)",
    },
    "@media (max-width: 940px)": {
      width: "100vw",
      height: "74vw",
      marginTop: 15,
    },
  },
  PixiRefBox: {
    width: "100%",
    height: "100%",
    "&>canvas": {
      width: "100%",
      height: "100%",
    },
  },
}));

const Slots: React.FC = () => {
  const classes = useStyles();
  const pixiRef = useRef<HTMLDivElement>(null);
  const gameAppRef = useRef<SlotApp | null>(null);

  const wallet = useWallet();
  const { publicKey, signMessage } = wallet;
  const { isConnected, openWalletModal, user } = useAuthStore();

  const allowanceService = useAtomikAllowance();
  const allowance = useAllowanceForCasino(
    publicKey?.toBase58() ?? null,
    allowanceService,
  );

  // Bet guard — prevents over-betting by immediately deducting from optimistic balance
  const { guardBet } = useBetGuard();

  // Bet cooldown — 500ms minimum between bets to avoid hitting rate limits
  const { canBet, recordBet, cooldownActive } = useBetCooldown(500);

  const setting = { min: 1, max: 1000 };
  const [betType, setBetType] = useState<number>(BET_TYPE.manual);
  const [playLoading, setPlayLoading] = useState(false);

  const [betAmount, setBetAmount] = useState(setting.min);
  const [linesCount, setLinesCount] = useState(TOTAL_LINES);
  const [autoCount, setAutoCount] = useState(1);

  const [playReelSound] = useSound("/assets/sounds/slot/reel.mp3");
  const [playMatchSound] = useSound("/assets/sounds/slot/match.mp3");
  const [playWinSound] = useSound("/assets/sounds/slot/win.mp3");
  const [playClickSound] = useSound("/assets/sounds/slot/click.mp3");

  const playEffectSound = useCallback((soundPlay: () => void) => {
    soundPlay();
  }, []);

  // Place bet API call
  const placeBet = useCallback(async () => {
    if (!isConnected || !publicKey) return;

    const currentUser = useAuthStore.getState().user;
    if (!currentUser?.vaultAddress) {
      console.error("Vault not found");
      return;
    }

    // Client-side validation before anything else
    const betCheck = validateBet(betAmount, "slot");
    if (!betCheck.valid) {
      toast.error("Invalid bet", betCheck.error || "Check your bet amount");
      return;
    }

    // Guard the bet — immediately deducts from optimistic balance
    const guard = guardBet(betAmount);
    if (!guard) return; // insufficient funds

    setPlayLoading(true);

    // Get play session for nonce
    const playSession = allowance.getCachedPlaySession();
    if (!playSession) {
      const cachedData = localStorage.getItem(
        `atomik:playSession:${publicKey.toBase58()}`,
      );
      if (cachedData) {
        toast.error(
          "Play session expired",
          "Please click the timer button to extend your session.",
        );
      } else {
        toast.error(
          "No active play session",
          "Please approve an allowance first by clicking the wallet icon.",
        );
      }
      guard.revert();
      setPlayLoading(false);
      return;
    }

    const request = {
      player_id: publicKey.toBase58(),
      player_address: publicKey.toBase58(),
      vault_address: currentUser.vaultAddress,
      lines: linesCount,
      token: {
        symbol: "SOL",
      },
      bet_amount: betAmount,
      allowance_nonce: playSession.nonce,
    };

    try {
      const result = await gameApiClient.slot.play(request);

      if (!result.success) {
        toast.error("Bet failed", result.error || "Unknown error");
        guard.revert();
        setPlayLoading(false);
        return;
      }

      const responseData = result.data as any;

      if ((responseData?.status === "complete" || responseData?.result) && responseData?.result) {
        const result = responseData.result;
        const gameData = result.game_data || result;

        const fairResult = gameData.grid; // 3×5 grid of symbols
        const rewardData =
          gameData.wins?.map((win: any) => [
            win.multiplier,
            win.positions,
            win.payline_index,
          ]) || [];

        // Resolve the bet guard — adds payout on wins
        const payoutAmount = result.payment?.payout_amount || 0;
        const won = payoutAmount > 0;
        guard.resolve(won, payoutAmount);

        // Show results in PixiJS
        if (gameAppRef.current) {
          gameAppRef.current.showResult(fairResult, rewardData);
          setTimeout(() => {
            setPlayLoading(false);
          }, 8000);
        } else {
          setPlayLoading(false);
        }
      } else {
        guard.revert();
        setPlayLoading(false);
        console.error(
          "Slot bet failed:",
          responseData?.error || "Unknown error",
        );
      }
    } catch (error: any) {
      console.error("Slot error:", error);
      toast.error("Bet failed", error.message || "An unexpected error occurred");
      guard.revert();
      setPlayLoading(false);
    }
  }, [
    isConnected,
    publicKey,
    allowance,
    linesCount,
    betAmount,
  ]);

  // Handle messages from SlotApp/SlotLayer
  const handleSlotMessage = useCallback(
    (message: { type: string; data?: any }) => {
      switch (message.type) {
        case "playzelo-Slot-UpdateLoading":
          setPlayLoading(message.data);
          break;
        case "playzelo-Slot-UpdateGameState":
          // Balance already updated in placeBet
          break;
        case "playzelo-Slot-Sound":
          if (message.data === "reel") playEffectSound(playReelSound);
          if (message.data === "match") playEffectSound(playMatchSound);
          if (message.data === "win") playEffectSound(playWinSound);
          break;
        case "playzelo-Slot-PlaceBet":
          placeBet();
          break;
      }
    },
    [placeBet, playEffectSound, playReelSound, playMatchSound, playWinSound],
  );

  // Initialize PixiJS application
  useEffect(() => {
    if (!pixiRef.current) return;

    const app = new SlotApp({
      backgroundColor: 0x000000,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      width: 800,
      height: 600,
    });

    app.setMessageHandler(handleSlotMessage);

    const canvas = app.view;
    pixiRef.current.appendChild(canvas);
    app.startGame();
    gameAppRef.current = app;

    const resizeHandler = () => {
      if (!gameAppRef.current) return;
      const parent = pixiRef.current?.parentElement;
      if (parent && parent.clientWidth > 0 && parent.clientHeight > 0) {
        gameAppRef.current.onResize(parent.clientWidth, parent.clientHeight);
      }
    };

    window.addEventListener("resize", resizeHandler);
    // Defer initial resize to ensure DOM layout is computed
    requestAnimationFrame(() => {
      resizeHandler();
      // Double-check after a short delay for late layout changes
      setTimeout(resizeHandler, 100);
    });

    return () => {
      window.removeEventListener("resize", resizeHandler);
      if (gameAppRef.current) {
        gameAppRef.current.destroy(true);
        gameAppRef.current = null;
      }
      // Remove any leftover canvas elements from the container
      if (pixiRef.current) {
        while (pixiRef.current.firstChild) {
          pixiRef.current.removeChild(pixiRef.current.firstChild);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep message handler up to date
  useEffect(() => {
    if (gameAppRef.current) {
      gameAppRef.current.setMessageHandler(handleSlotMessage);
    }
  }, [handleSlotMessage]);

  // Update auth state in SlotApp
  useEffect(() => {
    if (gameAppRef.current) {
      gameAppRef.current.updateAuth(isConnected && !!publicKey && !!user);
    }
  }, [isConnected, publicKey, user]);

  // Update currency in SlotApp
  useEffect(() => {
    if (gameAppRef.current) {
      gameAppRef.current.updateCurrency({ coinType: "SOL" });
    }
  }, []);

  const handleBet = async () => {
    if (!isConnected || !publicKey) {
      openWalletModal();
      return;
    }

    // Enforce minimum 500ms between bets
    if (!canBet()) return;
    recordBet();

    if (!signMessage) {
      console.error("Wallet does not support message signing");
      return;
    }

    const currentUser = useAuthStore.getState().user;
    if (!currentUser?.vaultAddress) {
      console.error("Vault not found. Please create a vault first.");
      return;
    }

    playEffectSound(playClickSound);

    if (gameAppRef.current) {
      gameAppRef.current.updateBetLines(linesCount);
      gameAppRef.current.updateBetAmount(betAmount);
      gameAppRef.current.updateAutoCount(-1);
    }

    await placeBet();
  };

  const handleAutoBet = () => {
    if (!isConnected || !publicKey) {
      openWalletModal();
      return;
    }

    playEffectSound(playClickSound);

    if (gameAppRef.current) {
      gameAppRef.current.updateBetLines(linesCount);
      gameAppRef.current.updateBetAmount(betAmount);
      gameAppRef.current.updateAutoCount(autoCount - 1);
      gameAppRef.current.bet();
    }
  };

  const handleStopAutoBet = () => {
    if (gameAppRef.current) {
      gameAppRef.current.updateAutoCount(-1);
    }
  };

  const handleAmountAction = (type: number) => {
    switch (type) {
      case 0:
        setBetAmount(Math.max(setting.min, betAmount / 2));
        break;
      case 1:
        setBetAmount(Math.min(setting.max, betAmount * 2));
        break;
      case 2:
        setBetAmount(setting.max);
        break;
    }
  };

  const handleLineCount = (e: SelectChangeEvent<number>) => {
    setLinesCount(e.target.value as number);
  };

  return (
    <Box className={classes.MainContainer}>
      <Box className={classes.GamePanel}>
        <Box className={classes.GameMainBox}>
          <Box className={classes.GameControlPanel}>
            <Box className={classes.BetTypeBox}>
              <Button
                disabled={playLoading}
                className={clsx(
                  classes.BetTypeButton,
                  betType === BET_TYPE.manual ? classes.SelectedBg : "",
                )}
                onClick={() => setBetType(BET_TYPE.manual)}
              >
                Manual
              </Button>
              <Button
                disabled={playLoading}
                className={clsx(
                  classes.BetTypeButton,
                  betType === BET_TYPE.auto ? classes.SelectedBg : "",
                )}
                onClick={() => setBetType(BET_TYPE.auto)}
              >
                Auto
              </Button>
            </Box>
            <Box className={classes.BetAmountBox}>
              <Typography className={classes.CommonLabel}>
                Bet Amount
              </Typography>
              <Box className={classes.InputBackground}>
                <Box className={classes.InputBox}>
                  <img
                    className={classes.CurrencyIcon}
                    src="/assets/images/coins/sol.svg"
                    alt="SOL"
                  />
                  <input
                    disabled={playLoading}
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    className={classes.BetAmountInput}
                  />
                  <Box className={classes.AmountActionBox}>
                    <Button
                      disabled={playLoading}
                      onClick={() => handleAmountAction(0)}
                      className={classes.AmountActionButton}
                    >
                      1/2
                    </Button>
                    <Button
                      disabled={playLoading}
                      onClick={() => handleAmountAction(1)}
                      className={clsx(
                        classes.AmountActionButton,
                        classes.AmountMiddleButton,
                      )}
                    >
                      2X
                    </Button>
                    <Button
                      disabled={playLoading}
                      onClick={() => handleAmountAction(2)}
                      className={classes.AmountActionButton}
                    >
                      Max
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box className={classes.BetAmountBox}>
              <Typography className={classes.CommonLabel}>Lines</Typography>
              <Box className={classes.InputBackground}>
                <FormControl fullWidth>
                  <Select
                    labelId="linesCount"
                    id="linesCount"
                    value={linesCount}
                    onChange={handleLineCount}
                    className={classes.CustomSelect}
                    disabled={!isConnected || playLoading}
                  >
                    {new Array(TOTAL_LINES).fill(0).map((_value, index) => (
                      <MenuItem
                        key={index}
                        value={index + 1}
                        className={classes.CustomMenuItem}
                      >
                        {index + 1}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            {betType === BET_TYPE.auto && (
              <Box className={classes.BetAmountBox}>
                <Typography className={classes.CommonLabel}>
                  Number of Bets
                </Typography>
                <Box className={classes.InputBackground}>
                  <input
                    disabled={playLoading}
                    type="number"
                    value={autoCount}
                    onChange={(e) => setAutoCount(Number(e.target.value))}
                    className={classes.BetAmountInput}
                  />
                </Box>
              </Box>
            )}
            {betType === BET_TYPE.manual && (
              <Button
                disabled={playLoading}
                onClick={handleBet}
                className={classes.BetButton}
              >
                {playLoading ? "Spinning..." : "Bet"}
              </Button>
            )}
            {betType === BET_TYPE.auto && (
              <Button
                onClick={
                  gameAppRef.current && gameAppRef.current.autoCount >= 0
                    ? handleStopAutoBet
                    : handleAutoBet
                }
                className={classes.BetButton}
              >
                {gameAppRef.current && gameAppRef.current.autoCount >= 0
                  ? "Stop Auto Bet"
                  : "Start Auto Bet"}
              </Button>
            )}
          </Box>
          <Box className={classes.GamePlayBox}>
            <Box className={classes.PixiRefBox} ref={pixiRef}></Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Slots;
