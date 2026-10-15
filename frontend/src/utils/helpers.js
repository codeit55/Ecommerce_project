// High-resolution real product photography from curated CDN
const PRODUCT_IMAGE_MAP = {
  // Electronics
  'tv': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=700&q=80',
  'laptop': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=700&q=80',
  'mechanical gaming keyboard': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=700&q=80',
  'keyboard': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=700&q=80',
  'ultra-slim power bank 20000mah': 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=700&q=80',
  'power bank': 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=700&q=80',

  // Audio & Wearables
  'wireless noise cancelling headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80',
  'headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80',
  'smart fitness tracker watch': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80',
  'watch': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80',

  // Fashion
  'tshirt': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=700&q=80',
  'minimalist leather backpack': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=700&q=80',
  'backpack': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=700&q=80',
  'denim classic jacket': 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=700&q=80',
  'jacket': 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=700&q=80',

  // Home & Kitchen
  'espresso coffee maker': 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=700&q=80',
  'coffee maker': 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=700&q=80',
  'ergonomic office chair': 'https://images.unsplash.com/photo-1580481077111-e63013d3122c?auto=format&fit=crop&w=700&q=80',
  'chair': 'https://images.unsplash.com/photo-1580481077111-e63013d3122c?auto=format&fit=crop&w=700&q=80',

  // Books
  'atomic habits by james clear': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=700&q=80',
  'book': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=700&q=80',
};

const CATEGORY_DEFAULT_IMAGES = {
  1: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=700&q=80', // Electronics
  2: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=700&q=80', // Fashion
  3: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=700&q=80', // Home & Kitchen
  4: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80', // Audio & Wearables
  5: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=700&q=80', // Books & Stationery
};

export const getProductImage = (product) => {
  if (product?.image && typeof product.image === 'string' && product.image.startsWith('http')) {
    return product.image;
  }
  const nameKey = (product?.name || '').toLowerCase().trim();
  if (PRODUCT_IMAGE_MAP[nameKey]) {
    return PRODUCT_IMAGE_MAP[nameKey];
  }
  for (const [key, url] of Object.entries(PRODUCT_IMAGE_MAP)) {
    if (nameKey.includes(key)) {
      return url;
    }
  }
  const catId = typeof product?.category === 'object' ? product?.category?.id : product?.category;
  if (CATEGORY_DEFAULT_IMAGES[catId]) {
    return CATEGORY_DEFAULT_IMAGES[catId];
  }
  return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80';
};

export const getCategoryName = (category) => {
  if (typeof category === 'object' && category?.name) return category.name;
  const id = Number(category);
  switch (id) {
    case 1: return 'Electronics';
    case 2: return 'Fashion';
    case 3: return 'Home & Kitchen';
    case 4: return 'Audio & Wearables';
    case 5: return 'Books & Stationery';
    default: return 'General';
  }
};

export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};
