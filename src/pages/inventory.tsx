import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Alert, AppBar, Toolbar, Typography, Container, TextField, Grid, Paper, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, Box, Divider, Select, MenuItem } from '@mui/material';
import { Add, Edit, Delete, CameraAlt, UploadFile, Brightness4, Brightness7, AccountCircle } from '@mui/icons-material';
import { createMyTheme } from '../styles/theme';
import { auth, addItemToInventory, removeItemFromInventory, editItemInInventory, getUserInventory, isFirebaseConfigured } from '../firebase'; // Adjust the import path as needed
import { onAuthStateChanged } from 'firebase/auth';
import AutoAwesome from '@mui/icons-material/AutoAwesome';


interface Item {
  id: string;
  name: string;
  quantity: number | null;
  expirationDate: string;
  unit: string;
}

interface Recipe {
  id: string;
  title: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  ingredients: string[];
  directions: string[];
  suggestions: string;
  imageUrl: string;
}

const MIN_RECIPE_ITEMS = 5;

const getFirebaseErrorMessage = (error: unknown, fallback: string) => {
  const firebaseError = error as { code?: string; message?: string };

  if (firebaseError.code === 'permission-denied') {
    return 'Firestore blocked this save. Check your Firebase security rules for users/{uid}/inventory.';
  }

  if (firebaseError.code === 'unauthenticated') {
    return 'Please sign in again before editing your pantry.';
  }

  return firebaseError.message || fallback;
};

