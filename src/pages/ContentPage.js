import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, Breadcrumbs, Link, Paper, Chip, Divider, Grid } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CategoryIcon from '@mui/icons-material/Category';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';

// Sample content data
const contentData = {
  1: {
    title: 'Building Generative AI Applications with Amazon Bedrock',
    description: 'Learn how to build and deploy generative AI applications using Amazon Bedrock and foundation models.',
    content: `
# Building Generative AI Applications with Amazon Bedrock

Amazon Bedrock is a fully managed service that offers a choice of high-performing foundation models (FMs) from leading AI companies like AI21 Labs, Anthropic, Cohere, Meta, Stability AI, and Amazon with a single API, along with a broad set of capabilities you need to build generative AI applications with security, privacy, and responsible AI.

## Getting Started

To get started with Amazon Bedrock, you'll need:

1. An AWS account with appropriate permissions
2. Access to the Amazon Bedrock service
3. Basic understanding of generative AI concepts

## Key Features

- **Multiple Foundation Models**: Choose from a variety of foundation models to best suit your use case
- **Single API**: Access all models through a unified API
- **Customization**: Fine-tune models with your own data
- **Security & Privacy**: Enterprise-grade security with your data and customizations kept private
- **Responsible AI**: Built-in tools for responsible AI development

## Sample Application: Text Generation

Here's a simple example of how to generate text using Amazon Bedrock:

\`\`\`python
import boto3

bedrock = boto3.client(
    service_name='bedrock-runtime',
    region_name='us-east-1'
)

prompt = "Write a short story about a robot learning to paint."

response = bedrock.invoke_model(
    modelId='anthropic.claude-v2',
    contentType='application/json',
    accept='application/json',
    body=json.dumps({
        "prompt": f"Human: {prompt}\n\nAssistant:",
        "max_tokens_to_sample": 500,
        "temperature": 0.7,
        "top_p": 0.9,
    })
)

response_body = json.loads(response['body'].read())
generated_text = response_body['completion']
print(generated_text)
\`\`\`

## Use Cases

1. **Content Generation**: Create marketing copy, articles, and creative content
2. **Summarization**: Summarize long documents or conversations
3. **Question Answering**: Build Q&A systems with domain-specific knowledge
4. **Code Generation**: Generate code snippets based on natural language descriptions
5. **Chatbots**: Create conversational AI assistants

## Best Practices

- Start with a clear understanding of your use case
- Experiment with different models to find the best fit
- Use appropriate prompting techniques
- Implement responsible AI guardrails
- Monitor and evaluate model outputs

## Next Steps

1. Explore the [Amazon Bedrock documentation](https://docs.aws.amazon.com/bedrock/)
2. Try out different foundation models
3. Experiment with model customization
4. Integrate with other AWS services
5. Deploy your application to production
    `,
    image: 'https://d1.awsstatic.com/re19/Bedrock/bedrock-product-header.3c5d5bb6e7c7f8dcf9e0286bc80b0d57c4d3e9af.png',
    category: 'Generative AI',
    tags: ['LLM', 'Bedrock', 'Foundation Models'],
    author: 'AWS AI Team',
    date: '2025-03-15'
  },
  // Additional content items would be defined here
};

const ContentPage = () => {
  const { id } = useParams();
  const contentId = parseInt(id);
  
  // Get content or show not found
  const content = contentData[contentId];
  
  if (!content) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="h4" align="center">
          Content not found
        </Typography>
      </Container>
    );
  }
  
  return (
    <Box>
      {/* Hero Image */}
      <Box 
        sx={{ 
          height: '300px', 
          width: '100%', 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${content.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ color: 'white', maxWidth: '800px' }}>
            <Chip 
              label={content.category} 
              size="small" 
              sx={{ 
                mb: 2,
                backgroundColor: content.category === 'Generative AI' ? 'aws.purple' : 
                               content.category === 'Manufacturing' ? 'aws.green' : 
                               content.category === 'Retail/CPG' ? 'aws.orange' : 'aws.teal',
                color: 'white',
                fontWeight: 500
              }} 
            />
            <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
              {content.title}
            </Typography>
            <Typography variant="subtitle1">
              {content.description}
            </Typography>
          </Box>
        </Container>
      </Box>
      
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            {/* Breadcrumbs */}
            <Breadcrumbs 
              separator={<NavigateNextIcon fontSize="small" />} 
              aria-label="breadcrumb"
              sx={{ mb: 4 }}
            >
              <Link underline="hover" color="inherit" href="/">
                Home
              </Link>
              <Link underline="hover" color="inherit" href={`/category/${content.category.toLowerCase().replace('/', '-')}`}>
                {content.category}
              </Link>
              <Typography color="text.primary">{content.title}</Typography>
            </Breadcrumbs>
            
            {/* Content */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                mb: 4, 
                borderRadius: 2,
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <Box 
                sx={{ 
                  '& h1': { 
                    fontSize: '2rem',
                    fontWeight: 700,
                    mt: 0,
                    mb: 3,
                    color: 'primary.main'
                  },
                  '& h2': { 
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    mt: 4,
                    mb: 2,
                    color: 'primary.main'
                  },
                  '& h3': { 
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    mt: 3,
                    mb: 2
                  },
                  '& p': { 
                    mb: 2,
                    lineHeight: 1.6
                  },
                  '& ul, & ol': { 
                    mb: 2,
                    pl: 3
                  },
                  '& li': { 
                    mb: 1
                  },
                  '& pre': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    p: 2,
                    borderRadius: 1,
                    overflowX: 'auto',
                    mb: 3
                  },
                  '& code': {
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    p: 0.5,
                    borderRadius: 0.5
                  },
                  '& a': {
                    color: 'secondary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }
                }}
              >
                {/* This would be replaced with a proper markdown renderer in a real app */}
                <div dangerouslySetInnerHTML={{ __html: content.content.replace(/\n/g, '<br />') }} />
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            {/* Metadata Sidebar */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                mb: 4, 
                borderRadius: 2,
                border: '1px solid rgba(0, 0, 0, 0.08)',
                position: 'sticky',
                top: 100
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom>
                About this Demo
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CategoryIcon sx={{ color: 'text.secondary', mr: 1.5, fontSize: 20 }} />
                <Typography variant="body2">
                  <strong>Category:</strong> {content.category}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ color: 'text.secondary', mr: 1.5, fontSize: 20 }} />
                <Typography variant="body2">
                  <strong>Author:</strong> {content.author}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CalendarTodayIcon sx={{ color: 'text.secondary', mr: 1.5, fontSize: 20 }} />
                <Typography variant="body2">
                  <strong>Published:</strong> {new Date(content.date).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <LocalOfferIcon sx={{ color: 'text.secondary', mr: 1.5, fontSize: 20 }} />
                  <Typography variant="body2" fontWeight={600}>
                    Tags
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {content.tags.map((tag) => (
                    <Chip 
                      key={tag} 
                      label={tag} 
                      size="small" 
                      variant="outlined" 
                      sx={{ fontSize: '0.75rem' }} 
                    />
                  ))}
                </Box>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box 
                  component="img" 
                  src="/aws-powered-by.png" 
                  alt="Powered by AWS" 
                  sx={{ 
                    maxWidth: '80%', 
                    height: 'auto',
                    opacity: 0.9
                  }} 
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ContentPage;
