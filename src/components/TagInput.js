import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Chip, 
  Typography,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Add as AddIcon, LocalOffer as TagIcon } from '@mui/icons-material';

/**
 * Component for tag input with chip display
 * @param {Object} props - Component props
 * @param {Array} props.tags - Array of tags
 * @param {Function} props.onChange - Function to call when tags change
 * @param {boolean} props.disabled - Whether the input is disabled
 * @returns {JSX.Element} - Tag input component
 */
const TagInput = ({ tags = [], onChange, disabled = false }) => {
  const [inputValue, setInputValue] = useState('');
  
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };
  
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };
  
  const addTag = () => {
    const trimmedInput = inputValue.trim();
    
    if (trimmedInput && !tags.includes(trimmedInput)) {
      const newTags = [...tags, trimmedInput];
      onChange(newTags);
    }
    
    setInputValue('');
  };
  
  const removeTag = (tagToRemove) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    onChange(newTags);
  };
  
  return (
    <Box>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Add tags..."
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        disabled={disabled}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <TagIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton 
                onClick={addTag}
                disabled={!inputValue.trim() || disabled}
                edge="end"
              >
                <AddIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
        helperText="Press Enter or comma to add a tag"
      />
      
      {tags.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap' }}>
          {tags.map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              onDelete={disabled ? undefined : () => removeTag(tag)}
              sx={{ m: 0.5 }}
            />
          ))}
        </Box>
      )}
      
      {tags.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          No tags added yet
        </Typography>
      )}
    </Box>
  );
};

export default TagInput;
