"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, User, Calendar, TrendingUp, Loader2 } from "lucide-react"

interface IThesis {
  _id: string;
  title: string;
  category: string;
  year: string;
  author: {
    firstName: string;
    lastName: string;
  };
  downloads?: number;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<IThesis[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    setLoading(true)
    setResults([])

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    if (searchQuery.length > 2) {
      searchTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch('/api/query/thesis') // เรียกข้อมูลทั้งหมดมา (ใน production ควรมี API search โดยเฉพาะ)
          const data = await res.json()
          
          if (data.success) {
            const filtered = data.theses.filter((item: any) => {
                const titleMatch = item.title?.toLowerCase().includes(searchQuery.toLowerCase());
                const authorName = item.author ? `${item.author.firstName} ${item.author.lastName}` : "";
                const authorMatch = authorName.toLowerCase().includes(searchQuery.toLowerCase());
                const keywordMatch = item.keywords?.toLowerCase().includes(searchQuery.toLowerCase());
                
                return titleMatch || authorMatch || keywordMatch;
            });
            setResults(filtered.slice(0, 5)); // เอาแค่ 5 อันดับแรก
          }
        } catch (error) {
          console.error("Search error:", error)
        } finally {
          setLoading(false)
        }
      }, 500)
    } else {
      setLoading(false)
      setResults([])
    }
  }

  const handleResultClick = (result: IThesis) => {
    router.push(`/dashboard/thesis/${result._id}`)
    setIsOpen(false)
    setQuery("")
    setResults([])
  }

  const handleAdvancedSearch = () => {
    router.push(`/dashboard/browse`) 
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative w-full md:w-64 justify-start text-muted-foreground bg-background/50 backdrop-blur-sm border-muted-foreground/20 hover:bg-background/80 hover:text-foreground transition-all">
          <Search className="h-4 w-4 mr-2" />
          <span className="inline-flex">Search theses...</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl sm:top-[15%] sm:translate-y-0">
        <DialogHeader>
          <DialogTitle className="font-heading">Search Database</DialogTitle>
          <DialogDescription>Find research papers, authors, and academic resources.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="relative">
            {loading ? (
               <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            ) : (
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            )}
            <Input
              placeholder="Type title, author name, or keywords..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-12 text-lg rounded-xl border-2 focus-visible:ring-offset-0"
              autoFocus
            />
          </div>

          {/* Quick Results */}
          {results.length > 0 && (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Top Results</h4>
              {results.map((result) => (
                <div
                  key={result._id}
                  onClick={() => handleResultClick(result)}
                  className="group p-3 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-all duration-200 flex items-start gap-3"
                >
                   <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-5 w-5 text-primary" />
                   </div>
                   <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {result.title}
                        </h5>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground">
                            {result.category || "Thesis"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="truncate">
                             {result.author ? `${result.author.firstName} ${result.author.lastName}` : "Unknown Author"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {result.year}
                        </div>
                        {/* (ถ้ามี download ก็ใส่ได้) */}
                      </div>
                   </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {query.length > 2 && results.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                 <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="font-medium text-foreground mb-1">No results found</h4>
              <p className="text-sm text-muted-foreground">
                We couldn't find anything matching "{query}". Try adjusting your keywords.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-border mt-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/browse")} className="text-muted-foreground hover:text-primary">
              Browse All Theses
            </Button>
            {results.length > 0 && (
                <Button size="sm" onClick={handleAdvancedSearch} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    View All Results
                </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}