// import { useState, useEffect } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { authenticatedApiRequest, getCurrentUser } from "@/lib/auth";
// import { useToast } from "@/hooks/use-toast";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Users, Store, Star, Plus, Search, Trash2, AlertCircle, RefreshCw } from "lucide-react";
// import { Skeleton } from "@/components/ui/skeleton";
// import AddUserModal from "@/components/add-user-modal";
// import AddStoreModal from "@/components/add-store-modal";

// interface Stats {
//   totalUsers: number;
//   totalStores: number;
//   totalRatings: number;
// }

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   role: string;
//   address: string;
// }

// interface StoreWithOwner {
//   id: string;
//   name: string;
//   address: string;
//   averageRating: number;
//   owner: {
//     name: string;
//     email: string;
//   };
// }

// export default function AdminDashboard() {
//   const [userSearch, setUserSearch] = useState("");
//   const [userRoleFilter, setUserRoleFilter] = useState("");
//   const [storeSearch, setStoreSearch] = useState("");
//   const [showAddUserModal, setShowAddUserModal] = useState(false);
//   const [showAddStoreModal, setShowAddStoreModal] = useState(false);
//   const { toast } = useToast();
//   const queryClient = useQueryClient();

//   // Debug authentication
//   useEffect(() => {
//     const currentUser = getCurrentUser();
//     console.log("Admin Dashboard - Current User:", currentUser);
//     if (!currentUser || currentUser.role !== 'admin') {
//       console.warn("Admin dashboard accessed by non-admin or unauthenticated user");
//     }
//   }, []);

//   // Fetch stats
//   const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<Stats>({
//     queryKey: ['/api/admin/stats'],
//     queryFn: async () => {
//       try {
//         console.log("Fetching admin stats");
//         const res = await authenticatedApiRequest('GET', '/api/admin/stats');
//         if (!res.ok) {
//           throw new Error(`Failed to fetch stats: ${res.status}`);
//         }
//         const data = await res.json();
//         console.log("Stats data:", data);
//         return data;
//       } catch (error) {
//         console.error("Error fetching stats:", error);
//         throw error;
//       }
//     },
//     retry: 2,
//     retryDelay: 1000,
//   });

//   // Fetch users
//   const { data: users, isLoading: usersLoading, error: usersError } = useQuery<User[]>({
//     queryKey: ['/api/admin/users', userSearch, userRoleFilter],
//     queryFn: async () => {
//       try {
//         const params = new URLSearchParams();
//         if (userSearch.trim()) params.append('search', userSearch.trim());
//         if (userRoleFilter) params.append('role', userRoleFilter);
        
//         console.log("Fetching users with params:", params.toString());
//         const res = await authenticatedApiRequest('GET', `/api/admin/users?${params.toString()}`);
//         if (!res.ok) {
//           throw new Error(`Failed to fetch users: ${res.status}`);
//         }
//         const data = await res.json();
//         console.log("Users data:", data);
//         return data;
//       } catch (error) {
//         console.error("Error fetching users:", error);
//         throw error;
//       }
//     },
//     retry: 2,
//     retryDelay: 1000,
//   });

//   // Fetch stores
//   const { data: stores, isLoading: storesLoading, error: storesError } = useQuery<StoreWithOwner[]>({
//     queryKey: ['/api/admin/stores'],
//     queryFn: async () => {
//       try {
//         console.log("Fetching stores");
//         const res = await authenticatedApiRequest('GET', '/api/admin/stores');
//         if (!res.ok) {
//           throw new Error(`Failed to fetch stores: ${res.status}`);
//         }
//         const data = await res.json();
//         console.log("Stores data:", data);
//         return data;
//       } catch (error) {
//         console.error("Error fetching stores:", error);
//         throw error;
//       }
//     },
//     retry: 2,
//     retryDelay: 1000,
//   });

//   // Handle query errors
//   useEffect(() => {
//     if (statsError) {
//       toast({
//         title: "Error",
//         description: "Failed to load statistics. Please refresh the page.",
//         variant: "destructive",
//       });
//     }
//   }, [statsError, toast]);

