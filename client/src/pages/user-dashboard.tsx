import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authenticatedApiRequest } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Star, Edit, MapPin } from "lucide-react";
import RatingModal from "@/components/rating-modal";

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
  const [nameSearch, setNameSearch] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch stores
  const { data: stores, isLoading } = useQuery<Store[]>({
    queryKey: ['/api/stores', nameSearch, addressSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (nameSearch) params.append('search', nameSearch);
      if (addressSearch) params.append('address', addressSearch);
      
      const res = await authenticatedApiRequest('GET', `/api/stores?${params.toString()}`);
      return res.json();
    },
  });

  const handleRateStore = (store: Store, editMode = false) => {
    setSelectedStore(store);
    setIsEditMode(editMode);
    setIsRatingModalOpen(true);
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

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" data-testid="user-dashboard">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Browse Stores</h1>
        <p className="mt-1 text-sm text-gray-600">Discover and rate local stores</p>
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
              onClick={() => {
                setNameSearch("");
                setAddressSearch("");
              }}
              variant="outline"
              className="w-full"
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

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
      ) : stores?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stores found</h3>
            <p className="text-gray-600">Try adjusting your search filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores?.map((store) => (
            <Card key={store.id} className="hover:shadow-lg transition-shadow duration-200" data-testid={`store-card-${store.id}`}>
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
                      renderUserStars(store.userRating.ratingValue)
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
          onClose={() => {
            setIsRatingModalOpen(false);
            setSelectedStore(null);
            setIsEditMode(false);
          }}
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
