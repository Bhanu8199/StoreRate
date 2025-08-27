import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authenticatedApiRequest, getCurrentUser, updatePassword } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { updateProfileFormSchema, updatePasswordFormSchema, type UpdateProfileFormData, type UpdatePasswordFormData } from "@/lib/validation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Lock, Save } from "lucide-react";

export default function Profile() {
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();

  // Fetch user profile
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      const res = await authenticatedApiRequest('GET', '/api/user/profile');
      return res.json();
    },
  });

  // Profile form
  const profileForm = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileFormSchema),
    defaultValues: {
      name: "",
      address: "",
    },
  });

  // Password form
  const passwordForm = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile values when data loads - FIXED: Using useEffect instead of useState
  useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        name: userProfile.name || "",
        address: userProfile.address || "",
      });
    }
  }, [userProfile, profileForm]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileFormData) => {
      const res = await authenticatedApiRequest('PUT', '/api/user/profile', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onUpdateProfile = async (data: UpdateProfileFormData) => {
    try {
      setIsUpdatingProfile(true);
      await updateProfileMutation.mutateAsync(data);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onUpdatePassword = async (data: UpdatePasswordFormData) => {
    try {
      setIsUpdatingPassword(true);
      await updatePassword(data.currentPassword, data.newPassword);
      
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      
      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8" data-testid="profile-page">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your account information and security settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center" data-testid="tab-profile">
            <User className="mr-2 h-4 w-4" />
            Profile Information
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center" data-testid="tab-password">
            <Lock className="mr-2 h-4 w-4" />
            Password & Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Information Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your full name (20-60 characters)"
                              {...field}
                              data-testid="input-profile-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Email Address</label>
                      <Input
                        value={userProfile?.email || ""}
                        disabled
                        className="bg-gray-50"
                        data-testid="input-profile-email"
                      />
                      <p className="text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your address (max 400 characters)"
                            rows={3}
                            {...field}
                            data-testid="input-profile-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Account Type</label>
                    <Input
                      value={
                        userProfile?.role === 'admin' ? 'Administrator' :
                        userProfile?.role === 'store_owner' ? 'Store Owner' :
                        'Regular User'
                      }
                      disabled
                      className="bg-gray-50"
                      data-testid="input-profile-role"
                    />
                    <p className="text-xs text-gray-500">Account type cannot be changed</p>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isUpdatingProfile || updateProfileMutation.isPending}
                      data-testid="button-update-profile"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password & Security Tab */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
              <CardDescription>
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-6">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your current password"
                            {...field}
                            data-testid="input-current-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="8-16 chars, 1 uppercase, 1 special char"
                            {...field}
                            data-testid="input-new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirm your new password"
                            {...field}
                            data-testid="input-confirm-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Must be between 8-16 characters long</li>
                      <li>• Must contain at least one uppercase letter</li>
                      <li>• Must contain at least one special character (!@#$%^&*(),.?":{}|&lt;&gt;)</li>
                    </ul>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isUpdatingPassword}
                      data-testid="button-update-password"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}