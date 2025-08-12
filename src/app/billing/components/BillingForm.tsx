"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Bed, UtensilsCrossed, Waves, Plus, Minus, AlertCircle, ShoppingCart, User, Leaf, Flame, Clock, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface BillingFormProps {
  hotelId: string;
}

interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: 'room' | 'food' | 'service';
  originalPrice: number;
}

interface RoomType {
  id: string;
  name: string;
  base_price: number;
  description?: string;
  max_occupancy?: number;
  amenities?: string[];
}

interface FoodItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  available: boolean;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  spice_level?: string;
  preparation_time?: number;
  sort_order?: number;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export default function BillingForm({ hotelId }: BillingFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedItems, setSelectedItems] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data from database
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);

  // Filter states for food
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<string>("all");

  const [roomData, setRoomData] = useState({
    type: "",
    nights: 1,
  });

  // Enhanced Food categories with all 6 categories
  const FOOD_CATEGORIES = [
    { value: 'all', label: 'All Items', emoji: '🍽️' },
    { value: 'breakfast', label: 'Breakfast', emoji: '🌅' },
    { value: 'lunch', label: 'Lunch', emoji: '🍛' },
    { value: 'dinner', label: 'Dinner', emoji: '🌃' },
    { value: 'snacks', label: 'Snacks', emoji: '🍪' },
    { value: 'beverages', label: 'Beverages', emoji: '🥤' },
    { value: 'desserts', label: 'Desserts', emoji: '🍰' }
  ];

  const SPICE_LEVELS = {
    'mild': { label: 'Mild', emoji: '🟢' },
    'medium': { label: 'Medium', emoji: '🟡' },
    'spicy': { label: 'Spicy', emoji: '🟠' },
    'very_spicy': { label: 'Very Spicy', emoji: '🔴' }
  };

  // Fetch data from database
  useEffect(() => {
    fetchData();
  }, [hotelId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomTypesResult, foodItemsResult, servicesResult] = await Promise.all([
        supabase
          .from("room_types")
          .select("*")
          .eq("hotel_id", hotelId)
          .eq("available", true)
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true }),
        supabase
          .from("food_items")
          .select("*")
          .eq("hotel_id", hotelId)
          .eq("available", true)
          .order("sort_order", { ascending: true })
          .order("category", { ascending: true })
          .order("name", { ascending: true }),
        supabase
          .from("services")
          .select("*")
          .eq("hotel_id", hotelId)
          .eq("available", true)
      ]);

      if (roomTypesResult.error) throw roomTypesResult.error;
      if (foodItemsResult.error) throw foodItemsResult.error;
      if (servicesResult.error) throw servicesResult.error;

      setRoomTypes(roomTypesResult.data || []);
      setFoodItems(foodItemsResult.data || []);
      setServices(servicesResult.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load billing data. Please refresh the page.");
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredFoodItems = () => {
    if (selectedFoodCategory === 'all') {
      return foodItems;
    }
    return foodItems.filter(item => item.category === selectedFoodCategory);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      breakfast: 'bg-orange-100 text-orange-800 border-orange-200',
      lunch: 'bg-green-100 text-green-800 border-green-200',
      dinner: 'bg-blue-100 text-blue-800 border-blue-200',
      snacks: 'bg-purple-100 text-purple-800 border-purple-200',
      beverages: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      desserts: 'bg-pink-100 text-pink-800 border-pink-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const addItem = (item: any, category: 'room' | 'food' | 'service', quantity = 1) => {
    const price = category === 'room' ? item.base_price || item.price : item.price;
    const finalPrice = category === 'room' ? price * roomData.nights : price;
    
    const newItem: BillItem = {
      id: `${category}-${item.id}-${Date.now()}`,
      name: category === 'room' ? `${item.name} (${roomData.nights} night${roomData.nights > 1 ? 's' : ''})` : item.name,
      price: finalPrice,
      originalPrice: price,
      quantity,
      category,
    };

    setSelectedItems(prev => [...prev, newItem]);
    toast.success(`${item.name} added to bill`);
    
    // Reset room selection after adding
    if (category === 'room') {
      setRoomData({ type: "", nights: 1 });
    }
  };

  const removeItem = (itemId: string) => {
    const item = selectedItems.find(i => i.id === itemId);
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
    if (item) {
      toast.success(`${item.name} removed from bill`);
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setSelectedItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity, price: item.originalPrice * quantity } : item
      )
    );
  };

  const getTotalAmount = () => {
    return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTax = () => {
    return getTotalAmount() * 0.18; // 18% GST
  };

  const getFinalTotal = () => {
    return getTotalAmount() + getTax();
  };

  const generateBillNumber = () => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `BILL-${timestamp}-${randomSuffix}`;
  };

  const saveBillToDatabase = async () => {
    setSaving(true);
    try {
      const billNumber = generateBillNumber();
      const subtotal = getTotalAmount();
      const taxAmount = getTax();
      const total = getFinalTotal();

      // Save main bill
      const { data: billData, error: billError } = await supabase
        .from("bills")
        .insert({
          hotel_id: hotelId,
          customer_name: customerName || "Walk-in Customer",
          customer_phone: customerPhone || null,
          bill_number: billNumber,
          subtotal: subtotal,
          tax_amount: taxAmount,
          total: total,
          items: selectedItems, // Legacy field for backward compatibility
          payment_method: "cash",
          payment_status: "paid"
        })
        .select()
        .single();

      if (billError) {
        throw new Error(`Failed to save bill: ${billError.message}`);
      }

      // Save individual bill items
      const billItems = selectedItems.map(item => ({
        bill_id: billData.id,
        hotel_id: hotelId,
        name: item.name,
        category: item.category,
        price: item.originalPrice,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from("bill_items")
        .insert(billItems);

      if (itemsError) {
        console.error("Error saving bill items:", itemsError);
        // Don't throw here as main bill is saved
      }

      return billData;
    } catch (error) {
      console.error("Error saving bill:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateBill = async () => {
    if (selectedItems.length === 0) {
      setError("Please add items to the bill");
      toast.error("Please add items to the bill");
      return;
    }

    if (!customerName.trim()) {
      setError("Please enter customer name");
      toast.error("Please enter customer name");
      return;
    }

    try {
      setError(null);
      await saveBillToDatabase();
      toast.success("Bill created successfully!");
      
      // Reset form
      setCustomerName("");
      setCustomerPhone("");
      setSelectedItems([]);
      setRoomData({ type: "", nights: 1 });
    } catch (error) {
      setError("Failed to save bill. Please try again.");
      toast.error("Failed to create bill");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Customer Info & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Item Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Add Items to Bill</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="rooms" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="rooms" className="flex items-center gap-2">
                    <Bed className="w-4 h-4" />
                    Rooms
                  </TabsTrigger>
                  <TabsTrigger value="food" className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4" />
                    Food & Dining
                  </TabsTrigger>
                  <TabsTrigger value="services" className="flex items-center gap-2">
                    <Waves className="w-4 h-4" />
                    Services
                  </TabsTrigger>
                </TabsList>

                {/* Rooms Section */}
                <TabsContent value="rooms" className="mt-4">
                  <div className="space-y-4">
                    {roomTypes.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Bed className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium mb-2">No room types available</p>
                        <p className="text-sm">Set up your room types in Settings first</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Room Type</Label>
                            <Select value={roomData.type} onValueChange={(value) => setRoomData(prev => ({ ...prev, type: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select room type" />
                              </SelectTrigger>
                              <SelectContent>
                                {roomTypes.map((room) => (
                                  <SelectItem key={room.id} value={room.id}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{room.name}</span>
                                      <span className="ml-2 text-green-600 font-medium">₹{room.base_price}/night</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Number of Nights</Label>
                            <Input
                              type="number"
                              min="1"
                              value={roomData.nights}
                              onChange={(e) => setRoomData(prev => ({ ...prev, nights: parseInt(e.target.value) || 1 }))}
                            />
                          </div>
                        </div>
                        
                        {/* Room Details Preview */}
                        {roomData.type && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            {(() => {
                              const selectedRoom = roomTypes.find(r => r.id === roomData.type);
                              if (!selectedRoom) return null;
                              
                              return (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold">{selectedRoom.name}</h4>
                                    <div className="text-right">
                                      <div className="text-sm text-gray-600">₹{selectedRoom.base_price} x {roomData.nights} night{roomData.nights > 1 ? 's' : ''}</div>
                                      <div className="text-lg font-bold text-green-600">₹{selectedRoom.base_price * roomData.nights}</div>
                                    </div>
                                  </div>
                                  
                                  {selectedRoom.description && (
                                    <p className="text-sm text-gray-600">{selectedRoom.description}</p>
                                  )}
                                  
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    {selectedRoom.max_occupancy && (
                                      <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        <span>Max {selectedRoom.max_occupancy} guests</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-sm font-medium text-gray-700">Amenities:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {selectedRoom.amenities.map((amenity) => (
                                          <Badge key={amenity} variant="secondary" className="text-xs">
                                            {amenity}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <Button 
                                    onClick={() => addItem(selectedRoom, 'room')}
                                    className="w-full mt-3"
                                  >
                                    Add Room - ₹{selectedRoom.base_price * roomData.nights}
                                  </Button>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </TabsContent>

                {/* Food Section */}
                <TabsContent value="food" className="mt-4">
                  <div className="space-y-4">
                    {/* Category Filter */}
                    <div className="flex items-center gap-4">
                      <Label>Category:</Label>
                      <Select value={selectedFoodCategory} onValueChange={setSelectedFoodCategory}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FOOD_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              <span className="flex items-center gap-2">
                                <span>{category.emoji}</span>
                                <span>{category.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Food Items List */}
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {getFilteredFoodItems().length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="font-medium mb-2">No food items available</p>
                          <p className="text-sm">
                            {selectedFoodCategory === 'all' 
                              ? 'Add food items using the Food Menu tab first'
                              : `No ${FOOD_CATEGORIES.find(c => c.value === selectedFoodCategory)?.label.toLowerCase()} items available`
                            }
                          </p>
                        </div>
                      ) : (
                        getFilteredFoodItems().map((food) => (
                          <Card key={food.id} className="hover:shadow-md transition-shadow duration-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-base">{food.name}</h4>
                                    <Badge className={`text-xs ${getCategoryColor(food.category)}`}>
                                      {FOOD_CATEGORIES.find(c => c.value === food.category)?.label}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 mb-2">
                                    <span className="text-lg font-bold text-green-600">₹{food.price}</span>
                                    {food.preparation_time && (
                                      <span className="text-sm text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {food.preparation_time} min
                                      </span>
                                    )}
                                  </div>

                                  {food.description && (
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{food.description}</p>
                                  )}

                                  <div className="flex items-center gap-2">
                                    {food.is_vegetarian && (
                                      <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                                        <Leaf className="w-3 h-3 mr-1" />
                                        Vegetarian
                                      </Badge>
                                    )}
                                    {food.is_vegan && (
                                      <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                                        Vegan
                                      </Badge>
                                    )}
                                    {food.spice_level && food.spice_level !== 'mild' && (
                                      <Badge variant="outline" className="text-xs">
                                        <Flame className="w-3 h-3 mr-1" />
                                        {SPICE_LEVELS[food.spice_level as keyof typeof SPICE_LEVELS]?.label}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  onClick={() => addItem(food, 'food')}
                                  className="ml-4 flex items-center gap-2"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Services Section */}
                <TabsContent value="services" className="mt-4">
                  <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                    {services.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Waves className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No services available</p>
                      </div>
                    ) : (
                      services.map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{service.name}</h4>
                            <p className="text-sm text-gray-600">₹{service.price}</p>
                            {service.description && (
                              <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addItem(service, 'service')}
                            variant="outline"
                          >
                            Add
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Bill Summary */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Current Bill
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No items added yet</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={item.category === 'room' ? 'default' : item.category === 'food' ? 'secondary' : 'outline'} className="text-xs">
                                {item.category}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-xs text-gray-600">₹{item.originalPrice} each</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-800 h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          {item.category !== 'room' && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center text-xs">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          <span className="font-semibold text-sm">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>₹{getTotalAmount().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (18% GST):</span>
                      <span>₹{getTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>₹{getFinalTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleGenerateBill}
                    className="w-full"
                    size="lg"
                    disabled={saving}
                  >
                    {saving ? "Creating Bill..." : "Create Bill"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}