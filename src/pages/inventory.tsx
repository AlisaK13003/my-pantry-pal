import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { AppBar, Toolbar, Typography, Container, TextField, Grid, Paper, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, Box, Divider, Select, MenuItem } from '@mui/material';
import { Add, Edit, Delete, CameraAlt, UploadFile, Brightness4, Brightness7, AccountCircle } from '@mui/icons-material';
import { createMyTheme } from '../styles/theme';
import { auth, db, signOut, addItemToInventory, removeItemFromInventory, editItemInInventory, getUserInventory } from '../firebase'; // Adjust the import path as needed
import { onAuthStateChanged } from 'firebase/auth';
import AutoAwesome from '@mui/icons-material/AutoAwesome';


interface Item {
  id: string;
  name: string;
  quantity: number;
  expirationDate: string;
  unit: string;
}

interface Recipe {
  id: number;
  title: string;
  ingredients: string[];
  directions: string;
  suggestions: string;
  imageUrl: string;  // Add this line to include the image URL
}

const Inventory = () => {
  const formatDate = (date:any) => {
    if (!date || !date.seconds) {
      console.error('Invalid date:', date);
      return ''; // Return an empty string or some default date
    }
    return new Date(date.seconds * 1000).toISOString().split('T')[0];
  };
  
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState<number | string>('');
  const [newItemExpirationDate, setNewItemExpirationDate] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('units');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [errors, setErrors] = useState<{ name: boolean; quantity: boolean; expirationDate: boolean }>({
    name: false,
    quantity: false,
    expirationDate: false,
  });
  const [userId, setUserId] = useState<string | null>(null);

  const theme = createMyTheme(mode);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        loadInventory(user.uid);
      } else {
        setUserId(null);
        setItems([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadInventory = async (uid:any) => {
    const inventoryItems = await getUserInventory(uid);
    setItems(inventoryItems.map(item => ({
      id: item.itemId,
      name: item.type,
      quantity: item.quantity,
      expirationDate: formatDate(item.date), // Use the updated formatDate function
      unit: 'units',
    })));
  };
  

  const handleAddItem = () => {
    setCurrentItem(null);
    setNewItemName('');
    setNewItemQuantity('');
    setNewItemExpirationDate('');
    setNewItemUnit('units');
    setErrors({ name: false, quantity: false, expirationDate: false });
    setDialogOpen(true);
  };

  const handleEditItem = (item: Item) => {
    setCurrentItem(item);
    setNewItemName(item.name);
    setNewItemQuantity(item.quantity);
    setNewItemExpirationDate(item.expirationDate);
    setNewItemUnit(item.unit);
    setErrors({ name: false, quantity: false, expirationDate: false });
    setDialogOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (userId) {
      await removeItemFromInventory(userId, id);
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleDialogSave = async () => {
    const newErrors = {
      name: !newItemName,
      quantity: newItemQuantity === '',
      expirationDate: !newItemExpirationDate,
    };

    setErrors(newErrors);

    if (!newErrors.name && !newErrors.quantity && !newErrors.expirationDate) {
      const normalizedItemName = newItemName.trim().toLowerCase();

      if (currentItem && userId) {
        await editItemInInventory(userId, currentItem.id, newItemName, Number(newItemQuantity));
        setItems(items.map(item => 
          item.id === currentItem.id 
            ? { ...item, name: newItemName.charAt(0).toUpperCase() + newItemName.slice(1), quantity: Number(newItemQuantity), expirationDate: newItemExpirationDate, unit: newItemUnit } 
            : item
        ));
      } else if (userId) {
        const existingItemIndex = items.findIndex(
          item => item.name.toLowerCase() === normalizedItemName
        );

        if (existingItemIndex !== -1) {
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += Number(newItemQuantity);
          updatedItems[existingItemIndex].expirationDate = newItemExpirationDate;
          setItems(updatedItems);

          await editItemInInventory(userId, items[existingItemIndex].id, newItemName, updatedItems[existingItemIndex].quantity);
        } else {
          const newItem: Item = {
            id: Date.now().toString(),
            name: newItemName.charAt(0).toUpperCase() + newItemName.slice(1),
            quantity: Number(newItemQuantity),
            expirationDate: newItemExpirationDate,
            unit: newItemUnit,
          };
          setItems(prevItems => [...prevItems, newItem]);

          await addItemToInventory(userId, new Date(newItemExpirationDate), newItemName, Number(newItemQuantity));
        }
      }

      setDialogOpen(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleUseCamera = () => {
    alert('Camera functionality not implemented yet.');
  };

  const handleUploadPicture = () => {
    alert('Upload functionality not implemented yet.');
  };




  const handleRecipeIdeas = async () => {
    try {
      const response = await fetch('/api/recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pantry_items: items }),
      });

      const result = await response.json();

      if (response.ok) {
        const newRecipe = {
          id: result.recipe.id,
          title: result.recipe.title,
          ingredients: result.recipe.ingredients,
          directions: result.recipe.directions,
          suggestions: result.recipe.suggestions,
          imageUrl: result.recipe.imageUrl || '', // Handle optional image URL
        };

        setRecipes((prevRecipes) => [...prevRecipes, newRecipe]);
      } else {
        console.error('Error fetching recipes:', result.error);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setCurrentRecipe(recipe);
    setRecipeDialogOpen(true);
  };

  const handleRecipeDialogClose = () => {
    setRecipeDialogOpen(false);
  };

  const handleToggleMode = () => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

  // Define colors for different modes
  const lightModeBlue = '#A0D3DB'; // Lighter blue for light mode
  const darkModeBlue = '#7AA3B0';  // Darker blue for dark mode

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh' }}>
        <AppBar position="static" sx={{ backgroundColor: mode === 'light' ? lightModeBlue : darkModeBlue }}>
          <Container maxWidth="md">
            <Toolbar style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box style={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography variant="h4" style={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                  My Pantry Pal
                </Typography>
              </Box>
              <Box style={{ display: 'flex', alignItems: 'center' }}>
                <IconButton color="inherit" onClick={handleToggleMode}>
                  {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
                </IconButton>
                <IconButton color="inherit">
                  <AccountCircle />
                </IconButton>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
        <Container maxWidth="md" style={{ marginTop: '20px' }}>
          <Box display="flex" alignItems="center" gap={2} marginBottom="20px">
            <TextField
              fullWidth
              label="Search"
              variant="outlined"
              value={search}
              onChange={handleSearchChange}
            />
            <Button
              variant="contained"
              style={{ backgroundColor: mode === 'light' ? lightModeBlue : darkModeBlue, color: theme.palette.text.primary, minWidth: '150px', padding: '10px 16px' }}
              startIcon={<Add />}
              onClick={handleAddItem}
            >
              Add Item
            </Button>
            <Button
              variant="contained"
              style={{ backgroundColor: mode === 'light' ? lightModeBlue : darkModeBlue, color: theme.palette.text.primary, minWidth: '150px', padding: '10px 16px' }}
              startIcon={<AutoAwesome />} // Add Sparkles icon here
              onClick={handleRecipeIdeas}
            >
              Recipe Ideas
            </Button>
          </Box>
          <Box style={{ maxHeight: '600px', overflowY: items.length > 0 ? 'auto' : 'hidden', padding: '10px' }}>
            {items.length === 0 && (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
                <Typography variant="body1" align="center" style={{ fontStyle: 'italic', color: theme.palette.text.primary }}>
                  Click &quot;Add Item&quot; to get started!
                </Typography>
              </Box>
            )}
            {items.length > 0 && filteredItems.length === 0 && (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
                <Typography variant="body1" align="center" style={{ fontStyle: 'italic', color: theme.palette.text.primary }}>
                  You don&apos;t have any of these!
                </Typography>
              </Box>
            )}
            <Grid container spacing={3}>
              {filteredItems.map((item) => (
                <Grid item xs={12} sm={4} md={4} key={item.id}>
                  <Paper style={{ padding: '16px', position: 'relative', backgroundColor: theme.palette.background.paper }}>
                    <Typography variant="h6" style={{ color: theme.palette.text.primary }}>{item.name}</Typography>
                    <Typography variant="body2" style={{ color: theme.palette.text.secondary }}>Quantity: {item.quantity} {item.unit}</Typography>
                    <Typography variant="body2" style={{ color: theme.palette.text.secondary }}>Expires: {item.expirationDate}</Typography>
                    <IconButton
                      aria-label="edit"
                      style={{ position: 'absolute', top: '10px', right: '40px', color: theme.palette.text.primary }}
                      onClick={() => handleEditItem(item)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      aria-label="delete"
                      style={{ position: 'absolute', top: '10px', right: '10px', color: theme.palette.text.primary }}
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
          <Divider style={{ margin: '40px 0' }} />
          <Typography variant="h4" style={{ marginTop: '40px', marginBottom: '20px', textAlign: 'center', color: theme.palette.text.primary }}>
            Recipe Ideas
          </Typography>
          <Box style={{ padding: '10px' }}>
            <Grid container spacing={3}>
              {recipes.map((recipe) => (
              <Grid item xs={12} sm={6} md={6} key={recipe.id}>
                <Paper style={{ height: '200px', cursor: 'pointer', backgroundColor: theme.palette.background.paper }} onClick={() => handleRecipeClick(recipe)}>
                  <Box style={{ height: '50%', backgroundColor: '#ccc', backgroundImage: `url(${recipe.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  <Box style={{ height: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
                    <Typography variant="h6" style={{ color: theme.palette.text.primary }}>{recipe.title}</Typography>
                  </Box>
                </Paper>
              </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
        
        <Dialog open={dialogOpen} onClose={handleDialogClose}>
          <DialogTitle>{currentItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              type="text"
              fullWidth
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              error={errors.name}
              helperText={errors.name && "Name is required"}
            />
            <TextField
              margin="dense"
              label="Quantity"
              type="number"
              fullWidth
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(e.target.value)}
              InputProps={{
                inputProps: { min: 0 },
                endAdornment: (
                  <InputAdornment position="end">
                    <Select
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value as string)}
                      disableUnderline
                      variant="standard"
                      style={{ verticalAlign: 'middle', marginTop: '-4px' }}
                    >
                      <MenuItem value="units">Units</MenuItem>
                      <MenuItem value="lbs">Pounds</MenuItem>
                      <MenuItem value="kg">Kilograms</MenuItem>
                      <MenuItem value="oz">Ounces</MenuItem>
                      <MenuItem value="g">Grams</MenuItem>
                      <MenuItem value="ml">Milliliters</MenuItem>
                      <MenuItem value="l">Liters</MenuItem>
                      <MenuItem value="fl oz">Fluid Ounces</MenuItem>
                    </Select>
                  </InputAdornment>
                ),
              }}
              error={errors.quantity}
              helperText={errors.quantity && "Quantity is required"}
            />
            <TextField
              margin="dense"
              label="Expiration Date"
              type="date"
              fullWidth
              required
              value={newItemExpirationDate}
              onChange={(e) => setNewItemExpirationDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              error={errors.expirationDate}
              helperText={errors.expirationDate && "Expiration date is required"}
            />
            <Box display="flex" justifyContent="center" gap={2} marginTop="10px">
              <Button
                variant="outlined"
                color="primary"
                startIcon={<CameraAlt />}
                onClick={handleUseCamera}
              >
                Use Camera
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<UploadFile />}
                onClick={handleUploadPicture}
              >
                Upload Picture
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} color="secondary">
              Cancel
            </Button>
            <Button onClick={handleDialogSave} color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
  
        <Dialog open={recipeDialogOpen} onClose={handleRecipeDialogClose}>
          <DialogTitle>{currentRecipe?.title}</DialogTitle>
          <DialogContent>
            <Typography variant="h6">Ingredients</Typography>
            <Typography paragraph>{currentRecipe?.ingredients}</Typography>
            <Typography variant="h6">Directions</Typography>
            <Typography paragraph>{currentRecipe?.directions}</Typography>
            <Typography variant="h6">Suggestions</Typography>
            <Typography paragraph>{currentRecipe?.suggestions}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleRecipeDialogClose} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}

export default Inventory;