//   useEffect(() => {
//     if (usersError) {
//       toast({
//         title: "Error",
//         description: "Failed to load users. Please try again.",
//         variant: "destructive",
//       });
//     }
//   }, [usersError, toast]);

//   useEffect(() => {
//     if (storesError) {
//       toast({
//         title: "Error",
//         description: "Failed to load stores. Please try again.",
//         variant: "destructive",
//       });
//     }
//   }, [storesError, toast]);

//   // Delete user mutation
//   const deleteUserMutation = useMutation({
//     mutationFn: async (userId: string) => {
//       console.log("Deleting user:", userId);
//       const res = await authenticatedApiRequest('DELETE', `/api/admin/users/${userId}`);
//       if (!res.ok) {
//         throw new Error(`Failed to delete user: ${res.status}`);
//       }
//     },
//     onSuccess: () => {
//       toast({
//         title: "Success",
//         description: "User deleted successfully",
//       });
//       queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
//       queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
//     },
//     onError: (error: any) => {
//       console.error("Delete user error:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to delete user",
//         variant: "destructive",
//       });
//     },
//   });

//   // Delete store mutation
//   const deleteStoreMutation = useMutation({
//     mutationFn: async (storeId: string) => {
//       console.log("Deleting store:", storeId);
//       const res = await authenticatedApiRequest('DELETE', `/api/admin/stores/${storeId}`);
//       if (!res.ok) {
//         throw new Error(`Failed to delete store: ${res.status}`);
//       }
//     },
//     onSuccess: () => {
//       toast({
//         title: "Success",
//         description: "Store deleted successfully",
//       });
//       queryClient.invalidateQueries({ queryKey: ['/api/admin/stores'] });
//       queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
//     },
//     onError: (error: any) => {
//       console.error("Delete store error:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to delete store",
//         variant: "destructive",
//       });
//     },
//   });

//   const getRoleBadge = (role: string) => {
//     const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
//       admin: "destructive",
//       store_owner: "default",
//       user: "secondary",
//     };

//     const labels: Record<string, string> = {
//       admin: "Admin",
//       store_owner: "Store Owner",
//       user: "User",
//     };

//     return (
//       <Badge variant={variants[role] || "outline"}>
//         {labels[role] || role}
//       </Badge>
//     );
//   };

//   const renderStars = (rating: number) => {
//     return (
//       <div className="flex items-center">
//         {[1, 2, 3, 4, 5].map((star) => (
//           <Star
//             key={star}
//             className={`h-4 w-4 ${
//               star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
//             }`}
//           />
//         ))}
//         <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
//       </div>
//     );
//   };

//   const filteredStores = stores?.filter((store: StoreWithOwner) =>
//     store.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
//     store.address.toLowerCase().includes(storeSearch.toLowerCase())
//   ) || [];

//   const handleRefresh = () => {
//     queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
//     queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
//     queryClient.invalidateQueries({ queryKey: ['/api/admin/stores'] });
//     toast({
//       title: "Refreshing",
//       description: "Updating dashboard data...",
//     });
//   };

//   const handleDeleteUser = (userId: string, userName: string) => {
//     if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
//       deleteUserMutation.mutate(userId);
//     }
//   };

//   const handleDeleteStore = (storeId: string, storeName: string) => {
//     if (window.confirm(`Are you sure you want to delete store "${storeName}"? This action cannot be undone.`)) {
//       deleteStoreMutation.mutate(storeId);
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" data-testid="admin-dashboard">
//       <div className="mb-8 flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
//           <p className="mt-1 text-sm text-gray-600">Manage users, stores, and monitor platform activity</p>
//         </div>
//         <Button onClick={handleRefresh} variant="outline" size="sm">
//           <RefreshCw className="mr-2 h-4 w-4" />
//           Refresh
//         </Button>
//       </div>

