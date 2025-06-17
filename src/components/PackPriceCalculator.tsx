import React, { useState } from 'react';
import { usePackPrice } from '@/hooks/usePackPrice';
import { PackPriceItem } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calculator, Plus, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface PackPriceCalculatorProps {
  onPriceCalculated?: (price: number) => void;
  initialItems?: PackPriceItem[];
}

export const PackPriceCalculator: React.FC<PackPriceCalculatorProps> = ({
  onPriceCalculated,
  initialItems = []
}) => {
  const [items, setItems] = useState<PackPriceItem[]>(
    initialItems.length > 0 ? initialItems : [{ productId: 0, portions: 1 }]
  );
  
  const { calculatePrice, loading, error, result, reset } = usePackPrice();

  const addItem = () => {
    setItems([...items, { productId: 0, portions: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const updateItem = (index: number, field: keyof PackPriceItem, value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleCalculate = async () => {
    const validItems = items.filter(item => item.productId > 0 && item.portions > 0);
    
    if (validItems.length === 0) {
      return;
    }

    try {
      const result = await calculatePrice(validItems);
      // Calculate total pack price in kobo (keep in kobo for formatPrice)
      const totalPriceInKobo = result.reduce((sum, item) => sum + item.price, 0);
      
      if (onPriceCalculated) {
        onPriceCalculated(totalPriceInKobo); // Pass kobo to be consistent
      }
    } catch (err) {
      console.error('Error calculating pack price:', err);
    }
  };

  const handleReset = () => {
    reset();
    setItems([{ productId: 0, portions: 1 }]);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Pack Price Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items Input */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Order Items</label>
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-center">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Product ID"
                  value={item.productId || ''}
                  onChange={(e) => updateItem(index, 'productId', parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Portions"
                  value={item.portions || ''}
                  onChange={(e) => updateItem(index, 'portions', parseInt(e.target.value) || 1)}
                  min="1"
                />
              </div>
              {items.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          
          <Button variant="outline" onClick={addItem} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleCalculate} 
            disabled={loading || items.every(item => item.productId === 0)}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              'Calculate Pack Price'
            )}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-medium text-green-800">
              Pack Price Calculation Results ({result.length} pack{result.length !== 1 ? 's' : ''})
            </h3>
            
            {/* Pack Items Breakdown */}
            <div className="space-y-2">
              {result.map((packItem, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>
                    {packItem.name}
                  </span>
                  <span className="font-medium">{formatPrice(packItem.price)}</span>
                </div>
              ))}
            </div>
            
            <hr className="border-green-200" />
            
            {/* Total Pack Price */}
            <div className="space-y-1">
              <div className="flex justify-between font-medium text-green-800 text-lg pt-2 border-t border-green-200">
                <span>Total Pack Price:</span>
                <span>{formatPrice(result.reduce((sum, item) => sum + item.price, 0))}</span>
              </div>
            </div>
          </div>
        )}

        {/* API Request Example */}
        <details className="text-sm">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
            View API Request Example
          </summary>
          <div className="mt-2 p-3 bg-gray-50 rounded-md">
            <p className="font-medium mb-2">Endpoint: POST /v1/orders/packs</p>
            <pre className="text-xs overflow-x-auto">
{JSON.stringify({
  items: items.filter(item => item.productId > 0 && item.portions > 0)
}, null, 2)}
            </pre>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}; 