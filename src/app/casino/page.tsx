"use client";

import { Container } from "@mui/material";
import Dice from "@/components/games/dice/Dice";

export default function CasinoPage() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Dice />
    </Container>
  );
}
