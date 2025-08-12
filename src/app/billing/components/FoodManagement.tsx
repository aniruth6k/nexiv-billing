"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Clock, Leaf, Flame, Eye, EyeOff, UtensilsCrossed, ChefHat } from "lucide-react";
import { toast } from "sonner";

interface FoodItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  available: boolean;
  preparation_time?: number;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  spice_level?: string;
  sort_order?: number;
}

interface FoodManagementProps {
  hotelId: string;
}

const CATEGORIES = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { value: 'lunch', label: 'Lunch', emoji: '🍛' },
  { value: 'dinner', label: 'Dinner', emoji: '🌃' },
  { value: 'snacks', label: 'Snacks', emoji: '🍪' },
  { value: 'beverages', label: 'Beverages', emoji: '🥤' },
  { value: 'desserts', label: 'Desserts', emoji: '🍰' }
];

const SPICE_LEVELS = [
  { value: 'mild', label: 'Mild', icon: '🟢' },
  { value: 'medium', label: 'Medium', icon: '🟡' },
  { value: 'spicy', label: 'Spicy', icon: '🟠' },
  { value: 'very_spicy', label: 'Very Spicy', icon: '🔴' }
];

export default function FoodManagement({ hotelId }: FoodManagementProps) {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [updatingAvailability, setUpdatingAvailability] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    available: true,
    preparation_time: '15',
    is_vegetarian: true,
    is_vegan: false,
    spice_level: 'mild'
  });

  useEffect(() => {
    fetchFoodItems();
  }, [hotelId]);

  useEffect(() => {
    filterItems();
  }, [foodItems, selectedCategory, showUnavailable]);

  const fetchFoodItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("food_items")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("category", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setFoodItems(data || []);
    } catch (error) {
      console.error("Error fetching food items:", error);
      toast.error("Failed to load food items");
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...foodItems];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (!showUnavailable) {
      filtered = filtered.filter(item => item.available);
    }

    setFilteredItems(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const itemData = {
        ...formData,
        hotel_id: hotelId,
        price: parseFloat(formData.price),
        preparation_time: parseInt(formData.preparation_time) || 15
      };

      if (editingItem) {
        const { error } = await supabase
          .from("food_items")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Food item updated successfully");
      } else {
        const { error } = await supabase
          .from("food_items")
          .insert([itemData]);

        if (error) throw error;
        toast.success("Food item added successfully");
      }

      resetForm();
      fetchFoodItems();
    } catch (error) {
      console.error("Error saving food item:", error);
      toast.error("Failed to save food item");
    }
  };

  const handleEdit = (item: FoodItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      available: item.available,
      preparation_time: item.preparation_time?.toString() || '15',
      is_vegetarian: item.is_vegetarian || true,
      is_vegan: item.is_vegan || false,
      spice_level: item.spice_level || 'mild'
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (item: FoodItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("food_items")
        .delete()
        .eq("id", item.id);

      if (error) throw error;
      
      toast.success("Food item deleted successfully");
      fetchFoodItems();
    } catch (error) {
      console.error("Error deleting food item:", error);
      toast.error("Failed to delete food item");
    }
  };

  const toggleAvailability = async (item: FoodItem) => {
    try {
      setUpdatingAvailability(item.id);
      
      const { error } = await supabase
        .from("food_items")
        .update({ available: !item.available })
        .eq("id", item.id);

      if (error) throw error;

      setFoodItems(prevItems =>
        prevItems.map(prevItem =>
          prevItem.id === item.id 
            ? { ...prevItem, available: !prevItem.available }
            : prevItem
        )
      );
      
      toast.success(`${item.name} ${!item.available ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error("Error updating availability:", error);
      toast.error("Failed to update availability");
    } finally {
      setUpdatingAvailability(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      available: true,
      preparation_time: '15',
      is_vegetarian: true,
      is_vegan: false,
      spice_level: 'mild'
    });
    setEditingItem(null);
    setIsDialogOpen(false);
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

  const getStatistics = () => {
    const total = foodItems.length;
    const available = foodItems.filter(item => item.available).length;
    const unavailable = total - available;
    const categories = [...new Set(foodItems.map(item => item.category))].length;
    
    return { total, available, unavailable, categories };
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading food menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            Food Menu Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.available}</div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.unavailable}</div>
              <div className="text-sm text-gray-600">Hidden</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.categories}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <Label htmlFor="category-filter">Filter by Category:</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4" />
                    <span>All Categories</span>
                  </span>
                </SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center gap-2">
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="show-unavailable"
              checked={showUnavailable}
              onCheckedChange={setShowUnavailable}
            />
            <Label htmlFor="show-unavailable" className="text-sm">
              Show hidden items
            </Label>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Food Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Update the food item details below.' : 'Add a new food item to your menu.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Butter Chicken"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the dish"
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <span className="flex items-center gap-2">
                              <span>{cat.emoji}</span>
                              <span>{cat.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prep-time">Prep Time (min)</Label>
                    <Input
                      id="prep-time"
                      type="number"
                      min="1"
                      max="180"
                      value={formData.preparation_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, preparation_time: e.target.value }))}
                      placeholder="15"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="spice-level">Spice Level</Label>
                    <Select value={formData.spice_level} onValueChange={(value) => setFormData(prev => ({ ...prev, spice_level: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SPICE_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <span className="flex items-center gap-2">
                              <span>{level.icon}</span>
                              <span>{level.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="vegetarian">Vegetarian</Label>
                      <p className="text-xs text-gray-500 mt-1">No meat, fish, or poultry</p>
                    </div>
                    <Switch
                      id="vegetarian"
                      checked={formData.is_vegetarian}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_vegetarian: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="vegan">Vegan</Label>
                      <p className="text-xs text-gray-500 mt-1">No animal products</p>
                    </div>
                    <Switch
                      id="vegan"
                      checked={formData.is_vegan}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_vegan: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="available">Available</Label>
                      <p className="text-xs text-gray-500 mt-1">Show in billing menu</p>
                    </div>
                    <Switch
                      id="available"
                      checked={formData.available}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available: checked }))}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Food Items Grid */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No food items found</p>
            <p className="text-sm mb-6">
              {selectedCategory === 'all' 
                ? 'Add your first food item to get started'
                : `No ${CATEGORIES.find(c => c.value === selectedCategory)?.label.toLowerCase()} items available`
              }
            </p>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Food Item
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <Card key={item.id} className={`${!item.available ? 'opacity-60 border-orange-200' : ''} hover:shadow-md transition-all duration-200`}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-base leading-tight flex-1">
                        {item.name}
                      </h4>
                      <Badge className={`text-xs ${getCategoryColor(item.category)}`}>
                        {CATEGORIES.find(c => c.value === item.category)?.emoji}
                      </Badge>
                    </div>
                    
                    {!item.available && (
                      <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                        Hidden from menu
                      </Badge>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">₹{item.price}</span>
                      {item.preparation_time && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.preparation_time}min
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center flex-wrap gap-1">
                      {item.is_vegetarian && (
                        <Badge variant="outline" className="text-xs text-green-700 border-green-200">
                          <Leaf className="w-3 h-3 mr-1" />
                          Veg
                        </Badge>
                      )}
                      {item.is_vegan && (
                        <Badge variant="outline" className="text-xs text-green-800 border-green-300">
                          Vegan
                        </Badge>
                      )}
                      {item.spice_level && item.spice_level !== 'mild' && (
                        <Badge variant="outline" className="text-xs">
                          <Flame className="w-3 h-3 mr-1 text-orange-500" />
                          {SPICE_LEVELS.find(s => s.value === item.spice_level)?.label}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant={item.available ? "outline" : "default"}
                        onClick={() => toggleAvailability(item)}
                        disabled={updatingAvailability === item.id}
                        className="flex items-center gap-1 text-xs"
                      >
                        {updatingAvailability === item.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-300 border-t-gray-900"></div>
                        ) : item.available ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                        {item.available ? 'Hide' : 'Show'}
                      </Button>
                      
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(item)}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}