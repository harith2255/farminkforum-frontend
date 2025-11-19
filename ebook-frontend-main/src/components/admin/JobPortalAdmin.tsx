import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Plus, Pencil, Trash2, Briefcase, MapPin, IndianRupee, Building, Clock } from 'lucide-react';
import { toast } from 'sonner';

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

const initialJobs: Job[] = [
  {
    id: 1,
    title: 'Research Assistant - Machine Learning',
    company: 'Tech University',
    location: 'Cambridge, MA',
    type: 'Full-time',
    level: 'Entry Level',
    salary: '₹45,000 - ₹55,000',
    posted: '2 days ago',
    description: 'Seeking a research assistant to support ML projects in our AI lab.',
    requirements: ['Bachelor\'s in CS', 'Python proficiency', 'ML fundamentals']
  },
  {
    id: 2,
    title: 'PhD Student - Quantum Physics',
    company: 'State Research Institute',
    location: 'Berkeley, CA',
    type: 'Full-time',
    level: 'PhD',
    salary: '₹35,000 - ₹40,000',
    posted: '1 week ago',
    description: 'Fully funded PhD position in quantum computing research.',
    requirements: ['Master\'s in Physics', 'Research experience', 'Strong mathematics']
  },
  {
    id: 3,
    title: 'Teaching Assistant - Mathematics',
    company: 'Metropolitan University',
    location: 'New York, NY',
    type: 'Part-time',
    level: 'Graduate',
    salary: '₹20/hour',
    posted: '3 days ago',
    description: 'TA position for undergraduate calculus courses.',
    requirements: ['Graduate student', 'Strong math background', 'Good communication']
  },
  {
    id: 4,
    title: 'Data Analyst Intern',
    company: 'Research Corp',
    location: 'Remote',
    type: 'Internship',
    level: 'Undergraduate',
    salary: '₹15-₹20/hour',
    posted: '5 days ago',
    description: 'Summer internship analyzing educational data.',
    requirements: ['Statistics knowledge', 'Excel/Python', 'Detail-oriented']
  },
  {
    id: 5,
    title: 'Postdoctoral Fellow - Biology',
    company: 'Medical Research Center',
    location: 'Boston, MA',
    type: 'Full-time',
    level: 'Postdoc',
    salary: '₹55,000 - ₹65,000',
    posted: '1 day ago',
    description: 'Postdoc position in cellular biology research.',
    requirements: ['PhD in Biology', '2+ publications', 'Lab experience']
  },
  {
    id: 6,
    title: 'Academic Content Writer',
    company: 'EduTech Solutions',
    location: 'Remote',
    type: 'Contract',
    level: 'Mid-level',
    salary: '₹40-₹60/hour',
    posted: '4 days ago',
    description: 'Write educational content for online courses.',
    requirements: ['Master\'s degree', 'Writing portfolio', 'Subject expertise']
  },
];

