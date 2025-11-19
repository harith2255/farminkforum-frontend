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
  requirements: string[];
}

const defaultJobs: Job[] = [
  {
    id: 1,
    title: 'Agricultural Extension Officer',
    company: 'State Agriculture Department',
    location: 'Hyderabad, Telangana',
    type: 'Full-time',
    level: 'Entry Level',
    salary: '₹3,50,000 - ₹4,50,000 per annum',
    posted: '2 days ago',
    description:
      'Responsible for providing technical guidance to farmers and promoting sustainable farming practices.',
    requirements: [
      "Bachelor's in Agriculture or Agricultural Extension",
      'Good communication and field skills',
      'Knowledge of local cropping systems'
    ]
  },
  {
    id: 2,
    title: 'Research Associate - Crop Science',
    company: 'Indian Council of Agricultural Research (ICAR)',
    location: 'New Delhi, Delhi',
    type: 'Full-time',
    level: 'Research',
    salary: '₹40,000 - ₹45,000 per month',
    posted: '1 week ago',
    description:
      'Research position focusing on crop improvement and pest management under national agriculture projects.',
    requirements: [
      "Master's in Agronomy/Plant Breeding",
      'Research experience in crop science',
      'Familiarity with data analysis tools'
    ]
  },
  {
    id: 3,
    title: 'Field Officer - Agri Business',
    company: 'AgroGrow Pvt. Ltd.',
    location: 'Nashik, Maharashtra',
    type: 'Full-time',
    level: 'Graduate',
    salary: '₹25,000 - ₹30,000 per month',
    posted: '3 days ago',
    description:
      'Work with farmers to promote company’s seeds and fertilizers, and support on-field demonstrations.',
    requirements: [
      'B.Sc. in Agriculture or allied field',
      'Valid two-wheeler license',
      'Good interpersonal and sales skills'
    ]
  },
  {
    id: 4,
    title: 'Intern - Sustainable Agriculture',
    company: 'GreenEarth Foundation',
    location: 'Remote',
    type: 'Internship',
    level: 'Undergraduate',
    salary: '₹10,000 - ₹15,000 per month',
    posted: '5 days ago',
    description:
      'Assist in data collection and farmer training programs promoting organic and sustainable farming.',
    requirements: [
      'B.Sc. Agriculture student',
      'Interest in organic farming',
      'Basic report writing skills'
    ]
  },
  {
    id: 5,
    title: 'Postdoctoral Fellow - Soil Science',
    company: 'National Institute of Soil Research',
    location: 'Bhopal, Madhya Pradesh',
    type: 'Full-time',
    level: 'Postdoc',
    salary: '₹55,000 - ₹65,000 per month',
    posted: '1 day ago',
    description:
      'Postdoctoral research on soil health, carbon sequestration, and nutrient management.',
    requirements: [
      'PhD in Soil Science or Agronomy',
      'Experience with lab and field research',
      'Published papers in reputed journals'
    ]
  },
  {
    id: 6,
    title: 'Agricultural Content Writer',
    company: 'AgriLearn Edutech',
    location: 'Remote',
    type: 'Contract',
    level: 'Mid-level',
    salary: '₹1,000 - ₹1,500 per article',
    posted: '4 days ago',
    description:
      'Create educational and technical content for agriculture e-learning platforms and farmer training modules.',
    requirements: [
      "Master's in Agriculture or Agricultural Extension",
      'Strong writing and editing skills',
      'Ability to simplify technical content'
    ]
  }
];

export function JobPortal() {
  const [jobs, setJobs] = useState<Job[]>(defaultJobs);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(defaultJobs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

  // Load jobs from localStorage
  useEffect(() => {
    const savedJobs = localStorage.getItem('agriculturalJobs');
    if (savedJobs) {
      const parsedJobs = JSON.parse(savedJobs);
      setJobs(parsedJobs);
      setFilteredJobs(parsedJobs);
    }
  }, []);

  // Listen for storage changes (when admin updates jobs)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedJobs = localStorage.getItem('agriculturalJobs');
      if (savedJobs) {
        const parsedJobs = JSON.parse(savedJobs);
        setJobs(parsedJobs);
        applyFilters(parsedJobs, searchQuery, selectedType, selectedLevel);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [searchQuery, selectedType, selectedLevel]);

  const applyFilters = (jobList: Job[], search: string, type: string, level: string) => {
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
                  onChange={(e) => handleSearch(e.target.value)}
                />
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
              <Input placeholder="City, State, or Remote" />
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-2 block">Salary Range</label>
              <Select>
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
              <Select>
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
            <Button className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white">
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
                        {job.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
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
