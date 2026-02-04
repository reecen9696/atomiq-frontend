import { Box } from "@mui/material";
import { makeStyles } from "@mui/styles";
import clsx from "clsx";

const useStyles = makeStyles(() => ({
  DiceContainer: {
    width: "24px",
    height: "24px",
    backgroundColor: "#9F60F1",
    position: "relative",
    display: "flex",
    "@media (max-width: 681px)": {
      width: "20px",
      height: "20px",
    },
  },
  CircleItem: {
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    backgroundColor: "#442F32",
    position: "absolute",
  },
}));

interface HistoryDiceProps {
  count: number;
}

const HistoryDice: React.FC<HistoryDiceProps> = ({ count }) => {
  const classes = useStyles();

  return (
    <Box
      className={clsx(classes.DiceContainer, `HistoryDiceContainer-${count}`)}
    >
      {new Array(count).fill(0).map((item, index) => (
        <Box key={index} className={classes.CircleItem}></Box>
      ))}
    </Box>
  );
};

export default HistoryDice;