//       {/* Stats Overview */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//         <Card>
//           <CardContent className="p-5">
//             <div className="flex items-center">
//               <div className="flex-shrink-0">
//                 <Users className="h-8 w-8 text-primary" />
//               </div>
//               <div className="ml-5 w-0 flex-1">
//                 <div className="text-sm font-medium text-gray-500">Total Users</div>
//                 {statsLoading || statsError ? (
//                   <div className="flex items-center">
//                     <Skeleton className="h-8 w-16" />
//                     {statsError && <AlertCircle className="h-4 w-4 text-red-500 ml-2" />}
//                   </div>
//                 ) : (
//                   <div className="text-2xl font-bold text-gray-900" data-testid="stat-users">
//                     {stats?.totalUsers || 0}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card>
//           <CardContent className="p-5">
//             <div className="flex items-center">
//               <div className="flex-shrink-0">
//                 <Store className="h-8 w-8 text-primary" />
//               </div>
//               <div className="ml-5 w-0 flex-1">
//                 <div className="text-sm font-medium text-gray-500">Total Stores</div>
//                 {statsLoading || statsError ? (
//                   <div className="flex items-center">
//                     <Skeleton className="h-8 w-16" />
//                     {statsError && <AlertCircle className="h-4 w-4 text-red-500 ml-2" />}
//                   </div>
//                 ) : (
//                   <div className="text-2xl font-bold text-gray-900" data-testid="stat-stores">
//                     {stats?.totalStores || 0}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card>
//           <CardContent className="p-5">
//             <div className="flex items-center">
//               <div className="flex-shrink-0">
//                 <Star className="h-8 w-8 text-primary" />
//               </div>
//               <div className="ml-5 w-0 flex-1">
//                 <div className="text-sm font-medium text-gray-500">Total Ratings</div>
//                 {statsLoading || statsError ? (
//                   <div className="flex items-center">
//                     <Skeleton className="h-8 w-16" />
//                     {statsError && <AlertCircle className="h-4 w-4 text-red-500 ml-2" />}
//                   </div>
//                 ) : (
//                   <div className="text-2xl font-bold text-gray-900" data-testid="stat-ratings">
//                     {stats?.totalRatings || 0}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Action Buttons */}
//       <div className="mb-6 flex flex-wrap gap-4">
//         <Button onClick={() => setShowAddUserModal(true)} data-testid="button-add-user">
//           <Plus className="mr-2 h-4 w-4" />
//           Add New User
//         </Button>
//         <Button 
//           onClick={() => setShowAddStoreModal(true)}
//           variant="outline"
//           data-testid="button-add-store"
//         >
//           <Store className="mr-2 h-4 w-4" />
//           Add New Store
//         </Button>
//       </div>

//       {/* Tabs */}
//       <Tabs defaultValue="users" className="space-y-6">
//         <TabsList className="grid w-full grid-cols-2">
//           <TabsTrigger value="users" data-testid="tab-users">
//             Users ({users?.length || 0})
//           </TabsTrigger>
//           <TabsTrigger value="stores" data-testid="tab-stores">
//             Stores ({filteredStores.length})
//           </TabsTrigger>
//         </TabsList>

