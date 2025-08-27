// Updated User Dashboard with proper authentication checks
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authenticatedApiRequest, getCurrentUser, useAuthState } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Star, Edit, MapPin, Store } from "lucide-react";
import RatingModal from "@/components/rating-modal";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";

interface Store {
  id: string;
  name: string;
  address: string;
  averageRating: number;
  totalRatings: number;
  owner: {
    name: string;
    email: string;
  };
  userRating: {
    id: string;
    ratingValue: number;
  } | null;
}

export default function UserDashboard() {
  const { isAuthenticated, currentUser } = useAuthState();
  const [nameSearch, setNameSearch] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();

  // Authentication guard
  if (!isAuthenticated || !currentUser || currentUser.role !== 'user') {
    console.log("UserDashboard: Authentication failed, redirecting to login");
    return <Redirect to="/login" />;
  }

  console.log("UserDashboard: Authenticated user:", currentUser);

  // Fetch stores
  const { data: stores, isLoading, error } = useQuery<Store[]>({
    queryKey: ['/api/stores', nameSearch, addressSearch],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (nameSearch.trim()) params.append('search', nameSearch.trim());
        if (addressSearch.trim()) params.append('address', addressSearch.trim());
        
        console.log("Fetching stores with params:", params.toString());
        const res = await authenticatedApiRequest('GET', `/api/stores?${params.toString()}`);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch stores: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Stores data:", data);
        return data;
      } catch (error) {
        console.error("Error fetching stores:", error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Handle query error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load stores. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleRateStore = (store: Store, editMode = false) => {
    console.log("Rating store:", store.name, "Edit mode:", editMode);
    setSelectedStore(store);
    setIsEditMode(editMode);
    setIsRatingModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsRatingModalOpen(false);
    setSelectedStore(null);
    setIsEditMode(false);
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
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const renderUserStars = (rating: number | undefined) => {
    if (!rating) return null;
    
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleClearFilters = () => {
    setNameSearch("");
    setAddressSearch("");
    console.log("Filters cleared");
  };

  const filteredStoresCount = stores?.length || 0;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" data-testid="user-dashboard">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {currentUser.name || currentUser.email}!</h1>
        <p className="mt-1 text-sm text-gray-600">
          Discover and rate local stores
          {filteredStoresCount > 0 && ` (${filteredStoresCount} stores found)`}
        </p>
      </div>

      {/* Search and Filter */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Stores
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name..."
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by address..."
                value={addressSearch}
                onChange={(e) => setAddressSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-address"
              />
            </div>
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="w-full"
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-2">Failed to load stores</div>
            <p className="text-gray-600">Please check your connection and try again.</p>
          </CardContent>
        </Card>
      )}

      {/* Stores Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="border-t pt-4">
                  <Skeleton className="h-4 w-1/3 mb-3" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !stores || stores.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stores found</h3>
            <p className="text-gray-600">
              {nameSearch || addressSearch 
                ? "Try adjusting your search filters" 
                : "No stores available at the moment"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Card 
              key={store.id} 
              className="hover:shadow-lg transition-shadow duration-200" 
              data-testid={`store-card-${store.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900" data-testid={`store-name-${store.id}`}>
                    {store.name}
                  </h3>
                  <div className="flex items-center">
                    {renderStars(store.averageRating)}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 flex items-start">
                  <MapPin className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                  {store.address}
                </p>

                <div className="text-xs text-gray-500 mb-4">
                  {store.totalRatings} rating{store.totalRatings !== 1 ? 's' : ''}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Your Rating:</span>
                    {store.userRating ? (
                      <div className="flex items-center space-x-2">
                        {renderUserStars(store.userRating.ratingValue)}
                        <span className="text-sm text-gray-600">
                          ({store.userRating.ratingValue}/5)
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not rated yet</span>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleRateStore(store, false)}
                      className="flex-1"
                      data-testid={`button-rate-${store.id}`}
                    >
                      <Star className="mr-1 h-4 w-4" />
                      {store.userRating ? 'Rate Again' : 'Rate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRateStore(store, true)}
                      disabled={!store.userRating}
                      className="flex-1"
                      data-testid={`button-edit-${store.id}`}
                    >
                      <Edit className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rating Modal */}
      {selectedStore && (
        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={handleCloseModal}
          store={{
            id: selectedStore.id,
            name: selectedStore.name,
            address: selectedStore.address,
          }}
          currentRating={selectedStore.userRating?.ratingValue || 0}
          isEdit={isEditMode && !!selectedStore.userRating}
        />
      )}
    </div>
  );
}

// Updated Owner Dashboard with proper authentication checks
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authenticatedApiRequest, getCurrentUser, useAuthState } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Star, User, MapPin, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";

interface StoreRating {
  id: string;
  ratingValue: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface StoreWithRatings {
  id: string;
  name: string;
  address: string;
  ratings: StoreRating[];
  averageRating: number;
}

export function OwnerDashboard() {
  const { isAuthenticated, currentUser } = useAuthState();
  const { toast } = useToast();

  // Authentication guard
  if (!isAuthenticated || !currentUser || currentUser.role !== 'store_owner') {
    console.log("OwnerDashboard: Authentication failed, redirecting to login");
    return <Redirect to="/login" />;
  }

  console.log("OwnerDashboard: Authenticated store owner:", currentUser);

  // Fetch store with ratings
  const { data: store, isLoading, error } = useQuery<StoreWithRatings>({
    queryKey: ['/api/stores/my-store'],
    queryFn: async () => {
      try {
        console.log("Fetching store data for owner");
        const res = await authenticatedApiRequest('GET', '/api/stores/my-store');
        
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Store not found. Please contact an administrator to set up your store.");
          }
          throw new Error(`Failed to fetch store: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Store data:", data);
        return data;
      } catch (error) {
        console.error("Error fetching store:", error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Handle query error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to load store data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const renderStars = (rating: number, size: "sm" | "lg" = "sm") => {
    const starSize = size === "lg" ? "h-5 w-5" : "h-4 w-4";
    
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingDistribution = (ratings: StoreRating[]) => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    ratings.forEach((rating) => {
      distribution[rating.ratingValue as keyof typeof distribution]++;
    });

    return distribution;
  };

  const getRatingBadge = (rating: number) => {
    if (rating === 5) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (rating === 4) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (rating === 3) return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>;
    if (rating === 2) return <Badge className="bg-orange-100 text-orange-800">Below Average</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Store Not Found</h2>
            <p className="text-gray-600 mb-4">
              {error?.message || "Please contact an administrator to set up your store."}
            </p>
            <p className="text-sm text-gray-500">
              If you believe this is an error, please refresh the page or contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ratingDistribution = getRatingDistribution(store.ratings);
  const totalRatings = store.ratings.length;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" data-testid="owner-dashboard">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {currentUser.name || currentUser.email}!</h1>
        <p className="mt-1 text-sm text-gray-600">Monitor your store's ratings and customer feedback</p>
      </div>

      {/* Store Overview */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900" data-testid="store-name">
                {store.name}
              </h2>
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {store.address}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end mb-2">
                {renderStars(Math.round(store.averageRating || 0), "lg")}
                <span className="text-2xl font-bold text-gray-900 ml-3" data-testid="average-rating">
                  {store.averageRating ? store.averageRating.toFixed(1) : '0.0'}
                </span>
              </div>
              <p className="text-sm text-gray-600" data-testid="total-ratings">
                Based on {totalRatings} rating{totalRatings !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Rating Distribution */}
          {totalRatings > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[5, 4, 3, 2, 1].map((starCount) => (
                <div key={starCount} className="text-center">
                  <div className="text-lg font-semibold text-gray-900" data-testid={`count-${starCount}-stars`}>
                    {ratingDistribution[starCount as keyof typeof ratingDistribution]}
                  </div>
                  <div className="flex justify-center mb-1">
                    {renderStars(starCount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {starCount} Star{starCount !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Ratings */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          {store.ratings.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No ratings yet</h3>
              <p className="text-gray-600">Your store hasn't received any ratings yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {store.ratings
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((rating) => (
                  <div 
                    key={rating.id} 
                    className="border border-gray-200 rounded-lg p-4"
                    data-testid={`rating-${rating.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {rating.user.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {rating.user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getRatingBadge(rating.ratingValue)}
                        {renderStars(rating.ratingValue)}
                        <span className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}