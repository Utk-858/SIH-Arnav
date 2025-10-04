"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Edit, Trash2, Leaf, Apple, Wheat, Milk, Beef, ChefHat, Cookie, Coffee, Soup, RefreshCw } from "lucide-react";
import { AlternativeSuggestions } from "@/components/ui/alternative-suggestions";
import { foodDatabaseService, messMenusService } from "@/lib/firestore";
import { useAuth } from "@/lib/auth";
import type { FoodItem, MessMenu, MessMenuItem, NutritionalData, AyurvedicProperties } from "@/lib/types";

const getCategoryIcon = (category: FoodItem['category']) => {
  switch (category) {
    case 'Vegetable': return <Leaf className="h-4 w-4" />;
    case 'Fruit': return <Apple className="h-4 w-4" />;
    case 'Grain': return <Wheat className="h-4 w-4" />;
    case 'Dairy': return <Milk className="h-4 w-4" />;
    case 'Meat': return <Beef className="h-4 w-4" />;
    case 'Spice': return <ChefHat className="h-4 w-4" />;
    case 'Sweetener': return <Cookie className="h-4 w-4" />;
    case 'Beverage': return <Coffee className="h-4 w-4" />;
    default: return <Soup className="h-4 w-4" />;
  }
};

const getDoshaColor = (effect: string) => {
  switch (effect) {
    case 'Vata-pacifying': return 'bg-blue-100 text-blue-800';
    case 'Pitta-pacifying': return 'bg-red-100 text-red-800';
    case 'Kapha-pacifying': return 'bg-green-100 text-green-800';
    case 'Tridoshic': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

function FoodDatabaseBrowser({ onSelectFood }: { onSelectFood: (food: FoodItem) => void }) {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodItem['category'] | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFoods();
  }, [selectedCategory]);

  const loadFoods = async () => {
    try {
      setIsLoading(true);
      let foodData: FoodItem[];

      if (selectedCategory === 'all') {
        foodData = await foodDatabaseService.getAll();
      } else {
        foodData = await foodDatabaseService.getByCategory(selectedCategory);
      }

      // Filter by search term if provided
      if (searchTerm.trim()) {
        foodData = foodData.filter(food =>
          food.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setFoods(foodData);
    } catch (error) {
      console.error('Error loading food database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFoods();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search Foods</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-48">
          <Label>Category</Label>
          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Vegetable">Vegetables</SelectItem>
              <SelectItem value="Fruit">Fruits</SelectItem>
              <SelectItem value="Grain">Grains</SelectItem>
              <SelectItem value="Dairy">Dairy</SelectItem>
              <SelectItem value="Meat">Meat</SelectItem>
              <SelectItem value="Spice">Spices</SelectItem>
              <SelectItem value="Sweetener">Sweeteners</SelectItem>
              <SelectItem value="Beverage">Beverages</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto border rounded-lg">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading food database...</p>
          </div>
        ) : foods.length > 0 ? (
          <div className="p-4 space-y-2">
            {foods.map((food) => (
              <div key={food.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/50">
                <div className="flex items-center gap-3">
                  {getCategoryIcon(food.category)}
                  <div>
                    <p className="font-medium">{food.name}</p>
                    <div className="flex gap-1 mt-1">
                      {food.ayurvedicProperties.doshaEffect.map((effect) => (
                        <Badge key={effect} variant="outline" className={`text-xs ${getDoshaColor(effect)}`}>
                          {effect.replace('-pacifying', '')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button size="sm" onClick={() => onSelectFood(food)}>
                  Add to Menu
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No foods found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItemEditor({ item, onUpdate, onRemove }: {
  item: MessMenuItem;
  onUpdate: (updatedItem: MessMenuItem) => void;
  onRemove: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState(item);

  const handleSave = () => {
    onUpdate(editedItem);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input
              value={editedItem.name}
              onChange={(e) => setEditedItem({...editedItem, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantity</Label>
              <Input
                placeholder="e.g., 100g, 1 cup"
                value={editedItem.quantity || ''}
                onChange={(e) => setEditedItem({...editedItem, quantity: e.target.value})}
              />
            </div>
            <div>
              <Label>Portion</Label>
              <Select
                value={editedItem.portion || 'medium'}
                onValueChange={(value) => setEditedItem({...editedItem, portion: value as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              placeholder="Special preparation notes..."
              value={editedItem.notes || ''}
              onChange={(e) => setEditedItem({...editedItem, notes: e.target.value})}
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{item.name}</span>
          {item.quantity && <Badge variant="outline">{item.quantity}</Badge>}
          {item.portion && <Badge variant="secondary">{item.portion}</Badge>}
        </div>
        {item.notes && <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>}
        {item.ayurvedicProperties && (
          <div className="flex gap-1 mt-2">
            {item.ayurvedicProperties.doshaEffect.map((effect) => (
              <Badge key={effect} className={`text-xs ${getDoshaColor(effect)}`}>
                {effect.replace('-pacifying', '')}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <AlternativeSuggestions
          foodName={item.name}
          reason="Need alternative for mess menu item"
          trigger={
            <Button size="sm" variant="outline" title="Find alternatives">
              <RefreshCw className="h-4 w-4" />
            </Button>
          }
        />
        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="destructive" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function MessMenuManager() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [currentMenu, setCurrentMenu] = useState<MessMenu | null>(null);
  const [menuItems, setMenuItems] = useState<{
    breakfast: MessMenuItem[];
    lunch: MessMenuItem[];
    dinner: MessMenuItem[];
    snacks: MessMenuItem[];
  }>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showFoodBrowser, setShowFoodBrowser] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks'>('breakfast');

  useEffect(() => {
    loadTodayMenu();
  }, []);

  const loadTodayMenu = async () => {
    try {
      const hospitalId = userProfile?.hospitalId || 'default-hospital';
      const todayMenus = await messMenusService.getTodayMenu(hospitalId);
      if (todayMenus.length > 0) {
        const menu = todayMenus[0];
        setCurrentMenu(menu);
        setMenuItems(menu.meals);
      }
    } catch (error: any) {
      console.error('Error loading today\'s menu:', error);
      if (error.message && error.message.includes('requires an index')) {
        toast({
          title: "Index Building",
          description: "Database index is being created. Menu loading may be slower temporarily.",
          variant: "default",
        });
      }
    }
  };

  const addFoodToMeal = (food: FoodItem) => {
    const newItem: MessMenuItem = {
      foodId: food.id,
      name: food.name,
      isAvailable: true,
      nutritionalData: food.nutritionalData,
      ayurvedicProperties: food.ayurvedicProperties,
    };

    setMenuItems(prev => ({
      ...prev,
      [selectedMealType]: [...prev[selectedMealType], newItem]
    }));

    setShowFoodBrowser(false);
    toast({
      title: "Food Added",
      description: `${food.name} added to ${selectedMealType}`,
    });
  };

  const updateMenuItem = (mealType: keyof typeof menuItems, index: number, updatedItem: MessMenuItem) => {
    setMenuItems(prev => ({
      ...prev,
      [mealType]: prev[mealType].map((item, i) => i === index ? updatedItem : item)
    }));
  };

  const removeMenuItem = (mealType: keyof typeof menuItems, index: number) => {
    setMenuItems(prev => ({
      ...prev,
      [mealType]: prev[mealType].filter((_, i) => i !== index)
    }));
  };

  const saveMenu = async () => {
    try {
      setIsLoading(true);
      const hospitalId = userProfile?.hospitalId || 'default-hospital';

      const menuData = {
        hospitalId,
        date: new Date(),
        meals: menuItems,
        createdBy: 'hospital-admin', // Should come from auth context
        lastUpdated: new Date(),
        isActive: true,
        version: currentMenu ? currentMenu.version + 1 : 1,
      };

      if (currentMenu) {
        await messMenusService.update(currentMenu.id, menuData);
        toast({
          title: "Menu Updated",
          description: "Today's mess menu has been successfully updated.",
        });
      } else {
        const newMenu = await messMenusService.create(menuData);
        setCurrentMenu(newMenu);
        toast({
          title: "Menu Created",
          description: "Today's mess menu has been successfully created.",
        });
      }
    } catch (error) {
      console.error('Error saving menu:', error);
      toast({
        title: "Save Failed",
        description: "There was an error saving the menu. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateNutritionalSummary = () => {
    const summary = { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 };

    Object.values(menuItems).forEach(mealItems => {
      mealItems.forEach(item => {
        if (item.nutritionalData) {
          summary.totalCalories += item.nutritionalData.calories;
          summary.totalProtein += item.nutritionalData.protein;
          summary.totalCarbs += item.nutritionalData.carbohydrates;
          summary.totalFat += item.nutritionalData.fat;
        }
      });
    });

    return summary;
  };

  const nutritionalSummary = calculateNutritionalSummary();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Mess Menu Manager
          </CardTitle>
          <CardDescription>
            Create and manage today's mess menu with Ayurvedic properties and nutritional data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedMealType} onValueChange={(value) => setSelectedMealType(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
              <TabsTrigger value="lunch">Lunch</TabsTrigger>
              <TabsTrigger value="dinner">Dinner</TabsTrigger>
              <TabsTrigger value="snacks">Snacks</TabsTrigger>
            </TabsList>

            {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((mealType) => (
              <TabsContent key={mealType} value={mealType} className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium capitalize">{mealType} Items</h3>
                    <Dialog open={showFoodBrowser && selectedMealType === mealType} onOpenChange={setShowFoodBrowser}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedMealType(mealType)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Food
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add Food to {mealType}</DialogTitle>
                        </DialogHeader>
                        <FoodDatabaseBrowser onSelectFood={addFoodToMeal} />
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-2">
                    {menuItems[mealType].length > 0 ? (
                      menuItems[mealType].map((item, index) => (
                        <MenuItemEditor
                          key={`${item.name}-${index}`}
                          item={item}
                          onUpdate={(updatedItem) => updateMenuItem(mealType, index, updatedItem)}
                          onRemove={() => removeMenuItem(mealType, index)}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No items added to {mealType} yet.</p>
                        <p className="text-sm text-muted-foreground">Click "Add Food" to get started.</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Nutritional Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Nutritional Summary</CardTitle>
          <CardDescription>Approximate nutritional content for the entire day's menu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{nutritionalSummary.totalCalories}</p>
              <p className="text-sm text-muted-foreground">Calories</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{nutritionalSummary.totalProtein}g</p>
              <p className="text-sm text-muted-foreground">Protein</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{nutritionalSummary.totalCarbs}g</p>
              <p className="text-sm text-muted-foreground">Carbs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{nutritionalSummary.totalFat}g</p>
              <p className="text-sm text-muted-foreground">Fat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Menu */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Ready to save today's menu?</p>
              <p className="text-sm text-muted-foreground">
                This will {currentMenu ? 'update' : 'create'} the active menu for today.
              </p>
            </div>
            <Button onClick={saveMenu} disabled={isLoading} size="lg">
              {isLoading ? "Saving..." : currentMenu ? "Update Menu" : "Save Menu"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}