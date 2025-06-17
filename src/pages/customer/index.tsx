'use client';

import CustomerLayout from '@/components/customer-layout';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { IconSearch, IconStar } from '@/components/icons/Icons';
import Image from 'next/image';

export default function CustomerHomePage() {
  const { products, loading, error } = useProducts();
  const { addItem } = useCart();

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#B2151B]" />
        </div>
      </CustomerLayout>
    );
  }

  if (error) {
    return (
      <CustomerLayout>
        <div className="text-center py-10">
          <p className="text-red-500">Failed to load menu items. Please try again later.</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Provide the best food for you</h1>
          <p className="text-gray-600">New York City</p>
        </div>

        {/* Search Section */}
        <div className="relative mb-8">
          <IconSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for food..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#B2151B]"
          />
        </div>

        {/* Categories Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from(new Set(products.map(product => product.category.name))).map((categoryName) => (
              <div 
                key={categoryName} 
                className="p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              >
                <h3 className="text-lg font-semibold">{categoryName}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Products Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Menu Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    {product.rating && (
                      <div className="flex items-center">
                        <IconStar className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-600">{product.rating}</span>
                      </div>
                    )}
                  </div>
                  {product.description && (
                    <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[#B2151B] font-bold">${product.price}</span>
                    <button
                      onClick={() => addItem(product)}
                      disabled={!product.isAvailable}
                      className={`px-4 py-2 rounded-lg ${
                        product.isAvailable
                          ? 'bg-[#B2151B] text-white hover:bg-orange-600'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {product.isAvailable ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
} 