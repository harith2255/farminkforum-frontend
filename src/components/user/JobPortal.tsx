import { useState, useEffect } from 'react';
import axios from 'axios';
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
  Building
} from 'lucide-react';

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
  requirements: string[] | null; // ✅ FIXED: Allow null
}

export function JobPortal() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [salaryFilter, setSalaryFilter] = useState('any');
  const [postedFilter, setPostedFilter] = useState('any');
  const [loading, setLoading] = useState(true); // ✅ ADDED: Loading state
  const [error, setError] = useState<string | null>(null); // ✅ ADDED: Error state

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get("https://ebook-backend-lxce.onrender.com/api/jobs");
        console.log("BACKEND JOBS:", res.data);
        
        // ✅ FIXED: Ensure requirements is always an array, even if null/undefined
        const jobsWithSafeRequirements = res.data.map((job: any) => ({
          ...job,
          requirements: job.requirements || [] // Convert null to empty array
        }));
        
        setJobs(jobsWithSafeRequirements);
        setFilteredJobs(jobsWithSafeRequirements);
      } catch (err) {
        console.error("❌ Failed to load jobs:", err);
        setError("Failed to load jobs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Single unified filter function
  const applyAllFilters = () => {
    let filtered = jobs;

    // 🔍 Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 🧩 Job type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(
        (job) => job.type.toLowerCase() === selectedType.toLowerCase()
      );
    }

    // 🎓 Level filter
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(
        (job) => job.level.toLowerCase() === selectedLevel.toLowerCase()
      );
    }

    // 📌 Location filter
    if (locationFilter.trim() !== '') {
      filtered = filtered.filter((job) =>
        job.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // 💰 Salary filter
    if (salaryFilter !== 'any') {
      filtered = filtered.filter((job) => {
        const salaryText = job.salary.replace(/[^0-9]/g, '');
        const numeric = parseInt(salaryText);
        if (isNaN(numeric)) return false;

        if (salaryFilter === '3-5') return numeric >= 300000 && numeric <= 500000;
        if (salaryFilter === '5-7') return numeric >= 500000 && numeric <= 700000;
        if (salaryFilter === '7+') return numeric >= 700000;

        return true;
      });
    }

    // 🕒 Posted Within Filter
    if (postedFilter !== 'any') {
      const now = new Date().getTime();
      filtered = filtered.filter((job) => {
        const jobDate = new Date(job.posted).getTime();
        const diffDays = (now - jobDate) / (1000 * 60 * 60 * 24);

        if (postedFilter === '24h') return diffDays <= 1;
        if (postedFilter === '7d') return diffDays <= 7;
        if (postedFilter === '30d') return diffDays <= 30;

        return true;
      });
    }

    setFilteredJobs(filtered);
  };

  // Apply filters when any filter changes
  useEffect(() => {
    applyAllFilters();
  }, [searchQuery, selectedType, selectedLevel, locationFilter, salaryFilter, postedFilter, jobs]);

  // Handle sidebar filter changes
  const handleLocationChange = (value: string) => {
    setLocationFilter(value);
  };

  const handleSalaryChange = (value: string) => {
    setSalaryFilter(value);
  };

  const handlePostedChange = (value: string) => {
    setPostedFilter(value);
  };

  // Apply filters button handler
  const handleApplyFilters = () => {
    applyAllFilters();
  };

  // ✅ FIXED: Safe requirements rendering function
  const renderRequirements = (requirements: string[] | null) => {
    // Handle null, undefined, or empty array
    if (!requirements || requirements.length === 0) {
      return <li>No specific requirements listed</li>;
    }
    
    return requirements.map((req, index) => (
      <li key={index}>{req}</li>
    ));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-[#1d4d6a] mb-1">Agricultural Job Portal</h2>
          <p className="text-sm text-gray-500">Loading jobs...</p>
        </div>
        <Card className="border-none shadow-md">
          <CardContent className="p-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600">Loading job opportunities...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-[#1d4d6a] mb-1">Agricultural Job Portal</h2>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
        <Card className="border-none shadow-md">
          <CardContent className="p-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600">{error}</p>
            <Button 
              className="mt-4 bg-[#bf2026] hover:bg-[#a01c22] text-white"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1d4d6a] mb-1">Agricultural Job Portal</h2>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
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
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
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
              <Input 
                placeholder="City, State, or Remote" 
                value={locationFilter}
                onChange={(e) => handleLocationChange(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-2 block">Salary Range</label>
              <Select value={salaryFilter} onValueChange={handleSalaryChange}>
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
              <Select value={postedFilter} onValueChange={handlePostedChange}>
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
              className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white"
              onClick={handleApplyFilters}
            >
              Apply Filters
            </Button>
          </CardContent>
        </Card>

        {/* Job Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Showing {filteredJobs.length} opportunities
          </div>
          {filteredJobs.length === 0 ? (
            <Card className="border-none shadow-md">
              <CardContent className="p-12 text-center">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">No jobs found matching your criteria.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Try adjusting your filters or search terms.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="border-none shadow-md hover:shadow-lg transition-all"
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-[#1d4d6a] mb-2">{job.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Building className="w-4 h-4" />
                          <span>{job.company}</span>
                          <span className="text-gray-300">•</span>
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700">{job.description}</p>

                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-blue-100 text-blue-700">{job.type}</Badge>
                      <Badge className="bg-purple-100 text-purple-700">{job.level}</Badge>
                      <Badge className="bg-gray-100 text-gray-700 flex items-center gap-1">
                        {job.salary}
                      </Badge>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-sm text-gray-600 mb-2">Requirements:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-4">
                        {/* ✅ FIXED: Safe requirements rendering */}
                        {renderRequirements(job.requirements)}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>Posted {job.posted}</span>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}