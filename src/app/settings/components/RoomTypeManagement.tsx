"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, Users, Eye, EyeOff, Bed, DollarSign, Home, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface RoomType {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  max_occupancy: number;
  amenities: string[];
  available: boolean;
  sort_order: number;
}

interface RoomTypeManagementProps {
  hotelId: string;
}

const COMMON_AMENITIES = [
  "WiFi",
  "AC",
  "TV",
  "Bathroom",
  "Mini Bar",
  "Balcony",
  "Living Area",
  "Kitchen",
  "Refrigerator",
  "Safe",
  "Hair Dryer",
  "Iron",
  "Coffee Maker",
  "Room Service",
  "Laundry",
  "Housekeeping"
];

export default function RoomTypeManagement({ hotelId }: RoomTypeManagementProps) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [filteredRoomTypes, setFilteredRoomTypes] = useState<RoomType[]>([]);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
  const [updatingAvailability, setUpdatingAvailability] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    max_occupancy: '2',
    amenities: [] as string[],
    available: true,
    sort_order: '0'
  });

  const supabase = createClient();

  useEffect(() => {
    if (hotelId) {
      fetchRoomTypes();
    }
  }, [hotelId]);

  useEffect(() => {
    filterRoomTypes();
  }, [roomTypes, showUnavailable]);

  const fetchRoomTypes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("Fetching room types for hotel:", hotelId);

      const { data, error } = await supabase
        .from("room_types")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Room types fetched successfully:", data);

      const formattedData = (data || []).map(item => ({
        ...item,
        amenities: Array.isArray(item.amenities) ? item.amenities : []
      }));

      setRoomTypes(formattedData);
    } catch (error: any) {
      console.error("Error fetching room types:", error);
      
      let errorMessage = "Failed to load room types";
      
      if (error?.message) {
        errorMessage = `Failed to load room types: ${error.message}`;
      } else if (error?.code) {
        errorMessage = `Failed to load room types: Error ${error.code}`;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const filterRoomTypes = () => {
    let filtered = [...roomTypes];

    if (!showUnavailable) {
      filtered = filtered.filter(roomType => roomType.available);
    }

    setFilteredRoomTypes(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.base_price) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (parseFloat(formData.base_price) <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    try {
      const roomTypeData = {
        ...formData,
        hotel_id: hotelId,
        base_price: parseFloat(formData.base_price),
        max_occupancy: parseInt(formData.max_occupancy) || 2,
        sort_order: parseInt(formData.sort_order) || 0,
        amenities: formData.amenities
      };

      if (editingRoomType) {
        const { error } = await supabase
          .from("room_types")
          .update(roomTypeData)
          .eq("id", editingRoomType.id);

        if (error) throw error;
        toast.success("Room type updated successfully");
      } else {
        const { error } = await supabase
          .from("room_types")
          .insert([roomTypeData]);

        if (error) throw error;
        toast.success("Room type added successfully");
      }

      resetForm();
      fetchRoomTypes();
    } catch (error: any) {
      console.error("Error saving room type:", error);
      if (error.code === '23505') {
        toast.error("A room type with this name already exists");
      } else {
        toast.error(`Failed to save room type: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleEdit = (roomType: RoomType) => {
    setEditingRoomType(roomType);
    setFormData({
      name: roomType.name,
      description: roomType.description || '',
      base_price: roomType.base_price.toString(),
      max_occupancy: roomType.max_occupancy.toString(),
      amenities: roomType.amenities || [],
      available: roomType.available,
      sort_order: roomType.sort_order.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (roomType: RoomType) => {
    if (!confirm(`Are you sure you want to delete "${roomType.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("room_types")
        .delete()
        .eq("id", roomType.id);

      if (error) throw error;
      
      toast.success("Room type deleted successfully");
      fetchRoomTypes();
    } catch (error: any) {
      console.error("Error deleting room type:", error);
      toast.error(`Failed to delete room type: ${error.message || 'Unknown error'}`);
    }
  };

  const toggleAvailability = async (roomType: RoomType) => {
    try {
      setUpdatingAvailability(roomType.id);
      
      const { error } = await supabase
        .from("room_types")
        .update({ available: !roomType.available })
        .eq("id", roomType.id);

      if (error) throw error;

      setRoomTypes(prevRoomTypes =>
        prevRoomTypes.map(prevRoomType =>
          prevRoomType.id === roomType.id 
            ? { ...prevRoomType, available: !prevRoomType.available }
            : prevRoomType
        )
      );
      
      toast.success(`${roomType.name} ${!roomType.available ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      console.error("Error updating availability:", error);
      toast.error(`Failed to update availability: ${error.message || 'Unknown error'}`);
    } finally {
      setUpdatingAvailability(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      base_price: '',
      max_occupancy: '2',
      amenities: [],
      available: true,
      sort_order: '0'
    });
    setEditingRoomType(null);
    setIsDialogOpen(false);
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const getStatistics = () => {
    const total = roomTypes.length;
    const available = roomTypes.filter(roomType => roomType.available).length;
    const unavailable = total - available;
    const avgPrice = total > 0 ? roomTypes.reduce((sum, rt) => sum + rt.base_price, 0) / total : 0;
    
    return { total, available, unavailable, avgPrice };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room types...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="text-center py-12">
          <Button onClick={fetchRoomTypes} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const stats = getStatistics();

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Room Type Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Types</div>
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
              <div className="text-2xl font-bold text-purple-600">₹{stats.avgPrice.toFixed(0)}</div>
              <div className="text-sm text-gray-600">Avg. Price</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center space-x-4">
          <Switch
            id="show-unavailable"
            checked={showUnavailable}
            onCheckedChange={setShowUnavailable}
          />
          <Label htmlFor="show-unavailable" className="text-sm">
            Show hidden room types
          </Label>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Room Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRoomType ? 'Edit Room Type' : 'Add New Room Type'}
              </DialogTitle>
              <DialogDescription>
                {editingRoomType ? 'Update the room type details below.' : 'Create a new room type for your hotel.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Room Type Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Standard Room, Deluxe Suite"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the room type"
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="base_price">Base Price (₹/night) *</Label>
                    <Input
                      id="base_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.base_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
                      placeholder="1500.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_occupancy">Max Occupancy</Label>
                    <Select value={formData.max_occupancy} onValueChange={(value) => setFormData(prev => ({ ...prev, max_occupancy: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'Guest' : 'Guests'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sort_order">Display Order</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      min="0"
                      value={formData.sort_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Amenities</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {COMMON_AMENITIES.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`amenity-${amenity}`}
                          checked={formData.amenities.includes(amenity)}
                          onChange={() => toggleAmenity(amenity)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor={`amenity-${amenity}`} className="text-sm font-normal">
                          {amenity}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <Label htmlFor="available">Available for Booking</Label>
                    <p className="text-xs text-gray-500 mt-1">Show this room type in the billing system</p>
                  </div>
                  <Switch
                    id="available"
                    checked={formData.available}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available: checked }))}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRoomType ? 'Update Room Type' : 'Add Room Type'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Room Types Grid */}
      <div className="space-y-4">
        {filteredRoomTypes.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Bed className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No room types found</p>
            <p className="text-sm mb-6">
              {showUnavailable ? 'Add your first room type to get started' : 'No available room types. Try showing hidden room types.'}
            </p>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Room Type
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredRoomTypes.map((roomType) => (
              <Card key={roomType.id} className={`${!roomType.available ? 'opacity-60 border-orange-200' : ''} hover:shadow-md transition-all duration-200`}>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-lg leading-tight flex-1">
                        {roomType.name}
                      </h4>
                      {!roomType.available && (
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                          Hidden
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-xl font-bold text-green-600">₹{roomType.base_price}</span>
                        <span className="text-sm text-gray-500">/night</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">Max {roomType.max_occupancy}</span>
                      </div>
                    </div>

                    {roomType.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {roomType.description}
                      </p>
                    )}

                    {roomType.amenities.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-700">Amenities:</p>
                        <div className="flex flex-wrap gap-1">
                          {roomType.amenities.slice(0, 6).map((amenity) => (
                            <Badge key={amenity} variant="secondary" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                          {roomType.amenities.length > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{roomType.amenities.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant={roomType.available ? "outline" : "default"}
                        onClick={() => toggleAvailability(roomType)}
                        disabled={updatingAvailability === roomType.id}
                        className="flex items-center gap-1 text-xs"
                      >
                        {updatingAvailability === roomType.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-300 border-t-gray-900"></div>
                        ) : roomType.available ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                        {roomType.available ? 'Hide' : 'Show'}
                      </Button>
                      
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(roomType)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(roomType)}
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