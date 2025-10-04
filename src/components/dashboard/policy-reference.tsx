"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, BookOpen, Filter, ExternalLink, Calendar, User, Tag } from "lucide-react";
import type { PolicyDocument } from "@/lib/types";

interface PolicyReferenceProps {
  onPolicySelect?: (policy: PolicyDocument) => void;
}

export function PolicyReference({ onPolicySelect }: PolicyReferenceProps) {
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<PolicyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedDosha, setSelectedDosha] = useState<string>("all");
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyDocument | null>(null);

  useEffect(() => {
    loadPolicies();
  }, []);

  useEffect(() => {
    filterPolicies();
  }, [policies, searchQuery, selectedCategory, selectedSource, selectedDosha]);

  const loadPolicies = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/policies');
      if (response.ok) {
        const data = await response.json();
        setPolicies(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load policies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPolicies = () => {
    let filtered = policies;

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(policy =>
        policy.title.toLowerCase().includes(query) ||
        policy.summary.toLowerCase().includes(query) ||
        policy.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(policy => policy.category === selectedCategory);
    }

    // Source filter
    if (selectedSource !== "all") {
      filtered = filtered.filter(policy => policy.source === selectedSource);
    }

    // Dosha filter
    if (selectedDosha !== "all") {
      filtered = filtered.filter(policy => {
        switch (selectedDosha) {
          case 'vata':
            return policy.doshaRelevance?.vata;
          case 'pitta':
            return policy.doshaRelevance?.pitta;
          case 'kapha':
            return policy.doshaRelevance?.kapha;
          default:
            return true;
        }
      });
    }

    setFilteredPolicies(filtered);
  };

  const handlePolicyClick = (policy: PolicyDocument) => {
    setSelectedPolicy(policy);
    onPolicySelect?.(policy);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedSource("all");
    setSelectedDosha("all");
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      dietary_guidelines: "bg-green-100 text-green-800",
      treatment_protocols: "bg-blue-100 text-blue-800",
      seasonal_recommendations: "bg-orange-100 text-orange-800",
      dosha_management: "bg-purple-100 text-purple-800",
      food_combinations: "bg-yellow-100 text-yellow-800",
      lifestyle_guidance: "bg-indigo-100 text-indigo-800",
      preventive_care: "bg-teal-100 text-teal-800",
      therapeutic_diets: "bg-red-100 text-red-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      ministry_of_ayush: "bg-emerald-100 text-emerald-800",
      ccras: "bg-cyan-100 text-cyan-800",
      nimbu: "bg-violet-100 text-violet-800",
      classical_texts: "bg-amber-100 text-amber-800",
      research_studies: "bg-rose-100 text-rose-800",
      expert_consensus: "bg-slate-100 text-slate-800"
    };
    return colors[source] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            AYUSH Policy Reference
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Search and reference official Ministry of AYUSH policies and Ayurvedic guidelines
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search policies, guidelines, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="dietary_guidelines">Dietary Guidelines</SelectItem>
                  <SelectItem value="treatment_protocols">Treatment Protocols</SelectItem>
                  <SelectItem value="seasonal_recommendations">Seasonal</SelectItem>
                  <SelectItem value="dosha_management">Dosha Management</SelectItem>
                  <SelectItem value="food_combinations">Food Combinations</SelectItem>
                  <SelectItem value="therapeutic_diets">Therapeutic Diets</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="ministry_of_ayush">AYUSH</SelectItem>
                  <SelectItem value="ccras">CCRAS</SelectItem>
                  <SelectItem value="classical_texts">Classical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedDosha} onValueChange={setSelectedDosha}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Dosha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="vata">Vata</SelectItem>
                  <SelectItem value="pitta">Pitta</SelectItem>
                  <SelectItem value="kapha">Kapha</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              "Loading policies..."
            ) : (
              `Found ${filteredPolicies.length} polic${filteredPolicies.length === 1 ? 'y' : 'ies'}`
            )}
          </div>
        </CardContent>
      </Card>

      {/* Policy List */}
      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-secondary rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-secondary rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-secondary rounded w-full"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredPolicies.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No policies found matching your criteria.</p>
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredPolicies.map((policy) => (
            <Card key={policy.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{policy.title}</h3>
                    <p className="text-muted-foreground text-sm mb-3">{policy.summary}</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePolicyClick(policy)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          {policy.title}
                        </DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="space-y-4">
                          {/* Policy Metadata */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge className={getCategoryColor(policy.category)}>
                              {policy.category.replace('_', ' ')}
                            </Badge>
                            <Badge className={getSourceColor(policy.source)}>
                              {policy.source.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {policy.referenceNumber && (
                              <Badge variant="outline">
                                {policy.referenceNumber}
                              </Badge>
                            )}
                          </div>

                          {/* Key Principles */}
                          {policy.keyPrinciples && policy.keyPrinciples.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Key Principles:</h4>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                {policy.keyPrinciples.map((principle, index) => (
                                  <li key={index}>{principle}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Full Content */}
                          <div>
                            <h4 className="font-semibold mb-2">Full Content:</h4>
                            <div className="prose prose-sm max-w-none">
                              <pre className="whitespace-pre-wrap text-sm bg-secondary/50 p-4 rounded-lg">
                                {policy.fullContent}
                              </pre>
                            </div>
                          </div>

                          {/* Applicable Conditions */}
                          {policy.applicableConditions && policy.applicableConditions.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Applicable Conditions:</h4>
                              <div className="flex flex-wrap gap-2">
                                {policy.applicableConditions.map((condition, index) => (
                                  <Badge key={index} variant="secondary">
                                    {condition}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tags */}
                          {policy.tags && policy.tags.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Tags:</h4>
                              <div className="flex flex-wrap gap-2">
                                {policy.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="border-t pt-4 mt-6">
                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Effective: {policy.effectiveDate ? new Date(policy.effectiveDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Created by: {policy.createdBy}
                              </div>
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Policy Tags and Metadata */}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge className={getCategoryColor(policy.category)}>
                    {policy.category.replace('_', ' ')}
                  </Badge>
                  <Badge className={getSourceColor(policy.source)}>
                    {policy.source.replace('_', ' ').toUpperCase()}
                  </Badge>
                  {policy.doshaRelevance && (
                    <div className="flex gap-1">
                      {policy.doshaRelevance.vata && <Badge variant="outline" className="text-orange-600">V</Badge>}
                      {policy.doshaRelevance.pitta && <Badge variant="outline" className="text-red-600">P</Badge>}
                      {policy.doshaRelevance.kapha && <Badge variant="outline" className="text-blue-600">K</Badge>}
                    </div>
                  )}
                  <span className="text-muted-foreground ml-auto">
                    {policy.effectiveDate ? new Date(policy.effectiveDate.seconds * 1000).toLocaleDateString() : ''}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}