//         {/* Users Tab */}
//         <TabsContent value="users">
//           <Card>
//             <CardHeader>
//               <div className="flex justify-between items-center">
//                 <CardTitle>All Users</CardTitle>
//                 <div className="flex space-x-4">
//                   <div className="relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                     <Input
//                       placeholder="Search users..."
//                       value={userSearch}
//                       onChange={(e) => setUserSearch(e.target.value)}
//                       className="pl-10"
//                       data-testid="input-search-users"
//                     />
//                   </div>
//                   <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
//                     <SelectTrigger className="w-40" data-testid="select-filter-role">
//                       <SelectValue placeholder="All Roles" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="">All Roles</SelectItem>
//                       <SelectItem value="user">Regular User</SelectItem>
//                       <SelectItem value="store_owner">Store Owner</SelectItem>
//                       <SelectItem value="admin">Admin</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//             </CardHeader>
//             <CardContent>
//               {usersError ? (
//                 <div className="text-center py-8">
//                   <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
//                   <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Users</h3>
//                   <p className="text-gray-600">Please try refreshing the page.</p>
//                 </div>
//               ) : usersLoading ? (
//                 <div className="space-y-4">
//                   {[1, 2, 3].map((i) => (
//                     <Skeleton key={i} className="h-16 w-full" />
//                   ))}
//                 </div>
//               ) : !users || users.length === 0 ? (
//                 <div className="text-center py-8">
//                   <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//                   <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
//                   <p className="text-gray-600">
//                     {userSearch || userRoleFilter 
//                       ? "Try adjusting your search filters" 
//                       : "No users available"
//                     }
//                   </p>
//                 </div>
//               ) : (
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Name</TableHead>
//                       <TableHead>Email</TableHead>
//                       <TableHead>Role</TableHead>
//                       <TableHead>Address</TableHead>
//                       <TableHead>Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {users.map((user) => (
//                       <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
//                         <TableCell className="font-medium">{user.name}</TableCell>
//                         <TableCell>{user.email}</TableCell>
//                         <TableCell>{getRoleBadge(user.role)}</TableCell>
//                         <TableCell className="max-w-xs truncate">{user.address}</TableCell>
//                         <TableCell>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => handleDeleteUser(user.id, user.name)}
//                             disabled={deleteUserMutation.isPending}
//                             data-testid={`button-delete-user-${user.id}`}
//                           >
//                             <Trash2 className="h-4 w-4" />
//                           </Button>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* Stores Tab */}
//         <TabsContent value="stores">
//           <Card>
//             <CardHeader>
//               <div className="flex justify-between items-center">
//                 <CardTitle>All Stores</CardTitle>
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                   <Input
//                     placeholder="Search stores..."
//                     value={storeSearch}
//                     onChange={(e) => setStoreSearch(e.target.value)}
//                     className="pl-10"
//                     data-testid="input-search-stores"
//                   />
//                 </div>
//               </div>
//             </CardHeader>
//             <CardContent>
//               {storesError ? (
//                 <div className="text-center py-8">
//                   <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
//                   <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Stores</h3>
//                   <p className="text-gray-600">Please try refreshing the page.</p>
//                 </div>
//               ) : storesLoading ? (
//                 <div className="space-y-4">
//                   {[1, 2, 3].map((i) => (
//                     <Skeleton key={i} className="h-16 w-full" />
//                   ))}
//                 </div>
//               ) : filteredStores.length === 0 ? (
//                 <div className="text-center py-8">
//                   <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//                   <h3 className="text-lg font-medium text-gray-900 mb-2">No Stores Found</h3>
//                   <p className="text-gray-600">
//                     {storeSearch 
//                       ? "Try adjusting your search filters" 
//                       : "No stores available"
//                     }
//                   </p>
//                 </div>
//               ) : (
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Store Name</TableHead>
//                       <TableHead>Owner Email</TableHead>
//                       <TableHead>Address</TableHead>
//                       <TableHead>Rating</TableHead>
//                       <TableHead>Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {filteredStores.map((store) => (
//                       <TableRow key={store.id} data-testid={`store-row-${store.id}`}>
//                         <TableCell className="font-medium">{store.name}</TableCell>
//                         <TableCell>{store.owner.email}</TableCell>
//                         <TableCell className="max-w-xs truncate">{store.address}</TableCell>
//                         <TableCell>
//                           {renderStars(store.averageRating || 0)}
//                         </TableCell>
//                         <TableCell>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => handleDeleteStore(store.id, store.name)}
//                             disabled={deleteStoreMutation.isPending}
//                             data-testid={`button-delete-store-${store.id}`}
//                           >
//                             <Trash2 className="h-4 w-4" />
//                           </Button>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>

