import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  IndianRupee,
  Building,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import * as React from 'react';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  level: string;
  salary: string;
  posted: string;
  description: string;
  requirements: string[] | null;
}

export function JobPortal() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [locationFilter, setLocationFilter] = useState("");
  const [salaryFilter, setSalaryFilter] = useState("any");
  const [postedFilter, setPostedFilter] = useState("any");
  
  const [loading, setLoading] = useState({
    initial: true,
    jobs: false,
    filtering: false
  });

  // Initial fetch
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(prev => ({ ...prev, initial: true, jobs: true }));
        const res = await axios.get("https://ebook-backend-lxce.onrender.com/api/jobs");
        console.log("BACKEND JOBS:", res.data);

        setJobs(res.data);
        setFilteredJobs(res.data);
      } catch (err) {
        console.error("❌ Failed to load jobs:", err);
      } finally {
        setLoading(prev => ({ ...prev, initial: false, jobs: false }));
      }
    };

    fetchJobs();
  }, []);

  // Apply filters function
  const applySideBarFilters = (
    jobList: Job[],
    search: string,
    type: string,
    level: string,
    location = locationFilter,
    salary = salaryFilter,
    posted = postedFilter
  ) => {
    setLoading(prev => ({ ...prev, filtering: true }));
    
    setTimeout(() => {
      let filtered = jobList;

      // 🔍 Search filter
      if (search) {
        filtered = filtered.filter(
          (job) =>
            job.title.toLowerCase().includes(search.toLowerCase()) ||
            job.company.toLowerCase().includes(search.toLowerCase()) ||
            job.description.toLowerCase().includes(search.toLowerCase())
        );
      }

      // 🧩 Job type
      if (type !== "all") {
        filtered = filtered.filter(
          (job) => job.type.toLowerCase() === type.toLowerCase()
        );
      }

      // 🎓 Level filter
      if (level !== "all") {
        filtered = filtered.filter(
          (job) => job.level.toLowerCase() === level.toLowerCase()
        );
      }

      // 📌 Location filter
      if (location.trim() !== "") {
        filtered = filtered.filter((job) =>
          job.location.toLowerCase().includes(location.toLowerCase())
        );
      }

      // 💰 Salary filter
      if (salary !== "any") {
        filtered = filtered.filter((job) => {
          const salaryText = job.salary.replace(/[^0-9]/g, "");
          const numeric = parseInt(salaryText);
          if (isNaN(numeric)) return false;

          if (salary === "3-5") return numeric >= 300000 && numeric <= 500000;
          if (salary === "5-7") return numeric >= 500000 && numeric <= 700000;
          if (salary === "7+") return numeric >= 700000;

          return true;
        });
      }

      // 🕒 Posted Within Filter
      if (posted !== "any") {
        const now = new Date().getTime();

        filtered = filtered.filter((job) => {
          const jobDate = new Date(job.posted).getTime();
          const diffDays = (now - jobDate) / (1000 * 60 * 60 * 24);

          if (posted === "24h") return diffDays <= 1;
          if (posted === "7d") return diffDays <= 7;
          if (posted === "30d") return diffDays <= 30;

          return true;
        });
      }

      setFilteredJobs(filtered);
      setLoading(prev => ({ ...prev, filtering: false }));
    }, 300); // Small delay for better UX
  };

  // Listen for storage changes (when admin updates jobs)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedJobs = localStorage.getItem('agriculturalJobs');
      if (savedJobs) {
        const parsedJobs = JSON.parse(savedJobs);
        setJobs(parsedJobs);
        applySideBarFilters(parsedJobs, searchQuery, selectedType, selectedLevel);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [searchQuery, selectedType, selectedLevel]);

  // Apply filters function
  const applyFilters = (jobList: Job[], search: string, type: string, level: string) => {
    setLoading(prev => ({ ...prev, filtering: true }));
    
    setTimeout(() => {
      let filtered = jobList;

      if (search) {
        filtered = filtered.filter(
          (job) =>
            job.title.toLowerCase().includes(search.toLowerCase()) ||
            job.company.toLowerCase().includes(search.toLowerCase()) ||
            job.description.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (type !== 'all') {
        filtered = filtered.filter((job) => job.type.toLowerCase() === type.toLowerCase());
      }

      if (level !== 'all') {
        filtered = filtered.filter((job) => job.level.toLowerCase() === level.toLowerCase());
      }

      setFilteredJobs(filtered);
      setLoading(prev => ({ ...prev, filtering: false }));
    }, 300);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    applyFilters(jobs, value, selectedType, selectedLevel);
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    applyFilters(jobs, searchQuery, value, selectedLevel);
  };

  const handleLevelChange = (value: string) => {
    setSelectedLevel(value);
    applyFilters(jobs, searchQuery, selectedType, value);
  };

  // Render loading spinner
  const renderSpinner = (text: string = "Loading...") => (
    <div className="flex justify-center items-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d4d6a] mb-3"></div>
        <p className="text-gray-500">{text}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4">
      <div>
        <h2 className="text-[#1d4d6a] text-xl sm:text-2xl font-bold mb-1">Agricultural Job Portal</h2>
        <p className="text-sm text-gray-500">
          Find agricultural jobs, research positions, and field opportunities
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search by title, keyword..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {loading.filtering && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  </div>
                )}
              </div>
            </div>
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedLevel} onValueChange={handleLevelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="entry level">Entry Level</SelectItem>
                <SelectItem value="undergraduate">Undergraduate</SelectItem>
                <SelectItem value="graduate">Graduate</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="postdoc">Postdoc</SelectItem>
                <SelectItem value="mid-level">Mid-level</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Job Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Filters */}
        <Card className="border-none shadow-md lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-[#1d4d6a]">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-700 mb-2 block">Location</label>
              <div className="relative">
                <Input
                  placeholder="City, State, or Remote"
                  value={locationFilter}
                  onChange={(e) => {
                    setLocationFilter(e.target.value);
                    applySideBarFilters(jobs, searchQuery, selectedType, selectedLevel, e.target.value);
                  }}
                  className="pr-10"
                />
                <MapPin className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-2 block">Salary Range</label>
              <Select
                value={salaryFilter}
                onValueChange={(value) => {
                  setSalaryFilter(value);
                  applySideBarFilters(
                    jobs,
                    searchQuery,
                    selectedType,
                    selectedLevel,
                    locationFilter,
                    value,
                    postedFilter
                  );
                }}
                disabled={loading.filtering}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any salary" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any salary</SelectItem>
                  <SelectItem value="3-5">₹3L - ₹5L</SelectItem>
                  <SelectItem value="5-7">₹5L - ₹7L</SelectItem>
                  <SelectItem value="7+">₹7L+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-2 block">Posted Within</label>
              <Select
                value={postedFilter}
                onValueChange={(value) => {
                  setPostedFilter(value);
                  applySideBarFilters(
                    jobs,
                    searchQuery,
                    selectedType,
                    selectedLevel,
                    locationFilter,
                    salaryFilter,
                    value
                  );
                }}
                disabled={loading.filtering}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Anytime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Anytime</SelectItem>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white flex items-center justify-center gap-2"
              disabled={loading.filtering}
            >
              {loading.filtering ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Applying Filters...
                </>
              ) : (
                "Apply Filters"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Job Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="text-sm text-gray-600 mb-4 flex items-center gap-2">
            Showing {filteredJobs.length} opportunities
            {loading.filtering && <Loader2 className="w-3 h-3 animate-spin" />}
          </div>
          
          {loading.initial ? (
            renderSpinner("Loading job listings...")
          ) : filteredJobs.length === 0 ? (
            <Card className="border-none shadow-md">
              <CardContent className="p-12 text-center">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">
                  {searchQuery || locationFilter || salaryFilter !== "any" || postedFilter !== "any" 
                    ? "No jobs found matching your criteria." 
                    : "No job listings available at the moment."}
                </p>
                {/* <p className="text-sm text-gray-500 mt-2">
                  Try adjusting your filters or search terms.
                </p> */}
                {(searchQuery || locationFilter || salaryFilter !== "any" || postedFilter !== "any") && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedType('all');
                      setSelectedLevel('all');
                      setLocationFilter('');
                      setSalaryFilter('any');
                      setPostedFilter('any');
                      setFilteredJobs(jobs);
                    }}
                  >
                    Clear All Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  className="border-none shadow-md hover:shadow-lg transition-all"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-[#1d4d6a] text-base sm:text-lg font-semibold mb-2">{job.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <Building className="w-4 h-4" />
                            <span>{job.company}</span>
                            <span className="text-gray-300">•</span>
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 line-clamp-3">{job.description}</p>

                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-blue-100 text-blue-700">{job.type}</Badge>
                        <Badge className="bg-purple-100 text-purple-700">{job.level}</Badge>
                        <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" />
                          {job.salary}
                        </Badge>
                      </div>

                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-sm text-gray-600 mb-2">Requirements:</p>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-4">
                          {(job.requirements || []).map((req, index) => (
                            <li key={index} className="ml-2">{req}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>Posted {new Date(job.posted).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Save
                          </Button>
                          <Button
                            size="sm"
                            className="bg-[#bf2026] hover:bg-[#a01c22] text-white"
                          >
                            Apply Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}