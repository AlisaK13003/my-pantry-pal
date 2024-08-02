'use client'
import { useState } from "react";
import { Box, Button } from "@mui/material";
import useInventory from '@/hooks/useInventory';

export default function Home() {
  const { inventory, addItem, removeItem } = useInventory();
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      justifyContent="center"
      flexDirection="column"
      alignItems="center"
      gap={2}
    >
      <Button variant="contained" onClick={handleOpen}>
        Add New Item
      </Button>
    </Box>
  );
}