//       {/* Modals */}
//       <AddUserModal
//         isOpen={showAddUserModal}
//         onClose={() => setShowAddUserModal(false)}
//       />
//       <AddStoreModal
//         isOpen={showAddStoreModal}
//         onClose={() => setShowAddStoreModal(false)}
//       />
//     </div>
//   );
// }


import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authenticatedApiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Store, Star, Plus, Search, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import AddUserModal from "@/components/add-user-modal";
import AddStoreModal from "@/components/add-store-modal";

export default function AdminDashboard() {
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const res = await authenticatedApiRequest('GET', '/api/admin/stats');
      return res.json();
    },
  });

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users', userSearch, userRoleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userSearch) params.append('search', userSearch);
      if (userRoleFilter) params.append('role', userRoleFilter);
      
      const res = await authenticatedApiRequest('GET', `/api/admin/users?${params.toString()}`);
      return res.json();
    },
  });

  // Fetch stores
  const { data: stores, isLoading: storesLoading } = useQuery({
    queryKey: ['/api/admin/stores'],
    queryFn: async () => {
      const res = await authenticatedApiRequest('GET', '/api/admin/stores');
      return res.json();
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await authenticatedApiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete store mutation
  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId: string) => {
      await authenticatedApiRequest('DELETE', `/api/admin/stores/${storeId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Store deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      admin: "destructive",
      store_owner: "default",
      user: "secondary",
    };

    const labels: Record<string, string> = {
      admin: "Admin",
      store_owner: "Store Owner",
      user: "User",
    };

    return (
      <Badge variant={variants[role] || "outline"}>
        {labels[role] || role}
      </Badge>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const filteredStores = stores?.filter((store: any) =>
    store.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
    store.address.toLowerCase().includes(storeSearch.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" data-testid="admin-dashboard">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Manage users, stores, and monitor platform activity</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <div className="text-sm font-medium text-gray-500">Total Users</div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-gray-900" data-testid="stat-users">
                    {stats?.totalUsers || 0}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <div className="text-sm font-medium text-gray-500">Total Stores</div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-gray-900" data-testid="stat-stores">
                    {stats?.totalStores || 0}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <div className="text-sm font-medium text-gray-500">Total Ratings</div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-gray-900" data-testid="stat-ratings">
                    {stats?.totalRatings || 0}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-4">
        <Button onClick={() => setShowAddUserModal(true)} data-testid="button-add-user">
          <Plus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
        <Button 
          onClick={() => setShowAddStoreModal(true)}
          variant="outline"
          data-testid="button-add-store"
        >
          <Store className="mr-2 h-4 w-4" />
          Add New Store
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
          <TabsTrigger value="stores" data-testid="tab-stores">Stores</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>All Users</CardTitle>
                <div className="flex space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-users"
                    />
                  </div>
                  <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                    <SelectTrigger className="w-40" data-testid="select-filter-role">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Roles</SelectItem>
                      <SelectItem value="user">Regular User</SelectItem>
                      <SelectItem value="store_owner">Store Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user: any) => (
                      <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell className="max-w-xs truncate">{user.address}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteUserMutation.mutate(user.id)}
                            disabled={deleteUserMutation.isPending}
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stores Tab */}
        <TabsContent value="stores">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>All Stores</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search stores..."
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-stores"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {storesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store Name</TableHead>
                      <TableHead>Owner Email</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStores?.map((store: any) => (
                      <TableRow key={store.id} data-testid={`store-row-${store.id}`}>
                        <TableCell className="font-medium">{store.name}</TableCell>
                        <TableCell>{store.owner.email}</TableCell>
                        <TableCell className="max-w-xs truncate">{store.address}</TableCell>
                        <TableCell>
                          {renderStars(store.averageRating || 0)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteStoreMutation.mutate(store.id)}
                            disabled={deleteStoreMutation.isPending}
                            data-testid={`button-delete-store-${store.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
      />
      <AddStoreModal
        isOpen={showAddStoreModal}
        onClose={() => setShowAddStoreModal(false)}
      />
    </div>
  );
}

export default AdminDashboard;