const buildRecipeFallbackImage = (title: string) => {
  const encodedTitle = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#f7d9a8"/>
          <stop offset="52%" stop-color="#d7efe7"/>
          <stop offset="100%" stop-color="#f4a6a6"/>
        </linearGradient>
      </defs>
      <rect width="900" height="520" fill="url(#bg)"/>
      <circle cx="710" cy="145" r="90" fill="#ffffff" opacity="0.42"/>
      <circle cx="205" cy="360" r="120" fill="#ffffff" opacity="0.32"/>
      <ellipse cx="450" cy="290" rx="235" ry="78" fill="#ffffff" opacity="0.82"/>
      <ellipse cx="450" cy="285" rx="185" ry="48" fill="#f8eee1"/>
      <path d="M310 284c74-58 201-58 280 0" fill="none" stroke="#d8845d" stroke-width="20" stroke-linecap="round"/>
      <path d="M328 308c68-42 176-42 244 0" fill="none" stroke="#c8a24a" stroke-width="16" stroke-linecap="round"/>
      <circle cx="388" cy="272" r="20" fill="#b95b47"/>
      <circle cx="500" cy="270" r="20" fill="#b95b47"/>
      <circle cx="455" cy="318" r="18" fill="#6f9b63"/>
      <text x="450" y="92" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#3c2f21">${encodedTitle}</text>
      <text x="450" y="438" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#3c2f21" opacity="0.72">Recipe idea from your pantry</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const Inventory = () => {
  const formatDate = (date:any) => {
    if (!date || !date.seconds) {
      return '';
    }
    return new Date(date.seconds * 1000).toISOString().split('T')[0];
  };

  const parseOptionalQuantity = (quantity: number | string): number | null => {
    if (quantity === '') {
      return null;
    }

    const parsedQuantity = Number(quantity);
    return Number.isFinite(parsedQuantity) ? parsedQuantity : null;
  };

  const parseOptionalDate = (date: string): Date | null => {
    return date ? new Date(date) : null;
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
  const [recipeError, setRecipeError] = useState('');
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
  const [firebaseError, setFirebaseError] = useState('');
  const [inventoryError, setInventoryError] = useState('');
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [errors, setErrors] = useState<{ name: boolean }>({
    name: false,
  });
  const [userId, setUserId] = useState<string | null>(null);

  const theme = createMyTheme(mode);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setFirebaseError('Firebase is not configured for this deployment yet.');
      return;
    }

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
    try {
      const inventoryItems = await getUserInventory(uid);
      setItems(inventoryItems.map(item => ({
        id: item.itemId,
        name: item.type,
        quantity: item.quantity ?? null,
        expirationDate: formatDate(item.date), // Use the updated formatDate function
        unit: item.unit || 'units',
      })));
      setInventoryError('');
    } catch (error) {
      console.error('Failed to load inventory', error);
      setInventoryError(getFirebaseErrorMessage(error, 'Unable to load your pantry items right now.'));
    }
  };
  

  const handleAddItem = () => {
    setCurrentItem(null);
    setNewItemName('');
    setNewItemQuantity('');
    setNewItemExpirationDate('');
    setNewItemUnit('units');
    setErrors({ name: false });
    setDialogOpen(true);
  };

  const handleEditItem = (item: Item) => {
    setCurrentItem(item);
    setNewItemName(item.name);
    setNewItemQuantity(item.quantity ?? '');
    setNewItemExpirationDate(item.expirationDate);
    setNewItemUnit(item.unit);
    setErrors({ name: false });
    setDialogOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (userId) {
      try {
        await removeItemFromInventory(userId, id);
        await loadInventory(userId);
      } catch (error) {
        console.error('Failed to delete inventory item', error);
        setInventoryError(getFirebaseErrorMessage(error, 'Unable to delete that item right now.'));
      }
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleDialogSave = async () => {
    const newErrors = {
      name: !newItemName,
    };

    setErrors(newErrors);

    if (!newErrors.name) {
      const parsedQuantity = parseOptionalQuantity(newItemQuantity);
      const parsedDate = parseOptionalDate(newItemExpirationDate);

      if (!userId) {
        setInventoryError('Please sign in before editing your pantry.');
        return;
      }

      try {
        if (currentItem) {
          await editItemInInventory(userId, currentItem.id, newItemName, parsedQuantity, parsedDate, newItemUnit);
        } else {
          await addItemToInventory(userId, parsedDate, newItemName, parsedQuantity, newItemUnit);
        }

        await loadInventory(userId);
        setDialogOpen(false);
      } catch (error) {
        console.error('Failed to save inventory item', error);
        setInventoryError(getFirebaseErrorMessage(error, 'Unable to save that item. Please try again.'));
      }
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
    if (items.length < MIN_RECIPE_ITEMS) {
      setRecipeError(`Add at least ${MIN_RECIPE_ITEMS} ingredients before generating recipe ideas.`);
      return;
    }

    setRecipeError('');
    setIsGeneratingRecipe(true);

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
          prepTime: result.recipe.prepTime,
          cookTime: result.recipe.cookTime,
          servings: result.recipe.servings,
          ingredients: result.recipe.ingredients,
          directions: result.recipe.directions,
          suggestions: result.recipe.suggestions,
          imageUrl: result.recipe.imageUrl,
        };

        setRecipes((prevRecipes) => [...prevRecipes, newRecipe]);
      } else {
        setRecipeError(result.error || 'Unable to generate recipe ideas right now.');
        console.error('Error fetching recipes:', result.error);
      }
    } catch (error) {
      setRecipeError('Unable to generate recipe ideas right now.');
      console.error('Error fetching recipes:', error);
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setCurrentRecipe(recipe);
    setRecipeDialogOpen(true);
  };

  const handleRecipeDialogClose = () => {
    setRecipeDialogOpen(false);
  };

  const handleRecipeImageError = (recipeId: string) => {
    setRecipes((currentRecipes) =>
      currentRecipes.map((recipe) =>
        recipe.id === recipeId
          ? { ...recipe, imageUrl: buildRecipeFallbackImage(recipe.title) }
          : recipe
      )
    );

    setCurrentRecipe((recipe) =>
      recipe?.id === recipeId
        ? { ...recipe, imageUrl: buildRecipeFallbackImage(recipe.title) }
        : recipe
    );
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
              disabled={isGeneratingRecipe}
              style={{ backgroundColor: mode === 'light' ? lightModeBlue : darkModeBlue, color: theme.palette.text.primary, minWidth: '150px', padding: '10px 16px' }}
              startIcon={<AutoAwesome />} // Add Sparkles icon here
              onClick={handleRecipeIdeas}
            >
              {isGeneratingRecipe ? 'Generating...' : 'Recipe Ideas'}
            </Button>
          </Box>
          {firebaseError && (
            <Alert severity="error" sx={{ marginBottom: '20px' }}>
              {firebaseError}
            </Alert>
          )}
          {recipeError && (
            <Alert severity="warning" sx={{ marginBottom: '20px' }}>
              {recipeError}
            </Alert>
          )}
          {inventoryError && (
            <Alert severity="error" sx={{ marginBottom: '20px' }}>
              {inventoryError}
            </Alert>
          )}
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
                    <Typography variant="body2" style={{ color: theme.palette.text.secondary }}>
                      Quantity: {item.quantity !== null ? `${item.quantity} ${item.unit}` : 'Not set'}
                    </Typography>
                    <Typography variant="body2" style={{ color: theme.palette.text.secondary }}>
                      Expires: {item.expirationDate || 'Not set'}
                    </Typography>
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
            {recipes.length === 0 && (
              <Typography variant="body1" align="center" style={{ fontStyle: 'italic', color: theme.palette.text.primary }}>
                Add at least 5 pantry items, then generate a recipe idea here.
              </Typography>
            )}
            <Grid container spacing={3}>
              {recipes.map((recipe) => (
              <Grid item xs={12} sm={6} md={6} key={recipe.id}>
                <Paper style={{ minHeight: '280px', cursor: 'pointer', backgroundColor: theme.palette.background.paper, overflow: 'hidden' }} onClick={() => handleRecipeClick(recipe)}>
                  <Box
                    component="img"
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    onError={() => handleRecipeImageError(recipe.id)}
                    sx={{
                      width: '100%',
                      height: 150,
                      objectFit: 'cover',
                      display: 'block',
                      backgroundColor: mode === 'light' ? '#F1E6D2' : '#333333',
                    }}
                  />
                  <Box sx={{ padding: 2 }}>
                    <Typography variant="h6" style={{ color: theme.palette.text.primary, marginBottom: '8px' }}>{recipe.title}</Typography>
                    <Typography variant="body2" style={{ color: theme.palette.text.secondary, marginBottom: '8px' }}>
                      Prep: {recipe.prepTime} | Cook: {recipe.cookTime} | {recipe.servings}
                    </Typography>
                    <Typography variant="body2" style={{ color: theme.palette.text.secondary, marginBottom: '12px' }}>
                      {recipe.ingredients.slice(0, 3).join(', ')}
                      {recipe.ingredients.length > 3 ? '...' : ''}
                    </Typography>
                    <Typography variant="body2" style={{ color: theme.palette.text.primary }}>
                      {recipe.suggestions}
                    </Typography>
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
            />
            <TextField
              margin="dense"
              label="Expiration Date"
              type="date"
              fullWidth
              value={newItemExpirationDate}
              onChange={(e) => setNewItemExpirationDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
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
  
        <Dialog open={recipeDialogOpen} onClose={handleRecipeDialogClose} maxWidth="md" fullWidth>
          {currentRecipe?.imageUrl && (
            <Box
              component="img"
              src={currentRecipe.imageUrl}
              alt={currentRecipe.title}
              onError={() => handleRecipeImageError(currentRecipe.id)}
              sx={{
                width: '100%',
                height: { xs: 220, sm: 320 },
                objectFit: 'cover',
                display: 'block',
                backgroundColor: mode === 'light' ? '#F1E6D2' : '#333333',
              }}
            />
          )}
          <DialogTitle>{currentRecipe?.title}</DialogTitle>
          <DialogContent>
            {currentRecipe && (
              <Typography variant="body2" color="textSecondary" sx={{ marginBottom: 2 }}>
                Prep: {currentRecipe.prepTime} | Cook: {currentRecipe.cookTime} | {currentRecipe.servings}
              </Typography>
            )}
            <Typography variant="h6">Ingredients</Typography>
            <Box component="ul" sx={{ marginTop: 1, paddingLeft: 3 }}>
              {currentRecipe?.ingredients.map((ingredient, index) => (
                <Typography component="li" key={`${ingredient}-${index}`} sx={{ marginBottom: 0.5 }}>
                  {ingredient}
                </Typography>
              ))}
            </Box>
            <Typography variant="h6">Directions</Typography>
            <Box component="ol" sx={{ marginTop: 1, paddingLeft: 3 }}>
              {currentRecipe?.directions.map((step, index) => (
                <Typography component="li" key={`${step}-${index}`} sx={{ marginBottom: 1 }}>
                  {step}
                </Typography>
              ))}
            </Box>
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
