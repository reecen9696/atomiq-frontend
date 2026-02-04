import { Box } from "@mui/material";
import { makeStyles } from "@mui/styles";
import clsx from "clsx";
import HistoryDice from "./HistoryDice";

const useStyles = makeStyles(() => ({
  HistoryItem: {
    padding: "3px",
    border: "solid 2px #FFF",
    display: "flex",
    gap: "3px",
    "@media (max-width: 681px)": {
      gap: "2px",
    },
  },
  LostItem: {
    borderColor: "#F00",
  },
}));

interface HistoryItemProps {
  countL: number;
  countR: number;
  win: boolean;
  index: number;
}

const HistoryItem: React.FC<HistoryItemProps> = ({
  countL,
  countR,
  win,
  index,
}) => {
  const classes = useStyles();

  return (
    <Box
      className={clsx(
        classes.HistoryItem,
        !win ? classes.LostItem : "",
        "HistoryItem",
      )}
    >
      <HistoryDice count={countL} />
      <HistoryDice count={countR} />
    </Box>
  );
};

export default HistoryItem;
