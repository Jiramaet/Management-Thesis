"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Search, Filter, BookOpen, User, Calendar, Download, FileText, Tag, X, Eye, LayoutGrid, List, ChevronLeft, ChevronRight, Star, Shuffle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface IThesis {
  _id: string;
  thesis_id: string;
  title: string;
  abstract: string;
  category: string;
  year: string;
  keywords: string;
  status: string;
  file_path: string;
  department: string;
  isPublic: boolean;
  author: {
    firstName: string;
    lastName: string;
  };
  advisor: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  downloadCount?: number;
}

const CATEGORIES = [
  { value: "computer-science", label: "Computer Science" },
  { value: "engineering", label: "Engineering" },
  { value: "mathematics", label: "Mathematics" },
  { value: "physics", label: "Physics" },
  { value: "biology", label: "Biology" },
  { value: "chemistry", label: "Chemistry" },
  { value: "business", label: "Business" },
  { value: "psychology", label: "Psychology" },
  { value: "other", label: "Other" },
];


const YEARS = ["2025", "2024", "2023", "2022", "2021", "2020"];

export default function BrowsePage() {
  const [theses, setTheses] = useState<IThesis[]>([]) 
  const [filteredTheses, setFilteredTheses] = useState<IThesis[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("relevance")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]) 
  const [selectedYears, setSelectedYears] = useState<string[]>([])
  const [selectedAccess, setSelectedAccess] = useState<string[]>([])

  // New State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Featured Logic
  const [featuredTab, setFeaturedTab] = useState("popular");
  const [randomTheses, setRandomTheses] = useState<IThesis[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/query/thesis');
        const data = await res.json();
        if (data.success) {
          setTheses(data.theses);
          setFilteredTheses(data.theses);
        }
      } catch (error) {
        console.error("Failed to fetch theses:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (theses.length > 0) {
        // Generate random theses only once when theses are loaded
        const shuffled = [...theses].sort(() => 0.5 - Math.random());
        setRandomTheses(shuffled.slice(0, 3));
    }
  }, [theses]);

  const getCategoryLabel = (value: string) => {
    const cat = CATEGORIES.find(c => c.value === value);
    return cat ? cat.label : value || "Uncategorized";
  };

  useEffect(() => {
    let result = theses;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((thesis) => {
          const title = thesis.title || "";
          const abstract = thesis.abstract || "";
          const keywords = thesis.keywords || "";
          const thesisId = thesis.thesis_id || "";
          const authorName = thesis.author ? `${thesis.author.firstName} ${thesis.author.lastName}` : "";
          
          return (
            title.toLowerCase().includes(query) ||
            authorName.toLowerCase().includes(query) ||
            abstract.toLowerCase().includes(query) ||
            keywords.toLowerCase().includes(query) ||
            thesisId.toLowerCase().includes(query)
          )
      });
    }

    if (selectedCategories.length > 0) {
      result = result.filter((thesis) => selectedCategories.includes(thesis.category));
    }

    if (selectedYears.length > 0) {
      result = result.filter((thesis) => selectedYears.includes(thesis.year));
    }

    if (selectedAccess.length > 0) {
      result = result.filter((thesis) => {
        const status = thesis.isPublic ? "public" : "restricted";
        return selectedAccess.includes(status);
      });
    }

    if (sortBy === "date") {
      result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sortBy === "title") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    setFilteredTheses(result);
    setCurrentPage(1); // Reset to page 1 when filters change

  }, [searchQuery, selectedCategories, selectedYears, selectedAccess, sortBy, theses]);


  const toggleCategory = (value: string) => {
    setSelectedCategories(prev => 
      prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
    );
  };

  const toggleYear = (value: string) => {
    setSelectedYears(prev => 
      prev.includes(value) ? prev.filter(y => y !== value) : [...prev, value]
    );
  };

  const toggleAccess = (value: string) => {
    setSelectedAccess(prev => 
      prev.includes(value) ? prev.filter(a => a !== value) : [...prev, value]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedYears([]);
    setSelectedAccess([]);
    setSearchQuery("");
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTheses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTheses.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Featured Logic Helpers
  const mostPopularTheses = [...theses]
    .sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
    .slice(0, 3);

  const displayedFeatured = featuredTab === "popular" ? mostPopularTheses : randomTheses;

  const handleRefreshRandom = () => {
      const shuffled = [...theses].sort(() => 0.5 - Math.random());
      setRandomTheses(shuffled.slice(0, 3));
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["ID", "Title", "Author", "Advisor", "Year", "Category", "Status", "Downloads"];
    const rows = filteredTheses.map(t => [
      t.thesis_id,
      `"${t.title.replace(/"/g, '""')}"`, // Escape quotes
      `"${t.author?.firstName} ${t.author?.lastName}"`,
      `"${t.advisor?.firstName} ${t.advisor?.lastName}"`,
      t.year,
      t.category,
      t.status,
      t.downloadCount || 0
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "thesis_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
     return (
      <div className="flex items-center justify-center p-8 min-h-screen"> 
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Browse Theses</h1>
            <p className="text-muted-foreground">Discover and explore academic research from our repository</p>
          </div>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* Featured Section */}
        <section>
           <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-heading font-semibold flex items-center gap-2">
                 <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> Featured Research
               </h2>
               <Tabs defaultValue="popular" className="w-[300px]" onValueChange={setFeaturedTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="popular">Most Popular</TabsTrigger>
                    <TabsTrigger value="random">Discover</TabsTrigger>
                  </TabsList>
               </Tabs>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {displayedFeatured.map((thesis) => (
               <Card key={thesis._id} className="bg-gradient-to-br from-background to-muted/30 border-muted/60 hover:shadow-lg transition-all relative overflow-hidden">
                 {featuredTab === "popular" && (
                     <div className="absolute top-0 right-0 bg-yellow-500 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold shadow-sm">
                         Top Download
                     </div>
                 )}
                 <CardContent className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                       <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">{getCategoryLabel(thesis.category)}</Badge>
                       <span className="text-xs text-muted-foreground">{thesis.year}</span>
                    </div>
                    <Link href={thesis.isPublic ? `/dashboard/thesis-view/${thesis._id}` : `/dashboard/thesis/${thesis._id}`}>
                      <h3 className="font-bold text-lg leading-tight hover:text-primary transition-colors line-clamp-2 h-[3.5rem]">
                        {thesis.title}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                       <div className="flex items-center gap-2">
                           <User className="h-3 w-3" />
                           {thesis.author?.firstName} {thesis.author?.lastName}
                       </div>
                       {featuredTab === "popular" && (
                           <div className="flex items-center gap-1 text-xs">
                               <Download className="h-3 w-3" /> {thesis.downloadCount || 0}
                           </div>
                       )}
                    </div>
                 </CardContent>
               </Card>
             ))}
           </div>
           {featuredTab === "random" && (
               <div className="flex justify-center mt-4">
                   <Button variant="outline" size="sm" onClick={handleRefreshRandom}>
                       <Shuffle className="mr-2 h-3 w-3" /> Shuffle Suggestions
                   </Button>
               </div>
           )}
        </section>

        <Separator />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* --- Left Sidebar (Filters) --- */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Search */}
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Keywords, Title, ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    {searchQuery && (
                       <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                         <X className="h-4 w-4" />
                       </button>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Filter: Categories */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Categories</Label>
                  <div className="space-y-2">
                    {CATEGORIES.map((cat) => (
                      <div key={cat.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`cat-${cat.value}`} 
                          checked={selectedCategories.includes(cat.value)}
                          onCheckedChange={() => toggleCategory(cat.value)}
                        />
                        <label htmlFor={`cat-${cat.value}`} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                          {cat.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Filter: Year */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Publication Year</Label>
                  <div className="space-y-2">
                    {YEARS.map((year) => (
                      <div key={year} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`year-${year}`} 
                          checked={selectedYears.includes(year)}
                          onCheckedChange={() => toggleYear(year)}
                        />
                        <label htmlFor={`year-${year}`} className="text-sm leading-none cursor-pointer">
                          {year}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Filter: Access Level */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Access Level</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="access-public" 
                        checked={selectedAccess.includes("public")}
                        onCheckedChange={() => toggleAccess("public")}
                      />
                      <label htmlFor="access-public" className="text-sm leading-none cursor-pointer">Public</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="access-restricted" 
                        checked={selectedAccess.includes("restricted")}
                        onCheckedChange={() => toggleAccess("restricted")}
                      />
                      <label htmlFor="access-restricted" className="text-sm leading-none cursor-pointer">Restricted</label>
                    </div>
                  </div>
                </div>

                <Button onClick={clearFilters} variant="outline" className="w-full">
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* --- Right Content (Results) --- */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-background/50 p-2 rounded-lg border">
              <p className="text-sm text-muted-foreground pl-2">
                Showing <strong>{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredTheses.length)}</strong> of <strong>{filteredTheses.length}</strong> results
              </p>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-md bg-background">
                   <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-9 w-9 rounded-none rounded-l-md ${viewMode === 'grid' ? 'bg-muted' : ''}`}
                      onClick={() => setViewMode('grid')}
                   >
                      <LayoutGrid className="h-4 w-4" />
                   </Button>
                   <Separator orientation="vertical" className="h-9" />
                   <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-9 w-9 rounded-none rounded-r-md ${viewMode === 'list' ? 'bg-muted' : ''}`}
                      onClick={() => setViewMode('list')}
                   >
                      <List className="h-4 w-4" />
                   </Button>
                </div>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Sort by Relevance</SelectItem>
                    <SelectItem value="date">Sort by Date</SelectItem>
                    <SelectItem value="title">Sort by Title</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Grid/List */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {currentItems.length > 0 ? (
                  viewMode === 'grid' ? (
                    // GRID VIEW
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {currentItems.map((thesis) => (
                        <motion.div key={thesis._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
                            <CardContent className="p-6 flex-1 space-y-4">
                              <div className="flex justify-between items-start">
                                <Badge variant="secondary" className="font-normal">{getCategoryLabel(thesis.category)}</Badge>
                                <Badge variant={thesis.isPublic ? "outline" : "secondary"} className={thesis.isPublic ? "text-green-600 border-green-200 bg-green-50" : ""}>
                                  {thesis.isPublic ? "Public" : "Restricted"}
                                </Badge>
                              </div>
                              
                              <Link href={thesis.isPublic ? `/dashboard/thesis-view/${thesis._id}` : `/dashboard/thesis/${thesis._id}`} className="block group">
                                <h3 className="text-lg font-heading font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                  {thesis.title || "Untitled Thesis"}
                                </h3>
                              </Link>

                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {thesis.abstract || "No abstract available."}
                              </p>
                              
                              <div className="flex flex-wrap gap-2">
                                {thesis.keywords?.split(',').slice(0, 3).map((keyword, index) => (
                                  <Badge key={index} variant="outline" className="text-[10px] px-1.5 py-0">
                                    {keyword.trim()}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                            <CardFooter className="p-6 pt-0 flex flex-col gap-3">
                               <Separator />
                               <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span className="truncate max-w-[100px]">{thesis.author?.firstName}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {thesis.year}
                                  </div>
                               </div>
                               <Button variant="secondary" className="w-full" asChild>
                                  <Link href={thesis.isPublic ? `/dashboard/thesis-view/${thesis._id}` : `/dashboard/thesis/${thesis._id}`}>View Details</Link>
                               </Button>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    // LIST VIEW
                    <div className="space-y-3">
                      {currentItems.map((thesis) => (
                        <motion.div key={thesis._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                           <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                              <div className="flex-1 min-w-0 space-y-1">
                                 <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="text-[10px] h-5">{getCategoryLabel(thesis.category)}</Badge>
                                    <span className="text-xs text-muted-foreground">{thesis.thesis_id}</span>
                                 </div>
                                  <Link href={thesis.isPublic ? `/dashboard/thesis-view/${thesis._id}` : `/dashboard/thesis/${thesis._id}`}>
                                    <h3 className="font-semibold text-base hover:text-primary truncate">{thesis.title}</h3>
                                  </Link>
                                 <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {thesis.author?.firstName} {thesis.author?.lastName}</span>
                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {thesis.year}</span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                 <Button variant="ghost" size="sm" asChild>
                                    <a href={thesis.file_path} download><Download className="h-4 w-4" /></a>
                                 </Button>
                                 <Button variant="outline" size="sm" asChild>
                                    <Link href={thesis.isPublic ? `/dashboard/thesis-view/${thesis._id}` : `/dashboard/thesis/${thesis._id}`}>View</Link>
                                 </Button>
                              </div>
                           </div>
                        </motion.div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="text-center py-12 bg-muted/10 rounded-xl border-2 border-dashed">
                    <p className="text-muted-foreground">No theses found matching your criteria.</p>
                    <Button variant="link" onClick={clearFilters}>Clear Filters</Button>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Pagination Controls */}
            {filteredTheses.length > itemsPerPage && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                     // Simple pagination logic to show limited page numbers
                     let pageNum = i + 1;
                     if (totalPages > 5 && currentPage > 3) {
                        pageNum = currentPage - 2 + i;
                     }
                     if (pageNum > totalPages) return null;

                     return (
                       <Button
                         key={pageNum}
                         variant={currentPage === pageNum ? "default" : "ghost"}
                         size="sm"
                         className="w-8 h-8 p-0"
                         onClick={() => handlePageChange(pageNum)}
                       >
                         {pageNum}
                       </Button>
                     )
                  })}
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

          </div>
        </div>
      </div>
  )
}