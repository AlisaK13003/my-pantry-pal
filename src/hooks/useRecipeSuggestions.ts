import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { getRecipeSuggestions } from '@/api/openAI';

interface RecipeSuggestionsProps {
  inventoryItems: string[];
}

const RecipeSuggestions = ({ inventoryItems }: RecipeSuggestionsProps) => {
  const [recipes, setRecipes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchRecipes = async () => {
    setLoading(true);
    const suggestions = await getRecipeSuggestions(inventoryItems);
    setRecipes(suggestions);
    setLoading(false);
  };

  return (
    <Box>
      <Button variant="contained" onClick={fetchRecipes} disabled={loading}>
        {loading ? 'Fetching...' : 'Get Recipe Suggestions'}
      </Button>
      {recipes && (
        <Typography variant="body1" mt={2}>
          {recipes}
        </Typography>
      )}
    </Box>
  );
};

export default RecipeSuggestions;
