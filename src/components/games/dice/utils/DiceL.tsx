import { Box } from "@mui/material";
import { makeStyles } from "@mui/styles";
import clsx from "clsx";

const useStyles = makeStyles(() => ({
  DiceContainer: {
    width: "65px",
    height: "65px",
    backgroundImage: 'url("/assets/images/dice/DiceL.png")',
    backgroundSize: "100% 100%",
    position: "relative",
    display: "flex",
    "@media (max-width: 681px)": {
      width: "50px",
      height: "50px",
    },
  },
  CircleItem: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    backgroundColor: "#FFF",
    position: "absolute",
    "@media (max-width: 681px)": {
      width: "7px",
      height: "7px",
    },
  },
}));

interface DiceLProps {
  count: number;
}

const DiceL: React.FC<DiceLProps> = ({ count }) => {
  const classes = useStyles();

  return (
    <Box
      className={clsx(
        classes.DiceContainer,
        `DiceContainer-${count}`,
        "DiceLBox",
      )}
    >
      {new Array(count).fill(0).map((item, index) => (
        <Box key={index} className={classes.CircleItem}></Box>
      ))}
    </Box>
  );
};

export default DiceL;
