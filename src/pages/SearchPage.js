import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  InputAdornment, 
  Grid, 
  Card, 
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import FeatureCard from '../components/FeatureCard';

// Sample data for all content
const allContent = [
  {
    id: 1,
    title: 'Building Generative AI Applications with Amazon Bedrock',
    description: 'Learn how to build and deploy generative AI applications using Amazon Bedrock and foundation models.',
    image: 'https://d1.awsstatic.com/re19/Bedrock/bedrock-product-header.3c5d5bb6e7c7f8dcf9e0286bc80b0d57c4d3e9af.png',
    category: 'Generative AI',
    tags: ['LLM', 'Bedrock', 'Foundation Models']
  },
  {
    id: 2,
    title: 'Smart Factory Solutions with AWS IoT',
    description: 'Implement predictive maintenance and real-time monitoring for manufacturing equipment using AWS IoT services.',
    image: 'https://d1.awsstatic.com/IoT/IoT_Core_How_it_Works.2165c8a814fd7b5a6d5d4cbc0d56d3a64f8c26c0.png',
    category: 'Manufacturing',
    tags: ['IoT', 'Predictive Maintenance', 'Real-time Analytics']
  },
  {
    id: 3,
    title: 'Retail Analytics Platform with Amazon Redshift',
    description: 'Build a comprehensive retail analytics platform to gain insights from customer and inventory data.',
    image: 'https://d1.awsstatic.com/re19/RedshiftRA/product-page-diagram_Amazon-Redshift_How-It-Works.d85dfa9a2f0f9d5d6f62f9fe8792f1d4c4b4c8e6.png',
    category: 'Retail/CPG',
    tags: ['Analytics', 'Redshift', 'Data Warehouse']
  },
  {
    id: 4,
    title: 'Serverless Media Processing Pipeline',
    description: 'Build a scalable media processing pipeline using AWS Lambda and Step Functions.',
    image: 'https://d1.awsstatic.com/product-marketing/Lambda/Diagrams/product-page-diagram_Lambda-ServerlessApplications.a59577de4b6471674a540b878b0b684e0249a18c.png',
    category: 'Telco/Media',
    tags: ['Serverless', 'Lambda', 'Step Functions']
  },
  {
    id: 5,
    title: 'Fraud Detection with Amazon Fraud Detector',
    description: 'Implement real-time fraud detection for financial transactions.',
    image: 'https://d1.awsstatic.com/product-marketing/Fraud%20Detector/product-page-diagram_Amazon-Fraud-Detector_How-it-Works.095eb618123fcc3a983c52f0606ae12a5b5934ec.png',
    category: 'Finance',
    tags: ['Fraud Detection', 'Machine Learning', 'Real-time']
  },
  {
    id: 6,
    title: 'Supply Chain Optimization with AWS',
    description: 'Optimize inventory management and logistics using AWS services.',
    image: 'https://d1.awsstatic.com/AWS%20Supply%20Chain/AWS-Supply-Chain_HIW.3b8e7cc8a9b0d3bdc3a7a9b792a0c21c9d9b600f.png',
    category: 'Retail/CPG',
    tags: ['Supply Chain', 'Logistics', 'Inventory']
  },
  {
    id: 7,
    title: 'Fine-tuning LLMs with SageMaker',
    description: 'Step-by-step guide to fine-tuning large language models using Amazon SageMaker.',
    image: 'https://d1.awsstatic.com/sagemaker/sagemaker-studio-features.a3a86a1cbb5a6a2d5a3b0b2775d8d6e8b3d37e7b.png',
    category: 'Generative AI',
    tags: ['SageMaker', 'LLM', 'Fine-tuning']
  },
  {
    id: 8,
    title: 'Building RAG Applications with Amazon Kendra',
    description: 'Implement Retrieval Augmented Generation using Amazon Kendra and Amazon Bedrock.',
    image: 'https://d1.awsstatic.com/kendra/product-page-diagram_Amazon-Kendra_How-it-Works.2f8cdc17f9c5a6d69cc4875e8ab8ba0c7b9aba79.png',
    category: 'Generative AI',
    tags: ['RAG', 'Kendra', 'Bedrock']
  }
];

// Extract all unique categories and tags
const allCategories = [...new Set(allContent.map(item => item.category))];
const allTags = [...new Set(allContent.flatMap(item => item.tags))];

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter content based on search query, category, and tags
  const filteredContent = allContent.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || item.category === selectedCategory;
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => item.tags.includes(tag));
    
    return matchesSearch && matchesCategory && matchesTags;
  });

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedTags([]);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Search Header */}
      <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
        Search Content
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Find demos, tutorials, and best practices for AWS services
      </Typography>
      
      {/* Search Input */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search for content..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      
      {/* Filters Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button 
          startIcon={<FilterListIcon />} 
          onClick={() => setShowFilters(!showFilters)}
          color="inherit"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
        
        {(selectedCategory || selectedTags.length > 0) && (
          <Button 
            variant="text" 
            color="primary" 
            onClick={clearFilters}
            size="small"
          >
            Clear Filters
          </Button>
        )}
      </Box>
      
      {/* Filters */}
      {showFilters && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3}>
              {/* Category Filter */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="category-select-label">Category</InputLabel>
                  <Select
                    labelId="category-select-label"
                    id="category-select"
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {allCategories.map(category => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Tags Filter */}
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {allTags.map(tag => (
                    <Chip 
                      key={tag}
                      label={tag}
                      onClick={() => handleTagToggle(tag)}
                      color={selectedTags.includes(tag) ? "primary" : "default"}
                      variant={selectedTags.includes(tag) ? "filled" : "outlined"}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
      
      {/* Search Results */}
      <Box>
        <Typography variant="subtitle1" gutterBottom fontWeight={500}>
          {filteredContent.length} {filteredContent.length === 1 ? 'result' : 'results'} found
        </Typography>
        <Divider sx={{ mb: 4 }} />
        
        {filteredContent.length > 0 ? (
          <Grid container spacing={3}>
            {filteredContent.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <FeatureCard
                  title={item.title}
                  description={item.description}
                  image={item.image}
                  category={item.category}
                  tags={item.tags}
                  link={`/content/${item.id}`}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No results found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filters
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default SearchPage;
