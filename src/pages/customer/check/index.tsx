'use client';

import React from 'react';
import Image from 'next/image';
import { IconSearch, IconStar } from '../../../components/icons/Icons';
import CustomerLayout from '../../../components/customer-layout';

const categories = [
  { id: 'burger', name: 'Burger', image: '/images/burger-category.png', active: true },
  { id: 'taco', name: 'Taco', image: '/images/taco-category.png', active: false },
  { id: 'drink', name: 'Drink', image: '/images/drink-category.png', active: false },
  { id: 'pizza', name: 'Pizza', image: '/images/pizza-category.png', active: false },
];

const popularItems = [
  {
    id: 1,
    name: 'Ordinary Burgers',
    image: '/images/burger1.jpg',
    rating: 4.9,
    distance: '190m',
    price: 17.99,
  },
  {
    id: 2,
    name: 'Burger With Meat',
    image: '/images/burger2.jpg',
    rating: 4.9,
    distance: '190m',
    price: 17.99,
  },
];

export default function CustomerHomePage() {
  return (
    <CustomerLayout>
      <div className="px-5 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold mb-6">
            Provide the best food for you
          </h1>
          
          {/* Location */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">Your Location</div>
            <div className="flex items-center gap-2 text-base font-semibold">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" />
                <path d="M12 22C16 18 20 14.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 14.4183 8 18 12 22Z" />
              </svg>
              New York City
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Search"
            className="w-full h-12 pl-12 pr-4 rounded-full border border-gray-200 focus:outline-none focus:border-orange-500"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <IconSearch size={20} />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Find by Category</h2>
            <button className="text-orange-500 font-medium">See All</button>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-4">
            {categories.map((category) => (
              <div key={category.id} className="flex flex-col items-center gap-2 min-w-[80px]">
                <div className={`w-20 h-20 rounded-lg p-4 flex items-center justify-center ${
                  category.active ? 'bg-orange-500' : 'bg-white shadow-lg'
                }`}>
                  <Image 
                    src={category.image} 
                    alt={category.name} 
                    width={48} 
                    height={48} 
                    className="object-contain"
                  />
                </div>
                <span className={`text-sm font-medium ${
                  category.active ? 'text-black' : 'text-gray-500'
                }`}>
                  {category.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Items */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Popular Items</h2>
            <button className="text-orange-500 font-medium">See All</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {popularItems.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-xl shadow-lg">
                <div className="relative mb-2">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={200}
                    height={200}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F14141" strokeWidth="1.5">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>
                <h3 className="font-medium mb-1">{item.name}</h3>
                <div className="flex items-center justify-between text-sm mb-2">
                  <div className="flex items-center gap-1">
                    <IconStar size={16} className="text-orange-500" />
                    <span>{item.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" />
                      <path d="M12 22C16 18 20 14.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 14.4183 8 18 12 22Z" />
                    </svg>
                    {item.distance}
                  </div>
                </div>
                <div className="font-bold text-orange-500">${item.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
