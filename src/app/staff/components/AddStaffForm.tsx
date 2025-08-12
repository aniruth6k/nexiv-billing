"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, User, Phone, MapPin, CreditCard, Briefcase } from "lucide-react";

interface AddStaffFormProps {
  hotelId: string;
  onSuccess?: () => void;
}

export default function AddStaffForm({ hotelId, onSuccess }: AddStaffFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    role: "",
    place: "",
    contact: "",
    email: "",
    emergency_contact: "",
    id_type: "",
    id_number: "",
    id_verification_notes: "",
    salary: "",
    joining_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const roles = [
    "Manager", "Receptionist", "Housekeeping", "Chef", "Waiter", 
    "Security", "Maintenance", "Driver", "Accountant", "Other"
  ];

  const idTypes = [
    "Aadhaar Card",
    "PAN Card", 
    "Driving License",
    "Voter ID",
    "Passport",
    "Other"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    
    if (!formData.role) {
      setError("Role is required");
      return false;
    }

    if (formData.age) {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 18 || age > 70) {
        setError("Age must be between 18 and 70");
        return false;
      }
    }

    if (formData.contact && formData.contact.length < 10) {
      setError("Contact number must be at least 10 digits");
      return false;
    }

    if (formData.email && !formData.email.includes('@')) {
      setError("Please enter a valid email address");
      return false;
    }

    if (!formData.id_type || !formData.id_number) {
      setError("ID verification details are required");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const staffData = {
        hotel_id: hotelId,
        name: formData.name.trim(),
        role: formData.role,
        age: formData.age ? parseInt(formData.age) : null,
        place: formData.place.trim() || null,
        contact: formData.contact.trim() || null,
        email: formData.email.trim() || null,
        emergency_contact: formData.emergency_contact.trim() || null,
        id_type: formData.id_type,
        id_number: formData.id_number.trim(),
        id_verification_notes: formData.id_verification_notes.trim() || null,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        joining_date: formData.joining_date,
        attendance: [],
        status: 'active',
        additional_info: {
          age: formData.age ? parseInt(formData.age) : null,
          place: formData.place.trim() || null,
          identification: `${formData.id_type}: ${formData.id_number.trim()}`
        }
      };

      const { data, error: insertError } = await supabase
        .from("staff")
        .insert(staffData)
        .select()
        .single();

      if (insertError) {
        console.error("Staff creation error:", insertError);
        setError(`Failed to add staff member: ${insertError.message}`);
        return;
      }

      setSuccess(true);
      
      // Reset form
      setFormData({
        name: "",
        age: "",
        role: "",
        place: "",
        contact: "",
        email: "",
        emergency_contact: "",
        id_type: "",
        id_number: "",
        id_verification_notes: "",
        salary: "",
        joining_date: new Date().toISOString().split('T')[0],
      });

      setTimeout(() => {
        onSuccess?.();
        router.refresh();
        setSuccess(false);
      }, 2000);

    } catch (error) {
      console.error("Unexpected error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Staff member added successfully! The page will refresh shortly.
        </AlertDescription>
      </Alert>
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

      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-blue-600" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter full name"
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age" className="text-sm font-medium">Age</Label>
              <Input
                id="age"
                type="number"
                min="18"
                max="70"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                placeholder="Enter age"
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">Role *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => handleInputChange("role", value)}
                disabled={loading}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="joining_date" className="text-sm font-medium">Joining Date</Label>
              <Input
                id="joining_date"
                type="date"
                value={formData.joining_date}
                onChange={(e) => handleInputChange("joining_date", e.target.value)}
                disabled={loading}
                className="h-11"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="w-5 h-5 text-green-600" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="contact" className="text-sm font-medium">Phone Number</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => handleInputChange("contact", e.target.value)}
                placeholder="Primary phone number"
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_contact" className="text-sm font-medium">Emergency Contact</Label>
              <Input
                id="emergency_contact"
                value={formData.emergency_contact}
                onChange={(e) => handleInputChange("emergency_contact", e.target.value)}
                placeholder="Emergency contact number"
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Email address"
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="place" className="text-sm font-medium">Address</Label>
              <Input
                id="place"
                value={formData.place}
                onChange={(e) => handleInputChange("place", e.target.value)}
                placeholder="Current address"
                disabled={loading}
                className="h-11"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ID Verification */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="w-5 h-5 text-purple-600" />
            ID Verification *
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="id_type" className="text-sm font-medium">ID Type *</Label>
              <Select 
                value={formData.id_type} 
                onValueChange={(value) => handleInputChange("id_type", value)}
                disabled={loading}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  {idTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_number" className="text-sm font-medium">ID Number *</Label>
              <Input
                id="id_number"
                value={formData.id_number}
                onChange={(e) => handleInputChange("id_number", e.target.value)}
                placeholder="Enter ID number"
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="id_verification_notes" className="text-sm font-medium">Additional Notes</Label>
              <Textarea
                id="id_verification_notes"
                value={formData.id_verification_notes}
                onChange={(e) => handleInputChange("id_verification_notes", e.target.value)}
                placeholder="Any additional verification notes or comments"
                rows={3}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment Details */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="w-5 h-5 text-orange-600" />
            Employment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="salary" className="text-sm font-medium">Monthly Salary (₹)</Label>
              <Input
                id="salary"
                type="number"
                value={formData.salary}
                onChange={(e) => handleInputChange("salary", e.target.value)}
                placeholder="Monthly salary amount"
                disabled={loading}
                className="h-11"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="pt-4">
        <Button 
          onClick={handleSubmit} 
          disabled={loading || !formData.name.trim() || !formData.role || !formData.id_type || !formData.id_number}
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          {loading ? "Adding Staff Member..." : "Add Staff Member"}
        </Button>
      </div>
    </div>
  );
}