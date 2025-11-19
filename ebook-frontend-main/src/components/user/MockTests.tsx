import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Clock, Trophy, Target, TrendingUp, Award, ChevronRight } from 'lucide-react';
import Test from '../user/Testpage';

export function MockTests() {

  const [selectedTest, setSelectedTest] = useState<any | null>(null);
  const [continueTest, setContinueTest] = useState<any | null>(null);

  const ongoingTests = [
    { id: 1, title: 'Mathematics Mock Test 3', subject: 'Mathematics', questions: 50, completed: 25, duration: '2 hours', difficulty: 'Medium' },
    { id: 2, title: 'Physics Comprehensive Exam', subject: 'Physics', questions: 75, completed: 10, duration: '3 hours', difficulty: 'Hard' },
  ];

  const availableTests = [
    { id: 3, title: 'Computer Science Quiz', subject: 'Computer Science', questions: 30, duration: '1 hour', difficulty: 'Easy', participants: 1250 },
    { id: 4, title: 'Chemistry Final Prep', subject: 'Chemistry', questions: 60, duration: '2.5 hours', difficulty: 'Hard', participants: 890 },
    { id: 5, title: 'Biology Mock Test', subject: 'Biology', questions: 40, duration: '1.5 hours', difficulty: 'Medium', participants: 2100 },
    { id: 6, title: 'Statistics Practice Test', subject: 'Statistics', questions: 45, duration: '2 hours', difficulty: 'Medium', participants: 670 },
  ];

  const completedTests = [
    { id: 7, title: 'Physics Mock Test 2', subject: 'Physics', score: 94, maxScore: 100, rank: 12, participants: 1500, date: '2024-03-15' },
    { id: 8, title: 'Mathematics Quiz 5', subject: 'Mathematics', score: 88, maxScore: 100, rank: 45, participants: 2200, date: '2024-03-10' },
    { id: 9, title: 'Chemistry Basics', subject: 'Chemistry', score: 76, maxScore: 100, rank: 120, participants: 980, date: '2024-03-05' },
  ];

  const stats = [
    { label: 'Tests Taken', value: '18', icon: Target, color: 'bg-blue-500' },
    { label: 'Average Score', value: '92%', icon: Trophy, color: 'bg-green-500' },
    { label: 'Best Rank', value: '#8', icon: Award, color: 'bg-yellow-500' },
    { label: 'Study Time', value: '156h', icon: Clock, color: 'bg-purple-500' },
  ];

  const handleStartClick = (test: any) => setSelectedTest(test);
  const handleCloseModal = () => setSelectedTest(null);
  const handleStartTest = () => {
    console.log('Starting test:', selectedTest);
    setSelectedTest(null);
  };
  const handleContinueClick = (test: any) => setContinueTest(test);
  const handleCloseContinueModal = () => setContinueTest(null);

  const handleGoToOngoingTest = () => {
    console.log("Redirecting to ongoing test:", continueTest);
    window.location.href = `/test/${continueTest.id}`;
    setContinueTest(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1d4d6a] mb-1">Mock Tests & Assessments</h2>
        <p className="text-sm text-gray-500">Test your knowledge and track your progress</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <h3 className="text-[#1d4d6a]">{stat.value}</h3>
                </div>
                <div className={`w-12 h-12 bg-opacity-10 rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tests Tabs */}
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="available">Available Tests</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing ({ongoingTests.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Available Tests */}
        <TabsContent value="available" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableTests.map((test, index) => (
              <Card key={test.id} className="border-none shadow-md hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-[#1d4d6a]">{test.title}</CardTitle>
                    <Badge
                      className={
                        test.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                        test.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }
                    >
                      {test.difficulty}
                    </Badge>
                  </div>
                  <CardDescription>{test.subject}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Target className="w-4 h-4" />
                      <span>{test.questions} Questions</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{test.duration}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    {test.participants.toLocaleString()} students participated
                  </div>

                  {/* FIRST TWO → Upcoming */}
                  {index < 2 && (
                    <div className="w-full bg-gray-100 border border-gray-200 rounded-lg p-3 cursor-default">
                      <div className="text-left leading-tight">
                        <p className="font-semibold text-[#1d4d6a]">Upcoming Test</p>
                        <p className="text-xs text-gray-600">
                          {index === 0
                            ? "25 Nov 2025 — 10:00 AM"
                            : "28 Nov 2025 — 03:00 PM"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* NEXT TWO → Start Test */}
                  {index >= 2 && index < 4 && (
                    <Button
                      onClick={() => handleStartClick(test)}
                      className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white"
                    >
                      Start Test
                    </Button>
                  )}

                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Ongoing Tests */}
        <TabsContent value="ongoing" className="mt-6">
          <div className="space-y-4">
            {ongoingTests.map((test) => (
              <Card key={test.id} className="border-none shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-[#1d4d6a] mb-1">{test.title}</h3>
                      <p className="text-sm text-gray-500">{test.subject}</p>
                    </div>
                    <Badge className={test.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>
                      {test.difficulty}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progress: {test.completed} of {test.questions} questions</span>
                      <span>{Math.round((test.completed / test.questions) * 100)}%</span>
                    </div>

                    <Progress value={(test.completed / test.questions) * 100} className="h-2" />

                    <div className="flex justify-between items-center pt-2">
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Time remaining: {test.duration}</span>
                      </div>

                      <Button
                        className="bg-[#bf2026] hover:bg-[#a01c22] text-white"
                        onClick={() => handleContinueClick(test)}
                      >
                        Continue Test
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Continue Test Modal */}
        <Dialog open={!!continueTest} onOpenChange={handleCloseContinueModal}>
          <DialogContent className="max-w-md">
            {continueTest && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-[#1d4d6a]">
                    Continue {continueTest.title}
                  </DialogTitle>
                  <DialogDescription>
                    You have an ongoing test. Would you like to resume it now?
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 text-sm text-gray-700 mt-2">
                  <p><span className="font-medium">📚 Subject:</span> {continueTest.subject}</p>
                  <p><span className="font-medium">📝 Progress:</span> {continueTest.completed}/{continueTest.questions} questions completed</p>
                  <p><span className="font-medium">🕒 Duration:</span> {continueTest.duration}</p>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    onClick={handleCloseContinueModal}
                    className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={handleGoToOngoingTest}
                    className="bg-[#bf2026] hover:bg-[#a01c22] text-white"
                  >
                    Resume Test
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Completed Tests */}
        <TabsContent value="completed" className="mt-6">
          <div className="space-y-4">
            {completedTests.map((test) => (
              <Card key={test.id} className="border-none shadow-md hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-[#1d4d6a] mb-1">{test.title}</h3>
                          <p className="text-sm text-gray-500">{test.subject} • {new Date(test.date).toLocaleDateString()}</p>
                        </div>

                        <Badge className={
                          test.score >= 90 ? 'bg-green-100 text-green-700' :
                          test.score >= 75 ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }>
                          {test.score >= 90 ? 'Excellent' : test.score >= 75 ? 'Good' : 'Pass'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Score</p>
                          <p className="text-[#1d4d6a]">{test.score}/{test.maxScore}</p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Rank</p>
                          <p className="text-[#1d4d6a] flex items-center gap-1">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            #{test.rank}
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Percentile</p>
                          <p className="text-[#1d4d6a]">{Math.round((1 - test.rank / test.participants) * 100)}th</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Test Modal */}
        <Dialog open={!!selectedTest} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-md">
            {selectedTest && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-[#1d4d6a]">{selectedTest.title}</DialogTitle>
                  <DialogDescription>Review details before starting the test.</DialogDescription>
                </DialogHeader>

                <div className="space-y-3 text-sm text-gray-700 mt-2">
                  <p><span className="font-medium">📚 Subject:</span> {selectedTest.subject}</p>
                  <p><span className="font-medium">🕒 Duration:</span> {selectedTest.duration}</p>
                  <p><span className="font-medium">📝 Questions:</span> {selectedTest.questions}</p>
                  <p><span className="font-medium">⚡ Difficulty:</span> {selectedTest.difficulty}</p>
                  <p><span className="font-medium">👥 Participants:</span> {selectedTest.participants.toLocaleString()}</p>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button onClick={handleCloseModal} className="bg-gray-200 text-gray-700 hover:bg-gray-300">
                    Cancel
                  </Button>

                  <Button
                    onClick={() => { window.open('/test', '_blank', 'noopener,noreferrer'); setSelectedTest(null); }}
                    className="bg-[#bf2026] hover:bg-[#a01c22] text-white"
                  >
                    Start Test
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Leaderboard */}
        <TabsContent value="leaderboard" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Top Performers - This Month</CardTitle>
              <CardDescription>See how you rank against other students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { rank: 1, name: 'Sarah Johnson', score: 98, tests: 25, badge: '🥇' },
                  { rank: 2, name: 'Michael Chen', score: 97, tests: 28, badge: '🥈' },
                  { rank: 3, name: 'Emily Davis', score: 96, tests: 22, badge: '🥉' },
                  { rank: 4, name: 'David Lee', score: 95, tests: 30, badge: '' },
                  { rank: 5, name: 'Alex Rodriguez (You)', score: 94, tests: 18, badge: '', highlight: true },
                  { rank: 6, name: 'Jessica Wang', score: 93, tests: 24, badge: '' },
                  { rank: 7, name: 'Chris Martin', score: 92, tests: 20, badge: '' },
                ].map((user) => (
                  <div
                    key={user.rank}
                    className={`flex items-center justify-between p-4 rounded-lg ${user.highlight
                      ? 'bg-[#bf2026] bg-opacity-10 border-2 border-[#bf2026]'
                      : 'bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${user.highlight ? 'bg-[#bf2026]' : 'bg-[#1d4d6a]'
                        } text-white flex items-center justify-center`}>
                        {user.badge || user.rank}
                      </div>
                      <div>
                        <p className={`${user.highlight ? 'text-[#bf2026]' : 'text-[#1d4d6a]'}`}>
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">{user.tests} tests taken</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`${user.highlight ? 'text-[#bf2026]' : 'text-[#1d4d6a]'}`}>
                        {user.score}%
                      </p>
                      <p className="text-xs text-gray-500">Avg. Score</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
