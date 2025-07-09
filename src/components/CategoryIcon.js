import React from 'react';
import { 
  SmartToy as AIIcon,
  ShoppingCart as RetailIcon,
  Factory as ManufacturingIcon,
  AccountBalance as FinanceIcon,
  Tv as TelcoIcon,
  Category as DefaultIcon
} from '@mui/icons-material';
import { CATEGORIES } from '../context/ContentContextAWS';

/**
 * Component for rendering category-specific icons
 * @param {Object} props - Component props
 * @param {string} props.category - Category name
 * @param {Object} props.sx - MUI sx prop for styling
 * @returns {JSX.Element} - Icon component
 */
const CategoryIcon = ({ category, sx = {} }) => {
  switch(category) {
    case CATEGORIES.GENERATIVE_AI:
      return <AIIcon sx={sx} />;
    case CATEGORIES.RETAIL_CPG:
      return <RetailIcon sx={sx} />;
    case CATEGORIES.MANUFACTURING:
      return <ManufacturingIcon sx={sx} />;
    case CATEGORIES.FINANCE:
      return <FinanceIcon sx={sx} />;
    case CATEGORIES.TELCO_MEDIA:
      return <TelcoIcon sx={sx} />;
    default:
      return <DefaultIcon sx={sx} />;
  }
};

export default CategoryIcon;
