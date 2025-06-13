"use client";

import { useEffect, useState, useRef } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { supabase, type Entry } from '@/lib/supabase';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdContainer } from "@/components/AdScript";

type LeaderboardFilter = 'recent';

type RankCategory = {
  name: string;
  startRank: number;
  label: string;
};

const RANK_CATEGORIES: RankCategory[] = [
  { name: 'smoke', startRank: 1, label: 'The Smoke Shows' },
  { name: 'monets', startRank: 100, label: 'The Monets' },
  { name: 'mehs', startRank: 300, label: 'The Mehs' },
  { name: 'plebs', startRank: 600, label: 'The Plebs' },
  { name: 'dregs', startRank: 800, label: 'The Dregs' }
];

const MAX_RESULTS = 1000;

interface LeaderboardProps {
  submittedEntryId?: number | null;
}

// Custom spinner component
function Spinner({ className }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full border-t-2 border-primary ${className || 'h-4 w-4'}`}></div>
  );
}

export default function Leaderboard({ submittedEntryId }: LeaderboardProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LeaderboardFilter>('recent');
  const [page, setPage] = useState(0);
  const [startRank, setStartRank] = useState(0);
  const pageSize = 10;
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState('smoke');

  // Function to navigate to a specific rank
  const navigateToRank = async (rank: number, categoryName: string) => {
    setActiveCategory(categoryName);
    setPage(0); // Reset to first page
    setStartRank(rank - 1); // Set the starting rank (0-indexed for the query)
    setEntries([]);
    setHasMore(true);
    await fetchEntries(false, rank - 1);
  };

  const fetchEntries = async (loadMore = false, rankStart = startRank) => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Please configure Supabase by clicking the "Connect to Supabase" button.');
      }

      // Get total count first if we don't have it
      if (totalCount === 0) {
        const { count: entriesCount, error: countError } = await supabase
          .from('entries')
          .select('*', { count: 'exact', head: true })
          .eq('is_visible', true);
        
        if (countError) throw countError;
        
        if (entriesCount) {
          setTotalCount(Math.min(entriesCount, MAX_RESULTS));
        }
      }

      // Check if we've reached the maximum number of results
      const currentEntries = loadMore ? entries.length : 0;
      if (currentEntries >= MAX_RESULTS) {
        setHasMore(false);
        return;
      }

      // Calculate the range to fetch
      const from = loadMore 
        ? startRank + currentEntries 
        : rankStart;
      
      const to = Math.min(from + pageSize - 1, MAX_RESULTS - 1);

      // If we're at the end, don't fetch
      if (from >= MAX_RESULTS) {
        setHasMore(false);
        return;
      }

      let query = supabase
        .from('entries')
        .select('*')
        .eq('is_visible', true)
        .range(from, to);

      // Always sort by score descending first (top scores first)
      query = query.order('score', { ascending: false });
      
      // Add a secondary sort by created_at to ensure consistent ordering
      query = query.order('created_at', { ascending: false });

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        throw supabaseError;
      }

      if (!loadMore) {
        setStartRank(rankStart);
      }

      if (data.length < pageSize || from + data.length >= MAX_RESULTS) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (data.length === 0 && !loadMore) {
        // Show the "No entries yet" message when there are no entries for the selected rank
        setEntries([]);
      } else {
        setEntries(prevEntries => loadMore ? [...prevEntries, ...(data as Entry[])] : (data as Entry[]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard entries');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if a username already exists
  const checkUsernameExists = async (username: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('screen_name')
        .eq('screen_name', username)
        .limit(1);
      
      if (error) throw error;
      
      return data.length > 0;
    } catch (err) {
      console.error('Error checking username:', err);
      return false; // Default to allowing the username if there's an error
    }
  };

  // Add function to clean up duplicate entries
  const cleanupDuplicateEntries = async () => {
    try {
      console.log("Running duplicate entry cleanup...");
      
      // Get all entries
      const { data: allEntries, error: fetchError } = await supabase
        .from('entries')
        .select('*')
        .eq('is_visible', true)
        .order('score', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      if (!allEntries || allEntries.length === 0) return;
      
      console.log(`Found ${allEntries.length} total entries`);
      
      // Find duplicate screen names
      const screenNameMap: {[key: string]: Entry[]} = {};
      allEntries.forEach(entry => {
        const name = entry.screen_name.toLowerCase();
        if (!screenNameMap[name]) {
          screenNameMap[name] = [];
        }
        screenNameMap[name].push(entry);
      });
      
      // Identify entries that need to be hidden
      const dupeEntriesToHide: Entry[] = [];
      
      Object.keys(screenNameMap).forEach(name => {
        const entries = screenNameMap[name];
        if (entries.length > 1) {
          console.warn(`Found ${entries.length} entries with screen name "${name}"`);
          
          // Keep the newest entry, hide the rest
          for (let i = 1; i < entries.length; i++) {
            dupeEntriesToHide.push(entries[i]);
          }
        }
      });
      
      if (dupeEntriesToHide.length > 0) {
        console.log(`Marking ${dupeEntriesToHide.length} duplicate entries as hidden`);
        
        // Update the entries to hide them
        for (const entry of dupeEntriesToHide) {
          const { error: updateError } = await supabase
            .from('entries')
            .update({ is_visible: false })
            .eq('id', entry.id);
          
          if (updateError) {
            console.error(`Failed to hide duplicate entry ${entry.id}:`, updateError);
          } else {
            console.log(`Successfully hid duplicate entry ${entry.id} (${entry.screen_name})`);
          }
        }
        
        // Refresh the entries after cleanup
        setStartRank(0);
        setPage(0);
        fetchEntries(false, 0);
      } else {
        console.log("No duplicate entries found to clean up");
      }
    } catch (err) {
      console.error("Error during duplicate cleanup:", err);
    }
  };

  // Run cleanup on initial load
  useEffect(() => {
    cleanupDuplicateEntries();
  }, []);

  // Handle initial load
  useEffect(() => {
    setPage(0);
    setEntries([]);
    setHasMore(true);
    setStartRank(0); // Always start at rank 1 initially
    fetchEntries(false, 0); // Explicitly pass 0 to ensure we fetch from the beginning
  }, [filter]);

  // Debug: Log entries whenever they change
  useEffect(() => {
    if (entries.length > 0) {
      console.log(`Leaderboard loaded ${entries.length} entries. First entry:`, entries[0]);
      console.log(`Last entry:`, entries[entries.length - 1]);
      
      // Check for duplicate screen names
      const screenNames = entries.map(entry => entry.screen_name);
      const uniqueNames = new Set(screenNames);
      
      if (screenNames.length !== uniqueNames.size) {
        console.warn("Detected duplicate screen names in the leaderboard:");
        
        // Find the duplicates
        const counts: {[key: string]: number} = {};
        const duplicates: string[] = [];
        
        screenNames.forEach(name => {
          counts[name] = (counts[name] || 0) + 1;
          if (counts[name] > 1 && !duplicates.includes(name)) {
            duplicates.push(name);
          }
        });
        
        duplicates.forEach(name => {
          const dupes = entries.filter(entry => entry.screen_name === name);
          console.warn(`Screen name "${name}" appears ${counts[name]} times:`, dupes);
        });
      }
    }
  }, [entries]);

  // Handle infinite scrolling
  useEffect(() => {
    if (page > 0) {
      fetchEntries(true);
    }
  }, [page]);

  // Set up intersection observer for infinite scrolling
  const lastEntryElementRef = (node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  };

  // Scroll to submitted entry if provided
  useEffect(() => {
    if (submittedEntryId) {
      const highlightSubmittedEntry = async () => {
        try {
          // First find out the score of the submitted entry to know its rank
          const { data: submittedEntry, error: entryError } = await supabase
            .from('entries')
            .select('*')
            .eq('id', submittedEntryId)
            .single();
          
          if (entryError || !submittedEntry) throw entryError;
          
          console.log("Found submitted entry:", submittedEntry);
          
          // Find all entries with higher scores to determine rank
          const { count: higherScores, error: countError } = await supabase
            .from('entries')
            .select('*', { count: 'exact', head: true })
            .eq('is_visible', true)
            .gt('score', submittedEntry.score);
          
          if (countError) throw countError;
          
          console.log("Number of entries with higher scores:", higherScores || 0);
          
          // Calculate the rank (1-indexed)
          const rank = (higherScores || 0) + 1;
          console.log("Calculated rank:", rank);
          
          // Special case for highest-scoring entries - always start from rank 1
          if (rank <= 3) {
            console.log("High-scoring entry - starting from rank 1");
            setActiveCategory('smoke');
            setPage(0);
            setStartRank(0); // Start from the very top
            await fetchEntries(false, 0);
          } else {
            // Set active category based on rank
            let category = 'smoke';
            for (const cat of RANK_CATEGORIES) {
              if (rank >= cat.startRank) {
                category = cat.name;
              } else {
                break;
              }
            }
            setActiveCategory(category);
            
            // Calculate a starting rank that will center the user's entry
            // We want to show entries both above and below the user
            const offset = 5; // Show approximately 5 entries above
            const centerRank = Math.max(0, rank - offset - 1);
            
            console.log("Using centerRank:", centerRank);
            
            // Navigate to the appropriate page
            setPage(0);
            setStartRank(centerRank);
            
            // Fetch entries for this page
            await fetchEntries(false, centerRank);
          }
          
          // Wait for render and then highlight
          setTimeout(() => {
            const entryElement = document.getElementById(`entry-${submittedEntryId}`);
            if (entryElement) {
              entryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              entryElement.classList.add('highlight-entry');
            }
          }, 1000);
        } catch (err) {
          console.error("Error finding submitted entry:", err);
        }
      };
      
      highlightSubmittedEntry();
    }
  }, [submittedEntryId]);

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {RANK_CATEGORIES.map((category) => (
          <Button
            key={category.name}
            variant={activeCategory === category.name ? "default" : "outline"}
            size="sm"
            className="flex flex-col items-center px-4 py-2 h-auto"
            onClick={() => navigateToRank(category.startRank, category.name)}
          >
            <span className="text-sm font-medium">&ldquo;{category.label}&rdquo;</span>
            <span className="text-xs opacity-80 mt-1">Rank {category.startRank}+</span>
          </Button>
        ))}
      </div>
      
      <div className="bg-card rounded-lg border">
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="w-24 text-right">Score</TableHead>
                <TableHead className="w-32">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No entries yet
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry, index) => (
                  <TableRow 
                    key={entry.id} 
                    id={`entry-${entry.id}`}
                    className={submittedEntryId !== null && submittedEntryId !== undefined && String(submittedEntryId) === entry.id ? 'highlight-entry' : ''}
                  >
                    <TableCell className="font-mono">
                      #{startRank + index + 1}
                    </TableCell>
                    <TableCell className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted overflow-hidden profile-image-container">
                        <img
                          src={entry.image_url}
                          alt={entry.screen_name}
                          className="w-full h-full object-cover transition-all duration-300 profile-image"
                        />
                      </div>
                      {entry.screen_name}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {entry.score.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Loading indicator for infinite scroll */}
          {loading && (
            <div className="text-center py-4">
              Loading more entries...
            </div>
          )}
          
          {/* Intersection observer target for infinite scrolling */}
          {hasMore && !loading && (
            <div ref={lastEntryElementRef} className="h-4"></div>
          )}
        </div>
      </div>

      {/* Ad placement */}
      <div className="my-4">
        <AdContainer 
          className="w-full h-20"
          adSlot="leaderboard-horizontal"
          adFormat="horizontal"
          responsive={true}
        />
      </div>
    </div>
  );
}