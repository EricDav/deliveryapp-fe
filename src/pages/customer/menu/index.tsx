import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../../contexts/CartContext';
import CustomerLayout from '../../../components/customer-layout';
import FoodMenu from '@/components/menu/index';
import { useProducts, FoodItem } from '@/hooks/useProducts';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useToast } from "@/components/ui/use-toast";
import { apiService, Category } from '@/services/api';
import { useWebSocket } from '@/hooks/useWebSocket';

// Add this above the Menu component
const bannerImages = [
  '/images/banners/menu-banner.jpg',
  '/images/banners/folixx bukka combo.jpg',
  '/images/banners/folixx bukka combo 2.jpg',
  '/images/banners/folixx bukka combo 3.jpg',
  '/images/banners/folixx bukka combo 4.jpg',
  '/images/banners/folixx bukka combo 5.jpg',
  '/images/banners/folixx bukka combo 6.jpg',
  '/images/banners/folixx bukka combo 7.jpg',
  '/images/banners/folixx bukka combo 8.jpg',
  '/images/banners/folixx bukka combo 9.jpg',
  '/images/banners/folixx bukka combo 10.jpg',
];

export default function Menu() {
  const router = useRouter();
  const { addItem, updateQuantity, items } = useCart();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { 
    products, 
    loading, 
    loadingMore, 
    error, 
    refetch, 
    loadMore, 
    pagination,
    isRetrying, 
    retryCount 
  } = useProducts();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Slideshow state
  const [currentBanner, setCurrentBanner] = useState(0);
  const bannerTimeout = useRef<NodeJS.Timeout | null>(null);
  const [priceFilter, setPriceFilter] = useState('');
  const [promoFilter, setPromoFilter] = useState('');
  const { subscribeToProductUpdates } = useWebSocket();

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Setup infinite scrolling
  useInfiniteScroll({
    hasMore: pagination.hasMore,
    loading: loadingMore,
    onLoadMore: loadMore,
    threshold: 300, // Load more when 300px from bottom
  });

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        setCategoriesError(null);
        const fetchedCategories = await apiService.getCategories();
        // Filter only available categories
        const availableCategories = fetchedCategories.filter(category => category.isAvailable);
        setCategories(availableCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategoriesError('Failed to load categories');
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(() => {
        refetch({ query: searchQuery, category: selectedCategory ? selectedCategory.toString() : null });
    }, 400);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [searchQuery, selectedCategory, refetch]);

  useEffect(() => {
    if (bannerTimeout.current) clearTimeout(bannerTimeout.current);
    bannerTimeout.current = setTimeout(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 3500);
    return () => {
      if (bannerTimeout.current) clearTimeout(bannerTimeout.current);
    };
  }, [currentBanner]);

  useEffect(() => {
    // Subscribe to product updates
    const unsubscribe = subscribeToProductUpdates();
    return () => unsubscribe();
  }, [subscribeToProductUpdates]);

  const handleCheckout = () => {
    router.push('/customer/checkout');
  };

  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAddToCart = (item: any, quantity: number = 1) => {
    const existing = items.find((cartItem: any) => cartItem.id === item.id);
    if (existing) {
      updateQuantity(item.id, existing.quantity + quantity);
    } else {
      addItem(item);
      if (quantity > 1) {
        updateQuantity(item.id, quantity);
      }
    }
    toast({ 
      variant: "success",
      title: "Added to Cart", 
      description: `${item.name} (x${quantity}) has been added to your cart.`,
    });
  };

  // 2. Filter products by selectedCategory (number) or show all if null
  const filteredFoodItems = products?.filter((item) => {
    const matchesCategory = selectedCategory === null || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesPrice = true;
    if (priceFilter === 'low') matchesPrice = true; // Sorting handled below
    if (priceFilter === 'high') matchesPrice = true; // Sorting handled below
    let matchesPromo = true;
    if (promoFilter === 'promo') matchesPromo = item.price < 5000;
    return matchesCategory && matchesSearch && matchesPrice && matchesPromo;
  }) || [];

  // Sort by price if needed
  if (priceFilter === 'low') filteredFoodItems.sort((a, b) => a.price - b.price);
  if (priceFilter === 'high') filteredFoodItems.sort((a, b) => b.price - a.price);

  return (
    <CustomerLayout>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
        {/* Mobile Location Selector */}
        <div className="sm:hidden mb-4 bg-white rounded-xl p-3 shadow-sm border border-[#e0e4e7]">
          <div className="flex items-center gap-2 text-[#757d87]">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 17 16">
              <path d="M8.967 1a5 5 0 0 1 5 5c0 .982-.513 2.324-1.422 4.046-.218.414-.457.843-.713 1.284a53.536 53.536 0 0 1-1.863 2.975l-.18.263a1 1 0 0 1-1.645 0l-.324-.48-.317-.483a53.525 53.525 0 0 1-1.401-2.275c-.256-.441-.495-.87-.714-1.284C4.48 8.324 3.967 6.982 3.967 6a5 5 0 0 1 5-5Zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
            </svg>
            <span className="text-sm">Delivering to your location</span>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="relative w-full h-24 sm:h-32 md:h-40 lg:h-48 mb-6 rounded-2xl overflow-hidden shadow-lg">
          {bannerImages.map((src, idx) => (
            <img
              key={src}
              src={src}
              alt="Featured Promotions"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                idx === currentBanner ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-2 left-3 sm:bottom-4 sm:left-4 text-white">
            <h1 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold mb-1">
              What would you like to eat today?
            </h1>
            <p className="text-xs sm:text-sm opacity-90 hidden sm:block">Fresh, delicious meals delivered to you</p>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="sticky top-[60px] sm:top-[72px] z-20 bg-[#f5f7f8]/95 backdrop-blur-md border border-[#e0e4e7] rounded-2xl p-3 sm:p-4 mb-6 shadow-sm">
          {/* Search Bar */}
          <div className="mb-3 sm:mb-4">
            <div className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search for food..."
                className="daash-search-input"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#757d87]" 
                fill="currentColor" 
                viewBox="0 0 17 16"
              >
                <path fillRule="evenodd" d="M13.062 10.705a.426.426 0 0 1-.087-.55 5.387 5.387 0 1 0-1.677 1.743.426.426 0 0 1 .55.062l2.06 2.278a.637.637 0 0 0 .727.157c.458-.2.815-.583.984-1.053a.643.643 0 0 0-.197-.716l-2.36-1.921Zm-4.545.449A3.77 3.77 0 1 1 8.19 3.62a3.77 3.77 0 0 1 .327 7.534Z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
            <button
              onClick={() => handleCategorySelect(null)}
              className={`category-button whitespace-nowrap ${selectedCategory === null ? 'active' : ''}`}
            >
              All Items
            </button>
            {categoriesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="loading-skeleton h-8 w-20 rounded-full flex-shrink-0" />
              ))
            ) : (
              categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`category-button whitespace-nowrap ${selectedCategory === category.id ? 'active' : ''}`}
                >
                  {category.name}
                </button>
              ))
            )}
          </div>

          {/* Filter Options */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="daash-button-secondary text-sm border-none outline-none cursor-pointer flex-1"
            >
              <option value="">Sort by Price</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
            </select>
            <select
              value={promoFilter}
              onChange={(e) => setPromoFilter(e.target.value)}
              className="daash-button-secondary text-sm border-none outline-none cursor-pointer flex-1"
            >
              <option value="">All Offers</option>
              <option value="promo">Under ₦5,000</option>
            </select>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="menu-grid items-start">
          {loading && !products?.length ? (
            // Loading skeleton
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="daash-card p-3 sm:p-4">
                <div className="loading-skeleton h-40 sm:h-48 w-full rounded-xl mb-3 sm:mb-4" />
                <div className="loading-skeleton h-4 w-3/4 mb-2" />
                <div className="loading-skeleton h-3 w-1/2 mb-3" />
                <div className="loading-skeleton h-8 w-full rounded-full" />
              </div>
            ))
          ) : filteredFoodItems.length > 0 ? (
            filteredFoodItems.map((item) => (
              <div key={item.id} className="menu-item-card">
                <div className="relative">
                  <img
                    src={item.imageUrl || '/placeholder-food.jpg'}
                    alt={item.name}
                    className="menu-item-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-food.jpg';
                    }}
                  />
                  {item.price < 5000 && (
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Special
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-[#2c3137] mb-2 line-clamp-2 text-sm sm:text-base">
                    {item.name}
                  </h3>
                  
                  {item.description && (
                    <p className="text-[#757d87] text-xs sm:text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span className="text-base sm:text-lg font-bold text-[#2c3137]">
                      ₦{item.price.toLocaleString()}
                    </span>
                    {item.rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500 text-sm">★</span>
                        <span className="text-xs sm:text-sm text-[#757d87]">{item.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="daash-button-primary w-full text-xs sm:text-sm"
                    disabled={!item.isAvailable}
                  >
                    {item.isAvailable ? 'Add to Cart' : 'Unavailable'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            // Empty state
            <div className="col-span-full cart-empty-state">
              <div className="w-16 sm:w-24 h-16 sm:h-24 bg-[#eceff1] rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 sm:w-12 h-8 sm:h-12 text-[#757d87]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[#2c3137] mb-2">No items found</h3>
              <p className="text-[#757d87] mb-4 text-sm sm:text-base">
                {searchQuery 
                  ? `No results for "${searchQuery}". Try a different search term.`
                  : selectedCategory 
                    ? 'No items in this category. Try selecting a different category.'
                    : 'No items available at the moment.'
                }
              </p>
              {(searchQuery || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                  className="daash-button-secondary"
                >
                  Show All Items
                </button>
              )}
            </div>
          )}
        </div>

        {/* Load More Indicator */}
        {loadingMore && (
          <div className="flex justify-center py-6 sm:py-8">
            <div className="flex items-center gap-3 text-[#757d87]">
              <div className="w-5 sm:w-6 h-5 sm:h-6 border-2 border-[#eceff1] border-t-[#757d87] rounded-full animate-spin" />
              <span className="text-sm sm:text-base">Loading more items...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isRetrying && (
          <div className="daash-card p-4 sm:p-6 text-center">
            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 sm:w-8 h-6 sm:h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
            <p className="text-red-600 mb-4 text-sm sm:text-base">{typeof error === 'string' ? error : 'Unable to load menu items'}</p>
            <button
              onClick={() => refetch()}
              className="daash-button-primary"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
} 