export function JobPortalAdmin() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState<Partial<Job>>({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    level: 'Entry Level',
    salary: '',
    description: '',
    requirements: []
  });
  const [requirementInput, setRequirementInput] = useState('');

  // Load jobs from localStorage on mount
  useEffect(() => {
    const savedJobs = localStorage.getItem('academicJobs');
    if (savedJobs) {
      setJobs(JSON.parse(savedJobs));
    } else {
      setJobs(initialJobs);
      localStorage.setItem('academicJobs', JSON.stringify(initialJobs));
    }
  }, []);

  // Save jobs to localStorage whenever they change
  const saveJobs = (updatedJobs: Job[]) => {
    setJobs(updatedJobs);
    localStorage.setItem('academicJobs', JSON.stringify(updatedJobs));
  };

  const handleAddJob = () => {
    if (!formData.title || !formData.company || !formData.location || !formData.salary || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newJob: Job = {
      id: Date.now(),
      title: formData.title,
      company: formData.company,
      location: formData.location,
      type: formData.type || 'Full-time',
      level: formData.level || 'Entry Level',
      salary: formData.salary,
      posted: 'Just now',
      description: formData.description,
      requirements: formData.requirements || []
    };

    const updatedJobs = [...jobs, newJob];
    saveJobs(updatedJobs);
    toast.success('Job posted successfully!');
    resetForm();
    setIsDialogOpen(false);
  };

  const handleUpdateJob = () => {
    if (!editingJob || !formData.title || !formData.company || !formData.location || !formData.salary || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const updatedJobs = jobs.map(job =>
      job.id === editingJob.id
        ? {
            ...job,
            title: formData.title!,
            company: formData.company!,
            location: formData.location!,
            type: formData.type!,
            level: formData.level!,
            salary: formData.salary!,
            description: formData.description!,
            requirements: formData.requirements || []
          }
        : job
    );

    saveJobs(updatedJobs);
    toast.success('Job updated successfully!');
    resetForm();
    setIsDialogOpen(false);
  };

  const handleDeleteJob = (id: number) => {
    const updatedJobs = jobs.filter(job => job.id !== id);
    saveJobs(updatedJobs);
    toast.success('Job deleted successfully!');
  };

  const openEditDialog = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      level: job.level,
      salary: job.salary,
      description: job.description,
      requirements: job.requirements
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingJob(null);
    setFormData({
      title: '',
      company: '',
      location: '',
      type: 'Full-time',
      level: 'Entry Level',
      salary: '',
      description: '',
      requirements: []
    });
    setRequirementInput('');
  };

  const addRequirement = () => {
    if (requirementInput.trim()) {
      setFormData({
        ...formData,
        requirements: [...(formData.requirements || []), requirementInput.trim()]
      });
      setRequirementInput('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements?.filter((_, i) => i !== index) || []
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#1d4d6a] mb-1">Job Portal Management</h2>
          <p className="text-sm text-gray-500">Manage academic job postings for students and researchers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="bg-[#bf2026] hover:bg-[#a01c22] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Job Posting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#1d4d6a]">
                {editingJob ? 'Edit Job Posting' : 'Add New Job Posting'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Research Assistant - Machine Learning"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company/Institution *</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g., Tech University"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Cambridge, MA or Remote"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Job Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Level *</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entry Level">Entry Level</SelectItem>
                      <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                      <SelectItem value="Graduate">Graduate</SelectItem>
                      <SelectItem value="PhD">PhD</SelectItem>
                      <SelectItem value="Postdoc">Postdoc</SelectItem>
                      <SelectItem value="Mid-level">Mid-level</SelectItem>
                      <SelectItem value="Senior">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Salary Range *</Label>
                <Input
                  id="salary"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="e.g., ₹45,000 - ₹55,000 or ₹20/hour"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the position, responsibilities, and what makes it unique..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Requirements</Label>
                <div className="flex gap-2">
                  <Input
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                    placeholder="Add a requirement and press Enter"
                  />
                  <Button type="button" onClick={addRequirement} variant="outline">
                    Add
                  </Button>
                </div>
                {formData.requirements && formData.requirements.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {formData.requirements.map((req, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{req}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRequirement(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={editingJob ? handleUpdateJob : handleAddJob}
                className="bg-[#bf2026] hover:bg-[#a01c22] text-white"
              >
                {editingJob ? 'Update Job' : 'Post Job'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Jobs</p>
                <p className="text-[#1d4d6a]">{jobs.length}</p>
              </div>
              <Briefcase className="w-8 h-8 text-[#bf2026]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Full-time</p>
                <p className="text-[#1d4d6a]">{jobs.filter(j => j.type === 'Full-time').length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Remote</p>
                <p className="text-[#1d4d6a]">{jobs.filter(j => j.location.toLowerCase().includes('remote')).length}</p>
              </div>
              <MapPin className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Internships</p>
                <p className="text-[#1d4d6a]">{jobs.filter(j => j.type === 'Internship').length}</p>
              </div>
              <Building className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Listings */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Active Job Postings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No job postings yet. Add your first job posting!</p>
              </div>
            ) : (
              jobs.map((job) => (
                <Card key={job.id} className="border border-gray-200 hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-[#1d4d6a] mb-2">{job.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            <span>{job.company}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <IndianRupee className="w-4 h-4" />
                            <span>{job.salary}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(job)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-4">{job.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className="bg-blue-100 text-blue-700">{job.type}</Badge>
                      <Badge className="bg-purple-100 text-purple-700">{job.level}</Badge>
                      <Badge className="bg-gray-100 text-gray-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {job.posted}
                      </Badge>
                    </div>

                    {job.requirements.length > 0 && (
                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-sm text-gray-600 mb-2">Requirements:</p>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                          {job.requirements.map((req, index) => (
                            <li key={index}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
